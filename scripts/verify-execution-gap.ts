/**
 * Verification Script for RULE-ESC-04 Execution Gap Engine.
 * Tests all 6 required supervisory scenarios.
 */

import { calculateExecutionGap } from '../src/services/analytics/executionGapEngine';
import { NormalizedCaseRecord, SubmissionMetadata, DataQualityReport } from '../src/types';
import { DEMO_DATASET_CSV } from '../src/services/ingestion/demoDataset';
import { ingestionService } from '../src/services/ingestion';

function createMockRecord(overrides: Partial<NormalizedCaseRecord>): NormalizedCaseRecord {
  return {
    id: 'norm-' + Math.random().toString(36).substring(2, 9),
    sourceRecordId: 'src-' + Math.random().toString(36).substring(2, 9),
    submissionId: 'sub-test-001',
    entityId: 'ENT-047-PAY',
    entityCode: 'CSE-047',
    assessmentPeriod: '2026-Q3',
    caseId: 'CASE-TEST-001',
    alertId: 'ALT-1001',
    severity: 'CRITICAL',
    alertTimestamp: '2026-08-01T04:12:00Z',
    triageTimestamp: '2026-08-01T04:18:22Z',
    escalationTimestamp: null,
    supervisorReviewTimestamp: null,
    closureTimestamp: '2026-08-01T05:30:15Z',
    disposition: 'CONTAINED_TRUE_POSITIVE',
    escalationRecorded: false,
    supervisorReviewRecorded: false,
    evidencePresence: {
      triageEvidence: 'EVIDENCE_PRESENT',
      escalationEvidence: 'EVIDENCE_NOT_PRESENT',
      supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
      closureEvidence: 'EVIDENCE_PRESENT'
    },
    sourcePayload: { test: true },
    ...overrides
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
    failed++;
  }
}

console.log('========================================================');
console.log('VERIFYING RULE-ESC-04 EXECUTION GAP ENGINE');
console.log('========================================================\n');

// ----------------------------------------------------
// Scenario 1: Critical case + escalation
// ----------------------------------------------------
console.log('Scenario 1: Critical case + escalation evidence recorded');
const s1Record = createMockRecord({
  caseId: 'CASE-S1-001',
  severity: 'CRITICAL',
  escalationTimestamp: '2026-08-01T04:24:10Z',
  escalationRecorded: true,
  evidencePresence: {
    triageEvidence: 'EVIDENCE_PRESENT',
    escalationEvidence: 'EVIDENCE_PRESENT',
    supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
    closureEvidence: 'EVIDENCE_PRESENT'
  }
});
const s1Result = calculateExecutionGap([s1Record]);
assert(s1Result.summary.applicableCaseCount === 1, 'S1: Applicable case count is 1');
assert(s1Result.summary.expectedCount === 1, 'S1: Expected escalation count is 1');
assert(s1Result.summary.observedCount === 1, 'S1: Observed escalation count is 1');
assert(s1Result.summary.gapCount === 0, 'S1: Gap count is 0');
assert(s1Result.summary.gapRate === 0, 'S1: Gap rate is 0%');
assert(s1Result.caseEvaluations[0].evidenceStatus === 'EVIDENCE_PRESENT', 'S1: Evidence status is EVIDENCE_PRESENT');
assert(s1Result.caseEvaluations[0].hasExecutionGap === false, 'S1: hasExecutionGap is false');

// ----------------------------------------------------
// Scenario 2: Critical case + no escalation
// ----------------------------------------------------
console.log('\nScenario 2: Critical case + no escalation evidence recorded');
const s2Record = createMockRecord({
  caseId: 'CASE-S2-001',
  sourceRecordId: 'SRC-REC-S2-999',
  severity: 'CRITICAL',
  escalationTimestamp: null,
  escalationRecorded: false
});
const s2Result = calculateExecutionGap([s2Record]);
assert(s2Result.summary.applicableCaseCount === 1, 'S2: Applicable case count is 1');
assert(s2Result.summary.expectedCount === 1, 'S2: Expected escalation count is 1');
assert(s2Result.summary.observedCount === 0, 'S2: Observed escalation count is 0');
assert(s2Result.summary.gapCount === 1, 'S2: Gap count is 1');
assert(s2Result.summary.gapRate === 100, 'S2: Gap rate is 100%');
assert(s2Result.caseEvaluations[0].evidenceStatus === 'EVIDENCE_NOT_PRESENT', 'S2: Evidence status is EVIDENCE_NOT_PRESENT');
assert(s2Result.caseEvaluations[0].hasExecutionGap === true, 'S2: hasExecutionGap is true');
assert(s2Result.summary.affectedCaseIds.includes('CASE-S2-001'), 'S2: Affected case list includes CASE-S2-001');
assert(s2Result.summary.evidenceRecordIds.includes('SRC-REC-S2-999'), 'S2: Evidence record IDs trace back to SRC-REC-S2-999');

// ----------------------------------------------------
// Scenario 3: High/Medium/Low case (non-critical)
// ----------------------------------------------------
console.log('\nScenario 3: Non-critical cases (High, Medium, Low)');
const s3Records = [
  createMockRecord({ caseId: 'CASE-S3-HIGH', severity: 'HIGH', escalationRecorded: false }),
  createMockRecord({ caseId: 'CASE-S3-MED', severity: 'MEDIUM', escalationRecorded: false }),
  createMockRecord({ caseId: 'CASE-S3-LOW', severity: 'LOW', escalationRecorded: false })
];
const s3Result = calculateExecutionGap(s3Records);
assert(s3Result.summary.totalEvaluatedCases === 3, 'S3: Total evaluated cases is 3');
assert(s3Result.summary.applicableCaseCount === 0, 'S3: Applicable case count is 0');
assert(s3Result.summary.expectedCount === 0, 'S3: Expected escalation count is 0');
assert(s3Result.summary.gapCount === 0, 'S3: Gap count is 0');
assert(s3Result.summary.gapRate === 0, 'S3: Gap rate is 0%');
assert(s3Result.caseEvaluations.every((c) => !c.isApplicable), 'S3: All cases marked not applicable to RULE-ESC-04');
assert(s3Result.caseEvaluations.every((c) => c.evidenceStatus === 'NOT_APPLICABLE'), 'S3: Evidence status is NOT_APPLICABLE');

