"use client";

import { useEffect, useState } from "react";

const LABELS = {
  menu: [
    "Mengintip story WA ibu warung...",
    "Menerjemahkan tulisan pensil jadi teks...",
    "Membedakan telor dadar sama telor ceplok...",
    "Nge-zoom foto biar gak salah baca...",
    "Menghitung ada berapa lauk di foto...",
    "Nanya AI: ini tulisan apa ya...",
  ],
  bill: [
    "Menghitung recehan satu-satu...",
    "Nyari siapa yang belum bayar...",
    "Mencocokkan nomor antrian sama harga...",
    "Mastiin ini bill warung bukan struk indomaret...",
    "Menghitung sambil ngunyah...",
    "Nagih utang secara digital...",
  ],
} as const;

export default function GeneratingIndicator({ variant }: { variant: keyof typeof LABELS }) {
  const messages = LABELS[variant];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2 rounded-card bg-primary-soft px-3.5 py-2.5 text-sm text-primary">
      <span className="flex shrink-0 items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </span>
      <span>{messages[index]}</span>
    </div>
  );
}
