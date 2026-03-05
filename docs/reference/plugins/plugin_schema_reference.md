# Plugin Schema Reference

Generated from `src/schemas/JSPsychSchemas.js`.

Generated at: 2026-03-05T19:19:28Z

---

## block

**Type:** `block`

Generate many trials from parameter windows/ranges (compact representation for large experiments)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| adaptive_algorithm | SELECT | quest | RDM Adaptive: adaptive algorithm | options: quest, staircase, simple \| blockTarget: rdm-adaptive |
| adaptive_initial_coherence_max | FLOAT | 0.2 | RDM Adaptive: initial coherence range max (0-1) | blockTarget: rdm-adaptive |
| adaptive_initial_coherence_min | FLOAT | 0.05 | RDM Adaptive: initial coherence range min (0-1) | blockTarget: rdm-adaptive |
| adaptive_step_size_max | FLOAT | 0.08 | RDM Adaptive: step size range max | blockTarget: rdm-adaptive |
| adaptive_step_size_min | FLOAT | 0.02 | RDM Adaptive: step size range min | blockTarget: rdm-adaptive |
| adaptive_target_performance | FLOAT | 0.82 | RDM Adaptive: target performance (fixed) | blockTarget: rdm-adaptive |
| aperture_outline_color | COLOR | #FFFFFF | Outline color when overriding outline visibility | blockTarget: rdm-* |
| aperture_outline_width | FLOAT | 2 | Outline width (px) when overriding outline visibility | blockTarget: rdm-* |
| block_component_type | SELECT | rdm-trial | What component type this block generates | options: rdm-trial, rdm-practice, rdm-adaptive, rdm-dot-groups, flanker-trial, sart-trial, simon-trial, pvt-trial, stroop-trial, emotional-stroop-trial, gabor-trial, gabor-quest, nback-block, html-button-response, html-keyboard-response, image-keyboard-response \| required |
| block_length | INT | 100 | Number of trials/frames this block represents | required |
| button_choices | STRING | Continue | Button labels (comma/newline separated) | blockTarget: html-button-response |
| button_html | HTML_STRING |  | Optional custom button HTML template (advanced) | blockTarget: html-button-response |
| choices | STRING | ALL_KEYS | Keyboard choices: ALL_KEYS, NO_KEYS, or a comma/space-separated list (e.g., "f j") | blockTarget: html-keyboard-response,image-keyboard-response |
| coherence_max | FLOAT | 0.8 | RDM Trial: coherence range max (0-1) | blockTarget: rdm-trial |
| coherence_min | FLOAT | 0.2 | RDM Trial: coherence range min (0-1) | blockTarget: rdm-trial |
| cue_border_color | COLOR | #FFFFFF | RDM Groups: cue border color when cue_border_mode = custom | blockTarget: rdm-dot-groups |
| cue_border_mode | SELECT | off | RDM Groups: aperture border cue mode | options: off, target-group-color, custom \| blockTarget: rdm-dot-groups |
| cue_border_width | INT | 4 | RDM Groups: cue border width in pixels | blockTarget: rdm-dot-groups |
| direction_options | STRING | 0,180 | RDM Trial: comma-separated directions (degrees; 0=right, 90=down, 180=left, 270=up) to sample from. Allowed range: 0 to 359. | blockTarget: rdm-trial |
| dot_color | COLOR | #FFFFFF | Dot color (hex). For dot-groups blocks, set Group 1/2 colors below. | blockTarget: rdm-* |
| end_condition_on_response_mode | SELECT | inherit | Continuous mode only: end the current condition immediately after a response | options: inherit, true, false \| blockTarget: rdm-* |
| feedback_duration_ms | INT | 500 | Feedback duration (ms) when feedback_mode is enabled (corner-text/arrow/custom) | blockTarget: rdm-* |
| feedback_mode | SELECT | inherit | Override response feedback for this block (inherit uses experiment defaults) | options: inherit, off, corner-text, arrow, custom \| blockTarget: rdm-* |
| flanker_congruency_options | STRING | congruent,incongruent | Flanker: comma-separated congruency values to sample from. Allowed: congruent, incongruent, neutral. | blockTarget: flanker-trial |
| flanker_distractor_stimulus_options | STRING | S | Flanker: comma-separated possible distractor stimuli (used when stimulus_type is letters/symbols/custom). | blockTarget: flanker-trial |
| flanker_iti_max | INT | 800 | Flanker: ITI max (ms) | blockTarget: flanker-trial |
| flanker_iti_min | INT | 200 | Flanker: ITI min (ms) | blockTarget: flanker-trial |
| flanker_left_key | STRING | f | Flanker: response key mapped to left | blockTarget: flanker-trial |
| flanker_neutral_stimulus_options | STRING | – | Flanker: comma-separated neutral flanker stimuli (used when stimulus_type is letters/symbols/custom and congruency = neutral). | blockTarget: flanker-trial |
| flanker_right_key | STRING | j | Flanker: response key mapped to right | blockTarget: flanker-trial |
| flanker_show_fixation_cross_between_trials | BOOL | False | Flanker: show fixation cross between trials | blockTarget: flanker-trial |
| flanker_show_fixation_dot | BOOL | False | Flanker: show fixation dot under center stimulus | blockTarget: flanker-trial |
| flanker_stimulus_duration_max | INT | 800 | Flanker: stimulus duration max (ms) | blockTarget: flanker-trial |
| flanker_stimulus_duration_min | INT | 200 | Flanker: stimulus duration min (ms) | blockTarget: flanker-trial |
| flanker_stimulus_type | SELECT | arrows | Flanker: stimulus type | options: arrows, letters, symbols, custom \| blockTarget: flanker-trial |
| flanker_target_direction_options | STRING | left,right | Flanker: comma-separated target directions to sample from (used for arrows). Allowed: left, right. | blockTarget: flanker-trial |
| flanker_target_stimulus_options | STRING | H | Flanker: comma-separated possible center stimuli (used when stimulus_type is letters/symbols/custom). Example: H,S,@. | blockTarget: flanker-trial |
| flanker_trial_duration_max | INT | 2000 | Flanker: trial duration max (ms) | blockTarget: flanker-trial |
| flanker_trial_duration_min | INT | 1000 | Flanker: trial duration min (ms) | blockTarget: flanker-trial |
| gabor_adaptive_mode | SELECT | none | Gabor: optional adaptive staircase mode for this block | options: none, quest \| blockTarget: gabor-trial,gabor-quest |
| gabor_distractor_orientation_options | STRING | 0,90 | Gabor: comma-separated distractor orientations (degrees) to sample from. Allowed range: 0 to 179. | blockTarget: gabor-trial,gabor-quest |
| gabor_grating_waveform_options | STRING | sinusoidal | Gabor: comma-separated grating waveforms to sample from. Allowed: sinusoidal, square, triangle. | blockTarget: gabor-trial,gabor-quest |
| gabor_left_key | STRING | f | Gabor: left key (discriminate_tilt) | blockTarget: gabor-trial,gabor-quest |
| gabor_left_value_options | STRING | neutral,high,low | Gabor: comma-separated left value cue options to sample from. Allowed: neutral, high, low. | blockTarget: gabor-trial,gabor-quest |
| gabor_mask_duration_max | INT | 67 | Gabor: mask duration max (ms) | blockTarget: gabor-trial,gabor-quest |
| gabor_mask_duration_min | INT | 67 | Gabor: mask duration min (ms) | blockTarget: gabor-trial,gabor-quest |
| gabor_no_key | STRING | j | Gabor: no key (detect_target) | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_border_color | COLOR | #FFFFFF | Gabor: patch border color | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_border_enabled | BOOL | True | Gabor: draw circular patch border (applies to stimulus + mask + placeholders) | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_border_opacity | FLOAT | 0.22 | Gabor: patch border opacity (0–1) | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_border_width_px | INT | 2 | Gabor: patch border line width (px) | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_diameter_deg_max | FLOAT | 6 | Gabor: patch diameter max (degrees of visual angle) | blockTarget: gabor-trial,gabor-quest |
| gabor_patch_diameter_deg_min | FLOAT | 6 | Gabor: patch diameter min (degrees of visual angle) | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_beta | FLOAT | 3.5 | Gabor QUEST: beta (slope) | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_delta | FLOAT | 0.01 | Gabor QUEST: lapse rate (delta) | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_gamma | FLOAT | 0.5 | Gabor QUEST: guess rate (gamma) | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_max_value | FLOAT | 90 | Gabor QUEST: maximum allowed value | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_min_value | FLOAT | -90 | Gabor QUEST: minimum allowed value | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_parameter | SELECT | target_tilt_deg | Gabor QUEST: which parameter to adapt | options: target_tilt_deg, spatial_frequency_cyc_per_px \| blockTarget: gabor-trial,gabor-quest |
| gabor_quest_start_sd | FLOAT | 20 | Gabor QUEST: initial SD | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_start_value | FLOAT | 45 | Gabor QUEST: initial value | blockTarget: gabor-trial,gabor-quest |
| gabor_quest_target_performance | FLOAT | 0.82 | Gabor QUEST: target performance level (e.g., 0.82) | blockTarget: gabor-trial,gabor-quest |
| gabor_response_task | SELECT | discriminate_tilt | Gabor: response task mode for generated trials | options: detect_target, discriminate_tilt \| blockTarget: gabor-trial,gabor-quest |
| gabor_right_key | STRING | j | Gabor: right key (discriminate_tilt) | blockTarget: gabor-trial,gabor-quest |
| gabor_right_value_options | STRING | neutral,high,low | Gabor: comma-separated right value cue options to sample from. Allowed: neutral, high, low. | blockTarget: gabor-trial,gabor-quest |
| gabor_spatial_cue_enabled | BOOL | True | Gabor: enable sampling spatial cue presence per trial (when false: spatial_cue forced to none) | blockTarget: gabor-trial,gabor-quest |
| gabor_spatial_cue_options | STRING | none,left,right,both | Gabor: comma-separated spatial cue options to sample from. Allowed: none, left, right, both. | blockTarget: gabor-trial,gabor-quest |
| gabor_spatial_cue_probability | FLOAT | 1 | Gabor: probability a trial contains a spatial cue (0–1) | blockTarget: gabor-trial,gabor-quest |
| gabor_spatial_frequency_max | FLOAT | 0.06 | Gabor: spatial frequency max (cycles per pixel) | blockTarget: gabor-trial,gabor-quest |
| gabor_spatial_frequency_min | FLOAT | 0.06 | Gabor: spatial frequency min (cycles per pixel) | blockTarget: gabor-trial,gabor-quest |
| gabor_stimulus_duration_max | INT | 67 | Gabor: stimulus duration max (ms) | blockTarget: gabor-trial,gabor-quest |
| gabor_stimulus_duration_min | INT | 67 | Gabor: stimulus duration min (ms) | blockTarget: gabor-trial,gabor-quest |
| gabor_target_location_options | STRING | left,right | Gabor: comma-separated target locations to sample from. Allowed: left, right. | blockTarget: gabor-trial,gabor-quest |
| gabor_target_tilt_options | STRING | -45,45 | Gabor: comma-separated target tilts (degrees) to sample from. Allowed range: -90 to 90. | blockTarget: gabor-trial,gabor-quest |
| gabor_value_cue_enabled | BOOL | True | Gabor: enable sampling value cue presence per trial (when false: left/right_value forced to neutral) | blockTarget: gabor-trial,gabor-quest |
| gabor_value_cue_probability | FLOAT | 1 | Gabor: probability a trial contains value cues (0–1) | blockTarget: gabor-trial,gabor-quest |
| gabor_yes_key | STRING | f | Gabor: yes key (detect_target) | blockTarget: gabor-trial,gabor-quest |
| group_1_coherence_max | FLOAT | 0.5 | RDM Groups: group 1 coherence max (0-1) | blockTarget: rdm-dot-groups |
| group_1_coherence_min | FLOAT | 0.1 | RDM Groups: group 1 coherence min (0-1) | blockTarget: rdm-dot-groups |
| group_1_color | COLOR | #FF0066 | RDM Groups: group 1 dot color (hex) | blockTarget: rdm-dot-groups |
| group_1_direction_options | STRING | 0,180 | RDM Groups: group 1 comma-separated direction options (degrees; 0=right, 90=down, 180=left, 270=up). Allowed range: 0 to 359. | blockTarget: rdm-dot-groups |
| group_1_percentage_max | INT | 60 | RDM Groups: group 1 percentage max (0-100) | blockTarget: rdm-dot-groups |
| group_1_percentage_min | INT | 40 | RDM Groups: group 1 percentage min (0-100) | blockTarget: rdm-dot-groups |
| group_1_speed_max | FLOAT | 10 | RDM Groups: group 1 speed max | blockTarget: rdm-dot-groups |
| group_1_speed_min | FLOAT | 4 | RDM Groups: group 1 speed min | blockTarget: rdm-dot-groups |
| group_2_coherence_max | FLOAT | 0.9 | RDM Groups: group 2 coherence max (0-1) | blockTarget: rdm-dot-groups |
| group_2_coherence_min | FLOAT | 0.5 | RDM Groups: group 2 coherence min (0-1) | blockTarget: rdm-dot-groups |
| group_2_color | COLOR | #0066FF | RDM Groups: group 2 dot color (hex) | blockTarget: rdm-dot-groups |
| group_2_direction_options | STRING | 0,180 | RDM Groups: group 2 comma-separated direction options (degrees; 0=right, 90=down, 180=left, 270=up). Allowed range: 0 to 359. | blockTarget: rdm-dot-groups |
| group_2_speed_max | FLOAT | 10 | RDM Groups: group 2 speed max | blockTarget: rdm-dot-groups |
| group_2_speed_min | FLOAT | 4 | RDM Groups: group 2 speed min | blockTarget: rdm-dot-groups |
| mouse_segments | INT | 2 | Mouse response: number of aperture segments (used when response_device = mouse) | blockTarget: rdm-* |
| mouse_selection_mode | SELECT | click | Mouse response: how a segment selection is registered | options: click, hover \| blockTarget: rdm-* |
| mouse_start_angle_deg | FLOAT | 0 | Mouse response: segment start angle offset in degrees (0=right; 90=down; 180=left; 270=up). Angles increase clockwise (screen/canvas coordinates). | blockTarget: rdm-* |
| nback_feedback_duration_ms | INT | 250 | Feedback duration (ms) | min: 0 \| max: 5000 \| blockTarget: nback-block |
| nback_go_key | STRING | space | Go key for matches (go/no-go) | blockTarget: nback-block |
| nback_isi_duration_ms | INT | 700 | Inter-stimulus interval duration (ms) | min: 0 \| max: 60000 \| blockTarget: nback-block |
| nback_match_key | STRING | j | Match key (2AFC) | blockTarget: nback-block |
| nback_n | INT | 2 | N-back depth | min: 1 \| max: 6 \| blockTarget: nback-block |
| nback_nonmatch_key | STRING | f | Non-match key (2AFC) | blockTarget: nback-block |
| nback_render_mode | SELECT | token | Whether to render raw token text or use a custom HTML template | options: token, custom_html \| blockTarget: nback-block |
| nback_response_device | SELECT | inherit | Response device used by generated N-back items | options: inherit, keyboard, mouse \| blockTarget: nback-block |
| nback_response_paradigm | SELECT | go_nogo | go_nogo: respond on matches; 2afc: match vs non-match keys | options: go_nogo, 2afc \| blockTarget: nback-block |
| nback_show_buttons | BOOL | True | Show clickable buttons when using mouse | blockTarget: nback-block |
| nback_show_feedback | BOOL | False | Show correctness feedback after response/timeout | blockTarget: nback-block |
| nback_show_fixation_cross_between_trials | BOOL | False | Show a fixation cross (+) when the token is hidden (during ISI/ITI between items) | blockTarget: nback-block |
| nback_stimulus_duration_ms | INT | 500 | Stimulus display duration (ms) | min: 0 \| max: 60000 \| blockTarget: nback-block |
| nback_stimulus_mode | SELECT | letters | Token set to use (custom uses the custom pool string) | options: letters, numbers, shapes, custom \| blockTarget: nback-block |
| nback_stimulus_pool | STRING |  | Custom pool tokens (comma/newline separated); used when stimulus_mode=custom | blockTarget: nback-block |
| nback_stimulus_template_html | HTML_STRING | <div style="font-size:72px; font-weight:700; letter-spacing:0.02em;">{{TOKEN}}</div> | HTML template used when render_mode=custom_html. Variable: {{TOKEN}} | blockTarget: nback-block |
| nback_target_probability | FLOAT | 0.25 | Probability an item is forced to match the item N-back | min: 0 \| max: 1 \| blockTarget: nback-block |
| nback_trial_duration_ms | INT | 1200 | Total item/trial duration (ms) | min: 0 \| max: 60000 \| blockTarget: nback-block |
| practice_coherence_max | FLOAT | 0.9 | RDM Practice: coherence range max (0-1) | blockTarget: rdm-practice |
| practice_coherence_min | FLOAT | 0.5 | RDM Practice: coherence range min (0-1) | blockTarget: rdm-practice |
| practice_direction_options | STRING | 0,180 | RDM Practice: comma-separated directions (degrees; 0=right, 90=down, 180=left, 270=up) to sample from. Allowed range: 0 to 359. | blockTarget: rdm-practice |
| practice_feedback_duration_max | INT | 1500 | RDM Practice: feedback duration max (ms) | blockTarget: rdm-practice |
| practice_feedback_duration_min | INT | 750 | RDM Practice: feedback duration min (ms) | blockTarget: rdm-practice |
| prompt | HTML_STRING |  | Optional prompt shown below the stimulus (HTML allowed) | blockTarget: html-keyboard-response,html-button-response,image-keyboard-response |
| pvt_foreperiod_max | INT | 10000 | PVT: foreperiod max (ms) | blockTarget: pvt-trial |
| pvt_foreperiod_min | INT | 2000 | PVT: foreperiod min (ms) | blockTarget: pvt-trial |
| pvt_iti_max | INT | 0 | PVT: ITI max (ms) | blockTarget: pvt-trial |
| pvt_iti_min | INT | 0 | PVT: ITI min (ms) | blockTarget: pvt-trial |
| pvt_response_device | SELECT | inherit | PVT: response device override for generated trials | options: inherit, keyboard, mouse, both \| blockTarget: pvt-trial |
| pvt_response_key | STRING | space | PVT: response key (keyboard mode) | blockTarget: pvt-trial |
| pvt_trial_duration_max | INT | 10000 | PVT: trial duration max (ms) | blockTarget: pvt-trial |
| pvt_trial_duration_min | INT | 10000 | PVT: trial duration min (ms) | blockTarget: pvt-trial |
| require_response_mode | SELECT | inherit | Override require_response for this block | options: inherit, true, false \| blockTarget: rdm-* |
| response_device | SELECT | inherit | Override response device for this block (inherit uses experiment defaults) | options: inherit, keyboard, mouse, touch, voice, custom \| blockTarget: rdm-* |
| response_keys | STRING |  | Comma-separated keys for keyboard responses (blank = inherit) | blockTarget: rdm-* |
| response_target_group | SELECT | none | RDM Groups: which dot group the participant should respond to | options: none, group_1, group_2 \| blockTarget: rdm-dot-groups |
| sampling_mode | SELECT | per-trial | per-trial samples new parameters each trial; per-block samples once and reuses | options: per-trial, per-block |
| sart_digit_options | STRING | 1,2,3,4,5,6,7,8,9 | SART: comma-separated digits to sample from. Allowed range: 0 to 9. | blockTarget: sart-trial |
| sart_go_key | STRING | space | SART: response key for GO trials | blockTarget: sart-trial |
| sart_iti_max | INT | 800 | SART: ITI max (ms) | blockTarget: sart-trial |
| sart_iti_min | INT | 200 | SART: ITI min (ms) | blockTarget: sart-trial |
| sart_mask_duration_max | INT | 1200 | SART: mask duration max (ms) | blockTarget: sart-trial |
| sart_mask_duration_min | INT | 600 | SART: mask duration min (ms) | blockTarget: sart-trial |
| sart_nogo_digit | INT | 3 | SART: no-go digit (withhold response) | blockTarget: sart-trial |
| sart_stimulus_duration_max | INT | 400 | SART: stimulus duration max (ms) | blockTarget: sart-trial |
| sart_stimulus_duration_min | INT | 150 | SART: stimulus duration min (ms) | blockTarget: sart-trial |
| sart_trial_duration_max | INT | 2000 | SART: total trial duration max (ms) | blockTarget: sart-trial |
| sart_trial_duration_min | INT | 800 | SART: total trial duration min (ms) | blockTarget: sart-trial |
| seed | STRING |  | Optional random seed (blank = no seed) |  |
| show_aperture_outline_mode | SELECT | inherit | Aperture outline override for generated RDM trials (inherit uses experiment-wide aperture_parameters) | options: inherit, true, false \| blockTarget: rdm-* |
| simon_color_options | STRING | BLUE,ORANGE | Simon: comma-separated stimulus color names to sample from (should match simon_settings.stimuli names) | blockTarget: simon-trial |
| simon_iti_max | INT | 500 | Simon: ITI max (ms) | blockTarget: simon-trial |
| simon_iti_min | INT | 500 | Simon: ITI min (ms) | blockTarget: simon-trial |
| simon_left_key | STRING | f | Simon: key for LEFT response (keyboard mode) | blockTarget: simon-trial |
| simon_response_device | SELECT | inherit | Simon: response device override for generated trials | options: inherit, keyboard, mouse \| blockTarget: simon-trial |
| simon_right_key | STRING | j | Simon: key for RIGHT response (keyboard mode) | blockTarget: simon-trial |
| simon_side_options | STRING | left,right | Simon: comma-separated sides to sample from. Allowed: left, right. | blockTarget: simon-trial |
| simon_stimulus_duration_max | INT | 0 | Simon: stimulus duration max (ms). 0 = until response/trial end. | blockTarget: simon-trial |
| simon_stimulus_duration_min | INT | 0 | Simon: stimulus duration min (ms). 0 = until response/trial end. | blockTarget: simon-trial |
| simon_trial_duration_max | INT | 1500 | Simon: total trial duration max (ms) | blockTarget: simon-trial |
| simon_trial_duration_min | INT | 1500 | Simon: total trial duration min (ms) | blockTarget: simon-trial |
| speed_max | FLOAT | 10 | RDM Trial: speed range max | blockTarget: rdm-trial |
| speed_min | FLOAT | 4 | RDM Trial: speed range min | blockTarget: rdm-trial |
| stimulus_html | HTML_STRING | <p>Replace this with your HTML.</p> | HTML stimulus content for generated trials | blockTarget: html-keyboard-response,html-button-response |
| stimulus_image | IMAGE |  | Single image URL or filename (e.g., "img1.png" after uploading assets). If you provide stimulus_images, it takes precedence. | blockTarget: image-keyboard-response |
| stimulus_images | HTML_STRING |  | List of images (comma or newline separated). Use this to sample different images across trials in the Block (works with uploaded assets filenames). | blockTarget: image-keyboard-response |
| stroop_choice_keys | STRING | 1,2 | Stroop color-naming: comma-separated key labels mapped to each stimulus in order (e.g., 1,2,3,4) | blockTarget: stroop-trial |
| stroop_congruency_options | STRING | auto,congruent,incongruent | Stroop: comma-separated congruency modes to sample from. Allowed: auto, congruent, incongruent. | blockTarget: stroop-trial |
| stroop_congruent_key | STRING | f | Stroop congruency: key for CONGRUENT (keyboard mode) | blockTarget: stroop-trial |
| stroop_incongruent_key | STRING | j | Stroop congruency: key for INCONGRUENT (keyboard mode) | blockTarget: stroop-trial |
| stroop_iti_max | INT | 500 | Stroop: ITI max (ms) | blockTarget: stroop-trial |
| stroop_iti_min | INT | 500 | Stroop: ITI min (ms) | blockTarget: stroop-trial |
| stroop_response_device | SELECT | inherit | Stroop: response device override for generated trials | options: inherit, keyboard, mouse \| blockTarget: stroop-trial |
| stroop_response_mode | SELECT | inherit | Stroop: response mode override for generated trials (inherit uses experiment stroop_settings) | options: inherit, color_naming, congruency \| blockTarget: stroop-trial |
| stroop_stimulus_duration_max | INT | 0 | Stroop: stimulus duration max (ms). 0 = until response/trial end. | blockTarget: stroop-trial |
| stroop_stimulus_duration_min | INT | 0 | Stroop: stimulus duration min (ms). 0 = until response/trial end. | blockTarget: stroop-trial |
| stroop_trial_duration_max | INT | 2000 | Stroop: total trial duration max (ms) | blockTarget: stroop-trial |
| stroop_trial_duration_min | INT | 2000 | Stroop: total trial duration min (ms) | blockTarget: stroop-trial |
| stroop_word_options | STRING | RED,BLUE | Stroop: comma-separated stimulus names to sample from (should match your experiment-wide stimulus library names). Used for both word and ink-color sampling. | blockTarget: stroop-trial |
| transition_duration | INT | 500 | Continuous mode only: duration of the transition to the next condition (ms) | blockTarget: rdm-* |
| transition_type | SELECT | both | Continuous mode only: transition type (color = gradient, speed = slow/fast, both = combine) | options: both, color, speed \| blockTarget: rdm-* |

