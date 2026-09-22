"use client";

import { useRef, useState, useTransition } from "react";
import { extractMenuImage, addMenuItems } from "@/app/actions/admin";
import type { ExtractedMenuItem } from "@/lib/gemini";
import GeneratingIndicator from "./GeneratingIndicator";
import { TrashIcon } from "@/components/icons";

export default function AddMenuItemsForm({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ExtractedMenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, startExtracting] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function reset() {
    setItems(null);
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setItems(null);

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

  function removeDraftItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  function addDraftItem() {
    setItems((prev) => [...(prev ?? []), { name: "" }]);
  }

  function handleSave() {
    if (!items || items.length === 0) return;
    const cleaned = items.map((it) => ({ name: it.name.trim() })).filter((it) => it.name.length > 0);
    if (cleaned.length === 0) {
      setError("Isi minimal 1 nama menu.");
      return;
    }
    startSaving(async () => {
      await addMenuItems(sessionId, cleaned);
      setIsOpen(false);
      reset();
    });
  }

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="btn-ghost self-start px-0">
        + Upload/tambah menu lagi
      </button>
    );
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Tambah menu</h2>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            reset();
          }}
          className="text-sm text-muted"
        >
          Tutup
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-card border border-dashed border-border px-4 py-4 text-sm text-muted"
      >
        Pilih gambar menu susulan
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {isExtracting && <GeneratingIndicator variant="menu" />}
      {error && <p className="text-sm text-danger">{error}</p>}

      {items && (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={item.name}
                onChange={(e) => updateItemName(index, e.target.value)}
                placeholder="Nama menu"
                className="field-input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeDraftItem(index)}
                aria-label="Hapus item"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-danger"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          <button type="button" onClick={addDraftItem} className="btn-ghost self-start px-0 text-sm">
            + Tambah item manual
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="btn-primary w-full">
            {isSaving ? "Menyimpan..." : "Simpan ke menu hari ini"}
          </button>
        </div>
      )}
    </section>
  );
}
