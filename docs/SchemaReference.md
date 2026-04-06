
# Schema Reference

This document outlines the schema/validation entry points used by the CogFlow Builder.

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

Block schema note (continuous-mode sizing):

- `block_sizing_mode`: `by_frames | by_duration`
- `block_duration_seconds`: positive float used when `block_sizing_mode = by_duration`
- `block_length`: frame count (legacy/default sizing path; still exported and used by runtime expansion)

When a continuous block is authored with `by_duration`, Builder derives `block_length` from `block_duration_seconds * frame_rate` and validates/clamps against experiment-wide duration limits.

Block list shorthand note (numeric CSV-style list fields):

- Builder accepts integer range shorthand such as `1-4`, `4-1`, and `-3--1` in relevant Block list fields.
- Builder expands these to explicit comma-separated values before export.
- Interpreter includes a runtime fallback that can also interpret numeric range shorthand if present in incoming config strings.

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
| `mot-trial` | `JSPsychSchemas.pluginSchemas['mot-trial']` |
| `flanker-trial` | `JSPsychSchemas.pluginSchemas['flanker-trial']` |
| `sart-trial` | `JSPsychSchemas.pluginSchemas['sart-trial']` |
| `pvt-trial` | `JSPsychSchemas.pluginSchemas['pvt-trial']` |
| `nback-block` / `nback-trial-sequence` | `JSPsychSchemas.pluginSchemas['nback-block']` |
| `gabor-trial` | `JSPsychSchemas.pluginSchemas['gabor-trial']` |
| `stroop-trial` / `emotional-stroop-trial` | `JSPsychSchemas.pluginSchemas['stroop-trial']` |
| `simon-trial` | `JSPsychSchemas.pluginSchemas['simon-trial']` |
| `task-switching-trial` | `JSPsychSchemas.pluginSchemas['task-switching-trial']` |

### MOT task (`mot-trial`)

The MOT component schema (`mot-trial`) defines the following block-level parameters (sourced from `motOnlyParams` in `JsonBuilder.js`):

| Parameter | Type | Description |
|---|---|---|
| `mot_num_objects_options` | options list | Candidate values for total object count |
| `mot_num_targets_options` | options list | Candidate values for number of targets to track |
| `mot_motion_type` | select | `linear` or `curved` |
| `mot_probe_mode` | select | `click`, `number_entry`, or `yes_no_recognition` |
| `mot_yes_key` / `mot_no_key` | string | Recognition-mode keyboard mappings |
| `mot_recognition_probe_count` | int | Number of yes/no probes asked per trial before advancing |
| `mot_show_feedback` | boolean | Whether to show post-probe feedback rings |
| `mot_speed_px_per_s_min` / `_max` | range | Speed window in pixels/second |
| `mot_tracking_duration_ms_min` / `_max` | range | Tracking phase duration window |
| `mot_cue_duration_ms_min` / `_max` | range | Cue phase duration window |
| `mot_iti_ms_min` / `_max` | range | ITI window |

Global defaults export: `config.mot_settings` (merged into each `mot-trial` at runtime by the Interpreter).

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

- **`survey-response` / `mw-probe` questions**:
  - Optional conditional visibility per question:
    - `visible_if.question_id`: id of a prior question
    - `visible_if.equals`: value that must match for the question to be shown
  - Runtime fallback also accepts legacy conditional keys:
    - `show_if_question_id`
    - `show_if_value`

- **`soc-subtask-sart-like`**:
  - `go_condition` values are `block` / `allow`.
  - Runtime keeps backward compatibility for legacy `target` / `distractor` values.

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
