<?php

declare(strict_types=1);

namespace Gameism\Http;

use RuntimeException;

final class ApiException extends RuntimeException
{
    private string $apiCode;
    private int $status;
    /** @var array<string,mixed> */
    private array $details;

    /**
     * @param array<string,mixed> $details
     */
    public function __construct(string $apiCode, int $status, string $message, array $details = [])
    {
        parent::__construct($message);
        $this->apiCode = $apiCode;
        $this->status = $status;
        $this->details = $details;
    }

    public function apiCode(): string
    {
        return $this->apiCode;
    }

    public function status(): int
    {
        return $this->status;
    }

    /**
     * @return array<string,mixed>
     */
    public function details(): array
    {
        return $this->details;
    }
}

