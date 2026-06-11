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
        activeIsmsTab: 'controls',
        activePrimaryTab: 'office',
        activeMapMode: 'overview',
        activeDrawerTab: 'timeline',
        activeHelpTab: 'game',
        activeTimelineMenuKey: null,
        expandedControlGroups: {},
        operationsExpanded: false,
        drawerOpen: false,
        drawerOpener: null,
        contextModalOpen: false,
        contextModalType: 'device',
        contextModalMode: 'profile',
        activeEventKey: null,
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
        scoreOffice: document.getElementById('score-office'),
        scoreOverall: document.getElementById('score-overall'),
        scoreSecurity: document.getElementById('score-security'),
        scoreResilience: document.getElementById('score-resilience'),
        scoreAudit: document.getElementById('score-audit'),
        runAudit: document.getElementById('run-audit'),
        helpToggle: document.getElementById('help-toggle'),
        drawerToggle: document.getElementById('drawer-toggle'),
        drawerBadge: document.getElementById('drawer-badge'),
        drawerBackdrop: document.getElementById('drawer-backdrop'),
        infoDrawer: document.getElementById('info-drawer'),
        drawerTitle: document.getElementById('drawer-title'),
        drawerClose: document.getElementById('drawer-close'),
        drawerTabs: document.getElementById('drawer-tabs'),
        drawerAdvisorTab: document.getElementById('drawer-tab-advisor'),
        drawerPanels: document.querySelectorAll('[data-drawer-panel]'),
        timelineSummary: document.getElementById('timeline-summary'),
        timelineList: document.getElementById('timeline-list'),
        guidanceModeForm: document.getElementById('guidance-mode-form'),
        timelineSettingsForm: document.getElementById('timeline-settings-form'),
        logout: document.getElementById('logout'),
        primaryTabs: document.getElementById('primary-tabs'),
        guidancePanel: document.getElementById('guidance-panel'),
        guidanceSummary: document.getElementById('guidance-summary'),
        guidanceList: document.getElementById('guidance-list'),
        mapModeDescription: document.getElementById('map-mode-description'),
        mapViewControls: document.getElementById('map-view-controls'),
        tabPanels: document.querySelectorAll('[data-tab-panel]'),
        canvas: document.getElementById('office-canvas'),
        operationsToggle: document.getElementById('operations-toggle'),
        operationsDetails: document.getElementById('operations-details'),
        operationsStatusTitle: document.getElementById('operations-status-title'),
        operationsStatusBadge: document.getElementById('operations-status-badge'),
        operationsMetrics: document.getElementById('operations-metrics'),
        operationsImpacts: document.getElementById('operations-impacts'),
        ismsTabs: document.getElementById('isms-tabs'),
        ismsBody: document.getElementById('isms-body'),
        ismsScoreSummary: document.getElementById('isms-score-summary'),
        certificationStepper: document.getElementById('certification-stepper'),
        auditPanelBody: document.getElementById('audit-panel-body'),
        toast: document.getElementById('toast'),
        contextModal: document.getElementById('context-modal'),
        contextModalKicker: document.getElementById('context-modal-kicker'),
        contextModalTitle: document.getElementById('context-modal-title'),
        contextModalClose: document.getElementById('context-modal-close'),
        contextModalBody: document.getElementById('context-modal-body'),
        contextModalActions: document.getElementById('context-modal-actions'),
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
    const officeControlGroups = [
        {
            key: 'access',
            title: 'Access and identity',
            focus: 'Annex A-inspired focus: access rights, authentication, and account review.',
            body: 'Keep EHR and admin access trustworthy during phishing or suspicious account activity.',
            controls: ['mfa_enabled', 'least_privilege', 'access_review', 'admin_password_changed', 'screen_lock'],
            evidence: ['ehr_access_review'],
            risks: ['unauthorized_ehr_access'],
            objects: ['ehr_cloud', 'doctor_pc', 'reception_pc', 'network_router'],
        },
        {
            key: 'devices',
            title: 'Device hardening and ownership',
            focus: 'Annex A-inspired focus: asset management and endpoint protection.',
            body: 'Know which office devices exist, who owns them, and whether they can be trusted after loss or compromise.',
            controls: ['documented_owner', 'asset_inventory', 'disk_encryption', 'patching_current', 'screen_lock', 'least_privilege'],
            evidence: ['asset_inventory_export'],
            risks: ['lost_clinical_endpoint'],
            objects: ['reception_pc', 'doctor_pc', 'nurse_laptop', 'isms_binder'],
        },
        {
            key: 'backup',
            title: 'Backup and recovery',
            focus: 'Annex A-inspired focus: backup, recovery, and disruption readiness.',
            body: 'Prove patient and practice data can be restored when ransomware or backup failures pressure operations.',
            controls: ['backup_schedule', 'encrypted_backup', 'restore_test', 'offline_or_immutable_copy'],
            evidence: ['backup_restore_test'],
            risks: ['ransomware_recovery_failure'],
            objects: ['backup_nas', 'isms_binder'],
        },
        {
            key: 'network',
            title: 'Network and cloud services',
            focus: 'Annex A-inspired focus: network security and supplier-managed services.',
            body: 'Keep cloud-dependent workflows available while controlling routers, Wi-Fi, and supplier dependencies.',
            controls: ['admin_password_changed', 'firmware_current', 'guest_network_isolated', 'wifi_encryption', 'supplier_reviewed', 'contract_dpa', 'backup_export_plan'],
            evidence: ['supplier_review_ehr'],
            risks: ['network_misconfiguration'],
            objects: ['network_router', 'ehr_cloud'],
        },
        {
            key: 'records',
            title: 'Records and physical handling',
            focus: 'Annex A-inspired focus: physical security, records, and disposal.',
            body: 'Reduce exposure from printouts, records cabinets, disposal points, and unattended paper workflows.',
            controls: ['secure_print', 'located_supervised', 'disposal_procedure', 'physical_lock', 'retention_policy', 'access_list', 'clean_desk'],
            evidence: [],
            risks: ['exposed_printouts'],
            objects: ['printer', 'records_cabinet', 'shred_console'],
        },
        {
            key: 'response',
            title: 'Event response and improvement',
            focus: 'Annex A-inspired focus: incident response, evidence, audit, and continual improvement.',
            body: 'Use timeline events to create follow-up work, prove effectiveness, and keep operations improving.',
            controls: ['incident_procedure', 'risk_register', 'soa_prepared', 'internal_audit_plan', 'management_review_record'],
            evidence: ['incident_procedure_record', 'risk_register_review', 'statement_of_applicability', 'internal_audit_record'],
            risks: ['audit_evidence_gap'],
            objects: ['isms_binder'],
        },
    ];
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
        renderGuidanceMode();
        renderTimelineSettings();
        renderDrawerBadge();
        renderOperationsStatus();
        renderMapModeControls();
        drawOffice();
        renderIsmsPanel();
        renderAuditPanel();
        renderContextModal();
    }

    function renderHud() {
        const game = state.game;
        const categories = game.score.categories;
        els.organizationName.textContent = game.organization.organization_name;
        els.scoreOffice.textContent = `${officePerformancePercent(game.operations)}%`;
        els.scoreOverall.textContent = `${game.score.overall.percent}%`;
        els.scoreSecurity.textContent = `${categories.security.percent}%`;
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
        if (guidanceMode() === 'challenge') {
            els.guidanceSummary.textContent = 'Advisor hidden in Challenge mode';
            els.guidanceList.innerHTML = '<p class="empty-state">Guidance is hidden. Timeline events and operational status remain available.</p>';
            return;
        }

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
        const availableCount = state.game.simulation.events.filter((event) => event.status === 'available').length;
        const resolvedCount = state.game.simulation.events.filter((event) => event.status === 'resolved').length;
        els.timelineSummary.textContent = `${activeCount} active - ${availableCount} available - ${resolvedCount} resolved`;

        els.timelineList.innerHTML = items.map((item) => `
            <article class="timeline-card ${escapeAttr(item.tone)}">
                <button class="timeline-event-open" type="button" data-event-open="${escapeAttr(item.event_key)}" aria-label="Open ${escapeAttr(item.title)} details">
                    <span class="timeline-meta">${escapeHtml(item.meta)}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
                </button>
                ${item.event_key ? `
                    <div class="timeline-menu">
                        <button class="timeline-menu-toggle" type="button" data-timeline-menu="${escapeAttr(item.event_key)}" aria-haspopup="menu" aria-expanded="${state.activeTimelineMenuKey === item.event_key ? 'true' : 'false'}" aria-label="Actions for ${escapeAttr(item.title)}">⋮</button>
                        <div class="timeline-menu-popover" role="menu" ${state.activeTimelineMenuKey === item.event_key ? '' : 'hidden'}>
                            <button type="button" role="menuitem" data-timeline-action="open-event" data-event-key="${escapeAttr(item.event_key)}">Open event</button>
                            <button type="button" role="menuitem" data-timeline-action="start" data-event-key="${escapeAttr(item.event_key)}" ${item.status === 'available' && !state.busy ? '' : 'disabled'}>Start event</button>
                            <button type="button" role="menuitem" data-timeline-action="open-asset" data-object-key="${escapeAttr(item.object_key || '')}" ${item.object_key ? '' : 'disabled'}>Open asset</button>
                        </div>
                    </div>
                ` : ''}
            </article>
        `).join('');
        bindTimelineControls();
    }

    function renderTimelineSettings() {
        const settings = state.game.settings && state.game.settings.timeline;

        if (!settings) {
            els.timelineSettingsForm.hidden = true;
            return;
        }

        els.timelineSettingsForm.hidden = false;
        els.timelineSettingsForm.elements.offline_event_minutes.value = String(settings.offline_event_minutes);
        els.timelineSettingsForm.elements.max_events_per_advance.value = String(settings.max_events_per_advance);

        for (const input of els.timelineSettingsForm.querySelectorAll('input, button')) {
            input.disabled = state.busy;
        }
    }

    function renderGuidanceMode() {
        const mode = guidanceMode();
        els.guidanceModeForm.elements.mode.value = mode;
        els.drawerAdvisorTab.hidden = mode === 'challenge';

        if (mode === 'challenge' && state.activeDrawerTab === 'advisor') {
            setDrawerTab('timeline');
        }

        for (const input of els.guidanceModeForm.querySelectorAll('select')) {
            input.disabled = state.busy;
        }
    }

    function renderDrawerBadge() {
        const activeEvents = state.game.timeline.active_count;
        const openActions = state.game.simulation.corrective_actions.filter(isCorrectiveActionOpen).length;
        const priorityGuidance = guidanceMode() === 'guided'
            ? guidanceItems().filter((item) => item.tone === 'critical' || item.tone === 'warning').length
            : 0;
        const badgeCount = activeEvents + openActions + priorityGuidance;

        els.drawerBadge.hidden = badgeCount === 0;
        els.drawerBadge.textContent = String(Math.min(badgeCount, 9));
    }

    function timelineItems() {
        const items = state.game.simulation.events.map((event) => {
            const action = actionForEvent(event.event_key);
            return {
                event_key: event.event_key,
                object_key: event.object_key,
                status: event.status,
                tone: event.status,
                meta: `${event.status}${action ? ` - action ${action.status}` : ''}`,
                title: event.title,
                body: event.status === 'available'
                    ? event.description
                    : event.impact_summary || event.lesson_text,
            };
        });

        if (items.length === 0) {
            items.push({
                event_key: '',
                tone: 'empty',
                meta: 'Timeline',
                title: 'No events yet',
                body: 'Simulation events will appear here as the office timeline becomes more active.',
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

        const status = operationalStatusLabel(operations.status);
        els.operationsStatusTitle.textContent = 'Office Operations';
        els.operationsStatusBadge.textContent = operationalStatusLabel(operations.status);
        els.operationsStatusBadge.className = `status-badge ${statusClass(operations.status)}`;
        els.operationsToggle.setAttribute('aria-expanded', state.operationsExpanded ? 'true' : 'false');
        els.operationsToggle.setAttribute(
            'aria-label',
            `${state.operationsExpanded ? 'Collapse' : 'Expand'} Office Operations details. Current status: ${status}.`
        );
        els.operationsDetails.hidden = !state.operationsExpanded;
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
                title: 'Prove the office controls',
                body: `${missingEvidence.length} evidence records are missing or still draft. Open Controls and start with ${missingEvidence[0].title}.`,
                action: 'open-evidence',
                buttonText: 'Controls',
                buttonLabel: 'Open office IT controls',
            });
        }

        const untreatedRisks = state.game.isms.risks.filter(isRiskUntreated);
        if (untreatedRisks.length > 0) {
            items.push({
                tone: 'warning',
                title: 'Decide control risks',
                body: `${untreatedRisks.length} office IT risks still need assessment, treatment, or acceptance decisions.`,
                action: 'open-risks',
                buttonText: 'Controls',
                buttonLabel: 'Open office IT controls',
            });
        }

        const openActions = state.game.simulation.corrective_actions.filter(isCorrectiveActionOpen);
        if (openActions.length > 0) {
            items.push({
                tone: 'warning',
                title: 'Close event follow-up',
                body: `${openActions.length} follow-up items still need completion or effectiveness checks.`,
                action: 'open-actions',
                buttonText: 'Follow-up',
                buttonLabel: 'Open event follow-up',
            });
        }

        const activeEvent = state.game.simulation.events.find((event) => event.status === 'active');
        const availableEvent = state.game.simulation.events.find((event) => event.status === 'available');
        if (activeEvent) {
            items.push({
                tone: 'warning',
                title: 'Resolve active event',
                body: `${activeEvent.title} is active. Finish evidence and action checks before resolving it.`,
                action: 'open-event',
                target: activeEvent.event_key,
                buttonText: 'Event',
                buttonLabel: 'Open active event',
            });
        } else if (availableEvent) {
            items.push({
                tone: 'ready',
                title: 'Start a timeline event',
                body: `${availableEvent.title} can turn current gaps into corrective-action practice.`,
                action: 'open-event',
                target: availableEvent.event_key,
                buttonText: 'Event',
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
                    : 'Use office findings, control evidence, risk decisions, and event follow-up to improve readiness.',
                action: auditReady ? 'open-audit' : 'open-event',
                target: availableEvent ? availableEvent.event_key : '',
                buttonText: auditReady ? 'Audit' : 'Event',
                buttonLabel: auditReady ? 'Open audit' : 'Open simulation event',
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

    function renderContextModal() {
        if (!state.contextModalOpen) {
            els.contextModal.hidden = true;
            return;
        }

        if (state.contextModalType === 'event') {
            renderEventModal();
            return;
        }

        if (state.contextModalType === 'help') {
            renderHelpModal();
            return;
        }

        const object = selectedObject();

        if (!object) {
            closeContextModal();
            return;
        }

        els.contextModal.hidden = false;
        els.contextModalKicker.textContent = typeLabel(object.object_type);
        els.contextModalTitle.textContent = object.display_name;

        if (state.contextModalMode === 'configure') {
            renderDeviceConfiguration(object);
        } else {
            renderDeviceProfile(object);
        }
    }

    function renderDeviceProfile(object) {
        const findings = findingsForObject(object.object_key);
        const risks = linkedItems(state.game.isms.risks, object.object_key);
        const evidence = linkedItems(state.game.isms.evidence, object.object_key);
        const actions = linkedItems(state.game.simulation.corrective_actions, object.object_key);
        const activeEvents = state.game.simulation.events.filter((event) => event.object_key === object.object_key && event.status === 'active');
        const enabledControls = object.controls.filter((control) => control.enabled).length;

        els.contextModalBody.innerHTML = `
            <div class="asset-header">
                <div>
                    <p class="asset-type">${escapeHtml(typeLabel(object.object_type))}</p>
                    <p class="control-description">${escapeHtml(object.display_name)} is linked to technical controls, evidence, risk decisions, and event follow-up.</p>
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
            ${linkedSection('Event follow-up', actions.map((action) => ({
                title: action.title,
                meta: `${action.status} - ${action.verification_status}`,
            })))}
            ${linkedSection('Active events', activeEvents.map((event) => ({
                title: event.title,
                meta: `${event.severity} - ${event.operational_context || event.impact_summary || event.lesson_text}`,
            })))}
        `;

        els.contextModalActions.innerHTML = `
            <button type="button" data-context-modal-mode="configure">Configure</button>
            <button class="secondary" type="button" data-context-modal-close>Close</button>
        `;
        bindContextModalActions();
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

        els.contextModalBody.innerHTML = `
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

        els.contextModalActions.innerHTML = `
            <button class="secondary" type="button" data-context-modal-mode="profile">Back to profile</button>
            <button type="button" data-context-modal-close>Done</button>
        `;

        for (const checkbox of els.contextModalBody.querySelectorAll('[data-control]')) {
            checkbox.addEventListener('change', () => {
                updateControl(object.object_key, checkbox.dataset.control, checkbox.checked);
            });
        }

        bindContextModalActions();
    }

    function renderEventModal() {
        const event = eventByKey(state.activeEventKey);

        if (!event) {
            closeContextModal();
            return;
        }

        const linkedAction = actionForEvent(event.event_key);
        const affectedObject = state.game.map.objects.find((object) => object.object_key === event.object_key);
        const metrics = event.impact || {};

        els.contextModal.hidden = false;
        els.contextModalKicker.textContent = 'Timeline event';
        els.contextModalTitle.textContent = event.title;
        els.contextModalBody.innerHTML = `
            <div class="asset-header">
                <div>
                    <p class="asset-type">${escapeHtml(event.status)} - ${escapeHtml(event.severity)}</p>
                    <p class="control-description">${escapeHtml(event.description)}</p>
                </div>
                <span class="status-badge ${escapeAttr(statusClass(event.status))}">${escapeHtml(event.status)}</span>
            </div>
            <div class="profile-grid">
                <div class="profile-metric"><span>Affected asset</span><strong>${escapeHtml(affectedObject ? affectedObject.display_name : shortObjectName(event.object_key))}</strong></div>
                <div class="profile-metric"><span>Data loss</span><strong>${Number(metrics.data_availability_loss || 0)}%</strong></div>
                <div class="profile-metric"><span>Delay</span><strong>${Number(metrics.patient_delay_minutes || 0)}m</strong></div>
            </div>
            <section>
                <h3>Operational context</h3>
                <p class="control-description">${escapeHtml(event.operational_context || event.impact_summary || event.lesson_text)}</p>
            </section>
            <section>
                <h3>What happens</h3>
                <p class="control-description">${escapeHtml(event.status === 'available' ? event.trigger_text : event.lesson_text)}</p>
                ${event.impact_summary ? `<p class="artifact-meta">${escapeHtml(event.impact_summary)}</p>` : ''}
            </section>
            ${linkedSection('Required controls', (event.required_controls || []).map((key) => ({
                title: controlLabel(key),
                meta: controlImplemented(key) ? 'Implemented' : 'Missing or incomplete',
            })))}
            ${linkedSection('Required evidence', (event.required_evidence || []).map((key) => {
                const evidence = state.game.isms.evidence.find((item) => item.evidence_key === key);
                return {
                    title: evidence ? evidence.title : key,
                    meta: evidence ? `${evidence.status} - ${evidence.owner}` : 'Not in evidence checklist',
                };
            }))}
            ${linkedAction ? linkedSection('Linked follow-up', [{
                title: linkedAction.title,
                meta: `${linkedAction.status} - ${linkedAction.verification_status}`,
            }]) : ''}
        `;

        const actionButton = linkedAction
            ? `<button type="button" data-event-action="open-action" data-event-key="${escapeAttr(event.event_key)}">Open follow-up</button>`
            : '';
        const eventButton = event.status === 'available'
            ? `<button type="button" data-event-action="start" data-event-key="${escapeAttr(event.event_key)}" ${state.busy ? 'disabled' : ''}>Start event</button>`
            : event.status === 'active'
                ? `<button type="button" data-event-action="resolve" data-event-key="${escapeAttr(event.event_key)}" ${state.busy ? 'disabled' : ''}>Resolve</button>`
                : '';

        els.contextModalActions.innerHTML = `
            ${eventButton}
            ${actionButton}
            ${affectedObject ? `<button class="secondary" type="button" data-open-asset="${escapeAttr(affectedObject.object_key)}">Open asset</button>` : ''}
            <button class="secondary" type="button" data-context-modal-close>Close</button>
        `;
        bindContextModalActions();
    }

    function renderHelpModal() {
        const tabs = [
            ['game', 'Goal'],
            ['flow', 'How it works'],
            ['example', 'Example'],
            ['views', 'Views'],
        ];
        const activeTab = tabs.some(([key]) => key === state.activeHelpTab) ? state.activeHelpTab : 'game';
        state.activeHelpTab = activeTab;

        els.contextModal.hidden = false;
        els.contextModalKicker.textContent = 'Help';
        els.contextModalTitle.textContent = 'Game Guide';
        els.contextModalBody.innerHTML = `
            <div class="help-tabs" role="tablist" aria-label="Help topics">
                ${tabs.map(([key, label]) => `
                    <button type="button" role="tab" data-help-tab="${escapeAttr(key)}" aria-selected="${activeTab === key ? 'true' : 'false'}" class="${activeTab === key ? 'active' : ''}">${escapeHtml(label)}</button>
                `).join('')}
            </div>
            <div class="help-content">
                ${helpContent(activeTab)}
            </div>
        `;
        els.contextModalActions.innerHTML = '<button type="button" data-context-modal-close>Close</button>';
        bindContextModalActions();
    }

    function helpContent(tab) {
        if (tab === 'flow') {
            return `
                <section class="help-section">
                    <h3>How the game works</h3>
                    <ol class="help-list">
                        <li><strong>Office Performance is the target:</strong> The Office KPI and Office Operations band show whether the practice can still treat patients, reach the EHR, access data, and avoid closure risk.</li>
                        <li><strong>Office Map is the hands-on layer:</strong> Click visible devices, inspect their profile, and configure controls only when the office could realistically demonstrate they are implemented.</li>
                        <li><strong>Timeline events apply pressure:</strong> Events such as phishing, ransomware, lost devices, network outage, and backup failure expose weak controls through operational consequences.</li>
                        <li><strong>Office IT Controls explain the ISMS work:</strong> The Controls accordions group selected Annex A-inspired themes and connect device controls, evidence, risk decisions, and event follow-up.</li>
                        <li><strong>Follow-up closes the loop:</strong> Event response work must be completed and verified as effective before related active events can be resolved.</li>
                        <li><strong>Audit is feedback:</strong> The audit samples the current setup, event history, evidence, risk decisions, and follow-up to show the next improvement target.</li>
                    </ol>
                </section>
            `;
        }

        if (tab === 'example') {
            return `
                <section class="help-section">
                    <h3>End-to-end example</h3>
                    <ol class="help-list">
                        <li>Start in the Office view and check the Office KPI plus the collapsed Office Operations status badge.</li>
                        <li>Expand Office Operations if the status is not nominal, then inspect the affected device or a critical device such as Cloud EHR, Backup NAS, Reception PC, or Network Router.</li>
                        <li>Open the device profile from the Office Map and configure relevant controls, such as MFA, restore testing, patching, least privilege, or guest network isolation.</li>
                        <li>Open ISMS, choose Controls, and expand the matching focus group to see how device controls connect to evidence, risk decisions, and follow-up.</li>
                        <li>Use Devices when ownership or asset status is the problem, and use Follow-up when a Timeline event created response work.</li>
                        <li>Open or start a Timeline event, review its operational context, required controls, and required evidence, then complete and verify the linked follow-up.</li>
                        <li>Resolve the event after the follow-up is effective and confirm Office Performance and Office Operations recover.</li>
                        <li>Run an Audit to get structured feedback on the remaining gaps and choose the next weak point to improve.</li>
                    </ol>
                </section>
            `;
        }

        if (tab === 'views') {
            return `
                <section class="help-section">
                    <h3>Views and controls</h3>
                    <div class="help-grid">
                        <article><h4>Top KPIs</h4><p>Office is the main performance target. Readiness, Security, Resilience, and Audit are supporting diagnostics that explain why performance may be fragile.</p></article>
                        <article><h4>Office Operations</h4><p>The persistent accordion below the navigation. Collapsed, it shows the current operations badge; expanded, it shows capacity, EHR availability, data availability, delay, exposure, closure risk, and active impact rows.</p></article>
                        <article><h4>Office Map</h4><p>The primary work surface. Click visible office devices to inspect findings, controls, linked support, and active event context.</p></article>
                        <article><h4>Map overlays</h4><p>Overview shows the office layout. Readiness, Evidence, Risk, and Audit overlays show different concerns directly on the map.</p></article>
                        <article><h4>Timeline</h4><p>Shows simulation events. Open an event for details, or use the three-dot menu to start an event or jump to the affected asset.</p></article>
                        <article><h4>Advisor</h4><p>Suggests next useful actions in Guided and Standard modes. Challenge mode hides Advisor hints while leaving Timeline available.</p></article>
                        <article><h4>Settings</h4><p>Lets admin users tune Timeline pacing and lets each player choose Guided, Standard, or Challenge mode.</p></article>
                        <article><h4>Office IT Controls</h4><p>The information-security officer surface. It narrows ISO 27001 Annex A thinking to selected controls that support office IT operations.</p></article>
                        <article><h4>Controls</h4><p>Shows full-width accordion groups. Each collapsed group summarizes an office IT control theme, then expands to device controls, evidence, risk decisions, and follow-up.</p></article>
                        <article><h4>Devices</h4><p>Records owners, classification, criticality, and verification status for the assets used in the simulation.</p></article>
                        <article><h4>Follow-up</h4><p>Tracks event response work. Follow-up must be completed and verified as effective before related events can be resolved.</p></article>
                        <article><h4>Audit prep</h4><p>Shows the review gate: control evidence, risk decisions, readiness, and certification check.</p></article>
                        <article><h4>Audit</h4><p>Runs a simulated audit report. Use it as feedback, not as the only goal: audit findings tell you how to improve office resilience.</p></article>
                    </div>
                </section>
            `;
        }

        return `
            <section class="help-section">
                <h3>Goal</h3>
                <p>ISMS Office is a small office IT-resilience simulation. You are responsible for keeping a physician practice functioning while security and operational events threaten the setup.</p>
                <p>The goal is to maintain Office Performance, not merely to pass an audit. Selected ISO 27001 Annex A-inspired controls, evidence, risk decisions, follow-up, and audits are the professional tools you use to keep the office working.</p>
                <h3>What counts as progress</h3>
                <ul class="help-list">
                    <li>Office Performance stays high even when Timeline events occur.</li>
                    <li>Critical office IT devices have realistic controls configured.</li>
                    <li>Controls have supporting evidence and risk decisions where the simulation asks for them.</li>
                    <li>Event follow-up is completed and verified as effective.</li>
                    <li>Audits produce fewer and less severe findings over time.</li>
                </ul>
                <h3>First five minutes</h3>
                <p>Start with Office Operations and the Office Map. Inspect a critical device, configure real controls, expand the matching ISMS Controls group, then open a Timeline event to see how the office reacts. Keep improving until Office Performance stays stable even under pressure.</p>
            </section>
        `;
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

    function bindContextModalActions() {
        for (const button of els.contextModalBody.querySelectorAll('[data-help-tab]')) {
            button.addEventListener('click', () => {
                state.activeHelpTab = button.dataset.helpTab;
                renderHelpModal();
            });
        }

        for (const button of els.contextModalActions.querySelectorAll('[data-context-modal-mode]')) {
            button.addEventListener('click', () => {
                state.contextModalMode = button.dataset.contextModalMode;
                renderContextModal();
            });
        }

        for (const button of els.contextModalActions.querySelectorAll('[data-event-action]')) {
            button.addEventListener('click', () => {
                updateEvent(button.dataset.eventAction, button.dataset.eventKey);
            });
        }

        for (const button of els.contextModalActions.querySelectorAll('[data-open-asset]')) {
            button.addEventListener('click', () => {
                openTimelineAsset(button.dataset.openAsset);
            });
        }

        for (const button of els.contextModalActions.querySelectorAll('[data-context-modal-close]')) {
            button.addEventListener('click', closeContextModal);
        }
    }

    function openDeviceModal(objectKey, mode = 'profile') {
        state.selectedKey = objectKey;
        state.contextModalType = 'device';
        state.contextModalMode = mode;
        state.contextModalOpen = true;
        state.activeEventKey = null;
        render();
    }

    function openEventModal(eventKey) {
        if (!eventKey) {
            openDrawer('timeline');
            return;
        }

        state.activeEventKey = eventKey;
        state.contextModalType = 'event';
        state.contextModalMode = 'profile';
        state.contextModalOpen = true;
        render();
    }

    function openHelpModal() {
        state.contextModalType = 'help';
        state.contextModalMode = 'profile';
        state.contextModalOpen = true;
        state.activeEventKey = null;
        render();
    }

    function openTimelineAsset(objectKey) {
        if (!objectKey) {
            return;
        }

        closeDrawer();
        setPrimaryTab('office');
        openDeviceModal(objectKey, 'profile');
    }

    function closeContextModal() {
        state.contextModalOpen = false;
        state.activeEventKey = null;
        els.contextModal.hidden = true;
    }

    function findingsForObject(objectKey) {
        return state.game.findings.filter((finding) => finding.object_key === objectKey);
    }

    function linkedItems(items, objectKey) {
        return items.filter((item) => item.object_key === objectKey);
    }

    function renderIsmsPanel() {
        const artifacts = state.game.isms;
        const openActions = state.game.simulation.corrective_actions.filter(isCorrectiveActionOpen).length;
        const groupsReady = officeControlGroups.filter((group) => controlGroupReadiness(group).percent >= 80).length;
        const validTabs = ['controls', 'devices', 'followup'];

        if (!validTabs.includes(state.activeIsmsTab)) {
            state.activeIsmsTab = 'controls';
        }

        els.ismsScoreSummary.textContent = `Selected Annex A practice for office IT - ${groupsReady}/${officeControlGroups.length} control groups stable - ${openActions} follow-up open`;

        for (const button of els.ismsTabs.querySelectorAll('[data-isms-tab]')) {
            button.classList.toggle('active', button.dataset.ismsTab === state.activeIsmsTab);
        }

        els.ismsBody.className = `isms-body ${state.activeIsmsTab === 'controls' ? 'control-groups' : ''}`;

        if (state.activeIsmsTab === 'controls') {
            els.ismsBody.innerHTML = renderControlWorkspace();
        } else if (state.activeIsmsTab === 'devices') {
            els.ismsBody.innerHTML = `
                ${renderIsmsOverview('Device register', 'Keep the supporting office IT inventory small and useful: owner, criticality, and verification status for each asset that appears in the simulation.')}
                ${artifacts.assets.map(renderAssetArtifact).join('')}
            `;
        } else {
            const actions = state.game.simulation.corrective_actions;
            els.ismsBody.innerHTML = `
                ${renderIsmsOverview('Event follow-up', 'Timeline events create follow-up items. Complete the work and verify effectiveness before resolving the related event.')}
                ${actions.length
                    ? actions.map(renderCorrectiveActionCard).join('')
                    : '<p class="empty-state">No event follow-up has been opened.</p>'}
            `;
        }

        bindIsmsControls();
        bindControlGroupToggles();
        bindCorrectiveActionControls(els.ismsBody);
    }

    function renderIsmsOverview(title, body) {
        return `
            <section class="isms-overview wide">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(body)}</p>
            </section>
        `;
    }

    function renderControlWorkspace() {
        return `
            ${renderIsmsOverview(
                'Office IT control focus',
                'This is not a full ISO 27001 catalogue. It narrows the simulation to selected Annex A-inspired controls that improve office IT resilience, make timeline events easier to handle, and give auditors usable evidence.'
            )}
            ${officeControlGroups.map(renderControlGroup).join('')}
        `;
    }

    function renderControlGroup(group) {
        const readiness = controlGroupReadiness(group);
        const controlRows = controlRowsForGroup(group);
        const evidence = evidenceForGroup(group);
        const risks = risksForGroup(group);
        const actions = actionsForGroup(group);
        const readyEvidence = evidence.filter((item) => !isEvidenceIncomplete(item)).length;
        const treatedRisks = risks.filter((item) => !isRiskUntreated(item)).length;
        const isExpanded = state.expandedControlGroups[group.key] === true;
        const detailsId = `control-group-details-${group.key}`;

        return `
            <article class="control-group-card ${isExpanded ? 'expanded' : ''}">
                <header class="control-group-header">
                    <span class="control-group-summary">
                        <span class="control-group-focus">${escapeHtml(group.focus)}</span>
                        <h3>${escapeHtml(group.title)}</h3>
                        <p>${escapeHtml(group.body)}</p>
                    </span>
                    <span class="status-badge ${escapeAttr(scoreStatusClass(readiness.percent))}">${readiness.percent}%</span>
                    <button class="control-group-toggle" type="button" data-control-group-toggle="${escapeAttr(group.key)}" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="${escapeAttr(detailsId)}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${escapeAttr(group.title)}">
                        <span class="control-group-chevron" aria-hidden="true">${isExpanded ? '-' : '+'}</span>
                    </button>
                </header>
                <div id="${escapeAttr(detailsId)}" class="control-group-details" ${isExpanded ? '' : 'hidden'}>
                    <div class="control-group-metrics">
                        <div><span>Controls</span><strong>${readiness.implemented}/${readiness.total}</strong></div>
                        <div><span>Evidence</span><strong>${countLabel(readyEvidence, evidence.length)}</strong></div>
                        <div><span>Risks</span><strong>${countLabel(treatedRisks, risks.length)}</strong></div>
                        <div><span>Follow-up</span><strong>${actions.filter(isCorrectiveActionOpen).length}</strong></div>
                    </div>
                    <section class="control-support-section">
                        <h4>Office controls</h4>
                        <div class="annex-control-list">
                            ${controlRows.map(renderControlStatusRow).join('')}
                        </div>
                    </section>
                    <section class="control-support-section">
                        <h4>Evidence that proves the controls</h4>
                        ${evidence.length
                            ? evidence.map(renderControlEvidenceItem).join('')
                            : '<p class="empty-state">No separate evidence item is modeled for this group yet.</p>'}
                    </section>
                    <section class="control-support-section">
                        <h4>Risk decisions</h4>
                        ${risks.length
                            ? risks.map(renderControlRiskItem).join('')
                            : '<p class="empty-state">No separate risk row is modeled for this group yet.</p>'}
                    </section>
                    ${actions.length ? `
                        <section class="control-support-section">
                            <h4>Event follow-up linked to this group</h4>
                            <div class="control-action-list">
                                ${actions.map((action) => `
                                    <article class="support-item compact">
                                        <strong>${escapeHtml(action.title)}</strong>
                                        <span>${escapeHtml(statusLabel(action.status))} - ${escapeHtml(shortObjectName(action.object_key))}</span>
                                    </article>
                                `).join('')}
                            </div>
                        </section>
                    ` : ''}
                </div>
            </article>
        `;
    }

    function controlRowsForGroup(group) {
        return group.controls.map((controlKey) => {
            const instances = state.game.map.objects.flatMap((object) => object.controls
                .filter((control) => control.key === controlKey)
                .map((control) => ({
                    ...control,
                    objectName: object.display_name,
                    objectKey: object.object_key,
                })));

            return {
                key: controlKey,
                label: instances[0] ? instances[0].label : controlLabel(controlKey),
                description: instances[0] ? instances[0].description : '',
                enabled: instances.filter((control) => control.enabled).length,
                total: instances.length,
                objects: instances.map((control) => control.objectName),
            };
        }).filter((row) => row.total > 0);
    }

    function controlGroupReadiness(group) {
        const rows = controlRowsForGroup(group);
        const implemented = rows.reduce((sum, row) => sum + row.enabled, 0);
        const total = rows.reduce((sum, row) => sum + row.total, 0);

        return {
            implemented,
            total,
            percent: total > 0 ? Math.round((implemented / total) * 100) : 100,
        };
    }

    function evidenceForGroup(group) {
        return state.game.isms.evidence.filter((item) => group.evidence.includes(item.evidence_key));
    }

    function risksForGroup(group) {
        return state.game.isms.risks.filter((item) => group.risks.includes(item.risk_key));
    }

    function actionsForGroup(group) {
        return state.game.simulation.corrective_actions.filter((action) => group.objects.includes(action.object_key));
    }

    function renderControlStatusRow(row) {
        return `
            <article class="annex-control-row ${row.enabled === row.total ? 'ready' : 'open'}">
                <div>
                    <strong>${escapeHtml(row.label)}</strong>
                    <span>${escapeHtml(row.description)}</span>
                    <small>${escapeHtml(row.objects.join(', '))}</small>
                </div>
                <span>${row.enabled}/${row.total}</span>
            </article>
        `;
    }

    function renderControlEvidenceItem(evidence) {
        return `
            <article class="support-item">
                <header>
                    <div>
                        <strong>${escapeHtml(evidence.title)}</strong>
                        <span>${escapeHtml(typeLabel(evidence.evidence_type))} - ${escapeHtml(shortObjectName(evidence.object_key))}</span>
                    </div>
                    <span class="status-badge ${escapeAttr(statusClass(evidence.status))}">${escapeHtml(statusLabel(evidence.status))}</span>
                </header>
                <p class="control-description">${escapeHtml(evidence.expected_evidence)}</p>
                <div class="artifact-grid">
                    ${selectControl('evidence', evidence.evidence_key, 'status', evidence.status, [
                        ['missing', 'Missing'],
                        ['draft', 'Draft'],
                        ['ready', 'Ready'],
                        ['reviewed', 'Reviewed'],
                    ])}
                    ${textInputControl('evidence', evidence.evidence_key, 'owner', evidence.owner, 'Owner')}
                    ${textareaControl('evidence', evidence.evidence_key, 'notes', evidence.notes, 'Notes', 'wide')}
                </div>
            </article>
        `;
    }

    function renderControlRiskItem(risk) {
        return `
            <article class="support-item">
                <header>
                    <div>
                        <strong>${escapeHtml(risk.title)}</strong>
                        <span>Inherent score ${risk.inherent_score} - ${escapeHtml(shortObjectName(risk.object_key))}</span>
                    </div>
                    <span class="status-badge ${escapeAttr(statusClass(risk.treatment_status))}">${escapeHtml(statusLabel(risk.treatment_status))}</span>
                </header>
                <div class="artifact-grid">
                    ${selectControl('risk', risk.risk_key, 'treatment_status', risk.treatment_status, [
                        ['identified', 'Identified'],
                        ['assessed', 'Assessed'],
                        ['treated', 'Treated'],
                        ['accepted', 'Accepted'],
                    ], 'wide')}
                    ${textInputControl('risk', risk.risk_key, 'owner', risk.owner, 'Owner')}
                    ${textareaControl('risk', risk.risk_key, 'treatment_summary', risk.treatment_summary, 'Treatment summary', 'wide')}
                </div>
            </article>
        `;
    }

    function scoreStatusClass(percent) {
        if (percent >= 80) {
            return 'ready';
        }

        if (percent >= 40) {
            return 'partial';
        }

        return 'needs_attention';
    }

    function countLabel(done, total) {
        return total > 0 ? `${done}/${total}` : 'n/a';
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

    function bindControlGroupToggles() {
        for (const button of els.ismsBody.querySelectorAll('[data-control-group-toggle]')) {
            button.addEventListener('click', () => {
                const groupKey = button.dataset.controlGroupToggle;
                state.expandedControlGroups[groupKey] = state.expandedControlGroups[groupKey] !== true;
                renderIsmsPanel();
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

    async function updateTimelineSettings() {
        if (state.busy || !state.game.settings || !state.game.settings.timeline) {
            return;
        }

        state.busy = true;
        renderTimelineSettings();

        try {
            const payload = await api('update-timeline-settings', {
                method: 'POST',
                body: {
                    settings: {
                        offline_event_minutes: els.timelineSettingsForm.elements.offline_event_minutes.value,
                        max_events_per_advance: els.timelineSettingsForm.elements.max_events_per_advance.value,
                    },
                },
            });
            state.game = payload.game_state;
            showToast('Timeline settings updated.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    async function updateGuidanceMode(mode) {
        if (state.busy) {
            return;
        }

        state.busy = true;
        renderGuidanceMode();

        try {
            const payload = await api('update-guidance-mode', {
                method: 'POST',
                body: {
                    mode,
                },
            });
            state.game = payload.game_state;
            showToast('Guidance mode updated.');
        } catch (error) {
            showToast(error.message);
        } finally {
            state.busy = false;
            render();
        }
    }

    function setDrawerTab(tabKey) {
        const advisorAllowed = guidanceMode() !== 'challenge';
        if (tabKey === 'advisor' && !advisorAllowed) {
            state.activeDrawerTab = 'timeline';
        } else if (['timeline', 'advisor', 'settings'].includes(tabKey)) {
            state.activeDrawerTab = tabKey;
        } else {
            state.activeDrawerTab = 'timeline';
        }

        const titles = {
            timeline: 'Timeline',
            advisor: 'Advisor',
            settings: 'Settings',
        };
        els.drawerTitle.textContent = titles[state.activeDrawerTab] || 'Timeline';

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
        const openActions = state.game.simulation.corrective_actions.filter(isCorrectiveActionOpen).length;
        const hasAuditReport = Boolean(report);
        const evidenceReady = scores.evidence.percent >= 80 && evidenceIncomplete === 0;
        const risksReady = scores.risks.percent >= 80 && untreatedRisks === 0;
        const readinessReady = state.game.score.overall.percent >= 85 && openActions === 0;
        const auditPassed = hasAuditReport && report.status !== 'not_ready' && report.major_findings === 0;

        return markCurrentStep([
            {
                title: 'Control evidence',
                detail: evidenceReady
                    ? 'Control evidence is audit-ready.'
                    : `${evidenceIncomplete} evidence items still need ready or reviewed status.`,
                done: evidenceReady,
            },
            {
                title: 'Risk decisions',
                detail: risksReady
                    ? 'Risk decisions are ready for auditor review.'
                    : `${untreatedRisks} risks still need treatment or acceptance.`,
                done: risksReady,
            },
            {
                title: 'Readiness gate',
                detail: readinessReady
                    ? `${state.game.score.overall.percent}% readiness with event follow-up closed.`
                    : `${state.game.score.overall.percent}% readiness and ${openActions} open follow-up items.`,
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

    function actionForEvent(eventKey) {
        return state.game.simulation.corrective_actions.find((action) => action.source_type === 'event' && action.source_key === eventKey) || null;
    }

    function renderCorrectiveActionCard(action) {
        return `
            <article class="event-card" data-action-card="${escapeAttr(action.action_key)}">
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

    function bindTimelineControls() {
        for (const button of els.timelineList.querySelectorAll('[data-event-open]')) {
            button.addEventListener('click', () => {
                state.activeTimelineMenuKey = null;
                openEventModal(button.dataset.eventOpen);
            });
        }

        for (const button of els.timelineList.querySelectorAll('[data-timeline-menu]')) {
            button.addEventListener('click', () => {
                state.activeTimelineMenuKey = state.activeTimelineMenuKey === button.dataset.timelineMenu
                    ? null
                    : button.dataset.timelineMenu;
                renderTimeline();
            });
        }

        for (const button of els.timelineList.querySelectorAll('[data-timeline-action]')) {
            button.addEventListener('click', () => {
                state.activeTimelineMenuKey = null;

                if (button.dataset.timelineAction === 'open-event') {
                    openEventModal(button.dataset.eventKey);
                    return;
                }

                if (button.dataset.timelineAction === 'open-asset') {
                    openTimelineAsset(button.dataset.objectKey);
                    return;
                }

                updateEvent('start', button.dataset.eventKey);
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

    async function updateEvent(action, eventKey) {
        if (action === 'open-action') {
            closeContextModal();
            openCorrectiveActions(eventKey);
            return;
        }

        if (state.busy) {
            return;
        }

        state.busy = true;

        try {
            const endpoint = action === 'resolve' ? 'resolve-event' : 'start-event';
            const payload = await api(endpoint, {
                method: 'POST',
                body: {
                    event_key: eventKey,
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
            showToast('Follow-up updated.');
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

    function openCorrectiveActions(eventKey = '') {
        closeDrawer();
        closeContextModal();
        state.activeIsmsTab = 'followup';
        setPrimaryTab('isms');
        renderIsmsPanel();

        if (eventKey) {
            const action = actionForEvent(eventKey);
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
            state.activeIsmsTab = 'controls';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-risks') {
            closeDrawer();
            state.activeIsmsTab = 'controls';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-inventory') {
            closeDrawer();
            state.activeIsmsTab = 'devices';
            setPrimaryTab('isms');
            renderIsmsPanel();
            return;
        }

        if (action === 'open-actions') {
            openCorrectiveActions();
            return;
        }

        if (action === 'open-event') {
            closeDrawer();
            setPrimaryTab('office');
            openEventModal(target || (state.game.simulation.events[0] && state.game.simulation.events[0].event_key) || '');
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

    function eventByKey(eventKey) {
        if (!state.game || !eventKey) {
            return null;
        }

        return state.game.simulation.events.find((event) => event.event_key === eventKey) || null;
    }

    function officePerformancePercent(operations) {
        return Math.max(0, Math.min(100, Math.min(
            Number(operations.clinical_capacity_percent ?? 100),
            Number(operations.ehr_availability_percent ?? 100),
            Number(operations.data_availability_percent ?? 100),
            100 - Number(operations.closure_risk_percent ?? 0),
        )));
    }

    function controlLabel(controlKey) {
        for (const object of state.game.map.objects) {
            const control = object.controls.find((item) => item.key === controlKey);

            if (control) {
                return control.label;
            }
        }

        return controlKey;
    }

    function controlImplemented(controlKey) {
        return state.game.map.objects.some((object) => object.controls.some((control) => control.key === controlKey && control.enabled));
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
            reviewed: 'Reviewed',
            missing: 'Missing',
            draft: 'Draft',
            identified: 'Identified',
            assessed: 'Assessed',
            treated: 'Treated',
            accepted: 'Accepted',
            open: 'Open',
            in_progress: 'In progress',
            done: 'Done',
            verified: 'Verified',
            not_checked: 'Not checked',
            effective: 'Effective',
            ineffective: 'Ineffective',
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
            reviewed: 'ready',
            ready: 'ready',
            treated: 'ready',
            accepted: 'ready',
            passed: 'ready',
            missing: 'needs_attention',
            closure_risk: 'needs_attention',
            disrupted: 'needs_attention',
            active: 'needs_attention',
            open: 'needs_attention',
            major_findings: 'needs_attention',
            watch: 'partial',
            draft: 'partial',
            identified: 'partial',
            assessed: 'partial',
            available: 'partial',
            in_progress: 'partial',
            done: 'partial',
            minor_findings: 'partial',
        }[value] || 'partial';
    }

    function guidanceMode() {
        return state.game && state.game.settings && state.game.settings.guidance_mode
            ? state.game.settings.guidance_mode
            : 'guided';
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

    els.helpToggle.addEventListener('click', openHelpModal);

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

    els.guidanceModeForm.addEventListener('change', () => {
        updateGuidanceMode(els.guidanceModeForm.elements.mode.value);
    });

    els.timelineSettingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        updateTimelineSettings();
    });

    els.primaryTabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-primary-tab]');

        if (!button) {
            return;
        }

        setPrimaryTab(button.dataset.primaryTab);
    });

    els.operationsToggle.addEventListener('click', () => {
        state.operationsExpanded = !state.operationsExpanded;
        renderOperationsStatus();
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

    els.contextModalClose.addEventListener('click', closeContextModal);

    els.contextModal.addEventListener('click', (event) => {
        if (event.target === els.contextModal) {
            closeContextModal();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && state.contextModalOpen) {
            closeContextModal();
            return;
        }

        if (event.key === 'Escape' && state.drawerOpen) {
            closeDrawer();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    bootstrap();
})();
