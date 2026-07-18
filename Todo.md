# TODO — What Do I Do

Hasil audit menyeluruh terhadap kondisi repo saat ini (commit `4a1d97a`), dilakukan dengan menjalankan `npm install`, `lint`, `build`, dan `test` yang sesungguhnya — bukan cuma baca kode. Setiap temuan di bawah sudah direproduksi langsung dan disertai bukti (perintah + output relevan), supaya tidak perlu diverifikasi ulang dari nol.

> **Catatan lingkungan audit**: dijalankan di sandbox tanpa akses ke `nodejs.org`, jadi `better-sqlite3` tidak bisa di-compile dari source di sini. Semua temuan di bawah **tidak bergantung pada itu** (murni TypeScript/build-config/test-infra) kecuali disebutkan eksplisit di bagian "Tidak Terverifikasi".

---

## 🔴 P0 — Blocking (build/test rusak, harus diperbaiki sebelum kerja lain)

### 1. `shared/tsconfig.tsbuildinfo` ter-commit ke git, merusak build `client` di fresh clone
**Bukti:**
```
$ git ls-files | grep tsbuildinfo
shared/tsconfig.tsbuildinfo

$ grep tsbuildinfo .gitignore
*.tsbuildinfo
```
File ini seharusnya di-gitignore (aturan sudah ada), tapi sudah kadung ter-track sebelum aturan itu ditambahkan (kemungkinan `git add -f`). Akibatnya: `tsc --build` di package `shared` melihat tsbuildinfo dan mengira `dist/` sudah up-to-date, padahal `dist/` sendiri di-gitignore dan **tidak pernah benar-benar dibuat** di fresh clone. Semua consumer `shared` (yaitu `client`) langsung gagal resolve tipe (`TS6305`) secara berantai — puluhan false-positive error yang menutupi bug asli.

**Fix:**
```bash
git rm --cached shared/tsconfig.tsbuildinfo
git commit -m "fix: untrack stale shared/tsconfig.tsbuildinfo"
```
Setelah itu pastikan tidak ada `*.tsbuildinfo` lain yang ter-track: `git ls-files | grep tsbuildinfo` harus kosong.

**Dampak ke CI**: job `client-lint-and-test` di `.github/workflows/ci.yml` jalan di working-directory `./client` sendirian tanpa build `shared` dulu — kemungkinan besar **CI kalian sedang merah** di GitHub Actions sejak commit terakhir. Cek tab Actions untuk konfirmasi.

---

### 2. `npm run build -w client` gagal total — bug nyata di modul Tasks
Setelah masalah #1 diperbaiki (shared benar-benar ter-build), sisa error TypeScript **bukan noise** — ini bug asli, semua terisolasi ke 4 file di `client/src/components/tasks/`:

| File | Error | Penjelasan |
|---|---|---|
| `TaskDetailModal.tsx:170-180` | `Cannot find name 'category'` / `'setCategory'` / `'project'` / `'setProject'` | Variabel dipakai di JSX tapi **tidak pernah dideklarasikan** — sisa refactor yang belum dibersihkan. Kalau lolos ke production build, ini akan crash runtime. |
| `TaskDetailModal.tsx:234`, `TaskRow.tsx:65,132,173,177` | `Property 'completed' does not exist on type 'Subtask'. Did you mean 'isCompleted'?` | Field yang benar di `shared/src/types/tasks.ts` adalah `isCompleted`, tapi komponen ini masih pakai `completed` di 5 tempat berbeda. |
| `TaskQuickAdd.tsx:27` | `Type '"none"' is not assignable to type 'TaskPriority'` | `client/src/types/tasks.ts` (tipe lokal duplikat) sudah **divergen** dari `shared/src/types/tasks.ts` — versi client punya value `"none"` di enum `TaskPriority`, versi shared tidak. |
| `TaskRow.tsx:56,58,60,65` | `Object literal may only specify known properties, and 'data'/'taskId' does not exist in type ...` | Payload API call pakai shape `{ data: ... }` dan `{ taskId: ... }`, tidak cocok dengan tipe `UpdateTaskInput & { id: string }` / `UpdateSubtaskInput & { id: string }` yang sebenarnya. |
| `TaskDetailModal.tsx:70` | `Type 'TaskPriority' is not assignable to type 'TaskPriority | undefined'. Type '"none"' is not assignable...` | Konsekuensi lanjutan dari divergensi tipe di atas. |
| `TaskRow.tsx:132,168` | `'task.subtasks' is possibly 'undefined'` | Tidak ada null-check sebelum akses `task.subtasks`. |

