"use client";

import { useTransition } from "react";
import { toggleMenuItemStatus } from "@/app/actions/admin";
import type { MenuItemRow } from "./types";

export default function MenuList({ menuItems }: { menuItems: MenuItemRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-black/70">Menu hari ini</h2>
      <div className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          return (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <span className={isHabis ? "text-black/40 line-through" : ""}>{item.name}</span>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
