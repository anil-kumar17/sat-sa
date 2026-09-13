import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldAlert,
  Calendar,
  Building2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);

  const reports = [
    {
      id: 'REP-2025-014-EXEC',
      title: 'Executive Supervisory Briefing — Q1-2025 (Cycle 14)',
      type: 'Executive Briefing',
      date: '2025-03-28',
      pages: '14 pages',
      classification: 'CONFIDENTIAL // SUPERVISORY',
      summary: 'Synthesis of systemic escalation gaps in financial sector CSEs and negative space telemetry deficits.'
    },
    {
      id: 'REP-2025-FIN08-CAP',
      title: 'Corrective Action Plan (CAP) Formal Notice — Apex Interbank',
      type: 'Formal Notice',
      date: '2025-03-27',
      pages: '6 pages',
      classification: 'STATUTORY NOTICE',
      summary: 'Mandatory remediation order under FinSec Core 4.2 regarding unescalated Tier-3 incidents.'
    },
    {
      id: 'REP-2025-NRG03-ELEV',
      title: 'Root Elevation Audit Dossier — Metro Power & Grid',
      type: 'Technical Audit',
      date: '2025-03-24',
      pages: '9 pages',
      classification: 'RESTRICTED',
      summary: 'Forensic event replay of off-hours SCADA domain controller root session without ITSM ticket.'
    },
    {
      id: 'REP-2024-C13-ANNUAL',
      title: 'Comprehensive Oversight Report — Cycle 13 Retrospective',
      type: 'Annual Review',
      date: '2024-12-30',
      pages: '48 pages',
      classification: 'OFFICIAL RECORD',
      summary: 'Full cycle comparative analysis across 42 supervised cyber entities.'
    }
  ];

  const handleDownload = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      alert(`Report ${id} PDF generation complete. Initiated download.`);
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileText className="w-3.5 h-3.5" />
            SUPERVISORY DOSSIERS & FORMAL REPORTING
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Reports & Dossiers
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Cryptographically sealed supervisory briefings, statutory corrective action plans, and entity audit dossiers.
          </p>
        </div>

        <button
          onClick={() => handleDownload('REP-2025-CYCLE14-FULL')}
          className="px-3.5 py-1.5 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Cycle 14 Dossier</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded bg-[#131B2E] border border-[#1E293B] hover:border-[#334155] transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#4cd7f6] font-semibold">{rep.id}</span>
                <span className="px-2 py-0.5 rounded bg-[#090D16] text-[#8d90a0] border border-[#1E293B]">
                  {rep.classification}
                </span>
              </div>

              <h3 className="text-base font-semibold text-[#dde2f7] leading-snug">{rep.title}</h3>
              <p className="text-xs text-[#8d90a0] leading-relaxed">{rep.summary}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8d90a0]">
                {rep.date} • {rep.pages}
              </span>
              <button
                onClick={() => handleDownload(rep.id)}
                disabled={generating === rep.id}
                className="px-3 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white transition-colors flex items-center gap-1.5 border border-[#334155]"
              >
                <Download className="w-3 h-3" />
                <span>{generating === rep.id ? 'Generating...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
