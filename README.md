# ISMS Office

ISMS Office is a small browser simulation for setting up a physician office with auditable information security controls. The current MVP includes local username/password authentication, a canvas floor plan, clickable workplace assets, control toggles, readiness scoring, an Office IT Controls view, timeline events, event follow-up, and a simulated audit report.

## Structure

- `site/` is the deployable web root. Upload its contents to the host's site root.
- `database/schema.sql` creates the MySQL/MariaDB tables.
- `database/seed.sql` inserts baseline application settings.
- `tests/run.php` runs a destructive smoke test against a disposable local MySQL database configured by `site/.env.test`.

## Deployment

1. Create an empty MySQL or MariaDB database on the host.
2. Run `database/schema.sql`, then `database/seed.sql` against that database.
3. Copy `site/.env.example` to `site/.env`.
4. Edit `site/.env` with the deployment database credentials.
5. Upload the contents of `site/` as the web root. The root must contain `index.php`.

The first registered user becomes `admin`. For a public deployment, set `APP_ALLOW_REGISTRATION=false` in `site/.env` after creating the initial account unless open registration is intentional.

The `site/.htaccess` file protects `.env` and `site/app/` on Apache-compatible hosts and routes API requests through `index.php`. On non-Apache hosts, configure equivalent rules so only `index.php` and `assets/` are directly web-accessible.

When updating an existing deployment, run the latest `database/schema.sql` and `database/seed.sql` again. The schema uses `CREATE TABLE IF NOT EXISTS`, and the seed uses upserts for application settings.

## Current Game Loop

After login, the player configures a small physician office from the floor plan and an ISMS view focused on selected office IT controls:

- The main application is organized into `Office`, `ISMS`, and `Audit` tabs.
- A topbar Help button opens a tabbed game guide covering the game goal, current operating flow, an end-to-end example, view reference, and improvement TODOs.
- A right-side drawer shows the full event Timeline, an Advisor tab with state-driven guidance hints, and a Settings tab for difficulty and timeline pacing controls.
- An audit-prep stepper shows where the player is in the review workflow.
- The Office tab shows a schematic physician-office floor plan with rooms, an aisle, doors, furniture, and type-specific device drawings.
- A sticky Office Operations accordion stays below the navigation across Office, ISMS, and Audit, summarizing operational status when collapsed and showing clinical capacity, EHR availability, data availability, patient delay, exposure, and closure risk when opened.
- The Office Map toolbar overlays readiness, evidence, risk, and audit status directly on each clickable asset.
- Floor-plan assets open a device profile modal with linked controls, risks, evidence, findings, event follow-up, and active event context.
- Device configuration happens inside the modal instead of a permanent side panel.
- The Timeline lists all simulation events; clicking an event opens a modal with event context, required controls/evidence, event actions, and links to follow-up work. Each Timeline row also has a three-dot menu for direct `Open event`, `Start event`, and `Open asset` actions.
- The ISMS tab is framed as `Office IT Controls`, a selected ISO 27001 Annex A-inspired view that groups controls by operational themes such as access, devices, backup, network/cloud, records, and event response.
- The `Controls` view shows full-width accordion groups so the player can scan each Annex A-inspired office IT theme first, then expand it for related device controls, evidence, risk decisions, and event follow-up.
- The `Devices` view keeps the supporting asset register focused on owners, classification, criticality, and verification status.
- Simulation events are persisted as durable timeline events, draw from a catalog of phishing, lost-device, ransomware, network-outage, cloud-account, and backup-recovery scenarios, and create linked follow-up items.
- Event follow-up is managed in the ISMS `Follow-up` view as event-driven improvement work.
- Offline timeline progression can activate a bounded number of posture-aware events when the player returns after enough elapsed time.
- Admin users can tune timeline pacing from the drawer Settings tab.
- Each player can choose Guided, Standard, or Challenge mode; Challenge hides Advisor guidance while keeping Timeline visible.
- Event follow-up must be completed and verified before related active events can be resolved.
- Readiness scores combine controls and supporting ISMS records across security, documentation, resilience, and audit categories.
- The simulated audit report samples missing controls, untreated risk decisions, unverified assets, incomplete evidence, open follow-up, and operational consequences from timeline events.

## Local Run

```powershell
Copy-Item site/.env.example site/.env
# Edit site/.env with a local database that has schema.sql and seed.sql applied.
php -S 127.0.0.1:8080 -t site site/index.php
```

Open `http://127.0.0.1:8080`.

## Verification

PHP and JavaScript syntax checks:

```powershell
Get-ChildItem site -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
node --check site/assets/js/app.js
```

MySQL smoke test:

```powershell
Copy-Item site/.env.example site/.env.test
# Edit site/.env.test to point at a disposable local test database.
php tests/run.php
```

`tests/run.php` drops and recreates the application tables in the configured test database.

Playwright visual smoke test:

```powershell
npm install
npx playwright install chromium
npm run test:visual
```

The Playwright test uses `site/.env.test`, resets the configured disposable database through `tests/seed_visual.php`, starts the PHP built-in server with `GAMEISM_ENV_FILE=site/.env.test`, logs in as a seeded user, checks the refreshed Help modal and the Timeline, Advisor, and Settings drawer tabs, checks the sticky Office Operations accordion across main tabs, checks that the canvas is nonblank and includes the richer floor-plan layers, verifies Office Map overlay modes, exercises the device and event detail modals, and checks the Office IT Controls, audit-prep stepper, and Audit views including operational audit feedback.
