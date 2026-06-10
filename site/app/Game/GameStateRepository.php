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

            $timelineState = $this->pdo->prepare(
                'INSERT IGNORE INTO timeline_states (user_id, last_advanced_at) VALUES (:user_id, CURRENT_TIMESTAMP)'
            );
            $timelineState->execute(['user_id' => $userId]);

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
     * @return array<string,mixed>
     */
    public function teachingState(int $userId): array
    {
        return [
            'incidents' => $this->incidentEvents($userId),
            'corrective_actions' => $this->correctiveActions($userId),
            'latest_internal_audit' => $this->latestInternalAuditReport($userId),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function timelineState(int $userId): array
    {
        $events = $this->timelineEvents($userId);
        $activeCount = count(array_filter($events, static fn (array $event): bool => $event['status'] === 'active'));
        $lastAdvancedAt = $this->timelineLastAdvancedAt($userId);

        return [
            'events' => $events,
            'active_count' => $activeCount,
            'last_advanced_at' => $lastAdvancedAt,
        ];
    }

    public function advanceTimeline(int $userId): void
    {
        $intervalMinutes = $this->settingInt('game.timeline.offline_event_minutes', 120);
        $maxEvents = $this->settingInt('game.timeline.max_events_per_advance', 1);
        $lastAdvancedAt = $this->timelineLastAdvancedAt($userId);

        if ($maxEvents < 1 || !$this->timelineIsDue($lastAdvancedAt, $intervalMinutes)) {
            return;
        }

        $this->touchTimelineState($userId);

        if ($this->activeTimelineEventCount($userId) > 0) {
            return;
        }

        $incidentKey = $this->nextAvailableIncidentKey($userId);

        if ($incidentKey === null) {
            return;
        }

        $this->startIncident($userId, $incidentKey);
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function timelineEvents(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, event_key, source_type, source_key, object_key, title, body, severity, status, impact_json, occurred_at, resolved_at, updated_at
             FROM timeline_events
             WHERE user_id = :user_id
             ORDER BY FIELD(status, "active", "resolved"), occurred_at DESC, id DESC'
        );
        $statement->execute(['user_id' => $userId]);
        $items = [];

        foreach ($statement->fetchAll() as $record) {
            $items[] = [
                'id' => (int) $record['id'],
                'event_key' => (string) $record['event_key'],
                'source_type' => (string) $record['source_type'],
                'source_key' => (string) $record['source_key'],
                'object_key' => $record['object_key'] !== null ? (string) $record['object_key'] : null,
                'title' => (string) $record['title'],
                'body' => (string) $record['body'],
                'severity' => (string) $record['severity'],
                'status' => (string) $record['status'],
                'impact' => $this->decodeJson((string) $record['impact_json']),
                'occurred_at' => (string) $record['occurred_at'],
                'resolved_at' => $record['resolved_at'] !== null ? (string) $record['resolved_at'] : null,
                'updated_at' => (string) $record['updated_at'],
            ];
        }

        return $items;
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function incidentEvents(int $userId): array
    {
        $eventsBySourceKey = [];

        foreach ($this->timelineEvents($userId) as $event) {
            if ($event['source_type'] === 'incident') {
                $eventsBySourceKey[$event['source_key']] = $event;
            }
        }

        $items = [];

        foreach (GameCatalog::incidentDrills() as $index => $definition) {
            $event = $eventsBySourceKey[$definition['incident_key']] ?? null;
            $status = is_array($event) ? (string) $event['status'] : 'available';
            $items[] = [
                'id' => is_array($event) ? (int) $event['id'] : $index + 1,
                'incident_key' => (string) $definition['incident_key'],
                'object_key' => (string) $definition['object_key'],
                'title' => (string) $definition['title'],
                'description' => (string) $definition['description'],
                'severity' => (string) $definition['severity'],
                'status' => $status,
                'trigger_text' => (string) $definition['trigger_text'],
                'lesson_text' => (string) $definition['lesson_text'],
                'required_controls' => $definition['required_controls'],
                'required_evidence' => $definition['required_evidence'],
                'started_at' => is_array($event) ? (string) $event['occurred_at'] : null,
                'resolved_at' => is_array($event) ? $event['resolved_at'] : null,
                'updated_at' => is_array($event) ? (string) $event['updated_at'] : null,
            ];
        }

        usort($items, static function (array $a, array $b): int {
            $rank = ['active' => 0, 'available' => 1, 'resolved' => 2];

            return ($rank[$a['status']] ?? 9) <=> ($rank[$b['status']] ?? 9)
                ?: ((int) $a['id'] <=> (int) $b['id']);
        });

        return $items;
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function correctiveActions(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, action_key, source_type, source_key, object_key, title, owner, due_days, status, verification_status, notes, closed_at, updated_at
             FROM corrective_actions
             WHERE user_id = :user_id
             ORDER BY FIELD(status, "open", "in_progress", "done", "verified"), id DESC'
        );
        $statement->execute(['user_id' => $userId]);
        $items = [];

        foreach ($statement->fetchAll() as $record) {
            $items[] = [
                'id' => (int) $record['id'],
                'action_key' => (string) $record['action_key'],
                'source_type' => (string) $record['source_type'],
                'source_key' => (string) $record['source_key'],
                'object_key' => (string) $record['object_key'],
                'title' => (string) $record['title'],
                'owner' => (string) $record['owner'],
                'due_days' => (int) $record['due_days'],
                'status' => (string) $record['status'],
                'verification_status' => (string) $record['verification_status'],
                'notes' => (string) ($record['notes'] ?? ''),
                'closed_at' => $record['closed_at'] !== null ? (string) $record['closed_at'] : null,
                'updated_at' => (string) $record['updated_at'],
            ];
        }

        return $items;
    }

    public function startIncident(int $userId, string $incidentKey): void
    {
        $incident = $this->incidentEvent($userId, $incidentKey);

        if ($incident['status'] === 'resolved') {
            throw new ApiException('INCIDENT_ALREADY_RESOLVED', 409, 'That timeline event has already been resolved.');
        }

        $definition = $this->incidentDefinition($incidentKey);
        $this->upsertTimelineEvent($userId, [
            'event_key' => 'incident:' . $incidentKey,
            'source_type' => 'incident',
            'source_key' => $incidentKey,
            'object_key' => $incident['object_key'],
            'title' => $incident['title'],
            'body' => $incident['lesson_text'],
            'severity' => $definition['severity'] ?? 'major',
            'status' => 'active',
            'impact' => [
                'required_controls' => $definition['required_controls'] ?? [],
                'required_evidence' => $definition['required_evidence'] ?? [],
            ],
        ]);
        $this->createCorrectiveAction($userId, [
            'action_key' => 'incident_' . $incidentKey,
            'source_type' => 'incident',
            'source_key' => $incidentKey,
            'object_key' => $incident['object_key'],
            'title' => $definition['corrective_action_title'] ?? ('Resolve timeline event: ' . $incident['title']),
            'owner' => $definition['owner'] ?? 'Practice Manager',
            'due_days' => 7,
            'status' => 'open',
            'verification_status' => 'not_checked',
            'notes' => $incident['lesson_text'],
        ]);
    }

    public function resolveIncident(int $userId, string $incidentKey): void
    {
        $incident = $this->incidentEvent($userId, $incidentKey);

        if ($incident['status'] !== 'active') {
            throw new ApiException('INCIDENT_NOT_ACTIVE', 409, 'Only active timeline events can be resolved.');
        }

        $statement = $this->pdo->prepare(
            'SELECT status, verification_status
             FROM corrective_actions
             WHERE user_id = :user_id AND action_key = :action_key
             LIMIT 1'
        );
        $statement->execute([
            'user_id' => $userId,
            'action_key' => 'incident_' . $incidentKey,
        ]);
        $action = $statement->fetch();

        if (!is_array($action) || $action['status'] !== 'verified' || $action['verification_status'] !== 'effective') {
            throw new ApiException('CORRECTIVE_ACTION_NOT_VERIFIED', 409, 'Verify the corrective action as effective before resolving the timeline event.');
        }

        $this->resolveTimelineEvent($userId, 'incident:' . $incidentKey);
    }

    private function nextAvailableIncidentKey(int $userId): ?string
    {
        $usedKeys = [];

        foreach ($this->timelineEvents($userId) as $event) {
            if ($event['source_type'] === 'incident') {
                $usedKeys[(string) $event['source_key']] = true;
            }
        }

        foreach (GameCatalog::incidentDrills() as $definition) {
            $incidentKey = (string) $definition['incident_key'];

            if (!isset($usedKeys[$incidentKey])) {
                return $incidentKey;
            }
        }

        return null;
    }

    private function activeTimelineEventCount(int $userId): int
    {
        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM timeline_events WHERE user_id = :user_id AND status = "active"'
        );
        $statement->execute(['user_id' => $userId]);

        return (int) $statement->fetchColumn();
    }

    private function timelineLastAdvancedAt(int $userId): string
    {
        $statement = $this->pdo->prepare('SELECT last_advanced_at FROM timeline_states WHERE user_id = :user_id LIMIT 1');
        $statement->execute(['user_id' => $userId]);
        $value = $statement->fetchColumn();

        if (!is_string($value) || trim($value) === '') {
            $this->touchTimelineState($userId);
            return gmdate('Y-m-d H:i:s');
        }

        return $value;
    }

    private function timelineIsDue(string $lastAdvancedAt, int $intervalMinutes): bool
    {
        $intervalMinutes = max(1, $intervalMinutes);
        $lastTimestamp = strtotime($lastAdvancedAt . ' UTC');

        if ($lastTimestamp === false) {
            return true;
        }

        return time() - $lastTimestamp >= $intervalMinutes * 60;
    }

    private function touchTimelineState(int $userId): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO timeline_states (user_id, last_advanced_at)
             VALUES (:user_id, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE last_advanced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP'
        );
        $statement->execute(['user_id' => $userId]);
    }

    private function settingInt(string $key, int $default): int
    {
        $statement = $this->pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = :setting_key LIMIT 1');
        $statement->execute(['setting_key' => $key]);
        $value = $statement->fetchColumn();

        if (!is_scalar($value) || !is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    /**
     * @param array<string,mixed> $event
     */
    public function upsertTimelineEvent(int $userId, array $event): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO timeline_events
                (user_id, event_key, source_type, source_key, object_key, title, body, severity, status, impact_json, occurred_at, resolved_at)
             VALUES
                (:user_id, :event_key, :source_type, :source_key, :object_key, :title, :body, :severity, :status, :impact_json, CURRENT_TIMESTAMP, NULL)
             ON DUPLICATE KEY UPDATE
                body = VALUES(body),
                severity = VALUES(severity),
                status = VALUES(status),
                impact_json = VALUES(impact_json),
                resolved_at = IF(VALUES(status) = "active", NULL, resolved_at),
                updated_at = CURRENT_TIMESTAMP'
        );
        $statement->execute([
            'user_id' => $userId,
            'event_key' => $event['event_key'],
            'source_type' => $event['source_type'],
            'source_key' => $event['source_key'],
            'object_key' => $event['object_key'] ?? null,
            'title' => $event['title'],
            'body' => $event['body'],
            'severity' => $event['severity'] ?? 'info',
            'status' => $event['status'] ?? 'active',
            'impact_json' => $this->encodeJson(is_array($event['impact'] ?? null) ? $event['impact'] : []),
        ]);
    }

    public function resolveTimelineEvent(int $userId, string $eventKey): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE timeline_events
             SET status = "resolved", resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :user_id AND event_key = :event_key'
        );
        $statement->execute([
            'user_id' => $userId,
            'event_key' => $eventKey,
        ]);
    }

    /**
     * @param array<string,mixed> $fields
     */
    public function updateCorrectiveAction(int $userId, string $actionKey, array $fields): void
    {
        $this->updateKnownFields(
            'corrective_actions',
            'action_key',
            $actionKey,
            $userId,
            $fields,
            ['status', 'verification_status', 'owner', 'notes']
        );

        if (($fields['status'] ?? null) === 'verified') {
            $statement = $this->pdo->prepare(
                'UPDATE corrective_actions
                 SET closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP)
                 WHERE user_id = :user_id AND action_key = :action_key'
            );
            $statement->execute(['user_id' => $userId, 'action_key' => $actionKey]);
        }
    }

    /**
     * @param array<string,mixed> $action
     */
    public function createCorrectiveAction(int $userId, array $action): void
    {
        $statement = $this->pdo->prepare(
            'INSERT IGNORE INTO corrective_actions
                (user_id, action_key, source_type, source_key, object_key, title, owner, due_days, status, verification_status, notes)
             VALUES
                (:user_id, :action_key, :source_type, :source_key, :object_key, :title, :owner, :due_days, :status, :verification_status, :notes)'
        );
        $statement->execute([
            'user_id' => $userId,
            'action_key' => $action['action_key'],
            'source_type' => $action['source_type'],
            'source_key' => $action['source_key'],
            'object_key' => $action['object_key'] ?? null,
            'title' => $action['title'],
            'owner' => $action['owner'],
            'due_days' => $action['due_days'] ?? 14,
            'status' => $action['status'] ?? 'open',
            'verification_status' => $action['verification_status'] ?? 'not_checked',
            'notes' => $action['notes'] ?? '',
        ]);
    }

    /**
     * @param array<string,mixed> $report
     */
    public function saveInternalAuditReport(int $userId, array $report): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO internal_audit_reports (user_id, scope, status, score_json, findings_json, corrective_actions_created)
             VALUES (:user_id, :scope, :status, :score_json, :findings_json, :corrective_actions_created)'
        );
        $statement->execute([
            'user_id' => $userId,
            'scope' => $report['scope'],
            'status' => $report['status'],
            'score_json' => $this->encodeJson($report['score']),
            'findings_json' => $this->encodeJson($report['findings']),
            'corrective_actions_created' => $report['corrective_actions_created'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @return array<string,mixed>|null
     */
    public function latestInternalAuditReport(int $userId): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, scope, status, score_json, findings_json, corrective_actions_created, created_at
             FROM internal_audit_reports
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
            'scope' => (string) $record['scope'],
            'status' => (string) $record['status'],
            'score' => $this->decodeJson((string) $record['score_json']),
            'findings' => $this->decodeJson((string) $record['findings_json']),
            'corrective_actions_created' => (int) $record['corrective_actions_created'],
            'created_at' => (string) $record['created_at'],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function incidentEvent(int $userId, string $incidentKey): array
    {
        $definition = $this->incidentDefinition($incidentKey);

        if ($definition === []) {
            throw new ApiException('INCIDENT_NOT_FOUND', 404, 'The selected timeline event does not exist.');
        }

        $event = $this->timelineEventByKey($userId, 'incident:' . $incidentKey);

        return [
            'incident_key' => (string) $definition['incident_key'],
            'object_key' => (string) $definition['object_key'],
            'title' => (string) $definition['title'],
            'status' => is_array($event) ? (string) $event['status'] : 'available',
            'lesson_text' => (string) $definition['lesson_text'],
        ];
    }

    /**
     * @return array<string,mixed>|null
     */
    private function timelineEventByKey(int $userId, string $eventKey): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, event_key, source_type, source_key, object_key, title, body, severity, status, impact_json, occurred_at, resolved_at, updated_at
             FROM timeline_events
             WHERE user_id = :user_id AND event_key = :event_key
             LIMIT 1'
        );
        $statement->execute(['user_id' => $userId, 'event_key' => $eventKey]);
        $record = $statement->fetch();

        if (!is_array($record)) {
            return null;
        }

        return [
            'id' => (int) $record['id'],
            'event_key' => (string) $record['event_key'],
            'source_type' => (string) $record['source_type'],
            'source_key' => (string) $record['source_key'],
            'object_key' => $record['object_key'] !== null ? (string) $record['object_key'] : null,
            'title' => (string) $record['title'],
            'body' => (string) $record['body'],
            'severity' => (string) $record['severity'],
            'status' => (string) $record['status'],
            'impact' => $this->decodeJson((string) $record['impact_json']),
            'occurred_at' => (string) $record['occurred_at'],
            'resolved_at' => $record['resolved_at'] !== null ? (string) $record['resolved_at'] : null,
            'updated_at' => (string) $record['updated_at'],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    private function incidentDefinition(string $incidentKey): array
    {
        foreach (GameCatalog::incidentDrills() as $definition) {
            if ($definition['incident_key'] === $incidentKey) {
                return $definition;
            }
        }

        return [];
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
                'operational_summary' => $report['operational_summary'] ?? '',
                'operational_consequences' => $report['operational_consequences'] ?? [],
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
