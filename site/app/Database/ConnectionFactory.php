<?php

declare(strict_types=1);

namespace Gameism\Database;

use Gameism\Config\Config;
use Gameism\Http\ApiException;
use PDO;
use PDOException;

final class ConnectionFactory
{
    private Config $config;
    private ?PDO $pdo = null;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function pdo(): PDO
    {
        if ($this->pdo instanceof PDO) {
            return $this->pdo;
        }

        if (!$this->config->databaseConfigured()) {
            throw new ApiException('DB_CONFIG_MISSING', 500, 'Database credentials are not configured.');
        }

        $database = $this->config->database();
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $database['host'],
            $database['port'],
            $database['database'],
            $database['charset']
        );

        try {
            $this->pdo = new PDO($dsn, $database['username'], $database['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $this->pdo->exec("SET time_zone = '+00:00'");

            return $this->pdo;
        } catch (PDOException $exception) {
            $details = $this->config->debug() ? ['driver_message' => $exception->getMessage()] : [];

            throw new ApiException('DB_CONNECTION_FAILED', 500, 'Database connection failed.', $details);
        }
    }
}

