# Task + Feature Catalog (Authorship Tracker)

This file is a lightweight, plain-English inventory of the task types supported by CogFlow Builder and the headline features each task currently supports.

Intended use:

- Keep a shared record of **what exists** and **why it was designed that way**.
- Track feature authorship (ideas, UX decisions, implementation work).
- Keep README-level claims honest by giving us a single place to sanity-check “supported tasks” and their scope.

Conventions:

- “Task” refers to `task_type` in a CogFlow JSON config.
- “Components” are timeline items authored in the UI.
- “Blocks” are compact generators that the Interpreter expands at runtime.

---

## Task types (high level)

| `task_type` | Mode(s) | What it is | Key components (typical) | Owners / Notes |
|---|---|---|---|---|
| `rdm` | trial-based, continuous | Random dot motion decision task family | `rdm-trial`, `rdm-practice`, `rdm-adaptive`, `rdm-dot-groups`, `block` | _Fill in_ |
| `flanker` | trial-based | Flanker congruency task | `flanker-trial`, `block` | _Fill in_ |
| `sart` | trial-based | GO/NO-GO sustained attention | `sart-trial`, `block` | _Fill in_ |
| `stroop` | trial-based | Color-word interference | `stroop-trial`, `block` | _Fill in_ |
| `emotional-stroop` | trial-based | Stroop variant with labeled word lists | `emotional-stroop-trial`, `block` | _Fill in_ |
| `simon` | trial-based | Simon compatibility task | `simon-trial`, `block` | _Fill in_ |
| `pvt` | trial-based | Vigilance / reaction time to rare events | `pvt-trial`, `block` | _Fill in_ |
| `task-switching` | trial-based | Switch vs repeat trials with cueing | `task-switching-trial`, `block` | _Fill in_ |
| `gabor` | trial-based | Gabor patch detection/discrimination | `gabor-trial`, `block` (incl. `gabor-quest`) | _Fill in_ |
| `nback` | trial-based, continuous | Working memory N-back | `nback-trial-sequence`, `nback-block`, `block` | _Fill in_ |
| `mot` | trial-based | Multiple Object Tracking | `mot-trial`, `block` | _Fill in_ |
| `soc-dashboard` | continuous | Multi-window SOC desktop multitasking | `soc-dashboard`, `soc-dashboard-icon`, SOC subtasks | _Fill in_ |
| `continuous-image` | continuous | Continuous Image Presentation (CIP) | `block` (inner type `continuous-image-presentation`) | _Fill in_ |
| `custom` | trial-based, continuous | Advanced/manual mode (generic components only) | generic components + tracking | _Fill in_ |

---

## Per-task feature summaries (plain English)

### `rdm`

What it supports:

- Classic RDM trials (coherence/direction/speed/timing/response).
- Practice variants and adaptive variants (staircase/QUEST-like behavior depending on settings).
- Dot-groups variant (multiple dot populations with separate coherences/colors; optional cueing).
- Blocks to generate large runs from ranges/windows instead of listing every trial.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `flanker`

What it supports:

- Congruent/incongruent/neutral trial generation.
- Blocks for sampling congruency and timing windows.
- Preview support for quick sanity checks.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `sart`

What it supports:

- GO/NO-GO sustained attention reaction-time trials.
- Stimulus timing windows (duration, ISI randomization).
- Configurable target/no-go signal identification.
- Per-trial parameter sampling (target probability, timing windows) via Blocks.
- Feedback display options (correctness, reaction time visualization).
- Blocks for generating large sequences with parameter windows.
- Canvas-based stimulus rendering with fixation cross.
- Response collection (keyboard/mouse) with false-alarm and miss tracking.
- Preview support for sanity-checking trial layouts and timing.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: SART (Sustained Attention to Response Task) for measuring vigilance, inhibition, and attention lapses.
- Known limitations / future work: _Fill in_

### `stroop`

What it supports:

- Stroop trials with configurable stimulus sets and response mappings.
- Blocks for large trial sets.
- Preview support for basic rendering.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `emotional-stroop`

What it supports:

- Emotional Stroop with 2–3 labeled word lists.
- Blocks that can export structured `word_lists` and record which list was chosen per trial.
- Preview support for basic rendering.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `simon`

What it supports:

- Simon compatibility trials.
- Blocks for large trial sets.
- Preview support for basic rendering.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `pvt`

What it supports:

- Reaction-time to rare/sudden stimuli (vigilance).
- Blocks for generating long runs.
- Preview includes a lightweight timing simulation to tune parameters.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `task-switching`

What it supports:

- Switch vs repeat trials.
- Cueing modes (explicit text cue, position cue, or color cue) with experiment-wide defaults.
- Letters/numbers built-in scoring or custom token sets.
- Blocks that can be seeded from the experiment-wide cueing defaults.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `gabor`

What it supports:

