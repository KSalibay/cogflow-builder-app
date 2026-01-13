/**
 * PsychJSON Builder - Main Application Class
 * 
 * A modular web application for generating JSON parameter files
 * for experimental psychology tasks compatible with jsPsych and JATOS
 */

class JsonBuilder {
    constructor() {
        this.timeline = [];
        this.experimentType = 'trial-based';
        this.dataCollection = {
            'reaction-time': true,
            'accuracy': true,
            'correctness': false,
            'eye-tracking': false,
            // Response modalities are configured via the "Default Response" dropdown
        };
        this.currentComponent = null;
        this.componentCounter = 0;
        this.templates = {};
        
        // Initialize modules
        this.dataModules = null;
        this.trialManager = null;
        this.timelineBuilder = null;
        this.schemaValidator = null;
        
        // Bind methods
        this.updateJSON = this.updateJSON.bind(this);
        this.onExperimentTypeChange = this.onExperimentTypeChange.bind(this);
        this.onDataCollectionChange = this.onDataCollectionChange.bind(this);
    }

    /**
     * Show/hide UI sections based on current settings
     */
    updateConditionalUI() {
        const defaultDevice = document.getElementById('defaultResponseDevice')?.value || 'keyboard';

        const feedbackType = document.getElementById('defaultFeedbackType')?.value || 'off';

        const mouseSettings = document.getElementById('mouseResponseSettings');
        if (mouseSettings) {
            mouseSettings.style.display = (defaultDevice === 'mouse') ? 'block' : 'none';
        }

        // Hide Response Keys unless the default response is keyboard
        document.querySelectorAll('#responseKeys').forEach((input) => {
            const row = input.closest('.parameter-row');
            if (row) {
                row.style.display = (defaultDevice === 'keyboard') ? '' : 'none';
            }
            input.disabled = (defaultDevice !== 'keyboard');
        });

        // Feedback duration shown only when feedback is enabled
        const feedbackDurationRow = document.getElementById('feedbackDurationRow');
        const feedbackDurationInput = document.getElementById('defaultFeedbackDuration');
        if (feedbackDurationRow && feedbackDurationInput) {
            const show = feedbackType !== 'off';
            feedbackDurationRow.style.display = show ? '' : 'none';
            feedbackDurationInput.disabled = !show;
        }
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.initializeModules();
        this.setupEventListeners();

        // Ensure JS state matches the actual checkbox state on load
        this.syncDataCollectionFromUI();

        this.updateExperimentTypeUI(); // Initialize parameter forms
        this.loadComponentLibrary();
        this.loadDefaultRDMTemplate();
        this.updateJSON();
        
        console.log('PsychJSON Builder initialized successfully');
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
        try {
            this.dataModules = new DataCollectionModules();
            this.trialManager = new TrialManager(this);
            this.timelineBuilder = new TimelineBuilder(this);
            this.schemaValidator = new JSPsychSchemas();
            
            console.log('All modules initialized successfully');
        } catch (error) {
            console.error('Error initializing modules:', error);
        }
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Experiment type radio buttons
        document.querySelectorAll('input[name="experimentType"]').forEach(radio => {
            radio.addEventListener('change', this.onExperimentTypeChange);
        });

        // Data collection checkboxes (scoped)
        document.querySelectorAll('.data-collection-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', this.onDataCollectionChange);
        });

        // Main action buttons
        document.getElementById('addComponentBtn').addEventListener('click', () => {
            this.showComponentLibrary();
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('loadTemplateBtn').addEventListener('click', () => {
            this.loadTemplate();
        });

        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            this.saveTemplate();
        });

        document.getElementById('clearTimelineBtn').addEventListener('click', () => {
            this.clearTimeline();
        });

        document.getElementById('validateJsonBtn').addEventListener('click', () => {
            this.validateJSON();
        });

        document.getElementById('copyJsonBtn').addEventListener('click', () => {
            this.copyJSONToClipboard();
        });

        // Parameter modal
        document.getElementById('saveParametersBtn').addEventListener('click', () => {
            this.saveParameters();
        });
        
        // Add event listener for preview button
        document.getElementById('previewComponentBtn').addEventListener('click', () => {
            this.previewCurrentComponent();
        });
    }

    /**
     * Sync data collection state from UI
     */
    syncDataCollectionFromUI() {
        document.querySelectorAll('.data-collection-checkbox').forEach(cb => {
            const key = cb.value;
            this.dataCollection[key] = !!cb.checked;
        });
    }

    /**
     * Handle experiment type changes
     */
    onExperimentTypeChange(event) {
        this.experimentType = event.target.value;
        console.log('Experiment type changed to:', this.experimentType);
        
        // Update UI based on experiment type
        this.updateExperimentTypeUI();
        this.updateConditionalUI();
        this.updateJSON();
    }

    /**
     * Handle data collection modality changes
     */
    onDataCollectionChange(event) {
        const modality = event.target.value;
        const isChecked = event.target.checked;
        
        this.dataCollection[modality] = isChecked;
        console.log(`Data collection ${modality}: ${isChecked}`);
        
        // Update data collection modules
        if (this.dataModules) {
            this.dataModules.toggleModule(modality, isChecked);
        }

        // Keep state in sync if checkboxes were manipulated programmatically
        this.syncDataCollectionFromUI();

        // Toggle conditional UI sections without re-rendering the whole panel
        this.updateConditionalUI();
        
        this.updateJSON();
    }

    /**
     * Update UI based on experiment type
     */
    updateExperimentTypeUI() {
        const parameterForms = document.getElementById('parameterForms');
        parameterForms.innerHTML = '';
        
        if (this.experimentType === 'trial-based') {
            this.showTrialBasedParameters();
        } else if (this.experimentType === 'continuous') {
            this.showContinuousParameters();
        }

        // Ensure conditional sections match current state after re-render
        this.updateConditionalUI();
    }

    /**
     * Show parameters for trial-based experiments
     */
    showTrialBasedParameters() {
        const container = document.getElementById('parameterForms');
        
        const html = `
            <div class="parameter-group">
                <div class="group-title">Trial Configuration</div>
                <div class="parameter-row">
                    <label class="parameter-label">Number of Trials:</label>
                    <input type="number" class="form-control parameter-input" id="numTrials" value="20" min="1">
                    <div class="parameter-help">Total number of experimental trials</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="iti" value="1000" min="0">
                    <div class="parameter-help">Inter-trial interval in milliseconds</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Randomize Order:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="randomizeOrder" checked>
                            <label class="form-check-label" for="randomizeOrder">Enable randomization</label>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- RDM-specific experiment parameters -->
            <div class="parameter-group" id="rdmExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>RDM Experiment Settings</span>
                        <small class="text-muted d-block">Default values for all components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewRDMBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentRDMParameters())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Canvas Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="canvasWidth" value="600" min="400" max="1200">
                    <div class="parameter-help">Width of the stimulus display area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Canvas Height (px):</label>
                    <input type="number" class="form-control parameter-input" id="canvasHeight" value="600" min="300" max="900">
                    <div class="parameter-help">Height of the stimulus display area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Aperture Shape:</label>
                    <select class="form-control parameter-input" id="apertureShape">
                        <option value="circle">Circle</option>
                        <option value="rectangle">Rectangle</option>
                    </select>
                    <div class="parameter-help">Shape of the stimulus aperture area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Aperture Diameter (px):</label>
                    <input type="number" class="form-control parameter-input" id="apertureDiameter" value="350" min="50" max="800">
                    <div class="parameter-help">Diameter (circle) or width (rectangle) of aperture</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Background Color:</label>
                    <input type="color" class="form-control parameter-input" id="backgroundColor" value="#404040">
                    <div class="parameter-help">Background color for stimulus display</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Size (px):</label>
                    <input type="number" class="form-control parameter-input" id="dotSize" value="4" min="1" max="10">
                    <div class="parameter-help">Size of individual dots in pixels</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Color:</label>
                    <input type="color" class="form-control parameter-input" id="dotColor" value="#ffffff">
                    <div class="parameter-help">Color of the moving dots</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Total Dots:</label>
                    <input type="number" class="form-control parameter-input" id="totalDots" value="150" min="10" max="500">
                    <div class="parameter-help">Total number of dots to display</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Motion Coherence:</label>
                    <input type="range" class="form-range" id="motionCoherence" min="0" max="1" step="0.01" value="0.5">
                    <div class="parameter-help">Proportion of dots moving coherently (0-1): <span id="coherenceValue">0.50</span></div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Direction (degrees):</label>
                    <input type="number" class="form-control parameter-input" id="motionDirection" value="0" min="0" max="359">
                    <div class="parameter-help">Direction of coherent motion in degrees (0 = right, 90 = down)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Speed (px/frame):</label>
                    <input type="number" class="form-control parameter-input" id="motionSpeed" value="5" min="1" max="20">
                    <div class="parameter-help">Speed of dot movement in pixels per frame</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Lifetime (frames):</label>
                    <input type="number" class="form-control parameter-input" id="dotLifetime" value="60" min="10" max="200">
                    <div class="parameter-help">How long each dot lives before being replaced (frames)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Noise Type:</label>
                    <select class="form-control parameter-input" id="noiseType">
                        <option value="random_direction">Random Direction</option>
                        <option value="random_walk">Random Walk</option>
                        <option value="brownian">Brownian</option>
                    </select>
                    <div class="parameter-help">Noise motion model for incoherent dots</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Fixation Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="fixationDuration" value="500" min="0" max="2000">
                    <div class="parameter-help">Duration of fixation cross before stimulus</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="stimulusDuration" value="1500" min="100" max="30000">
                    <div class="parameter-help">How long to display the dots</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Response Deadline (ms):</label>
                    <input type="number" class="form-control parameter-input" id="responseDeadline" value="2500" min="100" max="30000">
                    <div class="parameter-help">Maximum time allowed for a response</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Inter-trial Interval (ms):</label>
                    <input type="number" class="form-control parameter-input" id="interTrialInterval" value="1200" min="0" max="10000">
                    <div class="parameter-help">Time between trials</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response:</label>
                    <select class="form-control parameter-input" id="defaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="touch">Touch</option>
                        <option value="voice">Voice</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div class="parameter-help">Default response device for RDM trials. Individual components can still override/add response types.</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Response Keys:</label>
                    <input type="text" class="form-control parameter-input" id="responseKeys" value="ArrowLeft,ArrowRight">
                    <div class="parameter-help">Comma-separated list of valid response keys</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Require Response:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="requireResponse" checked>
                            <label class="form-check-label" for="requireResponse">Require a response to proceed</label>
                        </div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label text-muted">Response Ends Condition:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="endConditionOnResponse" disabled>
                            <label class="form-check-label text-muted" for="endConditionOnResponse">Continuous-only (disabled for trial-based)</label>
                        </div>
                    </div>
                    <div class="parameter-help text-muted">When enabled (continuous mode), a response will end the current condition and advance/transition immediately.</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Feedback:</label>
                    <select class="form-control parameter-input" id="defaultFeedbackType">
                        <option value="off" selected>Off</option>
                        <option value="corner-text">Corner Text</option>
                        <option value="arrow">Arrow</option>
                        <option value="custom">Custom (placeholder)</option>
                    </select>
                    <div class="parameter-help">Optional feedback shown after response (applies by default; components can override).</div>
                </div>
                <div class="parameter-row" id="feedbackDurationRow" style="display:none;">
                    <label class="parameter-label">Feedback Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="defaultFeedbackDuration" value="500" min="0" max="20000" disabled>
                    <div class="parameter-help">How long feedback is displayed after the response</div>
                </div>
                <div id="mouseResponseSettings" style="display: none;">
                    <div class="parameter-row">
                        <label class="parameter-label">Mouse Response:</label>
                        <div class="parameter-help">Shown only when Default Response is set to Mouse.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Aperture Segments:</label>
                        <input type="number" class="form-control parameter-input" id="mouseApertureSegments" value="2" min="2" max="12">
                        <div class="parameter-help">Number of clickable segments around the aperture</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Start Angle (deg):</label>
                        <input type="number" class="form-control parameter-input" id="mouseSegmentStartAngle" value="0" min="0" max="359">
                        <div class="parameter-help">Angle offset for segment 0 (0 = right)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Selection Mode:</label>
                        <select class="form-control parameter-input" id="mouseSelectionMode">
                            <option value="click" selected>Click</option>
                            <option value="hover">Hover (no click)</option>
                        </select>
                        <div class="parameter-help">How a segment selection is registered</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners for parameter changes
        container.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', this.updateJSON);
        });

        // Keep conditional UI in sync when default response changes
        const defaultResponseEl = document.getElementById('defaultResponseDevice');
        if (defaultResponseEl) {
            defaultResponseEl.addEventListener('change', () => this.updateConditionalUI());
        }

        const feedbackTypeEl = document.getElementById('defaultFeedbackType');
        if (feedbackTypeEl) {
            feedbackTypeEl.addEventListener('change', () => this.updateConditionalUI());
        }
        
        // Add specific listener for coherence slider
        const coherenceSlider = document.getElementById('motionCoherence');
        const coherenceValue = document.getElementById('coherenceValue');
        if (coherenceSlider && coherenceValue) {
            coherenceSlider.addEventListener('input', function() {
                coherenceValue.textContent = parseFloat(this.value).toFixed(2);
            });
        }
    }

    /**
     * Show parameters for continuous experiments
     */
    showContinuousParameters() {
        const container = document.getElementById('parameterForms');
        
        const html = `
            <div class="parameter-group">
                <div class="group-title">Continuous Configuration</div>
                <div class="parameter-row">
                    <label class="parameter-label">Frame Rate (fps):</label>
                    <input type="number" class="form-control parameter-input" id="frameRate" value="60" min="1" max="120">
                    <div class="parameter-help">Frames per second for continuous updating</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Duration (seconds):</label>
                    <input type="number" class="form-control parameter-input" id="duration" value="30" min="1">
                    <div class="parameter-help">Total duration of continuous experiment</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Update Interval (ms):</label>
                    <input type="number" class="form-control parameter-input" id="updateInterval" value="16" min="1">
                    <div class="parameter-help">Parameter update interval in milliseconds</div>
                </div>
            </div>
            
            <!-- RDM-specific experiment parameters for continuous -->
            <div class="parameter-group" id="rdmExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>RDM Experiment Settings</span>
                        <small class="text-muted d-block">Default values for all components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewRDMBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentRDMParameters())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Canvas Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="canvasWidth" value="600" min="400" max="1200">
                    <div class="parameter-help">Width of the stimulus display area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Canvas Height (px):</label>
                    <input type="number" class="form-control parameter-input" id="canvasHeight" value="600" min="300" max="900">
                    <div class="parameter-help">Height of the stimulus display area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Aperture Shape:</label>
                    <select class="form-control parameter-input" id="apertureShape">
                        <option value="circle">Circle</option>
                        <option value="rectangle">Rectangle</option>
                    </select>
                    <div class="parameter-help">Shape of the stimulus aperture area</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Aperture Diameter (px):</label>
                    <input type="number" class="form-control parameter-input" id="apertureDiameter" value="350" min="50" max="800">
                    <div class="parameter-help">Diameter (circle) or width (rectangle) of aperture</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Background Color:</label>
                    <input type="color" class="form-control parameter-input" id="backgroundColor" value="#404040">
                    <div class="parameter-help">Background color for stimulus display</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Size (px):</label>
                    <input type="number" class="form-control parameter-input" id="dotSize" value="4" min="1" max="10">
                    <div class="parameter-help">Size of individual dots in pixels</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Color:</label>
                    <input type="color" class="form-control parameter-input" id="dotColor" value="#ffffff">
                    <div class="parameter-help">Color of the moving dots</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Total Dots:</label>
                    <input type="number" class="form-control parameter-input" id="totalDots" value="150" min="10" max="500">
                    <div class="parameter-help">Total number of dots to display</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Motion Coherence:</label>
                    <input type="range" class="form-range" id="motionCoherence" min="0" max="1" step="0.01" value="0.5">
                    <div class="parameter-help">Proportion of dots moving coherently (0-1): <span id="coherenceValue">0.50</span></div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Direction (degrees):</label>
                    <input type="number" class="form-control parameter-input" id="motionDirection" value="0" min="0" max="359">
                    <div class="parameter-help">Direction of coherent motion in degrees (0 = right, 90 = down)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Speed (px/frame):</label>
                    <input type="number" class="form-control parameter-input" id="motionSpeed" value="5" min="1" max="20">
                    <div class="parameter-help">Speed of dot movement in pixels per frame</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Dot Lifetime (frames):</label>
                    <input type="number" class="form-control parameter-input" id="dotLifetime" value="60" min="10" max="200">
                    <div class="parameter-help">How long each dot lives before being replaced (frames)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Noise Type:</label>
                    <select class="form-control parameter-input" id="noiseType">
                        <option value="random_direction">Random Direction</option>
                        <option value="random_walk">Random Walk</option>
                        <option value="brownian">Brownian</option>
                    </select>
                    <div class="parameter-help">Noise motion model for incoherent dots</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Transition Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="defaultTransitionDuration" value="500" min="0" max="20000">
                    <div class="parameter-help">Continuous mode only. Default transition duration between timeline components (0 = no transition)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Transition Type:</label>
                    <select class="form-control parameter-input" id="defaultTransitionType">
                        <option value="both" selected>Both (color + speed)</option>
                        <option value="color">Color</option>
                        <option value="speed">Speed</option>
                    </select>
                    <div class="parameter-help">Continuous mode only. Color = smooth color gradient; Speed = slow down/speed up; Both = combine</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response:</label>
                    <select class="form-control parameter-input" id="defaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="touch">Touch</option>
                        <option value="voice">Voice</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div class="parameter-help">Default response device for RDM trials. Individual components can still override/add response types.</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Response Keys:</label>
                    <input type="text" class="form-control parameter-input" id="responseKeys" value="ArrowLeft,ArrowRight">
                    <div class="parameter-help">Comma-separated list of valid response keys</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Require Response:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="requireResponse" checked>
                            <label class="form-check-label" for="requireResponse">Require a response to proceed</label>
                        </div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Response Ends Condition:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="endConditionOnResponse">
                            <label class="form-check-label" for="endConditionOnResponse">End current condition on response</label>
                        </div>
                    </div>
                    <div class="parameter-help">Continuous mode: response immediately ends the condition and triggers the transition to the next one.</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Feedback:</label>
                    <select class="form-control parameter-input" id="defaultFeedbackType">
                        <option value="off" selected>Off</option>
                        <option value="corner-text">Corner Text</option>
                        <option value="arrow">Arrow</option>
                        <option value="custom">Custom (placeholder)</option>
                    </select>
                    <div class="parameter-help">Optional feedback shown after response (applies by default; components can override).</div>
                </div>
                <div class="parameter-row" id="feedbackDurationRow" style="display:none;">
                    <label class="parameter-label">Feedback Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="defaultFeedbackDuration" value="500" min="0" max="20000" disabled>
                    <div class="parameter-help">How long feedback is displayed after the response</div>
                </div>
                <div id="mouseResponseSettings" style="display: none;">
                    <div class="parameter-row">
                        <label class="parameter-label">Mouse Response:</label>
                        <div class="parameter-help">Shown only when Default Response is set to Mouse.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Aperture Segments:</label>
                        <input type="number" class="form-control parameter-input" id="mouseApertureSegments" value="2" min="2" max="12">
                        <div class="parameter-help">Number of clickable segments around the aperture</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Start Angle (deg):</label>
                        <input type="number" class="form-control parameter-input" id="mouseSegmentStartAngle" value="0" min="0" max="359">
                        <div class="parameter-help">Angle offset for segment 0 (0 = right)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Selection Mode:</label>
                        <select class="form-control parameter-input" id="mouseSelectionMode">
                            <option value="click" selected>Click</option>
                            <option value="hover">Hover (no click)</option>
                        </select>
                        <div class="parameter-help">How a segment selection is registered</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add event listeners for parameter changes
        container.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', this.updateJSON);
        });

        const defaultResponseEl = document.getElementById('defaultResponseDevice');
        if (defaultResponseEl) {
            defaultResponseEl.addEventListener('change', () => this.updateConditionalUI());
        }

        const feedbackTypeEl = document.getElementById('defaultFeedbackType');
        if (feedbackTypeEl) {
            feedbackTypeEl.addEventListener('change', () => this.updateConditionalUI());
        }
        
        // Add specific listener for coherence slider
        const coherenceSlider = document.getElementById('motionCoherence');
        const coherenceValue = document.getElementById('coherenceValue');
        if (coherenceSlider && coherenceValue) {
            coherenceSlider.addEventListener('input', function() {
                coherenceValue.textContent = parseFloat(this.value).toFixed(2);
            });
        }
    }

    /**
     * Load and display component library
     */
    loadComponentLibrary() {
        const library = document.getElementById('componentLibrary');
        
        const components = this.getComponentDefinitions();
        
        library.innerHTML = '';
        
        components.forEach(component => {
            const componentCard = this.createComponentCard(component);
            library.appendChild(componentCard);
        });
    }

    /**
     * Get component definitions based on experiment type and data collection
     */
    getComponentDefinitions() {
        const taskType = document.getElementById('taskType')?.value || 'rdm';
        
        const baseComponents = [
            {
                id: 'instructions',
                name: 'Instructions',
                icon: 'fas fa-info-circle',
                description: 'Display text instructions to participants',
                category: 'basic',
                type: 'html-keyboard-response',
                parameters: {
                    stimulus: { type: 'string', default: 'Welcome to the experiment.\n\nPlease read the instructions carefully and press any key to continue.' },
                    choices: { type: 'select', default: 'ALL_KEYS', options: ['ALL_KEYS', 'space', 'enter', 'escape'] },
                    prompt: { type: 'string', default: '' },
                    stimulus_duration: { type: 'number', default: null, min: 100, max: 30000 },
                    trial_duration: { type: 'number', default: null, min: 500, max: 60000 },
                    response_ends_trial: { type: 'boolean', default: true }
                },
                data: {
                    type: 'html-keyboard-response',
                    stimulus: 'Welcome to the experiment.\n\nPlease read the instructions carefully and press any key to continue.',
                    choices: 'ALL_KEYS',
                    prompt: '',
                    stimulus_duration: null,
                    trial_duration: null,
                    response_ends_trial: true
                }
            }
        ];

        // Add task-specific components
        if (taskType === 'rdm') {
            baseComponents.push(
                {
                    id: 'rdm-trial',
                    name: 'RDM Trial',
                    icon: 'fas fa-circle',
                    description: 'Random Dot Motion trial with configurable parameters',
                    category: 'stimulus',
                    parameters: {
                        coherence: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
                        direction: { type: 'number', default: 0, min: 0, max: 360 },
                        speed: { type: 'number', default: 6, min: 1, max: 20 },
                        total_dots: { type: 'number', default: 150, min: 10, max: 1000 },
                        dot_size: { type: 'number', default: 4, min: 1, max: 20 },
                        dot_color: { type: 'COLOR', default: '#FFFFFF' },
                        aperture_diameter: { type: 'number', default: 350, min: 50, max: 800 },
                        stimulus_duration: { type: 'number', default: 1500, min: 100, max: 10000 },
                        trial_duration: { type: 'number', default: 3000, min: 500, max: 30000 },
                        transition_duration: { type: 'number', default: 500, min: 0, max: 2000 }
                    }
                },
                {
                    id: 'rdm-practice',
                    name: 'RDM Practice',
                    icon: 'fas fa-graduation-cap',
                    description: 'Practice RDM trial with feedback and instructions',
                    category: 'practice',
                    parameters: {
                        coherence: { type: 'number', default: 0.8, min: 0, max: 1, step: 0.01 },
                        direction: { type: 'number', default: 0, min: 0, max: 360 },
                        dot_color: { type: 'COLOR', default: '#FFFFFF' },
                        feedback_duration: { type: 'number', default: 1000, min: 500, max: 3000 },
                        show_feedback: { type: 'boolean', default: true },
                        practice_instructions: { type: 'string', default: 'Practice trial - feedback provided' },
                        trial_duration: { type: 'number', default: 3000, min: 500, max: 30000 },
                        transition_duration: { type: 'number', default: 500, min: 0, max: 2000 }
                    }
                },
                {
                    id: 'rdm-dot-groups',
                    name: 'RDM Groups',
                    icon: 'fas fa-layer-group',
                    description: 'RDM trial with multiple dot groups (different colors/coherences)',
                    category: 'advanced',
                    parameters: {
                        group_1_percentage: { type: 'number', default: 50, min: 0, max: 100 },
                        group_1_color: { type: 'COLOR', default: '#FF0066' },
                        group_1_coherence: { type: 'number', default: 0.2, min: 0, max: 1, step: 0.01 },
                        group_1_direction: { type: 'number', default: 0, min: 0, max: 359 },
                        group_2_percentage: { type: 'number', default: 50, min: 0, max: 100 },
                        group_2_color: { type: 'COLOR', default: '#0066FF' },
                        group_2_coherence: { type: 'number', default: 0.8, min: 0, max: 1, step: 0.01 },
                        group_2_direction: { type: 'number', default: 180, min: 0, max: 359 },
                        total_dots: { type: 'number', default: 200, min: 50, max: 1000 },
                        trial_duration: { type: 'number', default: 3000, min: 500, max: 30000 },
                        transition_duration: { type: 'number', default: 500, min: 0, max: 2000 },
                        aperture_diameter: { type: 'number', default: 350, min: 50, max: 800 }
                    }
                },
                {
                    id: 'block',
                    name: 'Block',
                    icon: 'fas fa-layer-group',
                    description: 'Compactly represent many generated trials using parameter windows (ranges)',
                    category: 'advanced',
                    parameters: {
                        block_component_type: { type: 'select', default: 'rdm-trial', options: ['rdm-trial', 'rdm-practice', 'rdm-adaptive', 'rdm-dot-groups'] },
                        block_length: { type: 'number', default: 100, min: 1, max: 50000 },
                        sampling_mode: { type: 'select', default: 'per-trial', options: ['per-trial', 'per-block'] },
                        seed: { type: 'string', default: '' },

                        // Dot color (used for simple trial/practice/adaptive; dot-groups uses per-group colors)
                        dot_color: { type: 'COLOR', default: '#FFFFFF' },

                        // Continuous mode transitions (applied when experiment_type = continuous)
                        transition_duration: { type: 'number', default: 500, min: 0, max: 20000 },
                        transition_type: { type: 'select', default: 'both', options: ['both', 'color', 'speed'] },

                        // Per-block response overrides
                        response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse', 'touch', 'voice', 'custom'] },
                        response_keys: { type: 'string', default: '' },
                        require_response_mode: { type: 'select', default: 'inherit', options: ['inherit', 'true', 'false'] },
                        mouse_segments: { type: 'number', default: 2, min: 1, max: 12 },
                        mouse_start_angle_deg: { type: 'number', default: 0, min: 0, max: 359 },
                        mouse_selection_mode: { type: 'select', default: 'click', options: ['click', 'hover'] },

                        // rdm-trial windows
                        coherence_min: { type: 'number', default: 0.2, min: 0, max: 1, step: 0.01 },
                        coherence_max: { type: 'number', default: 0.8, min: 0, max: 1, step: 0.01 },
                        direction_options: { type: 'string', default: '0,180' },
                        speed_min: { type: 'number', default: 4, min: 0, max: 50 },
                        speed_max: { type: 'number', default: 10, min: 0, max: 50 },

                        // rdm-practice windows
                        practice_coherence_min: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
                        practice_coherence_max: { type: 'number', default: 0.9, min: 0, max: 1, step: 0.01 },
                        practice_direction_options: { type: 'string', default: '0,180' },
                        practice_feedback_duration_min: { type: 'number', default: 750, min: 0, max: 5000 },
                        practice_feedback_duration_max: { type: 'number', default: 1500, min: 0, max: 5000 },

                        // rdm-adaptive windows
                        adaptive_initial_coherence_min: { type: 'number', default: 0.05, min: 0, max: 1, step: 0.01 },
                        adaptive_initial_coherence_max: { type: 'number', default: 0.2, min: 0, max: 1, step: 0.01 },
                        adaptive_algorithm: { type: 'select', default: 'quest', options: ['quest', 'staircase', 'simple'] },
                        adaptive_step_size_min: { type: 'number', default: 0.02, min: 0.001, max: 0.5, step: 0.001 },
                        adaptive_step_size_max: { type: 'number', default: 0.08, min: 0.001, max: 0.5, step: 0.001 },
                        adaptive_target_performance: { type: 'number', default: 0.82, min: 0.5, max: 1, step: 0.01 },

                        // rdm-dot-groups windows
                        group_1_percentage_min: { type: 'number', default: 40, min: 0, max: 100 },
                        group_1_percentage_max: { type: 'number', default: 60, min: 0, max: 100 },
                        group_1_color: { type: 'COLOR', default: '#FF0066' },
                        group_1_coherence_min: { type: 'number', default: 0.1, min: 0, max: 1, step: 0.01 },
                        group_1_coherence_max: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
                        group_1_direction_options: { type: 'string', default: '0,180' },
                        group_1_speed_min: { type: 'number', default: 4, min: 0, max: 50 },
                        group_1_speed_max: { type: 'number', default: 10, min: 0, max: 50 },
                        group_2_coherence_min: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
                        group_2_coherence_max: { type: 'number', default: 0.9, min: 0, max: 1, step: 0.01 },
                        group_2_color: { type: 'COLOR', default: '#0066FF' },
                        group_2_direction_options: { type: 'string', default: '0,180' },
                        group_2_speed_min: { type: 'number', default: 4, min: 0, max: 50 },
                        group_2_speed_max: { type: 'number', default: 10, min: 0, max: 50 },

                        // Dot-groups cue border / target
                        response_target_group: { type: 'select', default: 'none', options: ['none', 'group_1', 'group_2'] },
                        cue_border_mode: { type: 'select', default: 'off', options: ['off', 'target-group-color', 'custom'] },
                        cue_border_color: { type: 'COLOR', default: '#FFFFFF' },
                        cue_border_width: { type: 'number', default: 4, min: 0, max: 20 }
                    }
                },
                {
                    id: 'rdm-adaptive',
                    name: 'RDM Adaptive',
                    icon: 'fas fa-chart-line',
                    description: 'Adaptive RDM trial with QUEST or staircase procedures',
                    category: 'advanced',
                    parameters: {
                        algorithm: { type: 'select', default: 'quest', options: ['quest', 'staircase', 'simple'] },
                        target_performance: { type: 'number', default: 0.82, min: 0.5, max: 1, step: 0.01 },
                        initial_coherence: { type: 'number', default: 0.1, min: 0, max: 1, step: 0.01 },
                        step_size: { type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.01 },
                        trial_duration: { type: 'number', default: 3000, min: 500, max: 30000 },
                        transition_duration: { type: 'number', default: 500, min: 0, max: 2000 }
                    }
                }
            );
        }

        // Add generic stimulus components
        baseComponents.push(
            {
                id: 'image-keyboard-response',
                name: 'Image + Keyboard',
                icon: 'fas fa-image',
                description: 'Show image and collect keyboard response',
                category: 'stimulus',
                parameters: {
                    stimulus: { type: 'string', default: 'img/sample.jpg' },
                    choices: { type: 'array', default: ['f', 'j'] },
                    stimulus_duration: { type: 'number', default: null },
                    trial_duration: { type: 'number', default: null }
                }
            },
            {
                id: 'html-button-response',
                name: 'HTML + Button',
                icon: 'fas fa-mouse-pointer',
                description: 'Show HTML content and collect button response',
                category: 'stimulus',
                parameters: {
                    stimulus: { type: 'string', default: '<p>Click a button</p>' },
                    choices: { type: 'array', default: ['Option 1', 'Option 2'] },
                    trial_duration: { type: 'number', default: null }
                }
            }
        );

        // Add specialized components based on data collection settings
        if (this.dataCollection['mouse-tracking']) {
            baseComponents.push({
                id: 'mouse-tracking',
                name: 'Mouse Tracking',
                icon: 'fas fa-mouse',
                description: 'Track mouse movement and clicks',
                category: 'tracking',
                parameters: {
                    track_movement: { type: 'boolean', default: true },
                    track_clicks: { type: 'boolean', default: true },
                    sampling_rate: { type: 'number', default: 50 }
                }
            });
        }

        if (this.dataCollection['eye-tracking']) {
            baseComponents.push({
                id: 'eye-tracking',
                name: 'Eye Tracking',
                icon: 'fas fa-eye',
                description: 'WebGazer-based eye tracking',
                category: 'tracking',
                parameters: {
                    calibration_points: { type: 'number', default: 9 },
                    prediction_points: { type: 'number', default: 50 },
                    sample_rate: { type: 'number', default: 30 }
                }
            });
        }

        // Add RDM task-specific components if RDM is selected
        const currentTaskType = document.getElementById('taskType')?.value;
        // Note: RDM components already added above, so no need to add them again here

        return baseComponents;
    }

    /**
     * Create component card element
     */
    createComponentCard(component) {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        
        col.innerHTML = `
            <div class="component-card" data-component-id="${component.id}">
                <div class="icon">
                    <i class="${component.icon}"></i>
                </div>
                <div class="title">${component.name}</div>
                <div class="description">${component.description}</div>
                <div class="mt-2">
                    <span class="badge bg-secondary">${component.category}</span>
                </div>
            </div>
        `;
        
        // Add click handler
        col.querySelector('.component-card').addEventListener('click', () => {
            this.addComponentToTimeline(component);
        });
        
        return col;
    }

    /**
     * Show component library modal
     */
    showComponentLibrary() {
        const modal = new bootstrap.Modal(document.getElementById('componentLibraryModal'));
        modal.show();
    }

    /**
     * Add component to timeline
     */
    addComponentToTimeline(componentDef) {
        // Get timeline container
        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) {
            console.error('Timeline container not found');
            return;
        }
        
        // For instructions components, use simple data format like Figma prototype
        if (componentDef.id === 'instructions') {
            // Hide empty state if visible
            const emptyState = timelineContainer.querySelector('.empty-timeline');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            const instructionsComponent = document.createElement('div');
            instructionsComponent.className = 'timeline-component card mb-2';
            instructionsComponent.dataset.componentType = 'html-keyboard-response';
            instructionsComponent.dataset.componentData = JSON.stringify(componentDef.data);
            
            instructionsComponent.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="drag-handle me-2" style="cursor: move; color: #ccc;">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div>
                                <h6 class="card-title mb-1">
                                    <i class="fas fa-info-circle text-info"></i> Instructions
                                </h6>
                                <small class="text-muted">Welcome screen with task instructions</small>
                            </div>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info" onclick="previewComponent(this)" title="Preview">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="editComponent(this)" title="Edit">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeComponent(this)" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            timelineContainer.appendChild(instructionsComponent);
            
            // Don't call renderTimeline() to avoid clearing existing components
        } else {
            // For other components, also create DOM elements directly instead of using timeline array
            // This prevents clearing existing components
            const componentElement = document.createElement('div');
            componentElement.className = 'timeline-component card mb-2';
            componentElement.dataset.componentType = componentDef.id;
            
            // Store component data
            const componentData = {
                type: componentDef.id,
                name: componentDef.name,
                ...this.getDefaultParameters(componentDef.parameters || {})
            };
            componentElement.dataset.componentData = JSON.stringify(componentData);
            
            componentElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="drag-handle me-2" style="cursor: move; color: #ccc;">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div>
                                <h6 class="card-title mb-1">
                                    <i class="${componentDef.icon} text-primary"></i> ${componentDef.name}
                                </h6>
                                <small class="text-muted">${componentDef.description}</small>
                            </div>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info" onclick="previewComponent(this)" title="Preview">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="editComponent(this)" title="Edit">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeComponent(this)" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            timelineContainer.appendChild(componentElement);
            
            // Hide empty state if visible
            const emptyState = timelineContainer.querySelector('.empty-timeline');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
        
        this.updateJSON();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('componentLibraryModal'));
        if (modal) modal.hide();
    }

    /**
     * Get default parameter values
     */
    getDefaultParameters(parameterDefs) {
        const params = {};
        for (const [key, def] of Object.entries(parameterDefs)) {
            params[key] = def.default;
        }
        return params;
    }

    /**
     * Clear timeline
     */
    clearTimeline() {
        if (confirm('Are you sure you want to clear the entire timeline?')) {
            this.timeline = [];
            this.componentCounter = 0;
            this.timelineBuilder.renderTimeline();
            this.updateJSON();
        }
    }

    /**
     * Update JSON preview
     */
    updateJSON() {
        // Update any dynamic instructions components
        if (typeof updateInstructionsComponents === 'function') {
            updateInstructionsComponents();
        }
        
        const json = this.generateJSON();
        const formatted = JSON.stringify(json, null, 2);
        const highlighted = this.highlightJSON(formatted);
        
        document.getElementById('jsonOutput').innerHTML = highlighted;
    }

    /**
     * Generate JSON configuration
     */
    generateJSON() {
        const config = {
            experiment_type: this.experimentType,
            data_collection: { ...this.dataCollection },
            timeline: this.getTimelineFromDOM()
        };

        // Add RDM-specific parameters
        config.display_parameters = this.getRDMDisplayParameters();
        config.aperture_parameters = this.getRDMApertureParameters();
        config.dot_parameters = this.getRDMDotParameters();
        config.motion_parameters = this.getRDMMotionParameters();
        config.timing_parameters = this.getRDMTimingParameters();
        config.response_parameters = this.getRDMResponseParameters();

        // Add experimental control parameters to match Figma prototype
        config.frame_rate = 60;
        config.duration = 30;
        config.update_interval = 1000;

        // Add experiment-specific parameters
        if (this.experimentType === 'trial-based') {
            const numTrials = document.getElementById('numTrials')?.value;
            const iti = document.getElementById('iti')?.value;
            const randomizeOrder = document.getElementById('randomizeOrder')?.checked;
            
            if (numTrials) config.num_trials = parseInt(numTrials);
            if (iti) config.default_iti = parseInt(iti);
            if (randomizeOrder !== undefined) config.randomize_order = randomizeOrder;
        } else if (this.experimentType === 'continuous') {
            const frameRate = document.getElementById('frameRate')?.value;
            const duration = document.getElementById('duration')?.value;
            const updateInterval = document.getElementById('updateInterval')?.value;
            
            if (frameRate) config.frame_rate = parseInt(frameRate);
            if (duration) config.duration = parseInt(duration);
            if (updateInterval) config.update_interval = parseInt(updateInterval);

            // Continuous-mode default transitions (applied to timeline components if not overridden)
            const defaultTransitionDuration = document.getElementById('defaultTransitionDuration')?.value;
            const defaultTransitionType = document.getElementById('defaultTransitionType')?.value;
            if (defaultTransitionDuration !== undefined || defaultTransitionType !== undefined) {
                config.transition_settings = {
                    duration_ms: defaultTransitionDuration ? parseInt(defaultTransitionDuration) : 0,
                    type: defaultTransitionType || 'both'
                };
            }
        }

        // Add RDM experiment-wide settings
        const canvasWidth = document.getElementById('canvasWidth')?.value;
        const canvasHeight = document.getElementById('canvasHeight')?.value;
        const backgroundColor = document.getElementById('backgroundColor')?.value;
        const fixationDuration = document.getElementById('fixationDuration')?.value;
        const responseKeys = document.getElementById('responseKeys')?.value;

        if (canvasWidth || canvasHeight || backgroundColor) {
            config.display_settings = {
                canvas_width: canvasWidth ? parseInt(canvasWidth) : 600,
                canvas_height: canvasHeight ? parseInt(canvasHeight) : 600,
                background_color: backgroundColor || '#404040'
            };
        }

        if (fixationDuration) {
            config.fixation_duration = parseInt(fixationDuration);
        }

        // Only export response keys when the default response device is keyboard.
        const defaultDevice = document.getElementById('defaultResponseDevice')?.value || 'keyboard';
        if (defaultDevice === 'keyboard' && responseKeys) {
            config.response_keys = responseKeys.split(',').map(key => key.trim());
        }

        return config;
    }

    getDefaultTransitionSettings() {
        if (this.experimentType !== 'continuous') {
            return null;
        }

        const durationRaw = document.getElementById('defaultTransitionDuration')?.value;
        const typeRaw = document.getElementById('defaultTransitionType')?.value;

        const durationMs = (durationRaw !== undefined && durationRaw !== null && durationRaw !== '')
            ? parseInt(durationRaw)
            : 0;

        const type = (typeof typeRaw === 'string' && typeRaw.trim() !== '') ? typeRaw : 'both';
        return { duration_ms: Number.isFinite(durationMs) ? durationMs : 0, type };
    }

    /**
     * Get timeline components from DOM
     */
    getTimelineFromDOM() {
        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) {
            return [];
        }

        const components = [];
        const componentElements = timelineContainer.querySelectorAll('.timeline-component');
        
        componentElements.forEach(element => {
            try {
                const rawData = element.dataset.componentData || '{}';
                console.log('Raw component data from DOM:', rawData);
                
                const componentData = JSON.parse(rawData);
                console.log('Parsed component data:', componentData);
                
                const transformed = this.transformComponent(componentData);
                console.log('Transformed component:', transformed);
                
                components.push(transformed);
            } catch (e) {
                console.warn('Failed to parse component data:', e, element);
            }
        });

        return components;
    }

    /**
     * Transform component parameters for JSON output
     */
    transformComponent(component) {
        console.log('transformComponent called with:', component);
        console.log('component.type:', component.type);
        
        // Handle html-keyboard-response components (Instructions) differently
        if (component.type === 'html-keyboard-response') {
            // Instructions components store parameters directly on the component object
            const instructionsComponent = {
                type: component.type,
                stimulus: component.stimulus,
                choices: component.choices,
                prompt: component.prompt,
                stimulus_duration: component.stimulus_duration,
                trial_duration: component.trial_duration,
                response_ends_trial: component.response_ends_trial
            };
            
            // Remove undefined/null values to clean up the JSON
            Object.keys(instructionsComponent).forEach(key => {
                if (instructionsComponent[key] === undefined || instructionsComponent[key] === null) {
                    delete instructionsComponent[key];
                }
            });
            
            console.log('Transformed Instructions component:', instructionsComponent);
            return instructionsComponent;
        }
        
        // Handle other component types - check if they have nested or flat parameter structure
        let baseComponent;
        
        if (component.parameters && typeof component.parameters === 'object') {
            // Nested structure (like from addTrialToTimeline)
            console.log('Using nested structure for component:', component.type);
            baseComponent = {
                type: component.type,
                ...component.parameters
            };
        } else {
            // Flat structure (like from component library) - spread all properties except type and name
            console.log('Using flat structure for component:', component.type);
            const { type, name, ...parameters } = component;
            console.log('Extracted type:', type, 'name:', name, 'parameters:', parameters);
            baseComponent = {
                type: type,
                ...parameters
            };
        }

        console.log('Base component before RDM check:', baseComponent);

        // Special handling for Block components (compact range/window representation)
        if (baseComponent.type === 'block') {
            return this.transformBlock(baseComponent);
        }

        // Note: rdm-dot-groups is handled later so it still benefits from
        // per-component response override generation/cleanup.

        // Per-component response overrides (RDM components)
        if (baseComponent.type && baseComponent.type.startsWith('rdm-')) {
            // Continuous-mode default transitions: apply if component doesn't specify
            if (this.experimentType === 'continuous') {
                const defaults = this.getDefaultTransitionSettings();
                if (defaults) {
                    if (baseComponent.transition_duration === undefined || baseComponent.transition_duration === null || baseComponent.transition_duration === '') {
                        baseComponent.transition_duration = defaults.duration_ms;
                    }
                    if (baseComponent.transition_type === undefined || baseComponent.transition_type === null || baseComponent.transition_type === '') {
                        baseComponent.transition_type = defaults.type;
                    }
                }
            } else {
                // Trial-based output should not include transition fields
                if ('transition_duration' in baseComponent) delete baseComponent.transition_duration;
                if ('transition_type' in baseComponent) delete baseComponent.transition_type;
            }

            const override = this.buildRDMResponseParametersOverride(baseComponent);
            if (override) {
                baseComponent.response_parameters_override = override;
            }

            // Remove editor-only override fields from exported component (kept in DOM dataset)
            [
                'response_device',
                'response_keys',
                'require_response_mode',
                'end_condition_on_response_mode',
                'feedback_mode',
                'feedback_duration_ms',
                'mouse_segments',
                'mouse_start_angle_deg',
                'mouse_selection_mode',
                'response_target_group',
                'cue_border_mode',
                'cue_border_color',
                'cue_border_width'
            ]
                .forEach(key => {
                    if (key in baseComponent) {
                        delete baseComponent[key];
                    }
                });
        }

        // Special handling for RDM dot groups (after override generation)
        if (baseComponent.type === 'rdm-dot-groups') {
            baseComponent = this.transformRDMDotGroups(baseComponent);
            console.log('Transformed RDM dot groups:', baseComponent);
        }

        console.log('Final transformed component:', baseComponent);
        return baseComponent;
    }

    transformBlock(blockComponent) {
        const componentType = blockComponent.block_component_type || 'rdm-trial';
        const lengthRaw = blockComponent.block_length;
        const length = Math.max(1, parseInt(lengthRaw ?? 1));
        const samplingMode = blockComponent.sampling_mode || 'per-trial';

        const seedStr = (blockComponent.seed ?? '').toString().trim();
        const seed = seedStr === '' ? null : Number.parseInt(seedStr, 10);
        const hasSeed = Number.isFinite(seed);

        const windows = {};
        const values = {};

        const addWindow = (name, minVal, maxVal) => {
            const minNum = Number(minVal);
            const maxNum = Number(maxVal);
            if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) return;
            windows[name] = { min: minNum, max: maxNum };
        };

        const parseNumberList = (raw, { min = 0, max = 359 } = {}) => {
            if (raw === undefined || raw === null) return [];
            const parts = raw
                .toString()
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const nums = [];
            for (const p of parts) {
                const n = Number(p);
                if (!Number.isFinite(n)) continue;
                if (n < min || n > max) continue;
                nums.push(n);
            }
            // de-dupe while preserving order
            return Array.from(new Set(nums));
        };

        if (componentType === 'rdm-trial') {
            addWindow('coherence', blockComponent.coherence_min, blockComponent.coherence_max);
            addWindow('speed', blockComponent.speed_min, blockComponent.speed_max);

            const dirs = parseNumberList(blockComponent.direction_options, { min: 0, max: 359 });
            if (dirs.length > 0) {
                values.direction = dirs;
            }

            if (typeof blockComponent.dot_color === 'string' && blockComponent.dot_color.trim() !== '') {
                values.dot_color = blockComponent.dot_color;
            }
        } else if (componentType === 'rdm-practice') {
            addWindow('coherence', blockComponent.practice_coherence_min, blockComponent.practice_coherence_max);
            addWindow('feedback_duration', blockComponent.practice_feedback_duration_min, blockComponent.practice_feedback_duration_max);

            const dirs = parseNumberList(blockComponent.practice_direction_options, { min: 0, max: 359 });
            if (dirs.length > 0) {
                values.direction = dirs;
            }

            if (typeof blockComponent.dot_color === 'string' && blockComponent.dot_color.trim() !== '') {
                values.dot_color = blockComponent.dot_color;
            }
        } else if (componentType === 'rdm-adaptive') {
            addWindow('initial_coherence', blockComponent.adaptive_initial_coherence_min, blockComponent.adaptive_initial_coherence_max);
            addWindow('step_size', blockComponent.adaptive_step_size_min, blockComponent.adaptive_step_size_max);

            const algo = blockComponent.adaptive_algorithm;
            if (typeof algo === 'string' && algo.trim() !== '') {
                values.algorithm = algo;
            }
            const tp = Number(blockComponent.adaptive_target_performance);
            if (Number.isFinite(tp)) {
                values.target_performance = tp;
            }

            if (typeof blockComponent.dot_color === 'string' && blockComponent.dot_color.trim() !== '') {
                values.dot_color = blockComponent.dot_color;
            }
        } else if (componentType === 'rdm-dot-groups') {
            addWindow('group_1_percentage', blockComponent.group_1_percentage_min, blockComponent.group_1_percentage_max);
            addWindow('group_1_coherence', blockComponent.group_1_coherence_min, blockComponent.group_1_coherence_max);
            addWindow('group_1_speed', blockComponent.group_1_speed_min, blockComponent.group_1_speed_max);

            addWindow('group_2_coherence', blockComponent.group_2_coherence_min, blockComponent.group_2_coherence_max);
            addWindow('group_2_speed', blockComponent.group_2_speed_min, blockComponent.group_2_speed_max);

            const g1Dirs = parseNumberList(blockComponent.group_1_direction_options, { min: 0, max: 359 });
            if (g1Dirs.length > 0) {
                values.group_1_direction = g1Dirs;
            }
            const g2Dirs = parseNumberList(blockComponent.group_2_direction_options, { min: 0, max: 359 });
            if (g2Dirs.length > 0) {
                values.group_2_direction = g2Dirs;
            }

            // Dot colors (for cue-border target-group-color and general group styling)
            const fallbackDotColor = (typeof blockComponent.dot_color === 'string' && blockComponent.dot_color.trim() !== '')
                ? blockComponent.dot_color
                : null;

            const g1Color = (typeof blockComponent.group_1_color === 'string' && blockComponent.group_1_color.trim() !== '')
                ? blockComponent.group_1_color
                : fallbackDotColor;
            const g2Color = (typeof blockComponent.group_2_color === 'string' && blockComponent.group_2_color.trim() !== '')
                ? blockComponent.group_2_color
                : fallbackDotColor;

            if (g1Color) values.group_1_color = g1Color;
            if (g2Color) values.group_2_color = g2Color;
        }

        const out = {
            type: 'block',
            component_type: componentType,
            length: length,
            sampling_mode: samplingMode,
            parameter_windows: windows
        };

        if (Object.keys(values).length > 0) {
            out.parameter_values = values;
        }

        // Continuous-mode transitions for generated trials (fixed per block)
        if (this.experimentType === 'continuous') {
            const defaults = this.getDefaultTransitionSettings();
            const duration = (blockComponent.transition_duration !== undefined && blockComponent.transition_duration !== null && blockComponent.transition_duration !== '')
                ? parseInt(blockComponent.transition_duration)
                : (defaults?.duration_ms ?? 0);

            const type = (typeof blockComponent.transition_type === 'string' && blockComponent.transition_type.trim() !== '')
                ? blockComponent.transition_type
                : (defaults?.type ?? 'both');

            out.parameter_values = out.parameter_values || {};
            out.parameter_values.transition_duration = Number.isFinite(duration) ? duration : 0;
            out.parameter_values.transition_type = type;
        }

        // Optional per-block response override
        if (componentType && componentType.startsWith('rdm-')) {
            const override = this.buildRDMResponseParametersOverride(blockComponent);
            if (override) {
                out.response_parameters_override = override;
            }
        }

        if (hasSeed) {
            out.seed = seed;
        }

        return out;
    }

    /**
     * Build per-component response override by inheriting experiment defaults
     * and applying any component-specific overrides.
     */
    buildRDMResponseParametersOverride(componentParams) {
        const responseDevice = componentParams.response_device;
        const responseKeys = componentParams.response_keys;
        const requireMode = componentParams.require_response_mode;

        // Continuous-only behavior override
        const endConditionMode = componentParams.end_condition_on_response_mode;

        // Feedback override
        const feedbackMode = componentParams.feedback_mode;
        const feedbackDurationRaw = componentParams.feedback_duration_ms;

        // Dot-groups target + cue border
        const responseTargetGroup = componentParams.response_target_group ?? componentParams.custom_response ?? componentParams.customResponse;
        const cueBorderMode = componentParams.cue_border_mode;
        const cueBorderColor = componentParams.cue_border_color;
        const cueBorderWidth = componentParams.cue_border_width;

        const hasDeviceOverride = typeof responseDevice === 'string' && responseDevice !== '' && responseDevice !== 'inherit';
        const hasKeysOverride = typeof responseKeys === 'string' && responseKeys.trim() !== '';
        const hasRequireOverride = typeof requireMode === 'string' && requireMode !== '' && requireMode !== 'inherit';
        const hasEndConditionOverride = (
            this.experimentType === 'continuous' &&
            typeof endConditionMode === 'string' &&
            endConditionMode !== '' &&
            endConditionMode !== 'inherit'
        );
        const hasFeedbackOverride = typeof feedbackMode === 'string' && feedbackMode !== '' && feedbackMode !== 'inherit';
        const hasMouseOverride = (
            responseDevice === 'mouse' &&
            (componentParams.mouse_segments !== undefined || componentParams.mouse_start_angle_deg !== undefined || componentParams.mouse_selection_mode !== undefined)
        );

        const hasTargetOverride = typeof responseTargetGroup === 'string' && responseTargetGroup !== '' && responseTargetGroup !== 'none';
        const hasCueOverride = typeof cueBorderMode === 'string' && cueBorderMode !== '' && cueBorderMode !== 'off';

        if (!hasDeviceOverride && !hasKeysOverride && !hasRequireOverride && !hasEndConditionOverride && !hasFeedbackOverride && !hasMouseOverride && !hasTargetOverride && !hasCueOverride) {
            return null;
        }

        // Start from experiment-wide defaults
        const defaults = this.getRDMResponseParameters();
        const merged = JSON.parse(JSON.stringify(defaults));

        // Apply device override
        if (hasDeviceOverride) {
            merged.response_device = responseDevice;
        }

        // Apply require_response override
        if (hasRequireOverride) {
            merged.require_response = requireMode === 'true';
        }

        // Apply continuous-only end condition behavior
        if (hasEndConditionOverride) {
            merged.end_condition_on_response = endConditionMode === 'true';
        }

        // Apply feedback override
        if (hasFeedbackOverride) {
            if (feedbackMode === 'off') {
                if (merged.feedback) {
                    delete merged.feedback;
                }
            } else {
                const duration = (feedbackDurationRaw !== undefined && feedbackDurationRaw !== null && feedbackDurationRaw !== '')
                    ? parseInt(feedbackDurationRaw)
                    : (merged.feedback?.duration_ms ?? 500);

                merged.feedback = {
                    enabled: true,
                    type: feedbackMode,
                    duration_ms: Number.isFinite(duration) ? duration : 500
                };
            }
        }

        // Apply key overrides (keyboard)
        if (hasKeysOverride) {
            const choices = responseKeys.split(',').map(k => k.trim()).filter(Boolean);
            merged.choices = choices;
            merged.key_mapping = {
                [choices[0] || 'f']: 'left',
                [choices[1] || 'j']: 'right'
            };
        }

        // Apply mouse overrides
        const effectiveDevice = merged.response_device || 'keyboard';
        if (effectiveDevice === 'mouse') {
            merged.mouse_response = {
                enabled: true,
                mode: 'aperture-segments',
                segments: parseInt(componentParams.mouse_segments ?? merged.mouse_response?.segments ?? 2),
                start_angle_deg: parseFloat(componentParams.mouse_start_angle_deg ?? merged.mouse_response?.start_angle_deg ?? 0),
                selection_mode: componentParams.mouse_selection_mode ?? merged.mouse_response?.selection_mode ?? 'click'
            };
        } else {
            // Keep output clean if not a mouse-response component
            if (merged.mouse_response) {
                delete merged.mouse_response;
            }
        }

        // Apply dot-group target + cue border (if present)
        if (hasTargetOverride) {
            merged.target_group = responseTargetGroup;
        }

        const resolvedCue = this.resolveCueBorderFromComponent(componentParams, merged);
        if (resolvedCue) {
            merged.cue_border = resolvedCue;
        }

        return merged;
    }

    resolveCueBorderFromComponent(componentParams, mergedResponseParams) {
        const target = componentParams.response_target_group ?? componentParams.custom_response ?? componentParams.customResponse;
        const mode = componentParams.cue_border_mode;

        if (!target || target === 'none' || !mode || mode === 'off') {
            return null;
        }

        const width = parseInt(componentParams.cue_border_width ?? 4);

        let color;
        if (mode === 'custom') {
            color = componentParams.cue_border_color || '#FFFFFF';
        } else if (mode === 'target-group-color') {
            if (target === 'group_1') {
                color = componentParams.group_1_color || '#FF0066';
            } else if (target === 'group_2') {
                color = componentParams.group_2_color || '#0066FF';
            } else {
                // Fallback for unexpected targets
                color = '#FFFFFF';
            }
        } else {
            return null;
        }

        return {
            enabled: true,
            mode,
            target_group: target,
            color,
            width
        };
    }

    /**
     * Transform flat RDM dot groups parameters to nested structure
     */
    transformRDMDotGroups(component) {
        const transformed = {
            type: component.type
        };

        // Preserve response override if it was generated upstream
        if (component.response_parameters_override) {
            transformed.response_parameters_override = component.response_parameters_override;
        }

        // Group configuration
        transformed.group_1_percentage = (component.group_1_percentage ?? 50);
        transformed.group_1_color = component.group_1_color ?? '#FF0066';
        transformed.group_1_coherence = (component.group_1_coherence ?? 0.2);
        if (component.group_1_direction !== undefined) transformed.group_1_direction = component.group_1_direction;

        // Optional per-group speeds
        if (component.group_1_speed !== undefined && component.group_1_speed !== null && component.group_1_speed !== '') {
            transformed.group_1_speed = component.group_1_speed;
        }

        transformed.group_2_percentage = (component.group_2_percentage ?? 50);
        transformed.group_2_color = component.group_2_color ?? '#0066FF';
        transformed.group_2_coherence = (component.group_2_coherence ?? 0.8);
        if (component.group_2_direction !== undefined) transformed.group_2_direction = component.group_2_direction;

        if (component.group_2_speed !== undefined && component.group_2_speed !== null && component.group_2_speed !== '') {
            transformed.group_2_speed = component.group_2_speed;
        }

        // Common dot-groups parameters from schema
        if (component.total_dots !== undefined) transformed.total_dots = component.total_dots;
        if (component.aperture_diameter !== undefined) transformed.aperture_diameter = component.aperture_diameter;
        if (component.trial_duration !== undefined) transformed.trial_duration = component.trial_duration;
        if (component.transition_duration !== undefined) transformed.transition_duration = component.transition_duration;

        return transformed;
    }

    /**
     * Get RDM display parameters from UI - SIMPLIFIED
     */
    getRDMDisplayParameters() {
        return {
            canvas_width: parseInt(document.getElementById('canvasWidth')?.value || 600),
            canvas_height: parseInt(document.getElementById('canvasHeight')?.value || 600),
            background_color: "#404040"
        };
    }

    /**
     * Get RDM aperture parameters from UI
     */
    getRDMApertureParameters() {
        return {
            shape: document.getElementById('apertureShape')?.value || 'circle',
            diameter: parseInt(document.getElementById('apertureDiameter')?.value || 350),
            center_x: parseInt(document.getElementById('canvasWidth')?.value || 600) / 2,
            center_y: parseInt(document.getElementById('canvasHeight')?.value || 600) / 2
        };
    }

    /**
     * Get RDM dot parameters from UI including groups
     */
    getRDMDotParameters() {
        const params = {
            total_dots: parseInt(document.getElementById('totalDots')?.value || 150),
            dot_size: parseInt(document.getElementById('dotSize')?.value || 4),
            dot_color: document.getElementById('dotColor')?.value || '#FFFFFF',
            lifetime_frames: parseInt(document.getElementById('dotLifetime')?.value || 5)
        };

        // Add dot groups configuration if enabled
        const groupsConfig = this.getDotGroupsConfiguration();
        if (groupsConfig) {
            params.groups = groupsConfig;
        }

        return params;
    }

    /**
     * Get RDM motion parameters from UI
     */
    getRDMMotionParameters() {
        return {
            coherence: parseFloat(document.getElementById('motionCoherence')?.value || 0.5),
            direction: parseInt(document.getElementById('motionDirection')?.value || 0),
            speed: parseInt(document.getElementById('motionSpeed')?.value || 6),
            noise_type: document.getElementById('noiseType')?.value || 'random_direction'
        };
    }

    /**
     * Get RDM timing parameters from UI
     */
    getRDMTimingParameters() {
        return {
            fixation_duration: parseInt(document.getElementById('fixationDuration')?.value || 500),
            stimulus_duration: parseInt(document.getElementById('stimulusDuration')?.value || 1500),
            response_deadline: parseInt(document.getElementById('responseDeadline')?.value || 2500),
            inter_trial_interval: parseInt(document.getElementById('interTrialInterval')?.value || 1200)
        };
    }

    /**
     * Get RDM response parameters from UI
     */
    getRDMResponseParameters() {
        const requireResponse = document.getElementById('requireResponse')?.checked !== false;

        const responseDevice = document.getElementById('defaultResponseDevice')?.value || 'keyboard';
        
        const responseParams = {
            require_response: requireResponse,
            response_device: responseDevice
        };

        // Continuous-only: response ends condition
        if (this.experimentType === 'continuous') {
            const endOnResponse = document.getElementById('endConditionOnResponse')?.checked === true;
            responseParams.end_condition_on_response = endOnResponse;
        }

        // Optional feedback (works in either mode; interpretation is up to runtime)
        const feedbackType = document.getElementById('defaultFeedbackType')?.value || 'off';
        if (feedbackType !== 'off') {
            const durationRaw = document.getElementById('defaultFeedbackDuration')?.value;
            const duration = (durationRaw !== undefined && durationRaw !== null && durationRaw !== '') ? parseInt(durationRaw) : 500;
            responseParams.feedback = {
                enabled: true,
                type: feedbackType,
                duration_ms: Number.isFinite(duration) ? duration : 500
            };
        }

        // Only include keyboard keys/mapping when keyboard is the active response device.
        if (responseDevice === 'keyboard') {
            const keysValue = document.getElementById('responseKeys')?.value || 'f,j';
            const choices = keysValue.split(',').map(key => key.trim()).filter(Boolean);
            responseParams.choices = choices;
            responseParams.key_mapping = {
                [choices[0] || 'f']: 'left',
                [choices[1] || 'j']: 'right'
            };
        }

        if (responseDevice === 'mouse') {
            responseParams.mouse_response = {
                enabled: true,
                mode: 'aperture-segments',
                segments: parseInt(document.getElementById('mouseApertureSegments')?.value || 2),
                start_angle_deg: parseFloat(document.getElementById('mouseSegmentStartAngle')?.value || 0),
                selection_mode: document.getElementById('mouseSelectionMode')?.value || 'click'
            };
        }

        if (responseDevice === 'touch') {
            responseParams.touch_response = {
                enabled: true
            };
        }

        if (responseDevice === 'voice') {
            responseParams.voice_response = {
                enabled: true
            };
        }

        return responseParams;
    }

    /**
     * Get dot groups configuration from UI
     */
    getDotGroupsConfiguration() {
        // This method should be available from the HTML script section
        if (typeof window !== 'undefined' && window.getDotGroupsConfiguration) {
            return window.getDotGroupsConfiguration();
        }
        return null;
    }

    /**
     * Add basic JSON syntax highlighting
     */
    highlightJSON(json) {
        return json
            .replace(/("([^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:')
            .replace(/:\s*("([^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
    }

    /**
     * Validate JSON configuration
     */
    validateJSON() {
        try {
            const config = this.generateJSON();
            const validation = this.schemaValidator.validate(config);
            
            if (validation.valid) {
                this.showValidationResult('success', 'Configuration is valid!');
            } else {
                this.showValidationResult('error', `Validation errors: ${validation.errors.join(', ')}`);
            }
        } catch (error) {
            this.showValidationResult('error', `Validation failed: ${error.message}`);
        }
    }

    /**
     * Show validation result
     */
    showValidationResult(type, message) {
        // Create temporary alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * Copy JSON to clipboard
     */
    async copyJSONToClipboard() {
        try {
            const json = JSON.stringify(this.generateJSON(), null, 2);
            await navigator.clipboard.writeText(json);
            this.showValidationResult('success', 'JSON copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy JSON:', error);
            this.showValidationResult('error', 'Failed to copy JSON to clipboard');
        }
    }

    /**
     * Export JSON file
     */
    exportJSON() {
        const config = this.generateJSON();
        const json = JSON.stringify(config, null, 2);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `experiment_config_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showValidationResult('success', 'JSON configuration exported successfully!');
    }

    /**
     * Save current configuration as template
     */
    saveTemplate() {
        const name = prompt('Enter template name:');
        if (name) {
            this.templates[name] = {
                timeline: [...this.timeline],
                experimentType: this.experimentType,
                dataCollection: { ...this.dataCollection }
            };
            
            // Save to localStorage
            localStorage.setItem('psychjson_templates', JSON.stringify(this.templates));
            this.showValidationResult('success', `Template "${name}" saved successfully!`);
        }
    }

    /**
     * Load template
     */
    loadTemplate() {
        // Load templates from localStorage
        const saved = localStorage.getItem('psychjson_templates');
        if (saved) {
            this.templates = JSON.parse(saved);
        }
        
        const templateNames = Object.keys(this.templates);
        if (templateNames.length === 0) {
            this.showValidationResult('warning', 'No saved templates found');
            return;
        }
        
        // Show template selection (simple prompt for now, could be enhanced with modal)
        const selection = prompt(`Select template:\n${templateNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number:`);
        const index = parseInt(selection) - 1;
        
        if (index >= 0 && index < templateNames.length) {
            const templateName = templateNames[index];
            const template = this.templates[templateName];
            
            this.timeline = [...template.timeline];
            this.experimentType = template.experimentType;
            this.dataCollection = { ...template.dataCollection };
            
            // Update UI
            this.updateExperimentTypeUI();
            this.timelineBuilder.renderTimeline();
            this.updateJSON();
            this.showValidationResult('success', `Template "${templateName}" loaded successfully!`);
        }
    }

    /**
     * Load default RDM template and populate UI
     */
    loadDefaultRDMTemplate() {
        // Default RDM parameters
        const defaultRDM = {
            experiment_meta: {
                name: "RDM Experiment",
                version: "1.0.0",
                description: "Random Dot Motion task",
                author: "Psychology Lab",
                jsPsych_version: "8.0+"
            },
            experiment_type: "trial-based",
            data_collection: {
                reaction_time: { enabled: true },
                accuracy: { enabled: true },
                mouse_tracking: { enabled: false },
                keyboard_tracking: { enabled: false },
                eye_tracking: { enabled: false }
            },
            display_parameters: {
                canvas_width: 600,
                canvas_height: 600,
                background_color: "#404040"
            },
            aperture_parameters: {
                shape: "circle",
                diameter: 350,
                center_x: 400,
                center_y: 300
            },
            dot_parameters: {
                total_dots: 150,
                dot_size: 4,
                dot_color: "#FFFFFF",
                lifetime_frames: 5
            },
            motion_parameters: {
                coherence: 0.5,
                direction: 0,
                speed: 6,
                noise_type: "random_direction"
            },
            timing_parameters: {
                fixation_duration: 500,
                stimulus_duration: 1500,
                response_deadline: 2500,
                inter_trial_interval: 1200
            },
            response_parameters: {
                choices: ["f", "j"],
                require_response: true
            },
            timeline: []
        };

        // Store the template
        this.currentExperiment = defaultRDM;
        
        // Populate UI with default values
        this.populateRDMUI();
        
        // Add sample trials to timeline
        this.addSampleTrials();
    }

    /**
     * Populate RDM UI elements with template values
     */
    populateRDMUI() {
        const exp = this.currentExperiment;
        
        // Display parameters
        this.setElementValue('canvasWidth', exp.display_parameters?.canvas_width);
        this.setElementValue('canvasHeight', exp.display_parameters?.canvas_height);
        
        // Aperture parameters
        this.setElementValue('apertureShape', exp.aperture_parameters?.shape);
        this.setElementValue('apertureDiameter', exp.aperture_parameters?.diameter);
        
        // Dot parameters
        this.setElementValue('totalDots', exp.dot_parameters?.total_dots);
        this.setElementValue('dotSize', exp.dot_parameters?.dot_size);
        this.setElementValue('dotColor', exp.dot_parameters?.dot_color);
        this.setElementValue('dotLifetime', exp.dot_parameters?.lifetime_frames);
        
        // Motion parameters
        this.setElementValue('motionCoherence', exp.motion_parameters?.coherence);
        this.setElementValue('motionDirection', exp.motion_parameters?.direction);
        this.setElementValue('motionSpeed', exp.motion_parameters?.speed);
        this.setElementValue('noiseType', exp.motion_parameters?.noise_type);
        
        // Timing parameters
        this.setElementValue('stimulusDuration', exp.timing_parameters?.stimulus_duration);
        this.setElementValue('responseDeadline', exp.timing_parameters?.response_deadline);
        this.setElementValue('interTrialInterval', exp.timing_parameters?.inter_trial_interval);
        this.setElementValue('fixationDuration', exp.timing_parameters?.fixation_duration);
        
        // Response parameters
        if (exp.response_parameters?.choices) {
            this.setElementValue('responseKeys', exp.response_parameters.choices.join(','));
        }
        this.setElementChecked('requireResponse', exp.response_parameters?.require_response);

        // Continuous-only end-on-response (if present in template)
        if (exp.response_parameters && typeof exp.response_parameters.end_condition_on_response === 'boolean') {
            this.setElementChecked('endConditionOnResponse', exp.response_parameters.end_condition_on_response);
        }

        // Optional feedback defaults (if present in template)
        if (exp.response_parameters?.feedback?.type) {
            this.setElementValue('defaultFeedbackType', exp.response_parameters.feedback.type);
            this.setElementValue('defaultFeedbackDuration', exp.response_parameters.feedback.duration_ms);
        }

        // Mouse response (optional)
        if (exp.response_parameters?.mouse_response) {
            this.setElementValue('mouseApertureSegments', exp.response_parameters.mouse_response.segments);
            this.setElementValue('mouseSegmentStartAngle', exp.response_parameters.mouse_response.start_angle_deg);
            this.setElementValue('mouseSelectionMode', exp.response_parameters.mouse_response.selection_mode);
        }
        this.setElementChecked('enableFixation', true);
        
        // Update coherence display
        const coherenceSlider = document.getElementById('motionCoherence');
        const coherenceValue = document.getElementById('coherenceValue');
        if (coherenceSlider && coherenceValue) {
            coherenceValue.textContent = parseFloat(coherenceSlider.value).toFixed(2);
        }

        this.updateConditionalUI();
    }

    /**
     * Helper to set element value safely
     */
    setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    }

    /**
     * Helper to set checkbox state safely
     */
    setElementChecked(id, checked) {
        const element = document.getElementById(id);
        if (element && checked !== undefined) {
            element.checked = checked;
        }
    }

    /**
     * Add sample trials to the timeline
     */
    addSampleTrials() {
        const trials = [
            { name: "Practice - High Coherence", coherence: 0.8, direction: 0, color: "#FFFF00" },
            { name: "Practice - High Coherence", coherence: 0.8, direction: 180, color: "#FFFF00" },
            { name: "Test - Low Coherence", coherence: 0.1, direction: 0, color: "#FFFFFF" },
            { name: "Test - Medium Coherence", coherence: 0.5, direction: 180, color: "#FFFFFF" },
            { name: "Test - High Coherence", coherence: 0.9, direction: 0, color: "#FFFFFF" }
        ];

        trials.forEach((trial, index) => {
            this.addTrialToTimeline(trial, index + 1);
        });
    }

    /**
     * Add a trial to the timeline UI
     */
    addTrialToTimeline(trial, index) {
        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) return;

        const trialElement = document.createElement('div');
        trialElement.className = 'timeline-component card mb-2';
        trialElement.dataset.componentType = 'rdm-trial';
        
        // Store component data for editing and preview
        const componentData = {
            type: 'rdm-trial',
            name: trial.name,
            parameters: {
                coherence: trial.coherence,
                direction: trial.direction,
                dot_color: trial.color, // Map color to dot_color for schema compatibility
                speed: 6, // Default speed
                total_dots: 150, // Default total dots
                dot_size: 4, // Default dot size
                aperture_diameter: 350, // Default aperture
                stimulus_duration: 1500, // Default duration
                trial_duration: 3000, // Default trial duration for continuous mode
                transition_duration: 500, // Default transition duration
                ...trial // Include any other trial properties
            }
        };
        trialElement.dataset.componentData = JSON.stringify(componentData);
        
        trialElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="drag-handle me-2" style="cursor: move; color: #ccc;">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <div>
                            <h6 class="card-title mb-1">${trial.name}</h6>
                            <small class="text-muted">Coherence: ${trial.coherence}, Direction: ${trial.direction}°</small>
                            <div class="mt-1">
                                <span class="badge bg-secondary">Trial ${index}</span>
                                <span class="badge" style="background-color: ${trial.color}; color: #000000;">●</span>
                            </div>
                        </div>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="previewComponent(this)" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="editComponent(this)" title="Edit">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeComponent(this)" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Hide empty state when adding components
        const emptyState = timelineContainer.querySelector('.empty-timeline');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        timelineContainer.appendChild(trialElement);
    }

    /**
     * Get current RDM parameters for preview
     */
    getCurrentRDMParameters() {
        // Helper function to safely get element value with fallback
        const getValue = (id, fallback, type = 'string') => {
            const element = document.getElementById(id);
            if (!element) return fallback;
            
            const value = element.value;
            if (!value && value !== 0) return fallback;
            
            switch (type) {
                case 'number':
                    const num = parseFloat(value);
                    return isNaN(num) ? fallback : num;
                case 'int':
                    const int = parseInt(value);
                    return isNaN(int) ? fallback : int;
                default:
                    return value;
            }
        };

        // Collect parameters from the current form
        return {
            canvas_width: getValue('canvasWidth', 600, 'int'),
            canvas_height: getValue('canvasHeight', 600, 'int'),
            aperture_shape: getValue('apertureShape', 'circle'),
            aperture_size: getValue('apertureSize', 300, 'int'),
            background_color: getValue('backgroundColor', '#404040'),
            dot_size: getValue('dotSize', 4, 'int'),
            dot_color: getValue('dotColor', '#ffffff'),
            total_dots: getValue('totalDots', 150, 'int'),
            coherence: getValue('motionCoherence', 0.5, 'number'),
            coherent_direction: getValue('motionDirection', 0, 'int'),
            speed: getValue('motionSpeed', 5, 'int'),
            lifetime_frames: getValue('dotLifetime', 60, 'int'),
            noise_type: 'random_direction'
        };
    }

    /**
     * Save parameters from modal
     */
    saveParameters() {
        // Get the currently edited component (stored when modal was opened)
        const currentComponent = this.currentEditingComponent;
        if (!currentComponent) {
            console.warn('No component currently being edited');
            return;
        }
        
        // Collect parameters from the modal
        const parameters = {
            canvas_width: this.getModalValue('modalCanvasWidth', 600, 'int'),
            canvas_height: this.getModalValue('modalCanvasHeight', 600, 'int'),
            aperture_shape: this.getModalValue('modalApertureShape', 'circle'),
            aperture_size: this.getModalValue('modalApertureSize', 300, 'int'),
            background_color: this.getModalValue('modalBackgroundColor', '#404040'),
            dot_size: this.getModalValue('modalDotSize', 4, 'int'),
            dot_color: this.getModalValue('modalDotColor', '#ffffff'),
            total_dots: this.getModalValue('modalTotalDots', 150, 'int'),
            coherence: this.getModalValue('modalMotionCoherence', 0.5, 'number'),
            coherent_direction: this.getModalValue('modalMotionDirection', 0, 'int'),
            speed: this.getModalValue('modalMotionSpeed', 5, 'int'),
            lifetime_frames: this.getModalValue('modalDotLifetime', 60, 'int'),
            noise_type: 'random_direction'
        };
        
        // Store parameters in the component's data attribute
        currentComponent.dataset.componentData = JSON.stringify(parameters);
        
        // Update the component's visual display
        this.updateComponentDisplay(currentComponent, parameters);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('parameterModal'));
        if (modal) {
            modal.hide();
        }
        
        // Update JSON
        this.updateJSON();
        
        console.log('Saved parameters for component:', parameters);
    }
    
    /**
     * Helper method to get modal values safely
     */
    getModalValue(id, fallback, type = 'string') {
        const element = document.getElementById(id);
        if (!element) return fallback;
        
        const value = element.value;
        if (!value && value !== 0) return fallback;
        
        switch (type) {
            case 'number':
                const num = parseFloat(value);
                return isNaN(num) ? fallback : num;
            case 'int':
                const int = parseInt(value);
                return isNaN(int) ? fallback : int;
            default:
                return value;
        }
    }
    
    /**
     * Update component display with new parameters
     */
    updateComponentDisplay(component, parameters) {
        const titleElement = component.querySelector('.card-title');
        const descriptionElement = component.querySelector('.text-muted');
        const badgeContainer = component.querySelector('.mt-1');
        
        if (titleElement && descriptionElement) {
            // Update the description with key parameters
            descriptionElement.textContent = `Coherence: ${parameters.coherence.toFixed(2)}, Direction: ${parameters.coherent_direction}°, Dots: ${parameters.total_dots}`;
        }
        
        // Add a "configured" badge to show this component has custom parameters
        if (badgeContainer) {
            // Remove existing configured badge if present
            const existingBadge = badgeContainer.querySelector('.badge-configured');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            // Add configured badge
            const configuredBadge = document.createElement('span');
            configuredBadge.className = 'badge bg-success badge-configured ms-1';
            configuredBadge.textContent = 'Configured';
            configuredBadge.title = 'Component has custom parameters';
            badgeContainer.appendChild(configuredBadge);
        }
    }
    
    /**
     * Set the currently editing component (called when modal opens)
     */
    setEditingComponent(component) {
        this.currentEditingComponent = component;
    }
    
    /**
     * Preview current component with modal values
     */
    previewCurrentComponent() {
        // Get current parameters from the parameter form
        const modalBody = document.getElementById('parameterModalBody');
        if (!modalBody) {
            console.error('Parameter modal body not found');
            return;
        }

        // Collect current form values
        const inputs = modalBody.querySelectorAll('input, textarea, select');
        const currentParams = {};

        inputs.forEach(input => {
            // Ignore disabled fields (hidden modality-specific controls)
            if (input.disabled) return;

            let paramName = input.id.replace('param_', '');
            // Handle simple field names (no param_ prefix)
            if (paramName === input.id) {
                paramName = input.id;
            }
            
            let value = input.value;

            // Handle different input types
            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'range') {
                value = input.step === '1' ? parseInt(value) : parseFloat(value);
            } else if (input.type === 'number') {
                value = input.step === '1' ? parseInt(value) : parseFloat(value);
            }

            currentParams[paramName] = value;
        });

        console.log('Preview parameters from form:', currentParams);

        // Determine component type being edited (so dot-groups preview actually renders groups)
        let componentType = 'psychophysics-rdm';
        let componentName = undefined;
        try {
            if (this.currentEditingComponent?.dataset?.componentData) {
                const stored = JSON.parse(this.currentEditingComponent.dataset.componentData);
                if (stored?.type) componentType = stored.type;
                if (stored?.name) componentName = stored.name;
            }
        } catch (e) {
            console.warn('Could not parse currentEditingComponent for preview type:', e);
        }

        // Instructions component - simple structure
        if (currentParams.instructionsText !== undefined) {
            const previewData = {
                type: 'html-keyboard-response',
                stimulus: currentParams.instructionsText || 'No instructions provided',
                choices: currentParams.responseKeys || 'ALL_KEYS'
            };

            console.log('Preview data for component type:', previewData.type, previewData);
            if (window.componentPreview) {
                window.componentPreview.showPreview(previewData);
            } else {
                console.error('ComponentPreview not found');
            }
            return;
        }

        // For RDM previews, merge experiment-wide display defaults so preview matches the main UI
        const display = this.getRDMDisplayParameters();
        const aperture = this.getRDMApertureParameters();
        const dotDefaults = this.getRDMDotParameters();
        const motionDefaults = this.getRDMMotionParameters();

        // Build a preview payload that ComponentPreview understands (flat params)
        const previewData = {
            type: componentType,
            name: componentName,

            canvas_width: display.canvas_width,
            canvas_height: display.canvas_height,
            background_color: display.background_color,

            aperture_shape: aperture.shape,
            aperture_diameter: aperture.diameter,

            dot_size: dotDefaults.dot_size,
            dot_color: dotDefaults.dot_color,
            total_dots: dotDefaults.total_dots,
            lifetime_frames: dotDefaults.lifetime_frames,

            coherence: motionDefaults.coherence,
            direction: motionDefaults.direction,
            speed: motionDefaults.speed,
            noise_type: motionDefaults.noise_type,

            // Include any experiment-wide dot-groups config if present
            ...(dotDefaults.groups ? { groups: dotDefaults.groups } : {})
        };

        // Apply modal overrides (ignore *_hex helper fields, but use them as fallback)
        Object.entries(currentParams).forEach(([key, value]) => {
            if (key.endsWith('_hex')) return;
            previewData[key] = value;
        });

        // If a color field is missing but a *_hex field exists, use it
        Object.entries(currentParams).forEach(([key, value]) => {
            if (!key.endsWith('_hex')) return;
            const baseKey = key.slice(0, -4);
            if (previewData[baseKey] === undefined || previewData[baseKey] === '' || previewData[baseKey] === null) {
                previewData[baseKey] = value;
            }
        });

        console.log('Preview data for component type:', previewData.type, previewData);

        // Show preview with correct component data
        if (window.componentPreview) {
            window.componentPreview.showPreview(previewData);
        } else {
            console.error('ComponentPreview not found');
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsonBuilder;
}