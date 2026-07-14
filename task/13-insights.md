# Insights

> **Fase build**: 4 (Insight Layer), terakhir di fase ini — butuh Analytics sudah jalan. **Dependency**: Analytics (`analytics_snapshots`), **bukan** data mentah modul lain langsung. **Dikonsumsi oleh**: Dashboard (satu insight teratas). DDL: `16-database-schema.md` §"13. Insights".

## Tujuan
Memberi rekomendasi dan interpretasi dari data yang sudah terkumpul.

## Peran di Aplikasi
Insights menjawab "jadi aku harus ngapain?" berdasarkan pola pengguna. Ini konsumen dari **Analytics**, bukan dari data mentah modul lain langsung — Insights tidak menghitung ulang pola dari nol, ia menginterpretasikan hasil yang sudah dikomputasi Analytics (`10-analytics.md`) dan menerjemahkannya jadi kalimat rekomendasi.

## Tampilan Utama
Productivity Pattern, Time Distribution, Spending Pattern, Habit Suggestions, AI Recommendations.

## Data Model
```
Insight
- id            // TEXT, UUID
- user_id       // TEXT, FK → users.id
- type          // TEXT CHECK: time | habit | productivity | money | task | goal
- message       // TEXT, required
- severity      // TEXT CHECK: info | warning | risk, default 'info'
- source_metric // TEXT, nullable, FK → analytics_snapshots.id (ON DELETE SET NULL)
- generated_at  // TEXT (ISO 8601 UTC)
- dismissed     // INTEGER (0/1), default 0
```

## Fitur Utama
Detect pattern, suggest better schedule, suggest habit adjustments, suggest spending warning, highlight risk area, summarize weekly behavior, recommend next action.

## Contoh Insight
- "Kamu paling produktif jam 08.00-11.00" (dari Analytics: best working hours)
- "Pengeluaran gaming naik minggu ini" (dari Analytics: category pattern)
- "Habit workout sering gagal di hari Senin" (dari Analytics: habit completion rate per hari)
- "Jadwal malam terlalu padat" (dari Analytics: time distribution)
- "Tidur terlalu larut membuat produktivitas turun" (dari korelasi dua metrik Analytics)

## Integrasi
- **Read-only dari**: Analytics (`AnalyticsSnapshot`).
- **Output dikonsumsi oleh**: Dashboard (menampilkan satu insight teratas).

## API Outline
```
GET  /insights?type=...&active=true
POST /insights/:id/dismiss
GET  /insights/weekly-summary
```

## Non-Functional Notes
- Harus relevan dan singkat — batasi jumlah insight aktif yang ditampilkan sekaligus (misal maksimal 3-5), bukan daftar panjang yang diabaikan seperti notifikasi spam.
- Generate insight sebaiknya scheduled (harian/mingguan), bukan real-time tiap buka app, karena bergantung pada snapshot Analytics yang juga scheduled.

## Catatan Implementasi (AI Agent)
- **Gotcha**: Insight generation membaca `analytics_snapshots`, **tidak** menghitung ulang pola dari `activity_sessions`/`transactions` dkk. secara langsung. Kalau agent menemukan diri sendiri query tabel modul lain langsung dari Insight service, itu tanda logic-nya salah tempat — harusnya di Analytics.
- Index wajib: `(user_id, dismissed, generated_at)` untuk filter insight aktif — di `16-database-schema.md`.
- Generate insight dipicu setelah Analytics snapshot job selesai (chained, bukan job terpisah dengan jadwal sendiri yang bisa race condition membaca snapshot yang belum ada).
