"use client";

import { useState, useTransition } from "react";
import { toggleMenuItemStatus, removeMenuItem, renameMenuItem } from "@/app/actions/admin";
import type { MenuItemRow } from "./types";

export default function MenuList({
  menuItems,
  affectedCounts,
}: {
  menuItems: MenuItemRow[];
  affectedCounts: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [replacementChoice, setReplacementChoice] = useState("");

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

  function markHabis(item: MenuItemRow) {
    const affected = affectedCounts[item.id] ?? 0;
    if (affected > 0) {
      setSubstitutingId(item.id);
      setReplacementChoice("");
      return;
    }
    startTransition(() => toggleMenuItemStatus(item.id));
  }

  function confirmSubstitute(menuItemId: string, replacementId?: string) {
    startTransition(() => toggleMenuItemStatus(menuItemId, replacementId));
    setSubstitutingId(null);
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">Menu hari ini</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="card flex flex-col divide-y divide-border p-0">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          const affected = affectedCounts[item.id] ?? 0;
          const otherAvailableItems = menuItems.filter(
            (m) => m.id !== item.id && m.status === "AVAILABLE"
          );

          return (
            <div key={item.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                {renamingId === item.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="field-input min-h-9 flex-1 text-sm"
                  />
                ) : (
                  <span className={isHabis ? "text-muted line-through" : "text-[15px]"}>
                    {item.name}
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-2">
                  {renamingId === item.id ? (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={saveRename}
                        className="text-xs font-medium text-primary"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-xs text-muted"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => markHabis(item)}
                        className={`badge ${isHabis ? "bg-black/5 text-muted" : "bg-danger-soft text-danger"}`}
                      >
                        {isHabis ? "Tandai tersedia" : "Tandai habis"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => startRename(item)}
                        className="text-xs text-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRemove(item.id)}
                        className="text-xs text-muted"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              </div>

              {substitutingId === item.id && (
                <div className="flex flex-col gap-2 rounded-xl bg-warning-soft p-3">
                  <p className="text-xs text-warning">
                    {affected} pesanan pakai menu ini. Ganti semua ke menu lain sekaligus?
                  </p>
                  <select
                    value={replacementChoice}
                    onChange={(e) => setReplacementChoice(e.target.value)}
                    className="field-input min-h-9 text-sm"
                  >
                    <option value="">Pilih menu pengganti...</option>
                    {otherAvailableItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isPending || !replacementChoice}
                      onClick={() => confirmSubstitute(item.id, replacementChoice)}
                      className="btn-primary min-h-9 px-3 text-sm"
                    >
                      Ganti semua &amp; tandai habis
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => confirmSubstitute(item.id)}
                      className="text-xs text-muted underline"
                    >
                      Tandai habis tanpa ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubstitutingId(null)}
                      className="text-xs text-muted"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
