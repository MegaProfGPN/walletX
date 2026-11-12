import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-ink">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted">Transaksi atau halaman yang Anda cari tidak ada.</p>
      <Link
        href="/"
        className="flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white"
      >
        Kembali ke ringkasan
      </Link>
    </div>
  );
}
