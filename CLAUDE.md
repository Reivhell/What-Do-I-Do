## Baca Ini Dulu, Sebelum File Lain

Dokumen ini adalah **entry point tunggal** untuk AI Agent (Claude Code, Cursor, dll.) yang akan mengimplementasikan proyek ini. Dokumen lain (`00-18`) adalah spesifikasi produk & teknis yang lengkap, tapi ditulis untuk dibaca manusia secara berurutan. File ini merangkum apa yang harus diketahui *sebelum menulis baris kode pertama*, supaya agent tidak perlu menyimpulkan sendiri urutan kerja, konvensi, atau titik rawan kesalahan dari 19 dokumen terpisah.

---

## 1. Apa Proyek Ini (satu paragraf)

**What Do I Do** adalah aplikasi manajemen hidup personal, **local-first, single-user per device** — tidak ada server cloud, tidak ada multi-tenant. Web dibangun lebih dulu (React + TypeScript + NestJS lokal + SQLite via Drizzle ORM, semua jalan di `localhost` mesin user sendiri), Mobile menyusul sebagai porting independen (Kotlin + Jetpack Compose + SQLite native). Web dan mobile **tidak saling sync otomatis** — jembatan datanya adalah export/import JSON manual. 15 modul fitur (Dashboard, Inbox, Planner, Activity Tracker, Tasks, Habits, Goals, Money, Life Log, Analytics, Statistics, Achievements, Insights, Workspace, Settings) saling terhubung lewat foreign key eksplisit, bukan duplikasi data — aturan siapa "pemilik" data apa ada di §3 di bawah.

---

## 2. Urutan Baca Dokumen (untuk agent, bukan urutan file)

Jangan baca `01` sampai `18` secara linear. Urutan yang benar untuk memahami sistem sebelum mengimplementasikan:

1. **File ini (`AI-AGENT-GUIDE.md`)** — orientasi & aturan wajib
2. **`00-architecture.md`** — tech stack final, prinsip desain data, fasa platform
3. **`16-database-schema.md`** — DDL SQLite lengkap, semua tabel, semua index
4. **`README.md`** — tabel source-of-truth per data (ringkasan §3 di sini, versi lebih pendek)
5. Modul fitur sesuai **fase build** di §4 di bawah (bukan urutan nomor file 01→15)
6. **`17-offline-sync.md`** — baca tepat sebelum implementasi Activity Tracker (live timer) dan Settings → Backup
7. **`18-scaling-notes.md`** — baca tepat sebelum implementasi Analytics/Statistics (Fase 4)

---

## 3. Source of Truth per Data (wajib dihafal sebelum coding)

Setiap kali ada dua modul yang sepertinya "bisa menyimpan data yang sama", cek tabel ini. **Hanya satu kolom kanan yang boleh punya tabel nyata; kolom kiri lainnya cuma menyimpan foreign key.**

| Data | Pemilik tunggal (tabel nyata) | Modul lain menyimpan apa |
|---|---|---|
| Waktu terjadwal (kapan akan terjadi) | `planner_events` | `linked_planner_event_id` / `scheduled_event_id` saja |
| Waktu terealisasi (kapan benar-benar terjadi + durasi) | `activity_sessions` | `linked_session_id` / `realized_session_id` saja |
| Daftar kerja tanpa waktu | `tasks` | Planner mengambil snapshot ringan (title) saat dijadwalkan, tidak duplikasi field lain |
| Aturan pengulangan kebiasaan | `habits.repeat_rule` | Planner generate event dari sini, tidak simpan repeat rule sendiri |
| Target jangka panjang | `goals` | Habit/Task/Planner hanya `linked_goal_id`, tidak pernah goal yang generate ke mereka |
| Transaksi keuangan | `transactions` / `accounts` | Dashboard/Analytics hanya baca agregat, tidak hitung ulang saldo sendiri |
| Timeline "apa yang terjadi hari ini" | **Tidak ada tabel** — `life_log_annotations` cuma anotasi manual | View gabungan on-the-fly dari 4 tabel lain via `UNION ALL` |
| Hasil komputasi berat (score, trend) | `analytics_snapshots`, `statistics_cache` | Selalu re-derivable, boleh dihapus & dihitung ulang kapan saja |

