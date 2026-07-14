# Local Persistence & Data Portability

> **AI Agent**: baca ini tepat sebelum implementasi Activity Tracker (live timer) di Fase 1, dan sebelum Settings → Backup di Fase 1/3. Checklist siap-pakai ada di `AI-AGENT-GUIDE.md` §7 ("Live timer app-kill", "Export/import").

*(Sebelumnya berjudul "Offline Sync & Conflict Resolution" — ditulis ulang total karena `00-architecture.md` sudah pindah dari model client-server-dengan-sync ke model **local-first, single-user per device**. Nama file tetap `17-offline-sync.md` untuk menjaga penomoran dokumen tetap konsisten.)*

## Kenapa Ini Ditulis Ulang

Versi lama dokumen ini mengasumsikan ada server pusat (Postgres) yang jadi tempat konvergensi data dari banyak device, dengan sync queue + last-write-wins per field untuk menyelesaikan konflik antar device. Di arsitektur baru:

- Web (React + NestJS lokal + SQLite) dan Mobile (Kotlin + SQLite lokal) **masing-masing berdiri sendiri**, tidak ada server pusat yang keduanya tulis ke sana.
- Konsekuensinya: **tidak ada konflik antar device untuk diselesaikan**, karena tidak ada mekanisme dua device menulis ke record yang sama secara bersamaan. Setiap device adalah source of truth untuk datanya sendiri.
- Yang dibutuhkan sekarang bukan "sync engine", tapi dua hal yang lebih sederhana: (1) live timer yang tahan app di-kill paksa OS, dan (2) cara memindahkan data antar device kalau user memang mau (export/import manual).

## Peran di Aplikasi

Ini bukan modul baru dengan API sendiri. Ini adalah lapisan infrastruktur yang dipakai oleh:
1. **Activity Tracker** (live timer tahan app-kill) — masih wajib, sama pentingnya seperti versi lama.
2. **Settings → Backup** (export/import JSON) — jadi jembatan satu-satunya antar web dan mobile untuk saat ini.

Inbox/Capture dan Tasks di versi lama wajib "offline-writable" karena asumsi ada koneksi ke server yang bisa putus. Di model baru, **semua modul otomatis "offline" sepanjang waktu** — backend NestJS jalan di `localhost`, jadi tidak ada state "online/offline" yang relevan untuk penulisan data sama sekali. Satu-satunya kondisi yang mirip "offline" adalah app tertutup paksa (lihat Live Timer di bawah).

## Live Timer: Tahan Terhadap App-Kill

Activity Tracker (`04-activity-tracker.md`) punya kebutuhan paling ketat: timer harus tetap merepresentasikan waktu yang benar walau app di-background atau di-kill paksa oleh OS.

- Saat `start`, client mencatat `start_time` dan langsung menulis row `activity_sessions` dengan `end_time = NULL` ke SQLite — **bukan** hanya disimpan di memory/state React/Compose. Ini satu-satunya jaminan yang dibutuhkan; tidak ada "sync_status" atau "pending" karena tidak ada tujuan sync.
- Durasi berjalan dihitung dari `now() - start_time` di client, murni lokal.
- Saat `stop`, `end_time` dan `duration_minutes` final dihitung dan di-`UPDATE` ke row yang sama.
- **Edge case app di-kill paksa saat timer jalan**: karena `start_time` sudah ditulis ke SQLite saat start (bukan cuma di memory), saat app dibuka lagi, client mendeteksi ada session dengan `end_time IS NULL` dan menawarkan user "lanjutkan timer" atau "stop dengan waktu sekarang" — tidak pernah silent-discard sesi yang belum di-stop. Pola ini identik dengan versi lama, cuma sekarang tidak ada langkah "masuk sync queue" setelahnya karena tidak ada yang perlu disinkronkan.

## Data Portability: Export & Import Manual

