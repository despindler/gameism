# ISMS Office

ISMS Office is a small browser simulation for setting up a physician office with auditable information security controls. The current MVP includes local username/password authentication, a canvas floor plan, clickable workplace assets, control toggles, readiness scoring, an ISMS workbench, incident drills, corrective actions, and a simulated audit report.

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

When updating an existing deployment, run the latest `database/schema.sql` and `database/seed.sql` again. The schema uses `CREATE TABLE IF NOT EXISTS`, and the seed uses upserts for application settings.

## Current Game Loop

After login, the player configures a small physician office from the floor plan and the ISMS workbench:

- The main application is organized into `Office`, `ISMS`, and `Audit` tabs.
- A right-side Timeline drawer shows simulation activity and an Advisor tab with state-driven guidance hints.
- An audit-prep stepper shows where the player is in the review workflow.
- The Office tab shows a schematic physician-office floor plan with rooms, an aisle, doors, furniture, and type-specific device drawings.
- Floor-plan view modes overlay readiness, evidence, risk, and audit status directly on each clickable asset.
- Floor-plan assets open a device profile modal with linked controls, risks, evidence, findings, and corrective actions.
- Device configuration happens inside the modal instead of a permanent side panel.
- The Office tab also includes an Operations section for incident drills and corrective actions.
- Inventory items track owners, classification, criticality, and verification status.
- Risk register items track likelihood, impact, owner, and treatment status.
- Evidence items track whether audit evidence is missing, draft, ready, or reviewed.
- Incident drills create practical teaching situations and linked corrective actions.
- Corrective actions must be completed and verified before related drills can be resolved.
- Readiness scores combine controls and ISMS artifacts across security, documentation, resilience, and audit categories.
- The simulated audit report samples missing controls, untreated risks, unverified assets, and incomplete evidence.

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

The Playwright test uses `site/.env.test`, resets the configured disposable database through `tests/seed_visual.php`, starts the PHP built-in server with `GAMEISM_ENV_FILE=site/.env.test`, logs in as a seeded user, checks the Timeline and Advisor drawer, checks that the canvas is nonblank and includes the richer floor-plan layers, verifies floor-plan overlay modes, exercises the device profile/configuration modal, and checks the ISMS, Operations, audit-prep stepper, and Audit views.
