# PsychJSON Builder

Static (non-bundled) web app for building JSON configurations for experimental psychology tasks. The current focus is Random Dot Motion (RDM) experiments, including compact “Block” representations for large trial counts.

This app is plain HTML/CSS/JS loaded via classic `<script>` tags (globals; no `import`/`export`).

## Run locally

- Use VS Code Live Server on [index.html](index.html)
- If you hit caching issues, bump the `?v=...` cache-buster querystring on local `<script>` tags in [index.html](index.html)

## Export to SharePoint via Microsoft Graph

The **Export to SharePoint** button can upload the generated JSON directly into your OneDrive for Business / SharePoint “My Site” folder using Microsoft Graph.

Important constraints:

- This is a static browser app (no backend), so it uses **delegated auth** (you sign in) via **MSAL**.
- Do **not** add a client secret.
- This requires running via `http(s)` (e.g. Live Server). MSAL does not work on `file://`.

### 1) Create an Entra ID (Azure AD) App Registration

In Entra admin center → App registrations:

- Create a new app registration.
- Platform: **Single-page application (SPA)**
- Add Redirect URI(s) matching where you run the builder, e.g.:
  - `http://127.0.0.1:5500/index.html`
  - `http://localhost:5500/index.html`

### 2) Add Microsoft Graph API permissions (Delegated)

At minimum (for uploading into your own OneDrive for Business):

- `User.Read`
- `Files.ReadWrite`

If you later target a Team site / shared document library, you may need broader scopes like `Sites.ReadWrite.All`.

### 3) Configure the builder

Edit [src/graphConfig.js](src/graphConfig.js):

- Set `clientId` to your App Registration’s **Application (client) ID**.
- Optionally set `tenantId` to your tenant GUID.
- Confirm `defaultUploadFolderPath` matches your folder (relative to drive root).

For the folder you provided, the default is:

- `Documents/Research/Projects _ Open/DP26_internal_external_attention/CRDM`

### 4) Use it

- Run the app in Live Server.
- Click **Export to SharePoint**.
- The first time, a sign-in popup appears.
- On success, the uploaded file opens in a new tab.

## What the builder outputs

The JSON produced by the builder is intentionally lightweight and matches what [src/JsonBuilder.js](src/JsonBuilder.js) generates.

Core shape (abridged):

