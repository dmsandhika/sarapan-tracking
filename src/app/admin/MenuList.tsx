"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toggleMenuItemStatus, removeMenuItem, renameMenuItem } from "@/app/actions/admin";
import { PencilIcon, TrashIcon } from "@/components/icons";
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
    <section className="flex flex-col gap-3">
      <h2 className="section-title">Menu hari ini</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="rounded-card border border-border px-3">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          const affected = affectedCounts[item.id] ?? 0;
          const otherAvailableItems = menuItems.filter(
            (m) => m.id !== item.id && m.status === "AVAILABLE"
          );

          return (
            <div
              key={item.id}
              className="flex flex-col gap-2 border-b border-border px-1 py-3 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                {renamingId === item.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="field-input min-h-9 flex-1 rounded-control text-sm"
                  />
                ) : (
                  <span className={isHabis ? "text-muted line-through" : "text-sm"}>{item.name}</span>
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
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-sm text-muted"
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
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          isHabis ? "text-muted" : "text-danger"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isHabis ? "bg-muted" : "bg-danger"}`}
                        />
                        {isHabis ? "Tandai tersedia" : "Tandai habis"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => startRename(item)}
                        aria-label="Edit nama menu"
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRemove(item.id)}
                        aria-label="Hapus menu"
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {substitutingId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 rounded-card border border-warning/30 p-3">
                      <p className="text-sm text-warning">
                        {affected} pesanan pakai menu ini. Ganti semua ke menu lain sekaligus?
                      </p>
                      <select
                        value={replacementChoice}
                        onChange={(e) => setReplacementChoice(e.target.value)}
                        className="field-input min-h-9 rounded-control text-sm"
                      >
                        <option value="">Pilih menu pengganti...</option>
                        {otherAvailableItems.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isPending || !replacementChoice}
                        onClick={() => confirmSubstitute(item.id, replacementChoice)}
                        className="btn-primary w-full"
                      >
                        Ganti semua &amp; tandai habis
                      </button>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => confirmSubstitute(item.id)}
                          className="text-sm text-muted underline"
                        >
                          Tandai habis tanpa ganti
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubstitutingId(null)}
                          className="text-sm text-muted"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
