import {
  Finding,
  FindingProvenance,
  ForensicRecord,
  CSESubmission,
  SourceRecord,
  ExecutionGapResult
} from '../types';
import {
  findingsRepository,
  evidenceRepository,
  auditRepository,
  sourceRecordRepository
} from '../repositories';

export interface GenerateFindingOptions {
  inspector?: string;
  assessmentCycle?: string;
  cycleCode?: string;
}

export interface GenerateFindingResult {
  success: boolean;
  findingGenerated: boolean;
  finding?: Finding;
  reason?: string;
}

/**
 * Keep the finding ID stable so running the same analysis again
 * updates the same finding instead of creating another one.
 */
export function generateDeterministicFindingId(
  ruleCode: string,
  entityCode: string,
  submissionId: string
): string {
  const cleanRule = ruleCode.replace(/[^A-Za-z0-9]/g, '');
  const cleanEntity = entityCode.replace(/[^A-Za-z0-9]/g, '');
  const cleanSub = submissionId.replace(/[^A-Za-z0-9]/g, '');

  return `FND-${cleanRule}-${cleanEntity}-${cleanSub}`;
}

export async function generateFindingFromExecutionGap(
  submission: CSESubmission,
  gapResult: ExecutionGapResult,
  sourceRecords?: SourceRecord[],
  options?: GenerateFindingOptions
): Promise<GenerateFindingResult> {
  const { summary, caseEvaluations } = gapResult;

  if (summary.gapCount === 0 || !summary.hasGaps) {
    return {
      success: true,
      findingGenerated: false,
      reason:
        `Zero execution gaps detected for ${summary.ruleCode} ` +
        `in submission ${submission.submissionId}. No finding generated.`
    };
  }

  let availableSourceRecords = sourceRecords;

  if (!availableSourceRecords || availableSourceRecords.length === 0) {
    try {
      availableSourceRecords =
        await sourceRecordRepository.getBySubmissionId(
          submission.submissionId
        );
    } catch {
      availableSourceRecords = [];
    }
  }

  const sourceRecordMap = new Map<string, SourceRecord>();

  for (const sourceRecord of availableSourceRecords || []) {
    sourceRecordMap.set(sourceRecord.id, sourceRecord);
  }

  const gapEvaluations = caseEvaluations.filter(
    evaluation => evaluation.hasExecutionGap
  );

  const affectedCaseIds = gapEvaluations.map(
    evaluation => evaluation.caseId
  );

  const sourceRecordIds = gapEvaluations
    .map(evaluation => evaluation.sourceRecordId)
    .filter((id): id is string => Boolean(id));

  const findingId = generateDeterministicFindingId(
    summary.ruleCode,
    submission.entityCode,
    submission.submissionId
  );

  const applicableCases = summary.applicableCaseCount;
  const observedCount = summary.observedCount;
  const gapCount = summary.gapCount;
  const expectedCount = summary.expectedCount;
  const gapRate = summary.gapRate;

  const handshakeRate =
    applicableCases > 0
      ? `${((observedCount / applicableCases) * 100).toFixed(1)}%`
      : '0.0%';

  const dataQualityLimitedCaseIds = caseEvaluations
    .filter(
      evaluation =>
        evaluation.dataQualityStatus === 'DATA_QUALITY_LIMITED'
    )
    .map(evaluation => evaluation.caseId);

  const findingTitle = 'Potential Required Escalation Evidence Gap';

  const findingSummary =
    `${gapCount} of ${applicableCases} applicable critical cases did not ` +
    `contain recorded escalation evidence in the submitted operational records.`;

  const assessmentPeriod =
    submission.assessmentPeriod ||
    options?.assessmentCycle ||
    'Assessment period not specified';

  const sourceIntegrityFingerprint = submission.fileHash || '';

  /*
   * Build the forensic records first. Their incident IDs are the IDs
   * the evidence repository uses, so the finding can point to real
   * evidence records instead of inventing another identifier.
   */
  const forensicRecords: ForensicRecord[] = gapEvaluations.map(
    evaluation => {
      const sourceRecord = evaluation.sourceRecordId
        ? sourceRecordMap.get(evaluation.sourceRecordId)
        : undefined;

      const rawPayload =
        sourceRecord?.rawPayload ||
        evaluation.rawPayloadSnippet ||
        {};

      const sourceFingerprint =
        sourceRecord?.sha256Fingerprint ||
        sourceIntegrityFingerprint ||
        '';

      const alertTimestamp =
        evaluation.alertTimestamp || 'Not recorded';

      const triageTimestamp =
        evaluation.triageTimestamp || 'Not recorded';

      const escalationTimestamp =
        evaluation.escalationTimestamp || 'Not recorded';

      const closureTimestamp =
        evaluation.closureTimestamp || 'Not recorded';

      return {
        incidentId: evaluation.caseId,
        sourceRecordId: evaluation.sourceRecordId,
        submissionId: submission.submissionId,
        caseId: evaluation.caseId,
        findingId,

        alertTimestamp,

        triageComplete:
          evaluation.triageTimestamp
            ? `${triageTimestamp} (Recorded)`
            : 'Not recorded',

        // No duration is calculated unless the source data provides one.
        triageDurationSeconds: 0,

        recordedEscalation:
          evaluation.escalationTimestamp
            ? escalationTimestamp
            : 'Not recorded',

        closureTimestamp,

        // Keep this neutral until the source schema gives us both timestamps.
        elapsedMinutes: 0,

        dispositionGiven:
          evaluation.disposition || 'Not recorded',

        provenanceHash: sourceFingerprint,

        auditActionStatus: 'Flagged',

        dataQualityStatus:
          evaluation.dataQualityStatus,

        // The submitted payload is kept as received.
        rawPayload
      };
    }
  );

  /*
   * The evidence repository uses incidentId as its lookup key.
   * These are therefore actual IDs of records being saved below.
   */
  const evidenceRecordIds = forensicRecords.map(
    record => record.incidentId
  );

  const provenance: FindingProvenance = {
    ruleCode: summary.ruleCode,
    submissionId: submission.submissionId,
    entityId: submission.entityId,
    entityCode: submission.entityCode,
    assessmentPeriod,
    applicableCaseCount: applicableCases,
    expectedCount,
    observedCount,
    gapCount,
    gapRate,
    affectedCaseIds,
    evidenceRecordIds,
    sourceRecordIds,
    dataQualityLimitedCount: summary.dataQualityLimitedCount,
    dataQualityLimitedCaseIds,
    overallDataQuality: summary.overallDataQuality,
    evaluatedAt: summary.evaluatedAt,
    sourceIntegrityFingerprint
  };

  const nowUtc = new Date().toISOString();

  const finding: Finding = {
    id: findingId,
    defectCode: 'P0',
    ruleCode: summary.ruleCode,
    title: findingTitle,
    severity: 'CRITICAL',
    entityId: submission.entityId,
    entityName: `${submission.entityCode} Operational Entity`,
    entityCode: submission.entityCode,
    sector: 'Not specified in submission',
    targetCriticality: 'CRITICAL',
    assessmentCycle: assessmentPeriod,
    cycleCode: options?.cycleCode || 'UNSPECIFIED',

    // A confidence model has not been implemented yet.
    confidence: 0,

    status: 'OPEN',
    date: submission.importedAt
      ? submission.importedAt.split('T')[0]
      : nowUtc.split('T')[0],
    lastUpdated: nowUtc,
    summary: findingSummary,
    inspector:
      options?.inspector ||
      'SAT-SA Deterministic Analytics Engine',

    ledgerSealStatus: sourceIntegrityFingerprint
      ? 'SHA-256 Source Fingerprint Recorded'
      : 'Source Fingerprint Not Available',

    remediationDeadline: 'Supervisory review required',
    handshakeRate,
    flaggedIncidentsCount: gapCount,
    totalEvaluatedIncidents: applicableCases,
    unsupportedClaimsCount: 0,
    primaryOffset: 'Operational submission',
    targetProtocol: summary.ruleCode,
    sensorSource: 'CSE Operational Submission',
    telemetryFile: submission.fileName,
    telemetryOffset:
      `${submission.recordCount} operational records evaluated`,
    sha256Hash: sourceIntegrityFingerprint,
    evidenceTimestamp: summary.evaluatedAt,

    recommendedAction:
      'Review the affected cases and determine whether escalation occurred ' +
      'outside the submitted evidence or whether corrective action is required.',

    submissionId: submission.submissionId,
    assessmentPeriod: submission.assessmentPeriod,
    affectedCaseIds,
    evidenceRecordIds,
    sourceRecordIds,
    applicableCaseCount: applicableCases,
    expectedCount,
    observedCount,
    gapCount,
    gapRate,
    dataQualityLimitedCount: summary.dataQualityLimitedCount,
    dataQualityLimitedCaseIds,
    overallDataQuality: summary.overallDataQuality,
    sourceIntegrityFingerprint,
    provenance
  };

  await evidenceRepository.saveMany(forensicRecords);
  await findingsRepository.save(finding);

  try {
    await auditRepository.logEvent({
      timestamp: nowUtc,
      inspector:
        options?.inspector ||
        'SAT-SA Deterministic Analytics Engine',
      actionType: 'FINDING_GENERATED',
      targetEntity: submission.entityCode,
      targetRef: finding.id,
      provenanceHash: sourceIntegrityFingerprint,

      // A recorded fingerprint is not the same thing as validation.
      // Leave the audit state pending until an actual verification step exists.
      integrityStatus: sourceIntegrityFingerprint
        ? 'PENDING'
        : 'PENDING',

      summary:
        `Generated potential finding ${finding.id} from ` +
        `${summary.ruleCode}: ${gapCount} potential execution gaps ` +
        `in submission ${submission.submissionId}.`
    });
  } catch (error) {
    console.warn(
      'Could not log audit trail event for finding generation:',
      error
    );
  }

  return {
    success: true,
    findingGenerated: true,
    finding
  };
}

