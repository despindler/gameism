<?php

declare(strict_types=1);

namespace Gameism\Game;

final class AuditScoringService
{
    /**
     * @param list<array<string,mixed>> $objects
     * @param array<string,list<array<string,mixed>>> $isms
     * @return array<string,mixed>
     */
    public function evaluate(array $objects, array $isms = []): array
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

        $artifactScore = $this->evaluateArtifacts($isms, $totals, $earned, $findings);

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
                'artifacts' => $artifactScore,
            ],
            'findings' => $findings,
            'object_scores' => $objectScores,
        ];
    }

    /**
     * @param array<string,list<array<string,mixed>>> $isms
     * @param array<string,int> $totals
     * @param array<string,int> $earned
     * @param list<array<string,mixed>> $findings
     * @return array<string,mixed>
     */
    private function evaluateArtifacts(array $isms, array &$totals, array &$earned, array &$findings): array
    {
        $artifactTotals = [
            'assets' => ['earned' => 0, 'total' => 0],
            'risks' => ['earned' => 0, 'total' => 0],
            'evidence' => ['earned' => 0, 'total' => 0],
        ];

        foreach ($isms['assets'] ?? [] as $asset) {
            $weights = ['documentation' => 2, 'audit' => 1];
            $points = $this->statusPoints((string) $asset['status'], ['draft' => 1, 'verified' => 3]);
            $this->applyArtifactPoints($weights, 3, $points, $totals, $earned, $artifactTotals['assets']);

            if ($points < 3) {
                $criticality = (string) $asset['criticality'];
                $findings[] = [
                    'object_key' => $asset['object_key'],
                    'object_name' => $asset['name'],
                    'object_type' => 'asset_inventory',
                    'control_key' => 'asset_inventory_' . $asset['asset_key'],
                    'control_label' => 'Asset inventory',
                    'severity' => $criticality === 'high' ? 'major' : 'minor',
                    'title' => 'Asset inventory item is not verified.',
                    'recommendation' => 'Verify owner, classification, criticality, and relationship to the office asset.',
                    'primary_category' => 'documentation',
                ];
            }
        }

        foreach ($isms['risks'] ?? [] as $risk) {
            $weights = ['documentation' => 2, 'resilience' => 1, 'audit' => 2];
            $points = $this->statusPoints((string) $risk['treatment_status'], [
                'identified' => 0,
                'assessed' => 2,
                'treated' => 5,
                'accepted' => 5,
            ]);
            $this->applyArtifactPoints($weights, 5, $points, $totals, $earned, $artifactTotals['risks']);

            if ($points < 5) {
                $findings[] = [
                    'object_key' => $risk['object_key'],
                    'object_name' => $risk['title'],
                    'object_type' => 'risk_register',
                    'control_key' => 'risk_register_' . $risk['risk_key'],
                    'control_label' => 'Risk treatment',
                    'severity' => ((int) $risk['impact']) >= 4 ? 'major' : 'minor',
                    'title' => 'Risk treatment is incomplete.',
                    'recommendation' => 'Assess the risk, choose a treatment, record the owner, and keep treatment evidence.',
                    'primary_category' => 'resilience',
                ];
            }
        }

        foreach ($isms['evidence'] ?? [] as $evidence) {
            $weights = ['documentation' => 2, 'audit' => 3];
            $points = $this->statusPoints((string) $evidence['status'], [
                'missing' => 0,
                'draft' => 2,
                'ready' => 5,
                'reviewed' => 5,
            ]);
            $this->applyArtifactPoints($weights, 5, $points, $totals, $earned, $artifactTotals['evidence']);

            if ($points < 5) {
                $findings[] = [
                    'object_key' => $evidence['object_key'],
                    'object_name' => $evidence['title'],
                    'object_type' => 'evidence',
                    'control_key' => 'evidence_' . $evidence['evidence_key'],
                    'control_label' => 'Audit evidence',
                    'severity' => $points === 0 ? 'major' : 'minor',
                    'title' => 'Audit evidence is not ready.',
                    'recommendation' => 'Prepare the expected evidence and mark it ready only when an auditor could verify it.',
                    'primary_category' => 'audit',
                ];
            }
        }

        foreach ($artifactTotals as $key => $score) {
            $artifactTotals[$key]['percent'] = $score['total'] > 0
                ? (int) round(($score['earned'] / $score['total']) * 100)
                : 100;
        }

        return $artifactTotals;
    }

    /**
     * @param array<string,int> $mapping
     */
    private function statusPoints(string $status, array $mapping): int
    {
        return $mapping[$status] ?? 0;
    }

    /**
     * @param array<string,int> $weights
     * @param array<string,int> $totals
     * @param array<string,int> $earned
     * @param array<string,int> $artifactTotal
     */
    private function applyArtifactPoints(array $weights, int $maxPoints, int $points, array &$totals, array &$earned, array &$artifactTotal): void
    {
        foreach ($weights as $category => $weight) {
            $totals[$category] += $weight;
            $categoryEarned = (int) round($weight * ($points / $maxPoints));
            $earned[$category] += $categoryEarned;
            $artifactTotal['total'] += $weight;
            $artifactTotal['earned'] += $categoryEarned;
        }
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
