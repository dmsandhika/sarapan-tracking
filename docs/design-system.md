# Audit Desain — Sarapan Tracking

Dokumen ini murni mencatat **apa yang ada** di sistem desain aplikasi ini saat ini: token, komponen dasar, pola layout/interaksi, lalu rincian tiap halaman sampai ke level komponen dan field. Bukan daftar bug atau rekomendasi perbaikan.

Stack: Next.js App Router + Tailwind CSS v4 (config lewat `@theme` di `globals.css`, bukan `tailwind.config`). Semua teks UI berbahasa Indonesia.

---

## 1. Design Tokens

Didefinisikan sebagai CSS custom properties di `:root` (`src/app/globals.css`), lalu di-expose ke Tailwind lewat `@theme inline` sehingga otomatis jadi utility class (`bg-primary`, `text-muted`, dst).

### 1.1 Palet warna

| Token | Hex | Utility class | Dipakai untuk |
|---|---|---|---|
| `--background` | `#faf7f2` | `bg-background` | Latar belakang halaman (krem hangat) |
| `--foreground` | `#292019` | `text-foreground` | Warna teks utama (cokelat gelap, bukan hitam pekat) |
| `--card` | `#ffffff` | `bg-card` | Latar kartu/panel/input |
| `--border` | `#ece4d8` | `border-border` | Semua garis pembatas (card, divider, dashed upload box) |
| `--muted` | `#8a7c6d` | `text-muted` | Teks sekunder (label, keterangan, placeholder) |
| `--primary` | `#d9711b` | `bg-primary` / `text-primary` | Warna aksen utama — oranye hangat bertema sarapan |
| `--primary-foreground` | `#fffaf5` | `text-primary-foreground` | Teks di atas latar primary |
| `--primary-soft` | `#fdead9` | `bg-primary-soft` | Latar lembut untuk badge/ikon bertema primary |
| `--success` | `#1a7f4e` | `text-success` | Status positif (lunas, terkumpul) |
| `--success-soft` | `#e5f6ec` | `bg-success-soft` | Latar badge sukses |
| `--danger` | `#c8402c` | `text-danger` | Status negatif/destruktif (hapus, belum terkumpul, habis) |
| `--danger-soft` | `#fbe9e6` | `bg-danger-soft` | Latar badge/panel danger (mis. panel konfirmasi hapus) |
| `--warning` | `#b6790a` | `text-warning` | Status peringatan (item diganti, nomor urut tak ketemu) |
| `--warning-soft` | `#fbf0dc` | `bg-warning-soft` | Latar badge/panel warning (mis. panel ganti-massal menu) |

Tidak ada palet abu-abu netral terpisah — elemen netral (badge status "belum bayar", divider tipis) memakai opacity hitam langsung (`bg-black/5`, `border-border`) alih-alih token abu-abu khusus.

Tidak ada dark mode — `color-scheme: light` di-hardcode, tidak ada `@media (prefers-color-scheme: dark)`.

### 1.2 Tipografi

- Font: **Geist** (sans) untuk teks, **Geist Mono** disiapkan lewat CSS variable tapi tidak ada elemen yang eksplisit memakai `font-mono` di kode saat ini.
- Tidak ada skala tipografi kustom bernama — ukuran dipilih langsung per elemen pakai utility Tailwind bawaan:
  - Judul halaman (`<h1>`): `text-lg font-semibold` (dashboard/list) atau `text-xl`/`text-2xl font-semibold` (halaman splash `/` dan hasil sukses pesan).
  - Judul seksi (`.section-title`): label kecil huruf kapital.
  - Body/label form: `text-sm` atau `text-[15px]` (nilai arbitrary, dipakai khusus untuk item menu & judul field-input supaya tidak auto-zoom di iOS Safari saat fokus).
  - Teks kecil/meta: `text-xs`.
  - Angka besar (nomor urut sukses pesan): `text-4xl font-bold`.

### 1.3 Radius & bayangan

- Radius kecil (badge, tombol qty): `rounded-md`/`rounded-lg`/`rounded-full`.
- Radius standar tombol & input: `rounded-xl`.
- Radius kartu: `rounded-2xl` (lebih besar dari tombol — kartu terasa lebih "lembut").
- Bayangan sangat tipis: `shadow-sm shadow-black/[0.02]` pada `.card`, `shadow-sm shadow-primary/20` pada `.btn-primary`. Tidak ada bayangan besar/dramatis di mana pun.

