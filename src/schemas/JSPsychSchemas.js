/**
 * jsPsych Schema Validation
 * 
 * Validates JSON configurations against jsPsych parameter types and experimental psychology standards
 * Ensures compatibility with jsPsych plugins and JATOS deployment
 */

class JSPsychSchemas {
    constructor() {
        console.log('[SchemaDebug] Loaded JSPsychSchemas.js build: 20260114-3');
        this.parameterTypes = this.initializeParameterTypes();
        this.pluginSchemas = this.initializePluginSchemas();
        this.experimentSchemas = this.initializeExperimentSchemas();
        
        // Initialize RDM task schema for RDM-specific validation
        try {
            this.rdmSchema = new RDMTaskSchema();
        } catch (error) {
            console.warn('RDMTaskSchema not available:', error.message);
            this.rdmSchema = null;
        }
    }

    /**
     * Initialize jsPsych parameter types
     */
    initializeParameterTypes() {
        return {
            AUDIO: 'AUDIO',
            BOOL: 'BOOL',
            COLOR: 'COLOR',
            COMPLEX: 'COMPLEX',
            FLOAT: 'FLOAT',
            FUNCTION: 'FUNCTION',
            HTML_STRING: 'HTML_STRING',
            IMAGE: 'IMAGE',
            INT: 'INT',
            KEY: 'KEY',
            KEYS: 'KEYS',
            OBJECT: 'OBJECT',
            SELECT: 'SELECT',
            STRING: 'STRING',
            TIMELINE: 'TIMELINE',
            VIDEO: 'VIDEO'
        };
    }

