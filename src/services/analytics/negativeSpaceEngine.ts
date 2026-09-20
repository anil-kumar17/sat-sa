/**
 * SAT-SA Deterministic Negative Space Analysis Engine
 *
 * Rule: RULE-NS-ESC-01 — Expected Escalation Evidence Absence
 *
 * Identifies applicable critical cases where expected escalation evidence
 * is absent from submitted records, while accounting for data quality,
 * completeness, and observation-window validity.
 *
 * Absence of evidence is not proof that the activity did not occur.
 */

import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport
} from '../../types/submission';
import {
  NegativeSpaceResult,
  CaseNegativeSpaceEvaluation
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
 * Checks whether a timestamp can be verified against the supplied
 * assessment period.
 */
export function isTimestampInObservationWindow(
  timestampStr: string,
  periodStr?: string | null
): { inWindow: boolean; reason?: string } {
  if (!periodStr || periodStr.trim() === '') {
    return {
      inWindow: false,
      reason:
        'Observation window cannot be verified because assessment period metadata is missing.'
    };
  }

  const d = new Date(timestampStr);

  if (isNaN(d.getTime())) {
    return {
      inWindow: false,
      reason:
        `Malformed timestamp "${timestampStr}" prevents observation window verification.`
    };
  }

  const cleanPeriod = periodStr.trim().toUpperCase();

  const quarterMatch = cleanPeriod.match(
    /^(\d{4})[-_ ]?Q([1-4])$/
  );

  if (quarterMatch) {
    const periodYear = parseInt(quarterMatch[1], 10);
    const periodQuarter = parseInt(quarterMatch[2], 10);

    const recordYear = d.getUTCFullYear();
    const recordMonth = d.getUTCMonth() + 1;
    const recordQuarter = Math.ceil(recordMonth / 3);

    if (
      recordYear !== periodYear ||
      recordQuarter !== periodQuarter
    ) {
      return {
        inWindow: false,
        reason:
          `Record timestamp (${timestampStr.substring(0, 10)}) ` +
          `falls outside assessment observation window (${cleanPeriod}). ` +
          `Recorded in ${recordYear}-Q${recordQuarter}.`
      };
    }

    return { inWindow: true };
  }

  const yearMatch = cleanPeriod.match(/^(\d{4})$/);

  if (yearMatch) {
    const periodYear = parseInt(yearMatch[1], 10);
    const recordYear = d.getUTCFullYear();

    if (recordYear !== periodYear) {
      return {
        inWindow: false,
        reason:
          `Record timestamp year (${recordYear}) falls outside ` +
          `assessment observation window year (${periodYear}).`
      };
    }

    return { inWindow: true };
  }

  // Unknown/custom period formats cannot establish observation validity.
  return {
    inWindow: false,
    reason:
      `Assessment period "${periodStr}" uses an unsupported format. ` +
      'Observation window cannot be verified deterministically.'
  };
}

export function calculateNegativeSpace(
  records: NormalizedCaseRecord[],
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): NegativeSpaceResult {
  const evaluatedAt = new Date().toISOString();
  const warnings: string[] = [];

  warnings.push(
    'Quiet-period context unavailable in submitted data.'
  );

  const isSubmissionQualityRejected =
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID';

  const isLowCompleteness =
    submission?.completenessPercentage !== undefined &&
    submission.completenessPercentage < 40;

  if (isSubmissionQualityRejected) {
    warnings.push(
      'Submission data quality status is marked REJECTED/INVALID. ' +
      'Negative-space observations are constrained by source quality.'
    );
  } else if (isLowCompleteness) {
    warnings.push(
      `Submission completeness (${submission?.completenessPercentage}%) ` +
      'is below the supervisory threshold. Negative-space absence ' +
      'claims will not be treated as determinative.'
    );
  }

  const casesWithQualityErrors = new Set<string>();

  if (qualityReport?.issues) {
    for (const issue of qualityReport.issues) {
      if (issue.severity === 'ERROR' && issue.caseId) {
        casesWithQualityErrors.add(issue.caseId);
      }
    }
  }

  const assessmentPeriod =
    submission?.assessmentPeriod ||
    (records.length > 0
      ? records[0].assessmentPeriod
      : 'UNKNOWN_PERIOD');

  const submissionId =
    submission?.submissionId ||
    (records.length > 0
      ? records[0].submissionId
      : 'UNKNOWN_SUBMISSION');

  const entityId =
    submission?.entityId ||
    (records.length > 0
      ? records[0].entityId
      : 'UNKNOWN_ENTITY');

  const entityCode =
    submission?.entityCode ||
    (records.length > 0
      ? records[0].entityCode
      : 'CSE-UNKNOWN');

  const caseEvaluations: CaseNegativeSpaceEvaluation[] = [];

  for (const record of records) {
    const caseId = record.caseId || 'UNKNOWN_CASE';

    /*
     * Gate 1: Applicability
     *
     * RULE-NS-ESC-01 applies only to CRITICAL cases.
     */
    const isCritical = record.severity === 'CRITICAL';

    if (!isCritical) {
      caseEvaluations.push({
        caseId,
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
        reason:
          `Severity is ${record.severity}; RULE-NS-ESC-01 applies ` +
          'exclusively to CRITICAL operational cases.',
        rawPayloadSnippet: record.sourcePayload
      });

      continue;
    }

    /*
     * Gate 2: Submission completeness.
     *
     * If the source itself cannot establish a reliable case baseline,
     * absence of escalation evidence cannot be interpreted.
     */
    const hasIdentifier =
      Boolean(record.caseId && record.caseId.trim().length > 0);

    const hasValidAlertTimestamp =
      Boolean(
        record.alertTimestamp &&
        !isNaN(Date.parse(record.alertTimestamp))
      );

    const hasDataQualityError =
      casesWithQualityErrors.has(caseId);

    const hasIncompleteSubmissionState =
      record.evidencePresence?.escalationEvidence ===
      'INCOMPLETE_SUBMISSION';

    const completenessLimited =
      !hasIdentifier ||
      !hasValidAlertTimestamp ||
      hasDataQualityError ||
      hasIncompleteSubmissionState ||
      isSubmissionQualityRejected ||
      isLowCompleteness;

    if (completenessLimited) {
      let reason =
        'Negative-space assessment is limited by incomplete source fields or data-quality conditions.';

      if (isLowCompleteness) {
        reason =
          `Submission completeness (${submission?.completenessPercentage}%) ` +
          'is below the supervisory threshold. A missing escalation record ' +
          'cannot be classified as reliable negative space.';
      } else if (isSubmissionQualityRejected) {
        reason =
          'Submission quality is REJECTED/INVALID. ' +
          'A reliable evidence baseline cannot be established.';
      } else if (hasIncompleteSubmissionState) {
        reason =
          'The source record explicitly indicates incomplete submission ' +
          'coverage for escalation evidence.';
      } else if (hasDataQualityError) {
        reason =
          'The source record has an ERROR-level data-quality issue. ' +
          'Evidence absence cannot be interpreted reliably.';
      }

      caseEvaluations.push({
        caseId,
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
        reason,
        rawPayloadSnippet: record.sourcePayload
      });

      continue;
    }

    /*
     * Gate 3: Observation validity.
     */
    const windowCheck = isTimestampInObservationWindow(
      record.alertTimestamp,
      assessmentPeriod !== 'UNKNOWN_PERIOD'
        ? assessmentPeriod
        : undefined
    );

    if (!windowCheck.inWindow) {
      caseEvaluations.push({
        caseId,
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
        reason:
          windowCheck.reason ||
          'Observation window cannot be verified.',
        rawPayloadSnippet: record.sourcePayload
      });

      continue;
    }

    /*
     * Maintenance / quiet-period context.
     *
     * We do not assume that maintenance means escalation was exempt.
     * Without supporting quiet-period evidence, the result remains
     * inconclusive.
     */
    const dispositionUpper =
      (record.disposition || '').toUpperCase();

    const sourcePayload =
      record.sourcePayload as
        | Record<string, unknown>
        | undefined;

    const isExplicitMaintenance =
      dispositionUpper.includes('MAINTENANCE') ||
      Boolean(sourcePayload?.maintenance_mode);

    if (isExplicitMaintenance) {
      caseEvaluations.push({
        caseId,
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
        quietPeriodNote:
          'Quiet-period context unavailable in submitted data.',
        reason:
          `Record references maintenance activity (${record.disposition}), ` +
          'but supporting quiet-period protocol logs or exemptions are ' +
          'unavailable. Evidence absence is inconclusive.',
        rawPayloadSnippet: record.sourcePayload
      });

      continue;
    }

    /*
     * Gate 4: Evidence availability.
     */
    const hasEscalationEvidence =
      Boolean(record.escalationRecorded) ||
      Boolean(
        record.escalationTimestamp &&
        record.escalationTimestamp.trim() !== ''
      ) ||
      record.evidencePresence?.escalationEvidence ===
        'EVIDENCE_PRESENT';

    if (hasEscalationEvidence) {
      caseEvaluations.push({
        caseId,
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
        reason:
          'Required escalation evidence is present in the submitted observation set.',
        rawPayloadSnippet: record.sourcePayload
      });
    } else {
      caseEvaluations.push({
        caseId,
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
        reason:
          'Expected escalation evidence was not present in the submitted ' +
          'observation set for an applicable critical case. This is a ' +
          'potential evidence blind spot requiring supervisory review.',
        rawPayloadSnippet: record.sourcePayload
      });
    }
  }

  /*
   * Aggregate calculations.
   *
   * "Applicable" here means applicable AND valid for the specific
   * negative-space observation. Limited and inconclusive cases remain
   * visible through their own counters.
   */
  const totalEvaluatedCases = records.length;

  const applicableCaseCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.isApplicable &&
        (
          evaluation.classification === 'EVIDENCE_PRESENT' ||
          evaluation.classification === 'EVIDENCE_NOT_PRESENT'
        )
    ).length;

  const evidencePresentCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'EVIDENCE_PRESENT'
    ).length;

  const absentEvidenceCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'EVIDENCE_NOT_PRESENT'
    ).length;

  const dataQualityLimitedCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'DATA_QUALITY_LIMITED'
    ).length;

  const notApplicableCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'NOT_APPLICABLE'
    ).length;

  const inconclusiveCount =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'INCONCLUSIVE'
    ).length;

  /*
   * Only cases that passed all gates can enter the denominator.
   */
  const expectedEvidenceCount =
    evidencePresentCount + absentEvidenceCount;

  const observedEvidenceCount =
    evidencePresentCount;

  const absenceRate =
    expectedEvidenceCount === 0
      ? 0
      : Math.round(
          (absentEvidenceCount / expectedEvidenceCount) * 1000
        ) / 10;

  const affectedCases =
    caseEvaluations.filter(
      evaluation =>
        evaluation.classification === 'EVIDENCE_NOT_PRESENT'
    );

  const affectedCaseIds =
    affectedCases.map(
      evaluation => evaluation.caseId
    );

  const sourceRecordIds =
    affectedCases
      .map(evaluation => evaluation.sourceRecordId)
      .filter(
        (id): id is string =>
          Boolean(id)
      );

  if (dataQualityLimitedCount > 0) {
    warnings.push(
      `${dataQualityLimitedCount} critical ` +
      `${dataQualityLimitedCount === 1 ? 'case was' : 'cases were'} ` +
      'classified as DATA_QUALITY_LIMITED and excluded from the ' +
      'absence-rate denominator.'
    );
  }

  if (inconclusiveCount > 0) {
    warnings.push(
      `${inconclusiveCount} critical ` +
      `${inconclusiveCount === 1 ? 'case was' : 'cases were'} ` +
      'classified as INCONCLUSIVE because observation validity or ' +
      'context could not be established.'
    );
  }

  let interpretation: string;

  if (expectedEvidenceCount === 0) {
    if (
      dataQualityLimitedCount > 0 ||
      inconclusiveCount > 0
    ) {
      interpretation =
        'No valid applicable critical cases were available for a ' +
        'negative-space absence-rate calculation. Results are limited ' +
        'by data quality or observation validity.';
    } else {
      interpretation =
        'No valid applicable critical cases with verifiable observation ' +
        'windows were found in the submitted observation set.';
    }
  } else if (absentEvidenceCount === 0) {
    interpretation =
      `Escalation evidence was present for all ` +
      `${expectedEvidenceCount} valid applicable critical cases ` +
      'in the submitted observation set. No evidence blind spots ' +
      'were identified for RULE-NS-ESC-01.';
  } else {
    interpretation =
      `Escalation evidence was not present for ` +
      `${absentEvidenceCount} of ${expectedEvidenceCount} ` +
      `valid applicable critical cases ` +
      `(${absenceRate}% absence rate). ` +
      'This indicates a potential evidence blind spot and requires ' +
      'supervisory review.';
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