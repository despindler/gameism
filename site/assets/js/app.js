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
        logout: document.getElementById('logout'),
        canvas: document.getElementById('office-canvas'),
        assetDetails: document.getElementById('asset-details'),
        findingsList: document.getElementById('findings-list'),
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
                <div class="finding-meta">${escapeHtml(finding.object_name)} · ${escapeHtml(finding.severity)}</div>
            </article>
        `).join('');
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
                            <div class="finding-meta">${escapeHtml(finding.object_name)} · ${escapeHtml(finding.recommendation)}</div>
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
        }[value] || value;
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

