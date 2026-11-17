"use client";

import { useRef, useState, useTransition } from "react";
import {
  addWarungItems,
  deleteWarung,
  deleteWarungItem,
  updateWarung,
  updateWarungItem,
} from "@/app/actions/warung";
import { extractMenuImage } from "@/app/actions/admin";
import { TrashIcon } from "@/components/icons";
import GeneratingIndicator from "../../GeneratingIndicator";

type Warung = { id: string; name: string; waNumber: string | null; note: string | null };
type Item = { id: string; name: string };

function ItemRow({ item }: { item: Item }) {
  const [name, setName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (name.trim() === item.name) return;
    setError(null);
    startTransition(async () => {
      const result = await updateWarungItem(item.id, { name });
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1 border-b border-line py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          disabled={isPending}
          aria-label="Nama lauk"
          className="field-input min-h-11"
        />
        <button
          type="button"
          aria-label={`Hapus ${item.name}`}
          disabled={isPending}
          onClick={() => startTransition(async () => void (await deleteWarungItem(item.id)))}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-danger"
        >
          <TrashIcon />
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function AddItems({ warungId }: { warungId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isReading, startReading] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addWarungItems(warungId, [{ name }]);
      if ("error" in result) setError(result.error);
      else {
        setName("");
      }
    });
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    startReading(async () => {
      const extracted = await extractMenuImage(fd);
      if ("error" in extracted) {
        setError(extracted.error);
      } else {
        const result = await addWarungItems(warungId, extracted.items.map((i) => ({ name: i.name })));
        if ("error" in result) setError(result.error);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="card flex flex-col gap-3">
      <h2 className="section-title">Tambah lauk</h2>
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lauk" className="field-input" />
        <button type="submit" disabled={isPending || !name.trim()} className="btn-primary shrink-0 px-4">
          +
        </button>
      </form>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={isReading} className="btn-secondary w-full">
        Baca dari foto menu
      </button>
      {isReading && <GeneratingIndicator variant="menu" />}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function WarungDetail({ warung, items }: { warung: Warung; items: Item[] }) {
  const [name, setName] = useState(warung.name);
  const [wa, setWa] = useState(warung.waNumber ?? "");
  const [note, setNote] = useState(warung.note ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const result = await updateWarung(warung.id, { name, waNumber: wa, note });
      setMsg("error" in result ? { ok: false, text: result.error } : { ok: true, text: "Tersimpan." });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col gap-3">
        <h2 className="section-title">Info warung</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama warung" className="field-input" />
        <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="Nomor WA warung" inputMode="tel" className="field-input" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" className="field-input" />
        {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
        <button type="button" onClick={save} disabled={isPending} className="btn-primary w-full">
          {isPending ? "Menyimpan..." : "Simpan info"}
        </button>
      </section>

      <AddItems warungId={warung.id} />

      <section className="flex flex-col gap-2">
        <h2 className="section-title">Lauk ({items.length})</h2>
        {items.length === 0 ? (
          <p className="card text-sm text-muted">Belum ada lauk.</p>
        ) : (
          <div className="card py-2">
            {items.map((item) => (
              <ItemRow key={`${item.id}:${item.name}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-card bg-danger-soft p-3">
            <p className="text-sm">Hapus warung ini beserta daftar lauknya? Sesi lama tidak terpengaruh.</p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => void (await deleteWarung(warung.id)))}
                className="min-h-11 text-sm font-bold text-danger underline underline-offset-4"
              >
                Ya, hapus
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 text-sm text-muted">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost self-start px-0 text-sm text-danger">
            Hapus warung
          </button>
        )}
      </section>
    </div>
  );
}
