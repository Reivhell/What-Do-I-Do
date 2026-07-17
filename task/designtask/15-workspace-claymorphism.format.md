# Design Task: Workspace Page — Claymorphism + Non-Standard Utilities

## Priority: P2
**Impact**: Widget config UI; uses `clay-button` ad-hoc utility

---

## Problem Statement
`client/src/pages/Workspace.tsx` uses non-standard `clay-button` utility class and legacy tokens:

| Line | Current | Issue |
|------|---------|-------|
| 345 | `clay-button p-2 rounded-lg` for visibility toggle | Non-standard utility (should be Button or clay-l1) |
| 354 | `clay-button p-2 rounded-lg` for pin toggle | Non-standard utility |
| 345,354 | `bg-clr-primary-20 dark:bg-clr-primary-10 clr-primary` | Legacy tokens |
| 345,354 | `bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary` | Legacy tokens |
| Various | Widget cards | Need to audit for clay compliance |

---

## Acceptance Criteria
- [ ] Zero `clay-button` non-standard utility
- [ ] Zero legacy `clr-*` tokens
- [ ] Toggle buttons use `Button` component or `clay-l1`
- [ ] Widget cards use `Card` component
- [ ] Active/inactive states use clay tokens

---

## Files to Modify

### `client/src/pages/Workspace.tsx`

**1. Visibility Toggle (lines 343-351)**
```tsx
// Before: Non-standard utility
<button
  onClick={() => onToggleVisibility(widget.widgetType)}
  className={`clay-button p-2 rounded-lg transition-colors ${isVisible ? 'bg-clr-primary-20 dark:bg-clr-primary-10 clr-primary' : 'bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary'}`}
  title={isVisible ? 'Hide widget' : 'Show widget'}
>

// After: Clay tokens + Button or clay-l1
<button
  onClick={() => onToggleVisibility(widget.widgetType)}
  className={`p-2 rounded-lg clay-l1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] ${
    isVisible
      ? 'bg-[var(--blue-50)] text-[var(--blue-500)]'
      : 'bg-[var(--clay-surface)] text-[var(--ink-500)]'
  }`}
  title={isVisible ? 'Hide widget' : 'Show widget'}
>
```

**2. Pin Toggle (lines 352-360)**
```tsx
// Same fix as above
```

**3. Widget Cards**
```tsx
// Search for widget card wrapper, ensure:
<Card level={1} className="p-4">
  {/* Widget preview, drag handle, toggles */}
</Card>
```

**4. Preset Cards**
```tsx
// Search for preset selector, ensure:
<Card level={1} className={active ? 'clay-l2 border border-[var(--blue-500)]/30' : 'clay-l1'}>
```

**5. Typography Audit**
```tsx
// Replace all clr-* and text-ink-*
grep -n "clr-\|text-ink-" client/src/pages/Workspace.tsx
```

### `client/src/components/workspace/*.tsx` (if exists)
**Actions**:
- Audit for `clr-*` tokens
- Audit for `clay-button` utility
- Ensure all use `Card`, `Button` components

---

## Verification
1. `grep -rn "clay-button\|clr-\|text-ink-" client/src/pages/Workspace.tsx` → **empty**
2. Toggle buttons keyboard-navigable with focus ring
3. Widget cards have clay shadows

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/Card)
- **Blocks**: None

---

## Estimated Effort
~1.5 hours