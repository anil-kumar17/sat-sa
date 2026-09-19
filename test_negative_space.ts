/**
 * Automated Verification Test for STEP 4: Deterministic Negative Space Engine
 * 
 * Verifies:
 * TEST 1: Critical + escalation evidence → EVIDENCE_PRESENT
 * TEST 2: Critical + missing escalation evidence + complete record → EVIDENCE_NOT_PRESENT
 * TEST 3: Critical + incomplete source data → DATA_QUALITY_LIMITED or INCONCLUSIVE
 * TEST 4: Non-critical → NOT_APPLICABLE
 * TEST 5: Multiple cases → aggregate counts equal case classifications
 * TEST 6: No valid applicable cases → absenceRate = 0
 * TEST 7: Existing RULE-ESC-04 results remain 100% unchanged
 */

import { calculateNegativeSpace } from './src/services/analytics/negativeSpaceEngine';
import { calculateExecutionGap } from './src/services/analytics/executionGapEngine';
import { parseCsvText } from './src/services/ingestion/csvParser';
import { validateRecords } from './src/services/ingestion/validator';
import { normalizeRecord } from './src/services/ingestion/normalizer';
import { DEMO_DATASET_CSV, DEMO_DATASET_EXTENDED_CSV } from './src/services/ingestion/demoDataset';
import { NormalizedCaseRecord, SourceRecord, SubmissionMetadata } from './src/types/submission';

