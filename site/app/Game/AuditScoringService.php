<?php

declare(strict_types=1);

namespace Gameism\Game;

final class AuditScoringService
{
    /**
     * @param list<array<string,mixed>> $objects
     * @return array<string,mixed>
     */
    public function evaluate(array $objects): array
    {
        $catalog = GameCatalog::controls();
        $totals = ['security' => 0, 'documentation' => 0, 'resilience' => 0, 'audit' => 0];
        $earned = ['security' => 0, 'documentation' => 0, 'resilience' => 0, 'audit' => 0];
        $findings = [];
        $objectScores = [];

        foreach ($objects as $object) {
            $allowedControls = $object['metadata']['controls'] ?? [];
            $configured = $object['config'] ?? [];
            $objectTotal = 0;
            $objectEarned = 0;

            foreach ($allowedControls as $controlKey) {
                if (!isset($catalog[$controlKey])) {
                    continue;
                }

                $control = $catalog[$controlKey];
                $enabled = (bool) ($configured[$controlKey] ?? false);

                foreach ($control['categories'] as $category => $weight) {
                    $weight = (int) $weight;
                    $totals[$category] += $weight;
                    $objectTotal += $weight;

                    if ($enabled) {
                        $earned[$category] += $weight;
                        $objectEarned += $weight;
                    }
                }

                if (!$enabled) {
                    $findings[] = [
                        'object_key' => $object['object_key'],
                        'object_name' => $object['display_name'],
                        'object_type' => $object['object_type'],
                        'control_key' => $controlKey,
                        'control_label' => $control['label'],
                        'severity' => $control['severity'],
                        'title' => $control['finding'],
                        'recommendation' => $control['recommendation'],
                        'primary_category' => array_key_first($control['categories']),
                    ];
                }
            }

            $objectScores[$object['object_key']] = [
                'earned' => $objectEarned,
                'total' => $objectTotal,
                'percent' => $objectTotal > 0 ? (int) round(($objectEarned / $objectTotal) * 100) : 100,
            ];
        }

        $categories = [];
        $totalEarned = 0;
        $totalPossible = 0;

        foreach ($totals as $category => $total) {
            $categoryEarned = $earned[$category];
            $categories[$category] = [
                'earned' => $categoryEarned,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($categoryEarned / $total) * 100) : 100,
            ];
            $totalEarned += $categoryEarned;
            $totalPossible += $total;
        }

        usort($findings, static function (array $a, array $b): int {
            $rank = ['major' => 0, 'minor' => 1];

            return ($rank[$a['severity']] ?? 9) <=> ($rank[$b['severity']] ?? 9)
                ?: strcmp($a['object_name'], $b['object_name']);
        });

        return [
            'score' => [
                'overall' => [
                    'earned' => $totalEarned,
                    'total' => $totalPossible,
                    'percent' => $totalPossible > 0 ? (int) round(($totalEarned / $totalPossible) * 100) : 100,
                ],
                'categories' => $categories,
            ],
            'findings' => $findings,
            'object_scores' => $objectScores,
        ];
    }

    /**
     * @param array<string,mixed> $evaluation
     * @return array<string,mixed>
     */
    public function auditReport(array $evaluation): array
    {
        $score = (int) ($evaluation['score']['overall']['percent'] ?? 0);
        $findings = $evaluation['findings'] ?? [];
        $majorCount = count(array_filter($findings, static fn (array $finding): bool => $finding['severity'] === 'major'));
        $minorCount = count(array_filter($findings, static fn (array $finding): bool => $finding['severity'] === 'minor'));

        $status = 'not_ready';
        if ($score >= 85 && $majorCount === 0) {
            $status = 'certification_recommended';
        } elseif ($score >= 65 && $majorCount <= 3) {
            $status = 'conditional';
        }

        return [
            'status' => $status,
            'overall_percent' => $score,
            'major_findings' => $majorCount,
            'minor_findings' => $minorCount,
            'summary' => $this->summaryFor($status),
            'sampled_findings' => array_slice($findings, 0, 8),
            'created_at' => gmdate('c'),
        ];
    }

    private function summaryFor(string $status): string
    {
        return match ($status) {
            'certification_recommended' => 'The simulated auditor found a coherent control and evidence baseline.',
            'conditional' => 'The simulated auditor would require corrective action before a clean recommendation.',
            default => 'The simulated auditor found material gaps in controls, evidence, or resilience.',
        };
    }
}

