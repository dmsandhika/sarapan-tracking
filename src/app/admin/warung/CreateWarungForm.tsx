"use client";

import { useState, useTransition } from "react";
import { createWarung } from "@/app/actions/warung";
import { PlusIcon } from "@/components/icons";

export default function CreateWarungForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full">
        <PlusIcon />
        Tambah warung
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createWarung({ name, waNumber: wa });
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Warung baru</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
          Tutup
        </button>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama warung" className="field-input" />
      <input
        value={wa}
        onChange={(e) => setWa(e.target.value)}
        placeholder="Nomor WA warung (opsional)"
        inputMode="tel"
        className="field-input"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Menyimpan..." : "Simpan & isi lauk"}
      </button>
    </form>
  );
}
