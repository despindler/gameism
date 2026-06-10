<?php

declare(strict_types=1);

namespace Gameism\Http;

final class JsonResponse
{
    /**
     * @param array<string,mixed> $payload
     */
    public static function send(array $payload, int $status = 200): void
    {
        http_response_code($status);
        SecurityHeaders::send();
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    }
}
