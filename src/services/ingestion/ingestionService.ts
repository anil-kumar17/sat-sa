import {
  CSESubmission,
  SourceRecord,
  NormalizedCaseRecord,
  DataQualityReport,
  IngestionFileType
} from '../../types/submission';
import { parseCsvText } from './csvParser';
import { parseJsonText } from './jsonParser';
import { validateRecords, ValidationRecordResult, getStringValue } from './validator';
import { normalizeRecords } from './normalizer';
import { computeSha256 } from './hashUtils';
import {
  submissionRepository,
  sourceRecordRepository,
  normalizedRecordRepository,
  dataQualityRepository,
  findingsRepository,
  auditRepository
} from '../../repositories';

export interface ProcessIngestionInput {
  fileContent: string;
  fileName: string;
  fileType: IngestionFileType;
  fileSizeBytes?: number;
}

export interface IngestionAnalysisResult {
  submission: CSESubmission;
  sourceRecords: SourceRecord[];
  normalizedRecords: NormalizedCaseRecord[];
  qualityReport: DataQualityReport;
  recordResults: ValidationRecordResult[];
  parseError?: string;
}

export class IngestionService {
  /**
   * Dry-run analysis of uploaded file content.
   * Parses, validates, and normalizes without writing to IndexedDB.
   */
  async analyze(input: ProcessIngestionInput): Promise<IngestionAnalysisResult> {
    const { fileContent, fileName, fileType } = input;
    let rawRecords: Record<string, unknown>[] = [];
    let parseError: string | undefined;

    if (fileType === 'CSV') {
      const csvRes = parseCsvText(fileContent);
      rawRecords = csvRes.records;
      if (rawRecords.length === 0) {
        parseError = 'CSV file contains no parsable data rows.';
      }
    } else if (fileType === 'JSON' || fileType === 'DEMO_SYNTHETIC') {
      const jsonRes = parseJsonText(fileContent);
      if (jsonRes.error) {
        parseError = jsonRes.error;
      } else {
        rawRecords = jsonRes.records;
        if (rawRecords.length === 0) {
          parseError = 'JSON file contains no record items.';
        }
      }
    }

    const timestamp = new Date().toISOString();
    const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fileHash = await computeSha256(fileContent);

    if (parseError || rawRecords.length === 0) {
      const emptyReport: DataQualityReport = {
        submissionId,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        duplicateRecords: 0,
        warningCount: 0,
        errorCount: 1,
        completenessPercentage: 0,
        overallStatus: 'REJECTED',
        issues: [
          {
            id: `DQI-${submissionId}-PARSE-ERR`,
            submissionId,
            field: 'file',
            severity: 'ERROR',
            code: 'PARSE_FAILURE',
            message: parseError || 'Failed to parse file content.'
          }
        ],
        evaluatedAt: timestamp
      };

      const emptySubmission: CSESubmission = {
        submissionId,
        entityId: 'UNKNOWN',
        entityCode: 'UNKNOWN',
        assessmentPeriod: 'UNKNOWN',
        fileName,
        fileType,
        fileSizeBytes: input.fileSizeBytes || new TextEncoder().encode(fileContent).length,
        fileHash,
        importedAt: timestamp,
        recordCount: 0,
        validRecordCount: 0,
        invalidRecordCount: 0,
        warningCount: 0,
        errorCount: 1,
        completenessPercentage: 0,
        dataQualityStatus: 'REJECTED',
        sourceRecordIds: []
      };

      return {
        submission: emptySubmission,
        sourceRecords: [],
        normalizedRecords: [],
        qualityReport: emptyReport,
        recordResults: [],
        parseError
      };
    }

    // Preserve original source records
    const sourceRecords: SourceRecord[] = [];
    for (let i = 0; i < rawRecords.length; i++) {
      const raw = rawRecords[i];
      const rowNumber = i + 1;
      const entityId = getStringValue(raw, ['entity_id', 'entityId']) || 'UNKNOWN';
      const entityCode = getStringValue(raw, ['entity_code', 'entityCode']) || 'UNKNOWN';
      const assessmentPeriod = getStringValue(raw, ['assessment_period', 'assessmentPeriod', 'period']) || 'UNKNOWN';
      const recordHash = await computeSha256(JSON.stringify(raw));

      sourceRecords.push({
        id: `SRC-${submissionId}-${String(rowNumber).padStart(3, '0')}`,
        submissionId,
        entityId,
        entityCode,
        assessmentPeriod,
        rowNumber,
        rawPayload: { ...raw },
        createdAt: timestamp,
        sha256Fingerprint: recordHash
      });
    }

    // Run deterministic validation
    const { report, recordResults } = validateRecords(submissionId, rawRecords);

    // Extract primary entity details from first valid record
    let extractedEntityId = '';
    let extractedEntityCode = '';
    let extractedPeriod = '';

    for (const rec of rawRecords) {
      const eid = getStringValue(rec, ['entity_id', 'entityId']);
      const ecode = getStringValue(rec, ['entity_code', 'entityCode']);
      const period = getStringValue(rec, ['assessment_period', 'assessmentPeriod', 'period']);
      if (eid) extractedEntityId = eid;
      if (ecode) extractedEntityCode = ecode;
      if (period) extractedPeriod = period;
      if (extractedEntityCode && extractedPeriod) break;
    }

    // Normalize valid records
    const validRowNumbers = new Set(
      recordResults.filter(r => r.isValid).map(r => r.rowNumber)
    );
    const normalizedRecords = normalizeRecords(sourceRecords, validRowNumbers);

    const submission: CSESubmission = {
      submissionId,
      entityId: extractedEntityId || 'CSE-UNSPECIFIED',
      entityCode: extractedEntityCode || 'CSE-UNSPECIFIED',
      assessmentPeriod: extractedPeriod || 'UNSPECIFIED',
      fileName,
      fileType,
      fileSizeBytes: input.fileSizeBytes || new TextEncoder().encode(fileContent).length,
      fileHash,
      importedAt: timestamp,
      recordCount: rawRecords.length,
      validRecordCount: report.validRecords,
      invalidRecordCount: report.invalidRecords,
      warningCount: report.warningCount,
      errorCount: report.errorCount,
      completenessPercentage: report.completenessPercentage,
      dataQualityStatus: report.overallStatus,
      sourceRecordIds: sourceRecords.map(r => r.id)
    };

    return {
      submission,
      sourceRecords,
      normalizedRecords,
      qualityReport: report,
      recordResults
    };
  }

