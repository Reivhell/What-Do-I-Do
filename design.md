# Design System — Claymorphism (Putih Primer × Biru Soft Secondary)

## Tujuan
Dokumen ini menetapkan bahasa visual tunggal untuk seluruh modul **What Do I Do** (`00-architecture.md` s.d. `15-settings.md`), supaya Dashboard, Inbox, Planner, Tasks, Habits, Money, dst. terasa seperti satu produk yang sama, bukan 15 layar yang dibangun sendiri-sendiri. Arah visual: **claymorphism** — permukaan tebal, empuk, membulat, seolah dibentuk dari tanah liat/dempul, dengan dua bayangan (terang di satu sisi, gelap di sisi lain) yang memberi kesan "timbul lembut" dari background, bukan flat dan bukan neumorphism abu-abu yang datar.

Kenapa claymorphism cocok untuk app ini: ini adalah *personal life-management app* yang dipakai berkali-kali sehari (Dashboard, Inbox harus render <1 detik, dipakai sebagai kebiasaan). Permukaan clay yang empuk dan "tap-able" secara visual menurunkan rasa berat sebuah app yang sebenarnya padat data (task, habit, uang, statistik) — setiap card terasa seperti tombol besar yang mengundang disentuh, bukan tabel yang mengintimidasi.

## Filosofi Warna: Putih sebagai Primer, Biru Soft sebagai Secondary
Kebanyakan referensi claymorphism di internet memakai background gradient warna-warni (ungu-pink, dsb). Untuk app ini itu **dihindari secara sengaja** — data finansial dan progress harian butuh netralitas, bukan visual yang riuh. Keputusannya:
- **Putih/off-white sebagai bidang dominan** (base, card, sheet) → menjaga keterbacaan angka (Money, Statistics) tetap tinggi meski permukaannya "clay".
- **Biru muda/soft sebagai satu-satunya keluarga warna aksen** untuk struktur (nav aktif, primary action, progress ring, highlight tanggal hari ini) → satu warna aksen konsisten di 15 modul, bukan warna berbeda tiap modul yang membuat produk terasa pecah.
- **Warna semantik (hijau/merah/oranye)** tetap dipakai tapi *hanya* untuk status (income/expense, budget alert, streak gagal) — dipertahankan minim saturasi supaya tidak bersaing dengan biru sebagai aksen utama.

## Design Tokens

### 1. Color

| Token | Hex | Peran |
|---|---|---|
| `--clay-bg` | `#F4F7FB` | Background utama aplikasi (bukan putih murni — putih murni bikin shadow clay hilang kontras) |
| `--clay-surface` | `#FFFFFF` | Permukaan card/panel/sheet (primer) |
| `--clay-surface-alt` | `#FAFCFE` | Permukaan sekunder di dalam card (nested clay, misal item list di dalam card) |
| `--blue-50` | `#EAF3FE` | Tint biru paling muda — background chip/badge inactive, hover state lembut |
| `--blue-100` | `#D3E7FD` | Fill untuk track progress bar/ring kosong |
| `--blue-300` | `#8FC1F7` | Border/outline aktif, icon sekunder |
| `--blue-500` | `#4A90E2` | **Secondary utama** — primary button, active nav, link, progress fill, focus ring |
| `--blue-700` | `#2C6CB8` | Teks di atas `--blue-50`/`--blue-100` (kontras aman), state pressed |
| `--ink-900` | `#1E2A3A` | Teks utama (bukan hitam pekat — hitam pekat kontras berlebihan di atas clay putih) |
| `--ink-500` | `#5B6B7D` | Teks sekunder/caption |
| `--ink-300` | `#9AA8B8` | Placeholder, disabled text |
| `--clay-shadow-dark` | `rgba(163, 177, 199, 0.45)` | Sisi gelap bayangan clay |
| `--clay-shadow-light` | `rgba(255, 255, 255, 0.9)` | Sisi terang bayangan clay (highlight) |
| `--semantic-green` | `#5FB88A` | Income, completed, streak aktif |
| `--semantic-red` | `#E28080` | Expense, overdue, missed |
| `--semantic-amber` | `#E3B15C` | Budget alert, reminder mendekat |