**Root cause tunggal**: `client/src/types/tasks.ts` **tidak seharusnya ada** — ini duplikat manual dari `shared/src/types/tasks.ts` yang lama-lama menyimpang karena diedit terpisah. Modul lain (Goals, Habits, dll.) tidak punya masalah ini karena konsisten import dari `@whatdo/shared`.

**Fix yang direkomendasikan:**
1. Hapus `client/src/types/tasks.ts`, ganti semua importnya jadi `from '@whatdo/shared'`.
2. Ganti semua `subtask.completed` → `subtask.isCompleted` (5 lokasi).
3. Isi ulang state `category`/`project` di `TaskDetailModal.tsx` (atau hapus UI-nya kalau field itu memang belum ada di schema — cek `05-tasks.md`/`16-database-schema.md`, field ini **tidak ada** di skema `tasks` sama sekali, jadi kemungkinan besar ini fitur yang di-draft lalu ditinggal setengah jalan).
4. Perbaiki payload `TaskRow.tsx` supaya sesuai `UpdateTaskInput`/`UpdateSubtaskInput` asli dari `shared`.
5. Tambah null-check untuk `task.subtasks`.

**Cara verifikasi setelah fix**: `npm run build -w shared && npm run build -w client` harus keluar tanpa error.

---

### 3. 5 dari 10 test suite server crash — bug di migration script dari commit terakhir
**Bukti:**
```
$ npm test (di server/)
Test Suites: 5 failed, 5 passed, 10 total
Tests:       20 passed, 20 total   ← hanya DTO test yang lolos

SyntaxError: Identifier '__filename' has already been declared
  at server/src/scripts/run-migrations.ts:44
```

**Root cause** — `server/src/scripts/run-migrations.ts` baris 6:
```ts
const __filename = require.main!.filename;
const __dirname = path.dirname(__filename);
```
Di lingkungan CommonJS (yang dipakai Jest via `ts-jest`), `__filename` dan `__dirname` **sudah otomatis tersedia** dari Node module wrapper. Deklarasi ulang dengan `const` bentrok langsung — `SyntaxError`, bukan sekadar warning. Setiap test yang meng-import `drizzle.provider.ts` (yang meng-import script ini) langsung crash duluan sebelum sempat jalan.

Ini masuk dari commit paling baru di repo: **`4a1d97a feat(server): implement automated database migrations on startup`** — commit terakhir langsung merusak separuh test suite.

**Fix:**
```ts
// Ganti baris 6-7 jadi:
const scriptDir = path.dirname(require.main!.filename);
// lalu ganti semua pemakaian __dirname di file ini jadi scriptDir
```
Atau lebih simpel: hapus dua baris itu sama sekali kalau `__filename`/`__dirname` tidak benar-benar dipakai di tempat lain dalam file (cek dulu — dari isi file yang sudah dibaca, keduanya **tidak dipakai** sama sekali setelah dideklarasikan, jadi bisa langsung dihapus).

**Cara verifikasi**: `npm test -w server` harus jadi `10 failed → 0`, minimal tidak crash di level import.

---

## 🟡 P1 — High (bukan blocking build, tapi user-facing / security)

