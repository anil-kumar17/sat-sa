import {
  DataQualityReport,
  DataQualityIssue,
  DataQualityStatus
} from '../../types/submission';

// Helper to access field values regardless of snake_case or camelCase
export function getFieldValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (record[k] !== undefined && record[k] !== null) {
      return record[k];
    }
  }
  return undefined;
}

export function getStringValue(record: Record<string, unknown>, keys: string[]): string {
  const val = getFieldValue(record, keys);
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

const VALID_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

// Parse timestamp string and verify validity
export function parseTimestamp(val: string): { valid: boolean; date?: Date; reason?: string } {
  if (!val) return { valid: false, reason: 'Empty timestamp' };
  const d = new Date(val);
  const time = d.getTime();
  if (isNaN(time)) {
    return { valid: false, reason: `Invalid date format: "${val}"` };
  }
  const year = d.getFullYear();
  if (year < 2010 || year > 2040) {
    return { valid: false, reason: `Timestamp year out of credible supervisory window: ${year}` };
  }
  return { valid: true, date: d };
}

export interface ValidationRecordResult {
  rowNumber: number;
  caseId: string;
  isValid: boolean;
  issues: DataQualityIssue[];
  populatedFieldsCount: number;
}

export function validateRecords(
  submissionId: string,
  rawRecords: Record<string, unknown>[]
): {
  report: DataQualityReport;
  recordResults: ValidationRecordResult[];
} {
  const issues: DataQualityIssue[] = [];
  const caseIdSeen = new Map<string, number[]>(); // caseId -> row numbers
  let totalPopulatedFields = 0;
  const standardFieldsCount = 12; // Standard canonical schema field count

  const recordResults: ValidationRecordResult[] = [];

  rawRecords.forEach((record, index) => {
    const rowNumber = index + 1;
    const recordIssues: DataQualityIssue[] = [];
    let populatedCount = 0;

    // Field extraction with camelCase & snake_case support
    const entityId = getStringValue(record, ['entity_id', 'entityId']);
    const entityCode = getStringValue(record, ['entity_code', 'entityCode']);
    const assessmentPeriod = getStringValue(record, ['assessment_period', 'assessmentPeriod', 'period']);
    const caseId = getStringValue(record, ['case_id', 'caseId', 'id']);
    const alertId = getStringValue(record, ['alert_id', 'alertId']);
    const severityRaw = getStringValue(record, ['severity', 'severity_level', 'severityLevel']).toUpperCase();
    const alertTsRaw = getStringValue(record, ['alert_timestamp', 'alertTimestamp', 'timestamp']);
    const triageTsRaw = getStringValue(record, ['triage_timestamp', 'triageTimestamp', 'triageComplete']);
    const escalationTsRaw = getStringValue(record, ['escalation_timestamp', 'escalationTimestamp', 'recordedEscalation']);
    const supervisorTsRaw = getStringValue(record, ['supervisor_review_timestamp', 'supervisorReviewTimestamp', 'reviewTimestamp']);
    const closureTsRaw = getStringValue(record, ['closure_timestamp', 'closureTimestamp', 'resolvedTimestamp']);
    const disposition = getStringValue(record, ['disposition', 'dispositionGiven', 'resolution']);

    // Count populated fields for completeness calculation
    [
      entityId,
      entityCode,
      assessmentPeriod,
      caseId,
      alertId,
      severityRaw,
      alertTsRaw,
      triageTsRaw,
      escalationTsRaw,
      supervisorTsRaw,
      closureTsRaw,
      disposition
    ].forEach(val => {
      if (val && val.length > 0) populatedCount++;
    });

    totalPopulatedFields += populatedCount;

    // 1. Check REQUIRED fields
    if (!entityId) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-01`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'entity_id',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Mandatory entity identifier ('entity_id') is missing or blank.`,
        rawInput: record
      });
    }

    if (!entityCode) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-02`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'entity_code',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Mandatory entity code ('entity_code') is missing or blank.`,
        rawInput: record
      });
    }

    if (!assessmentPeriod) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-03`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'assessment_period',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Mandatory assessment period ('assessment_period') is missing.`,
        rawInput: record
      });
    }

    if (!caseId) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-04`,
        submissionId,
        caseId: `ROW-${rowNumber}`,
        rowNumber,
        field: 'case_id',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Mandatory operational case identifier ('case_id') is missing.`,
        rawInput: record
      });
    } else {
      // Duplicate detection within submission
      const existing = caseIdSeen.get(caseId);
      if (existing) {
        existing.push(rowNumber);
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-DUP`,
          submissionId,
          caseId,
          rowNumber,
          field: 'case_id',
          severity: 'ERROR',
          code: 'DUPLICATE_CASE_ID',
          message: `Duplicate case identifier '${caseId}' detected (previously seen at row ${existing[0]}).`,
          rawInput: caseId
        });
      } else {
        caseIdSeen.set(caseId, [rowNumber]);
      }
    }

    // 2. Validate Severity
    if (!severityRaw) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-05`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'severity',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Severity level is missing.`,
        rawInput: record
      });
    } else if (!VALID_SEVERITIES.has(severityRaw)) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-06`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'severity',
        severity: 'ERROR',
        code: 'UNKNOWN_SEVERITY_VALUE',
        message: `Row ${rowNumber}: Unrecognized severity '${severityRaw}'. Expected one of [CRITICAL, HIGH, MEDIUM, LOW].`,
        rawInput: severityRaw
      });
    }

    // 3. Validate Alert Timestamp & Chronology
    let alertDate: Date | undefined;
    if (!alertTsRaw) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-07`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'alert_timestamp',
        severity: 'ERROR',
        code: 'REQUIRED_FIELD_MISSING',
        message: `Row ${rowNumber}: Alert timestamp is missing.`,
        rawInput: record
      });
    } else {
      const res = parseTimestamp(alertTsRaw);
      if (!res.valid) {
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-08`,
          submissionId,
          caseId: caseId || `ROW-${rowNumber}`,
          rowNumber,
          field: 'alert_timestamp',
          severity: 'ERROR',
          code: 'INVALID_TIMESTAMP',
          message: `Row ${rowNumber}: Alert timestamp parsing failure: ${res.reason}`,
          rawInput: alertTsRaw
        });
      } else {
        alertDate = res.date;
      }
    }

    // Triage Timestamp
    let triageDate: Date | undefined;
    if (triageTsRaw) {
      const res = parseTimestamp(triageTsRaw);
      if (!res.valid) {
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-09`,
          submissionId,
          caseId: caseId || `ROW-${rowNumber}`,
          rowNumber,
          field: 'triage_timestamp',
          severity: 'ERROR',
          code: 'INVALID_TIMESTAMP',
          message: `Row ${rowNumber}: Triage timestamp parsing failure: ${res.reason}`,
          rawInput: triageTsRaw
        });
      } else {
        triageDate = res.date;
        if (alertDate && triageDate.getTime() < alertDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-10`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'triage_timestamp',
            severity: 'ERROR',
            code: 'IMPOSSIBLE_CHRONOLOGY',
            message: `Row ${rowNumber}: Triage timestamp (${triageTsRaw}) precedes alert timestamp (${alertTsRaw}).`,
            rawInput: { alertTsRaw, triageTsRaw }
          });
        }
      }
    }

    // Escalation Timestamp
    let escalationDate: Date | undefined;
    if (escalationTsRaw) {
      const res = parseTimestamp(escalationTsRaw);
      if (!res.valid) {
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-11`,
          submissionId,
          caseId: caseId || `ROW-${rowNumber}`,
          rowNumber,
          field: 'escalation_timestamp',
          severity: 'ERROR',
          code: 'INVALID_TIMESTAMP',
          message: `Row ${rowNumber}: Escalation timestamp parsing failure: ${res.reason}`,
          rawInput: escalationTsRaw
        });
      } else {
        escalationDate = res.date;
        if (alertDate && escalationDate.getTime() < alertDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-12`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'escalation_timestamp',
            severity: 'ERROR',
            code: 'IMPOSSIBLE_CHRONOLOGY',
            message: `Row ${rowNumber}: Escalation timestamp (${escalationTsRaw}) precedes alert timestamp (${alertTsRaw}).`,
            rawInput: { alertTsRaw, escalationTsRaw }
          });
        }
      }
    }

    // Supervisor Review Timestamp
    let supervisorDate: Date | undefined;
    if (supervisorTsRaw) {
      const res = parseTimestamp(supervisorTsRaw);
      if (!res.valid) {
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-13`,
          submissionId,
          caseId: caseId || `ROW-${rowNumber}`,
          rowNumber,
          field: 'supervisor_review_timestamp',
          severity: 'ERROR',
          code: 'INVALID_TIMESTAMP',
          message: `Row ${rowNumber}: Supervisor review timestamp parsing failure: ${res.reason}`,
          rawInput: supervisorTsRaw
        });
      } else {
        supervisorDate = res.date;
        if (alertDate && supervisorDate.getTime() < alertDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-14`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'supervisor_review_timestamp',
            severity: 'ERROR',
            code: 'IMPOSSIBLE_CHRONOLOGY',
            message: `Row ${rowNumber}: Supervisor review timestamp precedes alert timestamp.`,
            rawInput: { alertTsRaw, supervisorTsRaw }
          });
        }
      }
    }

    // Closure Timestamp
    let closureDate: Date | undefined;
    if (closureTsRaw) {
      const res = parseTimestamp(closureTsRaw);
      if (!res.valid) {
        recordIssues.push({
          id: `DQI-${submissionId}-${rowNumber}-15`,
          submissionId,
          caseId: caseId || `ROW-${rowNumber}`,
          rowNumber,
          field: 'closure_timestamp',
          severity: 'ERROR',
          code: 'INVALID_TIMESTAMP',
          message: `Row ${rowNumber}: Closure timestamp parsing failure: ${res.reason}`,
          rawInput: closureTsRaw
        });
      } else {
        closureDate = res.date;
        if (alertDate && closureDate.getTime() < alertDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-16`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'closure_timestamp',
            severity: 'ERROR',
            code: 'IMPOSSIBLE_CHRONOLOGY',
            message: `Row ${rowNumber}: Closure timestamp (${closureTsRaw}) precedes alert timestamp (${alertTsRaw}).`,
            rawInput: { alertTsRaw, closureTsRaw }
          });
        }

        // Operational warnings: closure preceding triage or escalation
        if (triageDate && closureDate.getTime() < triageDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-17`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'closure_timestamp',
            severity: 'WARNING',
            code: 'OPERATIONAL_SEQUENCING_ANOMALY',
            message: `Row ${rowNumber}: Closure timestamp precedes triage completion timestamp.`,
            rawInput: { closureTsRaw, triageTsRaw }
          });
        }

        if (escalationDate && closureDate.getTime() < escalationDate.getTime()) {
          recordIssues.push({
            id: `DQI-${submissionId}-${rowNumber}-18`,
            submissionId,
            caseId: caseId || `ROW-${rowNumber}`,
            rowNumber,
            field: 'closure_timestamp',
            severity: 'WARNING',
            code: 'OPERATIONAL_SEQUENCING_ANOMALY',
            message: `Row ${rowNumber}: Closure timestamp precedes recorded escalation timestamp.`,
            rawInput: { closureTsRaw, escalationTsRaw }
          });
        }
      }
    }

    // Optional field checks: non-fatal warning if alertId is completely omitted
    if (!alertId) {
      recordIssues.push({
        id: `DQI-${submissionId}-${rowNumber}-WARN-AID`,
        submissionId,
        caseId: caseId || `ROW-${rowNumber}`,
        rowNumber,
        field: 'alert_id',
        severity: 'INFO',
        code: 'OPTIONAL_IDENTIFIER_OMITTED',
        message: `Row ${rowNumber}: Telemetry alert reference identifier is omitted.`,
        rawInput: record
      });
    }

    const hasErrors = recordIssues.some(i => i.severity === 'ERROR');
    recordResults.push({
      rowNumber,
      caseId: caseId || `ROW-${rowNumber}`,
      isValid: !hasErrors,
      issues: recordIssues,
      populatedFieldsCount: populatedCount
    });

    issues.push(...recordIssues);
  });

  const totalRecords = rawRecords.length;
  const validRecords = recordResults.filter(r => r.isValid).length;
  const invalidRecords = totalRecords - validRecords;

  // Duplicate cases count
  let duplicateRecordsCount = 0;
  caseIdSeen.forEach(rows => {
    if (rows.length > 1) {
      duplicateRecordsCount += rows.length - 1;
    }
  });

  const errorCount = issues.filter(i => i.severity === 'ERROR').length;
  const warningCount = issues.filter(i => i.severity === 'WARNING').length;

  // Calculate actual completeness percentage
  const totalSlots = totalRecords * standardFieldsCount;
  const completenessPercentage =
    totalSlots === 0
      ? 0
      : Math.round((totalPopulatedFields / totalSlots) * 1000) / 10;

  let overallStatus: DataQualityStatus = 'VALID';
  if (invalidRecords > 0) {
    overallStatus = 'INVALID';
  } else if (warningCount > 0) {
    overallStatus = 'WARNINGS';
  }

  const report: DataQualityReport = {
    submissionId,
    totalRecords,
    validRecords,
    invalidRecords,
    duplicateRecords: duplicateRecordsCount,
    warningCount,
    errorCount,
    completenessPercentage,
    overallStatus,
    issues,
    evaluatedAt: new Date().toISOString()
  };

  return { report, recordResults };
}
