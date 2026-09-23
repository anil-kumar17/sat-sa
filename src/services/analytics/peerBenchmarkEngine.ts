/**
 * SAT-SA Peer Benchmarking Engine
 * 
 * Purpose:
 * Pure deterministic calculation engine that compares a CSE submission's observed
 * operational metrics against an eligible cohort of comparable peer submissions.
 * 
 * Crucial Supervisory Principle:
 * Peer deviation provides supervisory context — it is NEVER treated as proof of
 * compromise, non-compliance, or negligence. All observations are framed as
 * "potential weaknesses", "peer deviations", or "elevated supervisory attention"
 * requiring human inspection.
 * 
 * Architectural Constraints:
 * - Pure deterministic functions
 * - No React, IndexedDB, network, or external AI dependencies
 * - Full exclusion auditability (no silent drops)
 * - Strict data quality gates (INVALID/REJECTED or low-completeness excluded)
 * - Minimum peer sample size enforcement (default: 3; returns INCONCLUSIVE if unmet)
 * - Median-based statistics to prevent outlier distortion
 */

import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport
} from '../../types';
import {
  PeerGroup,
  PeerProfile,
  PeerMetricCode,
  PeerMetricType,
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
  percentageDeviationThreshold: 15.0, // 15 percentage points
  durationRatioUpperThreshold: 1.5,   // 50% slower / longer
  durationRatioLowerThreshold: 0.67   // notably faster / truncated
};

export const PEER_METRIC_DEFINITIONS: Record<PeerMetricCode, PeerMetricDefinition> = {
  ESCALATION_EVIDENCE_COVERAGE: {
    code: 'ESCALATION_EVIDENCE_COVERAGE',
    name: 'Escalation Evidence Coverage',
    description:
      'Proportion of applicable escalation workflow events with verified recorded evidence.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription: 'Deviation of >= 15.0 percentage points from peer median'
  },
  SUPERVISOR_REVIEW_COVERAGE: {
    code: 'SUPERVISOR_REVIEW_COVERAGE',
    name: 'Supervisor Review Coverage',
    description:
      'Proportion of operational cases with documented supervisor review evidence.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription: 'Deviation of >= 15.0 percentage points from peer median'
  },
  CLOSURE_EVIDENCE_COVERAGE: {
    code: 'CLOSURE_EVIDENCE_COVERAGE',
    name: 'Closure Evidence Coverage',
    description:
      'Proportion of closed cases with verifiable closure and disposition evidence.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription: 'Deviation of >= 15.0 percentage points from peer median'
  },
  EXECUTION_GAP_RATE: {
    code: 'EXECUTION_GAP_RATE',
    name: 'Execution Gap Rate',
    description:
      'Rate of identified potential operational execution gaps across evaluated cases.',
    type: 'PERCENTAGE',
    unit: '%',
    thresholdDescription: 'Deviation of >= 15.0 percentage points from peer median'
  },
  TRIAGE_DURATION: {
    code: 'TRIAGE_DURATION',
    name: 'Median Triage Duration',
    description:
      'Median duration from initial alert generation to completed operational triage.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription: 'Deviation ratio > 1.5x (slower) or < 0.67x (faster) than peer median'
  },
  ESCALATION_DELAY: {
    code: 'ESCALATION_DELAY',
    name: 'Median Escalation Delay',
    description:
      'Median duration from triage completion (or alert) to documented escalation.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription: 'Deviation ratio > 1.5x (slower) or < 0.67x (faster) than peer median'
  },
  SUPERVISOR_REVIEW_DELAY: {
    code: 'SUPERVISOR_REVIEW_DELAY',
    name: 'Median Supervisor Review Delay',
    description:
      'Median duration from escalation/triage to recorded supervisor review.',
    type: 'DURATION',
    unit: 'minutes',
    thresholdDescription: 'Deviation ratio > 1.5x (slower) or < 0.67x (faster) than peer median'
  },
  CLOSURE_ELAPSED: {
    code: 'CLOSURE_ELAPSED',
    name: 'Median Case Closure Elapsed Time',
    description:
      'Median duration from alert trigger to formal case disposition and closure.',
    type: 'DURATION',
    unit: 'hours',
    thresholdDescription: 'Deviation ratio > 1.5x (slower) or < 0.67x (faster) than peer median'
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

// ============================================================================
// Deterministic Statistical Utilities
// ============================================================================

/**
 * Deterministic median calculation.
 * Returns null if input array is empty.
 */
export function calculateMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const filtered = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const val = (sorted[mid - 1] + sorted[mid]) / 2;
    return Math.round(val * 100) / 100;
  }

  return Math.round(sorted[mid] * 100) / 100;
}

