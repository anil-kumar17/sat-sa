import {
  Finding,
  Entity,
  AssessmentCycle,
  ForensicRecord,
  DeficitMetric,
  WorkflowDropOffStage,
  AuditTrailEvent
} from '../types';

export const mockFindings: Finding[] = [
  {
    id: 'FND-2025-014',
    defectCode: 'P0',
    ruleCode: 'RULE-ESC-04',
    title: 'Execution gap in escalation workflow',
    severity: 'CRITICAL',
    entityId: 'ent-fin-08',
    entityName: 'Apex Interbank Clearing Corp',
    entityCode: 'CSE-FIN-08',
    sector: 'Financial Core',
    targetCriticality: 'Tier-1 RTGS Financial Core',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 99.4,
    status: 'OPEN',
    date: '2025-03-24',
    lastUpdated: '2025-03-28 11:42 UTC',
    summary: '14/14 critical incidents reached closure without a recorded Tier-3 supervisory escalation.',
    inspector: 'Dr. Aris Thorne',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '10 Business Days (CAP)',
    handshakeRate: '0.0%',
    flaggedIncidentsCount: 14,
    totalEvaluatedIncidents: 14,
    unsupportedClaimsCount: 0,
    primaryOffset: '41,206',
    targetProtocol: 'FinSec Core 4.2',
    sensorSource: 'APEX-SIEM-PROD-01',
    telemetryFile: 'cse_fin08_soc_log_20250325.parquet',
    telemetryOffset: 'Offset: 41,206 to 41,432 (18.4 MB)',
    sha256Hash: '9e03f2a1b9c7042a983b63294ee1c9f4171638202503a4e70da45199bf02',
    evidenceTimestamp: '2025-03-28T09:14:22Z',
    recommendedAction: 'Corrective Action Plan Recommended under FinSec Operational Guidelines §12.'
  },
  {
    id: 'FND-2025-012',
    defectCode: 'P0',
    ruleCode: 'RULE-AUTH-09',
    title: 'Off-hours root token privilege elevation without ticket counter-sign',
    severity: 'CRITICAL',
    entityId: 'ent-pwr-03',
    entityName: 'Metro Power & Grid System',
    entityCode: 'CSE-PWR-03',
    sector: 'Critical Energy',
    targetCriticality: 'SCADA EMS High-Voltage Node',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 98.7,
    status: 'IN_REVIEW',
    date: '2025-03-22',
    lastUpdated: '2025-03-27 16:30 UTC',
    summary: '8/8 off-hours privileged access sessions to substations bypassed dual-custody authorization.',
    inspector: 'Dr. Aris Thorne',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '7 Business Days (CAP)',
    handshakeRate: '0.0%',
    flaggedIncidentsCount: 8,
    totalEvaluatedIncidents: 8,
    unsupportedClaimsCount: 0,
    primaryOffset: '19,840',
    targetProtocol: 'NERC-CIP-005',
    sensorSource: 'MPG-IAM-VAULT-04',
    telemetryFile: 'mpg_pwr03_iam_access_20250322.parquet',
    telemetryOffset: 'Offset: 19,840 to 20,110 (12.1 MB)',
    sha256Hash: '4a88bc39d8e12fa89b21cf92305e94bca38491c1097e36509f2571ac5b67',
    evidenceTimestamp: '2025-03-27T14:10:05Z',
    recommendedAction: 'Revocation of unvetted bastion keys & Mandatory Dual-Key Workflow Reinstitution.'
  },
  {
    id: 'FND-2025-009',
    defectCode: 'P1',
    ruleCode: 'RULE-MEM-03',
    title: 'Volatile RAM triage snapshot missing prior to containment isolation',
    severity: 'HIGH',
    entityId: 'ent-def-01',
    entityName: 'Northcom Defense Avionics',
    entityCode: 'CSE-DEF-01',
    sector: 'Defense Industrial',
    targetCriticality: 'Class-A Classified Telemetry Lab',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 96.2,
    status: 'OPEN',
    date: '2025-03-19',
    lastUpdated: '2025-03-26 09:15 UTC',
    summary: '9/11 containment executions isolated virtual workloads before forensic memory dump capture.',
    inspector: 'Elena Vance, CISA',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '15 Business Days',
    handshakeRate: '18.2%',
    flaggedIncidentsCount: 9,
    totalEvaluatedIncidents: 11,
    unsupportedClaimsCount: 0,
    primaryOffset: '55,310',
    targetProtocol: 'DoD-CMMC Level 3',
    sensorSource: 'NDA-EDR-AGENT-POOL',
    telemetryFile: 'nda_def01_edr_telemetry_20250319.parquet',
    telemetryOffset: 'Offset: 55,310 to 55,900 (34.8 MB)',
    sha256Hash: 'c71f98a2e1d09e5348ab7612c60815eb018e6924879a835cfba1065798e2',
    evidenceTimestamp: '2025-03-26T08:00:19Z',
    recommendedAction: 'EDR Script Update to enforce automated memory collection prior to NIC drop.'
  },
  {
    id: 'FND-2025-017',
    defectCode: 'P1',
    ruleCode: 'RULE-NET-11',
    title: 'Bypass of perimeter WAF inspection in cross-datacenter failover route',
    severity: 'HIGH',
    entityId: 'ent-tel-05',
    entityName: 'Horizon Satellite & Telco Systems',
    entityCode: 'CSE-TEL-05',
    sector: 'Telecom & Satellite',
    targetCriticality: 'National SS7/5G Core Signaling',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 94.8,
    status: 'IN_REVIEW',
    date: '2025-03-25',
    lastUpdated: '2025-03-28 08:20 UTC',
    summary: 'Failover traffic between East and West backbone links bypassed stateful inspection rules.',
    inspector: 'Dr. Aris Thorne',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '14 Business Days',
    handshakeRate: '22.0%',
    flaggedIncidentsCount: 6,
    totalEvaluatedIncidents: 6,
    unsupportedClaimsCount: 0,
    primaryOffset: '72,114',
    targetProtocol: 'FCC-CSRIC VII',
    sensorSource: 'HZN-BGP-ROUTER-CORE',
    telemetryFile: 'hzn_tel05_bgp_netflow_20250325.parquet',
    telemetryOffset: 'Offset: 72,114 to 72,480 (8.9 MB)',
    sha256Hash: '8b41cd8321fe905321ab5498e82110ea3419082cb79103e67341951ca0b8',
    evidenceTimestamp: '2025-03-28T07:44:00Z',
    recommendedAction: 'Enforce synchronous BGP route filtering and inline DPI inspection.'
  },
  {
    id: 'FND-2025-006',
    defectCode: 'P2',
    ruleCode: 'RULE-LOG-02',
    title: 'Cryptographic hash chain gap in cold archive ingestion pipeline',
    severity: 'MEDIUM',
    entityId: 'ent-hlth-02',
    entityName: 'St. Jude Clinical Care Alliance',
    entityCode: 'CSE-MED-02',
    sector: 'Health Infrastructure',
    targetCriticality: 'Regional Health Exchange Hub',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 92.1,
    status: 'OPEN',
    date: '2025-03-15',
    lastUpdated: '2025-03-24 18:00 UTC',
    summary: 'Intermittent 2-hour latency in cold storage ledger sealing across 4 log forwarders.',
    inspector: 'Marcus Brody',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '30 Business Days',
    handshakeRate: '78.5%',
    flaggedIncidentsCount: 4,
    totalEvaluatedIncidents: 18,
    unsupportedClaimsCount: 0,
    primaryOffset: '33,901',
    targetProtocol: 'HIPAA Security §164.312',
    sensorSource: 'SJC-SYSLOG-COLD-01',
    telemetryFile: 'sjc_med02_cold_archive_20250315.parquet',
    telemetryOffset: 'Offset: 33,901 to 34,220 (5.2 MB)',
    sha256Hash: 'fa2093e811bc64239841da923841029e84b9102c771a398018e6924879a8',
    evidenceTimestamp: '2025-03-24T17:12:00Z',
    recommendedAction: 'Buffer queue tuning on forwarders and automated backpressure alert.'
  },
  {
    id: 'FND-2025-003',
    defectCode: 'P2',
    ruleCode: 'RULE-SIG-08',
    title: 'Attestation closure signature issued without verified containment confirmation',
    severity: 'MEDIUM',
    entityId: 'ent-fin-02',
    entityName: 'Sentinel Trust Financial',
    entityCode: 'CSE-FIN-02',
    sector: 'Financial Core',
    targetCriticality: 'ACH Clearing Gateway',
    assessmentCycle: 'Q1-2025 (Cycle 14)',
    cycleCode: 'C14',
    confidence: 91.5,
    status: 'UPHELD',
    date: '2025-03-10',
    lastUpdated: '2025-03-25 14:00 UTC',
    summary: 'Case closures signed off by supervisory staff without checking host isolation status.',
    inspector: 'Elena Vance, CISA',
    ledgerSealStatus: 'SHA-256 Validated',
    remediationDeadline: '20 Business Days',
    handshakeRate: '45.0%',
    flaggedIncidentsCount: 5,
    totalEvaluatedIncidents: 11,
    unsupportedClaimsCount: 0,
    primaryOffset: '12,400',
    targetProtocol: 'FinSec Operational §8',
    sensorSource: 'STF-SOAR-GATE-02',
    telemetryFile: 'stf_fin02_soar_cases_20250310.parquet',
    telemetryOffset: 'Offset: 12,400 to 12,750 (6.7 MB)',
    sha256Hash: '1a90bc837e9014bca82103e8749102cae38491c1097e36509f2571ac5b67',
    evidenceTimestamp: '2025-03-25T13:45:10Z',
    recommendedAction: 'Mandate automated API handshake validation in SOAR before signoff prompt activates.'
  }
];

