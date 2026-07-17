# Design Task: Dashboard Page — Claymorphism Compliance

## Priority: P0
**Impact**: Primary landing page, sets visual standard for entire app

---

## Problem Statement
`client/src/pages/Dashboard.tsx` mixes legacy tokens, hardcoded Tailwind colors, and clay tokens inconsistently:

| Line | Current | Issue |
|------|---------|-------|
| 676 | `bg-clr-surface-white dark:bg-clr-surface-container-high` | Legacy token |
| 677 | `clr-primary`, `clr-success`, `clr-danger`, `clr-secondary`, `clr-text-primary`, `clr-text-secondary` | Legacy color tokens |
| 134-139 | `clr-danger` for error banner | Legacy token |
| 678 | `text-clr-text-secondary` | Legacy token |
| Various | `bg-blue-500`, `bg-green-500`, `bg-red-500`, `bg-amber-500` in stat cards | Hardcoded — should use clay semantic tokens |

---

## Acceptance Criteria
- [ ] Zero legacy `clr-*` tokens used
- [ ] Zero hardcoded `bg-blue-500` / `bg-green-500` / etc. in stat cards
- [ ] All cards use `Card` component with `level={1|2}`
- [ ] Quick actions use `Button` component variants
- [ ] Error banner uses clay surface + semantic red token
- [ ] Dark mode clay shadows visible

---

## Files to Modify

### `client/src/pages/Dashboard.tsx`
**Stat Cards (lines ~200-350)**: Replace inline styles with `Card` component
```tsx
// Before
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
  <div className="bg-blue-500/10 p-3 rounded-xl">...</div>

// After
<Card level={1} className="p-5">
  <div className="bg-[var(--blue-50)] p-3 rounded-xl">...</div>
```

**Quick Actions (lines 668-682)**: Use `Button` component with `variant="secondary"` + icon
```tsx
// Before
<button className="flex flex-col items-center gap-2 group">
  <div className="clay-button w-full aspect-square max-w-[56px] flex items-center justify-center rounded-2xl bg-clr-surface-white dark:bg-clr-surface-container-high clr-primary group-hover:scale-110 transition-transform mx-auto">
    <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>{act.icon}</span>
  </div>

// After
<Button variant="secondary" size="lg" className="flex flex-col items-center gap-2 w-full">
  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>{act.icon}</span>
  <span className="font-[Plus Jakarta Sans] text-[11px] leading-[14px] font-semibold text-center text-[var(--ink-500)]">{act.label}</span>
</Button>
```

**Error Banner (lines 134-139)**: Use clay surface + semantic token
```tsx
<div className="rounded-[--radius-lg] bg-[var(--clay-surface)] border border-[var(--semantic-red)]/30 p-4 clay-l1">
  <span className="material-symbols-outlined text-[var(--semantic-red)]">error</span>
  <p className="font-body text-[15px] text-[var(--semantic-red)]">Failed to load dashboard data. Showing cached values.</p>
</div>
```

**Typography**: Replace `text-clr-text-secondary` → `text-[var(--ink-500)]`, `text-clr-text-primary` → `text-[var(--ink-900)]`

---

## Verification
1. Visual: Dashboard matches design.md claymorphism exactly
2. Dark mode: Clay highlights visible, no flat cards
3. Grep: `grep -n "clr-\|bg-blue-500\|bg-green-500\|bg-red-500\|bg-amber-500" client/src/pages/Dashboard.tsx` → **empty**
4. Components: Uses `Card`, `Button` from `@/components/ui`

---

## Dependencies
- **Requires**: Task 00 (token consolidation) complete
- **Blocks**: None

---

## Estimated Effort
~2 hours (mostly mechanical replacement)