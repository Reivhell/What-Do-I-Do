# Settings

> **Fase build**: 1 (Core Loop), modul pertama yang dibangun — semua modul lain bergantung pada `category_definitions` dan `user_preferences`. **Dikonsumsi oleh**: Activity Tracker (category_time_mapping), Analytics (category_time_mapping), Tasks/Money/Activity Tracker (category_definitions). DDL: `16-database-schema.md` §"15. Settings".

## Tujuan
Tempat mengatur preferensi, akun, notifikasi, kategori, dan konfigurasi aplikasi.

## Peran di Aplikasi
Semua hal teknis dan preferensi pengguna ditaruh di sini agar modul utama tetap bersih dari opsi konfigurasi yang jarang diubah.

## Tampilan Utama
Profile, Preferences, Notifications, Categories, Backup, About.

## Data Model
```
UserProfile
- user_id      // TEXT, PK, FK → users.id
- name         // TEXT, required
- email        // TEXT, required
- avatar_url   // TEXT, nullable
- bio          // TEXT, nullable
- created_at, updated_at

UserPreferences
- user_id                // TEXT, PK, FK → users.id
- theme                  // TEXT CHECK: light | dark, default 'light'
- language               // TEXT, default 'id'
- currency               // TEXT, default 'IDR'
- timezone               // TEXT, default 'Asia/Makassar'
- date_format            // TEXT, default 'DD/MM/YYYY'
- time_format            // TEXT, default '24h'
- category_time_mapping  // TEXT (JSON: activity category → productive/leisure/sleep), default '{}' — dipakai Activity Tracker & Analytics
- created_at, updated_at

NotificationSettings
- user_id                    // TEXT, PK, FK → users.id
- planner_reminder_enabled   // INTEGER (0/1), default 1
- habit_reminder_enabled     // INTEGER (0/1), default 1
- budget_alert_enabled       // INTEGER (0/1), default 1
- goal_reminder_enabled      // INTEGER (0/1), default 1
- achievement_alert_enabled  // INTEGER (0/1), default 1
- created_at, updated_at

CategoryDefinition          // custom categories per user, per domain
- id          // TEXT, UUID
- user_id     // TEXT, FK → users.id
- domain      // TEXT CHECK: activity | task | money
- name        // TEXT, required
- color       // TEXT, required
- created_at, updated_at
- UNIQUE (user_id, domain, name)
```

## Fitur Utama
Edit profile, change password, theme, language, currency, timezone, date format, notification settings, category management, export/import data, backup/restore, sign out.

## Subhalaman
| Subhalaman | Isi |
|---|---|
| Profile | nama, email, avatar, bio |
| Preferences | tema, format tanggal/waktu, mata uang default |
| Notifications | planner/habit reminder, budget alert, goal reminder, achievement alert |
| Categories | activity categories, task categories, money categories (custom per domain) |
| Backup | export JSON/CSV, import data, sync status |
| About | versi aplikasi, build info, policy, credits |

## Integrasi
- `category_time_mapping` di sini dikonsumsi oleh Activity Tracker & Analytics untuk klasifikasi productive/leisure/sleep (lihat catatan di `04-activity-tracker.md`).
- `CategoryDefinition` dikonsumsi oleh Tasks, Money, Activity Tracker untuk daftar kategori yang bisa dipilih user (menggantikan kategori hardcoded di masing-masing modul).

## API Outline
```
GET    /settings/profile
PATCH  /settings/profile
POST   /settings/change-password
GET    /settings/preferences
PATCH  /settings/preferences
GET    /settings/notifications
PATCH  /settings/notifications
GET    /settings/categories?domain=activity|task|money
POST   /settings/categories
DELETE /settings/categories/:id
GET    /settings/export?format=json|csv
POST   /settings/import
```

## Non-Functional Notes
- Harus rapi dan mudah ditemukan — hindari opsi yang jarang dipakai menumpuk di satu halaman tanpa pengelompokan jelas.
- Export/import harus mencakup semua modul (Tasks, Planner, Habits, Goals, Money, Activity Tracker) dalam satu paket terstruktur, bukan per-modul terpisah, supaya restore data konsisten.

## Catatan Implementasi (AI Agent)
- **Build ini duluan**: `category_definitions` dan `user_preferences.category_time_mapping` dikonsumsi modul lain sejak Fase 1 — Tasks, Money, dan Activity Tracker semua butuh `CategoryDefinition` untuk dropdown kategori, jangan hardcode enum kategori di modul-modul itu.
- Auth model proyek ini adalah **app-lock lokal** (PIN/biometric opsional), bukan JWT multi-user — `users.password_hash` nullable karena tidak wajib. Tabel `users` tetap ada untuk forward-compat kalau nanti ada multi-akun/sync cloud, tapi realistisnya cuma 1 baris per install saat ini.
- Export/import detail lengkap (format file, validasi versi, `ON CONFLICT DO NOTHING`) ada di `17-offline-sync.md` — jangan reimplementasi logic ini di sini, `15-settings.md` cukup jadi UI entry point yang memanggilnya.
- `category_time_mapping` dan `category_definitions` adalah dua hal berbeda: yang pertama peta klasifikasi productive/leisure/sleep (dipakai Activity Tracker & Analytics), yang kedua daftar kategori itu sendiri per domain (activity/task/money) — jangan digabung jadi satu struktur.
