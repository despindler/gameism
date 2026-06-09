<?php

declare(strict_types=1);

use Gameism\Auth\AuthService;
use Gameism\Auth\SessionManager;
use Gameism\Config\Config;
use Gameism\Database\ConnectionFactory;
use Gameism\Game\AuditScoringService;
use Gameism\Game\GameStateService;

require __DIR__ . '/../site/app/bootstrap.php';

$root = dirname(__DIR__);
$envFile = $root . '/site/.env.test';

if (!is_file($envFile)) {
    fwrite(STDERR, "site/.env.test is required for Playwright visual checks.\n");
    exit(1);
}

$config = Config::fromEnvFile($envFile);
$factory = new ConnectionFactory($config);
$pdo = $factory->pdo();

resetDatabase($pdo, $root);

$auth = new AuthService($factory, new SessionManager($config), $config);
$game = new GameStateService($factory, new AuditScoringService());
$user = $auth->register('visual_user', 'visualpass123', 'Visual User');
$game->stateForUser($user);

echo "OK: visual test database seeded.\n";

function resetDatabase(PDO $pdo, string $root): void
{
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ([
        'internal_audit_reports',
        'corrective_actions',
        'incident_events',
        'evidence_items',
        'risk_register_items',
        'asset_inventory_items',
        'audit_reports',
        'office_objects',
        'player_states',
        'app_settings',
        'users',
    ] as $table) {
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

