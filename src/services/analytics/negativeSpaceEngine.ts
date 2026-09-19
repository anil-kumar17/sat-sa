/**
 * SAT-SA Deterministic Negative Space Analysis Engine
 * 
 * Rule: RULE-NS-ESC-01 — Expected Escalation Evidence Absence
 * 
 * Purpose:
 * Pure deterministic calculation engine that identifies applicable critical
 * operational cases where expected escalation evidence is absent from submitted
 * records, while strictly accounting for applicability, completeness, and
 * observation window validity.
 * 
 * CORE SUPERVISORY PRINCIPLE:
 * ABSENCE OF EVIDENCE ≠ PROOF THAT THE ACTIVITY DID NOT OCCUR.
 * 
 * The engine must explicitly distinguish:
 * 1. EVIDENCE_PRESENT
 * 2. EVIDENCE_NOT_PRESENT
 * 3. DATA_QUALITY_LIMITED
 * 4. NOT_APPLICABLE
 * 5. INCONCLUSIVE
 * 
 * The engine must NEVER automatically claim misconduct, negligence, compromise,
 * or confirmed control failure.
 * 
 * EVALUATION PIPELINE:
 * Expected activity → Applicability → Submission completeness → Observation validity → Evidence availability → Negative-space classification
 */

import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport
} from '../../types/submission';
import {
  NegativeSpaceResult,
  CaseNegativeSpaceEvaluation,
  NegativeSpaceClassification
} from '../../types/negativeSpace';

export const RULE_NS_ESC_01_METADATA = {
  ruleCode: 'RULE-NS-ESC-01' as const,
  ruleName: 'Expected Escalation Evidence Absence',
  ruleDescription:
    'Identifies applicable critical operational cases where escalation evidence is not present in the submitted observation set, while accounting for data quality, completeness, and observation window boundaries.',
  ruleCategory: 'Negative Space' as const,
  targetSeverity: 'CRITICAL' as const
};

/**
 * Helper to test whether an alert timestamp falls within an assessment period
 * format like "YYYY-Q1" | "YYYY-Q2" | "YYYY-Q3" | "YYYY-Q4" or "YYYY".
 */
export function isTimestampInObservationWindow(
  timestampStr: string,
  periodStr?: string | null
): { inWindow: boolean; reason?: string } {
  if (!periodStr || periodStr.trim() === '') {
    return {
      inWindow: false,
      reason: 'Observation window cannot be verified: assessment period metadata is missing in submitted data.'
    };
  }

  const d = new Date(timestampStr);
  if (isNaN(d.getTime())) {
    return {
      inWindow: false,
      reason: `Malformed timestamp "${timestampStr}" prevents observation window verification.`
    };
  }

  const cleanPeriod = periodStr.trim().toUpperCase();

  // Pattern: YYYY-Q# (e.g. 2026-Q3, 2025-Q1)
  const quarterMatch = cleanPeriod.match(/^(\d{4})[-_ ]?Q([1-4])$/);
  if (quarterMatch) {
    const periodYear = parseInt(quarterMatch[1], 10);
    const periodQuarter = parseInt(quarterMatch[2], 10);

    const recordYear = d.getUTCFullYear();
    const recordMonth = d.getUTCMonth() + 1; // 1-12
    const recordQuarter = Math.ceil(recordMonth / 3);

    if (recordYear !== periodYear || recordQuarter !== periodQuarter) {
      return {
        inWindow: false,
        reason: `Record timestamp (${timestampStr.substring(0, 10)}) falls outside assessment observation window (${cleanPeriod}). Recorded in ${recordYear}-Q${recordQuarter}.`
      };
    }
    return { inWindow: true };
  }

  // Pattern: YYYY (annual cycle)
  const yearMatch = cleanPeriod.match(/^(\d{4})$/);
  if (yearMatch) {
    const periodYear = parseInt(yearMatch[1], 10);
    const recordYear = d.getUTCFullYear();
    if (recordYear !== periodYear) {
      return {
        inWindow: false,
        reason: `Record timestamp year (${recordYear}) falls outside assessment observation window year (${periodYear}).`
      };
    }
    return { inWindow: true };
  }

  // Fallback: If format is custom/unknown (e.g. "Cycle 14"), we cannot formally disprove window
  return { inWindow: true };
}

/**
 * Pure deterministic calculation engine for Negative Space Analysis.
 * Evaluates submitted operational records under RULE-NS-ESC-01.
 * 
 * @param records Normalized case records from CSE operational submission
 * @param submission Optional submission metadata (for period and completeness context)
 * @param qualityReport Optional data quality report (for error-level issues)
 * @returns Fully audited NegativeSpaceResult with case-by-case and aggregate metrics
 */
