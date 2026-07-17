## Desain: Testing Infrastructure

**1. Struktur folder**

```
/
├── client/
│   ├── src/...
│   └── test/                      ← mirror struktur src/
│       ├── components/
│       │   ├── habits/HabitCard.test.tsx
│       │   └── ...
│       └── pages/
│           └── Habits.test.tsx
├── server/
│   ├── src/...
│   └── test/                      ← sudah ada (isinya .gitkeep), dipakai untuk unit + integration
│       ├── unit/
│       │   └── modules/habits/habits.service.spec.ts
│       └── integration/
│           └── modules/habits/habits.controller.int-spec.ts
├── shared/
│   ├── src/...
│   └── test/
│       └── validators/...
└── e2e/                            ← BARU, root-level, Playwright
    ├── playwright.config.ts
    ├── fixtures/
    ├── tests/
    │   ├── habits.spec.ts
    │   └── ...
    └── .auth/ (kalau perlu session state)
```

**2. Tooling per layer**
| Layer | Tool | Alasan |
|---|---|---|
| Server unit/integration | **Jest** | Default NestJS, sudah terintegrasi baik dengan DI/module testing |
| Client unit/component | **Vitest** | Native untuk Vite, jauh lebih cepat dari Jest untuk project berbasis Vite |
| E2E | **Playwright** | Sudah dikonfirmasi, cocok untuk browser-based cross-stack test |

**3. Kenapa `test/` terpisah (bukan colocated) tapi tetap per-package**
Setiap package (`client`, `server`, `shared`) punya `test/`-nya sendiri yang mirror `src/` — bukan satu `test/` raksasa di root. Ini menjaga agar test tetap "hidup" bareng package-nya (gampang jalanin `npm test` di masing-masing workspace), sementara **E2E** naik ke root karena dia memang lintas-package (butuh server jalan + client jalan bersamaan).

**4. Konsekuensi ke `server/test/`**
Folder ini sudah ada tapi kosong (cuma `.gitkeep`) — otomatis terisi sesuai desain ini, tidak perlu folder baru.

**5. Belum masuk scope ini (kalau nanti mau ditambah)**

- CI workflow (`.github/workflows/test.yml`) — saya sarankan jadi task terpisah setelah struktur test-nya jadi
- Coverage threshold / reporting

---
