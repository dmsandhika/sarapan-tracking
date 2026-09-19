"use client";

import { useState, useTransition } from "react";
import { substituteOrderItem, toggleOrderPaid, setOrderBillAmount, deleteOrder } from "@/app/actions/admin";
import type { MenuItemRow, OrderWithItems } from "./types";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

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
  const isHabis = item.menuItem.status === "HABIS";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>
        {item.qty}x {item.menuItem.name}
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
          className="rounded-lg border border-warning/30 bg-warning-soft px-2 py-1 text-xs text-warning"
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
      className="field-input min-h-9 w-28 text-right text-sm"
    />
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
      <section className="flex flex-col gap-2">
        <h2 className="section-title">Pesanan</h2>
        <p className="card text-sm text-muted">Belum ada pesanan masuk.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">Pesanan ({orders.length})</h2>
      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <div key={order.id} className="card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {order.nomorUrut}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{order.name}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingId(order.id)}
                aria-label="Hapus pesanan"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted active:bg-danger-soft active:text-danger"
              >
                <TrashIcon />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <BillAmountCell order={order} />
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => toggleOrderPaid(order.id))}
                className={`badge ${order.paid ? "bg-success-soft text-success" : "bg-black/5 text-muted"}`}
              >
                {order.paid ? "Lunas" : "Belum bayar"}
              </button>
            </div>

            {confirmingId === order.id && (
              <div className="flex flex-col gap-2 rounded-xl bg-danger-soft p-3">
                <p className="text-xs text-danger">
                  Yakin hapus pesanan #{order.nomorUrut} {order.name}? Tidak bisa dibatalkan.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => confirmDelete(order.id)}
                    className="text-xs font-semibold text-danger underline underline-offset-2"
                  >
                    Ya, hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="text-xs text-muted"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 border-t border-border pt-2 pl-1">
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
