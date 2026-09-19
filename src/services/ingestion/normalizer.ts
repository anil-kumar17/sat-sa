import { SeverityLevel } from '../../types';
import {
  NormalizedCaseRecord,
  SourceRecord,
  EvidencePresenceMetadata
} from '../../types/submission';
import { getStringValue, parseTimestamp } from './validator';

export function normalizeRecord(
  sourceRecord: SourceRecord
): NormalizedCaseRecord {
  const raw = sourceRecord.rawPayload;

  const entityId = getStringValue(raw, ['entity_id', 'entityId']);
  const entityCode = getStringValue(raw, ['entity_code', 'entityCode']);
  const assessmentPeriod = getStringValue(raw, ['assessment_period', 'assessmentPeriod', 'period']);
  const caseId = getStringValue(raw, ['case_id', 'caseId', 'id']);
  const alertIdRaw = getStringValue(raw, ['alert_id', 'alertId']);
  const severityRaw = getStringValue(raw, ['severity', 'severity_level', 'severityLevel']).toUpperCase();
  const alertTsRaw = getStringValue(raw, ['alert_timestamp', 'alertTimestamp', 'timestamp']);
  const triageTsRaw = getStringValue(raw, ['triage_timestamp', 'triageTimestamp', 'triageComplete']);
  const escalationTsRaw = getStringValue(raw, ['escalation_timestamp', 'escalationTimestamp', 'recordedEscalation']);
  const supervisorTsRaw = getStringValue(raw, ['supervisor_review_timestamp', 'supervisorReviewTimestamp', 'reviewTimestamp']);
  const closureTsRaw = getStringValue(raw, ['closure_timestamp', 'closureTimestamp', 'resolvedTimestamp']);
  const dispositionRaw = getStringValue(raw, ['disposition', 'dispositionGiven', 'resolution']);

  // Normalize Severity
  let severity: SeverityLevel = 'MEDIUM';
  if (severityRaw === 'CRITICAL' || severityRaw === 'P0' || severityRaw === 'SEV1') {
    severity = 'CRITICAL';
  } else if (severityRaw === 'HIGH' || severityRaw === 'P1' || severityRaw === 'SEV2') {
    severity = 'HIGH';
  } else if (severityRaw === 'MEDIUM' || severityRaw === 'P2' || severityRaw === 'SEV3') {
    severity = 'MEDIUM';
  } else if (severityRaw === 'LOW' || severityRaw === 'P3' || severityRaw === 'SEV4') {
    severity = 'LOW';
  }

  // Normalize Timestamps to standard ISO-8601 strings or null
  const normalizeTs = (rawTs: string): string | null => {
    if (!rawTs) return null;
    const res = parseTimestamp(rawTs);
    return res.valid && res.date ? res.date.toISOString() : null;
  };

  const alertTimestamp = normalizeTs(alertTsRaw) || new Date().toISOString();
  const triageTimestamp = normalizeTs(triageTsRaw);
  const escalationTimestamp = normalizeTs(escalationTsRaw);
  const supervisorReviewTimestamp = normalizeTs(supervisorTsRaw);
  const closureTimestamp = normalizeTs(closureTsRaw);

  const alertId = alertIdRaw ? alertIdRaw.trim() : null;
  const disposition = dispositionRaw ? dispositionRaw.trim() : null;

  const escalationRecorded = escalationTimestamp !== null;
  const supervisorReviewRecorded = supervisorReviewTimestamp !== null;

  // Negative-Space Preparation:
  // An empty field indicates only that evidence was not present in this submitted record.
  // We explicitly mark this status rather than assuming confirmed non-occurrence.
  const evidencePresence: EvidencePresenceMetadata = {
    triageEvidence: triageTimestamp ? 'EVIDENCE_PRESENT' : 'EVIDENCE_NOT_PRESENT',
    escalationEvidence: escalationTimestamp ? 'EVIDENCE_PRESENT' : 'EVIDENCE_NOT_PRESENT',
    supervisorReviewEvidence: supervisorReviewTimestamp ? 'EVIDENCE_PRESENT' : 'EVIDENCE_NOT_PRESENT',
    closureEvidence: closureTimestamp ? 'EVIDENCE_PRESENT' : 'EVIDENCE_NOT_PRESENT',
    notes: []
  };

  if (!escalationTimestamp && severity === 'CRITICAL') {
    evidencePresence.notes?.push(
      'Potential operational escalation gap: Critical alert record without recorded escalation timestamp evidence.'
    );
  }

  return {
    id: `NORM-${sourceRecord.submissionId}-${caseId || sourceRecord.rowNumber}`,
    sourceRecordId: sourceRecord.id,
    submissionId: sourceRecord.submissionId,
    entityId,
    entityCode,
    assessmentPeriod,
    caseId,
    alertId,
    severity,
    alertTimestamp,
    triageTimestamp,
    escalationTimestamp,
    supervisorReviewTimestamp,
    closureTimestamp,
    disposition,
    escalationRecorded,
    supervisorReviewRecorded,
    evidencePresence,
    sourcePayload: { ...raw }
  };
}

export function normalizeRecords(
  sourceRecords: SourceRecord[],
  validRowNumbers: Set<number>
): NormalizedCaseRecord[] {
  const normalized: NormalizedCaseRecord[] = [];
  for (const src of sourceRecords) {
    if (validRowNumbers.has(src.rowNumber)) {
      normalized.push(normalizeRecord(src));
    }
  }
  return normalized;
}
