# Design Task: Goals Page — Claymorphism + Semantic Colors

## Priority: P2
**Impact**: Complex page with milestones; semantic colors needed

---

## Problem Statement
`client/src/pages/Goals.tsx` uses:

| Line | Current | Issue |
|------|---------|-------|
| 21-25 | `STATUS_COLORS: active/default, at_risk/danger, completed/success, archived/default` | OK — semantic tokens |
| 422-424 | `text-semantic-red` for error | OK |
| Various | `Card` component | OK |
| Various | `ProgressBar` component | OK |

**Minor issues**:
- Goal cards may not use `level={2}` for nested milestones
- Status badges use `Badge` with semantic variants — **correct per design.md**

---

## Acceptance Criteria
- [ ] Goal cards use `Card level={1}`
- [ ] Milestone sub-cards use `Card level={2}` (nested clay)
- [ ] Status badges use `Badge` semantic variants
- [ ] Error states use clay surface + semantic red
- [ ] No hardcoded colors

---

## Files to Modify

### `client/src/pages/Goals.tsx`

**1. GoalCard Container**
```tsx
// Search for goal card wrapper, ensure:
<Card level={1} className="p-5">
  {/* Goal header, progress, milestones */}
  <div className="mt-4 space-y-2">
    {goal.milestones?.map(m => (
      <Card level={2} className="p-3">  {/* Nested clay */}
        {/* Milestone row */}
      </Card>
    ))}
  </div>
</Card>
```

**2. Status Badge**
```tsx
// Already correct — verify:
<Badge variant={STATUS_COLORS[goal.status]}>{goal.status}</Badge>
// STATUS_COLORS maps to: default | warning | success | danger — all semantic ✓
```

**3. Error State (lines 421-424)**
```tsx
// Already uses text-semantic-red — verify clay surface
<Card level={1} className="p-5">
  <p className="font-body text-[15px] text-semantic-red">Failed to load goals.</p>
</Card>
```

**4. Typography Audit**
```tsx
// Replace all text-ink-* with var(--ink-*)
grep -n "text-ink-" client/src/pages/Goals.tsx
// Replace each with text-[var(--ink-XXX)]
```

---

## Verification
1. `grep -n "text-ink-\|bg-blue-500\|bg-green-500\|bg-red-500" client/src/pages/Goals.tsx` → **empty**
2. Goal cards: `Card level={1}`, milestones: `Card level={2}`
3. Status badges use semantic variants

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: None

---

## Estimated Effort
~1 hour