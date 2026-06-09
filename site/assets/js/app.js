(() => {
    'use strict';

    const apiBase = 'api';
    const state = {
        user: null,
        game: null,
        selectedKey: null,
        hitBoxes: [],
        transform: null,
        busy: false,
        lastReport: null,
        activeIsmsTab: 'assets',
    };

    const els = {
        authView: document.getElementById('auth-view'),
        gameView: document.getElementById('game-view'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        authMessage: document.getElementById('auth-message'),
        organizationName: document.getElementById('organization-name'),
        scoreOverall: document.getElementById('score-overall'),
        scoreSecurity: document.getElementById('score-security'),
        scoreDocumentation: document.getElementById('score-documentation'),
        scoreResilience: document.getElementById('score-resilience'),
        scoreAudit: document.getElementById('score-audit'),
        runAudit: document.getElementById('run-audit'),
        runInternalAudit: document.getElementById('run-internal-audit'),
        logout: document.getElementById('logout'),
        canvas: document.getElementById('office-canvas'),
        assetDetails: document.getElementById('asset-details'),
        findingsList: document.getElementById('findings-list'),
        ismsTabs: document.getElementById('isms-tabs'),
        ismsBody: document.getElementById('isms-body'),
        ismsScoreSummary: document.getElementById('isms-score-summary'),
        teachingScoreSummary: document.getElementById('teaching-score-summary'),
        incidentList: document.getElementById('incident-list'),
        correctiveActionList: document.getElementById('corrective-action-list'),
        internalAuditSummary: document.getElementById('internal-audit-summary'),
        auditPanel: document.getElementById('audit-panel'),
        toast: document.getElementById('toast'),
    };

    const ctx = els.canvas.getContext('2d');

    async function api(path, options = {}) {
        const request = {
            method: options.method || 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
            },
        };

        if (options.body !== undefined) {
            request.headers['Content-Type'] = 'application/json';
            request.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${apiBase}/${path}`, request);
        const contentType = response.headers.get('Content-Type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : null;

        if (!response.ok || !payload || payload.ok === false) {
            const message = payload && payload.message ? payload.message : `Request failed (${response.status})`;
            const error = new Error(message);
            error.payload = payload;
            throw error;
        }

        return payload;
    }

    function showAuth(message = '') {
        els.authView.hidden = false;
        els.gameView.hidden = true;
        els.authMessage.textContent = message;
    }

    function showGame() {
        els.authView.hidden = true;
        els.gameView.hidden = false;
        resizeCanvas();
    }

    async function bootstrap() {
        try {
            const authConfig = await api('auth-config');
            els.registerForm.hidden = !authConfig.registration_enabled;
            const me = await api('me');

            if (me.user) {
                state.user = me.user;
                await loadGame();
                showGame();
            } else {
                showAuth();
            }
        } catch (error) {
            showAuth(error.message);
        }
    }

    async function loadGame() {
        const payload = await api('game-state');
        state.game = payload.game_state;
        if (!state.selectedKey && state.game.map.objects.length > 0) {
            state.selectedKey = state.game.map.objects[0].object_key;
        }
        render();
    }

    function render() {
        if (!state.game) {
            return;
        }

        renderHud();
        drawOffice();
        renderDetails();
        renderFindings();
        renderIsmsPanel();
        renderTeachingPanel();
    }

    function renderHud() {
        const game = state.game;
        const categories = game.score.categories;
        els.organizationName.textContent = game.organization.organization_name;
        els.scoreOverall.textContent = `${game.score.overall.percent}%`;
        els.scoreSecurity.textContent = `${categories.security.percent}%`;
        els.scoreDocumentation.textContent = `${categories.documentation.percent}%`;
        els.scoreResilience.textContent = `${categories.resilience.percent}%`;
        els.scoreAudit.textContent = `${categories.audit.percent}%`;
    }

    function resizeCanvas() {
        const rect = els.canvas.getBoundingClientRect();
        const width = Math.max(320, Math.floor(rect.width));
        const height = Math.max(320, Math.floor(rect.height));
        const ratio = window.devicePixelRatio || 1;
        els.canvas.width = Math.floor(width * ratio);
        els.canvas.height = Math.floor(height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawOffice();
    }

    function drawOffice() {
        if (!state.game) {
            return;
        }

        const rect = els.canvas.getBoundingClientRect();
        const width = Math.max(320, rect.width);
        const height = Math.max(320, rect.height);
        const map = state.game.map;
        const padding = 28;
        const unit = Math.min((width - padding * 2) / map.width, (height - padding * 2) / map.height);
        const offsetX = (width - unit * map.width) / 2;
        const offsetY = (height - unit * map.height) / 2;
        state.transform = { unit, offsetX, offsetY };
        state.hitBoxes = [];

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f5f7f8';
        ctx.fillRect(0, 0, width, height);

        drawFloorPlan(offsetX, offsetY, unit, map.width, map.height);

        for (const object of map.objects) {
            drawObject(object, offsetX, offsetY, unit);
        }
    }

    function drawFloorPlan(offsetX, offsetY, unit, mapWidth, mapHeight) {
        const x = offsetX;
        const y = offsetY;
        const w = mapWidth * unit;
        const h = mapHeight * unit;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#56616b';
        ctx.lineWidth = 3;
        roundRect(x, y, w, h, 7, true, true);

        ctx.strokeStyle = '#a9b2ba';
        ctx.lineWidth = 2;

        const walls = [
            [8, 0, 8, 9],
            [15, 0, 15, 9],
            [20, 0, 20, 18],
            [0, 9, 20, 9],
            [8, 9, 8, 18],
            [14, 9, 14, 18],
        ];

        for (const [x1, y1, x2, y2] of walls) {
            ctx.beginPath();
            ctx.moveTo(offsetX + x1 * unit, offsetY + y1 * unit);
            ctx.lineTo(offsetX + x2 * unit, offsetY + y2 * unit);
            ctx.stroke();
        }

        const rooms = [
            ['Reception', 1, 1],
            ['Exam 1', 9, 1],
            ['Exam 2', 16, 1],
            ['Admin', 1, 10],
            ['Records', 9, 10],
            ['Server', 21, 10],
            ['Cloud', 22, 1],
        ];

        ctx.fillStyle = '#6a7680';
        ctx.font = '700 12px system-ui, sans-serif';
        for (const [label, rx, ry] of rooms) {
            ctx.fillText(label, offsetX + rx * unit, offsetY + ry * unit);
        }
    }

    function drawObject(object, offsetX, offsetY, unit) {
        const x = offsetX + object.x * unit;
        const y = offsetY + object.y * unit;
        const w = object.width * unit;
        const h = object.height * unit;
        const selected = object.object_key === state.selectedKey;
        const colors = objectColors(object);

        ctx.shadowColor = selected ? 'rgba(23, 126, 137, 0.28)' : 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = selected ? 18 : 8;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = selected ? '#177e89' : colors.stroke;
        ctx.lineWidth = selected ? 4 : 2;
        roundRect(x, y, w, h, 7, true, true);
        ctx.shadowColor = 'transparent';

        const indicator = object.state === 'ready' ? '#2f8f5b' : object.state === 'partial' ? '#c28622' : '#bd3b3b';
        ctx.fillStyle = indicator;
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.text;
        const fontSize = Math.max(10, Math.min(14, unit * 0.48));
        ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
        drawFittedText(shortLabel(object), x + 8, y + h / 2 + fontSize / 3, w - 16, fontSize);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.fillRect(x + 7, y + h - 13, Math.max(0, w - 14), 5);
        ctx.fillStyle = indicator;
        ctx.fillRect(x + 7, y + h - 13, Math.max(0, (w - 14) * object.score.percent / 100), 5);

        state.hitBoxes.push({
            key: object.object_key,
            x,
            y,
            w,
            h,
        });
    }

    function objectColors(object) {
        const byType = {
            workstation: ['#dbe8fb', '#3867b7', '#132d55'],
            laptop: ['#e3ddf3', '#7557b4', '#2d214f'],
            cloud_service: ['#e0f2f2', '#177e89', '#123e45'],
            network: ['#f3e6c9', '#a96d1c', '#4d320e'],
            backup: ['#dff0df', '#2f8f5b', '#163d28'],
            printer: ['#eceff2', '#6b7785', '#2f3740'],
            records: ['#f1dfd5', '#a76443', '#482416'],
            documentation: ['#f7e7b3', '#b2841e', '#45320a'],
            disposal: ['#ead9dc', '#a94b5c', '#4b1d28'],
        };
        const colors = byType[object.object_type] || ['#e9edf0', '#66727d', '#1d2730'];

        return {
            fill: colors[0],
            stroke: colors[1],
            text: colors[2],
        };
    }

    function shortLabel(object) {
        const labels = {
            reception_pc: 'Reception PC',
            doctor_pc: 'Doctor PC',
            nurse_laptop: 'Nurse Laptop',
            ehr_cloud: 'Cloud EHR',
            network_router: 'Wi-Fi',
            backup_nas: 'Backup',
            printer: 'Printer',
            records_cabinet: 'Records',
            isms_binder: 'ISMS',
            shred_console: 'Shred',
        };

        return labels[object.object_key] || object.display_name;
    }

    function drawFittedText(text, x, y, maxWidth, baseSize) {
        let size = baseSize;

        while (size >= 9) {
            ctx.font = `800 ${size}px system-ui, sans-serif`;
            if (ctx.measureText(text).width <= maxWidth) {
                break;
            }
            size -= 1;
        }

        ctx.fillText(text, x, y);
    }

    function roundRect(x, y, width, height, radius, fill, stroke) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    function renderDetails() {
        const object = selectedObject();

        if (!object) {
            els.assetDetails.innerHTML = '<p class="empty-state">Select an office asset on the floor plan.</p>';
            return;
        }

        const score = object.score.percent;
        const controls = object.controls.map((control) => `
            <label class="control-row">
                <input type="checkbox" data-control="${escapeAttr(control.key)}" ${control.enabled ? 'checked' : ''} ${state.busy ? 'disabled' : ''}>
                <span>
                    <span class="control-title">
                        ${escapeHtml(control.label)}
                        <span class="${escapeAttr(control.severity)}">${escapeHtml(control.severity)}</span>
                    </span>
                    <span class="control-description">${escapeHtml(control.description)}</span>
                </span>
            </label>
        `).join('');

        els.assetDetails.innerHTML = `
            <div class="asset-header">
                <div>
                    <h2>${escapeHtml(object.display_name)}</h2>
                    <p class="asset-type">${escapeHtml(typeLabel(object.object_type))}</p>
                </div>
                <span class="status-badge ${escapeAttr(object.state)}">${escapeHtml(stateLabel(object.state))}</span>
            </div>
            <div class="meter" aria-label="Asset readiness">
                <span style="width: ${score}%"></span>
            </div>
            <p class="control-description">${score}% configured for this scenario.</p>
            <div class="control-list">${controls}</div>
        `;

        for (const checkbox of els.assetDetails.querySelectorAll('[data-control]')) {
            checkbox.addEventListener('change', () => {
                updateControl(object.object_key, checkbox.dataset.control, checkbox.checked);
            });
        }
    }

    function renderFindings() {
        const findings = state.game.findings.slice(0, 7);

        if (findings.length === 0) {
            els.findingsList.innerHTML = '<p class="empty-state">No open findings in the current simulation state.</p>';
            return;
        }

        els.findingsList.innerHTML = findings.map((finding) => `
            <article class="finding-item">
                <div class="finding-title">${escapeHtml(finding.title)}</div>
                <div class="finding-meta">${escapeHtml(finding.object_name)} - ${escapeHtml(finding.severity)}</div>
            </article>
        `).join('');
    }

    function renderIsmsPanel() {
        const artifacts = state.game.isms;
        const scores = state.game.score.artifacts;
        els.ismsScoreSummary.textContent = `Inventory ${scores.assets.percent}% - Risks ${scores.risks.percent}% - Evidence ${scores.evidence.percent}%`;

        for (const button of els.ismsTabs.querySelectorAll('[data-isms-tab]')) {
            button.classList.toggle('active', button.dataset.ismsTab === state.activeIsmsTab);
        }

        if (state.activeIsmsTab === 'assets') {
            els.ismsBody.innerHTML = artifacts.assets.map(renderAssetArtifact).join('');
        } else if (state.activeIsmsTab === 'risks') {
            els.ismsBody.innerHTML = artifacts.risks.map(renderRiskArtifact).join('');
        } else {
            els.ismsBody.innerHTML = artifacts.evidence.map(renderEvidenceArtifact).join('');
        }

        bindIsmsControls();
    }

    function renderAssetArtifact(asset) {
        return `
            <article class="artifact-card">
                <header>
                    <h3>${escapeHtml(asset.name)}</h3>
                    <div class="artifact-meta">${escapeHtml(typeLabel(asset.asset_type))} - ${escapeHtml(asset.information_classification)}</div>
                </header>
                <div class="artifact-grid">
                    ${selectControl('asset', asset.asset_key, 'status', asset.status, [
                        ['draft', 'Draft'],
                        ['verified', 'Verified'],
                    ])}
                    ${selectControl('asset', asset.asset_key, 'criticality', asset.criticality, [
                        ['low', 'Low'],
                        ['medium', 'Medium'],
                        ['high', 'High'],
                    ])}
                    ${textInputControl('asset', asset.asset_key, 'owner', asset.owner, 'Owner', 'wide')}
                    ${textareaControl('asset', asset.asset_key, 'notes', asset.notes, 'Notes', 'wide')}
                </div>
            </article>
        `;
    }

    function renderRiskArtifact(risk) {
        return `
            <article class="artifact-card">
                <header>
                    <h3>${escapeHtml(risk.title)}</h3>
                    <div class="artifact-meta">Inherent score ${risk.inherent_score} - linked to ${escapeHtml(shortObjectName(risk.object_key))}</div>
                </header>
                <div class="artifact-grid">
                    ${selectControl('risk', risk.risk_key, 'likelihood', String(risk.likelihood), scoreOptions())}
                    ${selectControl('risk', risk.risk_key, 'impact', String(risk.impact), scoreOptions())}
                    ${selectControl('risk', risk.risk_key, 'treatment_status', risk.treatment_status, [
                        ['identified', 'Identified'],
                        ['assessed', 'Assessed'],
                        ['treated', 'Treated'],
                        ['accepted', 'Accepted'],
                    ], 'wide')}
                    ${textInputControl('risk', risk.risk_key, 'owner', risk.owner, 'Owner', 'wide')}
                    ${textareaControl('risk', risk.risk_key, 'treatment_summary', risk.treatment_summary, 'Treatment summary', 'wide')}
                </div>
            </article>
        `;
    }

    function renderEvidenceArtifact(evidence) {
        return `
            <article class="artifact-card">
                <header>
                    <h3>${escapeHtml(evidence.title)}</h3>
                    <div class="artifact-meta">${escapeHtml(typeLabel(evidence.evidence_type))} - linked to ${escapeHtml(shortObjectName(evidence.object_key))}</div>
                </header>
                <p class="control-description">${escapeHtml(evidence.expected_evidence)}</p>
                <div class="artifact-grid">
                    ${selectControl('evidence', evidence.evidence_key, 'status', evidence.status, [
                        ['missing', 'Missing'],
                        ['draft', 'Draft'],
                        ['ready', 'Ready'],
                        ['reviewed', 'Reviewed'],
                    ], 'wide')}
                    ${textInputControl('evidence', evidence.evidence_key, 'owner', evidence.owner, 'Owner', 'wide')}
                    ${textareaControl('evidence', evidence.evidence_key, 'notes', evidence.notes, 'Notes', 'wide')}
                </div>
            </article>
        `;
    }

    function selectControl(type, key, field, value, options, className = '') {
        const optionHtml = options.map(([optionValue, label]) => `
            <option value="${escapeAttr(optionValue)}" ${String(value) === String(optionValue) ? 'selected' : ''}>${escapeHtml(label)}</option>
        `).join('');

        return `
            <label class="${escapeAttr(className)}">
                ${escapeHtml(fieldLabel(field))}
                <select data-isms-type="${escapeAttr(type)}" data-isms-key="${escapeAttr(key)}" data-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>
                    ${optionHtml}
                </select>
            </label>
        `;
    }

    function textInputControl(type, key, field, value, label, className = '') {
        return `
            <label class="${escapeAttr(className)}">
                ${escapeHtml(label)}
                <input value="${escapeAttr(value)}" data-initial="${escapeAttr(value)}" data-isms-type="${escapeAttr(type)}" data-isms-key="${escapeAttr(key)}" data-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>
            </label>
        `;
    }

    function textareaControl(type, key, field, value, label, className = '') {
        return `
            <label class="${escapeAttr(className)}">
                ${escapeHtml(label)}
                <textarea data-initial="${escapeAttr(value)}" data-isms-type="${escapeAttr(type)}" data-isms-key="${escapeAttr(key)}" data-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>${escapeHtml(value)}</textarea>
            </label>
        `;
    }

    function scoreOptions() {
        return [
            ['1', '1'],
            ['2', '2'],
            ['3', '3'],
            ['4', '4'],
            ['5', '5'],
        ];
    }

    function bindIsmsControls() {
        for (const select of els.ismsBody.querySelectorAll('select[data-isms-type]')) {
            select.addEventListener('change', () => {
                updateIsmsField(select.dataset.ismsType, select.dataset.ismsKey, select.dataset.field, select.value);
            });
        }

        for (const input of els.ismsBody.querySelectorAll('input[data-isms-type], textarea[data-isms-type]')) {
            input.addEventListener('blur', () => {
                if (input.value !== input.dataset.initial) {
                    updateIsmsField(input.dataset.ismsType, input.dataset.ismsKey, input.dataset.field, input.value);
                }
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && input.tagName === 'INPUT') {
                    input.blur();
                }
            });
        }
    }

    async function updateIsmsField(itemType, itemKey, field, value) {
        if (state.busy) {
            return;
        }

        state.busy = true;
        renderIsmsPanel();

        try {
            const payload = await api('update-isms-item', {
                method: 'POST',
                body: {
                    item_type: itemType,
                    item_key: itemKey,
                    fields: {
                        [field]: value,
                    },
                },
            });
            state.game = payload.game_state;
            showToast('ISMS item updated.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    function renderTeachingPanel() {
        const teaching = state.game.teaching;
        const scores = state.game.score.teaching;
        els.teachingScoreSummary.textContent = `Incidents ${scores.incidents.percent}% - Corrective actions ${scores.corrective_actions.percent}%`;

        els.incidentList.innerHTML = teaching.incidents.length
            ? teaching.incidents.map(renderIncidentCard).join('')
            : '<p class="empty-state">No incident drills are available.</p>';

        els.correctiveActionList.innerHTML = teaching.corrective_actions.length
            ? teaching.corrective_actions.map(renderCorrectiveActionCard).join('')
            : '<p class="empty-state">No corrective actions have been opened.</p>';

        els.internalAuditSummary.innerHTML = renderInternalAuditSummary(teaching.latest_internal_audit);
        bindTeachingControls();
    }

    function renderIncidentCard(incident) {
        const buttonHtml = incident.status === 'available'
            ? `<button type="button" data-incident-action="start" data-incident-key="${escapeAttr(incident.incident_key)}" ${state.busy ? 'disabled' : ''}>Start drill</button>`
            : incident.status === 'active'
                ? `<button type="button" data-incident-action="resolve" data-incident-key="${escapeAttr(incident.incident_key)}" ${state.busy ? 'disabled' : ''}>Resolve</button>`
                : '';

        return `
            <article class="teaching-card">
                <header>
                    <h4>${escapeHtml(incident.title)}</h4>
                    <span class="status-badge ${escapeAttr(statusClass(incident.status))}">${escapeHtml(incident.status)}</span>
                </header>
                <p class="control-description">${escapeHtml(incident.description)}</p>
                <p class="control-description">${escapeHtml(incident.status === 'available' ? incident.trigger_text : incident.lesson_text)}</p>
                <div class="teaching-actions">${buttonHtml}</div>
            </article>
        `;
    }

    function renderCorrectiveActionCard(action) {
        return `
            <article class="teaching-card">
                <header>
                    <h4>${escapeHtml(action.title)}</h4>
                    <span class="status-badge ${escapeAttr(statusClass(action.status))}">${escapeHtml(action.status)}</span>
                </header>
                <div class="artifact-meta">${escapeHtml(typeLabel(action.source_type))} - due in ${action.due_days} days</div>
                <div class="compact-form">
                    ${selectActionControl(action.action_key, 'status', action.status, [
                        ['open', 'Open'],
                        ['in_progress', 'In progress'],
                        ['done', 'Done'],
                        ['verified', 'Verified'],
                    ])}
                    ${selectActionControl(action.action_key, 'verification_status', action.verification_status, [
                        ['not_checked', 'Not checked'],
                        ['effective', 'Effective'],
                        ['ineffective', 'Ineffective'],
                    ])}
                    ${textActionControl(action.action_key, 'owner', action.owner, 'Owner')}
                    ${textareaActionControl(action.action_key, 'notes', action.notes, 'Notes')}
                </div>
            </article>
        `;
    }

    function renderInternalAuditSummary(report) {
        if (!report) {
            return '<p class="empty-state">Run an internal audit to sample current gaps and create corrective actions.</p>';
        }

        const findings = report.findings || [];

        return `
            <article class="teaching-card">
                <header>
                    <h4>${escapeHtml(statusLabel(report.status))}</h4>
                    <span class="status-badge ${escapeAttr(report.status === 'passed' ? 'ready' : 'needs_attention')}">${escapeHtml(String(report.score.overall.percent))}%</span>
                </header>
                <div class="artifact-meta">${escapeHtml(report.scope)}</div>
                <p class="control-description">${report.corrective_actions_created} corrective actions created from this sample.</p>
                ${findings.length ? findings.slice(0, 4).map((finding) => `
                    <article class="finding-item">
                        <div class="finding-title">${escapeHtml(finding.title)}</div>
                        <div class="finding-meta">${escapeHtml(finding.object_name)} - ${escapeHtml(finding.severity)}</div>
                    </article>
                `).join('') : '<p class="empty-state">No internal audit findings.</p>'}
            </article>
        `;
    }

    function selectActionControl(actionKey, field, value, options) {
        const optionHtml = options.map(([optionValue, label]) => `
            <option value="${escapeAttr(optionValue)}" ${String(value) === String(optionValue) ? 'selected' : ''}>${escapeHtml(label)}</option>
        `).join('');

        return `
            <label>
                ${escapeHtml(fieldLabel(field))}
                <select data-action-key="${escapeAttr(actionKey)}" data-action-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>
                    ${optionHtml}
                </select>
            </label>
        `;
    }

    function textActionControl(actionKey, field, value, label) {
        return `
            <label>
                ${escapeHtml(label)}
                <input value="${escapeAttr(value)}" data-initial="${escapeAttr(value)}" data-action-key="${escapeAttr(actionKey)}" data-action-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>
            </label>
        `;
    }

    function textareaActionControl(actionKey, field, value, label) {
        return `
            <label>
                ${escapeHtml(label)}
                <textarea data-initial="${escapeAttr(value)}" data-action-key="${escapeAttr(actionKey)}" data-action-field="${escapeAttr(field)}" ${state.busy ? 'disabled' : ''}>${escapeHtml(value)}</textarea>
            </label>
        `;
    }

    function bindTeachingControls() {
        for (const button of els.incidentList.querySelectorAll('[data-incident-action]')) {
            button.addEventListener('click', () => {
                updateIncident(button.dataset.incidentAction, button.dataset.incidentKey);
            });
        }

        for (const select of els.correctiveActionList.querySelectorAll('select[data-action-key]')) {
            select.addEventListener('change', () => {
                updateCorrectiveAction(select.dataset.actionKey, select.dataset.actionField, select.value);
            });
        }

        for (const input of els.correctiveActionList.querySelectorAll('input[data-action-key], textarea[data-action-key]')) {
            input.addEventListener('blur', () => {
                if (input.value !== input.dataset.initial) {
                    updateCorrectiveAction(input.dataset.actionKey, input.dataset.actionField, input.value);
                }
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && input.tagName === 'INPUT') {
                    input.blur();
                }
            });
        }
    }

    async function updateIncident(action, incidentKey) {
        if (state.busy) {
            return;
        }

        state.busy = true;

        try {
            const endpoint = action === 'resolve' ? 'resolve-incident' : 'start-incident';
            const payload = await api(endpoint, {
                method: 'POST',
                body: {
                    incident_key: incidentKey,
                },
            });
            state.game = payload.game_state;
            showToast(action === 'resolve' ? 'Incident drill resolved.' : 'Incident drill started.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    async function updateCorrectiveAction(actionKey, field, value) {
        if (state.busy) {
            return;
        }

        state.busy = true;

        try {
            const payload = await api('update-corrective-action', {
                method: 'POST',
                body: {
                    action_key: actionKey,
                    fields: {
                        [field]: value,
                    },
                },
            });
            state.game = payload.game_state;
            showToast('Corrective action updated.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    async function updateControl(objectKey, controlKey, enabled) {
        if (state.busy) {
            return;
        }

        state.busy = true;
        renderDetails();

        try {
            const payload = await api('configure-object', {
                method: 'POST',
                body: {
                    object_key: objectKey,
                    controls: {
                        [controlKey]: enabled,
                    },
                },
            });
            state.game = payload.game_state;
            showToast('Control updated.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    async function runAudit() {
        if (state.busy) {
            return;
        }

        state.busy = true;
        els.runAudit.disabled = true;

        try {
            const payload = await api('run-audit', { method: 'POST' });
            state.game = payload.game_state;
            state.lastReport = payload.report;
            renderAudit(payload.report);
            showToast('Audit report created.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            els.runAudit.disabled = false;
            render();
        }
    }

    async function runInternalAudit() {
        if (state.busy) {
            return;
        }

        state.busy = true;
        els.runInternalAudit.disabled = true;

        try {
            const payload = await api('run-internal-audit', { method: 'POST' });
            state.game = payload.game_state;
            showToast('Internal audit completed.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            els.runInternalAudit.disabled = false;
            render();
        }
    }

    function renderAudit(report) {
        els.auditPanel.hidden = false;
        els.auditPanel.innerHTML = `
            <h2>Simulated Audit Report</h2>
            <p class="control-description">${escapeHtml(report.summary)}</p>
            <div class="audit-grid">
                <div class="audit-metric"><span>Status</span><strong>${escapeHtml(statusLabel(report.status))}</strong></div>
                <div class="audit-metric"><span>Overall</span><strong>${report.overall_percent}%</strong></div>
                <div class="audit-metric"><span>Major</span><strong>${report.major_findings}</strong></div>
                <div class="audit-metric"><span>Minor</span><strong>${report.minor_findings}</strong></div>
            </div>
            ${report.sampled_findings.length ? `
                <div>
                    ${report.sampled_findings.map((finding) => `
                        <article class="finding-item">
                            <div class="finding-title">${escapeHtml(finding.title)}</div>
                            <div class="finding-meta">${escapeHtml(finding.object_name)} - ${escapeHtml(finding.recommendation)}</div>
                        </article>
                    `).join('')}
                </div>
            ` : '<p class="empty-state">No sampled findings.</p>'}
        `;
    }

    function selectedObject() {
        if (!state.game || !state.selectedKey) {
            return null;
        }

        return state.game.map.objects.find((object) => object.object_key === state.selectedKey) || null;
    }

    function typeLabel(type) {
        return String(type).replace(/_/g, ' ');
    }

    function fieldLabel(field) {
        return String(field).replace(/_/g, ' ');
    }

    function shortObjectName(objectKey) {
        if (!state.game) {
            return objectKey || 'scenario';
        }

        const object = state.game.map.objects.find((item) => item.object_key === objectKey);

        return object ? object.display_name : objectKey || 'scenario';
    }

    function stateLabel(value) {
        return {
            ready: 'Ready',
            partial: 'Partial',
            needs_attention: 'Risk',
        }[value] || value;
    }

    function statusLabel(value) {
        return {
            certification_recommended: 'Recommended',
            conditional: 'Conditional',
            not_ready: 'Not ready',
            passed: 'Passed',
            major_findings: 'Major findings',
            minor_findings: 'Minor findings',
        }[value] || value;
    }

    function statusClass(value) {
        return {
            resolved: 'ready',
            verified: 'ready',
            passed: 'ready',
            active: 'needs_attention',
            open: 'needs_attention',
            major_findings: 'needs_attention',
            available: 'partial',
            in_progress: 'partial',
            done: 'partial',
            minor_findings: 'partial',
        }[value] || 'partial';
    }

    function showToast(message) {
        els.toast.textContent = message;
        els.toast.hidden = false;
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => {
            els.toast.hidden = true;
        }, 2400);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }

    function formPayload(form) {
        return Object.fromEntries(new FormData(form).entries());
    }

    els.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        els.authMessage.textContent = '';

        try {
            const payload = await api('login', {
                method: 'POST',
                body: formPayload(els.loginForm),
            });
            state.user = payload.user;
            await loadGame();
            showGame();
        } catch (error) {
            els.authMessage.textContent = error.message;
        }
    });

    els.registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        els.authMessage.textContent = '';

        try {
            const payload = await api('register', {
                method: 'POST',
                body: formPayload(els.registerForm),
            });
            state.user = payload.user;
            await loadGame();
            showGame();
        } catch (error) {
            els.authMessage.textContent = error.message;
        }
    });

    els.logout.addEventListener('click', async () => {
        await api('logout', { method: 'POST' });
        state.user = null;
        state.game = null;
        state.selectedKey = null;
        showAuth();
    });

    els.runAudit.addEventListener('click', runAudit);
    els.runInternalAudit.addEventListener('click', runInternalAudit);

    els.ismsTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-isms-tab]');

        if (!button) {
            return;
        }

        state.activeIsmsTab = button.dataset.ismsTab;
        renderIsmsPanel();
    });

    els.canvas.addEventListener('click', (event) => {
        const rect = els.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hit = [...state.hitBoxes].reverse().find((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);

        if (hit) {
            state.selectedKey = hit.key;
            render();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    bootstrap();
})();
