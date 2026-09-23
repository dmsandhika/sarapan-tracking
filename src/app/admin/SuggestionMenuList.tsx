"use client";

import { useState, useTransition } from "react";
import { removeMenuItem, renameMenuItem } from "@/app/actions/admin";
import { PencilIcon, TrashIcon } from "@/components/icons";
import type { MenuItemRow } from "./types";

export default function SuggestionMenuList({ menuItems }: { menuItems: MenuItemRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function handleRemove(menuItemId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeMenuItem(menuItemId);
      if (result.error) setError(result.error);
    });
  }

  function startRename(item: MenuItemRow) {
    setError(null);
    setRenamingId(item.id);
    setRenameValue(item.name);
  }

  function saveRename() {
    if (!renamingId) return;
    const id = renamingId;
    startTransition(async () => {
      const result = await renameMenuItem(id, renameValue);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRenamingId(null);
    });
  }

  if (menuItems.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title">Saran menu buat customer</h2>
      <p className="text-xs text-muted">
        Ditampilin sebagai shortcut di form pesan — customer tetep bisa ketik bebas.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="rounded-card border border-border px-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 border-b border-border px-1 py-3 last:border-b-0"
          >
            {renamingId === item.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="field-input min-h-9 flex-1 rounded-control text-sm"
              />
            ) : (
              <span className="text-sm">{item.name}</span>
            )}

            <div className="flex shrink-0 items-center gap-3">
              {renamingId === item.id ? (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={saveRename}
                    className="text-sm font-medium text-primary"
                  >
                    Simpan
                  </button>
                  <button type="button" onClick={() => setRenamingId(null)} className="text-sm text-muted">
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startRename(item)}
                    aria-label="Edit nama"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemove(item.id)}
                    aria-label="Hapus"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
                  >
                    <TrashIcon />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
