# PRD: Website Pencatat Keuangan Pribadi

> Dokumen ini adalah sumber kebenaran proyek. Baca seluruhnya sebelum menulis kode.
> Kerjakan HANYA fase yang diminta pada setiap sesi. Jangan mengerjakan fitur dari fase lain.

---

## 1. Ringkasan

**Nama sementara:** Catatan Uang
**Jenis:** Web responsif (HP dan laptop), kemudian bisa di-install sebagai PWA.
**Pengguna:** Pemakaian pribadi, satu pengguna per akun, dengan login.
**Mata uang:** Rupiah (IDR), tanpa desimal.
**Bahasa antarmuka:** Indonesia.
**Level pemilik proyek:** Pemula sampai menengah. Jelaskan setiap langkah dengan sederhana.

## 2. Masalah dan Tujuan

**Masalah:** Pemasukan dan pengeluaran sering tidak tercatat, sehingga sulit tahu uang habis ke mana.

**Tujuan:**
- Mencatat satu transaksi dalam kurang dari 15 detik.
- Melihat ringkasan keuangan bulanan sekilas.
- Melihat pola pengeluaran lewat grafik.
- Data aman, tidak hilang, dan bisa diekspor.

**Metrik berhasil:** Pemilik bisa memakainya sendiri selama 1 bulan penuh tanpa kendala dan tanpa kehilangan data.

## 3. Asumsi

1. Aplikasi untuk pemakaian pribadi. Setelah akun pemilik dibuat, pendaftaran publik dinonaktifkan (lihat Bagian 9).
2. Satu pengguna memiliki banyak dompet, kategori, dan transaksi.
3. Semua nominal disimpan sebagai bilangan bulat dalam rupiah (`bigint`).
4. Zona waktu pengguna: Asia/Jakarta. Tanggal transaksi disimpan sebagai `date`.

## 4. Tech Stack

| Lapisan | Pilihan |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Grafik | Recharts |
| Backend dan database | Supabase (PostgreSQL + Auth) |
| Validasi | Zod |
| Database lokal (Fase 2) | Dexie.js (IndexedDB) |
| Hosting | Vercel (paket Hobby) |

**Aturan versi:** Pada awal Fase 0, tuliskan versi pasti setiap library di `package.json` dan di `CONTEXT.md`. Gunakan dokumentasi resmi versi yang terpasang. Jangan memakai API lama atau yang sudah deprecated.

## 5. Aturan Arsitektur (wajib dipatuhi sejak Fase 0)

Tiga aturan ini sengaja diterapkan sejak awal supaya Fase 2 (offline) tidak merombak semuanya:

1. **Lapisan akses data terpisah.** Seluruh baca-tulis data lewat satu folder, misalnya `lib/data/`, berisi fungsi seperti `getTransactions()`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()`. Komponen UI **dilarang** memanggil Supabase langsung. Di Fase 2, isi lapisan ini diganti dari Supabase ke Dexie tanpa mengubah komponen.
2. **ID dibuat di sisi aplikasi** memakai UUID (`crypto.randomUUID()`), bukan nomor urut dari server.
3. **Hapus lunak (soft delete).** Data tidak pernah dihapus fisik. Gunakan kolom `is_deleted`.

Aturan kode lain:
- Gunakan TypeScript dengan tipe yang ketat.
- Satu komponen satu file. Beri nama file dan fungsi yang jelas.
- Format Rupiah lewat satu fungsi pembantu, contoh: `Rp 1.250.000`.
- Semua teks yang tampil ke pengguna dalam bahasa Indonesia.
- Mobile-first: rancang untuk layar HP dulu, lalu perlebar ke laptop.

## 6. Skema Database (DBML)

Tempel ke dbdiagram.io untuk melihat ERD. Semua tabel punya `client_updated_at` dan `server_updated_at`:
- `client_updated_at`: waktu perubahan terjadi di perangkat pengguna. Dipakai untuk menentukan pemenang konflik (last-write-wins).
- `server_updated_at`: diisi otomatis oleh trigger di server. Dipakai sebagai penanda saat pull data di Fase 2.

```dbml
Table profiles {
  id uuid [pk, note: 'sama dengan auth.users.id']
  full_name varchar
  currency varchar [not null, default: 'IDR']
  created_at timestamptz [not null, default: `now()`]
  client_updated_at timestamptz [not null, default: `now()`]
  server_updated_at timestamptz [not null, default: `now()`]
}

Table wallets {
  id uuid [pk]
  user_id uuid [not null, ref: > profiles.id]
  name varchar [not null]
  initial_balance bigint [not null, default: 0]
  is_archived boolean [not null, default: false]
  is_deleted boolean [not null, default: false]
  created_at timestamptz [not null, default: `now()`]
  client_updated_at timestamptz [not null, default: `now()`]
  server_updated_at timestamptz [not null, default: `now()`]
}

