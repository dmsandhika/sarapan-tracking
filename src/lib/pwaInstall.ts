export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<(event: InstallPromptEvent | null) => void>();

function notify() {
  listeners.forEach((listener) => listener(deferredPrompt));
}

/**
 * Captures the `beforeinstallprompt` event as early as possible, regardless
 * of which route the user landed on first (most users arrive via a shared
 * /pesan link, not the splash page, and the event only fires once per
 * browser session — so it must be caught globally, not inside one page).
 */
export function initInstallPromptCapture() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(listener: (event: InstallPromptEvent | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
  notify();
}