Aturan: **tidak ada warna gelap solid sebagai background section** di seluruh app (tidak ada dark hero/sidebar hitam) — ini yang membuat "putih sebagai primer" konsisten sampai ke Settings > theme dark mode (lihat bagian Dark Mode).

### 2. Typography
Dua peran font, sengaja bukan pasangan default (Inter+Inter):

| Peran | Font | Alasan |
|---|---|---|
| Display/heading (judul modul, angka besar di Dashboard/Money) | **Quicksand** (600/700) | Terminal huruf yang membulat secara alami menyambung visual dengan bentuk clay yang membulat — satu-satunya font di daftar ini yang "terlihat empuk" tanpa perlu efek tambahan |
| Body/UI (label, deskripsi, form) | **Inter** (400/500/600) | Netral, sangat terbaca di ukuran kecil — dibutuhkan karena app ini padat data (list task, transaksi, log habit) |
| Angka/monospace (durasi timer, saldo, statistik) | **IBM Plex Mono** (500) | Angka finansial & durasi butuh tabular alignment supaya kolom angka rapi berbaris, terutama di Money dan Statistics |

Skala:
```
Display   32px / 40px   Quicksand 700   — angka utama Dashboard (saldo hari ini, discipline score)
H1        24px / 32px   Quicksand 600   — judul halaman modul
H2        18px / 26px   Quicksand 600   — judul card/section
Body      15px / 22px   Inter 400       — isi umum
Body Sm   13px / 18px   Inter 400       — caption, meta info (tanggal, tag)
Label     12px / 16px   Inter 600, uppercase, letter-spacing 0.04em — label field, status badge
Numeric   20px / 24px   IBM Plex Mono 500 — angka saldo, timer, streak count
```

### 3. Spacing & Grid
Skala 4px: `4, 8, 12, 16, 24, 32, 48, 64`. Card claymorphism butuh padding lega supaya bayangan ganda tidak terasa "sesak" — minimum padding internal card = `20px` (bukan `16px` seperti flat design biasa).

### 4. Radius (elemen kunci claymorphism)
Radius besar konsisten memberi kesan "dibentuk", bukan "dipotong":
```
--radius-sm   14px   — chip, badge, input kecil
--radius-md   20px   — button, input field, list item
--radius-lg   28px   — card, modal sheet
--radius-xl   36px   — widget besar Dashboard, avatar container
--radius-pill 999px  — FAB (quick capture), toggle, tag bulat penuh
```
Tidak pernah 0px/4px tajam di komponen interaktif manapun — sudut tajam hanya dipakai di elemen non-interaktif seperti divider garis tipis.

### 5. Shadow / Elevation (resep clay)
Tiga level, semua dua-tone (terang kiri-atas, gelap kanan-bawah), light source konsisten dari kiri atas di seluruh app:

```css
/* Level 1 — resting card (list item, chip) */
box-shadow:
  6px 6px 12px var(--clay-shadow-dark),
  -6px -6px 12px var(--clay-shadow-light);

/* Level 2 — elevated card (Dashboard widget, modal) */
box-shadow:
  10px 10px 20px var(--clay-shadow-dark),
  -8px -8px 18px var(--clay-shadow-light);

/* Level 3 — pressed / active (button ditekan, tab aktif) */
/* dibalik jadi inset supaya terasa "ditekan masuk" ke permukaan */
box-shadow:
  inset 4px 4px 8px var(--clay-shadow-dark),
  inset -4px -4px 8px var(--clay-shadow-light);
```
Level 3 dipakai untuk semua state `:active`/`pressed` — ini yang membedakan claymorphism dari flat design bertepi: elemen benar-benar "masuk" ke background saat ditekan, lalu kembali ke Level 1/2 saat dilepas.

## Komponen Dasar

