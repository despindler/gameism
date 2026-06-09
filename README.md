# ISMS Office

ISMS Office is a small browser simulation for setting up a physician office with auditable information security controls. The first milestone includes local username/password authentication, a canvas floor plan, clickable workplace assets, control toggles, readiness scoring, and a simulated audit report.

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

