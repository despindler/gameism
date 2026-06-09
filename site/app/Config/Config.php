<?php

declare(strict_types=1);

namespace Gameism\Config;

final class Config
{
    private bool $envLoaded;

    public function __construct(bool $envLoaded)
    {
        $this->envLoaded = $envLoaded;
    }

    public static function fromEnvFile(string $path): self
    {
        return new self(Env::load($path));
    }

    public function envLoaded(): bool
    {
        return $this->envLoaded;
    }

    public function get(string $key, ?string $default = null): ?string
    {
        $value = getenv($key);

        if ($value === false) {
            return $default;
        }

        return (string) $value;
    }

    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->get($key);

        if ($value === null || $value === '') {
            return $default;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    public function int(string $key, int $default): int
    {
        $value = $this->get($key);

        if ($value === null || $value === '' || !is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    public function debug(): bool
    {
        return $this->bool('APP_DEBUG', false);
    }

    public function version(): string
    {
        return $this->get('APP_VERSION', '0.1.0') ?? '0.1.0';
    }

    public function allowRegistration(): bool
    {
        return $this->bool('APP_ALLOW_REGISTRATION', true);
    }

    public function sessionName(): string
    {
        return $this->get('SESSION_NAME', 'gameism_session') ?? 'gameism_session';
    }

    public function timezone(): string
    {
        return $this->get('APP_TIMEZONE', 'UTC') ?? 'UTC';
    }

    /**
     * @return array{host:string,port:int,database:string,username:string,password:string,charset:string}
     */
    public function database(): array
    {
        return [
            'host' => $this->get('DB_HOST', '') ?? '',
            'port' => $this->int('DB_PORT', 3306),
            'database' => $this->get('DB_DATABASE', '') ?? '',
            'username' => $this->get('DB_USERNAME', '') ?? '',
            'password' => $this->get('DB_PASSWORD', '') ?? '',
            'charset' => $this->get('DB_CHARSET', 'utf8mb4') ?? 'utf8mb4',
        ];
    }

    public function databaseConfigured(): bool
    {
        $database = $this->database();

        return $database['host'] !== ''
            && $database['database'] !== ''
            && $database['username'] !== '';
    }
}

