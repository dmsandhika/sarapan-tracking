# Jompesan

App kecil untuk kelola pesanan patungan (sarapan, kopi, ShopeeFood/GoFood, dll) & tracking siapa sudah/belum bayar. Admin bisa bikin beberapa **sesi** pemesanan sekaligus, masing-masing punya link share sendiri.

## Alur

1. **Admin** bikin sesi baru di `/admin`, pilih mode:
   - **Menu tetap** — upload screenshot menu (tanpa harga) dari story WA warung → AI baca nama-nama menu → admin review/edit → publish. Cocok buat sarapan warung.
   - **Bebas (free-text)** — orang tulis sendiri pesanannya. Cocok buat ShopeeFood/GoFood/kopi.
2. Admin salin link sesi (`/pesan/<kode>`) dan share ke grup. Orang buka link, isi nama + pilih menu (atau tulis pesanan bebas), submit → dapat **nomor urut** otomatis.
3. Mode menu tetap: kalau ada lauk habis, admin tandai "Habis" di dashboard → pesanan yang pakai item itu bisa diganti ke item lain.
4. Setelah vendor kirim foto bill (nomor urut + harga), admin upload foto itu di halaman sesi → harga otomatis terisi ke tiap pesanan sesuai nomor urutnya.
5. Admin tandai siapa yang sudah bayar; rekap total tagihan vs terkumpul otomatis muncul per sesi.

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
```

`GEMINI_API_KEY` didapat gratis dari [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (tinggal login akun Google, generate key, ada free tier).

## Menjalankan

```bash
npm run dev
```

- `/pesan` — halaman publik, nampilin daftar sesi yang lagi dibuka (share link sesi spesifik, `/pesan/<kode>`, ke grup)
- `/admin` — dashboard admin, kelola semua sesi (login pakai `ADMIN_PASSWORD`)

## Catatan

- Database pakai PostgreSQL (misal Supabase), cocok diakses banyak orang dari mana saja termasuk deploy serverless (Vercel).
- Tanggal mengikuti timezone Asia/Jakarta.
