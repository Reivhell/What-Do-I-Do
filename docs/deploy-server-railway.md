# 🚀 Panduan Deploy Backend (/server) ke Railway (Menggunakan Docker)

Dokumen ini menjelaskan langkah-langkah lengkap untuk melakukan deployment NestJS API Server (`/server`) dari monorepo **What Do I Do** ke [Railway](https://railway.app) menggunakan Docker.

---

## 📋 Prasyarat & Konsep Monorepo
Karena proyek ini menggunakan **npm workspaces** dengan dependensi internal (`shared`), proses kompilasi harus berjalan dari **root directory (`/`)**. Kita menggunakan Dockerfile multi-stage yang berada di [server/Dockerfile](file:///home/sejel/Documents/what%20do%20i%20do/server/Dockerfile) dengan root directory sebagai build context. Hal ini memastikan Railway dapat menyusun dependensi bersama (`shared`) sebelum membangun server.

Penggunaan Docker juga memecahkan masalah kompilasi modul native C++ seperti `better-sqlite3` dan `bcrypt` karena semua dependensi build (seperti `make`, `g++`, dan `python3`) diinstal di dalam container builder.

---

## 🛠️ Langkah-Langkah Deployment

### 1. Buat Service Baru di Railway
1. Buka dashboard Railway dan masuk ke proyek Anda.
2. Klik tombol **New** -> **GitHub Repo**.
3. Pilih repository GitHub Anda.
4. Setelah service berhasil dibuat, klik pada service tersebut dan masuk ke menu **Settings**.

### 2. Konfigurasi Service Settings
Di tab **Settings**, lakukan konfigurasi berikut:
* **Service Name**: Ubah nama service menjadi `whatdo-server` atau `whatdo-api`.
* **Root Directory**: Biarkan tetap `/` (Root repository).
* **Dockerfile Path**: Set ke `server/Dockerfile` (atau `/server/Dockerfile`).
  > [!IMPORTANT]
  > Ini sangat penting agar Railway membangun service backend menggunakan Dockerfile multi-stage yang telah dioptimalkan di folder `server/` dengan context root directory `/`.

### 3. Tambahkan Volume (PENTING: Untuk Database SQLite)
Karena aplikasi ini menggunakan database SQLite (`what-do-i-do.db`), data akan terhapus setiap kali ada deployment baru jika database disimpan di dalam container ephemeral. Kita perlu menggunakan **Persistent Volume** untuk menjaga data tetap aman.

1. Buka tab **Settings** pada service backend Anda.
2. Scroll ke bagian **Volumes** dan klik **Add Volume**.
3. Beri nama volume (misalnya `whatdo-db`) dan tentukan ukuran volume (1 GB sampai 10 GB sudah sangat cukup untuk penggunaan pribadi).
4. Tentukan **Mount Path** ke: `/data`

### 4. Konfigurasi Environment Variables
Buka tab **Variables** pada service backend Anda dan tambahkan variable berikut:

| Variable | Nilai | Penjelasan |
|---|---|---|
| `NODE_ENV` | `production` | Mengaktifkan optimasi production dan security header |
| `SERVER_HOST` | `0.0.0.0` | **Wajib** set ke `0.0.0.0` agar Railway dapat meneruskan traffic masuk |
| `DATABASE_PATH` | `/data/what-do-i-do.db` | Mengarahkan SQLite ke volume persistent yang sudah kita mount |
| `CORS_ORIGIN` | `https://your-client-domain.up.railway.app` | Domain dari frontend client Anda (atau `*` jika ingin membebaskan CORS) |
| `JWT_SECRET` | *[String Random & Kuat]* | Kunci enkripsi token autentikasi |

---

## 🔄 Bagaimana Build & Migration Berjalan di Docker?

Setelah konfigurasi di atas selesai, Railway akan otomatis memulai build pertama menggunakan Dockerfile:
1. **Tahap Builder (Multi-stage)**:
   * Menggunakan image `node:20-alpine` dan memasang `python3 make g++` untuk kompilasi modul native.
   * Menyalin file manifest (`package.json`) dari root dan sub-workspace.
   * Menginstal semua dependencies menggunakan `npm ci`.
   * Membangun `@whatdo/shared` terlebih dahulu (`npm run build -w shared`).
   * Membangun `@whatdo/server` (`npm run build -w server`).
   * Memangkas dependencies development menggunakan `npm prune --omit=dev`.
2. **Tahap Runner (Ringan)**:
   * Menggunakan image `node:20-alpine` yang bersih.
   * Menyalin folder `node_modules` yang sudah dipangkas beserta hasil kompilasi workspace (`shared/dist` dan `server/dist`).
   * Menyalin folder migrasi Drizzle dari `server/src/drizzle/migrations` agar migrasi dapat berjalan saat aplikasi dimulai.
3. **Migrasi Database Otomatis**: Saat NestJS memulai proses bootstrap di dalam container, ia secara otomatis mendeteksi database SQLite baru/lama di path `/data/what-do-i-do.db` dan menjalankan migrasi skema tabel dari file migrasi Drizzle.
4. **Menjalankan App**: Service akan jalan menggunakan port dinamis yang diberikan oleh Railway (dibaca otomatis melalui `process.env.PORT`).

Anda dapat memantau log build Docker dan deployment secara langsung di tab **Deployments** pada dashboard Railway Anda.
