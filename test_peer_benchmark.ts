/**
 * Deterministic Test Suite for Phase 2 Peer Benchmarking & Supervisory Comparison
 * 
 * Verifies all 14 required Phase 2 validation scenarios:
 * Scenario 1:  0 peers → NO_BASELINE
 * Scenario 2:  1 peer → INCONCLUSIVE
 * Scenario 3:  2 peers → INCONCLUSIVE
 * Scenario 4:  3 valid peers → baseline calculated (EVALUATED)
 * Scenario 5:  target differs by less than threshold → WITHIN_PEER_RANGE
 * Scenario 6:  target differs by >=15 percentage points → PEER_DEVIATION
 * Scenario 7:  duration ratio >=1.5 → PEER_DEVIATION
 * Scenario 8:  duration ratio <=0.67 → PEER_DEVIATION
 * Scenario 9:  invalid submission → excluded (INVALID_OR_REJECTED_STATUS)
 * Scenario 10: completeness <40% → excluded (COMPLETENESS_BELOW_THRESHOLD)
 * Scenario 11: missing identifiers → excluded (MISSING_CRITICAL_IDENTIFIERS)
 * Scenario 12: target submission appears in candidate list → SELF_EXCLUSION
 * Scenario 13: metric unavailable → NO_BASELINE / METRIC_DATA_UNAVAILABLE
 * Scenario 14: synthetic demo data → clearly labeled & isolated from production
 */

import {
  executePeerBenchmark,
  evaluatePeerSubmissionQuality,
  calculatePeerBaseline,
  evaluatePeerDeviation,
  DEFAULT_PEER_OPTIONS,
  PeerCandidateSubmission
} from './src/services/analytics/peerBenchmarkEngine';
import {
  DEMO_SYNTHETIC_PEER_CANDIDATES,
  DEMO_INSUFFICIENT_PEER_CANDIDATES
} from './src/data/peerBenchmarkDemoData';
import {
  findPeerProfileByEntityCode,
  findPeerGroupById,
  DEMO_SYNTHETIC_PEER_PROFILES
} from './src/data/peerProfiles';
import { NormalizedCaseRecord, SubmissionMetadata } from './src/types';

