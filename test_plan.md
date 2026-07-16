# Typography Consolidation Task Plan

## Summary
This plan outlines the comprehensive typography consolidation task to replace custom font family declarations with standardized design tokens.

## Current State
- Found 51 instances of `font-[Plus Jakarta Sans]` patterns in client/src/**/*.tsx
- Need to review design.md font specifications (lines 12-14)
- Need to check for existing globals.css with font-face definitions
- Need to identify all hardcoded font family declarations

## Task Breakdown

### 1. Replace font-[Plus Jakarta Sans] patterns
- Replace all instances with `font-body` token
- Files: client/src/pages/Dashboard.tsx primarily
- Line count: ~51 instances total

### 2. Replace legacy Material Design font tokens
- `font-headline-*` → design tokens
- `font-title-*` → design tokens
- `font-label-*` → design tokens
- `font-stat` → design tokens

### 3. Review and validate design.md
- Check font specifications at lines 12-14
- Ensure no hardcoded values exist

### 4. Check globals.css
- Review existing font-face definitions
- Confirm standard CSS custom properties

### 5. Create comprehensive summary
- Document all changes with line numbers
- Describe what was replaced and with what

## Files to Modify
1. client/src/pages/Dashboard.tsx (primary target)
2. Other .tsx files in client/src/ (if any found)
3. client/src/styles/globals.css (if exists)
4. design.md (specification review)

## Verification Commands
- grep -rn "font-\[Plus Jakarta Sans\]|font-headline\.|font-title\.|font-label\.|font-stat" client/src client/src/*.md
- grep -rn "font-mono" client/src --include="*.tsx" (should only return timer/use cases)

## Priority
This is a high-priority consolidation task to standardize font usage across the application.