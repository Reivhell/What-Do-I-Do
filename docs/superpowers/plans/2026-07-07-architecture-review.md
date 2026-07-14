# Arsitektur Review: `00-architecture.md`

**Project**: What Do I Do — personal life-management app  
**Scope**: 15 modules + DB schema + offline sync + scaling  

---

## Ringkasan Setelah Diskusi

Arsitektur **matang dan siap jalan**. 3 concern awal saya direvisi setelah input user:

---

## ✅ NestJS — Keputusan Tepat

User pilih NestJS untuk enterprise path & scalability 15+ modules. Saya setuju setelah diskusi:

**Kenapa NestJS menang:**

| Faktor | NestJS | Express |
|---|---|---|
| Struktur untuk 15+ modules | Modules/Controllers/Services — jelas | Free-form routing — cepat kacau |
| Testing readiness | DI container → mock service gampang | Butuh setup manual |
| Enterprise trajectory | Production standard | Kurang structured |
| Cold start | ~2-5s sekali (app launch) | ~500ms sekali |
| Dev velocity | Less decision fatigue per modul | Flexible tapi rawan inconsistency |

**Cold start concern overstated.** Hanya sekali per app launch, React app sendiri lebih heavy. Target <1s cold start untuk app secara keseluruhan (React + API ready), bukan pure NestJS boot.

## ✅ Testing Section — Nanti

Diakui perlu, tapi belum untuk fase ini. Akan ditambah saat implementasi.

**Scope nanti:**
- Unit: service layer, streak recompute, balance reconciliation
- Integration: cross-module flow (Inbox→Tasks→Planner→Activity Tracker)
- E2E: critical capture→process→schedule→track→complete flow

## ✅ 19 Docs Sync — Jaga Konsisten

Harus ada process review berkala. AI-AGENT-GUIDE.md sebagai entry point sudah membantu.

---

## 👍 Hal yang Tetap Tepat

- Local-first single-user — no premature cloud
- SQLite + Drizzle — cold start tepat
- No Redis — 1 user lokal
- Data flow unidirectional — konsumen read-only
- Phasing 1→5 — Core loop dulu, insight terakhir
- UUID TEXT, UTC storage, TZ presentation
- Soft delete financial/log
- PRAGMA foreign_keys = ON
- REAL untuk money (personal scale, final)
- Inbox via API modul tujuan (validasi satu jalur)
