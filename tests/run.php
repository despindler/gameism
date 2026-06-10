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
assertTrue(count($initial['simulation']['events']) === 6, 'initial scenario has six simulation events');
foreach (['lost_nurse_laptop', 'ransomware_patient_data_unavailable', 'router_internet_outage', 'backup_restore_failure', 'suspicious_cloud_account_activity'] as $expectedEventKey) {
    assertTrue(in_array($expectedEventKey, array_column($initial['simulation']['events'], 'event_key'), true), 'event catalog includes ' . $expectedEventKey);
}
assertTrue(count($initial['simulation']['corrective_actions']) === 0, 'initial scenario has no corrective actions');
assertTrue(!array_key_exists('teaching', $initial), 'game state no longer exposes teaching state');
assertTrue(count($initial['timeline']['events']) === 0, 'initial timeline has no generated event instances');
assertTrue($initial['score']['overall']['percent'] < 60, 'initial scenario starts with visible gaps');
assertTrue($initial['operations']['clinical_capacity_percent'] === 100, 'initial office has full clinical capacity before incidents');
assertTrue($initial['operations']['ehr_availability_percent'] === 100, 'initial EHR availability is normal before incidents');
assertTrue($initial['operations']['confidentiality_exposure_percent'] > 0, 'missing security controls create operational exposure');
assertTrue($initial['settings']['timeline']['offline_event_minutes'] === 120, 'admin game state exposes timeline interval setting');
assertTrue($initial['settings']['timeline']['max_events_per_advance'] === 1, 'admin game state exposes timeline event cap setting');

$settingsUpdated = $game->updateTimelineSettings($user, [
    'offline_event_minutes' => '60',
    'max_events_per_advance' => '2',
]);
assertTrue($settingsUpdated['settings']['timeline']['offline_event_minutes'] === 60, 'admin can update timeline interval');
assertTrue($settingsUpdated['settings']['timeline']['max_events_per_advance'] === 2, 'admin can update timeline event cap');

$invalidTimelineIntervalRejected = false;
try {
    $game->updateTimelineSettings($user, [
        'offline_event_minutes' => '5',
        'max_events_per_advance' => '2',
    ]);
} catch (ApiException $exception) {
    $invalidTimelineIntervalRejected = $exception->apiCode() === 'INVALID_TIMELINE_INTERVAL';
}
assertTrue($invalidTimelineIntervalRejected, 'invalid timeline interval is rejected with a stable error code');

$playerUser = $auth->register('settings_player', 'strongpass123', 'Settings Player');
$playerState = $game->stateForUser($playerUser);
assertTrue($playerState['settings']['timeline'] === null, 'non-admin game state does not expose timeline settings');
$playerTimelineSettingsRejected = false;
try {
    $game->updateTimelineSettings($playerUser, [
        'offline_event_minutes' => '60',
        'max_events_per_advance' => '1',
    ]);
} catch (ApiException $exception) {
    $playerTimelineSettingsRejected = $exception->apiCode() === 'TIMELINE_SETTINGS_FORBIDDEN';
}
assertTrue($playerTimelineSettingsRejected, 'non-admin timeline setting update is rejected with a stable error code');

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
assertTrue($eventStarted['simulation']['events'][0]['impact']['data_availability_loss'] === 70, 'event exposes catalog-driven impact metrics');
assertTrue($eventStarted['simulation']['events'][0]['operational_context'] !== '', 'event exposes operational context');
assertTrue($eventStarted['operations']['data_availability_percent'] < $evidenceReady['operations']['data_availability_percent'], 'active backup event reduces data availability');
assertTrue($eventStarted['operations']['patient_delay_minutes'] > $evidenceReady['operations']['patient_delay_minutes'], 'active backup event creates patient delay');
assertTrue($eventStarted['operations']['closure_risk_percent'] > $evidenceReady['operations']['closure_risk_percent'], 'active backup event increases closure risk');
assertTrue(count($eventStarted['operations']['active_impacts']) === 1, 'active event creates one operational impact');
assertTrue(count($eventStarted['timeline']['events']) === 1, 'starting an event creates a timeline event instance');
assertTrue($eventStarted['timeline']['events'][0]['event_key'] === 'event:backup_restore_failure', 'timeline event uses a stable event key');
assertTrue($eventStarted['timeline']['events'][0]['source_type'] === 'event', 'timeline event uses event source type');
assertTrue($eventStarted['timeline']['events'][0]['status'] === 'active', 'timeline event is active while event is active');
assertTrue($eventStarted['timeline']['events'][0]['impact']['metrics']['data_availability_loss'] === 70, 'timeline event persists catalog impact metrics');

$invalidEventRejected = false;
try {
    $game->startEvent($user, 'not_a_timeline_event');
} catch (ApiException $exception) {
    $invalidEventRejected = $exception->apiCode() === 'EVENT_NOT_FOUND';
}
assertTrue($invalidEventRejected, 'invalid event key is rejected with a stable error code');

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

