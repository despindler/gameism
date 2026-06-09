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
        $evaluation = $this->scoring->evaluate($objects);

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
     * @return array<string,mixed>
     */
    public function runAudit(array $user): array
    {
        $repository = $this->repository();
        $repository->ensureInitialized($user['id']);
        $objects = $repository->objects($user['id']);
        $evaluation = $this->scoring->evaluate($objects);
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

