"use client";

import { useEffect, useState } from "react";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPrompt,
  type InstallPromptEvent,
} from "@/lib/pwaInstall";

export function InstallAppButton() {
  // Lazy-init from an event captured before this button ever mounted (e.g.
  // the user landed on /pesan first, then navigated to the splash page).
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    getDeferredInstallPrompt
  );

  useEffect(() => subscribeInstallPrompt(setInstallEvent), []);

  if (!installEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await installEvent.prompt();
        await installEvent.userChoice;
        clearDeferredInstallPrompt();
      }}
      className="btn-secondary w-full"
    >
      Install Aplikasi
    </button>
  );
}
