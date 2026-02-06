# SOC Dashboard (Prototype) — Change Catalog

Goal: add a new `task_type: "soc-dashboard"` prototype (vanilla HTML/CSS/JS “Windows-like shell” + SOC dashboard) with minimal risk to existing tasks by (a) isolating new code in new files and (b) tightly gating all integration points.

## New files (SOC-specific)

### Builder
- `json-builder-app/src/modules/SocDashboardPreview.js`
  - Isolated preview renderer used only when previewing a component with `type: "soc-dashboard"`.
  - Renders a Windows-like desktop shell (wallpaper + desktop icons + taskbar/search + pinned apps) and an SOC window stub.
  - Preview behavior respects `icons_clickable`, `log_icon_clicks`, and `icon_clicks_are_distractors` (with a preview-only event overlay).
  - Alerts table preview scales with `num_tasks`.
  - Injects scoped CSS into `document.head` (selectors are scoped to the preview host attribute) to avoid Bootstrap/modal CSS interference.

### Interpreter
- `json-interpreter-app/src/jspsych-soc-dashboard.js`
  - New jsPsych plugin `window.jsPsychSocDashboard`.
  - Renders a Windows-like shell + SOC dashboard stub UI and records interaction events into trial data.

## Modified “general” files (integration points)

### Builder
- `json-builder-app/index.html`
  - Adds a new Task Type option: `SOC Dashboard (Prototype)` (`value="soc-dashboard"`).
  - Loads `src/modules/SocDashboardPreview.js` before `ComponentPreview.js` so the preview router can call it.

- `json-builder-app/src/JsonBuilder.js`
  - `maybeInsertStarterTimeline()` now supports `soc-dashboard` by auto-inserting `Instructions` + `SOC Dashboard Session` when the timeline is empty.
  - Adds an experiment-wide SOC defaults panel (left side) for wallpaper URL + background color, icon click logging (as distractors), and session duration/end key defaults.
  - `isComponentTypeAllowedForTask()` now allows `soc-dashboard` sessions plus `soc-dashboard-icon` helper components.
  - `getTimelineFromDOM()` composes `soc-dashboard-icon` items into the nearest preceding `soc-dashboard` session as `desktop_icons[]` at export time.
  - `getComponentDefinitions()` adds task-scoped `soc-dashboard` session + `soc-dashboard-icon` components and exposes generic HTML/image components + optional tracking components (eye tracking + calibration preface) without enabling any RDM-only surfaces.

- `json-builder-app/src/modules/ComponentPreview.js`
  - `showPreview()` routes `type: "soc-dashboard"` to a new `showSocDashboardPreview()` method.
  - `showSocDashboardPreview()` renders via `window.SocDashboardPreview.render()`.

- `json-builder-app/src/schemas/JSPsychSchemas.js`
  - Adds/extends plugin schemas for `soc-dashboard` and `soc-dashboard-icon` so the parameter editor can render/validate fields.
  - Recognizes `task_type: "soc-dashboard"` as known to avoid warning-only validation noise.

### Interpreter
- `json-interpreter-app/index.html`
  - Loads the new plugin script: `src/jspsych-soc-dashboard.js`.

- `json-interpreter-app/src/timelineCompiler.js`
  - Restricts the special continuous-mode “RDM frame aggregation” path to `experiment_type === "continuous" && task_type === "rdm"`.
  - Adds compilation support for `type: "soc-dashboard"` by mapping it to `window.jsPsychSocDashboard`.
  - Merges experiment-wide defaults from `soc_dashboard_settings` into each SOC session trial (with per-component overrides winning).

## Notes / guardrails
- No existing task types were modified semantically; all new behavior is gated by `task_type === "soc-dashboard"` (Builder) and/or `type === "soc-dashboard"` (Interpreter).
- No global CSS was added for the prototype; preview styles are injected locally.
- The `soc-dashboard-icon` component is a Builder-only helper; it is composed into the exported `soc-dashboard` trial as `desktop_icons[]`.
