# Sarapan Tracking

App kecil untuk kelola pesanan sarapan harian & tracking siapa sudah/belum bayar.

## Alur

1. **Admin** upload screenshot menu (tanpa harga) dari story WA warung → AI baca nama-nama menu → admin review/edit → publish.
2. Anak-anak buka `/pesan`, centang menu yang mau dipesan, isi nama, submit → dapat **nomor urut** otomatis.
3. Kalau ada lauk habis, admin tandai "Habis" di dashboard → pesanan yang pakai item itu bisa diganti ke item lain.
4. Setelah warung kirim foto bill (nomor urut + harga), admin upload foto itu di `/admin` → harga otomatis terisi ke tiap pesanan sesuai nomor urutnya.
5. Admin tandai siapa yang sudah bayar; rekap total tagihan vs terkumpul otomatis muncul.

## Setup

```bash
npm install
npx prisma migrate dev
```

Isi `.env`:

```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="ganti-ke-password-sendiri"
ANTHROPIC_API_KEY="sk-ant-..."   # wajib diisi biar fitur baca gambar (menu & bill) jalan
```

`ANTHROPIC_API_KEY` didapat dari [console.anthropic.com](https://console.anthropic.com).

## Menjalankan

```bash
npm run dev
```

- `/pesan` — halaman publik untuk pesan sarapan (share link ini ke grup)
- `/admin` — dashboard admin (login pakai `ADMIN_PASSWORD`)

## Catatan

- Database pakai SQLite lokal (`prisma/dev.db`), cocok untuk pemakaian personal/keluarga. Kalau mau diakses banyak orang dari luar jaringan yang sama, deploy ke Vercel + ganti `DATABASE_URL` ke database terkelola (misal Turso/Postgres) karena SQLite file tidak cocok untuk serverless.
- Tanggal mengikuti timezone Asia/Jakarta.