export const mockForensicRecords: ForensicRecord[] = [
  {
    incidentId: 'INC-8821',
    alertTimestamp: '2025-03-24 02:14:12',
    triageComplete: '02:16:05 (113s)',
    triageDurationSeconds: 113,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '02:18:22 (4.1m total)',
    elapsedMinutes: 4.1,
    dispositionGiven: 'Resolved (False Positive)',
    provenanceHash: '0x7f8a912e4c9b01...',
    auditActionStatus: 'Inspected',
    rawPayload: {
      incident_id: 'INC-8821',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-4182',
        timestamp: '2025-03-24T02:16:05.112Z',
        threat_vector: 'Cobalt Strike Named Pipe Signature (DC-04)'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'DISMISSED_MANUAL_DISCRETION',
        timestamp: '2025-03-24T02:18:22.841Z',
        elapsed_seconds: 250.729
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  },
  {
    incidentId: 'INC-8824',
    alertTimestamp: '2025-03-24 07:45:30',
    triageComplete: '07:47:11 (101s)',
    triageDurationSeconds: 101,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '07:50:04 (4.5m total)',
    elapsedMinutes: 4.5,
    dispositionGiven: 'Closed (Administrative)',
    provenanceHash: '0x3e11a208bb42f1...',
    auditActionStatus: 'Flagged',
    rawPayload: {
      incident_id: 'INC-8824',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-4182',
        timestamp: '2025-03-24T07:47:11.402Z',
        threat_vector: 'Mimikatz LSASS Memory Injection'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'CLOSED_ADMINISTRATIVE_OVERRIDE',
        timestamp: '2025-03-24T07:50:04.190Z',
        elapsed_seconds: 273.788
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  },
  {
    incidentId: 'INC-8829',
    alertTimestamp: '2025-03-24 14:19:02',
    triageComplete: '14:21:40 (158s)',
    triageDurationSeconds: 158,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '14:23:18 (4.2m total)',
    elapsedMinutes: 4.2,
    dispositionGiven: 'Auto-Exempted',
    provenanceHash: '0x91dae290f148cc...',
    auditActionStatus: 'Flagged',
    rawPayload: {
      incident_id: 'INC-8829',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-5509',
        timestamp: '2025-03-24T14:21:40.812Z',
        threat_vector: 'Kerberoasting Ticket Grant Service Extraction'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'AUTO_EXEMPTED_SCRIPT',
        timestamp: '2025-03-24T14:23:18.005Z',
        elapsed_seconds: 255.193
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  },
  {
    incidentId: 'INC-8831',
    alertTimestamp: '2025-03-24 19:02:11',
    triageComplete: '19:03:55 (104s)',
    triageDurationSeconds: 104,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '19:06:10 (3.9m total)',
    elapsedMinutes: 3.9,
    dispositionGiven: 'Disposed Tier-1',
    provenanceHash: '0x6b10492cca1209...',
    auditActionStatus: 'Flagged',
    rawPayload: {
      incident_id: 'INC-8831',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-3011',
        timestamp: '2025-03-24T19:03:55.991Z',
        threat_vector: 'Suspicious DLL Side-Loading into SWIFT Interface'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'DISPOSED_L1_DISCRETION',
        timestamp: '2025-03-24T19:06:10.450Z',
        elapsed_seconds: 239.459
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  },
  {
    incidentId: 'INC-8833',
    alertTimestamp: '2025-03-25 04:11:00',
    triageComplete: '04:13:20 (140s)',
    triageDurationSeconds: 140,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '04:15:30 (4.5m total)',
    elapsedMinutes: 4.5,
    dispositionGiven: 'Suppressed Routine',
    provenanceHash: '0xaa4190c102b489...',
    auditActionStatus: 'Verified',
    rawPayload: {
      incident_id: 'INC-8833',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-4182',
        timestamp: '2025-03-25T04:13:20.100Z',
        threat_vector: 'PowerShell Encoded Command in Clearing Worker'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'SUPPRESSED_ROUTINE_ADMIN',
        timestamp: '2025-03-25T04:15:30.910Z',
        elapsed_seconds: 270.81
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  },
  {
    incidentId: 'INC-8834',
    alertTimestamp: '2025-03-25 11:20:44',
    triageComplete: '11:22:12 (88s)',
    triageDurationSeconds: 88,
    recordedEscalation: 'NULL (0 Tokens)',
    closureTimestamp: '11:24:50 (4.1m total)',
    elapsedMinutes: 4.1,
    dispositionGiven: 'Resolved (Known Test)',
    provenanceHash: '0x12c490efaa5101...',
    auditActionStatus: 'Verified',
    rawPayload: {
      incident_id: 'INC-8834',
      entity_urn: 'urn:cse:fin08:rtgs:clearing',
      classification: 'TIER_3_CRITICAL_DEFECT',
      initial_triage: {
        operator_id: 'OP-5509',
        timestamp: '2025-03-25T11:22:12.330Z',
        threat_vector: 'Unauthorized Remote Service Creation (Psexec)'
      },
      escalation_event_recorded: null,
      escalation_handshake_tokens: [],
      supervisor_review_signoff: false,
      closure_event: {
        disposition: 'RESOLVED_LOCAL_OVERRIDE',
        timestamp: '2025-03-25T11:24:50.040Z',
        elapsed_seconds: 246.71
      },
      audit_violation_flag: true,
      rule_violated: 'RULE-ESC-04: Mandatory Escalation Required for Tier-3 Dispositions'
    }
  }
];

export const mockEntities: Entity[] = [
  {
    id: 'ent-fin-08',
    code: 'CSE-FIN-08',
    name: 'Apex Interbank Clearing Corp',
    sector: 'Financial Core',
    criticalityTier: 'Tier-1 High Assurance',
    openFindings: 4,
    criticalDefects: 1,
    complianceScore: 78.4,
    assessmentStatus: 'CAP Required',
    lastTelemetrySync: '2025-03-28 11:30 UTC',
    primaryContact: 'Marcus Vance, VP Cyber Operations'
  },
  {
    id: 'ent-pwr-03',
    code: 'CSE-PWR-03',
    name: 'Metro Power & Grid System',
    sector: 'Critical Energy',
    criticalityTier: 'Tier-1 High Assurance',
    openFindings: 3,
    criticalDefects: 1,
    complianceScore: 81.2,
    assessmentStatus: 'Active Audit',
    lastTelemetrySync: '2025-03-28 10:45 UTC',
    primaryContact: 'Sarah Chen, Chief Security Architect'
  },
  {
    id: 'ent-def-01',
    code: 'CSE-DEF-01',
    name: 'Northcom Defense Avionics',
    sector: 'Defense Industrial',
    criticalityTier: 'Tier-1 High Assurance',
    openFindings: 2,
    criticalDefects: 0,
    complianceScore: 91.8,
    assessmentStatus: 'Active Audit',
    lastTelemetrySync: '2025-03-28 09:15 UTC',
    primaryContact: 'Col. Robert Hastings (Ret.)'
  },
  {
    id: 'ent-tel-05',
    code: 'CSE-TEL-05',
    name: 'Horizon Satellite & Telco Systems',
    sector: 'Telecom & Satellite',
    criticalityTier: 'Tier-1 High Assurance',
    openFindings: 3,
    criticalDefects: 0,
    complianceScore: 84.6,
    assessmentStatus: 'Active Audit',
    lastTelemetrySync: '2025-03-28 08:20 UTC',
    primaryContact: 'David Rostova, Dir. Infrastructure Security'
  },
  {
    id: 'ent-hlth-02',
    code: 'CSE-MED-02',
    name: 'St. Jude Clinical Care Alliance',
    sector: 'Health Infrastructure',
    criticalityTier: 'Tier-2 Critical',
    openFindings: 2,
    criticalDefects: 0,
    complianceScore: 88.0,
    assessmentStatus: 'Pending Review',
    lastTelemetrySync: '2025-03-27 18:00 UTC',
    primaryContact: 'Dr. Leah Miller, CISO'
  },
  {
    id: 'ent-fin-02',
    code: 'CSE-FIN-02',
    name: 'Sentinel Trust Financial',
    sector: 'Financial Core',
    criticalityTier: 'Tier-2 Critical',
    openFindings: 1,
    criticalDefects: 0,
    complianceScore: 94.2,
    assessmentStatus: 'Sealed & Compliant',
    lastTelemetrySync: '2025-03-27 22:10 UTC',
    primaryContact: 'Arthur Pendelton, Head of InfoSec'
  },
  {
    id: 'ent-pwr-07',
    code: 'CSE-PWR-07',
    name: 'Pacific Hydro & Nuclear Operator',
    sector: 'Critical Energy',
    criticalityTier: 'Tier-1 High Assurance',
    openFindings: 2,
    criticalDefects: 0,
    complianceScore: 92.5,
    assessmentStatus: 'Active Audit',
    lastTelemetrySync: '2025-03-28 06:14 UTC',
    primaryContact: 'Elena Rostova, SCADA Oversight'
  },
  {
    id: 'ent-tel-01',
    code: 'CSE-TEL-01',
    name: 'AeroSpace Comm Gateway',
    sector: 'Telecom & Satellite',
    criticalityTier: 'Tier-2 Critical',
    openFindings: 1,
    criticalDefects: 0,
    complianceScore: 96.0,
    assessmentStatus: 'Sealed & Compliant',
    lastTelemetrySync: '2025-03-26 14:00 UTC',
    primaryContact: 'Greg Takahashi, Principal SecOps'
  }
];

export const mockAssessments: AssessmentCycle[] = [
  {
    id: 'cycle-14',
    cycleNumber: 14,
    name: 'Q1-2025 Supervisory Audit Period',
    quarter: 'Q1-2025',
    status: 'ACTIVE',
    submissionsCount: 84,
    sealedSubmissionsCount: 84,
    totalEntities: 42,
    openFindingsCount: 18,
    criticalDefectsCount: 2,
    startDate: '2025-01-02',
    closingDeadline: '2025-04-15',
    integritySealHash: '9e03f2a1b9c7042a983b63294ee1c9f4171638202503a4e70da45199bf02'
  },
  {
    id: 'cycle-13',
    cycleNumber: 13,
    name: 'Q4-2024 Supervisory Oversight Cycle',
    quarter: 'Q4-2024',
    status: 'SEALED',
    submissionsCount: 82,
    sealedSubmissionsCount: 82,
    totalEntities: 41,
    openFindingsCount: 0,
    criticalDefectsCount: 0,
    startDate: '2024-10-01',
    closingDeadline: '2024-12-31',
    integritySealHash: 'fa829103c892b10492cca12093e811bc64239841da923841029e84b9102c'
  },
  {
    id: 'cycle-12',
    cycleNumber: 12,
    name: 'Q3-2024 Supervisory Audit Period',
    quarter: 'Q3-2024',
    status: 'ARCHIVED',
    submissionsCount: 78,
    sealedSubmissionsCount: 78,
    totalEntities: 39,
    openFindingsCount: 0,
    criticalDefectsCount: 0,
    startDate: '2024-07-01',
    closingDeadline: '2024-09-30',
    integritySealHash: 'c71f98a2e1d09e5348ab7612c60815eb018e6924879a835cfba1065798e2'
  },
  {
    id: 'cycle-15',
    cycleNumber: 15,
    name: 'Q2-2025 Supervisory Ingest Cycle',
    quarter: 'Q2-2025',
    status: 'UPCOMING',
    submissionsCount: 0,
    sealedSubmissionsCount: 0,
    totalEntities: 44,
    openFindingsCount: 0,
    criticalDefectsCount: 0,
    startDate: '2025-04-01',
    closingDeadline: '2025-06-30',
    integritySealHash: 'PENDING_CYCLE_INGEST'
  }
];

export const mockTrajectoryData = [
  { week: 'W01', findings: 4, critical: 0, closed: 1 },
  { week: 'W02', findings: 6, critical: 0, closed: 3 },
  { week: 'W03', findings: 7, critical: 1, closed: 4 },
  { week: 'W04', findings: 9, critical: 1, closed: 5 },
  { week: 'W05', findings: 11, critical: 1, closed: 8 },
  { week: 'W06', findings: 12, critical: 1, closed: 9 },
  { week: 'W07', findings: 14, critical: 1, closed: 11 },
  { week: 'W08', findings: 15, critical: 2, closed: 13 },
  { week: 'W09', findings: 16, critical: 2, closed: 14 },
  { week: 'W10', findings: 17, critical: 2, closed: 15 },
  { week: 'W11', findings: 18, critical: 2, closed: 16 },
  { week: 'W12', findings: 18, critical: 2, closed: 17 }
];

export const mockNegativeSpaceDeficits: DeficitMetric[] = [
  {
    dimension: 'Tier-3 Escalation Handshake',
    expectedEvents: 142,
    observedEvents: 114,
    deficitCount: 28,
    deficitPercent: 19.7,
    severity: 'CRITICAL'
  },
  {
    dimension: 'Supervisor Review Signoff',
    expectedEvents: 142,
    observedEvents: 121,
    deficitCount: 21,
    deficitPercent: 14.8,
    severity: 'CRITICAL'
  },
  {
    dimension: 'Volatile RAM Memory Attachment',
    expectedEvents: 68,
    observedEvents: 49,
    deficitCount: 19,
    deficitPercent: 27.9,
    severity: 'ELEVATED'
  },
  {
    dimension: 'Containment Confirmation Proof',
    expectedEvents: 94,
    observedEvents: 85,
    deficitCount: 9,
    deficitPercent: 9.6,
    severity: 'MODERATE'
  },
  {
    dimension: 'Attested Closure Dual-Key',
    expectedEvents: 142,
    observedEvents: 136,
    deficitCount: 6,
    deficitPercent: 4.2,
    severity: 'NORMAL'
  }
];

export const mockWorkflowStages: WorkflowDropOffStage[] = [
  {
    stageNumber: 1,
    stageName: 'Alert Ingest',
    mandatedRate: 100,
    observedRate: 100,
    dropOffRate: 0.0,
    status: 'NORMAL'
  },
  {
    stageNumber: 2,
    stageName: 'Tier-1 Triage',
    mandatedRate: 100,
    observedRate: 98.6,
    dropOffRate: 1.4,
    status: 'NORMAL'
  },
  {
    stageNumber: 3,
    stageName: 'Tier-3 Escalation',
    mandatedRate: 100,
    observedRate: 80.3,
    dropOffRate: 19.7,
    status: 'CRITICAL_GAP'
  },
  {
    stageNumber: 4,
    stageName: 'CSIRT Containment',
    mandatedRate: 100,
    observedRate: 85.2,
    dropOffRate: 14.8,
    status: 'DEVIATION'
  },
  {
    stageNumber: 5,
    stageName: 'Attested Closure',
    mandatedRate: 100,
    observedRate: 95.8,
    dropOffRate: 4.2,
    status: 'NORMAL'
  }
];

export const mockSectorAllocation = [
  { name: 'Financial Core', findings: 7, critical: 1, cses: 14, color: '#38BDF8' },
  { name: 'Critical Energy', findings: 5, critical: 1, cses: 10, color: '#F59E0B' },
  { name: 'Defense Industrial', findings: 3, critical: 0, cses: 8, color: '#8B5CF6' },
  { name: 'Telecom & Satellite', findings: 2, critical: 0, cses: 6, color: '#10B981' },
  { name: 'Health Infrastructure', findings: 1, critical: 0, cses: 4, color: '#06B6D4' }
];

export const mockAuditTrail: AuditTrailEvent[] = [
  {
    id: 'AUD-9021',
    timestamp: '2025-03-28 11:42:10 UTC',
    inspector: 'Dr. Aris Thorne',
    actionType: 'DECISION_COMMITTED',
    targetEntity: 'Apex Interbank Clearing Corp (CSE-FIN-08)',
    targetRef: 'FND-2025-014',
    provenanceHash: '0x9e03f2a1b9c7042a...',
    integrityStatus: 'VALIDATED',
    summary: 'Supervisor affirmed Critical Defect (P0) with recommendation for Corrective Action Plan.'
  },
  {
    id: 'AUD-9019',
    timestamp: '2025-03-28 11:20:04 UTC',
    inspector: 'Dr. Aris Thorne',
    actionType: 'EVIDENCE_INSPECTED',
    targetEntity: 'Apex Interbank Clearing Corp (CSE-FIN-08)',
    targetRef: 'INC-8821',
    provenanceHash: '0x7f8a912e4c9b01...',
    integrityStatus: 'SEALED',
    summary: 'Detailed Parquet raw telemetry partition 20250325-01 verified via cryptographic hash.'
  },
  {
    id: 'AUD-9012',
    timestamp: '2025-03-27 16:35:50 UTC',
    inspector: 'Dr. Aris Thorne',
    actionType: 'FINDING_FLAGGED',
    targetEntity: 'Metro Power & Grid System (CSE-PWR-03)',
    targetRef: 'FND-2025-012',
    provenanceHash: '0x4a88bc39d8e12f...',
    integrityStatus: 'VALIDATED',
    summary: 'Deterministic detection trigger RULE-AUTH-09 flagged 8 off-hours privileged sessions.'
  },
  {
    id: 'AUD-8994',
    timestamp: '2025-03-26 14:02:18 UTC',
    inspector: 'Elena Vance, CISA',
    actionType: 'TELEMETRY_INGEST',
    targetEntity: 'Northcom Defense Avionics (CSE-DEF-01)',
    targetRef: 'CYCLE-14-INGEST',
    provenanceHash: '0xc71f98a2e1d09e...',
    integrityStatus: 'SEALED',
    summary: '18.4 MB telemetry snapshot ingested and cryptographically sealed into Evidence Vault.'
  },
  {
    id: 'AUD-8980',
    timestamp: '2025-03-25 14:15:30 UTC',
    inspector: 'Elena Vance, CISA',
    actionType: 'CAP_ISSUED',
    targetEntity: 'Sentinel Trust Financial (CSE-FIN-02)',
    targetRef: 'FND-2025-003',
    provenanceHash: '0x1a90bc837e9014...',
    integrityStatus: 'VALIDATED',
    summary: 'Formal Corrective Action Plan notice transmitted for attestation signature compliance.'
  }
];
