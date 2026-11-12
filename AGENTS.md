# AGENTS.md

Panduan untuk AI coding agent di proyek **Catatan Uang** (web pencatat keuangan pribadi).

## Sumber kebenaran

- `PRD.md` = spesifikasi lengkap.
- `CONTEXT.md` = versi library terpasang, skema, struktur folder. Dibuat di Fase 0 dan diperbarui tiap fase.
- Baca keduanya sebelum menulis kode.

## Jebakan lingkungan

- Path proyek **tidak boleh** mengandung `#` (Tailwind v4 gagal: error null bytes). Proyek ada di `D:\My Own Project\Website Keuangan`.
- Next.js 16: file `middleware` sudah diganti `proxy.ts`; `cookies()` async; Turbopack default.
- Tailwind memakai `postcss.config.mjs` + `@tailwindcss/postcss`. Jangan kembalikan loader Turbopack.

## Aturan kerja (dari PRD Bagian 13)

1. Kerjakan **hanya fase yang diminta**. Jangan menambah fitur di luar daftar.
2. Berhenti di akhir tiap bagian dan tunggu konfirmasi.
3. Beri kode lengkap per file dengan path jelas.
4. Jelaskan langkah dengan sederhana (pemilik pemula–menengah).
5. Jangan ubah fitur yang sudah jalan kecuali perlu; sebutkan perubahannya.
6. Keputusan yang tidak tercakup PRD: **tanya dulu**, jangan menebak.
7. Akhir fase: beri daftar cara menguji + ingatkan commit Git.

## Keputusan yang sudah disepakati

- Pengguna: **satu orang** pemilik akun. Signup publik dimatikan di Fase 2.5.
- Impor CSV: **ditunda** ke Fase 4. Data lama diekspor ke CSV dulu.
- Nama aplikasi: **Catatan Uang**. Identitas visual minimal (hijau/teal = pemasukan, merah/amber = pengeluaran, abu = netral). Warna disimpan sebagai token di satu tempat.

## Aturan kode (dari PRD Bagian 5)

- Next.js App Router + TypeScript ketat + Tailwind. Grafik: Recharts. DB/Auth: Supabase. Validasi: Zod. Offline (Fase 2): Dexie.
- **Semua baca-tulis data lewat `lib/data/`**. UI dilarang memanggil Supabase langsung.
- ID dibuat di klien: `crypto.randomUUID()`.
- **Soft delete**: kolom `is_deleted`, tanpa DELETE fisik dan tanpa policy DELETE.
- Nominal = `bigint` rupiah (tanpa desimal). Tanggal transaksi = `date`. Zona waktu Asia/Jakarta.
- Format Rupiah lewat satu helper, contoh `Rp 1.250.000`.
- Satu komponen satu file. Semua teks UI bahasa Indonesia.
- Mobile-first (360px ke atas).
- Hanya anon key di klien. Service role key tidak pernah masuk repositori.
- Tanpa komentar kode kecuali menjelaskan "mengapa".

## Gaya kerja

- Perubahan sekecil mungkin yang menyelesaikan tugas penuh (termasuk pemanggil, tes, fixture yang terdampak).
- Pakai helper/komponen/API yang sudah ada. Jangan tambah dependency untuk beberapa baris.
- Jangan buat file dokumentasi baru kecuali diminta.

## Fase

0. Persiapan: setup Next.js+TS+Tailwind, koneksi Supabase, SQL lengkap (tabel, constraint, trigger, RLS, data bawaan), `lib/data/`, `CONTEXT.md`, git init.
1. MVP: auth (daftar/login/logout/reset/konfirmasi email), CRUD transaksi (soft delete), dashboard bulanan, daftar transaksi + pagination (maks 50), nav HP/sidebar laptop, format Rupiah, state loading/error/kosong.
1.5 Grafik + ekspor CSV.
2. Offline-first PWA (Dexie, mutation queue, sync push/pull, indikator status, backoff).
2.5 Keamanan: matikan signup, Turnstile + rate limit, security headers (CSP report-only), audit RLS.
3. Banyak dompet + transfer, pencarian/filter, anggaran per kategori, grafik multi-bulan.
4. Berulang, target tabungan, mode gelap, impor CSV.
