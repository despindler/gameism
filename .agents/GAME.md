# Reusable Game Architecture And Mechanics Guide

This document captures reusable technical and design patterns from Grass Land for Codex agents building a different browser game from scratch.

It is intentionally domain-neutral. Use it to guide architecture, data modeling, game-state design, interactions, persistence, visualisation, timing, events, economy loops, constraints, external signals, tests, and project process. Put the actual theme and domain rules for the new game in a separate project brief.

## Reuse Goals

Reuse the qualities that made Grass Land workable:

- A small, teachable stack with few moving parts.
- A server-authoritative game state.
- A spatial play surface rendered in the browser.
- Clickable or touchable scene objects that open detailed controls.
- Persistent per-user progression.
- Time-based events and delayed outcomes.
- Capacity limits, blocked actions, and state-dependent constraints.
- Admin-tunable configuration for balancing.
- Deterministic tests for domain behavior.
- Stable JSON APIs and stable error codes.
- Milestone-based documentation and validation.

Do not copy Grass Land's domain concepts blindly. A mower, silo, orders board, cows, and weather are examples of reusable mechanic categories, not mandatory features.

## Recommended Stack

Use this stack when the new game benefits from a compact web app rather than a full game engine:

```text
Frontend      HTML, Bootstrap CSS, vanilla JavaScript
Rendering     Canvas for the primary game surface; DOM for panels, modals, forms, and HUD
Backend       PHP 8.1+ JSON REST API
Persistence   MySQL or compatible MariaDB
Auth          Local username/password with PHP sessions; optional Google login
Admin         Separate admin role for configuration and tuning
Deployment    Repository root as web root, with .htaccess protection for internal folders
Tests         Lightweight PHP integration/domain tests plus JS syntax checks
```

This stack is strongest for games where the core challenge is domain state, learning mechanics, and interaction design. If the new game needs physics, tile maps, animation pipelines, or many sprites, evaluate a focused game library later, but start small unless there is a clear need.

## Project Shape

Start with a structure similar to Grass Land:

```text
app/
  Application.php
  Auth/
  Config/
  Controllers/
  Database/
  Game/
  Http/
api/
assets/
  css/
  js/
migrations/
scripts/
tests/
.agents/
.doc/
index.html
index.php
router.php
README.md
```

Keep these boundaries:

- `Application.php` wires dependencies and registers routes.
- `Controllers/` validates HTTP requests, authenticates users, calls services, catches domain exceptions, and shapes JSON responses.
- `Game/` owns domain rules, state transitions, scoring, timers, and configuration.
- `Database/` owns connection creation and persistence concerns.
- `Http/` owns request parsing, routing, JSON responses, and HTML template rendering.
- `Auth/` owns users, passwords, sessions, roles, and optional identity providers.
- `assets/js/app.js` owns browser state, rendering, input handling, polling, and API calls.
- `tests/run.php` owns deterministic smoke and domain tests.

As the new game grows, split `Game/` into domain folders only when that removes real complexity, for example:

```text
app/Map/
app/Actors/
app/Resources/
app/Events/
app/Economy/
app/Scenario/
```

## Server-Authoritative State

For any action that affects persisted game state, the backend is authoritative.

The browser may animate optimistically, preview changes, and keep local transient UI state, but the backend decides:

- Whether a move is valid.
- Whether an action is allowed.
- Which resources are spent or gained.
- Whether a capacity limit blocks the action.
- Whether a delayed process starts, completes, or is still waiting.
- Whether a scene object is blocked, passable, clickable, depleted, full, locked, or upgraded.
- How offline time changes the world.

This keeps cheating, race conditions, stale browser state, and hidden business-rule duplication under control.

Return refreshed state after mutating actions. For example:

```json
{
  "ok": true,
  "result": {
    "resource_delta": 3,
    "started_event": null
  },
  "game_state": {}
}
```

The browser should apply backend-confirmed state, then repaint.

## Spatial World Model

