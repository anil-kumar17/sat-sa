/**
 * SYNTHETIC DEMONSTRATION DATA FOR PEER BENCHMARKING
 * 
 * IMPORTANT NOTICE:
 * This file contains deterministic synthetic peer candidate submissions and normalized case records
 * created exclusively for development, testing, supervisory demonstration, and architectural validation.
 * 
 * Under NO circumstances should these records be interpreted as real government supervisory records,
 * live security telemetry, or actual operational data of Critical Sector Entities.
 * 
 * All values are deterministically calculated by the peer benchmarking engine — none are hardcoded into UI cards.
 */

import { NormalizedCaseRecord, SubmissionMetadata } from '../types';
import { PeerCandidateSubmission } from '../services/analytics/peerBenchmarkEngine';

/**
 * Synthetic Peer 1: ENT-012-CLR (Securities Clearing Settlement Hub)
 * Valid submission (100% complete, VALID status)
 */
const SUBMISSION_PEER_1: SubmissionMetadata = {
  submissionId: 'SUB-SYN-PEER-012',
  entityId: 'ENT-012-CLR',
  entityCode: 'ENT-012-CLR',
  assessmentPeriod: '2026-Q3',
  fileName: 'ent012_clr_2026q3_audit.csv',
  fileType: 'DEMO_SYNTHETIC',
  fileSizeBytes: 4200,
  fileHash: 'sha256-syn-012-clr-peer-hash-a1b2c3d4',
  importedAt: '2026-08-30T10:00:00Z',
  recordCount: 8,
  validRecordCount: 8,
  invalidRecordCount: 0,
  warningCount: 0,
  errorCount: 0,
  completenessPercentage: 96,
  dataQualityStatus: 'VALID',
  sourceRecordIds: ['SRC-012-001', 'SRC-012-002', 'SRC-012-003', 'SRC-012-004', 'SRC-012-005', 'SRC-012-006', 'SRC-012-007', 'SRC-012-008']
};

const RECORDS_PEER_1: NormalizedCaseRecord[] = [
  {
    id: 'NORM-012-001',
    sourceRecordId: 'SRC-012-001',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-001',
    alertId: 'ALT-12001',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-01T02:00:00Z',
    triageTimestamp: '2026-08-01T02:09:00Z', // 9m triage
    escalationTimestamp: '2026-08-01T02:16:00Z', // 7m delay
    supervisorReviewTimestamp: '2026-08-01T02:40:00Z', // 24m delay
    closureTimestamp: '2026-08-01T03:30:00Z', // 1.5h closure
    disposition: 'CONTAINED_MALWARE',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-002',
    sourceRecordId: 'SRC-012-002',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-002',
    alertId: 'ALT-12002',
    severity: 'HIGH',
    alertTimestamp: '2026-08-03T11:00:00Z',
    triageTimestamp: '2026-08-03T11:10:00Z',
    escalationTimestamp: '2026-08-03T11:20:00Z',
    supervisorReviewTimestamp: '2026-08-03T11:50:00Z',
    closureTimestamp: '2026-08-03T13:00:00Z',
    disposition: 'FALSE_POSITIVE_RESOLVED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-003',
    sourceRecordId: 'SRC-012-003',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-003',
    alertId: 'ALT-12003',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-05T06:30:00Z',
    triageTimestamp: '2026-08-05T06:38:00Z', // 8m triage
    escalationTimestamp: '2026-08-05T06:46:00Z', // 8m delay
    supervisorReviewTimestamp: '2026-08-05T07:15:00Z',
    closureTimestamp: '2026-08-05T08:10:00Z',
    disposition: 'LATERAL_MOVEMENT_BLOCKED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-004',
    sourceRecordId: 'SRC-012-004',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-004',
    alertId: 'ALT-12004',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-08T14:15:00Z',
    triageTimestamp: '2026-08-08T14:25:00Z', // 10m triage
    escalationTimestamp: '2026-08-08T14:34:00Z', // 9m delay
    supervisorReviewTimestamp: '2026-08-08T15:00:00Z',
    closureTimestamp: '2026-08-08T16:00:00Z',
    disposition: 'CREDENTIAL_REVOKED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-005',
    sourceRecordId: 'SRC-012-005',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-005',
    alertId: 'ALT-12005',
    severity: 'MEDIUM',
    alertTimestamp: '2026-08-11T09:00:00Z',
    triageTimestamp: '2026-08-11T09:12:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: '2026-08-11T09:40:00Z',
    closureTimestamp: '2026-08-11T10:15:00Z',
    disposition: 'BENIGN_ADMIN_ACTIVITY',
    escalationRecorded: false,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-006',
    sourceRecordId: 'SRC-012-006',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-006',
    alertId: 'ALT-12006',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-15T18:20:00Z',
    triageTimestamp: '2026-08-15T18:30:00Z',
    escalationTimestamp: '2026-08-15T18:38:00Z',
    supervisorReviewTimestamp: '2026-08-15T19:05:00Z',
    closureTimestamp: '2026-08-15T20:00:00Z',
    disposition: 'EXPLOIT_ATTEMPT_MITIGATED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-007',
    sourceRecordId: 'SRC-012-007',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-007',
    alertId: 'ALT-12007',
    severity: 'HIGH',
    alertTimestamp: '2026-08-19T04:10:00Z',
    triageTimestamp: '2026-08-19T04:22:00Z',
    escalationTimestamp: '2026-08-19T04:32:00Z',
    supervisorReviewTimestamp: '2026-08-19T05:00:00Z',
    closureTimestamp: '2026-08-19T06:10:00Z',
    disposition: 'CERTIFICATE_UPDATED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-012-008',
    sourceRecordId: 'SRC-012-008',
    submissionId: 'SUB-SYN-PEER-012',
    entityId: 'ENT-012-CLR',
    entityCode: 'ENT-012-CLR',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-012-008',
    alertId: 'ALT-12008',
    severity: 'LOW',
    alertTimestamp: '2026-08-23T12:00:00Z',
    triageTimestamp: '2026-08-23T12:15:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: null,
    closureTimestamp: '2026-08-23T12:45:00Z',
    disposition: 'SCANNER_NOISE_DISMISSED',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  }
];

