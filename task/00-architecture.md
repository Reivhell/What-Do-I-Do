# Arsitektur & Fondasi Teknis

> **AI Agent**: ringkasan siap-pakai dari dokumen ini (konvensi tabel, urutan build, checklist) ada di `AI-AGENT-GUIDE.md` §5. Dokumen ini adalah versi lengkap dengan alasan di balik tiap keputusan — baca ini kalau butuh konteks "kenapa", bukan cuma "apa".

## Tujuan
Dokumen ini menetapkan keputusan teknis lintas modul supaya setiap fitur di file 01–15 dibangun di atas fondasi yang sama, bukan diimplementasikan sendiri-sendiri secara inkonsisten.

## Tech Stack yang Direkomendasikan

**Update:** proyek ini dibangun **local-first, single-user per device**, tanpa server cloud multi-tenant. Web dibangun lebih dulu (Phase 1-5 penuh), mobile menyusul sebagai porting kedua. Tidak ada sinkronisasi otomatis antar device di fase ini — lihat "Data Portability" di bawah.

| Layer | Rekomendasi | Alasan |
|---|---|---|
| Web frontend | React + TypeScript | UI utama, dibangun lebih dulu; semua modul 01-15 dikembangkan di sini sebelum porting ke mobile |
| Backend API (lokal) | NestJS (Node.js/TypeScript), jalan di `localhost` di mesin yang sama dengan browser, **bukan** service cloud | Tetap modular per domain (planner, tasks, habits, dll) sesuai struktur dokumen ini; reuse logic bisnis (validasi, recompute streak/progress, dll) tanpa duplikasi antara "server" dan "client" karena keduanya di satu proses lokal |
| Database (web) | SQLite, diakses lewat **Drizzle ORM** dari NestJS | Satu file `.db` lokal per install; Drizzle dipilih karena schema-nya dekat dengan raw SQL yang sudah ada di `16-database-schema.md`, dan tidak bawa query-engine binary terpisah — penting untuk cold-start <1 detik di layer lokal. Prisma tetap valid kalau DX (Prisma Studio dkk.) lebih diprioritaskan dibanding startup weight |
| Mobile app (Phase 2, setelah web stabil) | Kotlin + Jetpack Compose (Android) | Cocok untuk state management reaktif lintas modul; UI mobile mengikuti kontrak data yang sudah divalidasi lewat versi web |
| Database (mobile) | SQLite native (Room atau SQLDelight), **local saja**, skema paralel ke web tapi berdiri sendiri | Native app tidak butuh NestJS di device — akses DB langsung lebih ringan; tidak ada server untuk dihubungi |
| Cache/Realtime | **Dihapus dari stack.** Redis tidak diperlukan — hanya ada satu user lokal, live timer cukup disimpan di SQLite + state in-memory app (lihat `17-offline-sync.md` versi baru) | Menyederhanakan infra: tidak ada proses tambahan yang perlu dijalankan/di-maintain di mesin user |
| Auth | Disederhanakan jadi **app-lock lokal** (PIN/biometric opsional), bukan JWT server multi-user | Tidak ada multi-tenant untuk diautentikasi; tabel `users` tetap dipertahankan (lihat `16-database-schema.md`) supaya forward-compatible kalau nanti multi-akun/sync cloud ditambahkan |
| Data portability (pengganti "Offline sync antar server") | Manual export/import JSON via Settings → Backup | Karena tidak ada server pusat, ini jadi mekanisme utama memindahkan data antara install web dan install mobile untuk saat ini — lihat `17-offline-sync.md` |
| File export | JSON/CSV generator di backend lokal | Dipakai Settings → Backup, sama seperti sebelumnya |

### Deployment Model (baru)

Web app dijalankan sebagai aplikasi lokal, bukan di-deploy ke cloud untuk MVP:

```
Browser (React + TS)  ──HTTP localhost──▶  NestJS server (lokal, satu proses)  ──Drizzle──▶  SQLite file (lokal)
```

User menjalankan ini seperti aplikasi personal (mis. `npm run start` di mesin sendiri). Kalau nanti dibutuhkan pengalaman "buka dari desktop icon" tanpa terminal, opsi pembungkus (Electron/Tauri) bisa ditambahkan belakangan tanpa mengubah arsitektur inti — itu di luar scope keputusan saat ini.

Mobile app **tidak** memanggil NestJS lokal ini sama sekali — dia punya SQLite sendiri di device, independen. Konsekuensinya: data yang dibuat di web tidak otomatis muncul di mobile (dan sebaliknya) sampai user export/import manual.

## Prinsip Desain Data

1. **Setiap entity punya `id` (UUID, disimpan sebagai `TEXT` di SQLite, digenerate di application layer via `crypto.randomUUID()` karena SQLite tidak punya fungsi UUID native), `created_at`, `updated_at`, `user_id`.** Tidak diulang di tiap file, tapi berlaku implisit untuk semua tabel yang disebut di modul 01–15.
2. **Relasi lintas modul selalu via foreign key eksplisit**, bukan duplikasi data. Contoh: Planner event yang berasal dari Task menyimpan `source_task_id`, bukan menyalin ulang title/notes/priority.
3. **Status enum konsisten**: modul yang punya konsep status (Task, Goal, Recurring Bill, Achievement) memakai pola `pending | active | completed | archived | cancelled` sebisa mungkin, disesuaikan konteks masing-masing.
4. **Soft delete** untuk semua data finansial dan log (Money, Life Log, Activity Tracker) — tidak pernah hard delete demi integritas riwayat/statistik.
5. **Timezone**: semua timestamp disimpan UTC di database, dikonversi ke timezone user (diatur di Settings) hanya di layer presentasi.

