# Parameter Control Architectures for RDM Tasks

This document explains the different approaches to parameter control in Random Dot Motion (RDM) experiments and when to use each method.

Note: parts of this document describe conceptual/legacy schema ideas (e.g., explicit frame-by-frame `parameter_timeline`). The current builder export format is defined by [../src/JsonBuilder.js](../src/JsonBuilder.js) and documented in [inputs_outputs.md](inputs_outputs.md).

## Overview of Control Methods

### 1. Frame-by-Frame Control (`rdm_frame_control_schema.json`)
**Best for:** Continuous, dynamic experiments with changing parameters during stimulus presentation

**Key Features:**
- Temporal resolution down to 16ms (60fps) or finer
- Real-time parameter changes during a single trial
- Support for mathematical functions (ramps, sine waves, staircases)
- Event-triggered parameter changes
- Ideal for motion perception studies

**Example Use Cases:**
- Gradual coherence changes during stimulus presentation
- Speed ramping experiments
- Direction changes mid-trial
- Adaptive motion tracking tasks
- Smooth pursuit studies

### 2. Trial-by-Trial Control (`rdm_trial_control_schema.json`) 
**Best for:** Discrete experimental designs with fixed parameters per trial

**Key Features:**
- Complete parameter specification for each trial
- Block-based organization
- Adaptive algorithms (QUEST, staircases)
- Factorial designs and counterbalancing
- Response-contingent changes between trials

**Example Use Cases:**
- Threshold estimation experiments
- Psychometric function mapping
- Traditional psychophysics paradigms
- Block design experiments
- Confidence rating studies

## Detailed Comparison

### Temporal Resolution

| Aspect | Frame-by-Frame | Trial-by-Trial |
|--------|----------------|----------------|
| **Minimum time unit** | 16ms (60fps) | Full trial duration |
| **Parameter changes** | During stimulus | Between stimuli |
| **Temporal precision** | Sub-second | Trial-level |
| **Real-time adaptation** | Yes | Between trials only |

### Parameter Specification

#### Frame-by-Frame
```json
"parameter_timeline": {
  "motion.coherence": [
    {
      "frames": [0, 30],
      "type": "ramp",
      "start_value": 0.0,
      "end_value": 0.8,
      "function": "linear"
    },
    {
      "frames": [30, 90],
      "type": "constant",
      "value": 0.8
    }
  ]
}
```

#### Trial-by-Trial
```json
"trial_timeline": [
  {
    "trial_id": "high_coherence_01",
    "parameters": {
      "motion.coherence": 0.8,
      "motion.direction": 0,
      "timing.stimulus_duration": 1500
    }
  }
]
```

### Experimental Design Types

#### Frame-by-Frame Applications
- **Motion adaptation studies**: Gradual direction or speed changes
- **Perceptual learning**: Real-time difficulty adjustment
- **Smooth pursuit**: Continuous motion tracking
- **Attention studies**: Dynamic spatial attention cues
- **Neurophysiology**: Precise temporal control for neural recordings

#### Trial-by-Trial Applications  
- **Psychometric functions**: Systematic coherence/direction mapping
- **Threshold estimation**: QUEST or staircase procedures
- **Factorial designs**: Crossing multiple independent variables
- **Block designs**: Different conditions in separate blocks
- **Individual differences**: Between-subject comparisons

## Implementation Complexity

### Frame-by-Frame
```javascript
// Higher complexity - requires frame-accurate timing
class FrameBasedRDM {
  updateFrame(frameNumber) {
    const currentParams = this.getParametersForFrame(frameNumber);
    this.updateDotMotion(currentParams);
    this.checkEventTriggers(frameNumber);
  }
  
  getParametersForFrame(frame) {
    // Interpolate between keyframes
    // Apply mathematical functions
    // Handle event triggers
  }
}
```

### Trial-by-Trial
```javascript
// Lower complexity - parameters set once per trial
class TrialBasedRDM {
  initializeTrial(trialParams) {
    this.coherence = trialParams.motion.coherence;
    this.direction = trialParams.motion.direction;
    // Set all parameters once
  }
}
```

## Performance Considerations

### Frame-by-Frame
- **Pros**: Smooth parameter transitions, precise temporal control
- **Cons**: Higher computational load, more complex debugging
- **CPU Usage**: Moderate to high (parameter calculations each frame)
- **Memory**: Higher (storing parameter timelines)

### Trial-by-Trial
- **Pros**: Efficient execution, easier debugging, standard approach
- **Cons**: No within-trial dynamics, discrete changes only
- **CPU Usage**: Low to moderate (parameters set once per trial)
- **Memory**: Lower (only current trial parameters)

## Data Collection Implications

### Frame-by-Frame Data
```json
{
  "trial_id": "motion_ramp_01",
  "frame_data": [
    {"frame": 0, "coherence": 0.0, "rt": null},
    {"frame": 15, "coherence": 0.25, "rt": null},
    {"frame": 30, "coherence": 0.5, "rt": null},
    {"frame": 45, "coherence": 0.75, "rt": 789}
  ],
  "response_frame": 45,
  "total_frames": 90
}
```

### Trial-by-Trial Data  
```json
{
  "trial_id": "coherence_50_right",
  "coherence": 0.5,
  "direction": 0,
  "rt": 789,
  "accuracy": 1,
  "confidence": 3
}
```

## When to Choose Each Method

### Choose Frame-by-Frame When:
- ✅ You need parameter changes during stimulus presentation
- ✅ Studying dynamic motion perception
- ✅ Implementing adaptive real-time adjustments
- ✅ Precise temporal control is critical
- ✅ You have computational resources for frame-accurate timing

### Choose Trial-by-Trial When:
- ✅ Traditional psychophysics paradigm
- ✅ Factorial or block designs
- ✅ Threshold estimation studies  
- ✅ Simple implementation is preferred
- ✅ Standard data analysis approaches
- ✅ Lower computational requirements

## Hybrid Approaches

For maximum flexibility, you can combine both methods:

```json
{
  "experiment_type": "hybrid",
  "trials": [
    {
      "trial_type": "frame_based",
      "parameter_timeline": { /* frame-by-frame spec */ }
    },
    {
      "trial_type": "trial_based", 
      "parameters": { /* fixed trial parameters */ }
    }
  ]
}
```

## Implementation Roadmap

1. **Phase 1**: Trial-by-trial (easier to implement and test)
2. **Phase 2**: Frame-by-frame (advanced features)
3. **Phase 3**: Hybrid support (maximum flexibility)

This allows for incremental development while supporting the most common experimental needs first.