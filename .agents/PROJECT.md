# Project Notes

## Milestone 0 - Deployable ISMS Office MVP Skeleton

Date: 2026-06-09

Goal: Create the first deployable browser-game skeleton for a physician-office information security simulation.

What changed:

- Added `site/` as the self-contained deployable web root with `index.php`.
- Added dependency-free PHP app bootstrap, env loading, routing, JSON API responses, MySQL connection handling, sessions, local auth, and stable error responses.
- Added initial game state for a small physician office floor plan with clickable assets and server-authoritative configuration state.
- Added scoring across security, documentation, resilience, and audit readiness.
- Added simulated audit report generation with persisted latest audit report.
- Added vanilla JS canvas UI, asset details panel, control toggles, score HUD, findings list, and audit report panel.
- Added `database/schema.sql`, `database/seed.sql`, `site/.env.example`, README instructions, and a MySQL smoke test runner.

How to run:

- Create a database using `database/schema.sql` and `database/seed.sql`.
- Copy `site/.env.example` to `site/.env` and edit credentials.
- Run `php -S 127.0.0.1:8080 -t site site/index.php` for local development.

How to verify:

- `php -l` over PHP files.
- `node --check site/assets/js/app.js`.
- `php tests/run.php` when `site/.env.test` points at a disposable local MySQL database.

Known issues and decisions:

- Google login is intentionally not implemented in this milestone; `.agents/GOOGLEAUTH.md` remains future guidance.
- The ISO learning content is original scenario text and control metadata, not copied standard text.
- The game state is intentionally prototype-simple and can be reset rather than migrated during early development.

Next steps:

- Add admin-tunable scenario/scoring settings.
- Add richer ISMS artifacts: risk register, Statement of Applicability, evidence records, and corrective actions.
- Add incident events and auditor mode.

## Milestone 2 - First-Class ISMS Artifacts

Date: 2026-06-09

Goal: Move beyond control toggles by adding explicit ISMS artifacts for asset inventory, risk register, and audit evidence.

What changed:

- Added `asset_inventory_items`, `risk_register_items`, and `evidence_items` tables to `database/schema.sql`.
- Added seed settings for ISMS scoring weights.
- Added catalog definitions for the initial physician-office inventory, risks, and evidence checklist.
- Initialized ISMS artifact rows per user alongside the office objects.
- Added server-side validation and `POST /api/update-isms-item` for artifact updates.
- Extended readiness scoring and audit findings to include unverified assets, incomplete risk treatment, and missing or draft evidence.
- Added an ISMS Workbench to the UI with Inventory, Risks, and Evidence tabs.
- Updated smoke tests to cover artifact initialization, updates, scoring, and invalid status handling.

How to run:

- Existing deployments should rerun `database/schema.sql`, then `database/seed.sql`.
- New players receive the current ISMS artifact rows automatically when game state is initialized.

How to verify:

- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `node --check site/assets/js/app.js`
- `git diff --check`

Known issues and decisions:

- ISMS artifacts are structured MVP rows, not uploaded documents.
- The Statement of Applicability is represented as evidence/control readiness for now, not a separate editable matrix.
- Browser visual verification was limited by in-app browser availability in the current session; HTTP and syntax checks remain available.

Next steps:

- Add corrective actions and incident-driven teaching events.
- Split the simulated audit into internal audit and certification audit modes.
- Add admin-tunable scenario and scoring settings.

## Milestone 3 - Teaching Loop, Incidents, Corrective Actions, And Internal Audit

Date: 2026-06-09

Goal: Add the first active learning loop where realistic incidents expose gaps, corrective actions track remediation, and internal audits create follow-up work.

What changed:

- Added `incident_events`, `corrective_actions`, and `internal_audit_reports` tables to `database/schema.sql`.
- Added seed settings for internal audit action limits and corrective action due days.
- Added three initial incident drills: phishing against EHR access, lost nurse laptop, and backup restore failure.
- Added per-user initialization for incident drills.
- Added API endpoints for starting incidents, resolving incidents, updating corrective actions, and running internal audits.
- Extended readiness scoring and findings to include active incidents and unverified corrective actions.
- Added a Teaching Loop UI panel with incident drills, corrective action controls, and latest internal audit summary.
- Updated smoke tests to verify incident activation, corrective action verification, incident resolution, internal audit persistence, and stable validation errors.

How to run:

- Existing deployments should rerun `database/schema.sql`, then `database/seed.sql`.
- Existing users receive the incident drill rows on their next game-state initialization after the schema is updated.

How to verify:

- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `node --check site/assets/js/app.js`
- `git diff --check`

Known issues and decisions:

- Corrective actions are structured rows with status and verification fields, not a full workflow engine.
- Internal audits sample current findings and create up to three corrective actions; repeated audits may reuse existing action keys for the same finding.
- Incident drills are scenario-defined and deterministic, not time-randomized events yet.

