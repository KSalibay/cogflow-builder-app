# Test Verification - CogFlow Builder

## What to verify (current)

### ✅ Layout

**Test**: Open [index.html](../../index.html) - the three panels should display side-by-side on desktop screens.

---

### ✅ RDM dot-groups

**Test**: Add an `rdm-dot-groups` component, open its editor, save, and ensure JSON updates without console errors.

---

### ✅ Component library

**Test**: Open the component library and confirm each component type appears only once.

---

### ✅ Experiment type switching

**Test**: Switch between Trial-based and Continuous and confirm:

- The parameter forms change accordingly
- Continuous-only fields are disabled/hidden appropriately in trial-based UIs

---

### ✅ Response defaults and overrides

**Test**:

- Set default response device (keyboard/mouse) and confirm `response_parameters` updates.
- Set a per-component override and confirm `response_parameters_override` appears on that component (or block).

### ✅ Blocks

**Test**:

- Add a `block`, configure parameter windows, and confirm export uses `parameter_windows` / `parameter_values`.
- Preview a block and confirm the UI remains clickable after closing the preview.

## Expected results

- No console errors during normal add/edit/preview workflows
- JSON preview updates immediately when settings change
- Validation runs and reports issues without crashing

## Console Errors to Watch For

- ❌ Schema validation errors when adding RDM components
- ❌ CSS layout errors or Bootstrap conflicts  
- ❌ JavaScript errors in component generation
- ❌ Parameter form generation failures

## Files Modified Summary

1. **css/style.css** - Enhanced responsive layout with forced horizontal panels
2. **index.html** - Updated Bootstrap column classes and added layout class
3. **src/JsonBuilder.js** - Fixed RDM component parameters and removed duplicates
4. **src/schemas/JSPsychSchemas.js** - Added RDM schema support for parameter forms
5. **src/modules/TimelineBuilder.js** - Added SELECT parameter type support

The webapp should now provide a fully functional RDM experiment builder with proper layout, working components, and comprehensive parameter control interfaces.
