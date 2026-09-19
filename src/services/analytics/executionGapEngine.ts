/**
 * SAT-SA Execution Gap Engine
 * 
 * Rule: RULE-ESC-04 — Required Escalation Evidence
 * 
 * Purpose:
 * Pure deterministic calculation engine that identifies critical operational
 * cases where escalation evidence expected by the supervisory workflow is not
 * present in the submitted operational records.
 * 
 * Crucial Supervisory Principle:
 * SAT-SA must distinguish: "no escalation evidence recorded" from: "escalation definitely did not happen."
 * Therefore the engine must never claim that an operational action did not occur merely
 * because its timestamp is missing. All findings are classified as "Potential Execution Gaps"
 * requiring supervisory verification and review.
 * 
 * Architectural Constraints:
 * - Pure deterministic function
 * - No React, IndexedDB, network, or AI dependencies
 * - Full evidence traceability back to sourceRecordId
 * - Data quality safety (never classify incomplete data as a proven gap)
 */

import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport,
  CaseExecutionGapEvaluation,
  ExecutionGapResult,
  ExecutionGapSummary,
  CaseEvidenceStatus,
  CaseEvaluationDataQuality
} from '../../types';

export const RULE_ESC_04_METADATA = {
  ruleCode: 'RULE-ESC-04' as const,
  ruleName: 'Required Escalation Evidence',
  ruleDescription:
    'Identifies critical operational cases where escalation evidence expected by the supervisory workflow is not present in the submitted records.',
  ruleCategory: 'Execution Gap' as const,
  targetSeverity: 'CRITICAL' as const
};

/**
 * Pure deterministic evaluation function for RULE-ESC-04.
 * 
 * @param records Normalized case records from CSE operational submission
 * @param submission Optional submission metadata (for completeness/hash context)
 * @param qualityReport Optional data quality report (for quality issue awareness)
 * @returns Fully audited ExecutionGapResult with case-by-case and aggregate metrics
 */
