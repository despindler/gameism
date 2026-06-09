<?php

declare(strict_types=1);

namespace Gameism\Http;

use Gameism\Config\Config;
use Throwable;

final class Router
{
    private Config $config;
    /** @var array<string,callable(Request):array<string,mixed>> */
    private array $routes = [];

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * @param callable(Request):array<string,mixed> $handler
     */
    public function add(string $method, string $path, callable $handler): void
    {
        $this->routes[strtoupper($method) . ' ' . $this->normalizePath($path)] = $handler;
    }

    public function dispatch(Request $request): void
    {
        try {
            $key = $request->method . ' ' . $this->normalizePath($request->path);

            if (!isset($this->routes[$key])) {
                throw new ApiException('ROUTE_NOT_FOUND', 404, 'The requested API route does not exist.');
            }

            $payload = ($this->routes[$key])($request);
            JsonResponse::send($payload);
        } catch (ApiException $exception) {
            JsonResponse::send([
                'ok' => false,
                'error_code' => $exception->apiCode(),
                'message' => $exception->getMessage(),
                'details' => $exception->details(),
            ], $exception->status());
        } catch (Throwable $exception) {
            $details = $this->config->debug() ? [
                'type' => $exception::class,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ] : [];

            JsonResponse::send([
                'ok' => false,
                'error_code' => 'INTERNAL_ERROR',
                'message' => 'The server could not complete the request.',
                'details' => $details,
            ], 500);
        }
    }

    private function normalizePath(string $path): string
    {
        $path = '/' . trim($path, '/');

        return $path === '/' ? '/' : rtrim($path, '/');
    }
}

