"use client";

import { useEffect } from "react";
import { initInstallPromptCapture } from "@/lib/pwaInstall";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Capture the install prompt globally, on whichever page the user
    // lands on first — not just the splash page.
    initInstallPromptCapture();

    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Never run the SW in dev: it would cache Turbopack-served chunks and
      // fight with hot reload. Clean up anything left over from a previous
      // production build tested on the same origin (e.g. localhost).
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore registration failures (unsupported browser, blocked, etc.)
    });
  }, []);

  return null;
}
