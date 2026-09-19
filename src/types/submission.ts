import { SeverityLevel } from './index';

export type DataQualityStatus = 'VALID' | 'WARNINGS' | 'INVALID' | 'REJECTED';

export type IngestionFileType = 'CSV' | 'JSON' | 'DEMO_SYNTHETIC';

export type QualityIssueSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type EvidencePresenceState =
  | 'EVIDENCE_PRESENT'
  | 'EVIDENCE_NOT_PRESENT'
  | 'NOT_APPLICABLE'
  | 'INCOMPLETE_SUBMISSION';

export interface EvidencePresenceMetadata {
  triageEvidence: EvidencePresenceState;
  escalationEvidence: EvidencePresenceState;
  supervisorReviewEvidence: EvidencePresenceState;
  closureEvidence: EvidencePresenceState;
  notes?: string[];
}

export interface SubmissionMetadata {
  submissionId: string;
  entityId: string;
  entityCode: string;
  assessmentPeriod: string;
  fileName: string;
  fileType: IngestionFileType;
  fileSizeBytes: number;
  fileHash: string; // SHA-256 fingerprint of input payload
  importedAt: string; // ISO timestamp
  recordCount: number;
  validRecordCount: number;
  invalidRecordCount: number;
  warningCount: number;
  errorCount: number;
  completenessPercentage: number;
  dataQualityStatus: DataQualityStatus;
  sourceRecordIds: string[];
}

export type CSESubmission = SubmissionMetadata;

export interface SourceRecord {
  id: string; // stable sourceRecordId
  submissionId: string;
  entityId: string;
  entityCode: string;
  assessmentPeriod: string;
  rowNumber: number;
  rawPayload: Record<string, unknown>; // Preserved original unmutated input
  createdAt: string;
  sha256Fingerprint: string;
}

export interface NormalizedCaseRecord {
  id: string; // unique normalized record ID
  sourceRecordId: string; // stable reference linking back to SourceRecord
  submissionId: string;
  entityId: string;
  entityCode: string;
  assessmentPeriod: string;
  caseId: string;
  alertId: string | null;
  severity: SeverityLevel;
  alertTimestamp: string; // normalized ISO-8601 string
  triageTimestamp: string | null; // normalized ISO-8601 string or null
  escalationTimestamp: string | null; // normalized ISO-8601 string or null
  supervisorReviewTimestamp: string | null; // normalized ISO-8601 string or null
  closureTimestamp: string | null; // normalized ISO-8601 string or null
  disposition: string | null;
  escalationRecorded: boolean; // whether escalation evidence was recorded
  supervisorReviewRecorded: boolean; // whether supervisor review was recorded
  evidencePresence: EvidencePresenceMetadata; // Negative-space analytical preparation
  sourcePayload: Record<string, unknown>; // preserved reference to original raw record
}

export interface WorkflowEvent {
  eventId: string;
  caseId: string;
  sourceRecordId: string;
  submissionId: string;
  eventType:
    | 'ALERT_TRIGGERED'
    | 'TRIAGE_COMPLETED'
    | 'ESCALATION_RECORDED'
    | 'SUPERVISOR_REVIEW_RECORDED'
    | 'CASE_CLOSED';
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface DataQualityIssue {
  id: string;
  submissionId: string;
  sourceRecordId?: string;
  caseId?: string;
  rowNumber?: number;
  field: string;
  severity: QualityIssueSeverity;
  code: string;
  message: string;
  rawInput?: unknown;
}

export interface DataQualityReport {
  submissionId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  warningCount: number;
  errorCount: number;
  completenessPercentage: number;
  overallStatus: DataQualityStatus;
  issues: DataQualityIssue[];
  evaluatedAt: string;
}

// Repository contract interfaces for CSE submissions
export interface ISubmissionRepository {
  getAll(): Promise<CSESubmission[]>;
  getById(submissionId: string): Promise<CSESubmission | undefined>;
  save(submission: CSESubmission): Promise<void>;
  delete(submissionId: string): Promise<void>;
}

export interface ISourceRecordRepository {
  createMany(records: SourceRecord[]): Promise<void>;
  getBySubmissionId(submissionId: string): Promise<SourceRecord[]>;
  getById(id: string): Promise<SourceRecord | undefined>;
  deleteBySubmissionId(submissionId: string): Promise<void>;
}

export interface INormalizedRecordRepository {
  createMany(records: NormalizedCaseRecord[]): Promise<void>;
  getBySubmissionId(submissionId: string): Promise<NormalizedCaseRecord[]>;
  getAll(): Promise<NormalizedCaseRecord[]>;
  getById(id: string): Promise<NormalizedCaseRecord | undefined>;
  deleteBySubmissionId(submissionId: string): Promise<void>;
}

export interface IDataQualityRepository {
  saveReport(report: DataQualityReport): Promise<void>;
  getBySubmissionId(submissionId: string): Promise<DataQualityReport | undefined>;
  deleteBySubmissionId(submissionId: string): Promise<void>;
}