function runTestSuite() {
  console.log('================================================================');
  console.log('SAT-SA PHASE 2: PEER BENCHMARKING DETERMINISTIC TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // Canonical Target Submission (CSE-047)
  const targetSubmission: SubmissionMetadata = {
    submissionId: 'SUB-CSE-047',
    entityId: 'ENT-047-PAY',
    entityCode: 'ENT-047-PAY',
    assessmentPeriod: '2026-Q3',
    fileName: 'canonical_cse047_2026q3.csv',
    fileType: 'CSV',
    fileSizeBytes: 12400,
    fileHash: 'sha256-cse047-hash-canonical',
    importedAt: '2026-08-25T08:00:00Z',
    recordCount: 4,
    validRecordCount: 4,
    invalidRecordCount: 0,
    warningCount: 0,
    errorCount: 0,
    completenessPercentage: 100,
    dataQualityStatus: 'VALID',
    sourceRecordIds: ['REC-1', 'REC-2', 'REC-3', 'REC-4']
  };

  const targetRecords: NormalizedCaseRecord[] = [
    {
      id: 'REC-1',
      sourceRecordId: 'SRC-1',
      submissionId: 'SUB-CSE-047',
      entityId: 'ENT-047-PAY',
      entityCode: 'ENT-047-PAY',
      assessmentPeriod: '2026-Q3',
      caseId: 'CASE-001',
      alertId: 'ALT-1',
      severity: 'CRITICAL',
      alertTimestamp: '2026-08-01T04:00:00Z',
      triageTimestamp: '2026-08-01T04:10:00Z', // 10m triage
      escalationTimestamp: '2026-08-01T04:40:00Z', // 30m delay
      supervisorReviewTimestamp: '2026-08-01T05:30:00Z',
      closureTimestamp: '2026-08-01T06:00:00Z', // 2h closure
      disposition: 'CONTAINED',
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
      id: 'REC-2',
      sourceRecordId: 'SRC-2',
      submissionId: 'SUB-CSE-047',
      entityId: 'ENT-047-PAY',
      entityCode: 'ENT-047-PAY',
      assessmentPeriod: '2026-Q3',
      caseId: 'CASE-002',
      alertId: 'ALT-2',
      severity: 'CRITICAL',
      alertTimestamp: '2026-08-02T02:00:00Z',
      triageTimestamp: '2026-08-02T02:10:00Z', // 10m triage
      escalationTimestamp: null, // NO ESCALATION EVIDENCE (Gap)
      supervisorReviewTimestamp: null,
      closureTimestamp: '2026-08-02T03:00:00Z',
      disposition: 'CLOSED_ROUTINE',
      escalationRecorded: false,
      supervisorReviewRecorded: false,
      evidencePresence: {
        triageEvidence: 'EVIDENCE_PRESENT',
        escalationEvidence: 'EVIDENCE_NOT_PRESENT',
        supervisorReviewEvidence: 'EVIDENCE_NOT_PRESENT',
        closureEvidence: 'EVIDENCE_PRESENT'
      },
      sourcePayload: {}
    }
  ];

  // Helper to manufacture a valid peer candidate
  function createValidPeer(id: string, code: string, triageMins: number, escDelayMins: number): PeerCandidateSubmission {
    return {
      submission: {
        submissionId: `SUB-PEER-${id}`,
        entityId: `ENT-${code}`,
        entityCode: code,
        assessmentPeriod: '2026-Q3',
        fileName: `peer_${id}.csv`,
        fileType: 'DEMO_SYNTHETIC',
        fileSizeBytes: 2000,
        fileHash: `hash-${id}`,
        importedAt: '2026-08-20T00:00:00Z',
        recordCount: 2,
        validRecordCount: 2,
        invalidRecordCount: 0,
        warningCount: 0,
        errorCount: 0,
        completenessPercentage: 90,
        dataQualityStatus: 'VALID',
        sourceRecordIds: [`S1-${id}`, `S2-${id}`]
      },
      records: [
        {
          id: `NORM-1-${id}`,
          sourceRecordId: `S1-${id}`,
          submissionId: `SUB-PEER-${id}`,
          entityId: `ENT-${code}`,
          entityCode: code,
          assessmentPeriod: '2026-Q3',
          caseId: `CASE-1-${id}`,
          alertId: `ALT-1-${id}`,
          severity: 'CRITICAL',
          alertTimestamp: '2026-08-01T00:00:00Z',
          triageTimestamp: new Date(Date.parse('2026-08-01T00:00:00Z') + triageMins * 60000).toISOString(),
          escalationTimestamp: new Date(Date.parse('2026-08-01T00:00:00Z') + (triageMins + escDelayMins) * 60000).toISOString(),
          supervisorReviewTimestamp: new Date(Date.parse('2026-08-01T00:00:00Z') + 60 * 60000).toISOString(),
          closureTimestamp: new Date(Date.parse('2026-08-01T00:00:00Z') + 120 * 60000).toISOString(),
          disposition: 'RESOLVED',
          escalationRecorded: true,
          supervisorReviewRecorded: true,
          evidencePresence: {
            triageEvidence: 'EVIDENCE_PRESENT',
            escalationEvidence: 'EVIDENCE_PRESENT',
            supervisorReviewEvidence: 'EVIDENCE_PRESENT',
            closureEvidence: 'EVIDENCE_PRESENT'
          },
          sourcePayload: {}
        }
      ]
    };
  }

  // --------------------------------------------------------------------------
  // Scenario 1: 0 peers → NO_BASELINE
  // --------------------------------------------------------------------------
  const res1 = executePeerBenchmark({
    targetSubmission,
    targetRecords,
    peerCandidates: []
  });
  assert(
    res1.overallStatus === 'NO_BASELINE' && res1.sampleSize === 0,
    'Scenario 1: 0 peers produces NO_BASELINE (sampleSize=0)',
    `Status was ${res1.overallStatus}, sampleSize was ${res1.sampleSize}`
  );

  // --------------------------------------------------------------------------
  // Scenario 2: 1 peer → INCONCLUSIVE
  // --------------------------------------------------------------------------
  const res2 = executePeerBenchmark({
    targetSubmission,
    targetRecords,
    peerCandidates: [createValidPeer('1', 'PEER-01', 10, 10)]
  });
  assert(
    res2.overallStatus === 'INCONCLUSIVE' && res2.sampleSize === 1,
    'Scenario 2: 1 peer produces INCONCLUSIVE (sampleSize=1)',
    `Status was ${res2.overallStatus}, sampleSize was ${res2.sampleSize}`
  );

  // --------------------------------------------------------------------------
  // Scenario 3: 2 peers → INCONCLUSIVE
  // --------------------------------------------------------------------------
  const res3 = executePeerBenchmark({
    targetSubmission,
    targetRecords,
    peerCandidates: [
      createValidPeer('1', 'PEER-01', 10, 10),
      createValidPeer('2', 'PEER-02', 11, 9)
    ]
  });
  assert(
    res3.overallStatus === 'INCONCLUSIVE' && res3.sampleSize === 2,
    'Scenario 3: 2 peers produces INCONCLUSIVE (sampleSize=2)',
    `Status was ${res3.overallStatus}, sampleSize was ${res3.sampleSize}`
  );

  // --------------------------------------------------------------------------
  // Scenario 4: 3 valid peers → baseline calculated (EVALUATED)
  // --------------------------------------------------------------------------
  const threeValidPeers = [
    createValidPeer('1', 'PEER-01', 10, 10),
    createValidPeer('2', 'PEER-02', 11, 9),
    createValidPeer('3', 'PEER-03', 9, 11)
  ];
  const res4 = executePeerBenchmark({
    targetSubmission,
    targetRecords,
    peerCandidates: threeValidPeers
  });
  assert(
    res4.overallStatus === 'EVALUATED' && res4.sampleSize === 3,
    'Scenario 4: 3 valid peers produces EVALUATED baseline (sampleSize=3)',
    `Status was ${res4.overallStatus}, sampleSize was ${res4.sampleSize}`
  );

  // --------------------------------------------------------------------------
  // Scenario 5: Target differs by less than threshold → WITHIN_PEER_RANGE
  // --------------------------------------------------------------------------
  // Target triage is 10 mins. Peers median is 10 mins. Ratio is 1.0x -> WITHIN_PEER_RANGE
  const triageMetric = res4.metrics.TRIAGE_DURATION;
  assert(
    triageMetric.status === 'WITHIN_PEER_RANGE' && triageMetric.deviationRatio === 1,
    'Scenario 5: Difference within threshold produces WITHIN_PEER_RANGE',
    `Status was ${triageMetric.status}, ratio was ${triageMetric.deviationRatio}`
  );

  // --------------------------------------------------------------------------
  // Scenario 6: Target differs by >=15 percentage points → PEER_DEVIATION
  // --------------------------------------------------------------------------
  // Target escalation coverage is 50% (1 of 2 criticals). Peers escalation coverage is 100%.
  // Difference = 50% - 100% = -50 pp (>= 15 pp deviation).
  const escCoverageMetric = res4.metrics.ESCALATION_EVIDENCE_COVERAGE;
  assert(
    escCoverageMetric.status === 'PEER_DEVIATION' && escCoverageMetric.deviationPercentagePoints === -50,
    'Scenario 6: >= 15 pp percentage difference produces PEER_DEVIATION',
    `Status was ${escCoverageMetric.status}, diff was ${escCoverageMetric.deviationPercentagePoints}`
  );

  // --------------------------------------------------------------------------
  // Scenario 7: Duration ratio >= 1.5 → PEER_DEVIATION
  // --------------------------------------------------------------------------
  // Target escalation delay is 30m. Peer median delay is 10m. Ratio = 3.0x (>= 1.5x)
  const escDelayMetric = res4.metrics.ESCALATION_DELAY;
  assert(
    escDelayMetric.status === 'PEER_DEVIATION' && (escDelayMetric.deviationRatio ?? 0) >= 1.5,
    'Scenario 7: Duration ratio >= 1.5 produces PEER_DEVIATION (slower latency)',
    `Status was ${escDelayMetric.status}, ratio was ${escDelayMetric.deviationRatio}`
  );

  // --------------------------------------------------------------------------
  // Scenario 8: Duration ratio <= 0.67 → PEER_DEVIATION
  // --------------------------------------------------------------------------
  // Test evaluation with duration ratio <= 0.67
  const baseline8 = calculatePeerBaseline('TRIAGE_DURATION', [30, 30, 30]); // Median: 30m
  const dev8 = evaluatePeerDeviation('TRIAGE_DURATION', 15, baseline8, DEFAULT_PEER_OPTIONS); // Target: 15m -> 0.5x
  assert(
    dev8.status === 'PEER_DEVIATION' && (dev8.deviationRatio ?? 0) <= 0.67,
    'Scenario 8: Duration ratio <= 0.67 produces PEER_DEVIATION (notably accelerated)',
    `Status was ${dev8.status}, ratio was ${dev8.deviationRatio}`
  );

  // --------------------------------------------------------------------------
  // Scenario 9: Invalid submission → Excluded
  // --------------------------------------------------------------------------
  const invalidSub: SubmissionMetadata = {
    ...targetSubmission,
    submissionId: 'SUB-INV',
    entityCode: 'ENT-INV',
    dataQualityStatus: 'INVALID'
  };
  const gate9 = evaluatePeerSubmissionQuality(invalidSub, targetRecords);
  assert(
    gate9.eligible === false && gate9.gateCheck === 'INVALID_OR_REJECTED_STATUS',
    'Scenario 9: INVALID submission excluded via INVALID_OR_REJECTED_STATUS gate',
    `Eligible: ${gate9.eligible}, gateCheck: ${gate9.gateCheck}`
  );

  // --------------------------------------------------------------------------
  // Scenario 10: Completeness < 40% → Excluded
  // --------------------------------------------------------------------------
  const lowCompSub: SubmissionMetadata = {
    ...targetSubmission,
    submissionId: 'SUB-LOW',
    entityCode: 'ENT-LOW',
    completenessPercentage: 35
  };
  const gate10 = evaluatePeerSubmissionQuality(lowCompSub, targetRecords);
  assert(
    gate10.eligible === false && gate10.gateCheck === 'COMPLETENESS_BELOW_THRESHOLD',
    'Scenario 10: Completeness < 40% excluded via COMPLETENESS_BELOW_THRESHOLD',
    `Eligible: ${gate10.eligible}, gateCheck: ${gate10.gateCheck}`
  );

  // --------------------------------------------------------------------------
  // Scenario 11: Missing identifiers → Excluded
  // --------------------------------------------------------------------------
  const missingIdSub: SubmissionMetadata = {
    ...targetSubmission,
    submissionId: '',
    entityCode: ''
  };
  const gate11 = evaluatePeerSubmissionQuality(missingIdSub, targetRecords);
  assert(
    gate11.eligible === false && gate11.gateCheck === 'MISSING_CRITICAL_IDENTIFIERS',
    'Scenario 11: Missing critical identifiers excluded via MISSING_CRITICAL_IDENTIFIERS',
    `Eligible: ${gate11.eligible}, gateCheck: ${gate11.gateCheck}`
  );

  // --------------------------------------------------------------------------
  // Scenario 12: Target submission appears in candidate list → SELF_EXCLUSION
  // --------------------------------------------------------------------------
  const res12 = executePeerBenchmark({
    targetSubmission,
    targetRecords,
    peerCandidates: [
      { submission: targetSubmission, records: targetRecords }, // Self candidate
      ...threeValidPeers
    ]
  });
  const selfExcluded = res12.excludedSubmissions.find((e) => e.gateCheck === 'SELF_EXCLUSION');
  assert(
    Boolean(selfExcluded) && res12.sampleSize === 3,
    'Scenario 12: Target submission in candidate list excluded via SELF_EXCLUSION',
    `Excluded self: ${Boolean(selfExcluded)}, sampleSize: ${res12.sampleSize}`
  );

  // --------------------------------------------------------------------------
  // Scenario 13: Metric unavailable → NO_BASELINE
  // --------------------------------------------------------------------------
  const dev13 = evaluatePeerDeviation(
    'ESCALATION_EVIDENCE_COVERAGE',
    null,
    calculatePeerBaseline('ESCALATION_EVIDENCE_COVERAGE', [90, 95, 100]),
    DEFAULT_PEER_OPTIONS
  );
  assert(
    dev13.status === 'NO_BASELINE' && dev13.targetValue === null,
    'Scenario 13: Target metric unavailable evaluates to NO_BASELINE / null',
    `Status: ${dev13.status}`
  );

  // --------------------------------------------------------------------------
  // Scenario 14: Synthetic demo data → clearly labeled & isolated
  // --------------------------------------------------------------------------
  const syntheticProfiles = DEMO_SYNTHETIC_PEER_PROFILES;
  const allSynthetic = syntheticProfiles.every((p) => p.isSynthetic === true);
  const demoCohort = DEMO_SYNTHETIC_PEER_CANDIDATES;
  const hasExcludedDemoPeers = demoCohort.some((c) => c.submission.dataQualityStatus === 'INVALID');

  assert(
    allSynthetic && hasExcludedDemoPeers && demoCohort.length === 5,
    'Scenario 14: Synthetic demonstration data isolated, strictly flagged isSynthetic=true',
    `allSynthetic: ${allSynthetic}, demoCohortCount: ${demoCohort.length}`
  );

  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${passed}/${total} SCENARIOS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite();
