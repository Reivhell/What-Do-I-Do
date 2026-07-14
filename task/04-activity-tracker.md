# Activity Tracker

> **Fase build**: 1 (Core Loop), setelah Planner. **Dependency**: Planner (source_event_id, opsional). **Dikonsumsi oleh**: Life Log, Analytics, Statistics, Dashboard, Achievements. DDL lengkap: `16-database-schema.md` §"04. Activity Tracker". **Baca `17-offline-sync.md` sebelum implementasi live timer.**

## Tujuan
Mencatat aktivitas yang benar-benar dilakukan, bukan yang cuma direncanakan.

## Peran di Aplikasi
**Satu-satunya pemilik data realisasi waktu** di aplikasi. Semua analisis produktivitas, disiplin, dan distribusi waktu berasal dari sini. Berbeda dari Life Log (`09-life-log.md`), yang hanya menampilkan data ini dalam bentuk timeline naratif — Life Log tidak punya tabel sendiri.

## Tampilan Utama
Live Timer, Manual Log, History.

## Data Model
```
ActivitySession
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- activity_name       // TEXT, required
- category            // TEXT, required — mengacu ke CategoryDefinition (domain=activity) di Settings, bukan hardcoded enum
- start_time          // TEXT (ISO 8601 UTC)
- end_time            // TEXT, nullable — NULL selagi live timer masih berjalan
- duration_minutes    // INTEGER, nullable — derived saat stop, NULL selagi berjalan
- source              // TEXT CHECK: live | manual
- note                // TEXT, nullable
- source_event_id     // TEXT, nullable, FK → planner_events.id (ON DELETE SET NULL)
- deleted_at          // TEXT, nullable — soft delete wajib, tidak pernah hard delete
- created_at, updated_at
```

## Fitur Utama
- Start / pause / resume / stop / switch activity
- Manual log (isi retroaktif tanpa live timer)
- Edit duration (koreksi kalau lupa stop)
- Add session note
- History list dengan search & filter (by activity/date/category)

## Integrasi
- **Planner → Activity Tracker**: saat event dimulai dari Planner, session baru dibuat dengan `source_event_id` terisi otomatis. User juga bisa start activity spontan (tanpa event Planner) — `source_event_id` tetap null, ini valid.
- **Activity Tracker → Life Log, Analytics, Statistics, Dashboard**: read-only, satu arah. Modul-modul ini tidak pernah menulis balik ke session.

## Output Utama
- Total durasi per aktivitas/kategori
- Aktivitas paling sering, paling lama
- Total waktu produktif vs leisure vs tidur (klasifikasi berdasarkan `category`, aturan mapping category→productive/leisure/sleep didefinisikan di Settings → Categories agar user bisa kustomisasi)

## API Outline
```
POST /activity/start          → { activity_name, category, source_event_id? }
POST /activity/pause/:id
POST /activity/resume/:id
POST /activity/stop/:id
POST /activity/manual-log     → { activity_name, category, start_time, end_time, note? }
PATCH /activity/:id           → koreksi duration/note
GET  /activity/history?filter=...
GET  /activity/current        → aktivitas yang sedang berjalan (untuk Dashboard)
```

## Non-Functional Notes
- **Target keras**: start activity harus bisa dilakukan dalam 1 tap dari Dashboard. Kalau butuh > 2 klik, user cenderung berhenti memakainya.
- Live timer harus tetap berjalan secara lokal walau app di-background atau offline; sinkron ke server saat stop atau reconnect.
- Switch activity (ganti aktivitas tanpa reset) = stop session lama + start session baru dalam satu operasi atomik, bukan dua request terpisah yang bisa gagal di tengah.

## Catatan Implementasi (AI Agent)
- Index wajib (partial, `WHERE deleted_at IS NULL`): `(user_id, created_at)`, `(user_id, category)`, plus `(source_event_id)` untuk lookup dari Planner — lihat `16-database-schema.md`.
- **Live timer app-kill**: `start_time` wajib ditulis ke SQLite saat `start` dipanggil, bukan cuma disimpan di React/Compose state. Saat app dibuka lagi, cek row dengan `end_time IS NULL` dan tawarkan "lanjutkan" atau "stop sekarang" — detail lengkap di `17-offline-sync.md`.
- `duration_minutes` dihitung `now() - start_time` di client secara lokal selama timer berjalan (bukan query server berulang); final di-`UPDATE` ke DB saat `stop`.
- `category` di sini **bukan** enum hardcoded — validasi terhadap `category_definitions` (domain='activity') dari Settings, lihat `15-settings.md`.
