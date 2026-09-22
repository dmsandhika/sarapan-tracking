# Jompesan

App kecil untuk kelola pesanan patungan (sarapan, kopi, ShopeeFood/GoFood, dll) & tracking siapa sudah/belum bayar. Admin bisa bikin beberapa **sesi** pemesanan sekaligus, masing-masing punya link share sendiri.

## Alur

1. **Admin** bikin sesi baru di `/admin`, pilih mode:
   - **Menu tetap** — upload screenshot menu (tanpa harga) dari story WA warung → AI baca nama-nama menu → admin review/edit → publish. Cocok buat sarapan warung.
   - **Bebas (free-text)** — orang tulis sendiri pesanannya. Cocok buat ShopeeFood/GoFood/kopi.
2. Admin salin link sesi (`/pesan/<kode>`) dan share ke grup. Orang buka link, isi nama + pilih menu (atau tulis pesanan bebas), submit → dapat **nomor urut** otomatis.
3. Mode menu tetap: kalau ada lauk habis, admin tandai "Habis" di dashboard → pesanan yang pakai item itu bisa diganti ke item lain (admin bisa langsung ganti massal, atau customer bisa ganti sendiri item pesanannya lewat `/status`).
4. Setelah vendor kirim foto bill (nomor urut + harga), admin upload foto itu di halaman sesi → harga otomatis terisi ke tiap pesanan sesuai nomor urutnya.
5. Customer bisa upload bukti bayar sendiri di `/status`; admin cek buktinya lalu tandai "Lunas" manual. Bukti bayar otomatis dihapus dari storage 7 hari setelah ditandai lunas (cron mingguan).

## Setup

```bash
npm install
npx prisma migrate dev
```

Isi `.env`:

```
DATABASE_URL="postgresql://...?pgbouncer=true"   # pooled connection (Supabase dsb)
DIRECT_URL="postgresql://..."                     # direct connection, dipakai buat migrasi
ADMIN_PASSWORD="ganti-ke-password-sendiri"
GEMINI_API_KEY="AIza..."   # wajib diisi biar fitur baca gambar (menu & bill) jalan
WARUNG_WA_NUMBER="6281234567890"   # opsional, jadi default nomor WA vendor pas bikin sesi baru
SUPABASE_URL="https://xxxx.supabase.co"       # buat fitur upload bukti bayar
SUPABASE_SERVICE_ROLE_KEY="..."               # dari Project Settings > API, JANGAN dipakai di client
CRON_SECRET="ganti-ke-string-random"          # dicek sama endpoint cleanup, biar cuma Vercel Cron yang bisa manggil
```

`GEMINI_API_KEY` didapat gratis dari [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (tinggal login akun Google, generate key, ada free tier).

Fitur bukti bayar butuh bucket Storage baru di dashboard Supabase (bukan lewat migrasi): bikin bucket namanya `payment-proofs`, set **private**.

## Menjalankan

```bash
npm run dev
```

- `/pesan` — halaman publik, nampilin daftar sesi yang lagi dibuka (share link sesi spesifik, `/pesan/<kode>`, ke grup)
- `/admin` — dashboard admin, kelola semua sesi (login pakai `ADMIN_PASSWORD`)

## Catatan

- Database pakai PostgreSQL (misal Supabase), cocok diakses banyak orang dari mana saja termasuk deploy serverless (Vercel).
- Tanggal mengikuti timezone Asia/Jakarta.
