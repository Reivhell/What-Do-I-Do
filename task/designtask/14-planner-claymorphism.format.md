# Design Task: Planner Page — Claymorphism + Legacy Tokens

## Priority: P1
**Impact**: Calendar views, frequent use; legacy tokens + missing focus

---

## Problem Statement
`client/src/pages/Planner.tsx` uses legacy tokens and hardcoded colors:

| Line | Current | Issue |
|------|---------|-------|
| 250 | `clr-danger` for error | Legacy token |
| 251 | `font-body text-[15px] clr-danger` | Legacy token |
| 302 | `bg-black/30 backdrop-blur-sm` for modal backdrop | OK (purposeful glass) |
| 263-296 | Event views (DayView, WeekView, etc.) | Need to audit child components |
| Various | View switch buttons | Need focus ring |

---

## Acceptance Criteria
- [ ] Zero legacy `clr-*` tokens
- [ ] View switch buttons have focus-visible ring
- [ ] Event cards use `Card` component (via EventCard)
- [ ] Error states use clay surface + semantic red
- [ ] Modal backdrop uses glass (purposeful, OK per design.md)

---

## Files to Modify

### `client/src/pages/Planner.tsx`

**1. Error State (lines 247-251)**
```tsx
// Before
<div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50">
  <span className="material-symbols-outlined clr-danger text-2xl">error</span>
  <p className="font-body text-[15px] clr-danger">{error}</p>

// After
<Card level={1} className="p-4 border border-[var(--semantic-red)]/30">
  <div className="flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-[var(--semantic-red)]">error</span>
    <p className="font-body text-[15px] text-[var(--semantic-red)]">{error}</p>
  </div>
</Card>
```

**2. View Switch Buttons**
```tsx
// Search for view toggle, add focus-visible
className="... focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]"
```

**3. Empty State (lines 263-280)**
```tsx
// Before: Custom empty UI
<div className="flex flex-col items-center justify-center py-16">
  <CalendarOff className="size-12 text-ink-300" />
  <p className="font-body text-[15px] text-ink-500 mt-3">No events scheduled</p>

// After: Use EmptyState component
<EmptyState
  icon={<CalendarOff className="size-8" />}
  title="No events scheduled"
  description="Add an event to start planning your time."
  action={<Button onClick={() => setShowForm(true)}>Add Event</Button>}
/>
```

**4. Event Form Modal (lines 300-307)**
```tsx
// Already uses EventForm component + glass backdrop — verify EventForm uses ClayInput + Button
```

### `client/src/components/planner/views/*.tsx` (DayView, WeekView, MonthView, TripleView)
**Actions**:
- Audit each for `clr-*` tokens → replace with clay tokens
- Audit for `bg-clay-surface clay-l1` → replace with `Card level={1}`
- Audit for hardcoded `bg-blue-500` → `bg-[var(--blue-500)]`
- Ensure event cards use `EventCard` component (which should use `Card`)

### `client/src/components/planner/EventCard.tsx`
**Actions**:
- Use `Card level={1}` or `level={2}` (nested)
- Use semantic colors for event type (if applicable)
- Use clay tokens for all styling

### `client/src/components/planner/EventForm.tsx`
**Actions**:
- Use `ClayInput` for all inputs
- Use `Button` for submit/cancel
- Use `Select` for dropdowns
- Remove `font-[Plus Jakarta Sans]` → `font-body`

---

## Verification
1. `grep -rn "clr-\|bg-blue-500\|text-blue-400" client/src/pages/Planner.tsx client/src/components/planner/` → **empty**
2. View switches keyboard-navigable with focus ring
3. Event cards have clay shadows
4. Modal backdrop uses glass (intentional)

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (Button/ClayInput/Card/EmptyState)
- **Blocks**: None

---

## Estimated Effort
~2.5 hours (4 view components + form + page)