**Konsekuensi praktis untuk agent**: kalau menemukan diri sendiri ingin menambah field `start_time` ke tabel `tasks`, atau menambah tabel `LogEntry` baru untuk Life Log — **berhenti**, itu bertentangan dengan desain yang sudah final di sini.

---

## 4. Urutan Implementasi (Build Phases) — WAJIB DIIKUTI URUT

Jangan implementasikan modul insight-layer (Analytics/Statistics/Insights/Achievements) sebelum modul core selesai — mereka butuh data historis nyata untuk berguna, dan mereka *read-only* terhadap modul core sehingga tidak bisa diuji tanpa data itu ada dulu.

```
Phase 1 — Core Loop (bangun & stabilkan dulu sebelum lanjut)
  Settings (auth/app-lock dasar + user_profiles + user_preferences)
  → Inbox/Capture
  → Tasks
  → Planner
  → Activity Tracker
  → Dashboard (versi minim, cuma widget dari 5 modul di atas)

Phase 2 — Habit & Goal
  Habits → Goals → (uji integrasi Planner↔Habits: auto-generate event)

Phase 3 — Uang
  Money lengkap: Accounts → Transactions → Budgets → Recurring Bills

Phase 4 — Insight Layer (baru mulai butuh 18-scaling-notes.md di sini)
  Statistics → Analytics → Life Log → Insights

Phase 5 — Retensi & Personalisasi
  Achievements → Workspace
```

Setelah Platform 1 (Web) stabil di semua 5 fase → mulai Platform 2 (Mobile), ulangi urutan fase yang sama, implementasi independen (skema data sama, tidak memanggil NestJS web).

---

## 5. Konvensi Wajib di Semua Tabel (jangan diulang manual per tabel, tapi berlaku ke semuanya)

Sumber lengkap: `00-architecture.md` §"Prinsip Desain Data" dan `16-database-schema.md` §"Konvensi Global". Ringkasan cepat untuk referensi saat generate kode:

| Aspek | Aturan |
|---|---|
| Primary key | `TEXT`, UUID, digenerate di application layer via `crypto.randomUUID()` (Drizzle: `$defaultFn()`). **Bukan** `AUTOINCREMENT`, **bukan** digenerate di DB. |
| Timestamp | `TEXT`, format ISO 8601 UTC (`2026-07-07T09:00:00.000Z`). Dikonversi ke timezone user hanya di layer presentasi. |
| Tanggal saja (tanpa jam) | `TEXT`, format `YYYY-MM-DD` |
| Boolean | `INTEGER` (0/1) di SQL mentah; Drizzle `boolean` mode konversi otomatis di TS |
| Array/JSON | `TEXT` (JSON string), Drizzle `text({ mode: 'json' })` |
| Uang | `REAL` — **keputusan final proyek ini, jangan diubah ke INTEGER cents** meski `16-database-schema.md` menyebutnya sebagai opsi. Ketelitian floating-point untuk skala data personal (bukan sistem akuntansi multi-pihak) dianggap cukup di sini. |
| Enum | `TEXT NOT NULL CHECK (col IN (...))` — SQLite tidak punya tipe ENUM native |
| Foreign key | Selalu eksplisit (`REFERENCES table(id)`), tidak pernah duplikasi data across modul |
| Soft delete | Wajib untuk data finansial & log: `transactions`, `accounts`, `recurring_bills`, `activity_sessions`. Field `deleted_at TEXT` nullable, tidak pernah `DELETE` fisik. |
| `PRAGMA foreign_keys = ON` | Wajib diaktifkan **per koneksi** (tidak persisten), taruh di setup koneksi Drizzle, bukan di migration |
| `updated_at` trigger | Wajib per tabel yang punya kolom ini — lihat pola trigger di `16-database-schema.md`, **tulis manual di migration SQL**, Drizzle tidak generate otomatis dari schema TS |

