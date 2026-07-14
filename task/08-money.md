# Money

> **Fase build**: 3 (Uang), setelah Phase 1-2 stabil. **Dependency**: Settings (categories). **Dikonsumsi oleh**: Dashboard, Life Log, Analytics, Statistics, Achievements. DDL lengkap: `16-database-schema.md` §"08. Money". **Tipe `amount`/`current_balance`/`amount_limit` = `REAL`, final — lihat `AI-AGENT-GUIDE.md` §5.**

## Tujuan
Mencatat, memantau, dan memahami kondisi keuangan pribadi — bukan sekadar catatan transaksi, tapi ringkasan balance, arus kas, pengeluaran per periode, dan kebocoran uang.

## Peran di Aplikasi
Money adalah satu-satunya pemilik data transaksi dan saldo. Dashboard/Analytics/Statistics hanya membaca agregat, tidak pernah menghitung ulang saldo secara independen (mencegah angka yang tidak konsisten antar layar).

## Tampilan Utama
Balance, Transactions, Budgets, Categories, Recurring Bills, Summary.

## Data Model
```
Account
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- name                // TEXT, required
- type                // TEXT CHECK: cash | bank | e_wallet
- current_balance     // REAL, default 0 — CACHE derived dari transaksi, direkonsiliasi tiap transaksi baru (trigger atau service layer)
- deleted_at          // TEXT, nullable — soft delete wajib
- created_at, updated_at

Transaction
- id                          // TEXT, UUID
- user_id                     // TEXT, FK → users.id
- account_id                  // TEXT, FK → accounts.id (ON DELETE RESTRICT)
- type                        // TEXT CHECK: income | expense | transfer
- amount                      // REAL, CHECK amount > 0 — final, jangan ubah ke INTEGER cents
- category                    // TEXT, required — mengacu ke CategoryDefinition (domain=money)
- date                        // TEXT (YYYY-MM-DD)
- notes                       // TEXT, nullable
- transfer_to_account_id      // TEXT, nullable, FK → accounts.id — wajib diisi jika type=transfer, wajib NULL selainnya (CHECK constraint)
- linked_recurring_bill_id    // TEXT, nullable, FK → recurring_bills.id (ON DELETE SET NULL)
- deleted_at                  // TEXT, nullable — soft delete wajib
- created_at, updated_at

Budget
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- category            // TEXT, required
- period              // TEXT CHECK: daily | weekly | monthly | yearly
- amount_limit        // REAL, CHECK amount_limit > 0
- period_start        // TEXT (YYYY-MM-DD)
- created_at, updated_at
- UNIQUE (user_id, category, period, period_start)

RecurringBill
- id                  // TEXT, UUID
- user_id             // TEXT, FK → users.id
- name                // TEXT, required
- amount              // REAL, required
- due_day             // INTEGER, CHECK BETWEEN 1 AND 31
- category            // TEXT, required
- status              // TEXT CHECK: paid | unpaid
- reminder_enabled    // INTEGER (0/1), default 1
- deleted_at          // TEXT, nullable — soft delete wajib
- created_at, updated_at
```

## Fitur Utama
- Add income/expense, transfer antar akun
- Edit/delete transaction
- Search, filter (by date/category/account)
- Period summary
- Recurring bills dengan reminder
- Budget tracking dengan alert

## Balance
Total balance = jumlah `current_balance` semua Account milik user, dipecah per tipe (cash/bank/e-wallet) dan ditotal.

## Period Summary
Wajib tersedia untuk: today, week, month, year, all time — masing-masing income/expense/net. Dihitung dari agregasi `Transaction`, bukan disimpan sebagai snapshot terpisah (kecuali di-cache untuk performa, dengan invalidation saat ada transaksi baru).

## Categories (contoh default, bisa dikustomisasi via Settings)
Food, transport, gaming, subscription, health, education, shopping, others.

## Budgets
Daily/weekly/monthly/yearly budget per kategori, dengan sisa budget dan alert saat mendekati/melewati limit.

## Recurring Bills
Subscription atau tagihan bulanan dengan due date, reminder, status paid/unpaid. Saat ditandai paid, sistem otomatis membuat `Transaction` terkait (`linked_recurring_bill_id` terisi) — bukan dua record independen yang bisa tidak sinkron.

## Money Analytics Ringkas
Highest expense category, spending trend, income trend, average daily spend, monthly burn rate — ini hasil komputasi Analytics (`10-analytics.md`), Money hanya menyediakan data mentahnya.

## API Outline
```
GET    /money/accounts
POST   /money/accounts
GET    /money/transactions?filter=...
POST   /money/transactions
PATCH  /money/transactions/:id
DELETE /money/transactions/:id
GET    /money/summary?period=today|week|month|year|all
GET    /money/budgets
POST   /money/budgets
GET    /money/recurring-bills
POST   /money/recurring-bills
POST   /money/recurring-bills/:id/mark-paid   → buat Transaction terkait otomatis
```

## Non-Functional Notes
- Semua operasi transaksi (terutama transfer) harus atomik/transactional di level database — transfer yang setengah jalan (uang keluar dari satu akun tapi gagal masuk ke akun lain) tidak boleh terjadi.
- Harus cepat diinput (idealnya < 3 tap untuk expense biasa) — kompleksitas fitur (budget, recurring bill) tidak boleh menambah friksi ke alur input transaksi harian.
- Data finansial memakai soft delete, tidak pernah hard delete, demi integritas riwayat.

## Catatan Implementasi (AI Agent)
- **Gotcha kritis (transfer)**: `type='transfer'` wajib dibungkus satu DB transaction (Drizzle/`better-sqlite3` transaction API) yang debit `account_id` dan kredit `transfer_to_account_id` sekaligus. CHECK constraint di DB (`transfer_to_account_id IS NOT NULL AND <> account_id` untuk transfer, `IS NULL` selainnya) mencegah data tidak konsisten di level skema, tapi rekonsiliasi `current_balance` tetap tanggung jawab application layer/trigger.
- **Gotcha kritis (recurring bill)**: `POST /money/recurring-bills/:id/mark-paid` wajib membuat `transactions` row terkait (`linked_recurring_bill_id` terisi) dalam operasi yang sama — jangan jadi dua endpoint terpisah yang bisa gagal di tengah dan membuat bill "paid" tanpa transaksi tercatat.
- Index wajib: `(user_id, date)` dan `(user_id, category, date)` di `transactions` (partial `WHERE deleted_at IS NULL`), `(account_id)` untuk lookup per akun — semua di `16-database-schema.md`.
- Tipe `REAL` untuk uang: proyek single-user personal, bukan sistem akuntansi presisi tinggi — keputusan ini final, lihat `AI-AGENT-GUIDE.md` §5 sebelum mengubah.