Next steps:

- Add time pressure, due-date consequences, and recurring review cycles.
- Add an auditor mode that uses sampled evidence and interviews.
- Add admin-tunable incident frequency, scoring weights, and audit strictness.

## UI Phase 1 - Top-Level Navigation And Playwright Visual Smoke

Date: 2026-06-09

Goal: Reduce always-visible screen clutter by moving secondary workflows behind top-level tabs and add repeatable browser-level visual checks.

What changed:

- Added Playwright dev tooling, config, and a Chromium visual smoke test.
- Added `tests/seed_visual.php` to reset and seed the local test database for browser checks.
- Added `GAMEISM_ENV_FILE` support so local tooling can run against `site/.env.test` without using deployment credentials.
- Added top-level `Office`, `ISMS`, `Teaching`, and `Audits` tabs.
- Kept the office floor plan as the default focused screen.
- Moved the ISMS workbench, teaching loop, and certification audit report into dedicated tab panels.
- Made toast feedback global so updates from any tab are visible.
- Updated Playwright coverage for authenticated login, nonblank canvas, tab navigation, ISMS sub-tabs, teaching loop actions, and certification audit report rendering.

How to run:

- `npm run test:visual`
- `php tests/run.php`
- `node --check site/assets/js/app.js`

Known issues and decisions:

- The tab component is custom CSS/JS with Bootstrap-like behavior, not a Bootstrap dependency.
- Device configuration still lives in the Office side panel; modal interaction is the next UI phase.
- Floor-plan architecture and device drawings are still unchanged.

Next steps:

- Move device configuration into inspect/configure modals.
- Improve floor-plan architecture, furniture, and schematic device drawings.
- Add state-driven guidance hints.

## UI Phase 2 - Device Profile And Configuration Modals

Date: 2026-06-09

Goal: Remove the permanent device control checklist from the Office side panel and make device interaction focused through modal drill-down.

What changed:

- Added a reusable device modal with profile and configuration modes.
- Changed floor-plan clicks to open the device profile modal directly.
- Moved the control checklist into the modal's Configure view.
- Reworked the Office side panel into a compact selected-device summary with Inspect and Configure actions.
- Added linked device context in the profile modal: findings, risks, evidence, and corrective actions.
- Added backdrop, close button, Done button, and Escape-key behavior.
- Updated Playwright visual smoke coverage for click-device, profile modal, Configure mode, and closing the modal.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`

Known issues and decisions:

- The side panel remains as an Office context summary for now; it no longer contains the configuration checklist.
- The modal is custom CSS/JS, matching the existing dependency-light frontend.
- Floor-plan geometry and device drawings are unchanged; architectural improvements are the next UI phase.

Next steps:

- Improve floor-plan architecture, furniture, corridors, and schematic device drawings.
- Add state-driven user guidance hints.
- Add process steppers for audit and certification-prep workflows.

## UI Phase 3 - Richer Floor Plan And Device Drawings

Date: 2026-06-09

Goal: Make the Office tab read more like an actual physician-office floor plan so players can understand where assets live before opening the configuration modal.

What changed:

- Replaced the simple room grid with a schematic office layout containing rooms, an aisle, door swing marks, and room fills.
- Added furniture under the scenario assets, including reception desk, exam desks, counters, shelves, table, network shelf, and server rack.
- Replaced generic asset boxes with type-specific schematic drawings for workstation, laptop, cloud EHR, router, NAS, printer, records cabinet, ISMS binders, and shred console.
- Kept the existing object coordinates, hit boxes, modal flow, and saved-state contracts unchanged.
- Extended the Playwright visual smoke test to verify that the richer floor-plan layers render, not just a nonblank canvas.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`

Known issues and decisions:

- Floor-plan geometry is still defined in the frontend rather than in the scenario catalog or database.
- Furniture is decorative context for now; it is not yet clickable or represented as asset inventory.
- Device drawings are schematic canvas glyphs, not external image assets, to keep deployment simple.

Next steps:

- Add state-driven user guidance hints.
- Add process steppers for audit and certification-prep workflows.
- Consider moving floor-plan layout metadata into scenario data once multiple maps are needed.

## UI Phase 4 - Guidance Hints

Date: 2026-06-09

Goal: Give players a clear next step without adding a large tutorial overlay or making the Office view crowded again.

What changed:

