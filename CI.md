# CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the currently-broken CI pipeline (unresolved merge conflicts + wrong workspace paths), then extend it with a Playwright E2E job so every push/PR runs unit tests, lint, build, and a cross-stack smoke test.

**Architecture:** Monorepo uses npm workspaces (`shared`, `server`, `client`) with a single root lockfile. CI will run from repo root using `-w <workspace>` flags instead of `cd`-ing into subfolders. A new `e2e` workspace holds Playwright, which boots both `server` (port 3000) and `client` (port 5173) via `webServer` config and runs against them.

**Tech Stack:** GitHub Actions, npm workspaces, Jest (server), Vitest (client), Playwright (E2E), Node 20.

## Global Constraints

- Node version: 20 (matches existing `ci.yml`)
- Package manager: npm workspaces only — no per-package lockfiles, no yarn/pnpm
- Root lockfile lives at `/package-lock.json` — this is the only lockfile in the repo
- Deploy/release step is **out of scope** for this plan (not yet decided) — pipeline stops at test+lint+build+e2e
- Do not touch the client/server test **location** (colocated vs `test/`) inconsistency in this plan — that's a separate cleanup, not a CI/CD concern

---

### Task 1: Resolve blocking merge conflicts

**Files:**

- Modify: `client/package.json`
- Modify: `server/src/main.ts`
- Verify (repo-wide): all tracked files

**Interfaces:**

- Consumes: nothing
- Produces: a `main` branch that installs and compiles cleanly — every later task assumes this works

- [ ] **Step 1: Find every remaining conflict marker in the repo**

Run from repo root:

```bash
grep -rn --exclude-dir=node_modules --exclude-dir=.git -E "^(<<<<<<<|=======|>>>>>>>)" .
```

Expected: at minimum, two hits — `client/package.json` and `server/src/main.ts`. If there are more files listed, add them to this task before continuing.

- [ ] **Step 2: Fix `client/package.json`**

Replace the whole file with:

```json
{
  "name": "@whatdo/client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/utilities": "^3.2.2",
    "@tanstack/react-query": "^5.101.2",
    "date-fns": "^4.4.0",
    "lucide-react": "^1.23.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "jsdom": "^29.1.1",
    "tailwindcss": "^4.3.2",
    "typescript": "^6.0.3",
    "vite": "^8.1.3",
    "vitest": "^4.1.10"
  }
}
```

(Kept the `HEAD` side's newer `vitest`/`jsdom` versions and its extra `test:watch` script — confirm with whoever owns the `dev` branch changes that this is fine before merging.)

- [ ] **Step 3: Fix `server/src/main.ts`**

Both sides of the conflict are actually used later in the same function (`GlobalExceptionFilter` from HEAD, `LoggerInterceptor`/`LoggerService` + `helmet` from dev) — this isn't a real conflict, both imports are needed together. Replace the whole file with:

```typescript
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { LoggerInterceptor, LoggerService } from "./common/logger";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
      hidePoweredBy: true,
      frameguard: { action: "deny" },
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const logger = app.get(LoggerService);
  app.useGlobalInterceptors(app.get(LoggerInterceptor));

  const port = process.env.SERVER_PORT || 3000;
  const host = process.env.SERVER_HOST || "localhost";
  await app.listen(port, host);
  logger.log(`🚀 Server running on http://${host}:${port}`, "Bootstrap");
}
bootstrap();
```

If `./common/filters/global-exception.filter.ts` or `./common/logger` don't actually exist yet on `main` (only on one of the two merged branches), `npm run build -w server` in Step 4 will fail with a clear "Cannot find module" error — in that case, pull in whichever file(s) are missing from the branch that introduced them before continuing.

- [ ] **Step 4: Verify the repo installs and builds**

Run from repo root:

```bash
npm ci
npm run build
```

Expected: both commands exit `0`. `npm run build` runs `shared` → `server` → `client` in sequence per the root script.

- [ ] **Step 5: Commit**

```bash
git add client/package.json server/src/main.ts
git commit -m "fix: resolve unmerged conflict markers in client/package.json and server main.ts"
```

---

### Task 2: Fix CI workflow to use npm workspaces correctly

**Files:**

- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: root `package.json` scripts (`lint`, `build`, `test`) added/confirmed in this task
- Produces: a `test-and-lint` job that Task 4 will add an `e2e` job alongside

- [ ] **Step 1: Add a client test line to the root `test` script**

The root `package.json` currently only runs server tests. Open `package.json` at repo root and change:

```json
"test": "npm run test -w server",
```

to:

```json
"test": "npm run test -w server && npm run test -w client",
```

- [ ] **Step 2: Add `shared` to the root `lint` script**

Change:

```json
"lint": "npm run lint -w server && npm run lint -w client",
```

to:

```json
"lint": "npm run lint -w shared && npm run lint -w server && npm run lint -w client",
```

- [ ] **Step 3: Verify the updated root scripts work locally**

```bash
npm run lint
npm run test
```

Expected: both exit `0` (assuming Task 1 already made the repo buildable).

- [ ] **Step 4: Rewrite `.github/workflows/ci.yml` to install once at root**

Replace the whole file with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm test

      - name: Server test coverage
        run: npm run test:coverage -w server
```

