<div align="center">

# 🧠 What Do I Do?

**Your life, organized. No cloud. No drama. Just you.**

*A personal life-management app that actually keeps its mouth shut about your data.*

[![Node.js](https://img.shields.io/badge/Node.js-26+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

> 🌐 **Language / Bahasa:** [🇬🇧 English](#-english) · [🇮🇩 Indonesia](#-indonesia)

---

## 🇬🇧 English

### What is this?

Tired of juggling five different apps just to live your life? Habit tracker here, planner there, budget app somewhere else, and a notes app that has somehow become a graveyard of forgotten todos?

**What Do I Do** is a **local-first, single-user personal life-management system** that replaces all that noise with one integrated, opinionated app. It lives on *your* machine. It runs offline. Your data never leaves your device unless *you* decide so.

It's not trying to be Notion. It's not trying to upsell you anything. It's just a really solid tool that treats you like a capable adult.

---

### ✨ Features

| Module | What it does |
|---|---|
| 🏠 **Dashboard** | Your daily command center — discipline score, quick stats, and what's on today |
| 📥 **Inbox** | Frictionless quick-capture for anything on your mind, before your brain drops it |
| 📅 **Planner** | Time-block your schedule — the single source of truth for *when* things happen |
| ⏱️ **Activity Tracker** | Log what you *actually* did — sessions tracked, history preserved |
| ✅ **Tasks** | Your to-do list, no scheduling required |
| 🔁 **Habits** | Build and track repeating routines, streak and all |
| 🎯 **Goals** | Medium-to-long term targets that everything else links back to |
| 💰 **Money** | Personal finance tracking — income, expenses, budgets |
| 📖 **Life Log** | A read-only, chronological aggregate of everything that happened |
| 📊 **Analytics** | Cross-module pattern analysis — because raw data alone means nothing |
| 📈 **Statistics** | Raw numbers, records, and personal bests |
| 🏆 **Achievements** | Gamification that's actually earned, not handed out for breathing |
| 💡 **Insights** | Pattern-based recommendations derived from your own data |
| 🖥️ **Workspace** | Layout personalization — make it yours |
| ⚙️ **Settings** | Config, theme, data export/import |

---

### 🏗️ Tech Stack

This is a **monorepo** powered by npm workspaces with three packages: `server`, `client`, and `shared`.

```
what-do-i-do/
├── server/     # NestJS 11 (modular monolith) + Drizzle ORM + SQLite
├── client/     # React 19 + Vite 8 + TanStack Query + Zustand + Tailwind CSS v4
├── shared/     # Shared types + Zod validators (consumed by both ends)
├── mobile/     # Kotlin + Jetpack Compose (future — not active yet)
└── docs/       # Specs & technical documentation
```

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | 19 / 8 |
| Styling | Tailwind CSS | v4 |
| Server state | TanStack Query | v5 |
| Client UI state | Zustand | v5 |
| Icons | Lucide React | latest |
| Routing | React Router DOM | v7 |
| Date utilities | date-fns | v4 |
| Backend | NestJS | 11 |
| Database | SQLite via Drizzle ORM | – |
| Validation | Zod + class-validator | v4 |
| Cron jobs | node-cron | v4 |
| Runtime | Node.js | 26+ |
| Language | TypeScript (strict) | 6+ |

**Design language:** Claymorphism — rounded heavy surfaces, soft dual shadows, tactile UI that feels solid but warm. Fonts: **Quicksand** (headings), **Inter** (body), **IBM Plex Mono** (numbers & timers).

---

### 🚀 Quick Start

> **Requirements:** Node.js ≥ 26, npm ≥ 11

```bash
# 1. Clone
git clone <repo-url> && cd what-do-i-do

# 2. Install all workspace dependencies
npm install

# 3. Set up the database
npm run db:migrate -w server

# 4. Run dev server + client simultaneously
npm run dev
```

Open **http://localhost:5173** and you're in. ✅

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

### ⚙️ Available Scripts

```bash
# Development
npm run dev            # Start server + client concurrently (recommended)
npm run dev -w server  # Backend only
npm run dev -w client  # Frontend only

# Build & Test
npm run build          # Build all workspaces (shared → server → client)
npm run test           # Run server tests (Jest)
npm run lint           # TypeScript strict check across workspaces

# Database
npm run db:generate    # Generate Drizzle migrations from schema changes
npm run db:migrate     # Apply migrations → creates/updates .db file
npm run db:studio      # Open Drizzle Studio visual DB browser
```

---

### 🔒 Data Philosophy

- **Local-first, no excuses.** SQLite lives at `server/what-do-i-do.db`. No internet required, no account needed, no subscription.
- **Single-user per device.** Designed explicitly for that — no multi-tenant overhead, no permissions maze.
- **Export/import on your terms.** JSON dump and restore, whenever you want it.
- **Timer survives app-kills.** Activity Tracker writes state to disk, not RAM — your session is never silently lost.
- **Zero sync engine.** No complexity, no conflicts, no clock-skew nightmares.

---

### 🗺️ Module Architecture

Each type of data has exactly one owner module. No ambiguity, no two modules claiming the same truth:

| Data | Owner | Everyone else just... |
|---|---|---|
| Scheduled time (when something *will* happen) | **Planner** | references via `linked_planner_event_id` |
| Realized time (when something *actually* happened + duration) | **Activity Tracker** | references via `linked_session_id` |
| Work without a fixed time slot | **Tasks** | Planner copies a lightweight version when scheduling |
| Repeating rules | **Habits** | Planner generates events from habits, stores no repeat rules itself |
| Long-term targets | **Goals** | Others just link via `linked_goal_id` |
| Financial transactions | **Money** | Dashboard/Analytics reads aggregates only |
| "What happened today" narrative | **Life Log** | A view, not a table — aggregates Tracker + Planner + Money + Habits |

---

### 📱 Mobile (Coming Later)

The `mobile/` directory already exists as a placeholder for the Kotlin + Jetpack Compose port. Same SQLite schema, independent from the web app. Data portability via manual JSON export/import.

---

### 📄 Documentation Index

| File / Dir | Contents |
|---|---|
| `claude.md` | AI agent entry point — build order, conventions, gotchas |
| `design.md` | Full design system — claymorphism tokens, typography, spacing |
| `install.md` | Detailed step-by-step installation guide |
| `PRODUCT.md` | Product brief, target users, brand personality |
| `docs/` | Full spec files (architecture, all 15 modules, DB schema, sync model) |

---

## 🇮🇩 Indonesia

### Apa ini?

Capek punya lima aplikasi berbeda cuma buat ngelola hidup sehari-hari? Habit tracker di sini, planner di sana, aplikasi budget entah di mana, dan notes app yang udah jadi kuburan todo yang terlupakan?

**What Do I Do** adalah **aplikasi personal life-management yang local-first** — menggantikan semua kekacauan itu dengan satu sistem terintegrasi. Berjalan di mesin *kamu*. Bisa offline. Data tidak pernah keluar dari device kecuali kamu yang minta.

Bukan Notion. Tidak ada upsell. Tidak ada fitur "premium" di balik paywall. Hanya alat yang serius dan memperlakukan kamu sebagai orang dewasa yang capable.

---

### ✨ Fitur

| Modul | Fungsi |
|---|---|
| 🏠 **Dashboard** | Pusat komando harian — discipline score, ringkasan cepat, agenda hari ini |
| 📥 **Inbox** | Quick capture tanpa friksi — buang pikiran ke sini sebelum otakmu melupakannya |
| 📅 **Planner** | Time-block jadwal — satu-satunya sumber kebenaran soal *kapan* sesuatu terjadi |
| ⏱️ **Activity Tracker** | Catat apa yang *benar-benar* kamu lakukan — waktu terukur, histori sesi tersimpan |
| ✅ **Tasks** | Daftar kerja tanpa perlu waktu spesifik |
| 🔁 **Habits** | Bangun dan lacak kebiasaan berulang, lengkap dengan streak |
| 🎯 **Goals** | Target jangka menengah–panjang yang jadi acuan semua modul lain |
| 💰 **Money** | Pencatatan keuangan pribadi — pemasukan, pengeluaran, budget |
| 📖 **Life Log** | Timeline kronologis agregat dari semua yang terjadi hari ini |
| 📊 **Analytics** | Analisis pola lintas modul — karena data mentah saja tidak cukup berarti |
| 📈 **Statistics** | Angka mentah, record pribadi, personal best |
| 🏆 **Achievements** | Gamification yang harus benar-benar diraih, bukan dibagi-bagikan gratis |
| 💡 **Insights** | Rekomendasi berbasis pola dari data kamu sendiri |
| 🖥️ **Workspace** | Personalisasi layout aplikasi sesuai selera |
| ⚙️ **Settings** | Konfigurasi, tema, export/import data |

---

### 🏗️ Tech Stack

Monorepo menggunakan npm workspaces dengan tiga package: `server`, `client`, dan `shared`.

```
what-do-i-do/
├── server/     # NestJS 11 (modular monolith) + Drizzle ORM + SQLite
├── client/     # React 19 + Vite 8 + TanStack Query + Zustand + Tailwind CSS v4
├── shared/     # Types bersama + Zod validators (dipakai kedua sisi)
├── mobile/     # Kotlin + Jetpack Compose (masa depan, belum aktif)
└── docs/       # Spek & dokumentasi teknis
```

| Layer | Teknologi | Versi |
|---|---|---|
| Frontend | React + Vite | 19 / 8 |
| Styling | Tailwind CSS | v4 |
| State server | TanStack Query | v5 |
| State UI client | Zustand | v5 |
| Icons | Lucide React | terbaru |
| Routing | React Router DOM | v7 |
| Utilitas tanggal | date-fns | v4 |
| Backend | NestJS | 11 |
| Database | SQLite via Drizzle ORM | – |
| Validasi | Zod + class-validator | v4 |
| Cron jobs | node-cron | v4 |
| Runtime | Node.js | 26+ |
| Bahasa | TypeScript (strict) | 6+ |

**Visual language:** Claymorphism — permukaan membulat tebal, bayangan ganda lembut, terasa tactile dan solid tapi hangat. Font: **Quicksand** (heading), **Inter** (body), **IBM Plex Mono** (angka & timer).

---

### 🚀 Quick Start

> **Syarat:** Node.js ≥ 26, npm ≥ 11

```bash
# 1. Clone repo
git clone <repo-url> && cd what-do-i-do

# 2. Install semua dependencies (semua workspace sekaligus)
npm install

# 3. Setup database
npm run db:migrate -w server

# 4. Jalankan server + client bersamaan
npm run dev
```

Buka **http://localhost:5173** dan aplikasi siap dipakai. ✅

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

---

### ⚙️ Scripts yang Tersedia

```bash
# Development
npm run dev            # Jalankan server + client bersamaan (rekomendasi)
npm run dev -w server  # Backend saja
npm run dev -w client  # Frontend saja

# Build & Test
npm run build          # Build semua workspace (shared → server → client)
npm run test           # Jalankan test server (Jest)
npm run lint           # TypeScript strict check di semua workspace

# Database
npm run db:generate    # Generate migrasi Drizzle dari perubahan schema
npm run db:migrate     # Jalankan migrasi → buat/update file .db
npm run db:studio      # Buka Drizzle Studio, browser database visual
```

---

### 🔒 Filosofi Data

- **Local-first, tanpa pengecualian.** SQLite ada di `server/what-do-i-do.db`. Tidak butuh internet, tidak butuh akun, tidak ada langganan.
- **Satu user per device.** Dirancang eksplisit untuk itu — tidak ada overhead multi-tenant.
- **Export/import sesuai keinginanmu.** Dump dan restore JSON, kapan saja.
- **Timer tahan app-kill.** Activity Tracker tulis state ke disk, bukan RAM — sesi tidak pernah hilang diam-diam.
- **Nol sync engine.** Tidak ada kompleksitas, tidak ada konflik, tidak ada kejutan.

---

### 🗺️ Arsitektur Modul (Source of Truth)

Setiap jenis data punya satu pemilik tunggal. Tidak ada ambiguitas, tidak ada dua modul yang sama-sama mengklaim kebenaran yang sama:

| Data | Pemilik | Modul lain hanya... |
|---|---|---|
| Waktu terjadwal (kapan sesuatu *akan* terjadi) | **Planner** | referensi via `linked_planner_event_id` |
| Waktu terealisasi (kapan sesuatu *benar-benar* terjadi + durasi) | **Activity Tracker** | referensi via `linked_session_id` |
| Kerja tanpa waktu spesifik | **Tasks** | Planner salin versi ringan saat dijadwalkan |
| Aturan pengulangan | **Habits** | Planner generate event dari habit, tidak simpan aturan sendiri |
| Target jangka panjang | **Goals** | Modul lain hanya link via `linked_goal_id` |
| Transaksi keuangan | **Money** | Dashboard/Analytics baca agregat saja |
| Narasi "apa yang terjadi hari ini" | **Life Log** | View agregat — bukan tabel sendiri. Gabungan dari Tracker + Planner + Money + Habits |

---

### 📱 Mobile (Segera Menyusul)

Folder `mobile/` sudah ada sebagai placeholder untuk porting Kotlin + Jetpack Compose. Skema SQLite yang sama, independen dari web app. Portabilitas data via export/import JSON manual.

---

### 📄 Indeks Dokumentasi

| File / Dir | Isi |
|---|---|
| `claude.md` | Entry point untuk AI agent — urutan build, konvensi, gotcha |
| `design.md` | Design system lengkap — token claymorphism, tipografi, spacing |
| `install.md` | Panduan instalasi step-by-step yang detail |
| `PRODUCT.md` | Brief produk, target user, brand personality |
| `docs/` | File spek lengkap (arsitektur, 15 modul, skema DB, model sync) |

---

<div align="center">

Made with 🧠 + ☕ &nbsp;·&nbsp; Local-first, always &nbsp;·&nbsp; Your data stays yours

</div>
