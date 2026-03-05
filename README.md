<p align="center">
  <img src="img/logo_dark.png" alt="CogFlow" width="280" />
</p>

# CogFlow Builder

Static (non-bundled) web app for building JSON configurations for experimental psychology tasks. CogFlow is designed to work as a modular platform that supports classic jsPsych paradigms and expands them to provide continuous presentation paradigms, additional ecological validity tasks (such as the SOC Dashboard simulator), and customizable tasks with multiple data collection modalities across web and local hosts.

This app is plain HTML/CSS/JS loaded via classic `<script>` tags (globals; no `import`/`export`).

## Repositories

- Builder repo: https://github.com/KSalibay/cogflow-builder-app
- Interpreter repo: https://github.com/KSalibay/cogflow-interpreter-app

## What this app does

CogFlow Builder is a static authoring tool for generating **CogFlow JSON configs** (task defaults + a timeline of components/blocks) that the CogFlow Interpreter can run via **jsPsych** (often inside **JATOS**).

Key features:

- Task-scoped component library (so the timeline and Block editor show the correct task-specific fields/options)
- Blocks: compact “generate many trials” representation with parameter windows/ranges and per-trial sampling
- Live Preview for many components (including representative Block sampling)
- Export paths:
  - Local JSON download
  - Token Store export (Cloudflare Worker; optional R2 assets) + **JATOS Props** bundle generation
  - Optional Microsoft Graph / SharePoint export (advanced)
- Asset handling:
  - `asset://...` placeholders during authoring
  - Upload assets during export (Token Store / SharePoint) and rewrite references to hosted URLs
  - Optional “Upload Assets” folder tool to reference images by filename
- Data-collection modalities and UI:
  - reaction time / accuracy / correctness toggles
  - optional eye tracking (WebGazer) + calibration-instructions helper component
  - optional mouse tracking
- UI theming + Accessibility Mode (persisted locally)

## Run locally

- Use VS Code Live Server on [index.html](index.html)
- If you hit caching issues, bump the `?v=...` cache-buster querystring on local `<script>` tags in [index.html](index.html)

## Recommended workflow: Token Store export + JATOS

The default “demo-ready” path avoids SharePoint/Graph setup and avoids relying on URL params inside JATOS:

1. Run the Builder (locally or in JATOS)
2. Click **Export → Token Store**
3. The Builder creates a `config_id` and tokens, uploads the JSON (and any cached `asset://...` files), then shows an overlay containing the exact JSON to paste into JATOS
4. Paste the values into the Interpreter component’s **Component Properties** (see Interpreter README)

### Import local JSON(s) → Token Store (batch)

If you already have one or more CogFlow JSON files (e.g., versioned configs exported from a prior session), you can upload them directly:

1. Click **Import JSON(s)**
2. Select one or more `.json` files
3. The Builder uploads each file to the Token Store and then shows a **multi-config** JATOS Component Properties bundle you can paste into the Interpreter

Notes:

- This is the fastest “turn local files into a runnable JATOS session” path.
- The bundle is generated from what was uploaded in that browser session (stored in local storage). If you clear storage or switch browsers, re-import/re-export to re-create the tokens.

### DRT authoring note

The legacy per-element `detection_response_task_enabled` toggle is no longer part of the Builder schema and is stripped on export.

- To schedule DRT in the Interpreter, use explicit timeline items: `detection-response-task-start` / `detection-response-task-stop`.

#### DRT ISO defaults + override

`detection-response-task-start` includes an **Override ISO standard** checkbox.

- Default (unchecked): ISO timing/RT fields are locked and saved as:
  - `min_iti_ms`: 3000
  - `max_iti_ms`: 5000
  - `stimulus_duration_ms`: 1000 (or until response at runtime)
  - `min_rt_ms`: 100
  - `max_rt_ms`: 2500
- If checked: those fields become editable.

Reliability notes:

- The Builder stores a local “export snapshot” backup in browser storage as soon as you click **Export**.
- When running inside **JATOS**, the Builder also uploads the exported JSON snapshot as a **JATOS result file** (best-effort) so the config is preserved server-side even if Cloudflare / Token Store is unreachable.

### JATOS Props button (single + multi-config bundles)

The Builder UI includes a **JATOS Props** button that generates a complete Component Properties JSON blob.

This supports two common setups:

