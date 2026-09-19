"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
  type InstallPromptEvent,
} from "@/lib/pwaInstall";
import { DownloadIcon, XIcon } from "@/components/icons";

const DISMISS_KEY = "jompesan:install-dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallAppButton() {
  // Lazy-init from an event captured before this button ever mounted (e.g.
  // the user landed on /pesan first, before this floating button rendered).
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    getDeferredInstallPrompt
  );
  const [dismissed, setDismissed] = useState(readDismissed);
  const pathname = usePathname();

  useEffect(() => subscribeInstallPrompt(setInstallEvent), []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore unavailable storage
    }
  }

  // Admin headers already have their own icon buttons in this same corner —
  // this CTA is for customers ordering breakfast, not the logged-in admin.
  if (pathname?.startsWith("/admin")) return null;
  if (!installEvent || dismissed) return null;

  return (
    <div className="fixed top-[calc(1rem+env(safe-area-inset-top))] right-4 z-30 flex items-center gap-1.5">
      <button
        type="button"
        onClick={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          clearDeferredInstallPrompt();
        }}
        className="btn-primary gap-1.5 px-3.5"
      >
        <DownloadIcon />
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <XIcon />
      </button>
    </div>
  );
}
