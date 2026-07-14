# Inbox / Capture

> **Fase build**: 1 (Core Loop), modul pertama setelah Settings. **Dependency**: Settings (categories, opsional). **Menulis ke** (via API modul tujuan, bukan langsung ke tabel): Tasks, Planner, Habits, Goals, Money. DDL lengkap: `16-database-schema.md` §"02. Inbox / Capture".

## Tujuan
Tempat menampung ide, tugas, jadwal, kebiasaan, tujuan, dan catatan spontan tanpa memaksa user memilih kategori di saat itu juga.

## Peran di Aplikasi
Pintu masuk sebelum data dipindahkan ke Tasks, Planner, Habits, Goals, atau Money. Inbox **adalah satu-satunya modul yang boleh menyimpan data tanpa tipe jelas** — begitu diproses, data pindah kepemilikan sepenuhnya ke modul tujuan dan record inbox ditandai `processed`, bukan dihapus (untuk audit trail).

## Data Model
```
CaptureItem
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- raw_text            // TEXT, required
- captured_at         // TEXT (ISO 8601 UTC)
- source              // TEXT CHECK: manual | voice | share_intent
- detected_date       // TEXT, nullable — hasil parsing best-effort dari raw_text
- tags                // TEXT (JSON array string), default '[]'
- status              // TEXT CHECK: unprocessed | processed | archived
- converted_to_type   // TEXT, nullable, CHECK: task | planner_event | habit | goal | money_note
- converted_to_id     // TEXT, nullable — polymorphic, TIDAK ADA FK constraint, divalidasi di application layer
- pinned              // INTEGER (0/1), default 0
- created_at, updated_at
```

## Fitur
- Quick note (bebas, tanpa kategori)
- Quick task / habit idea / planner event / goal idea / money note (kategori awal opsional, bisa diubah saat proses)
- Process / convert item → memanggil API modul tujuan, lalu update `status` + `converted_to_id`
- Archive, delete, pin item
- Search, filter by type, sort by newest/oldest
- Mark as processed tanpa konversi (misal: catatan yang cukup dibaca saja)

## Alur Kerja
1. User menangkap ide secepat mungkin (idealnya < 2 tap untuk mulai mengetik).
2. Item masuk sebagai `unprocessed`.
3. Item diproses kapan saja — user memilih tujuan konversi.
4. Sistem memanggil endpoint modul tujuan dengan `raw_text` sebagai draft awal, user tinggal melengkapi field spesifik (due date untuk Task, start/end time untuk Planner, dll).

## Contoh Konversi
| Raw text | Konversi ke |
|---|---|
| "Beli domain" | Task |
| "Workout jam 7" | Habit atau Planner Event |
| "Bayar VPS" | Money → Recurring Bill |
| "Belajar Docker" | Goal atau Task |

## Integrasi
- **Tasks/Planner/Habits/Goals/Money**: menerima data dari Inbox via endpoint konversi masing-masing. Inbox tidak pernah menulis langsung ke tabel modul lain — selalu lewat API modul tersebut supaya validasi field tetap konsisten.

## API Outline
```
GET    /capture                       → list, filter by status/type/tag
POST   /capture                       → buat capture item baru
PATCH  /capture/:id                   → edit raw_text, tags, pin
POST   /capture/:id/convert           → { target_type, target_payload } → panggil API modul tujuan, update status
POST   /capture/:id/archive
DELETE /capture/:id
```

## Non-Functional Notes
- **Target keras**: waktu dari buka app sampai bisa mulai mengetik < 1 detik. Ini modul yang paling sensitif terhadap friksi — kalau lambat, fungsinya hilang total.
- Harus berfungsi penuh offline; sinkron ke server terjadi di background.
- Parsing tanggal/waktu otomatis dari `raw_text` (`detected_date`) bersifat best-effort, bukan wajib — jangan blokir input kalau parsing gagal.

## Catatan Implementasi (AI Agent)
- Catatan "offline" di atas adalah sisa istilah dari spek lama (server cloud) — di arsitektur local-first sekarang, backend NestJS jalan di `localhost`, jadi ini otomatis selalu "offline-capable" tanpa penanganan khusus. Lihat `17-offline-sync.md` §"Peran di Aplikasi" untuk penjelasan lengkap.
- **Gotcha kritis**: `POST /capture/:id/convert` wajib memanggil endpoint modul tujuan (`POST /tasks`, `POST /planner/events`, dst.) — Inbox **tidak pernah** `INSERT` langsung ke tabel `tasks`/`planner_events`/dst. Ini menjaga validasi field tetap satu jalur (lihat `AI-AGENT-GUIDE.md` §6).
- `converted_to_id` polymorphic tanpa FK — setelah konversi berhasil, validasi bahwa record target benar-benar ada sebelum menandai `status='processed'`.
- Index wajib: `(user_id, status)` untuk filter unprocessed, `(user_id, created_at)` untuk listing — di `16-database-schema.md`.
