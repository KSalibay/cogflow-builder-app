/**
 * SOC Dashboard preview renderer (isolated)
 * Builder preview is visual-only:
 * - No click->data logging
 * - No icon-click app switching
 * - Tiled windows reflect composed `subtasks[]` (fallback to `num_tasks`)
 */
(function () {
  function escHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function ensureStyle() {
    const existing = document.head?.querySelector('style[data-soc-dashboard-preview="true"]');
    if (existing) return existing;

    const style = document.createElement('style');
    style.dataset.socDashboardPreview = 'true';
    style.textContent = `
      [data-soc-dashboard-preview-host="true"] .soc-preview-shell { position: relative; width: 100%; height: 520px; background: #0b1220; color: #e7eefc; overflow: hidden; border-radius: 10px; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-wallpaper { position:absolute; inset:0; background: radial-gradient(1200px 600px at 20% 10%, rgba(61,122,255,0.35), transparent 55%), radial-gradient(900px 500px at 70% 60%, rgba(20,200,160,0.25), transparent 55%), linear-gradient(135deg, #0b1220, #070b13); }
      [data-soc-dashboard-preview-host="true"] .soc-preview-shell.has-wallpaper .soc-preview-wallpaper { background-size: cover; background-position: center; }

      /* Desktop icons */
      [data-soc-dashboard-preview-host="true"] .soc-preview-desktop-icons { position:absolute; top: 14px; left: 14px; display:flex; flex-direction: column; gap: 8px; z-index: 2; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-icon { width: 84px; height: 98px; display:flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 8px; padding: 6px; user-select:none; cursor: pointer; transition: background 120ms ease, border-color 120ms ease; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-icon:hover { background: rgba(255,255,255,0.10); }
      [data-soc-dashboard-preview-host="true"] .soc-preview-icon.selected { background: rgba(59,130,246,0.28); border: 1px solid rgba(96,165,250,0.45); }
      [data-soc-dashboard-preview-host="true"] .soc-preview-icon .ico { width: 46px; height: 46px; border-radius: 12px; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; font-weight: 700; color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.25); }
      [data-soc-dashboard-preview-host="true"] .soc-preview-icon .lbl { margin-top: 6px; font-size: 12px; text-align:center; color: #fff; opacity: 0.98; text-shadow: 0 1px 2px rgba(0,0,0,0.85); }

      /* Tiled windows */
      [data-soc-dashboard-preview-host="true"] .soc-preview-windows { position:absolute; top: 14px; right: 14px; bottom: 14px; left: 120px; z-index: 3; display:grid; gap: 10px; grid-auto-rows: 1fr; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-appwin { background: rgba(12,16,26,0.88); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; box-shadow: 0 14px 40px rgba(0,0,0,0.45); overflow:hidden; min-height: 0; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-appwin .titlebar { height: 34px; display:flex; align-items:center; padding: 0 12px; background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.10); }
      [data-soc-dashboard-preview-host="true"] .soc-preview-appwin .titlebar .ttl { font-weight: 600; font-size: 12px; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-appwin .content { padding: 10px 12px; height: calc(100% - 34px); overflow:auto; }

      [data-soc-dashboard-preview-host="true"] .soc-preview-card { border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-card h4 { margin:0 0 6px 0; font-size: 13px; }
      [data-soc-dashboard-preview-host="true"] .soc-preview-card .muted { opacity: 0.8; font-size: 12px; }

      /* SART-like (log triage) window */
      [data-soc-dashboard-preview-host="true"] .soc-sart-shell { display:flex; flex-direction: column; gap: 10px; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-toolbar { display:flex; align-items:center; justify-content: space-between; gap: 10px; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-toolbar .pill { font-size: 11px; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); opacity: 0.95; white-space: nowrap; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-toolbar .meta { display:flex; gap: 6px; flex-wrap: wrap; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-tablewrap { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.18); }
      [data-soc-dashboard-preview-host="true"] table.soc-sart-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      [data-soc-dashboard-preview-host="true"] table.soc-sart-table th { text-align:left; font-weight: 600; font-size: 11px; opacity: 0.9; background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.10); padding: 7px 8px; }
      [data-soc-dashboard-preview-host="true"] table.soc-sart-table td { border-bottom: 1px solid rgba(255,255,255,0.06); padding: 7px 8px; vertical-align: top; }
      [data-soc-dashboard-preview-host="true"] table.soc-sart-table tr:last-child td { border-bottom: none; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-badge { display:inline-block; font-size: 10px; padding: 2px 6px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); }
      [data-soc-dashboard-preview-host="true"] .soc-sart-highlight { border-radius: 6px; padding: 2px 6px; display:inline-block; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-current { box-shadow: inset 0 0 0 2px rgba(250,204,21,0.65); }
      [data-soc-dashboard-preview-host="true"] .soc-sart-responded { opacity: 0.78; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-go-btn { font-size: 11px; padding: 4px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-go-btn:hover { background: rgba(255,255,255,0.12); }
      [data-soc-dashboard-preview-host="true"] .soc-sart-go-btn:disabled { opacity: 0.5; cursor: default; }

      /* Per-subtask instructions overlay (preview only) */
      [data-soc-dashboard-preview-host="true"] .soc-sart-overlay { position: absolute; inset: 0; z-index: 10; display:flex; align-items:center; justify-content:center; padding: 14px; background: rgba(2,6,23,0.72); backdrop-filter: blur(6px); }
      [data-soc-dashboard-preview-host="true"] .soc-sart-overlay .panel { max-width: 620px; width: 100%; border-radius: 14px; border: 1px solid rgba(255,255,255,0.14); background: rgba(12,16,26,0.92); box-shadow: 0 20px 70px rgba(0,0,0,0.60); padding: 14px; cursor: pointer; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-overlay .panel h3 { margin: 0 0 8px 0; font-size: 14px; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-overlay .panel .body { font-size: 12px; opacity: 0.95; line-height: 1.45; }
      [data-soc-dashboard-preview-host="true"] .soc-sart-overlay .panel .hint { margin-top: 10px; font-size: 12px; opacity: 0.80; }
    `;

    document.head.appendChild(style);
    return style;
  }

  function defaultDesktopIcons() {
    return [
      { label: 'Documents', icon_text: 'DOC' },
      { label: 'My File', icon_text: 'FILE' },
      { label: 'Recycle Bin', icon_text: 'BIN' }
    ];
  }

  function coerceDesktopIcons(raw) {
    if (!Array.isArray(raw)) return defaultDesktopIcons();
    const icons = raw
      .filter(x => x && typeof x === 'object')
      .map((x) => ({
        label: (x.label ?? x.name ?? 'Icon').toString(),
        icon_text: (x.icon_text ?? '').toString()
      }));
    return icons.length ? icons : defaultDesktopIcons();
  }

  function normalizeSubtasks(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(x => x && typeof x === 'object')
      .map(x => ({
        ...x,
        type: (x.type ?? x.kind ?? '').toString(),
        title: (x.title ?? x.name ?? '').toString()
      }))
      .filter(x => x.title || x.type);
  }

  function clamp01(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function parseList(raw) {
    if (raw === null || raw === undefined) return [];
    const s = String(raw);
    return s
      .split(/[\n,]+/g)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function randInt(min, max) {
    const a = Math.ceil(min);
    const b = Math.floor(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function pick(arr, fallback) {
    if (!Array.isArray(arr) || arr.length === 0) return fallback;
    return arr[randInt(0, arr.length - 1)];
  }

  function formatTime(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function renderNbackLike(containerEl, subtask) {
    if (!containerEl) return { destroy() {} };

    const normalizeKeyName = (raw) => {
      const str = (raw ?? '').toString();
      if (str === ' ') return ' ';
      const t = str.trim();
      const lower = t.toLowerCase();
      if (lower === 'space') return ' ';
      if (lower === 'enter') return 'Enter';
      if (lower === 'escape' || lower === 'esc') return 'Escape';
      if (t.length === 1) return t.toLowerCase();
      return t;
    };

    const nRaw = Number(subtask?.n);
    const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(3, Math.floor(nRaw))) : 2;
    const matchField = ((subtask?.match_field ?? 'src_ip').toString().trim().toLowerCase() === 'username') ? 'username' : 'src_ip';
    const paradigm = ((subtask?.response_paradigm ?? 'go_nogo').toString().trim().toLowerCase() === '2afc') ? '2afc' : 'go_nogo';

    const goKey = normalizeKeyName(subtask?.go_key ?? 'space');
    const matchKey = normalizeKeyName(subtask?.match_key ?? 'j');
    const nonMatchKey = normalizeKeyName(subtask?.nonmatch_key ?? 'f');

    const intervalRaw = Number(subtask?.stimulus_interval_ms);
    const intervalMs = Number.isFinite(intervalRaw) ? Math.max(200, Math.min(5000, Math.floor(intervalRaw))) : 1200;

    const instructionsHtmlRaw = (subtask?.instructions ?? '').toString();
    const hasInstructions = !!instructionsHtmlRaw.trim();
    const instructionsTitle = (subtask?.instructions_title ?? 'Correlating repeat offenders').toString() || 'Correlating repeat offenders';

    const substitutePlaceholders = (html, map) => {
      let out = (html ?? '').toString();
      for (const [k, v] of Object.entries(map || {})) {
        const safe = escHtml((v ?? '').toString());
        out = out.replaceAll(`{{${k}}}`, safe);
        out = out.replaceAll(`{{${k.toLowerCase()}}}`, safe);
      }
      return out;
    };

    const goControl = (paradigm === 'go_nogo')
      ? (goKey === ' ' ? 'SPACE' : goKey)
      : `${nonMatchKey === ' ' ? 'SPACE' : escHtml(nonMatchKey)} (NO) / ${matchKey === ' ' ? 'SPACE' : escHtml(matchKey)} (YES)`;
    const noGoControl = (paradigm === 'go_nogo') ? 'withhold' : (nonMatchKey === ' ' ? 'SPACE' : nonMatchKey);

    const shell = document.createElement('div');
    shell.style.position = 'relative';
    shell.innerHTML = `
      <div class="soc-sart-toolbar" style="margin-bottom: 10px;">
        <div class="meta">
          <span class="pill">${escHtml(String(n))}-back</span>
          <span class="pill">Match: ${escHtml(matchField === 'src_ip' ? 'Source IP' : 'Username')}</span>
          <span class="pill">Mode: ${escHtml(paradigm === 'go_nogo' ? 'Go/No-Go' : '2AFC')}</span>
          <span class="pill">Cadence: ${escHtml(String(intervalMs))}ms</span>
        </div>
        <div class="soc-sart-badge">Preview only</div>
      </div>

      <div class="soc-preview-card" style="border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.18);">
        <div style="display:flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px;">
          <div>
            <h4 style="margin:0 0 4px 0;">Alert correlation (${escHtml(String(n))}-back)</h4>
            <div class="muted">Press ${escHtml(goControl)} when ${escHtml(matchField === 'src_ip' ? 'Source IP' : 'Username')} matches ${escHtml(String(n))}-back.</div>
          </div>
          <div class="soc-sart-badge" id="nback_preview_status" style="opacity:0.85;">Ready</div>
        </div>

        <div id="nback_preview_card" style="border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 12px; background: rgba(255,255,255,0.05);">
          <div class="muted" style="font-size: 12px;">Waiting…</div>
        </div>
      </div>
    `;

    containerEl.innerHTML = '';
    containerEl.appendChild(shell);

    const cardEl = shell.querySelector('#nback_preview_card');
    const statusEl = shell.querySelector('#nback_preview_status');

    const names = ['a.nguyen', 'j.smith', 'm.patel', 'r.garcia', 's.chen', 'k.johnson'];
    const services = ['secure-login.example', 'admin-portal.example', 'vpn.example', 'mail.example', 'files.example'];
    const events = ['Failed login', 'MFA challenge', 'Password spray suspected', 'Geo anomaly', 'New device'];

    const history = [];
    let tickId = null;
    let started = false;

    const makeIp = () => `10.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;

    const renderCard = (entry, isMatch) => {
      if (!cardEl) return;
      const mf = matchField === 'src_ip' ? entry.src_ip : entry.username;
      cardEl.innerHTML = `
        <div style="display:flex; justify-content: space-between; gap: 12px;">
          <div class="muted" style="font-size: 12px;">${escHtml(entry.time)} • Risk ${escHtml(String(entry.risk))}</div>
          <div class="soc-sart-badge" style="opacity: 0.85;">${isMatch ? 'MATCH' : 'NO MATCH'}</div>
        </div>
        <div style="margin-top: 10px; display:grid; grid-template-columns: 140px 1fr; gap: 6px 12px; font-size: 12px;">
          <div class="muted">Source IP</div><div><b>${escHtml(entry.src_ip)}</b></div>
          <div class="muted">Username</div><div><b>${escHtml(entry.username)}</b></div>
          <div class="muted">Destination</div><div>${escHtml(entry.dest)}</div>
          <div class="muted">Event</div><div>${escHtml(entry.event)}</div>
          <div class="muted">Match field</div><div>${escHtml(matchField === 'src_ip' ? 'Source IP' : 'Username')}: <b>${escHtml(mf)}</b></div>
        </div>
      `;
    };

    const tick = () => {
      if (!started) return;
      const canMatch = history.length >= n;
      const isMatch = canMatch ? (Math.random() < 0.25) : false;

      const entry = {
        time: formatTime(new Date()),
        src_ip: makeIp(),
        username: pick(names, 'a.nguyen'),
        dest: pick(services, 'secure-login.example'),
        event: pick(events, 'Failed login'),
        risk: randInt(20, 95)
      };

      if (isMatch) {
        const ref = history[history.length - n];
        if (matchField === 'src_ip') entry.src_ip = ref.src_ip;
        else entry.username = ref.username;
      }

      history.push(entry);
      while (history.length > 12) history.shift();
      if (statusEl) statusEl.textContent = 'Running…';
      renderCard(entry, isMatch);
    };

    const startOnce = () => {
      if (started) return;
      started = true;
      tick();
      tickId = setInterval(tick, intervalMs);
    };

    if (hasInstructions) {
      const overlay = document.createElement('div');
      overlay.className = 'soc-sart-overlay';
      overlay.innerHTML = `
        <div class="panel" role="button" tabindex="0" aria-label="Subtask instructions">
          <h3>${escHtml(instructionsTitle)}</h3>
          <div class="body" data-soc-overlay-body="true"></div>
          <div class="hint">Click this popup to begin.</div>
        </div>
      `;
      const body = overlay.querySelector('[data-soc-overlay-body="true"]');
      if (body) {
        const resolved = substitutePlaceholders(instructionsHtmlRaw, {
          GO_CONTROL: goControl,
          NOGO_CONTROL: noGoControl,
          N: String(n),
          MATCH_FIELD: (matchField === 'src_ip' ? 'Source IP' : 'Username')
        });
        body.innerHTML = resolved;
      }
      const start = () => {
        try { overlay.remove(); } catch { /* ignore */ }
        startOnce();
      };
      overlay.addEventListener('click', start, { once: true });
      overlay.addEventListener('keydown', (e) => {
        const k = normalizeKeyName(e.key);
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          start();
        }
      });
      shell.appendChild(overlay);
    } else {
      startOnce();
    }

    return {
      destroy() {
        try {
          if (tickId) clearInterval(tickId);
        } catch {
          // ignore
        }
        containerEl.innerHTML = '';
      }
    };
  }

  function renderSartLike(containerEl, subtask) {
    if (!containerEl) return { destroy() {} };

    const substitutePlaceholders = (html, map) => {
      let out = (html ?? '').toString();
      for (const [k, v] of Object.entries(map || {})) {
        const safe = escHtml((v ?? '').toString());
        out = out.replaceAll(`{{${k}}}`, safe);
        out = out.replaceAll(`{{${k.toLowerCase()}}}`, safe);
      }
      return out;
    };

    const visibleEntriesRaw = Number(subtask?.visible_entries);
    const visibleEntries = Number.isFinite(visibleEntriesRaw)
      ? Math.max(3, Math.min(30, Math.floor(visibleEntriesRaw)))
      : 10;

    const scrollIntervalRaw = Number(subtask?.scroll_interval_ms);
    const scrollIntervalMs = Number.isFinite(scrollIntervalRaw)
      ? Math.max(80, Math.min(5000, Math.floor(scrollIntervalRaw)))
      : 500;

    const responseDevice = ((subtask?.response_device ?? 'keyboard').toString().trim().toLowerCase() === 'mouse') ? 'mouse' : 'keyboard';
    const goKeyRaw = (subtask?.go_key ?? 'space').toString();
    const goButton = ((subtask?.go_button ?? 'action').toString().trim().toLowerCase() === 'change') ? 'change' : 'action';
    const showMarkers = !!(subtask?.show_markers ?? false);

    const normalizeKeyName = (raw) => {
      const str = (raw ?? '').toString();
      if (str === ' ') return ' ';
      const t = str.trim();
      const lower = t.toLowerCase();
      if (lower === 'space') return ' ';
      if (lower === 'enter') return 'Enter';
      if (lower === 'escape' || lower === 'esc') return 'Escape';
      if (t.length === 1) return t.toLowerCase();
      return t;
    };
    const goKey = normalizeKeyName(goKeyRaw);

    const instructionsHtmlRaw = (subtask?.instructions ?? '').toString();
    const hasInstructions = !!instructionsHtmlRaw.trim();

    const instructionsTitle = (subtask?.instructions_title ?? 'Filtering harmful logins').toString() || 'Filtering harmful logins';

    const highlightSubdomains = !!(subtask?.highlight_subdomains ?? true);
    const targetColor = (subtask?.target_highlight_color ?? '#22c55e').toString();
    const distractorColor = (subtask?.distractor_highlight_color ?? '#ef4444').toString();
    const goCondition = (subtask?.go_condition ?? 'target').toString();

    // Keep action outcomes consistent within a run.
    const triageActionOnGo = (goCondition.toString().trim().toLowerCase() === 'distractor') ? 'BLOCK' : 'ALLOW';

    const targets = parseList(subtask?.target_subdomains);
    const distractors = parseList(subtask?.distractor_subdomains);
    const neutrals = parseList(subtask?.neutral_subdomains);

    const targetProbability = clamp01(subtask?.target_probability ?? 0.2);
    const distractorProbability = clamp01(subtask?.distractor_probability ?? 0.1);
    const neutralProbability = Math.max(0, 1 - targetProbability - distractorProbability);

    const defaultTargets = ['secure-login.example', 'admin-portal.example', 'alerts.example'];
    const defaultDistractors = ['status.example', 'helpdesk.example', 'cdn.example'];
    const defaultNeutrals = ['mail.example', 'files.example', 'intranet.example'];

    const resolvedGoControl = (responseDevice === 'keyboard')
      ? (goKey === ' ' ? 'SPACE' : goKey)
      : (goButton === 'change' ? 'Change' : 'Action');

    const shell = document.createElement('div');
    shell.className = 'soc-sart-shell';
    shell.style.position = 'relative';
    shell.innerHTML = `
      <div class="soc-sart-toolbar">
        <div class="meta">
          <span class="pill">Visible: ${escHtml(String(visibleEntries))}</span>
          <span class="pill">Scroll: ${escHtml(String(scrollIntervalMs))}ms</span>
          <span class="pill">GO on: ${escHtml(goCondition)}</span>
          <span class="pill">Device: ${escHtml(responseDevice)}</span>
          <span class="pill">${responseDevice === 'keyboard' ? `Key: ${escHtml(goKey === ' ' ? 'SPACE' : goKey)}` : `Button: ${escHtml(goButton)}`}</span>
        </div>
        <div class="soc-sart-badge">Preview only</div>
      </div>

      <div class="soc-sart-tablewrap">
        <table class="soc-sart-table">
          <thead>
            <tr>
              <th style="width: 86px;">Time</th>
              <th style="width: 120px;">Source IP</th>
              <th>Destination</th>
              <th style="width: 110px;">Event</th>
              <th style="width: 120px;">Action</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="muted" style="font-size: 12px; opacity: 0.8;">
        Current entry is highlighted. Responses update Action for realism (still no logging in Builder preview).
      </div>
    `;

    const tbody = shell.querySelector('tbody');
    containerEl.innerHTML = '';
    containerEl.appendChild(shell);

    const now = new Date();
    let tickTime = new Date(now.getTime());
    const rows = [];
    let lastRowId = 0;

    let started = false;

    const eventTypes = ['DNS query', 'TLS handshake', 'HTTP GET', 'HTTP POST', 'Auth attempt', 'File fetch'];

    const getCurrentRow = () => (rows.length ? rows[rows.length - 1] : null);

    const applyResponse = (device) => {
      if (!started) return;
      const current = getCurrentRow();
      if (!current) return;
      if (current.responded) return;

      current.responded = true;
      // Semantics: GO commits a triage decision.
      // Action is bound to the configured GO rule (avoids mixing ALLOW/BLOCK in one run).
      current.triage_action = triageActionOnGo;
      renderRows();
    };

    function makeRow() {
      // Decide class
      const r = Math.random();
      let kind = 'neutral';
      if (r < targetProbability) kind = 'target';
      else if (r < targetProbability + distractorProbability) kind = 'distractor';
      else kind = (neutralProbability > 0 ? 'neutral' : 'target');

      const dst = (kind === 'target')
        ? pick(targets, pick(defaultTargets, 'secure-login.example'))
        : (kind === 'distractor')
          ? pick(distractors, pick(defaultDistractors, 'status.example'))
          : pick(neutrals, pick(defaultNeutrals, 'mail.example'));

      const event = pick(eventTypes, 'HTTP GET');
      const ip = `${randInt(10, 220)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;

      tickTime = new Date(tickTime.getTime() + randInt(250, 900));

      return {
        id: `p_${++lastRowId}`,
        time: formatTime(tickTime),
        ip,
        dst,
        event,
        triage_action: '—',
        kind,
        responded: false
      };
    }

    function renderRows() {
      if (!tbody) return;
      tbody.innerHTML = '';

      const show = rows.slice(-visibleEntries);
      const currentId = getCurrentRow()?.id || null;
      show.forEach((row) => {
        const tr = document.createElement('tr');

        if (row.id && row.id === currentId) tr.classList.add('soc-sart-current');
        if (row.responded) tr.classList.add('soc-sart-responded');

        const dstText = escHtml(row.dst);
        const shouldHighlight = highlightSubdomains && (row.kind === 'target' || row.kind === 'distractor');
        const color = (row.kind === 'target') ? targetColor : distractorColor;

        const goBtnHtml = (responseDevice === 'mouse')
          ? `<button type="button" class="soc-sart-go-btn" data-row-id="${escHtml(row.id)}" ${row.id !== currentId || row.responded ? 'disabled' : ''}>${escHtml(goButton === 'change' ? 'Change' : 'Action')}</button>`
          : '';

        const triageHtml = escHtml(row.triage_action);

        tr.innerHTML = `
          <td>${escHtml(row.time)}</td>
          <td>${escHtml(row.ip)}</td>
          <td>
            ${shouldHighlight
              ? `<span class="soc-sart-highlight" style="background: ${escHtml(color)}22; border: 1px solid ${escHtml(color)}55; color: #fff;">${dstText}</span>`
              : dstText}
            ${showMarkers && row.kind === 'target' ? ` <span class="soc-sart-badge" style="border-color:${escHtml(targetColor)}55;">target</span>` : ''}
            ${showMarkers && row.kind === 'distractor' ? ` <span class="soc-sart-badge" style="border-color:${escHtml(distractorColor)}55;">distractor</span>` : ''}
          </td>
          <td>${escHtml(row.event)}</td>
          <td style="white-space: nowrap;">
            <span class="soc-sart-badge" style="margin-right: 6px;">${triageHtml}</span>
            ${goBtnHtml}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    const startSubtask = () => {
      if (started) return;
      started = true;
      // Seed initial rows on start so the overlay truly gates the preview.
      for (let i = 0; i < visibleEntries; i++) rows.push(makeRow());
      renderRows();
    };

    const onKeyDown = (e) => {
      if (!started) return;
      if (responseDevice !== 'keyboard') return;
      const k = normalizeKeyName(e.key);
      if (k && k === goKey) {
        e.preventDefault();
        applyResponse('keyboard');
      }
    };

    const onClick = (e) => {
      if (!started) return;
      if (responseDevice !== 'mouse') return;
      const btn = e.target.closest('button[data-row-id]');
      if (!btn) return;
      const rowId = (btn.dataset.rowId || '').toString();
      const current = getCurrentRow();
      if (!current || current.id !== rowId) return;
      applyResponse('mouse');
    };

    document.addEventListener('keydown', onKeyDown);
    shell.addEventListener('click', onClick);

    const intervalId = window.setInterval(() => {
      if (!started) return;
      rows.push(makeRow());
      // keep bounded (avoid unbounded growth)
      if (rows.length > 200) rows.splice(0, rows.length - 200);
      renderRows();
    }, scrollIntervalMs);

    // Optional instructions overlay.
    if (hasInstructions) {
      const overlay = document.createElement('div');
      overlay.className = 'soc-sart-overlay';
      overlay.innerHTML = `
        <div class="panel" role="button" tabindex="0" aria-label="Subtask instructions">
          <h3>${escHtml(instructionsTitle)}</h3>
          <div class="body" data-soc-overlay-body="true"></div>
          <div class="hint">Click this popup to begin.</div>
        </div>
      `;
      const body = overlay.querySelector('[data-soc-overlay-body="true"]');
      if (body) {
        const resolved = substitutePlaceholders(instructionsHtmlRaw, {
          GO_CONTROL: resolvedGoControl,
          TARGETS: (targets.length ? targets.join(', ') : '(set target_subdomains)'),
          DISTRACTORS: (distractors.length ? distractors.join(', ') : '(set distractor_subdomains)')
        });
        body.innerHTML = resolved;
      }

      const startOnce = () => {
        try { overlay.remove(); } catch { /* ignore */ }
        startSubtask();
      };

      overlay.addEventListener('click', startOnce, { once: true });
      overlay.addEventListener('keydown', (e) => {
        const k = normalizeKeyName(e.key);
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          startOnce();
        }
      });

      shell.appendChild(overlay);
      renderRows();
    } else {
      startSubtask();
    }

    return {
      destroy() {
        try { document.removeEventListener('keydown', onKeyDown); } catch { /* ignore */ }
        try { shell.removeEventListener('click', onClick); } catch { /* ignore */ }
        try { window.clearInterval(intervalId); } catch { /* ignore */ }
      }
    };
  }

  function render(container, componentData) {
    if (!container) return;
    ensureStyle();
    container.dataset.socDashboardPreviewHost = 'true';

    const sessionTitle = (componentData?.title ?? 'SOC Dashboard').toString();
    const wallpaperUrl = (componentData?.wallpaper_url ?? '').toString().trim();
    const backgroundColor = (componentData?.background_color ?? '').toString().trim();

    const subtasks = normalizeSubtasks(componentData?.subtasks);
    const numTasksRaw = Number(componentData?.num_tasks);
    const fallbackCount = Number.isFinite(numTasksRaw) ? Math.max(1, Math.min(4, Math.floor(numTasksRaw))) : 4;
    const windowsSpec = subtasks.length
      ? subtasks.map((s, idx) => ({
        title: s.title || s.type || `Subtask ${idx + 1}`,
        subtask: s
      }))
      : Array.from({ length: fallbackCount }, (_, i) => ({ title: `Task ${i + 1}`, subtask: null }));

    const root = document.createElement('div');
    root.className = 'soc-preview-shell' + (wallpaperUrl ? ' has-wallpaper' : '');

    const wallpaper = document.createElement('div');
    wallpaper.className = 'soc-preview-wallpaper';
    if (wallpaperUrl) {
      wallpaper.style.backgroundImage = `url(${JSON.stringify(wallpaperUrl).slice(1, -1)})`;
      wallpaper.style.backgroundSize = 'cover';
      wallpaper.style.backgroundPosition = 'center';
    } else if (backgroundColor) {
      wallpaper.style.background = `radial-gradient(1200px 600px at 20% 10%, rgba(61,122,255,0.25), transparent 55%), radial-gradient(900px 500px at 70% 60%, rgba(20,200,160,0.18), transparent 55%), linear-gradient(135deg, ${backgroundColor}, #070b13)`;
    }

    const desktop = document.createElement('div');
    desktop.className = 'soc-preview-desktop-icons';
    const desktopIcons = coerceDesktopIcons(componentData?.desktop_icons);
    let selectedIconIndex = -1;

    function renderDesktopIcons() {
      desktop.innerHTML = '';
      desktopIcons.forEach((ico, idx) => {
        const el = document.createElement('div');
        el.className = 'soc-preview-icon' + (idx === selectedIconIndex ? ' selected' : '');
        el.innerHTML = `
          <div class="ico">${escHtml(ico.icon_text || (ico.label || 'I').slice(0, 2).toUpperCase())}</div>
          <div class="lbl">${escHtml(ico.label || 'Icon')}</div>
        `;
        el.addEventListener('click', () => {
          selectedIconIndex = (selectedIconIndex === idx) ? -1 : idx;
          renderDesktopIcons();
        });
        desktop.appendChild(el);
      });
    }

    const windows = document.createElement('div');
    windows.className = 'soc-preview-windows';
    const cols = (windowsSpec.length <= 2) ? windowsSpec.length : 2;
    windows.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    const destroyFns = [];

    windowsSpec.forEach((wSpec) => {
      const w = document.createElement('div');
      w.className = 'soc-preview-appwin';
      w.innerHTML = `
        <div class="titlebar"><div class="ttl">${escHtml(sessionTitle)} · ${escHtml(wSpec.title)}</div></div>
        <div class="content">
          <div class="soc-preview-card" data-soc-subtask-root="true">
            <h4>Subtask window</h4>
            <div class="muted">Preview only (no logging). Configure subtasks in the timeline.</div>
          </div>
        </div>
      `;

      // Replace placeholder content for known subtask types.
      try {
        const subtask = wSpec?.subtask;
        const rootEl = w.querySelector('[data-soc-subtask-root="true"]');
        if (rootEl && subtask && (subtask.type === 'sart-like')) {
          const handle = renderSartLike(rootEl, subtask);
          destroyFns.push(() => handle?.destroy?.());
        }
        if (rootEl && subtask && (subtask.type === 'nback-like')) {
          const handle = renderNbackLike(rootEl, subtask);
          destroyFns.push(() => handle?.destroy?.());
        }
      } catch {
        // ignore preview errors per-window
      }
      windows.appendChild(w);
    });

    root.appendChild(wallpaper);
    root.appendChild(desktop);
    root.appendChild(windows);

    container.innerHTML = '';
    container.appendChild(root);
    renderDesktopIcons();

    return {
      destroy() {
        try {
          destroyFns.forEach(fn => {
            try { fn(); } catch { /* ignore */ }
          });
        } catch {
          // ignore
        }
        container.innerHTML = '';
      }
    };
  }

  window.SocDashboardPreview = { render };
})();
