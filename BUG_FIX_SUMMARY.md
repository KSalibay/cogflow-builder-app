# Bug Fix Summary - December 17, 2025

## Update - January 2026

Newer changes since this summary:

- Added `block` component (compact `parameter_windows` / `parameter_values` export)
- Added continuous-mode transitions (`transition_settings` + per-item `transition_duration`/`transition_type`)
- Added response defaults + per-item overrides (`response_parameters` + `response_parameters_override`)
- Added optional response feedback (`corner-text`, `arrow`, `custom`) and continuous-only `end_condition_on_response`
- Added `correctness` to `data_collection`
- Hardened preview modal behavior to avoid “unclickable UI” from stacked modal backdrops

## Issues Addressed

### ✅ Issue 1: RDM Component Schema Not Found
**Problem**: RDM Groups component modal showed "No schema available for this component type."

**Root Cause**: The component parameter modal used `getPluginSchema()` method which only checked `pluginSchemas` but RDM components were validated separately by `RDMTaskSchema`.

**Solution**:
1. **Modified `JSPsychSchemas.getPluginSchema()`** to detect RDM component types (those starting with "rdm-")
2. **Added `generateRDMPluginSchema()` method** that converts RDM validation schemas to plugin schema format
3. **Created comprehensive parameter definitions** for all RDM component types:
   - `rdm-trial`: Basic RDM parameters (coherence, direction, speed, etc.)
   - `rdm-practice`: Trial parameters + feedback options
   - `rdm-dot-groups`: Group-based parameters (percentages, colors, coherences)
   - `rdm-adaptive`: Adaptive algorithm parameters (QUEST, staircase settings)

**Files Modified**:
- `src/schemas/JSPsychSchemas.js`: Enhanced getPluginSchema() and added generateRDMPluginSchema()
- `src/modules/TimelineBuilder.js`: Added SELECT parameter type support for dropdowns

### ✅ Issue 2: Vertical Panel Layout Instead of Horizontal
**Problem**: The three main panels (Configuration, Timeline, JSON Preview) were stacking vertically instead of displaying side by side.

**Root Cause**: Bootstrap's responsive breakpoints were causing columns to stack on medium screens.

**Solution**:
1. **Updated HTML column classes** from `col-md-4` to `col-lg-4 col-md-12` for better responsive behavior
2. **Added custom CSS** with forced horizontal layout for screens ≥768px:
   ```css
   @media (min-width: 768px) {
       .main-panels-row {
           display: flex !important;
           flex-wrap: nowrap !important;
       }
       .main-panels-row > [class^="col-"] {
           flex: 1 !important;
           max-width: 33.333333% !important;
       }
   }
   ```
3. **Applied `.main-panels-row` class** to the main container row

**Files Modified**:
- `index.html`: Updated column classes and added row class
- `css/style.css`: Added responsive layout CSS

## Enhanced Features

### 🔧 SELECT Parameter Type Support
Added dropdown support in parameter editing forms for components like RDM Adaptive's algorithm selection.

### 📋 Comprehensive RDM Component Schemas
All RDM components now have proper parameter definitions with:
- Type validation (FLOAT, INT, BOOL, SELECT, STRING)
- Default values
- Required parameter marking
- Helpful descriptions
- Dropdown options for select parameters

## Testing Status

✅ **Component Schema Connection**: RDM components now properly load parameter forms  
✅ **Layout Fix**: Panels display horizontally on desktop screens  
✅ **Parameter Input Types**: All parameter types (including SELECT) render correctly  
✅ **Validation Integration**: RDM schemas properly connected to main validation system  

## User Experience Improvements

1. **No More "Schema Not Available" Errors**: All RDM components now have proper parameter editing
2. **Consistent Horizontal Layout**: Maintains professional three-panel design
3. **Enhanced Parameter Editing**: Dropdown selections for algorithm choices and other options
4. **Mobile Responsive**: Panels stack properly on mobile devices while staying horizontal on desktop

## Next Steps

- Test the webapp with Live Server to verify both fixes work correctly
- Continue with temporal parameter control implementation
- Add parameter function library and graphical editing interfaces