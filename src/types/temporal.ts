import { SeverityLevel } from './index';

export type TemporalRuleCode = 'RULE-TEMP-01';

export type TemporalClassification =
  | 'NORMAL'
  | 'TIMING_DEVIATION'
  | 'DATA_QUALITY_LIMITED'
  | 'INCONCLUSIVE'
  | 'NOT_APPLICABLE';

export type TemporalMetricType =
  | 'TRIAGE_DURATION'
  | 'ESCALATION_DELAY'
  | 'SUPERVISOR_REVIEW_DELAY'
  | 'CLOSURE_ELAPSED_TIME';

export interface TemporalMetricObservation {
  metricType: TemporalMetricType;
  valueSeconds: number;
  baselineMedianSeconds: number | null;
  baselineMadSeconds: number | null;
  deviationRatio: number | null;
  sourceRecordId: string;
}

export interface CaseTemporalEvaluation {
  caseId: string;
  sourceRecordId: string;
  submissionId: string;
  entityCode: string;
  entityId: string;
  severity: SeverityLevel;

  classification: TemporalClassification;

  triageDurationSeconds: number | null;
  escalationDelaySeconds: number | null;
  supervisorReviewDelaySeconds: number | null;
  closureElapsedSeconds: number | null;

  deviationMetric: TemporalMetricType | null;
  deviationSeconds: number | null;
  deviationRatio: number | null;

  baselineAvailable: boolean;
  passedDataQualityGate: boolean;

  reason: string;
  disposition: string | null;

  rawPayloadSnippet?: Record<string, unknown>;
}

export interface TemporalBaselineMetric {
  metricType: TemporalMetricType;

  sampleCount: number;

  medianSeconds: number | null;
  madSeconds: number | null;

  minimumSeconds: number | null;
  maximumSeconds: number | null;

  deviationThresholdSeconds: number | null;
}

export interface TemporalBaseline {
  entityId: string;
  entityCode: string;
  assessmentPeriod: string;

  metrics: TemporalBaselineMetric[];

  baselineRecordCount: number;
  usableRecordCount: number;

  warnings: string[];
}

export interface TemporalAnalyticsSummary {
  ruleCode: TemporalRuleCode;
  ruleName: string;
  ruleDescription: string;
  ruleCategory: 'Behavioural / Temporal';

  totalEvaluatedCases: number;
  applicableCaseCount: number;

  timingDeviationCount: number;
  normalCaseCount: number;
  dataQualityLimitedCount: number;
  inconclusiveCount: number;
  notApplicableCount: number;

  deviationRate: number;

  baselineAvailable: boolean;
  baselineRecordCount: number;

  affectedCaseIds: string[];
  sourceRecordIds: string[];

  warnings: string[];
  interpretation: string;

  evaluatedAt: string;
}

export interface TemporalAnalyticsResult {
  summary: TemporalAnalyticsSummary;
  baseline: TemporalBaseline;
  caseEvaluations: CaseTemporalEvaluation[];
}