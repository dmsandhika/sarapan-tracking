# Design System v2 — Sarapan Tracking

Dokumen ini adalah **spesifikasi baru** (bukan audit) yang menggantikan token & aturan lama. Arahnya:
- **Tema warna**: Warung Klasik (merah bata sebagai aksen brand)
- **Gaya interaksi**: Lembut & Santai (radius besar, inline confirm, sticky header, ramah mobile — dipertahankan dari sistem lama)
- **Look**: Minimalis — kontainer dikurangi, satu warna aksen dipakai hemat, shadow dihilangkan, radius & spacing diseragamkan
- **Font baru**: Plus Jakarta Sans

Stack tetap: Next.js App Router + Tailwind v4 (`@theme` di `globals.css`). Semua teks UI tetap Bahasa Indonesia.

---

## 1. Prinsip

1. **Satu warna hidup.** Merah bata (`primary`) adalah satu-satunya warna yang boleh "menyala". Semua yang lain netral (foreground/muted/border) kecuali status (success/danger/warning) yang dipakai *sangat* hemat dan sebisa mungkin sebagai teks, bukan latar blok.
2. **Garis, bukan kotak.** Pembatas antar-item pakai `divide-y`/`border-t` dulu sebelum menambah `.card` baru. Card hanya untuk konten yang memang perlu dipisah tegas dari sekitarnya (form, ringkasan, empty state, panel konfirmasi).
3. **Flat, tanpa shadow.** Kedalaman visual datang dari kontras warna & border, bukan bayangan.
4. **Dua radius, bukan lima.** Satu untuk kontrol kecil, satu untuk kontainer besar, plus `pill` khusus elemen bulat (avatar, dot, stepper).
5. **Spacing dari skala terbatas.** 4 nilai inti (`gap-2/3/4/6`), bukan dipilih bebas per konteks.
6. **Emoji untuk momen, ikon untuk fungsi.** Emoji dipakai hanya di titik yang memang ingin terasa hangat/personal (splash, empty state, sukses pesan). Aksi fungsional (hapus, edit, chevron) pakai ikon garis tipis monokrom, bukan emoji.

---

## 2. Mobile-only, bukan sekadar mobile-first

"Mobile-first" sering diartikan "didesain dari mobile, lalu melebar ke tablet/desktop pakai breakpoint". Di app ini **tidak ada pelebaran itu sama sekali** — satu-satunya target adalah layar HP, dibuka lewat browser HP (kemungkinan besar dari klik link WhatsApp). Ini aturan konkretnya:

### 2.1 Tidak ada breakpoint
- **Jangan pakai prefix `sm:`/`md:`/`lg:`/`xl:` di mana pun.** Kalau sebuah class butuh varian breakpoint, itu tanda desainnya salah arah — perbaiki di layout dasarnya, bukan ditambal per ukuran layar.
- Semua container (`max-w-md`, `max-w-lg`, `max-w-sm`) **bukan** untuk "membatasi lebar di layar besar" — itu cuma jaga-jaga kalau ada yang iseng buka dari browser desktop. Nilainya tetap dipertahankan sama persis untuk semua ukuran viewport, tidak melebar sama sekali di atas breakpoint tertentu (tidak ada `lg:max-w-2xl` dsb).
- Layout **selalu satu kolom**. Tidak ada grid 2 kolom atau side-by-side panel di mana pun — termasuk di halaman admin. Dashboard admin (`DayDashboard`) tetap satu kolom vertikal seperti sekarang, bukan diubah jadi 2 kolom "karena kontennya banyak".

### 2.2 Tidak ada interaksi berbasis hover
- Semua affordance harus berfungsi tanpa `:hover` — HP tidak punya hover. `:hover` boleh dipakai sebagai *bonus* kalau kebetulan dibuka di desktop, tapi tidak boleh jadi satu-satunya cara mengakses sebuah aksi (mis. "muncul tombol edit saat di-hover" — dilarang).
- Feedback interaksi memakai state **`:active`** (sudah ada lewat `active:scale-[0.98]` di `.btn`), bukan `:hover`, karena itu yang benar-benar dirasakan di layar sentuh.
- Tidak ada tooltip yang muncul saat hover. Penjelasan tambahan taruh langsung sebagai teks kecil (`text-xs text-muted`) di bawah elemen, selalu terlihat.