/**
 * Synthetic Peer 2: ENT-028-SWF (Cross-Border Message Switch)
 * Valid submission (94% complete, VALID status)
 */
const SUBMISSION_PEER_2: SubmissionMetadata = {
  submissionId: 'SUB-SYN-PEER-028',
  entityId: 'ENT-028-SWF',
  entityCode: 'ENT-028-SWF',
  assessmentPeriod: '2026-Q3',
  fileName: 'ent028_swf_2026q3_report.csv',
  fileType: 'DEMO_SYNTHETIC',
  fileSizeBytes: 4100,
  fileHash: 'sha256-syn-028-swf-peer-hash-e5f6g7h8',
  importedAt: '2026-08-30T11:00:00Z',
  recordCount: 7,
  validRecordCount: 7,
  invalidRecordCount: 0,
  warningCount: 0,
  errorCount: 0,
  completenessPercentage: 94,
  dataQualityStatus: 'VALID',
  sourceRecordIds: ['SRC-028-001', 'SRC-028-002', 'SRC-028-003', 'SRC-028-004', 'SRC-028-005', 'SRC-028-006', 'SRC-028-007']
};

const RECORDS_PEER_2: NormalizedCaseRecord[] = [
  {
    id: 'NORM-028-001',
    sourceRecordId: 'SRC-028-001',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-001',
    alertId: 'ALT-28001',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-02T05:00:00Z',
    triageTimestamp: '2026-08-02T05:11:00Z', // 11m triage
    escalationTimestamp: '2026-08-02T05:21:00Z', // 10m delay
    supervisorReviewTimestamp: '2026-08-02T05:50:00Z',
    closureTimestamp: '2026-08-02T07:00:00Z', // 2h closure
    disposition: 'API_INTRUSION_CONTAINED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-002',
    sourceRecordId: 'SRC-028-002',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-002',
    alertId: 'ALT-28002',
    severity: 'HIGH',
    alertTimestamp: '2026-08-04T13:00:00Z',
    triageTimestamp: '2026-08-04T13:14:00Z',
    escalationTimestamp: '2026-08-04T13:25:00Z',
    supervisorReviewTimestamp: '2026-08-04T13:58:00Z',
    closureTimestamp: '2026-08-04T15:15:00Z',
    disposition: 'ANOMALOUS_PAYMENT_INTERCEPTED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-003',
    sourceRecordId: 'SRC-028-003',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-003',
    alertId: 'ALT-28003',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-07T08:30:00Z',
    triageTimestamp: '2026-08-07T08:42:00Z', // 12m triage
    escalationTimestamp: '2026-08-07T08:52:00Z', // 10m delay
    supervisorReviewTimestamp: '2026-08-07T09:20:00Z',
    closureTimestamp: '2026-08-07T10:45:00Z',
    disposition: 'PRIVILEGE_ESCALATION_BLOCKED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-004',
    sourceRecordId: 'SRC-028-004',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-004',
    alertId: 'ALT-28004',
    severity: 'MEDIUM',
    alertTimestamp: '2026-08-10T16:00:00Z',
    triageTimestamp: '2026-08-10T16:15:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: '2026-08-10T16:45:00Z',
    closureTimestamp: '2026-08-10T17:30:00Z',
    disposition: 'MAINTENANCE_WINDOW_VALIDATED',
    escalationRecorded: false,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-005',
    sourceRecordId: 'SRC-028-005',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-005',
    alertId: 'ALT-28005',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-14T21:10:00Z',
    triageTimestamp: '2026-08-14T21:20:00Z', // 10m triage
    escalationTimestamp: '2026-08-14T21:30:00Z', // 10m delay
    supervisorReviewTimestamp: '2026-08-14T22:00:00Z',
    closureTimestamp: '2026-08-14T23:15:00Z',
    disposition: 'TOKEN_BREACH_REMEDIATED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-006',
    sourceRecordId: 'SRC-028-006',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-006',
    alertId: 'ALT-28006',
    severity: 'HIGH',
    alertTimestamp: '2026-08-18T10:00:00Z',
    triageTimestamp: '2026-08-18T10:15:00Z',
    escalationTimestamp: '2026-08-18T10:28:00Z',
    supervisorReviewTimestamp: '2026-08-18T11:00:00Z',
    closureTimestamp: '2026-08-18T12:00:00Z',
    disposition: 'VPN_POLICY_ENFORCED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-028-007',
    sourceRecordId: 'SRC-028-007',
    submissionId: 'SUB-SYN-PEER-028',
    entityId: 'ENT-028-SWF',
    entityCode: 'ENT-028-SWF',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-028-007',
    alertId: 'ALT-28007',
    severity: 'LOW',
    alertTimestamp: '2026-08-22T03:00:00Z',
    triageTimestamp: '2026-08-22T03:16:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: null,
    closureTimestamp: '2026-08-22T03:45:00Z',
    disposition: 'CERTIFICATE_PING_DISMISSED',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  }
];

