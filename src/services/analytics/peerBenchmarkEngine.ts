import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport
} from '../../types';

import {
  PeerGroup,
  PeerProfile,
  PeerMetricCode,
  PeerMetricDefinition,
  PeerBaseline,
  PeerDeviation,
  PeerDeviationStatus,
  ExcludedPeerSubmission,
  PeerBenchmarkResult,
  PeerBenchmarkOptions
} from '../../types/peerBenchmark';

export const DEFAULT_PEER_OPTIONS: Required<PeerBenchmarkOptions> = {
  minimumPeerSampleSize: 3,
  percentageDeviationThreshold: 15.0,
  durationRatioUpperThreshold: 1.5,
  durationRatioLowerThreshold: 0.67
};

export const PEER_METRIC_DEFINITIONS: Record<
  PeerMetricCode,
  PeerMetricDefinition
> = {
  ESCALATION_EVIDENCE_COVERAGE: {
    code: 'ESCALATION_EVIDENCE_COVERAGE',
    name: 'Escalation Evidence Coverage',
    description:
      'Proportion of applicable escalation workflow events with recorded evidence.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription:
      'Deviation of >= 15.0 percentage points from peer median'
  },

  SUPERVISOR_REVIEW_COVERAGE: {
    code: 'SUPERVISOR_REVIEW_COVERAGE',
    name: 'Supervisor Review Coverage',
    description:
      'Proportion of operational cases with recorded supervisor review evidence.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription:
      'Deviation of >= 15.0 percentage points from peer median'
  },

  CLOSURE_EVIDENCE_COVERAGE: {
    code: 'CLOSURE_EVIDENCE_COVERAGE',
    name: 'Closure Evidence Coverage',
    description:
      'Proportion of closed cases with explicit closure evidence recorded.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription:
      'Deviation of >= 15.0 percentage points from peer median'
  },

  EXECUTION_GAP_RATE: {
    code: 'EXECUTION_GAP_RATE',
    name: 'Execution Gap Rate',
    description:
      'Rate of identified potential operational execution gaps across evaluated critical cases.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription:
      'Deviation of >= 15.0 percentage points from peer median'
  },

  TRIAGE_DURATION: {
    code: 'TRIAGE_DURATION',
    name: 'Median Triage Duration',
    description:
      'Median duration from initial alert generation to completed operational triage.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription:
      'Deviation ratio >= 1.5x (slower) or <= 0.67x (faster) than peer median'
  },

  ESCALATION_DELAY: {
    code: 'ESCALATION_DELAY',
    name: 'Median Escalation Delay',
    description:
      'Median duration from triage completion, or alert when triage is unavailable, to documented escalation.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription:
      'Deviation ratio >= 1.5x (slower) or <= 0.67x (faster) than peer median'
  },

  SUPERVISOR_REVIEW_DELAY: {
    code: 'SUPERVISOR_REVIEW_DELAY',
    name: 'Median Supervisor Review Delay',
    description:
      'Median duration from escalation, triage, or alert to recorded supervisor review.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription:
      'Deviation ratio >= 1.5x (slower) or <= 0.67x (faster) than peer median'
  },

  CLOSURE_ELAPSED: {
    code: 'CLOSURE_ELAPSED',
    name: 'Median Case Closure Elapsed Time',
    description:
      'Median duration from alert trigger to formal case closure.',
    type: 'DURATION',
    unit: 'hours',
    thresholdDescription:
      'Deviation ratio >= 1.5x (slower) or <= 0.67x (faster) than peer median'
  }
};

export const ALL_PEER_METRIC_CODES: PeerMetricCode[] = [
  'ESCALATION_EVIDENCE_COVERAGE',
  'SUPERVISOR_REVIEW_COVERAGE',
  'CLOSURE_EVIDENCE_COVERAGE',
  'EXECUTION_GAP_RATE',
  'TRIAGE_DURATION',
  'ESCALATION_DELAY',
  'SUPERVISOR_REVIEW_DELAY',
  'CLOSURE_ELAPSED'
];

