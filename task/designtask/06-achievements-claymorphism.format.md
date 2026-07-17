# Design Task: Achievements Page — Claymorphism + Color Noise

## Priority: P1
**Impact**: 6 category colors, custom shadows — visual noise

---

## Problem Statement
`client/src/pages/Achievements.tsx` + `AchievementGrid.tsx` + `AchievementCard.tsx`:

| Issue | Location | Severity |
|-------|----------|----------|
| 6 category colors (info/success/warning/danger/default/outline) | AchievementCard.tsx:9-16 | High — violates Restrained palette |
| Custom inline shadow `shadow-[0_0_20px_rgba(34,197,94,0.15)]` | AchievementCard.tsx:28 | Medium — not in design system |
| Hardcoded `bg-blue-500` for active tab | AchievementGrid.tsx:34 | Medium |
| `bg-ink-100 dark:bg-zinc-800` for locked state | AchievementCard.tsx:59 | Medium — mixing token systems |
| `text-ink-300`, `text-ink-400` | AchievementCard.tsx:54,62 | Low — should be clay tokens |

---

## Acceptance Criteria
- [ ] Category colors reduced to: blue (structure) + semantic (status only)
- [ ] No custom inline shadows — use `clay-l1`/`clay-l2`
- [ ] Active tab uses `Button` variant or `bg-[var(--blue-500)]`
- [ ] Locked state uses `bg-[var(--clay-surface-alt)]`
- [ ] All cards use `Card` component

---

## Files to Modify

### `client/src/components/achievements/AchievementCard.tsx`

**1. Category Colors (lines 9-16)**
```tsx
// Before: 6 colors
const categoryColors: Record<string, string> = {
  activity: 'info', habits: 'success', goals: 'warning',
  planner: 'default', money: 'danger', loyalty: 'outline',
};

// After: 2 roles only
const categoryColors: Record<string, string> = {
  activity: 'default', habits: 'default', goals: 'default',
  planner: 'default', money: 'default', loyalty: 'default',
};
// Use Badge variant="default" for all, or remove color entirely
```

**2. Unlocked Shadow (line 28)**
```tsx
// Before
className={`... ${isUnlocked ? 'shadow-[0_0_20px_rgba(34,197,94,0.15)]' : ''} ...`}

// After: Use clay-l2 for emphasis
className={`... ${isUnlocked ? 'clay-l2' : 'clay-l1'} ...`}
```

**3. Locked State (lines 59-62)**
```tsx
// Before
<div className="size-12 rounded-full bg-ink-100 dark:bg-zinc-800 flex items-center justify-center">
  <span className="text-lg text-ink-300">?</span>

// After
<div className="size-12 rounded-full bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] flex items-center justify-center">
  <span className="text-lg text-[var(--ink-300)]">?</span>
```

**4. Progress Text (lines 53-54, 62)**
```tsx
// Before
<span className="font-mono text-[11px] text-ink-400">

// After
<span className="font-mono text-[11px] text-[var(--ink-400)]">
```

### `client/src/components/achievements/AchievementGrid.tsx`

**1. Active Tab (lines 30-37)**
```tsx
// Before
className={`... ${activeCategory === cat ? 'bg-blue-500 text-white' : 'bg-clay-surface text-ink-500 hover:bg-blue-50'}`}

// After: Use Button component or clay tokens
className={`... ${activeCategory === cat ? 'bg-[var(--blue-500)] text-white' : 'bg-clay-surface text-[var(--ink-500)] hover:bg-[var(--blue-50)]'}`}
```

### `client/src/pages/Achievements.tsx`
- No changes needed (uses components correctly)

---

## Verification
1. `grep -n "shadow-\[0_0_20px\|bg-ink-100\|dark:bg-zinc-800\|bg-blue-500\|purple\|warning\|danger" client/src/components/achievements/` → **empty**
2. Visual: Page reads calm, blue-accent only
3. Unlocked cards have subtle clay-l2 emphasis

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: None

---

## Estimated Effort
~1.5 hours