"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  substituteOrderItem,
  toggleOrderPaid,
  setOrderBillAmount,
  deleteOrder,
  getPaymentProofUrl,
  getPaymentProofOcr,
} from "@/app/actions/admin";
import type { PaymentProofOcrResult } from "@/lib/paymentProofOcr";
import { TrashIcon, XIcon } from "@/components/icons";
import { orderItemLabel } from "@/lib/orderItem";
import { formatRupiah } from "@/lib/currency";
import type { MenuItemRow, OrderWithItems } from "./types";

function OrderItemRow({
  item,
  availableMenuItems,
  allowSubstitution,
}: {
  item: OrderWithItems["items"][number];
  availableMenuItems: MenuItemRow[];
  allowSubstitution: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isHabis = item.menuItem?.status === "HABIS";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>
        {item.qty}x {orderItemLabel(item)}
      </span>
      {item.note && <span className="text-muted">({item.note})</span>}
      {item.originalMenuItem && (
        <span className="text-xs text-warning">diganti dari {item.originalMenuItem.name}</span>
      )}
      {isHabis && allowSubstitution && (
        <select
          disabled={isPending}
          defaultValue=""
          onChange={(e) => {
            const newId = e.target.value;
            if (!newId) return;
            startTransition(() => substituteOrderItem(item.id, newId));
          }}
          className="rounded-control border border-warning/30 bg-card px-2 py-1 text-xs text-warning"
        >
          <option value="" disabled>
            Habis, ganti ke...
          </option>
          {availableMenuItems.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function BillAmountCell({ order }: { order: OrderWithItems }) {
  const [value, setValue] = useState(order.billAmount?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    const amount = value.trim() === "" ? null : Number(value);
    if (amount !== null && Number.isNaN(amount)) return;
    startTransition(() => setOrderBillAmount(order.id, amount));
  }

  return (
    <input
      type="number"
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      placeholder="Rp"
      className="field-input min-h-9 w-28 rounded-control text-right text-sm tabular-nums"
    />
  );
}

function OcrBadge({
  ocrResult,
  isOcrPending,
  billAmount,
}: {
  ocrResult: PaymentProofOcrResult | null;
  isOcrPending: boolean;
  billAmount: number | null;
}) {
  const [showRaw, setShowRaw] = useState(false);

  if (isOcrPending) {
    return <span className="text-xs text-muted">Menganalisa OCR...</span>;
  }
  if (!ocrResult || ocrResult.status === "no-proof") return null;

  function rawTextToggle(rawTextPreview: string) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="self-start text-[11px] text-muted underline underline-offset-2"
        >
          {showRaw ? "Sembunyikan teks OCR" : "Lihat teks OCR mentah"}
        </button>
        {showRaw && (
          <p className="rounded-control bg-background px-2 py-1.5 text-[11px] text-muted">{rawTextPreview}</p>
        )}
      </div>
    );
  }

  switch (ocrResult.status) {
    case "engine-error":
      return <span className="text-xs text-warning">OCR gagal jalan, cek manual</span>;
    case "unrecognized":
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Format gak dikenali, cek manual</span>
          {rawTextToggle(ocrResult.rawTextPreview)}
        </div>
      );
    case "ambiguous":
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-warning">
            Kebaca beberapa format ({ocrResult.matchedProviders.join(", ")}), cek manual
          </span>
          {rawTextToggle(ocrResult.rawTextPreview)}
        </div>
      );
    case "amount-unreadable":
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">
            Kebaca {ocrResult.provider} tapi nominal gak kebaca, cek manual
          </span>
          {rawTextToggle(ocrResult.rawTextPreview)}
        </div>
      );
    case "read": {
      if (billAmount == null) {
        return (
          <span className="text-xs text-muted">
            OCR: {formatRupiah(ocrResult.ocrAmount)} ({ocrResult.provider}) — tagihan belum diisi
          </span>
        );
      }
      if (ocrResult.ocrAmount === billAmount) {
        return (
          <span className="text-xs text-success">
            OCR: {formatRupiah(ocrResult.ocrAmount)} ({ocrResult.provider}) — cocok
          </span>
        );
      }
      return (
        <span className="text-xs text-danger">
          OCR: {formatRupiah(ocrResult.ocrAmount)} ({ocrResult.provider}) — beda dari tagihan{" "}
          {formatRupiah(billAmount)}
        </span>
      );
    }
  }
}