export function calculateNegativeSpace(
  records: NormalizedCaseRecord[],
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): NegativeSpaceResult {
  const evaluatedAt = new Date().toISOString();
  const warnings: string[] = [];

  // Default quiet-period context warning (never invent maintenance periods)
  warnings.push('Quiet-period context unavailable in submitted data.');

  // Check overall submission quality state
  const isSubmissionQualityRejected =
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID';

  const isLowCompleteness =
    submission?.completenessPercentage !== undefined &&
    submission.completenessPercentage < 40;

  if (isSubmissionQualityRejected) {
    warnings.push(
      'Submission data quality status is marked REJECTED/INVALID. Negative-space observations are constrained by compromised source integrity.'
    );
  } else if (isLowCompleteness) {
    warnings.push(
      `Submission completeness (${submission?.completenessPercentage}%) is below supervisory threshold. Observation validity may be limited.`
    );
  }

  // Build lookup of cases with ERROR-severity data quality issues
  const casesWithQualityErrors = new Set<string>();
  if (qualityReport?.issues) {
    for (const issue of qualityReport.issues) {
      if (issue.severity === 'ERROR' && issue.caseId) {
        casesWithQualityErrors.add(issue.caseId);
      }
    }
  }

  const assessmentPeriod = submission?.assessmentPeriod || (records.length > 0 ? records[0].assessmentPeriod : 'UNKNOWN_PERIOD');
  const submissionId = submission?.submissionId || (records.length > 0 ? records[0].submissionId : 'UNKNOWN_SUBMISSION');
  const entityId = submission?.entityId || (records.length > 0 ? records[0].entityId : 'UNKNOWN_ENTITY');
  const entityCode = submission?.entityCode || (records.length > 0 ? records[0].entityCode : 'CSE-UNKNOWN');

  const caseEvaluations: CaseNegativeSpaceEvaluation[] = [];

  for (const record of records) {
    // -------------------------------------------------------------
    // GATE 1: APPLICABILITY GATE
    // -------------------------------------------------------------
    // RULE-NS-ESC-01 strictly applies to CRITICAL cases.
    // Non-critical cases are classified as NOT_APPLICABLE.
    // Do NOT infer applicability from missing evidence.
    const isCritical = record.severity === 'CRITICAL';

    if (!isCritical) {
      caseEvaluations.push({
        caseId: record.caseId || 'UNKNOWN_CASE',
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: record.severity,
        classification: 'NOT_APPLICABLE',
        isApplicable: false,
        alertTimestamp: record.alertTimestamp || '',
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: false,
        passedObservationWindowGate: false,
        reason: `Severity is ${record.severity}; RULE-NS-ESC-01 applies exclusively to CRITICAL operational cases.`,
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // -------------------------------------------------------------
    // GATE 2: SUBMISSION COMPLETENESS GATE
    // -------------------------------------------------------------
    // Mandatory check: Before classifying a missing escalation event as negative space,
    // determine whether the submitted record contains enough information to make that observation meaningful.
    const hasIdentifier = Boolean(record.caseId && record.caseId.trim().length > 0);
    const hasValidAlertTimestamp = Boolean(
      record.alertTimestamp && !isNaN(Date.parse(record.alertTimestamp))
    );
    const hasDataQualityError = casesWithQualityErrors.has(record.caseId);
    const hasIncompleteSubmissionState =
      record.evidencePresence?.escalationEvidence === 'INCOMPLETE_SUBMISSION';

    if (!hasIdentifier || !hasValidAlertTimestamp || hasDataQualityError || hasIncompleteSubmissionState || isSubmissionQualityRejected) {
      caseEvaluations.push({
        caseId: record.caseId || 'UNKNOWN_CASE',
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        classification: 'DATA_QUALITY_LIMITED',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp || '',
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: false,
        passedObservationWindowGate: false,
        reason: 'Negative-space assessment limited by incomplete source fields or severe data-quality defect. Cannot establish evidence baseline.',
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // -------------------------------------------------------------
    // GATE 3: OBSERVATION VALIDITY GATE (Window & Quiet/Maintenance Periods)
    // -------------------------------------------------------------
    // Check 3A: Observation Window
    const windowCheck = isTimestampInObservationWindow(
      record.alertTimestamp,
      assessmentPeriod !== 'UNKNOWN_PERIOD' ? assessmentPeriod : undefined
    );

    if (!windowCheck.inWindow) {
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        classification: 'INCONCLUSIVE',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: true,
        passedObservationWindowGate: false,
        reason: windowCheck.reason || 'Record falls outside observation window. Observation validity cannot be confirmed.',
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // Check 3B: Explicit Quiet / Maintenance Period Indicators
    // If the record explicitly references maintenance activity, check if quiet-period protocol logs were provided.
    // If quiet-period context is unavailable, classify as INCONCLUSIVE.
    const dispositionUpper = (record.disposition || '').toUpperCase();
    const isExplicitMaintenance =
      dispositionUpper.includes('MAINTENANCE') ||
      Boolean((record.sourcePayload as Record<string, unknown> | undefined)?.maintenance_mode);

    if (isExplicitMaintenance) {
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        classification: 'INCONCLUSIVE',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: true,
        passedObservationWindowGate: true,
        quietPeriodNote: 'Quiet-period context unavailable in submitted data.',
        reason: `Record references maintenance activity (${record.disposition}), but explicit quiet-period protocol logs/exemptions are unavailable in submitted data. Evidence absence is inconclusive.`,
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // -------------------------------------------------------------
    // GATE 4: EVIDENCE AVAILABILITY GATE
    // -------------------------------------------------------------
    // Case is CRITICAL, passed completeness, and within verified observation window.
    const hasEscalationEvidence = Boolean(
      record.escalationRecorded ||
      (record.escalationTimestamp && record.escalationTimestamp.trim() !== '') ||
      record.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT'
    );

    if (hasEscalationEvidence) {
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        classification: 'EVIDENCE_PRESENT',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: true,
        passedObservationWindowGate: true,
        reason: 'Required escalation evidence is present in submitted observation set.',
        rawPayloadSnippet: record.sourcePayload
      });
    } else {
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        classification: 'EVIDENCE_NOT_PRESENT',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: null,
        closureTimestamp: record.closureTimestamp,
        disposition: record.disposition,
        passedCompletenessGate: true,
        passedObservationWindowGate: true,
        reason: 'Expected escalation evidence was not present in submitted observation set for applicable critical case. Potential evidence blind spot requiring supervisory review.',
        rawPayloadSnippet: record.sourcePayload
      });
    }
  }

  // -------------------------------------------------------------
  // AGGREGATE CALCULATIONS & SAFEGUARDS
  // -------------------------------------------------------------
  const totalEvaluatedCases = records.length;
  const applicableCaseCount = caseEvaluations.filter(c => c.severity === 'CRITICAL').length;

  const evidencePresentCount = caseEvaluations.filter(c => c.classification === 'EVIDENCE_PRESENT').length;
  const absentEvidenceCount = caseEvaluations.filter(c => c.classification === 'EVIDENCE_NOT_PRESENT').length;
  const dataQualityLimitedCount = caseEvaluations.filter(c => c.classification === 'DATA_QUALITY_LIMITED').length;
  const notApplicableCount = caseEvaluations.filter(c => c.classification === 'NOT_APPLICABLE').length;
  const inconclusiveCount = caseEvaluations.filter(c => c.classification === 'INCONCLUSIVE').length;

  // The valid expected evidence denominator includes ONLY applicable cases that passed
  // the completeness gate and observation validity gate.
  // DATA_QUALITY_LIMITED and INCONCLUSIVE cases are excluded from the denominator.
  const expectedEvidenceCount = evidencePresentCount + absentEvidenceCount;
  const observedEvidenceCount = evidencePresentCount;

  // Absence rate: absentEvidenceCount / expectedEvidenceCount * 100
  const absenceRate =
    expectedEvidenceCount === 0
      ? 0
      : Math.round((absentEvidenceCount / expectedEvidenceCount) * 1000) / 10;

  // Traceability: Only EVIDENCE_NOT_PRESENT cases are listed as affected
  const affectedCases = caseEvaluations.filter(c => c.classification === 'EVIDENCE_NOT_PRESENT');
  const affectedCaseIds = affectedCases.map(c => c.caseId);
  const sourceRecordIds = affectedCases.map(c => c.sourceRecordId);

  // Additional warnings if limitations exist
  if (dataQualityLimitedCount > 0) {
    warnings.push(
      `${dataQualityLimitedCount} critical ${dataQualityLimitedCount === 1 ? 'case was' : 'cases were'} classified as DATA_QUALITY_LIMITED and excluded from the absence rate denominator to avoid false positive attribution.`
    );
  }
  if (inconclusiveCount > 0) {
    warnings.push(
      `${inconclusiveCount} critical ${inconclusiveCount === 1 ? 'case was' : 'cases were'} classified as INCONCLUSIVE due to observation window boundaries or maintenance context.`
    );
  }

  // Restrained supervisory interpretation
  let interpretation: string;
  if (expectedEvidenceCount === 0) {
    interpretation =
      'No valid applicable critical cases with verifiable observation windows were found in the submitted observation set. Escalation evidence absence rate is 0.0%.';
  } else if (absentEvidenceCount === 0) {
    interpretation = `Escalation evidence was present for all ${expectedEvidenceCount} valid applicable critical cases in the submitted observation set. No evidence blind spots identified for RULE-NS-ESC-01.`;
  } else {
    interpretation = `Escalation evidence was not present for ${absentEvidenceCount} of ${expectedEvidenceCount} applicable cases in the submitted observation set (${absenceRate}% absence rate). This indicates a potential evidence blind spot and requires supervisory review.`;
  }

  return {
    ruleCode: RULE_NS_ESC_01_METADATA.ruleCode,
    ruleName: RULE_NS_ESC_01_METADATA.ruleName,
    ruleDescription: RULE_NS_ESC_01_METADATA.ruleDescription,
    ruleCategory: RULE_NS_ESC_01_METADATA.ruleCategory,
    submissionId,
    entityId,
    entityCode,
    assessmentPeriod,

    totalEvaluatedCases,
    applicableCaseCount,
    expectedEvidenceCount,
    observedEvidenceCount,
    absentEvidenceCount,
    absenceRate,

    evidencePresentCount,
    dataQualityLimitedCount,
    notApplicableCount,
    inconclusiveCount,

    affectedCaseIds,
    sourceRecordIds,

    warnings,
    interpretation,
    evaluatedAt,

    caseEvaluations
  };
}
