# CONTEXT.md — Catatan Uang

Dokumen ini mencatat versi library, skema database, struktur folder, dan aturan kode.
Perbarui setiap fase. Sumber kebenaran fitur tetap `PRD.md`.

Terakhir diperbarui: Fase 1.

## 1. Versi library (terpasang, dikunci persis)

| Paket | Versi |
|---|---|
| next | 16.4.6 |
| react | 19.3.0 |
| react-dom | 19.3.0 |
| typescript | ^5 (lihat package-lock) |
| tailwindcss | 4.3.3 |
| @tailwindcss/postcss | 4.3.3 |
| @supabase/supabase-js | 2.119.0 |
| @supabase/ssr | 0.12.7 |
| zod | 4.6.7 |
| eslint | ^9 |
| eslint-config-next | 16.4.6 |

Belum dipasang (dipasang saat fasenya dikerjakan):
- `recharts` — Fase 1.5
- `dexie` — Fase 2

## 2. Catatan Next.js 16 (penting)

Next.js 16 punya perubahan besar dibanding versi lama. Baca `node_modules/next/dist/docs/` sebelum menulis kode.

- Turbopack aktif otomatis untuk `dev` dan `build`.
- `middleware.ts` **deprecated** → file sekarang bernama `src/proxy.ts`, fungsi diekspor sebagai `proxy`.
- `cookies()`, `headers()`, `params`, `searchParams` bersifat **async**.
- `cacheComponents`/`partialPrefetching` **dimatikan** (Fase 1). Halaman auth dan CRUD membaca cookie dan
  harus selalu segar; cache component akan memaksa semua pembacaan sesi di balik Suspense tanpa manfaat.
  Aktifkan lagi hanya jika ada kebutuhan cache nyata.
- Runtime: Node.js 20.9+ (terpasang v24), TypeScript 5.1+.

Tailwind memakai pipeline PostCSS standar (`postcss.config.mjs` + `@tailwindcss/postcss`), bukan loader Turbopack khusus.
Alasan: path proyek tidak boleh mengandung `#`. Path `D:\#My Own Project` terbukti merusak parser Tailwind v4
(error `null bytes`). Proyek sudah dipindah ke `D:\My Own Project`.

## 3. Struktur folder

```
src/
  app/
    layout.tsx              root layout (bahasa Indonesia)
    not-found.tsx
    globals.css             token warna Tailwind
    (auth)/
      layout.tsx            kartu tengah untuk halaman auth
      login/page.tsx
      daftar/page.tsx
      lupa-password/page.tsx
      atur-ulang-password/page.tsx
    auth/confirm/route.ts   menangani tautan email (PKCE ?code= dan OTP ?token_hash=)
    (app)/
      layout.tsx            shell: sidebar (laptop) + bottom nav (HP), guard sesi
      page.tsx              dashboard ringkasan bulanan
      loading.tsx           skeleton
      error.tsx             layar error + tombol coba lagi
      transaksi/page.tsx    daftar + pagination 50 + pemilih bulan
      transaksi/baru/page.tsx
      transaksi/[id]/page.tsx  ubah + hapus (soft delete)
  components/
    auth-form.tsx           form auth generik (useActionState)
    nav.tsx                 BottomNav + SideNav
    transaction-form.tsx    form transaksi
    transaction-list.tsx    daftar transaksi + state kosong
    summary-card.tsx        SummaryCard + MonthPicker
  lib/
    env.ts            validasi env dengan Zod
    format.ts         formatRupiah() satu-satunya formatter uang
    date.ts           todayJakarta(), currentMonthJakarta(), label tanggal/bulan
    types.ts          tipe database (ditulis tangan)
    validation.ts     skema Zod
    supabase/
      client.ts       klien browser
      server.ts       klien server (cookies)
    auth/
      actions.ts      server actions: signIn, signUp, signOut, reset, update password
      current-user.ts getCurrentUser() (cache per request) + requireUser()
    transactions/
      actions.ts      saveTransaction, removeTransaction
    data/
      index.ts        LAPISAN DATA — semua baca-tulis lewat sini
  proxy.ts            refresh sesi Supabase (pengganti middleware)
supabase/
  schema.sql          skema lengkap
  verify-rls.sql      pemeriksaan RLS
scripts/
  smoke-data.mjs      uji data (constraint, soft delete, trigger, data bawaan)
  smoke-ui.mjs        uji form -> server action -> database
postcss.config.mjs    pipeline Tailwind (jangan hapus)
```

