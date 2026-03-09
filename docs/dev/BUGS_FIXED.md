# Bugs Fixed (Development Changelog)

This document is a running, developer-facing changelog of bug fixes across:
- **Builder**: `json-builder-app/`
- **Interpreter**: `json-interpreter-app/`
- **Deployed JATOS assets**: `jatos_win_java/study_assets_root/` (mirrors the same source files)

It’s intentionally written in terms of *user-visible symptoms* and the *exact code locations* that were changed, so we can answer “when/where was this squashed?” during iterative development.

---

## 2026-03-07 — Survey save + slider UX

### Survey parameters sometimes didn’t save (Builder)

- **Symptom**: After editing an Instructions component (custom editor), later edits to Survey components appeared to “not save” when clicking **Save Parameters**.
- **Root cause**: The Instructions editor overrides the parameter modal Save button handler (`#saveParametersBtn.onclick`) and did not reliably restore it. Subsequent component editors would open with the wrong Save handler.
- **Fix**:
  - On every component edit modal open, the Builder now re-binds Save to the schema-driven save path.
  - The Instructions editor also restores the previous Save handler when the modal closes.

**Builder files changed**
- `json-builder-app/src/modules/TimelineBuilder.js`
- `json-builder-app/index.html`

**JATOS deployed sync**
- `jatos_win_java/study_assets_root/cogflow/builder/src/modules/TimelineBuilder.js`
- `jatos_win_java/study_assets_root/cogflow/builder/index.html`
- `jatos_win_java/study_assets_root/cogflow-test/builder/src/modules/TimelineBuilder.js`
- `jatos_win_java/study_assets_root/cogflow-test/builder/index.html`

### Survey slider questions didn’t show selected value (Interpreter)

- **Symptom**: Slider questions moved, but participants could not see the exact numeric value they had selected.
- **Fix**: Survey slider questions now render a live-updating numeric value label adjacent to the slider.

**Interpreter files changed**
- `json-interpreter-app/src/jspsych-survey-response.js`

**JATOS deployed sync**
- `jatos_win_java/study_assets_root/cogflow/interpreter/src/jspsych-survey-response.js`
- `jatos_win_java/study_assets_root/cogflow-test/interpreter/src/jspsych-survey-response.js`

---

## 2026-03-07 — SART payload cleanup (remove duplicate correctness fields)

- **Symptom**: SART trials emitted `correct`, `accuracy`, and `correctness` as duplicates in exported datasets (especially visible in deployed JATOS runs).
- **Fix**: Restrict SART trial payload to a single correctness field: `correct`.

**Interpreter files changed**
- `json-interpreter-app/src/jspsych-sart.js`

**JATOS deployed sync**
- `jatos_win_java/study_assets_root/cogflow/interpreter/src/jspsych-sart.js`
- `jatos_win_java/study_assets_root/cogflow-test/interpreter/src/jspsych-sart.js`

## 2026-03 (early) — Task plugin fixes (SART / PVT / Continuous N-back)

### SART: duplicated correctness fields + wrong-key handling + layout stability

- **Symptoms**:
  - Output data contained duplicated correctness-like fields (multiple columns that meant the same thing).
  - Accidental “fat-finger” keys could be treated as responses.
  - Stimulus positioning/appearance could be inconsistent across environments.
- **Fixes**:
  - De-duplicated correctness-related fields and aligned data field naming.
  - Restricted response handling to the configured response keys so unrelated keys are ignored.
  - Improved centering and typography stability.

**Interpreter file changed**
- `json-interpreter-app/src/jspsych-sart.js`

### PVT: feedback unreadable in light theme + HTML feedback not applying

- **Symptoms**:
  - Feedback screens were unreadable in light theme due to hard-coded colors.
  - Configured feedback HTML appeared as literal text (escaped).
- **Fixes**:
  - Removed hard-coded feedback text colors so it inherits theme colors.
  - Rendered configured feedback as HTML.

**Interpreter file changed**
- `json-interpreter-app/src/jspsych-pvt.js`

### Continuous N-back: feedback toggle looked broken + JATOS off-center

- **Symptoms**:
  - Feedback was configured but never visibly appeared.
  - Under JATOS, some screens appeared off-center due to missing shared layout styles.
- **Fixes**:
  - Feedback now persists for `feedback_duration_ms` before the stream advances.
  - Added missing `.psy-*` shared CSS into the JATOS interpreter shell.

**Interpreter files changed**
- `json-interpreter-app/src/jspsych-nback-continuous.js`
- `json-interpreter-app/index_jatos.html`

### Builder: PVT block naming/options

- **Symptom**: PVT blocks (and Task Switching blocks) did not present correct block inner-type options or display names in the Builder.
- **Fix**: Updated block component definition generation to include task-specific inner-type options and human-friendly names.

**Builder file changed**
- `json-builder-app/src/JsonBuilder.js`

---

## Notes / Conventions

- “JATOS deployed sync” entries mean the same patch was applied into the static assets under `jatos_win_java/study_assets_root/*` so local JATOS runs use the fixed code.
- This file is meant to be appended to over time (newest entries at the top).
