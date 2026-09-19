import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Hash,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import {
  CSESubmission,
  SourceRecord,
  NormalizedCaseRecord,
  DataQualityReport
} from '../../types/submission';
import {
  sourceRecordRepository,
  normalizedRecordRepository,
  dataQualityRepository
} from '../../repositories';
import { calculateExecutionGap, calculateNegativeSpace } from '../../services/analytics';
import { ExecutionGapAnalysisPanel } from './ExecutionGapAnalysisPanel';
import { NegativeSpaceAnalysisPanel } from './NegativeSpaceAnalysisPanel';

interface SubmissionDetailModalProps {
  submission: CSESubmission;
  initialTab?: 'NORMALIZED' | 'SOURCE' | 'QUALITY' | 'EXECUTION_GAPS' | 'NEGATIVE_SPACE';
  onClose: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  initialTab = 'NORMALIZED',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'NORMALIZED' | 'SOURCE' | 'QUALITY' | 'EXECUTION_GAPS' | 'NEGATIVE_SPACE'>(initialTab);
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([]);
  const [normalizedRecords, setNormalizedRecords] = useState<NormalizedCaseRecord[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Deterministically compute execution gaps using pure engine
  const executionGapResult = useMemo(() => {
    return calculateExecutionGap(normalizedRecords, submission, qualityReport);
  }, [normalizedRecords, submission, qualityReport]);

  // Deterministically compute negative space using pure engine
  const negativeSpaceResult = useMemo(() => {
    return calculateNegativeSpace(normalizedRecords, submission, qualityReport);
  }, [normalizedRecords, submission, qualityReport]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [srcs, norms, report] = await Promise.all([
          sourceRecordRepository.getBySubmissionId(submission.submissionId),
          normalizedRecordRepository.getBySubmissionId(submission.submissionId),
          dataQualityRepository.getBySubmissionId(submission.submissionId)
        ]);
        if (mounted) {
          setSourceRecords(srcs);
          setNormalizedRecords(norms);
          setQualityReport(report || null);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load submission details:', err);
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [submission.submissionId]);

  return (
    <div
      id="submission-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="submission-detail-modal-container"
        className="bg-[#0B132B] border border-[#1E293B] rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1E293B] bg-[#0E1738]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] border border-[#38BDF8]/30">
                {submission.entityCode}
              </span>
              <span className="text-xs font-mono text-[#8d90a0]">
                Period: {submission.assessmentPeriod}
              </span>
              <span className="text-xs font-mono text-[#8d90a0]">
                ID: {submission.submissionId}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#dde2f7] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#4cd7f6]" />
              Submission Ingestion & Provenance Records
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-analyze-negative-space"
              onClick={() => setActiveTab('NEGATIVE_SPACE')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
                activeTab === 'NEGATIVE_SPACE'
                  ? 'bg-[#38BDF8] text-[#0B132B] font-bold border-[#38BDF8]'
                  : 'bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8]/25 border-[#38BDF8]/30'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Analyze Negative Space</span>
            </button>

            <button
              id="btn-close-submission-modal"
              onClick={onClose}
              className="p-1.5 rounded text-[#8d90a0] hover:text-[#dde2f7] hover:bg-[#1A243B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Provenance Banner */}
        <div className="px-4 py-2.5 bg-[#090D16] border-b border-[#1E293B] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#8d90a0] block uppercase">File Name</span>
            <span className="text-[#dde2f7] truncate block" title={submission.fileName}>
              {submission.fileName}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8d90a0] block uppercase">SHA-256 Fingerprint</span>
            <span className="text-[#4cd7f6] truncate block" title={submission.fileHash}>
              {submission.fileHash.substring(0, 18)}...
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8d90a0] block uppercase">Calculated Completeness</span>
            <span className="text-[#dde2f7] block">{submission.completenessPercentage}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8d90a0] block uppercase">Ingestion Timestamp</span>
            <span className="text-[#8d90a0] block">
              {new Date(submission.importedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1E293B] bg-[#0E1738] px-4">
          <button
            id="tab-normalized-records"
            onClick={() => setActiveTab('NORMALIZED')}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'NORMALIZED'
                ? 'border-[#4cd7f6] text-[#4cd7f6]'
                : 'border-transparent text-[#8d90a0] hover:text-[#dde2f7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Normalized Records ({normalizedRecords.length})</span>
          </button>

          <button
            id="tab-source-records"
            onClick={() => setActiveTab('SOURCE')}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'SOURCE'
                ? 'border-[#4cd7f6] text-[#4cd7f6]'
                : 'border-transparent text-[#8d90a0] hover:text-[#dde2f7]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Preserved Source Records ({sourceRecords.length})</span>
          </button>

          <button
            id="tab-quality-report"
            onClick={() => setActiveTab('QUALITY')}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'QUALITY'
                ? 'border-[#4cd7f6] text-[#4cd7f6]'
                : 'border-transparent text-[#8d90a0] hover:text-[#dde2f7]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Data Quality Report ({qualityReport?.issues.length || 0} issues)</span>
          </button>

          <button
            id="tab-execution-gaps"
            onClick={() => setActiveTab('EXECUTION_GAPS')}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'EXECUTION_GAPS'
                ? 'border-[#ef4444] text-[#f87171]'
                : 'border-transparent text-[#8d90a0] hover:text-[#dde2f7]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#f87171]" />
            <span>Execution Gaps (RULE-ESC-04)</span>
            {executionGapResult.summary.gapCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40">
                {executionGapResult.summary.gapCount} Gaps
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#10b981]">
                0 Gaps
              </span>
            )}
          </button>

          <button
            id="tab-negative-space"
            onClick={() => setActiveTab('NEGATIVE_SPACE')}
            className={`px-4 py-2.5 text-xs font-mono font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'NEGATIVE_SPACE'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#8d90a0] hover:text-[#dde2f7]'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Negative Space (RULE-NS-ESC-01)</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                negativeSpaceResult.absentEvidenceCount > 0
                  ? 'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/40'
                  : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
              }`}
            >
              {negativeSpaceResult.absentEvidenceCount} Absent ({negativeSpaceResult.absenceRate}%)
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[#8d90a0] font-mono text-xs">
              Loading submission records from local IndexedDB vault...
            </div>
          ) : activeTab === 'NORMALIZED' ? (
            <div className="space-y-2">
              <div className="text-xs text-[#8d90a0] flex items-center justify-between pb-1">
                <span>
                  Showing {normalizedRecords.length} normalized records ready for future supervisory analytics.
                </span>
                <span className="font-mono text-[11px] text-[#4cd7f6]">
                  Negative-Space & Chronology Normalized
                </span>
              </div>

              <div className="overflow-x-auto border border-[#1E293B] rounded bg-[#090D16]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#101935] text-[#8d90a0] uppercase text-[10px] border-b border-[#1E293B]">
                    <tr>
                      <th className="px-3 py-2">Case ID</th>
                      <th className="px-3 py-2">Severity</th>
                      <th className="px-3 py-2">Alert Time (UTC)</th>
                      <th className="px-3 py-2">Escalation Evidence</th>
                      <th className="px-3 py-2">Supervisor Review</th>
                      <th className="px-3 py-2">Closure Time</th>
                      <th className="px-3 py-2">Disposition</th>
                      <th className="px-3 py-2 text-right">Source Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                    {normalizedRecords.map((rec) => (
                      <React.Fragment key={rec.id}>
                        <tr
                          onClick={() => setExpandedRow(expandedRow === rec.id ? null : rec.id)}
                          className="hover:bg-[#152044] cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2 font-bold text-[#dde2f7]">
                            <div className="flex items-center gap-1">
                              {expandedRow === rec.id ? (
                                <ChevronUp className="w-3 h-3 text-[#4cd7f6]" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-[#8d90a0]" />
                              )}
                              <span>{rec.caseId}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                rec.severity === 'CRITICAL'
                                  ? 'bg-[#93000a]/40 text-[#ffdad6] border border-[#ef4444]/40'
                                  : rec.severity === 'HIGH'
                                  ? 'bg-[#78350f]/40 text-[#fde047] border border-[#f59e0b]/40'
                                  : 'bg-[#1E293B] text-[#94a3b8]'
                              }`}
                            >
                              {rec.severity}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#8d90a0]">
                            {rec.alertTimestamp ? rec.alertTimestamp.substring(11, 19) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {rec.escalationRecorded ? (
                              <span className="text-[#10b981] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{rec.escalationTimestamp?.substring(11, 19)}</span>
                              </span>
                            ) : (
                              <span className="text-[#8d90a0] italic text-[11px]">
                                Evidence Not Present
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {rec.supervisorReviewRecorded ? (
                              <span className="text-[#10b981] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{rec.supervisorReviewTimestamp?.substring(11, 19)}</span>
                              </span>
                            ) : (
                              <span className="text-[#8d90a0] italic text-[11px]">
                                Evidence Not Present
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[#8d90a0]">
                            {rec.closureTimestamp ? rec.closureTimestamp.substring(11, 19) : '—'}
                          </td>
                          <td className="px-3 py-2 truncate max-w-[140px]" title={rec.disposition || '—'}>
                            {rec.disposition || '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-[10px] text-[#4cd7f6]">
                            <code>{rec.sourceRecordId}</code>
                          </td>
                        </tr>

                        {expandedRow === rec.id && (
                          <tr className="bg-[#0D1630]">
                            <td colSpan={8} className="p-3 text-xs space-y-2 border-b border-[#1E293B]">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                                  <span className="text-[10px] text-[#4cd7f6] uppercase font-bold block mb-1">
                                    Evidence Presence (Negative-Space Preparation)
                                  </span>
                                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                                    <div>Triage: <span className="text-[#dde2f7]">{rec.evidencePresence.triageEvidence}</span></div>
                                    <div>Escalation: <span className="text-[#dde2f7]">{rec.evidencePresence.escalationEvidence}</span></div>
                                    <div>Supervisor: <span className="text-[#dde2f7]">{rec.evidencePresence.supervisorReviewEvidence}</span></div>
                                    <div>Closure: <span className="text-[#dde2f7]">{rec.evidencePresence.closureEvidence}</span></div>
                                  </div>
                                  {rec.evidencePresence.notes && rec.evidencePresence.notes.length > 0 && (
                                    <div className="mt-2 text-[10px] text-[#fde047]">
                                      {rec.evidencePresence.notes.join(' ')}
                                    </div>
                                  )}
                                </div>

                                <div className="p-2.5 rounded bg-[#090D16] border border-[#1E293B]">
                                  <span className="text-[10px] text-[#8d90a0] uppercase font-bold block mb-1">
                                    Original Raw Payload Snapshot
                                  </span>
                                  <pre className="text-[10px] font-mono text-[#c3c6d7] overflow-x-auto max-h-24">
                                    {JSON.stringify(rec.sourcePayload, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'SOURCE' ? (
            <div className="space-y-3">
              <div className="text-xs text-[#8d90a0] pb-1">
                Showing {sourceRecords.length} immutable source records preserved directly from the original import payload.
              </div>

              <div className="space-y-2">
                {sourceRecords.map((src) => (
                  <div
                    key={src.id}
                    className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2 font-mono text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-1 border-b border-[#1E293B]/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#4cd7f6]">{src.id}</span>
                        <span className="text-[#8d90a0]">Row: {src.rowNumber}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#8d90a0]">
                        <Hash className="w-3 h-3 text-[#4cd7f6]" />
                        <span>SHA-256 Digest: </span>
                        <code className="text-[#dde2f7]">{src.sha256Fingerprint.substring(0, 16)}...</code>
                      </div>
                    </div>

                    <div>
                      <pre className="text-[11px] text-[#c3c6d7] bg-[#070B12] p-2.5 rounded border border-[#1E293B]/40 overflow-x-auto">
                        {JSON.stringify(src.rawPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'QUALITY' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded bg-[#090D16] border border-[#1E293B] font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Total Records</span>
                  <span className="text-sm font-bold text-[#dde2f7]">{qualityReport?.totalRecords || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Valid Records</span>
                  <span className="text-sm font-bold text-[#10b981]">{qualityReport?.validRecords || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Invalid Records</span>
                  <span className="text-sm font-bold text-[#ef4444]">{qualityReport?.invalidRecords || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Warnings</span>
                  <span className="text-sm font-bold text-[#f59e0b]">{qualityReport?.warningCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Completeness</span>
                  <span className="text-sm font-bold text-[#4cd7f6]">{qualityReport?.completenessPercentage || 0}%</span>
                </div>
              </div>

              {(!qualityReport?.issues || qualityReport.issues.length === 0) ? (
                <div className="p-8 text-center text-xs font-mono text-[#10b981] bg-[#090D16] rounded border border-[#1E293B] flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
                  <span>No data quality anomalies or chronological errors detected.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-[#8d90a0] block">
                    Observed Quality Issues ({qualityReport.issues.length})
                  </span>
                  <div className="border border-[#1E293B] rounded bg-[#090D16] overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#101935] text-[#8d90a0] uppercase text-[10px] border-b border-[#1E293B]">
                        <tr>
                          <th className="px-3 py-2">Record</th>
                          <th className="px-3 py-2">Field</th>
                          <th className="px-3 py-2">Severity</th>
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Diagnostic Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                        {qualityReport.issues.map((iss) => (
                          <tr key={iss.id} className="hover:bg-[#152044]">
                            <td className="px-3 py-2 font-bold text-[#dde2f7] whitespace-nowrap">
                              {iss.caseId || `Row ${iss.rowNumber}`}
                            </td>
                            <td className="px-3 py-2 text-[#4cd7f6] whitespace-nowrap">
                              <code>{iss.field}</code>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  iss.severity === 'ERROR'
                                    ? 'bg-[#93000a]/50 text-[#ffdad6] border border-[#ef4444]/40'
                                    : iss.severity === 'WARNING'
                                    ? 'bg-[#78350f]/50 text-[#fde047] border border-[#f59e0b]/40'
                                    : 'bg-[#1E293B] text-[#94a3b8]'
                                }`}
                              >
                                {iss.severity}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[#8d90a0] text-[10px]">
                              {iss.code}
                            </td>
                            <td className="px-3 py-2 text-xs text-[#dde2f7]">
                              {iss.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'NEGATIVE_SPACE' ? (
            <NegativeSpaceAnalysisPanel
              result={negativeSpaceResult}
              submission={submission}
              sourceRecords={sourceRecords}
            />
          ) : (
            <ExecutionGapAnalysisPanel
              result={executionGapResult}
              sourceRecords={sourceRecords}
              submission={submission}
              onInspectSourceRecord={(sourceRecordId) => {
                setActiveTab('SOURCE');
                setExpandedRow(sourceRecordId);
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0E1738] border-t border-[#1E293B] flex items-center justify-between text-xs font-mono">
          <span className="text-[#8d90a0]">
            Provenance Source: Local IndexedDB Vault (Vault V1 // Schema V2)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1A243B] text-[#dde2f7] hover:bg-[#2A385B] border border-[#1E293B] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
