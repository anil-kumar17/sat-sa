import React from 'react';
import {
  Activity,
  ArrowRight,
  Database,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { SubmissionIngestionPanel } from '../components/assessments/SubmissionIngestionPanel';

export const Assessments: React.FC = () => {
  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            SUPERVISORY ASSESSMENT // SUBMISSION INGESTION
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Assessments & Operational Evidence
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl">
            Load periodic CSE operational submissions, validate source quality,
            preserve provenance, and run deterministic supervisory analytics
            against the stored assessment evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            LOCAL EVIDENCE VAULT
          </span>

          <span className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#8d90a0]">
            DETERMINISTIC ANALYSIS
          </span>
        </div>
      </div>

      <SubmissionIngestionPanel />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#dde2f7]">
              Assessment Processing Flow
            </h2>
            <p className="text-xs text-[#8d90a0] mt-0.5">
              Each persisted submission follows the same local evidence and
              analytics path.
            </p>
          </div>

          <span className="hidden sm:block text-[10px] font-mono text-[#8d90a0]">
            INGEST → VALIDATE → RECONSTRUCT → ANALYZE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded bg-[#131B2E] border border-[#1E293B] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <span className="text-[9px] font-mono text-[#8d90a0]">
                STEP 01
              </span>
            </div>

            <h3 className="text-xs font-semibold text-[#dde2f7]">
              Source Ingestion
            </h3>

            <p className="text-[11px] text-[#8d90a0] mt-1.5 leading-relaxed">
              Accept CSV or JSON operational records and preserve the submitted
              source payload.
            </p>

            <div className="flex items-center gap-1 mt-3 text-[9px] font-mono text-[#4cd7f6]">
              <span>RAW SOURCE</span>
              <ArrowRight className="w-3 h-3" />
              <span>LOCAL VAULT</span>
            </div>
          </div>

          <div className="rounded bg-[#131B2E] border border-[#1E293B] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              </div>
              <span className="text-[9px] font-mono text-[#8d90a0]">
                STEP 02
              </span>
            </div>

            <h3 className="text-xs font-semibold text-[#dde2f7]">
              Data Quality
            </h3>

            <p className="text-[11px] text-[#8d90a0] mt-1.5 leading-relaxed">
              Validate required fields, timestamps, identifiers, chronology,
              duplicates, and evidence availability before analysis.
            </p>

            <div className="flex items-center gap-1 mt-3 text-[9px] font-mono text-[#10b981]">
              <span>VALIDATE</span>
              <ArrowRight className="w-3 h-3" />
              <span>CLASSIFY</span>
            </div>
          </div>

          <div className="rounded bg-[#131B2E] border border-[#1E293B] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#a78bfa]" />
              </div>
              <span className="text-[9px] font-mono text-[#8d90a0]">
                STEP 03
              </span>
            </div>

            <h3 className="text-xs font-semibold text-[#dde2f7]">
              Operational Reconstruction
            </h3>

            <p className="text-[11px] text-[#8d90a0] mt-1.5 leading-relaxed">
              Normalize submitted records into comparable case and workflow
              events without changing the original evidence.
            </p>

            <div className="flex items-center gap-1 mt-3 text-[9px] font-mono text-[#a78bfa]">
              <span>NORMALIZE</span>
              <ArrowRight className="w-3 h-3" />
              <span>RECONSTRUCT</span>
            </div>
          </div>

          <div className="rounded bg-[#131B2E] border border-[#1E293B] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <span className="text-[9px] font-mono text-[#8d90a0]">
                STEP 04
              </span>
            </div>

            <h3 className="text-xs font-semibold text-[#dde2f7]">
              Deterministic Analysis
            </h3>

            <p className="text-[11px] text-[#8d90a0] mt-1.5 leading-relaxed">
              Evaluate workflow execution, negative space, and operational
              timing using explicit analytical rules.
            </p>

            <div className="flex items-center gap-1 mt-3 text-[9px] font-mono text-[#f59e0b]">
              <span>RULES</span>
              <ArrowRight className="w-3 h-3" />
              <span>FINDINGS</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded bg-[#0D1424] border border-[#1E293B] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>

              <h2 className="text-sm font-semibold text-[#dde2f7]">
                Evidence Handling Principle
              </h2>
            </div>

            <p className="text-xs text-[#8d90a0] mt-2 max-w-4xl leading-relaxed">
              SAT-SA keeps submitted source records separate from normalized
              analytical records. Deterministic engines operate on the
              normalized representation while the original source payload and
              provenance fingerprint remain available for supervisory review.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#131B2E] border border-[#1E293B] font-mono text-[9px] text-[#8d90a0]">
            <span className="text-[#10b981]">SOURCE</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-[#4cd7f6]">ANALYSIS</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-[#a78bfa]">REVIEW</span>
          </div>
        </div>
      </section>
    </div>
  );
};