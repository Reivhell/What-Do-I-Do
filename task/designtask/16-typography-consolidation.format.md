# Design Task: Typography Consolidation — Display/Body Only

## Priority: P2
**Impact**: All pages; fragmented font token usage

---

## Problem Statement
design.md mandates **single font family** (Plus Jakarta Sans) with two semantic roles:
- `--font-display`: headings, numbers, emphasis
- `--font-body`: body, labels, UI text

But globals.css defines **fragmented tokens**:
```css
--font-plusJakartaSans
--font-headline-small / -medium / -large
--font-title-small / -medium / -large
--font-body-small / -medium / -large
--font-label-small / -medium / -large
--font-stat
--font-mono-timer
```

And pages use:
- `font-display` (correct)
- `font-body` (correct)
- `font-[Plus Jakarta Sans]` (hardcoded — should be `font-body`)
- `font-mono` (for timers — OK, but should be `--font-mono-timer`)
- `font-headline-*` (not in design.md)

---

## Acceptance Criteria
- [ ] Single font family (Plus Jakarta Sans) everywhere
- [ ] Only `font-display` and `font-body` used in pages
- [ ] No `font-[Plus Jakarta Sans]` hardcoded
- [ ] No `font-headline-*`, `font-title-*`, `font-label-*` (legacy Material tokens)
- [ ] Mono only for numeric timers (ProgressRing, ActivityTracker timer)

---

## Files to Modify

### 1. `client/src/styles/globals.css`
**Actions**:
- Remove legacy font tokens: `--font-headline-*`, `--font-title-*`, `--font-label-*`, `--font-body-*`, `--font-stat`
- Keep: `--font-display`, `--font-body`, `--font-mono-timer`
- Ensure `@theme` maps:
  ```css
  --font-display: "Plus Jakarta Sans", sans-serif;
  --font-body: "Plus Jakarta Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  ```

### 2. All Pages (grep for non-compliant usage)
```bash
grep -rn "font-\[Plus Jakarta Sans\]\|font-headline\|font-title\|font-label\|font-stat" client/src/pages/ client/src/components/
```

**Replacements**:
| Current | Replace With |
|---------|--------------|
| `font-[Plus Jakarta Sans]` | `font-body` |
| `font-headline-*` | `font-display` |
| `font-title-*` | `font-display` |
| `font-label-*` | `font-body` |
| `font-stat` | `font-display` |
| `font-mono` (timers) | `font-mono` (keep) |

### 3. Specific files with violations
- `Money.tsx`: `font-[Plus Jakarta Sans]` → `font-body` (lines 494-511)
- `LifeLog.tsx`: `font-[Plus Jakarta Sans]` → `font-body` (lines 352-367)
- `Settings.tsx`: `font-[Plus Jakarta Sans]` → `font-body` (lines 493-511)
- `Inbox.tsx`: check for `font-[Plus Jakarta Sans]`
- `Planner.tsx`: check for `font-[Plus Jakarta Sans]` (via EventForm)
- `Workspace.tsx`: check for `font-[Plus Jakarta Sans]`

---

## Verification
1. `grep -rn "font-\[Plus Jakarta Sans\]\|font-headline\|font-title\|font-label\|font-stat" client/src/` → **empty**
2. All pages use only `font-display` + `font-body` (+ `font-mono` for timers)
3. Build passes, fonts render correctly

---

## Dependencies
- **Requires**: Task 00 (token consolidation — globals.css cleanup)
- **Blocks**: None

---

## Estimated Effort
~2 hours (grep + replace across ~15 files)