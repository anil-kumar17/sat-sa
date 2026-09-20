import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  ArrowUpDown,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Filter,
  Database
} from 'lucide-react';
import { Finding } from '../types';
import { findingsRepository } from '../repositories';

type SortField = 'id' | 'severity' | 'date';

const severityOrder: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export const Findings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';

  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFindings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const storedFindings = await findingsRepository.getAll();

      const sorted = [...(storedFindings || [])].sort((a, b) => {
        const aTime = new Date(a.date || '').getTime();
        const bTime = new Date(b.date || '').getTime();

        if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
          return bTime - aTime;
        }

        return (b.date || '').localeCompare(a.date || '');
      });

      setFindingsList(sorted);
    } catch (error) {
      console.error('Failed to load findings:', error);
      setFindingsList([]);
      setLoadError(
        'Could not load persisted findings from the local vault.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFindings();
  }, [loadFindings]);

  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  const entityOptions = useMemo(() => {
    const entities = new Map<string, string>();

    for (const finding of findingsList) {
      if (finding.entityCode) {
        entities.set(
          finding.entityCode,
          finding.entityName || finding.entityCode
        );
      }
    }

    return Array.from(entities.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [findingsList]);

  const summary = useMemo(() => {
    const critical = findingsList.filter(
      (finding) => finding.severity === 'CRITICAL'
    ).length;

    const high = findingsList.filter(
      (finding) => finding.severity === 'HIGH'
    ).length;

    const open = findingsList.filter(
      (finding) => finding.status === 'OPEN' || finding.status === 'IN_REVIEW'
    ).length;

    const evidenceRecords = findingsList.reduce(
      (total, finding) => total + (finding.flaggedIncidentsCount || 0),
      0
    );

    return {
      total: findingsList.length,
      critical,
      high,
      open,
      evidenceRecords
    };
  }, [findingsList]);

  const filteredFindings = useMemo(() => {
    return [...findingsList]
      .filter((finding) => {
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();

          const match =
            finding.id?.toLowerCase().includes(query) ||
            finding.title?.toLowerCase().includes(query) ||
            finding.entityName?.toLowerCase().includes(query) ||
            finding.entityCode?.toLowerCase().includes(query) ||
            finding.ruleCode?.toLowerCase().includes(query) ||
            finding.summary?.toLowerCase().includes(query);

          if (!match) {
            return false;
          }
        }

        if (
          selectedSeverity !== 'ALL' &&
          finding.severity !== selectedSeverity
        ) {
          return false;
        }

        if (
          selectedStatus !== 'ALL' &&
          finding.status !== selectedStatus
        ) {
          return false;
        }

        if (
          selectedEntity !== 'ALL' &&
          finding.entityCode !== selectedEntity
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortField === 'id') {
          comparison = (a.id || '').localeCompare(b.id || '');
        } else if (sortField === 'date') {
          const aTime = new Date(a.date || '').getTime();
          const bTime = new Date(b.date || '').getTime();

          if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
            comparison = aTime - bTime;
          } else {
            comparison = (a.date || '').localeCompare(b.date || '');
          }
        } else if (sortField === 'severity') {
          comparison =
            (severityOrder[a.severity] || 0) -
            (severityOrder[b.severity] || 0);
        }

        return sortAsc ? comparison : -comparison;
      });
  }, [
    findingsList,
    searchTerm,
    selectedSeverity,
    selectedStatus,
    selectedEntity,
    sortField,
    sortAsc
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((current) => !current);
      return;
    }

    setSortField(field);
    setSortAsc(false);
  };

  const resetFilters = () => {
    setSelectedSeverity('ALL');
    setSelectedStatus('ALL');
    setSelectedEntity('ALL');
    setSearchTerm('');
  };

  const hasActiveFilters =
    selectedSeverity !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedEntity !== 'ALL' ||
    Boolean(searchTerm);

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#93000a]/50 text-[#ffb4ab] border border-[#ef4444]/40';
      case 'HIGH':
        return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/35';
      case 'MEDIUM':
        return 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30';
      default:
        return 'bg-[#334155]/40 text-[#cbd5e1] border border-[#475569]';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-[#93000a]/30 text-[#ffb4ab] border border-[#ef4444]/25';
      case 'IN_REVIEW':
        return 'bg-[#2563eb]/20 text-[#b4c5ff] border border-[#2563eb]/30';
      case 'UPHELD':
        return 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25';
      case 'DOWNGRADED':
        return 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25';
      case 'DISMISSED':
        return 'bg-[#475569]/20 text-[#94a3b8] border border-[#475569]/30';
      default:
        return 'bg-[#334155]/30 text-[#cbd5e1] border border-[#475569]';
    }
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            SUPERVISORY FINDINGS REGISTRY
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Findings Management
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-2xl">
            Review deterministic findings generated from persisted assessment
            evidence and trace each finding back to its supporting records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] text-[11px] font-mono text-[#8d90a0]">
            {loading ? (
              'Loading local findings...'
            ) : (
              <>
                <span className="text-[#dde2f7] font-semibold">
                  {filteredFindings.length}
                </span>{' '}
                of{' '}
                <span className="text-[#dde2f7] font-semibold">
                  {findingsList.length}
                </span>{' '}
                displayed
              </>
            )}
          </div>

          <button
            onClick={() => void loadFindings()}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] text-xs font-mono text-[#8d90a0] hover:text-[#dde2f7] hover:border-[#334155] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Persisted Findings
          </div>
          <div className="mt-1 text-xl font-semibold text-[#dde2f7]">
            {summary.total}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#ef4444]/20">
          <div className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Critical
          </div>
          <div className="mt-1 text-xl font-semibold text-[#ffb4ab]">
            {summary.critical}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#f59e0b]/20">
          <div className="text-[10px] font-mono text-[#8d90a0] uppercase">
            High
          </div>
          <div className="mt-1 text-xl font-semibold text-[#f59e0b]">
            {summary.high}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#38BDF8]/20">
          <div className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Requiring Review
          </div>
          <div className="mt-1 text-xl font-semibold text-[#4cd7f6]">
            {summary.open}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#10b981]/20">
          <div className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Evidence Records
          </div>
          <div className="mt-1 text-xl font-semibold text-[#10b981]">
            {summary.evidenceRecords}
          </div>
        </div>
      </div>

      <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#4cd7f6]" />
          Registry Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

            <input
              type="text"
              placeholder="Search ID, entity, rule, title..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(event) => setSelectedSeverity(event.target.value)}
            className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="UPHELD">Upheld</option>
            <option value="DOWNGRADED">Downgraded</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={selectedEntity}
            onChange={(event) => setSelectedEntity(event.target.value)}
            className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="ALL">
              All Entities ({entityOptions.length})
            </option>

            {entityOptions.map(([code, name]) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E293B] text-xs font-mono text-[#8d90a0]">
            <span>Active:</span>

            {selectedSeverity !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7]">
                Severity: {selectedSeverity}
              </span>
            )}

            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7]">
                Status: {selectedStatus}
              </span>
            )}

            {selectedEntity !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7]">
                Entity: {selectedEntity}
              </span>
            )}

            {searchTerm && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7] max-w-xs truncate">
                Query: "{searchTerm}"
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-[#4cd7f6] hover:underline ml-auto"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="px-4 py-3 rounded bg-[#2A1215] border border-[#7F1D1D] text-xs font-mono text-[#ffb4ab]">
          {loadError}
        </div>
      )}

      <div className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-5 h-5 mx-auto text-[#4cd7f6] animate-spin mb-3" />
            <p className="text-xs font-mono text-[#8d90a0]">
              Loading persisted findings from local vault...
            </p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-8 h-8 mx-auto text-[#475569] mb-3" />

            <h3 className="text-sm font-semibold text-[#dde2f7]">
              {findingsList.length === 0
                ? 'No persisted findings'
                : 'No findings match the current filters'}
            </h3>

            <p className="max-w-md mx-auto mt-2 text-xs text-[#8d90a0]">
              {findingsList.length === 0
                ? 'Findings appear here after qualifying deterministic analytics results are persisted from an assessment submission.'
                : 'Adjust the search or filters to inspect the findings currently stored in the local vault.'}
            </p>

            {findingsList.length === 0 && (
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded bg-[#090D16] border border-[#1E293B] text-[10px] font-mono text-[#64748B]">
                <Database className="w-3 h-3" />
                LOCAL FINDING STORE EMPTY
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1322] text-[#8d90a0] font-mono text-[10px] uppercase tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th
                    onClick={() => toggleSort('id')}
                    className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      Finding ID
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th
                    onClick={() => toggleSort('severity')}
                    className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      Severity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap">
                    Supervised Entity
                  </th>

                  <th className="px-4 py-3 min-w-[280px]">
                    Finding & Summary
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap">
                    Control Rule
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap">
                    Evidence
                  </th>

                  <th className="px-4 py-3 whitespace-nowrap">
                    Status
                  </th>

                  <th
                    onClick={() => toggleSort('date')}
                    className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      Last Updated
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th className="px-4 py-3 text-right">
                    Investigation
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredFindings.map((finding) => (
                  <tr
                    key={finding.id}
                    onClick={() => navigate(`/findings/${finding.id}`)}
                    className="hover:bg-[#1A243B]/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#4cd7f6] whitespace-nowrap">
                      <div className="group-hover:underline">
                        {finding.id}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${getSeverityClass(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#dde2f7]">
                        {finding.entityName}
                      </div>

                      <div className="font-mono text-[10px] text-[#8d90a0]">
                        {finding.entityCode}
                        {finding.targetCriticality
                          ? ` • ${finding.targetCriticality}`
                          : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xl">
                      <div className="font-medium text-[#dde2f7]">
                        {finding.title}
                      </div>

                      <div className="text-[11px] text-[#8d90a0] line-clamp-2 mt-0.5">
                        {finding.summary}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-[#c3c6d7] whitespace-nowrap">
                      <div>{finding.ruleCode}</div>

                      {finding.targetProtocol && (
                        <div className="text-[10px] text-[#8d90a0] mt-0.5">
                          {finding.targetProtocol}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#10b981]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {finding.flaggedIncidentsCount || 0} records
                        </span>
                      </div>

                      <div className="text-[10px] text-[#64748B] mt-0.5">
                        Evidence linked
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusClass(
                          finding.status
                        )}`}
                      >
                        {finding.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-[#8d90a0] whitespace-nowrap">
                      {finding.lastUpdated || finding.date || 'Not recorded'}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/findings/${finding.id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white text-[11px] font-mono transition-colors border border-[#334155] inline-flex items-center gap-1"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};