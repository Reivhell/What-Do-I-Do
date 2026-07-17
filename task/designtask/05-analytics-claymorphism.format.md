# Design Task: Analytics Page — Claymorphism + Color Strategy

## Priority: P1
**Impact**: Multi-accent colors violate design.md "Restrained" rule

---

## Problem Statement
`client/src/pages/Analytics.tsx` uses **three accent colors** for ScoreCards (blue, green, purple) — design.md mandates **single blue accent** for structure, semantic colors only for status:

| Line | Current | Issue |
|------|---------|-------|
| 13-15 | `colorMap: blue/green/purple` | 3 accents — violates Restrained palette |
| 17-23 | `ScoreCard` uses `text-blue-600`, `text-green-600`, `text-purple-600` | Hardcoded |
| 19 | `uppercase tracking-[0.04em]` on label | Eyebrow slop pattern |
| 154 | `text-ink-900` for header | OK but inconsistent with clay tokens |

---

## Acceptance Criteria
- [ ] ScoreCards use blue accent only (`var(--blue-500)`)
- [ ] No green/purple/red accents for non-semantic data
- [ ] Labels use normal case (no eyebrow uppercase)
- [ ] All cards use `Card` component with `level={1}`
- [ ] Color encoding moved to subtle background tints or icons

---

## Files to Modify

### `client/src/pages/Analytics.tsx`

**1. ScoreCard Color Map (lines 12-24)**
```tsx
// Before: 3 accents
const colorMap: Record<string, string> = {
  blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600',
};

// After: Blue only + semantic for real status
const colorMap: Record<string, string> = {
  blue: 'text-[var(--blue-500)]',
  green: 'text-[var(--semantic-green)]', // only if success metric
  purple: 'text-[var(--blue-500)]', // merge into blue
};
```

**2. ScoreCard Structure (lines 17-23)**
```tsx
// Before
<Card level={1} className="text-center">
  <Icon className={`mx-auto mb-1 size-6 ${colorMap[color] ?? 'text-ink-500'}`} />
  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500">{label}</p>
  <p className={`font-display text-3xl font-bold mt-1 ${colorMap[color] ?? 'text-ink-900'}`}>
    {value !== null ? `${Math.round(value)}%` : 'N/A'}
  </p>

// After: Use Card component props, normal case label
<Card level={1} className="text-center p-5">
  <div className="bg-[var(--blue-50)] rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
    <Icon className={`size-6 text-[var(--blue-500)]`} />
  </div>
  <p className="font-body text-[13px] font-medium text-[var(--ink-500)]">{label}</p>
  <p className="font-display text-3xl font-bold mt-1 text-[var(--ink-900)]">
    {value !== null ? `${Math.round(value)}%` : 'N/A'}
  </p>
</Card>
```

**3. Section Headers**
```tsx
// Before
<h2 className="font-display text-lg font-semibold text-ink-900">Planned vs Actual</h2>

// After: Add clay styling
<h2 className="font-display text-lg font-semibold text-[var(--ink-900)] mb-4">Planned vs Actual</h2>
```

---

## Verification
1. `grep -n "purple\|blue-600\|green-600\|uppercase tracking" client/src/pages/Analytics.tsx` → **empty**
2. All ScoreCards blue accent + clay surface
3. Visual: Page reads as "one product", not rainbow dashboard

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: None

---

## Estimated Effort
~1 hour