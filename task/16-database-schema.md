# Database Schema (SQLite DDL, via Drizzle)

> **AI Agent**: ini adalah DDL siap-eksekusi — copy-paste per tabel langsung ke migration Drizzle. Untuk urutan implementasi tabel per fase build, lihat `AI-AGENT-GUIDE.md` §4 dan §10. Untuk keputusan tipe data yang sudah final (jangan diubah tanpa instruksi eksplisit), lihat `AI-AGENT-GUIDE.md` §5.

## Tujuan
Dokumen ini menerjemahkan seluruh Data Model di `01-15` + entity dasar (`users`) menjadi DDL SQLite yang siap dieksekusi sebagai migration lewat Drizzle ORM. Setiap tabel merujuk balik ke modul asalnya supaya tetap traceable. Konvensi implisit dari `00-architecture.md` (UUID-as-TEXT PK, `created_at`, `updated_at`, `user_id`, status via TEXT+CHECK, soft delete untuk data finansial/log) dibuat literal di sini.

**Perubahan dari versi Postgres sebelumnya:** engine database pindah dari PostgreSQL ke SQLite lokal (satu file per install, web maupun mobile terpisah — lihat `00-architecture.md`). Ini bukan cuma ganti nama engine; beberapa tipe dan konstruk Postgres tidak punya padanan langsung di SQLite. Tabel mapping-nya:

| Postgres | SQLite | Catatan |
|---|---|---|
| `UUID DEFAULT gen_random_uuid()` | `TEXT PRIMARY KEY` | SQLite tidak punya fungsi UUID native. ID digenerate di application layer (`crypto.randomUUID()`) atau via Drizzle `$defaultFn()`, bukan `DEFAULT` di kolom. |
| `TIMESTAMPTZ` | `TEXT` (ISO 8601 UTC, mis. `2026-07-07T09:00:00.000Z`) | SQLite tidak punya tipe datetime native. String ISO tetap bisa di-`ORDER BY`/dibandingkan secara leksikografis dengan benar selama format konsisten. |
| `DATE` | `TEXT` (`YYYY-MM-DD`) | Sama alasannya. |
| `BOOLEAN` | `INTEGER` (0/1) | Drizzle `boolean` mode meng-handle konversi otomatis di layer TS. |
| `JSONB` | `TEXT` (JSON string) | Drizzle punya `text({ mode: 'json' })` yang serialize/parse otomatis. Tidak ada query operator JSONB (`->`, `@>`) — filter JSON dilakukan di application layer, bukan di SQL. |
| `TEXT[]` (array, mis. `tags`) | `TEXT` (JSON array string) | Sama pola dengan JSONB di atas. |
| `NUMERIC(14,2)` (uang) | `REAL` — **final, keputusan proyek** | Skema di bawah pakai `REAL` untuk `amount`/`current_balance`/`amount_limit`. INTEGER-cents sempat dipertimbangkan (mengeliminasi floating-point rounding error di `SUM()` bertumpuk), tapi untuk skala data personal single-user di proyek ini (bukan sistem akuntansi multi-pihak dengan audit ketat), `REAL` dianggap cukup presisi. **Agent: jangan ubah tipe ini ke INTEGER tanpa instruksi eksplisit** — ini bukan celah yang belum diputuskan, sudah final. |
| `CREATE TYPE ... AS ENUM (...)` | `TEXT NOT NULL CHECK (col IN (...))` | SQLite tidak punya tipe ENUM. Constraint tetap ditegakkan di level DB lewat `CHECK`. |
| Partial index (`WHERE deleted_at IS NULL`) | **Tetap didukung**, sintaks sama | SQLite mendukung partial index secara native, tidak ada perubahan. |
| `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` (circular ref workaround) | **Tidak diperlukan** | Lihat bagian "Circular References" di bawah — SQLite tidak memvalidasi keberadaan tabel target FK saat `CREATE TABLE` diparse (baru ditegakkan saat DML dan `PRAGMA foreign_keys=ON`), jadi forward-reference antar tabel yang saling mereferensikan bisa langsung ditulis inline tanpa `ALTER TABLE` terpisah. |
| `pgcrypto` extension | Dihapus | Tidak diperlukan lagi karena UUID tidak digenerate di level DB. |

