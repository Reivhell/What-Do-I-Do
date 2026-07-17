# Design Task: Money Page — Claymorphism Compliance

## Priority: P0
**Impact**: Most token violations, mixes legacy + clay + hardcoded colors

---

## Problem Statement
`client/src/pages/Money.tsx` has the **most violations** of any page:

| Line | Current | Issue |
|------|---------|-------|
| 493-499 | `bg-clr-surface-white dark:bg-clr-surface-container-high`, `clr-text-primary`, `clr-text-secondary`, `clr-text-muted` | Legacy tokens in modal forms |
| 507-511 | `bg-clr-primary`, `clr-on-primary`, `clay-button` | Legacy primary token |
| 468-480 | `bg-clr-surface-white dark:bg-clr-surface-container-high` in account/transaction cards | Legacy surface token |
| 200-350 | Hardcoded `bg-green-500`, `bg-red-500`, `bg-blue-500`, `bg-amber-500` for income/expense/budget | Hardcoded semantic colors |
| 400-450 | `clay-card-inset` custom class (not in design system) | Non-standard utility |

---

## Acceptance Criteria
- [ ] Zero legacy `clr-*` tokens
- [ ] Zero `clay-card-inset` (replace with `bg-[var(--clay-surface-alt)]`)
- [ ] Income/Expense/Budget cards use semantic tokens: `var(--semantic-green)`, `var(--semantic-red)`, `var(--semantic-amber)`
- [ ] All modals use `Modal` component + `ClayInput` + `Button`
- [ ] Account/Transaction cards use `Card` component with `level={1}`
- [ ] Dark mode works correctly

---

## Files to Modify

### `client/src/pages/Money.tsx`

**1. Overview Stats Cards (lines ~150-200)**
```tsx
// Before: Hardcoded colors
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
  <div className="bg-green-500/10 p-3 rounded-xl">...</div>

// After: Semantic tokens
<Card level={1} className="p-5">
  <div className="bg-[var(--semantic-green)]/10 p-3 rounded-xl">...</div>
```

**2. Account Cards (lines ~250-320)**
```tsx
// Before
<div className="rounded-[--radius-lg] bg-clr-surface-white dark:bg-clr-surface-container-high clay-l1 p-4">

// After
<Card level={1} className="p-4">
```

**3. Transaction List Items (lines ~330-380)**
```tsx
// Before: Inline styles with hardcoded colors
<span className={txn.type === 'income' ? 'text-green-600' : 'text-red-600'}>

// After: Semantic tokens
<span className={txn.type === 'income' ? 'text-[var(--semantic-green)]' : 'text-[var(--semantic-red)]'}>
```

**4. Budget Cards (lines ~390-430)**
```tsx
// Before: bg-amber-500 for warning
<div className="bg-amber-500/10 ...">

// After
<div className="bg-[var(--semantic-amber)]/10 ...">
```

**5. Create Account Modal (lines ~460-490)**
```tsx
// Before: Legacy tokens
<select className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary">
<ClayInput ... className="clay-card-inset ...">

// After: Clay tokens + components
<select className="bg-[var(--clay-surface-alt)] p-3 rounded-[--radius-md] w-full font-body text-sm text-[var(--ink-900)] placeholder-[var(--ink-400)] clay-inset">
<ClayInput ... /> // ClayInput already fixed in Task 00
```

**6. Create Transaction Modal (lines ~490-530)**
```tsx
// Before
<button className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">

// After: Use Button component
<Button variant="primary" size="md" className="flex-1" type="submit">Create</Button>
```

**7. Create Budget Modal (lines ~530-570)**
```tsx
// Before: Same legacy token issues
// After: Same fixes as above
```

**8. Typography fixes throughout**
- `clr-text-primary` → `text-[var(--ink-900)]`
- `clr-text-secondary` → `text-[var(--ink-500)]`
- `clr-text-muted` → `text-[var(--ink-400)]`
- `font-[Plus Jakarta Sans]` → `font-body` or `font-display`

---

## Verification
1. `grep -n "clr-\|clay-card-inset\|bg-green-500\|bg-red-500\|bg-blue-500\|bg-amber-500\|clr-primary\|clr-on-primary" client/src/pages/Money.tsx` → **empty**
2. All modals use `Modal`, `ClayInput`, `Button` components
3. Dark mode: cards have clay shadows, text readable
4. Build passes

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 00 fixes to `ClayInput`, `Button`, `Modal`
- **Blocks**: None

---

## Estimated Effort
~3 hours (most violations of any page)