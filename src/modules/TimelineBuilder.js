class TimelineBuilder {
    constructor(jsonBuilder) {
        this.jsonBuilder = jsonBuilder;
        this.timelineContainer = null;
        this.selectedComponent = null;
        
        this.initializeContainer();
        this.setupEventListeners();
    }

    initializeContainer() {
        // Use the timelineComponents container instead of overwriting timelineBuilder
        this.timelineContainer = document.getElementById('timelineComponents');
        if (!this.timelineContainer) {
            console.error('Timeline components container not found!');
            return;
        }

        // Don't overwrite existing HTML structure - it already has proper header and empty state
        console.log('TimelineBuilder initialized with existing container structure');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-component-btn')) {
                e.stopPropagation();
                const componentElement = e.target.closest('.timeline-component');
                this.editComponent(componentElement);
            }
        });
    }

    renderTimeline() {
        // Use the timelineComponents container instead of timelineContent
        if (!this.timelineContainer) return;

        const timeline = this.jsonBuilder.timeline;
        const emptyState = this.timelineContainer.querySelector('.empty-timeline');

        if (timeline.length === 0) {
            // Show empty state
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            // Remove all timeline components
            this.timelineContainer.querySelectorAll('.timeline-component').forEach(el => el.remove());
            return;
        }

        // Hide empty state when there are components
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Remove existing timeline components to rebuild
        this.timelineContainer.querySelectorAll('.timeline-component').forEach(el => el.remove());

        // Add new components
        timeline.forEach((component, index) => {
            const componentElement = this.createComponentElementNew(component, index);
            this.timelineContainer.appendChild(componentElement);
        });
    }

    createComponentElement(component, index) {
        return `
            <div class="timeline-component" data-index="${index}" style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px; border-radius: 5px;">
                <div class="component-header d-flex justify-content-between align-items-center">
                    <div class="component-info">
                        <div class="component-title fw-bold">${component.name}</div>
                        <div class="component-type text-muted">${component.type}</div>
                    </div>
                    <div class="component-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary edit-component-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createComponentElementNew(component, index) {
        const componentElement = document.createElement('div');
        componentElement.className = 'timeline-component card mb-2';
        componentElement.dataset.componentType = component.type;
        
        // Store component data
        const componentData = {
            type: component.type,
            name: component.name,
            ...component.parameters
        };

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
                            <h6 class="card-title mb-1">${component.name}</h6>
                            <small class="text-muted">${component.type}</small>
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
        
        return componentElement;
    }

    editComponent(componentElement) {
        // Get component data from DOM element instead of timeline array
        try {
            const componentData = JSON.parse(componentElement.dataset.componentData || '{}');
            
            // Store reference to the editing component for saving later
            this.jsonBuilder.currentEditingComponent = componentElement;
            
            this.showParameterModal(componentData, componentElement);
        } catch (e) {
            console.error('Failed to parse component data:', e);
            alert('Error: Could not load component data for editing.');
        }
    }

    showParameterModal(component, componentElement) {
        const modal = document.getElementById('parameterModal');
        const modalBody = document.getElementById('parameterModalBody');
        const modalTitle = document.getElementById('parameterModalTitle');

        if (!modal || !modalBody || !modalTitle) {
            console.error('Parameter modal elements not found');
            console.log('modal:', modal, 'modalBody:', modalBody, 'modalTitle:', modalTitle);
            return;
        }

        // Set modal title
        modalTitle.textContent = `Edit ${component.name || component.type}`;

        // Store component element reference in modal for saving
        modal.setAttribute('data-component-element', 'stored');

        console.log('Editing component:', component);
        console.log('Component type:', component.type);

        // Custom editor for survey forms (complex nested question structure)
        if (component.type === 'survey-response') {
            this.showSurveyResponseParameterModal(component, componentElement, { modal, modalBody, modalTitle });
            return;
        }

        // Get component schema
        const schema = this.jsonBuilder.schemaValidator.getPluginSchema(component.type);
        
        console.log('Schema found:', schema);

        // Generate form
        modalBody.innerHTML = this.generateParameterForm(component, schema);

        // Setup form listeners
        this.setupParameterFormListeners(modalBody, component);

        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    showSurveyResponseParameterModal(component, componentElement, { modal, modalBody, modalTitle }) {
        // Title
        modalTitle.textContent = `Edit ${component.name || 'Survey Response'}`;

        // Store component element reference in modal for saving
        modal.setAttribute('data-component-element', 'stored');

        const title = component.title ?? component.parameters?.title ?? 'Survey';
        const instructions = component.instructions ?? component.parameters?.instructions ?? '';
        const submitLabel = component.submit_label ?? component.parameters?.submit_label ?? 'Continue';
        const detectionEnabled = !!(component.detection_response_task_enabled ?? component.parameters?.detection_response_task_enabled ?? false);
        const allowEmptyOnTimeout = !!(component.allow_empty_on_timeout ?? component.parameters?.allow_empty_on_timeout ?? false);
        const timeoutMs = (component.timeout_ms ?? component.parameters?.timeout_ms ?? null);
        const questions = component.questions ?? component.parameters?.questions ?? [];

        modalBody.innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-bold">Title</label>
                <input type="text" class="form-control" id="survey_title" value="${this.escapeHtmlAttr(String(title))}">
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Instructions</label>
                <textarea class="form-control" id="survey_instructions" rows="3">${this.escapeHtml(String(instructions))}</textarea>
            </div>
            <div class="mb-3">
                <label class="form-label fw-bold">Submit button label</label>
                <input type="text" class="form-control" id="survey_submit_label" value="${this.escapeHtmlAttr(String(submitLabel))}">
            </div>

            <div class="border rounded p-2 mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="survey_detection_response_task_enabled" ${detectionEnabled ? 'checked' : ''}>
                    <label class="form-check-label fw-bold" for="survey_detection_response_task_enabled">
                        Enable Detection Response Task
                    </label>
                </div>
                <small class="text-muted d-block mt-1">
                    When enabled, the interpreter app may run the detection/DRT overlay for this timeline item.
                </small>
            </div>

            <div class="border rounded p-2 mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="survey_allow_empty_on_timeout" ${allowEmptyOnTimeout ? 'checked' : ''}>
                    <label class="form-check-label fw-bold" for="survey_allow_empty_on_timeout">
                        Continue with empty responses after timeout
                    </label>
                </div>
                <div class="row g-2 mt-1">
                    <div class="col-md-4">
                        <label class="form-label">Timeout (ms)</label>
                        <input type="number" class="form-control" id="survey_timeout_ms" min="0" value="${timeoutMs === null ? '' : this.escapeHtmlAttr(String(timeoutMs))}" placeholder="(off)">
                    </div>
                    <div class="col-md-8 d-flex align-items-end">
                        <small class="text-muted">
                            When enabled, the interpreter may auto-advance after the timeout and store unanswered items as null/empty.
                        </small>
                    </div>
                </div>
            </div>

            <hr />

            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Questions</h6>
                <button type="button" class="btn btn-sm btn-outline-primary" id="survey_add_question">
                    <i class="fas fa-plus"></i> Add Question
                </button>
            </div>
            <div id="survey_questions" class="d-flex flex-column gap-2"></div>
            <small class="text-muted d-block mt-2">
                Supported types: likert, radio, text, slider, number. Responses are keyed by question id.
            </small>
        `;

        // Toggle timeout input enable/disable
        const allowTimeoutEl = modalBody.querySelector('#survey_allow_empty_on_timeout');
        const timeoutEl = modalBody.querySelector('#survey_timeout_ms');
        const syncTimeoutUi = () => {
            if (!allowTimeoutEl || !timeoutEl) return;
            timeoutEl.disabled = !allowTimeoutEl.checked;
        };
        if (allowTimeoutEl) {
            allowTimeoutEl.addEventListener('change', syncTimeoutUi);
        }
        syncTimeoutUi();

        const container = modalBody.querySelector('#survey_questions');
        const addBtn = modalBody.querySelector('#survey_add_question');

        const addQuestionEl = (q = {}) => {
            const qType = (q.type || 'likert');
            const qId = (q.id || 'q' + (container.children.length + 1));
            const qPrompt = (q.prompt || '');
            const required = !!q.required;

            const optText = Array.isArray(q.options) ? q.options.join('\n') : (q.options || '');

            const sliderMin = (q.min ?? 0);
            const sliderMax = (q.max ?? 100);
            const sliderStep = (q.step ?? 1);
            const sliderMinLabel = (q.min_label ?? '');
            const sliderMaxLabel = (q.max_label ?? '');

            const textPlaceholder = (q.placeholder ?? '');
            const multiline = !!q.multiline;
            const rows = (q.rows ?? 3);

            const numberMin = (q.min ?? '');
            const numberMax = (q.max ?? '');
            const numberStep = (q.step ?? 1);

            const wrapper = document.createElement('div');
            wrapper.className = 'survey-question border rounded p-2';
            wrapper.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <strong>Question</strong>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">Remove</button>
                </div>
                <div class="row g-2 mt-1">
                    <div class="col-md-3">
                        <label class="form-label">ID</label>
                        <input type="text" class="form-control" data-field="id" value="${this.escapeHtmlAttr(String(qId))}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Prompt</label>
                        <input type="text" class="form-control" data-field="prompt" value="${this.escapeHtmlAttr(String(qPrompt))}">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Type</label>
                        <select class="form-select" data-field="type">
                            <option value="likert">Likert scale</option>
                            <option value="radio">Radio options</option>
                            <option value="text">Text input</option>
                            <option value="slider">Slider</option>
                            <option value="number">Numeric input</option>
                        </select>
                    </div>
                </div>
                <div class="form-check mt-2">
                    <input class="form-check-input" type="checkbox" data-field="required" ${required ? 'checked' : ''}>
                    <label class="form-check-label">Required</label>
                </div>

                <div class="survey-type survey-type-likert mt-2" data-type-section="likert">
                    <label class="form-label">Options (one per line)</label>
                    <textarea class="form-control" rows="4" data-field="options">${this.escapeHtml(String(optText))}</textarea>
                </div>

                <div class="survey-type survey-type-radio mt-2" data-type-section="radio" style="display:none;">
                    <label class="form-label">Options (one per line)</label>
                    <textarea class="form-control" rows="4" data-field="options">${this.escapeHtml(String(optText))}</textarea>
                </div>

                <div class="survey-type survey-type-text mt-2" data-type-section="text" style="display:none;">
                    <div class="row g-2">
                        <div class="col-md-8">
                            <label class="form-label">Placeholder</label>
                            <input type="text" class="form-control" data-field="placeholder" value="${this.escapeHtmlAttr(String(textPlaceholder))}">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" data-field="multiline" ${multiline ? 'checked' : ''}>
                                <label class="form-check-label">Multiline</label>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Rows (if multiline)</label>
                            <input type="number" class="form-control" data-field="rows" min="1" value="${this.escapeHtmlAttr(String(rows))}">
                        </div>
                    </div>
                </div>

                <div class="survey-type survey-type-slider mt-2" data-type-section="slider" style="display:none;">
                    <div class="row g-2">
                        <div class="col-md-4">
                            <label class="form-label">Min</label>
                            <input type="number" class="form-control" data-field="min" value="${this.escapeHtmlAttr(String(sliderMin))}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Max</label>
                            <input type="number" class="form-control" data-field="max" value="${this.escapeHtmlAttr(String(sliderMax))}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Step</label>
                            <input type="number" class="form-control" data-field="step" value="${this.escapeHtmlAttr(String(sliderStep))}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Min label (optional)</label>
                            <input type="text" class="form-control" data-field="min_label" value="${this.escapeHtmlAttr(String(sliderMinLabel))}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Max label (optional)</label>
                            <input type="text" class="form-control" data-field="max_label" value="${this.escapeHtmlAttr(String(sliderMaxLabel))}">
                        </div>
                    </div>
                </div>

                <div class="survey-type survey-type-number mt-2" data-type-section="number" style="display:none;">
                    <div class="row g-2">
                        <div class="col-md-3">
                            <label class="form-label">Min (optional)</label>
                            <input type="number" class="form-control" data-field="min" value="${this.escapeHtmlAttr(String(numberMin))}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Max (optional)</label>
                            <input type="number" class="form-control" data-field="max" value="${this.escapeHtmlAttr(String(numberMax))}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Step</label>
                            <input type="number" class="form-control" data-field="step" value="${this.escapeHtmlAttr(String(numberStep))}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Placeholder</label>
                            <input type="text" class="form-control" data-field="placeholder" value="${this.escapeHtmlAttr(String(textPlaceholder))}">
                        </div>
                    </div>
                </div>
            `;

            const typeEl = wrapper.querySelector('[data-field="type"]');
            if (typeEl) typeEl.value = qType;

            const updateVisibility = () => {
                const t = (typeEl?.value || 'likert');
                wrapper.querySelectorAll('[data-type-section]').forEach(sec => {
                    const secType = sec.getAttribute('data-type-section');
                    sec.style.display = (secType === t) ? '' : 'none';
                });
            };

            if (typeEl) typeEl.addEventListener('change', updateVisibility);
            updateVisibility();

            const removeBtn = wrapper.querySelector('[data-action="remove"]');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    wrapper.remove();
                });
            }

            container.appendChild(wrapper);
        };

        (Array.isArray(questions) ? questions : []).forEach(q => addQuestionEl(q));
        if (container.children.length === 0) {
            addQuestionEl({ type: 'likert', id: 'q1', prompt: '', options: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'], required: true });
        }

        if (addBtn) {
            addBtn.addEventListener('click', () => addQuestionEl({ type: 'likert', prompt: '', required: false }));
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    collectSurveyResponseFromModal(modalBody) {
        const title = modalBody.querySelector('#survey_title')?.value ?? 'Survey';
        const instructions = modalBody.querySelector('#survey_instructions')?.value ?? '';
        const submit_label = modalBody.querySelector('#survey_submit_label')?.value ?? 'Continue';

        const detection_response_task_enabled = !!modalBody.querySelector('#survey_detection_response_task_enabled')?.checked;

        const allow_empty_on_timeout = !!modalBody.querySelector('#survey_allow_empty_on_timeout')?.checked;
        const timeoutRaw = modalBody.querySelector('#survey_timeout_ms')?.value;
        const timeout_ms = (timeoutRaw === undefined || timeoutRaw === null || timeoutRaw === '')
            ? null
            : Number(timeoutRaw);

        const questions = [];
        const questionEls = modalBody.querySelectorAll('.survey-question');

        const parseLines = (raw) => {
            return raw
                .toString()
                .split(/\r?\n/)
                .map(s => s.trim())
                .filter(Boolean);
        };

        questionEls.forEach((el, idx) => {
            const type = (el.querySelector('[data-field="type"]')?.value || 'likert').trim();
            const idRaw = (el.querySelector('[data-field="id"]')?.value || '').trim();
            const id = idRaw || `q${idx + 1}`;
            const prompt = (el.querySelector('[data-field="prompt"]')?.value || '').trim();
            const required = !!el.querySelector('[data-field="required"]')?.checked;

            const q = { id, type, prompt, required };

            if (type === 'likert' || type === 'radio') {
                const optionsRaw = el.querySelector(`[data-type-section="${type}"] [data-field="options"]`)?.value || '';
                q.options = parseLines(optionsRaw);
            } else if (type === 'text') {
                q.placeholder = (el.querySelector('[data-type-section="text"] [data-field="placeholder"]')?.value || '').toString();
                q.multiline = !!el.querySelector('[data-type-section="text"] [data-field="multiline"]')?.checked;
                const rowsRaw = el.querySelector('[data-type-section="text"] [data-field="rows"]')?.value;
                const rows = Number.parseInt(rowsRaw, 10);
                if (Number.isFinite(rows)) q.rows = rows;
            } else if (type === 'slider') {
                const min = Number(el.querySelector('[data-type-section="slider"] [data-field="min"]')?.value);
                const max = Number(el.querySelector('[data-type-section="slider"] [data-field="max"]')?.value);
                const step = Number(el.querySelector('[data-type-section="slider"] [data-field="step"]')?.value);
                if (Number.isFinite(min)) q.min = min;
                if (Number.isFinite(max)) q.max = max;
                if (Number.isFinite(step)) q.step = step;
                q.min_label = (el.querySelector('[data-type-section="slider"] [data-field="min_label"]')?.value || '').toString();
                q.max_label = (el.querySelector('[data-type-section="slider"] [data-field="max_label"]')?.value || '').toString();
            } else if (type === 'number') {
                const minRaw = el.querySelector('[data-type-section="number"] [data-field="min"]')?.value;
                const maxRaw = el.querySelector('[data-type-section="number"] [data-field="max"]')?.value;
                const stepRaw = el.querySelector('[data-type-section="number"] [data-field="step"]')?.value;
                const min = Number(minRaw);
                const max = Number(maxRaw);
                const step = Number(stepRaw);
                if (minRaw !== '' && Number.isFinite(min)) q.min = min;
                if (maxRaw !== '' && Number.isFinite(max)) q.max = max;
                if (Number.isFinite(step)) q.step = step;
                q.placeholder = (el.querySelector('[data-type-section="number"] [data-field="placeholder"]')?.value || '').toString();
            }

            questions.push(q);
        });

        return { title, instructions, submit_label, detection_response_task_enabled, allow_empty_on_timeout, timeout_ms, questions };
    }

    escapeHtmlAttr(str) {
        return this.escapeHtml(str).replace(/\"/g, '&quot;');
    }

    escapeHtml(str) {
        return str
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    generateParameterForm(component, schema) {
        if (!schema) {
            return '<p class="text-muted">No schema available for this component type.</p>';
        }

        let formHtml = '';
        const parameters = schema.parameters;

        for (const [paramName, paramDef] of Object.entries(parameters)) {
            // Priority order: component parameter → experiment default → schema default
            let currentValue;
            
            // Check for parameter in nested parameters object first, then flat structure, then defaults
            if (component.parameters && component.parameters.hasOwnProperty(paramName)) {
                currentValue = component.parameters[paramName];
            } else if (component.hasOwnProperty(paramName)) {
                currentValue = component[paramName];
            } else {
                // Check for experiment-wide default, fall back to schema default
                const experimentDefault = this.getExperimentDefault(paramName);
                currentValue = experimentDefault !== undefined ? experimentDefault : paramDef.default;
            }

            console.log(`Parameter ${paramName}:`, currentValue, 'from', component);
            
            // Check if this parameter should be disabled based on experiment type
            const isTrialBased = this.jsonBuilder.experimentType === 'trial-based';
            const isTransitionParam = (paramName === 'transition_duration' || paramName === 'transition_type');
            const isContinuousOnlyParam = (paramName === 'end_condition_on_response_mode');
            const shouldDisable = isTrialBased && (isTransitionParam || isContinuousOnlyParam);
            
            const responseGroup = (paramName === 'mouse_segments' || paramName === 'mouse_start_angle_deg' || paramName === 'mouse_selection_mode')
                ? 'mouse'
                : (paramName === 'response_keys')
                    ? 'keyboard'
                    : (paramName === 'feedback_mode' || paramName === 'feedback_duration_ms')
                        ? 'feedback'
                    : (paramName === 'cue_border_mode' || paramName === 'cue_border_width' || paramName === 'cue_border_color' || paramName === 'response_target_group')
                        ? 'cue'
                        : (paramName === 'show_aperture_outline_mode' || paramName === 'aperture_outline_width' || paramName === 'aperture_outline_color')
                            ? 'apertureOutline'
                        : (paramName === 'group_speed_mode' || paramName === 'group_1_speed' || paramName === 'group_2_speed')
                            ? 'groupSpeed'
                            : '';

            const cueSubGroup = (paramName === 'cue_border_color') ? 'cueColor' : '';
            const feedbackSubGroup = (paramName === 'feedback_duration_ms') ? 'feedbackDuration' : '';

            const blockTargetAttr = paramDef.blockTarget ? `data-block-target="${paramDef.blockTarget}"` : '';

            formHtml += `
                <div class="mb-3 ${shouldDisable ? 'parameter-disabled' : ''}" data-param-name="${paramName}" ${responseGroup ? `data-response-group="${responseGroup}"` : ''} ${cueSubGroup ? `data-cue-subgroup="${cueSubGroup}"` : ''} ${feedbackSubGroup ? `data-feedback-subgroup="${feedbackSubGroup}"` : ''} ${blockTargetAttr}>
                    <label for="param_${paramName}" class="form-label ${shouldDisable ? 'text-muted' : ''}">
                        ${this.formatParameterName(paramName)}
                        ${paramDef.required ? '<span class="text-danger">*</span>' : ''}
                        ${shouldDisable ? '<small class="text-muted">(Not used in trial-based experiments)</small>' : ''}
                    </label>
                    ${this.generateParameterInput(paramName, paramDef, currentValue, shouldDisable)}
                    ${paramDef.description ? 
                        `<div class="form-text ${shouldDisable ? 'text-muted' : ''}">${paramDef.description}</div>` : ''}
                </div>
            `;
        }

        return formHtml;
    }

    generateParameterInput(paramName, paramDef, currentValue, shouldDisable = false) {
        const inputId = `param_${paramName}`;
        const disabledAttr = shouldDisable ? 'disabled' : '';
        const disabledClass = shouldDisable ? 'text-muted' : '';
        
        // Ensure currentValue is a primitive, not an object
        let displayValue = currentValue;
        if (typeof currentValue === 'object' && currentValue !== null) {
            // If it's an object, try to extract a meaningful value
            if (currentValue.hasOwnProperty('value')) {
                displayValue = currentValue.value;
            } else if (currentValue.hasOwnProperty('default')) {
                displayValue = currentValue.default;
            } else {
                // Fallback to schema default
                displayValue = paramDef.default;
            }
        }
        
        // Handle empty or undefined values
        if (displayValue === undefined || displayValue === null) {
            displayValue = paramDef.default || '';
        }
        
        // Handle different parameter types
        switch (paramDef.type) {
            case this.jsonBuilder.schemaValidator.parameterTypes.BOOL:
                return `
                    <div class="form-check form-switch">
                        <input class="form-check-input ${disabledClass}" type="checkbox" id="${inputId}" 
                               ${displayValue ? 'checked' : ''} ${disabledAttr}>
                        <label class="form-check-label" for="${inputId}">Enable</label>
                    </div>
                `;

            case this.jsonBuilder.schemaValidator.parameterTypes.SELECT:
                const options = paramDef.options || [];
                const blockTypeLabel = (v) => {
                    if (v === 'gabor-trial') return 'Gabor (fixed)';
                    if (v === 'gabor-quest') return 'Gabor (QUEST)';
                    return v;
                };

                const optionsHtml = options.map(option => {
                    const label = (paramName === 'block_component_type') ? blockTypeLabel(option) : option;
                    return `<option value="${option}" ${displayValue === option ? 'selected' : ''}>${label}</option>`;
                }).join('');
                return `
                    <select class="form-select ${disabledClass}" id="${inputId}" ${disabledAttr}>
                        ${optionsHtml}
                    </select>
                `;

            case this.jsonBuilder.schemaValidator.parameterTypes.INT:
            case this.jsonBuilder.schemaValidator.parameterTypes.FLOAT:
                // Special-case: dot-group percentage sliders (0-100) for rdm-dot-groups
                if (paramName === 'group_1_percentage' || paramName === 'group_2_percentage') {
                    const safeValue = (displayValue === '' || displayValue === undefined || displayValue === null)
                        ? (paramDef.default || 50)
                        : displayValue;

                    return `
                        <div class="d-flex align-items-center gap-3">
                            <input type="range" class="form-range flex-grow-1 ${disabledClass}" id="${inputId}" 
                                   min="0" max="100" step="1" value="${safeValue}" ${disabledAttr}>
                            <span class="small text-muted" style="min-width: 3.5rem; text-align: right;">
                                <span id="${inputId}_value">${safeValue}</span>%
                            </span>
                        </div>
                    `;
                }

                return `
                    <input type="number" class="form-control ${disabledClass}" id="${inputId}" 
                           value="${displayValue}" ${disabledAttr}
                           ${paramDef.type === this.jsonBuilder.schemaValidator.parameterTypes.INT ? 'step="1"' : 'step="any"'}>
                `;

            case this.jsonBuilder.schemaValidator.parameterTypes.HTML_STRING:
                return `
                    <textarea class="form-control ${disabledClass}" id="${inputId}" rows="4" ${disabledAttr}>${displayValue}</textarea>
                `;

            case this.jsonBuilder.schemaValidator.parameterTypes.COLOR:
                const colorInputHtml = `
                    <div class="d-flex gap-2">
                        <input type="color" class="form-control form-control-color ${disabledClass}" id="${inputId}" 
                               value="${displayValue}" style="width: 60px;" ${disabledAttr}>
                        <input type="text" class="form-control ${disabledClass}" id="${inputId}_hex" 
                               value="${displayValue}" placeholder="#FFFFFF"
                               pattern="^#[0-9A-Fa-f]{6}$" ${disabledAttr}>
                    </div>
                `;
                
                // Set up event listeners after the HTML is inserted
                setTimeout(() => {
                    const colorInput = document.getElementById(inputId);
                    const hexInput = document.getElementById(inputId + '_hex');
                    
                    if (colorInput && hexInput) {
                        colorInput.addEventListener('input', function() {
                            hexInput.value = this.value.toUpperCase();
                        });
                        
                        hexInput.addEventListener('input', function() {
                            if (this.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                                colorInput.value = this.value;
                            }
                        });
                        
                        hexInput.addEventListener('blur', function() {
                            if (!this.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                                this.value = colorInput.value.toUpperCase();
                            }
                        });
                    }
                }, 0);
                
                return colorInputHtml;

            case this.jsonBuilder.schemaValidator.parameterTypes.STRING:
            default:
                return `
                    <input type="text" class="form-control ${disabledClass}" id="${inputId}" value="${displayValue}" ${disabledAttr}>
                `;
        }
    }

    formatParameterName(paramName) {
        return paramName.replace(/_/g, ' ')
                       .replace(/\b\w/g, l => l.toUpperCase());
    }

    setupParameterFormListeners(formContainer, component) {
        // Setup save button listener
        const saveBtn = document.getElementById('saveParametersBtn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                this.saveComponentParameters();
            };
        }

        // Response override conditional fields (per-component)
        const responseDeviceEl = formContainer.querySelector('#param_response_device');
        const updateResponseVisibility = () => {
            const device = responseDeviceEl ? responseDeviceEl.value : 'inherit';

            // Mouse-only fields
            formContainer.querySelectorAll('[data-response-group="mouse"]').forEach(el => {
                const show = (device === 'mouse');
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });

            // Keyboard-only fields (Response Keys)
            formContainer.querySelectorAll('[data-response-group="keyboard"]').forEach(el => {
                const show = (device === 'keyboard');
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });
        };

        if (responseDeviceEl) {
            responseDeviceEl.addEventListener('change', updateResponseVisibility);
            updateResponseVisibility();
        }

        // Feedback conditional fields (per-component / per-block)
        const feedbackModeEl = formContainer.querySelector('#param_feedback_mode');
        const updateFeedbackVisibility = () => {
            const mode = feedbackModeEl ? feedbackModeEl.value : 'inherit';

            // Duration only relevant when explicitly enabled (not inherit/off)
            formContainer.querySelectorAll('[data-feedback-subgroup="feedbackDuration"]').forEach(el => {
                const show = (mode !== 'inherit' && mode !== 'off');
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });
        };

        if (feedbackModeEl) {
            feedbackModeEl.addEventListener('change', updateFeedbackVisibility);
            updateFeedbackVisibility();
        }

        // Cue border conditional fields (dot-groups)
        const responseTargetEl = formContainer.querySelector('#param_response_target_group');
        const cueModeEl = formContainer.querySelector('#param_cue_border_mode');

        const updateCueVisibility = () => {
            const target = responseTargetEl ? responseTargetEl.value : 'none';
            const cueMode = cueModeEl ? cueModeEl.value : 'off';

            // Hide all cue controls except target selector if none selected
            formContainer.querySelectorAll('[data-response-group="cue"]').forEach(el => {
                const paramName = el.getAttribute('data-param-name');
                if (paramName === 'response_target_group') {
                    el.style.display = '';
                    el.querySelectorAll('input, select, textarea').forEach(i => {
                        i.disabled = false;
                    });
                } else {
                    const show = (target && target !== 'none');
                    el.style.display = show ? '' : 'none';
                    el.querySelectorAll('input, select, textarea').forEach(i => {
                        i.disabled = !show;
                    });
                }
            });

            // Only show custom color when cueMode = custom
            formContainer.querySelectorAll('[data-cue-subgroup="cueColor"]').forEach(el => {
                const show = (target && target !== 'none' && cueMode === 'custom');
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });
        };

        if (responseTargetEl) {
            responseTargetEl.addEventListener('change', updateCueVisibility);
        }
        if (cueModeEl) {
            cueModeEl.addEventListener('change', updateCueVisibility);
        }
        if (responseTargetEl || cueModeEl) {
            updateCueVisibility();
        }

        // Dot-groups group-speed conditional fields
        const groupSpeedModeEl = formContainer.querySelector('#param_group_speed_mode');
        const updateGroupSpeedVisibility = () => {
            const mode = groupSpeedModeEl ? groupSpeedModeEl.value : 'shared';
            formContainer.querySelectorAll('[data-response-group="groupSpeed"]').forEach(el => {
                const paramName = el.getAttribute('data-param-name');
                if (paramName === 'group_speed_mode') {
                    el.style.display = '';
                } else {
                    el.style.display = (mode === 'per-group') ? '' : 'none';
                }
            });
        };

        if (groupSpeedModeEl) {
            groupSpeedModeEl.addEventListener('change', updateGroupSpeedVisibility);
            updateGroupSpeedVisibility();
        }

        // Aperture outline overrides: only enable width/color when mode is explicit true/false.
        const outlineModeEl = formContainer.querySelector('#param_show_aperture_outline_mode');
        const updateOutlineVisibility = () => {
            const mode = (outlineModeEl ? outlineModeEl.value : 'inherit').toString().trim().toLowerCase();
            const showDetail = (mode === 'true' || mode === 'false');

            ['aperture_outline_width', 'aperture_outline_color'].forEach(p => {
                const row = formContainer.querySelector(`[data-param-name="${p}"]`);
                if (!row) return;
                row.style.display = showDetail ? '' : 'none';
                row.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !showDetail;
                });
            });
        };

        if (outlineModeEl) {
            outlineModeEl.addEventListener('change', updateOutlineVisibility);
            updateOutlineVisibility();
        }

        // Dot-groups percentage coupling: keep group_1 + group_2 = 100
        const g1El = formContainer.querySelector('#param_group_1_percentage');
        const g2El = formContainer.querySelector('#param_group_2_percentage');
        const g1ValEl = formContainer.querySelector('#param_group_1_percentage_value');
        const g2ValEl = formContainer.querySelector('#param_group_2_percentage_value');

        if (g1El && g2El) {
            let syncing = false;

            const clamp01 = (n) => Math.max(0, Math.min(100, n));
            const updateLabels = () => {
                if (g1ValEl) g1ValEl.textContent = String(g1El.value);
                if (g2ValEl) g2ValEl.textContent = String(g2El.value);
            };

            const syncFromG1 = () => {
                if (syncing) return;
                syncing = true;
                const g1 = clamp01(parseInt(g1El.value || '0'));
                const g2 = 100 - g1;
                g1El.value = String(g1);
                g2El.value = String(g2);
                updateLabels();
                syncing = false;
            };

            const syncFromG2 = () => {
                if (syncing) return;
                syncing = true;
                const g2 = clamp01(parseInt(g2El.value || '0'));
                const g1 = 100 - g2;
                g2El.value = String(g2);
                g1El.value = String(g1);
                updateLabels();
                syncing = false;
            };

            g1El.addEventListener('input', syncFromG1);
            g2El.addEventListener('input', syncFromG2);
            syncFromG1();
        }

        // Block: show only fields matching selected block component type
        const blockTypeEl = formContainer.querySelector('#param_block_component_type');

        // Task-scoped block types (keep the library constrained per task)
        if (blockTypeEl) {
            const currentTaskType = document.getElementById('taskType')?.value || 'rdm';
            const allowed = (currentTaskType === 'flanker')
                ? ['flanker-trial']
                : (currentTaskType === 'sart')
                    ? ['sart-trial']
                    : (currentTaskType === 'gabor')
                        ? ['gabor-trial', 'gabor-quest']
                    : ['rdm-trial', 'rdm-practice', 'rdm-adaptive', 'rdm-dot-groups'];

            // Rebuild options if the schema contains extra entries.
            const currentValue = blockTypeEl.value;
            blockTypeEl.innerHTML = allowed
                .map(v => `<option value="${v}">${v}</option>`)
                .join('');

            if (allowed.includes(currentValue)) {
                blockTypeEl.value = currentValue;
            } else {
                blockTypeEl.value = allowed[0] || currentValue;
            }
        }

        const setParamVisible = (paramName, visible) => {
            const row = formContainer.querySelector(`[data-param-name="${paramName}"]`);
            if (!row) return;
            row.style.display = visible ? '' : 'none';
            row.querySelectorAll('input, select, textarea').forEach(i => {
                i.disabled = !visible;
            });
        };

        const updateGaborTrialKeyVisibility = () => {
            if (!component || component.type !== 'gabor-trial') return;
            const taskEl = formContainer.querySelector('#param_response_task');
            const task = (taskEl ? taskEl.value : 'discriminate_tilt').toString();

            const showYesNo = (task === 'detect_target');
            setParamVisible('left_key', !showYesNo);
            setParamVisible('right_key', !showYesNo);
            setParamVisible('yes_key', showYesNo);
            setParamVisible('no_key', showYesNo);
        };

        const updateGaborBlockKeyVisibility = () => {
            if (!blockTypeEl) return;
            const selected = blockTypeEl.value;
            if (selected !== 'gabor-trial' && selected !== 'gabor-quest') return;

            const taskEl = formContainer.querySelector('#param_gabor_response_task');
            const task = (taskEl ? taskEl.value : 'discriminate_tilt').toString();

            const showYesNo = (task === 'detect_target');
            setParamVisible('gabor_left_key', !showYesNo);
            setParamVisible('gabor_right_key', !showYesNo);
            setParamVisible('gabor_yes_key', showYesNo);
            setParamVisible('gabor_no_key', showYesNo);
        };

        const updateGaborQuestVisibility = () => {
            if (!blockTypeEl) return;
            const selected = blockTypeEl.value;
            if (selected !== 'gabor-trial' && selected !== 'gabor-quest') {
                // Ensure hidden when switching block types
                [
                    'gabor_quest_parameter',
                    'gabor_quest_target_performance',
                    'gabor_quest_start_value',
                    'gabor_quest_start_sd',
                    'gabor_quest_beta',
                    'gabor_quest_delta',
                    'gabor_quest_gamma',
                    'gabor_quest_min_value',
                    'gabor_quest_max_value'
                ].forEach(p => setParamVisible(p, false));
                return;
            }

            const modeEl = formContainer.querySelector('#param_gabor_adaptive_mode');
            // If the user picked the QUEST block type, force quest mode so the fields appear.
            if (selected === 'gabor-quest' && modeEl) {
                modeEl.value = 'quest';
            }

            const mode = (modeEl ? modeEl.value : 'none').toString();
            const showQuest = (mode === 'quest');

            [
                'gabor_quest_parameter',
                'gabor_quest_target_performance',
                'gabor_quest_start_value',
                'gabor_quest_start_sd',
                'gabor_quest_beta',
                'gabor_quest_delta',
                'gabor_quest_gamma',
                'gabor_quest_min_value',
                'gabor_quest_max_value'
            ].forEach(p => setParamVisible(p, showQuest));
        };

        const updateBlockVisibility = () => {
            if (!blockTypeEl) return;
            const selected = blockTypeEl.value;

            formContainer.querySelectorAll('[data-block-target]').forEach(el => {
                const target = el.getAttribute('data-block-target');
                const matches = (rawTarget, selectedValue) => {
                    if (!rawTarget) return false;
                    const parts = rawTarget
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                    for (const p of parts) {
                        if (p.endsWith('*')) {
                            const prefix = p.slice(0, -1);
                            if (selectedValue.startsWith(prefix)) return true;
                        } else if (p === selectedValue) {
                            return true;
                        }
                    }
                    return false;
                };

                const show = matches(target, selected);
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });

            // Flanker block: show direction options only for arrow stimuli.
            if (selected === 'flanker-trial') {
                const stimTypeEl = formContainer.querySelector('#param_flanker_stimulus_type');
                const stimTypeRaw = (stimTypeEl ? stimTypeEl.value : 'arrows');
                const stimType = (stimTypeRaw ?? 'arrows').toString().trim().toLowerCase();
                const isArrows = (stimType === '' || stimType === 'arrows');

                setParamVisible('flanker_target_direction_options', isArrows);
                setParamVisible('flanker_target_stimulus_options', !isArrows);
                setParamVisible('flanker_distractor_stimulus_options', !isArrows);
                setParamVisible('flanker_neutral_stimulus_options', !isArrows);
            }

            // Gabor block: show the correct key fields based on response task.
            if (selected === 'gabor-trial' || selected === 'gabor-quest') {
                updateGaborBlockKeyVisibility();
                updateGaborQuestVisibility();
            }
        };

        if (blockTypeEl) {
            blockTypeEl.addEventListener('change', updateBlockVisibility);
            updateBlockVisibility();

            // When editing a Flanker block, stimulus type changes should re-evaluate visibility.
            const stimTypeEl = formContainer.querySelector('#param_flanker_stimulus_type');
            if (stimTypeEl) {
                stimTypeEl.addEventListener('change', updateBlockVisibility);
            }

            // Gabor block: response task changes should re-evaluate key visibility.
            const gaborTaskEl = formContainer.querySelector('#param_gabor_response_task');
            if (gaborTaskEl) {
                gaborTaskEl.addEventListener('change', updateGaborBlockKeyVisibility);
                updateGaborBlockKeyVisibility();
            }

            // Gabor block: adaptive mode changes should toggle QUEST fields.
            const gaborAdaptiveEl = formContainer.querySelector('#param_gabor_adaptive_mode');
            if (gaborAdaptiveEl) {
                gaborAdaptiveEl.addEventListener('change', updateGaborQuestVisibility);
                updateGaborQuestVisibility();
            }
        }

        // Gabor trial: response task changes should re-evaluate key visibility.
        const gaborTrialTaskEl = formContainer.querySelector('#param_response_task');
        if (component && component.type === 'gabor-trial' && gaborTrialTaskEl) {
            gaborTrialTaskEl.addEventListener('change', updateGaborTrialKeyVisibility);
            updateGaborTrialKeyVisibility();
        }
    }

    saveComponentParameters() {
        const modal = document.getElementById('parameterModal');
        
        // Get the component element that's being edited
        if (!this.jsonBuilder.currentEditingComponent) {
            console.error('No component reference found for saving parameters');
            return;
        }

        console.log('Saving parameters for component:', this.jsonBuilder.currentEditingComponent);

        const modalBody = document.getElementById('parameterModalBody');

        // Read current component data first so we can special-case complex editors.
        let currentData = {};
        try {
            currentData = JSON.parse(this.jsonBuilder.currentEditingComponent.dataset.componentData || '{}') || {};
        } catch (e) {
            currentData = {};
        }

        // Ensure we have the essential fields
        if (!currentData.type) {
            console.error('Warning: Component missing type field!', currentData);
            // Try to recover from dataset.componentType as fallback
            const fallbackType = this.jsonBuilder.currentEditingComponent.dataset.componentType;
            if (fallbackType) {
                currentData.type = fallbackType;
                console.log('Recovered type from componentType:', fallbackType);
            }
        }

        // Survey editor uses a custom DOM (not param_* inputs)
        if (currentData.type === 'survey-response') {
            const survey = this.collectSurveyResponseFromModal(modalBody);
            const updatedData = {
                type: currentData.type,
                name: currentData.name || 'Survey Response',
                ...currentData,
                ...survey
            };

            this.jsonBuilder.currentEditingComponent.dataset.componentData = JSON.stringify(updatedData);
            this.jsonBuilder.updateJSON();

            const paramModal = document.getElementById('parameterModal');
            const bootstrapModal = bootstrap.Modal.getInstance(paramModal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
            return;
        }

        // Collect form data
        const inputs = modalBody.querySelectorAll('input, textarea, select');
        const newParameters = {};

        inputs.forEach(input => {
            // Don't persist hidden/disabled modality-specific fields
            if (input.disabled) {
                return;
            }

            const paramName = input.id.replace('param_', '');
            
            // Skip 'type' and 'name' - these should not be overwritten by form inputs
            if (paramName === 'type' || paramName === 'name') {
                console.log('Skipping system parameter:', paramName);
                return;
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

            newParameters[paramName] = value;
        });

        console.log('Collected parameters:', newParameters);

        const validateCommaSeparatedNumericList = (raw, { min, max, integersOnly = false } = {}) => {
            const text = (raw ?? '').toString();
            const parts = text
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const kept = [];
            const invalid = [];

            for (const p of parts) {
                const n = integersOnly ? Number.parseInt(p, 10) : Number(p);
                if (!Number.isFinite(n)) {
                    invalid.push(p);
                    continue;
                }
                if (integersOnly && `${n}` !== `${Number.parseInt(`${n}`, 10)}`) {
                    // Defensive (should not happen in JS), treat as invalid.
                    invalid.push(p);
                    continue;
                }
                if (Number.isFinite(min) && n < min) {
                    invalid.push(p);
                    continue;
                }
                if (Number.isFinite(max) && n > max) {
                    invalid.push(p);
                    continue;
                }
                kept.push(n);
            }

            // de-dupe while preserving order
            const deduped = Array.from(new Set(kept));
            return {
                sanitized: deduped.map(v => integersOnly ? `${Math.trunc(v)}` : `${v}`).join(','),
                invalid,
                keptCount: deduped.length
            };
        };

        const validateCommaSeparatedTokenList = (raw, { allowed = [], caseSensitive = false } = {}) => {
            const text = (raw ?? '').toString();
            const parts = text
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const allowedList = Array.isArray(allowed) ? allowed : [];
            const allowedMap = new Map();
            for (const a of allowedList) {
                const key = caseSensitive ? `${a}` : `${a}`.toLowerCase();
                allowedMap.set(key, `${a}`);
            }

            const kept = [];
            const invalid = [];

            for (const p of parts) {
                const key = caseSensitive ? p : p.toLowerCase();
                const canonical = allowedMap.get(key);
                if (!canonical) {
                    invalid.push(p);
                    continue;
                }
                kept.push(canonical);
            }

            const deduped = Array.from(new Set(kept));
            return {
                sanitized: deduped.join(','),
                invalid,
                keptCount: deduped.length
            };
        };

        const listRules = {
            // Gabor ranges
            gabor_target_tilt_options: { min: -90, max: 90, integersOnly: false },
            gabor_distractor_orientation_options: { min: 0, max: 179, integersOnly: false },

            // RDM direction fields
            direction_options: { min: 0, max: 359, integersOnly: false },
            practice_direction_options: { min: 0, max: 359, integersOnly: false },
            group_1_direction_options: { min: 0, max: 359, integersOnly: false },
            group_2_direction_options: { min: 0, max: 359, integersOnly: false },

            // SART digits
            sart_digit_options: { min: 0, max: 9, integersOnly: true }
        };

        for (const [field, rules] of Object.entries(listRules)) {
            if (!(field in newParameters)) continue;
            const v = newParameters[field];
            if (typeof v !== 'string') continue;

            const res = validateCommaSeparatedNumericList(v, rules);
            if (res.invalid.length === 0) {
                newParameters[field] = res.sanitized;
                continue;
            }

            const rangeNote = `Allowed range: ${rules.min} to ${rules.max}${rules.integersOnly ? ' (integers only)' : ''}.`;
            const msg =
                `Some values in "${field}" are invalid and will be removed.\n\n` +
                `${rangeNote}\n\n` +
                `Invalid: ${res.invalid.join(', ')}\n\n` +
                `Continue and auto-fix?`;

            const ok = window.confirm(msg);
            if (!ok) {
                return; // keep modal open
            }

            newParameters[field] = res.sanitized;
            const inputEl = modalBody.querySelector(`#param_${field}`);
            if (inputEl) {
                inputEl.value = res.sanitized;
            }
        }

        const tokenListRules = {
            // Flanker
            flanker_congruency_options: { allowed: ['congruent', 'incongruent', 'neutral'] },
            flanker_target_direction_options: { allowed: ['left', 'right'] },

            // Gabor
            gabor_target_location_options: { allowed: ['left', 'right'] },
            gabor_spatial_cue_options: { allowed: ['none', 'left', 'right', 'both'] },
            gabor_left_value_options: { allowed: ['neutral', 'high', 'low'] },
            gabor_right_value_options: { allowed: ['neutral', 'high', 'low'] },
            gabor_grating_waveform_options: { allowed: ['sinusoidal', 'square', 'triangle'] }
        };

        for (const [field, rules] of Object.entries(tokenListRules)) {
            if (!(field in newParameters)) continue;
            const v = newParameters[field];
            if (typeof v !== 'string') continue;

            const res = validateCommaSeparatedTokenList(v, rules);
            if (res.invalid.length === 0) {
                newParameters[field] = res.sanitized;
                continue;
            }

            const allowedNote = `Allowed values: ${(rules.allowed || []).join(', ')}.`;
            const msg =
                `Some values in "${field}" are invalid and will be removed.\n\n` +
                `${allowedNote}\n\n` +
                `Invalid: ${res.invalid.join(', ')}\n\n` +
                `Continue and auto-fix?`;

            const ok = window.confirm(msg);
            if (!ok) {
                return; // keep modal open
            }

            newParameters[field] = res.sanitized;
            const inputEl = modalBody.querySelector(`#param_${field}`);
            if (inputEl) {
                inputEl.value = res.sanitized;
            }
        }

        // Update the DOM element's data
        try {
            console.log('Current component data before save:', currentData);

            let updatedData;
            
            // Check if this component uses nested parameters structure
            if (currentData.parameters && typeof currentData.parameters === 'object') {
                // Nested structure - update parameters object
                updatedData = {
                    type: currentData.type, // Explicitly preserve type first
                    name: currentData.name, // Explicitly preserve name
                    ...currentData,
                    parameters: {
                        ...currentData.parameters,
                        ...newParameters
                    }
                };
            } else {
                // Flat structure - merge parameters directly, preserving type and name
                updatedData = {
                    type: currentData.type, // Explicitly preserve type first
                    name: currentData.name, // Explicitly preserve name  
                    ...currentData, // Include any other existing properties
                    ...newParameters // Override with new parameters
                };
            }
            
            // Final safety check - ensure type is never lost
            if (!updatedData.type && currentData.type) {
                updatedData.type = currentData.type;
                console.log('Applied final type safety check');
            }
            
            console.log('Updated component data after save:', updatedData);
            
            this.jsonBuilder.currentEditingComponent.dataset.componentData = JSON.stringify(updatedData);
            console.log('Updated component DOM data:', updatedData);
            console.log('Updated parameters:', updatedData.parameters);
        } catch (e) {
            console.warn('Failed to update component DOM data:', e);
        }

        // Update JSON only - don't re-render timeline since DOM is already updated
        this.jsonBuilder.updateJSON();

        // Close modal
        const paramModal = document.getElementById('parameterModal');
        const bootstrapModal = bootstrap.Modal.getInstance(paramModal);
        if (bootstrapModal) {
            bootstrapModal.hide();
        }
    }

    getExperimentDefault(paramName) {
        const experimentDefaults = this.jsonBuilder.getCurrentRDMParameters();
        const parameterMappings = {
            'coherence': 'rdm_coherence',
            'direction': 'rdm_direction', 
            'speed': 'rdm_speed',
            'stimulus_duration': 'rdm_stimulus_duration',
            'total_dots': 'rdm_total_dots',
            'dot_size': 'rdm_dot_size',
            'aperture_diameter': 'rdm_aperture_diameter'
        };
        
        const formFieldName = parameterMappings[paramName];
        if (formFieldName && experimentDefaults.hasOwnProperty(formFieldName)) {
            return experimentDefaults[formFieldName];
        }
        
        return undefined;
    }
}