export function calculateMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;

  const filtered = values.filter(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );

  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (
      Math.round(
        ((sorted[middle - 1] + sorted[middle]) / 2) * 100
      ) / 100
    );
  }

  return Math.round(sorted[middle] * 100) / 100;
}

export function calculatePercentile(
  values: number[],
  percentile: number
): number | null {
  if (!values || values.length === 0) return null;

  const filtered = values.filter(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );

  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const clampedPercentile = Math.max(0, Math.min(100, percentile));

  const rank =
    Math.ceil((clampedPercentile / 100) * sorted.length) - 1;

  const index = Math.max(
    0,
    Math.min(sorted.length - 1, rank)
  );

  return Math.round(sorted[index] * 100) / 100;
}

function parseTimestamp(
  timestamp: string | null | undefined
): number | null {
  if (!timestamp) return null;

  const parsed = Date.parse(timestamp);

  return Number.isNaN(parsed) ? null : parsed;
}

export function calculateEscalationEvidenceCoverage(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const applicable = records.filter(
    (record) =>
      record.severity === 'CRITICAL' ||
      record.severity === 'HIGH' ||
      record.escalationRecorded ||
      record.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT'
  );

  if (applicable.length === 0) return null;

  const covered = applicable.filter(
    (record) =>
      record.evidencePresence?.escalationEvidence ===
      'EVIDENCE_PRESENT'
  );

  return Math.round((covered.length / applicable.length) * 1000) / 10;
}

export function calculateSupervisorReviewCoverage(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const covered = records.filter(
    (record) =>
      record.evidencePresence?.supervisorReviewEvidence ===
      'EVIDENCE_PRESENT'
  );

  return Math.round((covered.length / records.length) * 1000) / 10;
}

export function calculateClosureEvidenceCoverage(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const closed = records.filter(
    (record) =>
      record.closureTimestamp !== null ||
      record.disposition !== null
  );

  if (closed.length === 0) return null;

  // A timestamp or disposition alone is not closure evidence.
  const covered = closed.filter(
    (record) =>
      record.evidencePresence?.closureEvidence ===
      'EVIDENCE_PRESENT'
  );

  return Math.round((covered.length / closed.length) * 1000) / 10;
}

export function calculateExecutionGapRate(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const critical = records.filter(
    (record) => record.severity === 'CRITICAL'
  );

  if (critical.length === 0) return null;

  const gaps = critical.filter(
    (record) =>
      !record.escalationRecorded &&
      record.evidencePresence?.escalationEvidence !==
        'EVIDENCE_PRESENT' &&
      !record.escalationTimestamp
  );

  return Math.round((gaps.length / critical.length) * 1000) / 10;
}

export function calculateMedianTriageDuration(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];

  for (const record of records) {
    const alertMs = parseTimestamp(record.alertTimestamp);
    const triageMs = parseTimestamp(record.triageTimestamp);

    if (alertMs === null || triageMs === null) continue;

    const minutes = (triageMs - alertMs) / 60000;

    if (minutes >= 0) {
      durations.push(minutes);
    }
  }

  return calculateMedian(durations);
}

export function calculateMedianEscalationDelay(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];

  for (const record of records) {
    const startMs =
      parseTimestamp(record.triageTimestamp) ??
      parseTimestamp(record.alertTimestamp);

    const escalationMs = parseTimestamp(
      record.escalationTimestamp
    );

    if (startMs === null || escalationMs === null) continue;

    const minutes = (escalationMs - startMs) / 60000;

    if (minutes >= 0) {
      durations.push(minutes);
    }
  }

  return calculateMedian(durations);
}

export function calculateMedianSupervisorReviewDelay(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];

  for (const record of records) {
    const startMs =
      parseTimestamp(record.escalationTimestamp) ??
      parseTimestamp(record.triageTimestamp) ??
      parseTimestamp(record.alertTimestamp);

    const reviewMs = parseTimestamp(
      record.supervisorReviewTimestamp
    );

    if (startMs === null || reviewMs === null) continue;

    const minutes = (reviewMs - startMs) / 60000;

    if (minutes >= 0) {
      durations.push(minutes);
    }
  }

  return calculateMedian(durations);
}

