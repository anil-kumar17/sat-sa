import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Database,
  FileCheck2,
  FolderGit2,
  Search,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

import {
  submissionRepository,
  normalizedRecordRepository,
  dataQualityRepository,
  findingsRepository
} from '../repositories';

import {
  CSESubmission,
  NormalizedCaseRecord,
  DataQualityReport,
  Finding
} from '../types';

interface PortfolioEntity {
  entityCode: string;
  entityId: string;
  assessmentPeriods: string[];
  submissionCount: number;
  recordCount: number;
  criticalCount: number;
  highCount: number;
  findingCount: number;
  openFindingCount: number;
  dataQualityLimitedCount: number;
  completenessValues: number[];
  latestSubmissionDate: string | null;
  latestSubmissionId: string | null;
  latestAssessmentPeriod: string | null;
  latestSubmissionRecordCount: number;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const formatPeriod = (period: string): string => {
  if (!period || period === 'UNKNOWN_PERIOD') {
    return 'Unknown period';
  }

  return period;
};

const getCompletenessClass = (value: number | null): string => {
  if (value === null) {
    return 'text-[#8d90a0]';
  }

  if (value < 40) {
    return 'text-[#ef4444]';
  }

  if (value < 80) {
    return 'text-[#f59e0b]';
  }

  return 'text-[#10b981]';
};

const getSubmissionTimestamp = (submission: CSESubmission): string | null => {
  const candidate =
    (submission as CSESubmission & {
      createdAt?: string;
      ingestedAt?: string;
      submittedAt?: string;
    }).createdAt ||
    (submission as CSESubmission & {
      createdAt?: string;
      ingestedAt?: string;
      submittedAt?: string;
    }).ingestedAt ||
    (submission as CSESubmission & {
      createdAt?: string;
      ingestedAt?: string;
      submittedAt?: string;
    }).submittedAt;

  return candidate || null;
};

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<CSESubmission[]>([]);
  const [records, setRecords] = useState<NormalizedCaseRecord[]>([]);
  const [qualityReports, setQualityReports] = useState<DataQualityReport[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedSubmissions = await submissionRepository.getAll();

        const [
          storedRecords,
          storedQualityReports,
          storedFindings
        ] = await Promise.all([
          normalizedRecordRepository.getAll(),
          Promise.all(
            storedSubmissions.map((submission) =>
              dataQualityRepository.getBySubmissionId(
                submission.submissionId
              )
            )
          ),
          findingsRepository.getAll()
        ]);

        if (!mounted) return;

        setSubmissions(storedSubmissions);
        setRecords(storedRecords);
        setQualityReports(
          storedQualityReports.filter(
            (report): report is DataQualityReport => Boolean(report)
          )
        );
        setFindings(storedFindings);
      } catch (err) {
        console.error('Failed to load portfolio:', err);

        if (mounted) {
          setError(
            'The local evidence vault could not be loaded. Refresh and try again.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPortfolio();

    return () => {
      mounted = false;
    };
  }, []);

  const entityData = useMemo<PortfolioEntity[]>(() => {
    const entities = new Map<string, PortfolioEntity>();

    const getOrCreateEntity = (
      entityCode: string,
      entityId: string
    ): PortfolioEntity => {
      const key = entityCode || entityId;

      const existing = entities.get(key);

      if (existing) {
        return existing;
      }

      const created: PortfolioEntity = {
        entityCode: entityCode || 'UNKNOWN',
        entityId: entityId || 'UNKNOWN',
        assessmentPeriods: [],
        submissionCount: 0,
        recordCount: 0,
        criticalCount: 0,
        highCount: 0,
        findingCount: 0,
        openFindingCount: 0,
        dataQualityLimitedCount: 0,
        completenessValues: [],
        latestSubmissionDate: null,
        latestSubmissionId: null,
        latestAssessmentPeriod: null,
        latestSubmissionRecordCount: 0
      };

      entities.set(key, created);

      return created;
    };

    for (const submission of submissions) {
      const submissionRecords = records.filter(
        (record) => record.submissionId === submission.submissionId
      );

      const submissionEntities = new Set<string>();

      for (const record of submissionRecords) {
        const entity = getOrCreateEntity(
          record.entityCode,
          record.entityId
        );

        const entityKey = record.entityCode || record.entityId;

        if (!submissionEntities.has(entityKey)) {
          entity.submissionCount += 1;
          submissionEntities.add(entityKey);
        }

        entity.recordCount += 1;

        if (record.severity === 'CRITICAL') {
          entity.criticalCount += 1;
        }

        if (record.severity === 'HIGH') {
          entity.highCount += 1;
        }

        if (
          record.evidencePresence?.escalationEvidence ===
          'INCOMPLETE_SUBMISSION'
        ) {
          entity.dataQualityLimitedCount += 1;
        }

        if (
          submission.assessmentPeriod &&
          !entity.assessmentPeriods.includes(
            submission.assessmentPeriod
          )
        ) {
          entity.assessmentPeriods.push(
            submission.assessmentPeriod
          );
        }

        const submissionTimestamp = getSubmissionTimestamp(submission);
        const currentLatestTimestamp = entity.latestSubmissionDate;

        const shouldUseSubmission =
          !entity.latestSubmissionId ||
          Boolean(
            submissionTimestamp &&
              (!currentLatestTimestamp ||
                new Date(submissionTimestamp).getTime() >
                  new Date(currentLatestTimestamp).getTime())
          ) ||
          Boolean(!submissionTimestamp && !currentLatestTimestamp);

        if (shouldUseSubmission) {
          entity.latestSubmissionDate = submissionTimestamp;
          entity.latestSubmissionId = submission.submissionId;
          entity.latestAssessmentPeriod =
            submission.assessmentPeriod || null;
          entity.latestSubmissionRecordCount = submissionRecords.length;
        }
      }

      const completeness = submission.completenessPercentage;

      for (const entityCode of submissionEntities) {
        const entity = entities.get(entityCode);

        if (!entity) continue;

        if (
          typeof completeness === 'number' &&
          Number.isFinite(completeness)
        ) {
          entity.completenessValues.push(completeness);
        }
      }
    }

    for (const finding of findings) {
      const entityCode = finding.entityCode;

      if (!entityCode) continue;

      const entity = entities.get(entityCode);

      if (!entity) continue;

      entity.findingCount += 1;

      if (
        finding.status === 'OPEN' ||
        finding.status === 'UNDER_REVIEW'
      ) {
        entity.openFindingCount += 1;
      }
    }

    return Array.from(entities.values()).sort((a, b) => {
      if (b.openFindingCount !== a.openFindingCount) {
        return b.openFindingCount - a.openFindingCount;
      }

      return a.entityCode.localeCompare(b.entityCode);
    });
  }, [submissions, records, findings]);

  const periods = useMemo(() => {
    return Array.from(
      new Set(
        submissions
          .map((submission) => submission.assessmentPeriod)
          .filter(Boolean)
      )
    ).sort();
  }, [submissions]);

  const filteredEntities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return entityData.filter((entity) => {
      if (query) {
        const matches =
          entity.entityCode.toLowerCase().includes(query) ||
          entity.entityId.toLowerCase().includes(query) ||
          entity.assessmentPeriods.some((period) =>
            period.toLowerCase().includes(query)
          );

        if (!matches) {
          return false;
        }
      }

      if (
        periodFilter !== 'ALL' &&
        !entity.assessmentPeriods.includes(periodFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [entityData, searchTerm, periodFilter]);

  const portfolioStats = useMemo(() => {
    const totalRecords = entityData.reduce(
      (sum, entity) => sum + entity.recordCount,
      0
    );

    const criticalRecords = entityData.reduce(
      (sum, entity) => sum + entity.criticalCount,
      0
    );

    const openFindings = entityData.reduce(
      (sum, entity) => sum + entity.openFindingCount,
      0
    );

    const limitedRecords = entityData.reduce(
      (sum, entity) => sum + entity.dataQualityLimitedCount,
      0
    );

    return {
      entities: entityData.length,
      submissions: submissions.length,
      totalRecords,
      criticalRecords,
      openFindings,
      limitedRecords
    };
  }, [entityData, submissions.length]);

  const getEntityStatus = (entity: PortfolioEntity) => {
    if (entity.dataQualityLimitedCount > 0) {
      return {
        label: 'DATA QUALITY LIMITED',
        className:
          'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
      };
    }

    if (entity.openFindingCount > 0) {
      return {
        label: 'FINDINGS PRESENT',
        className:
          'bg-[#ef4444]/10 text-[#ffb4ab] border-[#ef4444]/30'
      };
    }

    return {
      label: 'NO OPEN FINDINGS',
      className:
        'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
    };
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FolderGit2 className="w-3.5 h-3.5" />
            SUPERVISORY EVIDENCE // CSE PORTFOLIO
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            CSE Portfolio
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl">
            Entities represented in stored CSE submissions. Metrics are
            derived from submitted operational records and local
            supervisory findings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] text-[10px] font-mono text-[#8d90a0]">
            <span className="text-[#dde2f7] font-semibold">
              {portfolioStats.entities}
            </span>{' '}
            ENTITIES REPRESENTED
          </div>

          <div className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] text-[10px] font-mono text-[#8d90a0]">
            <span className="text-[#dde2f7] font-semibold">
              {portfolioStats.submissions}
            </span>{' '}
            SUBMISSIONS
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <Building2 className="w-3.5 h-3.5" />
            ENTITIES
          </div>
          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {portfolioStats.entities}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <FileCheck2 className="w-3.5 h-3.5" />
            SUBMISSIONS
          </div>
          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {portfolioStats.submissions}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <Database className="w-3.5 h-3.5" />
            RECORDS
          </div>
          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {portfolioStats.totalRecords}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL
          </div>
          <div className="text-lg font-semibold text-[#ffb4ab] mt-1">
            {portfolioStats.criticalRecords}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <ShieldCheck className="w-3.5 h-3.5" />
            OPEN FINDINGS
          </div>
          <div className="text-lg font-semibold text-[#f59e0b] mt-1">
            {portfolioStats.openFindings}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

          <input
            type="text"
            placeholder="Search entity code, ID, assessment period..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <select
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
          className="w-full sm:w-auto px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
        >
          <option value="ALL">All Assessment Periods</option>

          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <div className="text-xs font-mono text-[#8d90a0]">
            Loading local evidence vault...
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded bg-[#131B2E] border border-[#ef4444]/30">
          <div className="text-sm font-semibold text-[#ffb4ab]">
            Portfolio unavailable
          </div>
          <div className="text-xs text-[#8d90a0] mt-1">
            {error}
          </div>
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <Database className="w-8 h-8 mx-auto text-[#475569]" />

          <h3 className="text-sm font-semibold text-[#dde2f7] mt-3">
            {entityData.length === 0
              ? 'No CSE submissions stored'
              : 'No portfolio matches'}
          </h3>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-lg mx-auto">
            {entityData.length === 0
              ? 'Load and persist a CSE submission from Assessments to populate the portfolio from real evidence.'
              : 'Adjust the search or assessment-period filter to view another stored entity.'}
          </p>

          {entityData.length === 0 && (
            <button
              onClick={() => navigate('/assessments')}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 text-[#4cd7f6] text-xs font-mono hover:bg-[#4cd7f6]/15"
            >
              Open Assessments
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntities.map((entity) => {
            const status = getEntityStatus(entity);

            const averageCompleteness =
              entity.completenessValues.length > 0
                ? entity.completenessValues.reduce(
                    (sum, value) => sum + value,
                    0
                  ) / entity.completenessValues.length
                : null;

            return (
              <div
                key={entity.entityCode}
                className={`p-4 rounded bg-[#131B2E] border transition-all flex flex-col justify-between ${
                  entity.openFindingCount > 0
                    ? 'border-[#ef4444]/30 hover:border-[#ef4444]/60'
                    : 'border-[#1E293B] hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[#4cd7f6] font-semibold">
                      {entity.entityCode}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#dde2f7] mt-2">
                    {entity.entityId}
                  </h3>

                  <div className="text-xs text-[#8d90a0] flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>
                      {entity.assessmentPeriods.length > 0
                        ? entity.assessmentPeriods.join(', ')
                        : 'Assessment period unavailable'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                        Records
                      </span>

                      <span className="text-sm font-bold text-[#dde2f7]">
                        {entity.recordCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                        Submissions
                      </span>

                      <span className="text-sm font-bold text-[#dde2f7]">
                        {entity.submissionCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                        Critical
                      </span>

                      <span className="text-sm font-bold text-[#ffb4ab]">
                        {entity.criticalCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                        Findings
                      </span>

                      <span
                        className={`text-sm font-bold ${
                          entity.openFindingCount > 0
                            ? 'text-[#ef4444]'
                            : 'text-[#10b981]'
                        }`}
                      >
                        {entity.openFindingCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-[#8d90a0] uppercase font-mono">
                        Submission Completeness
                      </span>

                      <span
                        className={`text-[11px] font-mono font-semibold ${getCompletenessClass(
                          averageCompleteness
                        )}`}
                      >
                        {averageCompleteness === null
                          ? '—'
                          : `${averageCompleteness.toFixed(1)}%`}
                      </span>
                    </div>

                    <div className="h-1 mt-2 rounded-full bg-[#1E293B] overflow-hidden">
                      <div
                        className={`h-full ${
                          averageCompleteness === null
                            ? 'w-0'
                            : averageCompleteness < 40
                            ? 'bg-[#ef4444]'
                            : averageCompleteness < 80
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#10b981]'
                        }`}
                        style={{
                          width: `${Math.min(
                            Math.max(averageCompleteness || 0, 0),
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>

                  {entity.dataQualityLimitedCount > 0 && (
                    <div className="mt-2 text-[10px] text-[#f59e0b] font-mono">
                      {entity.dataQualityLimitedCount} record(s) have
                      limited evidence quality.
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Latest Submission
                    </span>

                    <span className="text-[10px] font-mono text-[#dde2f7] block truncate">
                      {entity.latestSubmissionId || '—'}
                    </span>

                    <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
                      {entity.latestAssessmentPeriod || 'Period unavailable'}
                      {entity.latestSubmissionRecordCount > 0
                        ? ` · ${entity.latestSubmissionRecordCount} records`
                        : ''}
                    </span>

                    {entity.latestSubmissionDate && (
                      <span className="text-[9px] font-mono text-[#64748b] block mt-0.5">
                        {formatDate(entity.latestSubmissionDate)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/findings?q=${encodeURIComponent(
                          entity.entityCode
                        )}`
                      )
                    }
                    className="text-[#4cd7f6] hover:underline flex items-center gap-1 font-mono text-[11px] shrink-0"
                  >
                    <span>View Findings</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qualityReports.length > 0 && (
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#4cd7f6]" />
            <span className="text-xs font-semibold text-[#dde2f7]">
              Evidence Quality Context
            </span>
          </div>

          <p className="text-[11px] text-[#8d90a0] mt-1 max-w-3xl">
            Portfolio metrics are derived from persisted normalized
            records. Data-quality limitations remain visible rather than
            being treated as operational findings.
          </p>
        </div>
      )}
    </div>
  );
};