Key differences from the old file: single install at root (matches the single lockfile), `cache-dependency-path` points at the real lockfile, no more `working-directory` + separate `npm ci` per package, and one job instead of two duplicated ones.

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "fix: run CI from workspace root instead of broken per-package installs"
```

---

### Task 3: Scaffold Playwright E2E workspace

**Files:**

- Create: `e2e/package.json`
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/smoke.spec.ts`
- Modify: `package.json` (root — add `e2e` to `workspaces`)
- Modify: `.gitignore`

**Interfaces:**

- Consumes: client on `http://localhost:5173`, server on `http://localhost:3000` (per `client/vite.config.ts` and `server/src/main.ts` defaults)
- Produces: `npm run test -w e2e` — Task 4's CI job runs this exact command

- [ ] **Step 1: Register `e2e` as a workspace**

In root `package.json`, change:

```json
"workspaces": [
  "shared",
  "server",
  "client"
],
```

to:

```json
"workspaces": [
  "shared",
  "server",
  "client",
  "e2e"
],
```

- [ ] **Step 2: Create `e2e/package.json`**

```json
{
  "name": "@whatdo/e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
```

- [ ] **Step 3: Create `e2e/playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run build -w server && npm run start -w server",
      url: "http://localhost:3000/api",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: "..",
    },
    {
      command:
        "npm run build -w client && npm run preview -w client -- --port 5173",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      cwd: "..",
    },
  ],
});
```

- [ ] **Step 4: Create the first smoke test**

```typescript
// e2e/tests/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("client loads and shows the PIN lock screen", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("What Do I Do");
  await expect(page.getByRole("heading", { name: "App Locked" })).toBeVisible();
  await expect(page.getByLabel("PIN code")).toBeVisible();
});

test("server API is reachable", async ({ request }) => {
  const response = await request.get("http://localhost:3000/api");
  // No route exists at the bare prefix — a 404 with a JSON body still proves
  // the server booted and Nest's routing/exception filter are responding.
  expect(response.status()).toBeLessThan(500);
});
```

- [ ] **Step 5: Ignore Playwright's local artifacts**

Add to `.gitignore` (create the file at repo root if it doesn't already have these lines):

```
e2e/node_modules/
e2e/test-results/
e2e/playwright-report/
```

- [ ] **Step 6: Install and run the smoke test locally**

```bash
npm install
npx playwright install --with-deps chromium
npm run test -w e2e
```

Expected: 2 passed. If the client test fails on the title/heading assertions, open `e2e/playwright-report/index.html` to see a screenshot of what actually rendered and adjust the selectors in Step 4 to match.

- [ ] **Step 7: Commit**

```bash
git add package.json e2e/ .gitignore
git commit -m "feat: scaffold Playwright E2E workspace with a smoke test"
```

---

### Task 4: Add E2E job to CI

**Files:**

- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `npm run test -w e2e` from Task 3
- Produces: nothing further downstream (last task in this plan)

- [ ] **Step 1: Add the `e2e` job**

In `.github/workflows/ci.yml`, add a new job after `test-and-lint`:

```yaml
e2e:
  runs-on: ubuntu-latest
  needs: test-and-lint
  steps:
    - uses: actions/checkout@v4

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
        cache-dependency-path: package-lock.json

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Run E2E tests
      run: npm run test -w e2e
      env:
        CI: true

    - name: Upload Playwright report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: e2e/playwright-report/
        retention-days: 7
```

`needs: test-and-lint` makes this job wait for unit tests/lint/build to pass first — no point spending ~1-2 min booting two servers if a unit test already failed.

- [ ] **Step 2: Verify the full workflow file is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "valid"
```

Expected: `valid`

- [ ] **Step 3: Commit and push to trigger CI for real**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add Playwright E2E job to CI, gated behind unit tests passing"
git push
```

- [ ] **Step 4: Check the Actions tab**

Open the repo's Actions tab on GitHub and confirm both `test-and-lint` and `e2e` jobs go green. If `e2e` fails on server boot, check the `webServer` `url` health-check values in `e2e/playwright.config.ts` against the actual port `server/src/main.ts` binds to in the CI environment.

---

## Not in this plan (flagged for later)

- **Deploy/release step** — not decided yet; revisit once test+lint+build+e2e are green on `main` for a while.
- **Duplicate test file**: `server/src/modules/settings/__tests__/settings.service.spec.ts` and `server/test/unit/modules/settings/settings.service.spec.ts` both test `SettingsService` with different setups — worth deleting one, but it's a test-hygiene cleanup, not a CI/CD change.
- **Test location inconsistency**: client tests are colocated (`client/src/**/*.test.tsx`) even though the earlier design decision was a separate `test/` mirroring `src/`. Only `server/` actually follows that decision. Separate cleanup task if you want it enforced.