Grass Land uses a fixed tile map. The reusable concept is a spatial board where objects have positions, footprints, hit boxes, and interaction rules.

A new game can model:

- A grid map.
- A floor plan.
- A workshop.
- A town.
- A factory.
- A dashboard-like process board.
- A network diagram.
- A route map.

Recommended map payload:

```json
{
  "map": {
    "width": 32,
    "height": 24,
    "tile_size": 1,
    "tiles": [],
    "objects": [],
    "service_areas": []
  }
}
```

Recommended object fields:

```text
id
object_key
object_type
display_name
x
y
width
height
state
is_blocking
is_clickable
sort_layer
metadata
```

Use separate concepts for:

- `tiles`: repeated ground or board cells.
- `objects`: visible things on the board.
- `service_areas`: off-board or special interaction targets.
- `actors`: movable entities controlled by player or simulation.
- `hit_boxes`: browser-only click/touch regions derived from rendered geometry.

Do not persist canvas hit boxes. Persist domain positions and derive hit boxes during rendering.

## Rendering And Visualisation

Use canvas for the primary scene when the game has a spatial world or dense visual state. Use DOM for controls, text-heavy panels, forms, modals, and accessibility.

Reusable rendering practices:

- Keep a deterministic draw order: ground, service areas, shadows, objects, actors, overlays, HUD.
- Store enough scene metadata to repaint from state at any time.
- Clear and rebuild canvas hit boxes every frame or every repaint.
- Keep object dimensions stable so UI does not shift when states change.
- Draw status through color, icon, fill level, motion, or small labels rather than large explanatory text.
- Use visual states for `available`, `blocked`, `full`, `empty`, `in_progress`, `ready`, `warning`, and `error`.
- Use subtle animation for active timed processes, but keep motion optional through reduced-motion CSS.
- Keep important player resources visible in a compact HUD.

Common visual patterns from Grass Land that transfer well:

- A board-level object that opens a modal.
- A service object that changes state when full or blocked.
- A progress badge for a delayed task.
- A fill indicator for capacity.
- Contextual bottom alerts that do not move the layout.
- A clickable actor or object that opens a settings drawer.
- External-condition overlays that are visual-only unless explicitly modeled as game mechanics.

## Interactions

Support both pointer/touch and keyboard where it fits the game.

Interaction categories:

- `move`: changes the active actor or cursor position.
- `act`: performs a state-changing operation at a position or on a selected object.
- `inspect`: opens details without changing state.
- `configure`: changes an object's settings or mode.
- `transfer`: moves resources between containers.
- `buy`: spends currency or points to increase capability.
- `start_timed_process`: begins a delayed task.
- `claim_or_complete`: resolves a delayed task after enough time has passed.
- `dismiss_or_acknowledge`: clears hints, alerts, or findings.

Keep state-changing interaction endpoints explicit. Avoid one large "do anything" endpoint.

Example:

```text
POST /api/move
POST /api/act
POST /api/configure-object
POST /api/transfer-resource
POST /api/start-task
POST /api/complete-task
POST /api/buy-upgrade
```

For very small games, `POST /api/act` can be enough at first. Split endpoints once validation and error handling become different.

## Time-Based Mechanics

Grass Land has several reusable time concepts:

- Offline growth from persisted timestamps.
- Delayed order refill.
- Shipment progress.
- Periodic browser polling.
- Session-scoped simulation actors.
- External weather cache expiry.

Generalize these into explicit time mechanics.

### Offline Progress

Persist timestamps for state that changes while the user is away:

```text
last_changed_at
next_update_at
available_at
expires_at
completed_at
```

On `GET /api/game-state`, calculate elapsed time and apply bounded changes. Keep this deterministic and idempotent enough that repeated reads do not create runaway effects.

Examples:

- Regrow depleted resources.
- Age pending tasks.
- Expire opportunities.
- Advance production.
- Recover energy.
- Degrade maintenance state.
- Generate new requests.

### Delayed Tasks

A delayed task should have:

```text
id
user_id
task_type
subject_id
status
started_at
available_at
completed_at
duration_seconds
result_payload
```

