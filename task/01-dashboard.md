# Dashboard

> **Fase build**: 1 (versi minim, cuma Activity Tracker/Planner/Tasks/Habits/Money dasar), diperkaya bertahap di Fase 2-5 seiring modul lain siap. **Dependency**: Activity Tracker, Planner, Tasks, Habits, Money, Analytics, Insights (semua read-only). **Dikontrol layout-nya oleh**: Workspace (Fase 5). DDL: `16-database-schema.md` §"01. Dashboard" (opsional cache saja, tidak ada data permanen).

## Tujuan
Halaman utama yang menjawab lima pertanyaan dalam satu layar, tanpa scroll, tanpa mikir:
- Sekarang lagi ngapain?
- Hari ini sudah ngapain?
- Jadwal berikutnya apa?
- Uang hari ini habis berapa?
- Progres habit dan task sejauh mana?

## Peran di Aplikasi
Dashboard **tidak menyimpan data sendiri**. Ia murni read-only aggregator dari Activity Tracker, Planner, Tasks, Habits, Money, Analytics, dan Insights. Susunan/visibilitas widget diatur oleh Workspace (lihat `14-workspace.md`); Dashboard hanya merender apa yang Workspace tentukan.

## Data Model
Dashboard tidak punya entity permanen. Satu-satunya state yang relevan:

```
DashboardCache (opsional, untuk performa)
- user_id        // TEXT, PK, FK → users.id
- cached_summary // TEXT (JSON), hasil agregasi harian
- generated_at   // TEXT (ISO 8601 UTC)
- expires_at     // TEXT — di-invalidate saat ada perubahan di modul sumber
```

Kandidat data yang ditarik saat render (semua read-only dari modul lain):
| Sumber | Data yang ditarik |
|---|---|
| Activity Tracker | aktivitas aktif, durasi sesi berjalan, total waktu hari ini |
| Planner | jadwal berikutnya, event hari ini yang belum lewat |
| Tasks | jumlah task belum selesai, task jatuh tempo hari ini |
| Habits | progress habit hari ini, streak aktif |
| Money | income/expense hari ini, sisa budget harian |
| Analytics | discipline score, productivity snapshot |
| Insights | satu insight teratas (bukan daftar penuh) |

## Komponen Utama
- Current Activity Card (+ Live Timer)
- Today Summary
- Upcoming Planner
- Tasks Preview
- Habit Progress
- Money Summary
- Discipline Score
- Productivity Snapshot
- Insight Card (single, bukan feed)
- Quick Actions

## Interaksi
- Tap card → masuk ke modul detail terkait
- Start/stop activity langsung dari Current Activity Card (menulis ke Activity Tracker, bukan state lokal Dashboard)
- Quick add task/event (memanggil API Tasks/Planner, hasil langsung refresh cache)

## API Outline
```
GET  /dashboard/summary          → agregat semua widget dalam satu response
POST /dashboard/quick-action      → passthrough ke endpoint modul terkait (task/event baru)
```
Catatan: `GET /dashboard/summary` sebaiknya di-backend sebagai satu query terkomposisi (bukan 7 request terpisah dari klien) supaya load time tetap di bawah target.

## Non-Functional Notes
- **Target keras**: render awal < 1 detik, dipindai user dalam 3-5 detik.
- Summary di-cache per user dengan invalidation event-based (bukan polling) saat ada perubahan di Activity Tracker/Money/Tasks/Habits.
- Tidak boleh melakukan lebih dari satu network round-trip untuk initial render.

## Catatan Implementasi (AI Agent)
- **Gotcha kritis**: `GET /dashboard/summary` wajib satu query terkomposisi di backend (NestJS service memanggil beberapa repository secara paralel/sekuensial lalu digabung sebelum response), **bukan** klien melakukan 7 fetch terpisah ke masing-masing modul — itu melanggar target < 1 round-trip.
- Dashboard versi Fase 1 (minim) belum punya widget Insight/Discipline Score karena modul itu baru ada di Fase 4 — jangan render widget kosong/placeholder untuk data yang belum ada sumbernya, cukup sembunyikan widget itu sampai Fase 4 selesai (Workspace nanti yang atur visibility permanen di Fase 5).
- `DashboardCache` murni optimisasi opsional — kalau dilewati dulu di Fase 1 (compute on-the-fly tiap request), itu valid selama tetap < 1 detik; tambahkan cache belakangan kalau ternyata perlu.
