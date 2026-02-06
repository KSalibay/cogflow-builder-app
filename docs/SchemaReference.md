
# Schema Reference

This document outlines the schema/validation entry points used by the PsychJSON Builder.

Note: some older sections in this file may reference legacy/aspirational schema names. The authoritative references for current behavior are:

- [../src/JsonBuilder.js](../src/JsonBuilder.js) (actual export shape)
- [../src/schemas/JSPsychSchemas.js](../src/schemas/JSPsychSchemas.js) (modal editing + plugin schemas)

## Schemas and validators

### `JSPsychSchemas`

- Purpose: plugin-level parameter schemas used to render modal editors and validate component configs
- File: [../src/schemas/JSPsychSchemas.js](../src/schemas/JSPsychSchemas.js)
- Notable supported types:
  - `block`
  - `rdm-trial`, `rdm-practice`, `rdm-adaptive`, `rdm-dot-groups`
  - `html-keyboard-response` (used for Instructions)

### `RDMTaskSchema`

- Purpose: additional RDM-specific validation helpers
- File: [../src/schemas/RDMTaskSchema.js](../src/schemas/RDMTaskSchema.js)

Note: the builder output shape in [../src/JsonBuilder.js](../src/JsonBuilder.js) is the authoritative reference for what is exported today.

Additional note: aperture outline (border) fields are exported under `aperture_parameters`:
- `show_aperture_outline`
- `aperture_outline_width`
- `aperture_outline_color`

---

## Component mapping (high level)

| Component type | Where the schema lives |
|---|---|
| `block` | `JSPsychSchemas.pluginSchemas.block` |
| `rdm-*` plugins | `JSPsychSchemas.generateRDMPluginSchema()` and `pluginSchemas` |
| `html-keyboard-response` | `JSPsychSchemas.pluginSchemas['html-keyboard-response']` |

---

## Validation Rules

### `UnifiedSchema`
- **`rdm-dot-groups`**:
  - Parameters:
    - `group_1_percentage`: Percentage of dots in group 1 (0-100).
    - `group_1_color`: Color for group 1 dots (hex format).
    - `group_1_coherence`: Motion coherence for group 1 (0-1).
    - `group_2_percentage`: Percentage of dots in group 2 (0-100).
    - `group_2_color`: Color for group 2 dots (hex format).
    - `group_2_coherence`: Motion coherence for group 2 (0-1).
    - `total_dots`: Total number of dots.
    - `aperture_diameter`: Aperture diameter in pixels.
    - `stimulus_duration`: Stimulus duration in milliseconds.

- **`rdm-trial`**:
  - Parameters:
    - `coherence`: Motion coherence (0-1).
    - `direction`: Motion direction (0-359).
    - `speed`: Dot movement speed.
    - `total_dots`: Total number of dots.
    - `dot_size`: Size of dots in pixels.
    - `aperture_diameter`: Aperture diameter in pixels.
    - `stimulus_duration`: Stimulus duration in milliseconds.

- **`instructions`**:
  - Parameters:
    - `stimulus`: Instruction text to display.

- **`html-keyboard-response`**:
  - Parameters:
    - `stimulus`: HTML content to display.
    - `choices`: Keys accepted as responses.
    - `stimulus_duration`: How long to show the stimulus (ms).

---

## Notes
- The `UnifiedSchema` consolidates parameters for all components, simplifying schema management.
- The `TimelineBuilder` module interacts with `UnifiedSchema` to validate and render components.
- The `JsonBuilder` class initializes `UnifiedSchema` and uses it to generate the final JSON configuration.
