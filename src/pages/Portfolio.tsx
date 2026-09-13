import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  TrendingDown,
  Activity
} from 'lucide-react';
import { mockEntities, mockFindings } from '../data/mockData';

export const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const filteredEntities = mockEntities.filter((e) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.sector.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (sectorFilter !== 'ALL' && e.sector !== sectorFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FolderGit2 className="w-3.5 h-3.5" />
            SUPERVISED CYBER ENTITIES // PORTFOLIO REGISTRY
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            CSE Portfolio
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Directory of 42 supervised critical infrastructure entities under continuous supervisory oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-xs font-mono text-[#8d90a0]">
            Active Monitoring: <span className="text-[#10b981] font-semibold">42 / 42 Connected</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
          <input
            type="text"
            placeholder="Search entity name, code, sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="ALL">All Sectors</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Energy & Utilities">Energy & Utilities</option>
            <option value="Defense Industrial">Defense Industrial</option>
            <option value="Telecommunications">Telecommunications</option>
            <option value="Healthcare">Healthcare</option>
          </select>
        </div>
      </div>

      {/* Grid of Supervised Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEntities.map((ent) => {
          const entityFindings = mockFindings.filter((f) => f.entityCode === ent.code);
          const hasCritical = entityFindings.some((f) => f.severity === 'CRITICAL');

          return (
            <div
              key={ent.id}
              className={`p-4 rounded bg-[#131B2E] border transition-all flex flex-col justify-between ${
                hasCritical ? 'border-[#ef4444]/40 hover:border-[#ef4444]' : 'border-[#1E293B] hover:border-[#334155]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#4cd7f6] font-semibold">{ent.code}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      ent.assessmentStatus === 'CAP Required'
                        ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ef4444]/30'
                        : ent.assessmentStatus === 'Active Audit'
                        ? 'bg-[#2563eb]/20 text-[#b4c5ff] border border-[#2563eb]/30'
                        : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                    }`}
                  >
                    {ent.assessmentStatus}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#dde2f7] mt-1.5">{ent.name}</h3>
                <div className="text-xs text-[#8d90a0] flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{ent.sector}</span>
                  <span>•</span>
                  <span>{ent.criticalityTier}</span>
                </div>

                {/* Score & Telemetry status */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded bg-[#090D16] border border-[#1E293B] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#8d90a0] uppercase block">Oversight Score</span>
                    <span
                      className={`text-sm font-bold ${
                        ent.complianceScore < 80
                          ? 'text-[#ef4444]'
                          : ent.complianceScore < 90
                          ? 'text-[#f59e0b]'
                          : 'text-[#10b981]'
                      }`}
                    >
                      {ent.complianceScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8d90a0] uppercase block">Open Findings</span>
                    <span className={`text-sm font-bold ${ent.openFindings > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                      {ent.openFindings} Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#8d90a0]">
                  Last Ingest: {ent.lastTelemetrySync}
                </span>
                <button
                  onClick={() => navigate(`/findings?q=${ent.code}`)}
                  className="text-[#4cd7f6] hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>View Findings</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
