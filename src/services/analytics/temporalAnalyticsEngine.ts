import {
  NormalizedCaseRecord,
  SubmissionMetadata,
  DataQualityReport,
  SeverityLevel
} from '../../types';
import {
  TemporalAnalyticsResult,
  TemporalBaseline,
  TemporalBaselineMetric,
  TemporalMetricType,
  CaseTemporalEvaluation
} from '../../types/temporal';

export const RULE_TEMP_01_METADATA = {
  ruleCode: 'RULE-TEMP-01' as const,
  ruleName: 'Operational Timing Deviation',
  ruleDescription:
    'Identifies material deviations in operational workflow timing relative to the observed submission baseline.',
  ruleCategory: 'Behavioural / Temporal' as const
};

const MIN_BASELINE_SAMPLE = 3;
const MIN_DEVIATION_SECONDS = 300;
const MIN_DEVIATION_RATIO = 1.5;

interface TimingObservation {
  metricType: TemporalMetricType;
  valueSeconds: number;
  sourceRecordId: string;
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function durationBetween(
  start: string | null | undefined,
  end: string | null | undefined
): number | null {
  const startMs = parseTimestamp(start);
  const endMs = parseTimestamp(end);

  if (startMs === null || endMs === null) {
    return null;
  }

  const duration = Math.floor((endMs - startMs) / 1000);

  if (duration < 0) {
    return null;
  }

  return duration;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function medianAbsoluteDeviation(
  values: number[],
  center: number | null
): number | null {
  if (values.length === 0 || center === null) {
    return null;
  }

  const deviations = values.map((value) => Math.abs(value - center));

  return median(deviations);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildObservations(
  record: NormalizedCaseRecord
): TimingObservation[] {
  const observations: TimingObservation[] = [];

  const triageDuration = durationBetween(
    record.alertTimestamp,
    record.triageTimestamp
  );

  if (triageDuration !== null) {
    observations.push({
      metricType: 'TRIAGE_DURATION',
      valueSeconds: triageDuration,
      sourceRecordId: record.sourceRecordId
    });
  }

  const escalationDelay = durationBetween(
    record.triageTimestamp,
    record.escalationTimestamp
  );

  if (escalationDelay !== null) {
    observations.push({
      metricType: 'ESCALATION_DELAY',
      valueSeconds: escalationDelay,
      sourceRecordId: record.sourceRecordId
    });
  }

  const supervisorReviewDelay = durationBetween(
    record.escalationTimestamp || record.triageTimestamp,
    record.supervisorReviewTimestamp
  );

  if (supervisorReviewDelay !== null) {
    observations.push({
      metricType: 'SUPERVISOR_REVIEW_DELAY',
      valueSeconds: supervisorReviewDelay,
      sourceRecordId: record.sourceRecordId
    });
  }

  const closureElapsed = durationBetween(
    record.alertTimestamp,
    record.closureTimestamp
  );

  if (closureElapsed !== null) {
    observations.push({
      metricType: 'CLOSURE_ELAPSED_TIME',
      valueSeconds: closureElapsed,
      sourceRecordId: record.sourceRecordId
    });
  }

  return observations;
}

function hasOperationalSequencingWarning(
  record: NormalizedCaseRecord,
  qualityReport?: DataQualityReport | null
): boolean {
  return Boolean(
    qualityReport?.issues?.some(
      (issue) =>
        issue.severity === 'WARNING' &&
        issue.code === 'OPERATIONAL_SEQUENCING_ANOMALY' &&
        (issue.caseId === record.caseId ||
          issue.sourceRecordId === record.sourceRecordId)
    )
  );
}

function hasAnyQualityIssue(
  record: NormalizedCaseRecord,
  qualityReport?: DataQualityReport | null
): boolean {
  return Boolean(
    qualityReport?.issues?.some(
      (issue) =>
        (issue.severity === 'ERROR' || issue.severity === 'WARNING') &&
        (issue.caseId === record.caseId ||
          issue.sourceRecordId === record.sourceRecordId)
    )
  );
}

function isRecordDataQualityLimited(
  record: NormalizedCaseRecord,
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): boolean {
  if (
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID'
  ) {
    return true;
  }

  if (
    submission?.completenessPercentage !== undefined &&
    submission.completenessPercentage < 40
  ) {
    return true;
  }

  if (!record.caseId || !record.sourceRecordId) {
    return true;
  }

  if (!parseTimestamp(record.alertTimestamp)) {
    return true;
  }

  if (hasAnyQualityIssue(record, qualityReport)) {
    return true;
  }

  return false;
}

function isBaselineEligible(
  record: NormalizedCaseRecord,
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): boolean {
  if (record.severity !== 'CRITICAL' && record.severity !== 'HIGH') {
    return false;
  }

  if (
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID'
  ) {
    return false;
  }

  if (
    submission?.completenessPercentage !== undefined &&
    submission.completenessPercentage < 40
  ) {
    return false;
  }

  if (!record.caseId || !record.sourceRecordId) {
    return false;
  }

  if (!parseTimestamp(record.alertTimestamp)) {
    return false;
  }

  if (hasAnyQualityIssue(record, qualityReport)) {
    return false;
  }

  return buildObservations(record).length > 0;
}

function buildBaseline(
  records: NormalizedCaseRecord[],
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null,
  warnings: string[] = []
): TemporalBaseline {
  const observationsByMetric = new Map<TemporalMetricType, number[]>();

  const metricTypes: TemporalMetricType[] = [
    'TRIAGE_DURATION',
    'ESCALATION_DELAY',
    'SUPERVISOR_REVIEW_DELAY',
    'CLOSURE_ELAPSED_TIME'
  ];

  for (const metricType of metricTypes) {
    observationsByMetric.set(metricType, []);
  }

  let eligibleRecordCount = 0;

  for (const record of records) {
    if (!isBaselineEligible(record, submission, qualityReport)) {
      continue;
    }

    const observations = buildObservations(record);

    if (observations.length === 0) {
      continue;
    }

    eligibleRecordCount += 1;

    for (const observation of observations) {
      observationsByMetric.get(observation.metricType)?.push(
        observation.valueSeconds
      );
    }
  }

  const metrics: TemporalBaselineMetric[] = metricTypes.map((metricType) => {
    const values = observationsByMetric.get(metricType) || [];

    const medianSeconds = median(values);
    const madSeconds = medianAbsoluteDeviation(values, medianSeconds);

    const deviationThresholdSeconds =
      medianSeconds === null
        ? null
        : Math.max(
            MIN_DEVIATION_SECONDS,
            (madSeconds ?? 0) * 3,
            medianSeconds * (MIN_DEVIATION_RATIO - 1)
          );

    return {
      metricType,
      sampleCount: values.length,
      medianSeconds,
      madSeconds,
      minimumSeconds: values.length > 0 ? Math.min(...values) : null,
      maximumSeconds: values.length > 0 ? Math.max(...values) : null,
      deviationThresholdSeconds
    };
  });

  if (eligibleRecordCount < MIN_BASELINE_SAMPLE) {
    warnings.push(
      `Temporal baseline contains only ${eligibleRecordCount} quality-valid CRITICAL/HIGH record(s) with usable timing evidence. At least ${MIN_BASELINE_SAMPLE} records are recommended for baseline interpretation.`
    );
  }

  return {
    entityId: records[0]?.entityId || '',
    entityCode: records[0]?.entityCode || '',
    assessmentPeriod: records[0]?.assessmentPeriod || 'UNKNOWN_PERIOD',
    metrics,
    baselineRecordCount: eligibleRecordCount,
    usableRecordCount: eligibleRecordCount,
    warnings
  };
}

function getMetricValue(
  observations: TimingObservation[],
  metricType: TemporalMetricType
): TimingObservation | null {
  return (
    observations.find(
      (observation) => observation.metricType === metricType
    ) || null
  );
}

function evaluateRecord(
  record: NormalizedCaseRecord,
  baseline: TemporalBaseline,
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): CaseTemporalEvaluation {
  const base = {
    caseId: record.caseId || 'UNKNOWN_CASE',
    sourceRecordId: record.sourceRecordId,
    submissionId: record.submissionId,
    entityCode: record.entityCode,
    entityId: record.entityId,
    severity: record.severity as SeverityLevel,
    triageDurationSeconds: null as number | null,
    escalationDelaySeconds: null as number | null,
    supervisorReviewDelaySeconds: null as number | null,
    closureElapsedSeconds: null as number | null,
    deviationMetric: null as TemporalMetricType | null,
    deviationSeconds: null as number | null,
    deviationRatio: null as number | null,
    baselineAvailable: false,
    passedDataQualityGate: false,
    disposition: record.disposition,
    rawPayloadSnippet: record.sourcePayload
  };

  if (record.severity !== 'CRITICAL' && record.severity !== 'HIGH') {
    return {
      ...base,
      classification: 'NOT_APPLICABLE',
      reason:
        'Temporal supervisory analysis is scoped to CRITICAL and HIGH operational cases.',
      passedDataQualityGate: true
    };
  }

  if (isRecordDataQualityLimited(record, submission, qualityReport)) {
    const sequencingWarning = hasOperationalSequencingWarning(
      record,
      qualityReport
    );

    return {
      ...base,
      classification: 'DATA_QUALITY_LIMITED',
      reason: sequencingWarning
        ? 'Temporal assessment limited because the submitted workflow contains an operational sequencing anomaly. Affected timing intervals require data-quality review.'
        : 'Temporal assessment limited by incomplete or malformed source evidence. Requires data-quality review.'
    };
  }

  const observations = buildObservations(record);

  const triage = getMetricValue(observations, 'TRIAGE_DURATION');
  const escalation = getMetricValue(observations, 'ESCALATION_DELAY');
  const supervisorReview = getMetricValue(
    observations,
    'SUPERVISOR_REVIEW_DELAY'
  );
  const closure = getMetricValue(observations, 'CLOSURE_ELAPSED_TIME');

  base.triageDurationSeconds = triage?.valueSeconds ?? null;
  base.escalationDelaySeconds = escalation?.valueSeconds ?? null;
  base.supervisorReviewDelaySeconds =
    supervisorReview?.valueSeconds ?? null;
  base.closureElapsedSeconds = closure?.valueSeconds ?? null;
  base.passedDataQualityGate = true;

  if (observations.length === 0) {
    return {
      ...base,
      classification: 'INCONCLUSIVE',
      reason:
        'No usable workflow timing interval is available in the submitted record.'
    };
  }

  const candidates = observations
    .map((observation) => {
      const metric = baseline.metrics.find(
        (item) => item.metricType === observation.metricType
      );

      if (
        !metric ||
        metric.sampleCount < MIN_BASELINE_SAMPLE ||
        metric.medianSeconds === null ||
        metric.deviationThresholdSeconds === null
      ) {
        return null;
      }

      const deviationSeconds =
        observation.valueSeconds - metric.medianSeconds;

      const absoluteDeviation = Math.abs(deviationSeconds);

      const deviationRatio =
        metric.medianSeconds === 0
          ? null
          : observation.valueSeconds / metric.medianSeconds;

      const isDeviation =
        absoluteDeviation >= metric.deviationThresholdSeconds &&
        (deviationRatio === null ||
          deviationRatio >= MIN_DEVIATION_RATIO ||
          deviationRatio <= 1 / MIN_DEVIATION_RATIO);

      if (!isDeviation) {
        return null;
      }

      return {
        metricType: observation.metricType,
        deviationSeconds,
        deviationRatio,
        absoluteDeviation
      };
    })
    .filter(
      (
        candidate
      ): candidate is {
        metricType: TemporalMetricType;
        deviationSeconds: number;
        deviationRatio: number | null;
        absoluteDeviation: number;
      } => candidate !== null
    )
    .sort((a, b) => b.absoluteDeviation - a.absoluteDeviation);

  if (candidates.length === 0) {
    const hasBaseline = baseline.metrics.some(
      (metric) => metric.sampleCount >= MIN_BASELINE_SAMPLE
    );

    if (!hasBaseline) {
      return {
        ...base,
        classification: 'INCONCLUSIVE',
        reason:
          'Usable timing evidence exists, but the quality-valid submission does not contain enough comparable observations to establish a reliable temporal baseline.'
      };
    }

    return {
      ...base,
      classification: 'NORMAL',
      baselineAvailable: true,
      reason:
        'Observed workflow timing is within the deterministic baseline range for the available quality-valid timing metrics.'
    };
  }

  const strongestDeviation = candidates[0];

  return {
    ...base,
    classification: 'TIMING_DEVIATION',
    baselineAvailable: true,
    deviationMetric: strongestDeviation.metricType,
    deviationSeconds: round(strongestDeviation.deviationSeconds),
    deviationRatio:
      strongestDeviation.deviationRatio === null
        ? null
        : round(strongestDeviation.deviationRatio),
    reason:
      `Potential timing deviation detected in ${strongestDeviation.metricType}. Observed timing differs materially from the quality-valid submission baseline and requires supervisory review.`
  };
}

export function calculateTemporalAnalytics(
  records: NormalizedCaseRecord[],
  submission?: SubmissionMetadata | null,
  qualityReport?: DataQualityReport | null
): TemporalAnalyticsResult {
  const evaluatedAt = new Date().toISOString();
  const warnings: string[] = [];

  if (records.length === 0) {
    warnings.push(
      'No normalized case records were supplied for temporal analysis.'
    );
  }

  if (
    submission?.dataQualityStatus === 'REJECTED' ||
    submission?.dataQualityStatus === 'INVALID'
  ) {
    warnings.push(
      'Submission data quality status is REJECTED/INVALID. Temporal deviations should not be interpreted as reliable until source quality is reviewed.'
    );
  }

  const sequencingWarningCount =
    qualityReport?.issues?.filter(
      (issue) =>
        issue.severity === 'WARNING' &&
        issue.code === 'OPERATIONAL_SEQUENCING_ANOMALY'
    ).length || 0;

  if (sequencingWarningCount > 0) {
    warnings.push(
      `${sequencingWarningCount} operational sequencing warning(s) were excluded from the temporal baseline and classified as data-quality limited where applicable.`
    );
  }

  const baseline = buildBaseline(
    records,
    submission,
    qualityReport,
    warnings
  );

  const caseEvaluations = records.map((record) =>
    evaluateRecord(record, baseline, submission, qualityReport)
  );

  const totalEvaluatedCases = caseEvaluations.length;

  const applicableCaseCount = caseEvaluations.filter(
    (evaluation) =>
      evaluation.classification !== 'NOT_APPLICABLE'
  ).length;

  const timingDeviationCount = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'TIMING_DEVIATION'
  ).length;

  const normalCaseCount = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'NORMAL'
  ).length;

  const dataQualityLimitedCount = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'DATA_QUALITY_LIMITED'
  ).length;

