# Design Task: Settings Page — Claymorphism + Eyebrow Headers

## Priority: P2
**Impact**: Long page, many sections; eyebrow headers prevalent

---

## Problem Statement
`client/src/pages/Settings.tsx` mostly uses `Card` component correctly but has:

| Line | Current | Issue |
|------|---------|-------|
| 61 | `uppercase tracking-[0.04em]` on section labels | Eyebrow slop pattern |
| 361 | `uppercase tracking-[0.04em] clr-text-secondary` | Eyebrow + legacy token |
| 822 | `clr-text-secondary` for sidebar links | Legacy token |
| 493-499 | `clr-text-secondary`, `clr-text-primary`, `clr-text-muted` in budget form | Legacy tokens |
| Various | `Card` component | OK |

---

## Acceptance Criteria
- [ ] Zero eyebrow uppercase tracked headers
- [ ] Zero legacy `clr-*` tokens
- [ ] All section cards use `Card` component
- [ ] Sidebar links use clay tokens + focus ring
- [ ] Budget form uses `ClayInput` + `Button`

---

## Files to Modify

### `client/src/pages/Settings.tsx`

**1. Section Headers (search `uppercase tracking`)**
```tsx
// Before: Eyebrow
<h2 className="font-display text-xl font-bold text-ink-900 mb-4">Profile</h2>
<p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary mb-4">Account settings</p>

// After: Normal label
<h2 className="font-display text-xl font-bold text-[var(--ink-900)] mb-1">Profile</h2>
<p className="font-body text-[14px] text-[var(--ink-500)] mb-4">Account settings</p>
```

**2. Budget Form (lines 493-511)**
```tsx
// Before: Legacy tokens
<label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Period</label>
<select className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary">

// After: ClayInput + tokens
<ClayInput label="Period" />
// Or for select:
<label className="font-body text-[13px] font-medium text-[var(--ink-500)]">Period</label>
<select className="bg-[var(--clay-surface-alt)] p-3 rounded-[--radius-md] w-full font-body text-sm text-[var(--ink-900)]">
```

**3. Sidebar Links (lines 818-826)**
```tsx
// Before
<a className="tap-target clay-transition inline-flex items-center gap-1.5 rounded-[--radius-md] px-3 py-2 font-body text-[13px] font-semibold text-ink-500 hover:bg-blue-50 hover:text-ink-900">

// After: Clay tokens + focus ring
<a className="tap-target clay-transition inline-flex items-center gap-1.5 rounded-[--radius-md] px-3 py-2 font-body text-[13px] font-semibold text-[var(--ink-500)] hover:bg-[var(--blue-50)] hover:text-[var(--ink-900)] focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]">
```

**4. Typography Audit**
```tsx
// Replace all clr-* and text-ink-* 
grep -n "clr-\|text-ink-" client/src/pages/Settings.tsx
```

**5. Error Cards (lines 67-75, 93, 179, 276, 394, 462, 568, 573)**
```tsx
// Before: Custom div
<div className="rounded-[--radius-lg] bg-red-50 border border-red-200 p-4">

// After: Card with semantic border
<Card level={1} className="border border-[var(--semantic-red)]/30">
  <p className="font-body text-[14px] text-[var(--semantic-red)]">{message}</p>
</Card>
```

---

## Verification
1. `grep -n "clr-\|uppercase tracking\|text-ink-" client/src/pages/Settings.tsx` → **empty**
2. All section cards use `Card` component
3. Sidebar links keyboard-navigable with focus ring

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/ClayInput/Card)
- **Blocks**: None

---

## Estimated Effort
~2 hours (long page)