- **Single config**: export one config to Token Store → paste its `config_store_config_id` + `config_store_read_token` into the Interpreter.
- **Multi-config bundle**: export multiple configs (often multiple task types) under the same **export code** → generate a bundle that the Interpreter will fetch, shuffle, and run sequentially.

How multi-config works:

1. Export each config to Token Store using the same export code (e.g. `TEST001`).
2. Click **JATOS Props** and enter that export code.
3. The Builder assembles a JSON object like:

```json
{
  "config_store_base_url": "https://<your-worker>.workers.dev",
  "config_store_code": "TEST001",
  "config_store_configs": [
    { "config_id": "...", "read_token": "...", "task_type": "rdm", "filename": "..." },
    { "config_id": "...", "read_token": "...", "task_type": "sart", "filename": "..." }
  ]
}
```

4. Paste it into the Interpreter component’s **Component Properties**.

Notes:

- The bundle is generated **client-side** from Token Store exports that were created in that browser session (stored in local storage). The Token Store Worker intentionally cannot “list tokens by export code”.
- If you cleared storage / switched browsers, you can re-export the configs (to re-create tokens) and re-generate the bundle.

### Token Store Worker (Cloudflare)

This repo includes a deployable Cloudflare Worker implementation at:

- [token-store-worker/](token-store-worker/)

It stores configs in KV behind unguessable read/write tokens, and (optionally) hosts binary assets via R2.

### Assets (`asset://...`) during Token Store export

Some parameters (e.g., `stimulus_image_url`, `stimulus_audio_url`) support choosing a local file.

- While editing, the Builder stores the file in an in-memory cache and writes an `asset://<componentId>/<field>` placeholder into the JSON.
- When exporting **to Token Store**, the Builder:
  - uploads cached assets to the Worker (R2) and receives public, unguessable asset URLs
  - rewrites all `asset://...` references in the exported JSON (including `asset://...` occurrences embedded inside custom HTML strings)
- When exporting as a local download, `asset://...` references are kept as-is (you must host the files yourself).

### Upload Assets (folder) → refer to images by filename

The **Upload Assets** button uploads a local folder to the Token Store and saves a **filename → URL** index in browser storage (scoped to your export code + task type).

- After uploading, you can reference images in parameters by filename (e.g., `b1.png`) instead of pasting full URLs.
- This works for:
  - `image-keyboard-response` components (`stimulus`, `stimulus_image`)
  - `image-keyboard-response` Blocks (`stimulus_image` or `stimulus_images`)
- The Builder preview will also resolve bare filenames via this saved index.

Note: the filename→URL mapping is stored locally in the browser. If you clear site data or switch browsers, you’ll need to re-run **Upload Assets**.

## JATOS

This repo includes a JATOS entry wrapper: `index_jatos.html`.

Recommended asset layout inside your JATOS study assets for the Builder component:

- Component HTML file: `index_jatos.html`
- Builder app files live under: `builder/` (so the wrapper can load `/publix/.../builder/index.html` while keeping the top-level page at `/publix/.../start`)

Notes:

- JATOS commonly applies a strict CSP to static asset routes; the wrapper keeps the top-level document at `/start` (which is typically marked `+nocsp`) and loads `builder/index.html` into it.
- The Builder uses vendored third-party dependencies under `vendor/` (to avoid CDN and cross-origin issues in JATOS).

## Export to SharePoint via Microsoft Graph

This is an optional/advanced export path. For most deployments (especially JATOS), prefer **Token Store export**.

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

### Local assets (images + audio)

Asset placeholders behave the same way across exports (they are cached as `asset://...` while authoring), but the upload destination depends on the export type:

- Token Store export: assets upload to the Worker (R2) and references are rewritten.
- SharePoint/Graph export: assets upload next to the JSON in your target folder and references are rewritten.
- Local download: placeholders are preserved; you must host assets yourself.

## What the builder outputs

The JSON produced by the builder is intentionally lightweight and matches what [src/JsonBuilder.js](src/JsonBuilder.js) generates.

Core shape (abridged):

