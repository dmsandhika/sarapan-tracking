"use client";

import { useState, useTransition } from "react";
import { getOrderListWhatsAppUrl } from "@/app/actions/whatsapp";
import { SendIcon } from "@/components/icons";

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
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleClick} disabled={isPending} className="btn-secondary w-full">
        {isPending ? (
          "Menyiapkan..."
        ) : (
          <>
            <SendIcon className="text-muted" />
            Kirim daftar pesanan ke WA
          </>
        )}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
