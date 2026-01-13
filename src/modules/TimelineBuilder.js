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
                const optionsHtml = options.map(option => 
                    `<option value="${option}" ${displayValue === option ? 'selected' : ''}>${option}</option>`
                ).join('');
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
        const updateBlockVisibility = () => {
            if (!blockTypeEl) return;
            const selected = blockTypeEl.value;

            formContainer.querySelectorAll('[data-block-target]').forEach(el => {
                const target = el.getAttribute('data-block-target');
                const show = (target === selected);
                el.style.display = show ? '' : 'none';
                el.querySelectorAll('input, select, textarea').forEach(i => {
                    i.disabled = !show;
                });
            });
        };

        if (blockTypeEl) {
            blockTypeEl.addEventListener('change', updateBlockVisibility);
            updateBlockVisibility();
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

        // Collect form data
        const modalBody = document.getElementById('parameterModalBody');
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

        // Update the DOM element's data
        try {
            const currentData = JSON.parse(this.jsonBuilder.currentEditingComponent.dataset.componentData || '{}');
            console.log('Current component data before save:', currentData);
            
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
