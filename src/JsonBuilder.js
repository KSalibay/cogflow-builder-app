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
        this.currentTaskType = 'rdm';
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
        this.onTaskTypeChange = this.onTaskTypeChange.bind(this);
    }
    /**
     * Show/hide UI sections based on current settings
     */
    updateConditionalUI() {
        const defaultDevice = document.getElementById('defaultResponseDevice')?.value || 'keyboard';

        const feedbackType = document.getElementById('defaultFeedbackType')?.value || 'off';

        const mouseSettings = document.getElementById('mouseResponseSettings');
        if (mouseSettings) {
            const showMouse = (defaultDevice === 'mouse');
            mouseSettings.style.display = showMouse ? 'block' : 'none';

            // Also disable hidden inputs so they don't clutter tab order
            // and so the UI state is unambiguous.
            mouseSettings.querySelectorAll('input, select, textarea').forEach((el) => {
                el.disabled = !showMouse;
            });
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

    applyGaborResponseTaskVisibility() {
        const mode = document.getElementById('gaborResponseTask')?.value || 'discriminate_tilt';
        const directionGroup = document.getElementById('gaborDirectionKeysGroup');
        const detectionGroup = document.getElementById('gaborDetectionKeysGroup');

        if (directionGroup) {
            directionGroup.style.display = (mode === 'discriminate_tilt') ? '' : 'none';
        }
        if (detectionGroup) {
            detectionGroup.style.display = (mode === 'detect_target') ? '' : 'none';
        }
    }

    applyGaborPatchBorderVisibility() {
        const enabled = !!document.getElementById('gaborPatchBorderEnabled')?.checked;
        const details = document.getElementById('gaborPatchBorderDetails');
        if (!details) return;
        details.style.display = enabled ? '' : 'none';
    }

    applyGaborCueVisibility() {
        const spatialEnabled = !!document.getElementById('gaborSpatialCueEnabled')?.checked;
        const spatialDetails = document.getElementById('gaborSpatialCueDetails');

        if (!spatialEnabled) {
            const opts = document.getElementById('gaborSpatialCueOptions');
            const prob = document.getElementById('gaborSpatialCueProbability');
            if (opts) opts.value = 'none,left,right,both';
            if (prob) prob.value = '1';
        }
        if (spatialDetails) {
            spatialDetails.style.display = spatialEnabled ? '' : 'none';
        }

        const valueEnabled = !!document.getElementById('gaborValueCueEnabled')?.checked;
        const valueDetails = document.getElementById('gaborValueCueDetails');

        if (!valueEnabled) {
            const lv = document.getElementById('gaborLeftValueOptions');
            const rv = document.getElementById('gaborRightValueOptions');
            const prob = document.getElementById('gaborValueCueProbability');
            if (lv) lv.value = 'neutral,high,low';
            if (rv) rv.value = 'neutral,high,low';
            if (prob) prob.value = '1';
        }
        if (valueDetails) {
            valueDetails.style.display = valueEnabled ? '' : 'none';
        }
    }

    bindGaborSettingsUI() {
        const responseTaskEl = document.getElementById('gaborResponseTask');
        if (!responseTaskEl) return;

        // Prevent stacking listeners across re-renders.
        if (responseTaskEl.dataset.bound === '1') {
            this.applyGaborResponseTaskVisibility();
            this.applyGaborPatchBorderVisibility();
            this.applyGaborCueVisibility();
            return;
        }

        responseTaskEl.dataset.bound = '1';
        responseTaskEl.addEventListener('change', () => {
            this.applyGaborResponseTaskVisibility();
            this.updateJSON();
        });

        const borderToggleEl = document.getElementById('gaborPatchBorderEnabled');
        if (borderToggleEl && borderToggleEl.dataset.bound !== '1') {
            borderToggleEl.dataset.bound = '1';
            borderToggleEl.addEventListener('change', () => {
                this.applyGaborPatchBorderVisibility();
                this.updateJSON();
            });
        }

        const spatialCueToggleEl = document.getElementById('gaborSpatialCueEnabled');
        if (spatialCueToggleEl && spatialCueToggleEl.dataset.bound !== '1') {
            spatialCueToggleEl.dataset.bound = '1';
            spatialCueToggleEl.addEventListener('change', () => {
                this.applyGaborCueVisibility();
                this.updateJSON();
            });
        }

        const valueCueToggleEl = document.getElementById('gaborValueCueEnabled');
        if (valueCueToggleEl && valueCueToggleEl.dataset.bound !== '1') {
            valueCueToggleEl.dataset.bound = '1';
            valueCueToggleEl.addEventListener('change', () => {
                this.applyGaborCueVisibility();
                this.updateJSON();
            });
        }

        this.applyGaborResponseTaskVisibility();
        this.applyGaborPatchBorderVisibility();
        this.applyGaborCueVisibility();
    }

    applyStroopResponseVisibility() {
        const mode = (document.getElementById('stroopDefaultResponseMode')?.value || 'color_naming').toString();
        const device = (document.getElementById('stroopDefaultResponseDevice')?.value || 'keyboard').toString();

        const colorNamingKeys = document.getElementById('stroopColorNamingKeysGroup');
        const congruencyKeys = document.getElementById('stroopCongruencyKeysGroup');
        const keyboardOnlyNote = document.getElementById('stroopKeyboardOnlyNote');

        const usingKeyboard = device === 'keyboard';
        if (keyboardOnlyNote) keyboardOnlyNote.style.display = usingKeyboard ? 'none' : '';

        if (colorNamingKeys) {
            colorNamingKeys.style.display = (mode === 'color_naming' && usingKeyboard) ? '' : 'none';
        }
        if (congruencyKeys) {
            congruencyKeys.style.display = (mode === 'congruency' && usingKeyboard) ? '' : 'none';
        }
    }

    applySimonResponseVisibility() {
        const device = (document.getElementById('simonDefaultResponseDevice')?.value || 'keyboard').toString();

        const keyboardOnlyNote = document.getElementById('simonKeyboardOnlyNote');
        const keyboardGroup = document.getElementById('simonKeyboardKeysGroup');

        const usingKeyboard = device === 'keyboard';
        if (keyboardOnlyNote) keyboardOnlyNote.style.display = usingKeyboard ? 'none' : '';
        if (keyboardGroup) keyboardGroup.style.display = usingKeyboard ? '' : 'none';
    }

    renderStroopStimuliRows() {
        const sizeEl = document.getElementById('stroopStimulusSetSize');
        const rowsEl = document.getElementById('stroopStimuliRows');
        if (!sizeEl || !rowsEl) return;

        const rawN = Number.parseInt(sizeEl.value || '4', 10);
        const n = Number.isFinite(rawN) ? Math.max(2, Math.min(7, rawN)) : 4;
        if (`${n}` !== `${rawN}`) sizeEl.value = `${n}`;

        // Preserve existing values when possible
        const existing = {};
        for (let i = 1; i <= 7; i += 1) {
            const nameEl = document.getElementById(`stroopStimulusName_${i}`);
            const colorEl = document.getElementById(`stroopStimulusColor_${i}`);
            if (nameEl || colorEl) {
                existing[i] = {
                    name: nameEl?.value,
                    color: colorEl?.value
                };
            }
        }

        const defaults = [
            { name: 'RED', color: '#ff0000' },
            { name: 'GREEN', color: '#00aa00' },
            { name: 'BLUE', color: '#0066ff' },
            { name: 'YELLOW', color: '#ffd200' },
            { name: 'PURPLE', color: '#7a3cff' },
            { name: 'ORANGE', color: '#ff7a00' },
            { name: 'PINK', color: '#ff3c8f' }
        ];

        let html = '';
        for (let i = 1; i <= 7; i += 1) {
            const rowVisible = i <= n;
            const fallback = defaults[i - 1] || { name: `COLOR_${i}`, color: '#ffffff' };
            const nameVal = (existing[i]?.name ?? fallback.name).toString();
            const colorVal = (existing[i]?.color ?? fallback.color).toString();

            html += `
                <div class="parameter-row" style="${rowVisible ? '' : 'display:none;'}">
                    <label class="parameter-label">Stimulus ${i}:</label>
                    <div class="parameter-input d-flex gap-2">
                        <input type="text" class="form-control" id="stroopStimulusName_${i}" value="${nameVal.replaceAll('"', '&quot;')}">
                        <input type="color" class="form-control" style="max-width: 80px;" id="stroopStimulusColor_${i}" value="${colorVal}">
                    </div>
                    <div class="parameter-help">Name (word) + ink color (hex)</div>
                </div>
            `;
        }

        rowsEl.innerHTML = html;

        // Ensure changes propagate to JSON
        rowsEl.querySelectorAll('input').forEach(el => {
            el.addEventListener('change', this.updateJSON);
        });
    }

    bindStroopSettingsUI() {
        const sizeEl = document.getElementById('stroopStimulusSetSize');
        if (!sizeEl) return;

        if (sizeEl.dataset.bound === '1') {
            this.renderStroopStimuliRows();
            this.applyStroopResponseVisibility();
            return;
        }

        sizeEl.dataset.bound = '1';
        sizeEl.addEventListener('change', () => {
            this.renderStroopStimuliRows();
            this.updateJSON();
        });

        const modeEl = document.getElementById('stroopDefaultResponseMode');
        if (modeEl && modeEl.dataset.bound !== '1') {
            modeEl.dataset.bound = '1';
            modeEl.addEventListener('change', () => {
                this.applyStroopResponseVisibility();
                this.updateJSON();
            });
        }

        const deviceEl = document.getElementById('stroopDefaultResponseDevice');
        if (deviceEl && deviceEl.dataset.bound !== '1') {
            deviceEl.dataset.bound = '1';
            deviceEl.addEventListener('change', () => {
                this.applyStroopResponseVisibility();
                this.updateJSON();
            });
        }

        this.renderStroopStimuliRows();
        this.applyStroopResponseVisibility();
    }

    bindSimonSettingsUI() {
        const devEl = document.getElementById('simonDefaultResponseDevice');
        if (!devEl) return;

        if (devEl.dataset.bound === '1') {
            this.applySimonResponseVisibility();
            return;
        }

        devEl.dataset.bound = '1';
        devEl.addEventListener('change', () => {
            this.applySimonResponseVisibility();
            this.updateJSON();
        });

        // Bind color/name inputs
        ['simonStimulusName_1', 'simonStimulusColor_1', 'simonStimulusName_2', 'simonStimulusColor_2',
            'simonLeftKey', 'simonRightKey', 'simonCircleDiameterPx',
            'simonStimulusDurationMs', 'simonTrialDurationMs', 'simonItiMs'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.dataset.bound === '1') return;
            el.dataset.bound = '1';
            el.addEventListener('change', () => this.updateJSON());
        });

        this.applySimonResponseVisibility();
    }

    bindPvtSettingsUI() {
        const devEl = document.getElementById('pvtDefaultResponseDevice');
        if (!devEl) return;

        if (devEl.dataset.bound === '1') {
            this.applyPvtResponseVisibility();
            return;
        }

        devEl.dataset.bound = '1';
        devEl.addEventListener('change', () => {
            this.applyPvtResponseVisibility();
            this.updateJSON();
        });

        const fbEl = document.getElementById('pvtFeedbackEnabled');
        if (fbEl && fbEl.dataset.bound !== '1') {
            fbEl.dataset.bound = '1';
            fbEl.addEventListener('change', () => {
                this.applyPvtFeedbackVisibility();
                this.updateJSON();
            });
        }

        const extraEl = document.getElementById('pvtAddTrialPerFalseStart');
        if (extraEl && extraEl.dataset.bound !== '1') {
            extraEl.dataset.bound = '1';
            extraEl.addEventListener('change', () => this.updateJSON());
        }

        // Bind inputs
        [
            'pvtResponseKey',
            'pvtForeperiodMs',
            'pvtTrialDurationMs',
            'pvtItiMs',
            'pvtFeedbackMessage'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.dataset.bound === '1') return;
            el.dataset.bound = '1';
            el.addEventListener('change', () => this.updateJSON());
        });

        this.applyPvtResponseVisibility();
        this.applyPvtFeedbackVisibility();
    }

    applyPvtResponseVisibility() {
        const dev = (document.getElementById('pvtDefaultResponseDevice')?.value || 'keyboard').toString();
        const keyGroup = document.getElementById('pvtKeyboardKeysGroup');
        const note = document.getElementById('pvtKeyboardOnlyNote');
        if (!keyGroup || !note) return;

        const usesKeyboard = (dev === 'keyboard' || dev === 'both');
        keyGroup.style.display = usesKeyboard ? '' : 'none';
        note.style.display = usesKeyboard ? 'none' : '';
    }

    applyPvtFeedbackVisibility() {
        const enabled = !!document.getElementById('pvtFeedbackEnabled')?.checked;
        const group = document.getElementById('pvtFeedbackMessageGroup');
        if (!group) return;
        group.style.display = enabled ? '' : 'none';
    }

    findRewardSettingsTimelineElements() {
        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) return [];

        const els = Array.from(timelineContainer.querySelectorAll('.timeline-component'));
        const matches = [];

        for (const el of els) {
            const directType = el.dataset.componentType;
            if (directType === 'reward-settings') {
                matches.push(el);
                continue;
            }
            try {
                const d = JSON.parse(el.dataset.componentData || '{}');
                if (d && d.type === 'reward-settings') matches.push(el);
            } catch {
                // ignore
            }
        }

        return matches;
    }

    syncRewardsToggleFromTimeline() {
        const toggle = document.getElementById('rewardsEnabled');
        if (!toggle) return;
        const any = this.findRewardSettingsTimelineElements().length > 0;
        toggle.checked = any;
    }

    applyRewardsEnabled(enabled) {
        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) return;

        const existing = this.findRewardSettingsTimelineElements();

        if (enabled) {
            if (existing.length > 0) return;

            // Build a component definition from the library (so defaults stay consistent).
            const defs = this.getComponentDefinitions();
            const rewardDef = defs.find(d => d && (d.id === 'reward-settings' || d.type === 'reward-settings'));
            if (!rewardDef) {
                console.warn('Reward Settings component definition not found');
                return;
            }

            // Add via the normal path (creates DOM + componentData).
            this.addComponentToTimeline(rewardDef);

            // Move it near the top: after any instruction-like prefaces, otherwise first.
            const added = this.findRewardSettingsTimelineElements().slice(-1)[0];
            if (added) {
                added.dataset.autoAddedByRewardsToggle = '1';

                const items = Array.from(timelineContainer.querySelectorAll('.timeline-component'));
                const instructionLike = items.filter(el => {
                    const t = el.dataset.componentType;
                    const builderId = el.dataset.builderComponentId;
                    return t === 'html-keyboard-response' && (builderId === 'instructions' || builderId === 'eye-tracking-calibration-instructions');
                });

                const anchor = instructionLike.length > 0 ? instructionLike[instructionLike.length - 1] : null;
                if (anchor && anchor.nextSibling) {
                    timelineContainer.insertBefore(added, anchor.nextSibling);
                } else if (anchor) {
                    timelineContainer.appendChild(added);
                } else {
                    const first = timelineContainer.querySelector('.timeline-component');
                    if (first) timelineContainer.insertBefore(added, first);
                }
            }

            // Hide empty-state if needed
            const emptyState = timelineContainer.querySelector('.empty-timeline');
            if (emptyState) emptyState.style.display = 'none';
            return;
        }

        // Disable: remove all reward-settings components.
        for (const el of existing) {
            el.remove();
        }

        // Restore empty state if needed
        const hasAny = timelineContainer.querySelector('.timeline-component');
        const emptyState = timelineContainer.querySelector('.empty-timeline');
        if (emptyState) emptyState.style.display = hasAny ? 'none' : '';
    }

    bindRewardsToggleUI() {
        const toggle = document.getElementById('rewardsEnabled');
        if (!toggle) return;

        // Rewards are currently implemented for trial-based timelines.
        if (this.experimentType !== 'trial-based') {
            toggle.disabled = true;
            toggle.checked = false;
            toggle.title = 'Rewards are currently supported in trial-based experiments.';
            return;
        }

        toggle.disabled = false;
        toggle.title = '';

        // Ensure UI reflects timeline state when panel is re-rendered.
        this.syncRewardsToggleFromTimeline();

        if (toggle.dataset.bound === '1') return;
        toggle.dataset.bound = '1';

        toggle.addEventListener('change', () => {
            const enabled = !!toggle.checked;
            this.applyRewardsEnabled(enabled);
            this.updateJSON();
        });
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.initializeModules();
        this.setupEventListeners();

        // Track current task type for safe switching
        this.currentTaskType = document.getElementById('taskType')?.value || 'rdm';

        // Ensure JS state matches the actual checkbox state on load
        this.syncDataCollectionFromUI();

        this.updateExperimentTypeUI(); // Initialize parameter forms (task-scoped)
        this.loadComponentLibrary();

        // Only auto-load the RDM sample template when RDM is selected.
        if (this.currentTaskType === 'rdm') {
            this.loadDefaultRDMTemplate();
        }
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

        // Task type dropdown
        const taskTypeEl = document.getElementById('taskType');
        if (taskTypeEl) {
            taskTypeEl.addEventListener('change', this.onTaskTypeChange);
        }

        // Experiment theme dropdown
        const themeEl = document.getElementById('experimentTheme');
        if (themeEl) {
            themeEl.addEventListener('change', () => {
                this.updateJSON();
            });
        }

        // Main action buttons
        document.getElementById('addComponentBtn').addEventListener('click', () => {
            this.showComponentLibrary();
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJSON();
        });

        const saveJsonBtn = document.getElementById('saveJsonBtn');
        if (saveJsonBtn) {
            saveJsonBtn.addEventListener('click', () => {
                this.saveJSON();
            });
        }

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
        const saveParametersBtn = document.getElementById('saveParametersBtn');
        if (saveParametersBtn) {
            // Use onclick so component-specific editors can override it cleanly.
            saveParametersBtn.onclick = () => {
                this.saveParameters();
            };
        }
        
        // Add event listener for preview button
        document.getElementById('previewComponentBtn').addEventListener('click', () => {
            this.previewCurrentComponent();
        });
    }

    getSharePointFolderUrl() {
        const key = 'psychjson_sharepoint_folder_url_v1';
        const last = (localStorage.getItem(key) || '').toString();

        const raw = prompt(
            'Enter SharePoint folder URL (will open in a new tab):\n\nExample: https://yourtenant.sharepoint.com/sites/YourSite/Shared%20Documents/YourFolder',
            last
        );
        if (raw === null) return null;

        const url = String(raw || '').trim();
        if (!url) return null;
        if (!/^https?:\/\//i.test(url)) {
            this.showValidationResult('error', 'SharePoint URL must start with http:// or https://');
            return null;
        }

        // Defensive: reject non-network schemes.
        if (/^(javascript:|data:|file:)/i.test(url)) {
            this.showValidationResult('error', 'Invalid URL scheme.');
            return null;
        }

        localStorage.setItem(key, url);
        return url;
    }

    getExportFilename(config) {
        // Ask for a 7-char alphanumeric code and use it in the filename.
        const last = (localStorage.getItem('psychjson_last_export_code') || '').toString();
        const rawCode = prompt('Enter export code (7 alphanumeric characters):', last);
        if (rawCode === null) return null;

        const code = (rawCode || '').toString().trim();
        const ok = /^[A-Za-z0-9]{7}$/.test(code);
        if (!ok) {
            this.showValidationResult('error', 'Invalid export code. Please use exactly 7 letters/numbers (A-Z, a-z, 0-9).');
            return null;
        }
        localStorage.setItem('psychjson_last_export_code', code);

        const taskType = (config.task_type || document.getElementById('taskType')?.value || 'task').toString().trim().toLowerCase();
        const prefix = `${code}-${taskType}-`;

        // Browser sandbox cannot inspect your Downloads directory.
        // We approximate "-01, -02, ..." by tracking export history in localStorage.
        const historyKey = 'psychjson_export_history_v1';
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            if (!Array.isArray(history)) history = [];
        } catch {
            history = [];
        }

        const parseSuffix = (name) => {
            if (typeof name !== 'string') return null;
            if (!name.startsWith(prefix) || !name.endsWith('.json')) return null;
            const mid = name.slice(prefix.length, -'.json'.length);
            const n = Number.parseInt(mid, 10);
            return Number.isFinite(n) ? n : null;
        };

        const used = history.map(parseSuffix).filter(n => Number.isFinite(n));
        const nextNum = (used.length ? Math.max(...used) : 0) + 1;
        const suffix = String(nextNum).padStart(2, '0');
        const filename = `${code}-${taskType}-${suffix}.json`;

        history.push(filename);
        if (history.length > 200) history = history.slice(history.length - 200);
        localStorage.setItem(historyKey, JSON.stringify(history));

        return { filename, code, taskType };
    }

    downloadJsonToFile(jsonText, filename) {
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * Save JSON file locally
     */
    saveJSON() {
        const config = this.generateJSON();
        const json = JSON.stringify(config, null, 2);

        const naming = this.getExportFilename(config);
        if (!naming) return;

        this.downloadJsonToFile(json, naming.filename);
        this.showValidationResult('success', `JSON saved locally: ${naming.filename}`);
    }

    /**
     * Handle task type changes
     */
    onTaskTypeChange(event) {
        const nextTaskType = event?.target?.value || 'rdm';
        const prevTaskType = this.currentTaskType || 'rdm';

        if (!this.isTaskTypeAllowedForExperiment(nextTaskType, this.experimentType)) {
            alert(`Task "${nextTaskType}" is not available for ${this.experimentType} experiments.`);
            if (event?.target) event.target.value = prevTaskType;
            return;
        }

        if (nextTaskType === prevTaskType) {
            this.updateJSON();
            return;
        }

        // Custom mode: do not auto-prune timeline.
        if (nextTaskType !== 'custom') {
            const incompatible = this.findIncompatibleTimelineComponents(nextTaskType);
            if (incompatible.count > 0) {
                const ok = confirm(
                    `Switching task type to "${nextTaskType}" will remove ${incompatible.count} incompatible timeline item(s).\n\nContinue?`
                );
                if (!ok) {
                    // Revert dropdown selection
                    if (event?.target) event.target.value = prevTaskType;
                    return;
                }

                this.removeIncompatibleTimelineComponents(nextTaskType);
            }
        }

        this.currentTaskType = nextTaskType;

        // Re-render task-scoped settings UI and component library
        this.updateExperimentTypeUI();
        this.loadComponentLibrary();

        // If switching to a non-RDM task leaves the timeline empty, seed a starter timeline.
        this.maybeInsertStarterTimeline(nextTaskType);

        // If the component library modal is open, the DOM is already updated by loadComponentLibrary.
        this.updateConditionalUI();
        this.updateJSON();
    }

    maybeInsertStarterTimeline(taskType) {
        if (taskType === 'soc-dashboard' && this.experimentType !== 'continuous') return;
        if (taskType !== 'flanker' && taskType !== 'sart' && taskType !== 'gabor' && taskType !== 'stroop' && taskType !== 'simon' && taskType !== 'pvt' && taskType !== 'soc-dashboard') return;

        const timelineContainer = document.getElementById('timelineComponents');
        if (!timelineContainer) return;

        const hasAny = !!timelineContainer.querySelector('.timeline-component');
        if (hasAny) return;

        const defs = this.getComponentDefinitions();
        const instructionsDef = defs.find(d => d.id === 'instructions');
        const trialId = taskType === 'flanker'
            ? 'flanker-trial'
            : (taskType === 'sart')
                ? 'sart-trial'
                : (taskType === 'simon')
                    ? 'simon-trial'
                : (taskType === 'pvt')
                    ? 'pvt-trial'
                : (taskType === 'stroop')
                    ? 'stroop-trial'
                : (taskType === 'soc-dashboard')
                    ? 'soc-dashboard'
                    : 'gabor-trial';
        const trialDef = defs.find(d => d.id === trialId);

        if (instructionsDef) this.addComponentToTimeline(instructionsDef);
        if (trialDef) this.addComponentToTimeline(trialDef);
    }

    /**
     * Return list/count of incompatible timeline components for the given task type.
     */
    findIncompatibleTimelineComponents(taskType) {
        const elements = Array.from(document.querySelectorAll('#timelineComponents .timeline-component'));
        const incompatible = [];

        for (const el of elements) {
            const raw = el.dataset?.componentData;
            let componentData = null;
            try {
                componentData = raw ? JSON.parse(raw) : null;
            } catch {
                componentData = null;
            }

            const type = componentData?.type || el.dataset?.componentType || '';
            if (!type) continue;

            if (!this.isComponentTypeAllowedForTask(type, componentData, taskType)) {
                incompatible.push({ element: el, type });
            }
        }

        return { count: incompatible.length, items: incompatible };
    }

    /**
     * Remove incompatible timeline components for the given task type.
     */
    removeIncompatibleTimelineComponents(taskType) {
        const incompatible = this.findIncompatibleTimelineComponents(taskType);
        for (const item of incompatible.items) {
            item.element.remove();
        }

        // Restore empty state if needed
        const timelineContainer = document.getElementById('timelineComponents');
        if (timelineContainer) {
            const hasAny = timelineContainer.querySelector('.timeline-component');
            const emptyState = timelineContainer.querySelector('.empty-timeline');
            if (emptyState) emptyState.style.display = hasAny ? 'none' : '';
        }
    }

    /**
     * Decide if a component is allowed under a task type.
     */
    isComponentTypeAllowedForTask(type, componentData, taskType) {
        // Always allow generic components
        const alwaysAllowed = new Set([
            'html-keyboard-response',
            'html-button-response',
            'image-keyboard-response',
            'survey-response',
            'instructions',
            'visual-angle-calibration',
            'reward-settings'
        ]);
        if (alwaysAllowed.has(type)) return true;

        const getBlockInnerType = () => {
            if (type !== 'block') return null;
            const d = (componentData && typeof componentData === 'object') ? componentData : {};
            // Block editors sometimes store values under `parameter_values`.
            const pv = (d.parameter_values && typeof d.parameter_values === 'object') ? d.parameter_values : {};
            const inner = d.block_component_type ?? d.component_type ?? pv.block_component_type ?? pv.component_type;
            return (typeof inner === 'string' && inner.trim() !== '') ? inner.trim() : null;
        };

        // Custom: do not restrict
        if (taskType === 'custom') return true;

        if (taskType === 'rdm') {
            // RDM task: keep timeline focused on RDM components.
            if (typeof type === 'string' && type.startsWith('rdm-')) return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return !!innerType && innerType.startsWith('rdm-');
            }
            return false;
        }

        if (taskType === 'flanker') {
            if (type === 'flanker-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'flanker-trial';
            }
            return false;
        }

        if (taskType === 'sart') {
            if (type === 'sart-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'sart-trial';
            }
            return false;
        }

        if (taskType === 'gabor') {
            if (type === 'gabor-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'gabor-trial' || innerType === 'gabor-quest';
            }
            return false;
        }

        if (taskType === 'stroop') {
            if (type === 'stroop-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'stroop-trial';
            }
            return false;
        }

        if (taskType === 'simon') {
            if (type === 'simon-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'simon-trial';
            }
            return false;
        }

        if (taskType === 'pvt') {
            if (type === 'pvt-trial') return true;
            if (type === 'block') {
                const innerType = getBlockInnerType();
                return innerType === 'pvt-trial';
            }
            return false;
        }

        if (taskType === 'soc-dashboard') {
            if (type === 'soc-dashboard') return true;
            if (type === 'soc-dashboard-icon') return true;
            if (type === 'soc-subtask-sart-like') return true;
            if (type === 'soc-subtask-flanker-like') return true;
            if (type === 'soc-subtask-nback-like') return true;
            if (type === 'soc-subtask-wcst-like') return true;
            if (type === 'soc-subtask-pvt-like') return true;
            return false;
        }

        // Default: be conservative
        return false;
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

        // Keep task type options consistent with experiment type.
        // (SOC Dashboard is continuous-only.)
        const taskTypeChanged = this.enforceTaskTypeAvailability();
        
        // Update UI based on experiment type
        this.updateExperimentTypeUI();
        this.updateConditionalUI();

        // If we auto-switched task types, keep the component library in sync.
        if (taskTypeChanged) {
            // Remove any now-incompatible timeline items (e.g., SOC sessions/icons).
            this.removeIncompatibleTimelineComponents(this.currentTaskType);
            this.loadComponentLibrary();
        }
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

        // Data-collection modalities can add/remove components (e.g., eye tracking).
        // Refresh the component library so the modal + sidebar stay in sync.
        this.loadComponentLibrary();
        
        this.updateJSON();
    }

    /**
     * Update UI based on experiment type
     */
    updateExperimentTypeUI() {
        const captureParameterFormState = () => {
            const root = document.getElementById('parameterForms');
            if (!root) return {};
            const state = {};

            root.querySelectorAll('input[id], select[id], textarea[id]').forEach((el) => {
                const id = el.id;
                if (!id) return;
                const tag = (el.tagName || '').toLowerCase();
                const type = (el.type || '').toLowerCase();

                if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
                    state[id] = { kind: 'checked', value: !!el.checked };
                } else {
                    state[id] = { kind: 'value', value: (el.value ?? '').toString() };
                }
            });

            return state;
        };

        const restoreParameterFormState = (state) => {
            const root = document.getElementById('parameterForms');
            if (!root || !state || typeof state !== 'object') return;

            for (const [id, entry] of Object.entries(state)) {
                if (!id) continue;
                const el = document.getElementById(id);
                if (!el || !root.contains(el)) continue;
                if (!entry || typeof entry !== 'object') continue;

                const tag = (el.tagName || '').toLowerCase();
                const type = (el.type || '').toLowerCase();
                const kind = entry.kind;

                if (tag === 'input' && (type === 'checkbox' || type === 'radio') && kind === 'checked') {
                    el.checked = !!entry.value;
                } else if (kind === 'value') {
                    el.value = entry.value;
                }
            }
        };

        const prevState = captureParameterFormState();

        // Enforce task-type availability whenever we rerender task-scoped panels.
        this.enforceTaskTypeAvailability();

        const parameterForms = document.getElementById('parameterForms');
        parameterForms.innerHTML = '';
        
        if (this.experimentType === 'trial-based') {
            this.showTrialBasedParameters();
        } else if (this.experimentType === 'continuous') {
            this.showContinuousParameters();
        }

        // Preserve any author-edited values (e.g., instruction templates with placeholders)
        // across experiment-type switches.
        restoreParameterFormState(prevState);

        // Ensure conditional sections match current state after re-render
        this.updateConditionalUI();
    }

    isTaskTypeAllowedForExperiment(taskType, experimentType) {
        const t = (taskType ?? '').toString().trim();
        const e = (experimentType ?? '').toString().trim();

        // Keep PVT available in both modes.
        if (t === 'pvt') return true;

        if (e === 'continuous') {
            // Only show/allow continuous-capable tasks in continuous experiments.
            // RDM has a special continuous compilation path; SOC Dashboard is also continuous-only.
            return (t === 'rdm' || t === 'soc-dashboard' || t === 'custom');
        }

        // Trial-based: SOC Dashboard should not be selectable.
        if (t === 'soc-dashboard') return false;
        return true;
    }

    enforceTaskTypeAvailability() {
        const taskTypeEl = document.getElementById('taskType');
        if (!taskTypeEl) return false;

        let changed = false;

        // Show/hide task types based on experiment type.
        const options = Array.from(taskTypeEl.options || []);
        for (const opt of options) {
            const value = (opt?.value ?? '').toString();
            const allowed = this.isTaskTypeAllowedForExperiment(value, this.experimentType);
            // Prefer hiding instead of disabling so each mode has a clean dropdown.
            opt.hidden = !allowed;
            // Preserve author-intended disabled state for "Coming Soon" items.
            // But ensure allowed tasks are not disabled just because HTML had it.
            if (allowed && value === 'soc-dashboard') {
                opt.disabled = false;
            }
        }

        // If current selection is now disallowed/hidden, switch to a safe default.
        const currentAllowed = this.isTaskTypeAllowedForExperiment(taskTypeEl.value, this.experimentType);
        if (!currentAllowed) {
            const fallback = options.find(o => !o.hidden && !o.disabled && (o.value === 'rdm'))
                || options.find(o => !o.hidden && !o.disabled)
                || null;
            if (fallback) {
                taskTypeEl.value = fallback.value;
                changed = true;
            }
        }

        if (changed) {
            this.currentTaskType = taskTypeEl.value || 'rdm';
        }

        return changed;
    }

    /**
     * Show parameters for trial-based experiments
     */
    showTrialBasedParameters() {
        const container = document.getElementById('parameterForms');
        const taskType = document.getElementById('taskType')?.value || 'rdm';

        const taskSpecificDefaultsHtml = (taskType === 'flanker')
            ? `
            <div class="parameter-group" id="flankerExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Flanker Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Flanker components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentFlankerDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Type:</label>
                    <select class="form-control parameter-input" id="flankerStimulusType">
                        <option value="arrows" selected>Arrows</option>
                        <option value="letters">Letters</option>
                        <option value="symbols">Symbols</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div class="parameter-help">Applies to newly-added Flanker trials/blocks</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Target Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerTargetStimulus" value="H">
                    <div class="parameter-help">Used when stimulus type is letters/symbols/custom</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Distractor Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerDistractorStimulus" value="S">
                    <div class="parameter-help">Used when congruency = incongruent (letters/symbols/custom)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Neutral Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerNeutralStimulus" value="–">
                    <div class="parameter-help">Used when congruency = neutral</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Fixation Dot:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="flankerShowFixationDot">
                            <label class="form-check-label" for="flankerShowFixationDot">Show dot under center stimulus</label>
                        </div>
                    </div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Between-trials Fixation:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="flankerShowFixationCrossBetweenTrials">
                            <label class="form-check-label" for="flankerShowFixationCrossBetweenTrials">Show fixation cross during ITI</label>
                        </div>
                    </div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Left Key:</label>
                    <input type="text" class="form-control parameter-input" id="flankerLeftKey" value="f">
                    <div class="parameter-help">Default key for "left" responses</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Right Key:</label>
                    <input type="text" class="form-control parameter-input" id="flankerRightKey" value="j">
                    <div class="parameter-help">Default key for "right" responses</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerStimulusDurationMs" value="800" min="0" max="10000">
                    <div class="parameter-help">Default stimulus display duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerTrialDurationMs" value="1500" min="0" max="30000">
                    <div class="parameter-help">Default total trial duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerItiMs" value="500" min="0" max="10000">
                    <div class="parameter-help">Default inter-trial interval</div>
                </div>
            </div>
            `
            : (taskType === 'sart')
            ? `
            <div class="parameter-group" id="sartExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>SART Experiment Settings</span>
                        <small class="text-muted d-block">Default values for SART components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentSartDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Go Key:</label>
                    <input type="text" class="form-control parameter-input" id="sartGoKey" value="space">
                    <div class="parameter-help">Default response key for GO trials</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">No-Go Digit:</label>
                    <input type="number" class="form-control parameter-input" id="sartNoGoDigit" value="3" min="0" max="9">
                    <div class="parameter-help">Digit that signals a NO-GO trial</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartStimulusDurationMs" value="250" min="0" max="10000">
                    <div class="parameter-help">Default digit display duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Mask Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartMaskDurationMs" value="900" min="0" max="10000">
                    <div class="parameter-help">Default mask duration after digit</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartItiMs" value="0" min="0" max="10000">
                    <div class="parameter-help">Default inter-trial interval</div>
                </div>
            </div>
            `
            : (taskType === 'simon')
            ? `
            <div class="parameter-group" id="simonExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Simon Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Simon components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentSimonDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Stimulus A (maps to LEFT response):</label>
                    <div class="d-flex gap-2 align-items-center">
                        <input type="text" class="form-control parameter-input" id="simonStimulusName_1" value="BLUE" style="max-width: 200px;" />
                        <input type="color" class="form-control parameter-input" id="simonStimulusColor_1" value="#0066ff" style="width: 72px;" />
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Stimulus B (maps to RIGHT response):</label>
                    <div class="d-flex gap-2 align-items-center">
                        <input type="text" class="form-control parameter-input" id="simonStimulusName_2" value="ORANGE" style="max-width: 200px;" />
                        <input type="color" class="form-control parameter-input" id="simonStimulusColor_2" value="#ff7a00" style="width: 72px;" />
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response Device:</label>
                    <select class="form-control parameter-input" id="simonDefaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                    </select>
                    <div class="parameter-help">Mouse mode uses clickable left/right circles.</div>
                </div>

                <div class="parameter-row" id="simonKeyboardOnlyNote" style="display:none;">
                    <label class="parameter-label text-muted">Keyboard Mappings:</label>
                    <div class="parameter-help text-muted">Key mappings are ignored when response device is Mouse.</div>
                </div>

                <div id="simonKeyboardKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Left Key:</label>
                        <input type="text" class="form-control parameter-input" id="simonLeftKey" value="f">
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Right Key:</label>
                        <input type="text" class="form-control parameter-input" id="simonRightKey" value="j">
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Circle Diameter (px):</label>
                    <input type="number" class="form-control parameter-input" id="simonCircleDiameterPx" value="140" min="40" max="400">
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="simonStimulusDurationMs" value="0" min="0" max="10000">
                    <div class="parameter-help">0 = show until response or trial duration</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="simonTrialDurationMs" value="1500" min="0" max="30000">
                    <div class="parameter-help">0 = no timeout</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="simonItiMs" value="500" min="0" max="10000">
                </div>
            </div>
            `
            : (taskType === 'pvt')
            ? `
            <div class="parameter-group" id="pvtExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>PVT Experiment Settings</span>
                        <small class="text-muted d-block">Default values for PVT components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentPvtDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response Device:</label>
                    <select class="form-control parameter-input" id="pvtDefaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="both">Both</option>
                    </select>
                    <div class="parameter-help">Mouse mode registers clicks on the timer screen. Both allows keyboard + click.</div>
                </div>

                <div class="parameter-row" id="pvtKeyboardOnlyNote" style="display:none;">
                    <label class="parameter-label text-muted">Keyboard Mapping:</label>
                    <div class="parameter-help text-muted">Key mapping is ignored when response device is Mouse.</div>
                </div>

                <div id="pvtKeyboardKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Response Key:</label>
                        <input type="text" class="form-control parameter-input" id="pvtResponseKey" value="space">
                        <div class="parameter-help">Key used to respond when the timer is running</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Foreperiod (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtForeperiodMs" value="4000" min="0" max="60000">
                    <div class="parameter-help">Delay before timer starts (blocks can randomize this)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtTrialDurationMs" value="10000" min="0" max="60000">
                    <div class="parameter-help">0 = no timeout (timer can run indefinitely)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtItiMs" value="0" min="0" max="30000">
                    <div class="parameter-help">Post-trial gap after response/timeout</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Feedback Mode:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="pvtFeedbackEnabled">
                            <label class="form-check-label" for="pvtFeedbackEnabled">Show feedback message on false starts (responses before the timer starts)</label>
                        </div>
                    </div>
                </div>

                <div class="parameter-row" id="pvtFeedbackMessageGroup" style="display:none;">
                    <label class="parameter-label">Feedback Message:</label>
                    <textarea class="form-control parameter-input" id="pvtFeedbackMessage" rows="2" placeholder="e.g., Too soon! / Please wait for the timer."></textarea>
                    <div class="parameter-help">Displayed only after false starts (researcher-defined)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">False Start Handling:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="pvtAddTrialPerFalseStart">
                            <label class="form-check-label" for="pvtAddTrialPerFalseStart">Add one extra trial per false start</label>
                        </div>
                        <div class="parameter-help">When enabled, false starts do not count toward the intended PVT block length (Interpreter extends the block to preserve the target number of valid trials).</div>
                    </div>
                </div>
            </div>
            `
            : (taskType === 'gabor')
            ? `
            <div class="parameter-group" id="gaborExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Gabor Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Gabor components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentGaborDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Response Task:</label>
                    <select class="form-control parameter-input" id="gaborResponseTask">
                        <option value="detect_target">Detect target (yes/no)</option>
                        <option value="discriminate_tilt" selected>Discriminate target tilt (left/right)</option>
                    </select>
                    <div class="parameter-help">Interpreter decides scoring based on this mode</div>
                </div>

                <div id="gaborDirectionKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Left Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborLeftKey" value="f">
                        <div class="parameter-help">Used for left-tilt responses (discriminate_tilt)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Right Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborRightKey" value="j">
                        <div class="parameter-help">Used for right-tilt responses (discriminate_tilt)</div>
                    </div>
                </div>

                <div id="gaborDetectionKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Yes Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborYesKey" value="f">
                        <div class="parameter-help">Used for target-present responses (detect_target)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">No Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborNoKey" value="j">
                        <div class="parameter-help">Used for target-absent responses (detect_target)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">High Value Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborHighValueColor" value="#00aa00">
                    <div class="parameter-help">Example: green = high value</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Low Value Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborLowValueColor" value="#0066ff">
                    <div class="parameter-help">Example: blue = low value</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Patch Border:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborPatchBorderEnabled" checked>
                            <label class="form-check-label" for="gaborPatchBorderEnabled">Draw circular border around each patch</label>
                        </div>
                    </div>
                    <div class="parameter-help">Controls the circle border drawn around the Gabor stimulus + mask</div>
                </div>
                <div id="gaborPatchBorderDetails">
                <div class="parameter-row">
                    <label class="parameter-label">Border Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPatchBorderWidthPx" value="2" min="0" max="50" step="1">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Border Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborPatchBorderColor" value="#ffffff">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Border Opacity (0–1):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPatchBorderOpacity" value="0.22" min="0" max="1" step="0.01">
                </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Frequency (cyc/px):</label>
                    <input type="number" class="form-control parameter-input" id="gaborSpatialFrequency" value="0.06" min="0.001" max="0.5" step="0.001">
                    <div class="parameter-help">Spatial frequency of the grating carrier (Gaussian envelope)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Grating Waveform:</label>
                    <select class="form-control parameter-input" id="gaborGratingWaveform">
                        <option value="sinusoidal" selected>Sinusoidal</option>
                        <option value="square">Square</option>
                        <option value="triangle">Triangle</option>
                    </select>
                    <div class="parameter-help">Carrier waveform; envelope remains Gaussian</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Patch Diameter (deg):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPatchDiameterDeg" value="6" min="0.1" max="60" step="0.1">
                    <div class="parameter-help">Primary size control: patch diameter in degrees of visual angle. For true degree-based sizing, add a Visual Angle Calibration component before Gabor trials/blocks.</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Cue Validity (0–1):</label>
                    <input type="number" class="form-control parameter-input" id="gaborSpatialCueValidity" value="0.8" min="0" max="1" step="0.01">
                    <div class="parameter-help">Directional arrow indicates this probability the target is at the cued location</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Cue Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborSpatialCueEnabled" checked>
                            <label class="form-check-label" for="gaborSpatialCueEnabled">Enable</label>
                        </div>
                    </div>
                    <div class="parameter-help">Gabor: enable sampling spatial cue presence per trial (when false: spatial_cue forced to none)</div>
                </div>
                <div id="gaborSpatialCueDetails">
                    <div class="parameter-row">
                        <label class="parameter-label">Spatial Cue Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborSpatialCueOptions" value="none,left,right,both">
                        <div class="parameter-help">Gabor: comma-separated spatial cue options to sample from. Allowed: none, left, right, both.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Spatial Cue Probability:</label>
                        <input type="number" class="form-control parameter-input" id="gaborSpatialCueProbability" value="1" min="0" max="1" step="0.01">
                        <div class="parameter-help">Gabor: probability a trial contains a spatial cue (0–1)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Value Cue Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborValueCueEnabled" checked>
                            <label class="form-check-label" for="gaborValueCueEnabled">Enable</label>
                        </div>
                    </div>
                    <div class="parameter-help">Gabor: enable sampling value cue presence per trial (when false: left/right_value forced to neutral)</div>
                </div>
                <div id="gaborValueCueDetails">
                    <div class="parameter-row">
                        <label class="parameter-label">Left Value Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborLeftValueOptions" value="neutral,high,low">
                        <div class="parameter-help">Gabor: comma-separated left value cue options to sample from. Allowed: neutral, high, low.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Right Value Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborRightValueOptions" value="neutral,high,low">
                        <div class="parameter-help">Gabor: comma-separated right value cue options to sample from. Allowed: neutral, high, low.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Value Cue Probability:</label>
                        <input type="number" class="form-control parameter-input" id="gaborValueCueProbability" value="1" min="0" max="1" step="0.01">
                        <div class="parameter-help">Gabor: probability a trial contains value cues (0–1)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Fixation (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborFixationMs" value="1000" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Placeholders (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPlaceholdersMs" value="400" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueMs" value="300" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue→Target Delay Min (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueDelayMinMs" value="100" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue→Target Delay Max (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueDelayMaxMs" value="200" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborStimulusDurationMs" value="67" min="0" max="10000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Mask Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborMaskDurationMs" value="67" min="0" max="10000">
                </div>
            </div>
            `
            : (taskType === 'stroop')
            ? `
            <div class="parameter-group" id="stroopExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Stroop Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Stroop components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentStroopDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Set Size:</label>
                    <input type="number" class="form-control parameter-input" id="stroopStimulusSetSize" value="4" min="2" max="7">
                    <div class="parameter-help">Number of color-name stimuli (2–7)</div>
                </div>

                <div id="stroopStimuliRows"></div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response Mode:</label>
                    <select class="form-control parameter-input" id="stroopDefaultResponseMode">
                        <option value="color_naming" selected>Precise color naming (choose ink color)</option>
                        <option value="congruency">Congruency judgment (match vs mismatch)</option>
                    </select>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default Response Device:</label>
                    <select class="form-control parameter-input" id="stroopDefaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                    </select>
                    <div class="parameter-help">Mouse mode shows on-screen buttons; keyboard uses keys below.</div>
                </div>

                <div class="parameter-row" id="stroopKeyboardOnlyNote" style="display:none;">
                    <label class="parameter-label text-muted">Keyboard Mappings:</label>
                    <div class="parameter-help text-muted">Key mappings are ignored when response device is Mouse.</div>
                </div>

                <div id="stroopColorNamingKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Choice Keys:</label>
                        <input type="text" class="form-control parameter-input" id="stroopChoiceKeys" value="1,2,3,4">
                        <div class="parameter-help">Comma-separated keys mapped to Stimulus 1..N (e.g., 1,2,3,4)</div>
                    </div>
                </div>

                <div id="stroopCongruencyKeysGroup" style="display:none;">
                    <div class="parameter-row">
                        <label class="parameter-label">Congruent Key:</label>
                        <input type="text" class="form-control parameter-input" id="stroopCongruentKey" value="f">
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Incongruent Key:</label>
                        <input type="text" class="form-control parameter-input" id="stroopIncongruentKey" value="j">
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Font Size (px):</label>
                    <input type="number" class="form-control parameter-input" id="stroopStimulusFontSizePx" value="64" min="10" max="200">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="stroopStimulusDurationMs" value="0" min="0" max="10000">
                    <div class="parameter-help">0 = show until response or trial duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="stroopTrialDurationMs" value="2000" min="0" max="30000">
                    <div class="parameter-help">0 = no timeout</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="stroopItiMs" value="500" min="0" max="10000">
                </div>
            </div>
            `
            : (taskType === 'soc-dashboard')
            ? `
            <div class="parameter-group" id="socDashboardExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>SOC Dashboard Settings</span>
                        <small class="text-muted d-block">Experiment-wide defaults (applies to newly-added SOC session components). Add subtasks via the Component Library.</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentSocDashboardDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Session Title:</label>
                    <input type="text" class="form-control parameter-input" id="socTitle" value="SOC Dashboard">
                    <div class="parameter-help">Shown in the subtask window titlebars</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Wallpaper URL:</label>
                    <input type="text" class="form-control parameter-input" id="socWallpaperUrl" value="" placeholder="https://...">
                    <div class="parameter-help">Optional background image URL (leave blank for default gradient)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Background Color:</label>
                    <input type="color" class="form-control parameter-input" id="socBackgroundColor" value="#0b1220">
                    <div class="parameter-help">Used when no wallpaper URL is provided</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Desktop Icons Clickable:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socIconsClickable" checked>
                            <label class="form-check-label" for="socIconsClickable">Show icons as clickable</label>
                        </div>
                    </div>
                    <div class="parameter-help">If disabled, icon clicks can still be logged (visual affordance only)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Log Icon Clicks:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socLogIconClicks" checked>
                            <label class="form-check-label" for="socLogIconClicks">Record icon clicks in the trial events log</label>
                        </div>
                    </div>
                    <div class="parameter-help">Useful for multitasking/distractor analysis</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Tag Icon Clicks as Distractors:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socIconClicksAreDistractors" checked>
                            <label class="form-check-label" for="socIconClicksAreDistractors">Add a distractor flag to icon-click events</label>
                        </div>
                    </div>
                    <div class="parameter-help">When enabled, icon-click events include <code>distractor: true</code></div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default App:</label>
                    <select class="form-control parameter-input" id="socDefaultApp">
                        <option value="soc" selected>SOC</option>
                        <option value="email">Email</option>
                        <option value="terminal">Terminal</option>
                    </select>
                    <div class="parameter-help">Initial active app when the session starts</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Number of Tasks:</label>
                    <input type="number" class="form-control parameter-input" id="socNumTasks" value="1" min="1" max="4">
                    <div class="parameter-help">Fallback window count used when no subtasks are configured (1–4)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Session Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="socSessionDurationMs" value="60000" min="0" max="3600000">
                    <div class="parameter-help">0 = no auto-end (participant ends with end key)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">End Key:</label>
                    <input type="text" class="form-control parameter-input" id="socEndKey" value="escape">
                    <div class="parameter-help">Key that ends the session (e.g., escape)</div>
                </div>
            </div>
            `
            : '';
        
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
                <div class="parameter-row">
                    <label class="parameter-label">Rewards Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="rewardsEnabled">
                            <label class="form-check-label" for="rewardsEnabled">Enable rewards</label>
                        </div>
                    </div>
                    <div class="parameter-help">When enabled, the Builder adds a Reward Settings component to the timeline so reward policy doesn’t clutter experiment-wide defaults.</div>
                </div>
            </div>
            
            ${taskType === 'rdm' ? `
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
                    <label class="parameter-label">Aperture Outline:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input parameter-input" type="checkbox" id="apertureOutlineEnabled">
                            <label class="form-check-label" for="apertureOutlineEnabled">Show outline</label>
                        </div>
                    </div>
                    <div class="parameter-help">Experiment default: draw an outline around the aperture</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Outline Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="apertureOutlineWidth" value="2" min="0" max="50" step="0.5">
                    <div class="parameter-help">Experiment default outline width (used when outline is enabled)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Outline Color:</label>
                    <input type="color" class="form-control parameter-input" id="apertureOutlineColor" value="#FFFFFF">
                    <div class="parameter-help">Experiment default outline color (used when outline is enabled)</div>
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
            ` : ''}

            ${taskSpecificDefaultsHtml}
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

        // Task-specific conditional UI (Gabor response keys)
        this.bindGaborSettingsUI();

        // Task-specific conditional UI (Stroop stimulus set + response mappings)
        this.bindStroopSettingsUI();

        // Task-specific conditional UI (Simon response device + keys)
        this.bindSimonSettingsUI();

        // Task-specific conditional UI (PVT response device + key)
        this.bindPvtSettingsUI();

        // Rewards toggle (experiment-wide)
        this.bindRewardsToggleUI();
        
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
        const taskType = document.getElementById('taskType')?.value || 'rdm';

        const taskSpecificDefaultsHtml = (taskType === 'flanker')
            ? `
            <div class="parameter-group" id="flankerExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Flanker Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Flanker components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentFlankerDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Type:</label>
                    <select class="form-control parameter-input" id="flankerStimulusType">
                        <option value="arrows" selected>Arrows</option>
                        <option value="letters">Letters</option>
                        <option value="symbols">Symbols</option>
                        <option value="custom">Custom</option>
                    </select>
                    <div class="parameter-help">Applies to newly-added Flanker trials/blocks</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Target Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerTargetStimulus" value="H">
                    <div class="parameter-help">Used when stimulus type is letters/symbols/custom</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Distractor Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerDistractorStimulus" value="S">
                    <div class="parameter-help">Used when congruency = incongruent (letters/symbols/custom)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Neutral Stimulus:</label>
                    <input type="text" class="form-control parameter-input" id="flankerNeutralStimulus" value="–">
                    <div class="parameter-help">Used when congruency = neutral</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Fixation Dot:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="flankerShowFixationDot">
                            <label class="form-check-label" for="flankerShowFixationDot">Show dot under center stimulus</label>
                        </div>
                    </div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Between-trials Fixation:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="flankerShowFixationCrossBetweenTrials">
                            <label class="form-check-label" for="flankerShowFixationCrossBetweenTrials">Show fixation cross during ITI</label>
                        </div>
                    </div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Left Key:</label>
                    <input type="text" class="form-control parameter-input" id="flankerLeftKey" value="f">
                    <div class="parameter-help">Default key for "left" responses</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Right Key:</label>
                    <input type="text" class="form-control parameter-input" id="flankerRightKey" value="j">
                    <div class="parameter-help">Default key for "right" responses</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerStimulusDurationMs" value="800" min="0" max="10000">
                    <div class="parameter-help">Default stimulus display duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerTrialDurationMs" value="1500" min="0" max="30000">
                    <div class="parameter-help">Default total trial duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="flankerItiMs" value="500" min="0" max="10000">
                    <div class="parameter-help">Default inter-trial interval</div>
                </div>
            </div>
            `
            : (taskType === 'sart')
            ? `
            <div class="parameter-group" id="sartExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>SART Experiment Settings</span>
                        <small class="text-muted d-block">Default values for SART components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentSartDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Go Key:</label>
                    <input type="text" class="form-control parameter-input" id="sartGoKey" value="space">
                    <div class="parameter-help">Default response key for GO trials</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">No-Go Digit:</label>
                    <input type="number" class="form-control parameter-input" id="sartNoGoDigit" value="3" min="0" max="9">
                    <div class="parameter-help">Digit that signals a NO-GO trial</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartStimulusDurationMs" value="250" min="0" max="10000">
                    <div class="parameter-help">Default digit display duration</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Mask Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartMaskDurationMs" value="900" min="0" max="10000">
                    <div class="parameter-help">Default mask duration after digit</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="sartItiMs" value="0" min="0" max="10000">
                    <div class="parameter-help">Default inter-trial interval</div>
                </div>
            </div>
            `
            : (taskType === 'pvt')
            ? `
            <div class="parameter-group" id="pvtExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>PVT Experiment Settings</span>
                        <small class="text-muted d-block">Default values for PVT components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentPvtDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Response Device:</label>
                    <select class="form-control parameter-input" id="pvtDefaultResponseDevice">
                        <option value="keyboard" selected>Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="both">Both</option>
                    </select>
                    <div class="parameter-help">Mouse mode registers clicks on the timer screen. Both allows keyboard + click.</div>
                </div>

                <div class="parameter-row" id="pvtKeyboardOnlyNote" style="display:none;">
                    <label class="parameter-label text-muted">Keyboard Mapping:</label>
                    <div class="parameter-help text-muted">Key mapping is ignored when response device is Mouse.</div>
                </div>

                <div id="pvtKeyboardKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Response Key:</label>
                        <input type="text" class="form-control parameter-input" id="pvtResponseKey" value="space">
                        <div class="parameter-help">Key used to respond when the timer is running</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Foreperiod (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtForeperiodMs" value="4000" min="0" max="60000">
                    <div class="parameter-help">Delay before timer starts (blocks can randomize this)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Trial Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtTrialDurationMs" value="10000" min="0" max="60000">
                    <div class="parameter-help">0 = no timeout (timer can run indefinitely)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">ITI (ms):</label>
                    <input type="number" class="form-control parameter-input" id="pvtItiMs" value="0" min="0" max="30000">
                    <div class="parameter-help">Post-trial gap after response/timeout</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Feedback Mode:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="pvtFeedbackEnabled">
                            <label class="form-check-label" for="pvtFeedbackEnabled">Show feedback message on false starts (responses before the timer starts)</label>
                        </div>
                    </div>
                </div>

                <div class="parameter-row" id="pvtFeedbackMessageGroup" style="display:none;">
                    <label class="parameter-label">Feedback Message:</label>
                    <textarea class="form-control parameter-input" id="pvtFeedbackMessage" rows="2" placeholder="e.g., Too soon! / Please wait for the timer."></textarea>
                    <div class="parameter-help">Displayed only after false starts (researcher-defined)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">False Start Handling:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="pvtAddTrialPerFalseStart">
                            <label class="form-check-label" for="pvtAddTrialPerFalseStart">Add one extra trial per false start</label>
                        </div>
                        <div class="parameter-help">When enabled, false starts do not count toward the intended PVT block length (Interpreter extends the block to preserve the target number of valid trials).</div>
                    </div>
                </div>
            </div>
            `
            : (taskType === 'gabor')
            ? `
            <div class="parameter-group" id="gaborExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>Gabor Experiment Settings</span>
                        <small class="text-muted d-block">Default values for Gabor components</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentGaborDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Response Task:</label>
                    <select class="form-control parameter-input" id="gaborResponseTask">
                        <option value="detect_target">Detect target (yes/no)</option>
                        <option value="discriminate_tilt" selected>Discriminate target tilt (left/right)</option>
                    </select>
                    <div class="parameter-help">Interpreter decides scoring based on this mode</div>
                </div>

                <div id="gaborDirectionKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Left Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborLeftKey" value="f">
                        <div class="parameter-help">Used for left-tilt responses (discriminate_tilt)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Right Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborRightKey" value="j">
                        <div class="parameter-help">Used for right-tilt responses (discriminate_tilt)</div>
                    </div>
                </div>

                <div id="gaborDetectionKeysGroup">
                    <div class="parameter-row">
                        <label class="parameter-label">Yes Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborYesKey" value="f">
                        <div class="parameter-help">Used for target-present responses (detect_target)</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">No Key:</label>
                        <input type="text" class="form-control parameter-input" id="gaborNoKey" value="j">
                        <div class="parameter-help">Used for target-absent responses (detect_target)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">High Value Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborHighValueColor" value="#00aa00">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Low Value Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborLowValueColor" value="#0066ff">
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Patch Border:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborPatchBorderEnabled" checked>
                            <label class="form-check-label" for="gaborPatchBorderEnabled">Draw circular border around each patch</label>
                        </div>
                    </div>
                </div>
                <div id="gaborPatchBorderDetails">
                <div class="parameter-row">
                    <label class="parameter-label">Border Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPatchBorderWidthPx" value="2" min="0" max="50" step="1">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Border Color:</label>
                    <input type="color" class="form-control parameter-input" id="gaborPatchBorderColor" value="#ffffff">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Border Opacity (0–1):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPatchBorderOpacity" value="0.22" min="0" max="1" step="0.01">
                </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Frequency (cyc/px):</label>
                    <input type="number" class="form-control parameter-input" id="gaborSpatialFrequency" value="0.06" min="0.001" max="0.5" step="0.001">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Grating Waveform:</label>
                    <select class="form-control parameter-input" id="gaborGratingWaveform">
                        <option value="sinusoidal" selected>Sinusoidal</option>
                        <option value="square">Square</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Cue Validity (0–1):</label>
                    <input type="number" class="form-control parameter-input" id="gaborSpatialCueValidity" value="0.8" min="0" max="1" step="0.01">
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Spatial Cue Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborSpatialCueEnabled" checked>
                            <label class="form-check-label" for="gaborSpatialCueEnabled">Enable</label>
                        </div>
                    </div>
                    <div class="parameter-help">Gabor: enable sampling spatial cue presence per trial (when false: spatial_cue forced to none)</div>
                </div>
                <div id="gaborSpatialCueDetails">
                    <div class="parameter-row">
                        <label class="parameter-label">Spatial Cue Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborSpatialCueOptions" value="none,left,right,both">
                        <div class="parameter-help">Gabor: comma-separated spatial cue options to sample from. Allowed: none, left, right, both.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Spatial Cue Probability:</label>
                        <input type="number" class="form-control parameter-input" id="gaborSpatialCueProbability" value="1" min="0" max="1" step="0.01">
                        <div class="parameter-help">Gabor: probability a trial contains a spatial cue (0–1)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Value Cue Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="gaborValueCueEnabled" checked>
                            <label class="form-check-label" for="gaborValueCueEnabled">Enable</label>
                        </div>
                    </div>
                    <div class="parameter-help">Gabor: enable sampling value cue presence per trial (when false: left/right_value forced to neutral)</div>
                </div>
                <div id="gaborValueCueDetails">
                    <div class="parameter-row">
                        <label class="parameter-label">Left Value Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborLeftValueOptions" value="neutral,high,low">
                        <div class="parameter-help">Gabor: comma-separated left value cue options to sample from. Allowed: neutral, high, low.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Right Value Options:</label>
                        <input type="text" class="form-control parameter-input" id="gaborRightValueOptions" value="neutral,high,low">
                        <div class="parameter-help">Gabor: comma-separated right value cue options to sample from. Allowed: neutral, high, low.</div>
                    </div>
                    <div class="parameter-row">
                        <label class="parameter-label">Value Cue Probability:</label>
                        <input type="number" class="form-control parameter-input" id="gaborValueCueProbability" value="1" min="0" max="1" step="0.01">
                        <div class="parameter-help">Gabor: probability a trial contains value cues (0–1)</div>
                    </div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Fixation (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborFixationMs" value="1000" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Placeholders (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborPlaceholdersMs" value="400" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueMs" value="300" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue→Target Delay Min (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueDelayMinMs" value="100" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Cue→Target Delay Max (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborCueDelayMaxMs" value="200" min="0" max="20000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Stimulus Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborStimulusDurationMs" value="67" min="0" max="10000">
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Mask Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="gaborMaskDurationMs" value="67" min="0" max="10000">
                </div>
            </div>
            `
            : (taskType === 'soc-dashboard')
            ? `
            <div class="parameter-group" id="socDashboardExperimentParameters">
                <div class="group-title d-flex justify-content-between align-items-center">
                    <div>
                        <span>SOC Dashboard Settings</span>
                        <small class="text-muted d-block">Experiment-wide defaults (applies to newly-added SOC session components). Add subtasks via the Component Library.</small>
                    </div>
                    <button class="btn btn-sm btn-info" id="previewTaskDefaultsBtn" onclick="window.componentPreview?.showPreview(window.jsonBuilderInstance?.getCurrentSocDashboardDefaults())">
                        <i class="fas fa-eye"></i> Preview Defaults
                    </button>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Session Title:</label>
                    <input type="text" class="form-control parameter-input" id="socTitle" value="SOC Dashboard">
                    <div class="parameter-help">Shown in the subtask window titlebars</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Wallpaper URL:</label>
                    <input type="text" class="form-control parameter-input" id="socWallpaperUrl" value="" placeholder="https://...">
                    <div class="parameter-help">Optional background image URL (leave blank for default gradient)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Background Color:</label>
                    <input type="color" class="form-control parameter-input" id="socBackgroundColor" value="#0b1220">
                    <div class="parameter-help">Used when no wallpaper URL is provided</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Desktop Icons Clickable:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socIconsClickable" checked>
                            <label class="form-check-label" for="socIconsClickable">Show icons as clickable</label>
                        </div>
                    </div>
                    <div class="parameter-help">If disabled, icon clicks can still be logged (visual affordance only)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Log Icon Clicks:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socLogIconClicks" checked>
                            <label class="form-check-label" for="socLogIconClicks">Record icon clicks in the trial events log</label>
                        </div>
                    </div>
                    <div class="parameter-help">Useful for multitasking/distractor analysis</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Tag Icon Clicks as Distractors:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="socIconClicksAreDistractors" checked>
                            <label class="form-check-label" for="socIconClicksAreDistractors">Add a distractor flag to icon-click events</label>
                        </div>
                    </div>
                    <div class="parameter-help">When enabled, icon-click events include <code>distractor: true</code></div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Default App:</label>
                    <select class="form-control parameter-input" id="socDefaultApp">
                        <option value="soc" selected>SOC</option>
                        <option value="email">Email</option>
                        <option value="terminal">Terminal</option>
                    </select>
                    <div class="parameter-help">Initial active app when the session starts</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Number of Tasks:</label>
                    <input type="number" class="form-control parameter-input" id="socNumTasks" value="1" min="1" max="4">
                    <div class="parameter-help">Fallback window count used when no subtasks are configured (1–4)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">Session Duration (ms):</label>
                    <input type="number" class="form-control parameter-input" id="socSessionDurationMs" value="60000" min="0" max="3600000">
                    <div class="parameter-help">0 = no auto-end (participant ends with end key)</div>
                </div>

                <div class="parameter-row">
                    <label class="parameter-label">End Key:</label>
                    <input type="text" class="form-control parameter-input" id="socEndKey" value="escape">
                    <div class="parameter-help">Key that ends the session (e.g., escape)</div>
                </div>
            </div>
            `
            : '';
        
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
                <div class="parameter-row">
                    <label class="parameter-label">Rewards Enabled:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="rewardsEnabled">
                            <label class="form-check-label" for="rewardsEnabled">Enable rewards</label>
                        </div>
                    </div>
                    <div class="parameter-help">When enabled, the Builder adds a Reward Settings component to the timeline so reward policy doesn’t clutter experiment-wide defaults.</div>
                </div>
            </div>

            ${taskType === 'rdm' ? `
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
                    <label class="parameter-label">Aperture Outline:</label>
                    <div class="parameter-input">
                        <div class="form-check form-switch">
                            <input class="form-check-input parameter-input" type="checkbox" id="apertureOutlineEnabled">
                            <label class="form-check-label" for="apertureOutlineEnabled">Show outline</label>
                        </div>
                    </div>
                    <div class="parameter-help">Experiment default: draw an outline around the aperture</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Outline Width (px):</label>
                    <input type="number" class="form-control parameter-input" id="apertureOutlineWidth" value="2" min="0" max="50" step="0.5">
                    <div class="parameter-help">Experiment default outline width (used when outline is enabled)</div>
                </div>
                <div class="parameter-row">
                    <label class="parameter-label">Outline Color:</label>
                    <input type="color" class="form-control parameter-input" id="apertureOutlineColor" value="#FFFFFF">
                    <div class="parameter-help">Experiment default outline color (used when outline is enabled)</div>
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
            ` : ''}

            ${taskSpecificDefaultsHtml}
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

        // Task-specific conditional UI (Gabor response keys)
        this.bindGaborSettingsUI();

        // Task-specific conditional UI (Stroop stimulus set + response mappings)
        this.bindStroopSettingsUI();

        // Task-specific conditional UI (PVT response device + key + feedback)
        this.bindPvtSettingsUI();

        // Rewards toggle (experiment-wide)
        this.bindRewardsToggleUI();
        
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
        const unitName = (this.experimentType === 'continuous') ? 'Frame' : 'Trial';

        const createComponentDefFromSchema = (schemaId, { name, icon, description, category } = {}) => {
            const schema = this.schemaValidator?.pluginSchemas?.[schemaId];
            const params = {};

            const mapType = (t) => {
                const s = (t ?? '').toString();
                if (s === 'BOOL') return 'boolean';
                if (s === 'SELECT') return 'select';
                if (s === 'INT' || s === 'FLOAT') return 'number';
                if (s === 'COLOR') return 'COLOR';
                // HTML_STRING / STRING / IMAGE => edit as string in Builder (IMAGE gets special handling)
                if (s === 'HTML_STRING' || s === 'STRING' || s === 'IMAGE') return 'string';
                return 'string';
            };

            if (schema && schema.parameters && typeof schema.parameters === 'object') {
                for (const [key, def] of Object.entries(schema.parameters)) {
                    if (!def || typeof def !== 'object') continue;
                    const out = { type: mapType(def.type), default: def.default };
                    if (Array.isArray(def.options)) out.options = def.options;
                    if (def.min !== undefined) out.min = def.min;
                    if (def.max !== undefined) out.max = def.max;
                    if (def.step !== undefined) out.step = def.step;
                    params[key] = out;
                }
            }

            return {
                id: schemaId,
                name: name || schema?.name || schemaId,
                icon: icon || 'fas fa-puzzle-piece',
                description: description || schema?.description || '',
                category: category || 'task',
                type: schemaId,
                parameters: params
            };
        };

        const createBlockComponentDef = (currentTaskType) => {
            const blockDisplayName = (currentTaskType === 'rdm')
                ? 'RDM Block'
                : (currentTaskType === 'flanker')
                    ? 'Flanker Block'
                    : (currentTaskType === 'sart')
                        ? 'SART Block'
                        : (currentTaskType === 'simon')
                            ? 'Simon Block'
                        : (currentTaskType === 'gabor')
                            ? 'Gabor Block'
                            : (currentTaskType === 'stroop')
                                ? 'Stroop Block'
                                : 'Block';

            const baseOptions = (currentTaskType === 'flanker')
                ? ['flanker-trial']
                : (currentTaskType === 'sart')
                    ? ['sart-trial']
                    : (currentTaskType === 'simon')
                        ? ['simon-trial']
                    : (currentTaskType === 'gabor')
                        ? ['gabor-trial', 'gabor-quest']
                        : (currentTaskType === 'stroop')
                            ? ['stroop-trial']
                        : ['rdm-trial', 'rdm-practice', 'rdm-adaptive', 'rdm-dot-groups'];

            const defaultType = baseOptions[0] || 'rdm-trial';

            const defaultBlockLength = this.getExperimentWideBlockLengthDefault();

            const commonParams = {
                block_component_type: { type: 'select', default: defaultType, options: baseOptions },
                block_length: { type: 'number', default: defaultBlockLength, min: 1, max: 50000 },
                sampling_mode: { type: 'select', default: 'per-trial', options: ['per-trial', 'per-block'] },
                seed: { type: 'string', default: '' },
                detection_response_task_enabled: { type: 'boolean', default: false }
            };

            const flankerStimulusTypeDefault = (() => {
                const el = document.getElementById('flankerStimulusType');
                const v = (el && typeof el.value === 'string') ? el.value : null;
                const s = (v ?? 'arrows').toString().trim();
                return s || 'arrows';
            })();

            const flankerOnlyParams = {
                flanker_stimulus_type: { type: 'select', default: flankerStimulusTypeDefault, options: ['arrows', 'letters', 'symbols', 'custom'] },
                flanker_target_stimulus_options: { type: 'string', default: 'H' },
                flanker_distractor_stimulus_options: { type: 'string', default: 'S' },
                flanker_neutral_stimulus_options: { type: 'string', default: '–' },
                flanker_left_key: { type: 'string', default: 'f' },
                flanker_right_key: { type: 'string', default: 'j' },
                flanker_show_fixation_dot: { type: 'boolean', default: false },
                flanker_show_fixation_cross_between_trials: { type: 'boolean', default: false },
                flanker_congruency_options: { type: 'string', default: 'congruent,incongruent' },
                flanker_target_direction_options: { type: 'string', default: 'left,right' },
                flanker_stimulus_duration_min: { type: 'number', default: 200, min: 0, max: 10000 },
                flanker_stimulus_duration_max: { type: 'number', default: 800, min: 0, max: 10000 },
                flanker_trial_duration_min: { type: 'number', default: 1000, min: 0, max: 60000 },
                flanker_trial_duration_max: { type: 'number', default: 2000, min: 0, max: 60000 },
                flanker_iti_min: { type: 'number', default: 200, min: 0, max: 10000 },
                flanker_iti_max: { type: 'number', default: 800, min: 0, max: 10000 }
            };

            const sartOnlyParams = {
                sart_digit_options: { type: 'string', default: '1,2,3,4,5,6,7,8,9' },
                sart_nogo_digit: { type: 'number', default: 3, min: 0, max: 9 },
                sart_go_key: { type: 'string', default: 'space' },
                sart_stimulus_duration_min: { type: 'number', default: 150, min: 0, max: 10000 },
                sart_stimulus_duration_max: { type: 'number', default: 400, min: 0, max: 10000 },
                sart_mask_duration_min: { type: 'number', default: 600, min: 0, max: 10000 },
                sart_mask_duration_max: { type: 'number', default: 1200, min: 0, max: 10000 },
                sart_trial_duration_min: { type: 'number', default: 800, min: 0, max: 60000 },
                sart_trial_duration_max: { type: 'number', default: 2000, min: 0, max: 60000 },
                sart_iti_min: { type: 'number', default: 200, min: 0, max: 10000 },
                sart_iti_max: { type: 'number', default: 800, min: 0, max: 10000 }
            };

            const gaborOnlyParams = {
                // Gabor task-wide settings (copyable to blocks so multiple blocks can co-exist)
                gabor_response_task: { type: 'select', default: 'discriminate_tilt', options: ['detect_target', 'discriminate_tilt'] },
                gabor_left_key: { type: 'string', default: 'f' },
                gabor_right_key: { type: 'string', default: 'j' },
                gabor_yes_key: { type: 'string', default: 'f' },
                gabor_no_key: { type: 'string', default: 'j' },

                gabor_target_location_options: { type: 'string', default: 'left,right' },
                gabor_target_tilt_options: { type: 'string', default: '-45,45' },
                gabor_distractor_orientation_options: { type: 'string', default: '0,90' },
                gabor_spatial_cue_enabled: { type: 'boolean', default: true },
                gabor_spatial_cue_options: { type: 'string', default: 'none,left,right,both' },
                gabor_spatial_cue_probability: { type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
                gabor_value_cue_enabled: { type: 'boolean', default: true },
                gabor_left_value_options: { type: 'string', default: 'neutral,high,low' },
                gabor_right_value_options: { type: 'string', default: 'neutral,high,low' },
                gabor_value_cue_probability: { type: 'number', default: 1, min: 0, max: 1, step: 0.01 },

                gabor_spatial_frequency_min: { type: 'number', default: 0.06, min: 0.001, max: 0.5, step: 0.001 },
                gabor_spatial_frequency_max: { type: 'number', default: 0.06, min: 0.001, max: 0.5, step: 0.001 },
                gabor_grating_waveform_options: { type: 'string', default: 'sinusoidal' },

                gabor_patch_diameter_deg_min: { type: 'number', default: 6, min: 0.1, max: 60, step: 0.1 },
                gabor_patch_diameter_deg_max: { type: 'number', default: 6, min: 0.1, max: 60, step: 0.1 },

                gabor_patch_border_enabled: { type: 'boolean', default: true },
                gabor_patch_border_width_px: { type: 'number', default: 2, min: 0, max: 50, step: 1 },
                gabor_patch_border_color: { type: 'COLOR', default: '#ffffff' },
                gabor_patch_border_opacity: { type: 'number', default: 0.22, min: 0, max: 1, step: 0.01 },

                // Optional adaptive staircase per-block (stored in exported block.parameter_values.adaptive)
                gabor_adaptive_mode: { type: 'select', default: 'none', options: ['none', 'quest'] },
                gabor_quest_parameter: { type: 'select', default: 'target_tilt_deg', options: ['target_tilt_deg', 'spatial_frequency_cyc_per_px'] },
                gabor_quest_target_performance: { type: 'number', default: 0.82, min: 0.5, max: 0.99, step: 0.01 },
                gabor_quest_start_value: { type: 'number', default: 45, step: 0.1 },
                gabor_quest_start_sd: { type: 'number', default: 20, min: 0.001, step: 0.1 },
                gabor_quest_beta: { type: 'number', default: 3.5, min: 0.001, step: 0.1 },
                gabor_quest_delta: { type: 'number', default: 0.01, min: 0, step: 0.001 },
                gabor_quest_gamma: { type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
                gabor_quest_min_value: { type: 'number', default: -90, step: 0.1 },
                gabor_quest_max_value: { type: 'number', default: 90, step: 0.1 },
                gabor_stimulus_duration_min: { type: 'number', default: 67, min: 0, max: 10000 },
                gabor_stimulus_duration_max: { type: 'number', default: 67, min: 0, max: 10000 },
                gabor_mask_duration_min: { type: 'number', default: 67, min: 0, max: 10000 },
                gabor_mask_duration_max: { type: 'number', default: 67, min: 0, max: 10000 }
            };

            const stroopOnlyParams = {
                // Library sampling
                stroop_word_options: { type: 'string', default: 'RED,GREEN,BLUE,YELLOW' },
                stroop_ink_color_options: { type: 'string', default: 'RED,GREEN,BLUE,YELLOW' },
                stroop_congruency_options: { type: 'string', default: 'auto,congruent,incongruent' },

                // Response overrides
                stroop_response_mode: { type: 'select', default: 'inherit', options: ['inherit', 'color_naming', 'congruency'] },
                stroop_response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse'] },
                stroop_choice_keys: { type: 'string', default: '' },
                stroop_congruent_key: { type: 'string', default: '' },
                stroop_incongruent_key: { type: 'string', default: '' },

                // Timing windows
                stroop_stimulus_duration_min: { type: 'number', default: 0, min: 0, max: 10000 },
                stroop_stimulus_duration_max: { type: 'number', default: 0, min: 0, max: 10000 },
                stroop_trial_duration_min: { type: 'number', default: 2000, min: 0, max: 60000 },
                stroop_trial_duration_max: { type: 'number', default: 2000, min: 0, max: 60000 },
                stroop_iti_min: { type: 'number', default: 500, min: 0, max: 10000 },
                stroop_iti_max: { type: 'number', default: 500, min: 0, max: 10000 }
            };

            const simonOnlyParams = {
                // Sampling
                simon_color_options: { type: 'string', default: 'BLUE,ORANGE' },
                simon_side_options: { type: 'string', default: 'left,right' },

                // Response overrides
                simon_response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse'] },
                simon_left_key: { type: 'string', default: '' },
                simon_right_key: { type: 'string', default: '' },

                // Timing windows
                simon_stimulus_duration_min: { type: 'number', default: 0, min: 0, max: 10000 },
                simon_stimulus_duration_max: { type: 'number', default: 0, min: 0, max: 10000 },
                simon_trial_duration_min: { type: 'number', default: 1500, min: 0, max: 60000 },
                simon_trial_duration_max: { type: 'number', default: 1500, min: 0, max: 60000 },
                simon_iti_min: { type: 'number', default: 500, min: 0, max: 10000 },
                simon_iti_max: { type: 'number', default: 500, min: 0, max: 10000 }
            };

            const pvtOnlyParams = {
                // Response overrides
                pvt_response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse', 'both'] },
                pvt_response_key: { type: 'string', default: '' },

                // Timing windows
                pvt_foreperiod_min: { type: 'number', default: 2000, min: 0, max: 60000 },
                pvt_foreperiod_max: { type: 'number', default: 10000, min: 0, max: 60000 },
                pvt_trial_duration_min: { type: 'number', default: 10000, min: 0, max: 60000 },
                pvt_trial_duration_max: { type: 'number', default: 10000, min: 0, max: 60000 },
                pvt_iti_min: { type: 'number', default: 0, min: 0, max: 30000 },
                pvt_iti_max: { type: 'number', default: 0, min: 0, max: 30000 }
            };

            // RDM-only params remain in RDM mode; other tasks should not inherit the RDM UI surface.
            const rdmOnlyParams = {
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
            };

            const perTaskParams = (currentTaskType === 'flanker')
                ? flankerOnlyParams
                : (currentTaskType === 'sart')
                    ? sartOnlyParams
                    : (currentTaskType === 'simon')
                        ? simonOnlyParams
                    : (currentTaskType === 'pvt')
                        ? pvtOnlyParams
                    : (currentTaskType === 'gabor')
                        ? gaborOnlyParams
                        : (currentTaskType === 'stroop')
                            ? stroopOnlyParams
                        : rdmOnlyParams;

            return {
                id: 'block',
                name: blockDisplayName,
                icon: 'fas fa-layer-group',
                description: 'Compactly represent many generated trials using parameter windows (ranges)',
                category: 'advanced',
                parameters: {
                    ...commonParams,
                    ...perTaskParams
                }
            };
        };
        
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
                    auto_generated: true,
                    stimulus: 'Welcome to the experiment.\n\nPlease read the instructions carefully and press any key to continue.',
                    choices: 'ALL_KEYS',
                    prompt: '',
                    stimulus_duration: null,
                    trial_duration: null,
                    response_ends_trial: true
                }
            },
            {
                id: 'survey-response',
                name: 'Survey Response',
                icon: 'fas fa-clipboard-list',
                description: 'Collect questionnaire/survey responses in a single form',
                category: 'survey',
                type: 'survey-response',
                parameters: {
                    title: { type: 'string', default: 'Survey' },
                    instructions: { type: 'string', default: 'Please answer the following questions.' },
                    submit_label: { type: 'string', default: 'Continue' },
                    // Optional timeout behavior: allow continuing without responses after timeout_ms
                    allow_empty_on_timeout: { type: 'boolean', default: false },
                    timeout_ms: { type: 'number', default: null, min: 0, max: 600000 },
                    questions: {
                        type: 'COMPLEX',
                        default: [
                            {
                                id: 'q1',
                                type: 'likert',
                                prompt: 'I found the task engaging.',
                                options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
                                required: true
                            }
                        ]
                    }
                }
            },
            {
                id: 'visual-angle-calibration',
                name: 'Visual Angle Calibration',
                icon: 'fas fa-ruler-combined',
                description: 'Calibrate screen px/cm and compute px/deg (ID/credit card on screen + distance choice; optional webcam preview)',
                category: 'setup',
                type: 'visual-angle-calibration',
                parameters: {
                    title: { type: 'string', default: 'Visual Angle Calibration' },
                    instructions: { type: 'string', default: 'Place an ID/credit card flat against the screen and match the on-screen bar. Then estimate your viewing distance.' },

                    object_preset: { type: 'select', default: 'id_card_long', options: ['id_card_long', 'id_card_short', 'custom'] },
                    object_length_cm: { type: 'number', default: 8.56, min: 0.1, max: 100, step: 0.001 },

                    distance_mode: { type: 'select', default: 'posture_choice', options: ['posture_choice', 'manual'] },

                    close_label: { type: 'string', default: 'Close' },
                    close_distance_cm: { type: 'number', default: 35, min: 1, max: 200, step: 0.1 },
                    normal_label: { type: 'string', default: 'Normal' },
                    normal_distance_cm: { type: 'number', default: 50, min: 1, max: 200, step: 0.1 },
                    far_label: { type: 'string', default: 'Far' },
                    far_distance_cm: { type: 'number', default: 65, min: 1, max: 200, step: 0.1 },

                    manual_distance_default_cm: { type: 'number', default: 50, min: 1, max: 200, step: 0.1 },

                    webcam_enabled: { type: 'boolean', default: false },
                    webcam_facing_mode: { type: 'select', default: 'user', options: ['user', 'environment'] },

                    store_key: { type: 'string', default: '__psy_visual_angle' }
                }
            },
            {
                id: 'reward-settings',
                name: 'Reward Settings',
                icon: 'fas fa-coins',
                description: 'Define reward policy (RT/accuracy/both), thresholds, and optional end-of-experiment summary screen',
                category: 'setup',
                type: 'reward-settings',
                parameters: {
                    store_key: { type: 'string', default: '__psy_rewards' },
                    currency_label: { type: 'string', default: 'points' },

                    scoring_basis: { type: 'select', default: 'both', options: ['accuracy', 'reaction_time', 'both'] },
                    rt_threshold_ms: { type: 'number', default: 600, min: 0, max: 60000, step: 1 },
                    points_per_success: { type: 'number', default: 1, min: 0, max: 1000, step: 0.1 },
                    require_correct_for_rt: { type: 'boolean', default: false },

                    calculate_on_the_fly: { type: 'boolean', default: true },
                    show_summary_at_end: { type: 'boolean', default: true },
                    continue_key: { type: 'select', default: 'space', options: ['space', 'enter', 'ALL_KEYS'] },

                    instructions_title: { type: 'string', default: 'Rewards' },
                    instructions_template_html: {
                        type: 'string',
                        default: '<p>You can earn <b>{{currency_label}}</b> during this study.</p>\n<ul>\n<li><b>Basis</b>: {{scoring_basis_label}}</li>\n<li><b>RT threshold</b>: {{rt_threshold_ms}} ms</li>\n<li><b>Points per success</b>: {{points_per_success}}</li>\n</ul>\n<p>Press {{continue_key_label}} to begin.</p>'
                    },

                    summary_title: { type: 'string', default: 'Rewards Summary' },
                    summary_template_html: {
                        type: 'string',
                        default: '<p><b>Total earned</b>: {{total_points}} {{currency_label}}</p>\n<p><b>Rewarded trials</b>: {{rewarded_trials}} / {{eligible_trials}}</p>\n<p>Press {{continue_key_label}} to finish.</p>'
                    }
                }
            }
        ];

        // SOC Dashboard (continuous-only): add the SOC session + helper components.
        if (taskType === 'soc-dashboard') {
            baseComponents.push(
                createComponentDefFromSchema('soc-dashboard', {
                    name: `SOC Dashboard Session`,
                    icon: 'fas fa-desktop',
                    description: 'Windows-like SOC session shell (subtasks and icons are composed into this on export)',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-dashboard-icon', {
                    name: 'SOC Desktop Icon',
                    icon: 'fas fa-icons',
                    description: 'Builder-only: desktop icon composed into the SOC session at export',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-subtask-sart-like', {
                    name: 'SOC Subtask: SART-like',
                    icon: 'fas fa-list-check',
                    description: 'Builder-only: subtask window composed into the SOC session at export',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-subtask-nback-like', {
                    name: 'SOC Subtask: N-back-like',
                    icon: 'fas fa-repeat',
                    description: 'Builder-only: subtask window composed into the SOC session at export',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-subtask-flanker-like', {
                    name: 'SOC Subtask: Flanker-like',
                    icon: 'fas fa-arrows-left-right',
                    description: 'Builder-only: subtask window composed into the SOC session at export',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-subtask-wcst-like', {
                    name: 'SOC Subtask: WCST-like',
                    icon: 'fas fa-shapes',
                    description: 'Builder-only: subtask window composed into the SOC session at export',
                    category: 'task'
                }),
                createComponentDefFromSchema('soc-subtask-pvt-like', {
                    name: 'SOC Subtask: PVT-like',
                    icon: 'fas fa-bell',
                    description: 'Builder-only: scrolling logs with alert countdown + red flash; composed into the SOC session at export',
                    category: 'task'
                })
            );

            // Keep generic stimulus components available while authoring SOC timelines.
            baseComponents.push(
                {
                    id: 'html-keyboard-response',
                    name: 'HTML + Keyboard',
                    icon: 'fas fa-keyboard',
                    description: 'Show HTML content and collect keyboard response',
                    category: 'basic',
                    parameters: {
                        stimulus: { type: 'string', default: '<p>Press a key to continue.</p>' },
                        choices: { type: 'select', default: 'ALL_KEYS', options: ['ALL_KEYS', 'space', 'enter', 'escape'] },
                        prompt: { type: 'string', default: '' },
                        stimulus_duration: { type: 'number', default: null, min: 0, max: 30000 },
                        trial_duration: { type: 'number', default: null, min: 0, max: 60000 },
                        response_ends_trial: { type: 'boolean', default: true }
                    }
                },
                {
                    id: 'image-keyboard-response',
                    name: 'Image + Keyboard',
                    icon: 'fas fa-image',
                    description: 'Show image and collect keyboard response',
                    category: 'stimulus',
                    parameters: {
                        stimulus: { type: 'string', default: 'img/sitting.png' },
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

            // Data-collection components (same behavior as other tasks)
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

            return baseComponents;
        }

        // For Flanker/SART/Simon/PVT/Gabor/Stroop, show only task-appropriate components.
        if (taskType === 'flanker' || taskType === 'sart' || taskType === 'simon' || taskType === 'pvt' || taskType === 'gabor' || taskType === 'stroop') {
            if (taskType === 'flanker') {
                baseComponents.push({
                    id: 'flanker-trial',
                    name: `Flanker ${unitName}`,
                    icon: 'fas fa-arrows-alt-h',
                    description: 'Flanker trial/frame (interpreter implements stimulus + scoring)',
                    category: 'task',
                    parameters: {
                        target_direction: { type: 'select', default: 'left', options: ['left', 'right'] },
                        congruency: { type: 'select', default: 'congruent', options: ['congruent', 'incongruent', 'neutral'] },
                        left_key: { type: 'string', default: 'f' },
                        right_key: { type: 'string', default: 'j' },
                        stimulus_duration_ms: { type: 'number', default: 800, min: 0, max: 10000 },
                        trial_duration_ms: { type: 'number', default: 1500, min: 0, max: 30000 },
                        iti_ms: { type: 'number', default: 500, min: 0, max: 10000 }
                    }
                });
            }

            if (taskType === 'sart') {
                baseComponents.push({
                    id: 'sart-trial',
                    name: `SART ${unitName}`,
                    icon: 'fas fa-stopwatch',
                    description: 'SART trial/frame (interpreter implements go/no-go logic)',
                    category: 'task',
                    parameters: {
                        stimulus_type: { type: 'select', default: 'arrows', options: ['arrows', 'letters', 'symbols', 'custom'] },
                        digit: { type: 'number', default: 1, min: 0, max: 9 },
                        target_stimulus: { type: 'string', default: 'H' },
                        distractor_stimulus: { type: 'string', default: 'S' },
                        neutral_stimulus: { type: 'string', default: '–' },
                        nogo_digit: { type: 'number', default: 3, min: 0, max: 9 },
                        show_fixation_dot: { type: 'boolean', default: false },
                        show_fixation_cross_between_trials: { type: 'boolean', default: false },
                        go_key: { type: 'string', default: 'space' },
                        stimulus_duration_ms: { type: 'number', default: 250, min: 0, max: 10000 },
                        mask_duration_ms: { type: 'number', default: 900, min: 0, max: 10000 },
                        trial_duration_ms: { type: 'number', default: 1150, min: 0, max: 30000 },
                        iti_ms: { type: 'number', default: 0, min: 0, max: 10000 }
                    }
                });
            }

            if (taskType === 'simon') {
                baseComponents.push({
                    id: 'simon-trial',
                    name: `Simon ${unitName}`,
                    icon: 'fas fa-circle-dot',
                    description: 'Simon trial/frame (two circles; respond by mapped color side; interpreter implements stimulus + scoring)',
                    category: 'task',
                    parameters: {
                        stimulus_side: { type: 'select', default: 'left', options: ['left', 'right'] },
                        stimulus_color_name: { type: 'string', default: 'BLUE' },

                        response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse'] },
                        left_key: { type: 'string', default: 'f' },
                        right_key: { type: 'string', default: 'j' },

                        circle_diameter_px: { type: 'number', default: 140, min: 40, max: 400 },

                        stimulus_duration_ms: { type: 'number', default: 0, min: 0, max: 10000 },
                        trial_duration_ms: { type: 'number', default: 1500, min: 0, max: 30000 },
                        iti_ms: { type: 'number', default: 500, min: 0, max: 10000 }
                    }
                });
            }

            if (taskType === 'pvt') {
                baseComponents.push({
                    id: 'pvt-trial',
                    name: `PVT ${unitName}`,
                    icon: 'fas fa-stopwatch',
                    description: 'Psychomotor Vigilance Task trial (variable foreperiod; running 4-digit timer; keyboard/click response)',
                    category: 'task',
                    parameters: {
                        response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse', 'both'] },
                        response_key: { type: 'string', default: 'space' },

                        foreperiod_ms: { type: 'number', default: 4000, min: 0, max: 60000 },
                        trial_duration_ms: { type: 'number', default: 10000, min: 0, max: 60000 },
                        iti_ms: { type: 'number', default: 0, min: 0, max: 30000 }
                    }
                });
            }

            if (taskType === 'gabor') {
                baseComponents.push({
                    id: 'gabor-trial',
                    name: `Gabor ${unitName}`,
                    icon: 'fas fa-wave-square',
                    description: 'Gabor patch trial/frame (interpreter implements stimulus + scoring)',
                    category: 'task',
                    parameters: {
                        response_task: { type: 'select', default: 'discriminate_tilt', options: ['detect_target', 'discriminate_tilt'] },
                        left_key: { type: 'string', default: 'f' },
                        right_key: { type: 'string', default: 'j' },
                        yes_key: { type: 'string', default: 'f' },
                        no_key: { type: 'string', default: 'j' },

                        target_location: { type: 'select', default: 'left', options: ['left', 'right'] },
                        target_tilt_deg: { type: 'number', default: 45, min: -90, max: 90 },
                        distractor_orientation_deg: { type: 'number', default: 0, min: 0, max: 179 },

                        spatial_frequency_cyc_per_px: { type: 'number', default: 0.06, min: 0.001, max: 0.5, step: 0.001 },
                        grating_waveform: { type: 'select', default: 'sinusoidal', options: ['sinusoidal', 'square', 'triangle'] },

                        patch_diameter_deg: { type: 'number', default: 6, min: 0.1, max: 60, step: 0.1 },

                        spatial_cue: { type: 'select', default: 'none', options: ['none', 'left', 'right', 'both'] },
                        left_value: { type: 'select', default: 'neutral', options: ['neutral', 'high', 'low'] },
                        right_value: { type: 'select', default: 'neutral', options: ['neutral', 'high', 'low'] },

                        stimulus_duration_ms: { type: 'number', default: 67, min: 0, max: 10000 },
                        mask_duration_ms: { type: 'number', default: 67, min: 0, max: 10000 },

                        patch_border_enabled: { type: 'boolean', default: true },
                        patch_border_width_px: { type: 'number', default: 2, min: 0, max: 50, step: 1 },
                        patch_border_color: { type: 'COLOR', default: '#ffffff' },
                        patch_border_opacity: { type: 'number', default: 0.22, min: 0, max: 1, step: 0.01 },

                        detection_response_task_enabled: { type: 'boolean', default: false }
                    }
                });
            }

            if (taskType === 'stroop') {
                baseComponents.push({
                    id: 'stroop-trial',
                    name: `Stroop ${unitName}`,
                    icon: 'fas fa-font',
                    description: 'Stroop trial/frame (word shown in ink color; interpreter implements stimulus + scoring)',
                    category: 'task',
                    parameters: {
                        word: { type: 'string', default: 'RED' },
                        ink_color_name: { type: 'string', default: 'BLUE' },
                        congruency: { type: 'select', default: 'auto', options: ['auto', 'congruent', 'incongruent'] },

                        response_mode: { type: 'select', default: 'inherit', options: ['inherit', 'color_naming', 'congruency'] },
                        response_device: { type: 'select', default: 'inherit', options: ['inherit', 'keyboard', 'mouse'] },

                        // Key mappings (can be overridden per-trial; defaults can be applied from the Stroop defaults panel).
                        choice_keys: { type: 'array', default: ['1', '2', '3', '4'] },
                        congruent_key: { type: 'string', default: 'f' },
                        incongruent_key: { type: 'string', default: 'j' },

                        stimulus_font_size_px: { type: 'number', default: 64, min: 12, max: 200 },
                        stimulus_duration_ms: { type: 'number', default: 0, min: 0, max: 10000 },
                        trial_duration_ms: { type: 'number', default: 2000, min: 0, max: 30000 },
                        iti_ms: { type: 'number', default: 500, min: 0, max: 10000 }
                    }
                });
            }

            // HTML-based components
            baseComponents.push(
                {
                    id: 'html-keyboard-response',
                    name: 'HTML + Keyboard',
                    icon: 'fas fa-keyboard',
                    description: 'Show HTML content and collect keyboard response',
                    category: 'basic',
                    parameters: {
                        stimulus: { type: 'string', default: '<p>Press a key to continue.</p>' },
                        choices: { type: 'select', default: 'ALL_KEYS', options: ['ALL_KEYS', 'space', 'enter', 'escape'] },
                        prompt: { type: 'string', default: '' },
                        stimulus_duration: { type: 'number', default: null, min: 0, max: 30000 },
                        trial_duration: { type: 'number', default: null, min: 0, max: 60000 },
                        response_ends_trial: { type: 'boolean', default: true }
                    }
                },
                {
                    id: 'image-keyboard-response',
                    name: 'Image + Keyboard',
                    icon: 'fas fa-image',
                    description: 'Show image and collect keyboard response',
                    category: 'stimulus',
                    parameters: {
                        stimulus: { type: 'string', default: 'img/sitting.png' },
                        choices: { type: 'array', default: ['f', 'j'] },
                        stimulus_duration: { type: 'number', default: null },
                        trial_duration: { type: 'number', default: null }
                    }
                }
            );

            // Block (task-scoped)
            baseComponents.push(createBlockComponentDef(taskType));

            // Add specialized components based on data collection settings
            // (these are task-agnostic and should be available for all tasks).
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

                // Optional preface instructions researchers can place *before* calibration.
                baseComponents.push({
                    id: 'eye-tracking-calibration-instructions',
                    name: 'Calibration Instructions',
                    icon: 'fas fa-eye',
                    description: 'Preface screen shown before the eye-tracking calibration dots',
                    category: 'tracking',
                    type: 'html-keyboard-response',
                    parameters: {
                        stimulus: {
                            type: 'string',
                            default: 'Eye tracking calibration\n\nWe will briefly calibrate the camera-based eye tracking.\n\nPlease sit comfortably, keep your head still, and look at each dot as it appears.\nPress SPACE while looking at each dot.\n\nPress any key to begin.'
                        },
                        choices: { type: 'select', default: 'ALL_KEYS', options: ['ALL_KEYS', 'space', 'enter', 'escape'] },
                        prompt: { type: 'string', default: '' },
                        stimulus_duration: { type: 'number', default: null, min: 0, max: 30000 },
                        trial_duration: { type: 'number', default: null, min: 0, max: 60000 },
                        response_ends_trial: { type: 'boolean', default: true }
                    },
                    data: {
                        type: 'html-keyboard-response',
                        stimulus: 'Eye tracking calibration\n\nWe will briefly calibrate the camera-based eye tracking.\n\nPlease sit comfortably, keep your head still, and look at each dot as it appears.\nPress SPACE while looking at each dot.\n\nPress any key to begin.',
                        choices: 'ALL_KEYS',
                        prompt: '',
                        stimulus_duration: null,
                        trial_duration: null,
                        response_ends_trial: true,
                        data: { plugin_type: 'eye-tracking-calibration-instructions' }
                    }
                });
            }

            return baseComponents;
        }

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

            // Add one canonical, task-scoped Block definition.
            baseComponents.push(createBlockComponentDef('rdm'));
        }

        // Add generic stimulus components (RDM mode)
        baseComponents.push(
            {
                id: 'image-keyboard-response',
                name: 'Image + Keyboard',
                icon: 'fas fa-image',
                description: 'Show image and collect keyboard response',
                category: 'stimulus',
                parameters: {
                    stimulus: { type: 'string', default: 'img/sitting.png' },
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

            // Optional preface instructions researchers can place *before* calibration.
            baseComponents.push({
                id: 'eye-tracking-calibration-instructions',
                name: 'Calibration Instructions',
                icon: 'fas fa-eye',
                description: 'Preface screen shown before the eye-tracking calibration dots',
                category: 'tracking',
                type: 'html-keyboard-response',
                parameters: {
                    stimulus: {
                        type: 'string',
                        default: 'Eye tracking calibration\n\nWe will briefly calibrate the camera-based eye tracking.\n\nPlease sit comfortably, keep your head still, and look at each dot as it appears.\nPress SPACE while looking at each dot.\n\nPress any key to begin.'
                    },
                    choices: { type: 'select', default: 'ALL_KEYS', options: ['ALL_KEYS', 'space', 'enter', 'escape'] },
                    prompt: { type: 'string', default: '' },
                    stimulus_duration: { type: 'number', default: null, min: 0, max: 30000 },
                    trial_duration: { type: 'number', default: null, min: 0, max: 60000 },
                    response_ends_trial: { type: 'boolean', default: true }
                },
                data: {
                    type: 'html-keyboard-response',
                    stimulus: 'Eye tracking calibration\n\nWe will briefly calibrate the camera-based eye tracking.\n\nPlease sit comfortably, keep your head still, and look at each dot as it appears.\nPress SPACE while looking at each dot.\n\nPress any key to begin.',
                    choices: 'ALL_KEYS',
                    prompt: '',
                    stimulus_duration: null,
                    trial_duration: null,
                    response_ends_trial: true,
                    data: { plugin_type: 'eye-tracking-calibration-instructions' }
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
        
        // For html-keyboard-response instructions-like components, use simple data format like the Figma prototype.
        if (componentDef.id === 'instructions' || componentDef.id === 'eye-tracking-calibration-instructions') {
            // Hide empty state if visible
            const emptyState = timelineContainer.querySelector('.empty-timeline');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            const instructionsComponent = document.createElement('div');
            instructionsComponent.className = 'timeline-component card mb-2';
            instructionsComponent.dataset.componentType = 'html-keyboard-response';
            // Preserve the builder-specific identity even though the exported jsPsych type is html-keyboard-response.
            // This lets the UI distinguish calibration preface vs generic instructions reliably.
            instructionsComponent.dataset.builderComponentId = componentDef.id;
            // Ensure detection-response-task flag exists for traceability
            const instructionsData = {
                ...(componentDef.data || {}),
                // Default Instructions cards should follow the auto-generated template until a human edits them.
                // Calibration preface instructions should not be auto-templated.
                auto_generated: componentDef.id === 'instructions'
                    ? !!(componentDef.data?.auto_generated ?? true)
                    : false,
                detection_response_task_enabled: !!(componentDef.data?.detection_response_task_enabled ?? false)
            };
            instructionsComponent.dataset.componentData = JSON.stringify(instructionsData);

            const title = (componentDef.id === 'eye-tracking-calibration-instructions')
                ? 'Calibration Instructions'
                : 'Instructions';
            const subtitle = (componentDef.id === 'eye-tracking-calibration-instructions')
                ? 'Preface shown before eye-tracking calibration'
                : 'Welcome screen with task instructions';
            const iconHtml = (componentDef.id === 'eye-tracking-calibration-instructions')
                ? '<i class="fas fa-eye text-info"></i>'
                : '<i class="fas fa-info-circle text-info"></i>';
            
            instructionsComponent.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="drag-handle me-2" style="cursor: move; color: #ccc;">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div>
                                <h6 class="card-title mb-1">
                                    ${iconHtml} ${title}
                                </h6>
                                <small class="text-muted">${subtitle}</small>
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

            // Apply task-level defaults to new components (so the settings panel actually matters).
            if (componentDef.id === 'flanker-trial') {
                Object.assign(componentData, this.getFlankerDefaultsForNewComponent());
            }

            if (componentDef.id === 'stroop-trial') {
                Object.assign(componentData, this.getStroopDefaultsForNewComponent());
            }

            if (componentDef.id === 'simon-trial') {
                Object.assign(componentData, this.getSimonDefaultsForNewComponent());
            }

            if (componentDef.id === 'pvt-trial') {
                Object.assign(componentData, this.getPvtDefaultsForNewComponent());
            }

            if (componentDef.id === 'gabor-trial') {
                Object.assign(componentData, this.getGaborDefaultsForNewComponent());
            }

            if (componentDef.id === 'soc-dashboard') {
                Object.assign(componentData, this.getSocDashboardDefaultsForNewComponent());
            }

            if (componentDef.id === 'block') {
                const currentTaskType = document.getElementById('taskType')?.value || 'rdm';
                if (currentTaskType === 'gabor') {
                    Object.assign(componentData, this.getGaborDefaultsForNewBlock());
                }
                if (currentTaskType === 'stroop') {
                    Object.assign(componentData, this.getStroopDefaultsForNewBlock());
                }
                if (currentTaskType === 'simon') {
                    Object.assign(componentData, this.getSimonDefaultsForNewBlock());
                }
                if (currentTaskType === 'pvt') {
                    Object.assign(componentData, this.getPvtDefaultsForNewBlock());
                }
            }

            // Ensure detection-response-task flag exists for traceability
            if (componentData.detection_response_task_enabled === undefined) {
                componentData.detection_response_task_enabled = false;
            }
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
            try {
                if (window.PsychJsonAssetCache && typeof window.PsychJsonAssetCache.clearAll === 'function') {
                    window.PsychJsonAssetCache.clearAll();
                }
            } catch {
                // ignore
            }
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
        const taskType = document.getElementById('taskType')?.value || 'rdm';
        const theme = (document.getElementById('experimentTheme')?.value || 'dark').toString();
        const rewardsEnabled = !!document.getElementById('rewardsEnabled')?.checked;
        const config = {
            experiment_type: this.experimentType,
            task_type: taskType,
            data_collection: { ...this.dataCollection },
            ui_settings: {
                theme: (theme === 'light') ? 'light' : 'dark'
            },
            reward_settings: {
                enabled: rewardsEnabled
            },
            timeline: this.getTimelineFromDOM()
        };

        // Add task-specific defaults
        if (taskType === 'rdm') {
            config.display_parameters = this.getRDMDisplayParameters();
            config.aperture_parameters = this.getRDMApertureParameters();
            config.dot_parameters = this.getRDMDotParameters();
            config.motion_parameters = this.getRDMMotionParameters();
            config.timing_parameters = this.getRDMTimingParameters();
            config.response_parameters = this.getRDMResponseParameters();
        }

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

        // Export task-specific experiment-wide settings
        if (taskType === 'rdm') {
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
        }

        if (taskType === 'flanker') {
            const leftKey = document.getElementById('flankerLeftKey')?.value;
            const rightKey = document.getElementById('flankerRightKey')?.value;
            const stimulusDuration = document.getElementById('flankerStimulusDurationMs')?.value;
            const trialDuration = document.getElementById('flankerTrialDurationMs')?.value;
            const itiMs = document.getElementById('flankerItiMs')?.value;

            config.flanker_settings = {
                left_key: leftKey || 'f',
                right_key: rightKey || 'j',
                stimulus_type: document.getElementById('flankerStimulusType')?.value || 'arrows',
                target_stimulus: document.getElementById('flankerTargetStimulus')?.value || 'H',
                distractor_stimulus: document.getElementById('flankerDistractorStimulus')?.value || 'S',
                neutral_stimulus: document.getElementById('flankerNeutralStimulus')?.value || '–',
                show_fixation_dot: !!document.getElementById('flankerShowFixationDot')?.checked,
                show_fixation_cross_between_trials: !!document.getElementById('flankerShowFixationCrossBetweenTrials')?.checked,
                stimulus_duration_ms: stimulusDuration ? parseInt(stimulusDuration) : 800,
                trial_duration_ms: trialDuration ? parseInt(trialDuration) : 1500,
                iti_ms: itiMs ? parseInt(itiMs) : 500
            };
        }

        if (taskType === 'sart') {
            const goKey = document.getElementById('sartGoKey')?.value;
            const nogoDigit = document.getElementById('sartNoGoDigit')?.value;
            const stimulusDuration = document.getElementById('sartStimulusDurationMs')?.value;
            const maskDuration = document.getElementById('sartMaskDurationMs')?.value;
            const itiMs = document.getElementById('sartItiMs')?.value;

            config.sart_settings = {
                go_key: goKey || 'space',
                nogo_digit: nogoDigit !== undefined && nogoDigit !== null && `${nogoDigit}` !== '' ? parseInt(nogoDigit) : 3,
                stimulus_duration_ms: stimulusDuration ? parseInt(stimulusDuration) : 250,
                mask_duration_ms: maskDuration ? parseInt(maskDuration) : 900,
                iti_ms: itiMs ? parseInt(itiMs) : 0
            };
        }

        if (taskType === 'gabor') {
            const parseStringList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            };

            const responseTask = document.getElementById('gaborResponseTask')?.value || 'discriminate_tilt';
            const leftKey = document.getElementById('gaborLeftKey')?.value || 'f';
            const rightKey = document.getElementById('gaborRightKey')?.value || 'j';
            const yesKey = document.getElementById('gaborYesKey')?.value || 'f';
            const noKey = document.getElementById('gaborNoKey')?.value || 'j';

            const highValueColor = document.getElementById('gaborHighValueColor')?.value || '#00aa00';
            const lowValueColor = document.getElementById('gaborLowValueColor')?.value || '#0066ff';

            const spatialCueValidityRaw = document.getElementById('gaborSpatialCueValidity')?.value;
            const spatialCueValidity = (spatialCueValidityRaw !== undefined && spatialCueValidityRaw !== null && `${spatialCueValidityRaw}` !== '')
                ? parseFloat(spatialCueValidityRaw)
                : 0.8;

            const spatialCueEnabled = !!document.getElementById('gaborSpatialCueEnabled')?.checked;
            const spatialCueOptions = parseStringList(document.getElementById('gaborSpatialCueOptions')?.value || 'none,left,right,both');
            const spatialCueProbRaw = document.getElementById('gaborSpatialCueProbability')?.value;
            const spatialCueProb = (spatialCueProbRaw !== undefined && spatialCueProbRaw !== null && `${spatialCueProbRaw}` !== '')
                ? parseFloat(spatialCueProbRaw)
                : 1;

            const valueCueEnabled = !!document.getElementById('gaborValueCueEnabled')?.checked;
            const leftValueOptions = parseStringList(document.getElementById('gaborLeftValueOptions')?.value || 'neutral,high,low');
            const rightValueOptions = parseStringList(document.getElementById('gaborRightValueOptions')?.value || 'neutral,high,low');
            const valueCueProbRaw = document.getElementById('gaborValueCueProbability')?.value;
            const valueCueProb = (valueCueProbRaw !== undefined && valueCueProbRaw !== null && `${valueCueProbRaw}` !== '')
                ? parseFloat(valueCueProbRaw)
                : 1;

            const fixationMsRaw = document.getElementById('gaborFixationMs')?.value;
            const placeholdersMsRaw = document.getElementById('gaborPlaceholdersMs')?.value;
            const cueMsRaw = document.getElementById('gaborCueMs')?.value;
            const cueDelayMinRaw = document.getElementById('gaborCueDelayMinMs')?.value;
            const cueDelayMaxRaw = document.getElementById('gaborCueDelayMaxMs')?.value;
            const stimMsRaw = document.getElementById('gaborStimulusDurationMs')?.value;
            const maskMsRaw = document.getElementById('gaborMaskDurationMs')?.value;

            const spatialFreqRaw = document.getElementById('gaborSpatialFrequency')?.value;
            const spatialFreq = (spatialFreqRaw !== undefined && spatialFreqRaw !== null && `${spatialFreqRaw}` !== '')
                ? parseFloat(spatialFreqRaw)
                : 0.06;
            const waveform = (document.getElementById('gaborGratingWaveform')?.value || 'sinusoidal').toString();

            const patchDiameterDegRaw = document.getElementById('gaborPatchDiameterDeg')?.value;
            const patchDiameterDeg = (patchDiameterDegRaw !== undefined && patchDiameterDegRaw !== null && `${patchDiameterDegRaw}` !== '')
                ? parseFloat(patchDiameterDegRaw)
                : 6;

            const patchBorderEnabled = !!document.getElementById('gaborPatchBorderEnabled')?.checked;
            const patchBorderWidthRaw = document.getElementById('gaborPatchBorderWidthPx')?.value;
            const patchBorderWidth = (patchBorderWidthRaw !== undefined && patchBorderWidthRaw !== null && `${patchBorderWidthRaw}` !== '')
                ? Number.parseInt(patchBorderWidthRaw, 10)
                : 2;
            const patchBorderColor = (document.getElementById('gaborPatchBorderColor')?.value || '#ffffff').toString();
            const patchBorderOpacityRaw = document.getElementById('gaborPatchBorderOpacity')?.value;
            const patchBorderOpacity = (patchBorderOpacityRaw !== undefined && patchBorderOpacityRaw !== null && `${patchBorderOpacityRaw}` !== '')
                ? Number.parseFloat(patchBorderOpacityRaw)
                : 0.22;

            config.gabor_settings = {
                response_task: responseTask,
                left_key: leftKey,
                right_key: rightKey,
                yes_key: yesKey,
                no_key: noKey,

                high_value_color: highValueColor,
                low_value_color: lowValueColor,

                spatial_frequency_cyc_per_px: Number.isFinite(spatialFreq) ? spatialFreq : 0.06,
                grating_waveform: waveform,

                patch_diameter_deg: Number.isFinite(patchDiameterDeg) ? Math.max(0.1, patchDiameterDeg) : 6,

                patch_border_enabled: patchBorderEnabled,
                patch_border_width_px: Number.isFinite(patchBorderWidth) ? Math.max(0, Math.min(50, patchBorderWidth)) : 2,
                patch_border_color: patchBorderColor,
                patch_border_opacity: Number.isFinite(patchBorderOpacity) ? Math.max(0, Math.min(1, patchBorderOpacity)) : 0.22,

                spatial_cue_validity: Number.isFinite(spatialCueValidity) ? spatialCueValidity : 0.8,

                spatial_cue_enabled: spatialCueEnabled,
                spatial_cue_probability: Number.isFinite(spatialCueProb) ? Math.max(0, Math.min(1, spatialCueProb)) : 1,
                spatial_cue_options: Array.isArray(spatialCueOptions) ? spatialCueOptions : ['none', 'left', 'right', 'both'],

                value_cue_enabled: valueCueEnabled,
                value_cue_probability: Number.isFinite(valueCueProb) ? Math.max(0, Math.min(1, valueCueProb)) : 1,
                left_value_options: Array.isArray(leftValueOptions) ? leftValueOptions : ['neutral', 'high', 'low'],
                right_value_options: Array.isArray(rightValueOptions) ? rightValueOptions : ['neutral', 'high', 'low'],

                fixation_ms: fixationMsRaw ? parseInt(fixationMsRaw) : 1000,
                placeholders_ms: placeholdersMsRaw ? parseInt(placeholdersMsRaw) : 400,
                cue_ms: cueMsRaw ? parseInt(cueMsRaw) : 300,
                cue_delay_min_ms: cueDelayMinRaw ? parseInt(cueDelayMinRaw) : 100,
                cue_delay_max_ms: cueDelayMaxRaw ? parseInt(cueDelayMaxRaw) : 200,
                stimulus_duration_ms: stimMsRaw ? parseInt(stimMsRaw) : 67,
                mask_duration_ms: maskMsRaw ? parseInt(maskMsRaw) : 67
            };
        }

        if (taskType === 'stroop') {
            const stimuli = this.getCurrentStroopStimuliFromUI();
            const n = Array.isArray(stimuli) ? stimuli.length : 0;

            const responseMode = (document.getElementById('stroopDefaultResponseMode')?.value || 'color_naming').toString();
            const responseDevice = (document.getElementById('stroopDefaultResponseDevice')?.value || 'keyboard').toString();

            const choiceKeys = this.parseStroopChoiceKeysFromUI(Math.max(2, n));
            const congruentKey = (document.getElementById('stroopCongruentKey')?.value || 'f').toString();
            const incongruentKey = (document.getElementById('stroopIncongruentKey')?.value || 'j').toString();

            const fontSizePx = Number.parseInt(document.getElementById('stroopStimulusFontSizePx')?.value || '64', 10);
            const stimMs = Number.parseInt(document.getElementById('stroopStimulusDurationMs')?.value || '0', 10);
            const trialMs = Number.parseInt(document.getElementById('stroopTrialDurationMs')?.value || '2000', 10);
            const itiMs = Number.parseInt(document.getElementById('stroopItiMs')?.value || '500', 10);

            config.stroop_settings = {
                stimuli: Array.isArray(stimuli) ? stimuli : [],
                response_mode: responseMode,
                response_device: responseDevice,

                choice_keys: choiceKeys,
                congruent_key: congruentKey,
                incongruent_key: incongruentKey,

                stimulus_font_size_px: Number.isFinite(fontSizePx) ? fontSizePx : 64,
                stimulus_duration_ms: Number.isFinite(stimMs) ? stimMs : 0,
                trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 2000,
                iti_ms: Number.isFinite(itiMs) ? itiMs : 500
            };
        }

        if (taskType === 'simon') {
            const stimuli = this.getCurrentSimonStimuliFromUI();

            const responseDevice = (document.getElementById('simonDefaultResponseDevice')?.value || 'keyboard').toString();
            const leftKey = (document.getElementById('simonLeftKey')?.value || 'f').toString();
            const rightKey = (document.getElementById('simonRightKey')?.value || 'j').toString();

            const circleDiameterPx = Number.parseInt(document.getElementById('simonCircleDiameterPx')?.value || '140', 10);

            const stimMs = Number.parseInt(document.getElementById('simonStimulusDurationMs')?.value || '0', 10);
            const trialMs = Number.parseInt(document.getElementById('simonTrialDurationMs')?.value || '1500', 10);
            const itiMs = Number.parseInt(document.getElementById('simonItiMs')?.value || '500', 10);

            config.simon_settings = {
                stimuli: Array.isArray(stimuli) ? stimuli : [],
                response_device: responseDevice,
                left_key: leftKey,
                right_key: rightKey,
                circle_diameter_px: Number.isFinite(circleDiameterPx) ? circleDiameterPx : 140,
                stimulus_duration_ms: Number.isFinite(stimMs) ? stimMs : 0,
                trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 1500,
                iti_ms: Number.isFinite(itiMs) ? itiMs : 500
            };
        }

        if (taskType === 'pvt') {
            const responseDevice = (document.getElementById('pvtDefaultResponseDevice')?.value || 'keyboard').toString();
            const responseKey = (document.getElementById('pvtResponseKey')?.value || 'space').toString();

            const addTrialPerFalseStart = !!document.getElementById('pvtAddTrialPerFalseStart')?.checked;

            const feedbackEnabled = !!document.getElementById('pvtFeedbackEnabled')?.checked;
            const feedbackMessage = (document.getElementById('pvtFeedbackMessage')?.value || '').toString();

            const foreperiodMs = Number.parseInt(document.getElementById('pvtForeperiodMs')?.value || '4000', 10);
            const trialMs = Number.parseInt(document.getElementById('pvtTrialDurationMs')?.value || '10000', 10);
            const itiMs = Number.parseInt(document.getElementById('pvtItiMs')?.value || '0', 10);

            config.pvt_settings = {
                response_device: responseDevice,
                response_key: responseKey,
                foreperiod_ms: Number.isFinite(foreperiodMs) ? foreperiodMs : 4000,
                trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 10000,
                iti_ms: Number.isFinite(itiMs) ? itiMs : 0,
                feedback_enabled: feedbackEnabled,
                feedback_message: feedbackMessage,
                add_trial_per_false_start: addTrialPerFalseStart
            };
        }

        if (taskType === 'soc-dashboard') {
            const title = (document.getElementById('socTitle')?.value || 'SOC Dashboard').toString();
            const wallpaperUrl = (document.getElementById('socWallpaperUrl')?.value || '').toString().trim();
            const defaultApp = (document.getElementById('socDefaultApp')?.value || 'soc').toString();

            const durationRaw = document.getElementById('socSessionDurationMs')?.value;
            const durationMs = (durationRaw !== undefined && durationRaw !== null && `${durationRaw}` !== '')
                ? parseInt(durationRaw)
                : 60000;

            const numTasksRaw = document.getElementById('socNumTasks')?.value;
            const numTasks = (numTasksRaw !== undefined && numTasksRaw !== null && `${numTasksRaw}` !== '')
                ? parseInt(numTasksRaw)
                : 1;

            const safeNumTasks = Number.isFinite(numTasks)
                ? Math.max(1, Math.min(4, Math.floor(numTasks)))
                : 1;

            config.soc_dashboard_settings = {
                title,
                wallpaper_url: wallpaperUrl,
                background_color: (document.getElementById('socBackgroundColor')?.value || '#0b1220').toString(),
                default_app: defaultApp,
                num_tasks: safeNumTasks,
                trial_duration_ms: Number.isFinite(durationMs) ? durationMs : 60000,
                end_key: (document.getElementById('socEndKey')?.value || 'escape').toString(),
                icons_clickable: !!document.getElementById('socIconsClickable')?.checked,
                log_icon_clicks: !!document.getElementById('socLogIconClicks')?.checked,
                icon_clicks_are_distractors: !!document.getElementById('socIconClicksAreDistractors')?.checked
            };
        }

        return config;
    }

    /**
     * Build a preview payload for the current Flanker defaults.
     */
    getCurrentFlankerDefaults() {
        return {
            type: 'flanker-trial',
            name: 'Flanker Defaults',
            left_key: document.getElementById('flankerLeftKey')?.value || 'f',
            right_key: document.getElementById('flankerRightKey')?.value || 'j',
            stimulus_type: document.getElementById('flankerStimulusType')?.value || 'arrows',
            target_stimulus: document.getElementById('flankerTargetStimulus')?.value || 'H',
            distractor_stimulus: document.getElementById('flankerDistractorStimulus')?.value || 'S',
            neutral_stimulus: document.getElementById('flankerNeutralStimulus')?.value || '–',
            show_fixation_dot: !!document.getElementById('flankerShowFixationDot')?.checked,
            show_fixation_cross_between_trials: !!document.getElementById('flankerShowFixationCrossBetweenTrials')?.checked,
            target_direction: 'left',
            congruency: 'congruent',
            stimulus_duration_ms: parseInt(document.getElementById('flankerStimulusDurationMs')?.value || '800', 10),
            trial_duration_ms: parseInt(document.getElementById('flankerTrialDurationMs')?.value || '1500', 10),
            iti_ms: parseInt(document.getElementById('flankerItiMs')?.value || '500', 10),
            detection_response_task_enabled: false
        };
    }

    getFlankerDefaultsForNewComponent() {
        // Defaults panel values; used when adding new Flanker timeline items.
        return {
            stimulus_type: document.getElementById('flankerStimulusType')?.value || 'arrows',
            target_stimulus: document.getElementById('flankerTargetStimulus')?.value || 'H',
            distractor_stimulus: document.getElementById('flankerDistractorStimulus')?.value || 'S',
            neutral_stimulus: document.getElementById('flankerNeutralStimulus')?.value || '–',
            show_fixation_dot: !!document.getElementById('flankerShowFixationDot')?.checked,
            show_fixation_cross_between_trials: !!document.getElementById('flankerShowFixationCrossBetweenTrials')?.checked,
            left_key: document.getElementById('flankerLeftKey')?.value || 'f',
            right_key: document.getElementById('flankerRightKey')?.value || 'j',
            stimulus_duration_ms: parseInt(document.getElementById('flankerStimulusDurationMs')?.value || '800', 10),
            trial_duration_ms: parseInt(document.getElementById('flankerTrialDurationMs')?.value || '1500', 10),
            iti_ms: parseInt(document.getElementById('flankerItiMs')?.value || '500', 10)
        };
    }

    /**
     * Build a preview payload for the current SART defaults.
     */
    getCurrentSartDefaults() {
        return {
            type: 'sart-trial',
            name: 'SART Defaults',
            digit: 1,
            nogo_digit: parseInt(document.getElementById('sartNoGoDigit')?.value || '3', 10),
            go_key: document.getElementById('sartGoKey')?.value || 'space',
            stimulus_duration_ms: parseInt(document.getElementById('sartStimulusDurationMs')?.value || '250', 10),
            mask_duration_ms: parseInt(document.getElementById('sartMaskDurationMs')?.value || '900', 10),
            trial_duration_ms: 1150,
            iti_ms: parseInt(document.getElementById('sartItiMs')?.value || '0', 10),
            detection_response_task_enabled: false
        };
    }

    getCurrentStroopStimuliFromUI() {
        const sizeEl = document.getElementById('stroopStimulusSetSize');
        const rawN = Number.parseInt(sizeEl?.value || '4', 10);
        const n = Number.isFinite(rawN) ? Math.max(2, Math.min(7, rawN)) : 4;

        const fallback = [
            { name: 'RED', color: '#ff0000' },
            { name: 'GREEN', color: '#00aa00' },
            { name: 'BLUE', color: '#0066ff' },
            { name: 'YELLOW', color: '#ffd200' },
            { name: 'PURPLE', color: '#7a3cff' },
            { name: 'ORANGE', color: '#ff7a00' },
            { name: 'PINK', color: '#ff3c8f' }
        ];

        const stimuli = [];
        for (let i = 1; i <= n; i += 1) {
            const nameRaw = document.getElementById(`stroopStimulusName_${i}`)?.value;
            const colorRaw = document.getElementById(`stroopStimulusColor_${i}`)?.value;

            const name = (nameRaw ?? fallback[i - 1]?.name ?? `COLOR_${i}`).toString().trim();
            const color = (colorRaw ?? fallback[i - 1]?.color ?? '#ffffff').toString().trim();
            stimuli.push({ name, color });
        }

        return stimuli;
    }

    getCurrentSimonStimuliFromUI() {
        const fallback = [
            { name: 'BLUE', color: '#0066ff' },
            { name: 'ORANGE', color: '#ff7a00' }
        ];

        const n1 = (document.getElementById('simonStimulusName_1')?.value ?? fallback[0].name).toString().trim() || fallback[0].name;
        const c1 = (document.getElementById('simonStimulusColor_1')?.value ?? fallback[0].color).toString().trim() || fallback[0].color;
        const n2 = (document.getElementById('simonStimulusName_2')?.value ?? fallback[1].name).toString().trim() || fallback[1].name;
        const c2 = (document.getElementById('simonStimulusColor_2')?.value ?? fallback[1].color).toString().trim() || fallback[1].color;

        return [
            { name: n1, color: c1 },
            { name: n2, color: c2 }
        ];
    }

    parseStroopChoiceKeysFromUI(stimulusCount) {
        const raw = document.getElementById('stroopChoiceKeys')?.value;
        const keys = (raw ?? '')
            .toString()
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        if (keys.length >= stimulusCount) return keys.slice(0, stimulusCount);

        // Fill up with 1..N if missing
        const out = keys.slice();
        for (let i = out.length + 1; i <= stimulusCount; i += 1) {
            out.push(`${i}`);
        }
        return out;
    }

    /**
     * Build a preview payload for the current Stroop defaults.
     */
    getCurrentStroopDefaults() {
        const stimuli = this.getCurrentStroopStimuliFromUI();
        const n = stimuli.length;

        const responseMode = (document.getElementById('stroopDefaultResponseMode')?.value || 'color_naming').toString();
        const responseDevice = (document.getElementById('stroopDefaultResponseDevice')?.value || 'keyboard').toString();

        const choiceKeys = this.parseStroopChoiceKeysFromUI(n);
        const congruentKey = (document.getElementById('stroopCongruentKey')?.value || 'f').toString();
        const incongruentKey = (document.getElementById('stroopIncongruentKey')?.value || 'j').toString();

        const fontSizePx = Number.parseInt(document.getElementById('stroopStimulusFontSizePx')?.value || '64', 10);
        const stimMs = Number.parseInt(document.getElementById('stroopStimulusDurationMs')?.value || '0', 10);
        const trialMs = Number.parseInt(document.getElementById('stroopTrialDurationMs')?.value || '2000', 10);
        const itiMs = Number.parseInt(document.getElementById('stroopItiMs')?.value || '500', 10);

        return {
            type: 'stroop-trial',
            name: 'Stroop Defaults',

            word: (stimuli[0]?.name || 'RED').toString(),
            ink_color_name: (stimuli[1]?.name || stimuli[0]?.name || 'BLUE').toString(),
            congruency: 'auto',

            response_mode: responseMode,
            response_device: responseDevice,
            choice_keys: choiceKeys,
            congruent_key: congruentKey,
            incongruent_key: incongruentKey,

            stimulus_font_size_px: Number.isFinite(fontSizePx) ? fontSizePx : 64,
            stimulus_duration_ms: Number.isFinite(stimMs) ? stimMs : 0,
            trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 2000,
            iti_ms: Number.isFinite(itiMs) ? itiMs : 500,

            // Non-standard field: helps preview components that want defaults context.
            stroop_settings: {
                stimuli,
                response_mode: responseMode,
                response_device: responseDevice,
                choice_keys: choiceKeys,
                congruent_key: congruentKey,
                incongruent_key: incongruentKey
            },

            detection_response_task_enabled: false
        };
    }

    /**
     * Build a preview payload for the current Simon defaults.
     */
    getCurrentSimonDefaults() {
        const stimuli = this.getCurrentSimonStimuliFromUI();

        const responseDevice = (document.getElementById('simonDefaultResponseDevice')?.value || 'keyboard').toString();
        const leftKey = (document.getElementById('simonLeftKey')?.value || 'f').toString();
        const rightKey = (document.getElementById('simonRightKey')?.value || 'j').toString();

        const circleDiameterPx = Number.parseInt(document.getElementById('simonCircleDiameterPx')?.value || '140', 10);

        const stimMs = Number.parseInt(document.getElementById('simonStimulusDurationMs')?.value || '0', 10);
        const trialMs = Number.parseInt(document.getElementById('simonTrialDurationMs')?.value || '1500', 10);
        const itiMs = Number.parseInt(document.getElementById('simonItiMs')?.value || '500', 10);

        return {
            type: 'simon-trial',
            name: 'Simon Defaults',

            stimulus_side: 'left',
            stimulus_color_name: (stimuli[0]?.name || 'BLUE').toString(),

            response_device: responseDevice,
            left_key: leftKey,
            right_key: rightKey,
            circle_diameter_px: Number.isFinite(circleDiameterPx) ? circleDiameterPx : 140,

            stimulus_duration_ms: Number.isFinite(stimMs) ? stimMs : 0,
            trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 1500,
            iti_ms: Number.isFinite(itiMs) ? itiMs : 500,

            // Non-standard field: helps preview components that want defaults context.
            simon_settings: {
                stimuli,
                response_device: responseDevice,
                left_key: leftKey,
                right_key: rightKey,
                circle_diameter_px: Number.isFinite(circleDiameterPx) ? circleDiameterPx : 140
            },

            detection_response_task_enabled: false
        };
    }

    /**
     * Build a preview payload for the current PVT defaults.
     */
    getCurrentPvtDefaults() {
        const responseDevice = (document.getElementById('pvtDefaultResponseDevice')?.value || 'keyboard').toString();
        const responseKey = (document.getElementById('pvtResponseKey')?.value || 'space').toString();

        const addTrialPerFalseStart = !!document.getElementById('pvtAddTrialPerFalseStart')?.checked;

        const feedbackEnabled = !!document.getElementById('pvtFeedbackEnabled')?.checked;
        const feedbackMessage = (document.getElementById('pvtFeedbackMessage')?.value || '').toString();

        const foreperiodMs = Number.parseInt(document.getElementById('pvtForeperiodMs')?.value || '4000', 10);
        const trialMs = Number.parseInt(document.getElementById('pvtTrialDurationMs')?.value || '10000', 10);
        const itiMs = Number.parseInt(document.getElementById('pvtItiMs')?.value || '0', 10);

        return {
            type: 'pvt-trial',
            name: 'PVT Defaults',

            response_device: responseDevice,
            response_key: responseKey,

            foreperiod_ms: Number.isFinite(foreperiodMs) ? foreperiodMs : 4000,
            trial_duration_ms: Number.isFinite(trialMs) ? trialMs : 10000,
            iti_ms: Number.isFinite(itiMs) ? itiMs : 0,

            // Preview-only fields (mirrors pvt_settings export)
            feedback_enabled: feedbackEnabled,
            feedback_message: feedbackMessage,
            add_trial_per_false_start: addTrialPerFalseStart,

            detection_response_task_enabled: false
        };
    }

    getPvtDefaultsForNewComponent() {
        return {
            response_device: 'inherit',
            response_key: (document.getElementById('pvtResponseKey')?.value || 'space').toString(),
            foreperiod_ms: Number.parseInt(document.getElementById('pvtForeperiodMs')?.value || '4000', 10),
            trial_duration_ms: Number.parseInt(document.getElementById('pvtTrialDurationMs')?.value || '10000', 10),
            iti_ms: Number.parseInt(document.getElementById('pvtItiMs')?.value || '0', 10)
        };
    }

    getPvtDefaultsForNewBlock() {
        const foreperiod = Number.parseInt(document.getElementById('pvtForeperiodMs')?.value || '4000', 10);
        const trialMs = Number.parseInt(document.getElementById('pvtTrialDurationMs')?.value || '10000', 10);
        const itiMs = Number.parseInt(document.getElementById('pvtItiMs')?.value || '0', 10);

        // Default to a wide foreperiod window for variability.
        const minFp = 2000;
        const maxFp = 10000;

        return {
            block_component_type: 'pvt-trial',

            pvt_response_device: 'inherit',
            pvt_response_key: (document.getElementById('pvtResponseKey')?.value || 'space').toString(),

            pvt_foreperiod_min: Number.isFinite(minFp) ? minFp : (Number.isFinite(foreperiod) ? foreperiod : 4000),
            pvt_foreperiod_max: Number.isFinite(maxFp) ? maxFp : (Number.isFinite(foreperiod) ? foreperiod : 4000),

            pvt_trial_duration_min: Number.isFinite(trialMs) ? trialMs : 10000,
            pvt_trial_duration_max: Number.isFinite(trialMs) ? trialMs : 10000,
            pvt_iti_min: Number.isFinite(itiMs) ? itiMs : 0,
            pvt_iti_max: Number.isFinite(itiMs) ? itiMs : 0
        };
    }

    getSimonDefaultsForNewComponent() {
        const stimuli = this.getCurrentSimonStimuliFromUI();

        return {
            stimulus_side: 'left',
            stimulus_color_name: (stimuli[0]?.name || 'BLUE').toString(),
            response_device: 'inherit',
            left_key: (document.getElementById('simonLeftKey')?.value || 'f').toString(),
            right_key: (document.getElementById('simonRightKey')?.value || 'j').toString(),
            circle_diameter_px: Number.parseInt(document.getElementById('simonCircleDiameterPx')?.value || '140', 10),
            stimulus_duration_ms: Number.parseInt(document.getElementById('simonStimulusDurationMs')?.value || '0', 10),
            trial_duration_ms: Number.parseInt(document.getElementById('simonTrialDurationMs')?.value || '1500', 10),
            iti_ms: Number.parseInt(document.getElementById('simonItiMs')?.value || '500', 10)
        };
    }

    getSimonDefaultsForNewBlock() {
        const stimuli = this.getCurrentSimonStimuliFromUI();
        const names = (Array.isArray(stimuli) ? stimuli : [])
            .map(s => (s?.name ?? '').toString().trim())
            .filter(Boolean);
        const nameList = names.join(',');

        const stimMs = Number.parseInt(document.getElementById('simonStimulusDurationMs')?.value || '0', 10);
        const trialMs = Number.parseInt(document.getElementById('simonTrialDurationMs')?.value || '1500', 10);
        const itiMs = Number.parseInt(document.getElementById('simonItiMs')?.value || '500', 10);

        return {
            block_component_type: 'simon-trial',

            simon_color_options: nameList || 'BLUE,ORANGE',
            simon_side_options: 'left,right',

            simon_response_device: 'inherit',
            simon_left_key: (document.getElementById('simonLeftKey')?.value || 'f').toString(),
            simon_right_key: (document.getElementById('simonRightKey')?.value || 'j').toString(),

            simon_stimulus_duration_min: Number.isFinite(stimMs) ? stimMs : 0,
            simon_stimulus_duration_max: Number.isFinite(stimMs) ? stimMs : 0,
            simon_trial_duration_min: Number.isFinite(trialMs) ? trialMs : 1500,
            simon_trial_duration_max: Number.isFinite(trialMs) ? trialMs : 1500,
            simon_iti_min: Number.isFinite(itiMs) ? itiMs : 500,
            simon_iti_max: Number.isFinite(itiMs) ? itiMs : 500
        };
    }

    getStroopDefaultsForNewComponent() {
        const stimuli = this.getCurrentStroopStimuliFromUI();
        const n = stimuli.length;
        const choiceKeys = this.parseStroopChoiceKeysFromUI(n);

        return {
            // Provide reasonable starting values; researcher can override per-trial.
            word: (stimuli[0]?.name || 'RED').toString(),
            ink_color_name: (stimuli[1]?.name || stimuli[0]?.name || 'BLUE').toString(),
            congruency: 'auto',

            response_mode: 'inherit',
            response_device: 'inherit',

            choice_keys: choiceKeys,
            congruent_key: (document.getElementById('stroopCongruentKey')?.value || 'f').toString(),
            incongruent_key: (document.getElementById('stroopIncongruentKey')?.value || 'j').toString(),

            stimulus_font_size_px: Number.parseInt(document.getElementById('stroopStimulusFontSizePx')?.value || '64', 10),
            stimulus_duration_ms: Number.parseInt(document.getElementById('stroopStimulusDurationMs')?.value || '0', 10),
            trial_duration_ms: Number.parseInt(document.getElementById('stroopTrialDurationMs')?.value || '2000', 10),
            iti_ms: Number.parseInt(document.getElementById('stroopItiMs')?.value || '500', 10)
        };
    }

    getStroopDefaultsForNewBlock() {
        const stimuli = this.getCurrentStroopStimuliFromUI();
        const n = stimuli.length;
        const names = stimuli.map(s => (s?.name ?? '').toString().trim()).filter(Boolean);
        const nameList = names.join(',');
        const choiceKeys = this.parseStroopChoiceKeysFromUI(n).join(',');

        const stimMs = Number.parseInt(document.getElementById('stroopStimulusDurationMs')?.value || '0', 10);
        const trialMs = Number.parseInt(document.getElementById('stroopTrialDurationMs')?.value || '2000', 10);
        const itiMs = Number.parseInt(document.getElementById('stroopItiMs')?.value || '500', 10);

        return {
            block_component_type: 'stroop-trial',

            stroop_word_options: nameList,
            stroop_congruency_options: 'auto,congruent,incongruent',

            stroop_response_mode: 'inherit',
            stroop_response_device: 'inherit',
            stroop_choice_keys: choiceKeys,
            stroop_congruent_key: (document.getElementById('stroopCongruentKey')?.value || 'f').toString(),
            stroop_incongruent_key: (document.getElementById('stroopIncongruentKey')?.value || 'j').toString(),

            stroop_stimulus_duration_min: Number.isFinite(stimMs) ? stimMs : 0,
            stroop_stimulus_duration_max: Number.isFinite(stimMs) ? stimMs : 0,
            stroop_trial_duration_min: Number.isFinite(trialMs) ? trialMs : 2000,
            stroop_trial_duration_max: Number.isFinite(trialMs) ? trialMs : 2000,
            stroop_iti_min: Number.isFinite(itiMs) ? itiMs : 500,
            stroop_iti_max: Number.isFinite(itiMs) ? itiMs : 500
        };
    }

    /**
     * Build a preview payload for the current Gabor defaults.
     */
    getCurrentGaborDefaults() {
        const responseTask = document.getElementById('gaborResponseTask')?.value || 'discriminate_tilt';
        const leftKey = document.getElementById('gaborLeftKey')?.value || 'f';
        const rightKey = document.getElementById('gaborRightKey')?.value || 'j';
        const yesKey = document.getElementById('gaborYesKey')?.value || 'f';
        const noKey = document.getElementById('gaborNoKey')?.value || 'j';

        const patchDiameterDeg = Number.parseFloat(document.getElementById('gaborPatchDiameterDeg')?.value || '6');

        const patchBorderEnabled = !!document.getElementById('gaborPatchBorderEnabled')?.checked;
        const patchBorderWidth = Number.parseInt(document.getElementById('gaborPatchBorderWidthPx')?.value || '2', 10);
        const patchBorderColor = (document.getElementById('gaborPatchBorderColor')?.value || '#ffffff').toString();
        const patchBorderOpacity = Number.parseFloat(document.getElementById('gaborPatchBorderOpacity')?.value || '0.22');

        return {
            type: 'gabor-trial',
            name: 'Gabor Defaults',

            response_task: responseTask,
            left_key: leftKey,
            right_key: rightKey,
            yes_key: yesKey,
            no_key: noKey,

            target_location: 'left',
            target_tilt_deg: 45,
            distractor_orientation_deg: 0,
            spatial_cue: 'none',
            left_value: 'neutral',
            right_value: 'neutral',

            // Use panel timings for the trial-level preview
            stimulus_duration_ms: parseInt(document.getElementById('gaborStimulusDurationMs')?.value || '67', 10),
            mask_duration_ms: parseInt(document.getElementById('gaborMaskDurationMs')?.value || '67', 10),

            spatial_frequency_cyc_per_px: Number.parseFloat(document.getElementById('gaborSpatialFrequency')?.value || '0.06'),
            grating_waveform: (document.getElementById('gaborGratingWaveform')?.value || 'sinusoidal').toString(),

            patch_diameter_deg: Number.isFinite(patchDiameterDeg) ? Math.max(0.1, patchDiameterDeg) : 6,

            // Optional colors to render value cues in preview
            high_value_color: document.getElementById('gaborHighValueColor')?.value || '#00aa00',
            low_value_color: document.getElementById('gaborLowValueColor')?.value || '#0066ff',

            patch_border_enabled: patchBorderEnabled,
            patch_border_width_px: Number.isFinite(patchBorderWidth) ? Math.max(0, Math.min(50, patchBorderWidth)) : 2,
            patch_border_color: patchBorderColor,
            patch_border_opacity: Number.isFinite(patchBorderOpacity) ? Math.max(0, Math.min(1, patchBorderOpacity)) : 0.22,

            detection_response_task_enabled: false
        };
    }

    /**
     * Build a preview payload for the current SOC Dashboard defaults.
     */
    getCurrentSocDashboardDefaults() {
        return {
            type: 'soc-dashboard',
            name: 'SOC Dashboard Defaults',
            title: (document.getElementById('socTitle')?.value || 'SOC Dashboard').toString(),
            wallpaper_url: (document.getElementById('socWallpaperUrl')?.value || '').toString().trim(),
            background_color: (document.getElementById('socBackgroundColor')?.value || '#0b1220').toString(),
            default_app: (document.getElementById('socDefaultApp')?.value || 'soc').toString(),
            num_tasks: parseInt(document.getElementById('socNumTasks')?.value || '1', 10),
            trial_duration_ms: parseInt(document.getElementById('socSessionDurationMs')?.value || '60000', 10),
            end_key: (document.getElementById('socEndKey')?.value || 'escape').toString(),
            icons_clickable: !!document.getElementById('socIconsClickable')?.checked,
            log_icon_clicks: !!document.getElementById('socLogIconClicks')?.checked,
            icon_clicks_are_distractors: !!document.getElementById('socIconClicksAreDistractors')?.checked,
            detection_response_task_enabled: false
        };
    }

    getSocDashboardDefaultsForNewComponent() {
        const d = this.getCurrentSocDashboardDefaults();
        const { type, name, ...rest } = d;
        // Ensure predictable arrays for composition/preview, even before export.
        rest.desktop_icons = [];
        rest.subtasks = [];
        return rest;
    }

    getGaborDefaultsForNewComponent() {
        // Defaults panel values; used when adding new Gabor timeline items.
        const patchDiameterDeg = Number.parseFloat(document.getElementById('gaborPatchDiameterDeg')?.value || '6');
        return {
            response_task: document.getElementById('gaborResponseTask')?.value || 'discriminate_tilt',
            left_key: document.getElementById('gaborLeftKey')?.value || 'f',
            right_key: document.getElementById('gaborRightKey')?.value || 'j',
            yes_key: document.getElementById('gaborYesKey')?.value || 'f',
            no_key: document.getElementById('gaborNoKey')?.value || 'j',
            stimulus_duration_ms: parseInt(document.getElementById('gaborStimulusDurationMs')?.value || '67', 10),
            mask_duration_ms: parseInt(document.getElementById('gaborMaskDurationMs')?.value || '67', 10),
            spatial_frequency_cyc_per_px: Number.parseFloat(document.getElementById('gaborSpatialFrequency')?.value || '0.06'),
            grating_waveform: (document.getElementById('gaborGratingWaveform')?.value || 'sinusoidal').toString(),

            patch_diameter_deg: Number.isFinite(patchDiameterDeg) ? Math.max(0.1, patchDiameterDeg) : 6,

            patch_border_enabled: !!document.getElementById('gaborPatchBorderEnabled')?.checked,
            patch_border_width_px: Number.parseInt(document.getElementById('gaborPatchBorderWidthPx')?.value || '2', 10),
            patch_border_color: (document.getElementById('gaborPatchBorderColor')?.value || '#ffffff').toString(),
            patch_border_opacity: Number.parseFloat(document.getElementById('gaborPatchBorderOpacity')?.value || '0.22')
        };
    }

    getGaborDefaultsForNewBlock() {
        // Defaults panel values; used when adding new Block timeline items under the Gabor task.
        // These are editor-only block params that become parameter_values/parameter_windows on export.
        const stim = parseInt(document.getElementById('gaborStimulusDurationMs')?.value || '67', 10);
        const mask = parseInt(document.getElementById('gaborMaskDurationMs')?.value || '67', 10);

        const freq = Number.parseFloat(document.getElementById('gaborSpatialFrequency')?.value || '0.06');
        const safeFreq = Number.isFinite(freq) ? freq : 0.06;

        const pd = Number.parseFloat(document.getElementById('gaborPatchDiameterDeg')?.value || '6');
        const safePd = Number.isFinite(pd) ? Math.max(0.1, pd) : 6;

        return {
            gabor_response_task: document.getElementById('gaborResponseTask')?.value || 'discriminate_tilt',
            gabor_left_key: document.getElementById('gaborLeftKey')?.value || 'f',
            gabor_right_key: document.getElementById('gaborRightKey')?.value || 'j',
            gabor_yes_key: document.getElementById('gaborYesKey')?.value || 'f',
            gabor_no_key: document.getElementById('gaborNoKey')?.value || 'j',

            gabor_spatial_frequency_min: safeFreq,
            gabor_spatial_frequency_max: safeFreq,
            gabor_grating_waveform_options: (document.getElementById('gaborGratingWaveform')?.value || 'sinusoidal').toString(),

            gabor_patch_diameter_deg_min: safePd,
            gabor_patch_diameter_deg_max: safePd,

            gabor_patch_border_enabled: !!document.getElementById('gaborPatchBorderEnabled')?.checked,
            gabor_patch_border_width_px: Number.parseInt(document.getElementById('gaborPatchBorderWidthPx')?.value || '2', 10),
            gabor_patch_border_color: (document.getElementById('gaborPatchBorderColor')?.value || '#ffffff').toString(),
            gabor_patch_border_opacity: Number.parseFloat(document.getElementById('gaborPatchBorderOpacity')?.value || '0.22'),

            gabor_spatial_cue_enabled: !!document.getElementById('gaborSpatialCueEnabled')?.checked,
            gabor_spatial_cue_options: (document.getElementById('gaborSpatialCueOptions')?.value || 'none,left,right,both').toString(),
            gabor_spatial_cue_probability: Number.parseFloat(document.getElementById('gaborSpatialCueProbability')?.value || '1'),

            gabor_value_cue_enabled: !!document.getElementById('gaborValueCueEnabled')?.checked,
            gabor_left_value_options: (document.getElementById('gaborLeftValueOptions')?.value || 'neutral,high,low').toString(),
            gabor_right_value_options: (document.getElementById('gaborRightValueOptions')?.value || 'neutral,high,low').toString(),
            gabor_value_cue_probability: Number.parseFloat(document.getElementById('gaborValueCueProbability')?.value || '1'),

            gabor_adaptive_mode: 'none',
            gabor_quest_parameter: 'target_tilt_deg',
            gabor_quest_target_performance: 0.82,
            gabor_quest_start_value: 45,
            gabor_quest_start_sd: 20,
            gabor_quest_beta: 3.5,
            gabor_quest_delta: 0.01,
            gabor_quest_gamma: 0.5,
            gabor_quest_min_value: -90,
            gabor_quest_max_value: 90,
            gabor_stimulus_duration_min: Number.isFinite(stim) ? stim : 67,
            gabor_stimulus_duration_max: Number.isFinite(stim) ? stim : 67,
            gabor_mask_duration_min: Number.isFinite(mask) ? mask : 67,
            gabor_mask_duration_max: Number.isFinite(mask) ? mask : 67
        };
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

    getExperimentWideLengthCapForBlocks() {
        // Trial-based: cap is num_trials.
        if (this.experimentType === 'trial-based') {
            const raw = document.getElementById('numTrials')?.value;
            const n = Number.parseInt(raw ?? '', 10);
            return (Number.isFinite(n) && n > 0) ? n : null;
        }

        // Continuous: cap is total frames = duration (sec) * frame_rate.
        if (this.experimentType === 'continuous') {
            const durRaw = document.getElementById('duration')?.value;
            const frRaw = document.getElementById('frameRate')?.value;
            const durationSec = Number.parseFloat(durRaw ?? '');
            const frameRate = Number.parseFloat(frRaw ?? '60');
            if (!Number.isFinite(durationSec) || durationSec <= 0) return null;
            if (!Number.isFinite(frameRate) || frameRate <= 0) return null;
            return Math.max(1, Math.round(durationSec * frameRate));
        }

        return null;
    }

    getExperimentWideBlockLengthDefault() {
        return this.getExperimentWideLengthCapForBlocks() ?? 100;
    }

    findBlockLengthViolations(config) {
        const cap = this.getExperimentWideLengthCapForBlocks();
        if (!cap) return [];

        const timeline = Array.isArray(config?.timeline) ? config.timeline : [];
        const violations = [];

        for (const c of timeline) {
            if (!c || typeof c !== 'object') continue;
            if (c.type !== 'block') continue;

            const len = Number.parseInt(c.length ?? '', 10);
            if (!Number.isFinite(len)) continue;
            if (len <= cap) continue;

            const rawType = (c.component_type ?? 'unknown').toString();
            const safeType = rawType.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'unknown';
            violations.push(`Block (${safeType}) length ${len} exceeds experiment length ${cap}.`);
        }

        return violations;
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

                // Defensive: if a save path accidentally dropped `type`, recover it from the
                // timeline element metadata so export/validation still works.
                if (!componentData.type) {
                    const fallbackType = element.dataset.componentType;
                    if (fallbackType) {
                        componentData.type = fallbackType;
                    }
                }
                
                const transformed = this.transformComponent(componentData);
                console.log('Transformed component:', transformed);
                
                components.push(transformed);
            } catch (e) {
                console.warn('Failed to parse component data:', e, element);
            }
        });

        const taskType = document.getElementById('taskType')?.value || 'rdm';
        if (taskType === 'soc-dashboard') {
            return this.composeSocDashboardTimeline(components);
        }

        return components;
    }

    composeSocDashboardTimeline(components) {
        const output = [];
        let currentSession = null;

        function extractSubtaskParams(component) {
            const raw = (component && typeof component === 'object') ? component : {};
            const fromNested = (raw.parameters && typeof raw.parameters === 'object') ? raw.parameters : null;
            const bag = fromNested || raw;

            const params = {};
            for (const [k, v] of Object.entries(bag)) {
                if (k === 'type' || k === 'name' || k === 'title' || k === 'parameters') continue;
                params[k] = v;
            }
            return params;
        }

        function isSocSubtaskType(t) {
            return t === 'soc-subtask-sart-like'
                || t === 'soc-subtask-flanker-like'
                || t === 'soc-subtask-nback-like'
                || t === 'soc-subtask-wcst-like'
                || t === 'soc-subtask-pvt-like';
        }

        function mapSocSubtaskKind(t) {
            switch (t) {
                case 'soc-subtask-sart-like': return 'sart-like';
                case 'soc-subtask-flanker-like': return 'flanker-like';
                case 'soc-subtask-nback-like': return 'nback-like';
                case 'soc-subtask-wcst-like': return 'wcst-like';
                case 'soc-subtask-pvt-like': return 'pvt-like';
                default: return 'unknown';
            }
        }

        for (const component of components) {
            if (!component || typeof component !== 'object') continue;

            if (component.type === 'soc-dashboard') {
                currentSession = component;
                if (!Array.isArray(currentSession.desktop_icons)) {
                    currentSession.desktop_icons = [];
                }
                if (!Array.isArray(currentSession.subtasks)) {
                    currentSession.subtasks = [];
                }
                output.push(currentSession);
                continue;
            }

            if (isSocSubtaskType(component.type)) {
                const subtask = {
                    type: mapSocSubtaskKind(component.type),
                    title: (component.title || component.name || 'Subtask').toString(),
                    ...extractSubtaskParams(component)
                };

                if (currentSession) {
                    currentSession.subtasks.push(subtask);
                } else {
                    // If there is no session yet, keep the component as-is so the
                    // user can spot the ordering problem.
                    output.push(component);
                }
                continue;
            }

            if (component.type === 'soc-dashboard-icon') {
                const icon = {
                    label: (component.label || component.name || 'Icon').toString(),
                    app: (component.app || 'soc').toString(),
                    icon_text: (component.icon_text || '').toString(),
                    row: Number.isFinite(Number(component.row)) ? parseInt(component.row, 10) : 0,
                    col: Number.isFinite(Number(component.col)) ? parseInt(component.col, 10) : 0,
                    distractor: !!component.distractor
                };

                if (currentSession) {
                    currentSession.desktop_icons.push(icon);
                } else {
                    // If there is no session yet, keep the component as-is so the
                    // user can spot the ordering problem.
                    output.push(component);
                }
                continue;
            }

            output.push(component);
        }

        return output;
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
                detection_response_task_enabled: !!(component.detection_response_task_enabled ?? false),
                stimulus: component.stimulus,
                choices: component.choices,
                prompt: component.prompt,
                stimulus_duration: component.stimulus_duration,
                trial_duration: component.trial_duration,
                response_ends_trial: component.response_ends_trial,
                data: component.data
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

        // Ensure detection-response-task flag is always present for traceability
        if (baseComponent.detection_response_task_enabled === undefined) {
            baseComponent.detection_response_task_enabled = false;
        }

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

            // Keep aperture border (outline) params nested for clarity in hand-edited JSON.
            // Remove any flat fields to avoid confusion.
            const outline = {};

            // New editor shape: mode + width/color (only treat as override when mode is explicit true/false)
            if (baseComponent.show_aperture_outline_mode !== undefined) {
                const mode = (baseComponent.show_aperture_outline_mode ?? 'inherit').toString().trim().toLowerCase();
                delete baseComponent.show_aperture_outline_mode;

                if (mode === 'true' || mode === 'false') {
                    outline.show_aperture_outline = (mode === 'true');

                    const widthRaw = Number(baseComponent.aperture_outline_width);
                    if (Number.isFinite(widthRaw)) outline.aperture_outline_width = widthRaw;

                    const colorRaw = (typeof baseComponent.aperture_outline_color === 'string') ? baseComponent.aperture_outline_color.trim() : '';
                    if (colorRaw) outline.aperture_outline_color = colorRaw;
                }

                // These are editor-only fields; never export them flat.
                if (baseComponent.aperture_outline_width !== undefined) delete baseComponent.aperture_outline_width;
                if (baseComponent.aperture_outline_color !== undefined) delete baseComponent.aperture_outline_color;
            }

            // Legacy support: flat boolean + width/color
            if (baseComponent.show_aperture_outline !== undefined) {
                outline.show_aperture_outline = baseComponent.show_aperture_outline;
                delete baseComponent.show_aperture_outline;
            }
            if (baseComponent.aperture_outline_width !== undefined) {
                outline.aperture_outline_width = baseComponent.aperture_outline_width;
                delete baseComponent.aperture_outline_width;
            }
            if (baseComponent.aperture_outline_color !== undefined) {
                outline.aperture_outline_color = baseComponent.aperture_outline_color;
                delete baseComponent.aperture_outline_color;
            }
            if (Object.keys(outline).length > 0) {
                const ap = (baseComponent.aperture_parameters && typeof baseComponent.aperture_parameters === 'object')
                    ? baseComponent.aperture_parameters
                    : {};
                baseComponent.aperture_parameters = { ...ap, ...outline };
            }
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
        const isGaborQuestBlock = componentType === 'gabor-quest';
        const exportComponentType = isGaborQuestBlock ? 'gabor-trial' : componentType;
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
        } else if (componentType === 'flanker-trial') {
            // Generic task fields; interpreter defines how these are rendered/scored.
            const parseStringList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            };

            const congruency = parseStringList(blockComponent.flanker_congruency_options);
            if (congruency && congruency.length > 0) {
                values.congruency = Array.from(new Set(congruency));
            }

            const experimentStimType = (() => {
                const el = document.getElementById('flankerStimulusType');
                const v = (el && typeof el.value === 'string') ? el.value : null;
                const s = (v ?? 'arrows').toString().trim();
                return s || 'arrows';
            })();

            const stimType = (blockComponent.flanker_stimulus_type ?? experimentStimType).toString().trim();
            const stimTypeNorm = stimType.toLowerCase();
            const isArrows = (stimTypeNorm === '' || stimTypeNorm === 'arrows');
            if (stimType) {
                values.stimulus_type = stimType;
            }

            if (isArrows) {
                const dirs = parseStringList(blockComponent.flanker_target_direction_options);
                if (dirs && dirs.length > 0) {
                    values.target_direction = Array.from(new Set(dirs));
                }
            } else {
                const targetStim = parseStringList(blockComponent.flanker_target_stimulus_options);
                if (targetStim.length > 0) {
                    values.target_stimulus = Array.from(new Set(targetStim));
                }

                const distractorStim = parseStringList(blockComponent.flanker_distractor_stimulus_options);
                if (distractorStim.length > 0) {
                    values.distractor_stimulus = Array.from(new Set(distractorStim));
                }

                const neutralStim = parseStringList(blockComponent.flanker_neutral_stimulus_options);
                if (neutralStim.length > 0) {
                    values.neutral_stimulus = Array.from(new Set(neutralStim));
                }
            }

            const lk = (blockComponent.flanker_left_key ?? '').toString().trim();
            const rk = (blockComponent.flanker_right_key ?? '').toString().trim();
            if (lk) values.left_key = lk;
            if (rk) values.right_key = rk;

            values.show_fixation_dot = !!(blockComponent.flanker_show_fixation_dot ?? false);
            values.show_fixation_cross_between_trials = !!(blockComponent.flanker_show_fixation_cross_between_trials ?? false);

            addWindow('stimulus_duration_ms', blockComponent.flanker_stimulus_duration_min, blockComponent.flanker_stimulus_duration_max);
            addWindow('trial_duration_ms', blockComponent.flanker_trial_duration_min, blockComponent.flanker_trial_duration_max);
            addWindow('iti_ms', blockComponent.flanker_iti_min, blockComponent.flanker_iti_max);
        } else if (componentType === 'sart-trial') {
            const parseIntList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map(s => Number.parseInt(s, 10))
                    .filter(n => Number.isFinite(n));
            };

            const digits = parseIntList(blockComponent.sart_digit_options);
            if (digits.length > 0) {
                values.digit = Array.from(new Set(digits));
            }

            const nogo = Number.parseInt(blockComponent.sart_nogo_digit, 10);
            if (Number.isFinite(nogo)) {
                values.nogo_digit = nogo;
            }

            const goKey = (blockComponent.sart_go_key ?? '').toString().trim();
            if (goKey) {
                values.go_key = goKey;
            }

            addWindow('stimulus_duration_ms', blockComponent.sart_stimulus_duration_min, blockComponent.sart_stimulus_duration_max);
            addWindow('mask_duration_ms', blockComponent.sart_mask_duration_min, blockComponent.sart_mask_duration_max);
            addWindow('trial_duration_ms', blockComponent.sart_trial_duration_min, blockComponent.sart_trial_duration_max);
            addWindow('iti_ms', blockComponent.sart_iti_min, blockComponent.sart_iti_max);
        } else if (componentType === 'gabor-trial' || componentType === 'gabor-quest') {
            const parseStringList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            };

            const responseTask = (blockComponent.gabor_response_task ?? '').toString().trim();
            if (responseTask) {
                values.response_task = responseTask;
            }

            const lk = (blockComponent.gabor_left_key ?? '').toString().trim();
            const rk = (blockComponent.gabor_right_key ?? '').toString().trim();
            const yk = (blockComponent.gabor_yes_key ?? '').toString().trim();
            const nk = (blockComponent.gabor_no_key ?? '').toString().trim();
            if (lk) values.left_key = lk;
            if (rk) values.right_key = rk;
            if (yk) values.yes_key = yk;
            if (nk) values.no_key = nk;

            const locs = parseStringList(blockComponent.gabor_target_location_options);
            if (locs.length > 0) {
                values.target_location = Array.from(new Set(locs));
            }

            const tilts = parseNumberList(blockComponent.gabor_target_tilt_options, { min: -90, max: 90 });
            if (tilts.length > 0) {
                values.target_tilt_deg = Array.from(new Set(tilts));
            }

            const dis = parseNumberList(blockComponent.gabor_distractor_orientation_options, { min: 0, max: 179 });
            if (dis.length > 0) {
                values.distractor_orientation_deg = Array.from(new Set(dis));
            }

            const cues = parseStringList(blockComponent.gabor_spatial_cue_options);
            if (cues.length > 0) {
                values.spatial_cue = Array.from(new Set(cues));
            }

            if (blockComponent.gabor_spatial_cue_enabled !== undefined) {
                values.spatial_cue_enabled = !!blockComponent.gabor_spatial_cue_enabled;
            }
            const pSpatial = Number(blockComponent.gabor_spatial_cue_probability);
            if (Number.isFinite(pSpatial)) {
                values.spatial_cue_probability = Math.max(0, Math.min(1, pSpatial));
            }

            const lv = parseStringList(blockComponent.gabor_left_value_options);
            if (lv.length > 0) {
                values.left_value = Array.from(new Set(lv));
            }

            const rv = parseStringList(blockComponent.gabor_right_value_options);
            if (rv.length > 0) {
                values.right_value = Array.from(new Set(rv));
            }

            if (blockComponent.gabor_value_cue_enabled !== undefined) {
                values.value_cue_enabled = !!blockComponent.gabor_value_cue_enabled;
            }
            const pValue = Number(blockComponent.gabor_value_cue_probability);
            if (Number.isFinite(pValue)) {
                values.value_cue_probability = Math.max(0, Math.min(1, pValue));
            }

            addWindow('spatial_frequency_cyc_per_px', blockComponent.gabor_spatial_frequency_min, blockComponent.gabor_spatial_frequency_max);

            addWindow('patch_diameter_deg', blockComponent.gabor_patch_diameter_deg_min, blockComponent.gabor_patch_diameter_deg_max);

            const waveforms = parseStringList(blockComponent.gabor_grating_waveform_options);
            if (waveforms.length > 0) {
                values.grating_waveform = Array.from(new Set(waveforms));
            }

            if (blockComponent.gabor_patch_border_enabled !== undefined) {
                values.patch_border_enabled = !!blockComponent.gabor_patch_border_enabled;
            }
            const bw = Number(blockComponent.gabor_patch_border_width_px);
            if (Number.isFinite(bw)) {
                values.patch_border_width_px = Math.max(0, Math.min(50, bw));
            }
            const bc = (typeof blockComponent.gabor_patch_border_color === 'string')
                ? blockComponent.gabor_patch_border_color.trim()
                : '';
            if (bc) {
                values.patch_border_color = bc;
            }
            const bo = Number(blockComponent.gabor_patch_border_opacity);
            if (Number.isFinite(bo)) {
                values.patch_border_opacity = Math.max(0, Math.min(1, bo));
            }

            const adaptiveMode = isGaborQuestBlock
                ? 'quest'
                : (blockComponent.gabor_adaptive_mode ?? 'none').toString().trim();
            if (adaptiveMode === 'quest') {
                values.adaptive = {
                    mode: 'quest',
                    parameter: (blockComponent.gabor_quest_parameter ?? 'target_tilt_deg').toString(),
                    target_performance: Number(blockComponent.gabor_quest_target_performance),
                    start_value: Number(blockComponent.gabor_quest_start_value),
                    start_sd: Number(blockComponent.gabor_quest_start_sd),
                    beta: Number(blockComponent.gabor_quest_beta),
                    delta: Number(blockComponent.gabor_quest_delta),
                    gamma: Number(blockComponent.gabor_quest_gamma),
                    min_value: Number(blockComponent.gabor_quest_min_value),
                    max_value: Number(blockComponent.gabor_quest_max_value)
                };

                // Clean up NaNs if the user left fields empty
                Object.keys(values.adaptive).forEach(k => {
                    const v = values.adaptive[k];
                    if (typeof v === 'number' && !Number.isFinite(v)) {
                        delete values.adaptive[k];
                    }
                });
            }

            addWindow('stimulus_duration_ms', blockComponent.gabor_stimulus_duration_min, blockComponent.gabor_stimulus_duration_max);
            addWindow('mask_duration_ms', blockComponent.gabor_mask_duration_min, blockComponent.gabor_mask_duration_max);
        }

        // Aperture border (outline) settings apply to all RDM-derived block component types.
        if (componentType && componentType.startsWith('rdm-')) {
            const modeRaw = (blockComponent.show_aperture_outline_mode ?? 'inherit').toString().trim();
            const widthRaw = Number(blockComponent.aperture_outline_width);
            const colorRaw = (typeof blockComponent.aperture_outline_color === 'string') ? blockComponent.aperture_outline_color.trim() : '';

            const hasWidth = Number.isFinite(widthRaw);
            const hasColor = colorRaw !== '';

            const ap = {};
            // Only emit a per-block override when the user explicitly chooses true/false.
            // (Width/color have defaults in the UI, so treating their presence as intent causes accidental overrides.)
            if (modeRaw === 'true' || modeRaw === 'false') {
                ap.show_aperture_outline = (modeRaw === 'true');
                if (hasWidth) ap.aperture_outline_width = widthRaw;
                if (hasColor) ap.aperture_outline_color = colorRaw;
            }

            if (Object.keys(ap).length > 0) {
                const existing = (values.aperture_parameters && typeof values.aperture_parameters === 'object')
                    ? values.aperture_parameters
                    : {};
                values.aperture_parameters = { ...existing, ...ap };
            }
        } else if (componentType === 'stroop-trial') {
            const parseStringList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            };

            const words = parseStringList(blockComponent.stroop_word_options);
            if (words.length > 0) values.word = Array.from(new Set(words));

            // Ink colors are *named* entries from the experiment-wide stimulus palette.
            // Prefer the same stimulus list as words (palette-driven), but support legacy
            // stroop_ink_color_options if it exists in older configs.
            const legacyInks = parseStringList(blockComponent.stroop_ink_color_options);
            const inks = (legacyInks.length > 0) ? legacyInks : words;
            if (inks.length > 0) values.ink_color_name = Array.from(new Set(inks));

            const congr = parseStringList(blockComponent.stroop_congruency_options);
            if (congr.length > 0) values.congruency = Array.from(new Set(congr));

            const mode = (blockComponent.stroop_response_mode ?? 'inherit').toString().trim();
            if (mode && mode !== 'inherit') values.response_mode = mode;

            const dev = (blockComponent.stroop_response_device ?? 'inherit').toString().trim();
            if (dev && dev !== 'inherit') values.response_device = dev;

            // Only export response mappings when the block explicitly overrides to keyboard.
            // If the block inherits (or uses mouse), let experiment-wide stroop_settings drive mappings.
            if (dev === 'keyboard') {
                if (mode === 'congruency') {
                    const ck = (blockComponent.stroop_congruent_key ?? '').toString().trim();
                    const ik = (blockComponent.stroop_incongruent_key ?? '').toString().trim();
                    if (ck) values.congruent_key = ck;
                    if (ik) values.incongruent_key = ik;
                } else {
                    const choiceKeys = parseStringList(blockComponent.stroop_choice_keys);
                    if (choiceKeys.length > 0) values.choice_keys = choiceKeys;
                }
            }

            addWindow('stimulus_duration_ms', blockComponent.stroop_stimulus_duration_min, blockComponent.stroop_stimulus_duration_max);
            addWindow('trial_duration_ms', blockComponent.stroop_trial_duration_min, blockComponent.stroop_trial_duration_max);
            addWindow('iti_ms', blockComponent.stroop_iti_min, blockComponent.stroop_iti_max);
        } else if (componentType === 'simon-trial') {
            const parseStringList = (raw) => {
                if (raw === undefined || raw === null) return [];
                return raw
                    .toString()
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            };

            const colors = parseStringList(blockComponent.simon_color_options);
            if (colors.length > 0) values.stimulus_color_name = Array.from(new Set(colors));

            const sides = parseStringList(blockComponent.simon_side_options);
            if (sides.length > 0) values.stimulus_side = Array.from(new Set(sides));

            const dev = (blockComponent.simon_response_device ?? 'inherit').toString().trim();
            if (dev && dev !== 'inherit') values.response_device = dev;

            // Only export response mappings when the block explicitly overrides to keyboard.
            if (dev === 'keyboard') {
                const lk = (blockComponent.simon_left_key ?? '').toString().trim();
                const rk = (blockComponent.simon_right_key ?? '').toString().trim();
                if (lk) values.left_key = lk;
                if (rk) values.right_key = rk;
            }

            addWindow('stimulus_duration_ms', blockComponent.simon_stimulus_duration_min, blockComponent.simon_stimulus_duration_max);
            addWindow('trial_duration_ms', blockComponent.simon_trial_duration_min, blockComponent.simon_trial_duration_max);
            addWindow('iti_ms', blockComponent.simon_iti_min, blockComponent.simon_iti_max);
        } else if (componentType === 'pvt-trial') {
            const dev = (blockComponent.pvt_response_device ?? 'inherit').toString().trim();
            if (dev && dev !== 'inherit') values.response_device = dev;

            const usesKeyboard = (dev === 'keyboard' || dev === 'both');
            if (usesKeyboard) {
                const key = (blockComponent.pvt_response_key ?? '').toString().trim();
                if (key) values.response_key = key;
            }

            addWindow('foreperiod_ms', blockComponent.pvt_foreperiod_min, blockComponent.pvt_foreperiod_max);
            addWindow('trial_duration_ms', blockComponent.pvt_trial_duration_min, blockComponent.pvt_trial_duration_max);
            addWindow('iti_ms', blockComponent.pvt_iti_min, blockComponent.pvt_iti_max);
        }

        const out = {
            type: 'block',
            detection_response_task_enabled: !!(blockComponent.detection_response_task_enabled ?? false),
            component_type: exportComponentType,
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

        const effectiveDevice = merged.response_device || 'keyboard';

        // Apply key overrides (keyboard only)
        if (effectiveDevice === 'keyboard' && hasKeysOverride) {
            const choices = responseKeys.split(',').map(k => k.trim()).filter(Boolean);
            merged.choices = choices;
            merged.key_mapping = {
                [choices[0] || 'f']: 'left',
                [choices[1] || 'j']: 'right'
            };
        }

        // If not keyboard, remove keyboard-only fields inherited from defaults.
        if (effectiveDevice !== 'keyboard') {
            if (merged.choices) delete merged.choices;
            if (merged.key_mapping) delete merged.key_mapping;
        }

        // Apply mouse overrides
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

        transformed.detection_response_task_enabled = !!(component.detection_response_task_enabled ?? false);

        // Preserve response override if it was generated upstream
        if (component.response_parameters_override) {
            transformed.response_parameters_override = component.response_parameters_override;
        }

        // Preserve nested aperture parameters if present (e.g., aperture outline fields)
        if (component.aperture_parameters && typeof component.aperture_parameters === 'object') {
            transformed.aperture_parameters = { ...component.aperture_parameters };
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
        const expAperture = (this.currentExperiment && typeof this.currentExperiment === 'object' && this.currentExperiment.aperture_parameters && typeof this.currentExperiment.aperture_parameters === 'object')
            ? this.currentExperiment.aperture_parameters
            : {};

        const out = {
            shape: document.getElementById('apertureShape')?.value || 'circle',
            diameter: parseInt(document.getElementById('apertureDiameter')?.value || 350),
            center_x: parseInt(document.getElementById('canvasWidth')?.value || 600) / 2,
            center_y: parseInt(document.getElementById('canvasHeight')?.value || 600) / 2
        };

        // Experiment-wide aperture outline controls
        const enabledEl = document.getElementById('apertureOutlineEnabled');
        if (enabledEl) {
            out.show_aperture_outline = !!enabledEl.checked;
        } else if (expAperture.show_aperture_outline !== undefined) {
            // Back-compat when loading older templates or if UI isn't present
            out.show_aperture_outline = expAperture.show_aperture_outline;
        }

        const widthEl = document.getElementById('apertureOutlineWidth');
        if (widthEl && widthEl.value !== '' && widthEl.value !== null && widthEl.value !== undefined) {
            const w = Number(widthEl.value);
            if (Number.isFinite(w)) out.aperture_outline_width = w;
        } else if (expAperture.aperture_outline_width !== undefined) {
            out.aperture_outline_width = expAperture.aperture_outline_width;
        }

        const colorEl = document.getElementById('apertureOutlineColor');
        if (colorEl && typeof colorEl.value === 'string' && colorEl.value.trim() !== '') {
            out.aperture_outline_color = colorEl.value.trim();
        } else if (expAperture.aperture_outline_color !== undefined) {
            out.aperture_outline_color = expAperture.aperture_outline_color;
        }

        return out;
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
        // Important: JSON Preview is rendered via innerHTML.
        // Escape HTML-sensitive characters first so that HTML embedded in JSON string
        // values (e.g., Instructions stimulus) is shown literally and not interpreted.
        const escaped = String(json)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return escaped
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

            const blockLengthErrors = this.findBlockLengthViolations(config);
            
            if (validation.valid && blockLengthErrors.length === 0) {
                this.showValidationResult('success', 'Configuration is valid!');
            } else {
                const allErrors = [];
                if (!validation.valid) {
                    allErrors.push(...(validation.errors || []));
                }
                if (blockLengthErrors.length > 0) {
                    allErrors.push(...blockLengthErrors);
                }
                this.showValidationResult('error', `Validation errors: ${allErrors.join(' | ')}`);
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
    async exportJSON() {
        let config = this.generateJSON();

        // Safety: blocks cannot be longer than the experiment-wide length.
        const blockLengthErrors = this.findBlockLengthViolations(config);
        if (blockLengthErrors.length > 0) {
            this.showValidationResult('error', `Cannot export: ${blockLengthErrors.join(' | ')}`);
            return;
        }

        const naming = this.getExportFilename(config);
        if (!naming) return;

        // Preferred flow: upload directly via Microsoft Graph (requires Entra ID app registration)
        const graphClient = window.GraphSharePointClient;
        if (graphClient?.uploadJsonToOneDriveFolder) {
            try {
                // Upload any cached local assets (images) referenced by asset://... in the config.
                if (graphClient.uploadFileToOneDriveFolder && window.PsychJsonAssetCache) {
                    try {
                        config = await this.uploadAssetRefsToGraphAndRewriteConfig(config, naming, graphClient);
                    } catch (e) {
                        console.warn('Asset upload failed (continuing with JSON-only):', e);
                        this.showValidationResult('warning', `Asset upload failed; exporting JSON only. (${e?.message || 'Unknown error'})`);
                    }
                }

                const json = JSON.stringify(config, null, 2);

                const runtime = graphClient.getRuntimeConfig?.() || {};
                if (!runtime.clientId) {
                    const shouldConfigure = confirm(
                        'Graph export is not configured yet (missing clientId).\n\nConfigure now?'
                    );
                    if (shouldConfigure) {
                        const updated = await graphClient.promptAndPersistSettings();
                        if (!updated?.clientId) {
                            this.showValidationResult('warning', 'Graph export not configured; falling back to local download.');
                            return this.exportJSONLegacy({ json, filename: naming.filename });
                        }
                    } else {
                        return this.exportJSONLegacy({ json, filename: naming.filename });
                    }
                }

                const driveItem = await graphClient.uploadJsonToOneDriveFolder({
                    jsonText: json,
                    filename: naming.filename
                });

                const webUrl = driveItem?.webUrl;
                if (webUrl) {
                    try {
                        window.open(webUrl, '_blank', 'noopener');
                    } catch {
                        // ignore
                    }
                }

                this.showValidationResult('success', `Uploaded ${naming.filename} to SharePoint via Microsoft Graph.`);
                return;
            } catch (error) {
                console.error('Graph export failed:', error);
                this.showValidationResult('warning', `Graph export failed; falling back to local download. (${error?.message || 'Unknown error'})`);
                return this.exportJSONLegacy({ json: JSON.stringify(config, null, 2), filename: naming.filename });
            }
        }

        // Fallback: local download + open SharePoint folder URL.
        const json = JSON.stringify(config, null, 2);
        return this.exportJSONLegacy({ json, filename: naming.filename });
    }

    exportJSONLegacy({ json, filename }) {
        // If the config contains asset:// refs, local download will not include the binary files.
        // We warn so the researcher knows to use Graph export (or replace with URLs).
        try {
            const assetRefs = this.findAssetRefsInString(json);
            if (assetRefs.length > 0) {
                this.showValidationResult('warning', `This config references ${assetRefs.length} local asset(s) (asset://...). Use "Export to SharePoint" to upload images, or replace with URLs.`);
            }
        } catch {
            // ignore
        }

        this.downloadJsonToFile(json, filename);

        const sharepointUrl = this.getSharePointFolderUrl();
        if (sharepointUrl) {
            try {
                window.open(sharepointUrl, '_blank', 'noopener');
            } catch {
                // ignore
            }
            this.showValidationResult('success', `Saved ${filename}. SharePoint folder opened in a new tab.`);
        } else {
            this.showValidationResult('success', `Saved ${filename}. (SharePoint URL not set.)`);
        }
    }

    findAssetRefsInString(rawText) {
        const text = (rawText ?? '').toString();
        const re = /asset:\/\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/g;
        const out = [];
        let m;
        while ((m = re.exec(text)) !== null) {
            out.push(`asset://${m[1]}/${m[2]}`);
        }
        return Array.from(new Set(out));
    }

    async uploadAssetRefsToGraphAndRewriteConfig(config, naming, graphClient) {
        const cfg = (config && typeof config === 'object') ? config : {};
        const jsonText = JSON.stringify(cfg);
        const refs = this.findAssetRefsInString(jsonText);
        if (refs.length === 0) return cfg;

        const base = String(naming?.filename || 'export').replace(/\.json$/i, '');
        const sanitizeFileName = (s) => {
            return String(s || '')
                .replace(/[^A-Za-z0-9._-]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 160) || 'asset';
        };

        const uploadedByRef = new Map();

        for (const ref of refs) {
            const m = /^asset:\/\/([^/]+)\/([^/]+)$/.exec(ref);
            if (!m) continue;
            const componentId = m[1];
            const field = m[2];

            const entry = window.PsychJsonAssetCache?.get?.(componentId, field);
            const file = entry?.file;
            if (!file) {
                console.warn('Missing cached file for', ref);
                continue;
            }

            const originalName = entry?.filename || file.name || `${field}`;
            const extMatch = /\.[A-Za-z0-9]{1,8}$/.exec(originalName);
            const ext = extMatch ? extMatch[0] : '';

            const outName = sanitizeFileName(`${base}-asset-${componentId}-${field}`) + ext;

            if (!uploadedByRef.has(ref)) {
                await graphClient.uploadFileToOneDriveFolder({
                    file,
                    filename: outName,
                    contentType: entry?.mime || file.type || 'application/octet-stream'
                });
                uploadedByRef.set(ref, outName);
            }
        }

        // Rewrite any asset:// refs anywhere in the config (including HTML templates)
        const replaceInString = (s) => {
            const raw = (s ?? '').toString();
            return raw.replace(/asset:\/\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/g, (full) => {
                const mapped = uploadedByRef.get(full);
                return mapped ? mapped : full;
            });
        };

        const rewriteDeep = (x) => {
            if (typeof x === 'string') return replaceInString(x);
            if (Array.isArray(x)) return x.map(rewriteDeep);
            if (x && typeof x === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(x)) {
                    out[k] = rewriteDeep(v);
                }
                return out;
            }
            return x;
        };

        const rewritten = rewriteDeep(cfg);
        const uploadedCount = uploadedByRef.size;
        if (uploadedCount > 0) {
            this.showValidationResult('success', `Uploaded ${uploadedCount} image asset(s) referenced by asset://...`);
        } else {
            this.showValidationResult('warning', `Found ${refs.length} asset reference(s), but no cached files were available to upload.`);
        }
        return rewritten;
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
                dataCollection: { ...this.dataCollection },
                taskType: document.getElementById('taskType')?.value || 'rdm'
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

            // Restore task type dropdown (if present)
            if (template.taskType) {
                this.setElementValue('taskType', template.taskType);
            }
            
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
                center_y: 300,
                show_aperture_outline: false,
                aperture_outline_width: 2,
                aperture_outline_color: "#FFFFFF"
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

        // Ensure task type defaults to RDM
        this.setElementValue('taskType', 'rdm');
        
        // Populate UI with default values
        this.populateRDMUI();

        // Timeline should start empty; researchers can load a template instead.
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
        this.setElementChecked('apertureOutlineEnabled', exp.aperture_parameters?.show_aperture_outline);
        this.setElementValue('apertureOutlineWidth', exp.aperture_parameters?.aperture_outline_width);
        this.setElementValue('apertureOutlineColor', exp.aperture_parameters?.aperture_outline_color);
        
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
        // Default response device (drives modality-specific UI)
        {
            const rp = exp.response_parameters || {};
            const inferred = (typeof rp.response_device === 'string' && rp.response_device.trim() !== '')
                ? rp.response_device.trim()
                : (rp.mouse_response ? 'mouse'
                    : (rp.touch_response ? 'touch'
                        : (rp.voice_response ? 'voice' : 'keyboard')));

            this.setElementValue('defaultResponseDevice', inferred);
        }

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
        const taskType = document.getElementById('taskType')?.value || 'rdm';
        if (taskType !== 'rdm') {
            return;
        }

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
                            <small class="text-muted">RDM Trial</small>
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
            aperture_diameter: getValue('apertureDiameter', 350, 'int'),
            background_color: getValue('backgroundColor', '#404040'),
            dot_size: getValue('dotSize', 4, 'int'),
            dot_color: getValue('dotColor', '#ffffff'),
            total_dots: getValue('totalDots', 150, 'int'),
            coherence: getValue('motionCoherence', 0.5, 'number'),
            coherent_direction: getValue('motionDirection', 0, 'int'),
            speed: getValue('motionSpeed', 5, 'int'),
            lifetime_frames: getValue('dotLifetime', 60, 'int'),
            noise_type: 'random_direction',

            // Aperture outline defaults
            show_aperture_outline: (() => {
                const el = document.getElementById('apertureOutlineEnabled');
                return el ? !!el.checked : false;
            })(),
            aperture_outline_width: getValue('apertureOutlineWidth', 2, 'number'),
            aperture_outline_color: getValue('apertureOutlineColor', '#FFFFFF')
        };
    }

    /**
     * Save parameters from modal
     */
    saveParameters() {
        // Prefer the schema-driven save path (TimelineBuilder). The legacy save logic below
        // only collected a fixed set of RDM fields and could overwrite dataset.componentData
        // without preserving critical fields like `type`, which can break Block export.
        if (this.timelineBuilder && typeof this.timelineBuilder.saveComponentParameters === 'function') {
            this.timelineBuilder.saveComponentParameters();
            return;
        }

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

        // Legacy fallback: merge into existing component data and preserve `type`.
        let existing = {};
        try {
            existing = JSON.parse(currentComponent.dataset.componentData || '{}') || {};
        } catch {
            existing = {};
        }

        const preservedType = existing.type || currentComponent.dataset.componentType;
        const preservedName = existing.name;

        let updated;
        if (existing.parameters && typeof existing.parameters === 'object') {
            updated = {
                type: preservedType,
                name: preservedName,
                ...existing,
                parameters: {
                    ...existing.parameters,
                    ...parameters
                }
            };
        } else {
            updated = {
                type: preservedType,
                name: preservedName,
                ...existing,
                ...parameters
            };
        }

        // Store parameters in the component's data attribute
        currentComponent.dataset.componentData = JSON.stringify(updated);
        
        // Update the component's visual display
        if (typeof parameters.coherence === 'number' && typeof parameters.coherent_direction === 'number' && typeof parameters.total_dots === 'number') {
            this.updateComponentDisplay(currentComponent, parameters);
        }
        
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
        
        // Cosmetic: do not render parameter summaries in the timeline cards.
        // Keep the existing description/type text unchanged.
        
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

        // Determine component type being edited (so previews route correctly)
        let componentType = 'psychophysics-rdm';
        let componentName = undefined;
        let storedData = null;
        try {
            if (this.currentEditingComponent?.dataset?.componentData) {
                storedData = JSON.parse(this.currentEditingComponent.dataset.componentData);
                if (storedData?.type) componentType = storedData.type;
                if (storedData?.name) componentName = storedData.name;
            }
        } catch (e) {
            console.warn('Could not parse currentEditingComponent for preview type:', e);
        }

        // If stored type is missing, fall back to the timeline element metadata
        if ((!componentType || componentType === 'psychophysics-rdm') && this.currentEditingComponent?.dataset?.componentType) {
            componentType = this.currentEditingComponent.dataset.componentType;
        }

        // Survey-response has a custom editor (questions list) and cannot be previewed
        // by scraping generic input ids.
        if (componentType === 'survey-response') {
            if (!this.timelineBuilder || typeof this.timelineBuilder.collectSurveyResponseFromModal !== 'function') {
                console.error('TimelineBuilder survey collector not available');
                return;
            }

            const survey = this.timelineBuilder.collectSurveyResponseFromModal(modalBody);
            const previewData = {
                type: 'survey-response',
                name: componentName || storedData?.name || 'Survey Response',
                ...(storedData && typeof storedData === 'object' ? storedData : {}),
                ...survey
            };

            console.log('Preview data for component type:', previewData.type, previewData);
            if (window.componentPreview) {
                window.componentPreview.showPreview(previewData);
            } else {
                console.error('ComponentPreview not found');
            }
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

        // componentType/componentName already resolved above

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