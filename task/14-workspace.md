# Workspace

> **Fase build**: 5 (Retensi & Personalisasi), setelah Dashboard versi default stabil. **Dependency**: Dashboard (widget list harus sinkron 1:1). **Mengontrol**: layout/visibilitas Dashboard. DDL: `16-database-schema.md` §"14. Workspace".

## Tujuan
Area personalisasi tampilan aplikasi, terutama Dashboard.

## Peran di Aplikasi
Workspace mengatur widget, urutan panel, dan fokus tampilan Dashboard sesuai kebutuhan pribadi. Workspace **hanya mengatur layout/visibilitas**, tidak pernah menyimpan atau mengubah data dari modul lain — murni konfigurasi presentasi.

## Tampilan Utama
Dashboard Widgets, Layout Customize, Pin Sections, Drag & Drop Panels.

## Data Model
```
LayoutPreset
- id             // TEXT, UUID
- user_id        // TEXT, FK → users.id
- name           // TEXT, required
- is_active      // INTEGER (0/1), default 0 — hanya satu boleh aktif per user (partial unique index)
- widget_config  // TEXT (JSON: [{ widget_type, visible, position, pinned }]), default '[]'
- created_at, updated_at
```
Constraint: `CREATE UNIQUE INDEX ... ON layout_presets (user_id) WHERE is_active = 1` — memastikan satu preset aktif per user di level DB, bukan hanya di application layer.

## Fitur Utama
Show/hide widget, pin section, reorder widget (drag and drop), set dashboard focus, save multiple layout presets, reset default layout.

## Contoh Widget
Current activity, planner preview, tasks preview, habit streak, money summary, weekly chart, insights, notes, quick actions — daftar ini harus sinkron 1:1 dengan komponen yang didefinisikan di `01-dashboard.md`.

## Integrasi
- **Workspace → Dashboard**: `LayoutPreset` aktif menentukan widget apa saja yang dirender Dashboard dan urutannya. Dashboard membaca config ini saat render, tidak menyimpan preferensi layout sendiri.

## API Outline
```
GET    /workspace/presets
POST   /workspace/presets
PATCH  /workspace/presets/:id
POST   /workspace/presets/:id/activate
DELETE /workspace/presets/:id
POST   /workspace/reset-default
```

## Non-Functional Notes
- Bukan bagian core MVP (lihat phasing di `00-architecture.md`) — bangun setelah Dashboard versi default sudah stabil dan dipakai.
- Perubahan layout harus terasa instan (optimistic update di klien), sinkron ke server terjadi di background.

## Catatan Implementasi (AI Agent)
- **Gotcha**: `widget_type` di `widget_config` wajib sinkron 1:1 dengan daftar komponen di `01-dashboard.md` §"Komponen Utama" — kalau Dashboard menambah widget baru, update juga daftar contoh di `14-workspace.md`, jangan biarkan drift.
- Partial unique index (`WHERE is_active = 1`) sudah menegakkan "satu preset aktif" di level DB — endpoint `POST /workspace/presets/:id/activate` cukup `UPDATE` preset lain jadi `is_active=0` dulu dalam transaction yang sama sebelum set target jadi `1`, supaya tidak sempat melanggar constraint di tengah proses.
- Dashboard membaca `widget_config` saat render — Dashboard sendiri tidak menyimpan preferensi layout, konsisten dengan §"Peran di Aplikasi" di atas.
