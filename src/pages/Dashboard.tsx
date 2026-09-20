import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Database,
  Filter,
  FileCheck2,
  Layers,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Finding } from '../types';
import { findingsRepository, submissionRepository } from '../repositories';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [severityFilter, setSeverityFilter] = useState<
    'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'
  >('ALL');

  const [findings, setFindings] = useState<Finding[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const [storedFindings, submissions] = await Promise.all([
          findingsRepository.getAll(),
          submissionRepository.getAll()
        ]);

        if (!active) return;

        setFindings(storedFindings || []);
        setSubmissionCount(submissions?.length || 0);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);

        if (!active) return;

        setFindings([]);
        setSubmissionCount(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const openFindings = useMemo(
    () => findings.filter((finding) => finding.status === 'OPEN'),
    [findings]
  );

  const criticalFindings = useMemo(
    () =>
      findings.filter(
        (finding) =>
          finding.severity === 'CRITICAL' && finding.status === 'OPEN'
      ),
    [findings]
  );

  const filteredFindings = useMemo(
    () =>
      findings.filter((finding) => {
        if (severityFilter === 'ALL') return true;
        return finding.severity === severityFilter;
      }),
    [findings, severityFilter]
  );

  const entityCount = useMemo(
    () =>
      new Set(
        findings
          .map((finding) => finding.entityCode)
          .filter(Boolean)
      ).size,
    [findings]
  );

  const sectorData = useMemo(() => {
    const counts = new Map<string, number>();

    findings.forEach((finding) => {
      const sector = finding.sector || 'Unclassified';
      counts.set(sector, (counts.get(sector) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, findingsCount]) => ({
        name,
        findings: findingsCount
      }))
      .sort((a, b) => b.findings - a.findings);
  }, [findings]);

  const severityData = useMemo(() => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM'];

    return severities.map((severity) => ({
      severity,
      findings: findings.filter(
        (finding) => finding.severity === severity
      ).length
    }));
  }, [findings]);

  const ruleData = useMemo(() => {
    const counts = new Map<string, number>();

    findings.forEach((finding) => {
      const rule = finding.ruleCode || 'UNCLASSIFIED';
      counts.set(rule, (counts.get(rule) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([rule, count]) => ({
        rule,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [findings]);

  const findingDates = useMemo(() => {
    const counts = new Map<string, number>();

    findings.forEach((finding) => {
      const date = finding.date || 'Unknown date';
      counts.set(date, (counts.get(date) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([date, count]) => ({
        date,
        findings: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
  }, [findings]);

  const openEntityNames = useMemo(() => {
    return Array.from(
      new Set(
        openFindings
          .map((finding) => finding.entityName)
          .filter(Boolean)
      )
    ).slice(0, 3);
  }, [openFindings]);

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
            SUPERVISORY OVERSIGHT CONSOLE // LOCAL EVIDENCE
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Command Center
          </h1>

          <p className="text-xs text-[#8d90a0] mt-0.5 max-w-3xl">
            Evidence-backed supervisory findings, stored assessment context,
            and deterministic analytical signals available for human review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] flex items-center gap-2 text-[10px] font-mono">
            <span className="text-[#8d90a0]">LOCAL SUBMISSIONS</span>
            <span className="text-[#4cd7f6] font-semibold">
              {submissionCount}
            </span>
          </div>

          <button
            onClick={() => navigate('/assessments')}
            className="px-3 py-1.5 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Assessments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">
              Open Findings
            </span>
            <ShieldAlert className="w-4 h-4 text-[#4cd7f6]" />
          </div>

          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#dde2f7]">
              {openFindings.length}
            </span>
          </div>

          <span className="text-[11px] text-[#8d90a0] mt-1 block">
            Findings requiring supervisory review
          </span>
        </div>

        <div className="p-4 rounded bg-[#131B2E] border border-[#ef4444]/40">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase text-[#ffb4ab]">
              Critical Open
            </span>
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          </div>

          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#ef4444]">
              {criticalFindings.length}
            </span>
          </div>

          <span className="text-[11px] text-[#8d90a0] mt-1 block">
            Current stored findings classified as critical
          </span>
        </div>

        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">
              Entities Represented
            </span>
            <Building2 className="w-4 h-4 text-[#8d90a0]" />
          </div>

          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#dde2f7]">
              {entityCount}
            </span>
          </div>

          <span className="text-[11px] text-[#8d90a0] mt-1 block">
            Unique supervised entities in stored findings
          </span>
        </div>

        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">
              Stored Evidence
            </span>
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
          </div>

          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#10b981]">
              {findings.length}
            </span>
          </div>

          <span className="text-[11px] text-[#8d90a0] mt-1 block">
            Findings currently available from the local repository
          </span>
        </div>

        <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-[#8d90a0]">
            <span className="font-mono text-[11px] uppercase">
              Analysis State
            </span>
            <Activity className="w-4 h-4 text-[#f59e0b]" />
          </div>

          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-[#f59e0b]">
              DETERMINISTIC
            </span>
          </div>

          <span className="text-[11px] text-[#8d90a0] mt-1 block">
            Rules and evidence remain separate from human decisions
          </span>
        </div>
      </div>

      <section className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden">
        <div className="p-4 bg-[#151b2b] border-b border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#dde2f7]">
                Priority Docket
              </h2>

              {openFindings.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] text-[10px] font-mono font-semibold border border-[#ef4444]/30">
                  {openFindings.length} OPEN
                </span>
              )}
            </div>

            <p className="text-xs text-[#8d90a0] mt-1">
              Stored findings requiring supervisory review. Selecting a finding
              opens its evidence and traceability record.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] font-mono text-[#8d90a0] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filter:
            </span>

            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  severityFilter === severity
                    ? 'bg-[#2563eb] text-white font-semibold'
                    : 'bg-[#090D16] text-[#c3c6d7] hover:bg-[#1A243B] border border-[#1E293B]'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#8d90a0]">
              Loading stored findings...
            </div>
          ) : filteredFindings.length === 0 ? (
            <div className="p-10 text-center">
              <Database className="w-7 h-7 text-[#8d90a0] mx-auto mb-3" />

              <p className="text-sm font-semibold text-[#dde2f7]">
                No stored findings match this filter
              </p>

              <p className="text-xs text-[#8d90a0] mt-1">
                Ingest a CSE submission and persist the assessment to populate
                the supervisory docket.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1322] text-[#8d90a0] font-mono text-[11px] uppercase tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="px-4 py-3">Finding ID</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Supervised Entity</th>
                  <th className="px-4 py-3">Finding</th>
                  <th className="px-4 py-3">Rule</th>
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
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-[#93000a]/50 text-[#ffb4ab] border border-[#ef4444]/40'
                            : finding.severity === 'HIGH'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                            : 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#dde2f7]">
                        {finding.entityName}
                      </div>
                      <div className="font-mono text-[10px] text-[#8d90a0]">
                        {finding.entityCode} • {finding.sector}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-[#dde2f7] max-w-md">
                      <div className="truncate">{finding.title}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-[#c3c6d7]">
                      {finding.ruleCode}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/findings/${finding.id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white text-[11px] font-mono transition-colors border border-[#334155] inline-flex items-center gap-1"
                      >
                        Inspect
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4cd7f6]" />

              <div>
                <h3 className="text-sm font-semibold text-[#dde2f7]">
                  Stored Findings by Date
                </h3>

                <p className="text-[11px] text-[#8d90a0]">
                  Derived directly from findings persisted in the local evidence
                  repository.
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            {findingDates.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-[#8d90a0]">
                No finding history available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={findingDates}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1E293B"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#8d90a0"
                    fontSize={10}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#8d90a0"
                    fontSize={10}
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

                  <Bar
                    dataKey="findings"
                    name="Findings"
                    fill="#4cd7f6"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f59e0b]" />

              <div>
                <h3 className="text-sm font-semibold text-[#dde2f7]">
                  Finding Distribution
                </h3>

                <p className="text-[11px] text-[#8d90a0]">
                  Current stored findings by severity.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {severityData.map((item) => {
              const percentage =
                findings.length > 0
                  ? Math.round((item.findings / findings.length) * 100)
                  : 0;

              return (
                <div
                  key={item.severity}
                  className="p-3 rounded bg-[#090D16] border border-[#1E293B]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#c3c6d7]">
                      {item.severity}
                    </span>

                    <span className="font-mono text-[11px] text-[#dde2f7]">
                      {item.findings} findings
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#1A243B] rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${
                        item.severity === 'CRITICAL'
                          ? 'bg-[#ef4444]'
                          : item.severity === 'HIGH'
                          ? 'bg-[#f59e0b]'
                          : 'bg-[#38BDF8]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="text-[9px] font-mono text-[#8d90a0] mt-1">
                    {percentage}% of stored findings
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-sm font-semibold text-[#dde2f7]">
                Analytical Rule Distribution
              </h3>

              <p className="text-[11px] text-[#8d90a0]">
                Rules responsible for findings currently stored in the local
                repository.
              </p>
            </div>

            <span className="text-[10px] font-mono text-[#4cd7f6]">
              DETERMINISTIC
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {ruleData.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#8d90a0]">
                No analytical rule results available.
              </div>
            ) : (
              ruleData.map((item) => (
                <div
                  key={item.rule}
                  className="flex items-center gap-3 p-3 rounded bg-[#090D16] border border-[#1E293B]"
                >
                  <div className="w-8 h-8 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-[#4cd7f6]">
                      {item.rule}
                    </div>

                    <div className="w-full h-1.5 bg-[#1A243B] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-[#38BDF8]"
                        style={{
                          width: `${
                            ruleData[0]?.count
                              ? (item.count / ruleData[0].count) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  <span className="font-mono text-xs font-semibold text-[#dde2f7]">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#131B2E] rounded border border-[#1E293B] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-sm font-semibold text-[#dde2f7]">
                Finding Distribution by Sector
              </h3>

              <p className="text-[11px] text-[#8d90a0]">
                Sector attribution from stored finding records.
              </p>
            </div>

            <span className="text-[10px] font-mono text-[#8d90a0]">
              {sectorData.length} sectors
            </span>
          </div>

          <div className="h-56 w-full mt-4">
            {sectorData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-[#8d90a0]">
                No sector data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1E293B"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="#8d90a0"
                    fontSize={10}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#8d90a0"
                    fontSize={10}
                    tickLine={false}
                    width={100}
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

                  <Bar
                    dataKey="findings"
                    name="Findings"
                    fill="#38BDF8"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="rounded bg-[#0D1424] border border-[#1E293B] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />

              <h2 className="text-sm font-semibold text-[#dde2f7]">
                Supervisory Review Context
              </h2>
            </div>

            <p className="text-xs text-[#8d90a0] mt-1.5 max-w-4xl">
              SAT-SA presents deterministic analytical evidence for human
              supervisory review. A stored finding represents an analytical
              signal and traceability context, not an independent final
              determination.
            </p>

            {openEntityNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {openEntityNames.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[10px] font-mono text-[#c3c6d7]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate('/analytics')}
              className="px-3 py-1.5 rounded bg-[#131B2E] hover:bg-[#1A243B] border border-[#1E293B] text-[10px] font-mono text-[#4cd7f6] transition-colors"
            >
              Open Analytics
            </button>

            <button
              onClick={() => navigate('/findings')}
              className="px-3 py-1.5 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[10px] font-mono transition-colors"
            >
              Open Findings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};