- Added a compact global Advisor guidance strip below the main navigation.
- Added state-driven priority cards based on the selected device, missing controls, open findings, incomplete evidence, untreated risks, corrective actions, incident drills, and audit readiness.
- Added direct hint actions that open the selected device configuration modal or navigate to Evidence, Risks, Teaching, or Audits.
- Kept the hint system frontend-only for now; it derives recommendations from the current game state returned by the existing API.
- Updated Playwright coverage to assert the guidance card and exercise the Configure action.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`

Known issues and decisions:

- Hints are deterministic and rule-based, not personalized beyond the current simulation state.
- The advisor recommends up to three priorities to avoid recreating the previous overloaded view.
- Hint actions navigate or open panels, but they do not automatically mutate state.

Next steps:

- Add process steppers for audit and certification-prep workflows.
- Add persistent dismissal or "focus this objective" once player progress becomes more nonlinear.
- Consider moving hint rules to scenario metadata when multiple maps and roles are introduced.

## UI Phase 5 - Internal Audit And Certification Prep Steppers

Date: 2026-06-09

Goal: Make the review workflows easier to follow by showing process progress for internal audit and certification preparation.

What changed:

- Added a reusable process stepper component with completed, current, and pending states.
- Added an internal-audit stepper in the Teaching tab: Prepare scope, Sample gaps, Correct actions, and Management review.
- Added a certification-prep stepper in the Audits tab: Evidence pack, Risk treatment, Readiness gate, and Certification check.
- Derived step states from existing game state: findings, incident status, latest internal audit, corrective actions, evidence readiness, risk treatment, overall readiness, and latest certification audit report.
- Updated Playwright coverage to verify both steppers and their post-run status text.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`

Known issues and decisions:

- Steppers are presentation-only; they do not block running audits.
- Step rules are frontend-derived for now, matching the guidance-hint approach.
- Certification readiness uses the current MVP thresholds and available report state, not a full auditor workflow engine.

Next steps:

- Add persistent objective focus or dismissal for guidance cards.
- Add auditor-role views that inspect evidence samples and interview prompts.
- Move workflow and stepper rules into scenario metadata once multiple scenarios are introduced.

## UI Phase 6 - Floor-Plan Overlays And View Modes

Date: 2026-06-10

Goal: Let players inspect different ISMS concerns directly on the office map without opening every device profile.

What changed:

