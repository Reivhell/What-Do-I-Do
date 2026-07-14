# Performance Notes (SQLite Lokal, Single-User)

> **AI Agent**: dokumen ini relevan mulai Fase 4 (Statistics/Analytics) — lihat `AI-AGENT-GUIDE.md` §4. Jangan implementasikan job scheduler atau cache invalidation sebelum modul Fase 1-3 stabil dan ada data nyata untuk diuji.

## Tujuan
Versi lama dokumen ini merancang partitioning Postgres, read replica, dan job queue berbasis Redis — semua itu diasumsikan skala **multi-user cloud**. Dengan `00-architecture.md` sekarang local-first single-user per device (SQLite, tanpa server cloud, tanpa Redis), sebagian besar konten lama jadi over-engineering yang tidak relevan. Dokumen ini ditulis ulang untuk konteks yang sebenarnya: satu file SQLite, satu user, jalan di mesin/device milik user sendiri.

## 1. Kenapa Partitioning Tidak Diperlukan

Partitioning Postgres ada untuk masalah **volume lintas banyak user** dan **concurrent write dari banyak koneksi**. Di model local-only:
- Hanya ada satu user per database file — tidak ada tabel yang membengkak karena akumulasi dari ribuan/jutaan user.
- Bahkan user yang paling aktif (2+ tahun pemakaian harian) realistisnya menghasilkan puluhan ribu baris di `activity_sessions`/`transactions` — SQLite menangani jutaan baris per tabel tanpa masalah performa untuk query yang diindeks dengan benar. Index `(user_id, created_at)` / `(user_id, date)` yang sudah didefinisikan di `16-database-schema.md` sudah lebih dari cukup.
- **Tidak ada tindakan yang perlu disiapkan di sini.** Kalau suatu saat nanti user tertentu memang punya database sangat besar dan listing mulai lambat, langkah pertama yang realistis adalah cek index (`EXPLAIN QUERY PLAN`) sebelum mempertimbangkan solusi struktural — bukan partitioning.

## 2. Snapshot & Cache Invalidation: Analytics dan Statistics

Bagian ini **tetap relevan** — `10-analytics.md` dan `11-statistics.md` masih butuh `AnalyticsSnapshot` dan `StatisticsCache` yang di-generate terjadwal, bukan on-demand, karena perhitungannya (window function, korelasi antar metrik) tetap mahal terlepas dari engine database-nya.

### Generation job (tanpa Redis/BullMQ)
```
Job: generate_daily_snapshot
Trigger: node-cron / setInterval sederhana di dalam proses NestJS lokal yang sama
          (tidak butuh job queue terpisah — hanya ada satu user, tidak ada antrian
          job dari user lain yang perlu diisolasi)
Langkah:
  1. Query agregasi dari activity_sessions, planner_events, transactions, habit_logs
     untuk hari kemarin (timezone user dari user_preferences)
  2. Hitung discipline_score, focus_score, consistency_score (formula didefinisikan
     terpisah, di luar scope dokumen ini)
  3. UPSERT (INSERT ... ON CONFLICT (user_id, period_type, period_start) DO UPDATE)
     ke analytics_snapshots
  4. Trigger job turunan: weekly snapshot (tiap Senin), monthly (tiap tanggal 1),
     yearly (tiap 1 Januari) — dijalankan langsung sebagai function call berikutnya,
     bukan lewat message queue
```

### Event-based invalidation (untuk StatisticsCache)
```
Saat ada write ke: activity_sessions, transactions, habit_logs, goals/milestones
  → panggil langsung function invalidateStatisticsCache(user_id, scope) di request
    handler yang sama (in-process, bukan publish ke event bus terpisah)
  → hapus baris StatisticsCache yang relevan
  → request GET /statistics/* berikutnya: cache miss → compute on-the-fly → simpan lagi
```

Pola **lazy invalidation** ini tetap dipertahankan dari versi lama: hapus cache saat data berubah, hitung ulang saat benar-benar diminta. Bedanya di sini murni implementasi: karena semuanya jalan dalam satu proses Node/NestJS lokal, tidak perlu event bus/message broker — panggilan function langsung (in-process) sudah cukup dan lebih sederhana untuk di-debug.