```json
{
  "experiment_type": "trial-based",
  "task_type": "rdm",
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

### Supported tasks (5)

The Builder currently supports five task types via the **Task Type** dropdown:

- `task_type: "rdm"` — Random Dot Motion (RDM)
- `task_type: "gabor"` — Gabor Patch task
- `task_type: "flanker"` — Flanker task
- `task_type: "sart"` — Sustained Attention to Response Task (SART)
- `task_type: "soc-dashboard"` — multi-window SOC desktop session (continuous-mode only)

There is also a `task_type: "custom"` option intended for advanced/manual use (no task-specific components; generic components + tracking only).

### Session updates (Feb 2026)

- Eye-tracking support in the Builder now includes a dedicated **Calibration Instructions** component (shown only when the Eye Tracking modality is enabled).
  - This exports as a normal `html-keyboard-response` trial, but is tagged with `data.plugin_type = "eye-tracking-calibration-instructions"` so the interpreter can reposition it to the correct place (between the camera-permission screen and calibration dots).
  - Timeline card title/icon also stays in sync so calibration prefaces remain visually distinct from generic Instructions.
- Response-modality parameters are now conditionally shown/disabled in the UI.
  - Disabled fields are not saved/exported (prevents exporting irrelevant voice/mouse/touch settings when not in use).
- Continuous-mode defaults were expanded to include aperture outline controls so continuous exports match the interpreter’s rendering expectations.

### SOC Dashboard release (Feb 2026)

The Builder includes a **SOC Dashboard** task type for “multi-tasking” paradigms presented inside a single, realistic SOC desktop.

- Constraint: `task_type: "soc-dashboard"` is only enabled when `experiment_type` is `continuous`.
- Authoring model: one `soc-dashboard` component acts as a session container; “subtasks” are authored as separate helper cards and are composed into the nearest SOC Dashboard at export time.

Implemented SOC subtasks:

- `soc-subtask-sart-like` (exports as `type: "sart-like"` inside `subtasks[]`)
  - Deterministic GO mapping for realism (single action outcome per run):
    - `go_condition: "target"` → GO yields `ALLOW`
    - `go_condition: "distractor"` → GO yields `BLOCK`
  - `show_markers` (default false) toggles target/distractor tags.
  - `instructions` supports placeholders like `{{GO_CONTROL}}`, `{{TARGETS}}`, `{{DISTRACTORS}}`.

- `soc-subtask-nback-like` (exports as `type: "nback-like"` inside `subtasks[]`)
  - `match_field: "src_ip" | "username"`
  - `response_paradigm: "go_nogo" | "2afc"` (modal shows only the relevant key fields)
  - `instructions` supports placeholders like `{{GO_CONTROL}}`, `{{NOGO_CONTROL}}`, `{{N}}`, `{{MATCH_FIELD}}`.

Scheduling (for overlaps / multitasking):

- Each subtask supports `start_at_ms` / `start_delay_ms` and `duration_ms` / `end_at_ms` so windows can appear/disappear on a fixed schedule.
- Subtasks also include a clickable instruction popup at runtime; dismissing it anchors the “true start” timing (the interpreter logs `t_subtask_ms` from that point).

Planned / placeholders (next session):

- `soc-subtask-flanker-like` (TBD)
- `soc-subtask-wcst-like` (TBD)

See [docs/inputs_outputs.md](docs/inputs_outputs.md) for a more detailed (but still current) reference.

## Timeline components

The timeline is authored in the UI and serialized from DOM `dataset.componentData`. Supported component types include:

### Common components (all tasks)

- Instructions:
  - `instructions` (renders/export as `html-keyboard-response`)
- Generic stimulus/survey:
  - `html-keyboard-response` (generic)
  - `image-keyboard-response`
  - `survey-response`
- Tracking (only shown when enabled under **Data Collection**):
  - `eye-tracking` (settings stub)
  - `eye-tracking-calibration-instructions` (preface screen; exported as `html-keyboard-response` tagged with `data.plugin_type = "eye-tracking-calibration-instructions"`)
  - `mouse-tracking`

### RDM components (`task_type: "rdm"`)

### Common components (all tasks)

- Instructions:
  - `instructions` (renders/export as `html-keyboard-response`)
- Generic stimulus/survey:
  - `html-keyboard-response` (generic)
  - `image-keyboard-response`
  - `survey-response`
- Tracking (only shown when enabled under **Data Collection**):
  - `eye-tracking` (settings stub)
  - `eye-tracking-calibration-instructions` (preface screen; exported as `html-keyboard-response` tagged with `data.plugin_type = "eye-tracking-calibration-instructions"`)
  - `mouse-tracking`

### RDM components (`task_type: "rdm"`)

- `rdm-trial`
- `rdm-practice`
- `rdm-adaptive`
- `rdm-dot-groups`
- `block` (component_type can be `rdm-trial`, `rdm-practice`, `rdm-adaptive`, `rdm-dot-groups`)
- `html-button-response` (generic button-response screen; available in RDM mode)

### Gabor components (`task_type: "gabor"`)

- `gabor-trial`
- `block` (component_type can be `gabor-trial` or `gabor-quest`)

### Flanker components (`task_type: "flanker"`)

- `flanker-trial`
- `block` (component_type can be `flanker-trial`)

### SART components (`task_type: "sart"`)

- `sart-trial`
- `block` (component_type can be `sart-trial`)

### SOC Dashboard components (`task_type: "soc-dashboard"`)

- `soc-dashboard` (SOC desktop “session container”)
- `soc-dashboard-icon` (desktop icon; distractor clicks)
- Subtasks (composed into `soc-dashboard.subtasks[]` on export):
  - `soc-subtask-sart-like` (log triage Go/No-Go)
  - `soc-subtask-nback-like` (alert correlation)
  - `soc-subtask-flanker-like` (placeholder; next session)
  - `soc-subtask-wcst-like` (placeholder; next session)

### Eye tracking

The Builder’s **Eye Tracking** data-collection checkbox controls whether the study should collect eye tracking.

- Minimal form (what the Builder exports today):

```json
{
  "data_collection": {
    "eye-tracking": true
  }
}
```

- Detailed form (optional; supported by the interpreter):

```json
{
  "data_collection": {
    "eye_tracking": {
      "enabled": true,
      "sample_rate": 30,
      "calibration_points": 9,
      "show_video": false
    }
  }
}
```

When eye tracking is enabled, the component library includes **Calibration Instructions** so researchers can insert a participant-friendly preface screen before calibration.

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