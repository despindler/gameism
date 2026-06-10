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
        $repository->advanceTimeline($user['id'], $objects, $isms);
        $simulation = $repository->simulationState($user['id']);
        $timeline = $repository->timelineState($user['id']);
        $evaluation = $this->scoring->evaluate($objects, $isms, $simulation);

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
            'simulation' => $simulation,
            'timeline' => $timeline,
            'settings' => [
                'timeline' => $user['role'] === 'admin' ? $repository->timelineSettings() : null,
                'guidance_mode' => $repository->guidanceMode($user['id']),
            ],
            'operations' => $this->operationalState($objects, $isms, $simulation),
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
    public function startEvent(array $user, string $eventKey): array
    {
        $eventKey = trim($eventKey);

        if ($eventKey === '') {
            throw new ApiException('INVALID_EVENT', 400, 'An event key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->startEvent($user['id'], $eventKey);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @param array<string,mixed> $settings
     * @return array<string,mixed>
     */
    public function updateTimelineSettings(array $user, array $settings): array
    {
        if ($user['role'] !== 'admin') {
            throw new ApiException('TIMELINE_SETTINGS_FORBIDDEN', 403, 'Only administrators can update timeline settings.');
        }

        $offlineEventMinutes = $this->boundedInt(
            $settings['offline_event_minutes'] ?? null,
            15,
            10080,
            'INVALID_TIMELINE_INTERVAL'
        );
        $maxEventsPerAdvance = $this->boundedInt(
            $settings['max_events_per_advance'] ?? null,
            1,
            3,
            'INVALID_TIMELINE_EVENT_CAP'
        );

        $repository = $this->repository();
        $repository->updateTimelineSettings($offlineEventMinutes, $maxEventsPerAdvance);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function updateGuidanceMode(array $user, string $mode): array
    {
        $mode = trim($mode);

        if (!in_array($mode, ['guided', 'standard', 'challenge'], true)) {
            throw new ApiException('INVALID_GUIDANCE_MODE', 400, 'The selected guidance mode is not valid.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->updateGuidanceMode($user['id'], $mode);

        return $this->stateForUser($user);
    }

    /**
     * @param array{id:int,username:string,display_name:string,role:string} $user
     * @return array<string,mixed>
     */
    public function resolveEvent(array $user, string $eventKey): array
    {
        $eventKey = trim($eventKey);

        if ($eventKey === '') {
            throw new ApiException('INVALID_EVENT', 400, 'An event key is required.');
        }

        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $repository->resolveEvent($user['id'], $eventKey);

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
    public function runAudit(array $user): array
    {
        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $isms = $repository->ismsArtifacts($user['id']);
        $repository->advanceTimeline($user['id'], $objects, $isms);
        $simulation = $repository->simulationState($user['id']);
        $timeline = $repository->timelineState($user['id']);
        $evaluation = $this->scoring->evaluate($objects, $isms, $simulation);
        $report = $this->scoring->auditReport($evaluation, $this->operationalState($objects, $isms, $simulation), $timeline);
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
     * @param list<array<string,mixed>> $objects
     * @param array<string,list<array<string,mixed>>> $isms
     * @param array<string,mixed> $simulation
     * @return array<string,mixed>
     */
    private function operationalState(array $objects, array $isms, array $simulation): array
    {
        $confidentialityPosture = $this->controlCoverage($objects, [
            'mfa_enabled',
            'disk_encryption',
            'screen_lock',
            'least_privilege',
            'guest_network_isolated',
            'physical_lock',
            'secure_print',
            'disposal_procedure',
        ]);
        $resiliencePosture = $this->controlCoverage($objects, [
            'backup_export_plan',
            'backup_schedule',
            'encrypted_backup',
            'restore_test',
            'offline_or_immutable_copy',
            'incident_procedure',
            'risk_register',
        ]);
        $documentationPosture = $this->artifactCoverage($isms);

        $metrics = [
            'clinical_capacity_percent' => 100,
            'ehr_availability_percent' => 100,
            'data_availability_percent' => 100,
            'patient_delay_minutes' => 0,
            'confidentiality_exposure_percent' => max(0, 100 - $confidentialityPosture),
            'closure_risk_percent' => max(0, (int) round((100 - $resiliencePosture) * 0.35)),
            'resilience_posture_percent' => $resiliencePosture,
            'documentation_posture_percent' => $documentationPosture,
        ];
        $activeImpacts = [];

        foreach ($simulation['events'] ?? [] as $event) {
            if (($event['status'] ?? '') !== 'active') {
                continue;
            }

            $requiredControls = is_array($event['required_controls'] ?? null) ? $event['required_controls'] : [];
            $requiredEvidence = is_array($event['required_evidence'] ?? null) ? $event['required_evidence'] : [];
            $controlCoverage = $this->requiredControlCoverage($objects, $requiredControls);
            $evidenceCoverage = $this->requiredEvidenceCoverage($isms['evidence'] ?? [], $requiredEvidence);
            $mitigationPercent = (int) round(($controlCoverage * 0.7) + ($evidenceCoverage * 0.3));
            $impactFactor = max(0.35, 1 - ($mitigationPercent / 100 * 0.65));
            $impact = $this->eventImpact($event);

            $metrics['clinical_capacity_percent'] -= (int) round($impact['clinical_capacity_loss'] * $impactFactor);
            $metrics['ehr_availability_percent'] -= (int) round($impact['ehr_availability_loss'] * $impactFactor);
            $metrics['data_availability_percent'] -= (int) round($impact['data_availability_loss'] * $impactFactor);
            $metrics['patient_delay_minutes'] += (int) round($impact['patient_delay_minutes'] * $impactFactor);
            $metrics['confidentiality_exposure_percent'] += (int) round($impact['confidentiality_exposure'] * $impactFactor);
            $metrics['closure_risk_percent'] += (int) round($impact['closure_risk'] * $impactFactor);

            $activeImpacts[] = [
                'event_key' => (string) $event['event_key'],
                'object_key' => (string) $event['object_key'],
                'title' => (string) $event['title'],
                'severity' => (string) $event['severity'],
                'mitigation_percent' => $mitigationPercent,
                'summary' => $this->impactSummary($event, $mitigationPercent),
            ];
        }

        foreach (['clinical_capacity_percent', 'ehr_availability_percent', 'data_availability_percent'] as $key) {
            $metrics[$key] = max(0, min(100, $metrics[$key]));
        }

        foreach (['confidentiality_exposure_percent', 'closure_risk_percent'] as $key) {
            $metrics[$key] = max(0, min(100, $metrics[$key]));
        }

        return [
            ...$metrics,
            'status' => $this->operationalStatus($metrics),
            'active_impacts' => $activeImpacts,
        ];
    }

    /**
     * @param list<array<string,mixed>> $objects
     * @param list<string> $controlKeys
     */
    private function controlCoverage(array $objects, array $controlKeys): int
    {
        $total = 0;
        $enabled = 0;

        foreach ($controlKeys as $controlKey) {
            foreach ($objects as $object) {
                $allowed = $object['metadata']['controls'] ?? [];

                if (!is_array($allowed) || !in_array($controlKey, $allowed, true)) {
                    continue;
                }

                $total++;

                if ((bool) ($object['config'][$controlKey] ?? false)) {
                    $enabled++;
                }
            }
        }

        return $total > 0 ? (int) round(($enabled / $total) * 100) : 100;
    }

    /**
     * @param array<string,list<array<string,mixed>>> $isms
     */
    private function artifactCoverage(array $isms): int
    {
        $total = 0;
        $ready = 0;

        foreach ($isms['assets'] ?? [] as $asset) {
            $total++;
            $ready += (string) $asset['status'] === 'verified' ? 1 : 0;
        }

        foreach ($isms['risks'] ?? [] as $risk) {
            $total++;
            $ready += in_array((string) $risk['treatment_status'], ['treated', 'accepted'], true) ? 1 : 0;
        }

        foreach ($isms['evidence'] ?? [] as $evidence) {
            $total++;
            $ready += in_array((string) $evidence['status'], ['ready', 'reviewed'], true) ? 1 : 0;
        }

        return $total > 0 ? (int) round(($ready / $total) * 100) : 100;
    }

    /**
     * @param list<array<string,mixed>> $objects
     * @param list<string> $controlKeys
     */
    private function requiredControlCoverage(array $objects, array $controlKeys): int
    {
        if ($controlKeys === []) {
            return 100;
        }

        $enabled = 0;

        foreach ($controlKeys as $controlKey) {
            foreach ($objects as $object) {
                $allowed = $object['metadata']['controls'] ?? [];

                if (is_array($allowed) && in_array($controlKey, $allowed, true) && (bool) ($object['config'][$controlKey] ?? false)) {
                    $enabled++;
                    break;
                }
            }
        }

        return (int) round(($enabled / count($controlKeys)) * 100);
    }

    /**
     * @param list<array<string,mixed>> $evidenceItems
     * @param list<string> $evidenceKeys
     */
    private function requiredEvidenceCoverage(array $evidenceItems, array $evidenceKeys): int
    {
        if ($evidenceKeys === []) {
            return 100;
        }

        $ready = 0;

        foreach ($evidenceKeys as $evidenceKey) {
            foreach ($evidenceItems as $evidence) {
                if ((string) $evidence['evidence_key'] === $evidenceKey && in_array((string) $evidence['status'], ['ready', 'reviewed'], true)) {
                    $ready++;
                    break;
                }
            }
        }

        return (int) round(($ready / count($evidenceKeys)) * 100);
    }

    /**
     * @return array<string,int>
     */
    private function eventImpact(array $event): array
    {
        $defaults = [
            'clinical_capacity_loss' => 10,
            'ehr_availability_loss' => 10,
            'data_availability_loss' => 10,
            'patient_delay_minutes' => 30,
            'confidentiality_exposure' => 20,
            'closure_risk' => 15,
        ];
        $impact = is_array($event['impact'] ?? null) ? $event['impact'] : [];

        return array_map('intval', array_replace($defaults, array_intersect_key($impact, $defaults)));
    }

    /**
     * @param array<string,mixed> $event
     */
    private function impactSummary(array $event, int $mitigationPercent): string
    {
        $impact = trim((string) ($event['impact_summary'] ?? ''));

        if ($impact === '') {
            $impact = 'The office is operating under degraded conditions.';
        }

        return $impact . ' Current mitigation is ' . $mitigationPercent . '%.';
    }

    /**
     * @param array<string,int> $metrics
     */
    private function operationalStatus(array $metrics): string
    {
        if ($metrics['closure_risk_percent'] >= 70 || $metrics['clinical_capacity_percent'] < 45 || $metrics['data_availability_percent'] < 40) {
            return 'closure_risk';
        }

        if ($metrics['clinical_capacity_percent'] < 75 || $metrics['ehr_availability_percent'] < 75 || $metrics['data_availability_percent'] < 75) {
            return 'disrupted';
        }

        if ($metrics['confidentiality_exposure_percent'] >= 55 || $metrics['closure_risk_percent'] >= 35) {
            return 'watch';
        }

        return 'nominal';
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
