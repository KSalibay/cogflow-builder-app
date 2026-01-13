# PsychJSON Builder

Static (non-bundled) web app for building JSON configurations for experimental psychology tasks. The current focus is Random Dot Motion (RDM) experiments, including compact “Block” representations for large trial counts.

This app is plain HTML/CSS/JS loaded via classic `<script>` tags (globals; no `import`/`export`).

## Run locally

- Use VS Code Live Server on [index.html](index.html)
- If you hit caching issues, bump the `?v=...` cache-buster querystring on local `<script>` tags in [index.html](index.html)

## What the builder outputs

The JSON produced by the builder is intentionally lightweight and matches what [src/JsonBuilder.js](src/JsonBuilder.js) generates.

Core shape (abridged):

```json
{
  "experiment_type": "trial-based",
  "data_collection": {
    "reaction-time": true,
    "accuracy": true,
    "correctness": false,
    "eye-tracking": false
  },
  "timeline": [ /* components and blocks */ ],

  "display_parameters": { /* RDM defaults */ },
  "aperture_parameters": { /* RDM defaults */ },
  "dot_parameters": { /* RDM defaults */ },
  "motion_parameters": { /* RDM defaults */ },
  "timing_parameters": { /* RDM defaults */ },
  "response_parameters": { /* RDM defaults */ }
}
```

Notes:

- **Data collection** currently includes `reaction-time`, `accuracy`, `correctness` (online correctness computation toggle), and `eye-tracking`.
- **Response modalities** (keyboard/mouse/touch/voice) are configured via the Default Response UI and exported under `response_parameters`.

See [docs/inputs_outputs.md](docs/inputs_outputs.md) for a more detailed (but still current) reference.

## Timeline components

The timeline is authored in the UI and serialized from DOM `dataset.componentData`. Supported component types include:

- `html-keyboard-response` (used for Instructions)
- `rdm-trial`
- `rdm-practice`
- `rdm-adaptive`
- `rdm-dot-groups`
- `block` (compact representation for large numbers of trials)

### Blocks (compact representation)

Blocks let you represent many trials without expanding them into a long explicit list. A block exports like:

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
    "direction": [0, 180],
    "dot_color": "#FFFFFF"
  }
}
```

In Preview, blocks are shown by sampling a representative trial from their parameter windows.

## Response defaults and per-component overrides

- Experiment-wide defaults export as `response_parameters`.
- Per-component or per-block deltas export as `response_parameters_override`.
- For continuous mode, `end_condition_on_response` is included in defaults/overrides (it is not exported in trial-based mode).
- Optional feedback exports as `response_parameters.feedback = { enabled, type, duration_ms }` and can be overridden per component/block.

## Continuous-mode transitions

When `experiment_type` is `continuous`:

- Experiment-wide defaults export as `transition_settings = { duration_ms, type }`.
- Individual components and blocks can export `transition_duration` / `transition_type` (or block-level equivalents).

## Validation and schemas

- Plugin parameter schemas live in [src/schemas/JSPsychSchemas.js](src/schemas/JSPsychSchemas.js).
- RDM-specific validation helpers live in [src/schemas/RDMTaskSchema.js](src/schemas/RDMTaskSchema.js) (some portions are legacy/aspirational; the builder output shape is the authoritative reference).

## Useful local test pages

- [test_rdm_validation.html](test_rdm_validation.html)
- [test_parameter_propagation.html](test_parameter_propagation.html)

## File structure

```
Json_Builder_App_Experimental_Psychology/
├── index.html                 # Main application interface
├── css/
│   └── style.css             # Application styling
├── src/
│   ├── JsonBuilder.js        # Main application class
│   ├── modules/
│   │   ├── DataCollectionModules.js  # Data collection systems
│   │   ├── TrialManager.js          # Trial generation and management
│   │   └── TimelineBuilder.js       # Drag-and-drop timeline interface
│   ├── schemas/
│   │   └── JSPsychSchemas.js        # Validation schemas
│   │   └── RDMTaskSchema.js         # RDM-specific validation helpers
│   └── templates/
│       └── ExperimentTemplates.js   # Pre-built experiment templates
└── examples/
    ├── simple_rt_example.json       # Example configurations
    ├── stroop_task_example.json
    └── continuous_rdk_example.json
```

## Support

For jsPsych integration, consult https://www.jspsych.org/.
For JATOS deployment help, see https://www.jatos.org/Docs.html.

## Extending

- Add new data collection modules: [src/modules/DataCollectionModules.js](src/modules/DataCollectionModules.js)
- Update component definitions and export behavior: [src/JsonBuilder.js](src/JsonBuilder.js)
- Update modal editing/validation schemas: [src/schemas/JSPsychSchemas.js](src/schemas/JSPsychSchemas.js)