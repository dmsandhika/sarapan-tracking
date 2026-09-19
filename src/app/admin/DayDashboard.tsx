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
    <div className="flex flex-col gap-6">
      <div className="card flex items-center justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isOpen ? "text-success" : "text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-success" : "bg-muted"}`} />
            {isOpen ? "Dibuka" : "Ditutup"}
          </span>
          <p className="text-xs text-muted">pemesanan hari ini</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isOpen ? closeDayOrdering(day.id) : reopenDayOrdering(day.id)))
          }
          className="btn-secondary min-h-9 shrink-0 whitespace-nowrap px-3 text-sm"
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
