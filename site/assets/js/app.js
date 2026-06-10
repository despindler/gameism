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
        activePrimaryTab: 'office',
        activeMapMode: 'overview',
        activeDrawerTab: 'timeline',
        drawerOpen: false,
        drawerOpener: null,
        deviceModalOpen: false,
        deviceModalMode: 'profile',
        registrationEnabled: true,
    };

    const els = {
        authView: document.getElementById('auth-view'),
        authPanel: document.getElementById('auth-panel'),
        gameView: document.getElementById('game-view'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showRegister: document.getElementById('show-register'),
        showLogin: document.getElementById('show-login'),
        authMessage: document.getElementById('auth-message'),
        organizationName: document.getElementById('organization-name'),
        scoreOverall: document.getElementById('score-overall'),
        scoreSecurity: document.getElementById('score-security'),
        scoreDocumentation: document.getElementById('score-documentation'),
        scoreResilience: document.getElementById('score-resilience'),
        scoreAudit: document.getElementById('score-audit'),
        runAudit: document.getElementById('run-audit'),
        drawerToggle: document.getElementById('drawer-toggle'),
        drawerBadge: document.getElementById('drawer-badge'),
        drawerBackdrop: document.getElementById('drawer-backdrop'),
        infoDrawer: document.getElementById('info-drawer'),
        drawerTitle: document.getElementById('drawer-title'),
        drawerClose: document.getElementById('drawer-close'),
        drawerTabs: document.getElementById('drawer-tabs'),
        drawerPanels: document.querySelectorAll('[data-drawer-panel]'),
        timelineSummary: document.getElementById('timeline-summary'),
        timelineList: document.getElementById('timeline-list'),
        logout: document.getElementById('logout'),
        primaryTabs: document.getElementById('primary-tabs'),
        guidancePanel: document.getElementById('guidance-panel'),
        guidanceSummary: document.getElementById('guidance-summary'),
        guidanceList: document.getElementById('guidance-list'),
        mapModeDescription: document.getElementById('map-mode-description'),
        mapViewControls: document.getElementById('map-view-controls'),
        tabPanels: document.querySelectorAll('[data-tab-panel]'),
        canvas: document.getElementById('office-canvas'),
        findingsList: document.getElementById('findings-list'),
        operationsStatusTitle: document.getElementById('operations-status-title'),
        operationsStatusBadge: document.getElementById('operations-status-badge'),
        operationsMetrics: document.getElementById('operations-metrics'),
        operationsImpacts: document.getElementById('operations-impacts'),
        ismsTabs: document.getElementById('isms-tabs'),
        ismsBody: document.getElementById('isms-body'),
        ismsScoreSummary: document.getElementById('isms-score-summary'),
        teachingScoreSummary: document.getElementById('teaching-score-summary'),
        incidentList: document.getElementById('incident-list'),
        certificationStepper: document.getElementById('certification-stepper'),
        auditPanelBody: document.getElementById('audit-panel-body'),
        toast: document.getElementById('toast'),
        deviceModal: document.getElementById('device-modal'),
        deviceModalKicker: document.getElementById('device-modal-kicker'),
        deviceModalTitle: document.getElementById('device-modal-title'),
        deviceModalClose: document.getElementById('device-modal-close'),
        deviceModalBody: document.getElementById('device-modal-body'),
        deviceModalActions: document.getElementById('device-modal-actions'),
    };

    const ctx = els.canvas.getContext('2d');
    const officePlan = {
        rooms: [
            { label: 'Reception', x: 0, y: 0, width: 8, height: 7.2, fill: '#fbfcff' },
            { label: 'Exam 1', x: 8, y: 0, width: 7, height: 7.2, fill: '#f9fbff' },
            { label: 'Exam 2', x: 15, y: 0, width: 5, height: 7.2, fill: '#f9fbff' },
            { label: 'Hosted EHR', x: 20, y: 0, width: 8, height: 7.2, fill: '#f4fbfa' },
            { label: 'Admin', x: 0, y: 10.8, width: 8, height: 7.2, fill: '#fffdf9' },
            { label: 'Records', x: 8, y: 10.8, width: 6, height: 7.2, fill: '#fffaf6' },
            { label: 'ISMS office', x: 14, y: 10.8, width: 6, height: 7.2, fill: '#fffdf4' },
            { label: 'Server room', x: 20, y: 10.8, width: 8, height: 7.2, fill: '#f8fbf8' },
        ],
        corridors: [
            { label: 'Aisle', x: 0, y: 7.2, width: 28, height: 3.6 },
        ],
        walls: [
            [8, 0, 8, 7.2],
            [15, 0, 15, 7.2],
            [20, 0, 20, 7.2],
            [8, 10.8, 8, 18],
            [14, 10.8, 14, 18],
            [20, 10.8, 20, 18],
            [0, 7.2, 2.2, 7.2],
            [5.1, 7.2, 8, 7.2],
            [8, 7.2, 9.4, 7.2],
            [12.2, 7.2, 15, 7.2],
            [15, 7.2, 16.4, 7.2],
            [18.9, 7.2, 20, 7.2],
            [20, 7.2, 22.1, 7.2],
            [24.7, 7.2, 28, 7.2],
            [0, 10.8, 2.3, 10.8],
            [5.2, 10.8, 8, 10.8],
            [8, 10.8, 9.6, 10.8],
            [12.2, 10.8, 14, 10.8],
            [14, 10.8, 15.6, 10.8],
            [18.2, 10.8, 20, 10.8],
            [20, 10.8, 22.1, 10.8],
            [24.7, 10.8, 28, 10.8],
        ],
        doors: [
            { x: 2.2, y: 7.2, width: 2.9, side: 'down' },
            { x: 9.4, y: 7.2, width: 2.8, side: 'down' },
            { x: 16.4, y: 7.2, width: 2.5, side: 'down' },
            { x: 22.1, y: 7.2, width: 2.6, side: 'down' },
            { x: 2.3, y: 10.8, width: 2.9, side: 'up' },
            { x: 9.6, y: 10.8, width: 2.6, side: 'up' },
            { x: 15.6, y: 10.8, width: 2.6, side: 'up' },
            { x: 22.1, y: 10.8, width: 2.6, side: 'up' },
            { x: 0, y: 3.8, width: 2.3, side: 'right' },
        ],
        furniture: [
            { label: 'Front desk', type: 'reception_desk', x: 2.1, y: 2.1, width: 4.8, height: 3.7 },
            { label: 'Exam desk', type: 'desk', x: 9.4, y: 2.4, width: 4.2, height: 2.8 },
            { label: 'Exam couch', type: 'exam_couch', x: 13.1, y: 0.9, width: 1.2, height: 4.8 },
            { label: 'Exam desk', type: 'desk', x: 16.4, y: 2.4, width: 2.9, height: 2.8 },
            { label: 'Exam couch', type: 'exam_couch', x: 18.5, y: 0.9, width: 1, height: 4.8 },
            { label: 'Cloud zone', type: 'cloud_zone', x: 21.1, y: 1.1, width: 5.8, height: 4.8 },
            { label: 'Network shelf', type: 'rack', x: 21.2, y: 7.65, width: 5.7, height: 2.8 },
            { label: 'Print counter', type: 'counter', x: 3.1, y: 10.95, width: 4.2, height: 2.8 },
            { label: 'Shred area', type: 'counter', x: 3.2, y: 14.4, width: 3.7, height: 2.7 },
            { label: 'Records shelves', type: 'shelves', x: 8.9, y: 11.45, width: 4.5, height: 5.6 },
            { label: 'ISMS table', type: 'table', x: 14.8, y: 11.45, width: 4.5, height: 5.6 },
            { label: 'Server rack', type: 'rack', x: 21.1, y: 11.25, width: 5.8, height: 5.8 },
        ],
    };
    const mapModes = {
        overview: {
            label: 'Overview',
            description: 'Normal office map.',
        },
        readiness: {
            label: 'Readiness',
            description: 'Shows each asset readiness percentage.',
        },
        evidence: {
            label: 'Evidence',
            description: 'Highlights missing or draft audit evidence linked to each asset.',
        },
        risk: {
            label: 'Risk',
            description: 'Highlights untreated or unaccepted risks linked to each asset.',
        },
        audit: {
            label: 'Audit',
            description: 'Highlights open simulated audit findings for each asset.',
        },
    };
    const floorPlanPadding = 20;

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

    function setAuthMode(mode) {
        const showRegisterForm = mode === 'register' && state.registrationEnabled;

        els.loginForm.hidden = showRegisterForm;
        els.registerForm.hidden = !showRegisterForm;
        els.showRegister.hidden = !state.registrationEnabled;
        els.authPanel.setAttribute('aria-label', showRegisterForm ? 'Create account' : 'Sign in');
        els.authMessage.textContent = '';
    }

    function showAuth(message = '') {
        closeDrawer();
        els.authView.hidden = false;
        els.gameView.hidden = true;
        setAuthMode('login');
        els.authMessage.textContent = message;
    }

    function showGame() {
        els.authView.hidden = true;
        els.gameView.hidden = false;
        setPrimaryTab(state.activePrimaryTab || 'office');
        resizeCanvas();
    }

    async function bootstrap() {
        try {
            const authConfig = await api('auth-config');
            state.registrationEnabled = Boolean(authConfig.registration_enabled);
            setAuthMode('login');
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
        renderGuidance();
        renderTimeline();
        renderDrawerBadge();
        renderOperationsStatus();
        renderMapModeControls();
        drawOffice();
        renderFindings();
        renderIsmsPanel();
        renderOperationsPanel();
        renderAuditPanel();
        renderDeviceModal();
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

    function renderMapModeControls() {
        const mode = mapModes[state.activeMapMode] ? state.activeMapMode : 'overview';
        state.activeMapMode = mode;
        els.mapModeDescription.textContent = mapModes[mode].description;

        for (const button of els.mapViewControls.querySelectorAll('[data-map-mode]')) {
            const active = button.dataset.mapMode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
    }

    function renderGuidance() {
        const items = guidanceItems();
        const overall = state.game.score.overall.percent;
        const findingCount = state.game.findings.length;
        els.guidanceSummary.textContent = `${overall}% readiness - ${findingCount} open findings`;

        els.guidanceList.innerHTML = items.map((item, index) => `
            <article class="guidance-card ${escapeAttr(item.tone)}">
                <div>
                    <span class="guidance-step">Priority ${index + 1}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
                </div>
                <button class="secondary" type="button" data-guidance-action="${escapeAttr(item.action)}" data-guidance-target="${escapeAttr(item.target || '')}" aria-label="${escapeAttr(item.buttonLabel)}">${escapeHtml(item.buttonText)}</button>
            </article>
        `).join('');
    }

    function renderTimeline() {
        const items = timelineItems();
        const activeCount = state.game.timeline.active_count;
        const openActionCount = state.game.teaching.corrective_actions.filter(isCorrectiveActionOpen).length;
        els.timelineSummary.textContent = `${activeCount} active events - ${openActionCount} open corrective actions`;

        els.timelineList.innerHTML = items.map((item) => `
            <article class="timeline-card ${escapeAttr(item.tone)}">
                <span class="timeline-meta">${escapeHtml(item.meta)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.body)}</p>
            </article>
        `).join('');
    }

    function renderDrawerBadge() {
        const activeEvents = state.game.timeline.active_count;
        const openActions = state.game.teaching.corrective_actions.filter(isCorrectiveActionOpen).length;
        const priorityGuidance = guidanceItems().filter((item) => item.tone === 'critical' || item.tone === 'warning').length;
        const badgeCount = activeEvents + openActions + priorityGuidance;

        els.drawerBadge.hidden = badgeCount === 0;
        els.drawerBadge.textContent = String(Math.min(badgeCount, 9));
    }

    function timelineItems() {
        const items = [];
        const operations = state.game.operations;

        items.push({
            tone: operations.status,
            meta: `Office function - ${operationalStatusLabel(operations.status)}`,
            title: `${operations.clinical_capacity_percent}% clinical capacity`,
            body: `${operations.patient_delay_minutes} minutes expected patient delay, ${operations.closure_risk_percent}% closure risk.`,
        });

        for (const event of state.game.timeline.events) {
            items.push({
                tone: event.status,
                meta: `${typeLabel(event.source_type)} - ${event.status}`,
                title: event.title,
                body: event.body,
            });
        }

        for (const action of state.game.teaching.corrective_actions) {
            items.push({
                tone: 'action',
                meta: `Corrective action - ${action.status}`,
                title: action.title,
                body: `${typeLabel(action.source_type)} due in ${action.due_days} days. Verification is ${action.verification_status}.`,
            });
        }

        if (items.length === 0) {
            items.push({
                tone: 'empty',
                meta: 'Timeline',
                title: 'No events yet',
                body: 'Simulation events and corrective actions will appear here as the office timeline becomes more active.',
            });
        }

        return items;
    }

    function renderOperationsStatus() {
        const operations = state.game.operations;
        const metrics = [
            ['Clinical capacity', `${operations.clinical_capacity_percent}%`],
            ['EHR availability', `${operations.ehr_availability_percent}%`],
            ['Data availability', `${operations.data_availability_percent}%`],
            ['Patient delay', `${operations.patient_delay_minutes}m`],
            ['Exposure', `${operations.confidentiality_exposure_percent}%`],
            ['Closure risk', `${operations.closure_risk_percent}%`],
        ];

        els.operationsStatusTitle.textContent = operationalStatusLabel(operations.status);
        els.operationsStatusBadge.textContent = operationalStatusLabel(operations.status);
        els.operationsStatusBadge.className = `status-badge ${statusClass(operations.status)}`;
        els.operationsMetrics.innerHTML = metrics.map(([label, value]) => `
            <article class="operations-metric">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
            </article>
        `).join('');

        els.operationsImpacts.innerHTML = operations.active_impacts.length
            ? operations.active_impacts.map((impact) => `
                <article class="operations-impact">
                    <strong>${escapeHtml(impact.title)}</strong>
                    <span>${escapeHtml(impact.summary)}</span>
                </article>
            `).join('')
            : '<p class="empty-state">No active operational impacts.</p>';
    }

    function guidanceItems() {
        const items = [];
        const object = selectedObject();

        if (object) {
            const missingControls = object.controls.filter((control) => !control.enabled);
            const openFindings = findingsForObject(object.object_key);

            if (openFindings.length > 0 || missingControls.length > 0) {
                items.push({
                    tone: openFindings.length > 0 ? 'critical' : 'warning',
                    title: `Harden ${object.display_name}`,
                    body: `${missingControls.length} controls still need evidence; ${openFindings.length} findings are linked to this asset.`,
                    action: 'configure-selected',
                    target: object.object_key,
                    buttonText: 'Configure',
                    buttonLabel: `Configure ${object.display_name}`,
                });
            }
        }

        const missingEvidence = state.game.isms.evidence.filter(isEvidenceIncomplete);
        if (missingEvidence.length > 0) {
            items.push({
                tone: 'critical',
                title: 'Prepare audit evidence',
                body: `${missingEvidence.length} evidence records are missing or still draft. Start with ${missingEvidence[0].title}.`,
                action: 'open-evidence',
                buttonText: 'Evidence',
                buttonLabel: 'Open evidence workbench',
            });
        }

        const untreatedRisks = state.game.isms.risks.filter(isRiskUntreated);
        if (untreatedRisks.length > 0) {
            items.push({
                tone: 'warning',
                title: 'Treat open risks',
                body: `${untreatedRisks.length} risks still need assessment, treatment, or acceptance decisions.`,
                action: 'open-risks',
                buttonText: 'Risks',
                buttonLabel: 'Open risk register',
            });
        }

        const openActions = state.game.teaching.corrective_actions.filter(isCorrectiveActionOpen);
        if (openActions.length > 0) {
            items.push({
                tone: 'warning',
                title: 'Close corrective actions',
                body: `${openActions.length} corrective actions still need completion or effectiveness checks.`,
                action: 'open-actions',
                buttonText: 'Actions',
                buttonLabel: 'Open corrective actions',
            });
        }

        const activeIncident = state.game.teaching.incidents.find((incident) => incident.status === 'active');
        const availableIncident = state.game.teaching.incidents.find((incident) => incident.status === 'available');
        if (activeIncident) {
            items.push({
                tone: 'warning',
                title: 'Resolve active event',
                body: `${activeIncident.title} is active. Finish evidence and action checks before resolving it.`,
                action: 'open-operations',
                buttonText: 'Operations',
                buttonLabel: 'Open active event',
            });
        } else if (availableIncident) {
            items.push({
                tone: 'ready',
                title: 'Start a timeline event',
                body: `${availableIncident.title} can turn current gaps into corrective-action practice.`,
                action: 'open-operations',
                buttonText: 'Operations',
                buttonLabel: 'Open simulation events',
            });
        }

        if (items.length < 3) {
            const auditReady = state.game.score.overall.percent >= 85;
            items.push({
                tone: auditReady ? 'ready' : 'warning',
                title: auditReady ? 'Try the audit' : 'Prepare before audit',
                body: auditReady
                    ? 'Readiness is high enough to attempt a simulated audit.'
                    : 'Use the office findings, risks, evidence, and corrective actions to improve readiness.',
                action: auditReady ? 'open-audit' : 'open-operations',
                buttonText: auditReady ? 'Audit' : 'Operations',
                buttonLabel: auditReady ? 'Open audit' : 'Open operations',
            });
        }

        return items.slice(0, 3);
    }

    function isEvidenceIncomplete(item) {
        return item.status === 'missing' || item.status === 'draft';
    }

    function isRiskUntreated(item) {
        return item.treatment_status !== 'treated' && item.treatment_status !== 'accepted';
    }

    function isCorrectiveActionOpen(action) {
        return action.status !== 'verified' || action.verification_status !== 'effective';
    }

    function setPrimaryTab(tabKey) {
        state.activePrimaryTab = tabKey;

        for (const button of els.primaryTabs.querySelectorAll('[data-primary-tab]')) {
            const active = button.dataset.primaryTab === tabKey;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        }

        for (const panel of els.tabPanels) {
            const active = panel.dataset.tabPanel === tabKey;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        }

        if (tabKey === 'office') {
            window.requestAnimationFrame(resizeCanvas);
        }
    }

    function resizeCanvas() {
        const rect = els.canvas.getBoundingClientRect();
        const width = Math.max(320, Math.floor(rect.width));
        let height = Math.max(320, Math.floor(rect.height));

        if (state.game && state.game.map) {
            const drawableWidth = Math.max(1, width - floorPlanPadding * 2);
            height = Math.ceil((drawableWidth * state.game.map.height) / state.game.map.width + floorPlanPadding * 2);
            els.canvas.style.height = `${height}px`;
        }

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
        const padding = floorPlanPadding;
        const unit = (width - padding * 2) / map.width;
        const offsetX = padding;
        const offsetY = Math.max(padding, (height - unit * map.height) / 2);
        state.transform = { unit, offsetX, offsetY };
        state.hitBoxes = [];

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#f5f7f8';
        ctx.fillRect(0, 0, width, height);

        drawFloorPlan(offsetX, offsetY, unit, map.width, map.height);

        for (const object of map.objects) {
            drawObject(object, offsetX, offsetY, unit);
        }

        drawTimelineEventMarkers(offsetX, offsetY, unit);
    }

    function drawFloorPlan(offsetX, offsetY, unit, mapWidth, mapHeight) {
        const x = offsetX;
        const y = offsetY;
        const w = mapWidth * unit;
        const h = mapHeight * unit;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#56616b';
        ctx.lineWidth = 3;
        roundRect(x, y, w, h, 7, true, true);

        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        for (const room of officePlan.rooms) {
            ctx.fillStyle = room.fill;
            ctx.fillRect(
                offsetX + room.x * unit,
                offsetY + room.y * unit,
                room.width * unit,
                room.height * unit,
            );
        }

        for (const corridor of officePlan.corridors) {
            const cx = offsetX + corridor.x * unit;
            const cy = offsetY + corridor.y * unit;
            const cw = corridor.width * unit;
            const ch = corridor.height * unit;

            ctx.fillStyle = '#edf3f4';
            ctx.fillRect(cx, cy, cw, ch);
            ctx.fillStyle = '#7a8a94';
            ctx.font = `800 ${Math.max(10, Math.min(12, unit * 0.38))}px system-ui, sans-serif`;
            ctx.fillText(corridor.label, cx + 0.45 * unit, cy + ch / 2 + 4);
        }

        ctx.strokeStyle = 'rgba(116, 130, 140, 0.14)';
        ctx.lineWidth = 1;
        for (let gx = 1; gx < mapWidth; gx += 1) {
            ctx.beginPath();
            ctx.moveTo(offsetX + gx * unit, y);
            ctx.lineTo(offsetX + gx * unit, y + h);
            ctx.stroke();
        }
        for (let gy = 1; gy < mapHeight; gy += 1) {
            ctx.beginPath();
            ctx.moveTo(x, offsetY + gy * unit);
            ctx.lineTo(x + w, offsetY + gy * unit);
            ctx.stroke();
        }

        drawFurniture(offsetX, offsetY, unit);

        ctx.strokeStyle = '#a9b2ba';
        ctx.lineWidth = 2;

        for (const [x1, y1, x2, y2] of officePlan.walls) {
            ctx.beginPath();
            ctx.moveTo(offsetX + x1 * unit, offsetY + y1 * unit);
            ctx.lineTo(offsetX + x2 * unit, offsetY + y2 * unit);
            ctx.stroke();
        }

        for (const door of officePlan.doors) {
            drawDoor(door, offsetX, offsetY, unit);
        }

        ctx.fillStyle = '#6a7680';
        ctx.font = `700 ${Math.max(10, Math.min(12, unit * 0.38))}px system-ui, sans-serif`;
        for (const room of officePlan.rooms) {
            ctx.fillText(room.label, offsetX + (room.x + 0.45) * unit, offsetY + (room.y + 0.8) * unit);
        }

        ctx.restore();
    }

    function drawObject(object, offsetX, offsetY, unit) {
        const x = offsetX + object.x * unit;
        const y = offsetY + object.y * unit;
        const w = object.width * unit;
        const h = object.height * unit;
        const selected = object.object_key === state.selectedKey;
        const colors = objectColors(object);

        ctx.save();
        ctx.shadowColor = selected ? 'rgba(23, 126, 137, 0.24)' : 'rgba(24, 36, 45, 0.1)';
        ctx.shadowBlur = selected ? 18 : 7;
        ctx.shadowOffsetY = selected ? 4 : 2;
        ctx.fillStyle = selected ? 'rgba(23, 126, 137, 0.1)' : 'rgba(255, 255, 255, 0.62)';
        ctx.strokeStyle = selected ? '#177e89' : 'rgba(86, 97, 107, 0.26)';
        ctx.lineWidth = selected ? 3 : 1.4;
        roundRect(x + 1, y + 1, w - 2, h - 2, 8, true, true);
        ctx.restore();

        drawDeviceShape(object, x, y, w, h, colors, unit);
        drawObjectStatus(object, x, y, w, h);
        drawObjectOverlay(object, x, y, w, h, unit);

        state.hitBoxes.push({
            key: object.object_key,
            x,
            y,
            w,
            h,
        });
    }

    function drawObjectOverlay(object, x, y, w, h, unit) {
        if (state.activeMapMode === 'overview') {
            return;
        }

        const metric = objectOverlayMetric(object);
        const badgeHeight = Math.max(18, Math.min(24, unit * 0.62));
        const fontSize = Math.max(9, Math.min(12, unit * 0.34));
        ctx.save();
        ctx.font = `850 ${fontSize}px system-ui, sans-serif`;
        const badgeWidth = Math.min(w + 18, Math.max(56, ctx.measureText(metric.label).width + 20));
        const badgeX = x + w / 2 - badgeWidth / 2;
        const badgeY = y - badgeHeight - Math.max(5, unit * 0.16);

        ctx.shadowColor = metric.shadow;
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = Math.max(2, Math.min(4, unit * 0.12));
        roundRect(x - 4, y - 4, w + 8, h + 8, 10, false, true);

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = metric.fill;
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = 1.5;
        roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 999, true, true);
        ctx.fillStyle = metric.text;
        ctx.font = `850 ${fontSize}px system-ui, sans-serif`;
        drawFittedText(metric.label, badgeX + 10, badgeY + badgeHeight / 2 + fontSize / 3 - 1, badgeWidth - 20, fontSize);
        ctx.restore();
    }

    function objectOverlayMetric(object) {
        if (state.activeMapMode === 'readiness') {
            return overlayMetric(`${object.score.percent}%`, readinessTone(object.score.percent));
        }

        if (state.activeMapMode === 'evidence') {
            const items = linkedItems(state.game.isms.evidence, object.object_key);
            const incomplete = items.filter(isEvidenceIncomplete).length;
            const ready = Math.max(0, items.length - incomplete);

            if (items.length === 0) {
                return overlayMetric('No evidence', 'neutral');
            }

            return overlayMetric(`${ready}/${items.length}`, incomplete === 0 ? 'ready' : ready === 0 ? 'critical' : 'warning');
        }

        if (state.activeMapMode === 'risk') {
            const risks = linkedItems(state.game.isms.risks, object.object_key);
            const untreated = risks.filter(isRiskUntreated).length;

            if (risks.length === 0) {
                return overlayMetric('No risk', 'neutral');
            }

            return overlayMetric(`${untreated}/${risks.length}`, untreated === 0 ? 'ready' : untreated === risks.length ? 'critical' : 'warning');
        }

        if (state.activeMapMode === 'audit') {
            const findings = findingsForObject(object.object_key).length;

            return overlayMetric(findings === 0 ? 'Clear' : `${findings} gaps`, findings === 0 ? 'ready' : findings > 2 ? 'critical' : 'warning');
        }

        return overlayMetric('', 'neutral');
    }

    function drawTimelineEventMarkers(offsetX, offsetY, unit) {
        const activeEvents = state.game.timeline.events.filter((event) => event.status === 'active' && event.object_key);

        if (activeEvents.length === 0) {
            return;
        }

        ctx.save();
        for (const event of activeEvents) {
            const object = state.game.map.objects.find((item) => item.object_key === event.object_key);

            if (!object) {
                continue;
            }

            const x = offsetX + (object.x + object.width) * unit - Math.max(10, unit * 0.3);
            const y = offsetY + object.y * unit + Math.max(10, unit * 0.3);
            const radius = Math.max(9, Math.min(16, unit * 0.42));

            ctx.beginPath();
            ctx.fillStyle = '#c28622';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = `900 ${Math.max(11, Math.min(16, radius * 1.25))}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', x, y + 0.5);
        }
        ctx.restore();
    }

    function overlayMetric(label, tone) {
        const tones = {
            ready: ['#2f8f5b', '#eaf7ef', '#123d25', 'rgba(47, 143, 91, 0.25)'],
            warning: ['#c28622', '#fff5df', '#5b3b09', 'rgba(194, 134, 34, 0.28)'],
            critical: ['#bd3b3b', '#fdecec', '#5a1717', 'rgba(189, 59, 59, 0.3)'],
            neutral: ['#6b7785', '#f1f4f6', '#26313a', 'rgba(85, 99, 110, 0.2)'],
        };
        const palette = tones[tone] || tones.neutral;

        return {
            label,
            color: palette[0],
            fill: palette[1],
            text: palette[2],
            shadow: palette[3],
        };
    }

    function readinessTone(percent) {
        if (percent >= 85) {
            return 'ready';
        }

        if (percent >= 50) {
            return 'warning';
        }

        return 'critical';
    }

    function drawFurniture(offsetX, offsetY, unit) {
        for (const item of officePlan.furniture) {
            drawFurnitureItem(item, offsetX, offsetY, unit);
        }
    }

    function drawFurnitureItem(item, offsetX, offsetY, unit) {
        const x = offsetX + item.x * unit;
        const y = offsetY + item.y * unit;
        const w = item.width * unit;
        const h = item.height * unit;
        const palette = {
            fill: item.type === 'rack' ? '#d7dde0' : item.type === 'cloud_zone' ? '#d8eeee' : '#d8c8aa',
            stroke: item.type === 'rack' ? '#88949b' : item.type === 'cloud_zone' ? '#91bfc0' : '#a99168',
            detail: item.type === 'rack' ? '#5d6870' : item.type === 'cloud_zone' ? '#5d9698' : '#8d7651',
        };

        ctx.save();
        ctx.fillStyle = palette.fill;
        ctx.strokeStyle = palette.stroke;
        ctx.lineWidth = 1.5;

        if (item.type === 'reception_desk') {
            roundRect(x, y, w, h * 0.66, 5, true, true);
            roundRect(x, y + h * 0.48, w * 0.38, h * 0.52, 5, true, true);
        } else {
            roundRect(x, y, w, h, 5, true, true);
        }

        ctx.strokeStyle = palette.detail;
        ctx.lineWidth = 1;

        if (item.type === 'shelves' || item.type === 'rack') {
            for (let row = 1; row < 4; row += 1) {
                ctx.beginPath();
                ctx.moveTo(x + 5, y + (h / 4) * row);
                ctx.lineTo(x + w - 5, y + (h / 4) * row);
                ctx.stroke();
            }
        }

        if (item.type === 'exam_couch') {
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 8);
            ctx.lineTo(x + w - 6, y + h - 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + w / 2, y + 11, Math.min(w, h) * 0.18, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (item.type === 'table' || item.type === 'desk' || item.type === 'counter') {
            ctx.beginPath();
            ctx.moveTo(x + 7, y + 7);
            ctx.lineTo(x + w - 7, y + h - 7);
            ctx.moveTo(x + w - 7, y + 7);
            ctx.lineTo(x + 7, y + h - 7);
            ctx.stroke();
        }

        const showFurnitureLabel = ['reception_desk', 'cloud_zone', 'rack', 'shelves', 'table'].includes(item.type);

        if (showFurnitureLabel && w >= 70 && h >= 34) {
            ctx.fillStyle = 'rgba(65, 73, 80, 0.7)';
            const fontSize = Math.max(9, Math.min(10, unit * 0.32));
            ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
            drawFittedText(item.label, x + 6, y + h - 8, w - 12, fontSize);
        }

        ctx.restore();
    }

    function drawDoor(door, offsetX, offsetY, unit) {
        const x = offsetX + door.x * unit;
        const y = offsetY + door.y * unit;
        const size = door.width * unit;
        const swing = size * 0.72;

        ctx.save();
        ctx.strokeStyle = '#8b9aa5';
        ctx.lineWidth = 1.4;

        if (door.side === 'down' || door.side === 'up') {
            const direction = door.side === 'down' ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + swing * direction);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, swing, door.side === 'down' ? 0 : -Math.PI / 2, door.side === 'down' ? Math.PI / 2 : 0);
            ctx.stroke();
        } else {
            const direction = door.side === 'right' ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + swing * direction, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, swing, door.side === 'right' ? 0 : Math.PI, door.side === 'right' ? Math.PI / 2 : Math.PI * 1.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawDeviceShape(object, x, y, w, h, colors, unit) {
        const pad = Math.max(5, Math.min(10, unit * 0.22));
        const labelH = Math.max(15, Math.min(19, h * 0.28));
        const ix = x + pad;
        const iy = y + pad;
        const iw = w - pad * 2;
        const ih = Math.max(16, h - pad * 2 - labelH);

        ctx.save();
        if (object.object_type === 'workstation') {
            drawWorkstationDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'laptop') {
            drawLaptopDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'cloud_service') {
            drawCloudDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'network') {
            drawNetworkDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'backup') {
            drawNasDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'printer') {
            drawPrinterDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'records') {
            drawRecordsDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'documentation') {
            drawBinderDevice(ix, iy, iw, ih, colors);
        } else if (object.object_type === 'disposal') {
            drawShredDevice(ix, iy, iw, ih, colors);
        } else {
            roundRect(ix, iy, iw, ih, 7, true, true);
        }

        const labelY = y + h - labelH - 7;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        roundRect(x + 5, labelY, w - 10, labelH, 5, true, false);
        ctx.fillStyle = colors.text;
        const fontSize = Math.max(9, Math.min(12, unit * 0.36));
        ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
        drawFittedText(shortLabel(object), x + 9, labelY + labelH / 2 + fontSize / 3 - 1, w - 18, fontSize);
        ctx.restore();
    }

    function drawWorkstationDevice(x, y, w, h, colors) {
        const screenW = w * 0.7;
        const screenH = h * 0.52;
        const sx = x + (w - screenW) / 2;
        const sy = y + h * 0.08;

        ctx.fillStyle = '#20313f';
        roundRect(sx, sy, screenW, screenH, 4, true, false);
        ctx.fillStyle = colors.fill;
        roundRect(sx + 4, sy + 4, screenW - 8, screenH - 8, 3, true, false);
        ctx.fillStyle = colors.stroke;
        ctx.fillRect(x + w * 0.46, sy + screenH, w * 0.08, h * 0.17);
        roundRect(x + w * 0.34, sy + screenH + h * 0.13, w * 0.32, h * 0.08, 3, true, false);
        ctx.fillStyle = '#eef2f5';
        ctx.strokeStyle = '#7c8892';
        roundRect(x + w * 0.22, y + h * 0.8, w * 0.56, h * 0.12, 3, true, true);
    }

    function drawLaptopDevice(x, y, w, h, colors) {
        const screenW = w * 0.72;
        const screenH = h * 0.48;
        const sx = x + (w - screenW) / 2;
        const sy = y + h * 0.12;

        ctx.fillStyle = '#2d214f';
        roundRect(sx, sy, screenW, screenH, 4, true, false);
        ctx.fillStyle = colors.fill;
        roundRect(sx + 4, sy + 4, screenW - 8, screenH - 8, 3, true, false);
        ctx.fillStyle = colors.stroke;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.16, y + h * 0.72);
        ctx.lineTo(x + w * 0.84, y + h * 0.72);
        ctx.lineTo(x + w * 0.96, y + h * 0.9);
        ctx.lineTo(x + w * 0.04, y + h * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fillRect(x + w * 0.42, y + h * 0.77, w * 0.16, h * 0.04);
    }

    function drawCloudDevice(x, y, w, h, colors) {
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.24, y + h * 0.66);
        ctx.bezierCurveTo(x + w * 0.05, y + h * 0.65, x + w * 0.04, y + h * 0.36, x + w * 0.27, y + h * 0.38);
        ctx.bezierCurveTo(x + w * 0.33, y + h * 0.16, x + w * 0.58, y + h * 0.12, x + w * 0.68, y + h * 0.34);
        ctx.bezierCurveTo(x + w * 0.9, y + h * 0.33, x + w * 0.96, y + h * 0.66, x + w * 0.7, y + h * 0.68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = colors.text;
        const fontSize = Math.max(10, Math.min(16, h * 0.24));
        ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
        drawFittedText('EHR', x + w * 0.35, y + h * 0.56, w * 0.32, fontSize);
    }

    function drawNetworkDevice(x, y, w, h, colors) {
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y + h * 0.42);
        ctx.lineTo(x + w * 0.12, y + h * 0.1);
        ctx.moveTo(x + w * 0.75, y + h * 0.42);
        ctx.lineTo(x + w * 0.88, y + h * 0.1);
        ctx.stroke();
        ctx.fillStyle = colors.fill;
        roundRect(x + w * 0.16, y + h * 0.42, w * 0.68, h * 0.35, 5, true, true);
        ctx.fillStyle = colors.stroke;
        for (let index = 0; index < 3; index += 1) {
            ctx.beginPath();
            ctx.arc(x + w * (0.34 + index * 0.16), y + h * 0.59, h * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.24, w * 0.16, Math.PI * 1.15, Math.PI * 1.85);
        ctx.arc(x + w * 0.5, y + h * 0.24, w * 0.27, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
    }

    function drawNasDevice(x, y, w, h, colors) {
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        roundRect(x + w * 0.18, y + h * 0.12, w * 0.64, h * 0.74, 6, true, true);
        for (let index = 0; index < 3; index += 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            roundRect(x + w * (0.27 + index * 0.16), y + h * 0.25, w * 0.1, h * 0.46, 3, true, false);
            ctx.fillStyle = colors.stroke;
            ctx.fillRect(x + w * (0.29 + index * 0.16), y + h * 0.61, w * 0.06, h * 0.03);
        }
    }

    function drawPrinterDevice(x, y, w, h, colors) {
        ctx.fillStyle = '#f8fafb';
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        roundRect(x + w * 0.25, y + h * 0.08, w * 0.5, h * 0.28, 3, true, true);
        ctx.fillStyle = colors.fill;
        roundRect(x + w * 0.15, y + h * 0.34, w * 0.7, h * 0.36, 5, true, true);
        ctx.fillStyle = '#ffffff';
        roundRect(x + w * 0.24, y + h * 0.66, w * 0.52, h * 0.22, 3, true, true);
        ctx.fillStyle = colors.stroke;
        ctx.beginPath();
        ctx.arc(x + w * 0.72, y + h * 0.48, h * 0.025, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRecordsDevice(x, y, w, h, colors) {
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        roundRect(x + w * 0.18, y + h * 0.08, w * 0.64, h * 0.82, 5, true, true);
        for (let row = 1; row < 3; row += 1) {
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * (0.08 + row * 0.27));
            ctx.lineTo(x + w * 0.8, y + h * (0.08 + row * 0.27));
            ctx.stroke();
        }
        ctx.fillStyle = colors.stroke;
        for (let row = 0; row < 3; row += 1) {
            ctx.fillRect(x + w * 0.45, y + h * (0.2 + row * 0.23), w * 0.1, h * 0.025);
        }
    }

    function drawBinderDevice(x, y, w, h, colors) {
        const binderW = w * 0.18;
        const startX = x + w * 0.22;
        const fills = [colors.fill, '#f7e7b3', '#e4efe7'];

        for (let index = 0; index < 3; index += 1) {
            ctx.fillStyle = fills[index];
            ctx.strokeStyle = colors.stroke;
            roundRect(startX + index * binderW * 1.05, y + h * 0.12, binderW, h * 0.72, 3, true, true);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.fillRect(startX + index * binderW * 1.05 + binderW * 0.25, y + h * 0.32, binderW * 0.5, h * 0.08);
        }
    }

    function drawShredDevice(x, y, w, h, colors) {
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 2;
        roundRect(x + w * 0.25, y + h * 0.14, w * 0.5, h * 0.72, 5, true, true);
        ctx.fillStyle = colors.stroke;
        ctx.fillRect(x + w * 0.33, y + h * 0.28, w * 0.34, h * 0.045);
        ctx.strokeStyle = colors.stroke;
        for (let index = 0; index < 4; index += 1) {
            ctx.beginPath();
            ctx.moveTo(x + w * (0.34 + index * 0.08), y + h * 0.42);
            ctx.lineTo(x + w * (0.32 + index * 0.08), y + h * 0.7);
            ctx.stroke();
        }
    }

    function drawObjectStatus(object, x, y, w, h) {
        const indicator = object.state === 'ready' ? '#2f8f5b' : object.state === 'partial' ? '#c28622' : '#bd3b3b';

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = indicator;
        ctx.beginPath();
        ctx.arc(x + w - 10, y + 10, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x + 7, y + h - 6, Math.max(0, w - 14), 4);
        ctx.fillStyle = indicator;
        ctx.fillRect(x + 7, y + h - 6, Math.max(0, (w - 14) * object.score.percent / 100), 4);
        ctx.restore();
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
        if (width <= 0 || height <= 0) {
            return;
        }

        const r = Math.max(0, Math.min(radius, width / 2, height / 2));
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

    function renderDeviceModal() {
        if (!state.deviceModalOpen) {
            els.deviceModal.hidden = true;
            return;
        }

        const object = selectedObject();

        if (!object) {
            closeDeviceModal();
            return;
        }

        els.deviceModal.hidden = false;
        els.deviceModalKicker.textContent = typeLabel(object.object_type);
        els.deviceModalTitle.textContent = object.display_name;

        if (state.deviceModalMode === 'configure') {
            renderDeviceConfiguration(object);
        } else {
            renderDeviceProfile(object);
        }
    }

    function renderDeviceProfile(object) {
        const findings = findingsForObject(object.object_key);
        const risks = linkedItems(state.game.isms.risks, object.object_key);
        const evidence = linkedItems(state.game.isms.evidence, object.object_key);
        const actions = linkedItems(state.game.teaching.corrective_actions, object.object_key);
        const enabledControls = object.controls.filter((control) => control.enabled).length;

        els.deviceModalBody.innerHTML = `
            <div class="asset-header">
                <div>
                    <p class="asset-type">${escapeHtml(typeLabel(object.object_type))}</p>
                    <p class="control-description">${escapeHtml(object.display_name)} is linked to technical controls, ISMS evidence, risk treatment, and corrective actions.</p>
                </div>
                <span class="status-badge ${escapeAttr(object.state)}">${escapeHtml(stateLabel(object.state))}</span>
            </div>
            <div class="profile-grid">
                <div class="profile-metric"><span>Readiness</span><strong>${object.score.percent}%</strong></div>
                <div class="profile-metric"><span>Controls</span><strong>${enabledControls}/${object.controls.length}</strong></div>
                <div class="profile-metric"><span>Findings</span><strong>${findings.length}</strong></div>
            </div>
            ${linkedSection('Key findings', findings.map((finding) => ({
                title: finding.title,
                meta: finding.recommendation,
            })))}
            ${linkedSection('Linked risks', risks.map((risk) => ({
                title: risk.title,
                meta: `${risk.treatment_status} - score ${risk.inherent_score}`,
            })))}
            ${linkedSection('Linked evidence', evidence.map((item) => ({
                title: item.title,
                meta: `${item.status} - ${item.owner}`,
            })))}
            ${linkedSection('Corrective actions', actions.map((action) => ({
                title: action.title,
                meta: `${action.status} - ${action.verification_status}`,
            })))}
        `;

        els.deviceModalActions.innerHTML = `
            <button type="button" data-device-modal-mode="configure">Configure</button>
            <button class="secondary" type="button" data-device-modal-close>Close</button>
        `;
        bindDeviceModalActions();
    }

    function renderDeviceConfiguration(object) {
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

        els.deviceModalBody.innerHTML = `
            <div class="asset-header">
                <div>
                    <p class="asset-type">${escapeHtml(typeLabel(object.object_type))}</p>
                    <p class="control-description">Enable controls only when the office could demonstrate that they are implemented.</p>
                </div>
                <span class="status-badge ${escapeAttr(object.state)}">${escapeHtml(stateLabel(object.state))}</span>
            </div>
            <div class="meter" aria-label="Asset readiness">
                <span style="width: ${object.score.percent}%"></span>
            </div>
            <div class="control-list">${controls}</div>
        `;

        els.deviceModalActions.innerHTML = `
            <button class="secondary" type="button" data-device-modal-mode="profile">Back to profile</button>
            <button type="button" data-device-modal-close>Done</button>
        `;

        for (const checkbox of els.deviceModalBody.querySelectorAll('[data-control]')) {
            checkbox.addEventListener('change', () => {
                updateControl(object.object_key, checkbox.dataset.control, checkbox.checked);
            });
        }

        bindDeviceModalActions();
    }

    function linkedSection(title, items) {
        if (items.length === 0) {
            return `
                <section>
                    <h3>${escapeHtml(title)}</h3>
                    <p class="empty-state">Nothing linked here yet.</p>
                </section>
            `;
        }

        return `
            <section>
                <h3>${escapeHtml(title)}</h3>
                <div class="linked-list">
                    ${items.slice(0, 4).map((item) => `
                        <article class="linked-item">
                            <strong>${escapeHtml(item.title)}</strong>
                            <span>${escapeHtml(item.meta)}</span>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function bindDeviceModalActions() {
        for (const button of els.deviceModalActions.querySelectorAll('[data-device-modal-mode]')) {
            button.addEventListener('click', () => {
                state.deviceModalMode = button.dataset.deviceModalMode;
                renderDeviceModal();
            });
        }

        for (const button of els.deviceModalActions.querySelectorAll('[data-device-modal-close]')) {
            button.addEventListener('click', closeDeviceModal);
        }
    }

    function openDeviceModal(objectKey, mode = 'profile') {
        state.selectedKey = objectKey;
        state.deviceModalMode = mode;
        state.deviceModalOpen = true;
        render();
    }

    function closeDeviceModal() {
        state.deviceModalOpen = false;
        els.deviceModal.hidden = true;
    }

    function findingsForObject(objectKey) {
        return state.game.findings.filter((finding) => finding.object_key === objectKey);
    }

    function linkedItems(items, objectKey) {
        return items.filter((item) => item.object_key === objectKey);
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
        const openActions = state.game.teaching.corrective_actions.filter(isCorrectiveActionOpen).length;
        els.ismsScoreSummary.textContent = `Inventory ${scores.assets.percent}% - Risks ${scores.risks.percent}% - Evidence ${scores.evidence.percent}% - Actions ${openActions} open`;

        for (const button of els.ismsTabs.querySelectorAll('[data-isms-tab]')) {
            button.classList.toggle('active', button.dataset.ismsTab === state.activeIsmsTab);
        }

        if (state.activeIsmsTab === 'assets') {
            els.ismsBody.innerHTML = artifacts.assets.map(renderAssetArtifact).join('');
        } else if (state.activeIsmsTab === 'risks') {
            els.ismsBody.innerHTML = artifacts.risks.map(renderRiskArtifact).join('');
        } else if (state.activeIsmsTab === 'evidence') {
            els.ismsBody.innerHTML = artifacts.evidence.map(renderEvidenceArtifact).join('');
        } else {
            const actions = state.game.teaching.corrective_actions;
            els.ismsBody.innerHTML = actions.length
                ? actions.map(renderCorrectiveActionCard).join('')
                : '<p class="empty-state">No corrective actions have been opened.</p>';
        }

        bindIsmsControls();
        bindCorrectiveActionControls(els.ismsBody);
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

    function renderOperationsPanel() {
        const teaching = state.game.teaching;
        const scores = state.game.score.teaching;
        const openActions = teaching.corrective_actions.filter(isCorrectiveActionOpen).length;
        els.teachingScoreSummary.textContent = `Events ${scores.incidents.percent}% - ${openActions} linked actions in ISMS`;

        els.incidentList.innerHTML = teaching.incidents.length
            ? teaching.incidents.map(renderIncidentCard).join('')
            : '<p class="empty-state">No simulation events are available.</p>';

        bindOperationsControls();
    }

    function setDrawerTab(tabKey) {
        state.activeDrawerTab = tabKey === 'advisor' ? 'advisor' : 'timeline';
        els.drawerTitle.textContent = state.activeDrawerTab === 'advisor' ? 'Advisor' : 'Timeline';

        for (const button of els.drawerTabs.querySelectorAll('[data-drawer-tab]')) {
            const active = button.dataset.drawerTab === state.activeDrawerTab;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        }

        for (const panel of els.drawerPanels) {
            const active = panel.dataset.drawerPanel === state.activeDrawerTab;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        }
    }

    function openDrawer(tabKey = state.activeDrawerTab || 'timeline', opener = null) {
        state.drawerOpen = true;
        state.drawerOpener = opener || document.activeElement;
        els.drawerBackdrop.hidden = false;
        els.infoDrawer.hidden = false;
        els.drawerToggle.setAttribute('aria-expanded', 'true');
        setDrawerTab(tabKey);
        window.requestAnimationFrame(() => {
            const activeTab = els.drawerTabs.querySelector(`[data-drawer-tab="${state.activeDrawerTab}"]`);
            (activeTab || els.drawerClose).focus();
        });
    }

    function closeDrawer() {
        if (!state.drawerOpen) {
            return;
        }

        state.drawerOpen = false;
        els.drawerBackdrop.hidden = true;
        els.infoDrawer.hidden = true;
        els.drawerToggle.setAttribute('aria-expanded', 'false');

        if (state.drawerOpener && typeof state.drawerOpener.focus === 'function') {
            state.drawerOpener.focus();
        }

        state.drawerOpener = null;
    }

    function renderAuditPanel() {
        const report = state.lastReport || normalizeLatestCertificationAudit(state.game.latest_audit);
        els.certificationStepper.innerHTML = renderProcessStepper(certificationPrepSteps(report));

        if (!report) {
            els.auditPanelBody.innerHTML = '<p class="empty-state">Run an audit to generate a simulated auditor report.</p>';
            return;
        }

        els.auditPanelBody.innerHTML = renderCertificationReport(report);
    }

    function normalizeLatestCertificationAudit(report) {
        if (!report) {
            return null;
        }

        return {
            status: report.status,
            overall_percent: report.score.overall_percent,
            major_findings: report.score.major_findings,
            minor_findings: report.score.minor_findings,
            summary: 'Latest saved simulated audit report.',
            operational_summary: report.score.operational_summary || '',
            operational_consequences: report.score.operational_consequences || [],
            sampled_findings: report.findings || [],
        };
    }

    function renderProcessStepper(steps) {
        return steps.map((step, index) => `
            <article class="stepper-step ${escapeAttr(step.state)}">
                <span class="stepper-index">${escapeHtml(step.state === 'completed' ? 'OK' : String(index + 1))}</span>
                <div class="stepper-copy">
                    <h3>${escapeHtml(step.title)}</h3>
                    <p>${escapeHtml(step.detail)}</p>
                </div>
            </article>
        `).join('');
    }

    function certificationPrepSteps(report) {
        const scores = state.game.score.artifacts;
        const evidenceIncomplete = state.game.isms.evidence.filter(isEvidenceIncomplete).length;
        const untreatedRisks = state.game.isms.risks.filter(isRiskUntreated).length;
        const openActions = state.game.teaching.corrective_actions.filter(isCorrectiveActionOpen).length;
        const hasAuditReport = Boolean(report);
        const evidenceReady = scores.evidence.percent >= 80 && evidenceIncomplete === 0;
        const risksReady = scores.risks.percent >= 80 && untreatedRisks === 0;
        const readinessReady = state.game.score.overall.percent >= 85 && openActions === 0;
        const auditPassed = hasAuditReport && report.status !== 'not_ready' && report.major_findings === 0;

        return markCurrentStep([
            {
                title: 'Evidence pack',
                detail: evidenceReady
                    ? 'Evidence checklist is audit-ready.'
                    : `${evidenceIncomplete} evidence items still need ready or reviewed status.`,
                done: evidenceReady,
            },
            {
                title: 'Risk treatment',
                detail: risksReady
                    ? 'Risk register treatments are ready for auditor review.'
                    : `${untreatedRisks} risks still need treatment or acceptance.`,
                done: risksReady,
            },
            {
                title: 'Readiness gate',
                detail: readinessReady
                    ? `${state.game.score.overall.percent}% readiness with corrective actions closed.`
                    : `${state.game.score.overall.percent}% readiness and ${openActions} open corrective actions.`,
                done: readinessReady,
            },
            {
                title: 'Certification check',
                detail: hasAuditReport
                    ? `${statusLabel(report.status)} with ${report.major_findings} major and ${report.minor_findings} minor findings.`
                    : 'Run the audit after the preparation gates are clear.',
                done: auditPassed,
            },
        ]);
    }

    function markCurrentStep(steps) {
        const currentIndex = steps.findIndex((step) => !step.done);

        return steps.map((step, index) => ({
            ...step,
            state: step.done ? 'completed' : index === currentIndex ? 'current' : 'pending',
        }));
    }

    function renderIncidentCard(incident) {
        const linkedAction = actionForIncident(incident.incident_key);
        const actionButton = linkedAction
            ? `<button type="button" data-incident-action="open-action" data-incident-key="${escapeAttr(incident.incident_key)}">Open action</button>`
            : '';
        const buttonHtml = incident.status === 'available'
            ? `<button type="button" data-incident-action="start" data-incident-key="${escapeAttr(incident.incident_key)}" ${state.busy ? 'disabled' : ''}>Start event</button>`
            : incident.status === 'active'
                ? `<button type="button" data-incident-action="resolve" data-incident-key="${escapeAttr(incident.incident_key)}" ${state.busy ? 'disabled' : ''}>Resolve</button>${actionButton}`
                : actionButton;

        return `
            <article class="teaching-card">
                <header>
                    <h4>${escapeHtml(incident.title)}</h4>
                    <span class="status-badge ${escapeAttr(statusClass(incident.status))}">${escapeHtml(incident.status)}</span>
                </header>
                <p class="control-description">${escapeHtml(incident.description)}</p>
                <p class="control-description">${escapeHtml(incident.status === 'available' ? incident.trigger_text : incident.lesson_text)}</p>
                ${linkedAction ? `<p class="artifact-meta">Linked action: ${escapeHtml(linkedAction.title)}</p>` : ''}
                <div class="teaching-actions">${buttonHtml}</div>
            </article>
        `;
    }

    function actionForIncident(incidentKey) {
        return state.game.teaching.corrective_actions.find((action) => action.source_type === 'incident' && action.source_key === incidentKey) || null;
    }

    function renderCorrectiveActionCard(action) {
        return `
            <article class="teaching-card" data-action-card="${escapeAttr(action.action_key)}">
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

    function bindOperationsControls() {
        for (const button of els.incidentList.querySelectorAll('[data-incident-action]')) {
            button.addEventListener('click', () => {
                updateIncident(button.dataset.incidentAction, button.dataset.incidentKey);
            });
        }
    }

    function bindCorrectiveActionControls(root) {
        for (const select of root.querySelectorAll('select[data-action-key]')) {
            select.addEventListener('change', () => {
                updateCorrectiveAction(select.dataset.actionKey, select.dataset.actionField, select.value);
            });
        }

        for (const input of root.querySelectorAll('input[data-action-key], textarea[data-action-key]')) {
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
        if (action === 'open-action') {
            openCorrectiveActions(incidentKey);
            return;
        }

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
            showToast(action === 'resolve' ? 'Timeline event resolved.' : 'Timeline event started.');
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

    function renderAudit(report) {
        state.lastReport = report;
        setPrimaryTab('audit');
        els.auditPanelBody.innerHTML = renderCertificationReport(report);
    }

    function openCorrectiveActions(incidentKey = '') {
        closeDrawer();
        state.activeIsmsTab = 'actions';
        setPrimaryTab('isms');
        renderIsmsPanel();

        if (incidentKey) {
            const action = actionForIncident(incidentKey);
            const card = action
                ? Array.from(els.ismsBody.querySelectorAll('[data-action-card]')).find((item) => item.dataset.actionCard === action.action_key)
                : null;

            if (card) {
                card.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function renderCertificationReport(report) {
        const sampledFindings = report.sampled_findings || [];
        const operationalConsequences = report.operational_consequences || [];

        return `
            <h2>Simulated Audit Report</h2>
            <p class="control-description">${escapeHtml(report.summary)}</p>
            <div class="audit-grid">
                <div class="audit-metric"><span>Status</span><strong>${escapeHtml(statusLabel(report.status))}</strong></div>
                <div class="audit-metric"><span>Overall</span><strong>${report.overall_percent}%</strong></div>
                <div class="audit-metric"><span>Major</span><strong>${report.major_findings}</strong></div>
                <div class="audit-metric"><span>Minor</span><strong>${report.minor_findings}</strong></div>
            </div>
            <section class="audit-section">
                <h3>Operational Resilience</h3>
                <p class="control-description">${escapeHtml(report.operational_summary || 'No operational events were sampled in this audit run.')}</p>
                ${operationalConsequences.length ? `
                    <div class="audit-consequence-list">
                        ${operationalConsequences.map((consequence) => `
                            <article class="audit-consequence ${escapeAttr(consequence.severity)}">
                                <header>
                                    <div>
                                        <h4>${escapeHtml(consequence.title)}</h4>
                                        <span class="finding-meta">${escapeHtml(statusLabel(consequence.status))} - ${escapeHtml(statusLabel(consequence.severity))}</span>
                                    </div>
                                </header>
                                <p class="control-description">${escapeHtml(consequence.summary)}</p>
                                ${renderAuditConsequenceMetrics(consequence.metrics || {})}
                            </article>
                        `).join('')}
                    </div>
                ` : '<p class="empty-state">No operational consequences sampled.</p>'}
            </section>
            <section class="audit-section">
                <h3>Sampled Findings</h3>
                ${sampledFindings.length ? `
                <div>
                    ${sampledFindings.map((finding) => `
                        <article class="finding-item">
                            <div class="finding-title">${escapeHtml(finding.title)}</div>
                            <div class="finding-meta">${escapeHtml(finding.object_name)} - ${escapeHtml(finding.recommendation)}</div>
                        </article>
                    `).join('')}
                </div>
                ` : '<p class="empty-state">No sampled findings.</p>'}
            </section>
        `;
    }

    function renderAuditConsequenceMetrics(metrics) {
        return `
            <div class="audit-consequence-metrics">
                <span>Capacity ${Number(metrics.clinical_capacity_percent ?? 100)}%</span>
                <span>Data ${Number(metrics.data_availability_percent ?? 100)}%</span>
                <span>Delay ${Number(metrics.patient_delay_minutes ?? 0)} min</span>
                <span>Closure risk ${Number(metrics.closure_risk_percent ?? 0)}%</span>
            </div>
        `;
    }

    function handleGuidanceAction(action, target = '') {
        if (action === 'configure-selected') {
            const objectKey = target || state.selectedKey;

            if (objectKey) {
                closeDrawer();
                setPrimaryTab('office');
                openDeviceModal(objectKey, 'configure');
            }

            return;
        }

        if (action === 'open-evidence') {
            closeDrawer();
            state.activeIsmsTab = 'evidence';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-risks') {
            closeDrawer();
            state.activeIsmsTab = 'risks';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-inventory') {
            closeDrawer();
            state.activeIsmsTab = 'assets';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-actions') {
            openCorrectiveActions();
            return;
        }

        if (action === 'open-operations') {
            closeDrawer();
            setPrimaryTab('office');
            return;
        }

        if (action === 'open-audit') {
            closeDrawer();
            setPrimaryTab('audit');
        }
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
            active: 'Active',
            resolved: 'Resolved',
            major: 'Major',
            minor: 'Minor',
        }[value] || value;
    }

    function operationalStatusLabel(value) {
        return {
            nominal: 'Nominal',
            watch: 'Watch',
            disrupted: 'Disrupted',
            closure_risk: 'Closure risk',
        }[value] || value;
    }

    function statusClass(value) {
        return {
            nominal: 'ready',
            resolved: 'ready',
            verified: 'ready',
            passed: 'ready',
            closure_risk: 'needs_attention',
            disrupted: 'needs_attention',
            active: 'needs_attention',
            open: 'needs_attention',
            major_findings: 'needs_attention',
            watch: 'partial',
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

    els.showRegister.addEventListener('click', () => {
        setAuthMode('register');
    });

    els.showLogin.addEventListener('click', () => {
        setAuthMode('login');
    });

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

    els.drawerToggle.addEventListener('click', () => {
        openDrawer('timeline', els.drawerToggle);
    });

    els.drawerClose.addEventListener('click', closeDrawer);
    els.drawerBackdrop.addEventListener('click', closeDrawer);

    els.drawerTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-drawer-tab]');

        if (!button) {
            return;
        }

        setDrawerTab(button.dataset.drawerTab);
    });

    els.primaryTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-primary-tab]');

        if (!button) {
            return;
        }

        setPrimaryTab(button.dataset.primaryTab);
    });

    els.guidancePanel.addEventListener('click', (event) => {
        const button = event.target.closest('[data-guidance-action]');

        if (!button) {
            return;
        }

        handleGuidanceAction(button.dataset.guidanceAction, button.dataset.guidanceTarget);
    });

    els.mapViewControls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-map-mode]');

        if (!button) {
            return;
        }

        state.activeMapMode = button.dataset.mapMode;
        renderMapModeControls();
        drawOffice();
    });

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
            openDeviceModal(hit.key, 'profile');
        }
    });

    els.deviceModalClose.addEventListener('click', closeDeviceModal);

    els.deviceModal.addEventListener('click', (event) => {
        if (event.target === els.deviceModal) {
            closeDeviceModal();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.deviceModalOpen) {
            closeDeviceModal();
            return;
        }

        if (event.key === 'Escape' && state.drawerOpen) {
            closeDrawer();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    bootstrap();
})();