---

## flanker-trial

**Type:** `flanker-trial`

Flanker trial/frame (stimulus + scoring implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| congruency | SELECT | congruent | Congruency condition | options: congruent, incongruent, neutral |
| distractor_stimulus | STRING | S | Distractor stimulus used when congruency = incongruent (letters/symbols/custom) |  |
| iti_ms | INT | 500 | Inter-trial interval (ms) |  |
| left_key | STRING | f | Response key mapped to left |  |
| neutral_stimulus | STRING | – | Neutral flanker stimulus used when congruency = neutral |  |
| right_key | STRING | j | Response key mapped to right |  |
| show_fixation_cross_between_trials | BOOL | False | Show a fixation cross between trials (during ITI/inter-stimulus) |  |
| show_fixation_dot | BOOL | False | Show a small fixation dot under the center stimulus |  |
| stimulus_duration_ms | INT | 800 | Stimulus display duration (ms) |  |
| stimulus_type | SELECT | arrows | What kind of stimuli to display (arrows vs letters/symbols/custom strings) | options: arrows, letters, symbols, custom |
| target_direction | SELECT | left | Target direction (for arrow-style flankers) | options: left, right |
| target_stimulus | STRING | H | Center stimulus when stimulus_type is letters/symbols/custom |  |
| trial_duration_ms | INT | 1500 | Total trial duration (ms) |  |

---

## gabor-trial

**Type:** `gabor-trial`

Gabor patch trial/frame (stimulus + scoring implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| distractor_orientation_deg | FLOAT | 0 | Distractor orientation (degrees) |  |
| grating_waveform | SELECT | sinusoidal | Waveform of the grating carrier | options: sinusoidal, square, triangle |
| left_key | STRING | f | Left response key (for discriminate_tilt) |  |
| left_value | SELECT | neutral | Value cue for left location (frame color mapping via gabor_settings) | options: neutral, high, low |
| mask_duration_ms | INT | 67 | Mask duration after stimulus (ms) |  |
| no_key | STRING | j | No key (for detect_target) |  |
| patch_border_color | COLOR | #FFFFFF | Patch border color (hex) |  |
| patch_border_enabled | BOOL | True | Whether to draw a circular border around each patch (stimulus + mask) |  |
| patch_border_opacity | FLOAT | 0.22 | Patch border opacity (0–1) |  |
| patch_border_width_px | INT | 2 | Patch border stroke width (px) |  |
| patch_diameter_deg | FLOAT | 6 | Patch diameter in degrees of visual angle (requires Visual Angle Calibration for true deg-based sizing) |  |
| response_task | SELECT | discriminate_tilt | Whether participant detects the target (yes/no) or discriminates its tilt (left/right) | options: detect_target, discriminate_tilt |
| right_key | STRING | j | Right response key (for discriminate_tilt) |  |
| right_value | SELECT | neutral | Value cue for right location (frame color mapping via gabor_settings) | options: neutral, high, low |
| spatial_cue | SELECT | none | Spatial cue direction | options: none, left, right, both |
| spatial_frequency_cyc_per_px | FLOAT | 0.06 | Spatial frequency (cycles per pixel) of the grating carrier |  |
| stimulus_duration_ms | INT | 67 | Stimulus display duration (ms) |  |
| target_location | SELECT | left | Which location contains the target | options: left, right |
| target_tilt_deg | FLOAT | 45 | Target orientation tilt (degrees) |  |
| yes_key | STRING | f | Yes key (for detect_target) |  |

---

## html-button-response

**Type:** `html-button-response`

Display HTML stimulus and collect button response

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| button_html | FUNCTION | null | Custom HTML for buttons |  |
| button_layout | STRING | grid | How to arrange buttons |  |
| choices | STRING |  | Labels for buttons | required |
| grid_columns | INT | null | Number of columns in button grid |  |
| grid_rows | INT | 1 | Number of rows in button grid |  |
| prompt | HTML_STRING | null | Prompt text displayed below stimulus |  |
| response_ends_trial | BOOL | True | End trial immediately after response |  |
| stimulus | HTML_STRING |  | HTML content to display | required |
| stimulus_duration | INT | null | How long to show stimulus (ms) |  |
| trial_duration | INT | null | Maximum time allowed for response (ms) |  |

---

## html-keyboard-response

**Type:** `html-keyboard-response`

Display HTML stimulus and collect keyboard response

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| choices | KEYS | ALL_KEYS | Keys that will be accepted as responses |  |
| prompt | HTML_STRING | null | Prompt text displayed below stimulus |  |
| response_ends_trial | BOOL | True | End trial immediately after response |  |
| stimulus | HTML_STRING |  | HTML content to display | required |
| stimulus_duration | INT | null | How long to show stimulus (ms) |  |
| trial_duration | INT | null | Maximum time allowed for response (ms) |  |

---

## image-keyboard-response

**Type:** `image-keyboard-response`

Display image stimulus and collect keyboard response

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| choices | KEYS | ALL_KEYS | Keys that will be accepted as responses |  |
| maintain_aspect_ratio | BOOL | True | Maintain image aspect ratio |  |
| prompt | HTML_STRING | null | Prompt text displayed below stimulus |  |
| response_ends_trial | BOOL | True | End trial immediately after response |  |
| stimulus | IMAGE |  | Path to image file | required |
| stimulus_duration | INT | null | How long to show stimulus (ms) |  |
| stimulus_height | INT | null | Height of image in pixels |  |
| stimulus_width | INT | null | Width of image in pixels |  |
| trial_duration | INT | null | Maximum time allowed for response (ms) |  |

---

## instructions

**Type:** `instructions`

Display instructions to participants

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| allow_backward | BOOL | True | Allow participants to go back |  |
| allow_keys | BOOL | True | Allow keyboard navigation |  |
| button_label_next | STRING | Next | Text for next button |  |
| button_label_previous | STRING | Previous | Text for previous button |  |
| key_backward | KEY | ArrowLeft | Key to go back to previous page |  |
| key_forward | KEY | ArrowRight | Key to advance to next page |  |
| pages | HTML_STRING |  | Array of instruction pages to display | required |
| show_clickable_nav | BOOL | False | Show clickable navigation buttons |  |

---

## nback-block

**Type:** `nback-block`

N-back item (single trial/frame). Usually generated by nback-trial-sequence.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| feedback_duration_ms | INT | 300 | Feedback duration (ms) | min: 0 \| max: 10000 |
| go_key | KEY | space | Go key (and accepted as Match key when response_paradigm=2afc and match_key is blank) |  |
| isi_duration_ms | INT | 500 | Inter-stimulus interval (ms) | min: 0 \| max: 60000 |
| match_key | KEY | j | 2AFC: key for MATCH |  |
| n | INT | 2 | N-back level (used for scoring when a sequence context is present) | min: 1 \| max: 9 |
| nonmatch_key | KEY | f | 2AFC: key for NO MATCH |  |
| render_mode | SELECT | token | Render stimulus as token label or via stimulus_template_html | options: token, custom_html |
| response_device | SELECT | inherit | Primary response device | options: inherit, keyboard, mouse |
| response_paradigm | SELECT | go_nogo | Go/No-Go (single key) vs 2AFC (match vs non-match keys) | options: go_nogo, 2afc |
| show_buttons | BOOL | False | Mouse mode: show clickable response buttons |  |
| show_feedback | BOOL | False | Show brief Correct/Incorrect feedback after responses |  |
| show_fixation_cross_between_trials | BOOL | False | Show a fixation cross (+) when the token is hidden (during ISI/ITI between items) |  |
| stimulus_duration_ms | INT | 500 | Stimulus display duration (ms) | min: 0 \| max: 60000 |
| stimulus_template_html | HTML_STRING | <div style="font-size:72px; font-weight:700; text-align:center;">{{TOKEN}}</div> | Used when render_mode=custom_html ({{TOKEN}} is replaced with the token) |  |
| token | STRING | A | Stimulus token to show (e.g., A, 7, ●) |  |
| trial_duration_ms | INT | 1000 | Total trial duration (ms). 0 = no timeout. | min: 0 \| max: 60000 |

---

## nback-trial-sequence

**Type:** `nback-trial-sequence`

N-back trial sequence generator (expanded by interpreter/compiler into nback-block items)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| feedback_duration_ms | INT | 300 | Feedback duration (ms) | min: 0 \| max: 10000 |
| go_key | KEY | space | Go key (and accepted as Match key when response_paradigm=2afc and match_key is blank) |  |
| isi_duration_ms | INT | 500 | Inter-stimulus interval (ms) | min: 0 \| max: 60000 |
| length | INT | 30 | Number of trials/frames to generate | min: 1 \| max: 50000 |
| match_key | KEY | j | 2AFC: key for MATCH |  |
| n | INT | 2 | N-back level | min: 1 \| max: 9 |
| nonmatch_key | KEY | f | 2AFC: key for NO MATCH |  |
| render_mode | SELECT | token | Render each stimulus as a token label or via stimulus_template_html | options: token, custom_html |
| response_device | SELECT | keyboard | Primary response device | options: keyboard, mouse |
| response_paradigm | SELECT | go_nogo | Go/No-Go (single key) vs 2AFC (match vs non-match keys) | options: go_nogo, 2afc |
| seed | STRING |  | Optional seed for deterministic sequence generation (blank = interpreter default) |  |
| show_buttons | BOOL | False | Mouse mode: show clickable response buttons |  |
| show_feedback | BOOL | False | Show brief Correct/Incorrect feedback after responses |  |
| show_fixation_cross_between_trials | BOOL | False | Show a fixation cross (+) when the token is hidden (during ISI/ITI between items) |  |
| stimulus_duration_ms | INT | 500 | Stimulus display duration (ms) | min: 0 \| max: 60000 |
| stimulus_mode | SELECT | letters | How to interpret stimulus_pool defaults | options: letters, numbers, shapes, custom |
| stimulus_pool | STRING | A,B,C,D,E,F,G,H | Comma/newline-separated stimulus tokens to sample from |  |
| stimulus_template_html | HTML_STRING | <div style="font-size:72px; font-weight:700; text-align:center;">{{TOKEN}}</div> | Used when render_mode=custom_html ({{TOKEN}} is replaced with the token) |  |
| target_probability | FLOAT | 0.25 | Probability a given trial is an N-back match (applies only once i >= n) | min: 0 \| max: 1 |
| trial_duration_ms | INT | 1000 | Total trial duration (ms). 0 = no timeout. | min: 0 \| max: 60000 |

---

## preload

**Type:** `preload`

Preload images, audio, and video files

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| audio | AUDIO | [] | Array of audio files to preload |  |
| auto_preload | BOOL | False | Automatically detect files to preload |  |
| continue_after_error | BOOL | False | Continue if file fails to load |  |
| images | IMAGE | [] | Array of image files to preload |  |
| max_load_time | INT | null | Maximum time to spend loading files (ms) |  |
| message | HTML_STRING | null | Message to show during preloading |  |
| show_progress_bar | BOOL | True | Show preloading progress bar |  |
| trials | TIMELINE | [] | Timeline to scan for files to preload |  |
| video | VIDEO | [] | Array of video files to preload |  |

---

## pvt-trial

**Type:** `pvt-trial`

Psychomotor Vigilance Task trial (foreperiod, running 4-digit timer, keyboard/click response; logic implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| foreperiod_ms | INT | 4000 | Delay before the timer starts (ms) | min: 0 \| max: 60000 |
| iti_ms | INT | 0 | Inter-trial interval after response/timeout (ms) | min: 0 \| max: 30000 |
| response_device | SELECT | inherit | Override experiment-wide response_device (inherit uses pvt_settings.response_device) | options: inherit, keyboard, mouse, both |
| response_key | KEY | space | Keyboard key used to respond (ignored if response_device=mouse) |  |
| trial_duration_ms | INT | 10000 | Timeout after timer starts (ms). 0 = no timeout. | min: 0 \| max: 60000 |

---

## reward-settings

**Type:** `reward-settings`

Reward policy configuration + optional participant-facing instructions and end-of-experiment summary

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| calculate_on_the_fly | BOOL | True | If true, reward points are computed as trials finish; if false, they are computed at summary time using recorded outcomes |  |
| continue_key | SELECT | space | Key(s) used to continue past instructions/summary | options: space, enter, ALL_KEYS |
| currency_label | STRING | points | Label for the reward currency (e.g., points, tokens, cents) |  |
| instructions_template_html | HTML_STRING | <p>You can earn <b>{{currency_label}}</b> during this study.</p><br/><ul><br/><li><b>Basis</b>: {{scoring_basis_label}}</li><br/><li><b>RT threshold</b>: {{rt_threshold_ms}} ms</li><br/><li><b>Points per success</b>: {{points_per_success}}</li><br/></ul><br/><p>Press {{continue_key_label}} to begin.</p> | Participant instructions (HTML allowed). Variables: {{currency_label}}, {{scoring_basis_label}}, {{rt_threshold_ms}}, {{points_per_success}}, {{continue_key_label}} |  |
| instructions_title | STRING | Rewards | Title shown on the reward instructions screen |  |
| points_per_success | FLOAT | 1 | Points awarded for each rewarded trial |  |
| require_correct_for_rt | BOOL | False | If true, RT-based rewards require correctness when correctness is available |  |
| rt_threshold_ms | INT | 600 | Reaction time cutoff (ms) for reaction-time or both modes |  |
| scoring_basis | SELECT | both | What constitutes a rewarded trial | options: accuracy, reaction_time, both |
| show_summary_at_end | BOOL | True | If true, interpreter shows a reward summary screen at the end |  |
| store_key | STRING | __psy_rewards | Global key used to store reward policy and state (window[store_key]) |  |
| summary_template_html | HTML_STRING | <p><b>Total earned</b>: {{total_points}} {{currency_label}}</p><br/><p><b>Rewarded trials</b>: {{rewarded_trials}} / {{eligible_trials}}</p><br/><p>Press {{continue_key_label}} to finish.</p> | Summary HTML. Variables also include: {{total_points}}, {{rewarded_trials}}, {{eligible_trials}} |  |
| summary_title | STRING | Rewards Summary | Title shown on the end-of-experiment summary screen |  |

---

## sart-trial

**Type:** `sart-trial`

SART trial/frame (go/no-go logic implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| digit | INT | 1 | Digit to display (0-9) |  |
| go_key | STRING | space | Response key for go trials |  |
| iti_ms | INT | 0 | Inter-trial interval (ms) |  |
| mask_duration_ms | INT | 900 | Mask duration after digit (ms) |  |
| nogo_digit | INT | 3 | No-go digit (withhold response) |  |
| stimulus_duration_ms | INT | 250 | Digit display duration (ms) |  |
| trial_duration_ms | INT | 1150 | Total trial duration (ms) |  |

---

## simon-trial

**Type:** `simon-trial`

Simon trial (colored circle appears left/right; respond by mapped color-side; scoring implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| circle_diameter_px | INT | 140 | Diameter of each circle (px) | min: 40 \| max: 400 |
| iti_ms | INT | 500 | Inter-trial interval (ms) |  |
| left_key | KEY | f | Keyboard key for LEFT response (when response_device=keyboard) |  |
| response_device | SELECT | inherit | Override experiment-wide response_device (inherit uses simon_settings.response_device) | options: inherit, keyboard, mouse |
| right_key | KEY | j | Keyboard key for RIGHT response (when response_device=keyboard) |  |
| stimulus_color_name | STRING | BLUE | Name of the stimulus color (looked up in simon_settings.stimuli by name) |  |
| stimulus_duration_ms | INT | 0 | Stimulus display duration (ms). 0 = until response/trial end. |  |
| stimulus_side | SELECT | left | Which side the colored stimulus circle appears on | options: left, right |
| trial_duration_ms | INT | 1500 | Total trial duration (ms). 0 = no timeout. |  |

---

## soc-dashboard

**Type:** `soc-dashboard`

SOC Dashboard session (Windows-like shell). Subtasks are added in the Builder and composed into this session on export.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| background_color | STRING | #0b1220 | Background color used when no wallpaper URL is provided |  |
| default_app | SELECT | soc | Initial active app | options: soc, email, terminal |
| end_key | STRING | escape | Key that ends the session |  |
| icon_clicks_are_distractors | BOOL | True | Tag icon-click events as distractors |  |
| icons_clickable | BOOL | True | Whether desktop icons appear clickable (interpreter logs clicks as distractors) |  |
| log_icon_clicks | BOOL | True | Whether to log desktop icon clicks |  |
| num_tasks | INT | 1 | Fallback: number of placeholder windows shown when no subtasks are configured (1–4) | min: 1 \| max: 4 |
| start_menu_enabled | BOOL | True | Enable Start button |  |
| title | STRING | SOC Dashboard | Session title (shown in subtask windows) |  |
| trial_duration_ms | INT | 60000 | Session duration in ms (0 = no auto-end) |  |
| wallpaper_url | STRING |  | Optional wallpaper image URL |  |

---

## soc-dashboard-icon

**Type:** `soc-dashboard-icon`

Desktop icon definition (composed into the nearest SOC session at export time)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| app | SELECT | email | App to activate when clicked | options: soc, email, terminal |
| col | INT | 0 | Grid column |  |
| distractor | BOOL | True | Whether clicking this icon should be treated as a distractor |  |
| icon_text | STRING | ✉ | Simple text glyph used as icon |  |
| label | STRING | Email | Icon label |  |
| row | INT | 0 | Grid row |  |

---

## soc-subtask-flanker-like

**Type:** `soc-subtask-flanker-like`

SOC subtask window (Flanker-like). Composed into the nearest SOC Dashboard session at export time.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| allow_key | STRING | f | Keyboard key for ALLOW / "No" (e.g., f) |  |
| center_high_probability | FLOAT | 0.34 | Probability the center spike is HIGH (0–1). Probabilities are normalized at runtime. | min: 0 \| max: 1 |
| center_low_probability | FLOAT | 0.33 | Probability the center spike is LOW (0–1). Probabilities are normalized at runtime. | min: 0 \| max: 1 |
| center_medium_probability | FLOAT | 0.33 | Probability the center spike is MEDIUM (0–1). Probabilities are normalized at runtime. | min: 0 \| max: 1 |
| congruent_probability | FLOAT | 0.5 | Probability flankers match the center spike (0–1) | min: 0 \| max: 1 |
| duration_ms | INT | 0 | Scheduled duration (ms). If 0, scheduling is disabled unless end_at_ms is provided manually in JSON. | min: 0 \| max: 3600000 |
| instructions | HTML_STRING | <p>You will see a scrolling <b>traffic spikes</b> monitor.</p><br/><p>When <b>Reject?</b> flashes, respond to the <b>center spike</b> directly underneath that question, ignoring surrounding spikes.</p><br/><p>Press <b>{{REJECT_KEY}}</b> to reject and <b>{{ALLOW_KEY}}</b> to allow.</p><br/><p><i>Click this popup to begin.</i></p> | Optional instructions shown in a popup before this subtask begins (closing the popup marks the subtask start time) |  |
| instructions_title | STRING | Traffic spikes monitor | Popup title for the subtask instructions overlay |  |
| jerkiness | FLOAT | 0.35 | How "jerky" the scrolling is (0–1) | min: 0 \| max: 1 |
| num_trials | INT | 20 | Number of decision epochs (trial clusters) to schedule while the window is visible. If 0, trials are scheduled by trial_interval_ms. | min: 0 \| max: 5000 |
| point_spacing_px | INT | 8 | Horizontal spacing between graph points (px) | min: 4 \| max: 24 |
| question_flash_ms | INT | 550 | How long the "Reject?" prompt is visually emphasized (ms) | min: 80 \| max: 5000 |
| reject_key | STRING | j | Keyboard key for REJECT / "Yes" (e.g., j) |  |
| reject_rule | SELECT | high_only | Which center-spike levels count as a correct REJECT | options: high_only, medium_or_high |
| response_window_ms | INT | 900 | Response deadline from prompt onset (ms) | min: 150 \| max: 10000 |
| scroll_speed_px_per_s | FLOAT | 240 | Base scrolling speed of the monitor (px/s) | min: 40 \| max: 1200 |
| show_feedback | BOOL | False | Briefly show Correct/Incorrect after response (preview + interpreter) |  |
| start_at_ms | INT | 0 | Scheduled start time (ms) from SOC session start. If used with duration_ms, the window appears/disappears automatically. | min: 0 \| max: 3600000 |
| title | STRING | Flanker-like | Subtask window title |  |
| trial_interval_ms | INT | 1400 | Time between decision prompts (ms) | min: 300 \| max: 10000 |

---

## soc-subtask-nback-like

**Type:** `soc-subtask-nback-like`

SOC subtask window (N-back-like). Composed into the nearest SOC Dashboard session at export time.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| duration_ms | INT | 0 | Scheduled duration (ms). If 0, scheduling is disabled unless end_at_ms is provided manually in JSON. | min: 0 \| max: 3600000 |
| go_key | STRING | space | Go key for Go/No-Go (and also accepted as the Match key if response_paradigm=2afc and match_key is blank) |  |
| instructions | HTML_STRING | <p>You will see a stream of security alerts, one at a time.</p><br/><p>Press <b>{{GO_CONTROL}}</b> when the current alert matches the one from <b>{{N}}-back</b> on <b>{{MATCH_FIELD}}</b>.</p><br/><p>If it does not match, respond <b>{{NOGO_CONTROL}}</b> (or withhold if using Go/No-Go).</p><br/><p><i>Click this popup to begin.</i></p> | Optional instructions shown in a popup before this subtask begins (closing the popup marks the subtask start time) |  |
| instructions_title | STRING | Correlating repeat offenders | Popup title for the subtask instructions overlay |  |
| match_field | SELECT | src_ip | Which field defines an N-back match | options: src_ip, username |
| match_key | STRING | j | 2AFC: key for MATCH (yes) |  |
| max_run_ms | INT | 60000 | Maximum subtask runtime in ms (0 = no maximum). If max < min, values are swapped at runtime. | min: 0 \| max: 3600000 |
| min_run_ms | INT | 30000 | Minimum subtask runtime in ms (0 = no minimum) | min: 0 \| max: 3600000 |
| n | INT | 2 | N-back level (1–3) | min: 1 \| max: 3 |
| nonmatch_key | STRING | f | 2AFC: key for NO MATCH (no) |  |
| response_paradigm | SELECT | go_nogo | Response paradigm: Go/No-Go (single key) or 2AFC (match vs no-match keys) | options: go_nogo, 2afc |
| show_feedback | BOOL | False | Show brief on-screen feedback after responses (off by default) |  |
| start_at_ms | INT | 0 | Scheduled start time (ms) from SOC session start. If used with duration_ms, the window appears/disappears automatically. | min: 0 \| max: 3600000 |
| stimulus_interval_ms | INT | 1200 | Milliseconds between alert cards (stimulus cadence) | min: 200 \| max: 10000 |
| target_probability | FLOAT | 0.25 | Probability the current alert matches the alert from N-back (0–1). Only applies after the buffer has at least N items. | min: 0 \| max: 1 |
| title | STRING | Repeat-offender monitor | Subtask window title |  |

---

## soc-subtask-pvt-like

**Type:** `soc-subtask-pvt-like`

SOC subtask window (PVT-like vigilance). Scrolling console logs with occasional countdown alerts and a red flash. Composed into the nearest SOC Dashboard session at export time.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| alert_max_interval_ms | INT | 6000 | Maximum time between alerts (ms) | min: 250 \| max: 600000 |
| alert_min_interval_ms | INT | 2000 | Minimum time between alerts (ms) | min: 250 \| max: 600000 |
| countdown_seconds | INT | 3 | Countdown length (seconds) shown before the red flash | min: 0 \| max: 10 |
| duration_ms | INT | 0 | Scheduled duration (ms). If 0, scheduling is disabled unless end_at_ms is provided manually in JSON. | min: 0 \| max: 3600000 |
| flash_duration_ms | INT | 120 | Red flash duration (ms) | min: 20 \| max: 2000 |
| instructions | HTML_STRING | <p>This window shows a scrolling event feed.</p><br/><p>Occasionally you will see a <b>countdown</b> followed by a <b>red flash</b>.</p><br/><p>Press <b>{{RESPONSE_CONTROL}}</b> as soon as the <b>red flash</b> appears.</p><br/><p><i>Click this popup to begin.</i></p> | Optional instructions shown in a popup before this subtask begins (closing the popup marks the subtask start time) |  |
| instructions_title | STRING | Incident alert monitor | Popup title for the subtask instructions overlay |  |
| log_scroll_interval_ms | INT | 400 | Milliseconds between new console/log entries (auto-scroll rate) | min: 50 \| max: 5000 |
| max_run_ms | INT | 0 | Maximum subtask runtime in ms (0 = no maximum). If max < min, values are swapped at runtime. | min: 0 \| max: 3600000 |
| min_run_ms | INT | 0 | Minimum subtask runtime in ms (0 = no minimum) | min: 0 \| max: 3600000 |
| response_device | SELECT | keyboard | Primary response device for this subtask | options: keyboard, mouse |
| response_key | STRING | space | Keyboard response key (ignored if response_device = mouse) |  |
| response_window_ms | INT | 1500 | Response deadline from red-flash onset (ms) | min: 100 \| max: 20000 |
| show_countdown | BOOL | True | Show countdown overlay |  |
| show_red_flash | BOOL | True | Show red flash overlay at alert onset |  |
| start_at_ms | INT | 0 | Scheduled start time (ms) from SOC session start. If used with duration_ms, the window appears/disappears automatically. | min: 0 \| max: 3600000 |
| title | STRING | Incident alerts | Subtask window title |  |
| visible_entries | INT | 10 | Number of console/log entries visible at once (older entries scroll out of view) | min: 3 \| max: 30 |

---

## soc-subtask-sart-like

**Type:** `soc-subtask-sart-like`

SOC subtask window (SART-like). Composed into the nearest SOC Dashboard session at export time.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| distractor_highlight_color | COLOR | #3dd6ff | Distractor highlight color |  |
| distractor_probability | FLOAT | 0.35 | Probability a new entry is a distractor (0–1). Remaining probability becomes neutral. | min: 0 \| max: 1 |
| distractor_subdomains | HTML_STRING | cdn.news.example<br/>static.video.example<br/>api.store.example | Distractor domain/subdomain list (comma- or newline-separated) |  |
| duration_ms | INT | 0 | Scheduled duration (ms). If 0, scheduling is disabled unless end_at_ms is provided manually in JSON. | min: 0 \| max: 3600000 |
| go_button | SELECT | action | Mouse-only: which button the participant clicks to respond (controls the in-window action UI) | options: action, change |
| go_condition | SELECT | target | Which class requires a Go response | options: target, distractor |
| go_key | STRING | space | Keyboard go key (ignored if response_device = mouse) |  |
| highlight_subdomains | BOOL | True | Highlight target/distractor entries in the feed |  |
| instructions | HTML_STRING | <p>Please press <b>{{GO_CONTROL}}</b> to filter through login attempts.</p><br/><p>Press <b>{{GO_CONTROL}}</b> to allow safe logins, and block harmful ones.</p><br/><p><b>Harmful (targets)</b>: {{TARGETS}}</p><br/><p><b>Benign (distractors)</b>: {{DISTRACTORS}}</p><br/><p><i>Click this popup to begin.</i></p> | Optional instructions shown in a popup before this subtask begins (closing the popup marks the subtask start time) |  |
| instructions_title | STRING | Filtering harmful logins | Popup title for the subtask instructions overlay |  |
| max_run_ms | INT | 60000 | Maximum subtask runtime in ms (0 = no maximum). If max < min, values are swapped at runtime. | min: 0 \| max: 3600000 |
| min_run_ms | INT | 30000 | Minimum subtask runtime in ms (0 = no minimum) | min: 0 \| max: 3600000 |
| neutral_subdomains | HTML_STRING |  | Optional neutral domain/subdomain list (comma- or newline-separated). If blank, neutrals are auto-generated. |  |
| response_device | SELECT | keyboard | Primary response device for this subtask | options: keyboard, mouse |
| scroll_interval_ms | INT | 900 | Milliseconds between new log entries (auto-scroll rate) | min: 100 \| max: 10000 |
| show_markers | BOOL | False | Show TARGET/DISTRACTOR markers inside the task UI (off by default) |  |
| start_at_ms | INT | 0 | Scheduled start time (ms) from SOC session start. If used with duration_ms, the window appears/disappears automatically. | min: 0 \| max: 3600000 |
| target_highlight_color | COLOR | #ff4d4d | Target highlight color |  |
| target_probability | FLOAT | 0.15 | Probability a new entry is a target (0–1) | min: 0 \| max: 1 |
| target_subdomains | HTML_STRING | login.bank.example<br/>vpn.bank.example<br/>admin.bank.example | Target domain/subdomain list (comma- or newline-separated) |  |
| title | STRING | Login monitor | Subtask window title |  |
| visible_entries | INT | 8 | Number of log entries visible at once (older entries scroll out of view) | min: 3 \| max: 25 |

---

## soc-subtask-wcst-like

**Type:** `soc-subtask-wcst-like`

SOC subtask window (WCST-like). Composed into the nearest SOC Dashboard session at export time.

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| attachment_label_docm | STRING | invoice.docm | DOCM attachment filename label |  |
| attachment_label_pdf | STRING | report.pdf | PDF attachment filename label |  |
| attachment_label_zip | STRING | archive.zip | ZIP attachment filename label |  |
| choice_keys | STRING | 1,2,3,4 | Keyboard choice keys for targets A-D (comma-separated; ignored if response_device = mouse) |  |
| duration_ms | INT | 0 | Scheduled duration (ms). If 0, scheduling is disabled unless end_at_ms is provided manually in JSON. | min: 0 \| max: 3600000 |
| feedback_ms | INT | 450 | Feedback duration (ms) | min: 0 \| max: 5000 |
| help_overlay_enabled | BOOL | True | Show a brief in-window help overlay describing mechanics and examples |  |
| help_overlay_html | HTML_STRING | <p><b>Goal:</b> Sort each email into one of four targets.</p><br/><p><b>How to respond:</b> {{CONTROLS}}</p><br/><p><b>What the domains mean:</b> example sender domains used as stimulus attributes: <b>{{DOMAINS}}</b>.</p><br/><p><b>Possible rules:</b> {{RULES}}</p> | Optional custom HTML for the help overlay. Placeholders: {{CONTROLS}}, {{DOMAINS}}, {{RULES}}, {{KEYS}} |  |
| help_overlay_title | STRING | Quick help | Title for the in-window help overlay |  |
| instructions | HTML_STRING | <p>Sort each email into one of four target cards.</p><br/><p>{{CONTROLS}}</p><br/><p><b>Possible rules</b>: {{RULES}}</p><br/><p><i>Click this popup to begin.</i></p> | Optional instructions shown in a popup before this subtask begins (closing the popup marks the subtask start time) |  |
| instructions_title | STRING | Email sorting | Popup title for the subtask instructions overlay |  |
| iti_ms | INT | 300 | Inter-trial interval (ms) | min: 0 \| max: 20000 |
| link_href_mismatch | STRING | https://vendor.test/portal | Mismatch-link style: link href (displayed in data, not navigated) |  |
| link_href_shortened | STRING | https://short.test/abc | Shortened-link style: link href (displayed in data, not navigated) |  |
| link_href_visible | STRING | https://portal.corp.test/ | Visible-link style: link href (displayed in data, not navigated) |  |
| link_text_mismatch | STRING | portal.corp.test | Mismatch-link style: link text shown in the email |  |
| link_text_shortened | STRING | short.test/abc | Shortened-link style: link text shown in the email |  |
| link_text_visible | STRING | portal.corp.test | Visible-link style: link text shown in the email |  |
| max_run_ms | INT | 0 | Maximum subtask runtime in ms (0 = no maximum). If max < min, values are swapped at runtime. | min: 0 \| max: 3600000 |
| min_run_ms | INT | 0 | Minimum subtask runtime in ms (0 = no minimum) | min: 0 \| max: 3600000 |
| mouse_response_mode | SELECT | click | Mouse-only: click a target vs drag the email onto a target | options: click, drag |
| num_trials | INT | 24 | Number of trials (0 = unlimited until forced end / schedule end) | min: 0 \| max: 5000 |
| preview_lines_neutral | STRING | No action needed. Review recent activity. | Example preview lines for neutral tone (newline-separated recommended). One is sampled per trial. |  |
| preview_lines_reward | STRING | A new item is available. Review details when convenient. | Example preview lines for reward tone (newline-separated recommended) |  |
| preview_lines_threat | STRING | Failure to act may result in restricted access. | Example preview lines for threat tone (newline-separated recommended) |  |
| preview_lines_urgent | STRING | Please verify your account details to avoid interruption. | Example preview lines for urgent tone (newline-separated recommended) |  |
| response_device | SELECT | keyboard | Primary response device for this subtask | options: keyboard, mouse |
| response_window_ms | INT | 2500 | Response deadline per email (ms) | min: 200 \| max: 20000 |
| rule_change_correct_streak | INT | 8 | Change the rule after this many consecutive correct responses | min: 1 \| max: 50 |
| rules | STRING | sender_domain,subject_tone,link_style,attachment_type | Rule sequence (comma-separated): sender_domain, subject_tone, link_style, attachment_type |  |
| sender_display_names | STRING | Operations, IT Vendor, Support Desk, Automated Notice | Comma- or newline-separated list of 4 sender display names aligned to sender_domains (A–D) |  |
| sender_domains | STRING | corp.test, vendor.test, typo.test, ip.test | Comma- or newline-separated list of 4 example sender domains (A–D). Tip: use reserved .test domains. |  |
| show_feedback | BOOL | True | Show brief on-screen feedback after each response |  |
| start_at_ms | INT | 0 | Scheduled start time (ms) from SOC session start. If used with duration_ms, the window appears/disappears automatically. | min: 0 \| max: 3600000 |
| subject_lines_neutral | STRING | Weekly account summary | Example subject lines for neutral tone (newline-separated recommended). One is sampled per trial. |  |
| subject_lines_reward | STRING | You have a new benefit available | Example subject lines for reward tone (newline-separated recommended) |  |
| subject_lines_threat | STRING | Account will be restricted soon | Example subject lines for threat tone (newline-separated recommended) |  |
| subject_lines_urgent | STRING | Action required: verify your account | Example subject lines for urgent tone (newline-separated recommended) |  |
| title | STRING | WCST-like | Subtask window title |  |

---

## stroop-trial

**Type:** `stroop-trial`

Stroop trial (word shown in ink color; response/scoring implemented by interpreter)

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| choice_keys | KEYS | ["1", "2", "3", "4"] | Keyboard keys mapped to stroop_settings.stimuli order (color_naming mode) |  |
| congruency | SELECT | auto | Optional tag used by block generation / logging; auto = derived from word vs ink | options: auto, congruent, incongruent |
| congruent_key | KEY | f | Key for congruent (congruency mode) |  |
| incongruent_key | KEY | j | Key for incongruent (congruency mode) |  |
| ink_color_name | STRING | BLUE | Name of the ink color (looked up in stroop_settings.stimuli by name) |  |
| iti_ms | INT | 500 | Inter-trial interval (ms) |  |
| response_device | SELECT | inherit | Override experiment-wide response_device (inherit uses stroop_settings.response_device) | options: inherit, keyboard, mouse |
| response_mode | SELECT | inherit | Override experiment-wide response_mode (inherit uses stroop_settings.response_mode) | options: inherit, color_naming, congruency |
| stimulus_duration_ms | INT | 1500 | Stimulus display duration (ms) |  |
| stimulus_font_size_px | INT | 72 | Font size of the stimulus word in pixels | min: 12 \| max: 200 |
| trial_duration_ms | INT | 2000 | Total trial duration (ms) |  |
| word | STRING | RED | The word to display (usually a color name) |  |

---

## survey-response

**Type:** `survey-response`

Collect survey/questionnaire responses in a single HTML form

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| allow_empty_on_timeout | BOOL | False | If true, allow continuing with empty responses after timeout_ms |  |
| instructions | HTML_STRING |  | Optional instructions shown above the form |  |
| questions | COMPLEX |  | Array of question objects (id, type, prompt, required, and type-specific fields) | required |
| submit_label | STRING | Continue | Submit button text |  |
| timeout_ms | INT | null | Optional timeout in ms for auto-continue (null/omitted = off) |  |
| title | STRING | Survey | Survey title/header |  |

---

## visual-angle-calibration

**Type:** `visual-angle-calibration`

Visual angle calibration (ID/credit card screen scale + viewing distance) used to compute px/deg

### Parameters

| Name | Type | Default | Description | Notes |
|---|---|---|---|---|
| close_distance_cm | FLOAT | 35 | Viewing distance (cm) for close posture option |  |
| close_label | STRING | Close | Label for close posture option |  |
| distance_mode | SELECT | posture_choice | How viewing distance is collected | options: posture_choice, manual |
| far_distance_cm | FLOAT | 65 | Viewing distance (cm) for far posture option |  |
| far_label | STRING | Far | Label for far posture option |  |
| instructions | HTML_STRING |  | Optional instructions text (HTML allowed) |  |
| manual_distance_default_cm | FLOAT | 50 | Default viewing distance (cm) shown in manual entry mode |  |
| normal_distance_cm | FLOAT | 50 | Viewing distance (cm) for normal posture option |  |
| normal_label | STRING | Normal | Label for normal posture option |  |
| object_length_cm | FLOAT | 8.56 | Object length in cm (used when preset is custom; also shown/adjustable during calibration) |  |
| object_preset | SELECT | id_card_long | Calibration object preset | options: id_card_long, id_card_short, custom |
| store_key | STRING | __psy_visual_angle | Global key used to store calibration results (window[store_key]) |  |
| title | STRING | Visual Angle Calibration | Heading shown to participants |  |
| webcam_enabled | BOOL | False | Enable optional webcam preview (does not estimate distance) |  |
| webcam_facing_mode | SELECT | user | Preferred camera (front/user vs back/environment) | options: user, environment |