## Konvensi Global

```sql
-- Wajib diaktifkan per koneksi (SQLite tidak enforce FK secara default, dan setting ini tidak persisten antar koneksi)
PRAGMA foreign_keys = ON;
```

Trigger `updated_at` di SQLite ditulis per tabel (bukan fungsi generik lintas tabel seperti Postgres `plpgsql`), tapi pola-nya seragam:
```sql
CREATE TRIGGER trg_<table>_updated_at
AFTER UPDATE ON <table>
FOR EACH ROW
BEGIN
  UPDATE <table> SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
```
Trigger ini dihilangkan dari tiap blok tabel demi keterbacaan, tapi **wajib** ada di migration asli untuk semua tabel yang punya `updated_at`. Dengan Drizzle, pola ini biasanya ditulis sekali di file migration SQL custom (`drizzle/meta` tidak generate trigger otomatis dari schema TS).

Contoh definisi tabel di Drizzle (pola yang sama diterapkan ke semua tabel di bawah — dokumen ini menulis dalam bentuk SQL murni untuk kejelasan lintas tabel, tapi implementasi sebenarnya di `schema.ts`):

```typescript
// contoh: tasks
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'crypto';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['inbox', 'active', 'completed', 'archived'] }).notNull().default('inbox'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  dueDate: text('due_date'),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  notes: text('notes'),
  linkedGoalId: text('linked_goal_id').references(() => goals.id, { onDelete: 'set null' }),
  scheduledEventId: text('scheduled_event_id').references(() => plannerEvents.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
```

Sisa dokumen ini menulis DDL SQL langsung (lebih ringkas untuk direview lintas 15 modul sekaligus); mapping ke Drizzle schema mengikuti pola di atas per tabel.

---

## 00. Base — Users

*(Bukan modul di `01-15`, tapi jadi parent FK untuk `user_id` di semua tabel lain. Auth flow detail ada di `15-settings.md` — catatan: dengan model app-lock lokal, tabel ini realistisnya cuma berisi satu baris per install, dipertahankan untuk forward-compat kalau nanti ada multi-akun/sync.)*

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,  -- nullable: app-lock lokal (PIN/biometric) tidak wajib set password
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

---

## 15. Settings — Profile, Preferences, Notifications, Categories

*(Ditaruh lebih awal karena `category_definitions` dan `user_preferences.category_time_mapping` dikonsumsi modul lain.)*

```sql
CREATE TABLE user_profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  avatar_url TEXT,
  bio        TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE user_preferences (
  user_id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme                 TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language              TEXT NOT NULL DEFAULT 'id',
  currency              TEXT NOT NULL DEFAULT 'IDR',
  timezone              TEXT NOT NULL DEFAULT 'Asia/Makassar',
  date_format           TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format           TEXT NOT NULL DEFAULT '24h',
  -- category -> productive | leisure | sleep, dipakai Activity Tracker & Analytics; disimpan sebagai JSON string
  category_time_mapping TEXT NOT NULL DEFAULT '{}',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE TABLE notification_settings (
  user_id                   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  planner_reminder_enabled  INTEGER NOT NULL DEFAULT 1,
  habit_reminder_enabled    INTEGER NOT NULL DEFAULT 1,
  budget_alert_enabled      INTEGER NOT NULL DEFAULT 1,
  goal_reminder_enabled     INTEGER NOT NULL DEFAULT 1,
  achievement_alert_enabled INTEGER NOT NULL DEFAULT 1,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

CREATE TABLE category_definitions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL CHECK (domain IN ('activity', 'task', 'money')),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, domain, name)
);
CREATE INDEX idx_category_definitions_user_domain ON category_definitions (user_id, domain);
```

---

## 02. Inbox / Capture

