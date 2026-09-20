import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
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

export const NegativeSpaceAnalysisPanel: React.FC<
  NegativeSpaceAnalysisPanelProps
> = ({
  result,
  submission,
  sourceRecords = []
}) => {
  const [filterState, setFilterState] = useState<
    'ALL' | NegativeSpaceClassification
  >('ALL');

  const [expandedCaseId, setExpandedCaseId] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const sourceRecordMap = useMemo(() => {
    const map = new Map<string, SourceRecord>();

    for (const sourceRecord of sourceRecords) {
      map.set(sourceRecord.id, sourceRecord);
    }

    return map;
  }, [sourceRecords]);

  const filteredCases = useMemo(() => {
    let list = result.caseEvaluations;

    if (filterState !== 'ALL') {
      list = list.filter(
        evaluation =>
          evaluation.classification === filterState
      );
    }

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      list = list.filter(evaluation => {
        const caseId =
          evaluation.caseId?.toLowerCase() || '';

        const sourceRecordId =
          evaluation.sourceRecordId?.toLowerCase() || '';

        const disposition =
          evaluation.disposition?.toLowerCase() || '';

        const reason =
          evaluation.reason?.toLowerCase() || '';

        return (
          caseId.includes(query) ||
          sourceRecordId.includes(query) ||
          disposition.includes(query) ||
          reason.includes(query)
        );
      });
    }

    return list;
  }, [
    result.caseEvaluations,
    filterState,
    searchQuery
  ]);

  const toggleExpand = (caseId: string) => {
    setExpandedCaseId(previous =>
      previous === caseId ? null : caseId
    );
  };

  const getClassificationLabel = (
    classification: NegativeSpaceClassification
  ) => {
    switch (classification) {
      case 'EVIDENCE_PRESENT':
        return 'EVIDENCE PRESENT';

      case 'EVIDENCE_NOT_PRESENT':
        return 'EVIDENCE NOT PRESENT';

      case 'DATA_QUALITY_LIMITED':
        return 'DATA QUALITY LIMITED';

      case 'INCONCLUSIVE':
        return 'INCONCLUSIVE';

      case 'NOT_APPLICABLE':
        return 'NOT APPLICABLE';

      default:
        return classification;
    }
  };

  return (
    <div
      id="negative-space-analysis-panel"
      className="space-y-4"
    >
      {/* Rule header */}
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
              Scope: CRITICAL Operational Cases
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
              Absence Rate
            </span>

            <span
              className={`text-base font-mono font-bold ${
                result.absenceRate > 0
                  ? 'text-[#f87171]'
                  : 'text-[#10b981]'
              }`}
            >
              {result.absenceRate}%
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#8d90a0]">
            Valid baseline: {result.expectedEvidenceCount} of{' '}
            {result.applicableCaseCount} applicable cases
          </span>
        </div>
      </div>

      {/* Core safety principle */}
      <div className="p-3 rounded-lg bg-[#090D16] border border-[#38BDF8]/20 flex items-start gap-2.5 text-xs text-[#8d90a0]">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />

        <div className="space-y-0.5">
          <span className="font-bold text-[#dde2f7] block">
            Supervisory Principle: Absence of Evidence ≠ Proof of Non-Occurrence
          </span>

          <p>
            Negative-space analysis identifies expected escalation
            evidence that is not present in the submitted observation
            set. Data-quality limitations and inconclusive observation
            states are kept outside the valid absence denominator.
            The engine does not assert misconduct or confirmed control
            failure.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Valid Applicable
          </span>

          <span className="text-lg font-bold font-mono text-[#4cd7f6]">
            {result.applicableCaseCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Passed all gates
          </span>
        </div>

        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Expected Evidence
          </span>

          <span className="text-lg font-bold font-mono text-[#dde2f7]">
            {result.expectedEvidenceCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Valid denominator
          </span>
        </div>

        <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase block">
            Evidence Present
          </span>

          <span className="text-lg font-bold font-mono text-[#10b981]">
            {result.evidencePresentCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Observed evidence
          </span>
        </div>

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
              result.absentEvidenceCount > 0
                ? 'text-[#f87171]'
                : 'text-[#10b981]'
            }`}
          >
            {result.absentEvidenceCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Potential blind spots
          </span>
        </div>

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
              result.dataQualityLimitedCount > 0
                ? 'text-[#fde047]'
                : 'text-[#8d90a0]'
            }`}
          >
            {result.dataQualityLimitedCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Excluded from denominator
          </span>
        </div>

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
              result.inconclusiveCount > 0
                ? 'text-[#c084fc]'
                : 'text-[#8d90a0]'
            }`}
          >
            {result.inconclusiveCount}
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            Window / context
          </span>
        </div>

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
              result.absenceRate > 0
                ? 'text-[#f87171]'
                : 'text-[#10b981]'
            }`}
          >
            {result.absenceRate}%
          </span>

          <span className="text-[9px] font-mono text-[#8d90a0] block mt-0.5">
            absent / valid expected
          </span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="p-3.5 rounded-lg bg-[#0E1738] border border-[#1E293B] space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider shrink-0 mt-0.5">
            Deterministic Interpretation:
          </span>

          <p className="text-xs text-[#dde2f7] leading-relaxed">
            {result.interpretation}
          </p>
        </div>

        {result.warnings.length > 0 && (
          <div className="pt-2 border-t border-[#1E293B]/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#8d90a0]">
              Safeguards:
            </span>

            {result.warnings.map((warning, index) => (
              <span
                key={`${warning}-${index}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1A243B] text-[#94a3b8] border border-[#1E293B]"
              >
                <AlertTriangle className="w-3 h-3 text-[#f59e0b]" />
                <span>{warning}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Case ledger */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-mono font-bold text-[#dde2f7] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Negative-Space Case Ledger</span>
            </h4>

            <span className="text-[11px] font-mono text-[#8d90a0]">
              ({filteredCases.length} of{' '}
              {result.totalEvaluatedCases} records)
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

            <input
              id="search-negative-space-cases"
              type="text"
              value={searchQuery}
              onChange={event =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search case, source ID, disposition..."
              className="pl-8 pr-3 py-1 bg-[#090D16] border border-[#1E293B] rounded text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8] w-64 font-mono"
            />
          </div>
        </div>

        {/* Filters */}
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
            onClick={() =>
              setFilterState('EVIDENCE_PRESENT')
            }
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
            onClick={() =>
              setFilterState('EVIDENCE_NOT_PRESENT')
            }
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
            onClick={() =>
              setFilterState('DATA_QUALITY_LIMITED')
            }
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'DATA_QUALITY_LIMITED'
                ? 'bg-[#f59e0b] text-[#0B132B] font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#fde047] border border-[#1E293B]'
            }`}
          >
            Data Quality Limited (
            {result.dataQualityLimitedCount})
          </button>

          <button
            id="filter-ns-inconclusive"
            onClick={() =>
              setFilterState('INCONCLUSIVE')
            }
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
            onClick={() =>
              setFilterState('NOT_APPLICABLE')
            }
            className={`px-2.5 py-1 rounded transition-colors ${
              filterState === 'NOT_APPLICABLE'
                ? 'bg-[#475569] text-white font-bold'
                : 'bg-[#090D16] text-[#8d90a0] hover:text-[#cbd5e1] border border-[#1E293B]'
            }`}
          >
            Not Applicable ({result.notApplicableCount})
          </button>
        </div>

        {/* Ledger table */}
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
                  <th className="px-3 py-2">
                    Deterministic Reason
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]/60 text-[#c3c6d7]">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-[#8d90a0]"
                    >
                      No cases match the selected filter
                      criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(caseEvaluation => {
                    const isExpanded =
                      expandedCaseId ===
                      caseEvaluation.caseId;

                    const sourceRecord =
                      caseEvaluation.sourceRecordId
                        ? sourceRecordMap.get(
                            caseEvaluation.sourceRecordId
                          )
                        : undefined;

                    return (
                      <React.Fragment
                        key={`${caseEvaluation.caseId}-${caseEvaluation.sourceRecordId || 'no-source'}`}
                      >
                        <tr
                          id={`ns-row-${caseEvaluation.caseId}`}
                          onClick={() =>
                            toggleExpand(
                              caseEvaluation.caseId
                            )
                          }
                          className={`cursor-pointer transition-colors ${
                            caseEvaluation.classification ===
                            'EVIDENCE_NOT_PRESENT'
                              ? 'bg-[#93000a]/10 hover:bg-[#93000a]/20'
                              : caseEvaluation.classification ===
                                'DATA_QUALITY_LIMITED'
                              ? 'bg-[#f59e0b]/5 hover:bg-[#f59e0b]/15'
                              : caseEvaluation.classification ===
                                'INCONCLUSIVE'
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

                          <td className="px-3 py-2 font-bold text-[#dde2f7] whitespace-nowrap">
                            {caseEvaluation.caseId}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                caseEvaluation.severity ===
                                'CRITICAL'
                                  ? 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
                                  : caseEvaluation.severity ===
                                    'HIGH'
                                  ? 'bg-[#f97316]/20 text-[#fb923c]'
                                  : caseEvaluation.severity ===
                                    'MEDIUM'
                                  ? 'bg-[#eab308]/20 text-[#fde047]'
                                  : 'bg-[#64748b]/20 text-[#94a3b8]'
                              }`}
                            >
                              {caseEvaluation.severity}
                            </span>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            {caseEvaluation.classification ===
                            'EVIDENCE_PRESENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                                <CheckCircle2 className="w-3 h-3" />
                                {getClassificationLabel(
                                  caseEvaluation.classification
                                )}
                              </span>
                            ) : caseEvaluation.classification ===
                              'EVIDENCE_NOT_PRESENT' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40">
                                <EyeOff className="w-3 h-3" />
                                {getClassificationLabel(
                                  caseEvaluation.classification
                                )}
                              </span>
                            ) : caseEvaluation.classification ===
                              'DATA_QUALITY_LIMITED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/20 text-[#fde047] border border-[#f59e0b]/40">
                                <AlertTriangle className="w-3 h-3" />
                                {getClassificationLabel(
                                  caseEvaluation.classification
                                )}
                              </span>
                            ) : caseEvaluation.classification ===
                              'INCONCLUSIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40">
                                <HelpCircle className="w-3 h-3" />
                                {getClassificationLabel(
                                  caseEvaluation.classification
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E293B] text-[#94a3b8]">
                                {getClassificationLabel(
                                  caseEvaluation.classification
                                )}
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2 text-[#8d90a0] whitespace-nowrap">
                            {caseEvaluation.alertTimestamp ? (
                              caseEvaluation.alertTimestamp
                                .replace('T', ' ')
                                .substring(0, 19)
                            ) : (
                              <span className="text-[#ef4444]">
                                Missing
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            {caseEvaluation.sourceRecordId ? (
                              <span className="px-1.5 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] text-[10px] border border-[#1E293B]">
                                {caseEvaluation.sourceRecordId}
                              </span>
                            ) : (
                              <span className="text-[#8d90a0]">
                                Not linked
                              </span>
                            )}
                          </td>

                          <td
                            className="px-3 py-2 text-[#dde2f7] max-w-xs truncate"
                            title={caseEvaluation.reason}
                          >
                            {caseEvaluation.reason}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#0B132B]/80 border-y border-[#1E293B]">
                            <td
                              colSpan={7}
                              className="p-4 space-y-3"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Gate status */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Deterministic Pipeline Gates
                                  </span>

                                  <div className="space-y-1.5 text-xs font-mono">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">
                                        1. Applicability:
                                      </span>

                                      <span
                                        className={
                                          caseEvaluation.isApplicable
                                            ? 'text-[#10b981] font-bold'
                                            : 'text-[#8d90a0]'
                                        }
                                      >
                                        {caseEvaluation.isApplicable
                                          ? 'APPLICABLE'
                                          : 'NOT APPLICABLE'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">
                                        2. Completeness:
                                      </span>

                                      <span
                                        className={
                                          caseEvaluation.passedCompletenessGate
                                            ? 'text-[#10b981] font-bold'
                                            : 'text-[#f59e0b] font-bold'
                                        }
                                      >
                                        {caseEvaluation.passedCompletenessGate
                                          ? 'PASSED'
                                          : 'LIMITED'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">
                                        3. Observation Window:
                                      </span>

                                      <span
                                        className={
                                          caseEvaluation.passedObservationWindowGate
                                            ? 'text-[#10b981] font-bold'
                                            : 'text-[#c084fc] font-bold'
                                        }
                                      >
                                        {caseEvaluation.passedObservationWindowGate
                                          ? 'VERIFIED'
                                          : 'NOT VERIFIED'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-[#8d90a0]">
                                        4. Evidence:
                                      </span>

                                      <span
                                        className={
                                          caseEvaluation.classification ===
                                          'EVIDENCE_PRESENT'
                                            ? 'text-[#10b981] font-bold'
                                            : caseEvaluation.classification ===
                                              'EVIDENCE_NOT_PRESENT'
                                            ? 'text-[#f87171] font-bold'
                                            : 'text-[#8d90a0] font-bold'
                                        }
                                      >
                                        {caseEvaluation.classification ===
                                        'EVIDENCE_PRESENT'
                                          ? 'PRESENT'
                                          : caseEvaluation.classification ===
                                            'EVIDENCE_NOT_PRESENT'
                                          ? 'NOT PRESENT'
                                          : 'NOT DETERMINATIVE'}
                                      </span>
                                    </div>
                                  </div>

                                  {caseEvaluation.quietPeriodNote && (
                                    <div className="pt-2 border-t border-[#1E293B] text-[10px] font-mono text-[#f59e0b]">
                                      Note:{' '}
                                      {caseEvaluation.quietPeriodNote}
                                    </div>
                                  )}
                                </div>

                                {/* Timeline */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Operational Timeline
                                  </span>

                                  <div className="space-y-1 text-xs font-mono">
                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">
                                        Alert Timestamp
                                      </span>
                                      <span className="text-[#dde2f7]">
                                        {caseEvaluation.alertTimestamp ||
                                          'Not recorded'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">
                                        Triage Timestamp
                                      </span>
                                      <span className="text-[#dde2f7]">
                                        {caseEvaluation.triageTimestamp ||
                                          'Not recorded'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">
                                        Escalation Timestamp
                                      </span>
                                      <span
                                        className={
                                          caseEvaluation.escalationTimestamp
                                            ? 'text-[#10b981]'
                                            : 'text-[#8d90a0]'
                                        }
                                      >
                                        {caseEvaluation.escalationTimestamp ||
                                          'Not recorded in observation set'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[#8d90a0] block text-[10px]">
                                        Disposition
                                      </span>
                                      <span className="text-[#dde2f7]">
                                        {caseEvaluation.disposition ||
                                          'Not recorded'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Rationale */}
                                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase block font-bold">
                                    Traceability & Supervisory Rationale
                                  </span>

                                  <p className="text-xs text-[#dde2f7] leading-relaxed">
                                    {caseEvaluation.reason}
                                  </p>

                                  <div className="pt-2 border-t border-[#1E293B] text-[11px] font-mono text-[#8d90a0] space-y-0.5">
                                    <div>
                                      Source Record ID:{' '}
                                      <strong className="text-[#4cd7f6]">
                                        {caseEvaluation.sourceRecordId ||
                                          'Not linked'}
                                      </strong>
                                    </div>

                                    <div>
                                      Submission ID:{' '}
                                      <strong className="text-[#dde2f7]">
                                        {caseEvaluation.submissionId}
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Source payload */}
                              <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] space-y-1.5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <span className="text-[10px] font-mono text-[#8d90a0] uppercase flex items-center gap-1.5 font-bold">
                                    <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                                    <span>
                                      Submitted Raw Source Payload
                                    </span>
                                  </span>

                                  {sourceRecord?.sha256Fingerprint && (
                                    <span className="text-[10px] font-mono text-[#4cd7f6] flex items-center gap-1">
                                      <Fingerprint className="w-3 h-3" />
                                      <span>
                                        SHA-256 fingerprint:{' '}
                                        {sourceRecord.sha256Fingerprint.substring(
                                          0,
                                          16
                                        )}
                                        ...
                                      </span>
                                    </span>
                                  )}
                                </div>

                                <pre className="p-2.5 rounded bg-black/60 border border-[#1E293B] text-[11px] font-mono text-[#a5f3fc] overflow-x-auto max-h-48">
                                  {JSON.stringify(
                                    sourceRecord?.rawPayload ||
                                      caseEvaluation.rawPayloadSnippet ||
                                      {},
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