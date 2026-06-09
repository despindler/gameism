<?php

declare(strict_types=1);

namespace Gameism\Game;

use Gameism\Database\ConnectionFactory;
use Gameism\Http\ApiException;

final class GameStateService
{
    private ConnectionFactory $connections;
    private AuditScoringService $scoring;

    public function __construct(ConnectionFactory $connections, AuditScoringService $scoring)
    {
        $this->connections = $connections;
        $this->scoring = $scoring;
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function stateForUser(array $user): array
    {
        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $isms = $repository->ismsArtifacts($user['id']);
        $teaching = $repository->teachingState($user['id']);
        $evaluation = $this->scoring->evaluate($objects, $isms, $teaching);

        return [
            'player' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'display_name' => $user['display_name'],
                'role' => $user['role'],
            ],
            'scenario' => GameCatalog::scenario(),
            'organization' => $repository->playerState($user['id']),
            'map' => [
                'width' => GameCatalog::scenario()['map_width'],
                'height' => GameCatalog::scenario()['map_height'],
                'tile_size' => GameCatalog::scenario()['tile_size'],
                'objects' => $this->hydrateObjects($objects, $evaluation['object_scores']),
            ],
            'isms' => $isms,
            'teaching' => $teaching,
            'score' => $evaluation['score'],
            'findings' => $evaluation['findings'],
            'latest_audit' => $repository->latestAuditReport($user['id']),
        ];
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @param array<string,mixed> $controls
     * @return array<string,mixed>
     */
    public function configureObject(array $user, string $objectKey, array $controls): array
    {
        $objectKey = trim($objectKey);

        if ($objectKey === '') {
            throw new ApiException('INVALID_OBJECT', 400, 'An object key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $target = null;

        foreach ($objects as $object) {
            if ($object['object_key'] === $objectKey) {
                $target = $object;
                break;
            }
        }

        if ($target === null) {
            throw new ApiException('OBJECT_NOT_FOUND', 404, 'The selected office asset does not exist.');
        }

        $allowedControls = $target['metadata']['controls'] ?? [];
        $allowedLookup = array_fill_keys($allowedControls, true);
        $nextConfig = [];

        foreach ($allowedControls as $controlKey) {
            $nextConfig[$controlKey] = (bool) ($target['config'][$controlKey] ?? false);
        }

        foreach ($controls as $controlKey => $enabled) {
            if (!isset($allowedLookup[$controlKey])) {
                throw new ApiException('INVALID_CONTROL', 400, 'That control does not apply to the selected asset.', [
                    'control_key' => $controlKey,
                    'object_key' => $objectKey,
                ]);
            }

            $nextConfig[$controlKey] = (bool) $enabled;
        }

        $repository->saveObjectConfig($user['id'], $objectKey, $nextConfig);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    public function updateIsmsItem(array $user, string $itemType, string $itemKey, array $fields): array
    {
        $itemType = trim($itemType);
        $itemKey = trim($itemKey);

        if ($itemKey === '') {
            throw new ApiException('INVALID_ISMS_ITEM', 400, 'An ISMS item key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);

        if ($itemType === 'asset') {
            $repository->updateAssetInventoryItem($user['id'], $itemKey, $this->validateAssetFields($fields));
            return $this->stateForUser($user);
        }

        if ($itemType === 'risk') {
            $repository->updateRiskRegisterItem($user['id'], $itemKey, $this->validateRiskFields($fields));
            return $this->stateForUser($user);
        }

        if ($itemType === 'evidence') {
            $repository->updateEvidenceItem($user['id'], $itemKey, $this->validateEvidenceFields($fields));
            return $this->stateForUser($user);
        }

        throw new ApiException('INVALID_ISMS_ITEM_TYPE', 400, 'The ISMS item type is not supported.');
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function startIncident(array $user, string $incidentKey): array
    {
        $incidentKey = trim($incidentKey);

        if ($incidentKey === '') {
            throw new ApiException('INVALID_INCIDENT', 400, 'An incident key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->startIncident($user['id'], $incidentKey);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function resolveIncident(array $user, string $incidentKey): array
    {
        $incidentKey = trim($incidentKey);

        if ($incidentKey === '') {
            throw new ApiException('INVALID_INCIDENT', 400, 'An incident key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->resolveIncident($user['id'], $incidentKey);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    public function updateCorrectiveAction(array $user, string $actionKey, array $fields): array
    {
        $actionKey = trim($actionKey);

        if ($actionKey === '') {
            throw new ApiException('INVALID_CORRECTIVE_ACTION', 400, 'A corrective action key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->updateCorrectiveAction($user['id'], $actionKey, $this->validateCorrectiveActionFields($fields));

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function runInternalAudit(array $user): array
    {
        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $isms = $repository->ismsArtifacts($user['id']);
        $teaching = $repository->teachingState($user['id']);
        $evaluation = $this->scoring->evaluate($objects, $isms, $teaching);
        $findings = array_slice($evaluation['findings'], 0, 6);
        $actionsToCreate = array_slice($findings, 0, 3);

        foreach ($actionsToCreate as $finding) {
            $repository->createCorrectiveAction($user['id'], [
                'action_key' => 'audit_' . substr(sha1((string) $finding['control_key']), 0, 20),
                'source_type' => 'internal_audit',
                'source_key' => (string) $finding['control_key'],
                'object_key' => $finding['object_key'],
                'title' => 'Internal audit: ' . $finding['title'],
                'owner' => 'Practice Manager',
                'due_days' => 14,
                'status' => 'open',
                'verification_status' => 'not_checked',
                'notes' => $finding['recommendation'],
            ]);
        }

        $majorCount = count(array_filter($findings, static fn (array $finding): bool => $finding['severity'] === 'major'));
        $report = [
            'scope' => 'Small physician office ISMS controls, evidence, incidents, and corrective actions',
            'status' => $findings === [] ? 'passed' : ($majorCount > 0 ? 'major_findings' : 'minor_findings'),
            'score' => $evaluation['score'],
            'findings' => $findings,
            'corrective_actions_created' => count($actionsToCreate),
        ];
        $repository->saveInternalAuditReport($user['id'], $report);

        return [
            'report' => $report,
            'game_state' => $this->stateForUser($user),
        ];
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function runAudit(array $user): array
    {
        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $evaluation = $this->scoring->evaluate($objects, $repository->ismsArtifacts($user['id']), $repository->teachingState($user['id']));
        $report = $this->scoring->auditReport($evaluation);
        $repository->saveAuditReport($user['id'], $report);

        return [
            'report' => $report,
            'game_state' => $this->stateForUser($user),
        ];
    }

    private function repository(): GameStateRepository
    {
        return new GameStateRepository($this->connections->pdo());
    }

    /**
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    private function validateAssetFields(array $fields): array
    {
        $validated = [];

        foreach ($fields as $field => $value) {
            if ($field === 'status') {
                $validated[$field] = $this->enumValue((string) $value, ['draft', 'verified'], 'INVALID_ASSET_STATUS');
            } elseif ($field === 'criticality') {
                $validated[$field] = $this->enumValue((string) $value, ['low', 'medium', 'high'], 'INVALID_ASSET_CRITICALITY');
            } elseif (in_array($field, ['owner', 'notes'], true)) {
                $validated[$field] = $this->boundedText((string) $value, $field === 'owner' ? 120 : 2000);
            } else {
                throw new ApiException('INVALID_ISMS_FIELD', 400, 'That field cannot be updated for this ISMS item.', ['field' => $field]);
            }
        }

        return $validated;
    }

    /**
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    private function validateRiskFields(array $fields): array
    {
        $validated = [];

        foreach ($fields as $field => $value) {
            if ($field === 'treatment_status') {
                $validated[$field] = $this->enumValue((string) $value, ['identified', 'assessed', 'treated', 'accepted'], 'INVALID_RISK_STATUS');
            } elseif (in_array($field, ['likelihood', 'impact'], true)) {
                $validated[$field] = $this->boundedInt($value, 1, 5, 'INVALID_RISK_SCORE');
            } elseif (in_array($field, ['owner', 'treatment_summary'], true)) {
                $validated[$field] = $this->boundedText((string) $value, $field === 'owner' ? 120 : 2000);
            } else {
                throw new ApiException('INVALID_ISMS_FIELD', 400, 'That field cannot be updated for this ISMS item.', ['field' => $field]);
            }
        }

        return $validated;
    }

    /**
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    private function validateEvidenceFields(array $fields): array
    {
        $validated = [];

        foreach ($fields as $field => $value) {
            if ($field === 'status') {
                $validated[$field] = $this->enumValue((string) $value, ['missing', 'draft', 'ready', 'reviewed'], 'INVALID_EVIDENCE_STATUS');
            } elseif (in_array($field, ['owner', 'notes'], true)) {
                $validated[$field] = $this->boundedText((string) $value, $field === 'owner' ? 120 : 2000);
            } else {
                throw new ApiException('INVALID_ISMS_FIELD', 400, 'That field cannot be updated for this ISMS item.', ['field' => $field]);
            }
        }

        return $validated;
    }

    /**
     * @param array<string,mixed> $fields
     * @return array<string,mixed>
     */
    private function validateCorrectiveActionFields(array $fields): array
    {
        $validated = [];

        foreach ($fields as $field => $value) {
            if ($field === 'status') {
                $validated[$field] = $this->enumValue((string) $value, ['open', 'in_progress', 'done', 'verified'], 'INVALID_CORRECTIVE_ACTION_STATUS');
            } elseif ($field === 'verification_status') {
                $validated[$field] = $this->enumValue((string) $value, ['not_checked', 'effective', 'ineffective'], 'INVALID_VERIFICATION_STATUS');
            } elseif (in_array($field, ['owner', 'notes'], true)) {
                $validated[$field] = $this->boundedText((string) $value, $field === 'owner' ? 120 : 2000);
            } else {
                throw new ApiException('INVALID_CORRECTIVE_ACTION_FIELD', 400, 'That field cannot be updated for this corrective action.', ['field' => $field]);
            }
        }

        return $validated;
    }

    /**
     * @param list<string> $allowed
     */
    private function enumValue(string $value, array $allowed, string $errorCode): string
    {
        if (!in_array($value, $allowed, true)) {
            throw new ApiException($errorCode, 400, 'The selected value is not valid.');
        }

        return $value;
    }

    /**
     * @param mixed $value
     */
    private function boundedInt($value, int $min, int $max, string $errorCode): int
    {
        if (!is_numeric($value)) {
            throw new ApiException($errorCode, 400, 'The numeric value is not valid.');
        }

        $intValue = (int) $value;

        if ($intValue < $min || $intValue > $max) {
            throw new ApiException($errorCode, 400, 'The numeric value is outside the allowed range.');
        }

        return $intValue;
    }

    private function boundedText(string $value, int $maxLength): string
    {
        $value = trim($value);

        if (strlen($value) > $maxLength) {
            throw new ApiException('TEXT_TOO_LONG', 400, 'The submitted text is too long.', ['max_length' => $maxLength]);
        }

        return $value;
    }

    /**
     * @param list<array<string,mixed>> $objects
     * @param array<string,array<string,int>> $objectScores
     * @return list<array<string,mixed>>
     */
    private function hydrateObjects(array $objects, array $objectScores): array
    {
        $catalog = GameCatalog::controls();
        $hydrated = [];

        foreach ($objects as $object) {
            $controls = [];
            $allowedControls = $object['metadata']['controls'] ?? [];

            foreach ($allowedControls as $controlKey) {
                if (!isset($catalog[$controlKey])) {
                    continue;
                }

                $controls[] = [
                    'key' => $controlKey,
                    'label' => $catalog[$controlKey]['label'],
                    'description' => $catalog[$controlKey]['description'],
                    'enabled' => (bool) ($object['config'][$controlKey] ?? false),
                    'severity' => $catalog[$controlKey]['severity'],
                    'categories' => array_keys($catalog[$controlKey]['categories']),
                ];
            }

            $score = $objectScores[$object['object_key']] ?? ['percent' => 0, 'earned' => 0, 'total' => 0];

            $hydrated[] = [
                'id' => $object['id'],
                'object_key' => $object['object_key'],
                'object_type' => $object['object_type'],
                'display_name' => $object['display_name'],
                'x' => $object['x'],
                'y' => $object['y'],
                'width' => $object['width'],
                'height' => $object['height'],
                'state' => $this->stateFromPercent((int) $score['percent']),
                'is_blocking' => $object['is_blocking'],
                'is_clickable' => $object['is_clickable'],
                'sort_layer' => $object['sort_layer'],
                'score' => $score,
                'controls' => $controls,
            ];
        }

        return $hydrated;
    }

    private function stateFromPercent(int $percent): string
    {
        if ($percent >= 80) {
            return 'ready';
        }

        if ($percent >= 45) {
            return 'partial';
        }

        return 'needs_attention';
    }
}
