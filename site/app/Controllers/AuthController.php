<?php

declare(strict_types=1);

namespace Gameism\Controllers;

use Gameism\Auth\AuthService;
use Gameism\Config\Config;
use Gameism\Http\Request;

final class AuthController
{
    private AuthService $auth;
    private Config $config;

    public function __construct(AuthService $auth, Config $config)
    {
        $this->auth = $auth;
        $this->config = $config;
    }

    /**
     * @return array<string,mixed>
     */
    public function authConfig(): array
    {
        return [
            'ok' => true,
            'registration_enabled' => $this->config->allowRegistration(),
            'google_enabled' => false,
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function me(): array
    {
        return [
            'ok' => true,
            'user' => $this->auth->currentUser(),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function register(Request $request): array
    {
        return [
            'ok' => true,
            'user' => $this->auth->register(
                $request->string('username'),
                $request->string('password'),
                $request->string('display_name')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function login(Request $request): array
    {
        return [
            'ok' => true,
            'user' => $this->auth->login(
                $request->string('username'),
                $request->string('password')
            ),
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function logout(): array
    {
        $this->auth->logout();

        return ['ok' => true];
    }
}

