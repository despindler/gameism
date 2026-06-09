<?php

declare(strict_types=1);

namespace Gameism\Controllers;

use Gameism\Auth\AuthService;
use Gameism\Game\GameStateService;
use Gameism\Http\Request;

final class GameController
{
    private AuthService $auth;
    private GameStateService $game;

    public function __construct(AuthService $auth, GameStateService $game)
    {
        $this->auth = $auth;
        $this->game = $game;
    }

    /**
     * @return array<string,mixed>
     */
    public function gameState(): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->stateForUser($user),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function configureObject(Request $request): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->configureObject(
                $user,
                $request->string('object_key'),
                $request->object('controls')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function updateIsmsItem(Request $request): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->updateIsmsItem(
                $user,
                $request->string('item_type'),
                $request->string('item_key'),
                $request->object('fields')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function startIncident(Request $request): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->startIncident(
                $user,
                $request->string('incident_key')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function resolveIncident(Request $request): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->resolveIncident(
                $user,
                $request->string('incident_key')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function updateCorrectiveAction(Request $request): array
    {
        $user = $this->auth->requireUser();

        return [
            'ok' => true,
            'game_state' => $this->game->updateCorrectiveAction(
                $user,
                $request->string('action_key'),
                $request->object('fields')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function runInternalAudit(): array
    {
        $user = $this->auth->requireUser();
        $result = $this->game->runInternalAudit($user);

        return [
            'ok' => true,
            'report' => $result['report'],
            'game_state' => $result['game_state'],
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function runAudit(): array
    {
        $user = $this->auth->requireUser();
        $result = $this->game->runAudit($user);

        return [
            'ok' => true,
            'report' => $result['report'],
            'game_state' => $result['game_state'],
        ];
    }
}
