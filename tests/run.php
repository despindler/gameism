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

$auth = new AuthService($factory, new SessionManager($config), $config);
$game = new GameStateService($factory, new AuditScoringService());

$user = $auth->register('smoke_user', 'strongpass123', 'Smoke User');
assertTrue($user['role'] === 'admin', 'first registered user becomes admin');

$initial = $game->stateForUser($user);
assertTrue(count($initial['map']['objects']) === 10, 'initial office has ten interactive objects');
assertTrue(count($initial['isms']['assets']) === 8, 'initial ISMS inventory has eight assets');
assertTrue(count($initial['isms']['risks']) === 6, 'initial risk register has six risks');
assertTrue(count($initial['isms']['evidence']) === 8, 'initial evidence checklist has eight items');
assertTrue(count($initial['teaching']['incidents']) === 3, 'initial scenario has three incident drills');
assertTrue(count($initial['teaching']['corrective_actions']) === 0, 'initial scenario has no corrective actions');
assertTrue($initial['score']['overall']['percent'] < 60, 'initial scenario starts with visible gaps');

$before = $initial['score']['overall']['percent'];
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

$incidentStarted = $game->startIncident($user, 'backup_restore_failure');
assertTrue($incidentStarted['teaching']['incidents'][0]['status'] === 'active', 'starting an incident marks it active');
assertTrue(count($incidentStarted['teaching']['corrective_actions']) === 1, 'starting an incident creates a corrective action');

$unverifiedResolutionRejected = false;
try {
    $game->resolveIncident($user, 'backup_restore_failure');
} catch (ApiException $exception) {
    $unverifiedResolutionRejected = $exception->apiCode() === 'CORRECTIVE_ACTION_NOT_VERIFIED';
}
assertTrue($unverifiedResolutionRejected, 'incident cannot be resolved before corrective action verification');

$correctiveUpdated = $game->updateCorrectiveAction($user, 'incident_backup_restore_failure', [
    'status' => 'verified',
    'verification_status' => 'effective',
]);
assertTrue($correctiveUpdated['teaching']['corrective_actions'][0]['status'] === 'verified', 'corrective action can be verified');

$incidentResolved = $game->resolveIncident($user, 'backup_restore_failure');
$resolvedIncident = array_values(array_filter(
    $incidentResolved['teaching']['incidents'],
    static fn (array $incident): bool => $incident['incident_key'] === 'backup_restore_failure'
))[0];
assertTrue($resolvedIncident['status'] === 'resolved', 'verified corrective action allows incident resolution');

$invalidActionStatusRejected = false;
try {
    $game->updateCorrectiveAction($user, 'incident_backup_restore_failure', ['status' => 'closed']);
} catch (ApiException $exception) {
    $invalidActionStatusRejected = $exception->apiCode() === 'INVALID_CORRECTIVE_ACTION_STATUS';
}
assertTrue($invalidActionStatusRejected, 'invalid corrective action status is rejected with a stable error code');

$internalAudit = $game->runInternalAudit($user);
assertTrue(isset($internalAudit['report']['status']), 'internal audit report includes a status');
assertTrue(isset($internalAudit['game_state']['teaching']['latest_internal_audit']), 'latest internal audit is persisted');
assertTrue(count($internalAudit['game_state']['teaching']['corrective_actions']) >= 1, 'internal audit keeps or creates corrective actions');

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

echo "OK: smoke tests passed.\n";

function resetDatabase(PDO $pdo, string $root): void
{
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach (['internal_audit_reports', 'corrective_actions', 'incident_events', 'evidence_items', 'risk_register_items', 'asset_inventory_items', 'audit_reports', 'office_objects', 'player_states', 'app_settings', 'users'] as $table) {
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