### 4. `HabitCard.test.tsx` — 6/6 test gagal karena `window.matchMedia` tidak di-mock
**Bukti:**
```
$ npm test -w client
FAIL src/components/habits/HabitCard.test.tsx (6 tests | 6 failed)
TypeError: window.matchMedia is not a function
  at getInitialTheme src/providers/ThemeProvider.tsx:17:17
```
`vitest.setup.ts` isinya cuma:
```ts
import '@testing-library/jest-dom/vitest';
```
Tidak ada polyfill `matchMedia`, padahal `ThemeProvider` manggil `window.matchMedia('(prefers-color-scheme: dark)')` buat deteksi dark mode default, dan jsdom tidak implement API itu secara default.

**Fix** — tambah di `vitest.setup.ts`:
```ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
```

---

### 5. Kerentanan keamanan dependency — 6 total (2 high)
**Bukti:** `npm audit`
| Package | Severity | Advisory | Fix |
|---|---|---|---|
| `multer` (via `@nestjs/platform-express`) | **High** ×2 | DoS via nested field names, DoS via incomplete cleanup of aborted uploads | `npm audit fix` — **non-breaking**, langsung aman dijalankan |
| `esbuild` (via `@esbuild-kit` → `drizzle-kit`) | Moderate ×4 | Dev server bisa terima request sembarang origin | `npm audit fix --force` — ini breaking change (install `drizzle-kit@0.18.1`), perlu ditest manual dulu sebelum apply |

**Rekomendasi**: jalankan `npm audit fix` (yang non-breaking) sekarang juga — cuma benerin `multer`, high-severity, tanpa resiko breaking apa pun. Untuk `esbuild`/`drizzle-kit`, tunda sampai ada waktu khusus testing migration tooling — jangan buru-buru breaking change di tengah audit.

---

## 🟢 P2 — Medium (gap kualitas, tidak blocking)

### 6. Test coverage server timpang parah — 8 dari 15 modul tanpa test sama sekali
**Bukti** — hasil hitung `find server/src/modules/$m -name "*.spec.ts"` + `server/test/unit|integration`:

| Modul | Status test |
|---|---|
| Tasks, Activity Tracker, Settings, Inbox, Habits, Goals, Money (DTO saja) | ✅ Ada unit/integration test |
| **Achievements** | ❌ 0 test |
| **Analytics** | ❌ 0 test |
| **Dashboard** | ❌ 0 test |
| **Insights** | ❌ 0 test |
| **Life Log** | ❌ 0 test |
| **Planner** | ❌ 0 test |
| **Statistics** | ❌ 0 test |
| **Workspace** | ❌ 0 test |

Yang paling berisiko justru **insight-layer** (Analytics, Statistics, Insights, Achievements) — modul dengan logika agregasi lintas-modul paling kompleks (window function, scoring, streak recompute), tapi paling sedikit dijaga test. `Planner` juga masuk kategori kritis karena jadi *source of truth* jadwal dan dipakai banyak modul lain (`00-architecture.md`).

**Rekomendasi urutan prioritas nulis test**: Planner → Analytics/Statistics (karena logic agregasinya paling gampang salah diam-diam) → Achievements (event hook chain-nya banyak, gampang regresi) → Dashboard/Insights/Workspace/Life Log (lebih tipis logikanya, risiko lebih rendah).

### 7. Tidak ada E2E suite yang ter-commit
`e2e/` di root cuma berisi `test-results/.last-run.json` — sisa artefak run lokal Playwright/sejenisnya, **bukan** suite yang ter-commit ke git. Tidak ada jaring pengaman untuk alur lintas modul (mis. Habit → generate Planner event → realize jadi Activity Session → muncul di Life Log). Satu-satunya E2E yang benar-benar ada adalah `server/test/import-export.e2e-spec.ts` (untuk fitur backup), itu pun scope-nya server-only, bukan full browser flow.

