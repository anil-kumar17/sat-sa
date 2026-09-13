import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Building2,
  Lock,
  TrendingUp,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  mockFindings,
  mockTrajectoryData,
  mockNegativeSpaceDeficits,
  mockWorkflowStages,
  mockSectorAllocation
} from '../data/mockData';
import { SeverityLevel, Finding } from '../types';
import { findingsRepository } from '../repositories';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [findings, setFindings] = useState<Finding[]>(mockFindings);

  useEffect(() => {
    findingsRepository.getAll().then((res) => {
      if (res && res.length > 0) {
        setFindings(res);
      }
    });
  }, []);

  const openFindingsCount = findings.filter((f) => f.status === 'OPEN').length;
  const criticalFindingsCount = findings.filter(
    (f) => f.severity === 'CRITICAL' && f.status === 'OPEN'
  ).length;

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity === severityFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Operational Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
            SUPERVISORY OVERSIGHT CONSOLE // CYCLE 14 ACTIVE
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Command Center
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Operational baseline evaluation, control deviation invariants, and priority docket for supervisory human review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] flex items-center gap-2 text-xs font-mono">
            <span className="text-[#8d90a0]">Window Status:</span>
            <span className="text-[#4cd7f6] font-semibold">Sealed & Ingesting</span>
          </div>
          <button
            onClick={() => navigate('/assessments')}
            className="px-3 py-1.5 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Cycle 14 Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Open Supervisory Findings */}
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] flex flex-col justify-between hover:border-[#334155] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">Open Findings</span>
            <ShieldAlert className="w-4 h-4 text-[#4cd7f6]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#dde2f7]">{openFindingsCount}</span>
            <span className="text-[11px] font-mono text-[#4cd7f6]">+2 this cycle</span>
          </div>
          <span className="text-[11px] text-[#8d90a0] mt-1">
            {criticalFindingsCount} Critical P0/P1 requiring review
          </span>
        </div>

        {/* Critical Findings */}
        <div className="p-4 rounded bg-[#131B2E] border border-[#ef4444]/40 flex flex-col justify-between hover:border-[#ef4444] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase text-[#ffb4ab]">Critical Defects (P0)</span>
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#ef4444]">{criticalFindingsCount}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] text-[10px] font-mono font-semibold">
              URGENT CAP
            </span>
          </div>
          <span className="text-[11px] text-[#8d90a0] mt-1">
            Apex Interbank & Metro Power
          </span>
        </div>

        {/* Entities Under Assessment */}
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] flex flex-col justify-between hover:border-[#334155] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">Entities Assessed</span>
            <Building2 className="w-4 h-4 text-[#8d90a0]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#dde2f7]">42</span>
            <span className="text-[11px] font-mono text-[#8d90a0]">5 Sectors</span>
          </div>
          <span className="text-[11px] text-[#8d90a0] mt-1">
            84 total telemetry submissions
          </span>
        </div>

        {/* Evidence Integrity */}
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] flex flex-col justify-between hover:border-[#334155] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">Evidence Integrity</span>
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#10b981]">100%</span>
            <span className="text-[10px] font-mono text-[#8d90a0]">SHA-256</span>
          </div>
          <span className="text-[11px] text-[#8d90a0] mt-1">
            84/84 dossiers sealed & intact
          </span>
        </div>

        {/* Control Deviations */}
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B] flex flex-col justify-between hover:border-[#334155] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">Control Deviation Rate</span>
            <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#f59e0b]">14.2%</span>
            <span className="text-[11px] font-mono text-[#8d90a0]">Systemic drift</span>
          </div>
          <span className="text-[11px] text-[#8d90a0] mt-1">
            Escalation & containment gaps
          </span>
        </div>
      </div>

      {/* 2. PRIORITY DOCKET (HERO COMPONENT) */}
      <section className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden shadow-sm">
        <div className="p-4 bg-[#151b2b] border-b border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse"></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#dde2f7] tracking-tight">
                  Priority Docket
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] text-[10px] font-mono font-semibold border border-[#ef4444]/30">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-[#8d90a0]">
                Supervisory findings flagged by deterministic rule engines requiring human adjudication.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] font-mono text-[#8d90a0] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  severityFilter === sev
                    ? 'bg-[#2563eb] text-white font-semibold'
                    : 'bg-[#090D16] text-[#c3c6d7] hover:bg-[#1A243B] border border-[#1E293B]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Docket Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0D1322] text-[#8d90a0] font-mono text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="px-4 py-3">Finding ID</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Supervised Entity</th>
                <th className="px-4 py-3">Finding Title</th>
                <th className="px-4 py-3">Control Rule</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredFindings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => navigate(`/findings/${finding.id}`)}
                  className="hover:bg-[#1A243B]/80 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-[#4cd7f6] group-hover:underline">
                    {finding.id}
                  </td>
                  <td className="px-4 py-3">
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
                    <div className="font-mono text-[10px] text-[#8d90a0]">{finding.entityCode} • {finding.sector}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#dde2f7] max-w-xs truncate">
                    {finding.title}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#c3c6d7]">
                    {finding.ruleCode}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-[#4cd7f6] font-semibold">{finding.confidence}%</span>
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 font-mono text-[#8d90a0]">
                    {finding.date}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/findings/${finding.id}`);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white text-[11px] font-mono transition-colors border border-[#334155] inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Mid Grid: Findings Trajectory & Negative Space Deficit Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Findings Trajectory Chart */}
        <section className="lg:col-span-7 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4cd7f6]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#dde2f7]">Findings Trajectory</h3>
                  <p className="text-[11px] text-[#8d90a0]">
                    Supervisory findings flagged vs closed during Cycle 14 window (Weeks 01-12)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-[#4cd7f6]">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span> Total Open
                </span>
                <span className="flex items-center gap-1 text-[#ef4444]">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Critical P0
                </span>
                <span className="flex items-center gap-1 text-[#10b981]">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Remediation
                </span>
              </div>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="findingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="week" stroke="#8d90a0" fontSize={10} fontVariant="tabular-nums" />
                  <YAxis stroke="#8d90a0" fontSize={10} fontVariant="tabular-nums" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080e1d',
                      borderColor: '#334155',
                      borderRadius: '4px',
                      color: '#dde2f7',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="findings"
                    name="Open Findings"
                    stroke="#4cd7f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#findingsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Critical P0"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#criticalGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Resolved"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fillOpacity={0.1}
                    fill="#10b981"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#8d90a0]">
            <span>Active Assessment Window: 84 days</span>
            <span className="text-[#dde2f7]">Velocity: +1.5 net findings/week</span>
          </div>
        </section>

        {/* Right: NEGATIVE SPACE DEFICIT MATRIX (Signature Concept) */}
        <section className="lg:col-span-5 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f59e0b]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#dde2f7]">
                      Negative Space Deficit Matrix
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] text-[9px] font-mono font-semibold">
                      SIGNATURE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8d90a0]">
                    Quantifying mandated supervisory controls that were absent or bypassed
                  </p>
                </div>
              </div>
            </div>

            {/* Matrix rows */}
            <div className="space-y-3 mt-4">
              {mockNegativeSpaceDeficits.map((metric, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#090D16] border border-[#1E293B] text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-[#dde2f7]">{metric.dimension}</span>
                    <span
                      className={`font-mono font-semibold text-[11px] ${
                        metric.severity === 'CRITICAL'
                          ? 'text-[#ef4444]'
                          : metric.severity === 'ELEVATED'
                          ? 'text-[#f59e0b]'
                          : metric.severity === 'MODERATE'
                          ? 'text-[#38BDF8]'
                          : 'text-[#10b981]'
                      }`}
                    >
                      {metric.deficitCount} Deficits ({metric.deficitPercent}%)
                    </span>
                  </div>

                  {/* Progress bar depicting the gap */}
                  <div className="w-full h-2 bg-[#1A243B] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#10b981]"
                      style={{ width: `${100 - metric.deficitPercent}%` }}
                      title={`Compliant: ${metric.observedEvents}`}
                    ></div>
                    <div
                      className={`h-full ${
                        metric.severity === 'CRITICAL' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
                      }`}
                      style={{ width: `${metric.deficitPercent}%` }}
                      title={`Deficit: ${metric.deficitCount}`}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[10px] text-[#8d90a0] mt-1.5">
                    <span>Observed: {metric.observedEvents} records</span>
                    <span>Expected Baseline: {metric.expectedEvents}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#1E293B] text-[11px] text-[#8d90a0] flex items-center justify-between font-mono">
            <span>Primary Driver: Pipeline auto-closures</span>
            <span className="text-[#ef4444] font-semibold">19.7% Max Deficit</span>
          </div>
        </section>
      </div>

      {/* 4. Bottom Grid: Workflow Drop-Off Anatomy & CSE Sector Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workflow Drop-Off Anatomy */}
        <section className="lg:col-span-7 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-sm font-semibold text-[#dde2f7]">
                Workflow Drop-Off Anatomy
              </h3>
              <p className="text-[11px] text-[#8d90a0]">
                Where monitored operational pipelines drop required supervisory control steps
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#4cd7f6] px-2 py-0.5 rounded bg-[#151b2b] border border-[#4cd7f6]/30">
              MANDATED BASELINE 100%
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {mockWorkflowStages.map((stage) => (
              <div
                key={stage.stageNumber}
                className={`p-3 rounded border transition-colors ${
                  stage.status === 'CRITICAL_GAP'
                    ? 'bg-[#93000a]/20 border-[#ef4444]/40'
                    : stage.status === 'DEVIATION'
                    ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                    : 'bg-[#090D16] border-[#1E293B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#8d90a0]">
                      STAGE 0{stage.stageNumber}
                    </span>
                    <span className="font-semibold text-[#dde2f7]">{stage.stageName}</span>
                    {stage.status === 'CRITICAL_GAP' && (
                      <span className="px-1.5 py-0.2 rounded bg-[#ef4444]/20 text-[#ffb4ab] text-[9px] font-mono font-semibold">
                        CRITICAL GAP
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px]">
                    <span className="text-[#8d90a0]">Observed: </span>
                    <span
                      className={`font-semibold ${
                        stage.status === 'CRITICAL_GAP'
                          ? 'text-[#ef4444]'
                          : stage.status === 'DEVIATION'
                          ? 'text-[#f59e0b]'
                          : 'text-[#10b981]'
                      }`}
                    >
                      {stage.observedRate}%
                    </span>
                    {stage.dropOffRate > 0 && (
                      <span className="text-[#ef4444] ml-2">(-{stage.dropOffRate}%)</span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-[#1A243B] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stage.status === 'CRITICAL_GAP'
                        ? 'bg-[#ef4444]'
                        : stage.status === 'DEVIATION'
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#10b981]'
                    }`}
                    style={{ width: `${stage.observedRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CSE Sector Allocation */}
        <section className="lg:col-span-5 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div>
                <h3 className="text-sm font-semibold text-[#dde2f7]">
                  CSE Sector Allocation
                </h3>
                <p className="text-[11px] text-[#8d90a0]">
                  Supervisory findings distribution across supervised critical sectors
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#8d90a0]">42 Entities</span>
            </div>

            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSectorAllocation} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#8d90a0" fontSize={10} fontVariant="tabular-nums" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#8d90a0"
                    fontSize={10}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080e1d',
                      borderColor: '#334155',
                      borderRadius: '4px',
                      color: '#dde2f7',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Bar dataKey="findings" name="Findings" radius={[0, 4, 4, 0]}>
                    {mockSectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-[#8d90a0]">
            <span>Highest Concentration: Financial Core (7)</span>
            <button
              onClick={() => navigate('/portfolio')}
              className="text-[#4cd7f6] hover:underline flex items-center gap-1"
            >
              <span>Inspect Portfolio</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