function PaymentProofButton({ orderId, billAmount }: { orderId: string; billAmount: number | null }) {
  const [isPending, startTransition] = useTransition();
  const [isOcrPending, startOcrTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<PaymentProofOcrResult | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);

  function handleClick() {
    if (isPending || previewUrl) return;
    setError(null);
    setOcrResult(null);
    activeOrderIdRef.current = orderId;
    startTransition(async () => {
      const result = await getPaymentProofUrl(orderId);
      if (activeOrderIdRef.current !== orderId) return;
      if (!result) {
        setError("Bukti tidak ditemukan.");
        return;
      }
      setPreviewUrl(result.url);
      startOcrTransition(async () => {
        try {
          const ocr = await getPaymentProofOcr(result.path);
          if (activeOrderIdRef.current !== orderId) return;
          setOcrResult(ocr);
        } catch (e) {
          console.error("getPaymentProofOcr call failed:", e);
          if (activeOrderIdRef.current !== orderId) return;
          setOcrResult({ status: "engine-error" });
        }
      });
    });
  }

  function handleClose() {
    activeOrderIdRef.current = null;
    setPreviewUrl(null);
    setOcrResult(null);
    setError(null);
  }

  useEffect(() => {
    if (!previewUrl) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewUrl]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="self-start text-xs font-medium text-primary"
      >
        {isPending ? "Membuka..." : "Lihat bukti bayar"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-full max-w-full flex-col items-center gap-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic signed URL, not a local/optimizable asset */}
              <img
                src={previewUrl}
                alt="Bukti bayar"
                className="max-h-[65vh] max-w-full rounded-card object-contain"
              />
              <div className="max-w-full rounded-card bg-card px-3 py-2">
                <OcrBadge ocrResult={ocrResult} isOcrPending={isOcrPending} billAmount={billAmount} />
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground"
              >
                <XIcon />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaidToggle({ order, disabled, onToggle }: { order: OrderWithItems; disabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-medium ${
        order.paid ? "text-success" : "text-muted"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${order.paid ? "bg-success" : "bg-muted"}`} />
      {order.paid ? "Lunas" : "Belum bayar"}
    </button>
  );
}

export default function OrdersList({
  orders,
  menuItems,
  allowSubstitution = true,
}: {
  orders: OrderWithItems[];
  menuItems: MenuItemRow[];
  allowSubstitution?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const availableMenuItems = menuItems.filter((m) => m.status === "AVAILABLE");

  function confirmDelete(orderId: string) {
    startTransition(() => deleteOrder(orderId));
    setConfirmingId(null);
  }

  if (orders.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="section-title">Pesanan</h2>
        <p className="card text-sm text-muted">Belum ada pesanan masuk.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title">Pesanan ({orders.length})</h2>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold tabular-nums text-primary">
                {order.nomorUrut}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{order.name}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingId(order.id)}
                aria-label="Hapus pesanan"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-danger"
              >
                <TrashIcon />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <BillAmountCell key={order.billAmount} order={order} />
              <PaidToggle
                order={order}
                disabled={isPending}
                onToggle={() => startTransition(() => toggleOrderPaid(order.id))}
              />
            </div>

            {order.paymentProofPath && (
              <PaymentProofButton orderId={order.id} billAmount={order.billAmount} />
            )}

            <AnimatePresence>
              {confirmingId === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2 rounded-card border border-danger/30 p-3">
                    <p className="text-sm text-danger">
                      Yakin hapus pesanan #{order.nomorUrut} {order.name}? Tidak bisa dibatalkan.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => confirmDelete(order.id)}
                        className="text-sm font-semibold text-danger underline underline-offset-2"
                      >
                        Ya, hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-sm text-muted"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2 border-t border-border pt-2 pl-1">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  availableMenuItems={availableMenuItems}
                  allowSubstitution={allowSubstitution}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