export async function getEvidenceChainForFinding(
  finding: Finding
): Promise<{
  finding: Finding;
  evidenceRecords: ForensicRecord[];
  sourceRecords: SourceRecord[];
  chainComplete: boolean;
}> {
  const evidenceRecordIds =
    finding.evidenceRecordIds || [];

  const evidenceRecords =
    await evidenceRepository.getByIds(evidenceRecordIds);

  const sourceRecordIds =
    finding.sourceRecordIds || [];

  const sourceRecords: SourceRecord[] = [];

  for (const sourceRecordId of sourceRecordIds) {
    const sourceRecord =
      await sourceRecordRepository.getById(sourceRecordId);

    if (sourceRecord) {
      sourceRecords.push(sourceRecord);
    }
  }

  const evidenceComplete =
    evidenceRecords.length === evidenceRecordIds.length;

  const sourceRecordsComplete =
    sourceRecords.length === sourceRecordIds.length;

  /*
   * A finding with no evidence IDs should not accidentally appear
   * complete just because there are no missing records.
   */
  const chainComplete =
    evidenceRecordIds.length > 0 &&
    evidenceComplete &&
    sourceRecordsComplete;

  return {
    finding,
    evidenceRecords,
    sourceRecords,
    chainComplete
  };
}

export const findingService = {
  generateDeterministicFindingId,
  generateFindingFromExecutionGap,
  getEvidenceChainForFinding
};