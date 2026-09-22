"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  getOrderHistory,
  listSubstituteOptions,
  customerSubstituteOrderItem,
  type CustomerOrderHistory,
} from "@/app/actions/customer";
import { formatRupiah } from "@/lib/currency";
import { formatDateHuman, todayJakarta } from "@/lib/date";

const PROFILE_KEY = "sarapan-tracking:profile";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

function SubstitutePicker({
  orderItemId,
  waNumber,
  onSubstituted,
}: {
  orderItemId: string;
  waNumber: string;
  onSubstituted: () => void;
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listSubstituteOptions(orderItemId).then((opts) => {
      if (!cancelled) setOptions(opts);
    });
    return () => {
      cancelled = true;
    };
  }, [orderItemId]);

  function handleChange(newMenuItemId: string) {
    if (!newMenuItemId) return;
    setError(null);
    startTransition(async () => {
      const result = await customerSubstituteOrderItem(waNumber, orderItemId, newMenuItemId);
      if (result.error) {
        setError(result.error);
      } else {
        onSubstituted();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Lagi habis
      </span>
      {options && options.length > 0 && (
        <select
          disabled={isPending}
          defaultValue=""
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-control border border-warning/30 bg-card px-2 py-1 text-xs text-warning"
        >
          <option value="" disabled>
            Pilih pengganti...
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

function OrderCard({
  order,
  waNumber,
  onSubstituted,
}: {
  order: CustomerOrderHistory["orders"][number];
  waNumber: string;
  onSubstituted: () => void;
}) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {order.nomorUrut}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{order.sessionTitle}</p>
            <p className="text-xs text-muted">{formatDateHuman(order.date)}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            order.paid ? "text-success" : "text-muted"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${order.paid ? "bg-success" : "bg-muted"}`} />
          {order.paid ? "Lunas" : "Belum bayar"}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-2 text-sm">
        {order.items.map((orderItem) => (
          <div key={orderItem.id} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {orderItem.qty}x {orderItem.name}
              </span>
              {orderItem.originalName && (
                <span className="text-xs text-warning">diganti dari {orderItem.originalName}</span>
              )}
              {orderItem.note && <span className="text-xs text-muted">({orderItem.note})</span>}
            </div>
            {orderItem.needsSubstitution && (
              <SubstitutePicker orderItemId={orderItem.id} waNumber={waNumber} onSubstituted={onSubstituted} />
            )}
          </div>
        ))}
      </div>

      {order.billAmount != null && (
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
          <span>Tagihan</span>
          <span className="tabular-nums">{formatRupiah(order.billAmount)}</span>
        </div>
      )}
    </div>
  );
}

export default function StatusLookup() {
  const [waNumber, setWaNumber] = useState("");
  const [result, setResult] = useState<CustomerOrderHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  function search(value: string) {
    if (value.trim().length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await getOrderHistory(value.trim());
      setHasSearched(true);
      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
      }
    });
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const profile = JSON.parse(saved) as { waNumber?: string };
        if (profile.waNumber) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage on mount
          setWaNumber(profile.waNumber);
          search(profile.waNumber);
        }
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const today = todayJakarta();
  const todayOrders = result?.orders.filter((o) => o.date === today) ?? [];
  const historyOrders = result?.orders.filter((o) => o.date !== today) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(waNumber);
        }}
        className="flex gap-2"
      >
        <input
          value={waNumber}
          onChange={(e) => setWaNumber(e.target.value)}
          placeholder="Nomor WA"
          inputMode="tel"
          className="field-input flex-1"
        />
        <button type="submit" disabled={isPending} className="btn-primary px-4">
          {isPending ? "Cari..." : "Cek"}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="section-title">Statistik kamu</h2>
            <motion.div variants={container} className="grid grid-cols-2 gap-3">
              <motion.div variants={item} className="card">
                <p className="text-xs text-muted">Total pesan</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{result.stats.totalOrders}x</p>
              </motion.div>
              <motion.div variants={item} className="card">
                <p className="text-xs text-muted">Bulan ini</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{result.stats.ordersThisMonth}x</p>
              </motion.div>
              <motion.div variants={item} className="card">
                <p className="text-xs text-muted">Total pengeluaran</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(result.stats.totalSpent)}</p>
              </motion.div>
              <motion.div variants={item} className="card">
                <p className="text-xs text-muted">Favorit kamu</p>
                <p className="mt-1 truncate text-lg font-bold">{result.stats.favoriteItem ?? "-"}</p>
              </motion.div>
            </motion.div>
          </section>

          {result.stats.unpaidCount > 0 ? (
            <motion.div
              variants={item}
              className="flex items-center justify-between rounded-card bg-danger-soft px-4 py-3.5"
            >
              <div>
                <p className="text-xs font-semibold text-danger">Kamu belum bayar</p>
                <p className="text-xs text-danger/80">{result.stats.unpaidCount} pesanan</p>
              </div>
              <p className="text-base font-bold tabular-nums text-danger">
                {formatRupiah(result.stats.unpaidTotal)}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={item}
              className="rounded-card bg-success-soft px-4 py-3.5 text-sm font-semibold text-success"
            >
              Mantap, semua pesanan kamu udah lunas!
            </motion.div>
          )}

          <motion.section variants={item} className="flex flex-col gap-3">
            <h2 className="section-title">Hari ini</h2>
            {todayOrders.length === 0 ? (
              <p className="card text-sm text-muted">Belum ada pesanan hari ini.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {todayOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    waNumber={waNumber}
                    onSubstituted={() => search(waNumber)}
                  />
                ))}
              </div>
            )}
          </motion.section>

          {historyOrders.length > 0 && (
            <motion.section variants={item} className="flex flex-col gap-3">
              <h2 className="section-title">Riwayat</h2>
              <div className="flex flex-col gap-4">
                {historyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    waNumber={waNumber}
                    onSubstituted={() => search(waNumber)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      )}

      {!result && !error && hasSearched === false && !isPending && (
        <p className="text-sm text-muted">Masukkan nomor WA yang dipakai saat pesan sarapan.</p>
      )}
    </div>
  );
}
