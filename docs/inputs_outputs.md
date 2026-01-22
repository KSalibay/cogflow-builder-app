# PsychJSON Builder - Inputs and Outputs

This document describes the *current* UI inputs and the JSON output produced by the builder (see [../src/JsonBuilder.js](../src/JsonBuilder.js)).

## Inputs

- Experiment type: `trial-based` or `continuous`
- Data collection toggles: `reaction-time`, `accuracy`, `correctness`, `eye-tracking`
- Default RDM parameters (display/aperture/dots/motion/timing)
- Default response settings (device + optional feedback)
- Timeline components (including Blocks) and their per-item overrides

## Output

### Top-level keys

- `experiment_type`: `trial-based` | `continuous`
- `task_type`: `rdm` | `sart` | `flanker` | `stroop` | `nback` | `simon` | `custom`
- `data_collection`: object of booleans
- `timeline`: array of components (serialized from the DOM)
- `display_parameters`, `aperture_parameters`, `dot_parameters`, `motion_parameters`, `timing_parameters`, `response_parameters`: experiment-wide defaults

Additional keys depending on experiment type:

- Trial-based: `num_trials`, `default_iti`, `randomize_order`
- Continuous: `frame_rate`, `duration`, `update_interval`, and optional `transition_settings`

### `data_collection`

The UI currently exports an object of booleans:

```json
{
  "reaction-time": true,
  "accuracy": true,
  "correctness": false,
  "eye-tracking": false
}
```

### `response_parameters`

Defaults export under `response_parameters`:

- `response_device`: `keyboard` | `mouse` | `touch` | `voice` | `custom`
- `require_response`: boolean
- Keyboard: `choices` and `key_mapping`
- Mouse: `mouse_response = { enabled, mode, segments, start_angle_deg, selection_mode }`
- Continuous-only: `end_condition_on_response`
- Optional feedback: `feedback = { enabled, type, duration_ms }` where `type` is one of `corner-text`, `arrow`, `custom`

### Timeline component shape

Components export as plain objects with `type` and their parameters. For RDM components, per-item overrides export as:

- `response_parameters_override`: response defaults merged with the override for that component/block

Common per-component flags:

- `detection_response_task_enabled`: boolean (default `false`) — enables a Detection Response Task (DRT) overlay for that component (handled by the interpreter app).

### Survey response (`survey-response`)

The builder supports inserting survey/questionnaire pages into the timeline. A survey exports as a single component object with a `questions` array:

```json
{
  "type": "survey-response",
  "detection_response_task_enabled": false,
  "title": "Survey",
  "instructions": "Please answer the following questions.",
  "submit_label": "Continue",
  "allow_empty_on_timeout": false,
  "timeout_ms": null,
  "questions": [
    {
      "id": "q1",
      "type": "likert",
      "prompt": "I found the task engaging.",
      "options": ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      "required": true
    },
    {
      "id": "q2",
      "type": "radio",
      "prompt": "Which condition did you prefer?",
      "options": ["A", "B"],
      "required": true
    },
    {
      "id": "q3",
      "type": "text",
      "prompt": "Any comments?",
      "multiline": true,
      "rows": 4,
      "placeholder": "",
      "required": false
    },
    {
      "id": "q4",
      "type": "slider",
      "prompt": "How confident are you?",
      "min": 0,
      "max": 100,
      "step": 1,
      "min_label": "0",
      "max_label": "100",
      "required": true
    },
    {
      "id": "q5",
      "type": "number",
      "prompt": "Age",
      "min": 18,
      "max": 99,
      "step": 1,
      "placeholder": "",
      "required": true
    }
  ]
}
```

The interpreter app should render this as a single HTML form and record responses keyed by `id`.

### Block shape

Blocks export compactly:

```json
{
  "type": "block",
  "component_type": "rdm-trial",
  "length": 100,
  "sampling_mode": "per-trial",
  "parameter_windows": {
    "coherence": { "min": 0.2, "max": 0.8 },
    "speed": { "min": 4, "max": 10 }
  },
  "parameter_values": {
    "direction": [0, 180]
  },
  "response_parameters_override": { "response_device": "mouse" }
}
```

### Dot groups (`rdm-dot-groups`)

The builder currently exports dot-groups in a flat shape (two groups):

```json
{
  "type": "rdm-dot-groups",
  "group_1_percentage": 50,
  "group_1_color": "#FF0066",
  "group_1_coherence": 0.2,
  "group_2_percentage": 50,
  "group_2_color": "#0066FF",
  "group_2_coherence": 0.8
}
```

The JSON preview panel always shows the exact object that will be exported.

Exported files are named `experiment_config_YYYY-MM-DD.json`.