"use client";

import { useState, useTransition } from "react";
import { toggleMenuItemStatus, removeMenuItem } from "@/app/actions/admin";
import type { MenuItemRow } from "./types";

export default function MenuList({ menuItems }: { menuItems: MenuItemRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove(menuItemId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeMenuItem(menuItemId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-black/70">Menu hari ini</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className={isHabis ? "text-black/40 line-through" : ""}>{item.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => toggleMenuItemStatus(item.id))}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isHabis ? "bg-black/10 text-black/60" : "bg-red-50 text-red-600"
                  }`}
                >
                  {isHabis ? "Tandai tersedia" : "Tandai habis"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-black/40"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