Table categories {
  id uuid [pk]
  user_id uuid [not null, ref: > profiles.id]
  name varchar [not null]
  type varchar [not null, note: 'income atau expense']
  icon varchar
  is_archived boolean [not null, default: false, note: 'kategori yang sudah tidak dipakai diarsipkan, bukan dihapus']
  is_deleted boolean [not null, default: false]
  created_at timestamptz [not null, default: `now()`]
  client_updated_at timestamptz [not null, default: `now()`]
  server_updated_at timestamptz [not null, default: `now()`]
}

Table transactions {
  id uuid [pk]
  user_id uuid [not null, ref: > profiles.id]
  wallet_id uuid [not null, ref: > wallets.id, note: 'dompet asal (atau dompet tujuan jika income)']
  to_wallet_id uuid [ref: > wallets.id, note: 'hanya diisi jika type = transfer']
  category_id uuid [ref: > categories.id, note: 'null jika type = transfer']
  type varchar [not null, note: 'income, expense, atau transfer']
  amount bigint [not null, note: 'rupiah, bilangan bulat positif']
  note text
  transaction_date date [not null]
  is_deleted boolean [not null, default: false]
  created_at timestamptz [not null, default: `now()`]
  client_updated_at timestamptz [not null, default: `now()`]
  server_updated_at timestamptz [not null, default: `now()`]

  indexes {
    (user_id, transaction_date)
    (user_id, server_updated_at)
  }
}

