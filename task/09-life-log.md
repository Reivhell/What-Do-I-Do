# Life Log

> **Fase build**: 4 (Insight Layer). **Dependency**: Activity Tracker, Planner, Money, Habits (semua read-only, harus sudah ada data). **Tidak dikonsumsi modul lain** — ini adalah endpoint tampilan akhir. DDL: `16-database-schema.md` §"09. Life Log" (hanya `life_log_annotations` yang tabel nyata).

## Tujuan
Menyajikan timeline harian dari kejadian-kejadian yang dialami user — arsip kehidupan yang bisa dibaca ulang, bukan diary penuh drama.

## Peran di Aplikasi
**Life Log tidak memiliki tabel data sendiri.** Ini adalah view agregat read-only yang menyusun ulang data dari Activity Tracker, Planner, Money, dan Habits menjadi satu timeline kronologis. Ini perbaikan penting dari spek lama, yang menyiratkan Life Log punya entity `LogEntry` sendiri — itu akan duplikat dengan Activity Tracker dan berisiko data tidak sinkron.

Satu-satunya data yang benar-benar dimiliki Life Log adalah **anotasi manual** (catatan tambahan yang user tempel ke suatu titik waktu, di luar apa yang sudah tercatat otomatis).

## Tampilan Utama
Timeline, Daily Review, History.

## Data Model
```
LifeLogAnnotation   // satu-satunya tabel milik modul ini
- id                // TEXT, UUID
- user_id           // TEXT, FK → users.id
- timestamp         // TEXT (ISO 8601 UTC)
- title             // TEXT, required
- description       // TEXT, nullable
- note              // TEXT, nullable
- created_at, updated_at

// Timeline item itu sendiri dirakit on-the-fly dari:
// - ActivitySession (Activity Tracker)
// - PlannerEvent yang completed (Planner)
// - Transaction (Money)
// - HabitLog (Habits)
// digabung berdasarkan timestamp lewat UNION ALL, TIDAK disimpan sebagai copy/tabel baru.
```

## Fitur Utama
- Timeline view (agregasi lintas modul, urut waktu)
- Add/edit/delete annotation manual
- Search by date, filter by source type
- Daily summary (jumlah aktivitas per hari, otomatis dihitung dari data agregat)
- Export timeline (gabungan semua sumber jadi satu file)

## Contoh Isi Timeline
Bangun (annotation manual) → sarapan (activity session) → coding (activity session) → meeting (planner event completed) → makan siang → gaming → olahraga (habit log) → tidur.

## Integrasi
- **Read-only dari**: Activity Tracker, Planner, Money, Habits.
- **Tidak pernah menulis balik** ke modul-modul tersebut.

## Output Penting
Total aktivitas per hari, urutan kejadian, pola rutin harian, summary singkat harian.

## API Outline
```
GET  /life-log/timeline?date=...        → agregasi dari 4 sumber + annotation
POST /life-log/annotations
PATCH /life-log/annotations/:id
DELETE /life-log/annotations/:id
GET  /life-log/export?format=json|csv
```

## Non-Functional Notes
- Karena ini agregasi lintas 4 sumber data, query timeline wajib pakai index yang baik di masing-masing tabel sumber (`user_id + date`) — hindari full scan tiap kali timeline dibuka.
- Harus terasa seperti arsip pasif, bukan beban input tambahan — annotation manual sifatnya opsional, bukan wajib diisi tiap hari.

## Catatan Implementasi (AI Agent)
- **Gotcha kritis**: jangan pernah buat tabel `LogEntry`/`TimelineItem` baru — ini pelanggaran arsitektur eksplisit (lihat `AI-AGENT-GUIDE.md` §3). `GET /life-log/timeline` adalah satu query `UNION ALL` terhadap 4 tabel sumber + `life_log_annotations`, di-`ORDER BY timestamp`.
- Index yang dipakai query ini sudah ada dari modul sumbernya masing-masing (`activity_sessions(user_id, created_at)`, `planner_events(user_id, date)`, `transactions(user_id, date)`, `habit_logs(habit_id, date)`) — tidak perlu index baru khusus Life Log.
- `PlannerEvent` yang diikutkan hanya `status='completed'` — event yang masih `scheduled`/`missed`/`cancelled` tidak masuk timeline realisasi.
