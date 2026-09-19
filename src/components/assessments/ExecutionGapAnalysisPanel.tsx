import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  ExecutionGapResult,
  CaseExecutionGapEvaluation
} from '../../types/analytics';
import { SourceRecord, CSESubmission } from '../../types/submission';
import { findingService } from '../../services/findingService';

interface ExecutionGapAnalysisPanelProps {
  result: ExecutionGapResult;
  sourceRecords?: SourceRecord[];
  submission?: CSESubmission;
  compact?: boolean;
  onInspectSourceRecord?: (sourceRecordId: string) => void;
}

export const ExecutionGapAnalysisPanel: React.FC<ExecutionGapAnalysisPanelProps> = ({
  result,
  sourceRecords = [],
  submission,
  compact = false,
  onInspectSourceRecord
}) => {
  const navigate = useNavigate();
  const { summary, caseEvaluations } = result;
  const [filterState, setFilterState] = useState<'ALL' | 'GAPS' | 'PRESENT' | 'NOT_APPLICABLE'>('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [isCreatingFinding, setIsCreatingFinding] = useState<boolean>(false);

  const handleInvestigateFinding = async () => {
    if (!submission) return;
    setIsCreatingFinding(true);
    try {
      const genResult = await findingService.generateFindingFromExecutionGap(
        submission,
        result,
        sourceRecords
      );
      if (genResult.finding) {
        navigate(`/findings/${genResult.finding.id}`);
      }
    } catch (err) {
      console.error('Failed to generate finding from execution gap:', err);
    } finally {
      setIsCreatingFinding(false);
    }
  };

  // Quick lookup for source records if provided
  const sourceRecordMap = useMemo(() => {
    const map = new Map<string, SourceRecord>();
    for (const src of sourceRecords) {
      map.set(src.id, src);
    }
    return map;
  }, [sourceRecords]);

  const filteredEvaluations = useMemo(() => {
    if (filterState === 'GAPS') {
      return caseEvaluations.filter((c) => c.hasExecutionGap);
    }
    if (filterState === 'PRESENT') {
      return caseEvaluations.filter((c) => c.evidenceStatus === 'EVIDENCE_PRESENT');
    }
    if (filterState === 'NOT_APPLICABLE') {
      return caseEvaluations.filter((c) => !c.isApplicable);
    }
    return caseEvaluations;
  }, [caseEvaluations, filterState]);

  const toggleExpand = (caseId: string) => {
    setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
  };

  return (
    <div id="execution-gap-analysis-panel" className="space-y-4">
      {/* Rule Header Banner */}
      <div className="p-4 rounded-lg bg-[#0E1738] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30">
              {summary.ruleCode}
            </span>
            <span className="text-xs font-mono text-[#4cd7f6] uppercase tracking-wider">
              {summary.ruleCategory}
            </span>
            <span className="text-xs font-mono text-[#8d90a0]">
              Target: {summary.targetSeverity} Cases Only
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#dde2f7] flex items-center gap-2">
            {summary.ruleName}
          </h3>
          <p className="text-xs text-[#8d90a0] max-w-3xl">
            {summary.ruleDescription}
          </p>
        </div>

        <div className="flex md:flex-col items-end justify-between md:justify-center gap-1 text-right">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Data Quality State
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
              summary.overallDataQuality === 'SUFFICIENT'
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                : summary.overallDataQuality === 'DATA_QUALITY_LIMITED'
                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
            }`}
          >
            {summary.overallDataQuality === 'SUFFICIENT'
              ? 'SUFFICIENT DATA'
              : summary.overallDataQuality === 'DATA_QUALITY_LIMITED'
              ? 'DATA QUALITY LIMITED'
              : 'INSUFFICIENT DATA'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Evaluated Cases
          </span>
          <span className="text-lg font-bold font-mono text-[#dde2f7]">
            {summary.totalEvaluatedCases}
          </span>
        </div>

        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Applicable (Critical)
          </span>
          <span className="text-lg font-bold font-mono text-[#4cd7f6]">
            {summary.applicableCaseCount}
          </span>
        </div>

        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Expected Escalations
          </span>
          <span className="text-lg font-bold font-mono text-[#dde2f7]">
            {summary.expectedCount}
          </span>
        </div>

        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Observed Escalations
          </span>
          <span className="text-lg font-bold font-mono text-[#10b981]">
            {summary.observedCount}
          </span>
        </div>

        <div className={`p-3 rounded border ${
          summary.gapCount > 0
            ? 'bg-[#93000a]/20 border-[#ef4444]/40'
            : 'bg-[#090D16] border-[#1E293B]'
        }`}>
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Potential Gaps
          </span>
          <span className={`text-lg font-bold font-mono ${
            summary.gapCount > 0 ? 'text-[#f87171]' : 'text-[#10b981]'
          }`}>
            {summary.gapCount}
          </span>
        </div>

        <div className={`p-3 rounded border ${
          summary.gapRate > 0
            ? 'bg-[#93000a]/20 border-[#ef4444]/40'
            : 'bg-[#090D16] border-[#1E293B]'
        }`}>
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Execution Gap Rate
          </span>
          <span className={`text-lg font-bold font-mono ${
            summary.gapRate > 0 ? 'text-[#f87171]' : 'text-[#10b981]'
          }`}>
            {summary.gapRate}%
          </span>
        </div>
      </div>

      {/* Supervisory Summary Statement Callout */}
      <div
        className={`p-3.5 rounded-lg border flex items-start gap-3 ${
          summary.gapCount > 0
            ? 'bg-[#93000a]/15 border-[#ef4444]/40'
            : 'bg-[#10b981]/10 border-[#10b981]/30'
        }`}
      >
        {summary.gapCount > 0 ? (
          <ShieldAlert className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wide text-[#dde2f7]">
              Supervisory Determination
            </span>
            <span className="text-[11px] font-mono text-[#8d90a0]">
              Evaluated {new Date(summary.evaluatedAt).toLocaleTimeString()} UTC
            </span>
          </div>
          <p className="text-xs font-medium text-[#dde2f7] leading-relaxed">
            {summary.summaryStatement}
          </p>
          {summary.gapCount > 0 && submission && (
            <div className="pt-2">
              <button
                id="btn-investigate-formal-finding"
                onClick={handleInvestigateFinding}
                disabled={isCreatingFinding}
                className="px-3 py-1.5 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <span>{isCreatingFinding ? 'Preparing Finding Dossier...' : 'Investigate Formal Finding & Traceability Chain'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings Banner if any */}
      {summary.warnings.length > 0 && (
        <div className="p-3 rounded bg-[#78350f]/20 border border-[#f59e0b]/40 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#fde047]">
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
            <span>Supervisory Data Quality Limitations ({summary.warnings.length}):</span>
          </div>
          <ul className="text-xs text-[#fde047]/90 space-y-0.5 pl-6 list-disc font-mono">
            {summary.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence Traceability Chain */}
      <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] text-xs font-mono">
        <div className="text-[11px] text-[#8d90a0] mb-2 font-semibold">
          EVIDENCE TRACEABILITY PIPELINE
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[#c3c6d7] text-[11px]">
          <span className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#f87171]">
            RULE-ESC-04
          </span>
          <ArrowRight className="w-3 h-3 text-[#8d90a0]" />
          <span className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#4cd7f6]">
            Execution Gap Result ({summary.gapCount} Gaps)
          </span>
          <ArrowRight className="w-3 h-3 text-[#8d90a0]" />
          <span className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#dde2f7]">
            Affected Cases ({summary.affectedCaseIds.length})
          </span>
          <ArrowRight className="w-3 h-3 text-[#8d90a0]" />
          <span className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#38BDF8]">
            SourceRecord IDs ({summary.evidenceRecordIds.length})
          </span>
          <ArrowRight className="w-3 h-3 text-[#8d90a0]" />
          <span className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#10b981]">
            Immutable Raw Payloads
          </span>
        </div>
      </div>

      {/* Case-Level Breakdown */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#dde2f7]">
              Case Evaluation Ledger ({filteredEvaluations.length})
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterState('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                filterState === 'ALL'
                  ? 'bg-[#38BDF8] text-[#0B132B] font-bold'
                  : 'bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              All Cases ({caseEvaluations.length})
            </button>
            <button
              onClick={() => setFilterState('GAPS')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                filterState === 'GAPS'
                  ? 'bg-[#ef4444] text-white font-bold'
                  : 'bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Potential Gaps ({summary.gapCount})
            </button>
            <button
              onClick={() => setFilterState('PRESENT')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                filterState === 'PRESENT'
                  ? 'bg-[#10b981] text-[#0B132B] font-bold'
                  : 'bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Evidence Present ({summary.observedCount})
            </button>
            <button
              onClick={() => setFilterState('NOT_APPLICABLE')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                filterState === 'NOT_APPLICABLE'
                  ? 'bg-[#8d90a0] text-[#0B132B] font-bold'
                  : 'bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7]'
              }`}
            >
              Non-Critical ({caseEvaluations.length - summary.applicableCaseCount})
            </button>
          </div>
        </div>

        {/* Evaluations Table */}
        <div className="overflow-x-auto border border-[#1E293B] rounded bg-[#090D16]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#101935] text-[#8d90a0] uppercase text-[10px] border-b border-[#1E293B]">
              <tr>
                <th className="px-3 py-2">Case ID</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Alert Time (UTC)</th>
                <th className="px-3 py-2">Escalation Expected</th>
                <th className="px-3 py-2">Observed Evidence</th>
                <th className="px-3 py-2">Supervisory Status</th>
                <th className="px-3 py-2">Source Trace ID</th>
                <th className="px-3 py-2 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
              {filteredEvaluations.map((evalCase) => {
                const isExpanded = expandedCaseId === evalCase.caseId;
                const srcRecord = sourceRecordMap.get(evalCase.sourceRecordId);

                return (
                  <React.Fragment key={evalCase.caseId}>
                    <tr
                      onClick={() => toggleExpand(evalCase.caseId)}
                      className={`cursor-pointer transition-colors ${
                        evalCase.hasExecutionGap
                          ? 'bg-[#93000a]/10 hover:bg-[#93000a]/20'
                          : 'hover:bg-[#131B2E]/60'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-bold text-[#dde2f7] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {evalCase.hasExecutionGap && (
                            <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                          )}
                          <span>{evalCase.caseId}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            evalCase.severity === 'CRITICAL'
                              ? 'bg-[#93000a]/50 text-[#ffdad6] border border-[#ffdad6]/20'
                              : evalCase.severity === 'HIGH'
                              ? 'bg-[#78350f]/50 text-[#fde047]'
                              : evalCase.severity === 'MEDIUM'
                              ? 'bg-[#1E293B] text-[#38BDF8]'
                              : 'bg-[#1E293B] text-[#94a3b8]'
                          }`}
                        >
                          {evalCase.severity}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-[#8d90a0] whitespace-nowrap text-[11px]">
                        {evalCase.alertTimestamp ? evalCase.alertTimestamp.replace('T', ' ').replace('Z', '') : '—'}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {evalCase.escalationExpected ? (
                          <span className="text-[#38BDF8] font-bold">YES</span>
                        ) : (
                          <span className="text-[#8d90a0]">NO</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {evalCase.escalationTimestamp ? (
                          <span className="text-[#10b981] font-mono text-[11px]">
                            {evalCase.escalationTimestamp.replace('T', ' ').replace('Z', '')}
                          </span>
                        ) : evalCase.escalationObserved ? (
                          <span className="text-[#10b981] font-bold">YES</span>
                        ) : (
                          <span className="text-[#8d90a0] italic">None recorded</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evalCase.evidenceStatus === 'EVIDENCE_PRESENT'
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                              : evalCase.evidenceStatus === 'EVIDENCE_NOT_PRESENT'
                              ? 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/30'
                              : evalCase.evidenceStatus === 'DATA_QUALITY_LIMITED'
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                              : 'bg-[#1E293B] text-[#8d90a0]'
                          }`}
                        >
                          {evalCase.evidenceStatus === 'EVIDENCE_NOT_PRESENT'
                            ? 'POTENTIAL GAP'
                            : evalCase.evidenceStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-[#4cd7f6] whitespace-nowrap text-[11px]">
                        <code>{evalCase.sourceRecordId}</code>
                      </td>

                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(evalCase.caseId);
                          }}
                          className="p-1 rounded text-[#8d90a0] hover:text-[#dde2f7] hover:bg-[#1A243B] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <tr className="bg-[#0B132B]/90 border-b border-[#1E293B]">
                        <td colSpan={8} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#090D16] p-3 rounded border border-[#1E293B]">
                            <div>
                              <span className="text-[10px] text-[#8d90a0] uppercase block font-mono">
                                Rule Diagnostic Reason
                              </span>
                              <span className="text-[#dde2f7] font-sans font-medium text-xs block mt-0.5">
                                {evalCase.reason}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#8d90a0] uppercase block font-mono">
                                Operational Disposition
                              </span>
                              <span className="text-[#4cd7f6] font-mono text-xs block mt-0.5">
                                {evalCase.disposition || 'NO_DISPOSITION_RECORDED'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#8d90a0] uppercase block font-mono">
                                Immutable Source Trace ID
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[#38BDF8] font-mono text-xs">
                                  {evalCase.sourceRecordId}
                                </span>
                                {onInspectSourceRecord && (
                                  <button
                                    onClick={() => onInspectSourceRecord(evalCase.sourceRecordId)}
                                    className="px-1.5 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] hover:bg-[#223050] text-[10px]"
                                  >
                                    Inspect Raw
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#8d90a0] uppercase block font-mono">
                                Supervisory Recommendation
                              </span>
                              <span className="text-[#dde2f7] text-xs block mt-0.5">
                                {evalCase.hasExecutionGap
                                  ? 'Request operational justification or incident ticket export from entity.'
                                  : 'Compliant with rule expectation.'}
                              </span>
                            </div>
                          </div>

                          {/* Preserved Raw Payload Snippet */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-[#8d90a0] font-mono">
                              <span className="flex items-center gap-1.5">
                                <FileCode className="w-3.5 h-3.5 text-[#4cd7f6]" />
                                <span>Preserved Original Source Record Payload:</span>
                              </span>
                              {srcRecord && (
                                <span>SHA-256: {srcRecord.sha256Fingerprint.substring(0, 16)}...</span>
                              )}
                            </div>
                            <pre className="p-2.5 rounded bg-[#070A10] border border-[#1E293B] text-[#8d90a0] text-[11px] font-mono overflow-x-auto max-h-40">
                              {JSON.stringify(
                                srcRecord?.rawPayload || evalCase.rawPayloadSnippet || {},
                                null,
                                2
                              )}
                            </pre>
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
    </div>
  );
};
