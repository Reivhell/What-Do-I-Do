# Design Task: Inbox Page — Claymorphism Compliance

## Priority: P1
**Impact**: Capture flow is core; frequent use

---

## Problem Statement
`client/src/pages/Inbox.tsx` has legacy tokens and missing focus states:

| Line | Current | Issue |
|------|---------|-------|
| 332 | `clr-danger` for error | Legacy token |
| 333 | `font-body text-[15px] clr-danger` | Legacy token |
| 361 | `clr-text-secondary` for count label | Legacy token + eyebrow header |
| 360 | `text-[12px] font-semibold uppercase tracking-[0.04em]` | AI slop eyebrow pattern |
| Various | Filter buttons: no focus ring | A11y gap |

---

## Acceptance Criteria
- [ ] Zero legacy `clr-*` tokens
- [ ] Filter buttons have focus-visible ring
- [ ] Error states use clay surface + semantic red
- [ ] Capture items use `Card` component
- [ ] No eyebrow uppercase tracked headers (use normal label)

---

## Files to Modify

### `client/src/pages/Inbox.tsx`

**1. Error State (lines 329-333)**
```tsx
// Before
<div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50">
  <span className="material-symbols-outlined clr-danger text-2xl">error</span>
  <p className="font-body text-[15px] clr-danger">Failed to load inbox items.</p>

// After
<Card level={1} className="p-4 border border-[var(--semantic-red)]/30">
  <div className="flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-[var(--semantic-red)]">error</span>
    <p className="font-body text-[15px] text-[var(--semantic-red)]">Failed to load inbox items.</p>
  </div>
</Card>
```

**2. Count Label (lines 360-363)**
```tsx
// Before: Eyebrow pattern
<p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">
  {sorted.length} item{sorted.length !== 1 ? 's' : ''}
</p>

// After: Normal label
<p className="font-body text-[14px] font-medium text-[var(--ink-500)]">
  {sorted.length} item{sorted.length !== 1 ? 's' : ''}
</p>
```

**3. Capture Item Rows**
```tsx
// Before: Custom div with clay-l1
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-4">

// After: Card component
<Card level={1} className="p-4">
```

**4. Filter Buttons**
```tsx
// Add focus-visible
className="... focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]"
```

**5. Typography fixes**
- `clr-text-secondary` → `text-[var(--ink-500)]`
- `clr-danger` → `text-[var(--semantic-red)]`

---

## Verification
1. `grep -n "clr-\|uppercase tracking" client/src/pages/Inbox.tsx` → **empty**
2. Filter buttons keyboard-navigable with visible focus
3. Dark mode: cards have clay shadows

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: None

---

## Estimated Effort
~1.5 hours