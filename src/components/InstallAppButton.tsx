"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
  type InstallPromptEvent,
} from "@/lib/pwaInstall";
import { DownloadIcon } from "@/components/icons";

export function InstallAppButton() {
  // Lazy-init from an event captured before this button ever mounted (e.g.
  // the user landed on /pesan first, before this floating button rendered).
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    getDeferredInstallPrompt
  );
  const pathname = usePathname();

  useEffect(() => subscribeInstallPrompt(setInstallEvent), []);

  // Admin headers already have their own icon buttons in this same corner —
  // this CTA is for customers ordering breakfast, not the logged-in admin.
  if (pathname?.startsWith("/admin")) return null;
  if (!installEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await installEvent.prompt();
        await installEvent.userChoice;
        clearDeferredInstallPrompt();
      }}
      className="btn-primary fixed top-[calc(1rem+env(safe-area-inset-top))] right-4 z-30 gap-1.5 px-3.5"
    >
      <DownloadIcon />
      Install
    </button>
  );
}