  const inconclusiveCount = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'INCONCLUSIVE'
  ).length;

  const notApplicableCount = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'NOT_APPLICABLE'
  ).length;

  const denominator =
    normalCaseCount +
    timingDeviationCount;

  const deviationRate =
    denominator === 0
      ? 0
      : round((timingDeviationCount / denominator) * 100);

  const affectedEvaluations = caseEvaluations.filter(
    (evaluation) => evaluation.classification === 'TIMING_DEVIATION'
  );

  const affectedCaseIds = affectedEvaluations.map(
    (evaluation) => evaluation.caseId
  );

  const sourceRecordIds = affectedEvaluations.map(
    (evaluation) => evaluation.sourceRecordId
  );

  if (dataQualityLimitedCount > 0) {
    warnings.push(
      `${dataQualityLimitedCount} case(s) could not be evaluated because source data quality was insufficient.`
    );
  }

  if (inconclusiveCount > 0) {
    warnings.push(
      `${inconclusiveCount} case(s) contain timing evidence that cannot be compared reliably with the available baseline.`
    );
  }

  let interpretation: string;

  if (totalEvaluatedCases === 0) {
    interpretation =
      'No normalized cases were supplied for behavioural or temporal analysis.';
  } else if (denominator === 0) {
    interpretation =
      'No valid CRITICAL/HIGH cases have both usable timing evidence and an adequate quality-valid baseline. Temporal conclusions are inconclusive.';
  } else if (timingDeviationCount === 0) {
    interpretation =
      `No material timing deviations were identified across ${denominator} comparable CRITICAL/HIGH cases.`;
  } else {
    interpretation =
      `Potential timing deviations were identified in ${timingDeviationCount} of ${denominator} comparable CRITICAL/HIGH cases (${deviationRate}%). These signals represent operational timing differences and require supervisory review; they do not establish cause or intent.`;
  }

  return {
    summary: {
      ruleCode: RULE_TEMP_01_METADATA.ruleCode,
      ruleName: RULE_TEMP_01_METADATA.ruleName,
      ruleDescription: RULE_TEMP_01_METADATA.ruleDescription,
      ruleCategory: RULE_TEMP_01_METADATA.ruleCategory,
      totalEvaluatedCases,
      applicableCaseCount,
      timingDeviationCount,
      normalCaseCount,
      dataQualityLimitedCount,
      inconclusiveCount,
      notApplicableCount,
      deviationRate,
      baselineAvailable: baseline.metrics.some(
        (metric) => metric.sampleCount >= MIN_BASELINE_SAMPLE
      ),
      baselineRecordCount: baseline.baselineRecordCount,
      affectedCaseIds,
      sourceRecordIds,
      warnings,
      interpretation,
      evaluatedAt
    },
    baseline,
    caseEvaluations
  };
}