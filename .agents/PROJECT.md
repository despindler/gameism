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