export function calculateExecutionGap(
  records: NormalizedCaseRecord[],
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): ExecutionGapResult {
  const evaluatedAt = new Date().toISOString();
  const warnings: string[] = [];

  // Check overall submission quality state
  const isSubmissionQualityRejected =
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID';

  const isLowCompleteness =
    submission?.completenessPercentage !== undefined &&
    submission.completenessPercentage < 40;

  if (isSubmissionQualityRejected) {
    warnings.push(
      'Submission data quality status is marked REJECTED/INVALID. Execution-gap findings should be interpreted with extreme caution due to compromised source integrity.'
    );
  } else if (isLowCompleteness) {
    warnings.push(
      `Submission completeness (${submission?.completenessPercentage}%) is below supervisory threshold. Multiple cases may lack required timeline evidence.`
    );
  }

  // Create lookup for cases flagged with severe data quality issues in the report
  const casesWithQualityErrors = new Set<string>();
  if (qualityReport?.issues) {
    for (const issue of qualityReport.issues) {
      if (issue.severity === 'ERROR' && issue.caseId) {
        casesWithQualityErrors.add(issue.caseId);
      }
    }
  }

  const caseEvaluations: CaseExecutionGapEvaluation[] = [];

  for (const record of records) {
    // Basic structural data quality verification
    const hasIdentifier = Boolean(record.caseId && record.caseId.trim().length > 0);
    const hasValidAlertTimestamp = Boolean(
      record.alertTimestamp && !isNaN(Date.parse(record.alertTimestamp))
    );

    // If record lacks basic structural identity or valid alert timestamp:
    if (!hasIdentifier || !hasValidAlertTimestamp) {
      caseEvaluations.push({
        caseId: record.caseId || 'UNKNOWN_CASE',
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: record.severity,
        isApplicable: false,
        alertTimestamp: record.alertTimestamp || '',
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        escalationExpected: false,
        escalationObserved: false,
        hasExecutionGap: false,
        evidenceStatus: 'DATA_QUALITY_LIMITED',
        dataQualityStatus: 'DATA_QUALITY_LIMITED',
        reason: 'Execution-gap assessment limited by incomplete or malformed source case identification.',
        disposition: record.disposition,
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // Rule Applicability: RULE-ESC-04 strictly applies to CRITICAL cases
    const isCritical = record.severity === 'CRITICAL';

    if (!isCritical) {
      const hasEscalation = Boolean(
        record.escalationRecorded ||
        (record.escalationTimestamp && record.escalationTimestamp.trim() !== '') ||
        record.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT'
      );

      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: record.severity,
        isApplicable: false,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        escalationExpected: false,
        escalationObserved: hasEscalation,
        hasExecutionGap: false,
        evidenceStatus: 'NOT_APPLICABLE',
        dataQualityStatus: 'NOT_APPLICABLE',
        reason: `Severity is ${record.severity}; RULE-ESC-04 applies exclusively to CRITICAL operational cases.`,
        disposition: record.disposition,
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // Record is CRITICAL -> Check for data quality limitations
    const hasDataQualityError = casesWithQualityErrors.has(record.caseId);
    const hasIncompleteSubmissionState =
      record.evidencePresence?.escalationEvidence === 'INCOMPLETE_SUBMISSION';

    if (hasDataQualityError || hasIncompleteSubmissionState || isSubmissionQualityRejected) {
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        escalationExpected: false, // Cannot establish expectation on compromised record
        escalationObserved: false,
        hasExecutionGap: false, // Must NOT claim an execution gap when data quality is compromised
        evidenceStatus: 'DATA_QUALITY_LIMITED',
        dataQualityStatus: 'DATA_QUALITY_LIMITED',
        reason: 'Execution-gap assessment limited by incomplete or malformed source evidence. Requires data-quality review.',
        disposition: record.disposition,
        rawPayloadSnippet: record.sourcePayload
      });
      continue;
    }

    // Record is CRITICAL and data quality is sufficient: Escalation Evidence is EXPECTED
    const escalationExpected = true;
    const dataQualityStatus: CaseEvaluationDataQuality = 'SUFFICIENT';

    // Verify whether escalation evidence was recorded
    const escalationRecorded = Boolean(
      record.escalationRecorded ||
      (record.escalationTimestamp && record.escalationTimestamp.trim() !== '') ||
      record.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT'
    );

    if (escalationRecorded) {
      // Escalation evidence IS present
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: record.escalationTimestamp,
        escalationExpected: true,
        escalationObserved: true,
        hasExecutionGap: false,
        evidenceStatus: 'EVIDENCE_PRESENT',
        dataQualityStatus: 'SUFFICIENT',
        reason: 'Required escalation evidence is present in submitted record.',
        disposition: record.disposition,
        rawPayloadSnippet: record.sourcePayload
      });
    } else {
      // Escalation evidence IS NOT present -> Potential Execution Gap
      caseEvaluations.push({
        caseId: record.caseId,
        sourceRecordId: record.sourceRecordId,
        submissionId: record.submissionId,
        entityCode: record.entityCode,
        entityId: record.entityId,
        severity: 'CRITICAL',
        isApplicable: true,
        alertTimestamp: record.alertTimestamp,
        triageTimestamp: record.triageTimestamp,
        escalationTimestamp: null,
        escalationExpected: true,
        escalationObserved: false,
        hasExecutionGap: true,
        evidenceStatus: 'EVIDENCE_NOT_PRESENT',
        dataQualityStatus: 'SUFFICIENT',
        reason: 'Potential Execution Gap: Required escalation evidence not present for critical operational case. Requires supervisory review.',
        disposition: record.disposition,
        rawPayloadSnippet: record.sourcePayload
      });
    }
  }

  // Calculate Deterministic Aggregate Metrics
  const totalEvaluatedCases = records.length;
  const applicableCaseCount = caseEvaluations.filter((c) => c.isApplicable).length;
  const dataQualityLimitedCount = caseEvaluations.filter(
    (c) => c.dataQualityStatus === 'DATA_QUALITY_LIMITED'
  ).length;
  const expectedCount = caseEvaluations.filter((c) => c.escalationExpected).length;
  const observedCount = caseEvaluations.filter(
    (c) => c.isApplicable && c.escalationExpected && c.escalationObserved
  ).length;
  const gapCount = caseEvaluations.filter((c) => c.hasExecutionGap).length;

  // Gap rate calculation (rounded to 1 decimal place)
  const gapRate =
    expectedCount === 0 ? 0 : Math.round((gapCount / expectedCount) * 1000) / 10;

  const affectedCases = caseEvaluations.filter((c) => c.hasExecutionGap);
  const affectedCaseIds = affectedCases.map((c) => c.caseId);
  const evidenceRecordIds = affectedCases.map((c) => c.sourceRecordId);

  // Determine overall data quality state
  let overallDataQuality: 'SUFFICIENT' | 'DATA_QUALITY_LIMITED' | 'INSUFFICIENT_DATA';
  if (totalEvaluatedCases === 0) {
    overallDataQuality = 'SUFFICIENT';
  } else if (dataQualityLimitedCount > 0 && expectedCount === 0) {
    overallDataQuality = 'INSUFFICIENT_DATA';
  } else if (dataQualityLimitedCount > 0 || isLowCompleteness || isSubmissionQualityRejected) {
    overallDataQuality = 'DATA_QUALITY_LIMITED';
  } else {
    overallDataQuality = 'SUFFICIENT';
  }

  if (dataQualityLimitedCount > 0) {
    warnings.push(
      `${dataQualityLimitedCount} critical case(s) could not be evaluated due to source data quality limitations.`
    );
  }

  // Construct Supervisory Summary Statement
  let summaryStatement: string;
  if (totalEvaluatedCases === 0) {
    summaryStatement = 'No cases submitted for evaluation under RULE-ESC-04.';
  } else if (applicableCaseCount === 0) {
    summaryStatement =
      'No critical operational cases observed in submission. RULE-ESC-04 is not applicable to current records.';
  } else if (expectedCount === 0 && dataQualityLimitedCount > 0) {
    summaryStatement =
      'Data quality limited: Critical cases present but source records contain insufficient evidence to evaluate RULE-ESC-04. Requires data-quality review.';
  } else if (gapCount === 0) {
    summaryStatement = `Supervisory evaluation complete: All ${expectedCount} applicable critical cases contain required escalation evidence. Zero execution gaps identified.`;
  } else {
    summaryStatement = `Supervisory evaluation identified ${gapCount} potential execution gap(s) across ${expectedCount} applicable critical cases (gap rate: ${gapRate}%). Required escalation evidence not present in submitted records; requires supervisory review.`;
  }

  const summary: ExecutionGapSummary = {
    ruleCode: RULE_ESC_04_METADATA.ruleCode,
    ruleName: RULE_ESC_04_METADATA.ruleName,
    ruleDescription: RULE_ESC_04_METADATA.ruleDescription,
    ruleCategory: RULE_ESC_04_METADATA.ruleCategory,
    targetSeverity: RULE_ESC_04_METADATA.targetSeverity,
    totalEvaluatedCases,
    applicableCaseCount,
    expectedCount,
    observedCount,
    gapCount,
    gapRate,
    dataQualityLimitedCount,
    affectedCaseIds,
    evidenceRecordIds,
    overallDataQuality,
    hasGaps: gapCount > 0,
    summaryStatement,
    warnings,
    evaluatedAt
  };

  return {
    summary,
    caseEvaluations
  };
}
