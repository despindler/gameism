<?php

declare(strict_types=1);

namespace Gameism\Game;

final class AuditScoringService
{
    /**
     * @param list<array<string,mixed>> $objects
     * @param array<string,list<array<string,mixed>>> $isms
     * @param array<string,mixed> $teaching
     * @return array<string,mixed>
     */
    public function evaluate(array $objects, array $isms = [], array $teaching = []): array
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
        $teachingScore = $this->evaluateTeaching($teaching, $totals, $earned, $findings);

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
                'teaching' => $teachingScore,
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
     * @param array<string,mixed> $teaching
     * @param array<string,int> $totals
     * @param array<string,int> $earned
     * @param list<array<string,mixed>> $findings
     * @return array<string,mixed>
     */
    private function evaluateTeaching(array $teaching, array &$totals, array &$earned, array &$findings): array
    {
        $score = [
            'incidents' => ['earned' => 0, 'total' => 0, 'percent' => 100],
            'corrective_actions' => ['earned' => 0, 'total' => 0, 'percent' => 100],
        ];

        foreach ($teaching['incidents'] ?? [] as $incident) {
            if ($incident['status'] === 'available') {
                continue;
            }

            $weights = ['resilience' => 2, 'audit' => 1];
            $points = $incident['status'] === 'resolved' ? 3 : 0;
            $this->applyArtifactPoints($weights, 3, $points, $totals, $earned, $score['incidents']);

            if ($incident['status'] === 'active') {
                $findings[] = [
                    'object_key' => $incident['object_key'],
                    'object_name' => $incident['title'],
                    'object_type' => 'incident',
                    'control_key' => 'incident_' . $incident['incident_key'],
                    'control_label' => 'Incident response',
                    'severity' => $incident['severity'] === 'major' ? 'major' : 'minor',
                    'title' => 'Timeline event is active and unresolved.',
                    'recommendation' => 'Complete and verify the linked corrective action before resolving the event.',
                    'primary_category' => 'resilience',
                ];
            }
        }

        foreach ($teaching['corrective_actions'] ?? [] as $action) {
            $weights = ['documentation' => 1, 'resilience' => 1, 'audit' => 2];
            $points = $this->statusPoints((string) $action['status'], [
                'open' => 0,
                'in_progress' => 1,
                'done' => 2,
                'verified' => 4,
            ]);
            $this->applyArtifactPoints($weights, 4, $points, $totals, $earned, $score['corrective_actions']);

            if ($points < 4) {
                $findings[] = [
                    'object_key' => $action['object_key'],
                    'object_name' => $action['title'],
                    'object_type' => 'corrective_action',
                    'control_key' => 'corrective_action_' . $action['action_key'],
                    'control_label' => 'Corrective action',
                    'severity' => $action['source_type'] === 'incident' ? 'major' : 'minor',
                    'title' => 'Corrective action is not verified.',
                    'recommendation' => 'Track the action through completion and verify effectiveness.',
                    'primary_category' => 'audit',
                ];
            } elseif ($action['verification_status'] !== 'effective') {
                $findings[] = [
                    'object_key' => $action['object_key'],
                    'object_name' => $action['title'],
                    'object_type' => 'corrective_action',
                    'control_key' => 'corrective_action_effectiveness_' . $action['action_key'],
                    'control_label' => 'Effectiveness check',
                    'severity' => 'minor',
                    'title' => 'Corrective action lacks an effective verification result.',
                    'recommendation' => 'Record whether the corrective action was effective after implementation.',
                    'primary_category' => 'audit',
                ];
            }
        }

        foreach ($score as $key => $value) {
            $score[$key]['percent'] = $value['total'] > 0
                ? (int) round(($value['earned'] / $value['total']) * 100)
                : 100;
        }

        return $score;
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
     * @param array<string,mixed> $operations
     * @param array<string,mixed> $timeline
     * @return array<string,mixed>
     */
    public function auditReport(array $evaluation, array $operations = [], array $timeline = []): array
    {
        $score = (int) ($evaluation['score']['overall']['percent'] ?? 0);
        $findings = $evaluation['findings'] ?? [];
        $operationalConsequences = $this->operationalConsequences($operations, $timeline);
        $majorCount = count(array_filter($findings, static fn (array $finding): bool => $finding['severity'] === 'major'))
            + count(array_filter($operationalConsequences, static fn (array $consequence): bool => $consequence['severity'] === 'major'));
        $minorCount = count(array_filter($findings, static fn (array $finding): bool => $finding['severity'] === 'minor'))
            + count(array_filter($operationalConsequences, static fn (array $consequence): bool => $consequence['severity'] === 'minor'));

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
            'operational_summary' => $this->operationalSummary($operations, $operationalConsequences),
            'operational_consequences' => $operationalConsequences,
            'created_at' => gmdate('c'),
        ];
    }

