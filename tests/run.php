<?php

declare(strict_types=1);

use Gameism\Auth\AuthService;
use Gameism\Auth\SessionManager;
use Gameism\Config\Config;
use Gameism\Database\ConnectionFactory;
use Gameism\Game\AuditScoringService;
use Gameism\Game\GameStateService;
use Gameism\Http\ApiException;

require __DIR__ . '/../site/app/bootstrap.php';

$root = dirname(__DIR__);
$envFile = $root . '/site/.env.test';

if (!is_file($envFile)) {
    echo "SKIP: site/.env.test is missing. Copy site/.env.example to site/.env.test and point it at a disposable local MySQL database.\n";
    exit(0);
}

$config = Config::fromEnvFile($envFile);
$factory = new ConnectionFactory($config);
$pdo = $factory->pdo();

resetDatabase($pdo, $root);
assertTrue($pdo->query("SHOW TABLES LIKE 'incident_events'")->fetchColumn() === false, 'incident_events table is not part of the current schema');
assertTrue($pdo->query("SHOW TABLES LIKE 'internal_audit_reports'")->fetchColumn() === false, 'internal_audit_reports table is not part of the current schema');

$auth = new AuthService($factory, new SessionManager($config), $config);
$game = new GameStateService($factory, new AuditScoringService());

$user = $auth->register('smoke_user', 'strongpass123', 'Smoke User');
assertTrue($user['role'] === 'admin', 'first registered user becomes admin');

$initial = $game->stateForUser($user);
assertTrue(count($initial['map']['objects']) === 10, 'initial office has ten interactive objects');
assertTrue(count($initial['isms']['assets']) === 8, 'initial ISMS inventory has eight assets');
assertTrue(count($initial['isms']['risks']) === 6, 'initial risk register has six risks');
assertTrue(count($initial['isms']['evidence']) === 8, 'initial evidence checklist has eight items');
assertTrue(count($initial['simulation']['events']) === 3, 'initial scenario has three simulation events');
assertTrue(count($initial['simulation']['corrective_actions']) === 0, 'initial scenario has no corrective actions');
assertTrue(!array_key_exists('teaching', $initial), 'game state no longer exposes teaching state');
assertTrue(count($initial['timeline']['events']) === 0, 'initial timeline has no generated event instances');
assertTrue($initial['score']['overall']['percent'] < 60, 'initial scenario starts with visible gaps');
assertTrue($initial['operations']['clinical_capacity_percent'] === 100, 'initial office has full clinical capacity before incidents');
assertTrue($initial['operations']['ehr_availability_percent'] === 100, 'initial EHR availability is normal before incidents');
assertTrue($initial['operations']['confidentiality_exposure_percent'] > 0, 'missing security controls create operational exposure');

$before = $initial['score']['overall']['percent'];
$initialExposure = $initial['operations']['confidentiality_exposure_percent'];
$securedLaptop = $game->configureObject($user, 'nurse_laptop', [
    'mfa_enabled' => true,
    'disk_encryption' => true,
    'patching_current' => true,
    'least_privilege' => true,
]);
assertTrue($securedLaptop['operations']['confidentiality_exposure_percent'] < $initialExposure, 'hardening an endpoint reduces operational exposure');

$updated = $game->configureObject($user, 'isms_binder', [
    'asset_inventory' => true,
    'risk_register' => true,
    'soa_prepared' => true,
]);
assertTrue($updated['score']['overall']['percent'] > $before, 'configuring controls improves score');

$documented = $game->updateIsmsItem($user, 'asset', 'patient_records', [
    'status' => 'verified',
    'owner' => 'Practice Manager',
]);
assertTrue($documented['score']['artifacts']['assets']['percent'] > $initial['score']['artifacts']['assets']['percent'], 'verifying inventory improves artifact score');

$treated = $game->updateIsmsItem($user, 'risk', 'ransomware_recovery_failure', [
    'treatment_status' => 'treated',
    'likelihood' => 2,
]);
assertTrue($treated['score']['artifacts']['risks']['percent'] > $initial['score']['artifacts']['risks']['percent'], 'treating risk improves artifact score');