## 4. Skema database

Lima tabel di schema `public`: `profiles`, `wallets`, `categories`, `transactions`, `budgets`.

- Semua tabel punya `created_at`, `client_updated_at`, `server_updated_at`.
- `server_updated_at` diisi trigger `set_server_updated_at()` pada INSERT/UPDATE.
- Constraint: `amount > 0`, tipe valid, aturan transfer, `budgets.amount_limit > 0`, `budgets.month` tanggal 1.
- RLS aktif semua tabel. Policy hanya SELECT/INSERT/UPDATE untuk pemilik. **Tidak ada policy DELETE.**
- Pengguna baru otomatis mendapat 1 dompet ("Dompet Utama"), 5 kategori pengeluaran, 2 kategori pemasukan.

## 5. Aturan kode

- Semua akses data lewat `src/lib/data/`. Komponen UI tidak memanggil Supabase langsung.
- ID dibuat klien dengan `crypto.randomUUID()`.
- Soft delete: `is_deleted = true`, tanpa DELETE fisik.
- Uang: `bigint` rupiah, tanpa desimal. Formatter: `formatRupiah()`.
- Tanggal transaksi: `date` (YYYY-MM-DD), zona Asia/Jakarta.
- Validasi: Zod di `src/lib/validation.ts`, dipakai lapisan data.
- Teks UI bahasa Indonesia. Mobile-first (360px ke atas).
- File `.env.local` (tidak di-commit) berisi URL + kunci Supabase + `NEXT_PUBLIC_APP_URL`. Contoh di `.env.example`.
- Server action auth ada di `src/lib/auth/actions.ts`; mutasi transaksi di `src/lib/transactions/actions.ts`.
- Halaman di `(app)` dijaga `requireUser()` di layout. RLS tetap lapisan pertahanan sebenarnya.

## 6. Cara menjalankan lokal

1. Salin `.env.example` menjadi `.env.local`, isi URL dan kunci Supabase (Publishable key `sb_publishable_...` atau anon public legacy). Jangan pakai secret/service_role.
2. Jalankan `supabase/schema.sql` di SQL Editor Supabase.
3. Di Supabase: Authentication > URL Configuration > Redirect URLs, tambahkan
   `http://localhost:3000/auth/confirm` (dan URL Vercel nanti).
4. `npm install`
5. `npm run dev` → buka http://localhost:3000

## 6b. Uji otomatis (butuh akun uji terkonfirmasi)

```
node --env-file=.env.local scripts/smoke-data.mjs <email> <password>
node --env-file=.env.local scripts/smoke-ui.mjs <email> <password> <baseUrl>
```

`smoke-data.mjs` memeriksa data bawaan, constraint, trigger `server_updated_at`, dan soft delete.
`smoke-ui.mjs` memastikan form transaksi benar-benar menyimpan lewat server action (server harus jalan).

## 7. Menguji RLS (Fase 0)

Setelah dua akun uji dibuat:

1. Jalankan `supabase/verify-rls.sql`. Semua tabel harus `rls_enabled = true`, `delete_policy_count = 0`.
2. Masuk sebagai akun A, catat satu transaksi.
3. Masuk sebagai akun B, pastikan transaksi akun A tidak terlihat (SELECT kosong) dan
   `update`/`insert` dengan `user_id` akun A ditolak (error RLS).

## 8. Status Fase 1 (MVP)

Selesai dan teruji terhadap Supabase sungguhan:
- Auth: daftar, login, logout, lupa password, atur ulang password, konfirmasi email.
- CRUD transaksi pemasukan/pengeluaran (transfer menyusul di Fase 3), soft delete.
- Dashboard: pemasukan, pengeluaran, saldo bulan, total saldo semua dompet, pemilih bulan.
- Daftar transaksi per bulan, 50 baris/halaman, navigasi halaman.
- Navigasi bawah (HP) dan sidebar (laptop). Format Rupiah. Loading/error/kosong.

Belum dikerjakan (sesuai PRD, fase lain):
- Transfer antar dompet, filter/pencarian, anggaran, grafik, ekspor CSV, PWA/offline.
- Konfirmasi hapus transaksi (saat ini satu klik tombol "Hapus transaksi").
