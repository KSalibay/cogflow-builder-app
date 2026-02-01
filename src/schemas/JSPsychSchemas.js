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

    getCommonTrialParameters() {
        return {
            detection_response_task_enabled: {
                type: this.parameterTypes.BOOL,
                default: false,
                description: 'Enable/disable Detection Response Task (DRT) overlay for this component (handled by interpreter)'
            }
        };
    }

    /**
     * Initialize plugin schemas based on jsPsych plugins
     */
    initializePluginSchemas() {
        return {
            'flanker-trial': {
                name: 'flanker-trial',
                description: 'Flanker trial/frame (stimulus + scoring implemented by interpreter)',
                parameters: {
                    stimulus_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'arrows',
                        options: ['arrows', 'letters', 'symbols', 'custom'],
                        description: 'What kind of stimuli to display (arrows vs letters/symbols/custom strings)'
                    },
                    target_direction: {
                        type: this.parameterTypes.SELECT,
                        default: 'left',
                        options: ['left', 'right'],
                        description: 'Target direction (for arrow-style flankers)'
                    },
                    target_stimulus: {
                        type: this.parameterTypes.STRING,
                        default: 'H',
                        description: 'Center stimulus when stimulus_type is letters/symbols/custom'
                    },
                    distractor_stimulus: {
                        type: this.parameterTypes.STRING,
                        default: 'S',
                        description: 'Distractor stimulus used when congruency = incongruent (letters/symbols/custom)'
                    },
                    neutral_stimulus: {
                        type: this.parameterTypes.STRING,
                        default: '–',
                        description: 'Neutral flanker stimulus used when congruency = neutral'
                    },
                    congruency: {
                        type: this.parameterTypes.SELECT,
                        default: 'congruent',
                        options: ['congruent', 'incongruent', 'neutral'],
                        description: 'Congruency condition'
                    },
                    show_fixation_dot: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        description: 'Show a small fixation dot under the center stimulus'
                    },
                    show_fixation_cross_between_trials: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        description: 'Show a fixation cross between trials (during ITI/inter-stimulus)'
                    },
                    left_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        description: 'Response key mapped to left'
                    },
                    right_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        description: 'Response key mapped to right'
                    },
                    stimulus_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 800,
                        description: 'Stimulus display duration (ms)'
                    },
                    trial_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 1500,
                        description: 'Total trial duration (ms)'
                    },
                    iti_ms: {
                        type: this.parameterTypes.INT,
                        default: 500,
                        description: 'Inter-trial interval (ms)'
                    }
                }
            },

            'sart-trial': {
                name: 'sart-trial',
                description: 'SART trial/frame (go/no-go logic implemented by interpreter)',
                parameters: {
                    digit: {
                        type: this.parameterTypes.INT,
                        default: 1,
                        description: 'Digit to display (0-9)'
                    },
                    nogo_digit: {
                        type: this.parameterTypes.INT,
                        default: 3,
                        description: 'No-go digit (withhold response)'
                    },
                    go_key: {
                        type: this.parameterTypes.STRING,
                        default: 'space',
                        description: 'Response key for go trials'
                    },
                    stimulus_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 250,
                        description: 'Digit display duration (ms)'
                    },
                    mask_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 900,
                        description: 'Mask duration after digit (ms)'
                    },
                    trial_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 1150,
                        description: 'Total trial duration (ms)'
                    },
                    iti_ms: {
                        type: this.parameterTypes.INT,
                        default: 0,
                        description: 'Inter-trial interval (ms)'
                    }
                }
            },

            'gabor-trial': {
                name: 'gabor-trial',
                description: 'Gabor patch trial/frame (stimulus + scoring implemented by interpreter)',
                parameters: {
                    response_task: {
                        type: this.parameterTypes.SELECT,
                        default: 'discriminate_tilt',
                        options: ['detect_target', 'discriminate_tilt'],
                        description: 'Whether participant detects the target (yes/no) or discriminates its tilt (left/right)'
                    },
                    left_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        description: 'Left response key (for discriminate_tilt)'
                    },
                    right_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        description: 'Right response key (for discriminate_tilt)'
                    },
                    yes_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        description: 'Yes key (for detect_target)'
                    },
                    no_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        description: 'No key (for detect_target)'
                    },
                    target_location: {
                        type: this.parameterTypes.SELECT,
                        default: 'left',
                        options: ['left', 'right'],
                        description: 'Which location contains the target'
                    },
                    target_tilt_deg: {
                        type: this.parameterTypes.FLOAT,
                        default: 45,
                        description: 'Target orientation tilt (degrees)'
                    },
                    distractor_orientation_deg: {
                        type: this.parameterTypes.FLOAT,
                        default: 0,
                        description: 'Distractor orientation (degrees)'
                    },
                    spatial_cue: {
                        type: this.parameterTypes.SELECT,
                        default: 'none',
                        options: ['none', 'left', 'right', 'both'],
                        description: 'Spatial cue direction'
                    },
                    left_value: {
                        type: this.parameterTypes.SELECT,
                        default: 'neutral',
                        options: ['neutral', 'high', 'low'],
                        description: 'Value cue for left location (frame color mapping via gabor_settings)'
                    },
                    right_value: {
                        type: this.parameterTypes.SELECT,
                        default: 'neutral',
                        options: ['neutral', 'high', 'low'],
                        description: 'Value cue for right location (frame color mapping via gabor_settings)'
                    },
                    stimulus_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        description: 'Stimulus display duration (ms)'
                    },
                    mask_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        description: 'Mask duration after stimulus (ms)'
                    },
                    detection_response_task_enabled: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        description: 'Enable/disable Detection Response Task (DRT) overlay for this component (handled by interpreter)'
                    }
                }
            },

            'block': {
                name: 'block',
                description: 'Generate many trials from parameter windows/ranges (compact representation for large experiments)',
                parameters: {
                    detection_response_task_enabled: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        description: 'Enable/disable Detection Response Task (DRT) overlay for this block (handled by interpreter)'
                    },
                    block_component_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'rdm-trial',
                        options: ['rdm-trial', 'rdm-practice', 'rdm-adaptive', 'rdm-dot-groups', 'flanker-trial', 'sart-trial', 'gabor-trial'],
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
                        blockTarget: 'rdm-*',
                        description: 'Dot color (hex). For dot-groups blocks, set Group 1/2 colors below.'
                    },

                    transition_duration: {
                        type: this.parameterTypes.INT,
                        default: 500,
                        blockTarget: 'rdm-*',
                        description: 'Continuous mode only: duration of the transition to the next condition (ms)'
                    },
                    transition_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'both',
                        options: ['both', 'color', 'speed'],
                        blockTarget: 'rdm-*',
                        description: 'Continuous mode only: transition type (color = gradient, speed = slow/fast, both = combine)'
                    },

                    // Response override (per-block)
                    // Uses the same parameter names as per-component overrides so TimelineBuilder conditional UI works.
                    response_device: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'keyboard', 'mouse', 'touch', 'voice', 'custom'],
                        blockTarget: 'rdm-*',
                        description: 'Override response device for this block (inherit uses experiment defaults)'
                    },
                    response_keys: {
                        type: this.parameterTypes.STRING,
                        default: '',
                        blockTarget: 'rdm-*',
                        description: 'Comma-separated keys for keyboard responses (blank = inherit)'
                    },
                    require_response_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'true', 'false'],
                        blockTarget: 'rdm-*',
                        description: 'Override require_response for this block'
                    },
                    end_condition_on_response_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'true', 'false'],
                        blockTarget: 'rdm-*',
                        description: 'Continuous mode only: end the current condition immediately after a response'
                    },
                    feedback_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'inherit',
                        options: ['inherit', 'off', 'corner-text', 'arrow', 'custom'],
                        blockTarget: 'rdm-*',
                        description: 'Override response feedback for this block (inherit uses experiment defaults)'
                    },
                    feedback_duration_ms: {
                        type: this.parameterTypes.INT,
                        default: 500,
                        blockTarget: 'rdm-*',
                        description: 'Feedback duration (ms) when feedback_mode is enabled (corner-text/arrow/custom)'
                    },
                    mouse_segments: {
                        type: this.parameterTypes.INT,
                        default: 2,
                        blockTarget: 'rdm-*',
                        description: 'Mouse response: number of aperture segments (used when response_device = mouse)'
                    },
                    mouse_start_angle_deg: {
                        type: this.parameterTypes.FLOAT,
                        default: 0,
                        blockTarget: 'rdm-*',
                        description: 'Mouse response: segment start angle offset in degrees (0 = right)'
                    },
                    mouse_selection_mode: {
                        type: this.parameterTypes.SELECT,
                        default: 'click',
                        options: ['click', 'hover'],
                        blockTarget: 'rdm-*',
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

                    // Flanker block windows/values
                    flanker_congruency_options: {
                        type: this.parameterTypes.STRING,
                        default: 'congruent,incongruent',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: comma-separated congruency options to sample from'
                    },
                    flanker_target_direction_options: {
                        type: this.parameterTypes.STRING,
                        default: 'left,right',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: comma-separated target directions to sample from'
                    },
                    flanker_stimulus_type: {
                        type: this.parameterTypes.SELECT,
                        default: 'arrows',
                        options: ['arrows', 'letters', 'symbols', 'custom'],
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: stimulus type'
                    },
                    flanker_target_stimulus_options: {
                        type: this.parameterTypes.STRING,
                        default: 'H',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: comma-separated possible center stimuli (letters/symbols/custom)'
                    },
                    flanker_distractor_stimulus_options: {
                        type: this.parameterTypes.STRING,
                        default: 'S',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: comma-separated possible distractor stimuli (letters/symbols/custom)'
                    },
                    flanker_neutral_stimulus_options: {
                        type: this.parameterTypes.STRING,
                        default: '–',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: comma-separated neutral flanker stimuli'
                    },
                    flanker_left_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: response key mapped to left'
                    },
                    flanker_right_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: response key mapped to right'
                    },
                    flanker_show_fixation_dot: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: show fixation dot under center stimulus'
                    },
                    flanker_show_fixation_cross_between_trials: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: show fixation cross between trials'
                    },
                    flanker_stimulus_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 200,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: stimulus duration min (ms)'
                    },
                    flanker_stimulus_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 800,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: stimulus duration max (ms)'
                    },
                    flanker_trial_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 1000,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: trial duration min (ms)'
                    },
                    flanker_trial_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 2000,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: trial duration max (ms)'
                    },
                    flanker_iti_min: {
                        type: this.parameterTypes.INT,
                        default: 200,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: ITI min (ms)'
                    },
                    flanker_iti_max: {
                        type: this.parameterTypes.INT,
                        default: 800,
                        blockTarget: 'flanker-trial',
                        description: 'Flanker: ITI max (ms)'
                    },

                    // SART block windows/values
                    sart_digit_options: {
                        type: this.parameterTypes.STRING,
                        default: '1,2,3,4,5,6,7,8,9',
                        blockTarget: 'sart-trial',
                        description: 'SART: comma-separated digits to sample from'
                    },
                    sart_nogo_digit: {
                        type: this.parameterTypes.INT,
                        default: 3,
                        blockTarget: 'sart-trial',
                        description: 'SART: no-go digit (withhold response)'
                    },
                    sart_go_key: {
                        type: this.parameterTypes.STRING,
                        default: 'space',
                        blockTarget: 'sart-trial',
                        description: 'SART: response key for GO trials'
                    },
                    sart_stimulus_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 150,
                        blockTarget: 'sart-trial',
                        description: 'SART: stimulus duration min (ms)'
                    },
                    sart_stimulus_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 400,
                        blockTarget: 'sart-trial',
                        description: 'SART: stimulus duration max (ms)'
                    },
                    sart_mask_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 600,
                        blockTarget: 'sart-trial',
                        description: 'SART: mask duration min (ms)'
                    },
                    sart_mask_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 1200,
                        blockTarget: 'sart-trial',
                        description: 'SART: mask duration max (ms)'
                    },
                    sart_trial_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 800,
                        blockTarget: 'sart-trial',
                        description: 'SART: total trial duration min (ms)'
                    },
                    sart_trial_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 2000,
                        blockTarget: 'sart-trial',
                        description: 'SART: total trial duration max (ms)'
                    },
                    sart_iti_min: {
                        type: this.parameterTypes.INT,
                        default: 200,
                        blockTarget: 'sart-trial',
                        description: 'SART: ITI min (ms)'
                    },
                    sart_iti_max: {
                        type: this.parameterTypes.INT,
                        default: 800,
                        blockTarget: 'sart-trial',
                        description: 'SART: ITI max (ms)'
                    },

                    // Gabor block windows/values
                    gabor_response_task: {
                        type: this.parameterTypes.SELECT,
                        default: 'discriminate_tilt',
                        options: ['detect_target', 'discriminate_tilt'],
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: response task mode for generated trials'
                    },
                    gabor_left_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: left key (discriminate_tilt)'
                    },
                    gabor_right_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: right key (discriminate_tilt)'
                    },
                    gabor_yes_key: {
                        type: this.parameterTypes.STRING,
                        default: 'f',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: yes key (detect_target)'
                    },
                    gabor_no_key: {
                        type: this.parameterTypes.STRING,
                        default: 'j',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: no key (detect_target)'
                    },
                    gabor_target_location_options: {
                        type: this.parameterTypes.STRING,
                        default: 'left,right',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated target locations to sample from'
                    },
                    gabor_target_tilt_options: {
                        type: this.parameterTypes.STRING,
                        default: '-45,45',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated target tilts (deg; -90 to 90) to sample from'
                    },
                    gabor_distractor_orientation_options: {
                        type: this.parameterTypes.STRING,
                        default: '0,90',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated distractor orientations (deg; 0-179) to sample from'
                    },
                    gabor_spatial_cue_options: {
                        type: this.parameterTypes.STRING,
                        default: 'none,left,right,both',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated spatial cue options to sample from'
                    },
                    gabor_left_value_options: {
                        type: this.parameterTypes.STRING,
                        default: 'neutral,high,low',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated left value cue options to sample from'
                    },
                    gabor_right_value_options: {
                        type: this.parameterTypes.STRING,
                        default: 'neutral,high,low',
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: comma-separated right value cue options to sample from'
                    },
                    gabor_stimulus_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: stimulus duration min (ms)'
                    },
                    gabor_stimulus_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: stimulus duration max (ms)'
                    },
                    gabor_mask_duration_min: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: mask duration min (ms)'
                    },
                    gabor_mask_duration_max: {
                        type: this.parameterTypes.INT,
                        default: 67,
                        blockTarget: 'gabor-trial',
                        description: 'Gabor: mask duration max (ms)'
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

            'survey-response': {
                name: 'survey-response',
                description: 'Collect survey/questionnaire responses in a single HTML form',
                parameters: {
                    title: {
                        type: this.parameterTypes.STRING,
                        default: 'Survey',
                        description: 'Survey title/header'
                    },
                    instructions: {
                        type: this.parameterTypes.HTML_STRING,
                        default: '',
                        description: 'Optional instructions shown above the form'
                    },
                    submit_label: {
                        type: this.parameterTypes.STRING,
                        default: 'Continue',
                        description: 'Submit button text'
                    },
                    allow_empty_on_timeout: {
                        type: this.parameterTypes.BOOL,
                        default: false,
                        description: 'If true, allow continuing with empty responses after timeout_ms'
                    },
                    timeout_ms: {
                        type: this.parameterTypes.INT,
                        default: null,
                        description: 'Optional timeout in ms for auto-continue (null/omitted = off)'
                    },
                    questions: {
                        type: this.parameterTypes.COMPLEX,
                        required: true,
                        description: 'Array of question objects (id, type, prompt, required, and type-specific fields)'
                    }
                },
                data: {
                    responses: { type: this.parameterTypes.OBJECT, optional: true },
                    rt: { type: this.parameterTypes.INT, optional: true }
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
                    'data_collection', 'experiment_type', 'task_type'
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
                    'data_collection', 'experiment_type', 'task_type'
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
                    'data_collection', 'experiment_type', 'task_type'
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
                    'experiment_type', 'data_collection', 'task_type',
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

            // Validate task type (experiment-wide)
            const knownTaskTypes = ['rdm', 'sart', 'flanker', 'stroop', 'nback', 'simon', 'custom'];
            if (config.task_type === undefined || config.task_type === null || config.task_type === '') {
                warnings.push('Missing recommended field: task_type');
            } else if (typeof config.task_type !== 'string') {
                errors.push(`task_type should be string, got ${typeof config.task_type}`);
            } else if (!knownTaskTypes.includes(config.task_type)) {
                // Allow forward-compatible task additions without hard failing
                warnings.push(`Unknown task_type '${config.task_type}' (known: ${knownTaskTypes.join(', ')})`);
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

            // Component-specific deep validation
            if (trial.type === 'survey-response') {
                const surveyValidation = this.validateSurveyResponse(trial, index);
                errors.push(...surveyValidation.errors);
                warnings.push(...surveyValidation.warnings);
            }
        });

        return { errors, warnings };
    }

    validateSurveyResponse(trial, trialIndex) {
        const errors = [];
        const warnings = [];

        const allowEmpty = !!trial?.allow_empty_on_timeout;
        const timeoutRaw = trial?.timeout_ms;
        const hasTimeout = timeoutRaw !== undefined && timeoutRaw !== null && timeoutRaw !== '';
        const timeout = hasTimeout ? Number(timeoutRaw) : null;

        if (allowEmpty) {
            if (timeout === null || !Number.isFinite(timeout) || timeout <= 0) {
                errors.push(`Trial ${trialIndex}: survey-response allow_empty_on_timeout=true requires a positive timeout_ms`);
            }
        } else {
            // If timeout is provided but allowEmpty is false, it's harmless; just warn.
            if (hasTimeout && Number.isFinite(timeout) && timeout > 0) {
                warnings.push(`Trial ${trialIndex}: survey-response has timeout_ms set but allow_empty_on_timeout is false (timeout will be ignored)`);
            }
        }

        const questions = trial?.questions;
        if (!Array.isArray(questions)) {
            errors.push(`Trial ${trialIndex}: survey-response 'questions' must be an array`);
            return { errors, warnings };
        }
        if (questions.length === 0) {
            warnings.push(`Trial ${trialIndex}: survey-response has no questions`);
            return { errors, warnings };
        }

        const seenIds = new Set();
        const knownTypes = new Set(['likert', 'radio', 'text', 'slider', 'number']);

        questions.forEach((q, qi) => {
            if (!q || typeof q !== 'object') {
                errors.push(`Trial ${trialIndex} question ${qi}: must be an object`);
                return;
            }

            const id = (q.id ?? '').toString().trim();
            const type = (q.type ?? '').toString().trim();
            const prompt = (q.prompt ?? '').toString().trim();

            if (!id) {
                errors.push(`Trial ${trialIndex} question ${qi}: missing id`);
            } else if (seenIds.has(id)) {
                errors.push(`Trial ${trialIndex} question ${qi}: duplicate id '${id}'`);
            } else {
                seenIds.add(id);
            }

            if (!type) {
                errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): missing type`);
            } else if (!knownTypes.has(type)) {
                warnings.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): unknown type '${type}'`);
            }

            if (!prompt) {
                warnings.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): empty prompt`);
            }

            if (type === 'likert' || type === 'radio') {
                if (!Array.isArray(q.options) || q.options.length < 2) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): '${type}' requires options (at least 2)`);
                }
            }

            if (type === 'slider') {
                const min = Number(q.min);
                const max = Number(q.max);
                const step = Number(q.step);
                if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): slider requires numeric min < max`);
                }
                if (!Number.isFinite(step) || step <= 0) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): slider requires positive step`);
                }
            }

            if (type === 'number') {
                if (q.min !== undefined && q.min !== null && q.min !== '' && !Number.isFinite(Number(q.min))) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): number min must be numeric`);
                }
                if (q.max !== undefined && q.max !== null && q.max !== '' && !Number.isFinite(Number(q.max))) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): number max must be numeric`);
                }
                if (q.step !== undefined && q.step !== null && q.step !== '' && !Number.isFinite(Number(q.step))) {
                    errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): number step must be numeric`);
                }
            }

            if (type === 'text') {
                if (q.rows !== undefined && q.rows !== null && q.rows !== '') {
                    const rows = Number.parseInt(q.rows, 10);
                    if (!Number.isFinite(rows) || rows < 1) {
                        errors.push(`Trial ${trialIndex} question ${qi} (${id || 'no-id'}): rows must be an integer >= 1`);
                    }
                }
            }
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
        let schema = null;

        // Handle RDM components directly - don't depend on external RDMTaskSchema
        if (pluginName && pluginName.startsWith('rdm-')) {
            schema = this.generateRDMPluginSchema(pluginName);
        } else {
            schema = this.pluginSchemas[pluginName] || null;
        }

        if (!schema) return null;

        // Inject common per-trial parameters for all plugins without mutating the base schema.
        const common = this.getCommonTrialParameters();
        return {
            ...schema,
            parameters: {
                ...common,
                ...(schema.parameters || {})
            }
        };
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