    /**
     * Initialize plugin schemas based on jsPsych plugins
     */
    initializePluginSchemas() {
        return {
            'block': {
                name: 'block',
                description: 'Generate many trials from parameter windows/ranges (compact representation for large experiments)',
                parameters: {
                    block_component_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'rdm-trial',
                        options: ['rdm-trial', 'rdm-practice', 'rdm-adaptive', 'rdm-dot-groups'],
                        required: true,
                        description: 'What component type this block generates'
                    },
                    block_length: {
                        type: this.parameterTypes.INT,
                        default: 100,
                        required: true,
                        description: 'Number of trials/frames this block represents'
                    },
                    sampling_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'per-trial',
                        options: ['per-trial', 'per-block'],
                        description: 'per-trial samples new parameters each trial; per-block samples once and reuses'
                    },
                    seed: {
                        type: this.parameterTypes.STRING,
                        default: '',
                        description: 'Optional random seed (blank = no seed)'
                    },

                    // Dot color (used for rdm-trial / rdm-practice / rdm-adaptive; dot-groups uses per-group colors)
                    dot_color: {
                        type: this.parameterTypes.COLOR,
                        default: '#FFFFFF',
                        description: 'Dot color (hex). For dot-groups blocks, set Group 1/2 colors below.'
                    },

                    transition_duration: {
                        type: this.parameterTypes.INT,
                        default: 500,
                        description: 'Continuous mode only: duration of the transition to the next condition (ms)'
                    },
                    transition_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'both',
                        options: ['both', 'color', 'speed'],
                        description: 'Continuous mode only: transition type (color = gradient, speed = slow/fast, both = combine)'
                    },

                    // Response override (per-block)
                    // Uses the same parameter names as per-component overrides so TimelineBuilder conditional UI works.
                    response_device: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'keyboard', 'mouse', 'touch', 'voice', 'custom'],
                        description: 'Override response device for this block (inherit uses experiment defaults)'
                    },
                    response_keys: {
                        type: this.parameterTypes.STRING,
                        default: '',
                        description: 'Comma-separated keys for keyboard responses (blank = inherit)'
                    },
                    require_response_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'true', 'false'],
                        description: 'Override require_response for this block'
                    },
                    end_condition_on_response_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'true', 'false'],
                        description: 'Continuous mode only: end the current condition immediately after a response'
                    },
                    feedback_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'off', 'corner-text', 'arrow', 'custom'],
                        description: 'Override response feedback for this block (inherit uses experiment defaults)'
                    },
                    feedback_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 500,
                        description: 'Feedback duration (ms) when feedback_mode is enabled (corner-text/arrow/custom)'
                    },
                    mouse_segments: {
                        type: this.parameterTypes.INT,
                        default: 2,
                        description: 'Mouse response: number of aperture segments (used when response_device = mouse)'
                    },
                    mouse_start_angle_deg: {
                        type: this.parameterTypes.FLOAT,
                        default: 0,
                        description: 'Mouse response: segment start angle offset in degrees (0 = right)'
                    },
                    mouse_selection_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'click',
                        options: ['click', 'hover'],
                        description: 'Mouse response: how a segment selection is registered'
                    },

                    // rdm-trial windows
                    coherence_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.2,
                        blockTarget: 'rdm-trial',
                        description: 'RDM Trial: coherence range min (0-1)'
                    },
                    coherence_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.8,
                        blockTarget: 'rdm-trial',
                        description: 'RDM Trial: coherence range max (0-1)'
                    },
                    direction_options: {
                        type: this.parameterTypes.STRING,
                        default: '0,180',
                        blockTarget: 'rdm-trial',
                        description: 'RDM Trial: comma-separated directions to sample from (degrees; 0=right, 90=down, 180=left, 270=up)'
                    },
                    speed_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 4,
                        blockTarget: 'rdm-trial',
                        description: 'RDM Trial: speed range min'
                    },
                    speed_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 10,
                        blockTarget: 'rdm-trial',
                        description: 'RDM Trial: speed range max'
                    },

                    // rdm-practice windows
                    practice_coherence_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.5,
                        blockTarget: 'rdm-practice',
                        description: 'RDM Practice: coherence range min (0-1)'
                    },
                    practice_coherence_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.9,
                        blockTarget: 'rdm-practice',
                        description: 'RDM Practice: coherence range max (0-1)'
                    },
                    practice_direction_options: {
                        type: this.parameterTypes.STRING,
                        default: '0,180',
                        blockTarget: 'rdm-practice',
                        description: 'RDM Practice: comma-separated directions to sample from (degrees; 0=right, 90=down, 180=left, 270=up)'
                    },
                    practice_feedback_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 750,
                        blockTarget: 'rdm-practice',
                        description: 'RDM Practice: feedback duration min (ms)'
                    },
                    practice_feedback_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 1500,
                        blockTarget: 'rdm-practice',
                        description: 'RDM Practice: feedback duration max (ms)'
                    },

                    // rdm-adaptive windows
                    adaptive_initial_coherence_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.05,
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: initial coherence range min (0-1)'
                    },
                    adaptive_initial_coherence_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.2,
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: initial coherence range max (0-1)'
                    },
                    adaptive_algorithm: {
                        type: this.parameterTypes.SELECT,
                        default: 'quest',
                        options: ['quest', 'staircase', 'simple'],
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: adaptive algorithm'
                    },
                    adaptive_step_size_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.02,
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: step size range min'
                    },
                    adaptive_step_size_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.08,
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: step size range max'
                    },
                    adaptive_target_performance: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.82,
                        blockTarget: 'rdm-adaptive',
                        description: 'RDM Adaptive: target performance (fixed)'
                    },

                    // rdm-dot-groups windows
                    group_1_color: {
                        type: this.parameterTypes.COLOR,
                        default: '#FF0066',
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 dot color (hex)'
                    },
                    group_2_color: {
                        type: this.parameterTypes.COLOR,
                        default: '#0066FF',
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 dot color (hex)'
                    },
                    response_target_group: {
                        type: this.parameterTypes.SELECT,
                        default: 'none',
                        options: ['none', 'group_1', 'group_2'],
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: which dot group the participant should respond to'
                    },
                    cue_border_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'off',
                        options: ['off', 'target-group-color', 'custom'],
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: aperture border cue mode'
                    },
                    cue_border_color: {
                        type: this.parameterTypes.COLOR,
                        default: '#FFFFFF',
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: cue border color when cue_border_mode = custom'
                    },
                    cue_border_width: {
                        type: this.parameterTypes.INT,
                        default: 4,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: cue border width in pixels'
                    },
                    group_1_percentage_min: {
                        type: this.parameterTypes.INT,
                        default: 40,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 percentage min (0-100)'
                    },
                    group_1_percentage_max: {
                        type: this.parameterTypes.INT,
                        default: 60,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 percentage max (0-100)'
                    },
                    group_1_coherence_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.1,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 coherence min (0-1)'
                    },
                    group_1_coherence_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.5,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 coherence max (0-1)'
                    },
                    group_1_direction_options: {
                        type: this.parameterTypes.STRING,
                        default: '0,180',
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 direction options (degrees; 0=right, 90=down, 180=left, 270=up)'
                    },
                    group_1_speed_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 4,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 speed min'
                    },
                    group_1_speed_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 10,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 1 speed max'
                    },
                    group_2_coherence_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.5,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 coherence min (0-1)'
                    },
                    group_2_coherence_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 0.9,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 coherence max (0-1)'
                    },
                    group_2_direction_options: {
                        type: this.parameterTypes.STRING,
                        default: '0,180',
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 direction options (degrees; 0=right, 90=down, 180=left, 270=up)'
                    },
                    group_2_speed_min: {
                        type: this.parameterTypes.FLOAT,
                        default: 4,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 speed min'
                    },
                    group_2_speed_max: {
                        type: this.parameterTypes.FLOAT,
                        default: 10,
                        blockTarget: 'rdm-dot-groups',
                        description: 'RDM Groups: group 2 speed max'
                    }
                },
                data: {}
            },
            'instructions': {
                name: 'instructions',
                description: 'Display instructions to participants',
                parameters: {
                    pages: { 
                        type: this.parameterTypes.HTML_STRING, 
                        array: true, 
                        required: true,
                        description: 'Array of instruction pages to display'
                    },
                    key_forward: { 
                        type: this.parameterTypes.KEY, 
                        default: 'ArrowRight',
                        description: 'Key to advance to next page'
                    },
                    key_backward: { 
                        type: this.parameterTypes.KEY, 
                        default: 'ArrowLeft',
                        description: 'Key to go back to previous page'
                    },
                    allow_backward: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'Allow participants to go back'
                    },
                    allow_keys: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'Allow keyboard navigation'
                    },
                    show_clickable_nav: { 
                        type: this.parameterTypes.BOOL, 
                        default: false,
                        description: 'Show clickable navigation buttons'
                    },
                    button_label_previous: { 
                        type: this.parameterTypes.STRING, 
                        default: 'Previous',
                        description: 'Text for previous button'
                    },
                    button_label_next: { 
                        type: this.parameterTypes.STRING, 
                        default: 'Next',
                        description: 'Text for next button'
                    }
                },
                data: {
                    view_history: { type: this.parameterTypes.OBJECT },
                    rt: { type: this.parameterTypes.INT }
                }
            },

            'html-keyboard-response': {
                name: 'html-keyboard-response',
                description: 'Display HTML stimulus and collect keyboard response',
                parameters: {
                    stimulus: { 
                        type: this.parameterTypes.HTML_STRING, 
                        required: true,
                        description: 'HTML content to display'
                    },
                    choices: { 
                        type: this.parameterTypes.KEYS, 
                        default: 'ALL_KEYS',
                        description: 'Keys that will be accepted as responses'
                    },
                    prompt: { 
                        type: this.parameterTypes.HTML_STRING, 
                        default: null,
                        description: 'Prompt text displayed below stimulus'
                    },
                    stimulus_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'How long to show stimulus (ms)'
                    },
                    trial_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Maximum time allowed for response (ms)'
                    },
                    response_ends_trial: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'End trial immediately after response'
                    }
                },
                data: {
                    stimulus: { type: this.parameterTypes.HTML_STRING },
                    response: { type: this.parameterTypes.KEY },
                    rt: { type: this.parameterTypes.INT },
                    correct: { type: this.parameterTypes.BOOL, optional: true }
                }
            },

            'image-keyboard-response': {
                name: 'image-keyboard-response',
                description: 'Display image stimulus and collect keyboard response',
                parameters: {
                    stimulus: { 
                        type: this.parameterTypes.IMAGE, 
                        required: true,
                        description: 'Path to image file'
                    },
                    stimulus_height: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Height of image in pixels'
                    },
                    stimulus_width: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Width of image in pixels'
                    },
                    maintain_aspect_ratio: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'Maintain image aspect ratio'
                    },
                    choices: { 
                        type: this.parameterTypes.KEYS, 
                        default: 'ALL_KEYS',
                        description: 'Keys that will be accepted as responses'
                    },
                    prompt: { 
                        type: this.parameterTypes.HTML_STRING, 
                        default: null,
                        description: 'Prompt text displayed below stimulus'
                    },
                    stimulus_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'How long to show stimulus (ms)'
                    },
                    trial_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Maximum time allowed for response (ms)'
                    },
                    response_ends_trial: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'End trial immediately after response'
                    }
                },
                data: {
                    stimulus: { type: this.parameterTypes.IMAGE },
                    response: { type: this.parameterTypes.KEY },
                    rt: { type: this.parameterTypes.INT },
                    correct: { type: this.parameterTypes.BOOL, optional: true }
                }
            },

            'html-button-response': {
                name: 'html-button-response',
                description: 'Display HTML stimulus and collect button response',
                parameters: {
                    stimulus: { 
                        type: this.parameterTypes.HTML_STRING, 
                        required: true,
                        description: 'HTML content to display'
                    },
                    choices: { 
                        type: this.parameterTypes.STRING, 
                        array: true, 
                        required: true,
                        description: 'Labels for buttons'
                    },
                    button_html: { 
                        type: this.parameterTypes.FUNCTION, 
                        default: null,
                        description: 'Custom HTML for buttons'
                    },
                    prompt: { 
                        type: this.parameterTypes.HTML_STRING, 
                        default: null,
                        description: 'Prompt text displayed below stimulus'
                    },
                    stimulus_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'How long to show stimulus (ms)'
                    },
                    trial_duration: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Maximum time allowed for response (ms)'
                    },
                    button_layout: { 
                        type: this.parameterTypes.STRING, 
                        default: 'grid',
                        description: 'How to arrange buttons'
                    },
                    grid_rows: { 
                        type: this.parameterTypes.INT, 
                        default: 1,
                        description: 'Number of rows in button grid'
                    },
                    grid_columns: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Number of columns in button grid'
                    },
                    response_ends_trial: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'End trial immediately after response'
                    }
                },
                data: {
                    stimulus: { type: this.parameterTypes.HTML_STRING },
                    response: { type: this.parameterTypes.INT },
                    rt: { type: this.parameterTypes.INT },
                    button_pressed: { type: this.parameterTypes.STRING },
                    correct: { type: this.parameterTypes.BOOL, optional: true }
                }
            },

            'preload': {
                name: 'preload',
                description: 'Preload images, audio, and video files',
                parameters: {
                    auto_preload: { 
                        type: this.parameterTypes.BOOL, 
                        default: false,
                        description: 'Automatically detect files to preload'
                    },
                    trials: { 
                        type: this.parameterTypes.TIMELINE, 
                        default: [],
                        description: 'Timeline to scan for files to preload'
                    },
                    images: { 
                        type: this.parameterTypes.IMAGE, 
                        array: true, 
                        default: [],
                        description: 'Array of image files to preload'
                    },
                    audio: { 
                        type: this.parameterTypes.AUDIO, 
                        array: true, 
                        default: [],
                        description: 'Array of audio files to preload'
                    },
                    video: { 
                        type: this.parameterTypes.VIDEO, 
                        array: true, 
                        default: [],
                        description: 'Array of video files to preload'
                    },
                    message: { 
                        type: this.parameterTypes.HTML_STRING, 
                        default: null,
                        description: 'Message to show during preloading'
                    },
                    show_progress_bar: { 
                        type: this.parameterTypes.BOOL, 
                        default: true,
                        description: 'Show preloading progress bar'
                    },
                    continue_after_error: { 
                        type: this.parameterTypes.BOOL, 
                        default: false,
                        description: 'Continue if file fails to load'
                    },
                    max_load_time: { 
                        type: this.parameterTypes.INT, 
                        default: null,
                        description: 'Maximum time to spend loading files (ms)'
                    }
                },
                data: {
                    success: { type: this.parameterTypes.BOOL },
                    timeout: { type: this.parameterTypes.BOOL },
                    failed_images: { type: this.parameterTypes.STRING, array: true },
                    failed_audio: { type: this.parameterTypes.STRING, array: true },
                    failed_video: { type: this.parameterTypes.STRING, array: true }
                }
            }
        };
    }

    /**
     * Initialize experiment-level schemas
     */
    initializeExperimentSchemas() {
        return {
            'trial-based': {
                required_fields: ['timeline'],
                optional_fields: [
                    'num_trials', 'default_iti', 'randomize_order', 
                    'on_finish', 'on_trial_start', 'on_trial_finish',
                    'data_collection', 'experiment_type'
                ],
                validation_rules: {
                    timeline: { 
                        type: 'array', 
                        min_length: 1,
                        description: 'Must contain at least one trial'
                    },
                    num_trials: { 
                        type: 'number', 
                        min: 1,
                        description: 'Must be a positive integer'
                    },
                    default_iti: { 
                        type: 'number', 
                        min: 0,
                        description: 'Inter-trial interval in milliseconds'
                    }
                }
            },

            'continuous': {
                required_fields: ['timeline', 'frame_rate'],
                optional_fields: [
                    'duration', 'update_interval', 'on_frame_update',
                    'data_collection', 'experiment_type'
                ],
                validation_rules: {
                    timeline: { 
                        type: 'array', 
                        min_length: 1,
                        description: 'Must contain at least one component'
                    },
                    frame_rate: { 
                        type: 'number', 
                        min: 1, 
                        max: 120,
                        description: 'Frame rate between 1-120 fps'
                    },
                    duration: { 
                        type: 'number', 
                        min: 1,
                        description: 'Duration in seconds'
                    },
                    update_interval: { 
                        type: 'number', 
                        min: 1,
                        description: 'Update interval in milliseconds'
                    }
                }
            },

            'rdm': {
                required_fields: ['timeline'],
                optional_fields: [
                    'num_trials', 'default_iti', 'randomize_order', 
                    'stimulus_width', 'stimulus_height', 'background_color',
                    'on_finish', 'on_trial_start', 'on_trial_finish',
                    'data_collection', 'experiment_type'
                ],
                validation_rules: {
                    timeline: { 
                        type: 'array', 
                        min_length: 1,
                        description: 'Must contain at least one RDM trial'
                    },
                    num_trials: { 
                        type: 'number', 
                        min: 1,
                        description: 'Must be a positive integer'
                    },
                    stimulus_width: { 
                        type: 'number', 
                        min: 50, 
                        max: 800,
                        description: 'Stimulus aperture width in pixels'
                    },
                    stimulus_height: { 
                        type: 'number', 
                        min: 50, 
                        max: 800,
                        description: 'Stimulus aperture height in pixels'
                    },
                    background_color: { 
                        type: 'string',
                        description: 'Background color in hex format'
                    }
                }
            },

            'custom': {
                required_fields: ['timeline'],
                optional_fields: [
                    'experiment_type', 'data_collection', 
                    'on_finish', 'on_trial_start', 'on_trial_finish'
                ],
                validation_rules: {
                    timeline: { 
                        type: 'array', 
                        min_length: 1,
                        description: 'Must contain at least one component'
                    }
                }
            }
        };
    }

    /**
     * Validate a complete experiment configuration
     */
    validate(config) {
        const errors = [];
        const warnings = [];

        try {
            // Check experiment type
            if (!config.experiment_type) {
                errors.push('Missing required field: experiment_type');
            } else if (!this.experimentSchemas[config.experiment_type]) {
                errors.push(`Invalid experiment type: ${config.experiment_type}`);
            }

            // Validate experiment-specific requirements
            if (config.experiment_type && this.experimentSchemas[config.experiment_type]) {
                const schema = this.experimentSchemas[config.experiment_type];
                
                // Check required fields
                for (const field of schema.required_fields) {
                    if (!(field in config)) {
                        errors.push(`Missing required field: ${field}`);
                    }
                }

                // Validate field values
                for (const [field, rules] of Object.entries(schema.validation_rules)) {
                    if (field in config) {
                        const validation = this.validateField(config[field], rules, field);
                        if (!validation.valid) {
                            errors.push(...validation.errors);
                        }
                        warnings.push(...validation.warnings);
                    }
                }
            }

            // Validate timeline
            if (config.timeline) {
                const timelineValidation = this.validateTimeline(config.timeline);
                errors.push(...timelineValidation.errors);
                warnings.push(...timelineValidation.warnings);
            }

            // Validate data collection settings
            if (config.data_collection) {
                const dcValidation = this.validateDataCollection(config.data_collection);
                errors.push(...dcValidation.errors);
                warnings.push(...dcValidation.warnings);
            }

        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate individual field against rules
     */
    validateField(value, rules, fieldName) {
        const errors = [];
        const warnings = [];

        // Type checking
        if (rules.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== rules.type) {
                errors.push(`${fieldName} should be ${rules.type}, got ${actualType}`);
            }
        }

        // Range checking for numbers
        if (typeof value === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${fieldName} should be >= ${rules.min}, got ${value}`);
            }
            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${fieldName} should be <= ${rules.max}, got ${value}`);
            }
        }

        // Array length checking
        if (Array.isArray(value)) {
            if (rules.min_length !== undefined && value.length < rules.min_length) {
                errors.push(`${fieldName} should have at least ${rules.min_length} items, got ${value.length}`);
            }
            if (rules.max_length !== undefined && value.length > rules.max_length) {
                errors.push(`${fieldName} should have at most ${rules.max_length} items, got ${value.length}`);
            }
        }

        return { valid: errors.length === 0, errors, warnings };
    }

    /**
     * Validate timeline components
     */
    validateTimeline(timeline) {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(timeline)) {
            errors.push('Timeline must be an array');
            return { errors, warnings };
        }

        timeline.forEach((trial, index) => {
            // Check if trial has a type
            if (!trial.type) {
                errors.push(`Trial ${index}: Missing 'type' field`);
                return;
            }

            // Resolve a schema for this component type.
            // For RDM components, prefer generateRDMPluginSchema() (current export shape).
            const schema = this.getPluginSchema(trial.type);
            if (!schema) {
                warnings.push(`Trial ${index}: No schema available for plugin '${trial.type}'`);
                return;
            }

            // Validate against plugin schema
            const pluginValidation = this.validateTrialAgainstSchema(trial, schema, index);
            errors.push(...pluginValidation.errors);
            warnings.push(...pluginValidation.warnings);
        });

        return { errors, warnings };
    }

    /**
     * Validate trial against plugin schema
     */
    validateTrialAgainstSchema(trial, schema, trialIndex) {
        const errors = [];
        const warnings = [];

        const trialForValidation = this.normalizeTrialForValidation(trial, schema);

        // Check required parameters
        for (const [paramName, paramDef] of Object.entries(schema.parameters)) {
            if (paramDef.required && !(paramName in trialForValidation)) {
                errors.push(`Trial ${trialIndex}: Missing required parameter '${paramName}'`);
            }
        }

        // Validate parameter types
        for (const [paramName, value] of Object.entries(trialForValidation)) {
            if (paramName === 'type') continue; // Skip type field
            
            if (schema.parameters[paramName]) {
                const paramDef = schema.parameters[paramName];
                const validation = this.validateParameter(value, paramDef, paramName, trialIndex);
                errors.push(...validation.errors);
                warnings.push(...validation.warnings);
            } else {
                // Avoid noisy warnings for known "export-only" fields.
                const isExportOnly = (
                    trial.type === 'block' &&
                    ['component_type', 'length', 'parameter_windows', 'parameter_values', 'response_parameters_override', 'seed'].includes(paramName)
                );
                const isRdmExportOnly = (
                    trial.type && trial.type.startsWith('rdm-') &&
                    (paramName === 'response_parameters_override')
                );
                if (!isExportOnly && !isRdmExportOnly) {
                    warnings.push(`Trial ${trialIndex}: Unknown parameter '${paramName}' for plugin '${trial.type}'`);
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Normalizes known exported shapes to the editor-schema parameter names
     * so validation doesn't fail due to naming differences.
     */
    normalizeTrialForValidation(trial, schema) {
        if (!trial || typeof trial !== 'object') {
            return trial;
        }

        // Shallow clone so we don't mutate the exported config.
        const normalized = { ...trial };

        // Blocks export as { component_type, length, ... } but the editor schema uses
        // { block_component_type, block_length, ... }.
        if (normalized.type === 'block') {
            if (normalized.component_type !== undefined && normalized.block_component_type === undefined) {
                normalized.block_component_type = normalized.component_type;
            }
            if (normalized.length !== undefined && normalized.block_length === undefined) {
                normalized.block_length = normalized.length;
            }
        }

        // Future-proofing: if we ever validate against a schema that expects block_* but we have export names.
        if (schema?.name === 'block') {
            if (normalized.component_type !== undefined && normalized.block_component_type === undefined) {
                normalized.block_component_type = normalized.component_type;
            }
            if (normalized.length !== undefined && normalized.block_length === undefined) {
                normalized.block_length = normalized.length;
            }
        }

        return normalized;
    }

    /**
     * Validate parameter against jsPsych parameter definition
     */
    validateParameter(value, paramDef, paramName, trialIndex) {
        const errors = [];
        const warnings = [];

        // Check if array is required
        if (paramDef.array && !Array.isArray(value)) {
            errors.push(`Trial ${trialIndex}: Parameter '${paramName}' should be an array`);
            return { errors, warnings };
        }

        // For non-array values, validate the type
        const valuesToCheck = paramDef.array ? value : [value];
        
        for (const val of valuesToCheck) {
            if (!this.isValidParameterType(val, paramDef.type)) {
                errors.push(`Trial ${trialIndex}: Parameter '${paramName}' has invalid type. Expected ${paramDef.type}`);
            }
        }

        return { errors, warnings };
    }

    /**
     * Check if value matches jsPsych parameter type
     */
    isValidParameterType(value, expectedType) {
        switch (expectedType) {
            case this.parameterTypes.STRING:
                return typeof value === 'string';
            
            case this.parameterTypes.HTML_STRING:
                return typeof value === 'string';
            
            case this.parameterTypes.INT:
                return typeof value === 'number' && Number.isInteger(value);
            
            case this.parameterTypes.FLOAT:
                return typeof value === 'number';
            
            case this.parameterTypes.BOOL:
                return typeof value === 'boolean';
            
            case this.parameterTypes.FUNCTION:
                return typeof value === 'function' || typeof value === 'string';
            
            case this.parameterTypes.KEY:
                return typeof value === 'string';
            
            case this.parameterTypes.KEYS:
                return typeof value === 'string' || Array.isArray(value);
            
            case this.parameterTypes.IMAGE:
            case this.parameterTypes.AUDIO:
            case this.parameterTypes.VIDEO:
                return typeof value === 'string';
            
            case this.parameterTypes.OBJECT:
                return typeof value === 'object' && value !== null;
            
            case this.parameterTypes.TIMELINE:
                return Array.isArray(value);
            
            case this.parameterTypes.COMPLEX:
                return true; // Accept any type for complex parameters
            
            default:
                return true; // Unknown types are accepted
        }
    }

    /**
     * Validate data collection configuration
     */
    validateDataCollection(dataCollection) {
        const errors = [];
        const warnings = [];

        // Keep this aligned with the UI checkboxes in index.html.
        // Include mouse-tracking for backward compatibility with older configs.
        const validModalities = [
            'reaction-time',
            'accuracy',
            'correctness',
            'eye-tracking',
            'mouse-tracking'
        ];

        for (const [modality, enabled] of Object.entries(dataCollection)) {
            if (!validModalities.includes(modality)) {
                warnings.push(`Unknown data collection modality: ${modality}`);
                continue;
            }

            if (typeof enabled !== 'boolean') {
                errors.push(`Data collection modality '${modality}' should be boolean, got ${typeof enabled}`);
            }
        }

        // Don’t hard-error if none selected; allow "no extra collection" configurations
        const anySelected = validModalities.some(m => dataCollection[m] === true);
        if (!anySelected) {
            warnings.push('No data collection modalities selected');
        }

        return { errors, warnings };
    }

    /**
     * Get schema information for a specific plugin
     */
    getPluginSchema(pluginName) {
        // Handle RDM components directly - don't depend on external RDMTaskSchema
        if (pluginName && pluginName.startsWith('rdm-')) {
            return this.generateRDMPluginSchema(pluginName);
        }
        
        return this.pluginSchemas[pluginName] || null;
    }

    /**
     * Generate plugin schema format for RDM components
     */
    generateRDMPluginSchema(componentType) {
        const responseOverrideParameters = {
            response_device: {
                type: this.parameterTypes.SELECT,
                default: 'inherit',
                options: ['inherit', 'keyboard', 'mouse', 'touch', 'voice', 'custom'],
                description: 'Override response device for this component (inherit uses experiment defaults)'
            },
            response_keys: {
                type: this.parameterTypes.STRING,
                default: '',
                description: 'Comma-separated keys for keyboard responses (blank = inherit)'
            },
            require_response_mode: {
                type: this.parameterTypes.SELECT,
                default: 'inherit',
                options: ['inherit', 'true', 'false'],
                description: 'Override require_response for this component'
            },
            end_condition_on_response_mode: {
                type: this.parameterTypes.SELECT,
                default: 'inherit',
                options: ['inherit', 'true', 'false'],
                description: 'Continuous mode only: end the current condition immediately after a response'
            },
            feedback_mode: {
                type: this.parameterTypes.SELECT,
                default: 'inherit',
                options: ['inherit', 'off', 'corner-text', 'arrow', 'custom'],
                description: 'Override response feedback for this component (inherit uses experiment defaults)'
            },
            feedback_duration_ms: {
                type: this.parameterTypes.INT,
                default: 500,
                description: 'Feedback duration (ms) when feedback_mode is enabled (corner-text/arrow/custom)'
            },
            mouse_segments: {
                type: this.parameterTypes.INT,
                default: 2,
                description: 'Mouse response: number of aperture segments (used when response_device = mouse)'
            },
            mouse_start_angle_deg: {
                type: this.parameterTypes.FLOAT,
                default: 0,
                description: 'Mouse response: segment start angle offset in degrees (0 = right)'
            },
            mouse_selection_mode: {
                type: this.parameterTypes.SELECT,
                default: 'click',
                options: ['click', 'hover'],
                description: 'Mouse response: how a segment selection is registered'
            }
        };

        const baseParameters = {
            coherence: { 
                type: this.parameterTypes.FLOAT, 
                default: 0.5, 
                required: true,
                description: 'Motion coherence (0-1)'
            },
            direction: { 
                type: this.parameterTypes.FLOAT, 
                default: 0, 
                required: true,
                description: 'Motion direction in degrees (0-359; 0=right, 90=down, 180=left, 270=up)'
            },
            speed: { 
                type: this.parameterTypes.FLOAT, 
                default: 6,
                // Not required because the builder also provides experiment-wide motion defaults.
                required: false,
                description: 'Dot movement speed'
            },
            stimulus_duration: { 
                type: this.parameterTypes.INT, 
                default: 1500,
                // Not required because the builder also provides experiment-wide timing defaults.
                required: false,
                description: 'Stimulus duration in milliseconds'
            },
            trial_duration: { 
                type: this.parameterTypes.INT, 
                default: 3000, 
                description: 'Duration of this trial condition in continuous mode (ms)'
            },
            transition_duration: { 
                type: this.parameterTypes.INT, 
                default: 500,
                description: 'Duration of smooth transition to next condition (ms)'
            },
            transition_type: {
                type: this.parameterTypes.SELECT,
                default: 'both',
                options: ['both', 'color', 'speed'],
                description: 'Transition type (continuous mode only): color = gradient, speed = slow/fast, both = combine'
            },
            total_dots: { 
                type: this.parameterTypes.INT, 
                default: 150,
                description: 'Total number of dots'
            },
            dot_size: { 
                type: this.parameterTypes.FLOAT, 
                default: 4,
                description: 'Size of individual dots in pixels'
            },
            dot_color: {
                type: this.parameterTypes.COLOR,
                default: '#FFFFFF',
                description: 'Color of the dots'
            },
            aperture_diameter: { 
                type: this.parameterTypes.FLOAT, 
                default: 350,
                description: 'Aperture diameter in pixels'
            },
            ...responseOverrideParameters
        };

        switch (componentType) {
            case 'rdm-trial':
                return {
                    name: 'rdm-trial',
                    parameters: baseParameters
                };

            case 'rdm-practice':
                return {
                    name: 'rdm-practice',
                    description: 'Practice RDM trial with feedback',
                    parameters: {
                        ...baseParameters,
                        feedback: { 
                            type: this.parameterTypes.SELECT,
                            default: 'accuracy',
                            options: ['accuracy', 'detailed', 'none'],
                            description: 'Type of feedback to show'
                        },
                        feedback_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 1000,
                            description: 'Feedback display duration in ms'
                        },
                        show_feedback: { 
                            type: this.parameterTypes.BOOL, 
                            default: true,
                            description: 'Whether to show feedback'
                        }
                    }
                };

            case 'rdm-dot-groups':
                return {
                    name: 'rdm-dot-groups',
                    description: 'RDM trial with multiple dot groups',
                    parameters: {
                        group_speed_mode: {
                            type: this.parameterTypes.SELECT,
                            default: 'shared',
                            options: ['shared', 'per-group'],
                            description: 'Use a shared speed (from experiment defaults) or set different speeds per group'
                        },
                        group_1_speed: {
                            type: this.parameterTypes.FLOAT,
                            default: 5,
                            description: 'Dot speed for group 1 (px/frame) when group_speed_mode = per-group'
                        },
                        group_2_speed: {
                            type: this.parameterTypes.FLOAT,
                            default: 5,
                            description: 'Dot speed for group 2 (px/frame) when group_speed_mode = per-group'
                        },
                        response_target_group: {
                            type: this.parameterTypes.SELECT,
                            default: 'none',
                            options: ['none', 'group_1', 'group_2'],
                            description: 'Which dot group the participant should respond to'
                        },
                        cue_border_mode: {
                            type: this.parameterTypes.SELECT,
                            default: 'off',
                            options: ['off', 'target-group-color', 'custom'],
                            description: 'Aperture border cue mode for response target group'
                        },
                        cue_border_color: {
                            type: this.parameterTypes.COLOR,
                            default: '#FFFFFF',
                            description: 'Cue border color when cue_border_mode = custom'
                        },
                        cue_border_width: {
                            type: this.parameterTypes.INT,
                            default: 4,
                            description: 'Cue border width in pixels'
                        },
                        group_1_percentage: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 50,
                            description: 'Percentage of dots in group 1 (0-100)'
                        },
                        group_1_color: { 
                            type: this.parameterTypes.COLOR, 
                            default: '#FF0066',
                            description: 'Color for group 1 dots (hex format)'
                        },
                        group_1_coherence: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0.2,
                            description: 'Motion coherence for group 1 (0-1)'
                        },
                        group_1_direction: {
                            type: this.parameterTypes.INT,
                            default: 0,
                            description: 'Motion direction for coherent dots in group 1 (degrees 0-359; 0=right, 90=down, 180=left, 270=up)'
                        },
                        group_2_percentage: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 50,
                            description: 'Percentage of dots in group 2 (0-100)'
                        },
                        group_2_color: { 
                            type: this.parameterTypes.COLOR, 
                            default: '#0066FF',
                            description: 'Color for group 2 dots (hex format)'
                        },
                        group_2_coherence: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0.8,
                            description: 'Motion coherence for group 2 (0-1)'
                        },
                        group_2_direction: {
                            type: this.parameterTypes.INT,
                            default: 180,
                            description: 'Motion direction for coherent dots in group 2 (degrees 0-359; 0=right, 90=down, 180=left, 270=up)'
                        },
                        total_dots: { 
                            type: this.parameterTypes.INT, 
                            default: 200,
                            description: 'Total number of dots across all groups'
                        },
                        trial_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 3000,
                            description: 'Duration of this trial condition in continuous mode (ms)'
                        },
                        transition_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 500,
                            description: 'Duration of smooth transition to next condition (ms)'
                        },
                        transition_type: {
                            type: this.parameterTypes.SELECT,
                            default: 'both',
                            options: ['both', 'color', 'speed'],
                            description: 'Transition type (continuous mode only): color = gradient, speed = slow/fast, both = combine'
                        },
                        transition_type: {
                            type: this.parameterTypes.SELECT,
                            default: 'both',
                            options: ['both', 'color', 'speed'],
                            description: 'Transition type (continuous mode only): color = gradient, speed = slow/fast, both = combine'
                        },
                        aperture_diameter: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 350,
                            description: 'Aperture diameter in pixels'
                        },
                        ...responseOverrideParameters
                    }
                };

            case 'rdm-adaptive':
                return {
                    name: 'rdm-adaptive',
                    description: 'Adaptive RDM trial with QUEST or staircase',
                    parameters: {
                        algorithm: { 
                            type: this.parameterTypes.SELECT,
                            default: 'quest',
                            options: ['quest', 'staircase', 'simple'],
                            required: true,
                            description: 'Adaptive algorithm to use'
                        },
                        target_performance: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0.82,
                            description: 'Target performance level (0.5-1.0)'
                        },
                        initial_coherence: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0.1,
                            description: 'Initial coherence estimate (0-1)'
                        },
                        step_size: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0.05,
                            description: 'Step size for adjustments'
                        },
                        direction: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 0,
                            description: 'Motion direction in degrees (0-359)'
                        },
                        speed: { 
                            type: this.parameterTypes.FLOAT, 
                            default: 6,
                            description: 'Dot movement speed'
                        },
                        stimulus_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 1500,
                            description: 'Stimulus duration in milliseconds'
                        },
                        trial_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 3000,
                            description: 'Duration of this trial condition in continuous mode (ms)'
                        },
                        transition_duration: { 
                            type: this.parameterTypes.INT, 
                            default: 500,
                            description: 'Duration of smooth transition to next condition (ms)'
                        },
                        total_dots: { 
                            type: this.parameterTypes.INT, 
                            default: 150,
                            description: 'Total number of dots'
                        },
                        dot_color: {
                            type: this.parameterTypes.COLOR,
                            default: '#FFFFFF',
                            description: 'Color of the dots'
                        },
                        ...responseOverrideParameters
                    }
                };

            default:
                return null;
        }
    }

    /**
     * Get all available plugin schemas
     */
    getAllPluginSchemas() {
        return Object.keys(this.pluginSchemas);
    }

    /**
     * Get parameter information for a specific plugin
     */
    getPluginParameters(pluginName) {
        const schema = this.pluginSchemas[pluginName];
        return schema ? schema.parameters : null;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSPsychSchemas;
}