**Button**
- Primary: fill `--blue-500`, teks putih, radius `--radius-md`, shadow Level 1; hover → shadow Level 2 + translateY(-1px); pressed → shadow Level 3 (inset), translateY(0).
- Secondary: fill `--clay-surface`, teks `--blue-700`, border tipis `--blue-100`, shadow Level 1 (lebih halus).
- Destructive (delete task/transaction): fill `--clay-surface`, teks `--semantic-red`, shadow sama seperti secondary — warna merah tidak boleh jadi fill penuh supaya tidak menyamai urgency alert sistem.
- FAB Quick Capture (Inbox, lihat `02-inbox-capture.md`): radius `--radius-pill`, ukuran 56px, shadow Level 2, selalu fill `--blue-500` — satu-satunya FAB di seluruh app supaya "titik masuk cepat" ini punya bahasa visual unik.

**Input / Form Field**
- Background `--clay-surface-alt`, bukan putih penuh, dengan shadow Level 3 permanen (inset tipis) — field terlihat seperti "lubang" di permukaan clay, bukan kotak mengambang. Ini kebalikan dari card (yang timbul) secara sengaja, supaya user langsung membedakan "area isi" vs "area lihat" tanpa perlu label.
- Focus: border `--blue-500` 2px + halo `--blue-50` 4px di luar (bukan shadow clay tambahan, supaya jelas dan tetap accessible).

**Card / Widget (Dashboard, Tasks list, Habit item, Transaction row)**
- Radius `--radius-lg`, shadow Level 1 (list) atau Level 2 (widget besar Dashboard), background `--clay-surface`.
- Tap seluruh card = target utama (bukan cuma judul) — konsisten dengan `01-dashboard.md` ("Tap card → masuk ke modul detail").

**Progress Ring / Bar (Habit streak, Goal progress, Budget usage)**
- Track kosong: `--blue-100`. Fill: gradient tipis `--blue-300 → --blue-500` mengikuti arah searah jarum jam. Ring dibungkus card clay Level 1 agar tetap konsisten dengan bahasa visual card lain, bukan ring polos mengambang.

**Navigation (sidebar web / bottom nav mobile)**
- Container nav sendiri adalah satu clay surface besar (Level 2), bukan garis pemisah flat. Item aktif = pill `--blue-50` fill + icon/teks `--blue-700`, item non-aktif = transparan, icon `--ink-500`.

**Badge / Status Chip** (status Task, RecurringBill paid/unpaid, dsb.)
- Radius `--radius-sm`, padding `4px 10px`, fill tint semantik 15% opacity di atas `--clay-surface`, teks solid warna semantiknya. Tidak pakai shadow clay (elemen kecil, shadow ganda bikin noise).

**Modal / Bottom Sheet** (convert Inbox item, add transaction, dsb.)
- Radius `--radius-lg` di sisi atas saja untuk bottom sheet, shadow Level 2 kuat karena harus terasa "melayang" di atas konten lain, backdrop `--ink-900` @ 35% opacity (bukan hitam pekat).

**Empty State** (Inbox kosong, belum ada transaksi, dsb.)
- Ilustrasi garis sederhana dengan aksen `--blue-300`, bukan ilustrasi flat penuh warna — supaya tetap dalam keluarga biru soft, tidak memperkenalkan palet baru hanya untuk empty state.

## Penerapan Ringkas per Modul

| Modul | Elemen clay yang menonjol |
|---|---|
| Dashboard (`01`) | Widget grid = kumpulan card Level 2; Current Activity Card pakai Level 2 + progress ring live timer; Discipline Score pakai Numeric type IBM Plex Mono besar |
| Inbox/Capture (`02`) | FAB pill biru sebagai satu-satunya elemen "berat" di layar — sisanya list item Level 1 flat-ish supaya tidak menghambat kecepatan input (<1 detik target) |
| Planner (`03`) | Grid kalender: sel hari ini = clay inset halus `--blue-50`; event card draggable = Level 1, saat di-drag naik ke Level 2 sementara |
| Tasks (`05`) | List item Level 1; checkbox custom bentuk pill radius penuh, checked state = fill `--blue-500` + inset check putih |
| Habits (`06`) | Streak counter = Numeric mono besar di dalam badge pill `--blue-50` |
| Money (`08`) | Balance card = Level 2 paling menonjol di seluruh app (satu-satunya widget dengan shadow lebih kuat dari Dashboard), transaksi list = Level 1 tipis, income/expense pakai semantic color hanya pada angka & icon, bukan background baris penuh |
| Workspace/Settings (`14`,`15`) | Toggle widget visibility pakai switch pill clay (track inset, thumb timbul Level 1) |

