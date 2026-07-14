# Analytics

> **Fase build**: 4 (Insight Layer), setelah Statistics. **Dependency**: Activity Tracker, Planner, Tasks, Habits, Goals, Money (read-only, harus ada data historis). **Dikonsumsi oleh**: Dashboard, Insights. **Baca `18-scaling-notes.md` §2 sebelum implementasi** (arsitektur job scheduled). DDL: `16-database-schema.md` §"10 & 11. Analytics & Statistics".

## Tujuan
Analisis lintas data untuk melihat **pola** produktivitas, kebiasaan, waktu, task, goal, dan keuangan.

## Peran di Aplikasi
Analytics menjelaskan pola (kenapa/bagaimana). Statistics (`11-statistics.md`) memberi angka mentah (berapa/total). Insights (`13-insights.md`) memberi rekomendasi (jadi harus ngapain). Ketiganya konsumen read-only dari data modul lain — perbedaannya di level pengolahan:

| Modul | Pertanyaan yang dijawab | Contoh output |
|---|---|---|
| Statistics | "Berapa total X?" | total jam tracked, biggest expense |
| Analytics | "Kenapa/bagaimana pola X?" | discipline score, planned vs actual, trend |
| Insights | "Jadi aku harus ngapain?" | rekomendasi jadwal, warning pola memburuk |

## Data Model
Analytics umumnya **tidak menyimpan data mentah baru** — semua dihitung dari tabel modul lain. Yang disimpan hanya hasil komputasi berat yang mahal dihitung ulang tiap request:

```
AnalyticsSnapshot
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- period_type         // TEXT CHECK: daily | weekly | monthly | yearly
- period_start        // TEXT (YYYY-MM-DD)
- discipline_score    // REAL, nullable
- focus_score         // REAL, nullable
- consistency_score   // REAL, nullable
- time_distribution   // TEXT (JSON: { productive, leisure, sleep }), default '{}'
- generated_at        // TEXT (ISO 8601 UTC)
- UNIQUE (user_id, period_type, period_start)
```
Tabel ini murni cache — re-derivable kapan saja dari tabel modul lain, tidak pernah source of truth.

Snapshot di-generate oleh scheduled job (misal tiap malam untuk daily snapshot), bukan dihitung on-demand tiap kali user buka halaman.

## Fitur Utama
- Daily/weekly/monthly/yearly review
- Planned vs actual comparison (Planner Event vs Activity Tracker session terhubung)
- Time distribution chart
- Trend comparison antar periode
- Category breakdown
- Export report

## Jenis Analisis
| Domain | Metrik |
|---|---|
| Time | productive time, leisure time, sleep time, total active time |
| Productivity | discipline score, focus score, consistency score, best working hours |
| Habit | completion rate, streak stability, missed days |
| Task | completed, overdue, pending |
| Goal | progress rate, milestone completion |
| Money | spend trend, income trend, category pattern |

## Integrasi
Read-only dari: Activity Tracker, Planner, Tasks, Habits, Goals, Money. Output dikonsumsi oleh: Dashboard (ringkasan), Insights (bahan rekomendasi).

## API Outline
```
GET /analytics/review?period=daily|weekly|monthly|yearly&date=...
GET /analytics/planned-vs-actual?range=...
GET /analytics/time-distribution?range=...
GET /analytics/trend?metric=...&range=...
GET /analytics/export?format=pdf|csv
```

## Non-Functional Notes
- Perhitungan berat (discipline score, dsb.) dilakukan async/scheduled, bukan real-time saat halaman dibuka — target render halaman Analytics tetap harus cepat walau datanya kompleks.
- Harus mudah dibaca; hindari chart dekoratif yang tidak menjawab pertanyaan spesifik apa pun.

## Catatan Implementasi (AI Agent)
- Job generation: `node-cron` di proses NestJS lokal yang sama (bukan Redis/BullMQ) — daily snapshot dulu, lalu trigger weekly (Senin)/monthly (tanggal 1)/yearly (1 Jan) sebagai function call langsung berikutnya. Detail penuh: `18-scaling-notes.md` §2.
- UPSERT pola: `INSERT ... ON CONFLICT (user_id, period_type, period_start) DO UPDATE` — idempotent, aman dijalankan ulang kalau app di-restart di tengah job.
- Formula `discipline_score`/`focus_score`/`consistency_score` sengaja tidak didefinisikan di sini (di luar scope dokumen produk ini) — perlu didefinisikan eksplisit sebelum implementasi, tanyakan ke user/product owner kalau belum ada spesifikasinya.
- Jangan implementasikan modul ini sebelum ada data nyata dari Fase 1-3 — layar Analytics kosong tidak berguna untuk testing.
