"use client";

import { useTransition } from "react";
import { closeDayOrdering, reopenDayOrdering } from "@/app/actions/admin";
import MenuList from "./MenuList";
import AddMenuItemsForm from "./AddMenuItemsForm";
import OrdersList from "./OrdersList";
import BillUploadForm from "./BillUploadForm";
import DaySummary from "./DaySummary";
import SendToWhatsAppButton from "./SendToWhatsAppButton";
import type { DayWithRelations } from "./types";

export default function DayDashboard({ day }: { day: DayWithRelations }) {
  const [isPending, startTransition] = useTransition();

  const isOpen = day.status === "PUBLISHED";

  const affectedCounts: Record<string, number> = {};
  for (const order of day.orders) {
    for (const item of order.items) {
      affectedCounts[item.menuItemId] = (affectedCounts[item.menuItemId] ?? 0) + 1;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge ${isOpen ? "bg-success-soft text-success" : "bg-black/5 text-muted"}`}>
            {isOpen ? "Dibuka" : "Ditutup"}
          </span>
          <p className="text-sm text-muted">pemesanan hari ini</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isOpen ? closeDayOrdering(day.id) : reopenDayOrdering(day.id)))
          }
          className="btn-secondary min-h-9 px-3 text-sm"
        >
          {isOpen ? "Tutup pemesanan" : "Buka lagi"}
        </button>
      </div>

      <MenuList menuItems={day.menuItems} affectedCounts={affectedCounts} />

      <AddMenuItemsForm dayId={day.id} />

      <BillUploadForm dayId={day.id} />

      <SendToWhatsAppButton dayId={day.id} />

      <OrdersList orders={day.orders} menuItems={day.menuItems} />

      <DaySummary orders={day.orders} />
    </div>
  );
}