$evidenceReady = $game->updateIsmsItem($user, 'evidence', 'backup_restore_test', [
    'status' => 'ready',
]);
assertTrue($evidenceReady['score']['artifacts']['evidence']['percent'] > $initial['score']['artifacts']['evidence']['percent'], 'ready evidence improves artifact score');

$invalidStatusRejected = false;
try {
    $game->updateIsmsItem($user, 'evidence', 'backup_restore_test', ['status' => 'finished']);
} catch (ApiException $exception) {
    $invalidStatusRejected = $exception->apiCode() === 'INVALID_EVIDENCE_STATUS';
}
assertTrue($invalidStatusRejected, 'invalid evidence status is rejected with a stable error code');

$eventStarted = $game->startEvent($user, 'backup_restore_failure');
assertTrue($eventStarted['simulation']['events'][0]['status'] === 'active', 'starting an event marks it active');
assertTrue(count($eventStarted['simulation']['corrective_actions']) === 1, 'starting an event creates a corrective action');
assertTrue($eventStarted['operations']['data_availability_percent'] < $evidenceReady['operations']['data_availability_percent'], 'active backup event reduces data availability');
assertTrue($eventStarted['operations']['patient_delay_minutes'] > $evidenceReady['operations']['patient_delay_minutes'], 'active backup event creates patient delay');
assertTrue($eventStarted['operations']['closure_risk_percent'] > $evidenceReady['operations']['closure_risk_percent'], 'active backup event increases closure risk');
assertTrue(count($eventStarted['operations']['active_impacts']) === 1, 'active event creates one operational impact');
assertTrue(count($eventStarted['timeline']['events']) === 1, 'starting an event creates a timeline event instance');
assertTrue($eventStarted['timeline']['events'][0]['event_key'] === 'event:backup_restore_failure', 'timeline event uses a stable event key');
assertTrue($eventStarted['timeline']['events'][0]['source_type'] === 'event', 'timeline event uses event source type');
assertTrue($eventStarted['timeline']['events'][0]['status'] === 'active', 'timeline event is active while event is active');

$activeEventAudit = $game->runAudit($user);
assertTrue(count($activeEventAudit['report']['operational_consequences']) === 1, 'audit report includes active operational consequences');
assertTrue($activeEventAudit['report']['operational_consequences'][0]['status'] === 'active', 'active event is sampled as active audit consequence');
assertTrue($activeEventAudit['report']['operational_consequences'][0]['severity'] === 'major', 'active degraded operations create a major audit consequence');
assertTrue(isset($activeEventAudit['game_state']['latest_audit']['score']['operational_consequences']), 'latest audit persists operational consequences');

$unverifiedResolutionRejected = false;
try {
    $game->resolveEvent($user, 'backup_restore_failure');
} catch (ApiException $exception) {
    $unverifiedResolutionRejected = $exception->apiCode() === 'CORRECTIVE_ACTION_NOT_VERIFIED';
}
assertTrue($unverifiedResolutionRejected, 'event cannot be resolved before corrective action verification');

$correctiveUpdated = $game->updateCorrectiveAction($user, 'event_backup_restore_failure', [
    'status' => 'verified',
    'verification_status' => 'effective',
]);
assertTrue($correctiveUpdated['simulation']['corrective_actions'][0]['status'] === 'verified', 'corrective action can be verified');

$eventResolved = $game->resolveEvent($user, 'backup_restore_failure');
$resolvedEvent = array_values(array_filter(
    $eventResolved['simulation']['events'],
    static fn (array $event): bool => $event['event_key'] === 'backup_restore_failure'
))[0];
assertTrue($resolvedEvent['status'] === 'resolved', 'verified corrective action allows event resolution');
assertTrue($eventResolved['operations']['data_availability_percent'] > $eventStarted['operations']['data_availability_percent'], 'resolving event restores data availability');
assertTrue($eventResolved['operations']['patient_delay_minutes'] < $eventStarted['operations']['patient_delay_minutes'], 'resolving event reduces patient delay');
assertTrue(count($eventResolved['operations']['active_impacts']) === 0, 'resolved event clears active operational impacts');
assertTrue($eventResolved['timeline']['events'][0]['status'] === 'resolved', 'resolving event resolves timeline event');
assertTrue($eventResolved['timeline']['events'][0]['resolved_at'] !== null, 'resolved timeline event records resolution time');

