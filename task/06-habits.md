# Habits

> **Fase build**: 2 (Habit & Goal), setelah Phase 1 stabil. **Dependency**: Planner (untuk auto-generate event), Goals (linked_goal_id, opsional). **Dikonsumsi oleh**: Planner (generate event), Achievements, Analytics, Statistics, Life Log. DDL lengkap: `16-database-schema.md` §"06. Habits".

## Tujuan
Mengelola kebiasaan berulang yang ingin dijaga secara konsisten.

## Peran di Aplikasi
Habit adalah pola berulang. Habit **memiliki aturan pengulangan** (`repeat_rule`) yang dipakai Planner untuk men-generate event secara otomatis — Habit sendiri tidak menyimpan jadwal per-tanggal, itu tanggung jawab Planner Event (lihat `03-planner.md`).

## Tampilan Utama
Habit List, Repeat Schedule, Streak, Statistics.

## Data Model
```
Habit
- id                    // TEXT, UUID
- user_id               // TEXT, FK → users.id
- name                  // TEXT, required
- target_frequency      // TEXT CHECK: daily | weekly | monthly | custom
- repeat_rule           // TEXT (JSON), required — dipakai Planner untuk generate event
- current_streak        // INTEGER, default 0 — CACHE, wajib direcompute dari habit_logs, jangan increment manual
- best_streak           // INTEGER, default 0 — CACHE, sama seperti di atas
- completion_count      // INTEGER, default 0
- missed_count          // INTEGER, default 0
- notes                 // TEXT, nullable
- linked_goal_id        // TEXT, nullable, FK → goals.id (ON DELETE SET NULL)
- created_at, updated_at

HabitLog
- id                    // TEXT, UUID
- habit_id              // TEXT, FK → habits.id (ON DELETE CASCADE)
- date                  // TEXT (YYYY-MM-DD)
- status                // TEXT CHECK: done | skipped | missed
- linked_event_id       // TEXT, nullable, FK → planner_events.id (ON DELETE SET NULL)
- linked_session_id     // TEXT, nullable, FK → activity_sessions.id (ON DELETE SET NULL)
- created_at, updated_at
- UNIQUE (habit_id, date)
```

## Fitur Utama
- Create/edit/delete habit
- Repeat schedule (daily/weekly/monthly target)
- Streak counter (current & best)
- Completion rate
- Mark done / skip
- Auto-generate ke Planner
- Reminder

## Contoh Habit
Minum air, workout, baca 20 menit, belajar bahasa, tidur jam tertentu.

## Integrasi
- **Habits → Planner**: `repeat_rule` dipakai Planner untuk generate event ke depan secara batch (lihat non-functional notes di `03-planner.md`).
- **Habits → Activity Tracker**: opsional — habit yang butuh durasi (misal "olahraga 30 menit") bisa terhubung ke session tracker; habit yang cukup checkbox (misal "minum air") tidak perlu.
- **Habits ← Goals**: habit bisa `linked_goal_id`, tapi tidak menulis balik progress ke Goal secara otomatis kecuali didefinisikan sebagai milestone (lihat `07-goals.md`).

## Output Penting
Streak aktif, completion rate, habit yang sering gagal, habit paling konsisten.

## API Outline
```
GET    /habits
POST   /habits
PATCH  /habits/:id
DELETE /habits/:id
POST   /habits/:id/log            → { date, status }
GET    /habits/:id/logs?range=...
```

## Non-Functional Notes
- Harus fleksibel untuk kebiasaan ringan (checkbox harian) maupun target serius (durasi/count tertentu) — jangan paksakan satu tipe input untuk semua habit.
- Streak calculation harus tahan terhadap edit retroaktif (misal user mengisi log kemarin yang terlewat) — recompute dari `HabitLog`, jangan simpan streak sebagai counter yang hanya increment maju.

## Catatan Implementasi (AI Agent)
- **Gotcha kritis**: `current_streak`/`best_streak` adalah cache — recompute penuh dari `habit_logs` di service layer (NestJS) setiap `POST /habits/:id/log`, **jangan** `current_streak = current_streak + 1`. Lihat `AI-AGENT-GUIDE.md` §7.
- `UNIQUE (habit_id, date)` di `habit_logs` memastikan satu log per hari per habit — pakai `INSERT ... ON CONFLICT (habit_id, date) DO UPDATE` untuk edit retroaktif, bukan cek-lalu-insert manual.
- Generate `planner_events` dari `repeat_rule` adalah job idempotent (Fase 2, lihat `18-scaling-notes.md` §4) — habit sendiri tidak menyimpan tanggal event, hanya aturannya.