```sql
CREATE TABLE capture_items (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text           TEXT NOT NULL,
  captured_at        TEXT NOT NULL,
  source             TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'share_intent')),
  detected_date      TEXT,
  tags               TEXT NOT NULL DEFAULT '[]',  -- JSON array string
  status             TEXT NOT NULL DEFAULT 'unprocessed' CHECK (status IN ('unprocessed', 'processed', 'archived')),
  converted_to_type  TEXT CHECK (converted_to_type IN ('task', 'planner_event', 'habit', 'goal', 'money_note')),
  converted_to_id    TEXT,  -- FK polymorphic, divalidasi di application layer, bukan DB constraint
  pinned             INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX idx_capture_items_user_status ON capture_items (user_id, status);
CREATE INDEX idx_capture_items_user_created ON capture_items (user_id, created_at);
```
> `converted_to_id` sengaja tidak pakai FK constraint karena polymorphic (bisa menunjuk ke 5 tabel berbeda). Integritas dijaga di application layer saat proses konversi (`POST /capture/:id/convert`).

---

## 05. Tasks

```sql
CREATE TABLE tasks (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'completed', 'archived')),
  priority           TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date           TEXT,
  tags               TEXT NOT NULL DEFAULT '[]',
  notes              TEXT,
  linked_goal_id     TEXT REFERENCES goals(id) ON DELETE SET NULL,
  scheduled_event_id TEXT REFERENCES planner_events(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX idx_tasks_user_created ON tasks (user_id, created_at);
CREATE INDEX idx_tasks_user_status_due ON tasks (user_id, status, due_date);

CREATE TABLE subtasks (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_subtasks_task ON subtasks (task_id);
```
> `linked_goal_id` dan `scheduled_event_id` menunjuk ke `goals`/`planner_events` yang secara tekstual didefinisikan setelah tabel ini di dokumen — di Postgres ini butuh `ALTER TABLE` terpisah karena parser-nya strict soal urutan. **Di SQLite ini tidak masalah**: SQLite tidak memvalidasi keberadaan tabel target FK saat `CREATE TABLE` diparse, hanya saat DML dijalankan dengan `PRAGMA foreign_keys = ON` aktif. Jadi FK ini bisa langsung dieksekusi inline seperti di atas, asal semua `CREATE TABLE` di file ini dijalankan dulu sebelum ada insert/update pertama. Lihat bagian "Circular References" di akhir dokumen untuk detail lengkap.

---

## 03. Planner

```sql
CREATE TABLE planner_events (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  date                TEXT NOT NULL,
  start_time          TEXT NOT NULL,
  end_time            TEXT NOT NULL,
  duration_minutes    INTEGER NOT NULL,  -- derived saat write, disimpan untuk query cepat
  category            TEXT,
  priority            TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes               TEXT,
  repeat_rule         TEXT,  -- JSON string: { freq, interval, days_of_week, end_condition }
  reminder_time       TEXT,
  source_type         TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'task', 'habit', 'goal_milestone')),
  source_id           TEXT,  -- polymorphic: Task | Habit | Milestone, tergantung source_type
  status              TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled')),
  realized_session_id TEXT REFERENCES activity_sessions(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (end_time > start_time)
);
CREATE INDEX idx_planner_events_user_date ON planner_events (user_id, date);
CREATE INDEX idx_planner_events_source ON planner_events (source_type, source_id);
```
> `source_id` polymorphic (task/habit/milestone) — tidak ada FK constraint langsung, divalidasi di application layer berdasarkan `source_type`. `realized_session_id` juga bagian dari circular reference dengan `activity_sessions` — lihat bagian penutup (di SQLite ini didefinisikan inline seperti di atas, tanpa `ALTER TABLE` tambahan).

---

## 04. Activity Tracker

```sql
CREATE TABLE activity_sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_name    TEXT NOT NULL,
  category         TEXT NOT NULL,
  start_time       TEXT NOT NULL,
  end_time         TEXT,          -- nullable selagi live timer masih berjalan
  duration_minutes INTEGER,       -- derived saat stop, null selagi berjalan
  source           TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'manual')),
  note             TEXT,
  source_event_id  TEXT REFERENCES planner_events(id) ON DELETE SET NULL,
  deleted_at       TEXT,          -- soft delete, wajib per 00-architecture.md
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX idx_activity_sessions_user_created ON activity_sessions (user_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_sessions_user_category ON activity_sessions (user_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_activity_sessions_source_event ON activity_sessions (source_event_id);
```

---

## 06. Habits