export function calculateMedianClosureElapsed(
  records: NormalizedCaseRecord[]
): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];

  for (const record of records) {
    const alertMs = parseTimestamp(record.alertTimestamp);
    const closureMs = parseTimestamp(record.closureTimestamp);

    if (alertMs === null || closureMs === null) continue;

    const hours = (closureMs - alertMs) / 3600000;

    if (hours >= 0) {
      durations.push(hours);
    }
  }

  return calculateMedian(durations);
}

export function calculateSubmissionPeerMetrics(
  records: NormalizedCaseRecord[]
): Record<PeerMetricCode, number | null> {
  return {
    ESCALATION_EVIDENCE_COVERAGE:
      calculateEscalationEvidenceCoverage(records),

    SUPERVISOR_REVIEW_COVERAGE:
      calculateSupervisorReviewCoverage(records),

    CLOSURE_EVIDENCE_COVERAGE:
      calculateClosureEvidenceCoverage(records),

    EXECUTION_GAP_RATE:
      calculateExecutionGapRate(records),

    TRIAGE_DURATION:
      calculateMedianTriageDuration(records),

    ESCALATION_DELAY:
      calculateMedianEscalationDelay(records),

    SUPERVISOR_REVIEW_DELAY:
      calculateMedianSupervisorReviewDelay(records),

    CLOSURE_ELAPSED:
      calculateMedianClosureElapsed(records)
  };
}

export interface QualityGateEvaluation {
  eligible: boolean;
  exclusionReason?: string;
  gateCheck?: string;
}

export function evaluatePeerSubmissionQuality(
  submission: SubmissionMetadata,
  records: NormalizedCaseRecord[]
): QualityGateEvaluation {
  if (!submission) {
    return {
      eligible: false,
      exclusionReason:
        'Peer submission metadata is missing or null.',
      gateCheck: 'METADATA_PRESENCE'
    };
  }

  if (
    !submission.submissionId ||
    !submission.entityCode ||
    !submission.assessmentPeriod
  ) {
    return {
      eligible: false,
      exclusionReason:
        'Critical supervisory identifiers missing (submissionId, entityCode, or assessmentPeriod).',
      gateCheck: 'MISSING_CRITICAL_IDENTIFIERS'
    };
  }

  if (
    submission.dataQualityStatus === 'INVALID' ||
    submission.dataQualityStatus === 'REJECTED'
  ) {
    return {
      eligible: false,
      exclusionReason:
        `Submission data quality status is ${submission.dataQualityStatus}. Excluded by quality gate.`,
      gateCheck: 'INVALID_OR_REJECTED_STATUS'
    };
  }

  if (
    typeof submission.completenessPercentage === 'number' &&
    submission.completenessPercentage < 40
  ) {
    return {
      eligible: false,
      exclusionReason:
        `Submission completeness (${submission.completenessPercentage}%) is below the minimum supervisory threshold of 40%.`,
      gateCheck: 'COMPLETENESS_BELOW_THRESHOLD'
    };
  }

  if (
    typeof submission.completenessPercentage !== 'number' ||
    !Number.isFinite(submission.completenessPercentage)
  ) {
    return {
      eligible: false,
      exclusionReason:
        'Submission completeness percentage is unavailable or invalid.',
      gateCheck: 'MISSING_COMPLETENESS'
    };
  }

  if (!records || records.length === 0) {
    return {
      eligible: false,
      exclusionReason:
        'No normalized case records available for peer metric evaluation.',
      gateCheck: 'INSUFFICIENT_RECORDS'
    };
  }

  const invalidRecordCount = records.filter(
    (record) =>
      !record.caseId ||
      !record.submissionId ||
      !record.entityCode ||
      !record.assessmentPeriod
  ).length;

  if (invalidRecordCount > 0) {
    return {
      eligible: false,
      exclusionReason:
        `${invalidRecordCount} normalized case record(s) are missing required identifiers.`,
      gateCheck: 'INVALID_RECORD_IDENTIFIERS'
    };
  }

  return {
    eligible: true
  };
}