function runTests() {
  console.log('====================================================');
  console.log('RUNNING STEP 4 DETERMINISTIC NEGATIVE SPACE TESTS');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 7;

  // Base mock submission
  const mockSubmission: SubmissionMetadata = {
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    fileName: 'test.csv',
    fileSize: 1024,
    fileHash: 'sha256-test',
    format: 'CSV',
    recordCount: 5,
    validRecordCount: 5,
    errorCount: 0,
    warningCount: 0,
    completenessPercentage: 100,
    dataQualityStatus: 'VALID',
    importedAt: '2026-09-01T00:00:00Z'
  };

  // ----------------------------------------------------
  // TEST 1: Critical + escalation evidence → EVIDENCE_PRESENT
  // ----------------------------------------------------
  const caseTest1: NormalizedCaseRecord = {
    id: 'NORM-001',
    sourceRecordId: 'SRC-001',
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-T1',
    alertId: 'ALT-01',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-01T12:00:00Z',
    triageTimestamp: '2026-08-01T12:10:00Z',
    escalationTimestamp: '2026-08-01T12:20:00Z',
    closureTimestamp: '2026-08-01T13:00:00Z',
    disposition: 'CONTAINED',
    escalationRecorded: true,
    supervisorReviewRecorded: true,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    }
  };

  const res1 = calculateNegativeSpace([caseTest1], mockSubmission);
  const eval1 = res1.caseEvaluations[0];
  if (
    eval1.classification === 'EVIDENCE_PRESENT' &&
    res1.evidencePresentCount === 1 &&
    res1.absentEvidenceCount === 0 &&
    res1.absenceRate === 0
  ) {
    console.log('✅ TEST 1 PASSED: Critical + escalation evidence → EVIDENCE_PRESENT');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', eval1);
  }

  // ----------------------------------------------------
  // TEST 2: Critical + missing escalation evidence + complete record → EVIDENCE_NOT_PRESENT
  // ----------------------------------------------------
  const caseTest2: NormalizedCaseRecord = {
    id: 'NORM-002',
    sourceRecordId: 'SRC-002',
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-T2',
    alertId: 'ALT-02',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-02T12:00:00Z',
    triageTimestamp: '2026-08-02T12:10:00Z',
    escalationTimestamp: null,
    closureTimestamp: '2026-08-02T13:00:00Z',
    disposition: 'DISMISSED',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_NOT_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    }
  };

  const res2 = calculateNegativeSpace([caseTest2], mockSubmission);
  const eval2 = res2.caseEvaluations[0];
  if (
    eval2.classification === 'EVIDENCE_NOT_PRESENT' &&
    res2.absentEvidenceCount === 1 &&
    res2.evidencePresentCount === 0 &&
    res2.absenceRate === 100.0 &&
    res2.affectedCaseIds.includes('CASE-T2')
  ) {
    console.log('✅ TEST 2 PASSED: Critical + missing escalation evidence + complete record → EVIDENCE_NOT_PRESENT (100% absence rate)');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED:', eval2);
  }

  // ----------------------------------------------------
  // TEST 3: Critical + incomplete source data → DATA_QUALITY_LIMITED or INCONCLUSIVE
  // ----------------------------------------------------
  const caseTest3A: NormalizedCaseRecord = {
    id: 'NORM-003A',
    sourceRecordId: 'SRC-003A',
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-T3A',
    alertId: 'ALT-03A',
    severity: 'CRITICAL',
    alertTimestamp: '', // Missing timestamp
    triageTimestamp: '2026-08-03T12:10:00Z',
    escalationTimestamp: null,
    closureTimestamp: '2026-08-03T13:00:00Z',
    disposition: 'UNKNOWN',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'INCOMPLETE_SUBMISSION',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    }
  };

  // Case with timestamp out of observation window (2025-01-10 in 2026-Q3 submission)
  const caseTest3B: NormalizedCaseRecord = {
    id: 'NORM-003B',
    sourceRecordId: 'SRC-003B',
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-T3B',
    alertId: 'ALT-03B',
    severity: 'CRITICAL',
    alertTimestamp: '2025-01-10T12:00:00Z', // Outside 2026-Q3
    triageTimestamp: '2025-01-10T12:10:00Z',
    escalationTimestamp: null,
    closureTimestamp: '2025-01-10T13:00:00Z',
    disposition: 'DISMISSED',
    escalationRecorded: false,
    supervisorReviewRecorded: false
  };

  const res3A = calculateNegativeSpace([caseTest3A], mockSubmission);
  const eval3A = res3A.caseEvaluations[0];
  const res3B = calculateNegativeSpace([caseTest3B], mockSubmission);
  const eval3B = res3B.caseEvaluations[0];

  if (
    eval3A.classification === 'DATA_QUALITY_LIMITED' &&
    eval3B.classification === 'INCONCLUSIVE' &&
    res3A.absentEvidenceCount === 0 &&
    res3B.absentEvidenceCount === 0
  ) {
    console.log('✅ TEST 3 PASSED: Critical + incomplete data → DATA_QUALITY_LIMITED; out-of-window → INCONCLUSIVE');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED:', { eval3A, eval3B });
  }

  // ----------------------------------------------------
  // TEST 4: Non-critical → NOT_APPLICABLE
  // ----------------------------------------------------
  const caseTest4: NormalizedCaseRecord = {
    id: 'NORM-004',
    sourceRecordId: 'SRC-004',
    submissionId: 'SUB-TEST-001',
    entityId: 'ENT-TEST',
    entityCode: 'CSE-TEST',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-T4',
    alertId: 'ALT-04',
    severity: 'HIGH', // Non-critical
    alertTimestamp: '2026-08-04T12:00:00Z',
    triageTimestamp: '2026-08-04T12:10:00Z',
    escalationTimestamp: null,
    closureTimestamp: '2026-08-04T13:00:00Z',
    disposition: 'RESOLVED',
    escalationRecorded: false,
    supervisorReviewRecorded: false
  };

  const res4 = calculateNegativeSpace([caseTest4], mockSubmission);
  const eval4 = res4.caseEvaluations[0];
  if (
    eval4.classification === 'NOT_APPLICABLE' &&
    eval4.isApplicable === false &&
    res4.notApplicableCount === 1 &&
    res4.applicableCaseCount === 0 &&
    res4.absenceRate === 0
  ) {
    console.log('✅ TEST 4 PASSED: Non-critical → NOT_APPLICABLE (does not inflate absence rate)');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED:', eval4);
  }

  // ----------------------------------------------------
  // TEST 5: Multiple cases → aggregate counts equal case classifications
  // ----------------------------------------------------
  const mixedBatch = [caseTest1, caseTest2, caseTest3A, caseTest3B, caseTest4];
  const res5 = calculateNegativeSpace(mixedBatch, mockSubmission);

  const sumOfClassifications =
    res5.evidencePresentCount +
    res5.absentEvidenceCount +
    res5.dataQualityLimitedCount +
    res5.notApplicableCount +
    res5.inconclusiveCount;

  if (
    sumOfClassifications === mixedBatch.length &&
    res5.totalEvaluatedCases === 5 &&
    res5.evidencePresentCount === 1 &&
    res5.absentEvidenceCount === 1 &&
    res5.dataQualityLimitedCount === 1 &&
    res5.inconclusiveCount === 1 &&
    res5.notApplicableCount === 1 &&
    res5.expectedEvidenceCount === 2 && // Only 3A and 3B excluded from denominator!
    res5.absenceRate === 50.0 // 1 absent / 2 valid expected = 50.0%
  ) {
    console.log(`✅ TEST 5 PASSED: Aggregate counts exactly equal classifications (${sumOfClassifications} = ${mixedBatch.length}) & absence rate is calculated on valid denominator (50.0%)`);
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED:', { res5, sumOfClassifications });
  }

  // ----------------------------------------------------
  // TEST 6: No valid applicable cases → absenceRate = 0
  // ----------------------------------------------------
  const noApplicableBatch = [caseTest4, caseTest3A];
  const res6 = calculateNegativeSpace(noApplicableBatch, mockSubmission);

  if (
    res6.expectedEvidenceCount === 0 &&
    res6.absentEvidenceCount === 0 &&
    res6.absenceRate === 0 &&
    res6.affectedCaseIds.length === 0
  ) {
    console.log('✅ TEST 6 PASSED: No valid applicable cases → absenceRate = 0, no false negative space findings');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED:', res6);
  }

  // ----------------------------------------------------
  // TEST 7: Existing RULE-ESC-04 results remain 100% unchanged
  // ----------------------------------------------------
  // Parse full DEMO_DATASET_CSV
  const parsed = parseCsvText(DEMO_DATASET_CSV);
  const valResult = validateRecords('DEMO-SUB-001', parsed.records);
  const sourceRecords: SourceRecord[] = parsed.records.map((raw, idx) => ({
    id: `SRC-${idx + 1}`,
    submissionId: 'DEMO-SUB-001',
    rowNumber: idx + 1,
    rawPayload: raw,
    sha256Fingerprint: 'demo-hash',
    receivedAt: '2026-09-01T00:00:00Z',
    dataQualityErrorsCount: 0
  }));
  const normalizedRecords = sourceRecords.map(normalizeRecord);

  const demoSubmission: SubmissionMetadata = {
    submissionId: 'DEMO-SUB-001',
    entityId: 'ENT-047-PAY',
    entityCode: 'CSE-047',
    assessmentPeriod: '2026-Q3',
    fileName: 'cse047_supervisory_ops_2026q3.csv',
    fileSize: 3936,
    fileHash: 'demo-hash',
    format: 'CSV',
    recordCount: normalizedRecords.length,
    validRecordCount: normalizedRecords.length,
    errorCount: 0,
    warningCount: 0,
    completenessPercentage: 100,
    dataQualityStatus: 'VALID',
    importedAt: '2026-09-01T00:00:00Z'
  };

  // Run RULE-ESC-04
  const esc04Result = calculateExecutionGap(normalizedRecords, demoSubmission, valResult.report);

  // Run RULE-NS-ESC-01 Negative Space
  const nsResult = calculateNegativeSpace(normalizedRecords, demoSubmission, valResult.report);

  const esc04Matches =
    esc04Result.summary.totalEvaluatedCases === 20 &&
    esc04Result.summary.applicableCaseCount === 9 &&
    esc04Result.summary.observedCount === 5 &&
    esc04Result.summary.gapCount === 4 &&
    esc04Result.summary.gapRate === 44.4 &&
    esc04Result.summary.affectedCaseIds.includes('CASE-2026-047-003') &&
    esc04Result.summary.affectedCaseIds.includes('CASE-2026-047-008') &&
    esc04Result.summary.affectedCaseIds.includes('CASE-2026-047-012') &&
    esc04Result.summary.affectedCaseIds.includes('CASE-2026-047-017');

  const nsMatches =
    nsResult.totalEvaluatedCases === 20 &&
    nsResult.applicableCaseCount === 9 &&
    nsResult.expectedEvidenceCount === 9 &&
    nsResult.observedEvidenceCount === 5 &&
    nsResult.absentEvidenceCount === 4 &&
    nsResult.absenceRate === 44.4 &&
    nsResult.evidencePresentCount === 5 &&
    nsResult.notApplicableCount === 11 &&
    nsResult.affectedCaseIds.length === 4;

  if (esc04Matches && nsMatches) {
    console.log('✅ TEST 7 PASSED: Existing RULE-ESC-04 results remain 100% UNCHANGED (20 total, 9 applicable, 5 observed, 4 gaps, 44.4% gap rate). Negative Space runs independently with identical dynamic rigor.');
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED:', {
      esc04: esc04Result.summary,
      ns: {
        total: nsResult.totalEvaluatedCases,
        applicable: nsResult.applicableCaseCount,
        expected: nsResult.expectedEvidenceCount,
        observed: nsResult.observedEvidenceCount,
        absent: nsResult.absentEvidenceCount,
        rate: nsResult.absenceRate
      }
    });
  }

  // ----------------------------------------------------
  // EXTENDED DEMO CHECK: 22 records with all 5 negative space categories
  // ----------------------------------------------------
  const parsedExt = parseCsvText(DEMO_DATASET_EXTENDED_CSV);
  const valResultExt = validateRecords('DEMO-EXT-001', parsedExt.records);
  const sourceRecordsExt: SourceRecord[] = parsedExt.records.map((raw, idx) => ({
    id: `SRC-EXT-${idx + 1}`,
    submissionId: 'DEMO-EXT-001',
    rowNumber: idx + 1,
    rawPayload: raw,
    sha256Fingerprint: 'demo-ext-hash',
    receivedAt: '2026-09-01T00:00:00Z',
    dataQualityErrorsCount: 0
  }));
  const normalizedRecordsExt = sourceRecordsExt.map(normalizeRecord);

  const demoExtSubmission: SubmissionMetadata = {
    submissionId: 'DEMO-EXT-001',
    entityId: 'ENT-047-PAY',
    entityCode: 'CSE-047',
    assessmentPeriod: '2026-Q3',
    fileName: 'cse047_supervisory_ops_2026q3_extended.csv',
    fileSize: 4200,
    fileHash: 'demo-ext-hash',
    format: 'CSV',
    recordCount: normalizedRecordsExt.length,
    validRecordCount: normalizedRecordsExt.length,
    errorCount: valResultExt.report.issues.filter(i => i.severity === 'ERROR').length,
    warningCount: 0,
    completenessPercentage: 96,
    dataQualityStatus: 'WARNINGS',
    importedAt: '2026-09-01T00:00:00Z'
  };

  const nsExtResult = calculateNegativeSpace(normalizedRecordsExt, demoExtSubmission, valResultExt.report);

  const hasAllFive =
    nsExtResult.evidencePresentCount === 5 &&
    nsExtResult.absentEvidenceCount === 4 &&
    nsExtResult.dataQualityLimitedCount === 1 &&
    nsExtResult.inconclusiveCount === 1 &&
    nsExtResult.notApplicableCount === 11 &&
    nsExtResult.totalEvaluatedCases === 22 &&
    nsExtResult.absenceRate === 44.4; // 4 / (5+4) * 100 = 44.4%, excluding DQ and Inconclusive from denominator!

  if (hasAllFive) {
    console.log('✅ EXTENDED DEMO VERIFIED: 22 records contain all 5 categories (5 Present, 4 Absent, 1 Data Quality Limited, 1 Inconclusive, 11 Not Applicable). Absence rate is mathematically pure (44.4%).');
  } else {
    console.error('❌ EXTENDED DEMO VERIFICATION FAILED:', nsExtResult);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests();
