"use client";

import { useState, useTransition } from "react";
import { createSession } from "@/app/actions/sessions";
import { PlusIcon } from "@/components/icons";

export default function CreateSessionForm({ defaultVendorWaNumber }: { defaultVendorWaNumber: string }) {
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
    setError(null);
    startTransition(async () => {
      try {
        await createSession({
          title: title.trim(),
          mode,
          vendorWaNumber: vendorWaNumber.trim() || undefined,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal membuat sesi.");
      }
    });
  }

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="btn-primary w-full">
        <PlusIcon />
        Buat sesi baru
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
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
          className={`flex-1 rounded-control border px-3 py-2 text-sm font-medium ${
            mode === "MENU" ? "border-primary bg-primary-soft text-primary" : "border-border text-muted"
          }`}
        >
          Menu tetap
        </button>
        <button
          type="button"
          onClick={() => setMode("FREETEXT")}
          className={`flex-1 rounded-control border px-3 py-2 text-sm font-medium ${
            mode === "FREETEXT" ? "border-primary bg-primary-soft text-primary" : "border-border text-muted"
          }`}
        >
          Bebas (free-text)
        </button>
      </div>
      <p className="text-xs text-muted">
        {mode === "MENU"
          ? "Cocok buat sarapan warung: upload foto menu dulu, orang pilih dari daftar."
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
    </form>
  );
}
