import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileCheck2,
  FileText,
  ShieldAlert
} from 'lucide-react';

import {
  findingsRepository,
  submissionRepository,
  normalizedRecordRepository
} from '../repositories';

import {
  CSESubmission,
  Finding,
  NormalizedCaseRecord
} from '../types';

interface ReportSummary {
  id: string;
  title: string;
  type: string;
  scope: string;
  summary: string;
  recordCount: number;
  findingCount: number;
  criticalFindingCount: number;
}

const formatDate = (value?: string | null): string => {
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

const createDownload = (
  filename: string,
  content: string,
  mimeType: string
) => {
  const blob = new Blob([content], {
    type: mimeType
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

const getFindingSeverity = (
  finding: Finding
): string => {
  const candidate = finding as Finding & {
    severity?: string;
    priority?: string;
  };

  return candidate.severity || candidate.priority || 'UNSPECIFIED';
};

const getFindingSubmissionId = (
  finding: Finding
): string | undefined => {
  return (
    finding.submissionId ||
    finding.provenance?.submissionId
  );
};

export const Reports: React.FC = () => {
  const [submissions, setSubmissions] = useState<CSESubmission[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [records, setRecords] = useState<NormalizedCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadReportsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          storedSubmissions,
          storedFindings,
          storedRecords
        ] = await Promise.all([
          submissionRepository.getAll(),
          findingsRepository.getAll(),
          normalizedRecordRepository.getAll()
        ]);

        if (!mounted) return;

        setSubmissions(storedSubmissions);
        setFindings(storedFindings);
        setRecords(storedRecords);
      } catch (err) {
        console.error(
          'Failed to load reporting data:',
          err
        );

        if (mounted) {
          setError(
            'The reporting data could not be loaded from the local evidence vault.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReportsData();

    return () => {
      mounted = false;
    };
  }, []);

  const reportSummaries = useMemo<ReportSummary[]>(() => {
    const reports: ReportSummary[] = [];

    for (const submission of submissions) {
      const submissionRecords = records.filter(
        record =>
          record.submissionId ===
          submission.submissionId
      );

      const submissionFindings = findings.filter(
        finding =>
          getFindingSubmissionId(finding) ===
          submission.submissionId
      );

      const criticalFindingCount =
        submissionFindings.filter(
          finding =>
            getFindingSeverity(finding) ===
              'CRITICAL' ||
            finding.status === 'OPEN'
        ).length;

      reports.push({
        id: `REP-${submission.submissionId}`,
        title: `Supervisory Evidence Summary — ${submission.submissionId}`,
        type: 'Evidence Summary',
        scope:
          submission.assessmentPeriod ||
          'Assessment period unavailable',
        summary:
          submissionFindings.length > 0
            ? `${submissionFindings.length} finding(s) are associated with this submission. The report summarizes the persisted operational evidence and deterministic supervisory findings.`
            : 'No persisted supervisory findings are associated with this submission. The report summarizes the submitted operational evidence and data-quality context.',
        recordCount: submissionRecords.length,
        findingCount: submissionFindings.length,
        criticalFindingCount
      });
    }

    return reports.sort((a, b) =>
      b.id.localeCompare(a.id)
    );
  }, [submissions, findings, records]);

  const portfolioSummary = useMemo(() => {
    const entityCodes = new Set(
      records
        .map(record => record.entityCode)
        .filter(Boolean)
    );

    const periods = Array.from(
      new Set(
        submissions
          .map(submission => submission.assessmentPeriod)
          .filter(Boolean)
      )
    );

    const openFindings = findings.filter(
      finding =>
        finding.status === 'OPEN' ||
        finding.status === 'UNDER_REVIEW'
    );

    const criticalFindings = findings.filter(
      finding =>
        getFindingSeverity(finding) === 'CRITICAL'
    );

    return {
      submissions: submissions.length,
      entities: entityCodes.size,
      records: records.length,
      findings: findings.length,
      openFindings: openFindings.length,
      criticalFindings: criticalFindings.length,
      periods
    };
  }, [submissions, findings, records]);

  const buildSubmissionReport = (
    submissionId: string
  ) => {
    const submission = submissions.find(
      item => item.submissionId === submissionId
    );

    if (!submission) {
      return null;
    }

    const submissionRecords = records.filter(
      record =>
        record.submissionId === submissionId
    );

    const submissionFindings = findings.filter(
      finding =>
        getFindingSubmissionId(finding) ===
        submissionId
    );

    return {
      reportType: 'SAT-SA Supervisory Evidence Summary',
      generatedAt: new Date().toISOString(),
      submission: {
        submissionId: submission.submissionId,
        entityCode: submission.entityCode,
        assessmentPeriod:
          submission.assessmentPeriod,
        filename: submission.filename,
        status: submission.status,
        completenessPercentage:
          submission.completenessPercentage
      },
      evidence: {
        normalizedRecordCount:
          submissionRecords.length,
        records: submissionRecords.map(record => ({
          id: record.id,
          caseId: record.caseId,
          alertId: record.alertId,
          entityCode: record.entityCode,
          entityId: record.entityId,
          severity: record.severity,
          alertTimestamp: record.alertTimestamp,
          triageTimestamp: record.triageTimestamp,
          escalationTimestamp:
            record.escalationTimestamp,
          supervisorReviewTimestamp:
            record.supervisorReviewTimestamp,
          closureTimestamp:
            record.closureTimestamp,
          disposition: record.disposition
        }))
      },
      findings: submissionFindings.map(
        finding => ({
          id: finding.id,
          ruleCode: finding.ruleCode,
          status: finding.status,
          severity: getFindingSeverity(finding),
          entityCode: finding.entityCode,
          submissionId:
            getFindingSubmissionId(finding),
          flaggedIncidentsCount:
            finding.flaggedIncidentsCount,
          summary: finding.summary,
          interpretation:
            finding.interpretation,
          evidenceReferences:
            finding.evidenceReferences,
          provenance: finding.provenance
        })
      ),
      methodology: {
        deterministicAnalytics:
          'Findings and metrics are derived from persisted assessment evidence using application rules.',
        evidencePrinciple:
          'Source records and provenance references are retained for traceability.',
        decisionPrinciple:
          'Supervisory decisions remain subject to human review.'
      }
    };
  };

  const handleDownloadReport = (
    submissionId: string
  ) => {
    setGenerating(submissionId);
    setGeneratedMessage(null);

    const report =
      buildSubmissionReport(submissionId);

    if (!report) {
      setGenerating(null);
      setGeneratedMessage(
        'The selected submission could not be found.'
      );
      return;
    }

    const submission = submissions.find(
      item => item.submissionId === submissionId
    );

    const filename = `${
      submissionId.toLowerCase()
    }_supervisory_evidence_summary.json`;

    createDownload(
      filename,
      JSON.stringify(report, null, 2),
      'application/json'
    );

    setGenerating(null);

    setGeneratedMessage(
      `Evidence summary exported for ${submission?.submissionId || submissionId}.`
    );

    window.setTimeout(() => {
      setGeneratedMessage(null);
    }, 5000);
  };

  const handleDownloadPortfolio = () => {
    setGenerating('PORTFOLIO');
    setGeneratedMessage(null);

    const report = {
      reportType:
        'SAT-SA Portfolio Evidence Summary',
      generatedAt: new Date().toISOString(),
      scope: {
        submissions:
          portfolioSummary.submissions,
        entities: portfolioSummary.entities,
        normalizedRecords:
          portfolioSummary.records,
        assessmentPeriods:
          portfolioSummary.periods
      },
      findings: {
        total: portfolioSummary.findings,
        open: portfolioSummary.openFindings,
        critical:
          portfolioSummary.criticalFindings
      },
      submissions: submissions.map(
        submission => ({
          submissionId:
            submission.submissionId,
          entityCode:
            submission.entityCode,
          assessmentPeriod:
            submission.assessmentPeriod,
          filename: submission.filename,
          status: submission.status,
          completenessPercentage:
            submission.completenessPercentage
        })
      ),
      methodology: {
        source:
          'Persisted SAT-SA local evidence vault',
        analytics:
          'Deterministic supervisory analytics',
        decision:
          'Human supervisory review'
      }
    };

    createDownload(
      'sat-sa_portfolio_evidence_summary.json',
      JSON.stringify(report, null, 2),
      'application/json'
    );

    setGenerating(null);

    setGeneratedMessage(
      'Portfolio evidence summary exported.'
    );

    window.setTimeout(() => {
      setGeneratedMessage(null);
    }, 5000);
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileText className="w-3.5 h-3.5" />
            SUPERVISORY REPORTING // EVIDENCE SUMMARIES
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Reports & Evidence Summaries
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl">
            Generate evidence-derived summaries from persisted CSE
            submissions and deterministic supervisory findings.
          </p>
        </div>

        <button
          onClick={handleDownloadPortfolio}
          disabled={
            loading ||
            portfolioSummary.submissions === 0 ||
            generating === 'PORTFOLIO'
          }
          className="px-3.5 py-1.5 rounded bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#1A243B] disabled:text-[#64748b] text-white text-xs font-semibold flex items-center gap-2 transition-colors self-start lg:self-auto"
        >
          <Download className="w-3.5 h-3.5" />

          <span>
            {generating === 'PORTFOLIO'
              ? 'Generating...'
              : 'Export Portfolio Summary'}
          </span>
        </button>
      </div>

      {generatedMessage && (
        <div className="p-3 rounded bg-[#131B2E] border border-[#10b981]/30 text-xs font-mono text-[#10b981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{generatedMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded bg-[#131B2E] border border-[#ef4444]/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#ffb4ab]">
            <AlertCircle className="w-4 h-4" />
            Reporting data unavailable
          </div>

          <p className="text-xs text-[#8d90a0] mt-1">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Submissions
          </span>

          <span className="text-lg font-semibold text-[#dde2f7]">
            {portfolioSummary.submissions}
          </span>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Entities
          </span>

          <span className="text-lg font-semibold text-[#dde2f7]">
            {portfolioSummary.entities}
          </span>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Records
          </span>

          <span className="text-lg font-semibold text-[#dde2f7]">
            {portfolioSummary.records}
          </span>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Findings
          </span>

          <span className="text-lg font-semibold text-[#f59e0b]">
            {portfolioSummary.findings}
          </span>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Open
          </span>

          <span className="text-lg font-semibold text-[#f59e0b]">
            {portfolioSummary.openFindings}
          </span>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
            Critical
          </span>

          <span className="text-lg font-semibold text-[#ffb4ab]">
            {portfolioSummary.criticalFindings}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <div className="text-xs font-mono text-[#8d90a0]">
            Loading reporting data from the local evidence vault...
          </div>
        </div>
      ) : reportSummaries.length === 0 ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <FileText className="w-8 h-8 mx-auto text-[#475569]" />

          <h3 className="text-sm font-semibold text-[#dde2f7] mt-3">
            No reportable submissions
          </h3>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-lg mx-auto">
            Persist a CSE submission from Assessments before generating
            an evidence-derived supervisory summary.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#dde2f7]">
                Submission Reports
              </h2>

              <p className="text-[11px] text-[#8d90a0] mt-0.5">
                Each report is generated directly from stored assessment
                evidence.
              </p>
            </div>

            <div className="text-[10px] font-mono text-[#64748b]">
              {reportSummaries.length} AVAILABLE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reportSummaries.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded bg-[#131B2E] border border-[#1E293B] hover:border-[#334155] transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="text-[#4cd7f6] font-semibold">
                      {report.id}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-[#090D16] text-[#8d90a0] border border-[#1E293B]">
                      {report.type}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#dde2f7] leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-[#8d90a0] leading-relaxed">
                    {report.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] block font-mono">
                        RECORDS
                      </span>

                      <span className="text-sm font-semibold text-[#dde2f7]">
                        {report.recordCount}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] block font-mono">
                        FINDINGS
                      </span>

                      <span className="text-sm font-semibold text-[#f59e0b]">
                        {report.findingCount}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#090D16] border border-[#1E293B]">
                      <span className="text-[9px] text-[#8d90a0] block font-mono">
                        CRITICAL
                      </span>

                      <span className="text-sm font-semibold text-[#ffb4ab]">
                        {report.criticalFindingCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{report.scope}</span>
                  </div>

                  <button
                    onClick={() =>
                      handleDownloadReport(
                        report.id.replace(
                          'REP-',
                          ''
                        )
                      )
                    }
                    disabled={
                      generating ===
                      report.id.replace(
                        'REP-',
                        ''
                      )
                    }
                    className="px-3 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] disabled:opacity-50 text-[#dde2f7] hover:text-white transition-colors flex items-center gap-1.5 border border-[#334155] text-[10px] font-mono"
                  >
                    <Download className="w-3 h-3" />

                    <span>
                      {generating ===
                      report.id.replace(
                        'REP-',
                        ''
                      )
                        ? 'Generating...'
                        : 'Export JSON'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#4cd7f6]" />

          <span className="text-xs font-semibold text-[#dde2f7]">
            Reporting Principle
          </span>
        </div>

        <p className="text-[11px] text-[#8d90a0] mt-1 max-w-4xl leading-relaxed">
          Reports are derived from evidence persisted in the local SAT-SA
          vault. Deterministic analytics provide the underlying findings
          and metrics; exported summaries preserve those references for
          supervisory review. The application does not treat generated
          reports as independent proof or as a substitute for human
          supervisory decisions.
        </p>
      </div>
    </div>
  );
};