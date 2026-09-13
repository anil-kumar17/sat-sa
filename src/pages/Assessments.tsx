import React from 'react';
import {
  FileCheck2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { mockAssessments } from '../data/mockData';

export const Assessments: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            SUPERVISORY ASSESSMENT CYCLES // AUDIT PERIODS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Assessment Cycles
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Periodic supervisory evaluation intervals, cryptographic submission windows, and statutory audit scopes.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#4cd7f6]">
            Active Cycle: C14 (Q1-2025)
          </span>
        </div>
      </div>

      {/* Cycle Cards */}
      <div className="space-y-4">
        {mockAssessments.map((cycle) => (
          <div
            key={cycle.id}
            className={`p-5 rounded bg-[#131B2E] border transition-all space-y-4 ${
              cycle.status === 'ACTIVE' ? 'border-[#38BDF8]/60 shadow-lg' : 'border-[#1E293B]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] border border-[#38BDF8]/30">
                  C{cycle.cycleNumber}
                </span>
                <h3 className="text-base font-semibold text-[#dde2f7]">{cycle.name}</h3>
                {cycle.status === 'ACTIVE' && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-[10px] font-semibold border border-[#4cd7f6]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                    ACTIVE WINDOW
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-[#8d90a0]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{cycle.startDate} to {cycle.closingDeadline}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded bg-[#090D16] border border-[#1E293B] font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Submissions Sealed</span>
                <span className="text-sm font-bold text-[#dde2f7]">
                  {cycle.sealedSubmissionsCount} / {cycle.totalEntities} CSEs
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Flagged Findings</span>
                <span className="text-sm font-bold text-[#ef4444]">{cycle.openFindingsCount} Open</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Evidence Integrity</span>
                <span className="text-sm font-bold text-[#10b981]">100% SHA-256</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Window Status</span>
                <span className="text-sm font-semibold text-[#4cd7f6]">{cycle.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#8d90a0] font-mono text-[11px]">
                Submission Hash Root: <code className="text-[#c3c6d7]">{cycle.integritySealHash.substring(0, 18)}...</code>
              </span>
              <button className="text-[#4cd7f6] hover:underline flex items-center gap-1 font-mono text-[11px]">
                <span>Inspect Cycle Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

