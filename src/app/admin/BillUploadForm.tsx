"use client";

import { useRef, useState, useTransition } from "react";
import { extractBillImage, applyBillEntries, type ApplyBillResult } from "@/app/actions/admin";
import GeneratingIndicator from "./GeneratingIndicator";

export default function BillUploadForm({ sessionId }: { sessionId: string }) {
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
      const applied = await applyBillEntries(sessionId, extracted.entries);
      setResult(applied);
    });
  }

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="section-title">Upload foto bill</h2>
      <p className="text-sm text-muted">
        Foto bill dari warung (nomor urut + harga) akan otomatis dicocokkan ke pesanan.
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="flex min-h-11 items-center self-start rounded-card border border-dashed border-border px-4 text-sm text-muted"
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

      {isPending && <GeneratingIndicator variant="bill" />}
      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-success">{result.updated} pesanan berhasil diisi harga.</p>
          {result.unmatched.length > 0 && (
            <p className="text-warning">
              Tidak ketemu pesanan untuk nomor urut: {result.unmatched.map((e) => e.nomorUrut).join(", ")}
            </p>
          )}
          {result.stillMissing.length > 0 && (
            <p className="text-warning">
              Nomor urut belum ada harganya: {result.stillMissing.join(", ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
