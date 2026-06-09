<?php

declare(strict_types=1);

if (PHP_SAPI === 'cli-server') {
    $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $file = __DIR__ . $path;

    if (str_starts_with($path, '/assets/') && is_file($file)) {
        return false;
    }

    if ($path !== '/' && is_file($file)) {
        http_response_code(404);
        return true;
    }
}

require __DIR__ . '/app/bootstrap.php';

$app = Gameism\Application::create(__DIR__ . '/.env');
$app->handle();