Table budgets {
  id uuid [pk]
  user_id uuid [not null, ref: > profiles.id]
  category_id uuid [not null, ref: > categories.id]
  month date [not null, note: 'selalu tanggal 1 pada bulan tersebut']
  amount_limit bigint [not null]
  is_deleted boolean [not null, default: false]
  created_at timestamptz [not null, default: `now()`]
  client_updated_at timestamptz [not null, default: `now()`]
  server_updated_at timestamptz [not null, default: `now()`]

  indexes {
    (user_id, category_id, month) [unique]
  }
}
```

> Tabel `budgets` dibuat di Fase 0 agar skema lengkap, tetapi fiturnya baru dikerjakan di Fase 3.

### Constraint database (wajib dibuat dalam SQL)

- `transactions.amount > 0`
- `transactions.type in ('income', 'expense', 'transfer')`
- `categories.type in ('income', 'expense')`
- Jika `type = 'transfer'`: `to_wallet_id` wajib terisi, `to_wallet_id <> wallet_id`, dan `category_id` harus null.
- Jika `type <> 'transfer'`: `to_wallet_id` harus null dan `category_id` wajib terisi.
- `budgets.amount_limit > 0`
- Trigger `server_updated_at = now()` otomatis setiap INSERT dan UPDATE di semua tabel.

### Row Level Security (RLS)

- RLS **aktif di semua tabel**.
- Kebijakan: pengguna hanya boleh SELECT, INSERT, UPDATE pada baris dengan `user_id = auth.uid()` (untuk `profiles`, `id = auth.uid()`).
- Tidak ada kebijakan DELETE. Penghapusan dilakukan lewat soft delete.
- Berikan SQL untuk memeriksa bahwa RLS aktif di semua tabel.
- Hanya anon key yang boleh ada di kode klien. Service role key **tidak boleh** muncul di kode frontend atau repositori.

### Data bawaan untuk pengguna baru

Saat akun dibuat (trigger atau fungsi di database), otomatis buat:
- Dompet: "Dompet Utama".
- Kategori pengeluaran: Makan, Transport, Belanja, Tagihan, Lainnya.
- Kategori pemasukan: Gaji, Lainnya.

## 7. Aturan Bisnis

- **Saldo dompet** = `initial_balance` + total income − total expense + transfer masuk − transfer keluar (hanya transaksi dengan `is_deleted = false`).
- **Transfer antar dompet bukan pemasukan dan bukan pengeluaran.** Transfer tidak dihitung di total pemasukan, total pengeluaran, maupun grafik pengeluaran.
- **Total bulanan** dihitung dari `transaction_date` dalam bulan terpilih.
- **Kategori yang masih dipakai transaksi tidak boleh dihapus.** Arsipkan saja agar tidak muncul di form baru tetapi riwayat tetap utuh.
- **Dompet** berlaku sama: arsipkan, jangan hapus.
- **Batas input:** jumlah uang bilangan bulat positif dengan batas maksimum wajar (misalnya 1 triliun), catatan maksimal 500 karakter.

## 8. Fitur dan Kebutuhan Fungsional per Fase

### Fase 0: Persiapan
- Setup proyek Next.js + TypeScript + Tailwind, koneksi ke Supabase.
- SQL lengkap: tabel, constraint, trigger, RLS, data bawaan pengguna baru.
- Struktur folder dan lapisan akses data (`lib/data/`).
- File `CONTEXT.md` berisi versi library, skema, struktur folder, dan aturan kode.
- Inisialisasi Git dan commit pertama.

**Selesai jika:** proyek berjalan lokal, terhubung ke database, dan RLS terbukti memblokir akses data pengguna lain.

### Fase 1: MVP
- Daftar, login, logout, **reset password**, dan konfirmasi email (Supabase Auth).
- Form tambah, ubah, dan hapus (soft delete) transaksi: tipe (pemasukan/pengeluaran), jumlah, dompet, kategori, tanggal, catatan.
- Dashboard: total pemasukan, total pengeluaran, saldo bulan ini, dengan pemilih bulan.
- Daftar transaksi terbaru dengan pagination (maksimal 50 baris per halaman).
- Navigasi bawah untuk HP, sidebar untuk laptop.
- Format Rupiah di seluruh aplikasi.
- Kondisi loading, error, dan data kosong di setiap halaman.

**Selesai jika:** bisa mencatat dan melihat ringkasan dari HP dan laptop, dan data tetap ada setelah logout dan login ulang.

### Fase 1.5: Grafik dan Ekspor
- Kartu ringkasan pengeluaran: total bulan ini, rata-rata per hari, kategori terbesar.
- Grafik garis (Recharts) dengan sumbu X tanggal 1 sampai akhir bulan terpilih, sumbu Y jumlah pengeluaran. Tanggal tanpa transaksi bernilai 0. Toggle mode **Harian** dan **Kumulatif**.
- Grafik donat pengeluaran per kategori dengan legenda dan persentase.
- Tooltip berformat Rupiah. Sumbu Y diringkas (500rb, 1jt, 2jt).
- Pesan "Belum ada pengeluaran bulan ini" jika data kosong.
- Komponen terpisah: `ExpenseSummary`, `DailyExpenseLineChart`, `CategoryExpenseChart`.
- **Ekspor CSV** seluruh transaksi (dengan filter bulan opsional). Ini jaring pengaman data.
- Grafik hanya menghitung `type = 'expense'`, bukan transfer.

**Selesai jika:** grafik tampil benar di HP dan laptop, angka grafik cocok dengan daftar transaksi, dan CSV bisa dibuka di spreadsheet.

### Fase 2: Offline-first (PWA)
- PWA: manifest, service worker, ikon. Halaman utama bisa dibuka saat offline.
- Dexie.js sebagai database lokal untuk semua tabel. Seluruh baca-tulis UI ke database lokal dulu; UI tidak menunggu Supabase. Cukup ganti isi `lib/data/`.
- Antrean perubahan (mutation queue) di IndexedDB untuk operasi yang belum terkirim.
- Sync engine:
  - **Push:** kirim antrean ke Supabase, hapus dari antrean jika berhasil, coba lagi jika gagal.
  - **Pull:** ambil data dengan `server_updated_at` lebih baru dari waktu sinkronisasi terakhir, **dikurangi jeda tumpang tindih 2 menit**, lalu gabungkan dan buang duplikat.
  - **Konflik:** last-write-wins berdasarkan `client_updated_at`.
  - **Pemicu sync:** saat aplikasi dibuka, saat tab kembali aktif, saat event `online`, dan setelah perubahan lokal. Tidak ada polling terus-menerus.
- Indikator status di UI: Online/Offline, jumlah perubahan menunggu, "Tersinkron" / "Menyinkronkan...".
- Exponential backoff dengan jitter jika gagal atau menerima respons 429.
- Login pertama kali tetap butuh internet. Setelah itu aplikasi bisa dibuka offline.

**Selesai jika:** transaksi yang dicatat saat mode pesawat muncul di Supabase dan di perangkat lain setelah internet menyala, tanpa data ganda atau hilang.

### Fase 2.5: Keamanan
- **Nonaktifkan pendaftaran publik** di Supabase setelah akun pemilik dibuat.
- CAPTCHA (Cloudflare Turnstile) dan batas laju (rate limit) Auth lewat dashboard Supabase.
- Security headers di `next.config`. Mulai dengan CSP mode **report-only**, perketat setelah dipastikan tidak merusak Next.js, Supabase, dan service worker.
- Validasi semua input dengan Zod di klien dan server.
- Batasi semua query: pagination maksimal 100 baris dan filter rentang tanggal.
- Rate limit pada API route buatan sendiri (jika ada), sesuai batas paket Vercel Hobby.
- Audit akhir: RLS aktif di semua tabel, tidak ada service role key di klien.
- File `SECURITY-CHECKLIST.md` berisi langkah manual di dashboard Vercel dan Supabase.

> Catatan: kode aplikasi tidak bisa menghentikan serangan DDoS skala besar. Vercel menyediakan mitigasi otomatis di lapisan jaringan. Fokus fase ini adalah mencegah penyalahgunaan login dan kebocoran data, yang merupakan risiko paling nyata untuk aplikasi keuangan pribadi.

**Selesai jika:** pendaftaran publik tertutup, input tidak valid ditolak, dan checklist keamanan terisi lengkap.

### Fase 3: Pengembangan
- Kelola banyak dompet (tambah, ubah, arsipkan) dan transfer antar dompet.
- Pencarian dan filter transaksi (kategori, dompet, rentang tanggal, kata kunci).
- Anggaran per kategori per bulan, dengan indikator pemakaian.
- Grafik garis perbandingan pengeluaran beberapa bulan terakhir.

**Selesai jika:** bisa melihat perbandingan pengeluaran dengan anggaran dan dengan bulan sebelumnya.

### Fase 4: Penyempurnaan
- Transaksi berulang (misalnya tagihan bulanan).
- Target tabungan.
- Mode gelap.
- Impor CSV.

**Selesai jika:** nyaman dipakai harian.

## 9. Di Luar Cakupan

- Aplikasi native (iOS/Android). PWA sudah cukup.
- Sinkronisasi otomatis dengan rekening bank.
- Multi-user, keluarga, atau berbagi dompet.
- Multi mata uang.
- Backup otomatis di luar fitur ekspor CSV.

## 10. Persyaratan Non-Fungsional

- **Performa:** dashboard tampil kurang dari 2 detik pada koneksi seluler normal.
- **Responsif:** nyaman di lebar layar 360px sampai desktop.
- **Aksesibilitas dasar:** kontras warna cukup, tombol minimal 44px di HP, label form jelas.
- **Keamanan:** lihat Fase 2.5 dan aturan RLS di Bagian 6.
- **Keandalan data:** tidak ada hapus fisik, ada ekspor CSV, constraint di level database.

## 11. Risiko

| Risiko | Penanganan |
|---|---|
| Data hilang (paket gratis Supabase mungkin tanpa backup otomatis dan bisa menjeda proyek tidak aktif; cek kebijakan terbarunya) | Ekspor CSV sejak Fase 1.5, ekspor berkala |
| RLS salah konfigurasi sehingga data bocor | Uji dengan dua akun, audit di Fase 0 dan 2.5 |
| Sync offline menimbulkan data ganda atau hilang | Soft delete, UUID klien, jeda tumpang tindih saat pull, uji skenario mode pesawat |
| Bot dan akun palsu | Nonaktifkan signup publik, CAPTCHA Supabase Auth |
| Kode AI memakai API usang | Kunci versi library, rujuk dokumentasi resmi, `CONTEXT.md` |
| Batas paket gratis berubah | Cek halaman harga Supabase dan Vercel secara berkala |

## 12. Pertanyaan Terbuka

1. Apakah aplikasi akan dipakai orang lain selain pemilik? (Jika ya, pendaftaran publik perlu tetap dibuka dan RLS serta rate limit jadi lebih kritis.)
2. Apakah perlu impor data dari catatan lama (CSV atau Excel)?
3. Apakah nama aplikasi dan identitas visual (warna, logo) sudah ditentukan?

---

## 13. Aturan Kerja untuk AI Pengembang

1. Baca `PRD.md` dan `CONTEXT.md` sebelum mulai.
2. Kerjakan **hanya fase yang diminta**. Jangan menambah fitur di luar daftar.
3. Kerjakan berurutan per bagian. **Berhenti setelah tiap bagian** dan tunggu konfirmasi sebelum lanjut.
4. Beri kode **lengkap per file** dengan nama dan lokasi file yang jelas.
5. Jelaskan setiap langkah dengan sederhana, karena pemilik masih belajar.
6. Jangan mengubah fitur yang sudah berjalan kecuali diperlukan, dan sebutkan jika ada perubahan.
7. Jika ada keputusan yang tidak tercakup di dokumen ini, **tanyakan dulu**, jangan menebak.
8. Di akhir tiap fase, berikan **daftar cara menguji** dan ingatkan pemilik melakukan commit Git.
9. Jika menemukan konflik antara dokumen ini dan praktik terbaik, sampaikan, jangan diam-diam menyimpang.

### Cara pemilik memakai dokumen ini

- Tempel `PRD.md` dan `CONTEXT.md` di awal setiap sesi chat baru, lalu sebutkan fase yang dikerjakan, misalnya: *"Kerjakan Fase 0 sesuai PRD.md."*
- Uji hasil tiap bagian sebelum lanjut. Jika error, kirim pesan error beserta kode file yang bermasalah.
- Commit Git setelah tiap bagian berhasil.