/**
 * Synthetic Peer 3: ENT-033-ACH (Retail Automated Clearing House)
 * Valid submission (91% complete, VALID status)
 */
const SUBMISSION_PEER_3: SubmissionMetadata = {
  submissionId: 'SUB-SYN-PEER-033',
  entityId: 'ENT-033-ACH',
  entityCode: 'ENT-033-ACH',
  assessmentPeriod: '2026-Q3',
  fileName: 'ent033_ach_2026q3_ops.csv',
  fileType: 'DEMO_SYNTHETIC',
  fileSizeBytes: 4300,
  fileHash: 'sha256-syn-033-ach-peer-hash-i9j0k1l2',
  importedAt: '2026-08-30T12:00:00Z',
  recordCount: 7,
  validRecordCount: 7,
  invalidRecordCount: 0,
  warningCount: 0,
  errorCount: 0,
  completenessPercentage: 91,
  dataQualityStatus: 'VALID',
  sourceRecordIds: ['SRC-033-001', 'SRC-033-002', 'SRC-033-003', 'SRC-033-004', 'SRC-033-005', 'SRC-033-006', 'SRC-033-007']
};

const RECORDS_PEER_3: NormalizedCaseRecord[] = [
  {
    id: 'NORM-033-001',
    sourceRecordId: 'SRC-033-001',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-001',
    alertId: 'ALT-33001',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-03T01:00:00Z',
    triageTimestamp: '2026-08-03T01:13:00Z', // 13m triage
    escalationTimestamp: '2026-08-03T01:24:00Z', // 11m delay
    supervisorReviewTimestamp: '2026-08-03T01:55:00Z',
    closureTimestamp: '2026-08-03T03:10:00Z', // 2.1h closure
    disposition: 'DDOS_MITIGATION_DEPLOYED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-002',
    sourceRecordId: 'SRC-033-002',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-002',
    alertId: 'ALT-33002',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-06T07:15:00Z',
    triageTimestamp: '2026-08-06T07:26:00Z', // 11m triage
    escalationTimestamp: '2026-08-06T07:37:00Z', // 11m delay
    supervisorReviewTimestamp: '2026-08-06T08:05:00Z',
    closureTimestamp: '2026-08-06T09:30:00Z',
    disposition: 'DATABASE_INJECTION_FILTERED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-003',
    sourceRecordId: 'SRC-033-003',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-003',
    alertId: 'ALT-33003',
    severity: 'HIGH',
    alertTimestamp: '2026-08-09T15:20:00Z',
    triageTimestamp: '2026-08-09T15:33:00Z',
    escalationTimestamp: '2026-08-09T15:45:00Z',
    supervisorReviewTimestamp: '2026-08-09T16:15:00Z',
    closureTimestamp: '2026-08-09T17:40:00Z',
    disposition: 'UNAUTHORIZED_ENDPOINT_BLOCKED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-004',
    sourceRecordId: 'SRC-033-004',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-004',
    alertId: 'ALT-33004',
    severity: 'MEDIUM',
    alertTimestamp: '2026-08-12T12:00:00Z',
    triageTimestamp: '2026-08-12T12:14:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: '2026-08-12T12:45:00Z',
    closureTimestamp: '2026-08-12T13:30:00Z',
    disposition: 'SCHEDULED_BACKUP_TEST',
    escalationRecorded: false,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-005',
    sourceRecordId: 'SRC-033-005',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-005',
    alertId: 'ALT-33005',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-16T19:40:00Z',
    triageTimestamp: '2026-08-16T19:52:00Z', // 12m triage
    escalationTimestamp: '2026-08-16T20:04:00Z', // 12m delay
    supervisorReviewTimestamp: '2026-08-16T20:35:00Z',
    closureTimestamp: '2026-08-16T22:00:00Z',
    disposition: 'MALICIOUS_ATTACHMENT_QUARANTINED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-006',
    sourceRecordId: 'SRC-033-006',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-006',
    alertId: 'ALT-33006',
    severity: 'HIGH',
    alertTimestamp: '2026-08-20T08:00:00Z',
    triageTimestamp: '2026-08-20T08:14:00Z',
    escalationTimestamp: '2026-08-20T08:26:00Z',
    supervisorReviewTimestamp: '2026-08-20T09:00:00Z',
    closureTimestamp: '2026-08-20T10:15:00Z',
    disposition: 'RATE_LIMIT_ACTIVATED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  },
  {
    id: 'NORM-033-007',
    sourceRecordId: 'SRC-033-007',
    submissionId: 'SUB-SYN-PEER-033',
    entityId: 'ENT-033-ACH',
    entityCode: 'ENT-033-ACH',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-033-007',
    alertId: 'ALT-33007',
    severity: 'LOW',
    alertTimestamp: '2026-08-24T14:00:00Z',
    triageTimestamp: '2026-08-24T14:15:00Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: null,
    closureTimestamp: '2026-08-24T14:40:00Z',
    disposition: 'BENIGN_MONITORING_ALERT',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'NOT_APPLICABLE',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: {}
  }
];

/**
 * Synthetic Peer 4 (Poor Data Quality Candidate): ENT-089-BAD
 * Status: INVALID, Completeness: 32%
 * Purpose: Demonstrates strict exclusion by Quality Gate (COMPLETENESS_BELOW_THRESHOLD / INVALID_STATUS).
 */
const SUBMISSION_PEER_4_BAD: SubmissionMetadata = {
  submissionId: 'SUB-SYN-PEER-089-BAD',
  entityId: 'ENT-089-BAD',
  entityCode: 'ENT-089-BAD',
  assessmentPeriod: '2026-Q3',
  fileName: 'ent089_corrupt_export.csv',
  fileType: 'DEMO_SYNTHETIC',
  fileSizeBytes: 850,
  fileHash: 'sha256-syn-089-bad-peer-hash-corrupt',
  importedAt: '2026-08-30T14:00:00Z',
  recordCount: 3,
  validRecordCount: 1,
  invalidRecordCount: 2,
  warningCount: 1,
  errorCount: 2,
  completenessPercentage: 32, // Below 40% threshold!
  dataQualityStatus: 'INVALID',
  sourceRecordIds: ['SRC-089-001', 'SRC-089-002']
};

const RECORDS_PEER_4_BAD: NormalizedCaseRecord[] = [
  {
    id: 'NORM-089-001',
    sourceRecordId: 'SRC-089-001',
    submissionId: 'SUB-SYN-PEER-089-BAD',
    entityId: 'ENT-089-BAD',
    entityCode: 'ENT-089-BAD',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-089-001',
    alertId: 'ALT-89001',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-01T00:00:00Z',
    triageTimestamp: null,
    escalationTimestamp: null,
    supervisorReviewTimestamp: null,
    closureTimestamp: null,
    disposition: null,
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'INCOMPLETE_SUBMISSION',
      escalationEvidence: 'INCOMPLETE_SUBMISSION',
      supervisorReviewEvidence: 'INCOMPLETE_SUBMISSION',
      closureEvidence: 'INCOMPLETE_SUBMISSION'
    },
    sourcePayload: {}
  }
];

