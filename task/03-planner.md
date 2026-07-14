# Planner

> **Fase build**: 1 (Core Loop), setelah Tasks. **Dependency**: Tasks (source_type=task), Habits (source_type=habit, ditambahkan Fase 2), Goals (source_type=goal_milestone, ditambahkan Fase 2). **Dikonsumsi oleh**: Activity Tracker (realize), Dashboard, Analytics, Life Log. DDL lengkap: `16-database-schema.md` §"03. Planner".

## Tujuan
Modul perencanaan waktu untuk menyusun aktivitas sebelum dilakukan.

## Peran di Aplikasi
**Planner adalah satu-satunya pemilik data jadwal waktu di seluruh aplikasi.** Task, Habit, dan Goal tidak pernah menyimpan `start_time`/`end_time` sendiri — kalau mereka perlu dijadwalkan, mereka membuat (atau memicu pembuatan) Planner Event yang menyimpan referensi balik ke sumbernya. Activity Tracker menyimpan realisasinya setelah event dijalankan.

## Tampilan Utama
Daily, 3 Days, Weekly, Monthly.

## Data Model
```
PlannerEvent
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- title               // TEXT, required
- date                // TEXT (YYYY-MM-DD)
- start_time          // TEXT (ISO 8601 UTC)
- end_time            // TEXT (ISO 8601 UTC), CHECK end_time > start_time
- duration_minutes    // INTEGER, derived saat write, disimpan untuk query cepat
- category            // TEXT, nullable
- priority            // TEXT CHECK: low | medium | high
- notes               // TEXT, nullable
- repeat_rule         // TEXT (JSON: freq, interval, days_of_week, end_condition), nullable
- reminder_time       // TEXT, nullable
- source_type         // TEXT CHECK: manual | task | habit | goal_milestone
- source_id           // TEXT, nullable, polymorphic — TIDAK ADA FK constraint, divalidasi di application layer sesuai source_type
- status              // TEXT CHECK: scheduled | in_progress | completed | missed | cancelled
- realized_session_id // TEXT, nullable, FK → activity_sessions.id (ON DELETE SET NULL)
- created_at, updated_at
```

## Fitur Utama
- Create/edit/delete event
- Drag and drop schedule
- Time blocking
- Repeat schedule (disimpan di `repeat_rule`, instance individual di-generate sebagai row terpisah agar bisa diedit per-instance)
- Reminder, priority, notes, color category
- Calendar view

## Integrasi (arah data eksplisit)
- **Tasks → Planner**: Task dengan due date bisa "Schedule to Planner", membuat `PlannerEvent` dengan `source_type=task`. Edit judul/notes tetap dilakukan di Task; Planner hanya menyalin snapshot ringan saat penjadwalan (title, tidak lebih).
- **Habits → Planner**: Habit dengan repeat rule men-generate `PlannerEvent` otomatis (`source_type=habit`) sesuai jadwalnya. Repeat rule aslinya tetap dimiliki Habit; Planner hanya mengeksekusi generate.
- **Goals → Planner**: Milestone goal bisa diturunkan jadi satu event terjadwal (`source_type=goal_milestone`).
- **Planner → Activity Tracker**: saat event dijalankan (start), sistem membuat Activity Tracker session baru dengan `source_event_id` menunjuk balik ke event ini, dan `PlannerEvent.realized_session_id` diisi.

## Output Penting
- Jadwal hari ini, jadwal yang lewat, jadwal selesai, jadwal gagal dijalankan
- Planned vs actual comparison (dihitung dengan membandingkan `PlannerEvent` vs `Activity Tracker session` yang terhubung — logikanya tinggal di Analytics, Planner hanya menyediakan datanya)

## API Outline
```
GET    /planner/events?range=daily|3days|weekly|monthly&date=...
POST   /planner/events
PATCH  /planner/events/:id
DELETE /planner/events/:id
POST   /planner/events/:id/start        → trigger pembuatan Activity Tracker session
POST   /planner/events/from-task/:taskId
POST   /planner/events/from-goal-milestone/:milestoneId
```

## Non-Functional Notes
- Harus enak dibaca dan diedit — jangan tambah step konfirmasi untuk operasi umum seperti geser jadwal (drag and drop harus langsung persist, dengan undo, bukan dialog konfirmasi).
- Generate event dari repeat rule (Habit) dilakukan secara batch di background (misal: generate 4 minggu ke depan), bukan on-demand tiap render kalender.

## Catatan Implementasi (AI Agent)
- Index wajib: `(user_id, date)` untuk render kalender, `(source_type, source_id)` untuk lookup balik dari Task/Habit/Goal — sudah di `16-database-schema.md`.
- `realized_session_id` dan `activity_sessions.source_event_id` saling mereferensikan (circular) — ini valid di SQLite tanpa `ALTER TABLE` tambahan, lihat `AI-AGENT-GUIDE.md` §5 "Circular Reference".
- Batch generate event dari Habit repeat rule adalah job idempotent (`node-cron`, bukan on-demand) — cek dulu event tanggal itu sudah ada sebelum insert, lihat `18-scaling-notes.md` §4.
- `source_id` polymorphic tidak punya FK — validasi manual di endpoint `POST /planner/events/from-task/:taskId` dan `from-goal-milestone/:milestoneId` bahwa target benar-benar ada sebelum insert.