```sql
CREATE TABLE habits (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_frequency  TEXT NOT NULL DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  repeat_rule       TEXT NOT NULL,  -- JSON string, dipakai Planner untuk generate event
  current_streak    INTEGER NOT NULL DEFAULT 0,
  best_streak       INTEGER NOT NULL DEFAULT 0,
  completion_count  INTEGER NOT NULL DEFAULT 0,
  missed_count      INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  linked_goal_id    TEXT REFERENCES goals(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_habits_user ON habits (user_id);

CREATE TABLE habit_logs (
  id                TEXT PRIMARY KEY,
  habit_id          TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date              TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('done', 'skipped', 'missed')),
  linked_event_id   TEXT REFERENCES planner_events(id) ON DELETE SET NULL,
  linked_session_id TEXT REFERENCES activity_sessions(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  UNIQUE (habit_id, date)
);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs (habit_id, date);
```
> `current_streak`/`best_streak` disimpan sebagai cache, tapi **wajib direcompute dari `habit_logs`** saat ada edit retroaktif (lihat non-functional notes di `06-habits.md`) — jangan increment manual. Rekomendasi: recompute di application layer (NestJS service) tiap `POST /habits/:id/log`, bukan trigger DB — lebih gampang diuji unit test, dan SQLite trigger tidak sefleksibel `plpgsql` untuk logic ber-window seperti ini.

---

## 07. Goals

```sql
CREATE TABLE goals (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  target_date      TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'at_risk')),
  progress_percent REAL NOT NULL DEFAULT 0,  -- derived dari milestone, bisa di-override manual
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX idx_goals_user ON goals (user_id);

CREATE TABLE milestones (
  id                 TEXT PRIMARY KEY,
  goal_id            TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  target_date        TEXT,
  is_completed       INTEGER NOT NULL DEFAULT 0,
  generated_event_id TEXT REFERENCES planner_events(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX idx_milestones_goal ON milestones (goal_id);
```
> `progress_percent`: recompute via trigger atau application layer setiap `milestones.is_completed` berubah — lihat `07-goals.md` "non-functional notes". SQLite trigger setara (tidak ada `FILTER (WHERE ...)`, diganti `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`):
```sql
CREATE TRIGGER trg_recompute_goal_progress_upd
AFTER UPDATE OF is_completed ON milestones
FOR EACH ROW
BEGIN
  UPDATE goals SET progress_percent = (
    SELECT COALESCE(ROUND(100.0 * SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2), 0)
    FROM milestones WHERE goal_id = NEW.goal_id
  ) WHERE id = NEW.goal_id;
END;
-- Trigger AFTER INSERT dan AFTER DELETE dengan pola serupa juga diperlukan (SQLite tidak punya
-- "OR" antar event dalam satu CREATE TRIGGER seperti Postgres; harus tiga trigger terpisah).
```
> Alternatif yang lebih simpel dan direkomendasikan untuk app single-user: skip trigger DB sama sekali, recompute di application layer (NestJS service) tiap kali `milestones.is_completed` di-update — konsisten dengan pendekatan `habits` di atas, dan lebih mudah dites.

---

## 08. Money

