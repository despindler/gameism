<?php

declare(strict_types=1);

namespace Gameism;

use Gameism\Auth\AuthService;
use Gameism\Auth\SessionManager;
use Gameism\Config\Config;
use Gameism\Controllers\AuthController;
use Gameism\Controllers\GameController;
use Gameism\Controllers\HealthController;
use Gameism\Database\ConnectionFactory;
use Gameism\Game\AuditScoringService;
use Gameism\Game\GameStateService;
use Gameism\Http\Request;
use Gameism\Http\ApiException;
use Gameism\Http\JsonResponse;
use Gameism\Http\Router;

final class Application
{
    private Config $config;
    private Router $router;

    public function __construct(Config $config, Router $router)
    {
        $this->config = $config;
        $this->router = $router;
    }

    public static function create(string $envFile): self
    {
        $config = Config::fromEnvFile($envFile);
        date_default_timezone_set($config->timezone());

        $connections = new ConnectionFactory($config);
        $sessions = new SessionManager($config);
        $auth = new AuthService($connections, $sessions, $config);
        $game = new GameStateService($connections, new AuditScoringService());

        $healthController = new HealthController($config, $connections);
        $authController = new AuthController($auth, $config);
        $gameController = new GameController($auth, $game);

        $router = new Router($config);
        $router->add('GET', '/api/health', fn () => $healthController->health());
        $router->add('GET', '/api/auth-config', fn () => $authController->authConfig());
        $router->add('GET', '/api/me', fn () => $authController->me());
        $router->add('POST', '/api/register', fn (Request $request) => $authController->register($request));
        $router->add('POST', '/api/login', fn (Request $request) => $authController->login($request));
        $router->add('POST', '/api/logout', fn () => $authController->logout());
        $router->add('GET', '/api/game-state', fn () => $gameController->gameState());
        $router->add('POST', '/api/configure-object', fn (Request $request) => $gameController->configureObject($request));
        $router->add('POST', '/api/update-isms-item', fn (Request $request) => $gameController->updateIsmsItem($request));
        $router->add('POST', '/api/start-incident', fn (Request $request) => $gameController->startIncident($request));
        $router->add('POST', '/api/resolve-incident', fn (Request $request) => $gameController->resolveIncident($request));
        $router->add('POST', '/api/update-corrective-action', fn (Request $request) => $gameController->updateCorrectiveAction($request));
        $router->add('POST', '/api/run-audit', fn () => $gameController->runAudit());

        return new self($config, $router);
    }

    public function handle(): void
    {
        try {
            $request = Request::fromGlobals();
        } catch (ApiException $exception) {
            JsonResponse::send([
                'ok' => false,
                'error_code' => $exception->apiCode(),
                'message' => $exception->getMessage(),
                'details' => $exception->details(),
            ], $exception->status());
            return;
        }

        if (str_starts_with($request->path, '/api/')) {
            $this->router->dispatch($request);
            return;
        }

        $this->renderAppShell();
    }

    private function renderAppShell(): void
    {
        $version = htmlspecialchars($this->config->version(), ENT_QUOTES, 'UTF-8');
        require __DIR__ . '/Views/shell.php';
    }
}
