/**
 * SAT-SA Peer Benchmarking Types
 * 
 * Defines core types for deterministic peer benchmarking across comparable CSE submissions.
 * Peer deviation provides supervisory context — it is never treated as proof of compromise or violation.
 */

export type PeerMetricCode =
  | 'ESCALATION_EVIDENCE_COVERAGE'
  | 'SUPERVISOR_REVIEW_COVERAGE'
  | 'CLOSURE_EVIDENCE_COVERAGE'
  | 'EXECUTION_GAP_RATE'
  | 'TRIAGE_DURATION'
  | 'ESCALATION_DELAY'
  | 'SUPERVISOR_REVIEW_DELAY'
  | 'CLOSURE_ELAPSED';

export type PeerMetricType = 'PERCENTAGE' | 'DURATION';

export type PeerDeviationStatus =
  | 'NO_BASELINE'
  | 'INCONCLUSIVE'
  | 'WITHIN_PEER_RANGE'
  | 'PEER_DEVIATION';

export interface PeerGroup {
  peerGroupId: string;
  peerGroupName: string;
  description: string;
  sector: string;
  criticalityTier: string;
}

export interface PeerProfile {
  entityCode: string;
  entityId: string;
  entityName: string;
  peerGroupId: string;
  peerGroupName: string;
  criticalityTier: string;
  sector: string;
  /** Explicit synthetic flag: true for development/testing demonstration data */
  isSynthetic: boolean;
  notes?: string;
}

export interface PeerMetricDefinition {
  code: PeerMetricCode;
  name: string;
  description: string;
  type: PeerMetricType;
  unit: string;
  thresholdDescription: string;
}

export interface PeerBaseline {
  metricCode: PeerMetricCode;
  metricType: PeerMetricType;
  unit: string;
  sampleSize: number;
  validPeerValues: number[];
  median: number | null;
  min: number | null;
  max: number | null;
  p25: number | null;
  p75: number | null;
}

export interface PeerDeviation {
  metricCode: PeerMetricCode;
  metricName: string;
  metricType: PeerMetricType;
  unit: string;
  targetValue: number | null;
  peerBaseline: PeerBaseline | null;
  /** For percentage metrics: targetValue - peerMedian (in percentage points) */
  deviationPercentagePoints: number | null;
  /** For duration metrics: targetValue / peerMedian ratio */
  deviationRatio: number | null;
  status: PeerDeviationStatus;
  deviationDescription: string;
  supervisoryInterpretation: string;
}

export interface ExcludedPeerSubmission {
  submissionId: string;
  entityCode: string;
  reason: string;
  gateCheck: string;
}

export interface PeerBenchmarkResult {
  targetSubmission: {
    submissionId: string;
    entityCode: string;
    entityId: string;
    assessmentPeriod: string;
    recordCount: number;
    completenessPercentage: number;
    dataQualityStatus: string;
  };
  targetPeerProfile: PeerProfile | null;
  peerGroup: PeerGroup | null;
  peerSubmissionIdsUsed: string[];
  sampleSize: number;
  minimumPeerSampleSize: number;
  excludedSubmissions: ExcludedPeerSubmission[];
  dataQualityLimitations: string[];
  metrics: Record<PeerMetricCode, PeerDeviation>;
  overallStatus: 'NO_BASELINE' | 'INCONCLUSIVE' | 'EVALUATED';
  summaryStatement: string;
  calculatedAt: string;
}

export interface PeerBenchmarkOptions {
  /** Minimum valid peer submissions required to calculate a valid baseline. Default: 3 */
  minimumPeerSampleSize?: number;
  /** Percentage points deviation considered noteworthy. Default: 15.0 percentage points */
  percentageDeviationThreshold?: number;
  /** Ratio considered slower or longer than peer baseline. Default: 1.5 (50% slower) */
  durationRatioUpperThreshold?: number;
  /** Ratio considered faster or shorter than peer baseline. Default: 0.67 */
  durationRatioLowerThreshold?: number;
}

/**
 * Traceable supervisory signal representing an observed peer benchmark deviation.
 * Intended for human supervisory review; does NOT automatically constitute a violation or formal finding.
 */
export interface PeerBenchmarkSignal {
  signalId: string;
  metricCode: PeerMetricCode;
  metricName: string;
  entityCode: string;
  submissionId: string;
  peerGroupId: string;
  peerGroupName: string;
  status: PeerDeviationStatus;
  targetValue: number | null;
  peerMedian: number | null;
  deviationDelta: string;
  supervisoryInterpretation: string;
  flaggedAt: string;
  isSynthetic: boolean;
}

