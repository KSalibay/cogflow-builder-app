# Quick Reference: PsychJSON Builder Output

This builder outputs a lightweight configuration object (see [../src/JsonBuilder.js](../src/JsonBuilder.js)).

## Core structure (abridged)

```json
{
  "experiment_type": "trial-based",
  "data_collection": {
    "reaction-time": true,
    "accuracy": true,
    "correctness": false,
    "eye-tracking": false
  },
  "timeline": [
    { "type": "html-keyboard-response", "stimulus": "..." },
    { "type": "rdm-trial", "coherence": 0.5, "direction": 0 },
    {
      "type": "block",
      "component_type": "rdm-trial",
      "length": 100,
      "sampling_mode": "per-trial",
      "parameter_windows": { "coherence": { "min": 0.2, "max": 0.8 } }
    }
  ],
  "display_parameters": { "canvas": { "width": 600, "height": 600 } },
  "motion_parameters": { "global_motion": { "coherence": 0.5, "direction": 0 } },
  "timing_parameters": { "stimulus_duration": 1500 },
  "response_parameters": { "response_device": "keyboard", "choices": ["f", "j"] }
}
```

## Key concepts

- Defaults vs overrides
  - Experiment-wide response defaults: `response_parameters`
  - Per-component/per-block overrides: `response_parameters_override`
- Continuous-only fields
  - `transition_settings` and `response_parameters.end_condition_on_response` only export in `continuous` mode
- Blocks
  - Compact representation using `parameter_windows` and `parameter_values` (no expansion)