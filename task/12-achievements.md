# Achievements

> **Fase build**: 5 (Retensi & Personalisasi), terakhir. **Dependency**: Activity Tracker, Habits, Goals, Money (event source, read-only — semua modul ini harus sudah stabil). **Tidak dikonsumsi modul lain.** DDL: `16-database-schema.md` §"12. Achievements".

## Tujuan
Memberi reward visual untuk pencapaian user agar aplikasi terasa lebih hidup dengan unsur gamification.

## Peran di Aplikasi
Achievements memanfaatkan data yang sudah ada di modul lain — tidak menambah domain baru, hanya memberi penghargaan atas perilaku yang bagus. Evaluasi kondisi unlock dilakukan oleh **rule engine** yang membaca event dari modul lain (Activity Tracker, Planner, Habits, Goals, Money), bukan polling manual tiap achievement satu per satu.

## Tampilan Utama
Unlocked, Locked, Progress, Badges, Levels.

## Data Model
```
AchievementDefinition   // master data, tidak per-user, tidak ada user_id
- id                  // TEXT, UUID
- title               // TEXT, required
- description         // TEXT, required
- requirement_type    // TEXT, mis. total_hours_tracked | streak_days | goal_completed | budget_kept
- requirement_value   // REAL, required
- badge_type          // TEXT, required
- category            // TEXT, required

UserAchievement
- id              // TEXT, UUID
- user_id         // TEXT, FK → users.id
- achievement_id  // TEXT, FK → achievement_definitions.id (ON DELETE CASCADE)
- progress        // REAL, default 0 — current value menuju requirement_value
- unlocked_at     // TEXT, nullable (ISO 8601 UTC) — NULL jika belum unlock
- created_at, updated_at
- UNIQUE (user_id, achievement_id)
```

## Fitur Utama
Unlock achievement, progress tracking, badge list, level system, reward detail, achievement history.

## Contoh Achievement
First activity tracked, first planner event completed, 7 day streak, 100 hours tracked, first goal completed, first budget kept under limit, no missed habit for 30 days.

## Integrasi
- **Trigger sumber**: event dari Activity Tracker (session completed), Habits (streak update), Goals (milestone/goal completed), Money (budget period closed).
- Rule engine mengevaluasi `requirement_type` terhadap event masuk, update `UserAchievement.progress`, dan set `unlocked_at` saat threshold tercapai.
- Achievements **tidak pernah menulis balik** ke modul sumber (murni pengamat/listener).

## API Outline
```
GET  /achievements                  → semua definition + progress user
GET  /achievements/unlocked
GET  /achievements/:id
POST /achievements/evaluate         → dipanggil internal oleh event listener, bukan user-facing
```

## Non-Functional Notes
- Evaluasi achievement sebaiknya event-driven (dipicu saat data sumber berubah) bukan cron job yang scan semua data tiap waktu — lebih murah dan lebih instan feedback-nya buat user.
- Harus terasa memotivasi, bukan kekanak-kanakan — copywriting badge sebaiknya netral-dewasa, bukan childish.

## Catatan Implementasi (AI Agent)
- Evaluasi dipanggil in-process (function call langsung, bukan message queue) setiap endpoint relevan selesai menulis (`POST /activity/stop`, `POST /habits/:id/log`, `PATCH /goals/:id/milestones/:milestoneId`, dst.) — lihat `18-scaling-notes.md` §4.
- **Wajib idempotent**: pola UPSERT by `(user_id, achievement_id)` — evaluasi yang jalan dua kali (misal karena retry setelah app di-kill) tidak boleh menghasilkan duplikat atau `unlocked_at` yang berubah-ubah.
- `AchievementDefinition` tidak per-user — seed data ini sekali saat migration/setup awal, bukan dibuat lewat endpoint user-facing.