  /**
   * Commits an analyzed submission into local IndexedDB and records an audit trail event.
   */
  async commit(analysis: IngestionAnalysisResult): Promise<void> {
    const { submission, sourceRecords, normalizedRecords, qualityReport } = analysis;

    // 1. Save original Source Records
    await sourceRecordRepository.createMany(sourceRecords);

    // 2. Save Normalized Records
    await normalizedRecordRepository.createMany(normalizedRecords);

    // 3. Save Data Quality Report
    await dataQualityRepository.saveReport(qualityReport);

    // 4. Save Submission Metadata
    await submissionRepository.save(submission);

    // 5. Append Supervisory Audit Event
    await auditRepository.logEvent({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      inspector: 'Supervisory Inspector (Local Session)',
      actionType: 'SUBMISSION_IMPORTED',
      targetEntity: `${submission.entityCode} (${submission.entityId})`,
      targetRef: submission.submissionId,
      provenanceHash: submission.fileHash.substring(0, 18) + '...',
      integrityStatus: 'VALIDATED',
      summary: `CSE structured operational submission ingested: ${submission.recordCount} total records (${submission.validRecordCount} valid, ${submission.warningCount} warnings, ${submission.errorCount} errors) from ${submission.fileName}. Completeness: ${submission.completenessPercentage}%.`
    });
  }

  /**
   * Convenience method to analyze and immediately persist in one step.
   */
  async ingestAndSave(input: ProcessIngestionInput): Promise<IngestionAnalysisResult> {
    const analysis = await this.analyze(input);
    if (analysis.qualityReport.overallStatus !== 'REJECTED') {
      await this.commit(analysis);
    }
    return analysis;
  }

  /**
   * Deletes a submission and all its associated source and normalized records.
   */
  async deleteSubmission(submissionId: string): Promise<void> {
    const existing = await submissionRepository.getById(submissionId);
    await sourceRecordRepository.deleteBySubmissionId(submissionId);
    await normalizedRecordRepository.deleteBySubmissionId(submissionId);
    await dataQualityRepository.deleteBySubmissionId(submissionId);
    try {
      const relatedFindings = await findingsRepository.getBySubmissionId(submissionId);
      for (const f of relatedFindings) {
        await findingsRepository.delete(f.id);
      }
    } catch {
      // Ignore cleanup error if not found
    }
    await submissionRepository.delete(submissionId);

    if (existing) {
      await auditRepository.logEvent({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        inspector: 'Supervisory Inspector (Local Session)',
        actionType: 'SUBMISSION_REJECTED',
        targetEntity: existing.entityCode,
        targetRef: submissionId,
        provenanceHash: existing.fileHash.substring(0, 18) + '...',
        integrityStatus: 'VALIDATED',
        summary: `Supervisory submission ${submissionId} purged from local IndexedDB vault.`
      });
    }
  }
}

export const ingestionService = new IngestionService();