/**
 * Deterministic percentile calculation (nearest-rank method).
 */
export function calculatePercentile(values: number[], percentile: number): number | null {
  if (!values || values.length === 0) return null;
  const filtered = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const clampedPercentile = Math.max(0, Math.min(100, percentile));
  const rank = Math.ceil((clampedPercentile / 100) * sorted.length) - 1;
  const index = Math.max(0, Math.min(sorted.length - 1, rank));

  return Math.round(sorted[index] * 100) / 100;
}

/**
 * Helper to safely parse ISO timestamp strings into milliseconds.
 */
function parseTimestamp(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? null : parsed;
}

// ============================================================================
// Single-Submission Metric Calculation Functions
// ============================================================================

/**
 * Calculates escalation evidence coverage across applicable cases.
 * Returns null if no applicable cases exist.
 */
export function calculateEscalationEvidenceCoverage(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const applicable = records.filter(
    (r) =>
      r.severity === 'CRITICAL' ||
      r.severity === 'HIGH' ||
      r.escalationRecorded ||
      r.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT'
  );

  if (applicable.length === 0) return null;

  const covered = applicable.filter(
    (r) =>
      r.evidencePresence?.escalationEvidence === 'EVIDENCE_PRESENT' ||
      (r.escalationRecorded && r.escalationTimestamp !== null)
  );

  return Math.round((covered.length / applicable.length) * 1000) / 10;
}

/**
 * Calculates supervisor review coverage across all records.
 * Returns null if record list is empty.
 */
export function calculateSupervisorReviewCoverage(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const reviewed = records.filter(
    (r) =>
      r.supervisorReviewRecorded ||
      r.evidencePresence?.supervisorReviewEvidence === 'EVIDENCE_PRESENT' ||
      r.supervisorReviewTimestamp !== null
  );

  return Math.round((reviewed.length / records.length) * 1000) / 10;
}

/**
 * Calculates closure evidence coverage across disposed or closed cases.
 * Returns null if no closed cases exist.
 */
export function calculateClosureEvidenceCoverage(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const closed = records.filter(
    (r) =>
      r.closureTimestamp !== null ||
      r.disposition !== null ||
      r.evidencePresence?.closureEvidence === 'EVIDENCE_PRESENT'
  );

  if (closed.length === 0) return null;

  const covered = closed.filter(
    (r) =>
      r.evidencePresence?.closureEvidence === 'EVIDENCE_PRESENT' ||
      (r.closureTimestamp !== null && r.disposition !== null)
  );

  return Math.round((covered.length / closed.length) * 1000) / 10;
}

/**
 * Calculates execution gap rate across critical operational cases.
 * Returns null if no critical cases exist.
 */
export function calculateExecutionGapRate(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const critical = records.filter((r) => r.severity === 'CRITICAL');
  if (critical.length === 0) return null;

  const gaps = critical.filter(
    (r) =>
      !r.escalationRecorded &&
      r.evidencePresence?.escalationEvidence !== 'EVIDENCE_PRESENT' &&
      !r.escalationTimestamp
  );

  return Math.round((gaps.length / critical.length) * 1000) / 10;
}

/**
 * Calculates median triage duration in minutes.
 * Returns null if no triage timestamps exist.
 */
export function calculateMedianTriageDuration(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];
  for (const r of records) {
    const alertMs = parseTimestamp(r.alertTimestamp);
    const triageMs = parseTimestamp(r.triageTimestamp);
    if (alertMs !== null && triageMs !== null) {
      const minutes = (triageMs - alertMs) / 60000;
      if (minutes >= 0) {
        durations.push(minutes);
      }
    }
  }

  return calculateMedian(durations);
}

/**
 * Calculates median escalation delay in minutes from triage/alert.
 * Returns null if no escalation timestamps exist.
 */