### 2.3 Target sentuh & jarak aman
- Semua elemen yang bisa ditekan (tombol, badge-toggle, item menu, baris list yang tappable) **minimal 44×44px** (`min-h-11`) — sudah jadi aturan `.btn`, sekarang ditegaskan berlaku ke **semua** elemen interaktif, termasuk badge status yang jadi tombol (§4.2) dan baris `.list-row` yang punya aksi di dalamnya.
- Dua elemen tap yang bersebelahan **minimal `gap-2` (8px)** — mencegah salah tekan dengan jari, terutama di baris padat seperti `MenuList`/`OrdersList`.
- Ikon-only button (tanpa label teks, mis. ikon hapus) area tap-nya tetap 44×44px walau ukuran ikon visual di dalamnya kecil (18–20px) — beri padding, bukan perbesar ikonnya.

### 2.4 Viewport & tipografi
- `maximumScale: 1` di `layout.tsx` **dipertahankan** — pinch-zoom sengaja dimatikan karena semua layout sudah dipastikan pas di lebar layar HP tanpa perlu di-zoom.
- Ukuran font terkecil untuk teks yang **bisa dibaca** (bukan meta/timestamp) tidak boleh di bawah `text-sm` (14px). Untuk elemen `<input>`/`<select>` tetap wajib `text-[15px]` (aturan lama, cegah auto-zoom iOS Safari).
- `viewportFit: cover` + `env(safe-area-inset-*)` dipertahankan penuh — termasuk di elemen baru mana pun yang menempel ke tepi atas/bawah layar (header sticky, bottom action bar).

### 2.5 Konsekuensi ke pola yang sudah ada
- **Sticky bottom action bar** (§5, form pesan) makin dipertegas sebagai pola utama untuk aksi primer di halaman panjang — bukan sekadar pilihan gaya, tapi karena di mobile area jempol bawah layar adalah zona paling gampang dijangkau.
- **Panel konfirmasi inline** (bukan modal) makin relevan di aturan ini — modal overlay penuh di layar kecil sering terasa memenuhi seluruh layar dan gampang salah tap tombol "Batal"/"Ya" karena jaraknya terlalu dekat; panel inline lebih aman untuk target sentuh.
- Kalau nanti ada kebutuhan tampilan tablet/desktop (mis. admin ingin pakai laptop), itu **bukan** dikerjakan lewat breakpoint di sistem ini — melainkan halaman/varian terpisah yang didesain ulang, supaya sistem mobile-only ini tidak terkontaminasi asumsi layar lebar.

---

## 3. Design Tokens

### 3.1 Palet warna — Warung Klasik

| Token | Hex | Dipakai untuk | Catatan |
|---|---|---|---|
| `--background` | `#faf6f1` | Latar halaman | Krem lebih netral dari versi lama, supaya merah bata primary lebih menonjol |
| `--foreground` | `#2a211b` | Teks utama | Cokelat gelap hampir hitam |
| `--card` | `#ffffff` | Latar kartu/input | Tetap putih murni |
| `--border` | `#ece2d8` | Semua garis pembatas | Sedikit lebih halus dari versi lama |
| `--muted` | `#8a7c6d` | Teks sekunder | Tidak berubah |
| `--primary` | `#a83a22` | Aksen brand, tombol utama, badge nomor urut | Merah bata — warna tunggal yang "hidup" |
| `--primary-foreground` | `#fdf5ef` | Teks di atas primary | — |
| `--primary-soft` | `#f6ddd2` | Latar lembut ikon/avatar bertema primary | — |
| `--success` | `#1f7a4d` | Status positif (lunas, terkumpul) | Tidak berubah dari versi lama |
| `--success-soft` | `#e6f4ec` | *(dipakai terbatas — lihat §2.4)* | — |
| `--danger` | `#9c2b3f` | Status negatif/destruktif | Digeser ke arah crimson (bukan merah-oranye) supaya **tidak tertukar visual dengan primary** yang juga merah |
| `--danger-soft` | `#f8e4e7` | *(dipakai terbatas)* | — |
| `--warning` | `#a6690a` | Peringatan (item diganti, dsb) | Tidak berubah dari versi lama |
| `--warning-soft` | `#f8ecd6` | *(dipakai terbatas)* | — |

> **Catatan penting**: karena primary sekarang merah, kontras primary vs danger dijaga lewat *hue* (bata/oranye vs crimson/magenta) — bukan lewat kecerahan saja. Tetap hindari menaruh badge danger tepat bersebelahan dengan tombol primary tanpa label teks yang jelas.

### 3.2 Tipografi

**Font: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)** — dipilih karena:
- Terminal sedikit membulat → selaras dengan nuansa hangat "warung", tidak sekaku font geometris murni.
- Angka tabular rapi → penting untuk nominal rupiah & nomor urut yang jadi elemen visual besar di app ini.
- Dukungan penuh untuk teks Latin/Indonesia, tersedia gratis lewat `next/font/google`, tanpa perlu self-host manual.
- Karakter jelas di ukuran kecil (15px) → cocok dengan kebutuhan lama "hindari auto-zoom iOS".

