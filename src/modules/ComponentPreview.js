/**
 * Component Preview Module
 * Provides live visual preview of RDM components with real-time parameter visualization
 */
class ComponentPreview {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // Dot motion parameters
        this.dots = [];
        this.parameters = {};
        this.frameCount = 0;
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.frameRate = 0;

        // Block preview sampling state
        this.blockPreviewSource = null;
        this.blockPreviewSeed = null;
        this.blockPreviewRngState = null;
        
        this.initializePreview();
        this.setupEventListeners();
    }

    getPreviewModal() {
        const modalEl = document.getElementById('componentPreviewModal');
        if (!modalEl) {
            console.warn('componentPreviewModal not found');
            return null;
        }

        // IMPORTANT: use a single Modal instance to avoid stacking backdrops
        // when re-rendering the preview (e.g., Block Resample).
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        return { modalEl, modal };
    }
    
    initializePreview() {
        this.canvas = document.getElementById('previewCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set default parameters
        this.parameters = {
            canvas_width: 600,
            canvas_height: 600,
            aperture_shape: 'circle',
            aperture_size: 300,
            background_color: '#000000',
            dot_size: 4,
            dot_color: '#ffffff',
            total_dots: 150,
            coherent_direction: 0, // degrees
            coherence: 0.5, // 50% coherent
            speed: 5, // pixels per frame
            lifetime_frames: 60, // 1 second at 60fps
            noise_type: 'random_direction'
        };
        
        this.initializeDots();
    }
    
    setupEventListeners() {
        // Use .onclick to avoid stacking listeners when the modal content is restored.
        const startBtn = document.getElementById('startPreviewBtn');
        const pauseBtn = document.getElementById('pausePreviewBtn');
        const stopBtn = document.getElementById('stopPreviewBtn');
        const resetBtn = document.getElementById('resetPreviewBtn');

        if (startBtn) startBtn.onclick = () => this.startPreview();
        if (pauseBtn) pauseBtn.onclick = () => this.pausePreview();
        if (stopBtn) stopBtn.onclick = () => this.stopPreview();
        if (resetBtn) resetBtn.onclick = () => this.resetPreview();
    }
    
    showPreview(componentData) {
        // Check component type to determine preview type
        const componentType = componentData?.type || 'unknown';
        
        console.log('Showing preview for component type:', componentType, 'with data:', componentData);
        
        // Simple, direct routing like the Figma prototype
        if (componentType === 'html-keyboard-response') {
            // Instructions component - show the actual stimulus text
            const stimulusText = componentData.stimulus || 'No instructions text provided';
            this.showInstructionsPreview(stimulusText, componentData);
        } else if (componentType === 'block') {
            this.showBlockPreview(componentData);
        } else if (componentType.includes('rdm') || 
                   componentType === 'psychophysics-rdm' || 
                   componentType === 'rdk' ||
                   (componentData.coherence !== undefined)) {
            this.showRDMPreview(componentData);
        } else {
            console.warn('Unknown component type for preview:', componentType);
            this.showGenericPreview(componentData);
        }
    }

    showBlockPreview(componentData) {
        // Render a randomly sampled parameter set from the block window so users can
        // quickly sanity-check the block configuration.
        const sampled = this.sampleComponentFromBlock(componentData);

        const rawBaseType = componentData.block_component_type || componentData.component_type;
        const baseType = (typeof rawBaseType === 'string' && rawBaseType.trim() !== '') ? rawBaseType : 'rdm-trial';
        const length = componentData.block_length ?? componentData.length ?? 0;
        const sampling = componentData.sampling_mode || 'per-trial';

        sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
        sampled._blockPreviewSource = componentData;

        this.showRDMPreview(sampled);
    }

    getBlockRng(blockData) {
        const seedStr = (blockData?.seed ?? '').toString().trim();
        const seed = Number.parseInt(seedStr, 10);
        const hasSeed = Number.isFinite(seed);

        if (!hasSeed) {
            return () => Math.random();
        }

        if (this.blockPreviewSeed !== seed || this.blockPreviewRngState === null) {
            // Mulberry32 state must be uint32
            this.blockPreviewSeed = seed;
            this.blockPreviewRngState = (seed >>> 0);
        }

        return () => {
            // mulberry32
            let t = (this.blockPreviewRngState += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            const out = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            return out;
        };
    }

    sampleComponentFromBlock(blockData) {
        const rng = this.getBlockRng(blockData);
        const rawType = blockData?.block_component_type || blockData?.component_type;
        const componentType = (typeof rawType === 'string' && rawType.trim() !== '') ? rawType : 'rdm-trial';

        const randFloat = (min, max) => {
            const a = Number(min);
            const b = Number(max);
            if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            return lo + (hi - lo) * rng();
        };

        const randInt = (min, max) => {
            const f = randFloat(min, max);
            if (f === null) return null;
            // inclusive
            const lo = Math.min(Number(min), Number(max));
            const hi = Math.max(Number(min), Number(max));
            return Math.floor(lo + (hi - lo + 1) * rng());
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
            return Array.from(new Set(nums));
        };

        const pickFromList = (arr, fallback) => {
            if (!Array.isArray(arr) || arr.length === 0) return fallback;
            const idx = Math.floor(rng() * arr.length);
            return arr[Math.max(0, Math.min(arr.length - 1, idx))];
        };

        // Start with a minimal component data shape compatible with showRDMPreview()
        const sampled = { type: componentType };

        // Pass through per-block response cue settings (dot-groups)
        if (blockData?.response_target_group !== undefined) sampled.response_target_group = blockData.response_target_group;
        if (blockData?.cue_border_mode !== undefined) sampled.cue_border_mode = blockData.cue_border_mode;
        if (blockData?.cue_border_color !== undefined) sampled.cue_border_color = blockData.cue_border_color;
        if (blockData?.cue_border_width !== undefined) sampled.cue_border_width = blockData.cue_border_width;

        if (componentType === 'rdm-trial') {
            const coherence = randFloat(blockData.coherence_min, blockData.coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            const speed = randFloat(blockData.speed_min, blockData.speed_max);
            if (speed !== null) sampled.speed = speed;

            const dirs = parseNumberList(blockData.direction_options);
            sampled.direction = pickFromList(dirs, 0);

            if (typeof blockData.dot_color === 'string' && blockData.dot_color.trim() !== '') {
                sampled.dot_color = blockData.dot_color;
            }
        } else if (componentType === 'rdm-practice') {
            const coherence = randFloat(blockData.practice_coherence_min, blockData.practice_coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            const dirs = parseNumberList(blockData.practice_direction_options);
            sampled.direction = pickFromList(dirs, 0);

            // Feedback window isn't directly visualized, but keep it on the payload for completeness.
            const feedback = randInt(blockData.practice_feedback_duration_min, blockData.practice_feedback_duration_max);
            if (feedback !== null) sampled.feedback_duration = feedback;

            if (typeof blockData.dot_color === 'string' && blockData.dot_color.trim() !== '') {
                sampled.dot_color = blockData.dot_color;
            }
        } else if (componentType === 'rdm-adaptive') {
            // Preview a single plausible stimulus instance by sampling initial_coherence → coherence.
            const coherence = randFloat(blockData.adaptive_initial_coherence_min, blockData.adaptive_initial_coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            if (typeof blockData.dot_color === 'string' && blockData.dot_color.trim() !== '') {
                sampled.dot_color = blockData.dot_color;
            }
        } else if (componentType === 'rdm-dot-groups') {
            // Percentages: sample group_1 and set group_2 = 100 - group_1
            const g1Pct = randInt(blockData.group_1_percentage_min, blockData.group_1_percentage_max);
            const safeG1Pct = (g1Pct === null) ? 50 : Math.max(0, Math.min(100, g1Pct));
            sampled.group_1_percentage = safeG1Pct;
            sampled.group_2_percentage = 100 - safeG1Pct;

            const g1C = randFloat(blockData.group_1_coherence_min, blockData.group_1_coherence_max);
            if (g1C !== null) sampled.group_1_coherence = Math.max(0, Math.min(1, g1C));
            const g2C = randFloat(blockData.group_2_coherence_min, blockData.group_2_coherence_max);
            if (g2C !== null) sampled.group_2_coherence = Math.max(0, Math.min(1, g2C));

            const g1S = randFloat(blockData.group_1_speed_min, blockData.group_1_speed_max);
            if (g1S !== null) sampled.group_1_speed = g1S;
            const g2S = randFloat(blockData.group_2_speed_min, blockData.group_2_speed_max);
            if (g2S !== null) sampled.group_2_speed = g2S;

            const g1Dirs = parseNumberList(blockData.group_1_direction_options);
            sampled.group_1_direction = pickFromList(g1Dirs, 0);
            const g2Dirs = parseNumberList(blockData.group_2_direction_options);
            sampled.group_2_direction = pickFromList(g2Dirs, 180);

            const fallback = (typeof blockData.dot_color === 'string' && blockData.dot_color.trim() !== '') ? blockData.dot_color : null;
            sampled.group_1_color = (typeof blockData.group_1_color === 'string' && blockData.group_1_color.trim() !== '') ? blockData.group_1_color : (fallback || '#FF0066');
            sampled.group_2_color = (typeof blockData.group_2_color === 'string' && blockData.group_2_color.trim() !== '') ? blockData.group_2_color : (fallback || '#0066FF');
        }

        return sampled;
    }
    
    showInstructionsPreview(stimulusText, componentData) {
        // Clean instructions preview like the Figma prototype
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;
        
        // Convert \n to <br> tags for proper line breaks
        const formattedText = stimulusText.replace(/\n/g, '<br>');
        
        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="instructions-preview-container">
                    <h5>Instructions Preview</h5>
                    <div class="preview-screen" style="
                        background-color: #000000; 
                        color: #ffffff; 
                        padding: 40px; 
                        border-radius: 8px; 
                        text-align: center;
                        font-family: sans-serif;
                        font-size: 18px;
                        line-height: 1.6;
                        min-height: 300px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div>
                            ${formattedText}
                            <div style="margin-top: 30px; font-size: 14px; color: #ccc;">
                                (Press any key to continue)
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">
                            <strong>Component Type:</strong> Instructions<br>
                            <strong>Response Keys:</strong> ${componentData.choices === 'ALL_KEYS' ? 'Any key' : (componentData.choices || 'Not specified')}
                        </small>
                    </div>
                </div>
            `;
        }
        
        modal.show();
    }
    
    showHTMLPreview(componentData) {
        // Show HTML content preview
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;
        
        // Get the stimulus content - it might be JSON-encoded
        let stimulusContent = componentData.stimulus || 'No content specified';
        
        // If the stimulus appears to be JSON-encoded, try to parse it
        if (typeof stimulusContent === 'string' && stimulusContent.startsWith('{')) {
            try {
                const parsed = JSON.parse(stimulusContent);
                // If it's an object with a stimulus property, use that
                if (parsed.stimulus) {
                    stimulusContent = parsed.stimulus;
                }
            } catch (e) {
                // If parsing fails, use the original string
                console.log('Stimulus content is not JSON, using as-is');
            }
        }
        
        // Update modal content for HTML preview
        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="html-preview-container">
                    <h5>HTML Component Preview</h5>
                    <div class="preview-content p-3 border rounded" style="background-color: #f8f9fa; min-height: 200px; font-family: sans-serif; font-size: 16px; line-height: 1.5;">
                        ${stimulusContent}
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">
                            <strong>Component Type:</strong> ${componentData.type}<br>
                            <strong>Response Keys:</strong> ${componentData.choices === 'ALL_KEYS' ? 'Any key' : (componentData.choices || 'Not specified')}
                        </small>
                    </div>
                </div>
            `;
        }
        
        modal.show();
    }
    
    showRDMPreview(componentData) {
        // Update parameters from component data
        if (componentData && Object.keys(componentData).length > 0) {
            console.log('Updating RDM preview with parameters:', componentData);
            this.updateParameters(componentData);
        } else {
            console.warn('No component data provided for RDM preview');
        }
        
        // Restore original RDM modal content if it was changed
        this.restoreRDMModalContent();
        
        // Re-setup event listeners after content restore
        this.setupEventListeners();

        // Optional: show context note / enable block resample
        const noteEl = document.getElementById('previewContextNote');
        const resampleBtn = document.getElementById('resamplePreviewBtn');
        const noteText = componentData?._previewContextNote || '';

        if (noteEl) {
            noteEl.textContent = noteText;
        }

        const blockSource = componentData?._blockPreviewSource || null;
        if (resampleBtn) {
            if (blockSource) {
                this.blockPreviewSource = blockSource;
                // Reset seeded RNG state when switching blocks
                const seedStr = (blockSource?.seed ?? '').toString().trim();
                const seed = Number.parseInt(seedStr, 10);
                if (Number.isFinite(seed) && this.blockPreviewSeed !== seed) {
                    this.blockPreviewSeed = seed;
                    this.blockPreviewRngState = (seed >>> 0);
                }

                resampleBtn.style.display = '';
                resampleBtn.onclick = () => {
                    const sampled = this.sampleComponentFromBlock(this.blockPreviewSource);
                    const baseType = this.blockPreviewSource.block_component_type || this.blockPreviewSource.component_type || 'rdm-trial';
                    const length = this.blockPreviewSource.block_length ?? this.blockPreviewSource.length ?? 0;
                    const sampling = this.blockPreviewSource.sampling_mode || 'per-trial';
                    sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                    sampled._blockPreviewSource = this.blockPreviewSource;
                    this.showRDMPreview(sampled);
                };
            } else {
                this.blockPreviewSource = null;
                resampleBtn.style.display = 'none';
                resampleBtn.onclick = null;
            }
        }
        
        // Show the modal (single instance; avoids stacked backdrops on Resample)
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;
        modal.show();

        // Ensure canvas/context references are current BEFORE (re)rendering
        this.canvas = document.getElementById('previewCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            console.log('RDM canvas initialized:', this.canvas.width, 'x', this.canvas.height);
        } else {
            console.warn('Preview canvas not found after modal restoration');
        }

        // Force a clean re-init so dot colors/count/cue border always match the latest parameters
        this.stopPreview();
        this.frameCount = 0;
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.frameRate = 0;

        this.initializeDots();
        this.render();
        this.updateParameterDisplay();
        this.updateStats();
    }
    
    showGenericPreview(componentData) {
        // Show generic component info
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;
        
        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="generic-preview-container">
                    <h5>Component Preview</h5>
                    <p class="text-muted">Preview not available for this component type.</p>
                    <div class="mt-3">
                        <h6>Component Data:</h6>
                        <pre class="bg-light p-3 rounded"><code>${JSON.stringify(componentData, null, 2)}</code></pre>
                    </div>
                </div>
            `;
        }
        
        modal.show();
    }
    
    restoreRDMModalContent() {
        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody && !modalBody.querySelector('canvas')) {
            // Restore the original RDM preview content
            modalBody.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="mb-0">RDM Component Preview</h5>
                        <div id="previewContextNote" class="small text-muted"></div>
                    </div>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-success btn-sm" id="startPreviewBtn">
                            <i class="fas fa-play"></i> Start
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="resamplePreviewBtn" style="display:none;">
                            <i class="fas fa-dice"></i> Resample
                        </button>
                        <button type="button" class="btn btn-warning btn-sm" id="pausePreviewBtn" disabled>
                            <i class="fas fa-pause"></i> Pause
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" id="stopPreviewBtn" disabled>
                            <i class="fas fa-stop"></i> Stop
                        </button>
                        <button type="button" class="btn btn-info btn-sm" id="resetPreviewBtn">
                            <i class="fas fa-redo"></i> Reset
                        </button>
                    </div>
                </div>
                
                <div class="preview-container mb-3">
                    <canvas id="previewCanvas" width="600" height="600" class="border"></canvas>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h6>Statistics</h6>
                        <div id="previewStats" class="small text-muted">
                            <div>Frame Rate: <span id="frameRate">0</span> fps</div>
                            <div>Frame Count: <span id="frameCount">0</span></div>
                            <div>Coherent Dots: <span id="coherentDots">0</span></div>
                            <div>Random Dots: <span id="randomDots">0</span></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Parameters</h6>
                        <div id="previewParameters" class="small text-muted">
                            <!-- Parameters will be populated here -->
                        </div>
                    </div>
                </div>
            `;
            
            // Re-setup event listeners only
            this.setupEventListeners();
            
            // Initialize canvas references
            this.canvas = document.getElementById('previewCanvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
            }
        }
    }
    
    updateParameters(newParameters) {
        // Support legacy/nested component data shape: { type, name, parameters: { ... } }
        // The preview mapper expects a flat parameter object.
        const params = (newParameters && typeof newParameters === 'object' && newParameters.parameters && typeof newParameters.parameters === 'object')
            ? { ...newParameters, ...newParameters.parameters }
            : (newParameters || {});

        // Support nested dot-groups schema shape (used by some validators/exporters)
        //   groups: { enabled: true, group_definitions: [ { percentage, color, motion_properties: { coherence, direction } } ] }
        // Normalize first two groups into the flat fields the preview renderer uses.
        const normalizedFromGroups = {};
        if (params?.groups && typeof params.groups === 'object') {
            const enabled = !!params.groups.enabled;
            const defs = Array.isArray(params.groups.group_definitions) ? params.groups.group_definitions : null;

            if (enabled && defs && defs.length >= 2) {
                const g1 = defs[0] || {};
                const g2 = defs[1] || {};
                const g1Motion = (g1.motion_properties && typeof g1.motion_properties === 'object') ? g1.motion_properties : {};
                const g2Motion = (g2.motion_properties && typeof g2.motion_properties === 'object') ? g2.motion_properties : {};

                normalizedFromGroups.enable_groups = true;
                if (g1.percentage !== undefined) normalizedFromGroups.group_1_percentage = g1.percentage;
                if (g1.color !== undefined) normalizedFromGroups.group_1_color = g1.color;
                if (g1Motion.coherence !== undefined) normalizedFromGroups.group_1_coherence = g1Motion.coherence;
                if (g1Motion.direction !== undefined) normalizedFromGroups.group_1_direction = g1Motion.direction;

                if (g2.percentage !== undefined) normalizedFromGroups.group_2_percentage = g2.percentage;
                if (g2.color !== undefined) normalizedFromGroups.group_2_color = g2.color;
                if (g2Motion.coherence !== undefined) normalizedFromGroups.group_2_coherence = g2Motion.coherence;
                if (g2Motion.direction !== undefined) normalizedFromGroups.group_2_direction = g2Motion.direction;
            }
        }

        const mergedParams = { ...params, ...normalizedFromGroups };

        // Legacy aliases for target group (older UI/modal names)
        if (!mergedParams.response_target_group) {
            const legacyTarget = mergedParams.custom_response || mergedParams.customResponse || mergedParams.modalCustomResponse || mergedParams.modal_custom_response;
            if (legacyTarget) mergedParams.response_target_group = legacyTarget;
        }

        const componentType = String(mergedParams?.type || mergedParams?.trial_type || mergedParams?.plugin || '').trim();
        const componentName = String(mergedParams?.name || '').trim();

        // Infer dot-groups mode even if legacy enable_groups flag is absent
        const inferredGroupsEnabled = (
            componentType === 'rdm-dot-groups' ||
            componentType.includes('dot-groups') ||
            componentName.toLowerCase().includes('groups') ||
            mergedParams?.groups?.enabled === true ||
            mergedParams?.groups?.enabled === 'true' ||
            mergedParams?.group_1_percentage !== undefined ||
            mergedParams?.group_2_percentage !== undefined ||
            mergedParams?.group_1_color !== undefined ||
            mergedParams?.group_2_color !== undefined ||
            mergedParams?.group_1_coherence !== undefined ||
            mergedParams?.group_2_coherence !== undefined ||
            mergedParams?.group_1_direction !== undefined ||
            mergedParams?.group_2_direction !== undefined
        );

        // Resolve cue border configuration from flat params or nested override
        const cue = mergedParams?.cue_border || mergedParams?.response_parameters_override?.cue_border || null;
        const rawCueMode = mergedParams?.cue_border_mode || cue?.mode || 'off';

        const normalizeCueMode = (mode) => {
            const m = String(mode || 'off').trim();
            if (m === 'target_group_color' || m === 'targetGroupColor') return 'target-group-color';
            if (m === 'target-group-color') return 'target-group-color';
            if (m === 'custom') return 'custom';
            if (m === 'off' || m === '' || m === 'none') return 'off';
            return m;
        };

        const cueMode = normalizeCueMode(rawCueMode);
        const targetGroup = (
            mergedParams?.response_target_group ||
            mergedParams?.target_group ||
            cue?.target_group ||
            cue?.target ||
            'none'
        );

        const cueWidth = mergedParams?.cue_border_width || cue?.width || 4;

        // Important: when cueMode is target-group-color, ignore any default cue_border_color
        // (the modal often has a color field with a default '#FFFFFF' that would override the group color).
        let cueColor = null;
        if (cueMode === 'custom') {
            cueColor = mergedParams?.cue_border_color || cue?.color || null;
        } else if (cueMode === 'target-group-color') {
            if (targetGroup === 'group_1') cueColor = mergedParams?.group_1_color || '#FF0066';
            if (targetGroup === 'group_2') cueColor = mergedParams?.group_2_color || '#0066FF';
        }

        const cueEnabled = (cueMode && cueMode !== 'off' && targetGroup && targetGroup !== 'none' && !!cueColor);

        // Map component parameters to preview parameters
        this.parameters = {
            component_type: componentType || this.parameters.component_type,
            component_name: componentName || this.parameters.component_name,
            canvas_width: mergedParams.canvas_width || this.parameters.canvas_width,
            canvas_height: mergedParams.canvas_height || this.parameters.canvas_height,
            aperture_shape: mergedParams.aperture_shape || this.parameters.aperture_shape,
            aperture_size: mergedParams.aperture_diameter || mergedParams.aperture_size || this.parameters.aperture_size,
            background_color: mergedParams.background_color || this.parameters.background_color,
            dot_size: mergedParams.dot_size || this.parameters.dot_size,
            dot_color: mergedParams.dot_color || this.parameters.dot_color,
            total_dots: mergedParams.total_dots || this.parameters.total_dots,
            coherent_direction: mergedParams.coherent_direction !== undefined
                ? mergedParams.coherent_direction
                : (mergedParams.direction !== undefined ? mergedParams.direction : this.parameters.coherent_direction),
            coherence: mergedParams.coherence !== undefined ? mergedParams.coherence : this.parameters.coherence,
            speed: mergedParams.speed || this.parameters.speed,
            lifetime_frames: mergedParams.lifetime_frames || this.parameters.lifetime_frames,
            noise_type: mergedParams.noise_type || this.parameters.noise_type,
            
            // Handle RDM Groups parameters
            enable_groups: inferredGroupsEnabled || !!mergedParams.enable_groups,
            group_1_percentage: (mergedParams.group_1_percentage ?? 50),
            group_1_color: mergedParams.group_1_color || '#FF0066',
            group_1_coherence: mergedParams.group_1_coherence !== undefined ? mergedParams.group_1_coherence : 0.2,
            group_1_direction: mergedParams.group_1_direction !== undefined ? mergedParams.group_1_direction : 0,
            group_1_speed: mergedParams.group_1_speed !== undefined ? mergedParams.group_1_speed : null,
            group_2_percentage: (mergedParams.group_2_percentage ?? 50),
            group_2_color: mergedParams.group_2_color || '#0066FF',
            group_2_coherence: mergedParams.group_2_coherence !== undefined ? mergedParams.group_2_coherence : 0.8,
            group_2_direction: mergedParams.group_2_direction !== undefined ? mergedParams.group_2_direction : 180,
            group_2_speed: mergedParams.group_2_speed !== undefined ? mergedParams.group_2_speed : null,

            // Cue border (aperture border as response cue)
            cue_border_enabled: cueEnabled,
            cue_border_color: cueColor || '#888888',
            cue_border_width: parseInt(cueWidth)
        };

        // For dot-groups, compute an effective coherence for display purposes.
        // (Otherwise the UI shows the experiment-wide default coherence even when groups are used.)
        if (this.parameters.enable_groups) {
            const g1Pct = Number(this.parameters.group_1_percentage ?? 0);
            const g2Pct = Number(this.parameters.group_2_percentage ?? 0);
            const denom = (g1Pct + g2Pct) || 100;
            const g1C = Number(this.parameters.group_1_coherence ?? 0);
            const g2C = Number(this.parameters.group_2_coherence ?? 0);
            const eff = ((g1Pct * g1C) + (g2Pct * g2C)) / denom;
            if (!Number.isNaN(eff)) {
                this.parameters.coherence = Math.max(0, Math.min(1, eff));
            }
        }
        
        console.log('Updated parameters:', this.parameters);
        
        // Update canvas size and background
        // (Modal content can be swapped, leaving a stale detached canvas reference.)
        if (!this.canvas || !document.body.contains(this.canvas)) {
            this.canvas = document.getElementById('previewCanvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        }

        if (this.canvas) {
            this.canvas.width = this.parameters.canvas_width;
            this.canvas.height = this.parameters.canvas_height;
            this.canvas.style.backgroundColor = this.parameters.background_color;
        }
        
        this.initializeDots();
    }
    
    initializeDots() {
        this.dots = [];
        
        for (let i = 0; i < this.parameters.total_dots; i++) {
            this.createDot();
        }
    }

    getRandomStartPosition() {
        // If an aperture is configured, start dots within it so the preview shows the full dot field.
        const hasAperture = !!(this.parameters.aperture_shape && this.parameters.aperture_size);
        if (!hasAperture) {
            return {
                x: Math.random() * this.parameters.canvas_width,
                y: Math.random() * this.parameters.canvas_height
            };
        }

        const centerX = this.parameters.canvas_width / 2;
        const centerY = this.parameters.canvas_height / 2;
        const half = this.parameters.aperture_size / 2;

        if (this.parameters.aperture_shape === 'circle') {
            // Uniform sampling within a circle
            const t = 2 * Math.PI * Math.random();
            const r = half * Math.sqrt(Math.random());
            return { x: centerX + r * Math.cos(t), y: centerY + r * Math.sin(t) };
        }

        // Rectangle (and any other shapes) default to square bounds
        return {
            x: centerX + (Math.random() * 2 - 1) * half,
            y: centerY + (Math.random() * 2 - 1) * half
        };
    }
    
    createDot() {
        const start = this.getRandomStartPosition();
        const dot = {
            x: start.x,
            y: start.y,
            age: Math.floor(Math.random() * this.parameters.lifetime_frames)
        };
        
        // Handle RDM Groups if enabled
        if (this.parameters.enable_groups) {
            // Determine which group this dot belongs to
            const group1Size = Math.round(this.parameters.total_dots * this.parameters.group_1_percentage / 100);
            const currentGroup1Count = this.dots.filter(d => d.group === 1).length;
            
            if (currentGroup1Count < group1Size) {
                // Assign to group 1
                dot.group = 1;
                dot.color = this.parameters.group_1_color;
                dot.isCoherent = Math.random() < this.parameters.group_1_coherence;

                const groupSpeed = (this.parameters.group_1_speed !== null && this.parameters.group_1_speed !== undefined && this.parameters.group_1_speed !== '')
                    ? Number(this.parameters.group_1_speed)
                    : Number(this.parameters.speed);
                
                if (dot.isCoherent) {
                    const radians = (this.parameters.group_1_direction * Math.PI) / 180;
                    dot.vx = Math.cos(radians) * groupSpeed;
                    dot.vy = Math.sin(radians) * groupSpeed;
                } else {
                    const randomAngle = Math.random() * 2 * Math.PI;
                    dot.vx = Math.cos(randomAngle) * groupSpeed;
                    dot.vy = Math.sin(randomAngle) * groupSpeed;
                }
            } else {
                // Assign to group 2
                dot.group = 2;
                dot.color = this.parameters.group_2_color;
                dot.isCoherent = Math.random() < this.parameters.group_2_coherence;

                const groupSpeed = (this.parameters.group_2_speed !== null && this.parameters.group_2_speed !== undefined && this.parameters.group_2_speed !== '')
                    ? Number(this.parameters.group_2_speed)
                    : Number(this.parameters.speed);
                
                if (dot.isCoherent) {
                    const radians = (this.parameters.group_2_direction * Math.PI) / 180;
                    dot.vx = Math.cos(radians) * groupSpeed;
                    dot.vy = Math.sin(radians) * groupSpeed;
                } else {
                    const randomAngle = Math.random() * 2 * Math.PI;
                    dot.vx = Math.cos(randomAngle) * groupSpeed;
                    dot.vy = Math.sin(randomAngle) * groupSpeed;
                }
            }
        } else {
            // Single group behavior (original)
            dot.group = 1;
            dot.color = this.parameters.dot_color;
            dot.isCoherent = Math.random() < this.parameters.coherence;
            
            if (dot.isCoherent) {
                const radians = (this.parameters.coherent_direction * Math.PI) / 180;
                dot.vx = Math.cos(radians) * this.parameters.speed;
                dot.vy = Math.sin(radians) * this.parameters.speed;
            } else {
                const randomAngle = Math.random() * 2 * Math.PI;
                dot.vx = Math.cos(randomAngle) * this.parameters.speed;
                dot.vy = Math.sin(randomAngle) * this.parameters.speed;
            }
        }
        
        this.dots.push(dot);
    }
    
    updateDots() {
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            
            // Update position
            dot.x += dot.vx;
            dot.y += dot.vy;
            dot.age++;
            
            // Check boundaries and wrap around
            if (dot.x < 0) dot.x = this.parameters.canvas_width;
            if (dot.x > this.parameters.canvas_width) dot.x = 0;
            if (dot.y < 0) dot.y = this.parameters.canvas_height;
            if (dot.y > this.parameters.canvas_height) dot.y = 0;
            
            // Check lifetime
            if (dot.age >= this.parameters.lifetime_frames) {
                this.dots.splice(i, 1);
                this.createDot(); // Replace with new dot
            }
        }
    }
    
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.parameters.background_color;
        this.ctx.fillRect(0, 0, this.parameters.canvas_width, this.parameters.canvas_height);
        
        // Set up aperture clipping if specified
        if (this.parameters.aperture_shape && this.parameters.aperture_size) {
            this.ctx.save(); // Save the current state
            
            // Create clipping path based on aperture shape
            this.ctx.beginPath();
            const centerX = this.parameters.canvas_width / 2;
            const centerY = this.parameters.canvas_height / 2;
            
            if (this.parameters.aperture_shape === 'circle') {
                this.ctx.arc(centerX, centerY, this.parameters.aperture_size / 2, 0, 2 * Math.PI);
            } else if (this.parameters.aperture_shape === 'rectangle') {
                const halfSize = this.parameters.aperture_size / 2;
                this.ctx.rect(centerX - halfSize, centerY - halfSize, this.parameters.aperture_size, this.parameters.aperture_size);
            }
            
            this.ctx.clip(); // Apply the clipping path
        }
        
        // Draw dots (will be clipped by aperture if set)
        for (const dot of this.dots) {
            // Use individual dot color (for groups) or default color
            this.ctx.fillStyle = dot.color || this.parameters.dot_color;
            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, this.parameters.dot_size / 2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Restore context if clipping was applied
        if (this.parameters.aperture_shape && this.parameters.aperture_size) {
            this.ctx.restore();
            
            // Draw aperture boundary for visualization
            if (this.parameters.cue_border_enabled) {
                this.ctx.strokeStyle = this.parameters.cue_border_color;
                this.ctx.lineWidth = this.parameters.cue_border_width;
                this.ctx.setLineDash([]); // Solid for cue
            } else {
                this.ctx.strokeStyle = '#888888';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]); // Dashed when no cue
            }
            
            this.ctx.beginPath();
            const centerX = this.parameters.canvas_width / 2;
            const centerY = this.parameters.canvas_height / 2;
            
            if (this.parameters.aperture_shape === 'circle') {
                this.ctx.arc(centerX, centerY, this.parameters.aperture_size / 2, 0, 2 * Math.PI);
            } else if (this.parameters.aperture_shape === 'rectangle') {
                const halfSize = this.parameters.aperture_size / 2;
                this.ctx.rect(centerX - halfSize, centerY - halfSize, this.parameters.aperture_size, this.parameters.aperture_size);
            }
            
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset line dash
        }
        
        // Update frame counter and stats
        this.frameCount++;
        this.updateStats();
    }
    
    animate() {
        if (!this.isRunning || this.isPaused) return;
        
        this.updateDots();
        this.render();
        
        // Calculate frame rate
        const currentTime = performance.now();
        if (this.lastFrameTime !== 0) {
            const deltaTime = currentTime - this.lastFrameTime;
            this.frameRate = Math.round(1000 / deltaTime);
        }
        this.lastFrameTime = currentTime;
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    startPreview() {
        if (this.isPaused) {
            this.isPaused = false;
        } else {
            this.isRunning = true;
            this.startTime = performance.now();
            this.frameCount = 0;
        }
        
        this.updateButtons();
        this.animate();
    }
    
    pausePreview() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateButtons();
    }
    
    stopPreview() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateButtons();
        this.render(); // Final render
    }
    
    resetPreview() {
        this.stopPreview();
        this.frameCount = 0;
        this.initializeDots();
        this.render();
        this.updateStats();
    }
    
    updateButtons() {
        const startBtn = document.getElementById('startPreviewBtn');
        const pauseBtn = document.getElementById('pausePreviewBtn');
        const stopBtn = document.getElementById('stopPreviewBtn');
        
        if (startBtn && pauseBtn && stopBtn) {
            if (this.isRunning && !this.isPaused) {
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
            } else if (this.isPaused) {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = false;
            } else {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
            }
        }
    }
    
    updateParameterDisplay() {
        const container = document.getElementById('previewParameterInfo');
        if (!container) return;

        const isDotGroups = (this.parameters.component_type && this.parameters.component_type.includes('dot-groups')) ||
            (this.parameters.component_name && this.parameters.component_name.toLowerCase().includes('groups'));

        const hasGroupSpeeds = (this.parameters.group_1_speed !== null && this.parameters.group_1_speed !== undefined && this.parameters.group_1_speed !== '') ||
            (this.parameters.group_2_speed !== null && this.parameters.group_2_speed !== undefined && this.parameters.group_2_speed !== '');

        const groupSpeedText = hasGroupSpeeds
            ? `G1 ${this.parameters.group_1_speed ?? this.parameters.speed}, G2 ${this.parameters.group_2_speed ?? this.parameters.speed} px/frame`
            : `${this.parameters.speed} px/frame (shared)`;

        const groupsInfo = (this.parameters.enable_groups || isDotGroups) ? `
            <p><strong>Groups:</strong> ${this.parameters.enable_groups ? 'on' : 'inferred'}</p>
            <p><strong>Group 1:</strong> ${this.parameters.group_1_percentage}% @ ${this.parameters.group_1_color}</p>
            <p><strong>Group 1 Coherence:</strong> ${Math.round(Number(this.parameters.group_1_coherence) * 100)}%</p>
            ${hasGroupSpeeds ? `<p><strong>Group 1 Speed:</strong> ${this.parameters.group_1_speed ?? this.parameters.speed} px/frame</p>` : ''}
            <p><strong>Group 2:</strong> ${this.parameters.group_2_percentage}% @ ${this.parameters.group_2_color}</p>
            <p><strong>Group 2 Coherence:</strong> ${Math.round(Number(this.parameters.group_2_coherence) * 100)}%</p>
            ${hasGroupSpeeds ? `<p><strong>Group 2 Speed:</strong> ${this.parameters.group_2_speed ?? this.parameters.speed} px/frame</p>` : ''}
            <p><strong>Effective Speed:</strong> ${groupSpeedText}</p>
            <p><strong>Cue Border:</strong> ${this.parameters.cue_border_enabled ? 'on' : 'off'}</p>
            ${this.parameters.cue_border_enabled ? `<p><strong>Cue Color:</strong> ${this.parameters.cue_border_color} (${this.parameters.cue_border_width}px)</p>` : ''}
        ` : '';
        
        container.innerHTML = `
            <div class="parameter-group">
                <p><strong>Type:</strong> ${this.parameters.component_type || 'rdm'}</p>
                <p><strong>Canvas:</strong> ${this.parameters.canvas_width}×${this.parameters.canvas_height}px</p>
                <p><strong>Aperture:</strong> ${this.parameters.aperture_shape} (${this.parameters.aperture_size}px)</p>
                <p><strong>Dots:</strong> ${this.parameters.total_dots}</p>
                <p><strong>Coherence:</strong> ${Math.round(this.parameters.coherence * 100)}%</p>
                <p><strong>Direction:</strong> ${this.parameters.coherent_direction}°</p>
                <p><strong>Speed:</strong> ${this.parameters.speed} px/frame</p>
                <p><strong>Dot Size:</strong> ${this.parameters.dot_size}px</p>
                <p><strong>Lifetime:</strong> ${this.parameters.lifetime_frames} frames</p>
                ${groupsInfo}
            </div>
        `;
    }
    
    updateStats() {
        const coherentCount = this.dots.filter(dot => dot.isCoherent).length;
        const timeElapsed = this.isRunning ? Math.round(performance.now() - this.startTime) : 0;
        
        // Check if elements exist before updating
        const frameRateEl = document.getElementById('frameRate');
        const dotsVisibleEl = document.getElementById('dotsVisible');
        const coherentDotsEl = document.getElementById('coherentDots');
        const timeElapsedEl = document.getElementById('timeElapsed');
        
        if (frameRateEl) frameRateEl.textContent = this.frameRate || 0;
        if (dotsVisibleEl) dotsVisibleEl.textContent = this.dots.length;
        if (coherentDotsEl) coherentDotsEl.textContent = coherentCount;
        if (timeElapsedEl) timeElapsedEl.textContent = timeElapsed;
        
        // Try alternative element IDs for different stat layouts
        const frameCountEl = document.getElementById('frameCount');
        const randomDotsEl = document.getElementById('randomDots');
        
        if (frameCountEl) frameCountEl.textContent = this.frameCount || 0;
        if (randomDotsEl) randomDotsEl.textContent = this.dots.length - coherentCount;
    }
}

// Global instance
window.componentPreview = new ComponentPreview();