Karena tidak ada server pusat, ini jadi mekanisme utama (dan untuk saat ini, satu-satunya) cara memindahkan data antara install web dan install mobile, atau antara dua device yang sama-sama pakai versi web (mis. laptop kerja dan laptop pribadi).

### Export (`Settings → Backup → Export`)
```
1. Query semua tabel milik user_id yang aktif (semua tabel di 16-database-schema.md,
   kecuali tabel cache murni: analytics_snapshots, statistics_cache, dashboard_cache —
   ini re-derivable, tidak perlu ikut export)
2. Serialize ke satu file JSON terstruktur:
   {
     "exported_at": "<ISO timestamp>",
     "app_version": "<versi schema, untuk validasi saat import>",
     "data": {
       "tasks": [...], "planner_events": [...], "habits": [...], ...
     }
   }
3. Simpan sebagai file yang bisa di-share user (download di web, share-intent di mobile)
```

### Import (`Settings → Backup → Import`)
```
1. Validasi app_version file yang diimport terhadap schema version device tujuan
   (kalau tidak cocok, tolak import dengan pesan jelas — jangan coba auto-migrate schema lama)
2. Untuk setiap entity: INSERT ... ON CONFLICT (id) DO NOTHING
   (karena ID digenerate sebagai UUID di client sejak awal — lihat 16-database-schema.md —
   ID yang sama di dua device menandakan record yang sama, bukan tabrakan yang perlu di-merge)
3. Tampilkan ringkasan hasil import ke user: "X task, Y transaksi, Z habit berhasil diimport,
   N record dilewati karena sudah ada"
```

**Ini bukan sync dua arah** — kalau user edit task yang sama di web dan mobile lalu import-export bolak-balik, versi yang di-import terakhir yang menang (row-level, ditimpa penuh saat `id` sama tapi ada opsi "timpa" eksplisit dari user, bukan otomatis field-level merge seperti versi lama). Untuk kasus pemakaian personal (satu orang, biasanya cuma aktif nulis di satu device dalam satu waktu), ini jauh lebih sederhana untuk diimplementasikan dan cukup untuk kebutuhan realistis saat ini.

### ID Tetap Client-Generated

Prinsip UUID client-generated dari versi lama tetap dipertahankan **bukan** untuk alasan sync-tanpa-remap seperti dulu, tapi supaya export/import di atas bisa idempotent lewat `ON CONFLICT (id) DO NOTHING` — kalau ID dibuat oleh masing-masing device secara independen (auto-increment lokal, misalnya), record yang sama secara konsep bisa punya ID berbeda di dua device dan import akan menduplikasi data alih-alih mendeteksinya sebagai record yang sama.

## Yang Sengaja Tidak Dibangun di Fase Ini

- **Sync otomatis background** antar web dan mobile — butuh server relay atau protokol P2P yang di luar scope keputusan arsitektur saat ini.
- **Conflict resolution field-level (last-write-wins)** — hanya relevan kalau ada penulisan konkuren ke record yang sama dari dua device, yang tidak terjadi di model local-only.
- **Realtime multi-device** — tidak ada dua device yang "melihat" data yang sama secara live.

## Kalau Nanti Sync Sungguhan Dibutuhkan

Desain field-level last-write-wins yang didokumentasikan sebelumnya (sync queue per field, `written_at` dari device bukan server receive time, clock skew mitigation via `GET /time`) tetap valid secara teknis dan bisa diaktifkan kembali kalau proyek ini nanti berkembang jadi butuh sync cloud sungguhan — itu akan berarti menambahkan kembali sebuah server sync (bisa NestJS yang sama, di-deploy ke cloud, bukan lagi lokal) sebagai lapisan tambahan di atas apa yang didokumentasikan di sini, tanpa perlu mengubah skema SQLite lokal yang sudah ada. Keputusan itu sengaja ditunda sampai ada sinyal nyata bahwa multi-device sync adalah kebutuhan prioritas, bukan dibangun preventif di fase ini (konsisten dengan prinsip "jangan over-engineer" di `18-scaling-notes.md`).
