import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

import { submissionRepository } from '../repositories/submissionRepository';
import { normalizedRecordRepository } from '../repositories/normalizedRecordRepository';
import { dataQualityRepository } from '../repositories/dataQualityRepository';

import { calculateExecutionGap } from '../services/analytics/executionGapEngine';
import { calculateNegativeSpace } from '../services/analytics/negativeSpaceEngine';
import { calculateTemporalAnalytics } from '../services/analytics/temporalAnalyticsEngine';
import { PeerBenchmarkingSection } from '../components/assessments/PeerBenchmarkingSection';

import {
  CSESubmission,
  DataQualityReport,
  NormalizedCaseRecord
} from '../types';

type AnalyticsState = {
  submission: CSESubmission | null;
  records: NormalizedCaseRecord[];
  qualityReport: DataQualityReport | null;
  allSubmissions: CSESubmission[];
  allRecords: NormalizedCaseRecord[];
};

const formatPercent = (value: number) =>
  `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const formatDuration = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds)) return '—';

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const statusClass = (status: string) => {
  switch (status) {
    case 'TIMING_DEVIATION':
      return 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20';
    case 'DATA_QUALITY_LIMITED':
      return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
    case 'INCONCLUSIVE':
      return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
    case 'NORMAL':
      return 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20';
    default:
      return 'text-[#8d90a0] bg-[#8d90a0]/10 border-[#8d90a0]/20';
  }
};

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsState>({
    submission: null,
    records: [],
    qualityReport: null,
    allSubmissions: [],
    allRecords: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setError(null);

      const submissions = await submissionRepository.getAll();

      if (submissions.length === 0) {
        setData({
          submission: null,
          records: [],
          qualityReport: null,
          allSubmissions: [],
          allRecords: []
        });
        return;
      }

      const latestSubmission = submissions.reduce((latest, current) => {
        const latestTime = new Date(latest.importedAt ?? '').getTime();
        const currentTime = new Date(current.importedAt ?? '').getTime();

        if (!Number.isFinite(latestTime)) return current;
        if (!Number.isFinite(currentTime)) return latest;

        return currentTime > latestTime ? current : latest;
      }, submissions[0]);

      const [records, qualityReport, allRecords] = await Promise.all([
        normalizedRecordRepository.getBySubmissionId(
          latestSubmission.submissionId
        ),
        dataQualityRepository.getBySubmissionId(
          latestSubmission.submissionId
        ),
        normalizedRecordRepository.getAll()
      ]);

      setData({
        submission: latestSubmission,
        records,
        qualityReport: qualityReport ?? null,
        allSubmissions: submissions,
        allRecords
      });
    } catch (err) {
      console.error('Failed to load supervisory analytics:', err);
      setError(
        'Analytics could not be loaded from the local assessment store.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const executionGap = useMemo(() => {
    if (!data.submission) return null;

    return calculateExecutionGap(
      data.records,
      data.submission,
      data.qualityReport
    );
  }, [data]);

  const negativeSpace = useMemo(() => {
    if (!data.submission) return null;

    return calculateNegativeSpace(
      data.records,
      data.submission,
      data.qualityReport
    );
  }, [data]);

  const temporal = useMemo(() => {
    if (!data.submission) return null;

    return calculateTemporalAnalytics(
      data.records,
      data.submission,
      data.qualityReport
    );
  }, [data]);

  const temporalDeviations = useMemo(() => {
    if (!temporal) return [];

    return (temporal.caseEvaluations ?? [])
      .filter(evaluation => evaluation.classification === 'TIMING_DEVIATION')
      .slice(0, 8);
  }, [temporal]);

  const latestEvaluationTime = useMemo(() => {
    const values = [
      executionGap?.summary?.evaluatedAt,
      negativeSpace?.evaluatedAt,
      temporal?.summary.evaluatedAt
    ].filter(Boolean) as string[];

    if (values.length === 0) return null;

    return values
      .map(value => new Date(value).getTime())
      .sort((a, b) => b - a)[0];
  }, [executionGap, negativeSpace, temporal]);

  if (loading) {
    return (
      <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10">
        <div className="min-h-[420px] flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#8d90a0] font-mono text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-[#4cd7f6]" />
            LOADING LOCAL ANALYTICS DATA...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10">
        <div className="p-5 rounded bg-[#131B2E] border border-[#ef4444]/30">
          <div className="flex items-center gap-2 text-[#ef4444] font-mono text-xs">
            <AlertTriangle className="w-4 h-4" />
            ANALYTICS LOAD ERROR
          </div>
          <p className="text-sm text-[#dde2f7] mt-3">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded border border-[#1E293B] bg-[#090D16] text-xs font-mono text-[#4cd7f6] hover:bg-[#131B2E]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (!data.submission) {
    return (
      <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
          <BrainCircuit className="w-3.5 h-3.5" />
          SUPERVISORY REASONING & ANALYTICAL MODELS
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
          Supervisory Analytics
        </h1>

        <div className="mt-6 p-8 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <Database className="w-8 h-8 mx-auto text-[#4cd7f6]" />
          <h2 className="mt-4 text-sm font-semibold text-[#dde2f7]">
            No assessment submission available
          </h2>
          <p className="mt-2 max-w-md mx-auto text-xs leading-relaxed text-[#8d90a0]">
            Load a CSE assessment submission from the Assessments page before
            running supervisory analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            SUPERVISORY REASONING & ANALYTICAL MODELS
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Supervisory Analytics
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1">
            Deterministic analysis of the latest locally stored CSE
            assessment submission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] font-mono text-[10px] text-[#8d90a0]">
            {data.submission.entityCode}
          </div>

          <div className="px-2.5 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] font-mono text-[10px] text-[#4cd7f6]">
            {data.submission.assessmentPeriod}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] font-mono text-[10px] text-[#dde2f7] hover:border-[#4cd7f6]/40 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            REFRESH
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Database className="w-4 h-4" />}
          label="Cases Evaluated"
          value={data.records.length.toString()}
          detail={`Submission ${data.submission.submissionId}`}
        />

        <MetricCard
          icon={<ShieldAlert className="w-4 h-4" />}
          label="Execution Gap"
          value={
            executionGap
              ? formatPercent(executionGap.summary.gapRate)
              : '—'
          }
          detail={
            executionGap
              ? `${executionGap.summary.gapCount} potential gaps / ${executionGap.summary.applicableCaseCount} applicable`
              : 'Not evaluated'
          }
          accent={
            executionGap && executionGap.summary.gapCount > 0
              ? 'danger'
              : 'normal'
          }
        />

        <MetricCard
          icon={<FileWarning className="w-4 h-4" />}
          label="Negative Space"
          value={
            negativeSpace
              ? formatPercent(negativeSpace.absenceRate)
              : '—'
          }
          detail={
            negativeSpace
              ? `${negativeSpace.absentEvidenceCount} absent / ${negativeSpace.expectedEvidenceCount} valid`
              : 'Not evaluated'
          }
          accent={
            negativeSpace && negativeSpace.absentEvidenceCount > 0
              ? 'warning'
              : 'normal'
          }
        />

        <MetricCard
          icon={<Clock3 className="w-4 h-4" />}
          label="Timing Deviations"
          value={
            temporal
              ? temporal.summary.timingDeviationCount.toString()
              : '—'
          }
          detail={
            temporal
              ? `${formatPercent(temporal.summary.deviationRate)} of valid timing cases`
              : 'Not evaluated'
          }
          accent={
            temporal && temporal.summary.timingDeviationCount > 0
              ? 'danger'
              : 'normal'
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <EngineCard
          code="RULE-ESC-04"
          title="Execution Gap"
          icon={<ShieldAlert className="w-4 h-4" />}
          description="Checks applicable critical cases for missing escalation evidence while respecting source data quality."
          status={
            executionGap
              ? executionGap.summary.gapCount > 0
                ? 'ATTENTION'
                : 'NO GAP OBSERVED'
              : 'NOT EVALUATED'
          }
        >
          {executionGap ? (
            <div className="space-y-3">
              <DataRow
                label="Applicable critical cases"
                value={executionGap.summary.applicableCaseCount}
              />
              <DataRow
                label="Observed escalations"
                value={executionGap.summary.observedCount}
              />
              <DataRow
                label="Potential execution gaps"
                value={executionGap.summary.gapCount}
              />
              <DataRow
                label="Gap rate"
                value={formatPercent(executionGap.summary.gapRate)}
              />
              {(executionGap.summary.warnings ?? []).length > 0 && (
                <Notice
                  text={(executionGap.summary.warnings ?? [])[0]}
                  type="warning"
                />
              )}
            </div>
          ) : (
            <EmptyEngineState />
          )}
        </EngineCard>

        <EngineCard
          code="RULE-NS-ESC-01"
          title="Negative Space"
          icon={<FileWarning className="w-4 h-4" />}
          description="Checks whether expected escalation evidence is absent from the submitted observation set."
          status={
            negativeSpace
              ? negativeSpace.absentEvidenceCount > 0
                ? 'ATTENTION'
                : 'NO BLIND SPOT OBSERVED'
              : 'NOT EVALUATED'
          }
        >
          {negativeSpace ? (
            <div className="space-y-3">
              <DataRow
                label="Valid applicable cases"
                value={negativeSpace.applicableCaseCount}
              />
              <DataRow
                label="Evidence present"
                value={negativeSpace.evidencePresentCount}
              />
              <DataRow
                label="Evidence absent"
                value={negativeSpace.absentEvidenceCount}
              />
              <DataRow
                label="Excluded / limited"
                value={
                  negativeSpace.dataQualityLimitedCount +
                  negativeSpace.inconclusiveCount
                }
              />
              <DataRow
                label="Absence rate"
                value={formatPercent(negativeSpace.absenceRate)}
              />
              {(negativeSpace.warnings ?? []).length > 0 && (
                <Notice
                  text={(negativeSpace.warnings ?? [])[0]}
                  type="warning"
                />
              )}
            </div>
          ) : (
            <EmptyEngineState />
          )}
        </EngineCard>

        <EngineCard
          code="RULE-TEMP-01"
          title="Behavioural / Temporal"
          icon={<Clock3 className="w-4 h-4" />}
          description="Compares operational timing against a deterministic CRITICAL/HIGH baseline using median and MAD."
          status={
            temporal
              ? temporal.summary.timingDeviationCount > 0
                ? 'ATTENTION'
                : 'NO DEVIATION OBSERVED'
              : 'NOT EVALUATED'
          }
        >
          {temporal ? (
            <div className="space-y-3">
              <DataRow
                label="Applicable cases"
                value={temporal.summary.applicableCaseCount}
              />
              <DataRow
                label="Timing deviations"
                value={temporal.summary.timingDeviationCount}
              />
              <DataRow
                label="Normal"
                value={temporal.summary.normalCaseCount}
              />
              <DataRow
                label="DQ limited"
                value={temporal.summary.dataQualityLimitedCount}
              />
              <DataRow
                label="Inconclusive"
                value={temporal.summary.inconclusiveCount}
              />
            </div>
          ) : (
            <EmptyEngineState />
          )}
        </EngineCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="p-5 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4cd7f6]" />
                <h2 className="text-sm font-semibold text-[#dde2f7]">
                  Temporal Evaluation
                </h2>
              </div>
              <p className="text-[11px] text-[#8d90a0] mt-1">
                Case-level timing classifications from the deterministic
                temporal engine.
              </p>
            </div>

            {temporal && (
              <span className="font-mono text-[10px] text-[#8d90a0]">
                Baseline records: {temporal.summary.baselineRecordCount}
              </span>
            )}
          </div>

          {!temporal ? (
            <div className="py-8">
              <EmptyEngineState />
            </div>
          ) : temporalDeviations.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-7 h-7 mx-auto text-[#10b981]" />
              <p className="text-xs text-[#dde2f7] mt-3">
                No timing deviations were classified in the current
                submission.
              </p>
              <p className="text-[10px] text-[#8d90a0] mt-1">
                This is an analytical result, not a certification of
                operational compliance.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    <th className="py-2 pr-3 font-mono text-[10px] text-[#8d90a0]">
                      CASE
                    </th>
                    <th className="py-2 px-3 font-mono text-[10px] text-[#8d90a0]">
                      METRIC
                    </th>
                    <th className="py-2 px-3 font-mono text-[10px] text-[#8d90a0]">
                      OBSERVED
                    </th>
                    <th className="py-2 pl-3 font-mono text-[10px] text-[#8d90a0]">
                      BASELINE
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {temporalDeviations.map(evaluation => {
                    const observation =
                      (temporal.caseEvaluations ?? []).find(
                        item => item.caseId === evaluation.caseId
                      );

                    const metric =
                      evaluation.deviationMetric;

                    const observedSeconds =
                      metric === 'TRIAGE_DURATION'
                        ? evaluation.triageDurationSeconds
                        : metric === 'ESCALATION_DELAY'
                          ? evaluation.escalationDelaySeconds
                          : metric === 'SUPERVISOR_REVIEW_DELAY'
                            ? evaluation.supervisorReviewDelaySeconds
                            : evaluation.closureElapsedSeconds;

                    const baselineMetric =
                      (temporal.baseline.metrics ?? []).find(
                        item => item.metricType === metric
                      );

                    return (
                      <tr
                        key={`${evaluation.caseId}-${metric}`}
                        className="border-b border-[#1E293B]/70"
                      >
                        <td className="py-3 pr-3 font-mono text-[10px] text-[#4cd7f6]">
                          {evaluation.caseId}
                        </td>

                        <td className="py-3 px-3 text-[10px] text-[#dde2f7]">
                          {metric?.replaceAll('_', ' ') || '—'}
                        </td>

                        <td className="py-3 px-3 font-mono text-[10px] text-[#ef4444]">
                          {formatDuration(observedSeconds)}
                        </td>

                        <td className="py-3 pl-3 font-mono text-[10px] text-[#8d90a0]">
                          {formatDuration(
                            baselineMetric?.medianSeconds ?? null
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(temporal?.summary?.warnings ?? []).length ? (
            <div className="mt-4 space-y-2">
              {(temporal.summary.warnings ?? []).slice(0, 3).map((warning, index) => (
                <Notice key={index} text={warning} type="warning" />
              ))}
            </div>
          ) : null}
        </section>

        <section className="p-5 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E293B]">
            <BarChart3 className="w-4 h-4 text-[#4cd7f6]" />
            <div>
              <h2 className="text-sm font-semibold text-[#dde2f7]">
                Data Quality & Evidence Context
              </h2>
              <p className="text-[11px] text-[#8d90a0] mt-1">
                Source conditions that affect interpretation of analytical
                results.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <DataRow
              label="Submission status"
              value={data.submission.dataQualityStatus}
            />

            <DataRow
              label="Completeness"
              value={`${data.submission.completenessPercentage}%`}
            />

            <DataRow
              label="Imported records"
              value={data.submission.recordCount}
            />

            <DataRow
              label="Normalized records"
              value={data.records.length}
            />

            <DataRow
              label="Quality issues"
              value={data.qualityReport?.issues.length ?? 0}
            />

            <DataRow
              label="Baseline available"
              value={
                temporal?.baseline.baselineRecordCount ?? 0
              }
            />

            {(data.qualityReport?.issues ?? [])
              .filter(issue => issue.severity === 'ERROR')
              .slice(0, 3)
              .map((issue, index) => (
                <Notice
                  key={`${issue.code}-${issue.caseId ?? index}`}
                  text={
                    issue.caseId
                      ? `${issue.caseId}: ${issue.message}`
                      : issue.message
                  }
                  type="error"
                />
              ))}

            {(data.qualityReport?.issues ?? [])
              .filter(issue => issue.severity === 'WARNING')
              .slice(0, 3)
              .map((issue, index) => (
                <Notice
                  key={`${issue.code}-${issue.caseId ?? index}`}
                  text={
                    issue.caseId
                      ? `${issue.caseId}: ${issue.message}`
                      : issue.message
                  }
                  type="warning"
                />
              ))}
          </div>
        </section>
      </div>

      <section className="p-5 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E293B]">
          <div>
            <h2 className="text-sm font-semibold text-[#dde2f7]">
              Temporal Case Classifications
            </h2>
            <p className="text-[11px] text-[#8d90a0] mt-1">
              The engine keeps normal, limited and inconclusive cases visible
              so missing evidence is not silently converted into a positive
              finding.
            </p>
          </div>

          {latestEvaluationTime && (
            <span className="font-mono text-[10px] text-[#8d90a0]">
              Evaluated {new Date(latestEvaluationTime).toLocaleString()}
            </span>
          )}
        </div>

        {temporal ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {(temporal.caseEvaluations ?? []).map(evaluation => (
              <div
                key={evaluation.caseId}
                className="p-3 rounded bg-[#090D16] border border-[#1E293B]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#4cd7f6]">
                    {evaluation.caseId}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded border font-mono text-[9px] ${statusClass(
                      evaluation.classification
                    )}`}
                  >
                    {evaluation.classification}
                  </span>
                </div>

                <div className="mt-2 text-[10px] text-[#8d90a0] leading-relaxed">
                  {evaluation.reason}
                </div>

                {evaluation.deviationMetric && (
                  <div className="mt-2 font-mono text-[9px] text-[#ef4444]">
                    {evaluation.deviationMetric.replaceAll('_', ' ')}
                    {evaluation.deviationRatio !== null
                      ? ` · ${evaluation.deviationRatio.toFixed(2)}×`
                      : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8">
            <EmptyEngineState />
          </div>
        )}
      </section>

      {/* PHASE 2: Peer Benchmarking & Supervisory Comparison */}
      <PeerBenchmarkingSection
        targetSubmission={data.submission}
        targetRecords={data.records}
        storedSubmissions={data.allSubmissions}
        allStoredRecords={data.allRecords}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[10px] font-mono text-[#596174]">
        <span>
          ANALYTICS SOURCE: LOCAL INDEXEDDB / DETERMINISTIC RULE ENGINES
        </span>

        <span>
          NO CLOUD MODEL REQUIRED FOR THESE CALCULATIONS
        </span>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent?: 'normal' | 'warning' | 'danger';
}> = ({ icon, label, value, detail, accent = 'normal' }) => {
  const valueClass =
    accent === 'danger'
      ? 'text-[#ef4444]'
      : accent === 'warning'
        ? 'text-[#f59e0b]'
        : 'text-[#dde2f7]';

  return (
    <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
      <div className="flex items-center gap-2 text-[#4cd7f6]">
        {icon}
        <span className="font-mono text-[10px]">{label}</span>
      </div>

      <div className={`mt-3 text-2xl font-semibold ${valueClass}`}>
        {value}
      </div>

      <div className="mt-1 text-[10px] font-mono text-[#8d90a0] truncate">
        {detail}
      </div>
    </div>
  );
};

const EngineCard: React.FC<{
  code: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: string;
  children: React.ReactNode;
}> = ({ code, title, description, icon, status, children }) => (
  <section className="p-5 rounded bg-[#131B2E] border border-[#1E293B]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#4cd7f6] font-semibold">
            {code}
          </span>

          {icon}
        </div>

        <h2 className="text-sm font-semibold text-[#dde2f7] mt-2">
          {title}
        </h2>

        <p className="text-[10px] text-[#8d90a0] leading-relaxed mt-1">
          {description}
        </p>
      </div>

      <span
        className={`shrink-0 px-1.5 py-0.5 rounded border font-mono text-[9px] ${
          status === 'ATTENTION'
            ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
            : status.includes('NO ')
              ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20'
              : 'text-[#8d90a0] bg-[#8d90a0]/10 border-[#8d90a0]/20'
        }`}
      >
        {status}
      </span>
    </div>

    <div className="mt-4 pt-4 border-t border-[#1E293B]">
      {children}
    </div>
  </section>
);

const DataRow: React.FC<{
  label: string;
  value: string | number;
}> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[10px] text-[#8d90a0]">{label}</span>
    <span className="font-mono text-[10px] text-[#dde2f7] text-right">
      {value}
    </span>
  </div>
);

const Notice: React.FC<{
  text: string;
  type: 'warning' | 'error';
}> = ({ text, type }) => (
  <div
    className={`p-2.5 rounded border text-[10px] leading-relaxed ${
      type === 'error'
        ? 'border-[#ef4444]/20 bg-[#ef4444]/5 text-[#fca5a5]'
        : 'border-[#f59e0b]/20 bg-[#f59e0b]/5 text-[#fbbf24]'
    }`}
  >
    {text}
  </div>
);

const EmptyEngineState: React.FC = () => (
  <div className="text-[10px] text-[#8d90a0]">
    No evaluable data is available for this engine.
  </div>
);