/**
 * Synthetic Peer 5 (Missing Critical Identifiers): ENT-099-INC
 * Purpose: Demonstrates exclusion via MISSING_CRITICAL_IDENTIFIERS quality gate.
 */
const SUBMISSION_PEER_5_MISSING: SubmissionMetadata = {
  submissionId: '', // Missing submissionId!
  entityId: 'ENT-099-INC',
  entityCode: '', // Missing entityCode!
  assessmentPeriod: '2026-Q3',
  fileName: 'ent099_unidentified.csv',
  fileType: 'DEMO_SYNTHETIC',
  fileSizeBytes: 200,
  fileHash: 'sha256-syn-099-empty',
  importedAt: '2026-08-30T15:00:00Z',
  recordCount: 0,
  validRecordCount: 0,
  invalidRecordCount: 0,
  warningCount: 0,
  errorCount: 0,
  completenessPercentage: 0,
  dataQualityStatus: 'REJECTED',
  sourceRecordIds: []
};

// ============================================================================
// Cohort Demonstration Sets
// ============================================================================

/**
 * Standard complete demonstration cohort:
 * - 3 Valid Peers (ENT-012-CLR, ENT-028-SWF, ENT-033-ACH)
 * - 2 Quality-Gate-Excluded Peers (ENT-089-BAD, ENT-099-INC)
 * Demonstrates:
 * - Baseline calculation (N=3 valid)
 * - Transparent quality gate exclusion reporting
 * - Multiple deviations (e.g. ESCALATION_EVIDENCE_COVERAGE)
 * - Within peer range metrics (e.g. TRIAGE_DURATION)
 */
