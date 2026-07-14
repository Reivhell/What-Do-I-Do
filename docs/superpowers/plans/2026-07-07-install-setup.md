# Install & Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `install.md` with @latest dependency setup guide + configure root `package.json` scripts.

**Architecture:** Monorepo with npm workspaces (`server`, `client`, `shared`). Server = NestJS 11, Client = React 19 + Vite 8 + Tailwind 4, Shared = Zod 4 types/validators.

**Tech Stack:** Node 26+, npm 11+, NestJS 11, React 19, Vite 8, Drizzle ORM, SQLite (better-sqlite3), Zod 4, TanStack Query 5, Zustand 5, Tailwind 4

---

### Task 1: Create install.md

**Files:**
- Create: `install.md`

**Interfaces:**
- Consumes: approved folder-structure-design.md spec
- Produces: `install.md` — setup guide for new developers

- [ ] **Step 1: Fetch latest package versions** (done — verified via npm registry)

```
@nestjs/*         → 11.1.27
drizzle-orm       → 0.45.2
better-sqlite3    → 12.11.1
drizzle-kit       → 0.31.10
zod               → 4.4.3
react             → 19.2.7
react-dom         → 19.2.7
react-router-dom  → 7.18.1
@tanstack/react-query → 5.101.2
zustand           → 5.0.14
date-fns          → 4.4.0
lucide-react      → 1.23.0
vite              → 8.1.3
@vitejs/plugin-react → 6.0.3
tailwindcss       → 4.3.2
@tailwindcss/vite → 4.3.2
typescript        → 6.0.3
concurrently      → 10.0.3
jest              → 30.4.2
reflect-metadata  → 0.2.2
rxjs              → 7.8.2
```

- [ ] **Step 2: Write install.md** with sections:
  1. Prerequisites (Node 26+, npm 11+)
  2. Clone & structure overview
  3. Install dependencies (root + server + client + shared)
  4. Database setup (Drizzle migrations)
  5. Run dev mode
  6. Build for production
  7. Test
  8. Mobile (future) note
  9. Troubleshooting

- [ ] **Step 3: Write root package.json scripts** (dev, build, test, lint)

- [ ] **Step 4: Verify structure**
- Check `install.md` paths match actual folder structure
- Verify `npm install` would resolve workspaces correctly