```sql
CREATE TABLE accounts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e_wallet')),
  current_balance REAL NOT NULL DEFAULT 0,  -- derived, direkonsiliasi tiap transaksi; lihat catatan INTEGER-cents di atas
  deleted_at      TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX idx_accounts_user ON accounts (user_id) WHERE deleted_at IS NULL;

CREATE TABLE recurring_bills (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           REAL NOT NULL,
  due_day          INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  category         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  reminder_enabled INTEGER NOT NULL DEFAULT 1,
  deleted_at       TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX idx_recurring_bills_user ON recurring_bills (user_id) WHERE deleted_at IS NULL;

CREATE TABLE transactions (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id               TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  type                     TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount                   REAL NOT NULL CHECK (amount > 0),
  category                 TEXT NOT NULL,
  date                     TEXT NOT NULL,
  notes                    TEXT,
  transfer_to_account_id   TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
  linked_recurring_bill_id TEXT REFERENCES recurring_bills(id) ON DELETE SET NULL,
  deleted_at               TEXT,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL,
  CHECK (
    (type = 'transfer' AND transfer_to_account_id IS NOT NULL AND transfer_to_account_id <> account_id)
    OR (type <> 'transfer' AND transfer_to_account_id IS NULL)
  )
);
CREATE INDEX idx_transactions_user_date ON transactions (user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_category_date ON transactions (user_id, category, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account ON transactions (account_id) WHERE deleted_at IS NULL;

CREATE TABLE budgets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  period       TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  amount_limit REAL NOT NULL CHECK (amount_limit > 0),
  period_start TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  UNIQUE (user_id, category, period, period_start)
);
CREATE INDEX idx_budgets_user ON budgets (user_id);
```
> Transfer atomik: `POST /money/transactions` untuk `type=transfer` **wajib** dibungkus satu DB transaction (`better-sqlite3`/Drizzle transaction API) yang men-debit `account_id` dan meng-kredit `transfer_to_account_id` sekaligus (lihat non-functional notes `08-money.md`). Karena ini backend lokal single-user (bukan Postgres dengan banyak koneksi konkuren), race condition antar request jauh lebih jarang terjadi dibanding versi cloud — tapi transaction wrapping tetap wajib untuk konsistensi data kalau ada dua tab browser/dua request nyaris bersamaan. Rekonsiliasi `current_balance` tetap sebaiknya lewat trigger `AFTER INSERT/UPDATE/DELETE ON transactions` atau lewat service layer yang sama dengan transaction wrapping di atas.

---

## 09. Life Log

```sql
CREATE TABLE life_log_annotations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp   TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_life_log_annotations_user_ts ON life_log_annotations (user_id, timestamp);
```
> Tidak ada tabel timeline lain — dirakit on-the-fly lewat `UNION ALL` query terhadap `activity_sessions`, `planner_events` (status=completed), `transactions`, `habit_logs`, di-`ORDER BY` timestamp. SQLite bisa jalankan `UNION ALL` yang sama seperti Postgres, tidak ada perbedaan sintaks di sini. Performa query ini dibahas di `18-scaling-notes.md`.

---

## 10 & 11. Analytics & Statistics (cache tables)

```sql
CREATE TABLE analytics_snapshots (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type        TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start       TEXT NOT NULL,
  discipline_score   REAL,
  focus_score        REAL,
  consistency_score  REAL,
  time_distribution  TEXT NOT NULL DEFAULT '{}',  -- JSON string: { productive, leisure, sleep }
  generated_at       TEXT NOT NULL,
  UNIQUE (user_id, period_type, period_start)
);
CREATE INDEX idx_analytics_snapshots_user_period ON analytics_snapshots (user_id, period_type, period_start);

CREATE TABLE statistics_cache (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL CHECK (scope IN ('overall', 'time', 'activity', 'money', 'habit', 'goal')),
  computed_at TEXT NOT NULL,
  data        TEXT NOT NULL,  -- JSON string
  UNIQUE (user_id, scope)
);
```
> Kedua tabel ini murni cache hasil job terjadwal (lihat `18-scaling-notes.md` untuk arsitektur job-nya, sudah disesuaikan tanpa Redis) — tidak pernah jadi source of truth, selalu re-derivable dari tabel modul lain.

---

## 12. Achievements

```sql
CREATE TABLE achievement_definitions (
  id                TEXT PRIMARY KEY,  -- master data, tidak per-user
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  requirement_type  TEXT NOT NULL,  -- e.g. total_hours_tracked | streak_days | goal_completed | budget_kept
  requirement_value REAL NOT NULL,
  badge_type        TEXT NOT NULL,
  category          TEXT NOT NULL
);

CREATE TABLE user_achievements (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress       REAL NOT NULL DEFAULT 0,
  unlocked_at    TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  UNIQUE (user_id, achievement_id)
);
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
```

---

## 13. Insights

```sql
CREATE TABLE insights (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('time', 'habit', 'productivity', 'money', 'task', 'goal')),
  message       TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'risk')),
  source_metric TEXT REFERENCES analytics_snapshots(id) ON DELETE SET NULL,
  generated_at  TEXT NOT NULL,
  dismissed     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_insights_user_active ON insights (user_id, dismissed, generated_at);
```

---

## 14. Workspace

