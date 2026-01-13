# Dot Groups Feature Documentation

The dot groups feature enables RDM experiments with two dot populations that can differ in color, coherence, direction, and (optionally) speed.

Note: the builder currently exports dot-groups components in a *flat two-group format* (see [inputs_outputs.md](inputs_outputs.md)). Some older nested `groups.group_definitions` examples in this document are legacy/conceptual.

- **Competing motion** (different directions/coherences)
- **Feature-based attention** (attend to specific colors/sizes)
- **Spatial attention** (clustered vs distributed dots)
- **Motion segregation** (by color, size, or speed)
- **Dual-task paradigms** (track multiple targets)

## Basic Concept

Instead of a single homogeneous dot population, you can define multiple **groups** of dots, each with:
- **Percentage allocation** (e.g., 50% blue, 50% red)
- **Unique visual properties** (color, size, opacity)
- **Independent motion parameters** (coherence, direction, speed)
- **Spatial distribution** (random, clustered, uniform)
- **Layer ordering** (z-order for overlapping dots)

## Current exported shape

```json
{
  "type": "rdm-dot-groups",
  "group_1_percentage": 50,
  "group_1_color": "#0066FF",
  "group_1_coherence": 0.2,
  "group_1_direction": 180,

  "group_2_percentage": 50,
  "group_2_color": "#FF0066",
  "group_2_coherence": 0.8,
  "group_2_direction": 0
}
```

## What to use (current builder)

The dot-groups editor/export currently focuses on two groups and these flat fields:

- Group 1: `group_1_percentage`, `group_1_color`, `group_1_coherence`, optional `group_1_direction`, optional `group_1_speed`
- Group 2: `group_2_percentage`, `group_2_color`, `group_2_coherence`, optional `group_2_direction`, optional `group_2_speed`

If you set a response target group and cue border options in the UI, those export under `response_parameters_override` (not as top-level dot-group fields).

---

## Legacy notes

The remainder of this document contains older conceptual examples (e.g., nested `groups.group_definitions`) that do not match the current builder export shape.

## Group Properties

### Visual Properties
- **`color`**: Hex color code (e.g., "#FF0066")
- **`size`**: Dot diameter in pixels (1-20)
- **`opacity`**: Transparency level (0.0-1.0) *[frame-based only]*

### Motion Properties
- **`coherence_override`**: Whether to use group-specific coherence
- **`coherence`**: Motion coherence (0.0-1.0) when override is true
- **`direction_override`**: Whether to use group-specific direction  
- **`direction`**: Motion direction in degrees (0-360) when override is true
- **`speed_override`**: Whether to use group-specific speed
- **`speed`**: Motion speed in pixels/frame when override is true

### Spatial Distribution
- **`random`**: Uniform random distribution across aperture
- **`clustered`**: Concentrated around specified center point
- **`uniform`**: Regular grid pattern

#### Clustered Distribution Parameters
```json
{
  "distribution": "clustered",
  "cluster_center": [400, 300],
  "cluster_radius": 100
}
```

### Layer Management
- **`z_order`**: Rendering layer (0=back, higher=front)
- **`overlap_handling`**: How to handle overlapping dots
  - `"independent"`: Groups render independently
  - `"priority_based"`: Higher z-order dots hide lower ones
  - `"size_priority"`: Larger dots hide smaller ones

## Use Case Examples

### 1. Competing Motion Directions
**Scenario**: 50% blue dots moving left (low coherence) vs 50% red dots moving right (high coherence)

```json
{
  "group_definitions": [
    {
      "group_id": "blue_weak_left",
      "percentage": 50.0,
      "color": "#0066FF",
      "motion_properties": {
        "coherence": 0.2,
        "direction": 180
      }
    },
    {
      "group_id": "red_strong_right", 
      "percentage": 50.0,
      "color": "#FF0066",
      "motion_properties": {
        "coherence": 0.8,
        "direction": 0
      }
    }
  ]
}
```

### 2. Spatial Attention Task
**Scenario**: 30% green target dots (clustered) vs 70% gray distractor noise

```json
{
  "group_definitions": [
    {
      "group_id": "target_cluster",
      "percentage": 30.0,
      "color": "#00FF00",
      "size": 6,
      "motion_properties": {
        "coherence": 0.7,
        "direction": 45
      },
      "distribution": "clustered",
      "cluster_center": [300, 200],
      "cluster_radius": 80,
      "z_order": 2
    },
    {
      "group_id": "distractor_noise",
      "percentage": 70.0, 
      "color": "#CCCCCC",
      "size": 3,
      "motion_properties": {
        "coherence": 0.0
      },
      "distribution": "random",
      "z_order": 0
    }
  ]
}
```