### Circular Reference — Tidak Perlu Ditangani Khusus di SQLite

Tiga pasang tabel saling mereferensikan (`tasks`↔`planner_events`, `planner_events`↔`activity_sessions`). Di Postgres ini butuh `ALTER TABLE` dua tahap. **Di SQLite tidak perlu** — FK tidak divalidasi saat `CREATE TABLE` diparse, hanya saat DML dijalankan. Tulis semua FK inline seperti di `16-database-schema.md`, jalankan semua `CREATE TABLE` dalam satu migration/transaction (otomatis kalau lewat Drizzle Kit). Untuk TypeScript (`schema.ts`) forward-reference, gunakan callback (`(): AnySQLiteColumn => plannerEvents.id`) — ini masalah TS module resolution, bukan SQL.

---

## 6. Pola Read-Only yang Tidak Boleh Dilanggar

```
Inbox/Capture ──convert──▶ Tasks / Planner / Habits / Goals / Money
Tasks ──schedule──▶ Planner (event dengan source_task_id)
Habits ──generate──▶ Planner (event dengan source_habit_id)
Goals ◀──link── Habits, Tasks, Planner (goal TIDAK PERNAH generate ke modul lain)
Planner ──realize──▶ Activity Tracker (saat event dijalankan)
Activity Tracker + Planner + Money + Habits ──aggregate (read-only)──▶ Life Log
SEMUA modul data ──read-only──▶ Analytics, Statistics, Insights, Achievements, Dashboard
Workspace ──controls layout of──▶ Dashboard
```

Kalau agent menulis kode yang membuat Analytics/Statistics/Insights/Achievements/Dashboard/Life Log melakukan `INSERT`/`UPDATE`/`DELETE` ke tabel modul lain (`tasks`, `habits`, `transactions`, dst.) — itu bug arsitektural, bukan variasi implementasi yang valid. Satu-satunya pengecualian tertulis: Milestone Goal boleh membuat satu `planner_event` (manual, bukan otomatis) — lihat `07-goals.md`.

---

## 7. Gotcha yang Sering Terlewat (checklist sebelum menganggap modul selesai)

- [ ] **Streak habit** (`current_streak`, `best_streak`) — **jangan** increment manual saat log baru masuk. Recompute penuh dari `habit_logs` setiap ada edit retroaktif. Implementasikan di service layer (NestJS), bukan trigger DB.
- [ ] **Goal `progress_percent`** — recompute dari `milestones.is_completed` setiap ada perubahan, jangan simpan sebagai counter independen. Boleh pakai trigger SQLite atau service layer (rekomendasi: service layer, lebih mudah ditest — lihat `16-database-schema.md`).
- [ ] **Transfer uang** (`transactions.type = 'transfer'`) — wajib dibungkus satu DB transaction (debit + kredit sekaligus). Rekonsiliasi `accounts.current_balance` lewat trigger atau service layer yang sama.
- [ ] **Live timer app-kill** — `start_time` ditulis ke SQLite saat `start` (bukan cuma di memory state React/Compose). Saat app dibuka lagi, deteksi row `activity_sessions` dengan `end_time IS NULL` dan tawarkan user "lanjutkan" atau "stop sekarang" — jangan silent-discard.
- [ ] **Switch activity** — implementasikan sebagai satu operasi atomik (stop lama + start baru), bukan dua request terpisah yang bisa gagal di tengah.
- [ ] **Recurring bill mark-paid** — wajib membuat `transactions` row terkait (`linked_recurring_bill_id` terisi) di operasi yang sama, bukan dua langkah independen yang bisa tidak sinkron.
- [ ] **`converted_to_id`** di `capture_items` dan **`source_id`** di `planner_events` — ini polymorphic FK, **tidak ada** DB constraint. Validasi keberadaan target wajib di application layer saat proses konversi/pembuatan.
- [ ] **Analytics/Statistics cache** — jangan pernah anggap `analytics_snapshots`/`statistics_cache` sebagai source of truth. Kalau hilang/corrupt, harus bisa di-regenerate penuh dari tabel modul lain.
- [ ] **Export/import** — pakai `INSERT ... ON CONFLICT (id) DO NOTHING` karena ID sudah client-generated UUID. Ini bukan sync dua arah — field-level merge **tidak** diimplementasikan (lihat `17-offline-sync.md`).
- [ ] **Dashboard `GET /summary`** — wajib satu query terkomposisi di backend, bukan 7 request terpisah dari klien (target render < 1 detik).

