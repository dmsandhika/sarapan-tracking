"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { substituteOrderItem, toggleOrderPaid, setOrderBillAmount, deleteOrder } from "@/app/actions/admin";
import { TrashIcon } from "@/components/icons";
import { orderItemLabel } from "@/lib/orderItem";
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