### 1.4 Spacing & layout dasar

- Container halaman: `mx-auto w-full max-w-md` (halaman publik: pesan, status) atau `max-w-lg` (halaman admin — lebih lebar karena datanya lebih padat) atau `max-w-sm` (splash `/`, login admin).
- Padding horizontal konten: `px-5`. Padding vertikal antar section: `py-5`.
- Jarak antar elemen vertikal: hampir selalu lewat `flex flex-col gap-*` — nilai gap yang dipakai: `gap-1`, `gap-1.5`, `gap-2`, `gap-2.5`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8` (tidak ada skala baku, dipilih kontekstual per kerapatan konten).
- Struktur akar tiap halaman selalu: `<main className="mx-auto flex w-full max-w-* flex-1 flex-col">`, memastikan `main` mengisi tinggi lewat body `flex min-h-dvh flex-col` di `layout.tsx`.

---

## 2. Komponen Dasar (`globals.css` `@layer components` / `@utility`)

Ini adalah "primitives" yang dipakai ulang di seluruh app lewat className, bukan komponen React.

| Class | Definisi | Karakteristik |
|---|---|---|
| `.btn` (`@utility`) | Base shape tombol | `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50` — tinggi minimum 44px (target sentuh mobile), efek "tekan" lewat `active:scale-[0.98]` |
| `.btn-primary` | `.btn` + `bg-primary text-primary-foreground shadow-sm shadow-primary/20` | Aksi utama (submit, publish, kirim) |
| `.btn-secondary` | `.btn` + `border border-border bg-card text-foreground` | Aksi sekunder (tutup pemesanan, kirim WA, ganti gambar) |
| `.btn-ghost` | `.btn` + `min-h-9 px-2 text-muted underline underline-offset-4` | Aksi tersier/navigasi (keluar, riwayat, tambah menu, "lihat status") — satu-satunya varian tombol dengan tinggi lebih kecil (36px) dan garis bawah |
| `.field-input` | `min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-[15px] ... focus:border-primary focus:ring-2 focus:ring-primary/20` + reset spinner `<input type=number>` (`appearance:textfield` & sembunyikan tombol panah webkit) | Style seragam untuk semua `<input>`/`<select>` teks di app |
| `.card` | `rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/[0.02]` | Wadah konten paling sering dipakai — kartu menu, kartu pesanan, panel form, empty-state |
| `.section-title` | `text-xs font-semibold tracking-wide text-muted uppercase` | Label seksi kecil di atas grup konten (mis. "MENU HARI INI", "PESANAN (3)") |
| `.badge` | `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium` | Bentuk dasar pil status — warna latar/teks di-override per pemakaian (`bg-success-soft text-success`, `bg-danger-soft text-danger`, `bg-black/5 text-muted`, dll) |

Catatan: `.field-input` dipakai konsisten untuk semua jenis input (teks, nomor, password, tel, select), termasuk ukuran termodifikasi lewat override (`min-h-9`, `w-28`, `text-sm`) di pemakaian yang lebih ringkas (mis. input harga di baris pesanan).

---

## 3. Pola Layout

### 3.1 Kerangka halaman standar
Hampir semua halaman (`/pesan`, `/status`, `/admin`, `/admin/riwayat`, `/admin/riwayat/[date]`) memakai kerangka yang identik:

```
<main className="mx-auto flex w-full max-w-* flex-1 flex-col">
  <header className="sticky top-0 z-10 ... border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
    <h1>...judul...</h1>
    <p className="text-sm text-muted">...subjudul/tanggal...</p>
  </header>
  <div className="flex-1 px-5 py-5">
    ...konten...
  </div>
