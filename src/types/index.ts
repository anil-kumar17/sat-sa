import type { CaseEvaluationDataQuality } from './analytics';
import type { PeerBenchmarkSignal } from './peerBenchmark';

export * from './negativeSpace';
export * from './analytics';
export * from './submission';
export * from './peerBenchmark';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'UPHELD'
  | 'DOWNGRADED'
  | 'DISMISSED';

export interface FindingProvenance {
  ruleCode: string;
  submissionId: string;
  entityId: string;
  entityCode: string;
  assessmentPeriod?: string;
  applicableCaseCount: number;
  expectedCount: number;
  observedCount: number;
  gapCount: number;
  gapRate: number;
  affectedCaseIds: string[];
  evidenceRecordIds: string[];
  sourceRecordIds: string[];
  dataQualityLimitedCount: number;
  dataQualityLimitedCaseIds?: string[];
  overallDataQuality:
    | 'SUFFICIENT'
    | 'DATA_QUALITY_LIMITED'
    | 'INSUFFICIENT_DATA';
  evaluatedAt: string;
  sourceIntegrityFingerprint?: string;
}

export interface Finding {
  id: string;
  defectCode: string;
  ruleCode: string;
  title: string;
  severity: SeverityLevel;
  entityId: string;
  entityName: string;
  entityCode: string;
  sector: string;
  targetCriticality: string;
  assessmentCycle: string;
  cycleCode: string;

  // A calculated confidence value is not currently produced by the
  // deterministic engine, so 0 means "not calculated" rather than 0% certainty.
  confidence: number;

  status: FindingStatus;
  date: string;
  lastUpdated: string;
  summary: string;
  inspector: string;

  // Kept for compatibility with the existing UI. This is a descriptive
  // provenance state, not a claim that the finding is cryptographically sealed.
  ledgerSealStatus: string;

  remediationDeadline: string;
  handshakeRate: string;
  flaggedIncidentsCount: number;
  totalEvaluatedIncidents: number;
  unsupportedClaimsCount: number;
  primaryOffset: string;
  targetProtocol: string;
  sensorSource: string;
  telemetryFile: string;
  telemetryOffset: string;
  sha256Hash: string;
  evidenceTimestamp: string;
  recommendedAction: string;

  // Step 3 Traceability & Provenance
  submissionId?: string;
  assessmentPeriod?: string;
  affectedCaseIds?: string[];
  evidenceRecordIds?: string[];
  sourceRecordIds?: string[];
  applicableCaseCount?: number;
  expectedCount?: number;
  observedCount?: number;
  gapCount?: number;
  gapRate?: number;
  dataQualityLimitedCount?: number;
  dataQualityLimitedCaseIds?: string[];
  overallDataQuality?:
    | 'SUFFICIENT'
    | 'DATA_QUALITY_LIMITED'
    | 'INSUFFICIENT_DATA';
  sourceIntegrityFingerprint?: string;
  provenance?: FindingProvenance;
  peerSignals?: PeerBenchmarkSignal[];
}

export interface Entity {
  id: string;
  code: string;
  name: string;
  sector:
    | 'Financial Core'
    | 'Critical Energy'
    | 'Defense Industrial'
    | 'Telecom & Satellite'
    | 'Health Infrastructure';
  criticalityTier:
    | 'Tier-1 High Assurance'
    | 'Tier-2 Critical'
    | 'Tier-3 Standard';
  openFindings: number;
  criticalDefects: number;
  complianceScore: number;
  assessmentStatus:
    | 'Active Audit'
    | 'Sealed & Compliant'
    | 'CAP Required'
    | 'Pending Review';
  lastTelemetrySync: string;
  primaryContact: string;
}

export interface AssessmentCycle {
  id: string;
  cycleNumber: number;
  name: string;
  quarter: string;
  status: 'ACTIVE' | 'SEALED' | 'UPCOMING' | 'ARCHIVED';
  submissionsCount: number;
  sealedSubmissionsCount: number;
  totalEntities: number;
  openFindingsCount: number;
  criticalDefectsCount: number;
  startDate: string;
  closingDeadline: string;
  integritySealHash: string;
}

export interface ForensicRecord {
  incidentId: string;
  sourceRecordId?: string;
  submissionId?: string;
  caseId?: string;
  findingId?: string;

  alertTimestamp: string;
  triageComplete: string;
  triageDurationSeconds: number;
  recordedEscalation: string;
  closureTimestamp: string;
  elapsedMinutes: number;
  dispositionGiven: string;
  provenanceHash: string;
  auditActionStatus: 'Inspected' | 'Flagged' | 'Verified';
  dataQualityStatus?: CaseEvaluationDataQuality;

  // CSE submissions can contain different source fields. These known fields
  // are optional and the index signature preserves the original payload.
  rawPayload: {
    incident_id?: string;
    entity_urn?: string;
    classification?: string;

    initial_triage?: {
      operator_id?: string;
      timestamp?: string;
      threat_vector?: string;
      [key: string]: unknown;
    };

    escalation_event_recorded?: string | null;
    escalation_handshake_tokens?: string[];

    supervisor_review_signoff?: boolean;

    closure_event?: {
      disposition?: string;
      timestamp?: string;
      elapsed_seconds?: number;
      [key: string]: unknown;
    };

    audit_violation_flag?: boolean;
    rule_violated?: string;

    [key: string]: unknown;
  };
}

