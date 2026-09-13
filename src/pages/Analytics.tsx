import React from 'react';
import {
  LineChart,
  BrainCircuit,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Code,
  Activity,
  Cpu
} from 'lucide-react';
import { mockNegativeSpaceDeficits } from '../data/mockData';

export const Analytics: React.FC = () => {
  const reasonerEngines = [
    {
      code: 'ENG-PROV-01',
      name: 'Workflow Provenance & State Machine Divergence Engine',
      description: 'Compares real-time and retrospective execution traces against formal Petri-net baseline graphs to locate skipped control states.',
      accuracy: '99.8%',
      activeRules: 18,
      status: 'OPERATIONAL'
    },
    {
      code: 'ENG-NEG-02',
      name: 'Negative Space & Invariant Deficit Detector',
      description: 'Calculates the absence of mandatory operational signals (tokens, dual-key handshakes, memory captures) that should have accompanied an event.',
      accuracy: '99.4%',
      activeRules: 24,
      status: 'OPERATIONAL'
    },
    {
      code: 'ENG-DRIFT-03',
      name: 'Systemic Operational Drift & S-Curve Regression',
      description: 'Tracks degradation of SOC SLA timelines, premature dispositioning velocity, and cross-shift operational variance.',
      accuracy: '97.6%',
      activeRules: 12,
      status: 'OPERATIONAL'
    }
  ];

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            SUPERVISORY REASONING & ANALYTICAL MODELS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Supervisory Analytics Models
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Deductive mathematical engines, negative space detection invariants, and formal control rule specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#4cd7f6]">
            Deterministic Rules: 54 Active
          </span>
        </div>
      </div>

      {/* Engines Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reasonerEngines.map((eng) => (
          <div
            key={eng.code}
            className="p-4 rounded bg-[#131B2E] border border-[#1E293B] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#4cd7f6] font-semibold">{eng.code}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-mono text-[10px]">
                  {eng.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#dde2f7] mt-2">{eng.name}</h3>
              <p className="text-xs text-[#8d90a0] mt-1.5 leading-relaxed">{eng.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between font-mono text-xs">
              <span className="text-[#8d90a0]">Accuracy: <strong className="text-[#10b981]">{eng.accuracy}</strong></span>
              <span className="text-[#dde2f7]">{eng.activeRules} Rules Bound</span>
            </div>
          </div>
        ))}
      </div>

      {/* Negative Space Deficit Breakdown */}
      <div className="p-5 rounded bg-[#131B2E] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
          <div>
            <h3 className="text-base font-semibold text-[#dde2f7]">
              Negative Space Deficit Invariant Ledger
            </h3>
            <p className="text-xs text-[#8d90a0]">
              Quantified deficits across all evaluated telemetries in Cycle 14.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockNegativeSpaceDeficits.map((def, idx) => (
            <div key={idx} className="p-3.5 rounded bg-[#090D16] border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dde2f7]">{def.dimension}</span>
                <span className="font-mono text-xs font-bold text-[#ef4444]">
                  {def.deficitPercent}% Deficit
                </span>
              </div>
              <div className="w-full bg-[#1A243B] h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#10b981] h-full"
                  style={{ width: `${100 - def.deficitPercent}%` }}
                ></div>
                <div
                  className="bg-[#ef4444] h-full"
                  style={{ width: `${def.deficitPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-[#8d90a0]">
                <span>Observed: {def.observedEvents}</span>
                <span>Expected: {def.expectedEvents}</span>
                <span>Missing: {def.deficitCount} events</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