export function calculateMedianEscalationDelay(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];
  for (const r of records) {
    const startMs = parseTimestamp(r.triageTimestamp) ?? parseTimestamp(r.alertTimestamp);
    const escMs = parseTimestamp(r.escalationTimestamp);
    if (startMs !== null && escMs !== null) {
      const minutes = (escMs - startMs) / 60000;
      if (minutes >= 0) {
        durations.push(minutes);
      }
    }
  }

  return calculateMedian(durations);
}

/**
 * Calculates median supervisor review delay in minutes.
 * Returns null if no review timestamps exist.
 */
export function calculateMedianSupervisorReviewDelay(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];
  for (const r of records) {
    const startMs =
      parseTimestamp(r.escalationTimestamp) ??
      parseTimestamp(r.triageTimestamp) ??
      parseTimestamp(r.alertTimestamp);
    const reviewMs = parseTimestamp(r.supervisorReviewTimestamp);
    if (startMs !== null && reviewMs !== null) {
      const minutes = (reviewMs - startMs) / 60000;
      if (minutes >= 0) {
        durations.push(minutes);
      }
    }
  }

  return calculateMedian(durations);
}

/**
 * Calculates median case closure elapsed time in hours.
 * Returns null if no closure timestamps exist.
 */
export function calculateMedianClosureElapsed(records: NormalizedCaseRecord[]): number | null {
  if (!records || records.length === 0) return null;

  const durations: number[] = [];
  for (const r of records) {
    const alertMs = parseTimestamp(r.alertTimestamp);
    const closureMs = parseTimestamp(r.closureTimestamp);
    if (alertMs !== null && closureMs !== null) {
      const hours = (closureMs - alertMs) / 3600000;
      if (hours >= 0) {
        durations.push(hours);
      }
    }
  }

  return calculateMedian(durations);
}

/**
 * Computes all 8 peer benchmarking metrics for a given submission's normalized records.
 */
export function calculateSubmissionPeerMetrics(
  records: NormalizedCaseRecord[]
): Record<PeerMetricCode, number | null> {
  return {
    ESCALATION_EVIDENCE_COVERAGE: calculateEscalationEvidenceCoverage(records),
    SUPERVISOR_REVIEW_COVERAGE: calculateSupervisorReviewCoverage(records),
    CLOSURE_EVIDENCE_COVERAGE: calculateClosureEvidenceCoverage(records),
    EXECUTION_GAP_RATE: calculateExecutionGapRate(records),
    TRIAGE_DURATION: calculateMedianTriageDuration(records),
    ESCALATION_DELAY: calculateMedianEscalationDelay(records),
    SUPERVISOR_REVIEW_DELAY: calculateMedianSupervisorReviewDelay(records),
    CLOSURE_ELAPSED: calculateMedianClosureElapsed(records)
  };
}

// ============================================================================
// Quality Gates for Peer Ingestion
// ============================================================================

export interface QualityGateEvaluation {
  eligible: boolean;
  exclusionReason?: string;
  gateCheck?: string;
}

/**
 * Evaluates whether a peer candidate submission satisfies strict supervisory quality gates.
 * Excludes submissions that are invalid, rejected, below 40% completeness, or lack valid records.
 */
export function evaluatePeerSubmissionQuality(
  submission: SubmissionMetadata,
  records: NormalizedCaseRecord[]
): QualityGateEvaluation {
  if (!submission) {
    return {
      eligible: false,
      exclusionReason: 'Peer submission metadata is missing or null.',
      gateCheck: 'METADATA_PRESENCE'
    };
  }

  if (!submission.submissionId || !submission.entityCode || !submission.assessmentPeriod) {
    return {
      eligible: false,
      exclusionReason: 'Critical supervisory identifiers missing (submissionId, entityCode, or period).',
      gateCheck: 'MISSING_CRITICAL_IDENTIFIERS'
    };
  }

  if (submission.dataQualityStatus === 'INVALID' || submission.dataQualityStatus === 'REJECTED') {
    return {
      eligible: false,
      exclusionReason: `Submission data quality status is ${submission.dataQualityStatus}. Excluded by quality gate.`,
      gateCheck: 'INVALID_OR_REJECTED_STATUS'
    };
  }

  if (typeof submission.completenessPercentage === 'number' && submission.completenessPercentage < 40) {
    return {
      eligible: false,
      exclusionReason: `Submission completeness (${submission.completenessPercentage}%) is below the minimum supervisory threshold of 40%.`,
      gateCheck: 'COMPLETENESS_BELOW_THRESHOLD'
    };
  }

  if (!records || records.length === 0) {
    return {
      eligible: false,
      exclusionReason: 'No normalized case records available for peer metric evaluation.',
      gateCheck: 'INSUFFICIENT_RECORDS'
    };
  }

  return { eligible: true };
}