Ganti import di `layout.tsx`:
```ts
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
```
`Geist Mono` dihapus — tidak pernah dipakai secara eksplisit di kode manapun.

**Skala tipografi (baku, gantikan ukuran ad hoc lama):**

| Peran | Kelas | Dipakai untuk |
|---|---|---|
| Judul besar | `text-2xl font-semibold` | Splash (`/`), state sukses pesan |
| Judul halaman | `text-lg font-semibold` | Header sticky semua halaman list/admin |
| Judul seksi | `.section-title` (`text-xs font-semibold tracking-wide text-muted uppercase`) | Tidak berubah |
| Body/label | `text-sm font-normal` | Default paragraf & label |
| Input/field khusus mobile | `text-[15px]` | **Satu-satunya** pengecualian arbitrary value — tetap dipertahankan untuk cegah auto-zoom iOS Safari |
| Meta/kecil | `text-xs text-muted` | Timestamp, keterangan tambahan |
| Angka penekanan (nomor urut, rekap) | `text-4xl font-bold tabular-nums` | Ditambah `tabular-nums` — baru, supaya digit sejajar rapi |

Bobot dibatasi ke **regular (400), medium (500), semibold (600)** saja. Bold (700) hanya untuk angka penekanan di atas.

### 3.3 Radius — disederhanakan jadi 2 + pill

| Token baru | Nilai | Gantikan | Dipakai untuk |
|---|---|---|---|
| `--radius-control` | `10px` (`rounded-[10px]`) | `rounded-md`/`rounded-lg` lama | Tombol qty, input kecil, badge kotak (bukan pill) |
| `--radius-card` | `14px` (`rounded-[14px]`) | `rounded-xl`/`rounded-2xl` lama | **Semua** kontainer besar: card, tombol utama, input, dashed upload box — satu nilai untuk semuanya |
| `pill` | `rounded-full` | Tidak berubah | Avatar nomor urut, dot status, stepper qty |

Efeknya: tombol, input, dan card sekarang punya radius yang sama persis (`14px`) — dulu tombol lebih kecil (`rounded-xl` = 12px) dari card (`rounded-2xl` = 16px), sekarang disatukan supaya terasa satu keluarga bentuk.

### 3.4 Shadow — dihapus

Tidak ada lagi `shadow-sm shadow-black/[0.02]` di `.card` maupun `shadow-sm shadow-primary/20` di `.btn-primary`. Kedalaman/pemisahan visual sepenuhnya dari `border border-border`. Nol shadow di seluruh app.

### 3.5 Spacing — 4 nilai inti

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `gap-2` | 8px | Jarak rapat (icon+teks, item dalam satu baris) |
| `gap-3` | 12px | Jarak default antar field dalam satu grup |
| `gap-4` | 16px | Jarak antar baris/card dalam satu list |
| `gap-6` | 24px | Jarak antar seksi/blok besar dalam satu halaman |

`gap-1`, `gap-1.5`, `gap-2.5`, `gap-5`, `gap-8` yang dulu dipakai kontekstual — dipetakan ulang ke salah satu dari 4 nilai di atas, bukan dipertahankan sebagai variasi bebas.

### 3.6 Ikon

- **Emoji** dipertahankan **hanya** di: splash (`/`), login admin, empty state (setiap kondisi kosong), dan state sukses kirim pesanan. Ini adalah titik "momen", bukan aksi berulang.
- **Ikon garis** (`stroke-[1.5]`, 18–20px, warna `text-muted` default / `text-foreground` saat aktif) menggantikan semua ikon fungsional berulang: hapus, edit, chevron, kirim WA. Ikon tempat sampah SVG inline yang sudah ada di `OrdersList.tsx` jadi acuan gaya untuk ikon-ikon baru ini — tidak perlu tambah dependency icon library kalau mau tetap ringan, cukup samakan `stroke-width` & ukurannya.
- Emoji besar di tombol label teks (mis. "📋 Kirim daftar pesanan ke WA") **dihapus** — jadi ikon garis kecil + teks, konsisten dengan aturan di atas.

---

## 4. Komponen Dasar (revisi)