export interface PeerCohortEvaluation {
  eligible: boolean;
  reason?: string;
  gateCheck?: string;
}

export function evaluatePeerCohortMembership(
  targetProfile: PeerProfile | null | undefined,
  targetGroup: PeerGroup | null | undefined,
  candidateProfile: PeerProfile | null | undefined
): PeerCohortEvaluation {
  if (!targetGroup) {
    return {
      eligible: true
    };
  }

  if (!candidateProfile) {
    return {
      eligible: false,
      reason:
        'Candidate submission has no peer profile and cannot be admitted to an explicitly defined peer cohort.',
      gateCheck: 'MISSING_PEER_PROFILE'
    };
  }

  if (
    candidateProfile.peerGroupId !== targetGroup.peerGroupId
  ) {
    return {
      eligible: false,
      reason:
        `Candidate belongs to peer group ${candidateProfile.peerGroupId}, not target peer group ${targetGroup.peerGroupId}.`,
      gateCheck: 'PEER_GROUP_MISMATCH'
    };
  }

  if (
    targetProfile &&
    candidateProfile.peerGroupId !== targetProfile.peerGroupId
  ) {
    return {
      eligible: false,
      reason:
        'Candidate peer profile does not share the target entity peer group.',
      gateCheck: 'TARGET_PEER_GROUP_MISMATCH'
    };
  }

  if (
    targetProfile?.sector &&
    candidateProfile.sector &&
    targetProfile.sector !== candidateProfile.sector
  ) {
    return {
      eligible: false,
      reason:
        `Candidate sector (${candidateProfile.sector}) does not match target sector (${targetProfile.sector}).`,
      gateCheck: 'SECTOR_MISMATCH'
    };
  }

  if (
    targetProfile?.criticalityTier &&
    candidateProfile.criticalityTier &&
    targetProfile.criticalityTier !==
      candidateProfile.criticalityTier
  ) {
    return {
      eligible: false,
      reason:
        `Candidate criticality tier (${candidateProfile.criticalityTier}) does not match target tier (${targetProfile.criticalityTier}).`,
      gateCheck: 'CRITICALITY_TIER_MISMATCH'
    };
  }

  return {
    eligible: true
  };
}

export function calculatePeerBaseline(
  metricCode: PeerMetricCode,
  peerValues: number[]
): PeerBaseline {
  const definition = PEER_METRIC_DEFINITIONS[metricCode];

  const validValues = peerValues.filter(
    (value) =>
      typeof value === 'number' &&
      Number.isFinite(value)
  );

  const sampleSize = validValues.length;

  if (sampleSize === 0) {
    return {
      metricCode,
      metricType: definition.type,
      unit: definition.unit,
      sampleSize: 0,
      validPeerValues: [],
      median: null,
      min: null,
      max: null,
      p25: null,
      p75: null
    };
  }

  const sorted = [...validValues].sort(
    (a, b) => a - b
  );

  return {
    metricCode,
    metricType: definition.type,
    unit: definition.unit,
    sampleSize,
    validPeerValues: sorted,
    median: calculateMedian(sorted),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: calculatePercentile(sorted, 25),
    p75: calculatePercentile(sorted, 75)
  };
}

