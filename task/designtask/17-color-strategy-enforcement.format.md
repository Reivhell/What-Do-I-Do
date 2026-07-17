# Design Task: Color Strategy Enforcement — Restrained Palette

## Priority: P2
**Impact**: All pages; design.md "Restrained" rule violations

---

## Problem Statement
design.md mandates **Restrained** color strategy:
- Tinted neutrals + ONE accent (blue) ≤10%
- Semantic colors (green/red/amber) ONLY for status
- No multi-accent dashboards

Current violations:
- **Analytics**: 3 accents (blue/green/purple) for ScoreCards
- **Achievements**: 6 category colors (info/success/warning/danger/default/outline)
- **Money**: blue/red/green/amber for accounts/transactions/budgets
- **Statistics**: green for "Most Consistent Habit"
- **Dashboard**: hardcoded green/red/amber in stat cards

---

## Acceptance Criteria
- [ ] Blue (`--blue-500`) is the ONLY structural accent
- [ ] Semantic colors used ONLY for real status (income/expense, budget alert, streak fail, error/success)
- [ ] No decorative multi-color (purple, orange, teal accents)
- [ ] Category/type encoding uses: icons, background tints (`bg-[var(--blue-500)]/10`), or typography — NOT color
- [ ] All colors are clay tokens (no hardcoded Tailwind)

---

## Files to Modify

### 1. `client/src/pages/Analytics.tsx` (see Task 05)
- ScoreCards: blue only (merge purple→blue, green→semantic only if success metric)

### 2. `client/src/components/achievements/AchievementCard.tsx` (see Task 06)
- Category colors: all → `default` (blue) or removed

### 3. `client/src/pages/Money.tsx` (see Task 02)
- Income/Expense: semantic green/red (status — OK)
- Accounts: blue only (not green/red/amber)
- Budgets: semantic amber only if warning status

### 4. `client/src/pages/Statistics.tsx` (see Task 07)
- "Most Consistent Habit": ink-900 (not green)
- Real status indicators: semantic only

### 5. `client/src/pages/Dashboard.tsx` (see Task 01)
- Stat cards: blue accent or semantic for real status
- No decorative green/red/amber

### 6. Cross-page audit
```bash
grep -rn "purple\|indigo\|teal\|orange\|pink" client/src/pages/ client/src/components/
# Should return ONLY semantic usage (semantic-amber, semantic-purple if defined)
```

---

## Verification
1. Visual: Every page reads as "one product" with blue accent
2. Semantic colors appear ONLY on: error banners, income/expense, budget alerts, streak fails, success confirmations
3. `grep -rn "purple-600\|indigo-\|teal-\|orange-" client/src/` → **empty**
4. Design review: No rainbow dashboards

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: Tasks 01, 02, 05, 06, 07 (color fixes live in those tasks)

---

## Estimated Effort
~3 hours (spread across page tasks)