- Added a compact floor-plan View mode toolbar in the Office scene.
- Added map modes for Overview, Readiness, Evidence, Risk, and Audit.
- Added canvas overlays that draw colored rings and compact badges over each clickable asset.
- Derived overlay metrics from existing game state: object readiness, linked evidence completeness, linked risk treatment, and open findings.
- Updated Playwright coverage to verify the view-mode toolbar and that the audit overlay changes canvas pixels.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`

Known issues and decisions:

- Overlay rules are frontend-only for now, consistent with the advisor and stepper phases.
- View modes are informational; they do not filter or hide assets.
- Evidence and risk overlays depend on current scenario links, so assets without linked artifacts show neutral badges.

Next steps:

- Add persistent objective focus or dismissal for guidance cards.
- Add auditor-role views that inspect evidence samples and interview prompts.
- Move floor-plan overlay definitions into scenario metadata when multiple scenarios are introduced.

## UI Phase 7 - Main Workflow Navigation Simplification

Date: 2026-06-10

Goal: Make the player-facing UI sequence match the core role loop: administer the office, maintain the ISMS, then run an audit.

What changed:

- Replaced the four top-level tabs with `Office`, `ISMS`, and `Audit`.
- Removed `Teaching` as a peer top-level tab.
- Re-homed incident drills and corrective actions into an Office `Operations` section.
- Renamed the simulated audit view from `Audits` to singular `Audit`.
- Removed the internal-audit stepper and button from the visible frontend while leaving backend mechanics in place for a later simplification/refactor milestone.
- Updated advisor actions so incident and corrective-action guidance routes to Office Operations, and audit guidance routes to Audit.
- Updated README and Playwright visual smoke coverage for the new navigation model.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `git diff --check`

Known issues and decisions:

- Internal-audit backend routes, persistence, and PHP smoke coverage remain for now; removing or merging them belongs to the later audit-simplification milestone.
- The Operations section is still a transitional home. A right-side Timeline/Advisor drawer is planned next.
- The game state still uses the `teaching` key for incidents and corrective actions until the event model is reshaped.

Next steps:

- Add the right-side drawer shell for Timeline and Advisor.
- Introduce operational state metrics for whether the office can function during incidents.
- Replace manual incident drills with timeline event instances.

## UI Phase 8 - Timeline And Advisor Drawer Shell

Date: 2026-06-10

Goal: Move meta-level guidance and simulation feed items into a right-side drawer so the main workspace stays focused on Office, ISMS, and Audit.

What changed:

- Added a topbar Timeline button with a count badge for active incidents, open corrective actions, and priority guidance.
- Added a right-side drawer with `Timeline` and `Advisor` tabs.
- Moved the previous always-visible Advisor guidance strip into the drawer.
- Added a frontend-derived Timeline feed from the current incident drills and corrective actions.
- Added drawer open, close, tab switching, backdrop close, Escape-key close, and focus return behavior.
- Updated Playwright coverage for desktop drawer interaction, Advisor actions, Escape close, and mobile drawer sizing.
- Updated README to describe the Timeline/Advisor drawer.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `git diff --check`

Known issues and decisions:

- Timeline entries are derived from the existing `teaching` incident/corrective-action state; durable event instances are planned for the event-system milestone.
- The drawer does not yet include difficulty controls for hiding or reducing Advisor guidance.
- The topbar button is labeled `Timeline` for now because the feed is the primary simulation-level surface.

Next steps:

- Introduce operational state metrics for whether the office can function during incidents.
- Replace manual incident drills with timeline event instances.
- Add difficulty and guidance-visibility controls after the core event loop is stronger.

## Milestone 4 - Derived Operational State

Date: 2026-06-10

Goal: Make the Office view show whether the practice can function operationally, not only whether its controls and documentation score well.

What changed:

- Added a derived `operations` block to `game_state`.
- Added operational metrics for clinical capacity, EHR availability, data availability, patient delay, confidentiality exposure, closure risk, resilience posture, and documentation posture.
- Derived baseline exposure and closure risk from implemented controls and ISMS artifact readiness.
- Derived active incident impact from existing incident drill status, required controls, and required evidence.
- Added active impact summaries for the Timeline feed and Office status panel.
- Added an Office `Office Function` status panel above the floor plan.
- Added the operational status as the first Timeline feed item.
- Updated PHP smoke tests to verify baseline operations, hardening improvements, active incident degradation, and recovery after resolution.
- Updated Playwright coverage to verify operational metrics and active impact rendering.
- Updated README to include the operational function panel.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `git diff --check`

Known issues and decisions:

- Operational metrics are derived, not persisted.
- Incident impact still uses the existing manual drill model; durable timeline event instances are planned next.
- The metric formulas are intentionally simple and explainable for the prototype.

Next steps:

- Replace incident drills with timeline event instances.
- Add floor-plan operational overlays or impacted-asset markers once event instances exist.
- Feed operational consequences into the Audit report.

## Milestone 5 - Durable Timeline Event Instances

Date: 2026-06-10

Goal: Stop treating the Timeline drawer as a purely frontend-derived list and add durable server-created event instances.

What changed:

- Added a `timeline_events` table to `database/schema.sql`.
- Added repository support for persisted timeline events and top-level `game_state.timeline`.
- Starting an incident now creates or reactivates a stable timeline event instance.
- Resolving an incident now marks the corresponding timeline event as resolved and records `resolved_at`.
- Updated the Timeline drawer to render `game_state.timeline.events` instead of deriving incident rows directly.
- Added impacted-asset event markers on the floor plan for active timeline events.
- Updated PHP smoke tests to verify event creation, stable event keys, active status, resolution status, and resolution timestamps.
- Updated Playwright coverage to verify the Timeline drawer lists a started event and the canvas shows an event marker.
- Updated README to describe durable Timeline events.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `git diff --check`

Known issues and decisions:

- The existing `incident_events` table remains the per-user incident catalog/state table for now.
- Timeline event generation is still manually triggered through incident drills; random/offline progression is a later milestone.
- Corrective actions are still rendered as follow-up feed items but are not separate `timeline_events` rows yet.

Next steps:

- Add offline timeline progression and bounded event generation.
- Feed operational consequences into the simulated Audit report.
- Consider renaming or reshaping `incident_events` once the event catalog matures.

## Milestone 6 - Offline Timeline Progression

Date: 2026-06-10

Goal: Make the simulation timeline advance when the player returns after enough elapsed time, while keeping generation bounded and deterministic.

What changed:

- Added a `timeline_states` table with per-player `last_advanced_at`.
- Added seed settings for `game.timeline.offline_event_minutes` and `game.timeline.max_events_per_advance`.
- Initialized timeline state for each player during game-state setup.
- Added server-side timeline advancement during `stateForUser`.
- When the timeline is due and no event is currently active, the next available incident is activated automatically.
- Offline advancement creates the same durable timeline event and corrective action as a manually started incident.
- Repeated game-state reads update the timeline clock without duplicating events.
- Active timeline events block additional offline event generation.
- Updated reset helpers and smoke tests for the new timeline state table and bounded offline behavior.
- Updated README to mention offline progression.

How to verify:

- `npm run test:visual`
- `node --check site/assets/js/app.js`
- `php tests/run.php`
- `Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }`
- `git diff --check`

Known issues and decisions:

- Offline generation currently uses the incident catalog in deterministic row order.
- Only one event is generated per advancement cycle.
- There is no UI control yet for event frequency or difficulty.

Next steps:

- Feed operational consequences into the simulated Audit report.
- Add UI/admin controls for timeline frequency and guidance difficulty.
- Eventually replace incident drills with a fuller event catalog and role-aware generation.