---

## 8. Non-Functional Targets Keras (jangan dianggap "nice to have")

| Target | Modul | Angka |
|---|---|---|
| Cold start render | Dashboard, Inbox/Capture | < 1 detik |
| Waktu mulai mengetik di Inbox | Inbox/Capture | < 1 detik dari buka app |
| Start activity | Activity Tracker | 1 tap dari Dashboard |
| Input expense biasa | Money | < 3 tap |
| Initial render Dashboard | Dashboard | 1 network round-trip saja |

Target-target ini adalah alasan keputusan stack (Drizzle atas Prisma, tanpa Redis) — jangan tambahkan proses/binary baru yang memperlambat cold start tanpa meninjau ulang target ini.

---

## 9. Yang Sengaja TIDAK Dibangun (jangan diimplementasikan preventif)

Kalau menemukan permintaan atau asumsi fitur berikut, itu **di luar scope fase ini** — sudah keputusan sadar, bukan kelalaian dokumentasi:

- Sync otomatis background antar web dan mobile
- Conflict resolution field-level (last-write-wins per field)
- Realtime multi-device
- Partitioning database, read replica, materialized view (tidak relevan untuk SQLite single-user)
- Job queue infrastruktur (Redis/BullMQ) — cukup `node-cron` + in-process function call
- Multi-tenant auth (JWT server) — cukup app-lock lokal (PIN/biometric opsional)

---

## 10. Peta Cepat: Nomor File → Modul → Fase Build

| # | File | Fase | Dependency wajib sebelumnya |
|---|---|---|---|
| 15 | `15-settings.md` | 1 | — (dasar untuk semua) |
| 02 | `02-inbox-capture.md` | 1 | Settings (categories) |
| 05 | `05-tasks.md` | 1 | Settings |
| 03 | `03-planner.md` | 1 | Tasks (untuk source_type=task) |
| 04 | `04-activity-tracker.md` | 1 | Planner (untuk source_event_id) |
| 01 | `01-dashboard.md` | 1 (minim) | Tasks, Planner, Activity Tracker |
| 06 | `06-habits.md` | 2 | Planner (integrasi generate event) |
| 07 | `07-goals.md` | 2 | Habits, Tasks, Planner (relasi masuk) |
| 08 | `08-money.md` | 3 | Settings (categories) |
| 11 | `11-statistics.md` | 4 | Semua modul Fase 1-3 (butuh data) |
| 10 | `10-analytics.md` | 4 | Semua modul Fase 1-3 + `18-scaling-notes.md` |
| 09 | `09-life-log.md` | 4 | Activity Tracker, Planner, Money, Habits |
| 13 | `13-insights.md` | 4 | Analytics (konsumen, bukan data mentah) |
| 12 | `12-achievements.md` | 5 | Activity Tracker, Habits, Goals, Money (event source) |
| 14 | `14-workspace.md` | 5 | Dashboard (versi stabil) |

Dokumen pendukung teknis (dibaca sesuai kebutuhan fase, bukan berurutan): `00-architecture.md` (baca duluan), `16-database-schema.md` (baca duluan), `17-offline-sync.md` (baca sebelum Activity Tracker & Settings→Backup), `18-scaling-notes.md` (baca sebelum Fase 4).