    /**
     * @param array<string,mixed> $operations
     * @param array<string,mixed> $timeline
     * @return list<array<string,mixed>>
     */
    private function operationalConsequences(array $operations, array $timeline): array
    {
        $consequences = [];
        $events = is_array($timeline['events'] ?? null) ? $timeline['events'] : [];

        foreach ($events as $event) {
            if (!is_array($event) || ($event['source_type'] ?? '') !== 'incident') {
                continue;
            }

            $active = ($event['status'] ?? '') === 'active';
            $severity = $active && $this->operationsAreMateriallyDegraded($operations, (string) ($event['severity'] ?? 'major'))
                ? 'major'
                : 'minor';

            $consequences[] = [
                'event_key' => (string) ($event['event_key'] ?? ''),
                'title' => (string) ($event['title'] ?? 'Operational event'),
                'status' => $active ? 'active' : 'resolved',
                'severity' => $severity,
                'summary' => $active
                    ? 'The event is still affecting clinical operations and must be contained before a clean audit result.'
                    : 'The event was resolved, but the auditor still samples the response record and effectiveness evidence.',
                'metrics' => [
                    'clinical_capacity_percent' => (int) ($operations['clinical_capacity_percent'] ?? 100),
                    'ehr_availability_percent' => (int) ($operations['ehr_availability_percent'] ?? 100),
                    'data_availability_percent' => (int) ($operations['data_availability_percent'] ?? 100),
                    'patient_delay_minutes' => (int) ($operations['patient_delay_minutes'] ?? 0),
                    'confidentiality_exposure_percent' => (int) ($operations['confidentiality_exposure_percent'] ?? 0),
                    'closure_risk_percent' => (int) ($operations['closure_risk_percent'] ?? 0),
                ],
            ];
        }

        return array_slice($consequences, 0, 5);
    }

    /**
     * @param array<string,mixed> $operations
     */
    private function operationsAreMateriallyDegraded(array $operations, string $eventSeverity): bool
    {
        return $eventSeverity === 'major'
            || (string) ($operations['status'] ?? 'nominal') !== 'nominal'
            || (int) ($operations['clinical_capacity_percent'] ?? 100) < 75
            || (int) ($operations['data_availability_percent'] ?? 100) < 75
            || (int) ($operations['patient_delay_minutes'] ?? 0) >= 60
            || (int) ($operations['closure_risk_percent'] ?? 0) >= 35;
    }

    /**
     * @param array<string,mixed> $operations
     * @param list<array<string,mixed>> $consequences
     */
    private function operationalSummary(array $operations, array $consequences): string
    {
        if ($consequences === []) {
            return 'No operational events were sampled in this audit run.';
        }

        $activeCount = count(array_filter($consequences, static fn (array $consequence): bool => $consequence['status'] === 'active'));
        $status = (string) ($operations['status'] ?? 'nominal');

        if ($activeCount > 0) {
            return sprintf(
                '%d active event%s sampled; current office function is %s.',
                $activeCount,
                $activeCount === 1 ? '' : 's',
                str_replace('_', ' ', $status)
            );
        }

        return 'Resolved event history was sampled for response evidence and effectiveness.';
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
