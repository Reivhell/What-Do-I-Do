# Design Task: ActivityTracker Page — Claymorphism Consistency

## Priority: P2
**Impact**: Timer UI, frequent use; mostly compliant

---

## Problem Statement
`client/src/pages/ActivityTracker.tsx` uses `Card` component correctly but has minor issues:

| Line | Current | Issue |
|------|---------|-------|
| Various | `Card level={1}` | OK |
| 6 | Imports `Button`, `Input`, `Modal`, `EmptyState` | OK |
| Various | `text-ink-*` hardcoded | Should use `var(--ink-*)` |
| Modal | `Modal` component | OK |

**Minor issues**:
- Timer display card may need `clay-l2` emphasis
- Active session card may need semantic color (running = green)
- Session history items need consistent card styling

---

## Acceptance Criteria
- [ ] All cards use `Card` component with appropriate level
- [ ] Active timer uses semantic green accent (running state)
- [ ] Session history items use `Card level={2}` (nested)
- [ ] No hardcoded `text-ink-*` colors
- [ ] Buttons use `Button` component

---

## Files to Modify

### `client/src/pages/ActivityTracker.tsx`

**1. Timer Display Card**
```tsx
// Before: Plain Card
<Card level={1} className="p-6 text-center">
  <div className="font-mono text-4xl">{fmtTimer(seconds)}</div>

// After: Emphasized when running
<Card level={running ? 2 : 1} className="p-6 text-center">
  <div className="font-mono text-4xl text-[var(--ink-900)]">{fmtTimer(seconds)}</div>
  {running && <StatusDot variant="success" className="mx-auto mt-2" />}
</Card>
```

**2. Active Session Card**
```tsx
// Before
<Card level={1} className="p-4">
  <Badge variant="success">Running</Badge>

// After: Add semantic tint
<Card level={1} className="p-4 border border-[var(--semantic-green)]/30">
  <Badge variant="success">Running</Badge>
```

**3. Session History Items**
```tsx
// Before: Custom div
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-4 flex items-center gap-3">

// After: Nested Card
<Card level={2} className="p-4 flex items-center gap-3">
```

**4. Typography Audit**
```tsx
// Replace all text-ink-* with var(--ink-*)
grep -n "text-ink-" client/src/pages/ActivityTracker.tsx
```

**5. Action Buttons**
```tsx
// Ensure all use Button component
<Button variant="primary" size="md" onClick={start}>  // Play
<Button variant="destructive" size="md" onClick={stop}>  // Stop
<Button variant="secondary" size="sm" onClick={edit}>  // Edit
```

---

## Verification
1. `grep -n "text-ink-\|bg-clay-surface clay-l1" client/src/pages/ActivityTracker.tsx` → **empty (use Card)**
2. Active timer has semantic green indicator
3. Session items use nested `Card level={2}`

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/Card)
- **Blocks**: None

---

## Estimated Effort
~1 hour