- Gabor stimulus + mask parameterization.
- Detection or discrimination response paradigms.
- **Gabor-trial**: Single trial execution with optional QUEST adaptive mode.
- **Gabor-quest**: QUEST-driven loop with coarse→fine phase transitions and per-location staircase support.
- **Gabor-learning**: Accuracy-driven loop that runs until achieving target streak accuracy or max trials.
- Learning controls: streak length, target accuracy, max trials, post-trial feedback display.
- Adaptive parameter selection (tilt, contrast, etc.) with QUEST-generated values.
- Spatial/value cue configurations with independent left/right controls.
- Blocks for generating large runs with parameter sampling.
- Canvas-rendered diamond cue and circular patch outlines (improved in March 2026).
- Contrast windowing (min/max) for adaptive sampling.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: Gabor patches for measuring visual discrimination thresholds; learning mode for adaptive task difficulty.
- Recent improvements (March 2026): Diamond cue rendering (centered between patches, no separate fixation cross), increased patch separation (0.30/0.70 canvas width), circular patch outlines, full learning/QUEST pipeline end-to-end.
- Known limitations / future work: _Fill in_

### `nback`

What it supports:

- Trial-based N-back (sequence generation and block expansion at runtime).
- Continuous N-back mode (Interpreter compiles to a continuous stream with minimal DOM re-rendering).
- Configurable stimulus modes (letters, custom tokens) and N-value (1-back, 2-back, etc.).
- Response paradigms (go/no-go, match/non-match).
- Per-trial and per-block sampling of N-value, target probability, and timing windows.
- Fixation cross control and feedback display options.
- Blocks for advanced/manual N-back generation.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: N-back for working memory assessment; continuous mode for embedded tasking within multi-window (SOC) sessions.
- Known limitations / future work: _Fill in_

### `mot`

What it supports:

- Canvas-rendered arena with multiple moving objects (requestAnimationFrame loop, same approach as RDM).
- Three-phase trial structure: **cue phase** (targets flash at `cue_flash_rate_hz` Hz between `object_color` and `target_cue_color`) → **tracking phase** (all objects move identically, unlabeled) → **probe phase** (participant identifies targets).
- Two trajectory types: `linear` (straight paths, bounce/wrap at boundary) and `curved` (smooth random turning controlled by `curve_strength`).
- Two probe modes: `click` (participant clicks objects they believe are targets) and `number_entry` (numbers 1–N appear inside objects during probe; participant types corresponding numbers on keyboard).
- Configurable arena size (`arena_width_px`, `arena_height_px`) and boundary behavior (`bounce` or `wrap`).
- Per-object speed jitter via `speed_variability` (0 = all same speed).
- Optional post-probe feedback display (`show_feedback`, `feedback_duration_ms`).
- Block support with range/options sampling for: num_objects, num_targets, speed, tracking/cue/ITI durations, motion_type, and probe_mode.
- Data recorded per trial: `num_correct`, `num_false_alarms`, `num_missed`, `rt_first_click_ms`, `clicks[]`.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: Standard MOT paradigm for measuring attentional tracking capacity; supports both click-to-select and number-entry response modes.
- Known limitations / future work: No adaptive variant; difficulty can be controlled through block sequencing.

### `soc-dashboard`

What it supports:

- A realistic multi-window SOC “desktop session” container.
- Timeline-authored subtasks that get composed into the nearest SOC Dashboard on export.
- Scheduling knobs so subtasks can overlap (start/end times and durations).

SOC subtasks (authored as separate components in the Builder):

- `soc-subtask-sart-like`: log triage Go/No-Go.
- `soc-subtask-nback-like`: alert correlation N-back-like.
- `soc-subtask-flanker-like`: traffic spikes monitor.
- `soc-subtask-wcst-like`: email sorting / WCST-like.
- `soc-subtask-pvt-like`: vigilance embedded in alert stream.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `continuous-image`

What it supports:

- Continuous presentation of image sequences with masking and optional mask↔image transition sprites.
- Builder-side asset helpers:
	- entering an “asset code” and a list of filenames
	- loading filename→URL mappings from an exported/uploaded asset index
	- exporting derived URL lists required by the Interpreter (e.g., per-image URLs and transition sprite URLs)

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

### `custom`

What it supports:

- Generic timeline components (instructions, html/image prompts, surveys) and tracking.
- Useful as a sandbox when a task type isn’t yet modeled.

Authorship / design notes:

- Owners: _Fill in_
- Rationale / intended use: _Fill in_
- Known limitations / future work: _Fill in_

---

## Cross-cutting platform features (not task-specific)

These apply across multiple task types.

- **Theming system** (light/dark manual toggle): Replaces system `prefers-color-scheme` detection with manual user control. Theme preference persists via localStorage. Implemented March 2026 with CogFlow palette-driven color tokens for both light and dark modes. Available in both standalone and JATOS entry points.
- Blocks (compact trial generation + per-trial sampling).
- Preview modal (component renderers and sampled block preview).
- Export paths (Local JSON, Token Store + JATOS props bundles, optional SharePoint).
- Asset placeholders (`asset://...`) + asset upload and URL rewriting on export.
- Data collection toggles (reaction time, accuracy, correctness, eye tracking) and tracking helper components.
