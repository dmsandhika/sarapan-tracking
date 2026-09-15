"use client";

import { useState, useTransition } from "react";
import { submitOrder } from "@/app/actions/orders";

type MenuItem = { id: string; name: string; status: string };
type Selection = { checked: boolean; qty: number; note: string };

export default function OrderForm({ dayId, menuItems }: { dayId: string; menuItems: MenuItem[] }) {
  const [name, setName] = useState("");
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [error, setError] = useState<string | null>(null);
  const [nomorUrut, setNomorUrut] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(menuItemId: string) {
    setSelections((prev) => {
      const current = prev[menuItemId];
      return {
        ...prev,
        [menuItemId]: current
          ? { ...current, checked: !current.checked }
          : { checked: true, qty: 1, note: "" },
      };
    });
  }

  function setQty(menuItemId: string, qty: number) {
    setSelections((prev) => ({
      ...prev,
      [menuItemId]: { ...(prev[menuItemId] ?? { checked: true, note: "" }), checked: true, qty },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = Object.entries(selections)
      .filter(([, s]) => s.checked)
      .map(([menuItemId, s]) => ({ menuItemId, qty: s.qty, note: s.note || undefined }));

    if (name.trim().length === 0) {
      setError("Isi nama dulu ya.");
      return;
    }
    if (items.length === 0) {
      setError("Pilih minimal 1 menu.");
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({ dayId, name: name.trim(), items });
      if ("error" in result) {
        setError(result.error);
      } else {
        setNomorUrut(result.nomorUrut);
      }
    });
  }

  if (nomorUrut !== null) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm text-black/60">Pesanan terkirim!</p>
        <p className="text-3xl font-bold text-green-700">#{nomorUrut}</p>
        <p className="text-sm text-black/60">Nomor urut kamu, {name}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kamu"
        required
        className="rounded-lg border border-black/10 px-3 py-2"
      />

      <div className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          const selection = selections[item.id];
          return (
            <label
              key={item.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 ${
                isHabis ? "opacity-40" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={isHabis}
                  checked={selection?.checked ?? false}
                  onChange={() => toggle(item.id)}
                />
                {item.name}
                {isHabis && <span className="text-xs text-red-600">(habis)</span>}
              </span>
              {selection?.checked && !isHabis && (
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={selection.qty}
                  onChange={(e) => setQty(item.id, Number(e.target.value))}
                  className="w-16 rounded-md border border-black/10 px-2 py-1 text-right text-sm"
                />
              )}
            </label>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isPending ? "Mengirim..." : "Kirim Pesanan"}
      </button>
    </form>
  );
}
