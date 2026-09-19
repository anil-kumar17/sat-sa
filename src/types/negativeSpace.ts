import { SeverityLevel } from './index';

export type NegativeSpaceRuleCode = 'RULE-NS-ESC-01';

export type NegativeSpaceClassification =
  | 'EVIDENCE_PRESENT'
  | 'EVIDENCE_NOT_PRESENT'
  | 'DATA_QUALITY_LIMITED'
  | 'NOT_APPLICABLE'
  | 'INCONCLUSIVE';

export interface CaseNegativeSpaceEvaluation {
  caseId: string;
  sourceRecordId: string;
  submissionId: string;
  entityCode: string;
  entityId: string;
  severity: SeverityLevel | string;
  classification: NegativeSpaceClassification;
  isApplicable: boolean;
  alertTimestamp: string;
  triageTimestamp: string | null;
  escalationTimestamp: string | null;
  closureTimestamp?: string | null;
  disposition: string | null;

  // Gate evaluation tracking
  passedCompletenessGate: boolean;
  passedObservationWindowGate: boolean;
  quietPeriodNote?: string;

  reason: string;
  rawPayloadSnippet?: Record<string, unknown>;
}

export interface NegativeSpaceResult {
  ruleCode: NegativeSpaceRuleCode;
  ruleName: string;
  ruleDescription: string;
  ruleCategory: 'Negative Space';
  submissionId: string;
  entityId: string;
  entityCode: string;
  assessmentPeriod: string;

  // Aggregate metrics
  totalEvaluatedCases: number;
  applicableCaseCount: number;
  expectedEvidenceCount: number; // Valid cases expecting evidence (evidencePresentCount + absentEvidenceCount)
  observedEvidenceCount: number; // Cases with evidence present
  absentEvidenceCount: number;   // Cases with evidence not present
  absenceRate: number;           // absentEvidenceCount / expectedEvidenceCount * 100

  evidencePresentCount: number;
  dataQualityLimitedCount: number;
  notApplicableCount: number;
  inconclusiveCount: number;

  // Traceability linkage
  affectedCaseIds: string[];    // Cases with EVIDENCE_NOT_PRESENT
  sourceRecordIds: string[];    // sourceRecordIds for EVIDENCE_NOT_PRESENT cases

  warnings: string[];
  interpretation: string;
  evaluatedAt: string;

  caseEvaluations: CaseNegativeSpaceEvaluation[];
}
