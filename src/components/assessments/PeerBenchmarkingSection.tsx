import React, { useMemo, useState } from 'react';
import {
  Users,
  AlertTriangle,
  FileQuestion,
  Info,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  BookmarkCheck
} from 'lucide-react';

import {
  CSESubmission,
  NormalizedCaseRecord,
  PeerBenchmarkResult,
  PeerDeviation,
  PeerMetricCode,
  PeerBenchmarkSignal
} from '../../types';

import {
  executePeerBenchmark,
  PeerCandidateSubmission
} from '../../services/analytics/peerBenchmarkEngine';

import {
  DEMO_SYNTHETIC_PEER_CANDIDATES,
  DEMO_INSUFFICIENT_PEER_CANDIDATES
} from '../../data/peerBenchmarkDemoData';

import {
  findPeerProfileByEntityCode,
  findPeerGroupById
} from '../../data/peerProfiles';

interface PeerBenchmarkingSectionProps {
  targetSubmission: CSESubmission;
  targetRecords: NormalizedCaseRecord[];
  storedSubmissions?: CSESubmission[];
  allStoredRecords?: NormalizedCaseRecord[];
}

type PeerSourceMode =
  | 'LOCAL_VAULT'
  | 'SYNTHETIC_DEMO'
  | 'INSUFFICIENT_DEMO';

const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return `${val.toFixed(1)}%`;
};

const formatSeconds = (sec: number | null | undefined): string => {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return '—';

  const mins = Math.round(sec / 60);

  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
};

export const PeerBenchmarkingSection: React.FC<
  PeerBenchmarkingSectionProps