export function evaluatePeerDeviation(
  metricCode: PeerMetricCode,
  targetValue: number | null,
  baseline: PeerBaseline,
  options: Required<PeerBenchmarkOptions>
): PeerDeviation {
  const definition = PEER_METRIC_DEFINITIONS[metricCode];

  if (targetValue === null) {
    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue: null,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'NO_BASELINE',
      deviationDescription:
        'Metric unavailable for target submission.',
      supervisoryInterpretation:
        'Target submission lacks sufficient operational instances to calculate this metric. Requires further review if workflow events were expected.'
    };
  }

  if (!baseline || baseline.sampleSize === 0) {
    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'NO_BASELINE',
      deviationDescription:
        'No comparable peer baseline available.',
      supervisoryInterpretation:
        'No eligible peer submissions are currently recorded for this comparison group. Peer deviation cannot be established.'
    };
  }

  if (
    baseline.sampleSize <
    options.minimumPeerSampleSize
  ) {
    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'INCONCLUSIVE',
      deviationDescription:
        `Inconclusive: Peer sample size (N=${baseline.sampleSize}) is below minimum requirement of ${options.minimumPeerSampleSize}.`,
      supervisoryInterpretation:
        `Observed sample size (N=${baseline.sampleSize}) is insufficient for a stable peer baseline. Do not draw adverse supervisory inferences without an adequate comparison cohort.`
    };
  }

  const peerMedian = baseline.median;

  if (peerMedian === null) {
    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'INCONCLUSIVE',
      deviationDescription:
        'Peer baseline median could not be determined.',
      supervisoryInterpretation:
        'Statistical calculation resulted in an inconclusive peer baseline.'
    };
  }

  if (definition.type === 'PERCENTAGE') {
    const difference =
      Math.round((targetValue - peerMedian) * 10) / 10;

    const isDeviation =
      Math.abs(difference) >=
      options.percentageDeviationThreshold;

    const status: PeerDeviationStatus =
      isDeviation
        ? 'PEER_DEVIATION'
        : 'WITHIN_PEER_RANGE';

    let supervisoryInterpretation: string;

    if (isDeviation && difference < 0) {
      supervisoryInterpretation =
        `Target observed rate (${targetValue}%) is ${Math.abs(
          difference
        )} percentage points below peer median (${peerMedian}%). Elevated supervisory attention may be warranted to investigate operational coverage.`;
    } else if (isDeviation && difference > 0) {
      supervisoryInterpretation =
        `Target observed rate (${targetValue}%) is ${difference} percentage points above peer median (${peerMedian}%). The difference provides contextual information and should be reviewed alongside operational evidence.`;
    } else {
      supervisoryInterpretation =
        `Target observed rate (${targetValue}%) is within the configured peer comparison threshold around the peer median (${peerMedian}%).`;
    }

    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: difference,
      deviationRatio: null,
      status,
      deviationDescription:
        `${difference >= 0 ? '+' : ''}${difference} pp vs peer median (${peerMedian}%)`,
      supervisoryInterpretation
    };
  }

  if (peerMedian <= 0) {
    return {
      metricCode,
      metricName: definition.name,
      metricType: definition.type,
      unit: definition.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'INCONCLUSIVE',
      deviationDescription:
        'Peer duration baseline is zero or non-positive; ratio comparison is not meaningful.',
      supervisoryInterpretation:
        'The available peer duration baseline cannot support a reliable ratio comparison. Additional comparable evidence is required.'
    };
  }

  const ratio =
    Math.round((targetValue / peerMedian) * 100) / 100;

  const isSlower =
    ratio >= options.durationRatioUpperThreshold;

  const isFaster =
    ratio <= options.durationRatioLowerThreshold;

  const isDeviation =
    isSlower || isFaster;

  const status: PeerDeviationStatus =
    isDeviation
      ? 'PEER_DEVIATION'
      : 'WITHIN_PEER_RANGE';

  let supervisoryInterpretation: string;

  if (isSlower) {
    supervisoryInterpretation =
      `Target duration (${targetValue} ${definition.unit}) is ${ratio}x the peer median (${peerMedian} ${definition.unit}). Elevated supervisory attention may be warranted to assess response latency and supporting workflow evidence.`;
  } else if (isFaster) {
    supervisoryInterpretation =
      `Target duration (${targetValue} ${definition.unit}) is ${ratio}x the peer median (${peerMedian} ${definition.unit}). Review the underlying workflow evidence to confirm that accelerated processing reflects complete operational activity.`;
  } else {
    supervisoryInterpretation =
      `Target duration (${targetValue} ${definition.unit}) is within the configured peer comparison threshold around the peer median (${peerMedian} ${definition.unit}).`;
  }

  return {
    metricCode,
    metricName: definition.name,
    metricType: definition.type,
    unit: definition.unit,
    targetValue,
    peerBaseline: baseline,
    deviationPercentagePoints: null,
    deviationRatio: ratio,
    status,
    deviationDescription:
      `${ratio}x peer median (${peerMedian} ${definition.unit})`,
    supervisoryInterpretation
  };
}

