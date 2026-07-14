# Goals

> **Fase build**: 2 (Habit & Goal), setelah Habits. **Dependency**: Habits, Tasks, Planner (semua hanya *link ke* Goal, arah satu jalur — lihat §"Peran"). **Dikonsumsi oleh**: Achievements, Analytics, Statistics. DDL lengkap: `16-database-schema.md` §"07. Goals".

## Tujuan
Menyimpan target jangka menengah dan panjang yang ingin dicapai user.

## Peran di Aplikasi
Goal adalah arah besar. Habit, Task, dan Planner adalah tindakan kecil yang menggerakkan goal. **Goal tidak pernah men-generate apa pun ke modul lain** — arah relasinya satu arah: Habit/Task/Planner Event yang me-link ke Goal, bukan sebaliknya (kebalikan dari kesan di spek lama yang menyebut "goal bisa link ke habits/tasks/planner" secara ambigu).

Pengecualian: **Milestone** goal boleh diturunkan jadi satu Planner Event spesifik (lihat integrasi di bawah) — ini satu-satunya arah tulis dari Goal ke modul lain, dan sifatnya manual, bukan otomatis.

## Tampilan Utama
Long Term, Milestones, Progress.

## Data Model
```
Goal
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- title               // TEXT, required
- description         // TEXT, nullable
- target_date         // TEXT (YYYY-MM-DD), nullable
- status              // TEXT CHECK: active | completed | archived | at_risk
- progress_percent    // REAL, default 0 — CACHE, derived dari milestone completion, recompute tiap milestone berubah
- created_at, updated_at

Milestone
- id                  // TEXT, UUID
- goal_id             // TEXT, FK → goals.id (ON DELETE CASCADE)
- title               // TEXT, required
- target_date         // TEXT (YYYY-MM-DD), nullable
- is_completed        // INTEGER (0/1), default 0
- generated_event_id  // TEXT, nullable, FK → planner_events.id (ON DELETE SET NULL)
- created_at, updated_at
```

Relasi masuk (bukan tabel baru, hanya foreign key dari modul lain):
- `Habit.linked_goal_id`
- `Task.linked_goal_id`
- `PlannerEvent.source_id` (ketika `source_type = goal_milestone`)

## Fitur Utama
- Create/edit/delete goal
- Set target date
- Add/edit milestones, track progress
- Link habits/tasks yang mendukung goal ini (view, bukan tulis balik)
- Notes, archive

## Contoh Goal
Lulus sertifikasi, bikin portofolio, hemat uang, turun berat badan, belajar skill baru.

## Output Penting
Progress percentage, milestone completed, deadline approaching, goal at risk (dihitung: `target_date` mendekat tapi `progress_percent` jauh dari selaras — logika detailnya di Analytics/Insights, Goals hanya expose datanya).

## API Outline
```
GET    /goals
POST   /goals
PATCH  /goals/:id
DELETE /goals/:id
POST   /goals/:id/milestones
PATCH  /goals/:id/milestones/:milestoneId
POST   /goals/:id/milestones/:milestoneId/schedule   → buat Planner Event
GET    /goals/:id/linked-items    → daftar Habit/Task yang linked_goal_id = ini
```

## Non-Functional Notes
- Goal harus konkret dan bisa dipecah jadi milestone — UI sebaiknya mewajibkan minimal satu milestone sebelum goal dianggap "aktif penuh", supaya tidak jadi wishlist kosong tanpa progress terukur.
- `progress_percent` sebagai derived value harus di-recompute setiap milestone berubah, bukan disimpan sebagai angka independen yang bisa drift dari kenyataan.

## Catatan Implementasi (AI Agent)
- **Gotcha kritis**: Goal **tidak pernah** menulis ke modul lain, kecuali satu pengecualian eksplisit: `POST /goals/:id/milestones/:milestoneId/schedule` membuat satu `planner_event` (manual, dipicu user, bukan otomatis). Semua relasi masuk lainnya (`Habit.linked_goal_id`, `Task.linked_goal_id`) murni FK satu arah — lihat `AI-AGENT-GUIDE.md` §3 & §6.
- `progress_percent` recompute: rekomendasi service layer (NestJS) dipanggil tiap `PATCH /goals/:id/milestones/:milestoneId`, bukan trigger DB — trigger SQLite contoh ada di `16-database-schema.md` tapi lebih sulit ditest, dan proyek ini merekomendasikan service layer untuk konsistensi dengan pola `habits.current_streak`.
- Tidak ada tabel baru untuk "relasi masuk" — `GET /goals/:id/linked-items` cukup query `WHERE linked_goal_id = :id` ke tabel `tasks` dan `habits` terpisah, lalu digabung di response.