Useful statuses:

```text
queued
in_progress
ready
completed
failed
expired
cancelled
```

The frontend should show progress from `started_at`, `available_at`, and server-provided duration. Do not depend only on CSS animations, because closing and reopening a modal should not restart progress from zero.

### Polling

Polling is a simple and effective MVP tool.

Use short, silent polling for active game state only when it matters:

- Refresh timed events every 5-15 seconds for logged-in users.
- Skip refresh while a conflicting state-changing request is in flight.
- Do not spam user-facing errors for transient polling failures.
- Repaint only when refreshed state changes something visible.

Avoid background cron jobs until the game actually needs server-side work without active users.

## Events And Opportunities

Grass Land orders are a reusable event pattern: a list of opportunities appears, can be acted on, and refreshes on a timer.

A domain-neutral event model can support:

- New requests.
- Incidents.
- Customers or jobs.
- Deliveries.
- Missions.
- Repairs.
- Audits.
- Threats.
- Market changes.
- Training prompts.

Recommended fields:

```text
id
user_id
event_type
title
requirements_json
reward_json
status
generated_at
available_at
expires_at
completed_at
seed
```

Use deterministic generation from a seed plus user/scenario identifiers. This makes tests and balancing easier.

## Constraints And Capacity

Constraints create meaningful decisions. Grass Land uses:

- Mower bin capacity.
- Storage capacity.
- Full-bin mowing restrictions.
- Full-storage transfer restrictions.
- Blocked windmill tiles.
- Upgrade maximums.
- Order requirements.

Reusable constraint types:

- Container capacity.
- Inventory limits.
- Blocked movement.
- Locked objects.
- Prerequisite upgrades.
- Required location or adjacency.
- Required tool or role.
- Cooldowns.
- Budget limits.
- Maximum level caps.
- Mutually exclusive modes.
- Risk or penalty thresholds.

Backend validation should check every constraint again, even if the frontend disables the button.

For blocked actions, return a specific error code and keep state unchanged:

```json
{
  "ok": false,
  "error_code": "CONTAINER_FULL",
  "message": "The target container is full.",
  "details": {
    "capacity": 100,
    "current_amount": 100
  }
}
```

The frontend should turn blocked actions into immediate feedback: red flash, disabled button reason, tooltip, alert, or object highlight.

## Resources, Economy, And Upgrades

Grass Land uses cut grass, stored grass, Nax Cash, bin capacity, storage capacity, and mower width. These generalize to:

- Raw resources.
- Stored resources.
- Currency or points.
- Production speed.
- Action width or scope.
- Inventory capacity.
- Storage capacity.
- Access to new actions.
- Cosmetic choices.

Recommended player resource fields:

```text
currency_amount
raw_amount
raw_capacity
stored_amount
stored_capacity
action_width
action_speed
upgrade_level_json
cosmetic_choice
```

Upgrade endpoint pattern:

```json
{
  "type": "storage_capacity"
}
```

Upgrade response:

```json
{
  "ok": true,
  "upgrade_type": "storage_capacity",
  "cost": 50,
  "game_state": {}
}
```

Return upgrade options in `game_state` so the browser does not duplicate pricing formulas:

```json
{
  "upgrades": {
    "storage_capacity": {
      "cost": 50,
      "can_afford": true,
      "is_maxed": false,
      "current_value": 100,
      "next_value": 150
    }
  }
}
```

## External Signals

Grass Land integrates weather as a visual-only external signal with caching and normalization. This pattern is reusable for any outside data source.

External signals can be:

- Weather.
- Market prices.
- Threat levels.
- Seasonal events.
- News-like scenario modifiers.
- Location-specific context.
- User-selected environment settings.

Rules:

- Normalize provider data to a small internal contract.
- Cache provider responses.
- Keep the game playable when the provider fails.
- Do not let external network calls make deterministic tests flaky.
- Use fake providers in tests.
- Make gameplay impact explicit. If the signal is visual-only, document that clearly.