| Class | Perubahan dari versi lama |
|---|---|
| `.btn` | Radius jadi `--radius-card` (14px), hapus `active:scale-[0.98]`? — **dipertahankan**, itu bagian dari "Lembut & Santai" (feedback tekan halus) |
| `.btn-primary` | `bg-primary text-primary-foreground`, **hapus shadow** |
| `.btn-secondary` | Tidak berubah struktur, radius ikut `--radius-card` |
| `.btn-ghost` | Tidak berubah — tetap `text-muted underline`, ini sudah minimal |
| `.field-input` | Radius jadi `--radius-card`, warna fokus tetap `focus:border-primary focus:ring-2 focus:ring-primary/20` |
| `.card` | **Hapus shadow.** Radius jadi `--radius-card`. Dipakai lebih selektif (lihat §1 poin 2) — list homogen pindah ke pola `divide-y` baru (§4.1) |
| `.section-title` | Tidak berubah |
| `.badge` | Lihat §4.2 — sebagian besar pemakaian pindah ke pola baru "label status" |

### 4.1 Pola baru: `.list-row` (pengganti tumpukan `.card` untuk list homogen)

```css
.list-row {
  @apply flex items-center justify-between gap-3 border-b border-border px-1 py-3 last:border-b-0;
}
```
Dipakai di `MenuList` (sudah `divide-y`, tinggal disamakan style-nya) dan opsional untuk list yang saat ini masih tumpukan card terpisah tapi isinya homogen & berdensitas tinggi (misal daftar hari di `/admin/riwayat` bisa tetap card karena itu juga berfungsi sebagai link besar/tappable, tapi `OrdersList` di dalam satu hari yang sama bisa dipertimbangkan pindah ke `.list-row` di dalam satu `.card` pembungkus, bukan card per pesanan).

### 4.2 Pola baru: label status minimal (pengganti badge pill berwarna)

Untuk status dua-nilai yang sekarang jadi `.badge` dengan latar warna (Lunas/Belum bayar, Tersedia/Habis, Dibuka/Ditutup):

```html
<button class="inline-flex items-center gap-1.5 text-sm font-medium text-success">
  <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
  Lunas
</button>
```

Jadi **teks berwarna + dot kecil**, bukan pil dengan latar blok. Tetap berfungsi sebagai tombol toggle (klik = balik status, pola interaksi §4.4 lama tidak berubah), tapi visualnya jauh lebih ringan dan tidak menambah "kotak warna" di layar padat seperti dashboard admin.

**Pengecualian yang tetap pakai `.badge` pill berlatar (`primary-soft`)**: avatar bulat nomor urut pesanan — ini elemen identitas, bukan status, jadi tetap boleh jadi satu-satunya aksen visual kuat per kartu.

---

## 5. Layout & Interaksi — dipertahankan dari "Lembut & Santai"

Tidak berubah dari sistem lama (lihat audit v1 §3–§4), karena ini bagian dari tema UI/UX yang dipilih:
- Kerangka halaman: header sticky + `backdrop-blur`
- Sticky bottom action bar di form pesan
- Konfirmasi inline di dalam card (bukan modal)
- Rename in-place, expand/collapse manual
- Auto-hydrate dari localStorage
- `GeneratingIndicator` dengan teks bergilir

Yang berubah **hanya tampilannya** (radius, shadow, spacing) mengikuti §3–§4, bukan pola interaksinya. Semua pola di atas juga sudah secara alami mobile-first (sticky bottom bar, panel inline, bukan hover/modal) — lihat §2 untuk penegasannya secara eksplisit.

---

## 6. Ringkasan perubahan (diff cepat dari v1)

| Aspek | v1 (lama) | v2 (baru) |
|---|---|---|
| Warna primary | Oranye `#d9711b` | Merah bata `#a83a22` |
| Warna danger | `#c8402c` (mirip primary lama) | `#9c2b3f` (digeser, hindari tabrakan dengan primary baru) |
| Font | Geist | Plus Jakarta Sans |
| Radius | 4+ nilai (`md`/`lg`/`full`/`xl`/`2xl`) | 2 nilai + pill (`10px` / `14px` / `full`) |
| Shadow | Ada (sangat tipis) di card & btn-primary | Dihapus total |
| Spacing gap | 8 nilai kontekstual | 4 nilai baku (`gap-2/3/4/6`) |
| Badge status | Pill berlatar warna | Teks + dot kecil (kecuali avatar nomor urut) |
| Emoji | Dipakai luas (ikon + label tombol) | Dibatasi ke momen (splash/empty/sukses), aksi fungsional pakai ikon garis |
| List padat (mis. menu) | Tumpukan `.card` bergap | `divide-y` dalam satu container, tanpa gap antar-card |
| Pola interaksi (konfirmasi, sticky bar, dst) | — | Tidak berubah |
| Target layar | Mobile-friendly (ada sisa asumsi desktop di beberapa `max-w-lg`) | **Mobile-only** — tidak ada breakpoint, tidak ada layout desktop sama sekali (§2) |