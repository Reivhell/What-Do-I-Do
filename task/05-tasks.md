# Tasks

> **Fase build**: 1 (Core Loop). **Dependency**: Settings (categories, opsional untuk tag). **Dikonsumsi oleh**: Planner (scheduling), Goals (linked_goal_id masuk), Dashboard, Analytics, Statistics. DDL lengkap: `16-database-schema.md` §"05. Tasks".

## Tujuan
Menyimpan daftar pekerjaan yang perlu diselesaikan tanpa harus selalu dijadwalkan dalam kalender.

## Peran di Aplikasi
Tasks adalah daftar kerja; Planner adalah jadwal. Task **tidak menyimpan start/end time** — begitu user ingin menjadwalkannya, sistem membuat Planner Event terpisah yang mereferensikan task ini (lihat `03-planner.md`).

## Tampilan Utama
Inbox, Today, Upcoming, Completed — ini adalah **view/filter**, bukan status tersimpan terpisah dari field `status` (lihat di bawah), supaya tidak ada dua sumber kebenaran soal "task ini masuk kategori apa".

## Data Model
```
Task
- id                    // TEXT, UUID
- user_id               // TEXT, FK → users.id
- title                 // TEXT, required
- description           // TEXT, nullable
- status                // TEXT CHECK: inbox | active | completed | archived
- priority              // TEXT CHECK: low | medium | high
- due_date              // TEXT (YYYY-MM-DD), nullable
- tags                  // TEXT (JSON array string), default '[]'
- notes                 // TEXT, nullable
- linked_goal_id        // TEXT, nullable, FK → goals.id (ON DELETE SET NULL)
- scheduled_event_id    // TEXT, nullable, FK → planner_events.id (ON DELETE SET NULL)
- created_at, updated_at // TEXT, ISO 8601 UTC

Subtask
- id                    // TEXT, UUID
- task_id               // TEXT, FK → tasks.id (ON DELETE CASCADE)
- title                 // TEXT, required
- is_completed          // INTEGER (0/1), default 0
- created_at, updated_at
```

## Fitur Utama
- Add/edit/delete task
- Set due date, priority
- Checklist/subtasks
- Tag, notes, reminder
- Archive
- Convert to Planner Event ("Schedule")

## Status
`inbox`, `active`, `completed`, `archived`. Field `due_date` yang menentukan apakah task muncul di view "Today" atau "Upcoming" — bukan status terpisah.

## Interaksi
- Task dari Inbox/Capture bisa diproses jadi Task baru
- Task bisa dijadwalkan ke Planner (membuat event, mengisi `scheduled_event_id`)
- Task selesai mempengaruhi Analytics/Statistics (read-only konsumsi data)

## API Outline
```
GET    /tasks?view=inbox|today|upcoming|completed
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id
POST   /tasks/:id/schedule       → buat Planner Event, isi scheduled_event_id
POST   /tasks/:id/subtasks
PATCH  /tasks/:id/subtasks/:subId
```

## Non-Functional Notes
- Harus sederhana dan cepat dipindah antar status (drag antar kolom kalau tampilan board, atau swipe action di mobile).
- Subtask completion tidak otomatis menyelesaikan parent task — biarkan eksplisit, supaya user tetap kontrol penuh (mencegah task dianggap selesai padahal ada catatan tambahan yang belum di-review).

## Catatan Implementasi (AI Agent)
- Index wajib: `(user_id, created_at)` untuk listing, `(user_id, status, due_date)` untuk view Today/Upcoming — sudah didefinisikan di `16-database-schema.md`, jangan query tanpa index ini.
- `scheduled_event_id` diisi lewat `POST /tasks/:id/schedule`, bukan `PATCH` manual — endpoint ini yang bertanggung jawab membuat `planner_events` row terkait dalam satu operasi.
- Jangan tambahkan field `start_time`/`end_time` ke tabel ini kapan pun diminta — itu domain Planner, lihat `AI-AGENT-GUIDE.md` §3.