```sql
CREATE TABLE layout_presets (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 0,
  widget_config TEXT NOT NULL DEFAULT '[]',  -- JSON string: [{ widget_type, visible, position, pinned }]
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_layout_presets_one_active ON layout_presets (user_id) WHERE is_active = 1;
```
> Index unik parsial memastikan cuma satu preset aktif per user di level DB. SQLite mendukung partial unique index secara native — sintaks di atas identik perilakunya dengan versi Postgres, hanya kondisi `WHERE is_active` ditulis eksplisit `= 1` karena SQLite tidak treat `INTEGER` sebagai boolean truthy di ekspresi index (harus perbandingan eksplisit).

---

## 01. Dashboard (optional cache)

```sql
CREATE TABLE dashboard_cache (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cached_summary TEXT NOT NULL,  -- JSON string
  generated_at   TEXT NOT NULL,
  expires_at     TEXT NOT NULL
);
```

---

## Circular References

Tiga pasang tabel saling mereferensikan (Task ↔ Planner, Planner ↔ Activity Tracker; Goal ↔ Habit/Task tidak melingkar karena arahnya satu jalur). Di Postgres ini butuh dua tahap migration (`CREATE TABLE` tanpa FK melingkar dulu, lalu `ALTER TABLE ... ADD CONSTRAINT` belakangan) karena parser-nya strict soal urutan tabel.

**Di SQLite, tahap kedua ini tidak diperlukan.** SQLite tidak memvalidasi keberadaan tabel yang direferensikan `REFERENCES` saat `CREATE TABLE` diparse — validasi baru terjadi saat DML (`INSERT`/`UPDATE`) dijalankan dengan `PRAGMA foreign_keys = ON` aktif, dan pada saat itu semua tabel di file migration ini sudah ada. Jadi:

- `tasks.linked_goal_id` dan `tasks.scheduled_event_id` bisa langsung `REFERENCES goals(id)` / `REFERENCES planner_events(id)` inline seperti sudah ditulis di bagian Tasks di atas, meskipun `goals` dan `planner_events` didefinisikan setelahnya secara tekstual di dokumen ini.
- `planner_events.realized_session_id REFERENCES activity_sessions(id)` dan `activity_sessions.source_event_id REFERENCES planner_events(id)` — keduanya saling menunjuk, dan keduanya sudah ditulis inline di bagian masing-masing di atas. Tidak ada `ALTER TABLE` tambahan yang perlu dijalankan.

**Satu-satunya syarat**: seluruh blok `CREATE TABLE` di file migration harus dieksekusi dalam satu batch/transaction sebelum aplikasi mulai melakukan `INSERT` pertama — ini otomatis terjadi kalau migration dijalankan lewat Drizzle Kit (`drizzle-kit generate` + `migrate`) sebagai satu file migration, jadi tidak butuh penanganan manual tambahan.

**Catatan untuk Drizzle schema (`schema.ts`)**: TypeScript juga punya masalah forward-reference (variabel `plannerEvents` dipakai sebelum didefinisikan kalau ditulis linear). Pola umum untuk circular reference di Drizzle adalah mendefinisikan kolom FK memakai callback (`(): AnySQLiteColumn => plannerEvents.id`) atau memisahkan `relations()` definitions dari `sqliteTable()` definitions — relations di-resolve lazy, jadi urutan definisi antar file/variable tidak masalah. Ini murni masalah TypeScript module resolution, bukan masalah SQL/DB seperti di Postgres.

## Ringkasan Index Wajib (per NFR `00-architecture.md`)

| Tabel | Index | Alasan |
|---|---|---|
| `activity_sessions` | `(user_id, created_at)` | listing history, dipagination |
| `transactions` | `(user_id, date)`, `(user_id, category, date)` | period summary, category breakdown |
| `planner_events` | `(user_id, date)` | render kalender per view |
| `habit_logs` | `(habit_id, date)` | streak recompute |
| `capture_items` | `(user_id, status)` | filter unprocessed di Inbox |
| semua tabel besar | `(user_id, created_at)` | pagination generik |

Untuk konteks SQLite single-user lokal, partitioning ala Postgres (`18-scaling-notes.md` versi lama) tidak relevan — index di atas sudah cukup untuk skala data yang realistis per user (puluhan ribu baris, jauh di bawah batas praktis SQLite). Lihat `18-scaling-notes.md` untuk detail yang sudah disesuaikan.