// ============================================================================
// Peer Baseline & Deviation Evaluation
// ============================================================================

/**
 * Calculates deterministic peer baseline statistics across valid peer values.
 */
export function calculatePeerBaseline(
  metricCode: PeerMetricCode,
  peerValues: number[]
): PeerBaseline {
  const def = PEER_METRIC_DEFINITIONS[metricCode];
  const validValues = peerValues.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  const sampleSize = validValues.length;

  if (sampleSize === 0) {
    return {
      metricCode,
      metricType: def.type,
      unit: def.unit,
      sampleSize: 0,
      validPeerValues: [],
      median: null,
      min: null,
      max: null,
      p25: null,
      p75: null
    };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  return {
    metricCode,
    metricType: def.type,
    unit: def.unit,
    sampleSize,
    validPeerValues: sorted,
    median: calculateMedian(sorted),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: calculatePercentile(sorted, 25),
    p75: calculatePercentile(sorted, 75)
  };
}

/**
 * Evaluates target metric value against peer baseline with supervisory interpretation.
 */
export function evaluatePeerDeviation(
  metricCode: PeerMetricCode,
  targetValue: number | null,
  baseline: PeerBaseline,
  options: Required<PeerBenchmarkOptions>
): PeerDeviation {
  const def = PEER_METRIC_DEFINITIONS[metricCode];

  // Case 1: Target metric cannot be evaluated
  if (targetValue === null) {
    return {
      metricCode,
      metricName: def.name,
      metricType: def.type,
      unit: def.unit,
      targetValue: null,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'NO_BASELINE',
      deviationDescription: 'Metric unavailable for target submission.',
      supervisoryInterpretation:
        'Target submission lacks sufficient operational instances to calculate this metric. Requires further review if workflow events were expected.'
    };
  }

  // Case 2: No peer submissions available
  if (!baseline || baseline.sampleSize === 0) {
    return {
      metricCode,
      metricName: def.name,
      metricType: def.type,
      unit: def.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'NO_BASELINE',
      deviationDescription: 'No comparable peer baseline available.',
      supervisoryInterpretation:
        'No eligible peer submissions currently recorded for this comparison group. Peer deviation cannot be established.'
    };
  }

  // Case 3: Peer sample size below minimum threshold
  if (baseline.sampleSize < options.minimumPeerSampleSize) {
    return {
      metricCode,
      metricName: def.name,
      metricType: def.type,
      unit: def.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'INCONCLUSIVE',
      deviationDescription: `Inconclusive: Peer sample size (N=${baseline.sampleSize}) is below minimum requirement of ${options.minimumPeerSampleSize}.`,
      supervisoryInterpretation:
        `Observed sample size (N=${baseline.sampleSize}) is insufficient for statistical confidence. Do not draw adverse supervisory inferences without an adequate baseline.`
    };
  }

  const peerMedian = baseline.median;
  if (peerMedian === null) {
    return {
      metricCode,
      metricName: def.name,
      metricType: def.type,
      unit: def.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: null,
      deviationRatio: null,
      status: 'INCONCLUSIVE',
      deviationDescription: 'Peer baseline median could not be determined.',
      supervisoryInterpretation: 'Statistical calculation resulted in an inconclusive baseline.'
    };
  }

  // Case 4: Valid baseline exists -> Evaluate Percentage metric
  if (def.type === 'PERCENTAGE') {
    const diff = Math.round((targetValue - peerMedian) * 10) / 10;
    const isDeviation = Math.abs(diff) >= options.percentageDeviationThreshold;
    const status: PeerDeviationStatus = isDeviation ? 'PEER_DEVIATION' : 'WITHIN_PEER_RANGE';

    let supervisoryInterpretation = '';
    if (status === 'PEER_DEVIATION') {
      if (diff < 0) {
        supervisoryInterpretation = `Target observed rate (${targetValue}%) is ${Math.abs(diff)} percentage points below peer median (${peerMedian}%). Elevated supervisory attention recommended to investigate operational coverage.`;
      } else {
        supervisoryInterpretation = `Target observed rate (${targetValue}%) is ${diff} percentage points above peer median (${peerMedian}%). Reflects higher coverage than peer cohort; operational context should be reviewed.`;
      }
    } else {
      supervisoryInterpretation = `Target observed rate (${targetValue}%) is within standard peer range (median: ${peerMedian}%). Consistent with observed peer practices.`;
    }

    return {
      metricCode,
      metricName: def.name,
      metricType: def.type,
      unit: def.unit,
      targetValue,
      peerBaseline: baseline,
      deviationPercentagePoints: diff,
      deviationRatio: null,
      status,
      deviationDescription: `${diff >= 0 ? '+' : ''}${diff} pp vs peer median (${peerMedian}%)`,
      supervisoryInterpretation
    };
  }

  // Case 5: Valid baseline exists -> Evaluate Duration metric
  const ratio = peerMedian > 0 ? Math.round((targetValue / peerMedian) * 100) / 100 : 1.0;
  const isSlower = ratio >= options.durationRatioUpperThreshold;
  const isFaster = ratio <= options.durationRatioLowerThreshold;
  const isDeviation = isSlower || isFaster;
  const status: PeerDeviationStatus = isDeviation ? 'PEER_DEVIATION' : 'WITHIN_PEER_RANGE';

  let supervisoryInterpretation = '';
  if (isSlower) {
    supervisoryInterpretation = `Target duration (${targetValue} ${def.unit}) is ${ratio}x slower than peer median (${peerMedian} ${def.unit}). Elevated supervisory attention recommended to assess response latency.`;
  } else if (isFaster) {
    supervisoryInterpretation = `Target duration (${targetValue} ${def.unit}) is notable (${ratio}x peer median ${peerMedian} ${def.unit}). Review to ensure operational triage and review were thoroughly conducted.`;
  } else {
    supervisoryInterpretation = `Target duration (${targetValue} ${def.unit}) is aligned with observed peer cohort (median: ${peerMedian} ${def.unit}).`;
  }

  return {
    metricCode,
    metricName: def.name,
    metricType: def.type,
    unit: def.unit,
    targetValue,
    peerBaseline: baseline,
    deviationPercentagePoints: null,
    deviationRatio: ratio,
    status,
    deviationDescription: `${ratio}x peer median (${peerMedian} ${def.unit})`,
    supervisoryInterpretation
  };
}

// ============================================================================
// Top-Level Benchmark Execution Engine
// ============================================================================

export interface PeerCandidateSubmission {
  submission: SubmissionMetadata;
  records: NormalizedCaseRecord[];
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

/**
 * Pure deterministic peer benchmarking evaluation function.
 * Evaluates target CSE submission against comparable peer submissions.
 */
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

  // 1. Audit target submission data quality context
  if (targetSubmission.dataQualityStatus === 'WARNINGS') {
    dataQualityLimitations.push(
      'Target submission has documented data quality warnings; metric interpretations should take these into account.'
    );
  }
  if (targetSubmission.completenessPercentage < 80) {
    dataQualityLimitations.push(
      `Target submission completeness is ${targetSubmission.completenessPercentage}%; results should be verified alongside raw source logs.`
    );
  }
  if (targetQualityReport?.issues && targetQualityReport.issues.length > 0) {
    dataQualityLimitations.push(
      `Identified ${targetQualityReport.issues.length} data quality issues in target submission records.`
    );
  }

  // 2. Calculate target metrics
  const targetMetrics = calculateSubmissionPeerMetrics(targetRecords);

  // 3. Process peer candidates through quality gates
  const validPeers: Array<{
    submissionId: string;
    entityCode: string;
    metrics: Record<PeerMetricCode, number | null>;
  }> = [];

  for (const candidate of peerCandidates) {
    const { submission: peerSub, records: peerRecs } = candidate;

    // Self-exclusion check: Target submission cannot benchmark against itself
    if (peerSub.submissionId === targetSubmission.submissionId) {
      excludedSubmissions.push({
        submissionId: peerSub.submissionId,
        entityCode: peerSub.entityCode,
        reason: 'Target submission cannot be included in its own peer comparison baseline.',
        gateCheck: 'SELF_EXCLUSION'
      });
      continue;
    }

    // Peer group matching check if a peer group is specified
    if (peerGroup) {
      if (
        peerSub.entityCode === targetSubmission.entityCode &&
        peerSub.assessmentPeriod === targetSubmission.assessmentPeriod
      ) {
        excludedSubmissions.push({
          submissionId: peerSub.submissionId,
          entityCode: peerSub.entityCode,
          reason: 'Identical entity and assessment period candidate excluded to avoid baseline bias.',
          gateCheck: 'DUPLICATE_ENTITY_CYCLE'
        });
        continue;
      }
    }

    // Strict quality gate evaluation
    const gateEval = evaluatePeerSubmissionQuality(peerSub, peerRecs);
    if (!gateEval.eligible) {
      excludedSubmissions.push({
        submissionId: peerSub.submissionId,
        entityCode: peerSub.entityCode,
        reason: gateEval.exclusionReason || 'Failed peer submission quality gate.',
        gateCheck: gateEval.gateCheck || 'QUALITY_GATE'
      });
      continue;
    }

    // Calculate candidate peer metrics
    const peerMetrics = calculateSubmissionPeerMetrics(peerRecs);
    validPeers.push({
      submissionId: peerSub.submissionId,
      entityCode: peerSub.entityCode,
      metrics: peerMetrics
    });
  }

  const validSampleSize = validPeers.length;
  const peerSubmissionIdsUsed = validPeers.map((p) => p.submissionId);

  // 4. Calculate metric baselines and evaluate deviations
  const metricEvaluations = {} as Record<PeerMetricCode, PeerDeviation>;

  for (const code of ALL_PEER_METRIC_CODES) {
    const peerValuesForMetric: number[] = [];
    for (const peer of validPeers) {
      const val = peer.metrics[code];
      if (val !== null && typeof val === 'number') {
        peerValuesForMetric.push(val);
      }
    }

    const baseline = calculatePeerBaseline(code, peerValuesForMetric);
    const deviation = evaluatePeerDeviation(
      code,
      targetMetrics[code],
      baseline,
      options
    );

    metricEvaluations[code] = deviation;
  }

  // 5. Determine overall benchmark status and summary statement
  let overallStatus: 'NO_BASELINE' | 'INCONCLUSIVE' | 'EVALUATED' = 'EVALUATED';
  let summaryStatement = '';

  if (validSampleSize === 0) {
    overallStatus = 'NO_BASELINE';
    summaryStatement =
      'No sufficient comparable peer submissions available. Peer baseline cannot be established with 0 valid peer submissions (minimum 3 required).';
  } else if (validSampleSize < options.minimumPeerSampleSize) {
    overallStatus = 'INCONCLUSIVE';
    summaryStatement = `Inconclusive peer context: ${validSampleSize} valid peer submission(s) identified, which is below the minimum threshold of ${options.minimumPeerSampleSize}. Peer baselines cannot be established with statistical confidence.`;
  } else {
    overallStatus = 'EVALUATED';
    const deviationCount = Object.values(metricEvaluations).filter(
      (m) => m.status === 'PEER_DEVIATION'
    ).length;

    if (deviationCount > 0) {
      summaryStatement = `Peer benchmarking evaluated against N=${validSampleSize} comparable peer submissions. Identified ${deviationCount} operational metric deviation(s) warranting supervisory attention. Peer deviation provides analytical context, not proof of non-compliance.`;
    } else {
      summaryStatement = `Peer benchmarking evaluated against N=${validSampleSize} comparable peer submissions. All evaluated operational metrics fall within the observed peer cohort distribution.`;
    }
  }

  return {
    targetSubmission: {
      submissionId: targetSubmission.submissionId,
      entityCode: targetSubmission.entityCode,
      entityId: targetSubmission.entityId,
      assessmentPeriod: targetSubmission.assessmentPeriod,
      recordCount: targetSubmission.recordCount,
      completenessPercentage: targetSubmission.completenessPercentage,
      dataQualityStatus: targetSubmission.dataQualityStatus
    },
    targetPeerProfile: peerProfile,
    peerGroup,
    peerSubmissionIdsUsed,
    sampleSize: validSampleSize,
    minimumPeerSampleSize: options.minimumPeerSampleSize,
    excludedSubmissions,
    dataQualityLimitations,
    metrics: metricEvaluations,
    overallStatus,
    summaryStatement,
    calculatedAt: evaluatedAt
  };
}