</main>
```

Header selalu **sticky di atas** dengan efek `backdrop-blur` + background semi-transparan (`bg-background/90`), supaya konten yang di-scroll di baliknya tetap terbaca. Halaman admin dengan aksi header (logout, riwayat, kembali) menaruh aksi itu di kanan header dengan `flex items-center justify-between`.

Pengecualian: halaman splash (`/`) dan login admin (`/admin/login`) tidak pakai header sticky — keduanya adalah layar "centered", bukan layar dengan konten yang di-scroll, jadi strukturnya `flex ... justify-center` langsung di `<main>`.

### 3.2 Sticky bottom action bar
Hanya dipakai di form pesan (`OrderForm.tsx`), karena itu satu-satunya form dengan daftar item panjang yang bisa panjang melebihi layar:

```
<div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-border bg-background/95 px-5 pt-3 backdrop-blur [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
  <button class="btn-primary w-full">...</button>
</div>
```

`env(safe-area-inset-bottom)` dipakai supaya tombol tidak ketutup home-indicator iPhone. Konten form diberi `pb-28` supaya item terakhir tidak ketutup bar ini.

### 3.3 Viewport & meta mobile
`layout.tsx` mengatur `viewport` Next.js: `width: device-width`, `initialScale: 1`, `maximumScale: 1` (mencegah pinch-zoom tak sengaja), `viewportFit: cover` (supaya `env(safe-area-inset-*)` di atas berfungsi), dan `themeColor` disamakan dengan warna `--background`.

### 3.4 Kartu sebagai unit list
Semua daftar (menu, pesanan, hari riwayat, hasil pencarian customer) dirender sebagai tumpukan `.card` dengan `flex flex-col gap-2`, bukan tabel atau baris rapat. Tiap kartu punya struktur internal 2 baris yang konsisten: baris identitas (nomor/nama) lalu baris aksi/atribut (status, harga, dsb) — pola ini eksplisit di `OrdersList.tsx` dan `pesan/OrderForm.tsx` untuk menghindari elemen saling wrap di layar sempit.

### 3.5 Empty state
Pola seragam untuk kondisi kosong (menu belum ada, pemesanan ditutup, belum ada pesanan, tidak ketemu customer): `.card` dengan `flex flex-col items-center gap-2 py-10 text-center`, kadang diawali satu emoji besar (`text-2xl`) sebagai ilustrasi, lalu satu baris `text-sm text-muted`.

---

## 4. Pola Interaksi

### 4.1 Konfirmasi inline (bukan modal/dialog)
Aksi destruktif/berdampak besar tidak pernah pakai `window.confirm()` atau modal overlay — selalu berupa panel yang muncul **di dalam kartu yang sama**, mendorong konten lain ke bawah:
- **Hapus pesanan** (`OrdersList.tsx`): klik ikon tempat sampah → panel `bg-danger-soft` muncul di bawah header kartu berisi teks konfirmasi + tombol "Ya, hapus" (teks underline merah) dan "Batal".
- **Ganti-massal menu habis** (`MenuList.tsx`): klik "Tandai habis" pada menu yang sudah dipesan → panel `bg-warning-soft` muncul berisi `<select>` menu pengganti + 3 tombol: "Ganti semua & tandai habis" (primary), "Tandai habis tanpa ganti" (link teks), "Batal".

### 4.2 Rename in-place
`MenuList.tsx`: klik "Edit" mengubah `<span>` nama jadi `<input>` di posisi yang sama (bukan form terpisah), dengan tombol aksi header ikut berganti jadi "Simpan"/"Batal".

### 4.3 Expand/collapse manual
`AddMenuItemsForm.tsx`: berupa satu link kecil (`+ Upload/tambah menu lagi`, style `.btn-ghost`) ketika tertutup; klik membuka jadi `.card` penuh dengan judul + tombol "Tutup".

### 4.4 Badge sebagai tombol toggle
Status dua-nilai (Lunas/Belum bayar, Tersedia/Habis, Dibuka/Ditutup) divisualkan sebagai `.badge` berwarna, dan badge itu sendiri **adalah** tombol (`<button className="badge ...">`) — klik langsung membalik status, tanpa form/switch terpisah.

### 4.5 Live-updating text (GeneratingIndicator)
Saat proses baca-gambar AI berjalan, ditampilkan indikator custom (lihat §6.15): 3 titik `animate-bounce` dengan delay bertahap (efek "mengetik") + satu baris teks yang **berganti otomatis tiap 1.8 detik** lewat `setInterval`, mengambil dari daftar teks lucu bertema (`menu` vs `bill`).

### 4.6 Sinkronisasi input dengan data server
Input yang menampilkan nilai dari server tapi bisa diedit lokal (`BillAmountCell` di `OrdersList.tsx` & `CustomerSearch.tsx`) diberi `key={order.billAmount}` — pola "reset via key" React, supaya komponen remount dan menampilkan nilai terbaru begitu data server berubah dari luar (mis. setelah upload bill), bukan cuma dari input pengguna sendiri.

### 4.7 Auto-hydrate dari localStorage
Form pesan (`OrderForm.tsx`) dan pencarian status (`StatusLookup.tsx`) menyimpan `{name, waNumber}` ke `localStorage` (key `sarapan-tracking:profile`) setelah aksi berhasil, lalu mengisi ulang form otomatis di kunjungan berikutnya — termasuk auto-trigger pencarian riwayat di `/status` begitu halaman dibuka.

---

## 5. Konvensi Format Data

Ditentukan di `src/lib/*`, dipakai konsisten di seluruh komponen yang menampilkan uang/tanggal:

- **Uang** (`lib/currency.ts` → `formatRupiah`): `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })` → contoh `Rp15.000`.
- **Tanggal** (`lib/date.ts` → `formatDateHuman`): format panjang Indonesia dengan nama hari, mis. `Minggu, 20 September 2026`.
- **Item pesanan**: selalu `{qty}x {nama menu}` ketika ditampilkan sebagai teks (admin & status), vs. representasi checkbox+stepper terpisah saat masih dalam mode input (form pesan).

---

## 6. Inventaris per Halaman & Komponen

### 6.1 `/` — Splash / Landing (`src/app/page.tsx`)
- **Layout**: `main` di-center vertikal & horizontal (`items-center justify-center`), `max-w-sm`, tanpa header.
- **Konten**: ikon emoji 🍳 dalam kotak `bg-primary-soft rounded-2xl`, judul `text-2xl font-semibold`, subjudul `text-sm text-muted`.
- **Komponen anak**: tidak ada, murni statis + 3 `<Link>`.
- **Field/aksi**: 3 tombol navigasi bertumpuk (`flex flex-col gap-3`) — `.btn-primary` ("Pesan Sarapan" → `/pesan`), `.btn-secondary` ("Cek Pesanan Saya" → `/status`), `.btn-ghost` ("Masuk sebagai Admin" → `/admin`). Urutan visual = urutan prioritas aksi.

### 6.2 `/pesan` — Form Pesan Sarapan
**Server shell** (`pesan/page.tsx`): header sticky (judul + tanggal manusiawi), lalu 3 kemungkinan state konten:
1. Belum ada menu hari itu → empty-state 🍽️.
2. Menu ada tapi status hari bukan `PUBLISHED` → empty-state 🔒.
3. Menu tersedia & dibuka → render `<OrderForm>`.

**`OrderForm.tsx`** (client) — form utama publik, field-nya:

| Field | Tipe elemen | Wajib? | Catatan desain |
|---|---|---|---|
| Nama | `<input>` teks, `.field-input` | Ya | Placeholder "Nama kamu" |
| Nomor WA | `<input>` teks, `.field-input`, `inputMode="tel"` | Ya | Placeholder "Nomor WA (untuk cek status pesanan)" |
| Pilih menu | Kartu per menu, seluruh kartu adalah `<button>` toggle | Min. 1 | Kotak centang custom 20×20 (bukan `<input type=checkbox>` native) — kotak kosong bordered → terisi solid `bg-primary` + ikon ✓ saat aktif. Kartu terpilih dapat `ring-1 ring-primary/20` |
| Qty per item | Stepper `− [angka] +`, 2 tombol kotak 32×32 border | — (default 1) | Hanya muncul kalau item itu dicentang |
| Catatan per item | `<input>` teks, `.field-input min-h-9 pl-8` | Tidak | Placeholder "Catatan (opsional), misal: pedas dikit"; `pl-8` menyelaraskan indentasi dengan lebar kotak centang+gap di atasnya; hanya tampak kalau item dicentang |
| Submit | `.btn-primary` full-width, di sticky bottom bar | — | Label dinamis: "Kirim Pesanan" → "Kirim Pesanan (N item)" saat ada item terpilih → "Mengirim..." saat pending |

Item menu berstatus **Habis**: kartu jadi `opacity-50`, kotak centang `disabled`, label "(habis)" merah di sebelah nama.

**State sukses** (`nomorUrut !== null`): mengganti seluruh form dengan `.card` ber-icon ✅ (lingkaran `bg-success-soft`), nomor urut besar (`text-4xl font-bold text-success`), nama pemesan, dan link teks ke `/status`.

### 6.3 `/status` — Pesanan Saya
**Server shell** (`status/page.tsx`): header sticky statis (judul + deskripsi), lalu render `<StatusLookup>`.

**`StatusLookup.tsx`** (client):

| Field/elemen | Tipe | Catatan |
|---|---|---|
| Nomor WA | `<input>` + tombol dalam satu `<form className="flex gap-2">` | Input `flex-1`, tombol `.btn-primary px-4` label "Cek"/"Cari..." |
| Hasil "Hari ini" | Seksi dengan `.section-title` + daftar `OrderCard` atau empty-state teks | Difilter dari `result.orders` berdasarkan tanggal == hari ini |
| Hasil "Riwayat" | Seksi sama, hanya render kalau ada order selain hari ini | — |
| Pesan awal | `text-sm text-muted`, muncul sebelum pencarian pertama | "Masukkan nomor WA yang dipakai saat pesan sarapan." |

**`OrderCard`** (sub-komponen lokal di file yang sama) — dipakai untuk baris "Hari ini" & "Riwayat":
- Header kartu: badge lingkaran nomor urut (`bg-primary-soft`) + tanggal (`formatDateHuman`) di kiri; badge status Lunas/Belum bayar di kanan.
- Daftar item: `{qty}x {nama}`, plus keterangan `diganti dari {originalName}` (warna warning) kalau item pernah disubstitusi, plus catatan `(note)` kalau ada.
- Baris tagihan (kalau `billAmount` terisi): label "Tagihan" vs nominal, dipisah `border-t`.

### 6.4 `/admin/login`
- **Layout**: `main` center vertikal, `max-w-sm`, tanpa header (mirip pola splash).
- **Konten**: ikon 🔐 dalam `bg-primary-soft rounded-2xl`, judul "Login Admin".
- **Field**: satu `<input type="password">` (`.field-input`, `autoFocus`) di dalam `.card` yang juga membungkus tombol submit `.btn-primary` ("Masuk"/"Masuk...").
- Pesan error (kalau ada) muncul sebagai `text-sm text-danger` di antara input dan tombol.

### 6.5 `/admin` — Dashboard Hari Ini
**Server shell** (`admin/page.tsx`): header sticky dengan judul + tanggal di kiri, dan grup 2 aksi teks (`Riwayat` link, `Keluar` form) di kanan — keduanya `.btn-ghost`. Konten: kalau belum ada menu hari itu → `<UploadMenuForm>`, kalau sudah → `<DayDashboard>`.

**`UploadMenuForm.tsx`** — dipakai satu kali per hari (state kosong):

| Elemen | Tipe | Catatan |
|---|---|---|
| Deskripsi | `<p>` | Menjelaskan sumber foto (story WA warung) |
| Tombol pilih gambar | Kotak dashed `border-dashed border-border`, bukan `.field-input` | Label "Pilih gambar menu" → "Ganti gambar" setelah ada file |
| Input file (hidden) | `<input type="file" multiple accept="image/*">` | Disembunyikan (`className="hidden"`), ditrigger via ref |
| Preview gambar | Grid `flex flex-wrap gap-2` dari `<img>` thumbnail 112px | Dari `URL.createObjectURL` |
| Indikator proses | `<GeneratingIndicator variant="menu">` | Muncul saat `isExtracting` |
| Daftar hasil ekstrak | Per item: `<input>` nama (`field-input flex-1 text-sm`) + tombol teks "Hapus" (`text-danger`) | Bisa diedit sebelum publish |
| Tambah manual | `.btn-ghost` "+ Tambah item manual" | Menambah baris kosong ke daftar |
| Publish | `.btn-primary w-full` | Label "Publish menu hari ini" → "Publishing..." |

**`DayDashboard.tsx`** — merangkai komponen anak berikut secara vertikal (`gap-5`), tanpa markup tambahan sendiri selain kartu status paling atas:

1. **Kartu status pemesanan** — badge Dibuka/Ditutup + teks "pemesanan hari ini", tombol `.btn-secondary` "Tutup pemesanan"/"Buka lagi" di kanan.
2. `<MenuList>`
3. `<AddMenuItemsForm>`
4. `<BillUploadForm>`
5. `<SendToWhatsAppButton>`
6. `<OrdersList>`
7. `<DaySummary>`

#### `MenuList.tsx`
List `.card` dengan `divide-y` (bukan gap antar-item, karena ini list padat bukan tumpukan kartu terpisah). Tiap baris:

| Elemen | Kondisi | Detail |
|---|---|---|
| Nama menu (tampil) | Default | `line-through text-muted` kalau Habis |
| Nama menu (edit) | Mode rename aktif | `<input autoFocus>` menggantikan `<span>` di tempat yang sama |
| Badge "Tandai habis"/"Tandai tersedia" | Selalu (kecuali mode rename) | Warna `bg-danger-soft` (aktif) vs `bg-black/5` (habis) |
| "Edit" (teks) | Selalu (kecuali mode rename) | — |
| "Hapus" (teks) | Selalu (kecuali mode rename) | Ditolak server kalau item sudah pernah dipesan (pesan error tampil di atas list) |
| "Simpan"/"Batal" (teks) | Mode rename aktif | Menggantikan 3 tombol di atas |
| Panel ganti-massal | Muncul kalau menu yang mau ditandai habis sudah dipesan | Lihat §4.1 |

#### `AddMenuItemsForm.tsx`
Sama persis strukturnya dengan `UploadMenuForm` (dashed upload box, preview via `GeneratingIndicator`, list nama editable, tombol tambah manual), bedanya:
- Dibungkus toggle collapse (§4.3) — default tertutup, cuma tombol `.btn-ghost` "+ Upload/tambah menu lagi".
- Terbuka jadi `.card` dengan header "Tambah menu" + tombol "Tutup".
- Tidak ada preview thumbnail gambar (langsung ke hasil ekstrak).
- Tombol akhir "Simpan ke menu hari ini" (bukan "Publish").

#### `BillUploadForm.tsx`
`.card` sederhana: judul (`section-title`) "Upload foto bill", deskripsi kecil, tombol dashed "Pilih foto bill"/"Memproses...", `<GeneratingIndicator variant="bill">` saat proses, lalu hasil dalam 3 baris teks berwarna (`text-success` untuk jumlah berhasil, `text-warning` ×2 untuk baris tak-cocok/masih-kosong).

#### `SendToWhatsAppButton.tsx`
Paling minimal: satu `.btn-secondary w-full` berlabel "📋 Kirim daftar pesanan ke WA" / "Menyiapkan...", plus baris error di bawahnya kalau gagal. Satu-satunya tombol di app yang pakai emoji di dalam label teks (bukan sebagai ikon terpisah).

#### `OrdersList.tsx`
Daftar `.card` bertumpuk (`gap-2`), tiap kartu pesanan:
- **Baris 1** (identitas): badge lingkaran nomor urut → nama (`truncate`, `flex-1`) → ikon tempat sampah custom (SVG inline, bukan library ikon) di kanan.
- **Baris 2** (status): `BillAmountCell` (input angka `w-28`, placeholder "Rp") + badge Lunas/Belum bayar.
- **Panel konfirmasi hapus** (kondisional, lihat §4.1).
- **Daftar item** (`border-t pt-2`): tiap item → `{qty}x {nama}`, catatan `(note)` kalau ada, label warning "diganti dari X" kalau item pernah disubstitusi, dan `<select>` "Habis, ganti ke..." kalau item saat ini berstatus Habis **dan** `allowSubstitution` true.
- Prop `allowSubstitution` (default `true`) mengontrol tampil/tidaknya `<select>` ganti-item di atas — di-set `false` saat dipakai untuk hari lampau (`/admin/riwayat/[date]`).
- Empty state kalau `orders.length === 0`: `.card` teks "Belum ada pesanan masuk."

#### `DaySummary.tsx`
`.card` "Rekap": 3 baris angka (`Total tagihan`, `Sudah terkumpul` warna success, `Belum terkumpul` warna danger + `border-t` pemisah + font semibold), lalu daftar nama yang belum bayar (`<ul>` teks kecil) kalau ada.

#### `GeneratingIndicator.tsx`
Lihat §4.5. Dua varian teks (`menu`, `bill`), masing-masing 6 baris teks bergaya santai/lucu berbahasa Indonesia bertema warung.

### 6.6 `/admin/riwayat` — Daftar Riwayat + Cari Customer
**Shell** (`riwayat/page.tsx`): header sticky (judul "Riwayat Pesanan" + subjudul, tombol "Kembali" ke `/admin`), lalu dua seksi vertikal:
1. `<CustomerSearch>`
2. Seksi "Semua hari" — daftar `.card` yang **sekaligus adalah `<Link>`** ke `/admin/riwayat/{tanggal}`: kiri (tanggal manusiawi + jumlah pesanan), kanan (total tagihan + status "Belum terkumpul Rp..." warna danger atau "Lunas semua" warna success).

#### `CustomerSearch.tsx`
- Form pencarian: `<input>` + tombol `.btn-primary` dalam satu baris (`flex gap-2`).
- Hasil kosong: `.card` teks muted.
- Hasil ada → daftar `CustomerCard`:
  - Header: nama (`truncate`) + nomor WA (`text-xs`) di kiri; badge merah "Belum bayar Rp..." di kanan (hanya kalau ada tunggakan).
  - Per-order (dalam kotak `bg-background` bersarang di dalam card): link `#nomorUrut · tanggal` ke detail hari itu, baris `BillAmountCell` + badge Lunas/Belum bayar, lalu ringkasan item sebagai satu baris teks (`{qty}x {nama}` dipisah koma — bukan list per-baris seperti di `OrdersList`).
  - Footer (kalau ada tagihan): "Total semua pesanan" vs jumlah, dipisah `border-t`.

### 6.7 `/admin/riwayat/[date]` — Detail Hari Lampau
Header sticky (judul = tanggal, subjudul "Riwayat pesanan", tombol "Kembali" ke `/admin/riwayat`). Kalau tanggal tidak ditemukan → `notFound()` (halaman 404 bawaan Next.js, di luar sistem desain ini).

Konten (`gap-5`):
1. Seksi "Menu hari itu" — list `.card divide-y` read-only: nama (dicoret kalau Habis) + badge "Habis" di kanan (tanpa aksi apa pun, beda dari `MenuList` di dashboard hari-ini).
2. `<BillUploadForm>` — komponen yang sama persis dengan di dashboard hari-ini (bisa upload bill susulan untuk hari lampau).
3. `<OrdersList allowSubstitution={false}>` — sama seperti hari-ini tapi tanpa dropdown ganti-item.
4. `<DaySummary>` — sama persis.

---

## 7. Ringkasan Konsistensi Lintas Halaman

- **Emoji sebagai ikon**: dipakai luas untuk ilustrasi ringan tanpa perlu icon library — 🍳 (splash), 🔐 (login), 🍽️ (menu kosong), 🔒 (ditutup), ✅ (sukses pesan), 📋 (tombol WA). Satu-satunya ikon vektor kustom (bukan emoji) adalah ikon tempat sampah SVG inline di `OrdersList.tsx`.
- **Bahasa tombol destruktif**: selalu kata "Hapus" (bukan "Delete"/"Remove"), warna teks polos `text-danger` untuk aksi ringan (hapus item draft) vs. panel penuh berwarna untuk aksi permanen bernilai tinggi (hapus pesanan, ganti-massal menu).
- **Loading label**: 3 gaya berbeda dipakai berdampingan — teks statis via ternary (`"Mengirim..."`, `"Publishing..."`, `"Menyimpan..."`, `"Cari..."`), teks statis tanpa ternary terpisah (`"Memproses..."` di tombol upload bill), dan indikator animasi custom `GeneratingIndicator` (khusus proses baca-gambar AI).
- **Warna status yang konsisten secara semantik**: success = hijau (lunas/terkumpul), danger = merah (belum terkumpul/hapus/habis), warning = kuning-oranye (butuh perhatian tapi bukan error — item diganti, ganti-massal, nomor tak cocok), primary = oranye (identitas/aksen brand, dipakai di badge nomor urut & lingkaran ikon).
