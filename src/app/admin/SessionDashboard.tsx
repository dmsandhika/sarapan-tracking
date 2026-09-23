"use client";

import { useState, useTransition } from "react";
import { closeSessionOrdering, reopenSessionOrdering, deleteSession } from "@/app/actions/sessions";
import MenuList from "./MenuList";
import SuggestionMenuList from "./SuggestionMenuList";
import AddMenuItemsForm from "./AddMenuItemsForm";
import OrdersList from "./OrdersList";
import BillUploadForm from "./BillUploadForm";
import DaySummary from "./DaySummary";
import SendToWhatsAppButton from "./SendToWhatsAppButton";
import CopyLinkButton from "./CopyLinkButton";
import type { SessionWithRelations } from "./types";

export default function SessionDashboard({ session }: { session: SessionWithRelations }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOpen = session.status === "PUBLISHED";
  const isMenuMode = session.mode === "MENU";

  const affectedCounts: Record<string, number> = {};
  for (const order of session.orders) {
    for (const item of order.items) {
      if (!item.menuItemId) continue;
      affectedCounts[item.menuItemId] = (affectedCounts[item.menuItemId] ?? 0) + 1;
    }
  }

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteSession(session.id);
      if (result?.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CopyLinkButton publicCode={session.publicCode} />

      <div className="card flex items-center justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isOpen ? "text-success" : "text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-success" : "bg-muted"}`} />
            {isOpen ? "Dibuka" : "Ditutup"}
          </span>
          <p className="text-xs text-muted">pemesanan sesi ini</p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              isOpen ? closeSessionOrdering(session.id) : reopenSessionOrdering(session.id)
            )
          }
          className="btn-secondary min-h-9 shrink-0 whitespace-nowrap px-3 text-sm"
        >
          {isOpen ? "Tutup pemesanan" : "Buka lagi"}
        </button>
      </div>

      {isMenuMode ? (
        <MenuList menuItems={session.menuItems} affectedCounts={affectedCounts} />
      ) : (
        <SuggestionMenuList menuItems={session.menuItems} />
      )}
      <AddMenuItemsForm sessionId={session.id} />

      <BillUploadForm sessionId={session.id} />

      <SendToWhatsAppButton sessionId={session.id} vendorWaNumber={session.vendorWaNumber} />

      <OrdersList orders={session.orders} menuItems={session.menuItems} allowSubstitution={isMenuMode} />

      <DaySummary orders={session.orders} />

      {session.orders.length === 0 && (
        <div className="card flex flex-col gap-2">
          {!confirmingDelete ? (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="self-start text-sm text-danger">
              Hapus sesi ini
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-danger">
                Yakin hapus sesi &quot;{session.title}&quot;? Tidak bisa dibatalkan.
              </p>
              {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="text-sm font-semibold text-danger underline underline-offset-2"
                >
                  Ya, hapus
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="text-sm text-muted">
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
