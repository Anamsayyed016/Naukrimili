# 🛡️ TDZ (Temporal Dead Zone) Prevention Guide

## 📋 What is TDZ?

**Temporal Dead Zone (TDZ)** is a JavaScript error that occurs when you try to access a variable before it's initialized. In Next.js, this commonly happens during module bundling when:

1. **Module-level imports** pull in dependencies eagerly
2. **Circular dependencies** create initialization loops
3. **Synchronous JSON imports** trigger eager evaluation
4. **Export const** declarations that depend on other modules

## ✅ TDZ Prevention Strategies Applied

### 1. **Dynamic Imports in useEffect** ✅
**Problem:** Module-level imports cause eager evaluation
```typescript
// ❌ BAD - Causes TDZ
import LivePreview from './LivePreview';
import ColorPicker from './ColorPicker';

// ✅ GOOD - Dynamic import in useEffect
useEffect(() => {
  async function loadComponents() {
    const [LivePreviewModule, ColorPickerModule] = await Promise.all([
      import('./LivePreview'),
      import('./ColorPicker'),
    ]);
    setLivePreviewComponent(() => LivePreviewModule.default);
    setColorPickerComponent(() => ColorPickerModule.default);
  }
  loadComponents();
}, []);
```

### 2. **Lazy JSON Loading** ✅
**Problem:** Synchronous JSON imports trigger eager evaluation
```typescript
// ❌ BAD - Eager evaluation
import templatesData from './templates.json';

// ✅ GOOD - Dynamic import
useEffect(() => {
  import('./templates.json').then((module) => {
    setTemplates(module.default.templates);
  });
}, []);
```

### 3. **Function Declarations Over Const** ✅
**Problem:** `export const` arrow functions can cause TDZ
```typescript
// ❌ BAD - Can cause TDZ
export const getEducationLevels = () => { ... };

// ✅ GOOD - Function declaration (hoisted)
export function getEducationLevels() { ... }
```

### 4. **Lazy Cache Initialization** ✅
**Problem:** Module-level cache initialization
```typescript
// ❌ BAD - Module-level cache
let cache = expensiveOperation();

// ✅ GOOD - Lazy initialization
let cache: any = null;
export function getData() {
  if (!cache) {
    cache = expensiveOperation();
  }
  return cache;
}
```

### 5. **Type-Only Imports** ✅
**Problem:** Regular imports can trigger module execution
```typescript
// ❌ BAD - May trigger execution
import { Template } from './template-loader';

// ✅ GOOD - Type-only import
import type { Template } from './types';
```

### 6. **Separate Type Definitions** ✅
**Problem:** Types in same file as implementation
```typescript
// ✅ GOOD - Separate types file
// types.ts - Only type definitions
export interface Template { ... }

// template-loader.ts - Implementation only
export type { Template } from './types';
```

## 🔍 Files Fixed for TDZ Prevention

### ✅ **Editor Page** (`app/resume-builder/editor/page.tsx`)
- All 6 step components loaded dynamically
- EditorStepper, LivePreview, ColorPicker, ChangeTemplateModal - all dynamic
- No module-level component imports

### ✅ **ChangeTemplateModal** (`components/resume-builder/ChangeTemplateModal.tsx`)
- `LivePreview` and `ColorPicker` loaded dynamically when modal opens
- Only loads when `open === true` to avoid unnecessary loading

### ✅ **LivePreview** (`components/resume-builder/LivePreview.tsx`)
- `template-loader` functions imported dynamically inside useEffect
- Multiple dynamic imports for `loadTemplate`, `applyColorVariant`, `injectResumeData`

### ✅ **Template Loader** (`lib/resume-builder/template-loader.ts`)
- `templates.json` loaded lazily via `getTemplatesData()` function
- Types re-exported from separate `types.ts` file

### ✅ **Education Data** (`lib/resume-builder/education-data.ts`)
- All data arrays use lazy cache initialization
- Functions use `export function` instead of `export const`
- No `as const` assertions that can cause bundler issues

### ✅ **Education Step** (`components/resume-builder/steps/EducationStep.tsx`)
- `education-data` imported dynamically in useEffect
- No module-level imports

### ✅ **Experience Step** (`components/resume-builder/steps/ExperienceStep.tsx`)
- `field-types.json` imported dynamically in useEffect

### ✅ **Institution Input** (`components/resume-builder/form-inputs/InstitutionInput.tsx`)
- `education-data` imported dynamically in useEffect

## 🎯 Best Practices Summary

1. **Never use module-level imports for heavy components**
   - Always use dynamic imports in `useEffect` or event handlers

2. **Always use dynamic imports for JSON files**
   - `import('./data.json').then(...)` instead of `import data from './data.json'`

3. **Use `export function` instead of `export const` for functions**
   - Functions are hoisted, avoiding TDZ issues

4. **Separate types from implementation**
   - Create `types.ts` files for type-only exports
   - Use `import type` for type imports

5. **Lazy initialize caches**
   - Use `let cache = null` and initialize in getter function

6. **Load components only when needed**
   - Use conditional loading (e.g., only when modal is open)

7. **Avoid React.lazy() at module level**
   - Use dynamic imports inside components instead

## 🚫 What to Avoid

- ❌ Module-level `React.lazy()` calls
- ❌ Synchronous JSON imports
- ❌ `export const` arrow functions that depend on other modules
- ❌ Circular dependencies between modules
- ❌ Module-level cache initialization
- ❌ Regular imports for type-only usage

## ✅ Current Status

All resume builder components now use dynamic imports and lazy loading patterns. TDZ errors should be completely eliminated.

