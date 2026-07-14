# Statistics

> **Fase build**: 4 (Insight Layer), modul pertama di fase ini (lebih murah dihitung dibanding Analytics). **Dependency**: Activity Tracker, Money, Habits, Goals, Tasks (read-only). **Dikonsumsi oleh**: Dashboard (tidak langsung, biasanya lewat Analytics). DDL: `16-database-schema.md` §"10 & 11. Analytics & Statistics".

## Tujuan
Menampilkan angka mentah, total, rekap, dan record penting dari seluruh aplikasi.

## Peran di Aplikasi
Lihat tabel perbandingan di `10-analytics.md` — Statistics menjawab "berapa", bukan "kenapa" atau "harus ngapain". Statistics adalah agregasi sederhana (SUM, COUNT, MAX, MIN) — tidak ada skor komposit atau interpretasi pola di sini, itu wilayah Analytics.

## Tampilan Utama
Overall Statistics, Time Statistics, Activity Statistics, Money Statistics, Habit Statistics, Goal Statistics, Records.

## Data Model
Sama seperti Analytics, tidak ada tabel data baru — murni query agregasi terhadap tabel modul lain. Bisa di-cache ringan:

```
StatisticsCache
- id           // TEXT, UUID
- user_id      // TEXT, FK → users.id
- scope        // TEXT CHECK: overall | time | activity | money | habit | goal
- computed_at  // TEXT (ISO 8601 UTC)
- data         // TEXT (JSON hasil agregasi)
- UNIQUE (user_id, scope)
```

## Fitur Utama
Total per kategori, total all time, record tertinggi/terendah, best streak, longest session, biggest expense/income, completed/missed count.

## Contoh Statistik
| Domain | Metrik |
|---|---|
| Time | total jam tracked, total jam produktif, total jam tidur |
| Activity | aktivitas paling sering, sesi terpanjang, sesi terbanyak |
| Money | total income, total expense, total savings, total transaksi |
| Habit | habit selesai, streak terbaik, habit paling konsisten |
| Goal | goal selesai, milestone selesai, progress total |

## Integrasi
Read-only dari semua modul data (Activity Tracker, Money, Habits, Goals, Tasks).

## API Outline
```
GET /statistics/overall
GET /statistics/time
GET /statistics/activity
GET /statistics/money
GET /statistics/habit
GET /statistics/goal
GET /statistics/records     → semua "biggest/longest/best" dalam satu response
```

## Non-Functional Notes
- Cocok untuk user yang suka angka cepat tanpa interpretasi — pastikan layout scannable (angka besar, label singkat), bukan paragraf penjelasan.
- Query agregasi (SUM/COUNT) atas data bertahun-tahun harus pakai index yang tepat atau materialized view, jangan full table scan tiap request.

## Catatan Implementasi (AI Agent)
- **Catatan koreksi**: SQLite tidak punya `MATERIALIZED VIEW` (hanya `VIEW` biasa yang di-compute ulang tiap query). Solusi yang benar untuk proyek ini adalah `statistics_cache` yang sudah ada — bukan materialized view. Lihat `18-scaling-notes.md` §3.
- Pola invalidation: **lazy**, bukan scheduled seperti Analytics. Saat ada write ke `activity_sessions`/`transactions`/`habit_logs`/`goals`/`milestones`, panggil `invalidateStatisticsCache(user_id, scope)` in-process (function call langsung di request handler yang sama) → hapus row cache terkait → request `GET /statistics/*` berikutnya cache miss → compute on-the-fly → simpan lagi. Detail: `18-scaling-notes.md` §2.
- Kenapa beda pola dari Analytics: agregasi Statistics (SUM/COUNT/MAX) murah dihitung, jadi lazy cukup; Analytics (discipline score dkk.) mahal, jadi harus scheduled.
