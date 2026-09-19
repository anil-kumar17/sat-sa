import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Database,
  RefreshCw,
  Trash2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Info,
  ArrowRight,
  EyeOff
} from 'lucide-react';
import {
  CSESubmission,
  IngestionFileType
} from '../../types/submission';
import {
  ingestionService,
  IngestionAnalysisResult,
  DEMO_DATASET_CSV,
  DEMO_DATASET_FILENAME,
  DEMO_DATASET_EXTENDED_CSV,
  DEMO_DATASET_EXTENDED_FILENAME
} from '../../services/ingestion';
import { submissionRepository } from '../../repositories';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { calculateExecutionGap, calculateNegativeSpace } from '../../services/analytics';
import { ExecutionGapAnalysisPanel } from './ExecutionGapAnalysisPanel';
import { NegativeSpaceAnalysisPanel } from './NegativeSpaceAnalysisPanel';
import { findingService } from '../../services/findingService';

export const SubmissionIngestionPanel: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<CSESubmission[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [analyzed, setAnalyzed] = useState<IngestionAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lastGeneratedFindingId, setLastGeneratedFindingId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<CSESubmission | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'NORMALIZED' | 'SOURCE' | 'QUALITY' | 'EXECUTION_GAPS' | 'NEGATIVE_SPACE'>('NORMALIZED');
  const [showStagedGaps, setShowStagedGaps] = useState<boolean>(false);
  const [showStagedNegativeSpace, setShowStagedNegativeSpace] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Compute execution gaps for staged submission in real time
  const stagedGapResult = useMemo(() => {
    if (!analyzed || analyzed.normalizedRecords.length === 0) return null;
    return calculateExecutionGap(analyzed.normalizedRecords, analyzed.submission, analyzed.qualityReport);
  }, [analyzed]);

  // Compute negative space for staged submission in real time
  const stagedNegativeSpaceResult = useMemo(() => {
    if (!analyzed || analyzed.normalizedRecords.length === 0) return null;
    return calculateNegativeSpace(analyzed.normalizedRecords, analyzed.submission, analyzed.qualityReport);
  }, [analyzed]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load submissions from IndexedDB
  const refreshSubmissions = async () => {
    setLoadingList(true);
    try {
      const list = await submissionRepository.getAll();
      setSubmissions(list);
    } catch (err) {
      console.warn('Could not load submissions list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    refreshSubmissions();
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const text = await file.text();
      const isJson = file.name.toLowerCase().endsWith('.json') || file.type.includes('json');
      const fileType: IngestionFileType = isJson ? 'JSON' : 'CSV';

      const result = await ingestionService.analyze({
        fileContent: text,
        fileName: file.name,
        fileType,
        fileSizeBytes: file.size
      });

      setAnalyzed(result);
      if (result.parseError) {
        setStatusMessage({
          text: `File parsing issue: ${result.parseError}`,
          type: 'error'
        });
      } else {
        setStatusMessage({
          text: `Analyzed ${result.submission.recordCount} records from ${file.name}. Review calculated data quality below before persisting.`,
          type: 'info'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected file processing failure.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Load Deterministic Demo Dataset
  const handleLoadDemo = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const result = await ingestionService.analyze({
        fileContent: DEMO_DATASET_CSV,
        fileName: DEMO_DATASET_FILENAME,
        fileType: 'CSV'
      });
      setAnalyzed(result);
      setStatusMessage({
        text: `Deterministic demo dataset loaded (${result.submission.recordCount} operational records for ${result.submission.entityCode} // ${result.submission.assessmentPeriod}). Review calculated quality below.`,
        type: 'info'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load demo dataset.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Extended Demo Dataset (with edge cases: Data Quality Limited & Inconclusive Boundary)
  const handleLoadExtendedDemo = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const result = await ingestionService.analyze({
        fileContent: DEMO_DATASET_EXTENDED_CSV,
        fileName: DEMO_DATASET_EXTENDED_FILENAME,
        fileType: 'CSV'
      });
      setAnalyzed(result);
      setStatusMessage({
        text: `Extended demo dataset loaded (${result.submission.recordCount} operational records for ${result.submission.entityCode} with Data-Quality and Inconclusive boundary cases). Review calculated negative space and quality below.`,
        type: 'info'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load extended demo dataset.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit and Save to IndexedDB
  const handleCommitSubmission = async () => {
    if (!analyzed) return;
    setIsProcessing(true);
    try {
      await ingestionService.commit(analyzed);

      let createdFindingId: string | null = null;
      if (stagedGapResult && stagedGapResult.summary.gapCount > 0) {
        try {
          const genResult = await findingService.generateFindingFromExecutionGap(
            analyzed.submission,
            stagedGapResult,
            analyzed.sourceRecords
          );
          if (genResult.finding) {
            createdFindingId = genResult.finding.id;
            setLastGeneratedFindingId(genResult.finding.id);
          }
        } catch (fErr) {
          console.warn('Could not auto-generate finding from execution gap:', fErr);
        }
      }

      setStatusMessage({
        text: `Submission ${analyzed.submission.submissionId} successfully persisted into local vault (${analyzed.submission.validRecordCount} valid normalized records, source records preserved).${
          createdFindingId ? ` Formal supervisory finding ${createdFindingId} generated (${stagedGapResult?.summary.gapCount} execution gaps anchored to source records).` : ''
        }`,
        type: 'success'
      });
      setAnalyzed(null);
      await refreshSubmissions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to persist submission.';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete submission
  const handleDelete = async (submissionId: string) => {
    if (!window.confirm(`Purge submission ${submissionId} and all associated source/normalized records from local vault?`)) {
      return;
    }
    try {
      await ingestionService.deleteSubmission(submissionId);
      await refreshSubmissions();
      setStatusMessage({
        text: `Submission ${submissionId} purged from local storage.`,
        type: 'info'
      });
    } catch (err) {
      console.warn('Failed to delete submission:', err);
    }
  };

  return (
    <div id="local-submission-ingestion-section" className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Section Header */}
      <div className="p-4 sm:p-5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6]">
              <Database className="w-3.5 h-3.5" />
              <span>LOCAL SUBMISSION INGESTION // EVIDENCE VAULT</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#dde2f7]">
              Supervisory Operational Record Ingestion
            </h2>
            <p className="text-xs text-[#8d90a0] mt-0.5">
              Import structured CSV or JSON records submitted by CSE entities. Validates schema chronology, preserves raw source payloads, and normalizes operational data for local supervisory analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-import-file"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] hover:bg-[#4cd7f6]/20 border border-[#4cd7f6]/30 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import CSV / JSON</span>
            </button>

            <button
              id="btn-load-demo"
              onClick={handleLoadDemo}
              disabled={isProcessing}
              title="Load canonical CSE-047 2026-Q3 dataset (20 records)"
              className="px-3 py-1.5 rounded bg-[#1A243B] text-[#dde2f7] hover:bg-[#223050] border border-[#1E293B] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Load CSE-047 (20 Records)</span>
            </button>

            <button
              id="btn-load-demo-extended"
              onClick={handleLoadExtendedDemo}
              disabled={isProcessing}
              title="Load extended CSE-047 dataset (22 records including Data Quality Limited & Inconclusive Boundary Cases)"
              className="px-3 py-1.5 rounded bg-[#1A243B] text-[#38BDF8] hover:bg-[#223050] border border-[#38BDF8]/30 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Load Extended Demo (22 Records)</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#4cd7f6] bg-[#4cd7f6]/5'
              : 'border-[#1E293B] hover:border-[#38BDF8]/50 bg-[#090D16]/50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-xs">
            <UploadCloud className="w-6 h-6 text-[#4cd7f6] mb-1" />
            <span className="text-[#dde2f7] font-medium">
              Click or drag & drop a structured CSV or JSON submission here
            </span>
            <span className="text-[#8d90a0] text-[11px] font-mono">
              Supports canonical SAT-SA schema (case_id, alert_timestamp, triage, escalation, closure, disposition)
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                : statusMessage.type === 'error'
                ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30'
                : 'bg-[#4cd7f6]/10 text-[#4cd7f6] border-[#4cd7f6]/30'
            }`}
          >
            <div className="flex items-start gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>

            {lastGeneratedFindingId && statusMessage.type === 'success' && (
              <button
                id="btn-goto-generated-finding"
                onClick={() => navigate(`/findings/${lastGeneratedFindingId}`)}
                className="px-3 py-1.5 rounded bg-[#38BDF8] text-[#0B132B] hover:bg-[#4cd7f6] font-bold text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0 shadow"
              >
                <span>Investigate Finding {lastGeneratedFindingId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Staged Analysis Review Box */}
        {analyzed && (
          <div
            id="staged-submission-review-card"
            className="p-4 rounded bg-[#090D16] border border-[#38BDF8]/40 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] font-mono text-xs font-bold border border-[#38BDF8]/30">
                  {analyzed.submission.entityCode}
                </span>
                <span className="text-xs font-mono text-[#dde2f7]">
                  Assessment Period: <strong>{analyzed.submission.assessmentPeriod}</strong>
                </span>
                <span className="text-[11px] font-mono text-[#8d90a0]">
                  ({analyzed.submission.fileName})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                    analyzed.qualityReport.overallStatus === 'VALID'
                      ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                      : analyzed.qualityReport.overallStatus === 'WARNINGS'
                      ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
                      : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40'
                  }`}
                >
                  STATUS: {analyzed.qualityReport.overallStatus}
                </span>
              </div>
            </div>

            {/* Calculated Data Quality Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded bg-[#0E1738] border border-[#1E293B] font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Total Records</span>
                <span className="text-sm font-bold text-[#dde2f7]">{analyzed.qualityReport.totalRecords}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Valid Records</span>
                <span className="text-sm font-bold text-[#10b981]">{analyzed.qualityReport.validRecords}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Invalid Records</span>
                <span className="text-sm font-bold text-[#ef4444]">{analyzed.qualityReport.invalidRecords}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Warnings</span>
                <span className="text-sm font-bold text-[#f59e0b]">{analyzed.qualityReport.warningCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Completeness</span>
                <span className="text-sm font-bold text-[#4cd7f6]">{analyzed.qualityReport.completenessPercentage}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Integrity Digest</span>
                <span className="text-[11px] font-mono text-[#8d90a0] truncate block" title={analyzed.submission.fileHash}>
                  {analyzed.submission.fileHash.substring(0, 10)}...
                </span>
              </div>
            </div>

            {/* Quality Issues List (if any) */}
            {analyzed.qualityReport.issues.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#8d90a0] block">
                  Data Quality & Chronology Observations ({analyzed.qualityReport.issues.length}):
                </span>
                <div className="border border-[#1E293B] rounded bg-[#070B12] max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#101935] text-[#8d90a0] sticky top-0 border-b border-[#1E293B]">
                      <tr>
                        <th className="px-2.5 py-1.5">Record</th>
                        <th className="px-2.5 py-1.5">Field</th>
                        <th className="px-2.5 py-1.5">Severity</th>
                        <th className="px-2.5 py-1.5">Issue Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                      {analyzed.qualityReport.issues.map((iss) => (
                        <tr key={iss.id}>
                          <td className="px-2.5 py-1.5 font-bold text-[#dde2f7] whitespace-nowrap">
                            {iss.caseId || `Row ${iss.rowNumber}`}
                          </td>
                          <td className="px-2.5 py-1.5 text-[#4cd7f6] whitespace-nowrap">
                            <code>{iss.field}</code>
                          </td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                iss.severity === 'ERROR'
                                  ? 'bg-[#93000a]/50 text-[#ffdad6]'
                                  : iss.severity === 'WARNING'
                                  ? 'bg-[#78350f]/50 text-[#fde047]'
                                  : 'bg-[#1E293B] text-[#94a3b8]'
                              }`}
                            >
                              {iss.severity}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-[#dde2f7]">
                            {iss.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-[11px] font-mono text-[#8d90a0]">
                All {analyzed.sourceRecords.length} raw source records will be preserved immutably with stable sourceRecordIds.
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {stagedGapResult && (
                  <button
                    id="btn-staged-analyze-gaps"
                    onClick={() => {
                      setShowStagedGaps(!showStagedGaps);
                      if (!showStagedGaps) setShowStagedNegativeSpace(false);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
                      showStagedGaps
                        ? 'bg-[#ef4444] text-white border-[#ef4444]'
                        : 'bg-[#ef4444]/10 text-[#f87171] hover:bg-[#ef4444]/20 border-[#ef4444]/30'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {showStagedGaps ? 'Hide Execution Gaps' : 'Analyze Execution Gaps (RULE-ESC-04)'}
                    </span>
                    <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-bold">
                      {stagedGapResult.summary.gapCount} {stagedGapResult.summary.gapCount === 1 ? 'Gap' : 'Gaps'}
                    </span>
                  </button>
                )}

                {stagedNegativeSpaceResult && (
                  <button
                    id="btn-staged-analyze-negative-space"
                    onClick={() => {
                      setShowStagedNegativeSpace(!showStagedNegativeSpace);
                      if (!showStagedNegativeSpace) setShowStagedGaps(false);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
                      showStagedNegativeSpace
                        ? 'bg-[#38BDF8] text-[#0B132B] font-bold border-[#38BDF8]'
                        : 'bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20 border-[#38BDF8]/30'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>
                      {showStagedNegativeSpace ? 'Hide Negative Space' : 'Analyze Negative Space (RULE-NS-ESC-01)'}
                    </span>
                    <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-bold">
                      {stagedNegativeSpaceResult.absentEvidenceCount} Absent ({stagedNegativeSpaceResult.absenceRate}%)
                    </span>
                  </button>
                )}

                <button
                  id="btn-discard-staged"
                  onClick={() => {
                    setAnalyzed(null);
                    setShowStagedGaps(false);
                    setShowStagedNegativeSpace(false);
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1 rounded bg-[#1A243B] text-[#8d90a0] hover:text-[#dde2f7] text-xs font-mono transition-colors"
                >
                  Discard
                </button>
                <button
                  id="btn-confirm-save-submission"
                  onClick={handleCommitSubmission}
                  disabled={isProcessing || analyzed.submission.validRecordCount === 0}
                  className="px-4 py-1 rounded bg-[#38BDF8] text-[#0B132B] hover:bg-[#4cd7f6] font-bold text-xs font-mono transition-colors flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save & Persist to Local Vault</span>
                </button>
              </div>
            </div>

            {/* Staged Execution Gap Analysis Panel */}
            {showStagedGaps && stagedGapResult && (
              <div className="pt-3 border-t border-[#1E293B]">
                <ExecutionGapAnalysisPanel
                  result={stagedGapResult}
                  sourceRecords={analyzed.sourceRecords}
                  submission={analyzed.submission}
                />
              </div>
            )}

            {/* Staged Negative Space Analysis Panel */}
            {showStagedNegativeSpace && stagedNegativeSpaceResult && (
              <div className="pt-3 border-t border-[#1E293B]">
                <NegativeSpaceAnalysisPanel
                  result={stagedNegativeSpaceResult}
                  sourceRecords={analyzed.sourceRecords}
                  submission={analyzed.submission}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persisted Submissions Vault Table */}
      <div className="p-4 sm:p-5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4cd7f6]" />
            <h3 className="text-sm sm:text-base font-semibold text-[#dde2f7]">
              Stored CSE Submissions ({submissions.length})
            </h3>
          </div>
          <button
            onClick={refreshSubmissions}
            className="p-1 rounded text-[#8d90a0] hover:text-[#dde2f7] text-xs font-mono flex items-center gap-1"
            title="Refresh local vault"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Refresh Vault</span>
          </button>
        </div>

        {loadingList ? (
          <div className="p-6 text-center text-xs font-mono text-[#8d90a0]">
            Querying local IndexedDB storage...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-6 rounded bg-[#090D16] border border-[#1E293B] text-center text-xs font-mono text-[#8d90a0]">
            No CSE operational submissions currently persisted in this local vault. Import a CSV/JSON file or click "Load Deterministic Demo" to initialize data.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#1E293B] rounded bg-[#090D16]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#101935] text-[#8d90a0] uppercase text-[10px] border-b border-[#1E293B]">
                <tr>
                  <th className="px-3 py-2.5">Entity</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="px-3 py-2.5">File</th>
                  <th className="px-3 py-2.5">Records</th>
                  <th className="px-3 py-2.5">Quality Status</th>
                  <th className="px-3 py-2.5">Completeness</th>
                  <th className="px-3 py-2.5">Ingested (UTC)</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                {submissions.map((sub) => (
                  <tr key={sub.submissionId} className="hover:bg-[#152044] transition-colors">
                    <td className="px-3 py-2.5 font-bold text-[#dde2f7]">
                      <span className="px-1.5 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] border border-[#38BDF8]/20">
                        {sub.entityCode}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#dde2f7]">{sub.assessmentPeriod}</td>
                    <td className="px-3 py-2.5 truncate max-w-[150px]" title={sub.fileName}>
                      <div className="flex items-center gap-1 text-[#8d90a0]">
                        {sub.fileType === 'JSON' ? (
                          <FileCode className="w-3 h-3 text-[#f59e0b]" />
                        ) : (
                          <FileText className="w-3 h-3 text-[#4cd7f6]" />
                        )}
                        <span className="truncate">{sub.fileName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[#10b981] font-bold">{sub.validRecordCount}</span>
                      <span className="text-[#8d90a0]"> / {sub.recordCount}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sub.dataQualityStatus === 'VALID'
                            ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                            : sub.dataQualityStatus === 'WARNINGS'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                            : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                        }`}
                      >
                        {sub.dataQualityStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#4cd7f6] font-semibold">
                      {sub.completenessPercentage}%
                    </td>
                    <td className="px-3 py-2.5 text-[#8d90a0] text-[11px]">
                      {new Date(sub.importedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      {new Date(sub.importedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-analyze-negative-space-${sub.submissionId}`}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setModalInitialTab('NEGATIVE_SPACE');
                          }}
                          className="px-2 py-1 rounded bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                          title="Run deterministic RULE-NS-ESC-01 negative space analysis"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Analyze Negative Space</span>
                        </button>
                        <button
                          id={`btn-analyze-gaps-${sub.submissionId}`}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setModalInitialTab('EXECUTION_GAPS');
                          }}
                          className="px-2 py-1 rounded bg-[#ef4444]/10 text-[#f87171] hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                          title="Run deterministic RULE-ESC-04 execution gap analysis"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Analyze Execution Gaps</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setModalInitialTab('NORMALIZED');
                          }}
                          className="px-2 py-1 rounded bg-[#1A243B] text-[#4cd7f6] hover:bg-[#223050] border border-[#1E293B] text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => handleDelete(sub.submissionId)}
                          className="p-1 rounded text-[#8d90a0] hover:text-[#ef4444] hover:bg-[#93000a]/20 transition-colors"
                          title="Purge submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Inspector */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          initialTab={modalInitialTab}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};
