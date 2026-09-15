"use client";

import { useRef, useState, useTransition } from "react";
import { extractBillImage, applyBillEntries, type ApplyBillResult } from "@/app/actions/admin";

export default function BillUploadForm({ dayId }: { dayId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyBillResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    startTransition(async () => {
      const extracted = await extractBillImage(formData);
      if ("error" in extracted) {
        setError(extracted.error);
        return;
      }
      const applied = await applyBillEntries(dayId, extracted.entries);
      setResult(applied);
    });
  }

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
      <h2 className="text-sm font-medium text-black/70">Upload foto bill</h2>
      <p className="text-xs text-black/50">
        Foto bill dari warung (nomor urut + harga) akan otomatis dicocokkan ke pesanan.
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="self-start rounded-lg border border-dashed border-black/30 px-4 py-2 text-sm text-black/60"
      >
        {isPending ? "Memproses..." : "Pilih foto bill"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="text-sm">
          <p className="text-green-700">{result.updated} pesanan berhasil diisi harga.</p>
          {result.unmatched.length > 0 && (
            <p className="text-amber-600">
              Tidak ketemu pesanan untuk nomor urut: {result.unmatched.map((e) => e.nomorUrut).join(", ")}
            </p>
          )}
          {result.stillMissing.length > 0 && (
            <p className="text-amber-600">
              Nomor urut belum ada harganya: {result.stillMissing.join(", ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
