"use client";

import { useState, useTransition } from "react";
import { getOrderListWhatsAppUrl } from "@/app/actions/whatsapp";
import { updateSessionVendorNumber } from "@/app/actions/sessions";
import { SendIcon } from "@/components/icons";

export default function SendToWhatsAppButton({
  sessionId,
  vendorWaNumber,
}: {
  sessionId: string;
  vendorWaNumber: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [numberInput, setNumberInput] = useState("");
  const [hasNumber, setHasNumber] = useState(Boolean(vendorWaNumber));

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await getOrderListWhatsAppUrl(sessionId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  function handleSaveNumber(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateSessionVendorNumber(sessionId, numberInput);
      if (result.error) {
        setError(result.error);
        return;
      }
      setHasNumber(true);
    });
  }

  if (!hasNumber) {
    return (
      <form onSubmit={handleSaveNumber} className="flex flex-col gap-2">
        <input
          value={numberInput}
          onChange={(e) => setNumberInput(e.target.value)}
          placeholder="Nomor WA vendor buat kirim pesanan"
          inputMode="tel"
          className="field-input"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={isPending} className="btn-secondary w-full">
          {isPending ? "Menyimpan..." : "Simpan nomor WA vendor"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleSend} disabled={isPending} className="btn-secondary w-full">
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
