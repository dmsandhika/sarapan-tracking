"use client";

import { useRef, useState, useTransition } from "react";
import { extractMenuImage, publishDay } from "@/app/actions/admin";
import type { ExtractedMenuItem } from "@/lib/gemini";

export default function UploadMenuForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [items, setItems] = useState<ExtractedMenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, startExtracting] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setItems(null);
    setPreviews(files.map((f) => URL.createObjectURL(f)));

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    startExtracting(async () => {
      const result = await extractMenuImage(formData);
      if ("error" in result) {
        setError(result.error);
        setItems([]);
      } else {
        setItems(result.items);
      }
    });
  }

  function updateItemName(index: number, name: string) {
    setItems((prev) => prev?.map((it, i) => (i === index ? { ...it, name } : it)) ?? null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  function addItem() {
    setItems((prev) => [...(prev ?? []), { name: "" }]);
  }

  function handlePublish() {
    if (!items || items.length === 0) return;
    const cleaned = items.map((it) => ({ name: it.name.trim() })).filter((it) => it.name.length > 0);
    if (cleaned.length === 0) {
      setError("Isi minimal 1 nama menu.");
      return;
    }
    setError(null);
    startPublishing(async () => {
      try {
        await publishDay(cleaned);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal publish menu.");
      }
    });
  }

  return (
    <div className="card flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Upload screenshot menu dari story WA ibu warung (boleh lebih dari 1 gambar). Menu akan
          dibaca otomatis, tanpa harga.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted"
        >
          {previews.length > 0 ? "Ganti gambar" : "Pilih gambar menu"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="Preview menu" className="h-28 rounded-xl border border-border object-contain" />
          ))}
        </div>
      )}

      {isExtracting && <p className="text-sm text-muted">Membaca menu dari gambar...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {items && (
        <div className="flex flex-col gap-3">
          <h2 className="section-title">Cek &amp; edit menu sebelum publish</h2>
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={item.name}
                onChange={(e) => updateItemName(index, e.target.value)}
                placeholder="Nama menu"
                className="field-input flex-1 text-sm"
              />
              <button type="button" onClick={() => removeItem(index)} className="text-sm text-danger">
                Hapus
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn-ghost self-start px-0 text-sm">
            + Tambah item manual
          </button>

          <button type="button" onClick={handlePublish} disabled={isPublishing} className="btn-primary mt-2 w-full">
            {isPublishing ? "Publishing..." : "Publish menu hari ini"}
          </button>
        </div>
      )}
    </div>
  );
}
