<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="app-version" content="<?= $version ?>">
    <title>ISMS Office</title>
    <link rel="stylesheet" href="assets/css/app.css?v=<?= $version ?>">
</head>
<body>
    <main id="auth-view" class="auth-shell" hidden>
        <section id="auth-panel" class="auth-panel" aria-label="Sign in">
            <div>
                <p class="eyebrow">ISMS Office</p>
                <h1>Physician Practice Simulation</h1>
            </div>

            <form id="login-form" class="auth-form">
                <label>
                    Username
                    <input name="username" autocomplete="username" required>
                </label>
                <label>
                    Password
                    <input name="password" type="password" autocomplete="current-password" required minlength="8">
                </label>
                <button type="submit">Sign in</button>
                <p class="auth-switch">
                    <span>New here?</span>
                    <button id="show-register" class="link-button" type="button">Create Account</button>
                </p>
            </form>

            <form id="register-form" class="auth-form" hidden>
                <label>
                    Display name
                    <input name="display_name" autocomplete="name">
                </label>
                <label>
                    Username
                    <input name="username" autocomplete="username" required>
                </label>
                <label>
                    Password
                    <input name="password" type="password" autocomplete="new-password" required minlength="8">
                </label>
                <button type="submit">Create Account</button>
                <p class="auth-switch">
                    <span>Already have an account?</span>
                    <button id="show-login" class="link-button" type="button">Sign in</button>
                </p>
            </form>

            <p id="auth-message" class="message" role="alert"></p>
        </section>
    </main>

    <main id="game-view" class="game-shell" hidden>
        <div class="game-chrome">
            <header class="topbar">
                <div>
                    <p class="eyebrow">ISMS Office</p>
                    <h1 id="organization-name">Physician Practice</h1>
                </div>
                <div class="score-strip" aria-label="Office performance and readiness scores">
                    <div class="score-pill">
                        <span>Office</span>
                        <strong id="score-office">100%</strong>
                    </div>
                    <div class="score-pill">
                        <span>Readiness</span>
                        <strong id="score-overall">0%</strong>
                    </div>
                    <div class="score-pill">
                        <span>Security</span>
                        <strong id="score-security">0%</strong>
                    </div>
                    <div class="score-pill">
                        <span>Resilience</span>
                        <strong id="score-resilience">0%</strong>
                    </div>
                    <div class="score-pill">
                        <span>Audit</span>
                        <strong id="score-audit">0%</strong>
                    </div>
                </div>
                <div class="topbar-actions">
                    <button id="help-toggle" class="icon-button" type="button" aria-label="Help and game guide">?</button>
                    <button id="drawer-toggle" type="button" aria-haspopup="dialog" aria-controls="info-drawer" aria-expanded="false">
                        <span>Timeline</span>
                        <span id="drawer-badge" class="drawer-badge" hidden>0</span>
                    </button>
                    <button id="logout" type="button">Sign out</button>
                </div>
            </header>

            <nav id="primary-tabs" class="primary-tabs" role="tablist" aria-label="Main game views">
                <button id="tab-office" class="active" type="button" role="tab" aria-selected="true" aria-controls="panel-office" data-primary-tab="office">Office</button>
                <button id="tab-isms" type="button" role="tab" aria-selected="false" aria-controls="panel-isms" data-primary-tab="isms">ISMS</button>
                <button id="tab-audit" type="button" role="tab" aria-selected="false" aria-controls="panel-audit" data-primary-tab="audit">Audit</button>
            </nav>

            <section id="operations-status-panel" class="operations-status-panel" aria-label="Office operations status">
                <button id="operations-toggle" class="operations-toggle" type="button" aria-expanded="false" aria-controls="operations-details">
                    <span id="operations-status-title">Office Operations</span>
                    <span id="operations-status-badge" class="status-badge ready">Nominal</span>
                </button>
                <div id="operations-details" class="operations-details" hidden>
                    <div id="operations-metrics" class="operations-metrics"></div>
                    <div id="operations-impacts" class="operations-impacts"></div>
                </div>
            </section>
        </div>

        <section id="panel-office" class="tab-panel active" role="tabpanel" aria-labelledby="tab-office" data-tab-panel="office">
            <section class="workspace">
                <section class="scene-panel" aria-label="Office floor plan">
                    <header class="panel-heading map-view-toolbar">
                        <div>
                            <h2>Office Map</h2>
                            <p id="map-mode-description" class="asset-type">Normal office map.</p>
                        </div>
                        <div id="map-view-controls" class="map-view-controls" role="toolbar" aria-label="Floor plan view modes">
                            <button type="button" data-map-mode="overview" aria-pressed="true">Overview</button>
                            <button type="button" data-map-mode="readiness" aria-pressed="false">Readiness</button>
                            <button type="button" data-map-mode="evidence" aria-pressed="false">Evidence</button>
                            <button type="button" data-map-mode="risk" aria-pressed="false">Risk</button>
                            <button type="button" data-map-mode="audit" aria-pressed="false">Audit</button>
                        </div>
                    </header>
                    <canvas id="office-canvas" width="1120" height="720"></canvas>
                </section>

            </section>
        </section>

        <section id="panel-isms" class="tab-panel" role="tabpanel" aria-labelledby="tab-isms" data-tab-panel="isms" hidden>
        <section class="isms-panel" aria-label="Office IT controls">
            <header class="panel-heading">
                <div>
                    <h2>Office IT Controls</h2>
                    <p id="isms-score-summary" class="asset-type"></p>
                </div>
                <div id="isms-tabs" class="isms-tabs" role="tablist" aria-label="Office IT control views">
                    <button type="button" data-isms-tab="controls">Controls</button>
                    <button type="button" data-isms-tab="devices">Devices</button>
                    <button type="button" data-isms-tab="followup">Follow-up</button>
                </div>
            </header>
            <div id="isms-body" class="isms-body"></div>
        </section>
        </section>

        <section id="panel-audit" class="tab-panel" role="tabpanel" aria-labelledby="tab-audit" data-tab-panel="audit" hidden>
            <section class="audit-panel audit-workspace">
                <header class="panel-heading">
                    <div>
                        <h2>Audit</h2>
                        <p class="asset-type">Run a simulated audit and review the latest report.</p>
                    </div>
                    <button id="run-audit" type="button">Run audit</button>
                </header>
                <div id="certification-stepper" class="process-stepper" aria-label="Audit preparation process"></div>
                <div id="audit-panel-body" class="audit-panel-body">
                    <p class="empty-state">Run an audit to generate a simulated auditor report.</p>
                </div>
            </section>
        </section>

        <div id="toast" class="toast" hidden></div>

        <div id="drawer-backdrop" class="drawer-backdrop" hidden></div>
        <aside id="info-drawer" class="info-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" hidden>
            <header class="drawer-header">
                <div>
                    <p class="eyebrow">Simulation Feed</p>
                    <h2 id="drawer-title">Timeline</h2>
                </div>
                <button id="drawer-close" class="icon-button" type="button" aria-label="Close timeline drawer">x</button>
            </header>
            <div id="drawer-tabs" class="drawer-tabs" role="tablist" aria-label="Drawer views">
                <button id="drawer-tab-timeline" class="active" type="button" role="tab" aria-selected="true" aria-controls="drawer-panel-timeline" data-drawer-tab="timeline">Timeline</button>
                <button id="drawer-tab-advisor" type="button" role="tab" aria-selected="false" aria-controls="drawer-panel-advisor" data-drawer-tab="advisor">Advisor</button>
                <button id="drawer-tab-settings" type="button" role="tab" aria-selected="false" aria-controls="drawer-panel-settings" data-drawer-tab="settings">Settings</button>
            </div>
            <section id="drawer-panel-timeline" class="drawer-panel timeline-panel active" role="tabpanel" aria-labelledby="drawer-tab-timeline" data-drawer-panel="timeline">
                <p id="timeline-summary" class="asset-type"></p>
                <div id="timeline-list" class="timeline-list"></div>
            </section>
            <section id="drawer-panel-advisor" class="drawer-panel" role="tabpanel" aria-labelledby="drawer-tab-advisor" data-drawer-panel="advisor" hidden>
                <section id="guidance-panel" class="guidance-panel" aria-label="Guidance hints">
                    <header>
                        <div>
                            <p class="eyebrow">Advisor</p>
                            <h2>Guidance</h2>
                        </div>
                        <p id="guidance-summary" class="asset-type"></p>
                    </header>
                    <div id="guidance-list" class="guidance-list"></div>
                </section>
            </section>
            <section id="drawer-panel-settings" class="drawer-panel settings-panel" role="tabpanel" aria-labelledby="drawer-tab-settings" data-drawer-panel="settings" hidden>
                <form id="guidance-mode-form" class="drawer-settings">
                    <header>
                        <div>
                            <p class="eyebrow">Difficulty</p>
                            <h3>Guidance Mode</h3>
                        </div>
                    </header>
                    <label>
                        Advisor visibility
                        <select name="mode">
                            <option value="guided">Guided</option>
                            <option value="standard">Standard</option>
                            <option value="challenge">Challenge</option>
                        </select>
                    </label>
                </form>
                <form id="timeline-settings-form" class="timeline-settings" hidden>
                    <header>
                        <div>
                            <p class="eyebrow">Admin</p>
                            <h3>Timeline Settings</h3>
                        </div>
                    </header>
                    <label>
                        Advance after minutes
                        <input name="offline_event_minutes" type="number" min="15" max="10080" step="15" required>
                    </label>
                    <label>
                        Max events per advance
                        <input name="max_events_per_advance" type="number" min="1" max="3" step="1" required>
                    </label>
                    <button type="submit">Update timeline</button>
                </form>
            </section>
        </aside>

        <div id="context-modal" class="modal-backdrop" hidden>
            <section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="context-modal-title">
                <header class="modal-header">
                    <div>
                        <p id="context-modal-kicker" class="eyebrow">Office asset</p>
                        <h2 id="context-modal-title">Device</h2>
                    </div>
                    <button id="context-modal-close" class="icon-button" type="button" aria-label="Close detail dialog">x</button>
                </header>
                <div id="context-modal-body" class="modal-body"></div>
                <footer id="context-modal-actions" class="modal-actions"></footer>
            </section>
        </div>
    </main>

    <script src="assets/js/app.js?v=<?= $version ?>" defer></script>
</body>
</html>
