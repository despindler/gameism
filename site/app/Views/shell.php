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
        <section class="auth-panel" aria-label="Sign in">
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
            </form>

            <form id="register-form" class="auth-form secondary">
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
                <button type="submit">Create player</button>
            </form>

            <p id="auth-message" class="message" role="alert"></p>
        </section>
    </main>

    <main id="game-view" class="game-shell" hidden>
        <header class="topbar">
            <div>
                <p class="eyebrow">ISMS Office</p>
                <h1 id="organization-name">Physician Practice</h1>
            </div>
            <div class="score-strip" aria-label="Readiness scores">
                <div class="score-pill">
                    <span>Overall</span>
                    <strong id="score-overall">0%</strong>
                </div>
                <div class="score-pill">
                    <span>Security</span>
                    <strong id="score-security">0%</strong>
                </div>
                <div class="score-pill">
                    <span>Evidence</span>
                    <strong id="score-documentation">0%</strong>
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
                <button id="run-audit" type="button">Run audit</button>
                <button id="logout" type="button">Sign out</button>
            </div>
        </header>

        <section class="workspace">
            <section class="scene-panel" aria-label="Office floor plan">
                <canvas id="office-canvas" width="1120" height="720"></canvas>
                <div id="toast" class="toast" hidden></div>
            </section>

            <aside class="details-panel" aria-label="Asset details">
                <div id="asset-details" class="asset-details"></div>
                <section class="findings-panel">
                    <h2>Open Findings</h2>
                    <div id="findings-list"></div>
                </section>
            </aside>
        </section>

        <section class="isms-panel" aria-label="ISMS artifacts">
            <header class="panel-heading">
                <div>
                    <h2>ISMS Workbench</h2>
                    <p id="isms-score-summary" class="asset-type"></p>
                </div>
                <div id="isms-tabs" class="isms-tabs" role="tablist" aria-label="ISMS artifact views">
                    <button type="button" data-isms-tab="assets">Inventory</button>
                    <button type="button" data-isms-tab="risks">Risks</button>
                    <button type="button" data-isms-tab="evidence">Evidence</button>
                </div>
            </header>
            <div id="isms-body" class="isms-body"></div>
        </section>

        <section class="teaching-panel" aria-label="Teaching loop">
            <header class="panel-heading">
                <div>
                    <h2>Teaching Loop</h2>
                    <p id="teaching-score-summary" class="asset-type"></p>
                </div>
                <button id="run-internal-audit" type="button">Internal audit</button>
            </header>
            <div class="teaching-grid">
                <section>
                    <h3>Incident Drills</h3>
                    <div id="incident-list" class="teaching-list"></div>
                </section>
                <section>
                    <h3>Corrective Actions</h3>
                    <div id="corrective-action-list" class="teaching-list"></div>
                </section>
                <section>
                    <h3>Internal Audit</h3>
                    <div id="internal-audit-summary" class="teaching-list"></div>
                </section>
            </div>
        </section>

        <section id="audit-panel" class="audit-panel" hidden></section>
    </main>

    <script src="assets/js/app.js?v=<?= $version ?>" defer></script>
</body>
</html>
