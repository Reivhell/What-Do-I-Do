# Design Task: Accessibility — Focus States & A11y Gaps

## Priority: P2
**Impact**: All pages; keyboard navigation gaps

---

## Problem Statement
Audit found **missing focus-visible rings** on interactive elements:

| Location | Issue |
|----------|-------|
| Inbox filter buttons | No focus ring |
| Analytics category tabs | No focus ring |
| Workspace widget toggles | No focus ring |
| Settings sidebar links | Browser default only |
| Planner view switches | No focus ring |
| Insights filter buttons | No focus ring (fixed in Task 13) |

design.md line 176: "Shadow clay tidak boleh jadi satu-satunya penanda interaktif — semua elemen tap-able tetap butuh state focus outline (`2px solid --blue-500`)"

---

## Acceptance Criteria
- [ ] All interactive elements have `focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]`
- [ ] Focus ring uses blue-500 (per design.md)
- [ ] Keyboard tab order is logical
- [ ] No keyboard traps
- [ ] All buttons are real `<button>` elements (not divs)
- [ ] All inputs have associated `<label>`

---

## Files to Modify

### 1. Add global focus utility to `client/src/styles/globals.css`
```css
@layer base {
  *:focus-visible {
    outline: 2px solid var(--blue-500);
    outline-offset: 2px;
  }
}
```
This catches all elements automatically. Then page-level `focus-visible:ring-*` is redundant but can stay for emphasis.

### 2. Page-level fixes (where global isn't enough)
- **Inbox.tsx**: Filter buttons → add `focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]`
- **Analytics.tsx**: Category tabs → add focus ring
- **Workspace.tsx**: Widget toggles → add focus ring
- **Settings.tsx**: Sidebar links → add `focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]`
- **Planner.tsx**: View switches → add focus ring
- **Insights.tsx**: Filter buttons → add focus ring (Task 13)

### 3. Component-level fixes
- **Button.tsx**: Ensure `focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]` in base
- **Input.tsx / ClayInput.tsx**: Ensure focus ring present
- **Badge.tsx**: If interactive (clickable), add focus ring
- **Card.tsx**: If `interactive` prop, add focus ring

### 4. Semantic HTML audit
```bash
grep -rn "<div.*onClick" client/src/pages/ client/src/components/
# Should be <button> or have role="button" + tabIndex
```

### 5. Label audit
```bash
grep -rn "<input" client/src/pages/ client/src/components/ | grep -v "aria-label\|id="
# Ensure all have id + <label htmlFor> or aria-label
```

---

## Verification
1. Tab through every page → all interactive elements show blue focus ring
2. `grep -rn "focus-visible:ring" client/src/components/ui/` → all interactive components present
3. Screen reader test: All buttons announced, all inputs labeled
4. Lighthouse a11y score: ≥90

---

## Dependencies
- **Requires**: Task 00 (token consolidation), Task 03 (UI components)
- **Blocks**: None

---

## Estimated Effort
~2 hours (global CSS + page audits)