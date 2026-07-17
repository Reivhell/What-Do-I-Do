# Design Task: Core UI Components — Claymorphism Hardening

## Priority: P1
**Impact**: All pages depend on these components; half-states missing

---

## Problem Statement
Core UI components (`Button`, `Input`, `ClayInput`, `Badge`, `ProgressBar`, `ProgressRing`, `Card`, `Modal`, `Toggle`, `Select`, `EmptyState`) are mostly clay-compliant but have:

1. **Inconsistent shadow application**: Some use `clay-l1`, some use custom inline shadows, some no shadow
2. **Missing interactive states**: Hover/focus/active/disabled/loading/error not all present
3. **Hardcoded Tailwind colors** in some components (see Task 00)
4. **Non-standard utility classes** like `clay-card-inset`, `clay-button` defined ad-hoc in pages

---

## Acceptance Criteria
- [ ] All interactive components have: default, hover, focus-visible, active, disabled states
- [ ] All components use only clay tokens (no hardcoded Tailwind colors)
- [ ] No ad-hoc utility classes (`clay-button`, `clay-card-inset`) defined in pages
- [ ] Loading state: skeleton or spinner per design.md
- [ ] Error state: semantic red ring + message
- [ ] Consistent shadow levels across all components

---

## Files to Modify

### 1. `client/src/components/ui/Button.tsx`
**Current**: Lines 12-30 — base, variants, sizes
**Fixes**:
- Add `focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]` to base
- Add `disabled:opacity-50 disabled:cursor-not-allowed` (already present)
- Ensure all variants use clay tokens (see Task 00)
- Add `loading` prop: shows spinner, disables interaction
- Add `clay-pressed` on active for all variants (not just primary)

**Test**: `client/src/components/ui/Button.test.tsx` should verify all states

### 2. `client/src/components/ui/Input.tsx`
**Current**: Lines 10-52 — forwardRef input
**Fixes**:
- `focus:border-[var(--blue-500)]` (already borderline)
- Add `clay-l1` on focus for clay effect
- Error state: `ring-2 ring-[var(--semantic-red)]/30` (fixed in Task 00)
- Loading state: right-side spinner
- Ensure `bg-clay-surface-alt` only for nested (currently used everywhere)

### 3. `client/src/components/ui/ClayInput.tsx`
**Current**: Lines 8-25
**Fixes**:
- Use clay tokens (Task 00)
- Add `clay-l1` on focus
- Add loading spinner
- Remove `font-[Plus Jakarta Sans]` → `font-body`

### 4. `client/src/components/ui/Card.tsx`
**Current**: Lines 15-62
**Fixes**:
- Already good (`clay-l1`, `clay-l2`, `clay-transition`)
- Add `interactive` prop for hover/active states
- Add `nested` prop for `--clay-surface-alt` background

### 5. `client/src/components/ui/Modal.tsx`
**Current**: (need to read)
**Fixes**:
- Ensure backdrop uses `bg-black/30 backdrop-blur-sm` (purposeful glass for modal — OK per design.md)
- Add `clay-l2` to modal surface
- Ensure focus trap inside modal
- Ensure ESC closes

### 6. `client/src/components/ui/Badge.tsx`
**Current**: Lines 19-33
**Fixes**:
- Use clay tokens (Task 00)
- Add `outline` variant using `--clay-border`
- Ensure dark mode tuples correct

### 7. `client/src/components/ui/ProgressBar.tsx`
**Current**: Lines 6-23
**Fixes**:
- Use clay tokens (Task 00)
- Add `aria-valuetext` for screen readers
- Add `clay-inset` track style

### 8. `client/src/components/ui/ProgressRing.tsx`
**Current**: Lines 8-57
**Fixes**:
- Move gradient to CSS (Task 00)
- Add `clay-inset` ring style for track
- Ensure `value` prop handles undefined gracefully

### 9. `client/src/components/ui/Toggle.tsx`
**Current**: (need to read)
**Fixes**:
- Use clay tokens
- On-state: `bg-[var(--blue-500)]`, Off-state: `bg-[var(--ink-200)]`
- Add `clay-pressed` on thumb

### 10. `client/src/components/ui/Select.tsx`
**Current**: (need to read)
**Fixes**:
- Use `ClayInput` styles + dropdown
- Options should use clay surface
- Use clay tokens

### 11. `client/src/components/ui/EmptyState.tsx`
**Current**: (need to read)
**Fixes**:
- Use `Card` wrapper with `clay-l1`
- Icon: `bg-[var(--blue-50)]` circle
- Text: `text-[var(--ink-500)]`

---

## Verification
1. All components have state coverage (check each file)
2. `grep -rn "bg-blue-500\|bg-green-500\|text-blue-600\|bg-red-500" client/src/components/ui/` → **empty**
3. Visual: Each component renders with clay shadows in light + dark
4. Test: `npm run test -- --testPathPattern="components/ui"` passes

---

## Dependencies
- **Requires**: Task 00 (token consolidation)
- **Blocks**: All page-level fixes depend on this

---

## Estimated Effort
~4 hours (11 components)