# Design Task: Final Polish — Claymorphism Consistency Pass

## Priority: P3
**Impact**: All pages; final QA before ship

---

## Problem Statement
After Tasks 00-18, run a final polish pass to catch:
- Inconsistent spacing/rhythm between pages
- Card nesting radii not following design.md (`--radius-md` for nested)
- Missing `clay-transition` on interactive elements
- Reduced-motion edge cases
- Dark mode clay shadow verification

---

## Acceptance Criteria
- [ ] All pages use consistent spacing scale (8px base)
- [ ] Nested cards use `--radius-md: 20px` (not 28px)
- [ ] All interactive elements have `clay-transition`
- [ ] Reduced motion: no transform animations, crossfade only
- [ ] Dark mode: clay highlights visible on all cards
- [ ] No orphaned legacy tokens anywhere

---

## Files to Modify

### 1. Spacing audit
```bash
grep -rn "p-4\|p-5\|p-6\|gap-4\|gap-6" client/src/pages/ | sort | uniq -c
# Ensure consistent: p-5 (20px) for cards, gap-6 (24px) for sections
```

### 2. Nested radius audit
```bash
grep -rn "rounded-\[--radius-lg\]" client/src/components/**/Card.tsx client/src/components/**/*Card.tsx
# Nested cards should use rounded-[--radius-md]
```

### 3. Transition audit
```bash
grep -rn "hover:\|active:" client/src/pages/ client/src/components/ui/ | grep -v "clay-transition\|transition-"
# Add clay-transition where missing
```

### 4. Reduced motion check
```css
/* globals.css already has: */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
/* Verify no transform animations escape this */
```

### 5. Dark mode clay verification
```bash
# Open each page in dark mode, screenshot, verify:
# - Cards have visible light highlight shadow (--clay-shadow-light)
# - Text contrast ≥4.5:1
# - No flat cards
```

### 6. Final token grep
```bash
grep -rn "clr-\|surface-container\|on-surface\|color-primary\|color-error\|bg-blue-500\|bg-green-500\|bg-red-500\|bg-amber-500\|clay-card-inset\|clay-button" client/src/
# Should return ONLY test files (Money.test.tsx, etc.)
```

---

## Verification
1. All pages screenshot in light + dark mode
2. Visual diff: Consistent claymorphism across all 15 modules
3. `npm run build` passes
4. `npm run test` passes
5. Lighthouse: Performance ≥90, A11y ≥90, Best Practices ≥90

---

## Dependencies
- **Requires**: All Tasks 00-18 complete
- **Blocks**: None (final step)

---

## Estimated Effort
~3 hours (manual QA + fixes)