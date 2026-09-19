import { SeverityLevel } from './index';

export type EngineRuleCode = 'RULE-ESC-04';

export type CaseEvaluationDataQuality = 'SUFFICIENT' | 'DATA_QUALITY_LIMITED' | 'NOT_APPLICABLE';

export type CaseEvidenceStatus =
  | 'EVIDENCE_PRESENT'
  | 'EVIDENCE_NOT_PRESENT'
  | 'NOT_APPLICABLE'
  | 'DATA_QUALITY_LIMITED';

export interface CaseExecutionGapEvaluation {
  caseId: string;
  sourceRecordId: string;
  submissionId: string;
  entityCode: string;
  entityId: string;
  severity: SeverityLevel;
  isApplicable: boolean;
  alertTimestamp: string;
  triageTimestamp: string | null;
  escalationTimestamp: string | null;
  escalationExpected: boolean;
  escalationObserved: boolean;
  hasExecutionGap: boolean;
  evidenceStatus: CaseEvidenceStatus;
  dataQualityStatus: CaseEvaluationDataQuality;
  reason: string;
  disposition: string | null;
  rawPayloadSnippet?: Record<string, unknown>;
}

export interface ExecutionGapSummary {
  ruleCode: 'RULE-ESC-04';
  ruleName: string;
  ruleDescription: string;
  ruleCategory: 'Execution Gap';
  targetSeverity: 'CRITICAL';
  
  // Deterministic aggregate metrics
  totalEvaluatedCases: number;
  applicableCaseCount: number;
  expectedCount: number;
  observedCount: number;
  gapCount: number;
  gapRate: number; // 0.0 - 100.0%
  dataQualityLimitedCount: number;
  
  // Evidence traceability linkage
  affectedCaseIds: string[];
  evidenceRecordIds: string[]; // sourceRecordIds supporting findings
  
  // Data quality safety
  overallDataQuality: 'SUFFICIENT' | 'DATA_QUALITY_LIMITED' | 'INSUFFICIENT_DATA';
  hasGaps: boolean;
  summaryStatement: string;
  warnings: string[];
  evaluatedAt: string;
}

export interface ExecutionGapResult {
  summary: ExecutionGapSummary;
  caseEvaluations: CaseExecutionGapEvaluation[];
}