$weakEventUser = $auth->register('weak_event_user', 'strongpass123', 'Weak Event User');
$weakEventInitial = $game->stateForUser($weakEventUser);
$weakRansomware = $game->startEvent($weakEventUser, 'ransomware_patient_data_unavailable');
assertTrue($weakRansomware['operations']['data_availability_percent'] < $weakEventInitial['operations']['data_availability_percent'], 'ransomware event degrades weak recovery posture');

$strongEventUser = $auth->register('strong_event_user', 'strongpass123', 'Strong Event User');
$game->configureObject($strongEventUser, 'doctor_pc', [
    'patching_current' => true,
]);
$game->configureObject($strongEventUser, 'backup_nas', [
    'backup_schedule' => true,
    'restore_test' => true,
    'offline_or_immutable_copy' => true,
]);
$game->configureObject($strongEventUser, 'isms_binder', [
    'incident_procedure' => true,
]);
$game->updateIsmsItem($strongEventUser, 'evidence', 'backup_restore_test', ['status' => 'ready']);
$game->updateIsmsItem($strongEventUser, 'evidence', 'risk_register_review', ['status' => 'ready']);
$game->updateIsmsItem($strongEventUser, 'evidence', 'incident_procedure_record', ['status' => 'ready']);
$strongRansomware = $game->startEvent($strongEventUser, 'ransomware_patient_data_unavailable');
assertTrue($strongRansomware['operations']['data_availability_percent'] > $weakRansomware['operations']['data_availability_percent'], 'mitigating controls reduce data availability impact');
assertTrue($strongRansomware['operations']['closure_risk_percent'] < $weakRansomware['operations']['closure_risk_percent'], 'mitigating controls reduce closure risk impact');

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
assertTrue($timelineAdvanced['simulation']['events'][0]['event_key'] === 'ransomware_patient_data_unavailable', 'weak recovery posture selects the highest residual offline event');
assertTrue(count($timelineAdvanced['simulation']['corrective_actions']) === 1, 'offline progression creates a corrective action for the event');
assertTrue($timelineAdvanced['timeline']['events'][0]['impact']['generation']['offline_generated'] === true, 'offline event records generation context');
assertTrue($timelineAdvanced['timeline']['events'][0]['impact']['generation']['mitigation_percent'] < 50, 'weak offline event records low mitigation');
$timelineRepeated = $game->stateForUser($timelineUser);
assertTrue(count($timelineRepeated['timeline']['events']) === 1, 'repeated game-state reads do not duplicate offline events');
$pdo->exec('UPDATE timeline_states SET last_advanced_at = UTC_TIMESTAMP() - INTERVAL 3 HOUR WHERE user_id = ' . (int) $timelineUser['id']);
$timelineStillBounded = $game->stateForUser($timelineUser);
assertTrue(count($timelineStillBounded['timeline']['events']) === 1, 'active timeline event blocks further offline generation');

$hardenedTimelineUser = $auth->register('hardened_timeline_user', 'strongpass123', 'Hardened Timeline User');
$game->configureObject($hardenedTimelineUser, 'doctor_pc', [
    'patching_current' => true,
]);
$game->configureObject($hardenedTimelineUser, 'backup_nas', [
    'backup_schedule' => true,
    'restore_test' => true,
    'offline_or_immutable_copy' => true,
]);
$game->configureObject($hardenedTimelineUser, 'isms_binder', [
    'incident_procedure' => true,
]);
$game->updateIsmsItem($hardenedTimelineUser, 'evidence', 'backup_restore_test', ['status' => 'ready']);
$game->updateIsmsItem($hardenedTimelineUser, 'evidence', 'risk_register_review', ['status' => 'ready']);
$game->updateIsmsItem($hardenedTimelineUser, 'evidence', 'incident_procedure_record', ['status' => 'ready']);
$pdo->exec('UPDATE timeline_states SET last_advanced_at = UTC_TIMESTAMP() - INTERVAL 3 HOUR WHERE user_id = ' . (int) $hardenedTimelineUser['id']);
$hardenedTimelineAdvanced = $game->stateForUser($hardenedTimelineUser);
assertTrue($hardenedTimelineAdvanced['timeline']['active_count'] === 1, 'hardened offline user still gets a bounded event');
assertTrue($hardenedTimelineAdvanced['simulation']['events'][0]['event_key'] !== 'ransomware_patient_data_unavailable', 'hardened recovery posture reduces ransomware event likelihood');
assertTrue($hardenedTimelineAdvanced['operations']['closure_risk_percent'] < $timelineAdvanced['operations']['closure_risk_percent'], 'hardened offline posture reduces operational closure risk');
assertTrue($hardenedTimelineAdvanced['timeline']['events'][0]['impact']['generation']['residual_risk_score'] < $timelineAdvanced['timeline']['events'][0]['impact']['generation']['residual_risk_score'], 'hardened offline event records lower residual risk');

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
