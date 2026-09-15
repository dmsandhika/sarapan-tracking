"use client";

import { useState, useTransition } from "react";
import { substituteOrderItem, toggleOrderPaid, setOrderBillAmount } from "@/app/actions/admin";
import type { MenuItemRow, OrderWithItems } from "./types";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    amount
  );
}

function OrderItemRow({
  item,
  availableMenuItems,
}: {
  item: OrderWithItems["items"][number];
  availableMenuItems: MenuItemRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const isHabis = item.menuItem.status === "HABIS";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>
        {item.qty}x {item.menuItem.name}
      </span>
      {item.note && <span className="text-black/50">({item.note})</span>}
      {item.originalMenuItem && (
        <span className="text-xs text-amber-600">diganti dari {item.originalMenuItem.name}</span>
      )}
      {isHabis && (
        <select
          disabled={isPending}
          defaultValue=""
          onChange={(e) => {
            const newId = e.target.value;
            if (!newId) return;
            startTransition(() => substituteOrderItem(item.id, newId));
          }}
          className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700"
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
      placeholder="Belum ada"
      className="w-24 rounded-md border border-black/10 px-2 py-1 text-right text-sm"
    />
  );
}

export default function OrdersList({
  orders,
  menuItems,
}: {
  orders: OrderWithItems[];
  menuItems: MenuItemRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const availableMenuItems = menuItems.filter((m) => m.status === "AVAILABLE");

  if (orders.length === 0) {
    return <p className="text-sm text-black/50">Belum ada pesanan masuk.</p>;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-black/70">Pesanan ({orders.length})</h2>
      <div className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-col gap-2 px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs font-semibold">
                  {order.nomorUrut}
                </span>
                <span className="font-medium">{order.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <BillAmountCell order={order} />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => toggleOrderPaid(order.id))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.paid ? "bg-green-100 text-green-700" : "bg-black/10 text-black/60"
                  }`}
                >
                  {order.paid ? "Sudah bayar" : "Belum bayar"}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 pl-8">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} availableMenuItems={availableMenuItems} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export { formatRupiah };
