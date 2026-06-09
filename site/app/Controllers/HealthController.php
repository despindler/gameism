<?php

declare(strict_types=1);

namespace Gameism\Controllers;

use Gameism\Config\Config;
use Gameism\Database\ConnectionFactory;

final class HealthController
{
    private Config $config;
    private ConnectionFactory $connections;

    public function __construct(Config $config, ConnectionFactory $connections)
    {
        $this->config = $config;
        $this->connections = $connections;
    }

    /**
     * @return array<string,mixed>
     */
    public function health(): array
    {
        $storage = 'not_configured';

        if ($this->config->databaseConfigured()) {
            $pdo = $this->connections->pdo();
            $pdo->query('SELECT 1');
            $storage = 'ok';
        }

        return [
            'ok' => true,
            'app' => 'gameism-isms-office',
            'version' => $this->config->version(),
            'env_loaded' => $this->config->envLoaded(),
            'storage' => $storage,
            'time' => gmdate('c'),
        ];
    }
}