**Rekomendasi**: setup Playwright (root `e2e/` sudah nyiapin folder-nya, tinggal isi), minimal cover:
- Login/unlock PIN → buka Dashboard
- Capture di Inbox → convert jadi Task → jadwalkan ke Planner → realize jadi Activity Session
- Habit check-in → streak update → muncul di Life Log
- Export data → import ke instance kosong → data cocok

### 8. Field UI yang tidak ada di schema (`category`/`project` di Task)
Terkait temuan #2 — `TaskDetailModal.tsx` punya UI untuk field `category` dan `project` pada Task, tapi field ini **tidak ada** di `tasks` table (`16-database-schema.md` cuma punya `tags` sebagai JSON array, tidak ada `category`/`project` terpisah). Perlu keputusan produk: field ini mau ditambah ke schema (butuh migration baru), atau UI-nya memang harus dihapus karena obsolete draft.

---

## ⚪ Belum/Tidak Bisa Diverifikasi di Audit Ini

- **Test yang benar-benar sentuh SQLite runtime** (integration test, `import-export.e2e-spec.ts`) — `better-sqlite3` butuh compile native binding dari header `nodejs.org`, domain itu tidak ada di allowlist jaringan sandbox audit ini. Kemungkinan besar jalan normal di mesin development biasa (jaringan tidak dibatasi), tapi **perlu dikonfirmasi manual** oleh yang punya akses.
- **Server test coverage number pasti** (`npm run test:coverage`) — tidak sempat dijalankan karena 5 suite sudah crash duluan di level import (temuan #3). Jalankan ulang setelah #3 diperbaiki untuk lihat angka real.
- **Perilaku aplikasi saat runtime penuh** (buka browser, klik-klik) — audit ini murni level build/lint/test otomatis, bukan manual QA di UI yang jalan.

---

## 🔵 Rekomendasi Non-Bug (dari review arsitektur sebelumnya, masih relevan)

Ini bukan defect, tapi keputusan yang masih menggantung dari fase desain — dicatat di sini biar tidak hilang:

1. **Mobile (Kotlin + Compose)**: `mobile/app/` masih kosong (`.gitkeep` doang). Sesuai `00-architecture.md`, ini memang fase 2 setelah web stabil — **belum jadi gap darurat**, tapi patut ditulis eksplisit kapan mulai (saran: setelah P0+P1 di atas beres dan test coverage P2 minimal untuk Core Loop modules).
2. **Packaging/distribution**: `install.md` masih murni `npm run dev` manual di terminal. Kalau target user akhirnya bukan cuma developer, opsi Electron/Tauri wrapper (sudah disebut sebagai "boleh ditambah belakangan" di `00-architecture.md`) perlu mulai didesain.
3. **Modeling uang sebagai `REAL` bukan `INTEGER` (sen)** — dicatat di `16-database-schema.md` sebagai known trade-off, belum diterapkan. Kalau `SUM()` bertumpuk di transaksi mulai kelihatan floating-point drift di production, ini yang perlu direvisit duluan.

---

## Ringkasan Urutan Kerja yang Disarankan

1. **P0 #1** (untrack tsbuildinfo) — 1 baris command, langsung kerjakan.
2. **P0 #3** (`__filename` fix) — 1-2 baris, cepat, langsung buka lagi 5 test suite yang mati.
3. **P0 #2** (Tasks module type mismatch) — perlu keputusan produk soal `category`/`project` dulu sebelum fix penuh; type/field mismatch lainnya bisa langsung dibetulkan.
4. **P1 #5** (`npm audit fix`, bagian non-breaking) — 1 command, high-severity, aman.
5. **P1 #4** (`matchMedia` mock) — beberapa baris di `vitest.setup.ts`.
6. **P2 #6-7** — dikerjakan bertahap, prioritas Planner & Analytics/Statistics dulu.
7. **P2 #8** — butuh keputusan produk, bukan keputusan teknis semata.
