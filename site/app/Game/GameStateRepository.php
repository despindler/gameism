<?php

declare(strict_types=1);

namespace Gameism\Game;

use Gameism\Http\ApiException;
use PDO;

final class GameStateRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function ensureInitialized(int $userId): void
    {
        $this->pdo->beginTransaction();

        try {
            $statement = $this->pdo->prepare('SELECT user_id FROM player_states WHERE user_id = :user_id LIMIT 1');
            $statement->execute(['user_id' => $userId]);

            if (!$statement->fetch()) {
                $scenario = GameCatalog::scenario();
                $insert = $this->pdo->prepare(
                    'INSERT INTO player_states (user_id, scenario_key, organization_name) VALUES (:user_id, :scenario_key, :organization_name)'
                );
                $insert->execute([
                    'user_id' => $userId,
                    'scenario_key' => $scenario['key'],
                    'organization_name' => 'Northbridge Family Practice',
                ]);
            }

            foreach (GameCatalog::officeObjects() as $definition) {
                $metadata = [
                    'controls' => $definition['controls'],
                    'scenario_key' => GameCatalog::scenario()['key'],
                ];

                $insertObject = $this->pdo->prepare(
                    'INSERT IGNORE INTO office_objects
                        (user_id, object_key, object_type, display_name, x, y, width, height, state, is_blocking, is_clickable, sort_layer, metadata_json, config_json)
                     VALUES
                        (:user_id, :object_key, :object_type, :display_name, :x, :y, :width, :height, :state, :is_blocking, :is_clickable, :sort_layer, :metadata_json, :config_json)'
                );
                $insertObject->execute([
                    'user_id' => $userId,
                    'object_key' => $definition['object_key'],
                    'object_type' => $definition['object_type'],
                    'display_name' => $definition['display_name'],
                    'x' => $definition['x'],
                    'y' => $definition['y'],
                    'width' => $definition['width'],
                    'height' => $definition['height'],
                    'state' => 'needs_attention',
                    'is_blocking' => 0,
                    'is_clickable' => 1,
                    'sort_layer' => $definition['sort_layer'],
                    'metadata_json' => $this->encodeJson($metadata),
                    'config_json' => $this->encodeJson($definition['initial']),
                ]);
            }

            $this->pdo->commit();
        } catch (\Throwable $exception) {
            $this->pdo->rollBack();
            throw $exception;
        }
    }

    /**
     * @return array<string,mixed>
     */
    public function playerState(int $userId): array
    {
        $statement = $this->pdo->prepare('SELECT user_id, scenario_key, organization_name, created_at, updated_at FROM player_states WHERE user_id = :user_id LIMIT 1');
        $statement->execute(['user_id' => $userId]);
        $record = $statement->fetch();

        if (!is_array($record)) {
            throw new ApiException('GAME_STATE_NOT_FOUND', 500, 'Player state was not initialized.');
        }

        return [
            'user_id' => (int) $record['user_id'],
            'scenario_key' => (string) $record['scenario_key'],
            'organization_name' => (string) $record['organization_name'],
            'created_at' => (string) $record['created_at'],
            'updated_at' => (string) $record['updated_at'],
        ];
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function objects(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, object_key, object_type, display_name, x, y, width, height, state, is_blocking, is_clickable, sort_layer, metadata_json, config_json
             FROM office_objects
             WHERE user_id = :user_id
             ORDER BY sort_layer ASC, id ASC'
        );
        $statement->execute(['user_id' => $userId]);
        $objects = [];

        foreach ($statement->fetchAll() as $record) {
            $objects[] = [
                'id' => (int) $record['id'],
                'object_key' => (string) $record['object_key'],
                'object_type' => (string) $record['object_type'],
                'display_name' => (string) $record['display_name'],
                'x' => (int) $record['x'],
                'y' => (int) $record['y'],
                'width' => (int) $record['width'],
                'height' => (int) $record['height'],
                'state' => (string) $record['state'],
                'is_blocking' => (bool) $record['is_blocking'],
                'is_clickable' => (bool) $record['is_clickable'],
                'sort_layer' => (int) $record['sort_layer'],
                'metadata' => $this->decodeJson((string) $record['metadata_json']),
                'config' => $this->decodeJson((string) $record['config_json']),
            ];
        }

        return $objects;
    }

    /**
     * @param array<string,bool> $config
     */
    public function saveObjectConfig(int $userId, string $objectKey, array $config): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE office_objects
             SET config_json = :config_json, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :user_id AND object_key = :object_key'
        );
        $statement->execute([
            'config_json' => $this->encodeJson($config),
            'user_id' => $userId,
            'object_key' => $objectKey,
        ]);
    }

    /**
     * @param array<string,mixed> $report
     */
    public function saveAuditReport(int $userId, array $report): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO audit_reports (user_id, status, score_json, findings_json)
             VALUES (:user_id, :status, :score_json, :findings_json)'
        );
        $statement->execute([
            'user_id' => $userId,
            'status' => $report['status'],
            'score_json' => $this->encodeJson([
                'overall_percent' => $report['overall_percent'],
                'major_findings' => $report['major_findings'],
                'minor_findings' => $report['minor_findings'],
            ]),
            'findings_json' => $this->encodeJson($report['sampled_findings']),
        ]);
    }

    /**
     * @return array<string,mixed>|null
     */
    public function latestAuditReport(int $userId): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, status, score_json, findings_json, created_at
             FROM audit_reports
             WHERE user_id = :user_id
             ORDER BY id DESC
             LIMIT 1'
        );
        $statement->execute(['user_id' => $userId]);
        $record = $statement->fetch();

        if (!is_array($record)) {
            return null;
        }

        return [
            'id' => (int) $record['id'],
            'status' => (string) $record['status'],
            'score' => $this->decodeJson((string) $record['score_json']),
            'findings' => $this->decodeJson((string) $record['findings_json']),
            'created_at' => (string) $record['created_at'],
        ];
    }

    /**
     * @param array<string,mixed> $value
     */
    private function encodeJson(array $value): string
    {
        $json = json_encode($value, JSON_UNESCAPED_SLASHES);

        if (!is_string($json)) {
            throw new ApiException('JSON_ENCODE_FAILED', 500, 'The game state could not be serialized.');
        }

        return $json;
    }

    /**
     * @return array<string,mixed>
     */
    private function decodeJson(string $value): array
    {
        if (trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
