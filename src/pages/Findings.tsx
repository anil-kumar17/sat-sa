import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { mockFindings, mockEntities } from '../data/mockData';
import { SeverityLevel, FindingStatus, Finding } from '../types';
import { findingsRepository } from '../repositories';

export const Findings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [findingsList, setFindingsList] = useState<Finding[]>(mockFindings);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'id' | 'severity' | 'confidence' | 'date'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    findingsRepository.getAll().then((res) => {
      if (res && res.length > 0) {
        setFindingsList(res);
      }
    });
  }, []);

  const filteredFindings = useMemo(() => {
    return findingsList
      .filter((finding) => {
        // Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            finding.id.toLowerCase().includes(q) ||
            finding.title.toLowerCase().includes(q) ||
            finding.entityName.toLowerCase().includes(q) ||
            finding.ruleCode.toLowerCase().includes(q) ||
            finding.summary.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Severity filter
        if (selectedSeverity !== 'ALL' && finding.severity !== selectedSeverity) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && finding.status !== selectedStatus) {
          return false;
        }

        // Entity filter
        if (selectedEntity !== 'ALL' && finding.entityCode !== selectedEntity) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'id') comp = a.id.localeCompare(b.id);
        else if (sortField === 'confidence') comp = a.confidence - b.confidence;
        else if (sortField === 'date') comp = a.date.localeCompare(b.date);
        else if (sortField === 'severity') {
          const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          comp = (order[a.severity] || 0) - (order[b.severity] || 0);
        }
        return sortAsc ? comp : -comp;
      });
  }, [searchTerm, selectedSeverity, selectedStatus, selectedEntity, sortField, sortAsc]);

  const toggleSort = (field: 'id' | 'severity' | 'confidence' | 'date') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            SUPERVISORY FINDINGS REGISTRY // CYCLE 14
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Findings Management
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Systemic control deviations, architectural gaps, and procedural anomalies flagged across monitored entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-xs font-mono text-[#8d90a0]">
            Displaying <span className="text-[#dde2f7] font-semibold">{filteredFindings.length}</span> of{' '}
            <span className="text-[#dde2f7] font-semibold">{findingsList.length}</span> findings
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
            <input
              type="text"
              placeholder="Search finding ID, rule, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          {/* Severity filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (P0)</option>
              <option value="HIGH">High (P1)</option>
              <option value="MEDIUM">Medium (P2)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="UPHELD">Upheld</option>
              <option value="DOWNGRADED">Downgraded</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          {/* Entity filter */}
          <div>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="ALL">All Entities (42)</option>
              {mockEntities.map((ent) => (
                <option key={ent.id} value={ent.code}>
                  {ent.code} - {ent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedEntity !== 'ALL' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B] text-xs font-mono text-[#8d90a0]">
            <span>Active filters:</span>
            {selectedSeverity !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7] flex items-center gap-1">
                Severity: {selectedSeverity}
                <button onClick={() => setSelectedSeverity('ALL')} className="hover:text-[#ef4444]">×</button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7] flex items-center gap-1">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')} className="hover:text-[#ef4444]">×</button>
              </span>
            )}
            {selectedEntity !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7] flex items-center gap-1">
                Entity: {selectedEntity}
                <button onClick={() => setSelectedEntity('ALL')} className="hover:text-[#ef4444]">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#dde2f7] flex items-center gap-1">
                Query: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-[#ef4444]">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSelectedEntity('ALL');
                setSearchTerm('');
              }}
              className="text-[#4cd7f6] hover:underline ml-auto"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Findings Table */}
      <div className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1322] text-[#8d90a0] font-mono text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th
                  onClick={() => toggleSort('id')}
                  className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Finding ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('severity')}
                  className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Severity
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Supervised Entity</th>
                <th className="px-4 py-3">Finding Title & Summary</th>
                <th className="px-4 py-3">Control Rule</th>
                <th
                  onClick={() => toggleSort('confidence')}
                  className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Confidence
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Evidence Integrity</th>
                <th className="px-4 py-3">Status</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-3 cursor-pointer hover:text-[#dde2f7] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Last Updated
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[#8d90a0] font-mono">
                    No findings match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((finding) => (
                  <tr
                    key={finding.id}
                    onClick={() => navigate(`/findings/${finding.id}`)}
                    className="hover:bg-[#1A243B]/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#4cd7f6] group-hover:underline whitespace-nowrap">
                      {finding.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-[#93000a]/50 text-[#ffb4ab] border border-[#ef4444]/40'
                            : finding.severity === 'HIGH'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                            : 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30'
                        }`}
                      >
                        {finding.severity} // {finding.defectCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#dde2f7]">{finding.entityName}</div>
                      <div className="font-mono text-[10px] text-[#8d90a0]">
                        {finding.entityCode} • {finding.targetCriticality}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-lg">
                      <div className="font-medium text-[#dde2f7]">{finding.title}</div>
                      <div className="text-[11px] text-[#8d90a0] line-clamp-1 mt-0.5">
                        {finding.summary}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#c3c6d7] whitespace-nowrap">
                      <div>{finding.ruleCode}</div>
                      <div className="text-[10px] text-[#8d90a0]">{finding.targetProtocol}</div>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <span className="text-[#4cd7f6] font-semibold">{finding.confidence}%</span>
                      <div className="text-[10px] text-[#8d90a0]">Validated</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-[#10b981]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SHA-256</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#8d90a0]">
                        {finding.flaggedIncidentsCount} dossiers
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          finding.status === 'OPEN'
                            ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                            : finding.status === 'IN_REVIEW'
                            ? 'bg-[#2563eb]/20 text-[#b4c5ff]'
                            : 'bg-[#10b981]/20 text-[#10b981]'
                        }`}
                      >
                        {finding.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8d90a0] whitespace-nowrap">
                      {finding.lastUpdated}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/findings/${finding.id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white text-[11px] font-mono transition-colors border border-[#334155] inline-flex items-center gap-1"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
