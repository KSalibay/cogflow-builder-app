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
        } else if (componentType === 'image-keyboard-response') {
            this.showImageKeyboardResponsePreview(componentData);
        } else if (componentType === 'visual-angle-calibration') {
            this.showVisualAngleCalibrationPreview(componentData);
        } else if (componentType === 'reward-settings') {
            this.showRewardSettingsPreview(componentData);
        } else if (componentType === 'flanker-trial') {
            this.showFlankerPreview(componentData);
        } else if (componentType === 'gabor-trial' || componentType === 'gabor-quest') {
            this.showGaborPreview(componentData);
        } else if (componentType === 'sart-trial') {
            this.showSartPreview(componentData);
        } else if (componentType === 'stroop-trial') {
            this.showStroopPreview(componentData);
        } else if (componentType === 'simon-trial') {
            this.showSimonPreview(componentData);
        } else if (componentType === 'pvt-trial') {
            this.showPvtPreview(componentData);
        } else if (componentType === 'survey-response') {
            this.showSurveyPreview(componentData);
        } else if (componentType === 'soc-dashboard') {
            this.showSocDashboardPreview(componentData);
        } else if (componentType === 'soc-subtask-sart-like' ||
                   componentType === 'soc-subtask-flanker-like' ||
                   componentType === 'soc-subtask-nback-like' ||
                   componentType === 'soc-subtask-wcst-like' ||
                   componentType === 'soc-subtask-pvt-like') {
            const wrapped = this.wrapSocSubtaskAsSession(componentData);
            this.showSocDashboardPreview(wrapped);
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

    showSimonPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const isHex = (s) => typeof s === 'string' && /^#([0-9a-fA-F]{6})$/.test(s.trim());

        const fallbackStimuli = (() => {
            try {
                const list = window.jsonBuilderInstance?.getCurrentSimonStimuliFromUI?.();
                return Array.isArray(list) ? list : [];
            } catch {
                return [];
            }
        })();

        const stimuli = Array.isArray(componentData?.simon_settings?.stimuli)
            ? componentData.simon_settings.stimuli
            : fallbackStimuli;

        const nameToHex = new Map(
            (Array.isArray(stimuli) ? stimuli : [])
                .filter(s => s && typeof s === 'object')
                .map(s => [String(s.name ?? '').trim().toLowerCase(), String(s.color ?? '').trim()])
                .filter(([k, v]) => !!k && !!v)
        );

        const resolveHexForName = (name) => {
            const raw = (name ?? '').toString().trim();
            if (isHex(raw)) return raw;
            const hit = nameToHex.get(raw.toLowerCase());
            return hit || '#ffffff';
        };

        const resolveInherit = (v, fallback) => {
            const s = (v ?? '').toString().trim();
            if (s === '' || s === 'inherit') return fallback;
            return s;
        };

        // For Block previews (and Trial previews that omit simon_settings), fall back to current UI defaults.
        const uiDefaults = (() => {
            try {
                return window.jsonBuilderInstance?.getCurrentSimonDefaults?.() || null;
            } catch {
                return null;
            }
        })();

        const defaults = (componentData?.simon_settings && typeof componentData.simon_settings === 'object')
            ? componentData.simon_settings
            : (uiDefaults?.simon_settings && typeof uiDefaults.simon_settings === 'object')
                ? uiDefaults.simon_settings
                : {};

        const side = (componentData?.stimulus_side ?? 'left').toString().trim().toLowerCase() === 'right' ? 'right' : 'left';
        const colorName = (componentData?.stimulus_color_name ?? stimuli?.[0]?.name ?? 'BLUE').toString();
        const colorHex = resolveHexForName(colorName);

        const responseDevice = resolveInherit(componentData?.response_device, defaults?.response_device || uiDefaults?.response_device || 'keyboard');
        const leftKey = resolveInherit(componentData?.left_key, defaults?.left_key || uiDefaults?.left_key || 'f');
        const rightKey = resolveInherit(componentData?.right_key, defaults?.right_key || uiDefaults?.right_key || 'j');
        const circleDiameterPx = Number.isFinite(Number(componentData?.circle_diameter_px))
            ? Number(componentData.circle_diameter_px)
            : (Number.isFinite(Number(defaults?.circle_diameter_px)) ? Number(defaults.circle_diameter_px) : 140);

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const hasBlockSource = !!componentData?._blockPreviewSource;

        const mappingSwatches = (() => {
            const list = Array.isArray(stimuli) ? stimuli : [];
            const take = list.slice(0, 2);
            const items = take.map((s, idx) => {
                const n = (s?.name ?? `Stimulus ${idx + 1}`).toString();
                const h = resolveHexForName(n);
                const sideLabel = idx === 0 ? 'LEFT response' : 'RIGHT response';
                return `
                    <div class="d-inline-flex align-items-center me-3 mb-2" style="gap:8px;">
                        <span style="display:inline-block; width:14px; height:14px; border-radius:4px; background:${escape(h)}; border:1px solid rgba(255,255,255,0.22);"></span>
                        <span><b>${escape(n)}</b> → ${escape(sideLabel)}</span>
                    </div>
                `;
            }).join('');
            return items || '<div class="text-warning">No stimulus library available.</div>';
        })();

        const keyboardHintHtml = (responseDevice === 'keyboard')
            ? `<div class="small text-muted"><b>Keyboard:</b> <span class="badge bg-secondary">${escape(leftKey)}</span> = LEFT, <span class="badge bg-secondary">${escape(rightKey)}</span> = RIGHT</div>`
            : `<div class="small text-muted"><b>Mouse:</b> click LEFT or RIGHT circle</div>`;

        const circleStyle = `width:${circleDiameterPx}px; height:${circleDiameterPx}px; border-radius:999px; border:2px solid rgba(255,255,255,0.35);`;

        const body = `
            <div class="p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">Simon Preview</h5>
                        <div class="small text-muted">Lightweight renderer</div>
                        ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                    </div>
                    <div class="text-end small text-muted">
                        <div><strong>Stimulus:</strong> ${escape(colorName)}</div>
                        <div><strong>Side:</strong> ${escape(side)}</div>
                        <div><strong>Response:</strong> ${escape(responseDevice)}</div>
                    </div>
                </div>

                <div class="border rounded mt-3 p-4 d-flex justify-content-center align-items-center" style="background:#111; color:#fff; min-height: 240px;">
                    <div style="display:flex; gap:64px; align-items:center; justify-content:center;">
                        <div style="${circleStyle} background:${side === 'left' ? escape(colorHex) : 'rgba(255,255,255,0.08)'};"></div>
                        <div style="${circleStyle} background:${side === 'right' ? escape(colorHex) : 'rgba(255,255,255,0.08)'};"></div>
                    </div>
                </div>

                <div class="mt-3">${keyboardHintHtml}</div>
                <div class="mt-2 small text-muted">${mappingSwatches}</div>

                <div class="mt-3 small text-muted d-flex justify-content-between align-items-center">
                    <div>${escape((componentData?.detection_response_task_enabled ? 'DRT enabled' : ''))}</div>
                    ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="simonResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                </div>
            </div>
        `;

        modalBody.innerHTML = body;

        if (hasBlockSource) {
            const btn = modalBody.querySelector('#simonResampleBtn');
            if (btn) {
                btn.onclick = () => {
                    const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                    const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'simon-trial';
                    const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                    const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                    sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                    sampled._blockPreviewSource = componentData._blockPreviewSource;
                    this.showSimonPreview(sampled);
                };
            }
        }

        modal.show();
    }

    showPvtPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const resolveInherit = (v, fallback) => {
            const s = (v ?? '').toString().trim();
            if (s === '' || s === 'inherit') return fallback;
            return s;
        };

        const uiDefaults = (() => {
            try {
                return window.jsonBuilderInstance?.getCurrentPvtDefaults?.() || null;
            } catch {
                return null;
            }
        })();

        const defaults = {
            response_device: (uiDefaults?.response_device ?? 'keyboard').toString(),
            response_key: (uiDefaults?.response_key ?? 'space').toString(),
            foreperiod_ms: Number.isFinite(Number(uiDefaults?.foreperiod_ms)) ? Number(uiDefaults.foreperiod_ms) : 4000,
            trial_duration_ms: Number.isFinite(Number(uiDefaults?.trial_duration_ms)) ? Number(uiDefaults.trial_duration_ms) : 10000,
            iti_ms: Number.isFinite(Number(uiDefaults?.iti_ms)) ? Number(uiDefaults.iti_ms) : 0,
            feedback_enabled: (uiDefaults?.feedback_enabled === true),
            feedback_message: (uiDefaults?.feedback_message ?? '').toString()
        };

        const responseDevice = resolveInherit(componentData?.response_device, defaults.response_device);
        const responseKey = resolveInherit(componentData?.response_key, defaults.response_key);

        const foreperiodMs = Number.isFinite(Number(componentData?.foreperiod_ms))
            ? Number(componentData.foreperiod_ms)
            : defaults.foreperiod_ms;

        const trialMs = Number.isFinite(Number(componentData?.trial_duration_ms))
            ? Number(componentData.trial_duration_ms)
            : defaults.trial_duration_ms;

        const itiMs = Number.isFinite(Number(componentData?.iti_ms))
            ? Number(componentData.iti_ms)
            : defaults.iti_ms;

        const feedbackEnabled = (typeof componentData?.feedback_enabled === 'boolean')
            ? componentData.feedback_enabled
            : defaults.feedback_enabled;
        const feedbackMessage = (typeof componentData?.feedback_message === 'string')
            ? componentData.feedback_message
            : defaults.feedback_message;

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const hasBlockSource = !!componentData?._blockPreviewSource;

        const responseHint = (responseDevice === 'mouse')
            ? '<div class="small text-muted"><b>Mouse:</b> click the timer screen</div>'
            : (responseDevice === 'both')
                ? `<div class="small text-muted"><b>Both:</b> press <span class="badge bg-secondary">${escape(responseKey)}</span> or click</div>`
                : `<div class="small text-muted"><b>Keyboard:</b> press <span class="badge bg-secondary">${escape(responseKey)}</span></div>`;

        const body = `
            <div class="p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">PVT Preview</h5>
                        <div class="small text-muted">Lightweight renderer</div>
                        ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                    </div>
                    <div class="text-end small text-muted">
                        <div><strong>Foreperiod:</strong> ${escape(foreperiodMs)} ms</div>
                        <div><strong>Timeout:</strong> ${escape(trialMs)} ms</div>
                        <div><strong>ITI:</strong> ${escape(itiMs)} ms</div>
                    </div>
                </div>

                <div class="border rounded mt-3 p-4 d-flex justify-content-center align-items-center" style="background:#111; color:#fff; min-height: 260px;">
                    <div class="text-center" style="width:100%; max-width:720px;">
                        <div id="pvtStatus" class="small" style="opacity:0.75; min-height: 18px;">Ready</div>
                        <div id="pvtStage" tabindex="0" role="button" aria-label="PVT timer stage" style="outline:none; user-select:none; cursor:pointer; padding: 18px 8px; border-radius: 12px;">
                            <div id="pvtTimer" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 96px; letter-spacing: 0.08em;">
                                0000
                            </div>
                            <div class="mt-2">${responseHint}</div>
                            <div class="mt-2 small text-muted" style="max-width:680px; margin:0 auto;">
                                Click/press to respond. This preview simulates foreperiod + timer.
                            </div>
                        </div>

                        <div class="mt-3 d-flex justify-content-center gap-2">
                            <button type="button" class="btn btn-sm btn-success" id="pvtSimStartBtn"><i class="fas fa-play"></i> Simulate Trial</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="pvtSimResetBtn"><i class="fas fa-rotate"></i> Reset</button>
                        </div>

                        <div id="pvtFeedbackBox" class="alert alert-info mt-3" style="display:none; text-align:left;"></div>
                    </div>
                </div>

                <div class="mt-3 small text-muted d-flex justify-content-between align-items-center">
                    <div>
                        ${feedbackEnabled ? `<span class="badge bg-info text-dark">Feedback: ON (false-start only)</span>` : `<span class="badge bg-secondary">Feedback: OFF</span>`}
                    </div>
                    <div class="d-flex gap-2">
                        ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="pvtResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                    </div>
                </div>
            </div>
        `;

        modalBody.innerHTML = body;

        if (hasBlockSource) {
            const btn = modalBody.querySelector('#pvtResampleBtn');
            if (btn) {
                btn.onclick = () => {
                    const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                    const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'pvt-trial';
                    const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                    const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                    sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                    sampled._blockPreviewSource = componentData._blockPreviewSource;
                    this.showPvtPreview(sampled);
                };
            }
        }

        // Interactive simulation
        const statusEl = modalBody.querySelector('#pvtStatus');
        const stageEl = modalBody.querySelector('#pvtStage');
        const timerEl = modalBody.querySelector('#pvtTimer');
        const startBtn = modalBody.querySelector('#pvtSimStartBtn');
        const resetBtn = modalBody.querySelector('#pvtSimResetBtn');
        const feedbackBox = modalBody.querySelector('#pvtFeedbackBox');

        let phase = 'idle'; // idle | foreperiod | running | ended
        let foreTimeout = null;
        let deadlineTimeout = null;
        let rafId = null;
        let targetOnset = null;

        const clearTimers = () => {
            if (foreTimeout !== null) { clearTimeout(foreTimeout); foreTimeout = null; }
            if (deadlineTimeout !== null) { clearTimeout(deadlineTimeout); deadlineTimeout = null; }
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        };

        const fmt4 = (n) => {
            const x = Math.max(0, Math.min(9999, Math.floor(Number(n) || 0)));
            return x.toString().padStart(4, '0');
        };

        const setStatus = (s) => {
            if (statusEl) statusEl.textContent = s || '';
        };

        const setTimer = (ms) => {
            if (timerEl) timerEl.textContent = fmt4(ms);
        };

        const hideFeedback = () => {
            if (!feedbackBox) return;
            feedbackBox.style.display = 'none';
            feedbackBox.textContent = '';
        };

        const showFeedback = (msg) => {
            if (!feedbackBox) return;
            const m = (msg ?? '').toString();
            if (!m) return;
            feedbackBox.textContent = m;
            feedbackBox.style.display = '';
            // Match interpreter-ish behavior: auto-hide after a short time.
            setTimeout(() => {
                // Only hide if nothing else replaced it.
                if (feedbackBox.textContent === m) hideFeedback();
            }, 750);
        };

        const resetSim = () => {
            clearTimers();
            phase = 'idle';
            targetOnset = null;
            setStatus('Ready');
            setTimer(0);
            hideFeedback();
            try { stageEl?.focus?.(); } catch { /* ignore */ }
        };

        const startSim = () => {
            resetSim();
            phase = 'foreperiod';
            setStatus('Get ready…');

            foreTimeout = setTimeout(() => {
                if (phase !== 'foreperiod') return;
                phase = 'running';
                targetOnset = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                setStatus('Respond now');

                const loop = () => {
                    if (phase !== 'running') return;
                    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    setTimer(now - targetOnset);
                    rafId = requestAnimationFrame(loop);
                };
                rafId = requestAnimationFrame(loop);

                if (Number.isFinite(Number(trialMs)) && Number(trialMs) > 0) {
                    deadlineTimeout = setTimeout(() => {
                        if (phase !== 'running') return;
                        phase = 'ended';
                        clearTimers();
                        setStatus('Timed out');
                    }, Number(trialMs));
                }
            }, Math.max(0, Number(foreperiodMs) || 0));
        };

        const respond = (source) => {
            if (phase === 'ended') return;

            if (phase === 'foreperiod' || phase === 'idle') {
                phase = 'ended';
                clearTimers();
                setStatus(`False start (${source})`);
                if (feedbackEnabled && feedbackMessage) showFeedback(feedbackMessage);
                return;
            }

            if (phase === 'running') {
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const rt = Math.max(0, now - targetOnset);
                phase = 'ended';
                clearTimers();
                setTimer(rt);
                setStatus(`Response (${source})`);
            }
        };

        if (startBtn) startBtn.onclick = () => startSim();
        if (resetBtn) resetBtn.onclick = () => resetSim();

        if (stageEl) {
            stageEl.onclick = () => {
                if (responseDevice === 'keyboard') return;
                respond('click');
            };
            stageEl.onkeydown = (ev) => {
                const key = (ev?.key ?? '').toString();
                const keyLower = key.toLowerCase();
                const targetKey = (responseKey ?? '').toString().trim().toLowerCase();
                const isSpace = (key === ' ' || keyLower === 'space');
                const matches = (targetKey === ' ' || targetKey === 'space') ? isSpace : (keyLower === targetKey);
                if (!matches) return;
                if (responseDevice === 'mouse') return;
                try { ev.preventDefault(); } catch { /* ignore */ }
                respond('key');
            };

            // focus so keyboard preview works immediately
            try { stageEl.focus(); } catch { /* ignore */ }
        }

        modal.show();
    }

    resolveMaybeAssetUrl(raw) {
        const s = (raw ?? '').toString();
        const m = /^asset:\/\/([^/]+)\/([^/]+)$/.exec(s);
        if (!m) return s;

        try {
            const cid = m[1];
            const field = m[2];
            const entry = window.PsychJsonAssetCache?.get?.(cid, field);
            if (entry && entry.objectUrl) return entry.objectUrl;
        } catch {
            // ignore
        }

        return '';
    }

    wrapCenteredPreview(html) {
        // Builder preview modal has its own styling; include a minimal centered stage.
        return `
            <div style="min-height:70vh; display:flex; align-items:center; justify-content:center; padding:18px; box-sizing:border-box; background:#0b0b0b; color:rgba(255,255,255,0.9); border-radius:12px;">
                <div style="width:min(980px, 100%);">
                    ${html}
                </div>
            </div>
        `;
    }

    showImageKeyboardResponsePreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const stim = this.resolveMaybeAssetUrl(componentData?.stimulus);
        const prompt = (componentData?.prompt ?? '').toString();
        const choices = componentData?.choices ?? 'ALL_KEYS';
        const w = componentData?.stimulus_width;
        const h = componentData?.stimulus_height;

        const styleParts = [];
        if (Number.isFinite(Number(w))) styleParts.push(`width:${Number(w)}px;`);
        if (Number.isFinite(Number(h))) styleParts.push(`height:${Number(h)}px;`);
        styleParts.push('max-width:100%; max-height:55vh; object-fit:contain;');

        const imgHtml = stim
            ? `<img src="${stim}" alt="stimulus" style="${styleParts.join(' ')}" />`
            : `<div class="text-warning">No image stimulus set (or missing cached asset).</div>`;

        const body = `
            <h5 style="margin:0 0 10px 0;">Image + Keyboard Response</h5>
            <div style="display:flex; justify-content:center; margin:14px 0;">${imgHtml}</div>
            ${prompt ? `<div style="margin-top:10px; opacity:0.9;">${prompt}</div>` : ''}
            <div style="margin-top:14px; font-size:12px; opacity:0.75;">
                <b>Choices:</b> ${Array.isArray(choices) ? choices.join(', ') : String(choices)}
            </div>
        `;

        modalBody.innerHTML = this.wrapCenteredPreview(body);
        modal.show();
    }

    showVisualAngleCalibrationPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const storeKey = (componentData?.store_key || '__psy_visual_angle').toString();
        const card = (componentData?.reference_object || 'ID card').toString();
        const cardWidth = Number(componentData?.reference_width_cm);
        const cardHeight = Number(componentData?.reference_height_cm);

        const page1 = `
            <h5 style="margin:0 0 8px 0;">Visual Angle Calibration (Page 1/2)</h5>
            <div style="opacity:0.85; margin-bottom:10px;">Match the on-screen rectangle to a <b>${card}</b>.</div>
            <div style="display:flex; justify-content:center; margin:12px 0;">
                <div style="width:320px; height:200px; border:2px solid rgba(255,255,255,0.7); border-radius:10px;"></div>
            </div>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <label style="min-width:160px; opacity:0.8;">Adjust size</label>
                <input type="range" min="50" max="150" value="100" style="flex:1;" disabled />
                <span style="opacity:0.7;">(preview)</span>
            </div>
            <div style="margin-top:12px; font-size:12px; opacity:0.75;">
                <div><b>Reference size:</b> ${Number.isFinite(cardWidth) ? cardWidth : 'n/a'}cm × ${Number.isFinite(cardHeight) ? cardHeight : 'n/a'}cm</div>
                <div><b>Store key:</b> ${storeKey}</div>
            </div>
        `;

        const page2 = `
            <h5 style="margin:0 0 8px 0;">Visual Angle Calibration (Page 2/2)</h5>
            <div style="opacity:0.85; margin-bottom:10px;">Select your approximate viewing distance.</div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-top:10px;">
                <div style="display:flex; gap:12px; align-items:center; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); opacity:0.95;">
                    <img src="img/recline.png" alt="Recline" style="width:92px; height:70px; object-fit:contain; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background: rgba(0,0,0,0.25);" onerror="this.style.display='none'" />
                    <div>
                        <div style="font-weight:700;">Leaning back</div>
                        <div style="font-size:12px; opacity:0.75;">(example posture)</div>
                    </div>
                </div>

                <div style="display:flex; gap:12px; align-items:center; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); opacity:0.95;">
                    <img src="img/sitting.png" alt="Sitting" style="width:92px; height:70px; object-fit:contain; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background: rgba(0,0,0,0.25);" onerror="this.style.display='none'" />
                    <div>
                        <div style="font-weight:700;">Normal posture</div>
                        <div style="font-size:12px; opacity:0.75;">(example posture)</div>
                    </div>
                </div>

                <div style="display:flex; gap:12px; align-items:center; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); opacity:0.95;">
                    <img src="img/criss-cross.png" alt="Leaning forward" style="width:92px; height:70px; object-fit:contain; border-radius:10px; border:1px solid rgba(255,255,255,0.14); background: rgba(0,0,0,0.25);" onerror="this.style.display='none'" />
                    <div>
                        <div style="font-weight:700;">Leaning forward</div>
                        <div style="font-size:12px; opacity:0.75;">(example posture)</div>
                    </div>
                </div>

                <div style="display:flex; gap:12px; align-items:center; padding:12px; border-radius:14px; border:1px dashed rgba(255,255,255,0.22); background: rgba(255,255,255,0.04); opacity:0.9;">
                    <div style="width:92px; height:70px; display:flex; align-items:center; justify-content:center; border-radius:10px; border:1px dashed rgba(255,255,255,0.18); background: rgba(0,0,0,0.18); font-size:12px; opacity:0.8;">Manual</div>
                    <div>
                        <div style="font-weight:700;">Enter manually</div>
                        <div style="font-size:12px; opacity:0.75;">(optional)</div>
                    </div>
                </div>
            </div>
            <div style="margin-top:12px; font-size:12px; opacity:0.75;">
                This preview is static; the Interpreter screen is interactive.
            </div>
        `;

        modalBody.innerHTML = `
            <ul class="nav nav-tabs" role="tablist">
              <li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#vac_p1" type="button" role="tab">Page 1</button></li>
              <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#vac_p2" type="button" role="tab">Page 2</button></li>
            </ul>
            <div class="tab-content" style="margin-top:10px;">
              <div class="tab-pane fade show active" id="vac_p1" role="tabpanel">${this.wrapCenteredPreview(page1)}</div>
              <div class="tab-pane fade" id="vac_p2" role="tabpanel">${this.wrapCenteredPreview(page2)}</div>
            </div>
        `;

        modal.show();
    }

    showRewardSettingsPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const escapeHtml = (s) => {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const renderTemplate = (tpl, vars) => {
            const raw = (tpl ?? '').toString();
            return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
                const v = Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '';
                return (v === null || v === undefined) ? '' : String(v);
            });
        };

        const rewriteAssetRefsInHtml = (html) => {
            const raw = (html ?? '').toString();
            return raw.replace(/asset:\/\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/g, (full) => {
                const resolved = this.resolveMaybeAssetUrl(full);
                return resolved || full;
            });
        };

        const currency = (componentData?.currency_label || 'points').toString();
        const basis = (componentData?.scoring_basis || 'both').toString();
        const rtThresh = Number.isFinite(Number(componentData?.rt_threshold_ms)) ? Number(componentData.rt_threshold_ms) : 600;
        const pps = Number.isFinite(Number(componentData?.points_per_success)) ? Number(componentData.points_per_success) : 1;
        const instrTitle = (componentData?.instructions_title || 'Rewards').toString();
        const sumTitle = (componentData?.summary_title || 'Rewards Summary').toString();

        const varsInstr = {
            currency_label: currency,
            scoring_basis: basis,
            scoring_basis_label: basis,
            rt_threshold_ms: rtThresh,
            points_per_success: pps,
            continue_key_label: 'SPACE'
        };

        const instrHtml = componentData?.instructions_template_html
            ? rewriteAssetRefsInHtml(renderTemplate(componentData.instructions_template_html, varsInstr))
            : `<p>You can earn <b>${escapeHtml(currency)}</b> during the task.</p>`;

        const varsSum = {
            currency_label: currency,
            total_points: 12,
            rewarded_trials: 8,
            eligible_trials: 20,
            points_per_success: pps,
            rt_threshold_ms: rtThresh
        };

        const sumHtml = componentData?.summary_template_html
            ? rewriteAssetRefsInHtml(renderTemplate(componentData.summary_template_html, varsSum))
            : `<p>Total: <b>${varsSum.total_points}</b> ${escapeHtml(currency)}.</p>`;

        const instructionsScreen = `
            <h5 style="margin:0 0 10px 0;">${escapeHtml(instrTitle)}</h5>
            <div>${instrHtml}</div>
            <div style="margin-top:14px; font-size:12px; opacity:0.75;">
                <div><b>Scoring:</b> ${escapeHtml(basis)}</div>
                <div><b>RT threshold:</b> ${rtThresh}ms</div>
                <div><b>Points per success:</b> ${pps}</div>
            </div>
        `;

        const summaryScreen = `
            <h5 style="margin:0 0 10px 0;">${escapeHtml(sumTitle)}</h5>
            <div>${sumHtml}</div>
            <div style="margin-top:14px; font-size:12px; opacity:0.75;">Preview uses example totals.</div>
        `;

        modalBody.innerHTML = `
            <ul class="nav nav-tabs" role="tablist">
              <li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#rew_instr" type="button" role="tab">Instructions</button></li>
              <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#rew_sum" type="button" role="tab">Final summary</button></li>
            </ul>
            <div class="tab-content" style="margin-top:10px;">
              <div class="tab-pane fade show active" id="rew_instr" role="tabpanel">${this.wrapCenteredPreview(instructionsScreen)}</div>
              <div class="tab-pane fade" id="rew_sum" role="tabpanel">${this.wrapCenteredPreview(summaryScreen)}</div>
            </div>
        `;

        modal.show();
    }

    wrapSocSubtaskAsSession(subtaskComponentData) {
        const raw = (subtaskComponentData && typeof subtaskComponentData === 'object') ? subtaskComponentData : {};
        const merged = {
            ...raw,
            ...((raw.parameters && typeof raw.parameters === 'object') ? raw.parameters : {})
        };

        const type = (merged.type ?? raw.type ?? '').toString();

        const mapKind = (t) => {
            switch (t) {
                case 'soc-subtask-sart-like': return 'sart-like';
                case 'soc-subtask-flanker-like': return 'flanker-like';
                case 'soc-subtask-nback-like': return 'nback-like';
                case 'soc-subtask-wcst-like': return 'wcst-like';
                case 'soc-subtask-pvt-like': return 'pvt-like';
                default: return 'unknown';
            }
        };

        const defaults = window.jsonBuilderInstance?.getCurrentSocDashboardDefaults?.() || {};

        // Copy all non-identity fields into the subtask object (so the preview reflects modal params).
        const subtaskParams = {};
        for (const [k, v] of Object.entries(merged)) {
            if (k === 'type' || k === 'name' || k === 'title' || k === 'parameters') continue;
            subtaskParams[k] = v;
        }

        const subtask = {
            type: mapKind(type),
            title: (merged.title || merged.name || raw.title || raw.name || 'Subtask').toString(),
            ...subtaskParams
        };

        return {
            ...defaults,
            type: 'soc-dashboard',
            title: (defaults?.title ?? 'SOC Dashboard').toString(),
            // Ensure a single window representing the subtask.
            subtasks: [subtask],
            num_tasks: 1
        };
    }

    showSocDashboardPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">SOC Dashboard Preview</h5>
                        <div class="small text-muted">Vanilla prototype renderer (isolated)</div>
                    </div>
                    <div class="text-end small text-muted">
                        <div><strong>End key:</strong> ${(componentData?.end_key ?? 'escape').toString()}</div>
                        <div><strong>Duration:</strong> ${Number.isFinite(Number(componentData?.trial_duration_ms)) ? `${Number(componentData.trial_duration_ms)}ms` : 'n/a'}</div>
                    </div>
                </div>
                <div id="socDashboardPreviewHost" class="mt-2"></div>
            </div>
        `;

        const host = modalBody.querySelector('#socDashboardPreviewHost');
        if (host && window.SocDashboardPreview && typeof window.SocDashboardPreview.render === 'function') {
            // Tear down any previous preview instance first.
            try {
                if (this._socPreviewInstance && typeof this._socPreviewInstance.destroy === 'function') {
                    this._socPreviewInstance.destroy();
                }
            } catch {
                // ignore
            }

            this._socPreviewInstance = window.SocDashboardPreview.render(host, componentData);
        } else if (host) {
            host.innerHTML = '<div class="text-danger">SocDashboardPreview module not loaded.</div>';
        }

        // Cleanup any injected preview content on close
        if (!this._socPreviewCleanupBound) {
            this._socPreviewCleanupBound = true;
            modalEl.addEventListener('hidden.bs.modal', () => {
                try {
                    if (this._socPreviewInstance && typeof this._socPreviewInstance.destroy === 'function') {
                        this._socPreviewInstance.destroy();
                    }
                    this._socPreviewInstance = null;
                    const body = modalEl.querySelector('.modal-body');
                    if (body) body.innerHTML = '';
                } catch {
                    // ignore
                }
            });
        }

        modal.show();
    }

    showFlankerPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const congruency = (componentData?.congruency ?? 'congruent').toString();
        const leftKey = (componentData?.left_key ?? 'f').toString();
        const rightKey = (componentData?.right_key ?? 'j').toString();

        const stimulusType = (componentData?.stimulus_type ?? 'arrows').toString();
        const showFixationDot = !!(componentData?.show_fixation_dot ?? false);
        const showFixationCrossBetweenTrials = !!(componentData?.show_fixation_cross_between_trials ?? false);

        // Arrow mode (back-compat)
        const targetDir = (componentData?.target_direction ?? 'left').toString();
        const arrowLeft = '←';
        const arrowRight = '→';

        // Generic symbol mode
        const targetStimulusRaw = (componentData?.target_stimulus ?? 'H').toString();
        const distractorStimulusRaw = (componentData?.distractor_stimulus ?? 'S').toString();
        const neutralStimulusRaw = (componentData?.neutral_stimulus ?? '–').toString();

        let center;
        let flank;

        if (stimulusType === 'arrows') {
            center = (targetDir === 'right') ? arrowRight : arrowLeft;
            flank = center;
            if (congruency === 'incongruent') {
                flank = (center === arrowRight) ? arrowLeft : arrowRight;
            } else if (congruency === 'neutral') {
                flank = neutralStimulusRaw;
            }
        } else {
            // Letters/symbols/custom: congruent = same as center; incongruent = distractor; neutral = neutral symbol
            center = targetStimulusRaw;
            flank = targetStimulusRaw;
            if (congruency === 'incongruent') {
                flank = distractorStimulusRaw;
            } else if (congruency === 'neutral') {
                flank = neutralStimulusRaw;
            }
        }

        // Standard 5-item array: two flankers on each side
        const stim = `${flank}${flank}${center}${flank}${flank}`;

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const hasBlockSource = !!componentData?._blockPreviewSource;

        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">Flanker Preview</h5>
                            <div class="small text-muted">Lightweight renderer (safe to reuse in interpreter)</div>
                            ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                        </div>
                        <div class="text-end small text-muted">
                            <div><strong>Congruency:</strong> ${escape(congruency)}</div>
                            <div><strong>Stimulus type:</strong> ${escape(stimulusType)}</div>
                            ${stimulusType === 'arrows' ? `<div><strong>Target:</strong> ${escape(targetDir)}</div>` : ''}
                        </div>
                    </div>

                    <div class="border rounded mt-3 p-4 d-flex justify-content-center align-items-center" style="background:#111; color:#fff; min-height: 160px;">
                        <div class="text-center">
                            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 64px; letter-spacing: 0.25em;">
                                ${escape(stim)}
                            </div>
                            ${showFixationDot ? `<div class="mt-2" style="font-size: 28px; line-height: 1; opacity: 0.9;">•</div>` : ''}
                        </div>
                    </div>

                    ${showFixationCrossBetweenTrials ? `
                        <div class="mt-3 border rounded p-3" style="background:#0b0b0b; color:#ddd;">
                            <div class="small text-muted mb-2">Between-trials fixation</div>
                            <div class="d-flex justify-content-center" style="font-size: 36px;">+</div>
                        </div>
                    ` : ''}

                    <div class="mt-3 small text-muted">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                Response mapping: <strong>${escape(leftKey)}</strong> = left, <strong>${escape(rightKey)}</strong> = right.
                                ${componentData?.detection_response_task_enabled ? '<br><span class="badge bg-warning text-dark">DRT enabled</span>' : ''}
                            </div>
                            ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="flankerResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Optional block resample
            if (hasBlockSource) {
                const btn = modalBody.querySelector('#flankerResampleBtn');
                if (btn) {
                    btn.onclick = () => {
                        const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                        const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'flanker-trial';
                        const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                        const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                        sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                        sampled._blockPreviewSource = componentData._blockPreviewSource;
                        this.showFlankerPreview(sampled);
                    };
                }
            }
        }

        modal.show();
    }

    showSartPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const digit = (componentData?.digit ?? 1);
        const nogo = (componentData?.nogo_digit ?? 3);
        const goKey = (componentData?.go_key ?? 'space').toString();
        const isNoGo = Number(digit) === Number(nogo);

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const hasBlockSource = !!componentData?._blockPreviewSource;

        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">SART Preview</h5>
                            <div class="small text-muted">Lightweight renderer (safe to reuse in interpreter)</div>
                            ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                        </div>
                        <div class="text-end small text-muted">
                            <div><strong>Go key:</strong> ${escape(goKey)}</div>
                            <div><strong>No-go digit:</strong> ${escape(nogo)}</div>
                        </div>
                    </div>

                    <div class="border rounded mt-3 p-4 d-flex justify-content-center align-items-center" style="background:#111; color:#fff; min-height: 180px;">
                        <div class="text-center">
                            <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-size: 96px; line-height: 1;">
                                ${escape(digit)}
                            </div>
                            <div class="mt-3 small ${isNoGo ? 'text-warning' : 'text-muted'}">
                                ${isNoGo ? 'NO-GO (withhold response)' : `GO (press ${escape(goKey)})`}
                            </div>
                        </div>
                    </div>

                    <div class="mt-3 small text-muted">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                ${componentData?.detection_response_task_enabled ? '<span class="badge bg-warning text-dark">DRT enabled</span>' : ''}
                            </div>
                            ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="sartResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                        </div>
                    </div>
                </div>
            `;

            if (hasBlockSource) {
                const btn = modalBody.querySelector('#sartResampleBtn');
                if (btn) {
                    btn.onclick = () => {
                        const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                        const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'sart-trial';
                        const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                        const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                        sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                        sampled._blockPreviewSource = componentData._blockPreviewSource;
                        this.showSartPreview(sampled);
                    };
                }
            }
        }

        modal.show();
    }

    showStroopPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modalEl, modal } = previewModal;

        const modalBody = modalEl.querySelector('.modal-body');
        if (!modalBody) return;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const isHex = (s) => typeof s === 'string' && /^#([0-9a-fA-F]{6})$/.test(s.trim());

        const fallbackStimuli = (() => {
            try {
                const list = window.jsonBuilderInstance?.getCurrentStroopStimuliFromUI?.();
                return Array.isArray(list) ? list : [];
            } catch {
                return [];
            }
        })();

        const stimuli = Array.isArray(componentData?.stroop_settings?.stimuli)
            ? componentData.stroop_settings.stimuli
            : fallbackStimuli;

        const nameToHex = new Map(
            (Array.isArray(stimuli) ? stimuli : [])
                .filter(s => s && typeof s === 'object')
                .map(s => [String(s.name ?? '').trim().toLowerCase(), String(s.color ?? '').trim()])
                .filter(([k, v]) => !!k && !!v)
        );

        const resolveHexForName = (name) => {
            const raw = (name ?? '').toString().trim();
            if (isHex(raw)) return raw;
            const hit = nameToHex.get(raw.toLowerCase());
            return hit || '#ffffff';
        };

        const word = (componentData?.word ?? stimuli?.[0]?.name ?? 'RED').toString();
        const inkName = (componentData?.ink_color_name ?? stimuli?.[1]?.name ?? stimuli?.[0]?.name ?? 'BLUE').toString();
        const inkHex = resolveHexForName(inkName);

        const computedCongruency = (word.trim().toLowerCase() === inkName.trim().toLowerCase()) ? 'congruent' : 'incongruent';
        const congruency = (componentData?.congruency ?? 'auto').toString();
        const congruencyLabel = (congruency === 'auto') ? `auto → ${computedCongruency}` : congruency;

        const resolveInherit = (v, fallback) => {
            const s = (v ?? '').toString().trim();
            if (s === '' || s === 'inherit') return fallback;
            return s;
        };

        // For Block previews (and Trial previews that omit stroop_settings), fall back to the
        // current experiment-wide Stroop defaults in the Builder UI.
        const uiDefaults = (() => {
            try {
                return window.jsonBuilderInstance?.getCurrentStroopDefaults?.() || null;
            } catch {
                return null;
            }
        })();

        const defaults = (componentData?.stroop_settings && typeof componentData.stroop_settings === 'object')
            ? componentData.stroop_settings
            : (uiDefaults?.stroop_settings && typeof uiDefaults.stroop_settings === 'object')
                ? uiDefaults.stroop_settings
                : {};

        const responseModeRaw = resolveInherit(componentData?.response_mode, defaults?.response_mode || uiDefaults?.response_mode || 'color_naming');
        const responseDevice = resolveInherit(componentData?.response_device, defaults?.response_device || uiDefaults?.response_device || 'keyboard');
        // Mouse mode always behaves like color naming (click the color); don't show keyboard-only congruency mapping.
        const responseMode = (responseDevice === 'mouse') ? 'color_naming' : responseModeRaw;

        const congruentKey = resolveInherit(componentData?.congruent_key, defaults?.congruent_key || 'f');
        const incongruentKey = resolveInherit(componentData?.incongruent_key, defaults?.incongruent_key || 'j');

        const choiceKeys = (() => {
            const raw = componentData?.choice_keys ?? defaults?.choice_keys;
            if (Array.isArray(raw)) return raw.map(s => (s ?? '').toString());
            if (typeof raw === 'string') {
                return raw.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
        })();

        const mappingHtml = (() => {
            if (responseDevice === 'mouse') {
                const names = (Array.isArray(stimuli) ? stimuli : [])
                    .map(s => (s?.name ?? '').toString())
                    .map(s => s.trim())
                    .filter(Boolean);

                const swatches = names.map(n => {
                    const hex = resolveHexForName(n);
                    return `
                        <div class="d-inline-flex align-items-center me-2 mb-2" style="gap:6px;">
                            <span style="display:inline-block; width:14px; height:14px; border-radius:4px; background:${escape(hex)}; border:1px solid rgba(255,255,255,0.22);"></span>
                            <span>${escape(n)}</span>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="small text-muted">
                        <div class="mb-1"><b>Mouse mapping:</b> click the correct ink color</div>
                        <div>${swatches || '<div class="text-warning">No stimulus library available.</div>'}</div>
                    </div>
                `;
            }

            if (responseMode === 'congruency') {
                return `
                    <div class="small text-muted">
                        <div><b>Keyboard:</b> <span class="badge bg-secondary">${escape(congruentKey)}</span> = Congruent</div>
                        <div><b>Keyboard:</b> <span class="badge bg-secondary">${escape(incongruentKey)}</span> = Incongruent</div>
                    </div>
                `;
            }

            const names = (Array.isArray(stimuli) ? stimuli : []).map(s => (s?.name ?? '').toString()).filter(Boolean);
            const rows = names.map((n, i) => {
                const k = choiceKeys[i] ?? `${i + 1}`;
                return `<div><span class="badge bg-secondary">${escape(k)}</span> = ${escape(n)}</div>`;
            }).join('');

            return `
                <div class="small text-muted">
                    <div class="mb-1"><b>Color naming mapping:</b></div>
                    ${rows || '<div class="text-warning">No stimulus library available to build mapping.</div>'}
                </div>
            `;
        })();

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const deviceNote = (responseDevice === 'mouse')
            ? '<div class="small text-muted mt-2">Mouse mode: participant clicks the correct color.</div>'
            : '';

        const hasBlockSource = !!componentData?._blockPreviewSource;

        const fontSizePx = Number.isFinite(Number(componentData?.stimulus_font_size_px)) ? Number(componentData.stimulus_font_size_px) : 64;

        const body = `
            <div class="p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">Stroop Preview</h5>
                        <div class="small text-muted">Lightweight renderer</div>
                        ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                    </div>
                    <div class="text-end small text-muted">
                        <div><strong>Word:</strong> ${escape(word)}</div>
                        <div><strong>Ink:</strong> ${escape(inkName)} <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background:${escape(inkHex)}; border:1px solid rgba(255,255,255,0.18);"></span></div>
                        <div><strong>Congruency:</strong> ${escape(congruencyLabel)}</div>
                        <div><strong>Response:</strong> ${escape(responseMode)} (${escape(responseDevice)})</div>
                    </div>
                </div>

                <div class="border rounded mt-3 p-4 d-flex justify-content-center align-items-center" style="background:#111; color:#fff; min-height: 220px;">
                    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-weight: 800; letter-spacing: 0.02em; font-size:${fontSizePx}px; line-height:1; color:${escape(inkHex)}; text-transform:uppercase;">
                        ${escape(word)}
                    </div>
                </div>

                <div class="mt-3">${mappingHtml}${deviceNote}</div>

                <div class="mt-3 small text-muted d-flex justify-content-between align-items-center">
                    <div>${escape((componentData?.detection_response_task_enabled ? 'DRT enabled' : ''))}</div>
                    ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="stroopResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                </div>
            </div>
        `;

        modalBody.innerHTML = body;

        if (hasBlockSource) {
            const btn = modalBody.querySelector('#stroopResampleBtn');
            if (btn) {
                btn.onclick = () => {
                    const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                    const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'stroop-trial';
                    const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                    const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                    sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                    sampled._blockPreviewSource = componentData._blockPreviewSource;
                    this.showStroopPreview(sampled);
                };
            }
        }

        modal.show();
    }

    showGaborPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const targetLocation = (componentData?.target_location ?? 'left').toString();
        const targetTilt = Number(componentData?.target_tilt_deg ?? 45);
        const distractorOrientation = Number(componentData?.distractor_orientation_deg ?? 0);
        const spatialCue = (componentData?.spatial_cue ?? 'none').toString();
        const leftValue = (componentData?.left_value ?? 'neutral').toString();
        const rightValue = (componentData?.right_value ?? 'neutral').toString();

        const responseTask = (componentData?.response_task ?? 'discriminate_tilt').toString();
        const leftKey = (componentData?.left_key ?? 'f').toString();
        const rightKey = (componentData?.right_key ?? 'j').toString();
        const yesKey = (componentData?.yes_key ?? 'f').toString();
        const noKey = (componentData?.no_key ?? 'j').toString();

        // Prefer per-component preview colors; fall back to current defaults panel if present.
        const panelHigh = document.getElementById('gaborHighValueColor')?.value;
        const panelLow = document.getElementById('gaborLowValueColor')?.value;
        const highColor = (componentData?.high_value_color ?? panelHigh ?? '#00aa00').toString();
        const lowColor = (componentData?.low_value_color ?? panelLow ?? '#0066ff').toString();
        const neutralColor = '#666666';

        const panelFreqRaw = document.getElementById('gaborSpatialFrequency')?.value;
        const panelFreq = (panelFreqRaw !== undefined && panelFreqRaw !== null && `${panelFreqRaw}` !== '')
            ? Number.parseFloat(panelFreqRaw)
            : null;
        const spatialFrequency = Number(componentData?.spatial_frequency_cyc_per_px ?? panelFreq ?? 0.06);
        const gratingWaveform = (componentData?.grating_waveform ?? document.getElementById('gaborGratingWaveform')?.value ?? 'sinusoidal').toString();

        const frameColorForValue = (v) => {
            if (v === 'high') return highColor;
            if (v === 'low') return lowColor;
            return neutralColor;
        };

        const leftAngle = (targetLocation === 'left') ? targetTilt : distractorOrientation;
        const rightAngle = (targetLocation === 'right') ? targetTilt : distractorOrientation;

        const noteText = (componentData?._previewContextNote ?? '').toString();
        const hasBlockSource = !!componentData?._blockPreviewSource;

        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">Gabor Preview</h5>
                            <div class="small text-muted">Canvas renderer (actual Gabor gratings)</div>
                            ${noteText ? `<div class="small text-muted">${escape(noteText)}</div>` : ''}
                        </div>
                        <div class="text-end small text-muted">
                            <div><strong>Target:</strong> ${escape(targetLocation)}</div>
                            <div><strong>Spatial cue:</strong> ${escape(spatialCue)}</div>
                            <div><strong>Response:</strong> ${escape(responseTask)}</div>
                        </div>
                    </div>

                    <div class="border rounded mt-3 p-2" style="background:#0f0f0f;">
                        <canvas id="gaborPreviewCanvas" width="720" height="320" style="width:100%; height:auto; display:block;"></canvas>
                        <div class="mt-2 small text-muted d-flex justify-content-between">
                            <div><strong>Left value:</strong> ${escape(leftValue)}</div>
                            <div><strong>Right value:</strong> ${escape(rightValue)}</div>
                        </div>
                    </div>

                    <div class="mt-3 small text-muted">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                ${responseTask === 'detect_target'
                                    ? `Yes/No: <strong>${escape(yesKey)}</strong>/<strong>${escape(noKey)}</strong>`
                                    : `Left/Right: <strong>${escape(leftKey)}</strong>/<strong>${escape(rightKey)}</strong>`}
                                ${componentData?.detection_response_task_enabled ? '<br><span class="badge bg-warning text-dark">DRT enabled</span>' : ''}
                            </div>
                            ${hasBlockSource ? `<button type="button" class="btn btn-sm btn-outline-secondary" id="gaborResampleBtn"><i class="fas fa-dice"></i> Resample</button>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Render actual Gabor patches
            const canvas = modalBody.querySelector('#gaborPreviewCanvas');
            if (canvas) {
                this.renderGaborTrialToCanvas(canvas, {
                    spatialCue,
                    leftFrameColor: frameColorForValue(leftValue),
                    rightFrameColor: frameColorForValue(rightValue),
                    leftAngle,
                    rightAngle,
                    spatialFrequency,
                    gratingWaveform
                });
            }

            if (hasBlockSource) {
                const btn = modalBody.querySelector('#gaborResampleBtn');
                if (btn) {
                    btn.onclick = () => {
                        const sampled = this.sampleComponentFromBlock(componentData._blockPreviewSource);
                        const baseType = componentData._blockPreviewSource.block_component_type || componentData._blockPreviewSource.component_type || 'gabor-trial';
                        const length = componentData._blockPreviewSource.block_length ?? componentData._blockPreviewSource.length ?? 0;
                        const sampling = componentData._blockPreviewSource.sampling_mode || 'per-trial';
                        sampled._previewContextNote = `Block sample → ${baseType} (length ${length}, ${sampling})`;
                        sampled._blockPreviewSource = componentData._blockPreviewSource;
                        this.showGaborPreview(sampled);
                    };
                }
            }
        }

        modal.show();
    }

    renderGaborTrialToCanvas(canvas, { spatialCue, leftFrameColor, rightFrameColor, leftAngle, rightAngle, spatialFrequency, gratingWaveform }) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(0, 0, w, h);

        // Layout
        const pad = 24;
        const patchSize = Math.min(200, Math.floor((w - pad * 2) / 3));
        const frameSize = patchSize + 44;
        const cy = Math.floor(h * 0.60);
        const leftCx = Math.floor(w * 0.32);
        const rightCx = Math.floor(w * 0.68);

        // Cue
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '36px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cueText = (spatialCue === 'left') ? '←' : (spatialCue === 'right') ? '→' : (spatialCue === 'both') ? '↔' : '';
        if (cueText) {
            ctx.fillText(cueText, Math.floor(w / 2), Math.floor(h * 0.18));
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
            ctx.fillText('(no spatial cue)', Math.floor(w / 2), Math.floor(h * 0.18));
        }

        // Frames
        this.drawRoundedRectStroke(ctx, leftCx - frameSize / 2, cy - frameSize / 2, frameSize, frameSize, 16, leftFrameColor, 6);
        this.drawRoundedRectStroke(ctx, rightCx - frameSize / 2, cy - frameSize / 2, frameSize, frameSize, 16, rightFrameColor, 6);

        // Gabor patches
        this.drawGaborPatch(ctx, leftCx, cy, patchSize, leftAngle, { spatialFrequency, gratingWaveform });
        this.drawGaborPatch(ctx, rightCx, cy, patchSize, rightAngle, { spatialFrequency, gratingWaveform });

        // Fixation
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        const fx = Math.floor(w / 2);
        const fy = cy;
        ctx.beginPath();
        ctx.moveTo(fx - 10, fy);
        ctx.lineTo(fx + 10, fy);
        ctx.moveTo(fx, fy - 10);
        ctx.lineTo(fx, fy + 10);
        ctx.stroke();
    }

    drawRoundedRectStroke(ctx, x, y, width, height, radius, strokeStyle, lineWidth) {
        const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawGaborPatch(ctx, centerX, centerY, sizePx, orientationDeg, { spatialFrequency, gratingWaveform } = {}) {
        const w = Math.max(8, Math.floor(sizePx));
        const h = w;
        const r = Math.floor(w / 2);
        const theta = (Number.isFinite(orientationDeg) ? orientationDeg : 0) * Math.PI / 180;

        // Frequency: cycles per pixel (tuned for preview visibility)
        const freq = (Number.isFinite(Number(spatialFrequency)) && Number(spatialFrequency) > 0)
            ? Number(spatialFrequency)
            : 0.06;
        const waveform = (gratingWaveform || 'sinusoidal').toString();
        const sigma = w / 6;
        const contrast = 0.95;
        const phase = 0;

        const img = ctx.createImageData(w, h);
        const data = img.data;

        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const twoSigma2 = 2 * sigma * sigma;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dx = x - r;
                const dy = y - r;
                const rr = dx * dx + dy * dy;
                const idx = (y * w + x) * 4;

                // Circular aperture with alpha outside
                if (rr > r * r) {
                    data[idx + 0] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                    data[idx + 3] = 0;
                    continue;
                }

                // Rotate coordinates
                const xRot = dx * cosT + dy * sinT;

                const envelope = Math.exp(-(rr) / twoSigma2);
                const angle = 2 * Math.PI * freq * xRot + phase;
                let carrier = Math.cos(angle);
                if (waveform === 'square') {
                    carrier = (carrier >= 0) ? 1 : -1;
                } else if (waveform === 'triangle') {
                    // Triangle in [-1,1]
                    carrier = (2 / Math.PI) * Math.asin(Math.sin(angle));
                }

                const val = 127.5 + 127.5 * contrast * envelope * carrier;
                const v = Math.max(0, Math.min(255, Math.round(val)));

                data[idx + 0] = v;
                data[idx + 1] = v;
                data[idx + 2] = v;
                data[idx + 3] = 255;
            }
        }

        // NOTE: putImageData ignores the current transform matrix, so we must
        // provide absolute coordinates.
        ctx.putImageData(img, Math.round(centerX - r), Math.round(centerY - r));

        // Soft outline
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    showSurveyPreview(componentData) {
        const previewModal = this.getPreviewModal();
        if (!previewModal) return;
        const { modal } = previewModal;

        // Support both flat storage (preferred) and nested storage under `parameters`.
        const title = componentData?.title ?? componentData?.parameters?.title ?? 'Survey';
        const instructions = componentData?.instructions ?? componentData?.parameters?.instructions ?? '';
        const submitLabel = componentData?.submit_label ?? componentData?.parameters?.submit_label ?? 'Continue';
        const allowEmptyOnTimeout = !!(componentData?.allow_empty_on_timeout ?? componentData?.parameters?.allow_empty_on_timeout ?? false);
        const timeoutMs = (componentData?.timeout_ms ?? componentData?.parameters?.timeout_ms ?? null);
        const questions = Array.isArray(componentData?.questions)
            ? componentData.questions
            : (Array.isArray(componentData?.parameters?.questions) ? componentData.parameters.questions : []);

        const escape = (s) => {
            return (s ?? '')
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const renderQuestion = (q) => {
            const id = escape(q?.id || 'q');
            const prompt = escape(q?.prompt || '');
            const required = q?.required ? 'required' : '';
            const type = (q?.type || 'text');

            if (type === 'likert' || type === 'radio') {
                const options = Array.isArray(q?.options) ? q.options : [];
                const optionsHtml = options
                    .map((opt, idx) => {
                        const optEsc = escape(opt);
                        const inputType = 'radio';
                        return `
                            <div class="form-check">
                                <input class="form-check-input" type="${inputType}" name="${id}" id="${id}_${idx}" ${required}>
                                <label class="form-check-label" for="${id}_${idx}">${optEsc}</label>
                            </div>
                        `;
                    })
                    .join('');
                return `
                    <div class="mb-3">
                        <label class="form-label fw-bold">${prompt || id}${q?.required ? ' *' : ''}</label>
                        ${optionsHtml || '<div class="text-muted">(No options configured)</div>'}
                    </div>
                `;
            }

            if (type === 'slider') {
                const min = Number.isFinite(Number(q?.min)) ? Number(q.min) : 0;
                const max = Number.isFinite(Number(q?.max)) ? Number(q.max) : 100;
                const step = Number.isFinite(Number(q?.step)) ? Number(q.step) : 1;
                const minLabel = escape(q?.min_label || '');
                const maxLabel = escape(q?.max_label || '');
                return `
                    <div class="mb-3">
                        <label class="form-label fw-bold" for="${id}">${prompt || id}${q?.required ? ' *' : ''}</label>
                        <input class="form-range" type="range" id="${id}" min="${min}" max="${max}" step="${step}" ${required}>
                        <div class="d-flex justify-content-between small text-muted">
                            <span>${minLabel || min}</span>
                            <span>${maxLabel || max}</span>
                        </div>
                    </div>
                `;
            }

            if (type === 'number') {
                const minAttr = (q?.min !== undefined && q?.min !== null && q?.min !== '') ? `min="${escape(q.min)}"` : '';
                const maxAttr = (q?.max !== undefined && q?.max !== null && q?.max !== '') ? `max="${escape(q.max)}"` : '';
                const stepAttr = (q?.step !== undefined && q?.step !== null && q?.step !== '') ? `step="${escape(q.step)}"` : '';
                const ph = escape(q?.placeholder || '');
                return `
                    <div class="mb-3">
                        <label class="form-label fw-bold" for="${id}">${prompt || id}${q?.required ? ' *' : ''}</label>
                        <input class="form-control" type="number" id="${id}" name="${id}" placeholder="${ph}" ${minAttr} ${maxAttr} ${stepAttr} ${required}>
                    </div>
                `;
            }

            // text
            const multiline = !!q?.multiline;
            const ph = escape(q?.placeholder || '');
            const rows = Number.isFinite(Number(q?.rows)) ? Math.max(1, Number(q.rows)) : 3;
            return `
                <div class="mb-3">
                    <label class="form-label fw-bold" for="${id}">${prompt || id}${q?.required ? ' *' : ''}</label>
                    ${multiline
                        ? `<textarea class="form-control" id="${id}" name="${id}" rows="${rows}" placeholder="${ph}" ${required}></textarea>`
                        : `<input class="form-control" type="text" id="${id}" name="${id}" placeholder="${ph}" ${required}>`
                    }
                </div>
            `;
        };

        const modalBody = document.querySelector('#componentPreviewModal .modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="survey-preview-container">
                    <h5 class="mb-1">${escape(title)}</h5>
                    ${instructions ? `<p class="text-muted">${escape(instructions)}</p>` : ''}
                    ${(allowEmptyOnTimeout && timeoutMs !== null && timeoutMs !== '')
                        ? `<div class="alert alert-warning py-2 small mb-2">Auto-continue enabled after <strong>${escape(timeoutMs)}</strong> ms (unanswered = empty/null).</div>`
                        : ''}
                    <form onsubmit="return false;" class="mt-3">
                        ${questions.map(renderQuestion).join('')}
                        <button type="button" class="btn btn-primary">${escape(submitLabel)}</button>
                        <div class="mt-2 small text-muted">
                            Preview only — the interpreter app should capture and store responses by question id.
                            ${questions.length === 0 ? '<br><strong>Note:</strong> No questions found on this component. (Expected `questions: [...]`.)' : ''}
                        </div>
                    </form>
                </div>
            `;
        }

        modal.show();
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

        if (baseType === 'flanker-trial') {
            this.showFlankerPreview(sampled);
            return;
        }

        if (baseType === 'sart-trial') {
            this.showSartPreview(sampled);
            return;
        }

        if (baseType === 'gabor-trial' || baseType === 'gabor-quest') {
            this.showGaborPreview(sampled);
            return;
        }

        if (baseType === 'stroop-trial') {
            this.showStroopPreview(sampled);
            return;
        }

        if (baseType === 'simon-trial') {
            this.showSimonPreview(sampled);
            return;
        }

        if (baseType === 'pvt-trial') {
            this.showPvtPreview(sampled);
            return;
        }

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
        // Some builder flows store block parameter fields under `parameter_values`.
        // Normalize into a single flat object so previews work from either shape.
            const src = (blockData && typeof blockData === 'object' && blockData.parameter_values && typeof blockData.parameter_values === 'object')
            ? { ...blockData, ...blockData.parameter_values }
            : blockData;

        const rng = this.getBlockRng(src);
        const rawType = src?.block_component_type || src?.component_type;
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

        const parseStringList = (raw) => {
            if (raw === undefined || raw === null) return [];
            return raw
                .toString()
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        };

        // Start with a minimal component data shape compatible with showRDMPreview()
        const sampled = { type: componentType };

        // Pass through per-block response cue settings (dot-groups)
        if (src?.response_target_group !== undefined) sampled.response_target_group = src.response_target_group;
        if (src?.cue_border_mode !== undefined) sampled.cue_border_mode = src.cue_border_mode;
        if (src?.cue_border_color !== undefined) sampled.cue_border_color = src.cue_border_color;
        if (src?.cue_border_width !== undefined) sampled.cue_border_width = src.cue_border_width;

        // Pass through per-block aperture outline settings (all RDM types)
        // New export nests these under `aperture_parameters`, but keep flat-field support for older configs.
        if (src?.aperture_parameters && typeof src.aperture_parameters === 'object') {
            sampled.aperture_parameters = { ...src.aperture_parameters };
        }
        if (src?.show_aperture_outline_mode !== undefined) sampled.show_aperture_outline_mode = src.show_aperture_outline_mode;
        if (src?.show_aperture_outline !== undefined) sampled.show_aperture_outline = src.show_aperture_outline;
        if (src?.aperture_outline_width !== undefined) sampled.aperture_outline_width = src.aperture_outline_width;
        if (src?.aperture_outline_color !== undefined) sampled.aperture_outline_color = src.aperture_outline_color;

        if (componentType === 'rdm-trial') {
            const coherence = randFloat(src.coherence_min, src.coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            const speed = randFloat(src.speed_min, src.speed_max);
            if (speed !== null) sampled.speed = speed;

            const dirs = parseNumberList(src.direction_options);
            sampled.direction = pickFromList(dirs, 0);

            if (typeof src.dot_color === 'string' && src.dot_color.trim() !== '') {
                sampled.dot_color = src.dot_color;
            }
        } else if (componentType === 'rdm-practice') {
            const coherence = randFloat(src.practice_coherence_min, src.practice_coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            const dirs = parseNumberList(src.practice_direction_options);
            sampled.direction = pickFromList(dirs, 0);

            // Feedback window isn't directly visualized, but keep it on the payload for completeness.
            const feedback = randInt(src.practice_feedback_duration_min, src.practice_feedback_duration_max);
            if (feedback !== null) sampled.feedback_duration = feedback;

            if (typeof src.dot_color === 'string' && src.dot_color.trim() !== '') {
                sampled.dot_color = src.dot_color;
            }
        } else if (componentType === 'rdm-adaptive') {
            // Preview a single plausible stimulus instance by sampling initial_coherence → coherence.
            const coherence = randFloat(src.adaptive_initial_coherence_min, src.adaptive_initial_coherence_max);
            if (coherence !== null) sampled.coherence = Math.max(0, Math.min(1, coherence));

            if (typeof src.dot_color === 'string' && src.dot_color.trim() !== '') {
                sampled.dot_color = src.dot_color;
            }
        } else if (componentType === 'rdm-dot-groups') {
            // Percentages: sample group_1 and set group_2 = 100 - group_1
            const g1Pct = randInt(src.group_1_percentage_min, src.group_1_percentage_max);
            const safeG1Pct = (g1Pct === null) ? 50 : Math.max(0, Math.min(100, g1Pct));
            sampled.group_1_percentage = safeG1Pct;
            sampled.group_2_percentage = 100 - safeG1Pct;

            const g1C = randFloat(src.group_1_coherence_min, src.group_1_coherence_max);
            if (g1C !== null) sampled.group_1_coherence = Math.max(0, Math.min(1, g1C));
            const g2C = randFloat(src.group_2_coherence_min, src.group_2_coherence_max);
            if (g2C !== null) sampled.group_2_coherence = Math.max(0, Math.min(1, g2C));

            const g1S = randFloat(src.group_1_speed_min, src.group_1_speed_max);
            if (g1S !== null) sampled.group_1_speed = g1S;
            const g2S = randFloat(src.group_2_speed_min, src.group_2_speed_max);
            if (g2S !== null) sampled.group_2_speed = g2S;

            const g1Dirs = parseNumberList(src.group_1_direction_options);
            sampled.group_1_direction = pickFromList(g1Dirs, 0);
            const g2Dirs = parseNumberList(src.group_2_direction_options);
            sampled.group_2_direction = pickFromList(g2Dirs, 180);

            const fallback = (typeof src.dot_color === 'string' && src.dot_color.trim() !== '') ? src.dot_color : null;
            sampled.group_1_color = (typeof src.group_1_color === 'string' && src.group_1_color.trim() !== '') ? src.group_1_color : (fallback || '#FF0066');
            sampled.group_2_color = (typeof src.group_2_color === 'string' && src.group_2_color.trim() !== '') ? src.group_2_color : (fallback || '#0066FF');
        } else if (componentType === 'flanker-trial') {
            const congruency = parseStringList(src.flanker_congruency_options);
            sampled.congruency = pickFromList(congruency, 'congruent');

            // Optional stimulus type and symbol options
            const stimType = (src.flanker_stimulus_type || 'arrows').toString();
            sampled.stimulus_type = stimType;
            const isArrows = stimType.trim().toLowerCase() === 'arrows' || stimType.trim() === '';

            if (isArrows) {
                const dirs = parseStringList(src.flanker_target_direction_options);
                sampled.target_direction = pickFromList(dirs, 'left');
            } else {
                const tOpts = parseStringList(src.flanker_target_stimulus_options);
                const dOpts = parseStringList(src.flanker_distractor_stimulus_options);
                const nOpts = parseStringList(src.flanker_neutral_stimulus_options);
                sampled.target_stimulus = pickFromList(tOpts, 'H');
                sampled.distractor_stimulus = pickFromList(dOpts, 'S');
                sampled.neutral_stimulus = pickFromList(nOpts, '–');
            }

            sampled.left_key = (src.flanker_left_key || 'f').toString();
            sampled.right_key = (blockData.flanker_right_key || 'j').toString();
            sampled.show_fixation_dot = !!(blockData.flanker_show_fixation_dot ?? false);
            sampled.show_fixation_cross_between_trials = !!(blockData.flanker_show_fixation_cross_between_trials ?? false);

            const stimMs = randInt(blockData.flanker_stimulus_duration_min, blockData.flanker_stimulus_duration_max);
            if (stimMs !== null) sampled.stimulus_duration_ms = stimMs;

            const trialMs = randInt(blockData.flanker_trial_duration_min, blockData.flanker_trial_duration_max);
            if (trialMs !== null) sampled.trial_duration_ms = trialMs;

            const iti = randInt(blockData.flanker_iti_min, blockData.flanker_iti_max);
            if (iti !== null) sampled.iti_ms = iti;
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

            const digits = parseIntList(blockData.sart_digit_options);
            sampled.digit = pickFromList(digits, 1);

            const nogo = Number.parseInt(blockData.sart_nogo_digit, 10);
            if (Number.isFinite(nogo)) sampled.nogo_digit = nogo;

            sampled.go_key = (blockData.sart_go_key || 'space').toString();

            const stimMs = randInt(blockData.sart_stimulus_duration_min, blockData.sart_stimulus_duration_max);
            if (stimMs !== null) sampled.stimulus_duration_ms = stimMs;
            const maskMs = randInt(blockData.sart_mask_duration_min, blockData.sart_mask_duration_max);
            if (maskMs !== null) sampled.mask_duration_ms = maskMs;

            const trialMs = randInt(blockData.sart_trial_duration_min, blockData.sart_trial_duration_max);
            if (trialMs !== null) sampled.trial_duration_ms = trialMs;

            const iti = randInt(blockData.sart_iti_min, blockData.sart_iti_max);
            if (iti !== null) sampled.iti_ms = iti;
        } else if (componentType === 'simon-trial') {
            const colors = parseStringList(src.simon_color_options);
            sampled.stimulus_color_name = pickFromList(colors, 'BLUE');

            const sides = parseStringList(src.simon_side_options);
            sampled.stimulus_side = pickFromList(sides, 'left');

            sampled.response_device = (src.simon_response_device || 'inherit').toString();
            sampled.left_key = (src.simon_left_key || 'f').toString();
            sampled.right_key = (src.simon_right_key || 'j').toString();

            const stimMs = randInt(src.simon_stimulus_duration_min, src.simon_stimulus_duration_max);
            if (stimMs !== null) sampled.stimulus_duration_ms = stimMs;

            const trialMs = randInt(src.simon_trial_duration_min, src.simon_trial_duration_max);
            if (trialMs !== null) sampled.trial_duration_ms = trialMs;

            const iti = randInt(src.simon_iti_min, src.simon_iti_max);
            if (iti !== null) sampled.iti_ms = iti;
        } else if (componentType === 'pvt-trial') {
            sampled.response_device = (src.pvt_response_device || 'inherit').toString();
            sampled.response_key = (src.pvt_response_key || 'space').toString();

            const fp = randInt(src.pvt_foreperiod_min, src.pvt_foreperiod_max);
            if (fp !== null) sampled.foreperiod_ms = fp;

            const trialMs = randInt(src.pvt_trial_duration_min, src.pvt_trial_duration_max);
            if (trialMs !== null) sampled.trial_duration_ms = trialMs;

            const iti = randInt(src.pvt_iti_min, src.pvt_iti_max);
            if (iti !== null) sampled.iti_ms = iti;
        } else if (componentType === 'stroop-trial') {
            const words = parseStringList(src.stroop_word_options);
            const inksExplicit = parseStringList(src.stroop_ink_color_options);
            const inks = (inksExplicit.length > 0) ? inksExplicit : words;

            const congruencyOptions = parseStringList(src.stroop_congruency_options);
            const congruency = pickFromList(congruencyOptions, 'auto');

            const pickedWord = pickFromList(words, 'RED');
            let pickedInk = pickFromList(inks, pickedWord);

            if (congruency === 'congruent') {
                pickedInk = pickedWord;
            } else if (congruency === 'incongruent') {
                if (inks.length > 1) {
                    const different = inks.filter(n => n.trim().toLowerCase() !== pickedWord.trim().toLowerCase());
                    pickedInk = pickFromList(different, pickedInk);
                }
            }

            sampled.word = pickedWord;
            sampled.ink_color_name = pickedInk;
            sampled.congruency = congruency;

            sampled.response_mode = (src.stroop_response_mode || 'inherit').toString();
            sampled.response_device = (src.stroop_response_device || 'inherit').toString();
            sampled.choice_keys = parseStringList(src.stroop_choice_keys);
            sampled.congruent_key = (src.stroop_congruent_key || 'f').toString();
            sampled.incongruent_key = (src.stroop_incongruent_key || 'j').toString();

            const stimMs = randInt(src.stroop_stimulus_duration_min, src.stroop_stimulus_duration_max);
            if (stimMs !== null) sampled.stimulus_duration_ms = stimMs;

            const trialMs = randInt(src.stroop_trial_duration_min, src.stroop_trial_duration_max);
            if (trialMs !== null) sampled.trial_duration_ms = trialMs;

            const iti = randInt(src.stroop_iti_min, src.stroop_iti_max);
            if (iti !== null) sampled.iti_ms = iti;
        } else if (componentType === 'gabor-trial' || componentType === 'gabor-quest') {
            const locs = parseStringList(blockData.gabor_target_location_options);
            sampled.target_location = pickFromList(locs, 'left');

            const tilts = parseNumberList(blockData.gabor_target_tilt_options, { min: -90, max: 90 });
            sampled.target_tilt_deg = pickFromList(tilts, 45);

            const dis = parseNumberList(blockData.gabor_distractor_orientation_options, { min: 0, max: 179 });
            sampled.distractor_orientation_deg = pickFromList(dis, 0);

            const cues = parseStringList(blockData.gabor_spatial_cue_options);
            sampled.spatial_cue = pickFromList(cues, 'none');

            const lv = parseStringList(blockData.gabor_left_value_options);
            sampled.left_value = pickFromList(lv, 'neutral');

            const rv = parseStringList(blockData.gabor_right_value_options);
            sampled.right_value = pickFromList(rv, 'neutral');

            const freq = randFloat(blockData.gabor_spatial_frequency_min, blockData.gabor_spatial_frequency_max);
            if (freq !== null) sampled.spatial_frequency_cyc_per_px = freq;

            const waves = parseStringList(blockData.gabor_grating_waveform_options);
            sampled.grating_waveform = pickFromList(waves, 'sinusoidal');

            const responseTask = (blockData.gabor_response_task || '').toString().trim();
            sampled.response_task = responseTask || 'discriminate_tilt';

            sampled.left_key = (blockData.gabor_left_key || 'f').toString();
            sampled.right_key = (blockData.gabor_right_key || 'j').toString();
            sampled.yes_key = (blockData.gabor_yes_key || 'f').toString();
            sampled.no_key = (blockData.gabor_no_key || 'j').toString();

            const stimMs = randInt(blockData.gabor_stimulus_duration_min, blockData.gabor_stimulus_duration_max);
            if (stimMs !== null) sampled.stimulus_duration_ms = stimMs;
            const maskMs = randInt(blockData.gabor_mask_duration_min, blockData.gabor_mask_duration_max);
            if (maskMs !== null) sampled.mask_duration_ms = maskMs;
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
        // Some legacy layouts (e.g. index.html initial markup) include a canvas but
        // are missing newer controls like Block "Resample". Upgrade the modal body
        // to the canonical RDM preview layout when required elements are absent.
        const hasRdmCanvas = !!modalBody?.querySelector('#previewCanvas');
        const hasRdmControls = !!modalBody?.querySelector('#startPreviewBtn')
            && !!modalBody?.querySelector('#pausePreviewBtn')
            && !!modalBody?.querySelector('#stopPreviewBtn')
            && !!modalBody?.querySelector('#resetPreviewBtn');
        const hasRdmExtras = !!modalBody?.querySelector('#previewContextNote')
            && !!modalBody?.querySelector('#resamplePreviewBtn')
            && !!modalBody?.querySelector('#previewParameters');

        const needsRestore = !modalBody || !hasRdmCanvas || !hasRdmControls || !hasRdmExtras;

        if (modalBody && needsRestore) {
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

        // Support nested aperture parameters (new export structure).
        // Flatten into mergedParams so the existing preview mapper continues to work.
        if (mergedParams.aperture_parameters && typeof mergedParams.aperture_parameters === 'object') {
            for (const [key, value] of Object.entries(mergedParams.aperture_parameters)) {
                if (mergedParams[key] === undefined) {
                    mergedParams[key] = value;
                }
            }
        }

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

        // Aperture outline (non-cue) configuration
        const outlineModeRaw = (mergedParams?.show_aperture_outline_mode ?? mergedParams?.aperture_outline_mode ?? 'inherit');
        const outlineMode = String(outlineModeRaw).trim().toLowerCase();
        const outlineWidthRaw = mergedParams?.aperture_outline_width;
        const outlineColorRaw = mergedParams?.aperture_outline_color;

        const outlineWidthNum = (outlineWidthRaw === '' || outlineWidthRaw === null || outlineWidthRaw === undefined)
            ? null
            : Number(outlineWidthRaw);
        const hasOutlineWidth = (outlineWidthNum !== null && Number.isFinite(outlineWidthNum) && outlineWidthNum > 0);
        const hasOutlineColor = (typeof outlineColorRaw === 'string' && outlineColorRaw.trim().length > 0);

        let outlineEnabled;
        if (typeof mergedParams?.show_aperture_outline === 'boolean') {
            outlineEnabled = mergedParams.show_aperture_outline;
        } else if (mergedParams?.show_aperture_outline === 'true' || mergedParams?.show_aperture_outline === 'false') {
            outlineEnabled = (String(mergedParams.show_aperture_outline).toLowerCase() === 'true');
        } else if (outlineMode === 'true' || outlineMode === 'on' || outlineMode === 'enabled') {
            outlineEnabled = true;
        } else if (outlineMode === 'false' || outlineMode === 'off' || outlineMode === 'disabled') {
            outlineEnabled = false;
        } else {
            // inherit/unknown: if user set width/color, assume they intended it to be visible
            outlineEnabled = (hasOutlineWidth || hasOutlineColor) ? true : false;
        }

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
            cue_border_width: parseInt(cueWidth),

            // Aperture outline (static)
            show_aperture_outline: outlineEnabled,
            aperture_outline_width: hasOutlineWidth ? outlineWidthNum : null,
            aperture_outline_color: hasOutlineColor ? outlineColorRaw.trim() : null
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
            // Priority: response cue border > static outline > default dashed
            const shouldDrawCue = !!this.parameters.cue_border_enabled;
            const shouldDrawOutline = (!shouldDrawCue && !!this.parameters.show_aperture_outline);

            if (shouldDrawCue) {
                this.ctx.strokeStyle = this.parameters.cue_border_color;
                this.ctx.lineWidth = Math.max(1, Number(this.parameters.cue_border_width) || 1);
                this.ctx.setLineDash([]); // Solid for cue
            } else if (shouldDrawOutline) {
                const color = this.parameters.aperture_outline_color || '#888888';
                const width = Math.max(1, Number(this.parameters.aperture_outline_width) || 2);
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = width;
                this.ctx.setLineDash([]); // Solid for outline
            } else {
                this.ctx.strokeStyle = '#888888';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]); // Dashed when no cue/outline
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

        const outlineInfo = (this.parameters.show_aperture_outline)
            ? `<p><strong>Aperture Outline:</strong> on (${this.parameters.aperture_outline_color || '#888888'}, ${this.parameters.aperture_outline_width || 2}px)</p>`
            : `<p><strong>Aperture Outline:</strong> off</p>`;
        
        container.innerHTML = `
            <div class="parameter-group">
                <p><strong>Type:</strong> ${this.parameters.component_type || 'rdm'}</p>
                <p><strong>Canvas:</strong> ${this.parameters.canvas_width}×${this.parameters.canvas_height}px</p>
                <p><strong>Aperture:</strong> ${this.parameters.aperture_shape} (${this.parameters.aperture_size}px)</p>
                ${outlineInfo}
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