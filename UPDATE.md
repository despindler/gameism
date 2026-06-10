# Update Plan: Floor Plan, Timeline Events, And Audit Simplification

Date: 2026-06-10

## Product Direction

The next development arc should make the game loop clearer and more active.

The player-facing sequence should be:

1. Office
   - Act as the system administrator.
   - Inspect the floor plan.
   - Configure devices.
   - Observe operational impact from incidents and outages.

2. ISMS
   - Act as the ISMS owner.
   - Maintain inventory, risks, evidence, corrective actions, and audit preparation.
   - Connect technical controls to management-system work.

3. Audit
   - Run the simulated external audit.
   - Evaluate both technical setup and documentation readiness.
   - Receive high-level feedback, findings, consequences, and learning outcomes.

The current Teaching Loop should not remain a peer in that main sequence. Its useful parts should be redistributed:

- Incident/event visibility moves into a right-side drawer and the Office floor plan.
- Corrective actions move into ISMS.
- Audit review moves into Audit.
- Advisor/learning guidance moves into a drawer tab that can later be enabled, reduced, or disabled by difficulty settings.

## Audit Simplification Decision

Use a single explicit Audit experience for now.

The distinction between internal audit and external/certification audit is realistic, but it adds UI and mental-model complexity before the core game loop is strong enough. For this prototype, the game should present one audit action that evaluates the office state and documentation quality.

The useful internal-audit mechanics should be retained only where they support the simpler loop:

- Corrective actions remain part of ISMS.
- Audit preparation remains part of ISMS evidence/risk/inventory work.
- The Audit tab can still explain findings and readiness gaps.
- Backend tables or code dedicated only to a separate internal-audit mode should be removed or merged when the simplification milestone is implemented, unless keeping them temporarily is clearly lower risk.

## Milestone 1 - Clarify Top-Level Navigation

Goal: Make the main UI sequence match the player roles and reduce conceptual clutter.

Scope:

- Reorder top-level navigation to `Office`, `ISMS`, `Audit`.
- Remove `Teaching` as a top-level tab.
- Rename `Audits` to `Audit` unless the existing UI strongly favors plural wording.
- Move or temporarily re-home current Teaching content:
  - Incident drills/events into a new Office-adjacent panel or placeholder drawer tab.
  - Corrective actions into ISMS.
  - Internal audit summary into Audit only if it still makes sense after simplification.
- Update labels and empty-state text so the UI communicates the three-part loop without adding tutorial-heavy copy.

Required tests and verification:

- Update Playwright visual smoke test to expect exactly the new top-level tabs.
- Verify the default landing tab remains Office.
- Verify ISMS subtabs still work: Inventory, Risks, Evidence.
- Verify Audit tab can still run or display the simulated audit.
- Verify no hidden Teaching tab controls remain reachable through stale selectors.
- Run:
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - `php tests/run.php`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Update README only if visible usage instructions mention the old Teaching tab.
- Add a PROJECT.md milestone entry.

## Milestone 2 - Add Right-Side Drawer Shell

Goal: Add a persistent place for timeline, event feed, and optional guidance without crowding the floor plan.

Scope:

- Add a right-side drawer opened from a compact button in the app chrome.
- Drawer tabs:
  - `Timeline`: real-world/game-world event feed.
  - `Advisor`: guidance cards currently shown in the global advisor strip.
- Move current advisor guidance into the drawer or provide a compatibility bridge during the milestone.
- Add an unopened/active indicator badge to the drawer button when events or high-priority guidance exist.
- Ensure drawer works on desktop and mobile:
  - Desktop: slides in from right.
  - Mobile: covers most of the viewport but keeps close controls obvious.
- Keyboard behavior:
  - Escape closes the drawer.
  - Focus moves into drawer when opened and returns to the opener when closed.

Required tests and verification:

- Playwright:
  - Open and close drawer on desktop.
  - Open and close drawer on mobile viewport.
  - Verify Timeline and Advisor tabs switch without layout overlap.
  - Verify Escape closes the drawer.
  - Verify guidance content is still visible somewhere reachable.
- Syntax and backend checks:
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - `php tests/run.php`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Add PROJECT.md milestone entry.

## Milestone 3 - Introduce Operational State Model

Goal: Represent whether the office can actually function, not only whether it is compliant.

Scope:

- Add server-derived operational metrics to game state, for example:
  - `ehr_availability`
  - `clinical_capacity`
  - `patient_delay_minutes`
  - `data_availability`
  - `confidentiality_exposure`
  - `closure_risk`
- Derive the first version from existing controls, incidents, and evidence state.
- Add an Office HUD or compact status area showing operational state.
- Add an Office view mode or overlay for Operations if it fits cleanly with existing map modes.
- Keep metrics deterministic and explainable.

Required tests and verification:

- PHP tests:
  - Baseline office starts with expected operational metrics.
  - Missing critical controls reduce at least one operational metric.
  - Resolved or mitigated incidents improve affected metrics.
  - Audit/readiness scoring remains stable where unrelated.
- Playwright:
  - Office shows operational status.
  - Operations overlay or HUD changes when seeded test state changes.
- Run:
  - `php tests/run.php`
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Update README if API/game-state concepts are documented there.
- Add PROJECT.md milestone entry.

## Milestone 4 - Replace Incident Drills With Timeline Event Instances

Goal: Move from manually triggered drills toward a living timeline of realistic operational/security events.

Scope:

- Add or reshape persistence around event instances:
  - event type/key
  - affected asset or office area
  - severity
  - status
  - generated_at
  - active_at
  - resolved_at
  - impact payload
  - learning summary
- Add an event catalog in code or seed data for the first few event types:
  - Lost laptop
  - Ransomware/data unavailable
  - Router or internet outage
  - Backup restore failure
  - Suspicious cloud account activity
- Generate events server-side.
- For this milestone, generation can be deterministic or manually triggered by tests/admin/dev helper. Random/offline generation comes later.
- Render event instances in the drawer Timeline tab.
- Show active event markers on affected floor-plan assets.
- Let the player resolve or respond to events through existing device configuration, ISMS evidence, risks, or corrective actions rather than through a disconnected mini-game.

Required tests and verification:

- PHP tests:
  - Event catalog initializes.
  - Creating an event persists one active event instance.
  - Event impact changes operational metrics.
  - Mitigating controls reduce severity or impact.
  - Resolving an event updates status and creates/updates corrective action when appropriate.
  - Invalid event/action payloads return stable error codes.
- Playwright:
  - Timeline drawer lists active event.
  - Affected floor-plan asset shows an event marker.
  - Clicking the affected asset exposes event context in the modal or side summary.
- Run:
  - `php tests/run.php`
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Update README if setup/schema reset instructions change.
- Add PROJECT.md milestone entry.

## Milestone 5 - Add Offline Timeline Progression

Goal: Make the game feel like it has its own timeline even while the user is away.

Scope:

- Add server-side timeline advancement during `GET /api/game-state`.
- Use bounded offline progression:
  - Calculate elapsed time since last timeline update.
  - Generate at most a small configured number of events per period.
  - Avoid runaway event creation.
  - Keep generation deterministic enough for tests by using explicit seeds or fixed clocks in tests.
- Add event frequency settings in seed/config if consistent with existing settings patterns.
- Events should reflect current office posture:
  - Weak setup increases likelihood or severity.
  - Good controls reduce impact.
  - Missing evidence increases audit consequences but should not magically break devices unless the event model says so.

Required tests and verification:

- PHP tests:
  - No duplicate generation on repeated reads.
  - Offline elapsed time can generate an event.
  - Event generation respects configured caps.
  - Stronger security posture reduces impact or severity.
  - Weak posture increases impact or severity.
  - Fixed test clock/seed produces deterministic results.
- Playwright:
  - Seed an offline-progressed state and verify Timeline drawer and Office markers render.
- Run:
  - `php tests/run.php`
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Document the timeline behavior in README if player-facing behavior is described there.
- Add PROJECT.md milestone entry.

## Milestone 6 - Simplify And Strengthen The Audit Tab

Goal: Make Audit the main evaluation and learning-feedback point.

Scope:

- Remove the separate internal-audit UI concept.
- Audit evaluates:
  - device/security configuration
  - asset inventory completeness
  - risk treatment state
  - evidence readiness
  - corrective action state
  - operational incident history and resilience outcomes
- Update audit report output to include operational consequences:
  - avoided closure
  - patient delay
  - data unavailability
  - confidentiality exposure
  - repeated unresolved issues
- Keep language clear that this is a simulated audit/readiness result, not real certification.
- If internal-audit database tables or APIs are obsolete after this milestone, remove them under the prototype clean-slate rule and update tests/docs accordingly.

Required tests and verification:

- PHP tests:
  - Audit report includes technical setup findings.
  - Audit report includes documentation/evidence findings.
  - Audit report includes event/operational resilience findings.
  - Good configuration plus prepared evidence produces better audit result than weak configuration plus missing evidence.
  - Removed internal-audit endpoints, if any, return route-not-found or are no longer referenced.
- Playwright:
  - Audit tab runs the audit.
  - Report renders combined technical, documentation, and operational feedback.
  - No old internal-audit UI remains visible.
- Run:
  - `php tests/run.php`
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Update README for the simplified audit model if needed.
- Add PROJECT.md milestone entry.

## Milestone 7 - Difficulty And Guidance Controls

Goal: Let the game support both guided learning and more challenging simulation play.

Scope:

- Add a simple guidance visibility setting:
  - Guided: Advisor drawer tab visible and proactive indicators enabled.
  - Standard: Advisor visible but less prominent.
  - Challenge: Advisor hidden or only available after failures/audits.
- Store setting in user state or app settings depending on whether it is per-player or global.
- Ensure hiding guidance does not hide required operational event information.
- Keep Timeline always available because it is part of the simulation, not only learning help.

Required tests and verification:

- PHP tests:
  - Guidance setting persists.
  - Invalid setting is rejected with stable error code.
- Playwright:
  - Guided mode shows Advisor tab.
  - Challenge mode hides or reduces Advisor tab.
  - Timeline remains visible in every mode.
- Run:
  - `php tests/run.php`
  - `npm run test:visual`
  - `node --check site/assets/js/app.js`
  - PHP lint over `site/**/*.php`
  - `git diff --check`

Documentation:

- Update README if difficulty modes are documented for users/admins.
- Add PROJECT.md milestone entry.

## Recommended First Implementation Session

Start with Milestone 1 and Milestone 2 together only if the current UI code makes that natural.

Otherwise, do Milestone 1 alone first. It will clarify the mental model without changing the database or simulation rules. Then Milestone 2 can introduce the drawer as the new home for timeline and guidance.

The first simulation-heavy session should be Milestone 3, followed by one deep event in Milestone 4. Prefer one meaningful event with real operational impact over several shallow event labels.