Provider abstraction:

```text
ExternalSignalProvider
ExternalSignalService
ExternalSignalRepository
ExternalSignalFailedException
```

Payload pattern:

```json
{
  "signal": {
    "source": "provider_name",
    "state": "normal",
    "intensity": 2,
    "expires_at": "2026-06-09T12:00:00Z",
    "is_visual_only": true
  }
}
```

## Session-Scoped Simulation

Grass Land cows are session-scoped actors. They exist for the signed-in PHP session but can affect persisted grass tiles.

This pattern is useful for lightweight simulation that should feel alive but does not need long-term identity.

Use session-scoped actors for:

- Visitors.
- Workers.
- Helpers.
- Hazards.
- Temporary agents.
- Ambient activity.
- Tutorial guides.

Rules:

- Store session actor positions and timers in the session.
- Persist only the durable effects they cause.
- Regenerate session actors if old session data conflicts with current map rules.
- Keep actor behavior deterministic enough to test when given a fixed clock or seed.
- Make actors non-blocking unless blocking is central to gameplay.

## Data Model Patterns

Prefer explicit tables for state that is queried, migrated, audited, or tested. Use JSON only for flexible metadata that is not central to constraints.

Reusable core tables:

```text
schema_migrations
users
player_states
game_maps
map_tiles
map_objects
object_states
resources
events
tasks
upgrades
app_settings
external_signal_cache
```

Minimal per-user game state:

```text
player_states
  user_id
  map_id
  currency_amount
  current_x
  current_y
  raw_amount
  raw_capacity
  stored_amount
  stored_capacity
  selected_skin
  created_at
  updated_at
```

Object state:

```text
object_states
  id
  user_id
  object_key
  object_type
  x
  y
  width
  height
  state
  amount
  capacity
  level
  is_blocking
  is_clickable
  metadata_json
  created_at
  updated_at
```

Timed task:

```text
tasks
  id
  user_id
  task_type
  subject_type
  subject_id
  status
  started_at
  available_at
  completed_at
  payload_json
  result_json
```

Generated event:

```text
events
  id
  user_id
  event_type
  slot
  status
  requirements_json
  reward_json
  generated_at
  available_at
  expires_at
  completed_at
```

Upgrade:

```text
upgrades
  user_id
  upgrade_type
  level
  current_value
  updated_at
```

For early prototypes, it is acceptable to store some state on `player_states`. Split into separate tables when multiple rows, querying, history, or migrations become important.

## API Contract

Keep endpoints boring and predictable.

Baseline endpoints:

```text
GET  /api/health
POST /api/register
POST /api/login
POST /api/google-login
POST /api/logout
GET  /api/me
GET  /api/auth-config
GET  /api/game-state
POST /api/move
POST /api/act
POST /api/configure-object
POST /api/transfer-resource
GET  /api/events
POST /api/complete-event
POST /api/start-task
POST /api/complete-task
POST /api/upgrade
GET  /api/external-signal
GET  /api/admin/config
POST /api/admin/config
```

Success response:

```json
{
  "ok": true,
  "game_state": {}
}
```

Error response:

```json
{
  "ok": false,
  "error_code": "STABLE_CODE",
  "message": "Human-readable message.",
  "details": {}
}
```

Common reusable error codes:

```text
AUTH_REQUIRED
ADMIN_REQUIRED
DB_CONFIG_MISSING
ROUTE_NOT_FOUND
INVALID_ROUTE_RESPONSE
INVALID_POSITION
INVALID_ACTION
INVALID_OBJECT
OBJECT_NOT_FOUND
ACTION_BLOCKED
CONTAINER_FULL
CONTAINER_EMPTY
INSUFFICIENT_RESOURCE
INSUFFICIENT_CURRENCY
UPGRADE_MAXED
TASK_NOT_READY
EVENT_NOT_FOUND
EVENT_EXPIRED
EXTERNAL_SIGNAL_UNAVAILABLE
GAME_STATE_STORAGE_FAILED
```