// ----------------------------------------------------
// Scenario 4: Insufficient data / Data quality limited
// ----------------------------------------------------
console.log('\nScenario 4: Insufficient data / Data quality limited');
const s4RecordQualityError = createMockRecord({
  caseId: 'CASE-S4-ERR',
  severity: 'CRITICAL',
  alertTimestamp: '2026-08-01T04:12:00Z',
  escalationRecorded: false
});
const mockQualityReport: DataQualityReport = {
  submissionId: 'sub-test-001',
  totalRecords: 1,
  validRecords: 0,
  invalidRecords: 1,
  duplicateRecords: 0,
  warningCount: 0,
  errorCount: 1,
  completenessPercentage: 25,
  overallStatus: 'WARNINGS',
  issues: [
    {
      id: 'iss-1',
      submissionId: 'sub-test-001',
      caseId: 'CASE-S4-ERR',
      field: 'closure_timestamp',
      severity: 'ERROR',
      code: 'CHRONOLOGY_VIOLATION',
      message: 'Closure timestamp precedes alert timestamp.'
    }
  ],
  evaluatedAt: new Date().toISOString()
};
const s4Result = calculateExecutionGap([s4RecordQualityError], null, mockQualityReport);
assert(s4Result.summary.dataQualityLimitedCount === 1, 'S4: Data quality limited count is 1');
assert(s4Result.summary.gapCount === 0, 'S4: Gap count is 0 (not falsely marked as execution gap)');
assert(s4Result.caseEvaluations[0].dataQualityStatus === 'DATA_QUALITY_LIMITED', 'S4: Case data quality is DATA_QUALITY_LIMITED');
assert(s4Result.caseEvaluations[0].evidenceStatus === 'DATA_QUALITY_LIMITED', 'S4: Evidence status is DATA_QUALITY_LIMITED');
assert(s4Result.summary.warnings.length > 0, 'S4: Supervisory warnings present');

// ----------------------------------------------------
// Scenario 5: Multiple cases (CSE-047 Demo Dataset)
// ----------------------------------------------------
async function testScenario5() {
  console.log('\nScenario 5: Multiple cases (CSE-047 20-record demo dataset)');
  const analysis = await ingestionService.analyze({
    fileName: 'cse047_supervisory_ops_2026q3.csv',
    fileContent: DEMO_DATASET_CSV,
    fileType: 'CSV'
  });
  const s5Result = calculateExecutionGap(analysis.normalizedRecords, analysis.submission, analysis.qualityReport);

  assert(s5Result.summary.totalEvaluatedCases === 20, 'S5: Total evaluated cases is 20');
  assert(s5Result.summary.applicableCaseCount === 9, 'S5: Applicable CRITICAL cases is 9');
  assert(s5Result.summary.expectedCount === 9, 'S5: Expected escalation count is 9');
  assert(s5Result.summary.observedCount === 5, 'S5: Observed escalations count is 5 (Cases 001, 005, 010, 016, 020)');
  assert(s5Result.summary.gapCount === 4, 'S5: Potential execution gaps count is 4 (Cases 003, 008, 012, 017)');
  assert(s5Result.summary.gapRate === 44.4, 'S5: Gap rate is exactly 44.4%');
  assert(s5Result.summary.affectedCaseIds.length === 4, 'S5: 4 affected case IDs returned');
  assert(s5Result.summary.evidenceRecordIds.length === 4, 'S5: 4 supporting sourceRecordIds returned');
  assert(
    s5Result.summary.affectedCaseIds.includes('CASE-2026-047-003') &&
    s5Result.summary.affectedCaseIds.includes('CASE-2026-047-008') &&
    s5Result.summary.affectedCaseIds.includes('CASE-2026-047-012') &&
    s5Result.summary.affectedCaseIds.includes('CASE-2026-047-017'),
    'S5: Exact expected affected cases (003, 008, 012, 017) are identified'
  );
}

// ----------------------------------------------------
// Scenario 6: No applicable cases (All Non-Critical)
// ----------------------------------------------------
console.log('\nScenario 6: No applicable cases in submission');
const s6Records = [
  createMockRecord({ caseId: 'CASE-S6-001', severity: 'MEDIUM' }),
  createMockRecord({ caseId: 'CASE-S6-002', severity: 'LOW' }),
  createMockRecord({ caseId: 'CASE-S6-003', severity: 'HIGH' })
];
const s6Result = calculateExecutionGap(s6Records);
assert(s6Result.summary.totalEvaluatedCases === 3, 'S6: Total evaluated cases is 3');
assert(s6Result.summary.applicableCaseCount === 0, 'S6: Applicable cases is 0');
assert(s6Result.summary.expectedCount === 0, 'S6: Expected count is 0');
assert(s6Result.summary.observedCount === 0, 'S6: Observed count is 0');
assert(s6Result.summary.gapCount === 0, 'S6: Gap count is 0');
assert(s6Result.summary.gapRate === 0, 'S6: Gap rate is 0%');
assert(
  s6Result.summary.summaryStatement.includes('No critical operational cases'),
  'S6: Summary statement clearly explains no critical cases observed'
);

await testScenario5();

console.log('\n========================================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('========================================================');

if (failed > 0) {
  process.exit(1);
}
