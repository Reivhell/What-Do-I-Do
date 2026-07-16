# Design Task: Tasks & Habits Pages — Claymorphism Consistency

## Priority: P2
**Impact**: Both follow clay system mostly; minor gaps

---

## Problem Statement

### Tasks.tsx (mostly OK, minor issues)
| Line | Current | Issue |
|------|---------|-------|
| 25 | `bg-blue-500` for "Capture" button | Hardcoded — should use Button component or `var(--blue-500)` |
| 33 | `bg-clay-surface clay-l1 p-5` | OK — but nested TaskList may need `level={2}` |

### Habits.tsx (mostly OK)
| Line | Current | Issue |
|------|---------|-------|
| 130-134 | Empty `clay-l1` div for edit form (no content) | Dead code — remove |
| 73 | `text-ink-500` for error | OK but should use `var(--ink-500)` |

---

## Acceptance Criteria
- [ ] Tasks "Capture" button uses `Button` component or `var(--blue-500)`
- [ ] Habits edit form dead code removed
- [ ] All container cards use `Card` component
- [ ] Nested cards use `level={2}` appropriately

---

## Files to Modify

### `client/src/pages/Tasks.tsx`

**1. Capture Button (line 25)**
```tsx
// Before
<button className="inline-flex items-center gap-2 rounded-[--radius-pill] bg-blue-500 px-5 py-2.5 font-body text-sm font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed">
  <Plus className="size-4" />
  Capture
</button>

// After: Use Button component
<Button variant="primary" size="md">
  <Plus className="size-4" />
  Capture
</Button>
```

**2. Task List Container (line 33)**
```tsx
// Before
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">

// After: Card component
<Card level={1} className="p-5">
```

### `client/src/pages/Habits.tsx`

**1. Remove Dead Edit Form (lines 129-134)**
```tsx
// Before
{editingHabit && (
  <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
    <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Edit Habit</h3>
    {/* Reuse HabitForm inline via setEditingHabit — the HabitList handles the form display */}
  </div>
)}

// After: Remove entirely — HabitList handles edit form display
```

**2. Error Text (line 73)**
```tsx
// Before
<p className="font-body text-[15px] text-ink-500">Failed to load habits</p>

// After
<p className="font-body text-[15px] text-[var(--ink-500)]">Failed to load habits</p>
```

**3. Container Card (line 115)**
```tsx
// Before
<div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">

// After
<Card level={1} className="p-5">
```

---

## Verification
1. `grep -n "bg-blue-500\|text-ink-" client/src/pages/Tasks.tsx client/src/pages/Habits.tsx` → **empty**
2. Both pages use `Card` + `Button` components
3. Habits edit form renders correctly (no dead code)

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/Card)
- **Blocks**: None

---

## Estimated Effort
~1 hour