# Design Task: LifeLog Page — Claymorphism + Legacy Tokens

## Priority: P1
**Impact**: Timeline view, frequent use; legacy tokens everywhere

---

## Problem Statement
`client/src/pages/LifeLog.tsx` uses legacy `clr-*` tokens extensively:

| Line | Current | Issue |
|------|---------|-------|
| 15-21 | `clr-primary`, `clr-secondary`, `clr-danger`, `clr-success`, `clr-text-primary` | Legacy tokens |
| 23-29 | `bg-clr-primary-20`, `bg-clr-secondary-20`, etc. | Legacy bg tokens |
| 352-367 | `bg-clr-surface-white dark:bg-clr-surface-container-high`, `clr-text-primary`, `clr-text-secondary`, `clr-text-muted`, `bg-clr-primary`, `clr-on-primary`, `clay-card-inset`, `clay-button` | Legacy + non-standard utilities |
| Modal | `backdrop-blur-sm` | OK (purposeful glass for modal) |

---

## Acceptance Criteria
- [ ] Zero legacy `clr-*` tokens
- [ ] Zero `clay-card-inset`, `clay-button` (use `Card`, `Button`, `ClayInput`)
- [ ] Timeline items use `Card` component
- [ ] Source icons use semantic colors (status only)
- [ ] Modal uses `Modal` component + `ClayInput` + `Button`

---

## Files to Modify

### `client/src/pages/LifeLog.tsx`

**1. Source Color Map (lines 15-29)**
```tsx
// Before
const SOURCE_COLORS: Record<string, string> = {
  activity: 'clr-primary', planner: 'clr-secondary', transaction: 'clr-danger',
  habit: 'clr-success', annotation: 'clr-text-primary',
};
const SOURCE_BG: Record<string, string> = {
  activity: 'bg-clr-primary-20', planner: 'bg-clr-secondary-20',
  transaction: 'bg-clr-danger-20', habit: 'bg-clr-success-20', annotation: 'bg-clr-text-primary-10',
};

// After: Use semantic tokens (status only)
const SOURCE_COLORS: Record<string, string> = {
  activity: 'var(--blue-500)', planner: 'var(--blue-500)',  // both structure-ish
  transaction: 'var(--semantic-red)', habit: 'var(--semantic-green)', annotation: 'var(--ink-500)',
};
// For background tints, use opacity: bg-[var(--blue-500)]/10
```

**2. Timeline Item Cards**
```tsx
// Before: Custom div
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-4 flex gap-3">

// After: Card component
<Card level={1} className="p-4 flex gap-3">
```

**3. Annotation Modal (lines 340-373)**
```tsx
// Before: Legacy tokens + non-standard utilities
<div className="flex flex-col gap-1.5">
  <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Title</label>
  <input className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary placeholder-clr-text-muted" />

// After: Use ClayInput component
<ClayInput label="Title" value={title} onChange={...} placeholder="Event title..." />
```

```tsx
// Before: Custom buttons
<button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl clay-card-inset font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-secondary">Cancel</button>
<button type="submit" className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">Save</button>

// After: Use Button component
<div className="flex gap-3 pt-2">
  <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>Cancel</Button>
  <Button variant="primary" size="md" className="flex-1" type="submit">{initial ? 'Update' : 'Save'}</Button>
</div>
```

**4. Typography fixes**
- `clr-text-primary` → `text-[var(--ink-900)]`
- `clr-text-secondary` → `text-[var(--ink-500)]`
- `clr-text-muted` → `text-[var(--ink-400)]`
- `font-[Plus Jakarta Sans]` → `font-body`

---

## Verification
1. `grep -n "clr-\|clay-card-inset\|clay-button" client/src/pages/LifeLog.tsx` → **empty**
2. Modal uses `Modal` component
3. Timeline cards have clay shadows

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/ClayInput)
- **Blocks**: None

---

## Estimated Effort
~2 hours