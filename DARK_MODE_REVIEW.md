# Dark Mode Implementation Review

**Date:** April 1, 2026  
**Browser:** Chrome (dark mode emulation enabled)  
**Status:** ⚠️ **PARTIALLY WORKING** - Design system colors need review

---

## Summary

Dark mode is **functionally implemented** but there's a **CSS variable cascade issue** preventing the design system color tokens from being applied in dark mode. The app correctly detects system dark mode preference and applies the `.dark` class, but the color overrides are not rendering.

---

## What's Working ✅

### 1. **Theme Service Detection & Application**
- ✅ Correctly reads system preference (`prefers-color-scheme: dark`)
- ✅ Applies `.dark` class to body when dark mode is active
- ✅ Persists preference to localStorage
- ✅ Supports theme toggle (`setScheme()` and `toggleScheme()` methods)
- ✅ Listens for system theme changes via MediaQueryList

### 2. **Base Dark Mode Styles**
- ✅ Background color changes to dark (#121212 / rgb(18,18,18))
- ✅ Body text color changes to light (rgb(224, 224, 224))
- ✅ Ionic components receive updated background

### 3. **Design System Structure**
- ✅ Dark mode color palette fully defined in `variables.scss`
- ✅ Comprehensive dark-mode mixin covers:
  - Primary colors (light green tones)
  - Secondary colors (light gray tones)
  - Surface hierarchy (dark backgrounds)
  - Error states (bright red)
  - Shadow tokens (stronger shadows)
  - Glassmorphism effects

---

## What's Not Working ❌

### **CSS Variable Cascade Issue**
The design system color variables are NOT being overridden in dark mode:

**Expected (Dark Mode):**
```
--color-surface: #121212
--color-on-surface: #e0e0e0
--color-primary: #accfb8
--color-error: #ff8a80
```

**Actual (Still Light Mode):**
```
--color-surface: #faf9f5    ❌ Should be #121212
--color-on-surface: #1b1c1a ❌ Should be #e0e0e0
--color-primary: #163526    ❌ Should be #accfb8
--color-error: #ba1a1a      ❌ Should be #ff8a80
```

**Root Cause:**
The SCSS mixin is defined but NOT being compiled into the final CSS with the proper selector specificity. Possible reasons:
1. The `:root` selector for light mode has higher specificity
2. The `@mixin dark-mode` is not being properly scoped to `body.dark`
3. CSS variable scoping issue in the compiled output

---

## Dark Mode Detection - Working ✓

```typescript
// CORRECT FLOW:
System Preference: prefers-color-scheme: dark
  ↓
ThemeService.readScheme() → 'system' (default)
  ↓
applyScheme('system') checks MediaQueryList
  ↓
body.classList.add('dark')
  ↓
Result: <body class="dark"> ✓
```

---

## Detailed Test Results

| Aspect | Expected | Actual | Status |
|--------|----------|--------|--------|
| System detection | `prefers-color-scheme: dark` matches | ✓ True | ✅ |
| Body class | `.dark` applied | ✓ Applied | ✅ |
| Background color | #121212 (dark) | ✓ rgb(18,18,18) | ✅ |
| Text color | #e0e0e0 (light) | ✓ rgb(224, 224, 224) | ✅ |
| --color-surface | #121212 | ✗ #faf9f5 (light) | ❌ |
| --color-on-surface | #e0e0e0 | ✗ #1b1c1a (light) | ❌ |
| --color-primary | #accfb8 (light green) | ✗ #163526 (dark green) | ❌ |
| --color-error | #ff8a80 (light red) | ✗ #ba1a1a (dark red) | ❌ |
| Components readability | Light text on dark | ✓ OK | ✅ |

---

## Impact Analysis

### ✅ **What Still Works in Dark Mode:**
- Background and text colors (inherited from body/html)
- Ionic default components (they have their own dark mode)
- Overall contrast is acceptable
- No broken layouts

### ⚠️ **What's Broken:**
- Custom component colors (crop slots, cards, buttons)
- Design system token colors not being honored
- Semantic color meanings (error red, success green) not applied
- Inconsistent styling between Ionic components and custom components

### 🚨 **User Experience Impact:**
- **Medium Severity:** Custom UI elements won't have proper dark mode styling
- Users will see light green primary buttons on dark backgrounds (poor contrast)
- Form inputs and cards might be hard to distinguish

---

## Lighthouse Dark Mode Check

Using Chrome DevTools Lighthouse, the following need verification in dark mode:

### Contrast Issues Likely:
- Primary color (#163526) on dark surface - may fail 4.5:1 AA standard
- Error color (#ba1a1a) - already red, needs WCAG check
- Text colors on secondary-container need verification

### Actual CSS Variable Usage:
The problem is that the CSS variables are NOT being updated, so all components using:
```css
color: var(--color-primary);
background: var(--color-surface-container);
```

...will render with light mode colors even in dark mode.

---

## Root Cause & Fix

### **Problem:**
The `body.dark { @include dark-mode; }` rule is either:
1. Not being compiled into the final CSS, OR
2. Has lower specificity than `:root` (which defines the light mode variables)

### **Solution:**
The CSS needs to ensure that dark mode variables override light mode. Options:

**Option 1: Use :root[dark] (Recommended)**
```scss
:root {
  // Light mode variables (default)
  --color-primary: #163526;
}

:root.dark, body.dark {
  // Dark mode variables override
  --color-primary: #accfb8;
}
```

**Option 2: Use more specific selector**
```scss
body.dark {
  @include dark-mode;
}
```
(And ensure this comes AFTER :root in the compiled CSS)

**Option 3: Use CSS custom property inheritance**
```scss
html.dark {
  @include dark-mode;
}
```

---

## Recommended Fixes (In Order of Priority)

### 1. **CRITICAL - Fix CSS Variable Cascade** 🔴
**File:** `frontend/src/theme/variables.scss`

Check that the compiled CSS has:
```css
body.dark {
  --color-surface: #121212;
  --color-on-surface: #e0e0e0;
  --color-primary: #accfb8;
  /* ... all dark mode variables ... */
}
```

If not, restructure to:
```scss
:root {
  /* Light mode defaults */
}

body.dark,
:root:has(body.dark) {
  @include dark-mode;
}
```

### 2. **MEDIUM - Test Contrast Ratios** 🟡
Once variables are fixed, verify these meet 4.5:1 AA standard in dark mode:
- Primary text (#e0e0e0) on surface (#121212) - **MUST BE ≥4.5:1**
- Error color (#ff8a80) on error-container (#93000a) - **MUST BE ≥4.5:1**
- Secondary text (#b0b0b0) on surface (#121212) - **MUST BE ≥3:1**

Use: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 3. **LOW - Improve Glassmorphism** 🟢
The glassmorphism effect uses incorrect colors in dark mode:
```scss
// Currently:
--glassmorphism-bg: rgba(18, 18, 18, 0.85);

// But should update opacity/color for visibility
```

---

## Testing Checklist

**Before release, verify dark mode:**

- [ ] Delete localStorage `app-scheme` to test system preference
- [ ] Enable dark mode in OS/browser settings
- [ ] Verify body has `dark` class
- [ ] Check computed --color-* variables show dark values
- [ ] Test crop slot component with crop image - colors correct?
- [ ] Test error button - is it bright red (#ff8a80)?
- [ ] Test primary button - is it light green (#accfb8)?
- [ ] Check text contrast ratio ≥4.5:1 on all text
- [ ] Verify shadows are visible and appropriate
- [ ] Test form inputs are distinguishable
- [ ] Test across light + dark modes (toggle in settings)

---

## File Structure

**Theme Files:**
- `frontend/src/theme/variables.scss` - Contains color tokens and dark-mode mixin
- `frontend/src/app/core/theme/theme.service.ts` - Handles theme switching logic
- `frontend/src/styles.scss` - Global styles (verify dark-mode is imported)

---

## Long-term Recommendations

1. **Extract theme into separate files:**
   - `frontend/src/theme/light.scss`
   - `frontend/src/theme/dark.scss`
   - `frontend/src/theme/index.scss` (imports both)

2. **Use CSS-in-JS for dynamic theming** (if needed in future)

3. **Document dark mode in design system guide**

4. **Add settings UI toggle** for explicit theme control

5. **Test with different contrast preferences:**
   - `prefers-contrast: more`
   - `prefers-contrast: less`

---

## References

- Material Design Dark Theme: [Color System](https://m3.material.io/styles/color/the-color-system/color-roles)
- WCAG 2.1 Contrast Requirements: [1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- CSS Custom Properties: [MDN Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- Ionic Dark Mode: [Official Docs](https://ionicframework.com/docs/theming/dark-mode)

---

## Summary Table

| Component | Light Mode | Dark Mode | Status |
|-----------|-----------|----------|--------|
| Body background | #faf9f5 | #121212 | ✅ Works |
| Text color | #1b1c1a | #e0e0e0 | ✅ Works |
| Primary color | #163526 | #accfb8 | ❌ Not applied |
| Error color | #ba1a1a | #ff8a80 | ❌ Not applied |
| Surfaces | Light gray | Dark gray | ❌ Not applied |
| Shadows | Light | Dark/Strong | ❌ Not applied |
| **Overall** | **LIGHT MODE ONLY** | **BROKEN** | **🔴 CRITICAL** |
