# Folder Structure Design — What Do I Do

**Date:** 2026-07-07
**Status:** Approved
**Stack:** NestJS (modular monolith) + React (Vite) + SQLite (Drizzle) + Shared types/validators (Zod)
**Future:** Mobile Kotlin + Jetpack Compose port (separate folder, same repo)

---

## 1. Repository Model: Monorepo

Single repository with npm workspaces. All current code (web) in one repo, mobile Kotlin port as sibling folder.

**Rationale:**
- Pre-MVP phase: 1 clone, 1 install, 1 dev command
- Shared types live — no publish/version overhead
- Cross-layer refactors in single PR
- Extraction path clear (git subtree / folder move) when boundaries proven

---

## 2. Root Structure

```
what-do-i-do/
├── package.json                 # npm workspaces: ["server","client","shared"]
├── tsconfig.base.json           # Shared TS config
├── .gitignore
├── .env.example
├── install.md
├── README.md
├── docs/
│   ├── 00-architecture.md
│   ├── 01-15 (module specs)
│   └── superpowers/specs/       # Design docs
├── shared/                      # @whatdo/shared
├── server/                      # NestJS
├── client/                      # React+Vite
└── mobile/                      # Kotlin (future)
```

---

## 3. Server — NestJS Modular Monolith

```
server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── drizzle.config.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── database/database.module.ts + drizzle.provider.ts
│   │   ├── guards/app-lock.guard.ts
│   │   ├── interceptors/timezone.interceptor.ts
│   │   ├── filters/http-exception.filter.ts
│   │   └── decorators/current-user.decorator.ts
│   ├── drizzle/
│   │   ├── schema/          # Drizzle table definitions (1 file per entity group)
│   │   ├── migrations/
│   │   └── index.ts
│   └── modules/             # 1 NestJS module per domain
│       ├── users/
│       ├── inbox/
│       ├── tasks/
│       ├── planner/
│       ├── activity-tracker/
│       ├── habits/
│       ├── goals/
│       ├── money/
│       ├── life-log/        # Read-only aggregate
│       ├── analytics/       # Read-only consumer
│       ├── statistics/      # Read-only consumer
│       ├── achievements/
│       ├── insights/        # Read-only consumer
│       ├── workspace/
│       ├── dashboard/       # Read-only consumer
│       └── settings/
└── test/
```

### Per-Module Pattern (example: tasks)

```
tasks/
├── tasks.module.ts           # @Module({ imports, controllers, providers, exports })
├── tasks.controller.ts       # @Controller('tasks')
├── tasks.service.ts          # Business logic + Drizzle queries
├── dto/
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   └── task-query.dto.ts
├── interfaces/
│   └── task.interface.ts     # Optional
└── __tests__/
    ├── tasks.service.spec.ts
    └── tasks.controller.spec.ts
```

### Module Categories

| Type | Modules | Has Controller? | Data Owner? |
|---|---|---|---|
| **Data Owner** | users, inbox, tasks, planner, activity-tracker, habits, goals, money, achievements, workspace, settings | ✅ Yes | ✅ Writes to own tables |
| **Read-Only Consumer** | life-log, analytics, statistics, insights, dashboard | ❌ No (service only) | ❌ Reads from other tables |

---

## 4. Client — React + Vite

```
client/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/index.tsx
    ├── pages/               # 1 folder per route
    │   ├── dashboard/
    │   ├── inbox/
    │   ├── tasks/
    │   ├── planner/
    │   ├── activity-tracker/
    │   ├── habits/
    │   ├── goals/
    │   ├── money/
    │   ├── life-log/
    │   ├── analytics/
    │   ├── statistics/
    │   ├── achievements/
    │   ├── insights/
    │   ├── workspace/
    │   └── settings/
    ├── components/          # Shared UI
    │   ├── ui/              # Atoms (Button, Input, Card, Modal, etc.)
    │   ├── layout/          # Sidebar, Topbar, PageShell
    │   └── shared/          # Domain-agnostic (DatePicker, TagInput)
    ├── hooks/               # Custom React hooks
    ├── stores/              # Zustand (theme, sidebar toggle only)
    ├── api/                 # TanStack Query + fetch wrapper
    └── lib/                 # Utils (date-fns, currency, cn)
```

### Per-Page Pattern

```
pages/tasks/
├── TasksPage.tsx            # Route entry
├── TaskList.tsx
├── TaskCard.tsx
├── TaskForm.tsx
└── TaskDetail.tsx
```

### State Management Decision

| Concern | Tool | Why |
|---|---|---|
| Server state (data) | TanStack React Query | Cache, refetch, optimistic update |
| Client state (UI) | Zustand | Minimal, no boilerplate |
| Form state | React Hook Form (future) | Handles complex forms |

---

## 5. Shared Package

```
shared/src/
├── index.ts                # Re-export all
├── types/
│   ├── task.ts, planner.ts, activity.ts, habit.ts, goal.ts
│   ├── money.ts, inbox.ts, life-log.ts, analytics.ts
│   ├── statistics.ts, achievement.ts, insight.ts
│   ├── workspace.ts, settings.ts, user.ts
└── validators/             # Zod schemas
    ├── task.ts, planner.ts, ...
```

- **Types**: interface per entity — single source of truth
- **Validators**: Zod schema — NestJS pipe + client form validation
- **Import**: TypeScript path alias `@whatdo/shared` — no npm publish
- **Consumed by**: server (validation pipe, response types) + client (query types, form validation)

---

## 6. Mobile (Future)

```
mobile/
├── build.gradle.kts
├── settings.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/
        ├── data/          # Room entities + DAO
        ├── domain/        # Use cases
        ├── ui/            # Compose screens
        └── di/            # Dependency injection
```

Currently placeholder. Will mirror server module boundaries in Kotlin-native structure.

---

## 7. Naming & Conventions

- **Folders**: kebab-case (`activity-tracker/`)
- **Files (server)**: kebab-case with type suffix (`tasks.module.ts`, `tasks.service.ts`)
- **Files (client)**: PascalCase for components (`TaskCard.tsx`), kebab-case for hooks/api (`use-tasks.ts`)
- **Classes**: PascalCase
- **Functions/variables**: camelCase
- **Entities**: snake_case in DB (`user_id`), camelCase in TypeScript (`userId`, via Drizzle)
- **Zod schemas**: PascalCase (`TaskSchema`), export type `z.infer<typeof TaskSchema>`

---

## 8. Package Dependencies

See `install.md` for full dependency list with versions. High-level:

**Server:**
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `drizzle-orm`, `better-sqlite3`, `zod`

**Client:**
- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query`, `zustand`, `date-fns`
- `tailwindcss`, `lucide-react`

**Root:**
- `concurrently`, `typescript`

---

## 9. Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Monorepo vs multi-repo | Monorepo | Single clone, live shared types, easy refactors |
| NestJS vs Express | NestJS | DI, module structure scales to 15+ domains |
| SQLite vs Postgres | SQLite | Local-first, no server process, <1s cold start |
| Drizzle vs Prisma | Drizzle | Lighter startup, closer to SQL, no binary |
| Drizzle schema location | Non-module folder | Schema is shared, logic is partitioned |
| Read-only module | No controller | Prevents write-back cycles |
| Client state | Zustand | Minimal, server state via TanStack Query |
| Shared types/validators | TS path alias `@whatdo/shared` | Live imports, no npm publish overhead |
| Mobile | Kotlin + Compose (separate folder) | Native quality, same repo for discoverability |
