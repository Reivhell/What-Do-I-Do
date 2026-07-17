# Design Task: Claymorphism Token Consolidation

## Priority: P0 (Root Cause)
**Impact**: All pages affected — two conflicting token systems in globals.css

---

## Problem Statement
The codebase has **two competing design token systems** in `client/src/styles/globals.css`:

1. **Claymorphism system** (design.md compliant): `--clay-bg`, `--clay-surface`, `--clay-shadow-dark`, `--clay-shadow-light`, `--blue-*`, `--ink-*`, `--radius-*`
2. **Material-ish system** (legacy): `--surface-*`, `--on-surface-*`, `--primary`, `--outline*`, `--color-*`, `--color-error`, etc.

Pages and components use a mix of both, causing:
- Inconsistent shadows (clay vs material elevation)
- Wrong background colors (`bg-clr-surface-white` vs `bg-clay-surface`)
- Broken dark mode clay effect (legacy tokens don't swap clay shadows)
- Maintenance burden: two sources of truth

---

## Acceptance Criteria
- [ ] Single token system: **claymorphism only** (per design.md)
- [ ] All legacy `--surface-*`, `--on-surface-*`, `--primary`, `--outline*`, `--color-*` tokens removed
- [ ] All components/pages use only clay tokens
- [ ] Dark mode clay shadows work correctly (light highlight visible)
- [ ] Build passes, no CSS errors

---

## Files to Modify

### 1. `client/src/styles/globals.css` — **Primary fix**
**Actions**:
- Delete lines 8-98 (legacy `:root` Material tokens)
- Delete lines 100-198 (legacy `.dark` Material tokens)
- Keep lines 200-459 (claymorphism tokens + utilities)
- Ensure clay tokens are the **only** `:root` and `.dark` definitions
- Verify `--clay-shadow-light` in `.dark` is `rgba(255,255,255,0.15)` per design.md:109

### 2. `client/src/components/ui/Button.tsx` — **Core component**
**Current violations** (lines 16-23):
```tsx
primary: "bg-blue-500 text-white clay-l1..."
secondary: "bg-clay-surface text-blue-700 border border-blue-100..."
destructive: "bg-clay-surface text-semantic-red border border-blue-100..."
ghost: "bg-transparent text-ink-500 hover:text-ink-900 hover:bg-blue-50/50..."
```
**Fix**: Replace all hardcoded colors with clay tokens:
- `bg-blue-500` → `bg-[var(--blue-500)]`
- `text-blue-700` → `text-[var(--blue-600)]`
- `border-blue-100` → `border-[var(--blue-100)]`
- `text-ink-500` → `text-[var(--ink-500)]`
- `hover:bg-blue-50/50` → `hover:bg-[var(--blue-50)]/50`

### 3. `client/src/components/ui/ClayInput.tsx` — **Core component**
**Current violations** (line 19):
```tsx
bg-clr-surface-white dark:bg-clr-surface-container-high
placeholder-clr-text-muted
focus:ring-clr-primary/30
ring-clr-danger/30
```
**Fix**: Use clay tokens:
- `bg-[var(--clay-surface-alt)]` (for nested surfaces)
- `placeholder-[var(--ink-300)]`
- `focus:ring-[var(--blue-300)]`
- `ring-[var(--semantic-red)]/30`

### 4. `client/src/components/ui/ProgressBar.tsx` — **Core component**
**Current violations** (lines 11, 18):
```tsx
bg-blue-100
from-blue-300 to-blue-500
```
**Fix**:
- `bg-[var(--blue-100)]`
- `from-[var(--blue-300)] to-[var(--blue-500)]`

### 5. `client/src/components/ui/ProgressRing.tsx` — **Core component**
**Current violations** (lines 27, 36, 45-46):
```tsx
stroke="var(--color-blue-100)"
stroke="url(#progress-grad)"
stopColor="var(--color-blue-300)"
stopColor="var(--color-blue-500)"
```
**Fix**: CSS variables not usable in SVG attrs directly. Move gradient to CSS:
```css
.progress-ring-track { stroke: var(--blue-100); }
.progress-ring-fill { stroke: url(#progress-grad); }
```
Define gradient in globals.css once.

### 6. `client/src/components/ui/Badge.tsx` — **Core component**
**Current violations** (lines 11-16):
```tsx
default: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
info: "bg-blue-50 text-ink-500 dark:bg-blue-900/30 dark:text-blue-300"
outline: "border brd-clr-divider-soft..."
```
**Fix**: Use clay tokens + semantic tokens only:
- `default`/`info`: `bg-[var(--blue-50)] text-[var(--blue-600)] dark:bg-[var(--blue-900)]/30 dark:text-[var(--blue-300)]`
- `outline`: `border-[var(--clay-border)]` (add `--clay-border: var(--ink-200)` to tokens)

### 7. `client/src/components/ui/Input.tsx` — **Core component**
**Current violations** (lines 35, 37):
```tsx
bg-clay-surface-alt
border-blue-500
ring-blue-50
ring-semantic-red/30
```
**Fix**: Already mostly clay. Just ensure `border-blue-500` → `border-[var(--blue-500)]`, `ring-blue-50` → `ring-[var(--blue-50)]`

---

## Verification Steps
1. `grep -r "bg-blue-500\|text-blue-700\|border-blue-100\|bg-clr-surface\|clr-text\|clr-primary\|clr-danger" client/src --include="*.tsx" | grep -v node_modules` → **should return only test files**
2. `grep -r "surface-container\|on-surface\|color-primary\|color-error" client/src/styles/globals.css` → **should return nothing**
3. Open app in browser, toggle dark mode → clay cards should have visible light highlight shadow
4. Run `npm run build` in client → no CSS errors

---

## Related Tasks
- Blocks: All other design tasks (01-12)
- Run this first, then re-audit

---

## Notes
- This is the **foundational fix** — do not start page-level fixes until complete
- The clay token system in design.md is complete and correct; legacy tokens are technical debt
- After this, all page tasks become simple token replacement