## Motion
- Durasi standar `180ms`, easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (sedikit overshoot) khusus untuk transisi resting↔pressed clay — memperkuat kesan "empuk memantul", tapi **hanya** dipakai di elemen yang ditekan langsung (button, card tap, toggle). Drag-and-drop di Planner tidak pakai overshoot (harus terasa presisi, bukan kenyal), memakai easing linear/standard `ease-out`.
- Hormati `prefers-reduced-motion`: matikan overshoot & translateY hover, sisakan transisi shadow saja.

## Dark Mode (mengikuti `theme: light|dark` di `15-settings.md`)
Prinsip "putih sebagai primer" tidak diartikan literal di dark mode — yang dipertahankan adalah *strukturnya* (permukaan netral + satu aksen biru), bukan warna putihnya:
```
--clay-bg        → #1B222C
--clay-surface   → #232B37
--blue-500       → #5B9EE8   (dinaikkan sedikit terangnya untuk kontras di gelap)
--clay-shadow-dark  → rgba(0,0,0,0.55)
--clay-shadow-light → rgba(255,255,255,0.05)
```
Efek clay di dark mode jadi lebih halus (highlight terang tidak bisa seterang light mode) — ini disengaja, bukan bug: clay yang terlalu terang di layar gelap merusak kontras teks di atasnya.

## Accessibility
- Kontras teks: `--ink-900` di atas `--clay-bg`/`--clay-surface` = rasio ≥ 12:1. `--blue-700` di atas `--blue-50` dipakai khusus untuk teks di atas tint biru (rasio ≥ 4.6:1) — **jangan** pakai `--blue-500` sebagai warna teks di atas `--blue-50`, kontrasnya gagal AA.
- Shadow clay tidak boleh jadi satu-satunya penanda interaktif — semua elemen tap-able tetap butuh state focus outline (`2px solid --blue-500`) untuk navigasi keyboard, karena bayangan lembut tidak selalu terlihat jelas oleh low-vision user.
- Ukuran target sentuh minimum 44×44px tetap berlaku di dalam card clay manapun (padding internal card sudah dihitung supaya ini terpenuhi tanpa memperbesar card).

## Implementasi (CSS variables siap pakai)
```css
:root {
  --clay-bg: #F4F7FB;
  --clay-surface: #FFFFFF;
  --clay-surface-alt: #FAFCFE;
  --blue-50: #EAF3FE;
  --blue-100: #D3E7FD;
  --blue-300: #8FC1F7;
  --blue-500: #4A90E2;
  --blue-700: #2C6CB8;
  --ink-900: #1E2A3A;
  --ink-500: #5B6B7D;
  --ink-300: #9AA8B8;
  --clay-shadow-dark: rgba(163, 177, 199, 0.45);
  --clay-shadow-light: rgba(255, 255, 255, 0.9);
  --semantic-green: #5FB88A;
  --semantic-red: #E28080;
  --semantic-amber: #E3B15C;

  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-xl: 36px;
  --radius-pill: 999px;
}

.clay-level-1 {
  box-shadow: 6px 6px 12px var(--clay-shadow-dark), -6px -6px 12px var(--clay-shadow-light);
}
.clay-level-2 {
  box-shadow: 10px 10px 20px var(--clay-shadow-dark), -8px -8px 18px var(--clay-shadow-light);
}
.clay-pressed {
  box-shadow: inset 4px 4px 8px var(--clay-shadow-dark), inset -4px -4px 8px var(--clay-shadow-light);
}
```

## Catatan Konsistensi Lintas Dokumen
Dokumen ini melengkapi `00-architecture.md` di layer **presentasi** saja — tidak mengubah data model atau API outline di `01-15`. Setiap kali modul baru ditambahkan, cek dulu ke tabel token di atas sebelum menambah warna/radius/shadow baru; kalau ada kebutuhan visual yang belum tercakup di sini, dokumen ini yang diperbarui duluan, bukan menambah nilai ad-hoc di komponen.
