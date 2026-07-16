# Install — What Do I Do

Panduan setup lokal untuk **What Do I Do**, aplikasi personal life-management local-first.

> **Stack:** NestJS 11 (modular monolith) + React 19 + Vite 8 + SQLite (Drizzle ORM)  
> **Runtime:** Node.js 26+, npm 11+  
> **Mobile:** Kotlin + Jetpack Compose (future — lihat catatan di akhir)

---

## 1. Prerequisites

| Tool | Version | Cek |
|---|---|---|
| Node.js | `>=26` | `node --version` |
| npm | `>=11` | `npm --version` |

Install Node.js via [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
nvm install 26
nvm use 26
```

---

## 2. Clone & Struktur

```bash
git clone <repo-url> what-do-i-do
cd what-do-i-do
```

Struktur monorepo:

```
what-do-i-do/
├── package.json          # npm workspaces root
├── server/               # NestJS backend (modular monolith)
│   ├── src/
│   │   ├── modules/      # 15 domain modules
│   │   ├── drizzle/      # Schema + migrations
│   │   └── common/       # Guards, interceptors, filters
│   └── package.json
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Per-module pages
│   │   ├── components/   # Shared UI components
│   │   └── api/          # TanStack Query fetchers
│   └── package.json
├── shared/               # Types + validators (Zod)
│   └── src/
│       ├── types/
│       └── validators/
├── mobile/               # Kotlin (future)
│   └── app/
├── docs/                 # Dokumentasi & spesifikasi
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── install.md
└── README.md
```

---

## 3. Install Dependencies

### Root workspace (server + client + shared)

```bash
npm install
```

Perintah ini menginstall dependencies di semua workspace (`server/`, `client/`, `shared/`) melalui npm workspaces, plus `concurrently` dan `typescript` di root.

### What gets installed

**Server** (`server/package.json`):

| Package | Version | Fungsi |
|---|---|---|
| `@nestjs/core` | ^11.1.27 | Framework NestJS |
| `@nestjs/common` | ^11.1.27 | Decorators, guards, pipes |
| `@nestjs/platform-express` | ^11.1.27 | Express adapter |
| `drizzle-orm` | ^0.45.2 | ORM untuk SQLite |
| `better-sqlite3` | ^12.11.1 | SQLite driver |
| `zod` | ^4.4.3 | Validasi |
| `reflect-metadata` | ^0.2.2 | Decorators |
| `rxjs` | ^7.8.2 | Reactive extensions |

Dev:

| Package | Version | Fungsi |
|---|---|---|
| `@nestjs/cli` | ^11.0.23 | NestJS CLI |
| `@nestjs/testing` | ^11.1.27 | Test utilities |
| `drizzle-kit` | ^0.31.10 | Migration tool |
| `typescript` | ^6.0.3 | TypeScript compiler |
| `jest` | ^30.4.2 | Test runner |
| `ts-jest` | ^29.4.11 | Jest + TypeScript |
| `ts-node` | ^10.9.2 | TS execution |
| `supertest` | ^7.2.2 | HTTP test |
| `@types/better-sqlite3` | ^7.6.13 | Type definitions |
| `@types/node` | ^26.1.0 | Node.js types |
| `@types/express` | ^5.0.6 | Express types |

**Client** (`client/package.json`):

| Package | Version | Fungsi |
|---|---|---|
| `react` | ^19.2.7 | UI library |
| `react-dom` | ^19.2.7 | React DOM renderer |
| `react-router-dom` | ^7.18.1 | Routing |
| `@tanstack/react-query` | ^5.101.2 | Server state management |
| `zustand` | ^5.0.14 | Client state (theme, UI) |
| `date-fns` | ^4.4.0 | Date utilities |
| `lucide-react` | ^1.23.0 | Icons |

Dev:

| Package | Version | Fungsi |
|---|---|---|
| `vite` | ^8.1.3 | Build tool |
| `@vitejs/plugin-react` | ^6.0.3 | React plugin |
| `tailwindcss` | ^4.3.2 | CSS framework |
| `@tailwindcss/vite` | ^4.3.2 | Tailwind Vite plugin |
| `typescript` | ^6.0.3 | TypeScript |

**Shared** (`shared/package.json`):

| Package | Version | Fungsi |
|---|---|---|
| `zod` | ^4.4.3 | Validator schemas |

**Root** (`package.json`):

| Package | Version | Fungsi |
|---|---|---|
| `concurrently` | ^10.0.3 | Run server + client parallel |
| `typescript` | ^6.0.3 | Root TS config |

---

## 4. Database Setup

SQLite database digenerate otomatis di folder `server/` saat migration pertama.

```bash
# Generate migration dari Drizzle schema
npm run db:generate -w server

# Jalankan migration (buat file .db)
npm run db:migrate -w server
```

Database file: `server/what-do-i-do.db` (SQLite single file, tidak perlu install database server).

> **Catatan:** Migration idempoten — aman dijalankan ulang.

---

## 5. Run Dev Mode

Jalankan server + client bersamaan:

```bash
npm run dev
```

Output:

```
[server] ⚡ NestJS running on http://localhost:3000
[client]  ➜  Local:   http://localhost:5173
```

- **Server API:** `http://localhost:3000`
- **Client app:** `http://localhost:5173` (proxy API ke server)

Atau jalankan terpisah:

```bash
npm run dev -w server    # Backend only
npm run dev -w client    # Frontend only
```

---

## 6. Build

```bash
npm run build
```

Build output:

| Package | Output |
|---|---|
| `server/` | `server/dist/` |
| `client/` | `client/dist/` |
| `shared/` | `shared/dist/` |

---

## 7. Test

```bash
npm test
```

Menjalankan test server (Jest). Tambahkan `-w client` untuk client tests nanti.

---

## 8. Troubleshooting

| Masalah | Solusi |
|---|---|
| `better-sqlite3` build error | Pastikan build tools terinstall: `sudo pacman -S base-devel` (Arch) / `sudo apt install build-essential` (Debian) |
| Port 3000/5173 sudah dipakai | Set `SERVER_PORT=3001` atau `CLIENT_PORT=5174` di `.env` |
| `node: --experimental-loader` error | Pastikan Node.js >= 26 |
| `drizzle-kit` command not found | `npm install -w server` dulu |
| Workspace not found | Pastikan `package.json` root punya `"workspaces": ["server", "client", "shared"]` |

---

## 9. Mobile (Future)

Folder `mobile/` sudah ada sebagai placeholder untuk porting Kotlin + Jetpack Compose. Akan diisi setelah web stabil.

```bash
cd mobile
# Setup Android SDK + Gradle (dokumentasi menyusul)
```

Mobile **tidak** dipanggil oleh web — keduanya aplikasi independen dengan skema database paralel (SQLite native di mobile). Data porting via export/import JSON manual.

---

## 10. Environment Variables

Copy `.env.example` ke `.env` di root:

```
# Server
SERVER_PORT=3000
DATABASE_PATH=./server/what-do-i-do.db
JWT_SECRET=change-me-in-production

# Client
VITE_API_URL=http://localhost:3000
```

---

## Security Hardening

### Server Security (NestJS)

The server includes the following security hardening:

1. **Helmet.js** — Security headers middleware
   - Content Security Policy (CSP) configured for local-first development (allows inline styles/scripts for dev)
   - HSTS enabled only in production
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - X-XSS-Protection enabled
   - X-Powered-By header hidden

2. **Rate Limiting** — `@nestjs/throttler`
   - 100 requests per minute per IP (configurable via env)
   - Applied globally via `ThrottlerGuard`

3. **CORS** — Restricted to localhost in development
   - `CORS_ORIGIN` env var (default: `http://localhost:5173`)
   - Credentials allowed for auth cookies

4. **Server Binding** — Binds to `localhost` by default
   - `SERVER_HOST` env var (default: `localhost`)
   - **⚠️ WARNING**: Do not bind to `0.0.0.0` without additional authentication (e.g., Tailscale, VPN, or application-level auth)

### Environment Variables (Server)

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3000` | Server port |
| `SERVER_HOST` | `localhost` | Bind address — **do not use `0.0.0.0` without auth** |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | `production` enables strict CSP & HSTS |

---

## Quick Start (TL;DR)

```bash
# 1. Clone
git clone <repo-url> && cd what-do-i-do

# 2. Install
npm install

# 3. Database
npm run db:migrate -w server

# 4. Run
npm run dev
```

Buka `http://localhost:5173` — aplikasi siap dipakai.