### 3. Feature-Based Attention
**Scenario**: Large fast dots vs small slow dots - attend to size feature

```json
{
  "group_definitions": [
    {
      "group_id": "large_fast",
      "percentage": 50.0,
      "color": "#FF8800",
      "size": 8,
      "motion_properties": {
        "coherence": 0.3,
        "speed": 10
      }
    },
    {
      "group_id": "small_slow",
      "percentage": 50.0,
      "color": "#8800FF",
      "size": 2, 
      "motion_properties": {
        "coherence": 0.7,
        "speed": 3
      }
    }
  ]
}
```

### 4. Three-Way Competition
**Scenario**: Red up, blue down, yellow right - report strongest direction

```json
{
  "group_definitions": [
    {
      "group_id": "red_up",
      "percentage": 33.3,
      "color": "#FF0000",
      "motion_properties": { "coherence": 0.4, "direction": 90 }
    },
    {
      "group_id": "blue_down", 
      "percentage": 33.3,
      "color": "#0000FF",
      "motion_properties": { "coherence": 0.6, "direction": 270 }
    },
    {
      "group_id": "yellow_right",
      "percentage": 33.4,
      "color": "#FFFF00", 
      "motion_properties": { "coherence": 0.5, "direction": 0 }
    }
  ]
}
```

## UI Implementation

### Enabling Dot Groups
1. Check **"Enable Multiple Dot Groups"** in the Dot Configuration section
2. Click **"Add Group"** to create new groups
3. Configure each group's properties:
   - **Percentage**: Allocation of total dots
   - **Color**: Visual appearance
   - **Motion parameters**: Coherence, direction, speed
   - **Distribution**: Random, clustered, or uniform
   - **Z-order**: Layer priority

### Automatic Features
- **Percentage balancing**: Automatically distributes percentages equally
- **Color variety**: Assigns different default colors to each group
- **Parameter validation**: Ensures percentages sum to 100%
- **Cluster visualization**: Shows cluster settings when "clustered" is selected

## Data Collection Implications

### Standard RDM Data
```json
{
  "trial_id": "single_group",
  "coherence": 0.5,
  "direction": 0,
  "rt": 789,
  "accuracy": 1
}
```

### Dot Groups Data
```json
{
  "trial_id": "dual_groups",
  "groups": [
    {"id": "blue_dots", "coherence": 0.2, "direction": 180, "percentage": 50},
    {"id": "red_dots", "coherence": 0.8, "direction": 0, "percentage": 50}
  ],
  "dominant_group": "red_dots",
  "rt": 892,
  "accuracy": 1,
  "response_strategy": "follow_strongest"
}
```

## Validation Rules

### Required
- **Percentage sum**: All group percentages must sum to 100%
- **Unique IDs**: Each group must have a unique group_id
- **Valid colors**: All colors must be valid hex codes
- **Parameter ranges**: Coherence (0-1), direction (0-360), size (1-20)

### Recommended
- **Color contrast**: Sufficient contrast between groups for visibility
- **Cluster boundaries**: Clustered dots should fit within aperture
- **Balanced allocations**: Avoid extremely small group percentages (<5%)

## Performance Considerations

### Computational Cost
- **Linear scaling**: Cost increases with number of groups
- **Clustering overhead**: Clustered distribution requires more computation
- **Rendering layers**: Multiple z-orders add rendering complexity

### Optimization Tips
- **Limit groups**: 2-4 groups for most experiments
- **Simple distributions**: Use random over clustered when possible
- **Efficient colors**: Avoid similar colors that require anti-aliasing

## Example Files

- [`rdm_dot_groups_demo.json`](../examples/rdm_dot_groups_demo.json): Comprehensive demo with 4 different group configurations
- [`rdm_frame_control_schema.json`](../examples/rdm_frame_control_schema.json): Frame-by-frame dot groups with dynamic parameters
- [`rdm_trial_control_schema.json`](../examples/rdm_trial_control_schema.json): Trial-based dot groups with fixed parameters

This feature dramatically expands the experimental possibilities for RDM tasks while maintaining compatibility with standard single-group experiments.