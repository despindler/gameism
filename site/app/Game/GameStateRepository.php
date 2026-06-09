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

            foreach (GameCatalog::assetInventoryItems() as $definition) {
                $statement = $this->pdo->prepare(
                    'INSERT IGNORE INTO asset_inventory_items
                        (user_id, asset_key, object_key, name, asset_type, owner, information_classification, criticality, status, notes)
                     VALUES
                        (:user_id, :asset_key, :object_key, :name, :asset_type, :owner, :information_classification, :criticality, :status, :notes)'
                );
                $statement->execute([
                    'user_id' => $userId,
                    'asset_key' => $definition['asset_key'],
                    'object_key' => $definition['object_key'],
                    'name' => $definition['name'],
                    'asset_type' => $definition['asset_type'],
                    'owner' => $definition['owner'],
                    'information_classification' => $definition['information_classification'],
                    'criticality' => $definition['criticality'],
                    'status' => $definition['status'],
                    'notes' => $definition['notes'],
                ]);
            }

            foreach (GameCatalog::riskRegisterItems() as $definition) {
                $statement = $this->pdo->prepare(
                    'INSERT IGNORE INTO risk_register_items
                        (user_id, risk_key, object_key, title, owner, likelihood, impact, treatment_status, treatment_summary)
                     VALUES
                        (:user_id, :risk_key, :object_key, :title, :owner, :likelihood, :impact, :treatment_status, :treatment_summary)'
                );
                $statement->execute([
                    'user_id' => $userId,
                    'risk_key' => $definition['risk_key'],
                    'object_key' => $definition['object_key'],
                    'title' => $definition['title'],
                    'owner' => $definition['owner'],
                    'likelihood' => $definition['likelihood'],
                    'impact' => $definition['impact'],
                    'treatment_status' => $definition['treatment_status'],
                    'treatment_summary' => $definition['treatment_summary'],
                ]);
            }

            foreach (GameCatalog::evidenceItems() as $definition) {
                $statement = $this->pdo->prepare(
                    'INSERT IGNORE INTO evidence_items
                        (user_id, evidence_key, object_key, title, evidence_type, expected_evidence, owner, status, notes)
                     VALUES
                        (:user_id, :evidence_key, :object_key, :title, :evidence_type, :expected_evidence, :owner, :status, :notes)'
                );
                $statement->execute([
                    'user_id' => $userId,
                    'evidence_key' => $definition['evidence_key'],
                    'object_key' => $definition['object_key'],
                    'title' => $definition['title'],
                    'evidence_type' => $definition['evidence_type'],
                    'expected_evidence' => $definition['expected_evidence'],
                    'owner' => $definition['owner'],
                    'status' => $definition['status'],
                    'notes' => $definition['notes'],
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
     * @return array<string,list<array<string,mixed>>>
     */
    public function ismsArtifacts(int $userId): array
    {
        return [
            'assets' => $this->assetInventoryItems($userId),
            'risks' => $this->riskRegisterItems($userId),
            'evidence' => $this->evidenceItems($userId),
        ];
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function assetInventoryItems(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, asset_key, object_key, name, asset_type, owner, information_classification, criticality, status, notes, updated_at
             FROM asset_inventory_items
             WHERE user_id = :user_id
             ORDER BY criticality DESC, name ASC'
        );
        $statement->execute(['user_id' => $userId]);
        $items = [];

        foreach ($statement->fetchAll() as $record) {
            $items[] = [
                'id' => (int) $record['id'],
                'asset_key' => (string) $record['asset_key'],
                'object_key' => (string) $record['object_key'],
                'name' => (string) $record['name'],
                'asset_type' => (string) $record['asset_type'],
                'owner' => (string) $record['owner'],
                'information_classification' => (string) $record['information_classification'],
                'criticality' => (string) $record['criticality'],
                'status' => (string) $record['status'],
                'notes' => (string) ($record['notes'] ?? ''),
                'updated_at' => (string) $record['updated_at'],
            ];
        }

        return $items;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function riskRegisterItems(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, risk_key, object_key, title, owner, likelihood, impact, treatment_status, treatment_summary, updated_at
             FROM risk_register_items
             WHERE user_id = :user_id
             ORDER BY impact DESC, likelihood DESC, title ASC'
        );
        $statement->execute(['user_id' => $userId]);
        $items = [];

        foreach ($statement->fetchAll() as $record) {
            $items[] = [
                'id' => (int) $record['id'],
                'risk_key' => (string) $record['risk_key'],
                'object_key' => (string) $record['object_key'],
                'title' => (string) $record['title'],
                'owner' => (string) $record['owner'],
                'likelihood' => (int) $record['likelihood'],
                'impact' => (int) $record['impact'],
                'inherent_score' => (int) $record['likelihood'] * (int) $record['impact'],
                'treatment_status' => (string) $record['treatment_status'],
                'treatment_summary' => (string) ($record['treatment_summary'] ?? ''),
                'updated_at' => (string) $record['updated_at'],
            ];
        }

        return $items;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function evidenceItems(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, evidence_key, object_key, title, evidence_type, expected_evidence, owner, status, notes, updated_at
             FROM evidence_items
             WHERE user_id = :user_id
             ORDER BY evidence_type ASC, title ASC'
        );
        $statement->execute(['user_id' => $userId]);
        $items = [];

        foreach ($statement->fetchAll() as $record) {
            $items[] = [
                'id' => (int) $record['id'],
                'evidence_key' => (string) $record['evidence_key'],
                'object_key' => (string) $record['object_key'],
                'title' => (string) $record['title'],
                'evidence_type' => (string) $record['evidence_type'],
                'expected_evidence' => (string) $record['expected_evidence'],
                'owner' => (string) $record['owner'],
                'status' => (string) $record['status'],
                'notes' => (string) ($record['notes'] ?? ''),
                'updated_at' => (string) $record['updated_at'],
            ];
        }

        return $items;
    }

    /**
     * @param array<string,mixed> $fields
     */
    public function updateAssetInventoryItem(int $userId, string $assetKey, array $fields): void
    {
        $this->updateKnownFields(
            'asset_inventory_items',
            'asset_key',
            $assetKey,
            $userId,
            $fields,
            ['status', 'owner', 'criticality', 'notes']
        );
    }

    /**
     * @param array<string,mixed> $fields
     */
    public function updateRiskRegisterItem(int $userId, string $riskKey, array $fields): void
    {
        $this->updateKnownFields(
            'risk_register_items',
            'risk_key',
            $riskKey,
            $userId,
            $fields,
            ['owner', 'likelihood', 'impact', 'treatment_status', 'treatment_summary']
        );
    }

    /**
     * @param array<string,mixed> $fields
     */
    public function updateEvidenceItem(int $userId, string $evidenceKey, array $fields): void
    {
        $this->updateKnownFields(
            'evidence_items',
            'evidence_key',
            $evidenceKey,
            $userId,
            $fields,
            ['status', 'owner', 'notes']
        );
    }

    /**
     * @param array<string,mixed> $fields
     * @param list<string> $allowedFields
     */
    private function updateKnownFields(string $table, string $keyColumn, string $itemKey, int $userId, array $fields, array $allowedFields): void
    {
        $allowed = array_fill_keys($allowedFields, true);
        $updates = [];
        $params = [
            'user_id' => $userId,
            'item_key' => $itemKey,
        ];

        foreach ($fields as $field => $value) {
            if (!isset($allowed[$field])) {
                throw new ApiException('INVALID_ISMS_FIELD', 400, 'That field cannot be updated for this ISMS item.', [
                    'field' => $field,
                ]);
            }

            $updates[] = $field . ' = :' . $field;
            $params[$field] = $value;
        }

        if ($updates === []) {
            return;
        }

        $sql = sprintf(
            'UPDATE %s SET %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id AND %s = :item_key',
            $table,
            implode(', ', $updates),
            $keyColumn
        );
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        if ($statement->rowCount() === 0) {
            $exists = $this->pdo->prepare(sprintf('SELECT id FROM %s WHERE user_id = :user_id AND %s = :item_key LIMIT 1', $table, $keyColumn));
            $exists->execute(['user_id' => $userId, 'item_key' => $itemKey]);

            if (!$exists->fetch()) {
                throw new ApiException('ISMS_ITEM_NOT_FOUND', 404, 'The selected ISMS item does not exist.');
            }
        }
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