Stable error codes are important because the frontend uses them to decide whether to refresh state, flash an object, disable a button, or show a specific hint.

## Configuration And Admin Tuning

Reuse the Grass Land `Config`, `GameConfig`, `GameConfigProvider`, `SettingsRepository`, and admin config pattern:

- `.env` contains defaults.
- `app_settings` contains admin overrides.
- Admin overrides merge over environment defaults.
- `GET /api/admin/config` returns current values.
- `POST /api/admin/config` validates and persists values.

Example tunables:

```text
GAME_MAP_WIDTH
GAME_MAP_HEIGHT
GAME_STARTING_CURRENCY
GAME_STARTING_RAW_CAPACITY
GAME_STARTING_STORED_CAPACITY
GAME_ACTION_INTERVAL_SECONDS
GAME_EVENT_SLOT_COUNT
GAME_EVENT_REFRESH_SECONDS
GAME_EVENT_REFILL_AVERAGE_SECONDS
GAME_TASK_MIN_SECONDS
GAME_TASK_MAX_SECONDS
GAME_UPGRADE_BASE_COST
GAME_STORAGE_UPGRADE_AMOUNT
GAME_MAX_ACTION_WIDTH
GAME_EXTERNAL_SIGNAL_CACHE_SECONDS
```

Keep config values simple at first: integers, booleans, and small enumerations. Add structured config only when the admin UI and tests can validate it well.

## Versioning And Browser Updates

Reuse the `APP_VERSION` pattern:

- `GET /api/health` returns the backend version.
- `index.php` injects the version into the HTML meta tag.
- CSS and JS assets include version query strings.
- The browser checks the backend version periodically.
- A status pill or small HUD item shows when an update is available.
- A manual update button reloads with a cache-busting query string.

This prevents players from running stale JavaScript after deployment.

## Testing Strategy

Start with deterministic tests before adding browser automation.

Test categories:

- Health endpoint.
- Auth and session flows.
- Admin-only authorization.
- First game-state initialization.
- Map/object placement.
- Valid movement or action.
- Blocked movement or action.
- Resource gain and spend.
- Capacity full/empty behavior.
- Upgrade affordability and max state.
- Timed task creation and completion.
- Event generation, expiration, and refill.
- Offline progress from timestamps.
- External signal caching and provider failure.
- Storage diagnostics without secret leakage.
- Migration/setup SQL consistency.

Use these test helpers:

- In-memory SQLite PDO where compatible.
- Fake clocks.
- Fake external providers.
- In-memory session store.
- Deterministic random seeds.

Validation commands:

```powershell
php tests/run.php
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
node --check assets/js/app.js
git diff --check
```

For frontend/canvas changes, run the app and inspect with browser automation or a manual smoke test. Check that the canvas is nonblank, interactive objects are clickable, text does not overlap, and mobile controls remain usable.

## Frontend State Management

Vanilla JavaScript is enough if state is organized clearly.

Keep separate browser state for:

- Last backend-confirmed `gameState`.
- Transient input state.
- Animation state.
- Active modal or drawer.
- In-flight requests.
- Local hint counters.
- Hit boxes.
- External signal visuals.
- Timed task progress display.

Guidelines:

- Never let transient animation state become the source of truth for persisted state.
- Ignore or merge stale responses carefully when a newer state has already been applied.
- Disable or queue inputs while conflicting requests are in flight.
- Keep event listeners centralized.
- Re-render UI panels after state changes instead of patching many unrelated DOM nodes.
- Refresh icons after dynamic DOM creation when using an icon library.

## UX Patterns

Reusable interface layout:

```text
Top HUD        Key resources, version/update state, active timed process
Canvas         Primary spatial game surface
Controls       Movement/action controls or object-specific action buttons
Drawer         Details for selected actor/object/player
Modal          Event board, task queue, audit/log/detail screens
Bottom alert   Contextual hints and blocked-action messages
Admin panel    Tuning values and diagnostics
```

Good interactions:

- Clicking a scene object opens its details.
- Disabled buttons explain why they are disabled.
- Full containers flash or highlight when the player tries to add more.
- Timed processes show persistent progress based on timestamps.
- The player can act without reading long instructions.
- Hints are contextual and limited, not permanent clutter.
- Mobile controls remain reachable.

Avoid:

- A landing page when the request is for a playable game.
- Large explanatory UI text inside the game surface.
- Cards inside cards.
- Visual-only state with no accessible or textual backup in detail panels.
- Hidden frontend-only rules that the backend does not validate.

## Deployment And Security

Reuse these deployment/security basics:

- Keep `.env` out of git.
- Use `.env.example` for placeholders.
- Hash passwords with PHP password hashing.
- Keep admin creation in a script using environment variables.
- Deny direct browser access to `app/`, `migrations/`, `scripts/`, `tests/`, `.agents/`, `.doc/`, `.git/`, and `.env`.
- Keep local username/password login available even when optional Google login is enabled.
- Set MySQL sessions to UTC.
- Store game timestamps in stable columns that will not be rewritten unexpectedly by the database.
- Return SQLSTATE diagnostics for storage failures, but include driver messages only in debug mode.
- Escape user-provided text in the browser.
- Add file uploads only after access control, validation, size limits, and deletion behavior are designed.

## Documentation Process

Use the Grass Land milestone workflow in every new game:

1. Read `.agents/CONTEXT.md`, `.agents/CODEX.md`, `.agents/PROJECT.md`, and README at session start.
2. Define a narrow milestone.
3. Inspect existing code and tests before editing.
4. Implement the smallest coherent change.
5. Add or update tests.
6. Run validation.
7. Update README or docs if behavior, API, config, schema, run steps, or user-facing behavior changed.
8. Update `.agents/PROJECT.md` with date, goal, changes, validation, known issues, and next steps.
9. Ask before committing.

Keep `.agents/CONTEXT.md` as the current truth for product and architecture context. Keep `.agents/PROJECT.md` as the audit trail. Keep README practical for running and deploying.

## What To Copy, Adapt, Or Rebuild

Copy with minimal changes:

- App bootstrap and route registration pattern.
- Request, router, JSON response, and index renderer.
- Config loading and `.env.example`.
- Auth, sessions, roles, local login, optional Google login.
- Connection factory and request-scoped PDO reuse.
- Migration runner, setup SQL, reset SQL, admin user script.
- Health endpoint and `APP_VERSION` update detection.
- Stable JSON error shape.
- Test runner style.
- Admin config pattern.

Adapt:

- `GameStateService` into the new game's state service.
- `GameStateRepository` into repositories for the new entities.
- Canvas scene drawing into the new map/board/floor-plan visualisation.
- Orders into generic event/opportunity/task boards.
- Shipments into generic delayed processes.
- Storage and bin limits into generic resource capacities.
- Weather into generic external signals.
- Cows into generic session-scoped simulation actors.
- Upgrades into domain-specific capability increases.
- Contextual hints into domain-specific coaching.

Rebuild:

- Domain entities.
- Scoring rules.
- Map geometry.
- Object visuals.
- Resource names.
- Upgrade names.
- Event generation rules.
- Copy, labels, and tutorial content.

## First Prompt Template For A New Game

Use this kind of prompt when instructing Codex to start a new project:

```text
Build a small-stack browser game using the reusable Grass Land architecture: PHP JSON API, MySQL migrations, vanilla JavaScript canvas UI, local sessions, optional Google login, admin-tunable config, deterministic tests, flat web-root deployment, APP_VERSION update detection, and milestone documentation.

Start with Milestone 0: project skeleton, health endpoint, local auth, admin role, config loading, migration runner, setup SQL, reset SQL, tests, and a minimal playable canvas scene for the domain I will provide separately.

Use server-authoritative game state. Keep JSON error responses stable. Do not implement the full domain in one pass. After each milestone, run tests and update README plus .agents/PROJECT.md.
```

Then provide the new game's domain brief separately.
