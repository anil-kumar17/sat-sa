import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Lock,
  Key,
  Database,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [autoSeal, setAutoSeal] = useState(true);
  const [dualKeyMandate, setDualKeyMandate] = useState(true);
  const [minConfidenceThreshold, setMinConfidenceThreshold] = useState(95);

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <Sliders className="w-3.5 h-3.5" />
            SUPERVISORY PLATFORM CONFIGURATION // INVARIANTS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Supervisory Settings
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Cryptographic parameters, supervisory rule thresholds, and evidence vault anchoring configuration.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Section 1: Invariant & Confidence Thresholds */}
        <div className="p-5 rounded bg-[#131B2E] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-semibold text-[#dde2f7] uppercase tracking-wider font-mono">
            Reasoning Engine Invariants
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[#dde2f7] block">
                  Minimum Evidence Confidence Threshold
                </span>
                <span className="text-[#8d90a0]">
                  Findings below this confidence rating are routed to telemetry calibration instead of the docket.
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-[#4cd7f6]">
                {minConfidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={80}
              max={99}
              value={minConfidenceThreshold}
              onChange={(e) => setMinConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-[#38BDF8]"
            />

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
              <div>
                <span className="font-medium text-[#dde2f7] block">
                  Enforce Dual-Key Mandate for Critical P0 Findings
                </span>
                <span className="text-[#8d90a0]">
                  Requires two independent supervisory inspector credentials to uphold or dismiss P0 findings.
                </span>
              </div>
              <input
                type="checkbox"
                checked={dualKeyMandate}
                onChange={(e) => setDualKeyMandate(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563eb] bg-[#090D16]"
              />
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between">
              <div>
                <span className="font-medium text-[#dde2f7] block">
                  Automated SHA-256 Ledger Sealing
                </span>
                <span className="text-[#8d90a0]">
                  Immediately calculate and append SHA-256 Merkel root on every ingested Parquet chunk.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSeal}
                onChange={(e) => setAutoSeal(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563eb] bg-[#090D16]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vault Infrastructure */}
        <div className="p-5 rounded bg-[#131B2E] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-semibold text-[#dde2f7] uppercase tracking-wider font-mono">
            Cryptographic Vault & Ingest Nodes
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#090D16] rounded border border-[#1E293B] flex items-center justify-between">
              <div>
                <span className="text-[#8d90a0] text-[10px] block">PRIMARY TELEMETRY INGEST VAULT</span>
                <span className="text-[#dde2f7]">vault-primary-east.sat-sa.oversight.internal</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px]">
                ONLINE
              </span>
            </div>

            <div className="p-3 bg-[#090D16] rounded border border-[#1E293B] flex items-center justify-between">
              <div>
                <span className="text-[#8d90a0] text-[10px] block">COLD EVIDENCE IMMUTABLE ARCHIVE</span>
                <span className="text-[#dde2f7]">glacier-ledger-airgap.sat-sa.oversight.internal</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px]">
                AIR-GAPPED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
