"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-line bg-surface p-6 text-center">
      <h2 className="text-base font-semibold text-ink">Terjadi kesalahan</h2>
      <p className="mt-2 text-sm text-muted">
        Data gagal dimuat. Periksa koneksi internet Anda lalu coba lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
