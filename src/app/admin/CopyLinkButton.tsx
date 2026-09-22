"use client";

import { useState } from "react";
import { LinkIcon } from "@/components/icons";

export default function CopyLinkButton({ publicCode }: { publicCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/pesan/${publicCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard failures (e.g. insecure context)
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="btn-secondary w-full">
      <LinkIcon className={copied ? "text-success" : undefined} />
      {copied ? "Link disalin!" : "Salin link buat customer"}
    </button>
  );
}