export interface DeficitMetric {
  dimension: string;
  expectedEvents: number;
  observedEvents: number;
  deficitCount: number;
  deficitPercent: number;
  severity: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'NORMAL';
}

export interface WorkflowDropOffStage {
  stageNumber: number;
  stageName: string;
  mandatedRate: number;
  observedRate: number;
  dropOffRate: number;
  status: 'NORMAL' | 'DEVIATION' | 'CRITICAL_GAP';
}

export interface SupervisorDecision {
  findingId: string;
  decision: 'UPHOLD' | 'DOWNGRADE' | 'DISMISS';
  decisionTitle: string;
  rationale: string;
  decidedAt: string;
  inspectorName: string;
  inspectorRole: string;
  correctiveActionPlanRequired: boolean;

  // Legacy UI field retained for compatibility. It records the decision
  // timestamp rather than asserting an immutable external ledger.
  ledgerTimestamp: string;

  sha256Verification: string;
}

export interface AuditTrailEvent {
  id: string;
  timestamp: string;
  inspector: string;
  actionType:
    | 'DECISION_COMMITTED'
    | 'EVIDENCE_INSPECTED'
    | 'TELEMETRY_INGEST'
    | 'FINDING_FLAGGED'
    | 'CAP_ISSUED'
    | 'SUBMISSION_IMPORTED'
    | 'SUBMISSION_VALIDATED'
    | 'SUBMISSION_REJECTED'
    | 'FINDING_GENERATED'
    | 'FINDING_REVIEWED'
    | 'SUPERVISOR_DECISION_RECORDED';
  targetEntity: string;
  targetRef: string;
  provenanceHash: string;
  integrityStatus: 'VALIDATED' | 'SEALED' | 'PENDING';
  summary: string;
}

// Offline-first synchronization

export type ConnectivityState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export type SyncStatus =
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED';

export type QueuedActionType =
  | 'UPHOLD_FINDING'
  | 'DOWNGRADE_FINDING'
  | 'DISMISS_FINDING'
  | 'REQUEST_TELEMETRY';

export interface PendingSyncAction {
  id: string;
  findingId: string;
  actionType: QueuedActionType;
  rationale: string;
  timestamp: string;
  inspector: string;
  localStatus: string;
  syncStatus: SyncStatus;
  retryCount: number;
  lastAttempt?: string;
  syncedAt?: string;
  decision?: 'UPHOLD' | 'DOWNGRADE' | 'DISMISS';
}

// Repository contracts

export interface IFindingRepository {
  getAll(): Promise<Finding[]>;
  getById(id: string): Promise<Finding | undefined>;
  updateStatus(id: string, status: FindingStatus): Promise<Finding>;
  getSupervisorDecision(
    findingId: string
  ): Promise<SupervisorDecision | undefined>;
  saveSupervisorDecision(decision: SupervisorDecision): Promise<void>;
  save(finding: Finding): Promise<Finding>;
  getBySubmissionId?(submissionId: string): Promise<Finding[]>;
  getByRuleAndSubmission?(
    ruleCode: string,
    submissionId: string
  ): Promise<Finding | undefined>;
}

export interface IEvidenceRepository {
  getAll(): Promise<ForensicRecord[]>;
  getById(incidentId: string): Promise<ForensicRecord | undefined>;
  getByIds(incidentIds: string[]): Promise<ForensicRecord[]>;
  getByFindingId(findingId: string): Promise<ForensicRecord[]>;
  search(query: string): Promise<ForensicRecord[]>;
  save(record: ForensicRecord): Promise<ForensicRecord>;
  saveMany(records: ForensicRecord[]): Promise<void>;
}

export interface IAssessmentRepository {
  getAll(): Promise<AssessmentCycle[]>;
  getActive(): Promise<AssessmentCycle | undefined>;
}

export interface IEntityRepository {
  getAll(): Promise<Entity[]>;
  getById(id: string): Promise<Entity | undefined>;
}

export interface IAuditRepository {
  getAll(): Promise<AuditTrailEvent[]>;
  logEvent(
    event: Omit<AuditTrailEvent, 'id'>
  ): Promise<AuditTrailEvent>;
}

export interface ISyncRepository {
  getQueue(): Promise<PendingSyncAction[]>;
  enqueue(
    action: Omit<
      PendingSyncAction,
      'id' | 'syncStatus' | 'retryCount'
    >
  ): Promise<PendingSyncAction>;
  updateActionStatus(
    id: string,
    syncStatus: SyncStatus,
    syncedAt?: string
  ): Promise<void>;
  clearCompleted(): Promise<void>;
  getLastSyncTime(): Promise<string | null>;
  setLastSyncTime(timestamp: string): Promise<void>;
}