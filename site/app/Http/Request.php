<?php

declare(strict_types=1);

namespace Gameism\Http;

final class Request
{
    public string $method;
    public string $path;
    /** @var array<string,mixed> */
    public array $query;
    /** @var array<string,mixed> */
    public array $body;

    /**
     * @param array<string,mixed> $query
     * @param array<string,mixed> $body
     */
    public function __construct(string $method, string $path, array $query, array $body)
    {
        $this->method = strtoupper($method);
        $this->path = self::normalizePath($path);
        $this->query = $query;
        $this->body = $body;
    }

    public static function fromGlobals(): self
    {
        $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        return new self($method, $path, $_GET, self::parseBody($method));
    }

    /**
     * @return array<string,mixed>
     */
    private static function parseBody(string $method): array
    {
        if (in_array(strtoupper($method), ['GET', 'HEAD'], true)) {
            return [];
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $raw = file_get_contents('php://input');

        if (str_contains(strtolower($contentType), 'application/json')) {
            if ($raw === false || trim($raw) === '') {
                return [];
            }

            $data = json_decode($raw, true);

            if (!is_array($data)) {
                throw new ApiException('INVALID_JSON', 400, 'The request body must contain valid JSON.');
            }

            return $data;
        }

        return $_POST;
    }

    private static function normalizePath(string $path): string
    {
        $path = '/' . trim($path, '/');

        return $path === '/' ? '/' : rtrim($path, '/');
    }

    public function string(string $key, string $default = ''): string
    {
        $value = $this->body[$key] ?? $default;

        return is_string($value) ? $value : $default;
    }

    /**
     * @return array<string,mixed>
     */
    public function object(string $key): array
    {
        if (!array_key_exists($key, $this->body)) {
            return [];
        }

        $value = $this->body[$key];

        if (!is_array($value) || ($value !== [] && array_is_list($value))) {
            throw new ApiException('INVALID_REQUEST_FIELD', 400, 'The request field must be a JSON object.', [
                'field' => $key,
            ]);
        }

        return $value;
    }
}
