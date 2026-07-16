# Design Task: Statistics Page — Claymorphism + Semantic Colors

## Priority: P1
**Impact**: Large data page, hardcoded colors in stat cards

---

## Problem Statement
`client/src/pages/Statistics.tsx` uses hardcoded semantic colors + eyebrow headers:

| Line | Current | Issue |
|------|---------|-------|
| 362 | `text-green-600` for "Most Consistent Habit" | Hardcoded semantic |
| 361 | `uppercase tracking-[0.04em] text-ink-500` | Eyebrow slop |
| 85-86 | `text-semantic-red` for error | OK (semantic token) |
| Various | `Card level={1}` | OK |

---

## Acceptance Criteria
- [ ] Zero hardcoded `text-green-600`, `text-red-600`, etc.
- [ ] Semantic colors only for real status (not decorative)
- [ ] Labels use normal case
- [ ] All stat cards use `Card` component with `level={1}`

---

## Files to Modify

### `client/src/pages/Statistics.tsx`

**1. Most Consistent Habit Card (lines 359-364)**
```tsx
// Before
<Card level={1} className="p-5">
  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Most Consistent Habit</p>
  <p className="font-display text-2xl font-bold text-green-600 mt-1">{data.habit.mostConsistentHabit.name}</p>
  <p className="font-body text-[13px] text-ink-400">{data.habit.mostConsistentHabit.completionRate}% completion</p>

// After: Normal case + clay tokens
<Card level={1} className="p-5">
  <p className="font-body text-[13px] font-medium text-[var(--ink-500)] mb-1">Most Consistent Habit</p>
  <p className="font-display text-2xl font-bold text-[var(--ink-900)] mt-1">{data.habit.mostConsistentHabit.name}</p>
  <p className="font-body text-[13px] text-[var(--ink-400)]">{data.habit.mostConsistentHabit.completionRate}% completion</p>
</Card>
```

**2. Other Stat Cards (search for `text-green-600`, `text-red-600`, `text-amber-500`)**
```tsx
// Replace with semantic tokens if status, else ink tokens
text-green-600 → text-[var(--semantic-green)]  // only if success status
text-red-600 → text-[var(--semantic-red)]      // only if error status
text-amber-500 → text-[var(--semantic-amber)]  // only if warning status
text-ink-500 → text-[var(--ink-500)]
text-ink-400 → text-[var(--ink-400)]
text-ink-900 → text-[var(--ink-900)]
```

**3. Eyebrow Headers (search `uppercase tracking`)**
```tsx
// Before
<p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">Label</p>

// After
<p className="font-body text-[13px] font-medium text-[var(--ink-500)]">Label</p>
```

---

## Verification
1. `grep -n "text-green-600\|text-red-600\|text-amber-500\|uppercase tracking" client/src/pages/Statistics.tsx` → **empty**
2. All stat cards use `Card level={1}`
3. Semantic colors only for real status indicators

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: None

---

## Estimated Effort
~1 hour