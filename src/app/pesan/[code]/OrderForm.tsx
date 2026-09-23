"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { submitOrder } from "@/app/actions/orders";
import { ChevronRightIcon, TrashIcon } from "@/components/icons";
import QtyStepper from "@/components/QtyStepper";

type MenuItem = { id: string; name: string; status: string };
type MenuSelection = { checked: boolean; qty: number; note: string };
type FreeTextRow = { id: string; text: string; qty: number; note: string };

const PROFILE_KEY = "sarapan-tracking:profile";

const SUCCESS_MESSAGES = [
  "Pesanan meluncur ke dapur warung!",
  "Sip, perut kamu udah masuk antrian!",
  "Aman, warung udah dapet sinyal laper kamu!",
  "Gaskeun, tinggal nunggu asap ngebul dari kuali!",
  "Beres! Tinggal duduk manis nunggu dipanggil.",
  "Sukses! Rejeki nomor urut ini nggak akan ketuker.",
  "Mantap, pesanan kamu resmi jadi prioritas dapur!",
  "Yes! Nomor antrian kamu udah dicetak di alam semesta.",
  "Oke, warung udah pasang alarm khusus buat pesanan ini!",
  "Berhasil! Tinggal latihan sabar sambil ngebayangin rasanya.",
];

function randomSuccessMessage() {
  return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
}

function newFreeTextRow(): FreeTextRow {
  return { id: crypto.randomUUID(), text: "", qty: 1, note: "" };
}

type Props =
  | { sessionId: string; mode: "MENU"; menuItems: MenuItem[] }
  | { sessionId: string; mode: "FREETEXT"; menuItems?: undefined; suggestions?: { id: string; name: string }[] };

export default function OrderForm(props: Props) {
  const { sessionId, mode } = props;
  const [name, setName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [selections, setSelections] = useState<Record<string, MenuSelection>>({});
  const [rows, setRows] = useState<FreeTextRow[]>(() => [newFreeTextRow()]);
  const [error, setError] = useState<string | null>(null);
  const [nomorUrut, setNomorUrut] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const successSoundRef = useRef<HTMLAudioElement | null>(null);

  function playSuccessSound() {
    if (!successSoundRef.current) {
      successSoundRef.current = new Audio("/dono_UZmG3Ta.mp3");
    }
    successSoundRef.current.currentTime = 0;
    successSoundRef.current.play().catch(() => {
      // ignore browsers blocking autoplay
    });
  }

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

  function updateRow(id: string, patch: Partial<FreeTextRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, newFreeTextRow()]);
  }

  function addSuggestion(name: string) {
    setRows((prev) => {
      const emptyIndex = prev.findIndex((r) => r.text.trim().length === 0);
      if (emptyIndex !== -1) {
        const next = [...prev];
        next[emptyIndex] = { ...next[emptyIndex], text: name };
        return next;
      }
      return [...prev, { ...newFreeTextRow(), text: name }];
    });
  }

  const totalItems =
    mode === "MENU"
      ? Object.values(selections)
          .filter((s) => s.checked)
          .reduce((sum, s) => sum + s.qty, 0)
      : rows.filter((r) => r.text.trim().length > 0).reduce((sum, r) => sum + r.qty, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Isi nama dulu ya.");
      return;
    }
    if (waNumber.trim().length === 0) {
      setError("Isi nomor WA dulu ya.");
      return;
    }

    const items =
      mode === "MENU"
        ? Object.entries(selections)
            .filter(([, s]) => s.checked)
            .map(([menuItemId, s]) => ({ menuItemId, qty: s.qty, note: s.note || undefined }))
        : rows
            .filter((r) => r.text.trim().length > 0)
            .map((r) => ({ customText: r.text.trim(), qty: r.qty, note: r.note || undefined }));

    if (items.length === 0) {
      setError(mode === "MENU" ? "Pilih minimal 1 menu." : "Isi minimal 1 item pesanan.");
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({ sessionId, name: name.trim(), waNumber: waNumber.trim(), items });
      if ("error" in result) {
        setError(result.error);
      } else {
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name.trim(), waNumber: waNumber.trim() }));
        } catch {
          // ignore unavailable storage
        }
        playSuccessSound();
        setSuccessMessage(randomSuccessMessage());
        setNomorUrut(result.nomorUrut);
      }
    });
  }

  if (nomorUrut !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="card flex flex-col items-center gap-2 py-10 text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl"
        >
          ✅
        </motion.span>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted"
        >
          {successMessage}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
          className="text-4xl font-bold tabular-nums text-success"
        >
          #{nomorUrut}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-sm text-muted"
        >
          Nomor urut kamu, {name}
        </motion.p>
        <Link
          href="/status"
          className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
        >
          Lihat status pesanan
          <ChevronRightIcon />
        </Link>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-xs text-muted"
        >
          Nanti kalau udah ditagih, kamu bisa upload bukti bayar di halaman itu juga.
        </motion.p>
      </motion.div>
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

      {mode === "MENU" ? (
        <div className="flex flex-col gap-2">
          {props.menuItems.map((item) => {
            const isHabis = item.status === "HABIS";
            const selection = selections[item.id];
            const isChecked = selection?.checked ?? false;
            return (
              <div
                key={item.id}
                className={`card flex flex-col gap-2 transition-colors duration-200 ${
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
                      className={`flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-control border transition-colors duration-200 ${
                        isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      <AnimatePresence>
                        {isChecked && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            viewBox="0 0 24 24"
                            width="12"
                            height="12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="text-sm">
                      {item.name}
                      {isHabis && <span className="ml-2 text-xs text-danger">(habis)</span>}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isChecked && !isHabis && (
                      <QtyStepper qty={selection.qty} onChange={(qty) => setQty(item.id, qty)} />
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {isChecked && !isHabis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        value={selection.note}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        placeholder="Catatan (opsional), misal: pedas dikit"
                        className="field-input min-h-9 w-full rounded-control pl-8 text-sm"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {props.suggestions && props.suggestions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Saran menu, klik buat nambah cepat</span>
              <div className="flex flex-wrap gap-2">
                {props.suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addSuggestion(s.name)}
                    className="rounded-control border border-border bg-card px-3 py-1.5 text-xs text-foreground active:border-primary/40 active:bg-primary-soft active:text-primary"
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="card flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.text}
                      onChange={(e) => updateRow(row.id, { text: e.target.value })}
                      placeholder="Pesanan kamu, misal: Es kopi susu"
                      className="field-input min-h-11 flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Hapus item"
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-danger"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <input
                      value={row.note}
                      onChange={(e) => updateRow(row.id, { note: e.target.value })}
                      placeholder="Catatan (opsional)"
                      className="field-input min-h-9 flex-1 rounded-control text-sm"
                    />
                    <QtyStepper qty={row.qty} onChange={(qty) => updateRow(row.id, { qty })} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button type="button" onClick={addRow} className="btn-ghost self-start px-0 text-sm">
            + Tambah item
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-border bg-background/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Mengirim..." : totalItems > 0 ? `Kirim Pesanan (${totalItems} item)` : "Kirim Pesanan"}
        </button>
      </div>
    </form>
  );
}
