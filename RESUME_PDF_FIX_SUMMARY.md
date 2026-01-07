# Resume PDF Export Fix - Action Plan

## Problem
- Live Preview looks perfect (natural sizing, no compression)
- PDF export uses aggressive compression CSS → causing 2-page overflow
- "View Full Resume" modal also uses aggressive compression

## Solution
Replace PDF export CSS with EXACT same CSS from LivePreview.tsx

## Key Differences:

### LivePreview.tsx (WORKING ✅)
```css
.resume-container {
  width: 794px !important;
  height: auto !important;
  min-height: auto !important;
  /* NO aggressive compression */
  /* Natural spacing preserved */
}
```

### Current PDF Export (BROKEN ❌)
```css
/* ULTRA aggressive compression */
padding: 12-16px (was 30-40px)
gap: 8-10px (was 25-30px)
font-size: 10-12px (was 13-16px)
```

## Action Required
Copy the `getUniversalCSS()` function from LivePreview.tsx to resume-export.ts
Remove all aggressive compression rules
Let templates use their natural spacing

## Files to Modify
1. lib/resume-builder/resume-export.ts - Replace CSS with LivePreview CSS
2. components/resume-builder/ResumePreviewWrapper.tsx - Remove View Full Resume (optional cleanup)

