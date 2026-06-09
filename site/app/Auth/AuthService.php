<?php

declare(strict_types=1);

namespace Gameism\Auth;

use Gameism\Config\Config;
use Gameism\Database\ConnectionFactory;
use Gameism\Http\ApiException;
use PDO;
use PDOException;

final class AuthService
{
    private ConnectionFactory $connections;
    private SessionManager $sessions;
    private Config $config;

    public function __construct(ConnectionFactory $connections, SessionManager $sessions, Config $config)
    {
        $this->connections = $connections;
        $this->sessions = $sessions;
        $this->config = $config;
    }

    /**
     * @return array{id:int,username:string,display_name:string,role:string}|null
     */
    public function currentUser(): ?array
    {
        $this->sessions->start();
        $userId = $_SESSION['user_id'] ?? null;

        if (!is_int($userId) && !ctype_digit((string) $userId)) {
            return null;
        }

        return $this->loadUser((int) $userId);
    }

    /**
     * @return array{id:int,username:string,display_name:string,role:string}
     */
    public function requireUser(): array
    {
        $user = $this->currentUser();

        if ($user === null) {
            throw new ApiException('AUTH_REQUIRED', 401, 'You must sign in first.');
        }

        return $user;
    }

    /**
     * @return array{id:int,username:string,display_name:string,role:string}
     */
    public function register(string $username, string $password, string $displayName): array
    {
        if (!$this->config->allowRegistration()) {
            throw new ApiException('REGISTRATION_DISABLED', 403, 'Registration is disabled for this deployment.');
        }

        $username = $this->normalizeUsername($username);
        $displayName = trim($displayName) !== '' ? trim($displayName) : $username;
        $this->validatePassword($password);

        $pdo = $this->connections->pdo();
        $role = $this->userCount($pdo) === 0 ? 'admin' : 'player';
        $hash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $statement = $pdo->prepare(
                'INSERT INTO users (username, password_hash, display_name, role) VALUES (:username, :password_hash, :display_name, :role)'
            );
            $statement->execute([
                'username' => $username,
                'password_hash' => $hash,
                'display_name' => $displayName,
                'role' => $role,
            ]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                throw new ApiException('USERNAME_TAKEN', 409, 'That username is already registered.');
            }

            throw $exception;
        }

        $user = $this->loadUser((int) $pdo->lastInsertId());

        if ($user === null) {
            throw new ApiException('USER_CREATE_FAILED', 500, 'The user could not be loaded after registration.');
        }

        $this->signInUser($user['id']);

        return $user;
    }

    /**
     * @return array{id:int,username:string,display_name:string,role:string}
     */
    public function login(string $username, string $password): array
    {
        $username = $this->normalizeUsername($username);
        $pdo = $this->connections->pdo();
        $statement = $pdo->prepare('SELECT id, username, password_hash, display_name, role FROM users WHERE username = :username LIMIT 1');
        $statement->execute(['username' => $username]);
        $record = $statement->fetch();

        if (!is_array($record) || !password_verify($password, (string) $record['password_hash'])) {
            throw new ApiException('INVALID_CREDENTIALS', 401, 'The username or password is incorrect.');
        }

        $user = [
            'id' => (int) $record['id'],
            'username' => (string) $record['username'],
            'display_name' => (string) $record['display_name'],
            'role' => (string) $record['role'],
        ];

        $this->signInUser($user['id']);

        return $user;
    }

    public function logout(): void
    {
        $this->sessions->destroy();
    }

    private function signInUser(int $userId): void
    {
        $this->sessions->start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    /**
     * @return array{id:int,username:string,display_name:string,role:string}|null
     */
    private function loadUser(int $id): ?array
    {
        $pdo = $this->connections->pdo();
        $statement = $pdo->prepare('SELECT id, username, display_name, role FROM users WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $record = $statement->fetch();

        if (!is_array($record)) {
            return null;
        }

        return [
            'id' => (int) $record['id'],
            'username' => (string) $record['username'],
            'display_name' => (string) $record['display_name'],
            'role' => (string) $record['role'],
        ];
    }

    private function normalizeUsername(string $username): string
    {
        $username = strtolower(trim($username));

        if (!preg_match('/^[a-z0-9_.@-]{3,64}$/', $username)) {
            throw new ApiException('INVALID_USERNAME', 400, 'Use 3-64 letters, numbers, dots, underscores, dashes, or @.');
        }

        return $username;
    }

    private function validatePassword(string $password): void
    {
        if (strlen($password) < 8) {
            throw new ApiException('WEAK_PASSWORD', 400, 'Use a password with at least 8 characters.');
        }
    }

    private function userCount(PDO $pdo): int
    {
        $statement = $pdo->query('SELECT COUNT(*) AS total FROM users');
        $record = $statement->fetch();

        return (int) ($record['total'] ?? 0);
    }
}

