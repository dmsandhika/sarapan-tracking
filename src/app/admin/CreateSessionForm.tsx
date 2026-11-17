"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSession } from "@/app/actions/sessions";
import { PlusIcon } from "@/components/icons";
import type { WarungForSessionForm } from "@/app/actions/warung";

export default function CreateSessionForm({
  defaultVendorWaNumber,
  warungs,
}: {
  defaultVendorWaNumber: string;
  warungs: WarungForSessionForm[];
}) {
  const [warungId, setWarungId] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const warung = warungs.find((w) => w.id === warungId) ?? null;

  function pickWarung(id: string) {
    setWarungId(id);
    const w = warungs.find((x) => x.id === id);
    setChecked(new Set(w ? w.items.filter((i) => i.defaultChecked).map((i) => i.id) : []));
    if (w?.waNumber) setVendorWaNumber(w.waNumber);
  }

  function toggleItem(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"MENU" | "FREETEXT">("MENU");
  const [vendorWaNumber, setVendorWaNumber] = useState(defaultVendorWaNumber);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length === 0) {
      setError("Judul sesi wajib diisi.");
      return;
    }
    if (mode === "MENU" && warung && checked.size === 0) {
      setError("Pilih minimal 1 lauk yang ready.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createSession({
          title: title.trim(),
          mode,
          vendorWaNumber: vendorWaNumber.trim() || undefined,
          warungId: mode === "MENU" && warung ? warung.id : undefined,
          warungItemIds: mode === "MENU" && warung ? Array.from(checked) : undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal membuat sesi.");
      }
    });
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {!isOpen ? (
        <motion.button
          key="trigger"
          type="button"
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="btn-primary w-full"
        >
          <PlusIcon />
          Buat sesi baru
        </motion.button>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="card flex flex-col gap-3 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <h2 className="section-title">Sesi baru</h2>
            <button type="button" onClick={() => setIsOpen(false)} className="text-sm text-muted">
              Tutup
            </button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul sesi, misal: Sarapan atau Kopi Sore"
            className="field-input"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("MENU")}
              className={`flex-1 rounded-full border-2 px-3 py-2 text-sm font-bold ${
                mode === "MENU" ? "border-border bg-accent text-foreground" : "border-line bg-card text-muted"
              }`}
            >
              Menu tetap
            </button>
            <button
              type="button"
              onClick={() => setMode("FREETEXT")}
              className={`flex-1 rounded-full border-2 px-3 py-2 text-sm font-bold ${
                mode === "FREETEXT" ? "border-border bg-accent text-foreground" : "border-line bg-card text-muted"
              }`}
            >
              Bebas (free-text)
            </button>
          </div>
          {mode === "MENU" && warungs.length > 0 && (
            <select value={warungId} onChange={(e) => pickWarung(e.target.value)} className="field-input" aria-label="Pilih warung">
              <option value="">Tanpa warung (upload foto menu)</option>
              {warungs.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {mode === "MENU" && warung && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  Lauk ready ({checked.size}/{warung.items.length})
                </p>
                <button
                  type="button"
                  onClick={() => setChecked(new Set(warung.items.map((i) => i.id)))}
                  className="min-h-11 px-2 text-sm font-bold text-primary"
                >
                  Semua ready
                </button>
              </div>
              {warung.items.length === 0 ? (
                <p className="text-sm text-muted">Warung ini belum punya lauk. Isi dulu di menu Warung.</p>
              ) : (
                <div className="flex flex-col">
                  {warung.items.map((item) => {
                    const on = checked.has(item.id);
                    return (
                      <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-1 last:border-b-0">
                        <input type="checkbox" checked={on} onChange={() => toggleItem(item.id)} className="h-5 w-5 accent-[var(--accent)]" />
                        <span className={`flex-1 text-[15px] ${on ? "" : "text-muted line-through"}`}>{item.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted">
            {mode === "MENU"
              ? warung
                ? "Hanya lauk yang dicentang yang bisa dipesan. Sesi langsung dibuka."
                : "Cocok buat sarapan warung: upload foto menu dulu, orang pilih dari daftar."
              : "Cocok buat ShopeeFood/GoFood/kopi: orang tulis sendiri pesanannya."}
          </p>

          <input
            value={vendorWaNumber}
            onChange={(e) => setVendorWaNumber(e.target.value)}
            placeholder="Nomor WA vendor (opsional, bisa diisi nanti)"
            inputMode="tel"
            className="field-input"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? "Membuat..." : "Buat sesi"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
