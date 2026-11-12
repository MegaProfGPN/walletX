"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void> };

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<PromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIos() && window.location.pathname !== "/login" && window.location.pathname !== "/daftar") {
      queueMicrotask(() => setShowIosHint(true));
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!installEvent && !showIosHint) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-20 rounded-xl border border-line bg-surface p-3 shadow-sm md:inset-x-auto md:right-4 md:bottom-4 md:max-w-xs">
      <p className="text-sm font-medium text-ink">Pasang Catatan Uang</p>
      <p className="mt-1 text-xs text-muted">
        {installEvent
          ? "Tambahkan ke layar utama agar cepat dibuka seperti aplikasi."
          : "Di Safari: ketuk Bagikan, lalu pilih “Tambahkan ke Layar Utama”."}
      </p>
      <div className="mt-3 flex gap-2">
        {installEvent ? (
          <button
            type="button"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
            className="min-h-11 flex-1 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white"
          >
            Pasang
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setInstallEvent(null);
            setShowIosHint(false);
          }}
          className="min-h-11 rounded-lg border border-line px-3 text-sm text-ink"
        >
          Nanti
        </button>
      </div>
    </div>
  );
}
