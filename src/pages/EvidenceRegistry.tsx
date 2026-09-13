import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Search,
  FileCheck2,
  Download,
  Terminal,
  CheckCircle2,
  HardDrive,
  Clock,
  Key
} from 'lucide-react';
import { mockForensicRecords } from '../data/mockData';

export const EvidenceRegistry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const dossiers = [
    {
      id: 'DOS-2025-084',
      entity: 'Apex Interbank Clearing Corp (CSE-FIN-08)',
      file: 'cse_fin08_soc_log_20250325.parquet',
      recordsCount: '41,208 records',
      size: '18.4 MB',
      sha256: '9e03f2a1b9c7e4d8f5a2b3c1d4e6f8a9b0c2d3e5f7a1b3c5d7e9f1a3b5c7d9e1',
      status: 'SEALED',
      timestamp: '2025-03-28T09:14:22Z',
      coverage: 'Q1-2025 Cycle 14 Assessment Window'
    },
    {
      id: 'DOS-2025-083',
      entity: 'Metro Power & Grid (CSE-NRG-03)',
      file: 'nrg03_auth_elevation_20250322.parquet',
      recordsCount: '19,450 records',
      size: '8.2 MB',
      sha256: '7b28a1c9d4e3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      status: 'SEALED',
      timestamp: '2025-03-24T14:22:10Z',
      coverage: 'SCADA Root Access Logs'
    },
    {
      id: 'DOS-2025-082',
      entity: 'AeroDefense Systems (CSE-DEF-02)',
      file: 'def02_ram_dump_incident_8819.bin.sealed',
      recordsCount: '1 Memory Dump Image',
      size: '64.1 MB',
      sha256: '3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a',
      status: 'SEALED',
      timestamp: '2025-03-20T11:05:43Z',
      coverage: 'Volatile Memory Capture'
    },
    {
      id: 'DOS-2025-081',
      entity: 'OmniCom Satellite (CSE-TEL-05)',
      file: 'tel05_dns_tunnel_pcap_20250318.zst',
      recordsCount: '128,910 packets',
      size: '42.9 MB',
      sha256: '2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c',
      status: 'SEALED',
      timestamp: '2025-03-18T16:48:19Z',
      coverage: 'Egress Traffic Telemetry'
    }
  ];

  const handleVerify = (hash: string) => {
    setVerificationResult(`Verification Successful: SHA-256 evidence hash matches registered digest #84102.`);
    setTimeout(() => setVerificationResult(null), 4000);
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <Lock className="w-3.5 h-3.5" />
            EVIDENCE REGISTRY // VERIFICATION VAULT
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Evidence Registry
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Verified and timestamped forensic evidence dossiers supporting supervisory findings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-xs font-mono text-[#10b981] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>84 / 84 Dossiers Verified & Intact</span>
          </div>
        </div>
      </div>

      {/* Local Evidence Cache & Integrity Disclaimer Banner */}
      <div className="p-3 bg-[#131B2E]/60 border border-[#1E293B] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#8d90a0]">
          <span className="px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] font-mono text-[10px] font-semibold border border-[#38BDF8]/20">
            LOCAL EVIDENCE CACHE
          </span>
          <span className="text-[11px] font-mono">
            Observed telemetry snapshots cached in IndexedDB Vault for offline inspection.
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#8d90a0]">
          Evidence Integrity: SHA-256 Verified
        </span>
      </div>

      {verificationResult && (
        <div className="p-3 bg-[#131B2E] border border-[#10b981] rounded text-xs font-mono text-[#10b981] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>{verificationResult}</span>
        </div>
      )}

      {/* Dossiers List */}
      <div className="space-y-4">
        {dossiers.map((dos) => (
          <div
            key={dos.id}
            className="p-4 rounded bg-[#131B2E] border border-[#1E293B] hover:border-[#334155] transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#4cd7f6]">{dos.id}</span>
                <span className="text-xs font-semibold text-[#dde2f7]">{dos.entity}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-semibold border border-[#10b981]/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {dos.status}
                </span>
                <span className="text-[#8d90a0]">{dos.timestamp}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded bg-[#090D16] border border-[#1E293B] text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Artifact File</span>
                <span className="text-[#dde2f7] font-semibold">{dos.file}</span>
                <span className="text-[10px] text-[#8d90a0] block mt-0.5">{dos.size} • {dos.recordsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">Scope / Coverage</span>
                <span className="text-[#c3c6d7]">{dos.coverage}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d90a0] uppercase block">SHA-256 Digest</span>
                <span className="text-[#4cd7f6] truncate block text-[10px]">{dos.sha256}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-2 text-[#8d90a0] font-mono text-[11px]">
                <Key className="w-3.5 h-3.5 text-[#03b5d3]" />
                <span>Deterministic Seed: HMAC-SHA256 Multi-Party Ingest</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerify(dos.sha256)}
                  className="px-2.5 py-1 rounded bg-[#090D16] hover:bg-[#1A243B] text-[#4cd7f6] font-mono text-[11px] border border-[#1E293B] transition-colors"
                >
                  Verify Digest
                </button>
                <button
                  onClick={() => alert(`Downloading verified Parquet volume: ${dos.file}`)}
                  className="px-2.5 py-1 rounded bg-[#1A243B] hover:bg-[#2563eb] text-[#dde2f7] hover:text-white font-mono text-[11px] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Parquet</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
