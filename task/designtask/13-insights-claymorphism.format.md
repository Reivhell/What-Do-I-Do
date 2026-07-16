# Design Task: Insights Page — Claymorphism Consistency

## Priority: P2
**Impact**: AI insights feed; mostly compliant

---

## Problem Statement
`client/src/pages/Insights.tsx` uses `Card` and `Badge` correctly but has minor issues:

| Line | Current | Issue |
|------|---------|-------|
| 58-62 | `bg-blue-500 text-white` for active filter | Hardcoded — should use `var(--blue-500)` |
| 61 | `bg-clay-surface text-ink-500 hover:bg-blue-50` | Hardcoded blue-50 |
| 77 | `placeholder:text-ink-400` | OK but should be `var(--ink-400)` |
| 93 | `text-blue-400` for loading spinner | Hardcoded |

---

## Acceptance Criteria
- [ ] Zero hardcoded `bg-blue-500`, `bg-blue-50`, `text-blue-400`
- [ ] Filter buttons use clay tokens
- [ ] Search input uses `ClayInput` or clay tokens
- [ ] All insight cards use `Card` component (via InsightCard)

---

## Files to Modify

### `client/src/pages/Insights.tsx`

**1. Filter Buttons (lines 54-67)**
```tsx
// Before
<button
  className={`inline-flex items-center gap-1.5 rounded-[--radius-pill] px-3 py-1.5 font-body text-[13px] font-medium transition-all duration-150 clay-l1 ${
    activeType === value
      ? 'bg-blue-500 text-white'
      : 'bg-clay-surface text-ink-500 hover:bg-blue-50 hover:text-ink-900'
  }`}
>

// After: Clay tokens
<button
  className={`inline-flex items-center gap-1.5 rounded-[--radius-pill] px-3 py-1.5 font-body text-[13px] font-medium transition-all duration-150 clay-l1 focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
    activeType === value
      ? 'bg-[var(--blue-500)] text-white'
      : 'bg-clay-surface text-[var(--ink-500)] hover:bg-[var(--blue-50)] hover:text-[var(--ink-900)]'
  }`}
>
```

**2. Search Input (lines 71-85)**
```tsx
// Before: Custom input
<input
  type="text"
  className="w-full rounded-[--radius-md] bg-clay-surface px-3 py-2 pl-9 font-body text-[14px] text-ink-900 placeholder:text-ink-400 outline-none focus:ring-2 focus:ring-blue-200 transition-shadow"
/>

// After: ClayInput or tokens
<ClayInput
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Cari insight..."
  icon={<Filter className="size-4" />}
/>
// Or with tokens:
<input
  className="w-full rounded-[--radius-md] bg-clay-surface px-3 py-2 pl-9 font-body text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] outline-none focus:ring-2 focus:ring-[var(--blue-200)] transition-shadow"
/>
```

**3. Loading Spinner (line 93)**
```tsx
// Before
<Loader2 className="size-8 animate-spin text-blue-400" />

// After
<Loader2 className="size-8 animate-spin text-[var(--blue-400)]" />
```

**4. InsightCard Component (if exists)**
```tsx
// Verify uses Card level={1}
// Verify uses Badge semantic variants for insight type
```

---

## Verification
1. `grep -n "bg-blue-500\|bg-blue-50\|text-blue-400\|text-ink-" client/src/pages/Insights.tsx` → **empty**
2. Filter buttons keyboard-navigable with focus ring
3. All insight cards use `Card` component

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (ClayInput)
- **Blocks**: None

---

## Estimated Effort
~45 min