export const DEMO_SYNTHETIC_PEER_CANDIDATES: PeerCandidateSubmission[] = [
  {
    submission: SUBMISSION_PEER_1,
    records: RECORDS_PEER_1
  },
  {
    submission: SUBMISSION_PEER_2,
    records: RECORDS_PEER_2
  },
  {
    submission: SUBMISSION_PEER_3,
    records: RECORDS_PEER_3
  },
  {
    submission: SUBMISSION_PEER_4_BAD,
    records: RECORDS_PEER_4_BAD
  },
  {
    submission: SUBMISSION_PEER_5_MISSING,
    records: []
  }
];

/**
 * Insufficient sample size demonstration cohort:
 * Contains only 1 valid peer.
 * Evaluates to: INCONCLUSIVE (Sample size N=1 < 3 minimum).
 */
export const DEMO_INSUFFICIENT_PEER_CANDIDATES: PeerCandidateSubmission[] = [
  {
    submission: SUBMISSION_PEER_1,
    records: RECORDS_PEER_1
  }
];

/**
 * Returns a cloned copy of the demonstration peer cohort to prevent mutation.
 */
export function getDemoSyntheticPeerCandidates(): PeerCandidateSubmission[] {
  return DEMO_SYNTHETIC_PEER_CANDIDATES.map((cand) => ({
    submission: { ...cand.submission },
    records: cand.records.map((r) => ({ ...r }))
  }));
}

/**
 * Returns a cloned copy of the insufficient demonstration cohort.
 */
export function getDemoInsufficientPeerCandidates(): PeerCandidateSubmission[] {
  return DEMO_INSUFFICIENT_PEER_CANDIDATES.map((cand) => ({
    submission: { ...cand.submission },
    records: cand.records.map((r) => ({ ...r }))
  }));
}