### Kenapa AnalyticsSnapshot beda dari StatisticsCache
Tetap sama seperti sebelumnya: Analytics (`discipline_score` dkk.) mahal dihitung, jadi scheduled bukan lazy. Statistics (SUM/COUNT/MAX sederhana) murah dihitung on-the-fly, jadi lazy invalidation cukup.

## 3. Read Replica & Materialized View — Tidak Relevan

Read replica ada untuk memisahkan beban baca dari satu primary database yang dipakai banyak koneksi bersamaan — tidak relevan untuk SQLite single-user single-process. Materialized view Postgres juga tidak punya padanan di SQLite (SQLite hanya punya `VIEW` biasa yang di-compute ulang tiap query, bukan `MATERIALIZED VIEW` yang di-`REFRESH`).

Kalau laporan berat (`GET /statistics/overall`, `GET /analytics/trend`) memang terasa lambat dihitung on-the-fly, solusi yang tetap relevan dari versi lama adalah **tabel cache biasa** yang sudah ada (`statistics_cache`, `analytics_snapshots` di `16-database-schema.md`) — bukan materialized view. Ini sudah menyelesaikan masalah yang sama (hasil pre-computed, tidak dihitung ulang tiap request) tanpa butuh fitur DB yang tidak ada di SQLite.

## 4. Background Job — Disederhanakan, Tanpa Redis/BullMQ

Tiga proses yang sudah disebut di dokumen modul tetap butuh eksekusi terjadwal/event-driven, tapi tidak butuh job queue infrastruktur terpisah:

| Job | Trigger | Sumber | Sifat |
|---|---|---|---|
| Habit → Planner event generation | `node-cron` di proses NestJS lokal (mis. tiap malam, generate 4 minggu ke depan) | `06-habits.md` non-functional notes | Idempotent — cek dulu event untuk tanggal itu sudah ada sebelum insert |
| Achievement rule evaluation | Dipanggil langsung (in-process function call) setiap kali endpoint yang relevan selesai menulis ActivitySession/Habit/Goal/Money | `12-achievements.md` | Idempotent — pola UPSERT by `(user_id, achievement_id)` |
| Analytics/Statistics snapshot | `node-cron` per timezone user (bagian 2 di atas) | `10-analytics.md`, `11-statistics.md` | Idempotent via UPSERT |

**Kenapa tidak perlu Redis/BullMQ lagi**: BullMQ ada untuk mengisolasi job antar banyak user/request concurrent dengan retry dan backoff yang robust di skala production multi-tenant. Di sini hanya ada satu user, satu proses Node lokal, dan job-job di atas ringan secara komputasi (bukan job berat yang butuh worker terpisah). `node-cron` (scheduled) + pemanggilan function langsung (event-driven) sudah cukup, dan menghapus satu proses tambahan (Redis) yang harus di-install/dijalankan user di mesinnya sendiri — konsisten dengan target cold-start <1 detik di `00-architecture.md`.

**Idempotency tetap wajib** meskipun tidak ada lagi "at-least-once delivery" dari message queue — alasannya sekarang murni untuk toleransi terhadap retry manual/restart aplikasi di tengah proses (mis. app di-kill saat job jalan, lalu job yang sama jalan lagi saat app dibuka). Pola UPSERT by natural key yang sudah ada di skema (`(habit_id, date)` di `habit_logs`, `(user_id, achievement_id)` di `user_achievements`) tetap dipakai apa adanya.

## 5. Kapan Bagian Mana Relevan

1. **Phase 1-3 (Core Loop, Habit/Goal, Uang)**: tabel biasa + index dasar dari `16-database-schema.md` sudah cukup, tidak ada job scheduler yang dibutuhkan sama sekali di fase ini.
2. **Phase 4 (Insight Layer)**: mulai butuh `node-cron` snapshot job karena Analytics/Statistics baru masuk scope — ini momen tepat mengimplementasikan bagian 2 & 4 dokumen ini.
3. **Partitioning, read replica, materialized view (bagian 1 & 3 versi lama)**: tidak diimplementasikan sama sekali di model local-only ini. Kalau nanti proyek berkembang jadi punya server cloud multi-tenant (bukan lagi local-first), bagian-bagian itu bisa direvisit dari draft lama — tapi itu perubahan arsitektur besar, bukan iterasi dari model saat ini.
