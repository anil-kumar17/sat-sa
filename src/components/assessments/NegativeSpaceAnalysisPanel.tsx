import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  FileCode,
  Layers,
  Search,
  EyeOff
} from 'lucide-react';
import {
  CSESubmission,
  SourceRecord
} from '../../types/submission';
import {
  NegativeSpaceResult,
  NegativeSpaceClassification
} from '../../types/negativeSpace';

interface NegativeSpaceAnalysisPanelProps {
  result: NegativeSpaceResult;
  submission?: CSESubmission | null;
  sourceRecords?: SourceRecord[];
}

export const NegativeSpaceAnalysisPanel: React.FC<NegativeSpaceAnalysisPanelProps> = ({
  result,
  submission,
  sourceRecords = []
}) => {
  const [filterState, setFilterState] = useState<
    'ALL' | NegativeSpaceClassification
  >('ALL');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick lookup for source records if available
  const sourceRecordMap = useMemo(() => {
    const map = new Map<string, SourceRecord>();
    for (const src of sourceRecords) {
      map.set(src.id, src);
    }
    return map;
  }, [sourceRecords]);

  // Filtered case evaluations
  const filteredCases = useMemo(() => {
    let list = result.caseEvaluations;
    if (filterState !== 'ALL') {
      list = list.filter((c) => c.classification === filterState);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.caseId.toLowerCase().includes(q) ||
          c.sourceRecordId.toLowerCase().includes(q) ||
          (c.disposition && c.disposition.toLowerCase().includes(q)) ||
          c.reason.toLowerCase().includes(q)
      );
    }
    return list;
  }, [result.caseEvaluations, filterState, searchQuery]);

  const toggleExpand = (caseId: string) => {
    setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
  };

  return (
    <div id="negative-space-analysis-panel" className="space-y-4">
      {/* Rule Header Banner */}
      <div className="p-4 rounded-lg bg-[#0E1738] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              {result.ruleCode}
            </span>
            <span className="text-xs font-mono text-[#8d90a0] uppercase tracking-wider">
              {result.ruleCategory} Analysis
            </span>
            <span className="text-xs font-mono text-[#8d90a0]">
              Scope: CRITICAL Operational Cases Only
            </span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#1A243B] text-[#dde2f7] border border-[#1E293B]">
              Period: {result.assessmentPeriod}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#dde2f7] flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#38BDF8]" />
            <span>{result.ruleName}</span>
          </h3>
          <p className="text-xs text-[#8d90a0] max-w-3xl">
            {result.ruleDescription}
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end justify-center gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded bg-[#090D16] border border-[#38BDF8]/30 text-right">
            <span className="text-[10px] font-mono text-[#8d90a0] block uppercase">
              Absence Rate (Pure Denominator)
            </span>
            <span
              className={`text-base font-mono font-bold ${
                result.absenceRate > 0 ? 'text-[#f87171]' : 'text-[#10b981]'
              }`}
            >
              {result.absenceRate}%
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#8d90a0]">
            Valid Baseline: {result.expectedEvidenceCount} of {result.applicableCaseCount} Cases
          </span>
        </div>
      </div>

      {/* Core Safety Principle Notice */}
      <div className="p-3 rounded-lg bg-[#090D16] border border-[#38BDF8]/20 flex items-start gap-2.5 text-xs text-[#8d90a0]">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#dde2f7] block">
            Supervisory Principle: Absence of Evidence ≠ Proof of Non-Occurrence
          </span>
          <p>
            Negative-space analysis identifies where expected escalation activity is missing from submitted records.
            It distinguishes complete observations from data-quality limitations and inconclusive boundary states.
            The engine never automatically asserts misconduct or confirmed control failure.
          </p>
        </div>
      </div>

      {/* Metric Cards (Required by Section 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Applicable Cases */}
        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Applicable Cases
          </span>
          <span className="text-lg font-bold font-mono text-[#4cd7f6]">
            {result.applicableCaseCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Critical Cases
          </span>
        </div>

        {/* Expected Evidence */}
        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Expected Evidence
          </span>
          <span className="text-lg font-bold font-mono text-[#dde2f7]">
            {result.expectedEvidenceCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Valid Denominator
          </span>
        </div>

        {/* Evidence Present */}
        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Evidence Present
          </span>
          <span className="text-lg font-bold font-mono text-[#10b981]">
            {result.evidencePresentCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Observed Escalation
          </span>
        </div>

        {/* Evidence Not Present */}
        <div
          className={`p-3 rounded border ${
            result.absentEvidenceCount > 0
              ? 'bg-[#93000a]/15 border-[#ef4444]/40'
              : 'bg-[#090D16] border-[#1E293B]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Evidence Not Present
          </span>
          <span
            className={`text-lg font-bold font-mono ${
              result.absentEvidenceCount > 0 ? 'text-[#f87171]' : 'text-[#10b981]'
            }`}
          >
            {result.absentEvidenceCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Potential Blind Spots
          </span>
        </div>

        {/* Data Quality Limited */}
        <div
          className={`p-3 rounded border ${
            result.dataQualityLimitedCount > 0
              ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
              : 'bg-[#090D16] border-[#1E293B]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Data Quality Limited
          </span>
          <span
            className={`text-lg font-bold font-mono ${
              result.dataQualityLimitedCount > 0 ? 'text-[#fde047]' : 'text-[#8d90a0]'
            }`}
          >
            {result.dataQualityLimitedCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Excluded from Numerator
          </span>
        </div>

        {/* Inconclusive */}
        <div
          className={`p-3 rounded border ${
            result.inconclusiveCount > 0
              ? 'bg-[#a855f7]/10 border-[#a855f7]/30'
              : 'bg-[#090D16] border-[#1E293B]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Inconclusive
          </span>
          <span
            className={`text-lg font-bold font-mono ${
              result.inconclusiveCount > 0 ? 'text-[#c084fc]' : 'text-[#8d90a0]'
            }`}
          >
            {result.inconclusiveCount}
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Boundary / Maintenance
          </span>
        </div>

        {/* Absence Rate */}
        <div
          className={`p-3 rounded border ${
            result.absenceRate > 0
              ? 'bg-[#93000a]/15 border-[#ef4444]/40'
              : 'bg-[#090D16] border-[#1E293B]'
          }`}
        >
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Absence Rate
          </span>
          <span
            className={`text-lg font-bold font-mono ${
              result.absenceRate > 0 ? 'text-[#f87171]' : 'text-[#10b981]'
            }`}
          >
            {result.absenceRate}%
          </span>
          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            absent / valid expected
          </span>
        </div>
      </div>

      {/* Restrained Deterministic Interpretation Box */}
      <div className="p-3.5 rounded-lg bg-[#0E1738] border border-[#1E293B] space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider shrink-0 mt-0.5">
            Deterministic Interpretation:
          </span>
          <p className="text-xs text-[#dde2f7] leading-relaxed">
            {result.interpretation}
          </p>
        </div>

        {/* Warnings & Exclusions */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="pt-2 border-t border-[#1E293B]/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#8d90a0]">Safeguards:</span>
            {result.warnings.map((w, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1A243B] text-[#94a3b8] border border-[#1E293B]"
              >
                <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
                <span>{w}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Case Ledger with Filtering (Section 15) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-mono font-bold text-[#dde2f7] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Negative-Space Case Ledger</span>
            </h4>
            <span className="text-[11px] font-mono text-[#8d90a0]">
              ({filteredCases.length} of {result.totalEvaluatedCases} records)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
              <input
                id="search-negative-space-cases"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, source ID, disposition..."
                className="pl-8 pr-3 py-1 bg-[#090D16] border border-[#1E293B] rounded text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8] w-48 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            id="filter-ns-all"
            onClick={() => setFilterState('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'ALL'
                ? 'bg-[#38BDF8] text-[#0B132B] font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#dde2f7] border border-[#1E293B]'
            }`}
          >
            All ({result.totalEvaluatedCases})
          </button>

          <button
            id="filter-ns-present"
            onClick={() => setFilterState('EVIDENCE_PRESENT')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'EVIDENCE_PRESENT'
                ? 'bg-[#10b981] text-[#0B132B] font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#10b981] border border-[#1E293B]'
            }`}
          >
            Evidence Present ({result.evidencePresentCount})
          </button>

          <button
            id="filter-ns-not-present"
            onClick={() => setFilterState('EVIDENCE_NOT_PRESENT')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'EVIDENCE_NOT_PRESENT'
                ? 'bg-[#ef4444] text-white font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#f87171] border border-[#1E293B]'
            }`}
          >
            Evidence Not Present ({result.absentEvidenceCount})
          </button>

          <button
            id="filter-ns-data-quality"
            onClick={() => setFilterState('DATA_QUALITY_LIMITED')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'DATA_QUALITY_LIMITED'
                ? 'bg-[#f59e0b] text-[#0B132B] font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#fde047] border border-[#1E293B]'
            }`}
          >
            Data Quality Limited ({result.dataQualityLimitedCount})
          </button>

          <button
            id="filter-ns-inconclusive"
            onClick={() => setFilterState('INCONCLUSIVE')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'INCONCLUSIVE'
                ? 'bg-[#a855f7] text-white font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#c084fc] border border-[#1E293B]'
            }`}
          >
            Inconclusive ({result.inconclusiveCount})
          </button>

          <button
            id="filter-ns-not-applicable"
            onClick={() => setFilterState('NOT_APPLICABLE')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'NOT_APPLICABLE'
                ? 'bg-[#475569] text-white font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#cbd5e1] border border-[#1E293B]'
            }`}
          >
            Not Applicable ({result.notApplicableCount})
          </button>
        </div>

        {/* Ledger Table */}
        <div className="border border-[#1E293B] rounded-lg overflow-hidden bg-[#090D16]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0E1738] text-[#8d90a0] border-b border-[#1E293B] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2">Case ID</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Classification</th>
                  <th className="px-3 py-2">Alert Timestamp</th>
                  <th className="px-3 py-2">Source Record</th>
                  <th className="px-3 py-2">Deterministic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#8d90a0]">
                      No cases match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const isExpanded = expandedCaseId === c.caseId;
                    const srcRecord = sourceRecordMap.get(c.sourceRecordId);

                    return (
                      <React.Fragment key={c.caseId}>
                        <tr
                          id={`ns-row-${c.caseId}`}
                          onClick={() => toggleExpand(c.caseId)}
                          className={`cursor-pointer transition-colors ${
                            c.classification === 'EVIDENCE_NOT_PRESENT'
                              ? 'bg-[#93000a]/10 hover:bg-[#93000a]/20'
                              : c.classification === 'DATA_QUALITY_LIMITED'
                              ? 'bg-[#f59e0b]/5 hover:bg-[#f59e0b]/15'
                              : c.classification === 'INCONCLUSIVE'
                              ? 'bg-[#a855f7]/5 hover:bg-[#a855f7]/15'
                              : 'hover:bg-[#1A243B]/60'
                          }`}
                        >
                          <td className="px-3 py-2 text-center text-[#8d90a0]">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </td>

                          {/* Case ID */}
                          <td className="px-3 py-2 font-bold text-[#dde2f7] whitespace-nowrap">
                            {c.caseId}
                          </td>

                          {/* Severity */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                c.severity === 'CRITICAL'
                                  ? 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
                                  : c.severity === 'HIGH'
                                  ? 'bg-[#f97316]/20 text-[#fb923c]'
                                  : c.severity === 'MEDIUM'
                                  ? 'bg-[#eab308]/20 text-[#fde047]'
                                  : 'bg-[#64748b]/20 text-[#94a3b8]'
                              }`}
                            >
                              {c.severity}
                            </span>
                          </td>

                          {/* Classification Badge */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {c.classification === 'EVIDENCE_PRESENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                                <CheckCircle2 className="w-3 h-3" />
                                EVIDENCE_PRESENT
                              </span>
                            ) : c.classification === 'EVIDENCE_NOT_PRESENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40 animate-pulse">
                                <EyeOff className="w-3 h-3" />
                                EVIDENCE_NOT_PRESENT
                              </span>
                            ) : c.classification === 'DATA_QUALITY_LIMITED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/20 text-[#fde047] border border-[#f59e0b]/40">
                                <AlertTriangle className="w-3 h-3" />
                                DATA_QUALITY_LIMITED
                              </span>
                            ) : c.classification === 'INCONCLUSIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
                                <HelpCircle className="w-3 h-3" />
                                INCONCLUSIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E293B] text-[#94a3b8]">
                                NOT_APPLICABLE
                              </span>
                            )}
                          </td>

                          {/* Alert Timestamp */}
                          <td className="px-3 py-2 text-[#8d90a0] whitespace-nowrap">
                            {c.alertTimestamp ? (
                              c.alertTimestamp.replace('T', ' ').substring(0, 19)
                            ) : (
                              <span className="text-[#ef4444]">Missing</span>
                            )}
                          </td>

                          {/* Source Record */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] text-[10px] border border-[#1E293B]">
                              {c.sourceRecordId}
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="px-3 py-2 text-[#dde2f7] max-w-xs truncate" title={c.reason}>
                            {c.reason}
                          </td>
                        </tr>

                        {/* Expanded Traceability Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#0B132B]/80 border-y border-[#1E293B]">
                            <td colSpan={7} className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Gate Evaluation Status */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Deterministic Pipeline Gates
                                  </span>

                                  <div className="space-y-1.5 text-xs font-mono">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">1. Applicability (Critical):</span>
                                      <span className={c.isApplicable ? 'text-[#10b981] font-bold' : 'text-[#8d90a0]'}>
                                        {c.isApplicable ? 'PASSED (Critical)' : 'NOT APPLICABLE'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">2. Completeness Gate:</span>
                                      <span className={c.passedCompletenessGate ? 'text-[#10b981] font-bold' : 'text-[#f59e0b] font-bold'}>
                                        {c.passedCompletenessGate ? 'PASSED (Complete)' : 'LIMITED'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">3. Observation Window:</span>
                                      <span className={c.passedObservationWindowGate ? 'text-[#10b981] font-bold' : 'text-[#c084fc] font-bold'}>
                                        {c.passedObservationWindowGate ? 'IN WINDOW' : 'BOUNDARY EXCLUDED'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">4. Evidence Recorded:</span>
                                      <span className={c.escalationTimestamp ? 'text-[#10b981] font-bold' : 'text-[#f87171] font-bold'}>
                                        {c.escalationTimestamp ? 'RECORDED' : 'NULL / ABSENT'}
                                      </span>
                                    </div>
                                  </div>

                                  {c.quietPeriodNote && (
                                    <div className="pt-2 border-t border-[#1E293B] text-[10px] font-mono text-[#f59e0b]">
                                      Note: {c.quietPeriodNote}
                                    </div>
                                  )}
                                </div>

                                {/* Operational Timestamps */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Operational Timeline
                                  </span>

                                  <div className="space-y-1 text-xs font-mono">
                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">Alert Timestamp</span>
                                      <span className="text-[#dde2f7]">{c.alertTimestamp || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">Triage Timestamp</span>
                                      <span className="text-[#dde2f7]">{c.triageTimestamp || 'NULL (Not recorded)'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">Escalation Timestamp</span>
                                      <span className={c.escalationTimestamp ? 'text-[#10b981]' : 'text-[#f87171] font-bold'}>
                                        {c.escalationTimestamp || 'NULL (Absent from observation set)'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">Disposition</span>
                                      <span className="text-[#dde2f7]">{c.disposition || 'None'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Full Deterministic Rationale */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Traceability & Supervisory Rationale
                                  </span>
                                  <p className="text-xs text-[#dde2f7] leading-relaxed">
                                    {c.reason}
                                  </p>

                                  <div className="pt-2 border-t border-[#1E293B] text-[11px] font-mono text-[#8d90a0]">
                                    <div>Source Record ID: <strong className="text-[#4cd7f6]">{c.sourceRecordId}</strong></div>
                                    <div>Submission ID: <strong className="text-[#dde2f7]">{c.submissionId}</strong></div>
                                  </div>
                                </div>
                              </div>

                              {/* Raw Payload Traceability Viewer */}
                              <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase flex items-center gap-1.5 font-bold">
                                    <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                                    <span>Immutable Raw Source Payload (Traceability Anchor)</span>
                                  </span>

                                  {srcRecord?.sha256Fingerprint && (
                                    <span className="text-[10px] font-mono text-[#4cd7f6] flex items-center gap-1">
                                      <Fingerprint className="w-3 h-3" />
                                      <span>SHA-256: {srcRecord.sha256Fingerprint.substring(0, 16)}...</span>
                                    </span>
                                  )}
                                </div>

                                <pre className="p-2.5 rounded bg-black/60 border border-[#1E293B] text-[11px] font-mono text-[#a5f3fc] overflow-x-auto max-h-48">
                                  {JSON.stringify(srcRecord?.rawPayload || c.rawPayloadSnippet || {}, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
