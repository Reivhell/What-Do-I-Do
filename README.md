# What Do I Do

> Personal life-management app — satu sistem untuk perencanaan waktu, task, habit, goal, keuangan, dan analisis diri yang saling terhubung.

**Local-first. Single-user per device. Tanpa cloud, tanpa sync otomatis.**
Data kamu tetap di mesin kamu sendiri, tersimpan dalam satu file SQLite.

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Prinsip Desain](#prinsip-desain)
- [Tech Stack](#tech-stack)
- [Struktur Monorepo](#struktur-monorepo)
- [Modul Aplikasi](#modul-aplikasi)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Script yang Tersedia](#script-yang-tersedia)
- [Dokumentasi Lengkap](#dokumentasi-lengkap)
- [Roadmap](#roadmap)
- [Kontribusi](#kontribusi)

---

## Tentang Proyek

**What Do I Do** lahir dari kebutuhan sederhana: kebanyakan aplikasi produktivitas memisahkan planner, task list, habit tracker, goal tracker, dan pencatatan keuangan menjadi aplikasi-aplikasi terpisah yang tidak saling "ngobrol". Akibatnya, data terserak dan gambaran hidup yang utuh jadi susah dilihat.

Proyek ini mencoba menyatukan semuanya dalam satu sistem dengan aturan kepemilikan data yang jelas antar modul — tidak ada dua modul yang sama-sama mengklaim jadi sumber kebenaran untuk data yang sama.

## Prinsip Desain

Aturan pemisahan modul berikut ini **final** dan dipakai konsisten di seluruh aplikasi:

| Data | Pemilik Tunggal (Source of Truth) | Modul Lain Hanya... |
|---|---|---|
| Waktu terjadwal (kapan sesuatu **akan** terjadi) | **Planner** | referensi via `linked_planner_event_id` |
| Waktu terealisasi (kapan sesuatu **benar-benar** terjadi + durasi) | **Activity Tracker** | referensi via `linked_session_id` |
| Daftar kerja tanpa waktu spesifik | **Tasks** | Planner mengambil salinan ringan saat dijadwalkan |
| Kebiasaan & aturan pengulangan | **Habits** | Planner men-generate event dari habit |
| Target jangka panjang | **Goals** | Habits/Tasks/Planner hanya `linked_goal_id` |
| Transaksi keuangan | **Money** | Dashboard/Analytics hanya membaca agregat |
| Narasi "apa yang terjadi hari ini" | **Life Log** | View gabungan (bukan tabel sendiri) dari Activity Tracker + Planner + Money + Habits |

### Kenapa SQLite, bukan Postgres?

Proyek ini sudah melalui evaluasi Postgres (multi-tenant cloud) vs SQLite (local-first single-user). SQLite via **Drizzle ORM** dimenangkan karena:

- Selalu 1 user per file database — keunggulan konkurensi tinggi Postgres tidak relevan
- Skala data realistis (puluhan ribu baris/tabel bahkan untuk 2+ tahun pemakaian) jauh di bawah batas praktis SQLite
- Cold-start < 1 detik, tanpa proses server terpisah
- Tidak ada kebutuhan sync antar device di fase ini (export/import manual)
- Operasional sederhana: satu file, tidak ada database server untuk di-install/di-maintain user

Detail evaluasi lengkap ada di [`docs/superpowers/specs/00-architecture.md`](docs/superpowers/specs/00-architecture.md).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | NestJS 11 (modular monolith) |
| Frontend | React 19 + Vite 8 |
| Database | SQLite via Drizzle ORM |
| State (server) | TanStack Query |
| State (client) | Zustand |
| Styling | Tailwind CSS v4 |
| Validasi | Zod |
| Testing | Jest + Supertest |
| Mobile (rencana) | Kotlin + Jetpack Compose |

**Runtime:** Node.js ≥ 26, npm ≥ 11

## Struktur Monorepo

```
what-do-i-do/
├── package.json          # npm workspaces root
├── server/               # NestJS backend (modular monolith)
│   ├── src/
│   │   ├── modules/      # domain modules (planner, tasks, habits, dst.)
│   │   ├── drizzle/      # Schema + migrations
│   │   └── common/       # Guards, interceptors, filters
│   └── package.json
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Per-module pages
│   │   ├── components/    # Shared UI components
│   │   └── api/           # TanStack Query fetchers
│   └── package.json
├── shared/                 # Types + validators (Zod), dipakai server & client
├── mobile/app/              # Kotlin + Jetpack Compose (future — belum aktif)
├── task/                   # Task/spesifikasi kerja terkait
├── docs/superpowers/specs/  # Spesifikasi produk & teknis per modul (19 dokumen)
├── design.md                 # Bahasa desain "Soft Cloud Claymorphism"
├── install.md                 # Panduan instalasi & setup lengkap
├── PRODUCT.md                  # Spesifikasi produk
└── claude.md                    # Entry point untuk AI coding agent
```

## Modul Aplikasi

| # | Modul | Peran |
|---|---|---|
| 01 | Dashboard | Ringkasan utama, entry point aplikasi |
| 02 | Inbox / Capture | Quick capture tanpa friksi |
| 03 | Planner | Pemilik tunggal jadwal waktu |
| 04 | Activity Tracker | Realisasi waktu terstruktur |
| 05 | Tasks | Daftar kerja tanpa jadwal wajib |
| 06 | Habits | Kebiasaan berulang |
| 07 | Goals | Target jangka menengah-panjang |
| 08 | Money | Keuangan pribadi |
| 09 | Life Log | Timeline agregat read-only |
| 10 | Analytics | Analisis pola lintas modul |
| 11 | Statistics | Angka mentah & record |
| 12 | Achievements | Gamification |
| 13 | Insights | Rekomendasi berbasis pola |
| 14 | Workspace | Personalisasi layout |
| 15 | Settings | Konfigurasi & akun |

Spesifikasi detail tiap modul (data model, fitur, integrasi antar modul, API outline, non-functional notes) ada di `docs/superpowers/specs/`.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Reivhell/What-Do-I-Do.git
cd What-Do-I-Do

# 2. Install semua dependency (server + client + shared)
npm install

# 3. Setup database (generate & jalankan migration Drizzle)
npm run db:migrate -w server

# 4. Jalankan server + client bersamaan
npm run dev
```

Setelah `npm run dev`:

- **Server API** → `http://localhost:3000`
- **Client app** → `http://localhost:5173`

Buka `http://localhost:5173` di browser — aplikasi siap dipakai.

> Panduan instalasi lengkap (termasuk daftar dependency per workspace dan troubleshooting) ada di [`install.md`](install.md).

## Environment Variables

Copy `.env.example` menjadi `.env` di root:

```env
# Server
SERVER_PORT=3000
DATABASE_PATH=./server/what-do-i-do.db
JWT_SECRET=change-me-in-production

# Client
VITE_API_URL=http://localhost:3000
```

## Script yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server + client bersamaan |
| `npm run build` | Build seluruh workspace (`shared` → `server` → `client`) |
| `npm run lint` | Lint server + client |
| `npm test` | Jalankan test server (Jest) |
| `npm run db:generate -w server` | Generate migration dari Drizzle schema |
| `npm run db:migrate -w server` | Jalankan migration database |
| `npm run db:studio -w server` | Buka Drizzle Studio untuk inspeksi database |

## Dokumentasi Lengkap

| Dokumen | Isi |
|---|---|
| [`claude.md`](claude.md) | Entry point untuk AI coding agent (Claude Code, Cursor, dll.) — urutan build, konvensi wajib, peta dependency antar modul |
| [`PRODUCT.md`](PRODUCT.md) | Spesifikasi produk |
| [`design.md`](design.md) | Bahasa desain "Soft Cloud Claymorphism" — warna, shadow, komponen UI |
| [`install.md`](install.md) | Panduan setup & instalasi lengkap |
| [`docs/superpowers/specs/`](docs/superpowers/specs) | Spesifikasi teknis per modul (arsitektur, skema database, offline strategy, dll.) |

> **Menggunakan AI coding agent?** Baca `claude.md` terlebih dahulu sebelum file lain — dokumen ini merangkum urutan build per fase dan gotcha penting yang tersebar di seluruh spesifikasi, supaya tidak perlu disimpulkan sendiri dari nol.

## Roadmap

- [x] Spesifikasi produk & arsitektur (15 modul + skema database)
- [x] Keputusan final: local-first, SQLite via Drizzle
- [ ] Implementasi backend NestJS (modular monolith)
- [ ] Implementasi frontend React + Vite
- [ ] Export/import data manual (data portability)
- [ ] Porting mobile (Kotlin + Jetpack Compose)

## Kontribusi

Proyek ini masih dalam tahap pengembangan aktif dan bersifat personal. Issue dan diskusi tetap terbuka jika ada masukan.

---

<sub>Dibangun dengan NestJS, React, dan SQLite — didesain untuk hidup sepenuhnya di perangkat kamu sendiri.</sub>