```json
{
  "ui_settings": {
    "theme": "dark"
  },
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

- **Theme** is configured in the left **Experiment Configuration** panel via the **Theme** dropdown.
  - Exported as `ui_settings.theme` (`"dark"` or `"light"`) and consumed by the Interpreter to theme instruction screens and other UI.
- **Data collection** currently includes `reaction-time`, `accuracy`, `correctness` (online correctness computation toggle), and `eye-tracking`.
- **Response modalities** (keyboard/mouse/touch/voice) are configured via the Default Response UI and exported under `response_parameters`.

### Supported tasks

The Builder supports these task types via the **Task Type** dropdown:

- `task_type: "rdm"` — Random Dot Motion (RDM)
- `task_type: "flanker"` — Flanker task
- `task_type: "sart"` — Sustained Attention to Response Task (SART)
- `task_type: "stroop"` — Stroop task
- `task_type: "emotional-stroop"` — Emotional Stroop task (2–3 labeled word lists)
- `task_type: "simon"` — Simon task
- `task_type: "pvt"` — Psychomotor Vigilance Task (PVT)
- `task_type: "gabor"` — Gabor Patch task
- `task_type: "nback"` — N-back task (**trial-based** and **continuous**)
- `task_type: "soc-dashboard"` — multi-window SOC desktop session (continuous-mode only)

There is also a `task_type: "custom"` option intended for advanced/manual use (no task-specific components; generic components + tracking only).

### SOC Dashboard

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

- `soc-subtask-flanker-like` (exports as `type: "flanker-like"` inside `subtasks[]`)
  - Keys: `allow_key`, `reject_key`
  - Timing/structure: `num_trials`, `response_window_ms`, `trial_interval_ms`
  - Rule: `reject_rule: "high_only" | "medium_or_high"`

- `soc-subtask-wcst-like` (exports as `type: "wcst-like"` inside `subtasks[]`)
  - Response mode:
    - `response_device: "keyboard" | "mouse"`
    - Keyboard: `choice_keys` (4 keys)
    - Mouse: `mouse_response_mode: "click" | "drag"`
  - Optional participant help overlay: `help_overlay_enabled`, `help_overlay_title`, `help_overlay_html`
  - Optional researcher example libraries: `sender_domains`, `sender_display_names`, `subject_lines_*`, `preview_lines_*`, `link_*`, `attachment_label_*`
  - Builder preview includes lightweight interactivity (no logging):
    - keyboard: pressing the configured keys highlights the corresponding target
    - mouse/click: clicking a target highlights it
    - mouse/drag: the email can be dragged and dropped onto targets

- `soc-subtask-pvt-like` (exports as `type: "pvt-like"` inside `subtasks[]`)
  - Goal: respond as fast as possible to a red flash embedded in a noisy alert/log stream.
  - Parameters:
    - `response_device: "keyboard" | "mouse"`, `response_key`
    - `countdown_seconds`, `flash_duration_ms`, `response_window_ms`
    - `alert_min_interval_ms`, `alert_max_interval_ms`
  - Preview is interactive (countdown + flash + responses/false starts) so you can tune timings.

Scheduling (for overlaps / multitasking):

- Each subtask supports `start_at_ms` / `start_delay_ms` and `duration_ms` / `end_at_ms` so windows can appear/disappear on a fixed schedule.
- Subtasks also include a clickable instruction popup at runtime; dismissing it anchors the “true start” timing (the interpreter logs `t_subtask_ms` from that point).

See [docs/inputs_outputs.md](docs/inputs_outputs.md) for a more detailed (but still current) reference.

### Component Preview modal

The **Component Preview** modal supports:

- SOC components and subtasks (including `soc-subtask-pvt-like`) with interactive previews
- Trial-based task components including `stroop-trial`, `simon-trial`, and `pvt-trial` (lightweight renderers; PVT preview includes an interactive timing simulation)

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

- `rdm-trial`
- `rdm-practice`
- `rdm-adaptive`
- `rdm-dot-groups`
- `block` (block_component_type can be `rdm-trial`, `rdm-practice`, `rdm-adaptive`, `rdm-dot-groups`, `html-keyboard-response`, `html-button-response`, or `image-keyboard-response`)
  - For `image-keyboard-response` blocks, you can provide `stimulus_images` as a comma/newline-separated list to sample from across generated trials.
- `html-button-response` (generic button-response screen; available in RDM mode)

### Gabor components (`task_type: "gabor"`)

- `gabor-trial`
- Patch border parameters (set via **Gabor Experiment Settings**, per-trial overrides, or via `block.parameter_values`):
  - `patch_border_enabled`
  - `patch_border_width_px`
  - `patch_border_color`
  - `patch_border_opacity`
- `block` (block_component_type can be `gabor-trial` or `gabor-quest`)

### Flanker components (`task_type: "flanker"`)

- `flanker-trial`
- `block` (block_component_type can be `flanker-trial`)

### SART components (`task_type: "sart"`)

- `sart-trial`
- `block` (block_component_type can be `sart-trial`)

### Stroop components (`task_type: "stroop"`)

- `stroop-trial`
- `block` (block_component_type can be `stroop-trial`)

### Emotional Stroop components (`task_type: "emotional-stroop"`)

- `emotional-stroop-trial`
- `block` (block_component_type can be `emotional-stroop-trial`)
  - Blocks can export structured `word_lists` and record the selected list in per-trial fields `word_list_label` / `word_list_index`.

### Simon components (`task_type: "simon"`)

- `simon-trial`
- `block` (block_component_type can be `simon-trial`)

### PVT components (`task_type: "pvt"`)

- `pvt-trial`
- `block` (block_component_type can be `pvt-trial`)

### N-back components (`task_type: "nback"`)

- `nback-trial-sequence`
  - Trial-based: generates an $n$-back sequence and is expanded into `nback-block` trials by the Interpreter.
  - Continuous: compiled into a continuous N-back stream (Interpreter plugin `nback-continuous`).
- `nback-block`
  - Trial-based N-back trial item (usually generated from a sequence/block).
- `block` (block_component_type can be `nback-block`)
  - Acts as an N-back generator with a `block_length` and `parameter_values` (advanced authoring).

### SOC Dashboard components (`task_type: "soc-dashboard"`)

- `soc-dashboard` (SOC desktop “session container”)
- `soc-dashboard-icon` (desktop icon; distractor clicks)
- Subtasks (composed into `soc-dashboard.subtasks[]` on export):
  - `soc-subtask-sart-like` (log triage Go/No-Go)
  - `soc-subtask-nback-like` (alert correlation)
  - `soc-subtask-flanker-like` (traffic spikes monitor)
  - `soc-subtask-wcst-like` (email sorting / WCST-like)
  - `soc-subtask-pvt-like` (incident alert monitor / PVT-like vigilance)

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
  "block_component_type": "rdm-trial",
  "block_length": 100,
  "sampling_mode": "per-trial",
  "parameter_windows": [
    { "parameter": "coherence", "min": 0.2, "max": 0.8 },
    { "parameter": "speed", "min": 4, "max": 10 }
  ],
  "parameter_values": {
    "direction": [0, 180],
    "dot_color": "#FFFFFF"
  }
}
```