$invalidActionStatusRejected = false;
try {
    $game->updateCorrectiveAction($user, 'event_backup_restore_failure', ['status' => 'closed']);
} catch (ApiException $exception) {
    $invalidActionStatusRejected = $exception->apiCode() === 'INVALID_CORRECTIVE_ACTION_STATUS';
}
assertTrue($invalidActionStatusRejected, 'invalid corrective action status is rejected with a stable error code');

$invalidControlRejected = false;
try {
    $game->configureObject($user, 'isms_binder', ['not_a_control' => true]);
} catch (ApiException $exception) {
    $invalidControlRejected = $exception->apiCode() === 'INVALID_CONTROL';
}
assertTrue($invalidControlRejected, 'invalid control is rejected with a stable error code');

$audit = $game->runAudit($user);
assertTrue(isset($audit['report']['status']), 'audit report includes a status');
assertTrue(isset($audit['game_state']['latest_audit']), 'latest audit is persisted');
assertTrue(count($audit['report']['operational_consequences']) === 1, 'audit report includes resolved operational event history');
assertTrue($audit['report']['operational_consequences'][0]['status'] === 'resolved', 'resolved incident is sampled as resolved audit history');
assertTrue($audit['report']['operational_consequences'][0]['severity'] === 'minor', 'resolved incident history creates a minor audit consequence');

$timelineUser = $auth->register('timeline_user', 'strongpass123', 'Timeline User');
$timelineInitial = $game->stateForUser($timelineUser);
assertTrue(count($timelineInitial['timeline']['events']) === 0, 'offline timeline user starts without event instances');
$pdo->exec('UPDATE timeline_states SET last_advanced_at = UTC_TIMESTAMP() - INTERVAL 3 HOUR WHERE user_id = ' . (int) $timelineUser['id']);
$timelineAdvanced = $game->stateForUser($timelineUser);
assertTrue($timelineAdvanced['timeline']['active_count'] === 1, 'offline progression creates one active timeline event');
assertTrue(count($timelineAdvanced['timeline']['events']) === 1, 'offline progression is bounded to one event');
assertTrue($timelineAdvanced['simulation']['events'][0]['status'] === 'active', 'offline progression activates the next available event');
assertTrue(count($timelineAdvanced['simulation']['corrective_actions']) === 1, 'offline progression creates a corrective action for the event');
$timelineRepeated = $game->stateForUser($timelineUser);
assertTrue(count($timelineRepeated['timeline']['events']) === 1, 'repeated game-state reads do not duplicate offline events');
$pdo->exec('UPDATE timeline_states SET last_advanced_at = UTC_TIMESTAMP() - INTERVAL 3 HOUR WHERE user_id = ' . (int) $timelineUser['id']);
$timelineStillBounded = $game->stateForUser($timelineUser);
assertTrue(count($timelineStillBounded['timeline']['events']) === 1, 'active timeline event blocks further offline generation');

echo "OK: smoke tests passed.\n";

function resetDatabase(PDO $pdo, string $root): void
{
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach (['internal_audit_reports', 'corrective_actions', 'timeline_states', 'timeline_events', 'incident_events', 'evidence_items', 'risk_register_items', 'asset_inventory_items', 'audit_reports', 'office_objects', 'player_states', 'app_settings', 'users'] as $table) {
        $pdo->exec('DROP TABLE IF EXISTS ' . $table);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    runSqlFile($pdo, $root . '/database/schema.sql');
    runSqlFile($pdo, $root . '/database/seed.sql');
}

function runSqlFile(PDO $pdo, string $path): void
{
    $sql = file_get_contents($path);
    if ($sql === false) {
        throw new RuntimeException('Could not read SQL file: ' . $path);
    }

    foreach (preg_split('/;\s*(?:\r?\n|$)/', $sql) ?: [] as $statement) {
        $statement = trim($statement);
        if ($statement !== '') {
            $pdo->exec($statement);
        }
    }
}

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException('Assertion failed: ' . $message);
    }
}
