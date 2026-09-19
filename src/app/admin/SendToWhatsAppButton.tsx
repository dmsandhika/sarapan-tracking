"use client";

import { useState, useTransition } from "react";
import { getOrderListWhatsAppUrl } from "@/app/actions/whatsapp";

export default function SendToWhatsAppButton({ dayId }: { dayId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await getOrderListWhatsAppUrl(dayId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={handleClick} disabled={isPending} className="btn-secondary w-full">
        {isPending ? "Menyiapkan..." : "📋 Kirim daftar pesanan ke WA"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
