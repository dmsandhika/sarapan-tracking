"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { submitOrder } from "@/app/actions/orders";
import { ChevronRightIcon } from "@/components/icons";

type MenuItem = { id: string; name: string; status: string };
type Selection = { checked: boolean; qty: number; note: string };

const PROFILE_KEY = "sarapan-tracking:profile";

export default function OrderForm({ dayId, menuItems }: { dayId: string; menuItems: MenuItem[] }) {
  const [name, setName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [error, setError] = useState<string | null>(null);
  const [nomorUrut, setNomorUrut] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const profile = JSON.parse(saved) as { name?: string; waNumber?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage on mount
        if (profile.name) setName(profile.name);
        if (profile.waNumber) setWaNumber(profile.waNumber);
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

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
    if (qty < 1) return;
    setSelections((prev) => ({
      ...prev,
      [menuItemId]: { ...(prev[menuItemId] ?? { checked: true, note: "" }), checked: true, qty },
    }));
  }

  function setNote(menuItemId: string, note: string) {
    setSelections((prev) => ({
      ...prev,
      [menuItemId]: { ...(prev[menuItemId] ?? { checked: true, qty: 1 }), checked: true, note },
    }));
  }

  const totalItems = Object.values(selections)
    .filter((s) => s.checked)
    .reduce((sum, s) => sum + s.qty, 0);

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
    if (waNumber.trim().length === 0) {
      setError("Isi nomor WA dulu ya.");
      return;
    }
    if (items.length === 0) {
      setError("Pilih minimal 1 menu.");
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({ dayId, name: name.trim(), waNumber: waNumber.trim(), items });
      if ("error" in result) {
        setError(result.error);
      } else {
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name.trim(), waNumber: waNumber.trim() }));
        } catch {
          // ignore unavailable storage
        }
        setNomorUrut(result.nomorUrut);
      }
    });
  }

  if (nomorUrut !== null) {
    return (
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl">
          ✅
        </span>
        <p className="text-sm text-muted">Pesanan terkirim!</p>
        <p className="text-4xl font-bold tabular-nums text-success">#{nomorUrut}</p>
        <p className="text-sm text-muted">Nomor urut kamu, {name}</p>
        <Link
          href="/status"
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
        >
          Lihat status pesanan
          <ChevronRightIcon />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-28">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kamu"
        required
        className="field-input"
      />
      <input
        value={waNumber}
        onChange={(e) => setWaNumber(e.target.value)}
        placeholder="Nomor WA (untuk cek status pesanan)"
        inputMode="tel"
        required
        className="field-input"
      />

      <div className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isHabis = item.status === "HABIS";
          const selection = selections[item.id];
          const isChecked = selection?.checked ?? false;
          return (
            <div
              key={item.id}
              className={`card flex flex-col gap-2 ${
                isHabis ? "opacity-50" : isChecked ? "border-primary/40 ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isHabis}
                  onClick={() => toggle(item.id)}
                  className="flex flex-1 items-center gap-3 text-left disabled:pointer-events-none"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-control border text-xs ${
                      isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                  <span className="text-sm">
                    {item.name}
                    {isHabis && <span className="ml-2 text-xs text-danger">(habis)</span>}
                  </span>
                </button>

                {isChecked && !isHabis && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, selection.qty - 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-control border border-border text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">{selection.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, selection.qty + 1)}
                      className="flex h-11 w-11 items-center justify-center rounded-control border border-border text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {isChecked && !isHabis && (
                <input
                  value={selection.note}
                  onChange={(e) => setNote(item.id, e.target.value)}
                  placeholder="Catatan (opsional), misal: pedas dikit"
                  className="field-input min-h-9 rounded-control pl-8 text-sm"
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-border bg-background/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Mengirim..." : totalItems > 0 ? `Kirim Pesanan (${totalItems} item)` : "Kirim Pesanan"}
        </button>
      </div>
    </form>
  );
}