In Preview, blocks are shown by sampling a representative trial from their parameter windows.

Notes:

- The Interpreter also accepts legacy keys like `component_type` and `length`, but `block_component_type` / `block_length` is the preferred shape.
- For Emotional Stroop Blocks, the Builder can export structured `word_lists` and per-trial metadata fields `word_list_label` / `word_list_index`.

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

## Reference docs (where they went)

Docs live under [docs/](docs/):

- High-level notes: [docs/quick_reference.md](docs/quick_reference.md), [docs/inputs_outputs.md](docs/inputs_outputs.md)
- Schema entry points: [docs/SchemaReference.md](docs/SchemaReference.md)

### Plugin refdocs generator

If you’re looking for the “generated plugin reference docs”, the repo now includes a checked-in snapshot:

- Generated snapshot: [docs/reference/plugins/plugin_schema_reference.md](docs/reference/plugins/plugin_schema_reference.md)

To refresh/regenerate it, use one of:

- Browser generator (no Node required): [tools/generate_plugin_refdocs.html](tools/generate_plugin_refdocs.html)
  - Open it with Live Server and click **Generate** → **Download markdown**
- Optional Node script (writes files into `docs/reference/plugins/`): [tools/generate_plugin_refdocs.js](tools/generate_plugin_refdocs.js)
  - Run: `node tools/generate_plugin_refdocs.js`
- Optional Python script (writes the single snapshot file above): [tools/generate_plugin_refdocs_quickjs.py](tools/generate_plugin_refdocs_quickjs.py)
  - Requires: `pip install quickjs`
  - Run: `python tools/generate_plugin_refdocs_quickjs.py`

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