> = ({
  targetSubmission,
  targetRecords,
  storedSubmissions = [],
  allStoredRecords = []
}) => {
  const [sourceMode, setSourceMode] =
    useState<PeerSourceMode>('LOCAL_VAULT');

  const [expandedMetric, setExpandedMetric] =
    useState<PeerMetricCode | null>(null);

  const [flaggedSignals, setFlaggedSignals] =
    useState<Record<string, PeerBenchmarkSignal>>({});

  const [showExclusions, setShowExclusions] =
    useState<boolean>(false);

  const targetPeerProfile = useMemo(() => {
    const profileBySubmissionCode = findPeerProfileByEntityCode(
      targetSubmission.entityCode
    );

    if (profileBySubmissionCode) {
      return profileBySubmissionCode;
    }

    if (targetSubmission.entityId) {
      return findPeerProfileByEntityCode(targetSubmission.entityId);
    }

    return null;
  }, [targetSubmission.entityCode, targetSubmission.entityId]);

  const targetPeerGroup = useMemo(() => {
    if (!targetPeerProfile?.peerGroupId) return null;

    return findPeerGroupById(targetPeerProfile.peerGroupId);
  }, [targetPeerProfile]);

  const peerCandidates = useMemo<PeerCandidateSubmission[]>(() => {
    if (sourceMode === 'SYNTHETIC_DEMO') {
      return DEMO_SYNTHETIC_PEER_CANDIDATES.map((candidate) => ({
        ...candidate,
        peerProfile:
          findPeerProfileByEntityCode(candidate.submission.entityCode)
      }));
    }

    if (sourceMode === 'INSUFFICIENT_DEMO') {
      return DEMO_INSUFFICIENT_PEER_CANDIDATES.map((candidate) => ({
        ...candidate,
        peerProfile:
          findPeerProfileByEntityCode(candidate.submission.entityCode)
      }));
    }

    const otherSubmissions = storedSubmissions.filter(
      (submission) =>
        submission.submissionId !== targetSubmission.submissionId
    );

    return otherSubmissions.map((submission) => {
      const records = allStoredRecords.filter(
        (record) => record.submissionId === submission.submissionId
      );

      return {
        submission,
        records,
        peerProfile: findPeerProfileByEntityCode(submission.entityCode)
      };
    });
  }, [
    sourceMode,
    storedSubmissions,
    allStoredRecords,
    targetSubmission.submissionId
  ]);

  const benchmarkResult: PeerBenchmarkResult = useMemo(() => {
    return executePeerBenchmark({
      targetSubmission,
      targetRecords,
      peerCandidates,
      peerProfile: targetPeerProfile,
      peerGroup: targetPeerGroup
    });
  }, [
    targetSubmission,
    targetRecords,
    peerCandidates,
    targetPeerProfile,
    targetPeerGroup
  ]);

  const metricsList = useMemo(() => {
    return Object.values(benchmarkResult.metrics);
  }, [benchmarkResult]);

  const peerDeviationsCount = useMemo(() => {
    return metricsList.filter(
      (metric) => metric.status === 'PEER_DEVIATION'
    ).length;
  }, [metricsList]);

  const toggleFlagSignal = (deviation: PeerDeviation) => {
    const key = deviation.metricCode;

    if (flaggedSignals[key]) {
      const next = { ...flaggedSignals };
      delete next[key];
      setFlaggedSignals(next);
      return;
    }

    const signal: PeerBenchmarkSignal = {
      signalId: `SIG-PEER-${deviation.metricCode}-${targetSubmission.submissionId.slice(
        -6
      )}`,
      metricCode: deviation.metricCode,
      metricName: deviation.metricName,
      entityCode: targetSubmission.entityCode,
      submissionId: targetSubmission.submissionId,
      peerGroupId: benchmarkResult.peerGroup?.peerGroupId || 'UNASSIGNED',
      peerGroupName:
        benchmarkResult.peerGroup?.peerGroupName || 'No peer group assigned',
      status: deviation.status,
      targetValue: deviation.targetValue,
      peerMedian: deviation.peerBaseline?.median ?? null,
      deviationDelta:
        deviation.metricType === 'PERCENTAGE'
          ? `${
              deviation.deviationPercentagePoints !== null &&
              deviation.deviationPercentagePoints !== undefined &&
              deviation.deviationPercentagePoints > 0
                ? '+'
                : ''
            }${deviation.deviationPercentagePoints?.toFixed(1)} pp`
          : `${deviation.deviationRatio?.toFixed(2)}×`,
      supervisoryInterpretation:
        deviation.supervisoryInterpretation,
      flaggedAt: new Date().toISOString(),
      isSynthetic:
        targetPeerProfile?.isSynthetic ?? sourceMode !== 'LOCAL_VAULT'
    };

    setFlaggedSignals({
      ...flaggedSignals,
      [key]: signal
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PEER_DEVIATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/30">
            <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
            PEER DEVIATION
          </span>
        );

      case 'WITHIN_PEER_RANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30">
            <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
            WITHIN PEER RANGE
          </span>
        );

      case 'INCONCLUSIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/30">
            <FileQuestion className="w-3 h-3 text-[#f59e0b]" />
            INCONCLUSIVE
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#8d90a0]/10 text-[#94a3b8] border border-[#8d90a0]/20">
            NO BASELINE
          </span>
        );
    }
  };

  const cohortName =
    benchmarkResult.peerGroup?.peerGroupName ||
    targetPeerProfile?.peerGroupName ||
    'No peer group assigned';

  const cohortId =
    benchmarkResult.peerGroup?.peerGroupId ||
    targetPeerProfile?.peerGroupId ||
    'UNASSIGNED';

  return (
    <section className="p-5 sm:p-6 rounded bg-[#131B2E] border border-[#1E293B] space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <Users className="w-4 h-4" />
            SUPERVISORY BENCHMARKING ENGINE // PEER COMPARISON
          </div>

          <h2 className="text-lg font-semibold text-[#dde2f7] tracking-tight">
            Peer Benchmarking & Supervisory Comparison
          </h2>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl leading-relaxed">
            Compares observed operational metrics with a defined cohort of
            comparable CSE submissions. Peer deviation provides supervisory
            context and requires review against supporting evidence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#090D16] p-1.5 rounded border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] px-2 uppercase">
            Cohort Source:
          </span>

          <div className="inline-flex rounded-md p-0.5 bg-[#131B2E] border border-[#1E293B]">
            <button
              onClick={() => setSourceMode('LOCAL_VAULT')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                sourceMode === 'LOCAL_VAULT'
                  ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] font-semibold border border-[#4cd7f6]/30'
                  : 'text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Local Vault (
              {
                storedSubmissions.filter(
                  (submission) =>
                    submission.submissionId !==
                    targetSubmission.submissionId
                ).length
              }{' '}
              Candidates)
            </button>

            <button
              onClick={() => setSourceMode('SYNTHETIC_DEMO')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                sourceMode === 'SYNTHETIC_DEMO'
                  ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] font-semibold border border-[#4cd7f6]/30'
                  : 'text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Synthetic Demo (5 Candidates)
            </button>

            <button
              onClick={() => setSourceMode('INSUFFICIENT_DEMO')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                sourceMode === 'INSUFFICIENT_DEMO'
                  ? 'bg-[#4cd7f6]/20 text-[#4cd7f6] font-semibold border border-[#4cd7f6]/30'
                  : 'text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Insufficient Sample (1 Candidate)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[9px] uppercase font-mono text-[#8d90a0] block">
            Target Entity
          </span>

          <div className="mt-1 text-sm font-semibold text-[#dde2f7] flex items-center justify-between">
            <span>{targetSubmission.entityCode}</span>

            <span className="text-[10px] font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 px-1.5 py-0.5 rounded border border-[#4cd7f6]/20">
              {targetSubmission.assessmentPeriod}
            </span>
          </div>

          <div className="mt-1 text-[10px] text-[#8d90a0] truncate">
            {targetPeerProfile?.entityName || targetSubmission.entityId}
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[9px] uppercase font-mono text-[#8d90a0] block">
            Peer Cohort Group
          </span>

          <div
            className="mt-1 text-xs font-semibold text-[#dde2f7] truncate"
            title={cohortName}
          >
            {cohortName}
          </div>

          <div className="mt-1 text-[10px] font-mono text-[#8d90a0]">
            {targetPeerProfile?.sector || 'No sector profile'} ·{' '}
            {targetPeerProfile?.criticalityTier ||
              'No criticality profile'}
          </div>

          <div className="mt-1 text-[9px] font-mono text-[#596174]">
            {cohortId}
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[9px] uppercase font-mono text-[#8d90a0] block">
            Cohort Sample Size
          </span>

          <div className="mt-1 text-sm font-semibold flex items-center gap-2">
            <span
              className={
                benchmarkResult.sampleSize >=
                benchmarkResult.minimumPeerSampleSize
                  ? 'text-[#10b981]'
                  : 'text-[#f59e0b]'
              }
            >
              {benchmarkResult.sampleSize} Valid Peers
            </span>

            <span className="text-[10px] font-mono text-[#8d90a0]">
              (min {benchmarkResult.minimumPeerSampleSize})
            </span>
          </div>

          <div className="mt-1 text-[10px] text-[#8d90a0]">
            {benchmarkResult.excludedSubmissions.length} candidate(s)
            excluded by gates
          </div>
        </div>

        <div className="p-3.5 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[9px] uppercase font-mono text-[#8d90a0] block">
            Baseline Status
          </span>

          <div className="mt-1 flex items-center justify-between">
            {getStatusBadge(
              benchmarkResult.overallStatus === 'EVALUATED'
                ? peerDeviationsCount > 0
                  ? 'PEER_DEVIATION'
                  : 'WITHIN_PEER_RANGE'
                : benchmarkResult.overallStatus
            )}

            {sourceMode !== 'LOCAL_VAULT' && (
              <span className="text-[9px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 px-1 rounded border border-[#f59e0b]/20">
                SYNTHETIC
              </span>
            )}
          </div>

          <div className="mt-1 text-[10px] font-mono text-[#8d90a0]">
            {peerDeviationsCount > 0 ? (
              <span className="text-[#f87171]">
                {peerDeviationsCount} potential deviation(s)
              </span>
            ) : benchmarkResult.overallStatus === 'EVALUATED' ? (
              <span className="text-[#34d399]">
                No configured peer deviations
              </span>
            ) : (
              <span>Baseline pending</span>
            )}
          </div>
        </div>
      </div>

      {sourceMode !== 'LOCAL_VAULT' && (
        <div className="p-3 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#fbbf24] text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />

          <div className="space-y-0.5">
            <div className="font-semibold font-mono text-[11px]">
              SYNTHETIC DEMONSTRATION DATA ACTIVE
            </div>

            <p className="text-[11px] leading-relaxed text-[#fde68a]">
              You are currently viewing deterministic synthetic demonstration
              peers created to validate the supervisory peer engine. This data
              is isolated from actual regulatory records and is not a live
              operational dataset.
            </p>
          </div>
        </div>
      )}

      {benchmarkResult.overallStatus === 'NO_BASELINE' ? (
        <div className="p-8 rounded bg-[#090D16] border border-[#1E293B] text-center space-y-3">
          <FileQuestion className="w-10 h-10 mx-auto text-[#4cd7f6]" />

          <h3 className="text-sm font-semibold text-[#dde2f7]">
            No sufficient comparable peer submissions available
          </h3>

          <p className="text-xs text-[#8d90a0] max-w-lg mx-auto leading-relaxed">
            The available submission set does not contain enough candidates
            that match the target peer profile and pass the engine's quality
            gates.
          </p>

          {!targetPeerProfile && (
            <p className="text-[11px] text-[#fbbf24] max-w-lg mx-auto">
              No registered peer profile is available for this target entity,
              so peer-group membership cannot be established from the current
              profile registry.
            </p>
          )}

          <div className="pt-2">
            <button
              onClick={() => setSourceMode('SYNTHETIC_DEMO')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] text-xs font-mono hover:bg-[#4cd7f6]/20 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Evaluate with Synthetic Demonstration Cohort
            </button>
          </div>
        </div>
      ) : benchmarkResult.overallStatus === 'INCONCLUSIVE' ? (
        <div className="p-6 rounded bg-[#090D16] border border-[#f59e0b]/30 space-y-3">
          <div className="flex items-center gap-2 text-[#fbbf24] font-mono text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            INSUFFICIENT COHORT SAMPLE SIZE (N=
            {benchmarkResult.sampleSize})
          </div>

          <p className="text-xs text-[#dde2f7] leading-relaxed">
            The engine requires at least{' '}
            <strong>
              {benchmarkResult.minimumPeerSampleSize} valid peers
            </strong>{' '}
            before it produces a peer baseline. With only{' '}
            {benchmarkResult.sampleSize} valid peer submission(s), the result
            remains inconclusive.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSourceMode('SYNTHETIC_DEMO')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] text-xs font-mono hover:bg-[#4cd7f6]/20"
            >
              Switch to Full Synthetic Demonstration Cohort
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span>
              Deterministic comparison of{' '}
              <strong className="text-[#dde2f7]">
                {targetSubmission.entityCode}
              </strong>{' '}
              against cohort median ({benchmarkResult.sampleSize} peers):
            </span>

            <span className="font-mono text-[10px]">
              Deviation Thresholds: ±15 pp / 1.50× duration
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-[#1E293B]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#090D16] border-b border-[#1E293B]">
                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0]">
                    SUPERVISORY METRIC
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0] text-right">
                    TARGET ({targetSubmission.entityCode})
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0] text-right">
                    PEER MEDIAN
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0] text-right">
                    COHORT RANGE
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0]">
                    STATUS
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0] text-right">
                    DEVIATION
                  </th>

                  <th className="py-2.5 px-3 font-mono text-[10px] text-[#8d90a0] text-center">
                    SUPERVISORY ACTION
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]/60 text-xs">
                {metricsList.map((metric) => {
                  const isExpanded =
                    expandedMetric === metric.metricCode;

                  const isFlagged =
                    Boolean(flaggedSignals[metric.metricCode]);

                  const formattedTarget =
                    metric.metricType === 'PERCENTAGE'
                      ? formatPercent(metric.targetValue)
                      : formatSeconds(metric.targetValue);

                  const formattedMedian =
                    metric.metricType === 'PERCENTAGE'
                      ? formatPercent(metric.peerBaseline?.median)
                      : formatSeconds(metric.peerBaseline?.median);

                  const formattedRange =
                    metric.peerBaseline?.min !== null &&
                    metric.peerBaseline?.min !== undefined &&
                    metric.peerBaseline?.max !== null &&
                    metric.peerBaseline?.max !== undefined
                      ? metric.metricType === 'PERCENTAGE'
                        ? `${metric.peerBaseline.min.toFixed(
                            0
                          )}% – ${metric.peerBaseline.max.toFixed(0)}%`
                        : `${formatSeconds(
                            metric.peerBaseline.min
                          )} – ${formatSeconds(metric.peerBaseline.max)}`
                      : '—';

                  const deltaDisplay =
                    metric.metricType === 'PERCENTAGE'
                      ? metric.deviationPercentagePoints !== null &&
                        metric.deviationPercentagePoints !== undefined
                        ? `${
                            metric.deviationPercentagePoints > 0
                              ? '+'
                              : ''
                          }${metric.deviationPercentagePoints.toFixed(1)} pp`
                        : '—'
                      : metric.deviationRatio !== null &&
                        metric.deviationRatio !== undefined
                        ? `${metric.deviationRatio.toFixed(2)}×`
                        : '—';

                  return (
                    <React.Fragment key={metric.metricCode}>
                      <tr
                        className={`transition-colors hover:bg-[#090D16]/50 ${
                          metric.status === 'PEER_DEVIATION'
                            ? 'bg-[#ef4444]/5'
                            : isFlagged
                              ? 'bg-[#4cd7f6]/5'
                              : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            onClick={() =>
                              setExpandedMetric(
                                isExpanded
                                  ? null
                                  : metric.metricCode
                              )
                            }
                            className="text-left group flex items-start gap-1.5"
                          >
                            <span className="text-[#4cd7f6] mt-0.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </span>

                            <div>
                              <div className="font-semibold text-[#dde2f7] group-hover:text-[#4cd7f6] transition-colors">
                                {metric.metricName}
                              </div>

                              <div className="text-[10px] font-mono text-[#8d90a0]">
                                {metric.metricCode}
                              </div>
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-3 font-mono text-right text-[#dde2f7] font-semibold">
                          {formattedTarget}
                        </td>

                        <td className="py-3 px-3 font-mono text-right text-[#8d90a0]">
                          {formattedMedian}
                        </td>

                        <td className="py-3 px-3 font-mono text-right text-[#8d90a0] text-[11px]">
                          {formattedRange}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(metric.status)}
                        </td>

                        <td
                          className={`py-3 px-3 font-mono text-right font-semibold whitespace-nowrap ${
                            metric.status === 'PEER_DEVIATION'
                              ? 'text-[#f87171]'
                              : metric.status ===
                                  'WITHIN_PEER_RANGE'
                                ? 'text-[#34d399]'
                                : 'text-[#8d90a0]'
                          }`}
                        >
                          {deltaDisplay}
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleFlagSignal(metric)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                              isFlagged
                                ? 'bg-[#4cd7f6] text-[#090D16] font-bold'
                                : metric.status ===
                                    'PEER_DEVIATION'
                                  ? 'bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30 hover:bg-[#ef4444]/25'
                                  : 'bg-[#1E293B] text-[#8d90a0] hover:text-[#dde2f7]'
                            }`}
                            title="Add this metric to the current review context"
                          >
                            <BookmarkCheck className="w-3 h-3" />

                            {isFlagged
                              ? 'FLAGGED'
                              : 'FLAG SIGNAL'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#090D16]/80 border-b border-[#1E293B]">
                          <td colSpan={7} className="p-4 space-y-2">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-[#4cd7f6] shrink-0 mt-0.5" />

                              <div className="space-y-1">
                                <span className="text-[10px] font-mono uppercase text-[#4cd7f6] font-semibold">
                                  Supervisory Interpretation &
                                  Context
                                </span>

                                <p className="text-xs text-[#dde2f7] leading-relaxed">
                                  {
                                    metric.supervisoryInterpretation
                                  }
                                </p>

                                <p className="text-[11px] text-[#8d90a0] leading-relaxed italic pt-1">
                                  Use the peer deviation as a prompt
                                  for supervisory dialogue and review
                                  the supporting operational evidence.
                                  Do not treat peer deviation alone as
                                  a compliance determination.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {Object.keys(flaggedSignals).length > 0 && (
        <div className="p-4 rounded bg-[#090D16] border border-[#4cd7f6]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#4cd7f6] font-semibold">
              <BookmarkCheck className="w-4 h-4" />
              SUPERVISORY SIGNALS IN CURRENT REVIEW CONTEXT (
              {Object.keys(flaggedSignals).length})
            </div>

            <span className="text-[10px] font-mono text-[#8d90a0]">
              CURRENT REVIEW CONTEXT · NOT PERSISTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(
              Object.values(flaggedSignals) as PeerBenchmarkSignal[]
            ).map((signal) => (
              <div
                key={signal.signalId}
                className="p-2.5 rounded bg-[#131B2E] border border-[#1E293B] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#4cd7f6] text-[11px] font-semibold">
                    {signal.metricName}
                  </span>

                  <span className="font-mono text-[9px] text-[#8d90a0]">
                    {signal.signalId}
                  </span>
                </div>

                <div className="text-[11px] text-[#dde2f7]">
                  Deviation:{' '}
                  <strong className="text-[#f87171]">
                    {signal.deviationDelta}
                  </strong>{' '}
                  relative to cohort median
                </div>

                <div className="text-[10px] text-[#8d90a0] line-clamp-2">
                  {signal.supervisoryInterpretation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-[#1E293B]">
        <button
          onClick={() => setShowExclusions(!showExclusions)}
          className="flex items-center justify-between w-full text-xs text-[#8d90a0] hover:text-[#dde2f7] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#4cd7f6]" />

            <span>
              Data Quality Gate Review (
              {benchmarkResult.excludedSubmissions.length}{' '}
              Excluded Submissions)
            </span>
          </div>

          <span className="text-[#4cd7f6]">
            {showExclusions ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {showExclusions && (
          <div className="mt-3 p-4 rounded bg-[#090D16] border border-[#1E293B] space-y-3">
            <p className="text-xs text-[#8d90a0] leading-relaxed">
              Candidates are checked for peer-group membership, submission
              quality, identifier integrity, and self-exclusion before they
              can contribute to the baseline.
            </p>

            {benchmarkResult.excludedSubmissions.length === 0 ? (
              <div className="text-xs text-[#10b981] font-mono">
                No submissions were excluded during this evaluation.
              </div>
            ) : (
              <div className="space-y-2">
                {benchmarkResult.excludedSubmissions.map(
                  (exclusion, index) => (
                    <div
                      key={`${exclusion.submissionId}-${index}`}
                      className="p-2.5 rounded bg-[#131B2E] border border-[#ef4444]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#ef4444] text-[11px] font-semibold">
                            {exclusion.gateCheck}
                          </span>

                          <span className="font-mono text-[#dde2f7] text-[10px]">
                            {exclusion.entityCode ||
                              'UNIDENTIFIED'}{' '}
                            (
                            {exclusion.submissionId ||
                              'No ID'}
                            )
                          </span>
                        </div>

                        <p className="text-[11px] text-[#8d90a0] mt-0.5">
                          {exclusion.reason}
                        </p>
                      </div>

                      <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-mono bg-[#ef4444]/10 text-[#f87171] border border-[#ef4444]/20">
                        EXCLUDED FROM BASELINE
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="text-[10px] font-mono text-[#596174] pt-1">
              QUALITY GATES ENFORCED: PEER GROUP · VALIDITY STATUS ·
              COMPLETENESS &gt;= 40% · MINIMUM RECORDS &gt;= 1 ·
              IDENTIFIER INTEGRITY · SELF-EXCLUSION
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-[#596174] pt-2 border-t border-[#1E293B]/60">
        <span>
          PEER ENGINE: DETERMINISTIC MEDIAN BASELINES · NO CLOUD/BLACK-BOX
          LLM SCORING
        </span>

        <span>HUMAN SUPERVISOR REVIEW REMAINS REQUIRED</span>
      </div>
    </section>
  );
};