## Alur Data Antar Modul (ringkasan integrasi)

```
Inbox/Capture ──convert──▶ Tasks / Planner / Habits / Goals / Money (quick note)
Tasks ──schedule──▶ Planner (event dengan source_task_id)
Habits ──generate──▶ Planner (event dengan source_habit_id, mengikuti repeat rule)
Goals ◀──link── Habits, Tasks, Planner (goal tidak generate apa pun, hanya menerima link)
Planner ──realize──▶ Activity Tracker (saat event dijalankan, jadi session dengan source_event_id)
Activity Tracker + Planner + Money + Habits ──aggregate (read-only)──▶ Life Log
Semua modul data ──read-only──▶ Analytics, Statistics, Insights, Achievements, Dashboard
Workspace ──controls layout of──▶ Dashboard
```

Aturan kunci: **panah agregasi/read-only tidak pernah menulis balik** ke modul sumber. Analytics, Statistics, Insights, Achievements, Dashboard, dan Life Log murni konsumen data — ini mencegah siklus dependensi yang bikin bug sulit dilacak.

## Non-Functional Requirements Global

- **Kecepatan buka aplikasi**: Dashboard dan Inbox/Capture harus render < 1 detik dari cold start (constraint yang sudah disebut di masing-masing modul, ditegaskan di sini sebagai target keras). Ini juga alasan utama memilih Drizzle atas Prisma dan menghapus Redis dari stack — makin sedikit proses/binary yang harus siap sebelum request pertama, makin gampang target ini dicapai.
- **Offline-first tetap wajib** untuk: Inbox/Capture, Activity Tracker (live timer tidak boleh berhenti karena app di-background), Tasks — tapi sekarang maknanya berbeda dari versi lama: karena backend NestJS jalan **lokal** (bukan server jarak jauh), "offline" hanya relevan untuk skenario app tertutup paksa/di-kill OS, bukan putus koneksi internet. Detail konkret di `17-offline-sync.md` (sudah ditulis ulang untuk model local-only).
- **Sinkron antar device BUKAN garansi** di fase ini — web dan mobile masing-masing local-only. Jembatan antar device sementara pakai export/import manual (lihat `17-offline-sync.md`). Desain sync_queue/last-write-wins yang lama tetap didokumentasikan sebagai referensi forward-compatible kalau nanti ada keputusan menambah server sync sungguhan.
- **Skalabilitas data**: user yang sudah pakai aplikasi 2+ tahun bisa punya puluhan ribu session/transaksi. SQLite single-file menangani ini tanpa masalah untuk single-user (jauh di bawah batas praktis SQLite), tapi index `(user_id, created_at)` tetap wajib di semua query listing supaya tetap cepat seiring data bertambah — lihat `18-scaling-notes.md` untuk detail yang sudah disesuaikan ke konteks lokal.

## Pendalaman Teknis (Lampiran)

Dokumen ini sengaja tetap ringkas sebagai ringkasan lintas modul. Detail implementasi teknis yang butuh lebih dari beberapa paragraf diturunkan ke dokumen terpisah, dengan penomoran lanjutan dari `01-15`:

| # | File | Isi |
|---|---|---|
| 16 | `16-database-schema.md` | DDL SQLite lengkap (via Drizzle) untuk semua entity di `01-15` — siap jadi migration |
| 17 | `17-offline-sync.md` | Local persistence & live timer behavior untuk model local-only, plus mekanisme export/import sebagai jembatan antar device sementara |
| 18 | `18-scaling-notes.md` | Strategi index/cache untuk skala single-user SQLite, snapshot Analytics-Statistics, arsitektur background job tanpa Redis |

## Platform Phasing (baru)

Sebelum urutan modul di bawah: keputusan platform-nya sendiri berurutan, bukan paralel.

- **Platform 1 — Web**: React + TS + NestJS lokal + SQLite/Drizzle. Semua Phase 1-5 di bawah dibangun dan divalidasi di sini dulu sampai stabil.
- **Platform 2 — Mobile**: Kotlin + Jetpack Compose + SQLite lokal (Room/SQLDelight), dimulai setelah web selesai. Porting mengikuti skema data yang sama (`16-database-schema.md`), tapi implementasi independen — tidak memanggil NestJS web sama sekali.

## MVP Phasing (rekomendasi urutan build per modul)

Spek lama tidak punya urutan prioritas antar modul, hanya per-modul. Untuk pengembangan bertahap (berlaku di dalam Platform 1 dulu, lalu diulang strukturnya saat porting ke Platform 2):

- **Phase 1 (Core Loop)**: Settings (auth dasar) → Inbox/Capture → Tasks → Planner → Activity Tracker → Dashboard (versi minim)
- **Phase 2 (Habit & Goal)**: Habits → Goals → integrasi Planner-Habits
- **Phase 3 (Uang)**: Money lengkap dengan Budgets & Recurring Bills
- **Phase 4 (Insight Layer)**: Statistics → Analytics → Life Log → Insights
- **Phase 5 (Retensi & Personalisasi)**: Achievements → Workspace

Analytics/Insights/Achievements sengaja diletakkan di akhir karena butuh data historis dari modul lain untuk bernilai — membangunnya lebih awal hanya menghasilkan layar kosong.
