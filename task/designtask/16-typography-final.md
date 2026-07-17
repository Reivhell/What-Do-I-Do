# Typography Consolidation Task

## Problem Statement
The codebase has significant usage of the legacy hardcoded font family `font-[Plus Jakarta Sans]` throughout many `.tsx` files. According to the design.md font system:

- Font family: `Plus Jakarta Sans` (single family)
- Semantic font tokens: `--font-display` and `--font-body`
- `font-display` should be used for headings, titles, emphasis
- `font-body` should be used for body text, labels, UI text
- `font-mono` should only be used for numeric timers (ProgressRing, ActivityTracker)

Currently: Hardcoded `font-[Plus Jakarta Sans]` appears in many components instead of using the semantic font token classes.

## Files with Hardcoded font-[Plus Jakarta Sans] Usage

### High Priority (Core Pages)
- `src/pages/Dashboard.tsx` (12 occurrences)
- `src/pages/Goals.tsx` (require review)
- `src/pages/Tasks.tsx` (require review)
- `src/pages/Analytics.tsx` (require review)
- `src/pages/Settings.tsx` (require review)

### Medium Priority (Components)
- `src/components/*` (various usage)

### Low Priority (Utility/Patterns)
- Various card, header, paragraph components

## Acceptance Criteria

1. **All `font-[Plus Jakarta Sans]` replaced** with appropriate semantic font token:
   - For headings, titles, emphasis → `font-display`
   - For body text, labels → `font-body`
   - For numeric timers → `font-mono`

2. **No deprecated font tokens** remain:
   - No `font-headline-*/font-title-*/font-label-*/font-stat` (legacy Material)
   permanently removed after Task 00

3. **Consistent font usage** across all components in the design system

4. **Build verification**: No tsc errors, consistent visual styling

## Files to Modify

### 1. `src/pages/Dashboard.tsx` (12 occurrences)
- Lines 300, 340, 347, 359, 381, 386, 400, 403, 418, 432, ...
- Replace `className="font-[Plus Jakarta Sans] ..."`
- With appropriate semantic font tokens based on element type:
  - `h3`, `h4`, `strong` → `font-display`
  - `p` tags for body copy → `font-body`
  - Status badges → `font-body` or `font-display` as appropriate

### 2. Additional Pages/Projects
- List all files that require attention (to be completed during implementation)

## Implementation Strategy

### Phase 1: Mapping
1. **Analyze each occurrence** of `font-[Plus Jakarta Sans]`:
   - Element type (h1-h6, p, span, strong, etc.)
   - Context (title, heading, label, content)
   as determined by design.md guidelines

2. **Categorize** each usage:
   - Heading/level usage → `font-display`
   - Body copy → `font-body`
   الافتراضی `font-mono` only if numeric timers

3. **Map to existing semantic tokens**:
   - `font-display` should cover `font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold`
   - `font-body` should cover `font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-normal`

### Phase  editar

```tsx
// Example changes:

// OLD
<p className="font-[Plus Jakarta Sans] text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
  Heading Title
</p>

// NEW (assuming this is a heading)
<p className="font-display text-[16px] leading-[24px] font-semibold text-[var(--ink-900)]">
  Heading Title
</p>

// OLD
<span className="font-[Plus Jakarta Sans] text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">
  Body label
</span>

// NEW (assuming this is a label)
<span classnClassName="font-body text-[12px] leading-[16px] font-medium text-[var(--ink-500)]">
  Body label
</span>
```

### Implementation Steps

1. **Batch replacement** in core pages first (Dashboard, Goals, Tasks, Analytics)
2. **Component library updates** for reusable components
3. **Verification** - grep for remaining `font-[Plus Jakarta Sans]` patterns
4. **Testing** - confirm consistent visual styling

## Verification

### Post-Implementation Checks

1. **Font token validation**:
   ```bash
   # Should return empty after changes
   grep -rn "font-\[Plus Jakarta Sans\]" src/pages/ src/components/  # Empty
   ```

2. **Semantic token usage confirmation**:
   ```bash
   # Should show only semantic font usage
   grep -rn "className=\"font-body\|className=\"font-display\|className=\"font-mono\"" src/ --include="*.tsx"  # Non-empty
   ```

3. **Type script compilation**:
   ```bash
   npx tsc --noEmit
   # Should show no type errors related to font classes
   ```

### Visual Consistency Check

- Ensure all headings (h1-h6, h3, h4) use `font-display`
- Ensure all body content uses `font-body`
- Ensure numeric displays use `font-mono` where appropriate
- Confirm consistent spacing and sizing with semantic tokens

## Timeline

**Phase 1: Core Pages** (Dashboard, Goals, Tasks, Analytics, Settings)
- **Estimated time**: 60-90 minutes
- **Focus**: High-impact pages with multiple occurrences

**Phase 2: Component Library**
- **Estimated time**: 30-45 minutes
- **Focus**: Reusable components that appear in multiple pages

**Phase 3: Verification and Cleanup**
- **Estimated time**: 15-20 minutes
- **Focus**: Final checks and consistency verification

**Total Estimated Time**: 105-155 minutes (under 3 hours)

## Dependencies

### Prerequisites
- Task 00 (Token Consolidation) **MUST** be completed
- Design system fonts defined in `globals.css`:
  - `--font-display: "Plus Jakarta Sans", sans-serif`
  - `--font-body: "Plus Jakarta Sans", sans-serif`
  - `--font-mono: "JetBrains Mono", monospace`

### Required Actions Before Task 16

1. Ensure globals.css has proper font definitions
2. Verify Task 00 completion (no legacy font tokens remain in globals.css)
3. Confirm existing components follow new font patterns

## Risk Mitigation

### High-Risk Files
1. **Dashboard.tsx** - Many font-family occurrences
   - Use systematic replacement strategy
   - Break down by semantic (heading, body, label)

2. **Goals.tsx/Tasks.tsx/Analytics.tsx** - Medium occurrence count
   - Apply similar systematic replacement

### Medium-Risk Files
3. **Other component library files**
   - Focus on reusable components
   - Ensure consistent patterns

### Low-Risk Files
4. **Utility components**
   - Straightforward replacements
   - Maintain existing styling patterns

## Deliverable

- **Modified source files** with replaced font-family declarations
- **Updated component library** with consistent font usage
- **Verification report** confirming no remaining hardcoded font families
- **Type script compilation** success

## Conclusion

After Task 16 execution:
1. **Zero** `font-[Plus Jakarta Sans]` hardcoded instances remaining
2. **Full** adherence to design.md font token system
3. **Consistent** typography across all components
4. **Verified** build and type safety

The codebase will then use a **single font family (Plus Jakarta Sans)** with **semantic font tokens** for improved maintainability and consistency.

---

**Next Steps**:
1. Execute batch replacement in core pages
2. Implement in component library
3. Run verification and finalize

This will complete the typography consolidation and establish a clean, maintainable font system across the entire project.