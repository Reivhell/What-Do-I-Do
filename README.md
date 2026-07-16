# What Do I Do — Spesifikasi Produk & Teknis

Dokumentasi lengkap untuk aplikasi **What Do I Do**: personal life-management app yang menggabungkan perencanaan waktu, task, habit, goal, keuangan, dan analisis diri dalam satu sistem yang saling terhubung.

> **Update tech stack:** proyek ini sekarang **local-first, single-user per device** — tanpa server cloud/Postgres multi-tenant. Web (React + TS + NestJS lokal + SQLite/Drizzle) dibangun lebih dulu, mobile (Kotlin + Compose + SQLite lokal) menyusul sebagai porting kedua, keduanya berdiri sendiri tanpa sync otomatis (lihat `00-architecture.md`, `16-database-schema.md`, `17-offline-sync.md`, `18-scaling-notes.md`).

> **Untuk AI Agent (Claude Code, Cursor, dll.) yang akan mengimplementasikan proyek ini: baca `AI-AGENT-GUIDE.md` terlebih dahulu**, sebelum file lain. Dokumen itu merangkum urutan build, konvensi wajib, dan gotcha yang tersebar di 19 file di bawah, supaya tidak perlu disimpulkan sendiri dari nol.

## Daftar Dokumen

| # | File | Isi |
|---|------|-----|
| — | ``claude.md` | **Baca duluan.** Entry point untuk AI Agent: urutan build per fase, konvensi wajib, checklist gotcha, peta dependency antar modul |
| 00 | `00-architecture.md` | Prinsip desain sistem, tech stack, aturan integrasi antar modul |
| 01 | `01-dashboard.md` | Ringkasan utama, entry point aplikasi |
| 02 | `02-inbox-capture.md` | Quick capture tanpa friksi |
| 03 | `03-planner.md` | Pemilik tunggal jadwal waktu |
| 04 | `04-activity-tracker.md` | Realisasi waktu terstruktur |
| 05 | `05-tasks.md` | Daftar kerja tanpa jadwal wajib |
| 06 | `06-habits.md` | Kebiasaan berulang |
| 07 | `07-goals.md` | Target jangka menengah-panjang |
| 08 | `08-money.md` | Keuangan pribadi |
| 09 | `09-life-log.md` | Timeline agregat read-only |
| 10 | `10-analytics.md` | Analisis pola lintas modul |
| 11 | `11-statistics.md` | Angka mentah & record |
| 12 | `12-achievements.md` | Gamification |
| 13 | `13-insights.md` | Rekomendasi berbasis pola |
| 14 | `14-workspace.md` | Personalisasi layout |
| 15 | `15-settings.md` | Konfigurasi & akun |
| 16 | `16-database-schema.md` | Skema database (SQLite DDL via Drizzle, siap migration) |
| 17 | `17-offline-sync.md` | Local persistence (live timer tahan app-kill) & data portability lewat export/import manual (model local-only) |
| 18 | `18-scaling-notes.md` | Strategi cache/snapshot Analytics-Statistics & background job untuk konteks SQLite single-user lokal |

## Prinsip Pemisahan Modul (Source of Truth)

Ini bagian paling penting yang sebelumnya ambigu di spek lama. Aturan berikut **final** dan dipakai konsisten di semua modul:

| Data | Pemilik tunggal (source of truth) | Modul lain hanya... |
|---|---|---|
| Waktu terjadwal (kapan sesuatu **akan** terjadi) | **Planner** | referensi via `linked_planner_event_id` |
| Waktu terealisasi (kapan sesuatu **benar-benar** terjadi + durasi) | **Activity Tracker** | referensi via `linked_session_id` |
| Daftar kerja tanpa waktu spesifik | **Tasks** | Planner mengambil salinan ringan saat dijadwalkan |
| Kebiasaan & aturan pengulangan | **Habits** | Planner men-generate event dari habit, tidak menyimpan aturan repeat sendiri |
| Target jangka panjang | **Goals** | Habits/Tasks/Planner hanya `linked_goal_id` |
| Transaksi keuangan | **Money** | Dashboard/Analytics hanya membaca agregat |
| Narasi "apa yang terjadi hari ini" | **Life Log** | Life Log **tidak punya tabel sendiri** — ia adalah view gabungan dari Activity Tracker + Planner + Money + Habits, diurutkan berdasarkan waktu |

Konsekuensi teknis: setiap kali dua modul di spek lama sama-sama mengklaim "bisa auto-generate ke X", sekarang hanya satu arah yang benar dan didefinisikan eksplisit di file terkait.

## Keputusan Database (Final)

Proyek ini sudah melalui evaluasi Postgres (multi-tenant cloud) vs SQLite (local-first single-user), dan **SQLite via Drizzle ORM dimenangkan untuk kasus pemakaian ini** — bukan karena "lebih baik" secara umum, tapi karena karakteristik beban kerja aplikasi ini cocok dengan kekuatan SQLite:

| Kriteria | Kenapa SQLite menang di proyek ini |
|---|---|
| Jumlah user per file DB | Selalu 1 (local-first) — keunggulan konkurensi-tinggi Postgres tidak terpakai sama sekali |
| Skala data realistis | Puluhan ribu baris per tabel bahkan untuk pemakaian 2+ tahun harian — jauh di bawah batas praktis SQLite (jutaan baris) |
| Target cold-start | < 1 detik — SQLite tidak butuh proses server terpisah yang harus siap dulu; Postgres butuh |
| Kebutuhan sync antar device | Tidak ada di fase ini (export/import manual) — fitur replikasi/HA Postgres jadi tidak relevan |
| Kompleksitas operasional | SQLite = satu file, tidak ada proses DB untuk di-install/di-maintain user; penting karena user menjalankan app di mesin sendiri, bukan Anthropic/tim yang mengelola server |
| Fitur yang dikorbankan | Tidak ada `MATERIALIZED VIEW`, tidak ada tipe `ENUM`/`UUID`/`JSONB` native, tidak ada partitioning — semua sudah dipetakan ke padanan SQLite di `16-database-schema.md` tanpa kehilangan constraint (CHECK tetap dipakai untuk enum, partial index tetap didukung) |

**Kapan keputusan ini perlu ditinjau ulang**: kalau produk berubah arah jadi multi-tenant cloud dengan banyak user menulis ke satu database bersama, atau butuh sync realtime antar device — itu perubahan arsitektur besar, bukan iterasi kecil, dan didokumentasikan sebagai jalur forward-compatible (bukan dihapus) di `00-architecture.md` dan `18-scaling-notes.md`.

## Cara Baca Dokumen Ini

Tiap file modul (01–15) mengikuti struktur yang sama:
1. **Tujuan & Peran** — kenapa modul ini ada, batas tanggung jawabnya
2. **Data Model** — entity, field, tipe, relasi (siap dipakai sebagai skema database)
3. **Fitur & Interaksi** — apa yang bisa dilakukan user
4. **Integrasi** — hubungan eksplisit ke modul lain (arah data, bukan lagi dua-duanya saling klaim)
5. **API Outline** — endpoint level tinggi untuk implementasi
6. **Non-Functional Notes** — performance, offline behavior, prioritas
