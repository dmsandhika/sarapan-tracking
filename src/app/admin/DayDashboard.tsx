"use client";

import { useTransition } from "react";
import { closeDayOrdering, reopenDayOrdering } from "@/app/actions/admin";
import MenuList from "./MenuList";
import AddMenuItemsForm from "./AddMenuItemsForm";
import OrdersList, { formatRupiah } from "./OrdersList";
import BillUploadForm from "./BillUploadForm";
import type { DayWithRelations } from "./types";

export default function DayDashboard({ day }: { day: DayWithRelations }) {
  const [isPending, startTransition] = useTransition();

  const totalBilled = day.orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0);
  const totalCollected = day.orders.reduce((sum, o) => sum + (o.paid ? o.billAmount ?? 0 : 0), 0);
  const unpaidOrders = day.orders.filter((o) => !o.paid);
  const isOpen = day.status === "PUBLISHED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-black/10 p-3">
        <div className="text-sm">
          <p className="text-black/50">Status pemesanan</p>
          <p className="font-medium">{isOpen ? "Dibuka" : "Ditutup"}</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isOpen ? closeDayOrdering(day.id) : reopenDayOrdering(day.id)))
          }
          className="rounded-lg border border-black/20 px-3 py-1.5 text-sm"
        >
          {isOpen ? "Tutup pemesanan" : "Buka lagi"}
        </button>
      </div>

      <MenuList menuItems={day.menuItems} />

      <AddMenuItemsForm dayId={day.id} />

      <BillUploadForm dayId={day.id} />

      <OrdersList orders={day.orders} menuItems={day.menuItems} />

      <section className="rounded-lg border border-black/10 p-3 text-sm">
        <h2 className="mb-2 font-medium text-black/70">Rekap</h2>
        <div className="flex justify-between">
          <span>Total tagihan</span>
          <span>{formatRupiah(totalBilled)}</span>
        </div>
        <div className="flex justify-between">
          <span>Sudah terkumpul</span>
          <span>{formatRupiah(totalCollected)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Belum terkumpul</span>
          <span>{formatRupiah(totalBilled - totalCollected)}</span>
        </div>
        {unpaidOrders.length > 0 && (
          <div className="mt-3">
            <p className="text-black/50">Belum bayar:</p>
            <ul className="list-disc pl-5">
              {unpaidOrders.map((o) => (
                <li key={o.id}>
                  #{o.nomorUrut} {o.name}
                  {o.billAmount != null ? ` — ${formatRupiah(o.billAmount)}` : " (harga belum ada)"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
