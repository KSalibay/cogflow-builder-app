# RDM Component Validation Implementation

Note: this document describes the validation layer and (in places) older/aspirational schema shapes. For the *current exported JSON shape*, use the builder output reference in [docs/inputs_outputs.md](../inputs_outputs.md) and the implementation in [src/JsonBuilder.js](../../src/JsonBuilder.js).

## Overview
Added comprehensive validation support for all RDM (Random Dot Motion) component types in the JSON Builder App. The validation system now properly validates RDM-specific components and their parameters.

## Component Types Supported

### 1. rdm-trial
**Purpose**: Basic RDM trial component
**Required Parameters**:
- `coherence` (0-1): Motion coherence level
- `direction` (0-359): Motion direction in degrees  
- `speed` (>0): Dot movement speed
- `stimulus_duration` (>0): Trial duration in milliseconds

**Optional Parameters**:
- `total_dots` (10-1000): Number of dots (warning if outside range)
- `dot_size`: Size of individual dots
- `aperture_diameter`: Size of stimulus aperture

### 2. rdm-practice  
**Purpose**: Practice RDM trial with feedback
**Inherits**: All rdm-trial validation rules
**Additional Parameters**:
- `feedback` (accuracy|detailed|none): Type of feedback to show
- Higher coherence recommended (>0.3) for learning
- Longer stimulus duration recommended (>1000ms)

### 3. rdm-dot-groups
**Purpose**: RDM trial with multiple dot groups (different colors/coherences)
**Required Structure**:
- `groups.group_definitions`: Array of group definitions

**Group Definition Requirements**:
- `group_id`: Unique identifier
- `percentage`: Percentage of total dots (0-100)
- `color`: Hex color format (#RRGGBB)
- `motion_properties.coherence` (0-1)
- `motion_properties.direction` (0-359)

**Validation Rules**:
- Minimum 2 groups required
- Total percentages must equal 100%
- Unique group IDs
- Valid clustering parameters if using clustered distribution

### 4. rdm-adaptive
**Purpose**: Adaptive RDM trial with QUEST or staircase procedures
**Required Parameters**:
- `adaptive_algorithm` (quest|staircase|psi|custom)

**QUEST Algorithm Parameters**:
- `quest_parameters.target_performance` (0-1): Target accuracy
- `quest_parameters.threshold_estimate` (≥0): Initial threshold estimate  
- `quest_parameters.threshold_sd` (>0): Standard deviation

**Staircase Algorithm Parameters**:
- `staircase_parameters.rule`: Rule specification (e.g., "2-down-1-up")
- `staircase_parameters.step_size` (>0): Step size for adjustments
- `staircase_parameters.min_value` < `staircase_parameters.max_value`

**Stopping Criteria**:
- `stopping_criteria.max_trials` (>0): Maximum number of trials
- `stopping_criteria.min_trials` ≤ `stopping_criteria.max_trials`
- `stopping_criteria.convergence_threshold` (>0): Convergence criterion

## Implementation Details

### Files Modified

1. **RDMTaskSchema.js**
   - Added `validateComponent(component, componentType)` method
   - Added component-specific validation methods:
     - `validateRDMTrial(component)`
     - `validateRDMPractice(component)` 
     - `validateRDMDotGroups(component)`
     - `validateRDMAdaptive(component)`

2. **JSPsychSchemas.js**
   - Added RDM schema initialization in constructor
   - Modified `validateTimeline()` to handle RDM components
   - Added RDM experiment type to `experimentSchemas`
   - Added custom experiment type for mixed component timelines

3. **index.html**
   - Reordered script loading to ensure RDMTaskSchema loads before JSPsychSchemas

### Usage in JsonBuilder

The validation automatically occurs when:
1. User clicks "Validate JSON" button
2. RDM components are added to timeline with type starting with "rdm-"
3. Component parameters are validated against type-specific rules
4. Errors and warnings are displayed to user

### Error Types

**Errors** (prevent validation):
- Missing required parameters
- Invalid parameter ranges
- Malformed data structures
- Conflicting settings

**Warnings** (informational):
- Suboptimal parameter choices for experimental design
- Recommendations for practice trials
- Color format suggestions

## Testing

Created `tools/dev_test_pages/test_rdm_validation.html` for standalone testing of validation logic.

## Example Valid Components

```javascript
// Basic RDM Trial
{
  type: 'rdm-trial',
  coherence: 0.5,
  direction: 90,
  speed: 6,
  stimulus_duration: 1500
}

// Dot Groups Component  
{
  type: 'rdm-dot-groups',
  groups: {
    enabled: true,
    group_definitions: [
      {
        group_id: 'blue_high',
        percentage: 50,
        color: '#0066FF',
        motion_properties: {
          coherence: 0.8,
          direction: 0
        }
      },
      {
        group_id: 'red_low', 
        percentage: 50,
        color: '#FF0066',
        motion_properties: {
          coherence: 0.2,
          direction: 180
        }
      }
    ]
  }
}
```

## Future Enhancements

1. Add parameter dependency validation (e.g., QUEST parameters only when algorithm is 'quest')
2. Cross-component validation (e.g., consistent stimulus dimensions across trial types)
3. Real-time parameter validation in component editor modals
4. Advanced clustering validation for spatial dot group distributions