export interface PeerCandidateSubmission {
  submission: SubmissionMetadata;
  records: NormalizedCaseRecord[];
  peerProfile?: PeerProfile | null;
}

export interface ExecutePeerBenchmarkParams {
  targetSubmission: SubmissionMetadata;
  targetRecords: NormalizedCaseRecord[];
  targetQualityReport?: DataQualityReport | null;
  peerCandidates?: PeerCandidateSubmission[];
  peerProfile?: PeerProfile | null;
  peerGroup?: PeerGroup | null;
  options?: PeerBenchmarkOptions;
  evaluatedAt?: string;
}

export function executePeerBenchmark(
  params: ExecutePeerBenchmarkParams
): PeerBenchmarkResult {
  const {
    targetSubmission,
    targetRecords,
    targetQualityReport,
    peerCandidates = [],
    peerProfile = null,
    peerGroup = null,
    options: userOptions,
    evaluatedAt = new Date().toISOString()
  } = params;

  const options: Required<PeerBenchmarkOptions> = {
    ...DEFAULT_PEER_OPTIONS,
    ...userOptions
  };

  const excludedSubmissions: ExcludedPeerSubmission[] = [];
  const dataQualityLimitations: string[] = [];

  if (
    targetSubmission.dataQualityStatus ===
    'WARNINGS'
  ) {
    dataQualityLimitations.push(
      'Target submission has documented data quality warnings; metric interpretations should be reviewed alongside the underlying source evidence.'
    );
  }

  if (
    typeof targetSubmission.completenessPercentage ===
      'number' &&
    targetSubmission.completenessPercentage < 80
  ) {
    dataQualityLimitations.push(
      `Target submission completeness is ${targetSubmission.completenessPercentage}%; results should be verified alongside raw source records.`
    );
  }

  if (
    targetQualityReport?.issues &&
    targetQualityReport.issues.length > 0
  ) {
    dataQualityLimitations.push(
      `Identified ${targetQualityReport.issues.length} data quality issue(s) in the target submission.`
    );
  }

  const targetMetrics =
    calculateSubmissionPeerMetrics(
      targetRecords
    );

  const validPeers: Array<{
    submissionId: string;
    entityCode: string;
    metrics: Record<
      PeerMetricCode,
      number | null
    >;
  }> = [];

  for (const candidate of peerCandidates) {
    const peerSub = candidate.submission;
    const peerRecs = candidate.records;
    const candidateProfile =
      candidate.peerProfile ?? null;

    if (
      peerSub.submissionId ===
      targetSubmission.submissionId
    ) {
      excludedSubmissions.push({
        submissionId:
          peerSub.submissionId,
        entityCode:
          peerSub.entityCode,
        reason:
          'Target submission cannot be included in its own peer comparison baseline.',
        gateCheck: 'SELF_EXCLUSION'
      });

      continue;
    }

    const cohortEvaluation =
      evaluatePeerCohortMembership(
        peerProfile,
        peerGroup,
        candidateProfile
      );

    if (!cohortEvaluation.eligible) {
      excludedSubmissions.push({
        submissionId:
          peerSub.submissionId,
        entityCode:
          peerSub.entityCode,
        reason:
          cohortEvaluation.reason ??
          'Candidate does not belong to the configured peer cohort.',
        gateCheck:
          cohortEvaluation.gateCheck ??
          'PEER_COHORT_GATE'
      });

      continue;
    }

    if (
      peerSub.entityCode ===
        targetSubmission.entityCode &&
      peerSub.assessmentPeriod ===
        targetSubmission.assessmentPeriod
    ) {
      excludedSubmissions.push({
        submissionId:
          peerSub.submissionId,
        entityCode:
          peerSub.entityCode,
        reason:
          'Identical entity and assessment period candidate excluded to avoid baseline bias.',
        gateCheck:
          'DUPLICATE_ENTITY_CYCLE'
      });

      continue;
    }

    const gateEvaluation =
      evaluatePeerSubmissionQuality(
        peerSub,
        peerRecs
      );

    if (!gateEvaluation.eligible) {
      excludedSubmissions.push({
        submissionId:
          peerSub.submissionId,
        entityCode:
          peerSub.entityCode,
        reason:
          gateEvaluation.exclusionReason ??
          'Failed peer submission quality gate.',
        gateCheck:
          gateEvaluation.gateCheck ??
          'QUALITY_GATE'
      });

      continue;
    }

    const peerMetrics =
      calculateSubmissionPeerMetrics(
        peerRecs
      );

    validPeers.push({
      submissionId:
        peerSub.submissionId,
      entityCode:
        peerSub.entityCode,
      metrics: peerMetrics
    });
  }

  const validSampleSize =
    validPeers.length;

  const peerSubmissionIdsUsed =
    validPeers.map(
      (peer) => peer.submissionId
    );

  const metricEvaluations =
    {} as Record<
      PeerMetricCode,
      PeerDeviation
    >;

  for (const code of ALL_PEER_METRIC_CODES) {
    const peerValuesForMetric: number[] = [];

    for (const peer of validPeers) {
      const value =
        peer.metrics[code];

      if (
        value !== null &&
        typeof value === 'number' &&
        Number.isFinite(value)
      ) {
        peerValuesForMetric.push(value);
      }
    }

    const baseline =
      calculatePeerBaseline(
        code,
        peerValuesForMetric
      );

    const deviation =
      evaluatePeerDeviation(
        code,
        targetMetrics[code],
        baseline,
        options
      );

    metricEvaluations[code] =
      deviation;
  }

  let overallStatus:
    | 'NO_BASELINE'
    | 'INCONCLUSIVE'
    | 'EVALUATED' =
    'EVALUATED';

  let summaryStatement = '';

  if (validSampleSize === 0) {
    overallStatus =
      'NO_BASELINE';

    summaryStatement =
      `No sufficient comparable peer submissions available. Peer baseline cannot be established with 0 valid peer submissions (minimum ${options.minimumPeerSampleSize} required).`;
  } else if (
    validSampleSize <
    options.minimumPeerSampleSize
  ) {
    overallStatus =
      'INCONCLUSIVE';

    summaryStatement =
      `Inconclusive peer context: ${validSampleSize} valid peer submission(s) identified, which is below the minimum threshold of ${options.minimumPeerSampleSize}. Peer baselines cannot be established with sufficient stability.`;
  } else {
    overallStatus =
      'EVALUATED';

    const deviationCount =
      Object.values(
        metricEvaluations
      ).filter(
        (metric) =>
          metric.status ===
          'PEER_DEVIATION'
      ).length;

    if (deviationCount > 0) {
      summaryStatement =
        `Peer benchmarking evaluated against N=${validSampleSize} comparable peer submissions. Identified ${deviationCount} operational metric deviation(s) warranting supervisory attention. Peer deviation provides analytical context, not proof of non-compliance.`;
    } else {
      summaryStatement =
        `Peer benchmarking evaluated against N=${validSampleSize} comparable peer submissions. All evaluable operational metrics fall within the configured peer comparison thresholds.`;
    }
  }

  return {
    targetSubmission: {
      submissionId:
        targetSubmission.submissionId,
      entityCode:
        targetSubmission.entityCode,
      entityId:
        targetSubmission.entityId,
      assessmentPeriod:
        targetSubmission.assessmentPeriod,
      recordCount:
        targetSubmission.recordCount,
      completenessPercentage:
        targetSubmission.completenessPercentage,
      dataQualityStatus:
        targetSubmission.dataQualityStatus
    },

    targetPeerProfile:
      peerProfile,

    peerGroup,

    peerSubmissionIdsUsed,

    sampleSize:
      validSampleSize,

    minimumPeerSampleSize:
      options.minimumPeerSampleSize,

    excludedSubmissions,

    dataQualityLimitations,

    metrics:
      metricEvaluations,

    overallStatus,

    summaryStatement,

    calculatedAt:
      evaluatedAt
  };
}