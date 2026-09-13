import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Fingerprint,
  Shield,
  Clock,
  Send,
  HelpCircle,
  Gavel,
  ShieldCheck,
  ExternalLink,
  Terminal,
  Activity,
  FileText,
  RefreshCw,
  WifiOff,
  Database
} from 'lucide-react';
import { mockFindings, mockForensicRecords } from '../data/mockData';
import { Finding, ForensicRecord } from '../types';
import { useOffline } from '../context/OfflineContext';
import { findingsRepository, evidenceRepository } from '../repositories';

export const FindingInvestigation: React.FC = () => {
  const { findingId } = useParams<{ findingId: string }>();
  const navigate = useNavigate();

  const {
    connectivityState,
    pendingActions,
    enqueueSupervisorDecision,
    setIsQueueDrawerOpen
  } = useOffline();

  // Local state for the finding so status updates reflect immediately
  const [finding, setFinding] = useState<Finding>(
    mockFindings.find((f) => f.id === findingId) || mockFindings[0]
  );
  const [forensicRecords, setForensicRecords] = useState<ForensicRecord[]>(mockForensicRecords);

  // State for expandable telemetry rows in the Forensic Explorer
  const [expandedRow, setExpandedRow] = useState<string>('INC-8821');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Human Supervisor Decision State
  const [selectedDecision, setSelectedDecision] = useState<'UPHOLD' | 'DOWNGRADE' | 'DISMISS'>('UPHOLD');
  const [decisionRationale, setDecisionRationale] = useState<string>(
    'Affirmed as Critical Defect (P0). Ingested telemetry confirms 14 Tier-3 alerts closed without requisite Tier-3 supervisory handshake, directly contravening Section 4.2 Mandatory Escalation Protocols for RTGS targets. Operational risk of undetected persistence during financial clearing cycles supports recommended Corrective Action Plan (CAP) submission within 10 business days.'
  );
  const [isDecisionConfirmed, setIsDecisionConfirmed] = useState<boolean>(false);
  const [confirmationRecord, setConfirmationRecord] = useState<{
    decision: string;
    timestamp: string;
    commitHash: string;
  } | null>(null);

  // Modal / Toast for export or additional records
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load finding, decision, and evidence from local repository on mount
  useEffect(() => {
    async function loadData() {
      const activeId = findingId || 'FND-2025-014';
      const storedFinding = await findingsRepository.getById(activeId);
      if (storedFinding) {
        setFinding(storedFinding);
      }

      const storedEvidence = await evidenceRepository.getAll();
      if (storedEvidence && storedEvidence.length > 0) {
        setForensicRecords(storedEvidence);
      }

      const existingDecision = await findingsRepository.getSupervisorDecision(activeId);
      if (existingDecision) {
        setIsDecisionConfirmed(true);
        setSelectedDecision(existingDecision.decision);
        setDecisionRationale(existingDecision.rationale);
        setConfirmationRecord({
          decision: existingDecision.decisionTitle,
          timestamp: existingDecision.decidedAt,
          commitHash: existingDecision.sha256Verification
        });
      }
    }

    loadData();
  }, [findingId]);

  // Determine current synchronization status for this finding
  const queuedAction = pendingActions.find((a) => a.findingId === finding.id);
  const currentSyncStatus = queuedAction
    ? queuedAction.syncStatus
    : isDecisionConfirmed
    ? (connectivityState === 'OFFLINE' ? 'PENDING_SYNC' : 'SYNCED')
    : null;

  const handleCopyJson = (record: ForensicRecord) => {
    navigator.clipboard.writeText(JSON.stringify(record.rawPayload, null, 2));
    setCopiedId(record.incidentId);
    showToast(`Copied telemetry payload for ${record.incidentId} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDecision = async () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const commitHash =
      '0x' +
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      '...';

    try {
      await enqueueSupervisorDecision(
        finding.id,
        selectedDecision,
        decisionRationale,
        finding.inspector
      );

      setConfirmationRecord({
        decision:
          selectedDecision === 'UPHOLD'
            ? 'Affirmed Critical Defect (P0) — Corrective Action Plan Recommended'
            : selectedDecision === 'DOWNGRADE'
            ? 'Downgraded to Observation — Telemetry Recalibration Window'
            : 'Finding Dismissed — Supervisory Waiver Recorded',
        timestamp,
        commitHash
      });

      setIsDecisionConfirmed(true);

      // Refresh finding state from repository
      const updated = await findingsRepository.getById(finding.id);
      if (updated) setFinding(updated);

      if (connectivityState === 'OFFLINE') {
        showToast('Decision recorded locally in IndexedDB (PENDING SYNC)');
      } else {
        showToast('Supervisory decision recorded and verified');
      }
    } catch {
      showToast('Error recording supervisory decision locally');
    }
  };

  const handleReopenDecision = () => {
    setIsDecisionConfirmed(false);
    showToast('Supervisory review reopened for modification');
  };

  const filteredRecords = forensicRecords.filter(

    (rec) =>
      rec.incidentId.toLowerCase().includes(filterQuery.toLowerCase()) ||
      rec.provenanceHash.toLowerCase().includes(filterQuery.toLowerCase()) ||
      rec.dispositionGiven.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#090D16] text-[#dde2f7] flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131B2E] text-[#dde2f7] px-4 py-3 rounded border border-[#38BDF8] shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEVEL 1: SUPERVISORY BANNER & CONTEXT BREADCRUMB */}
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-3 bg-[#080e1d] flex flex-col gap-2 border-b border-[#1E293B]">
        {/* Breadcrumb & Top Bar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8d90a0]">
            <Link to="/" className="hover:text-[#dde2f7] transition-colors flex items-center gap-1">
              <span>Overview</span>
            </Link>
            <span>/</span>
            <Link to="/" className="hover:text-[#dde2f7] transition-colors">
              Priority Docket
            </Link>
            <span>/</span>
            <span className="text-[#4cd7f6]">{finding.entityName} ({finding.entityCode})</span>
            <span>/</span>
            <span className="text-[#dde2f7] font-semibold">{finding.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-[#131B2E] rounded flex items-center gap-1.5 text-[#8d90a0] border border-[#1E293B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
              <span className="font-mono text-[10px] text-[#4cd7f6] tracking-wider uppercase font-semibold">
                SUPERVISORY REVIEW SESSION
              </span>
            </div>
            {isDecisionConfirmed ? (
              <span
                className={`px-2.5 py-1 rounded font-mono text-[10px] font-semibold border ${
                  currentSyncStatus === 'PENDING_SYNC'
                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
                    : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                }`}
              >
                {currentSyncStatus === 'PENDING_SYNC' ? 'DECISION RECORDED (PENDING SYNC)' : 'DECISION RECORDED & SYNCED'}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-[#f59e0b]/10 text-[#f59e0b] font-mono text-[10px] font-semibold border border-[#f59e0b]/30">
                REVIEW PENDING
              </span>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Docket</span>
            </button>
          </div>
        </div>

        {/* Finding Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-mono text-[11px] font-semibold tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" />
                CRITICAL DEFECT // {finding.defectCode}
              </span>
              <span className="font-mono text-[11px] text-[#03b5d3] font-semibold tracking-wider">
                {finding.ruleCode} BREACH
              </span>
              <span className="px-2 py-0.5 rounded bg-[#191f2f] text-[#8d90a0] font-mono text-[10px]">
                NIST-800-61R2
              </span>
              <span className="px-2 py-0.5 rounded bg-[#191f2f] text-[#8d90a0] font-mono text-[10px]">
                {finding.targetProtocol}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight mt-1">
              {finding.title}
            </h1>
            <p className="text-xs text-[#c3c6d7]">
              {finding.summary}
            </p>
          </div>

          {/* Invariant Diagnostic Summary Pill */}
          <div className="flex items-center gap-3 sm:gap-4 p-2.5 bg-[#151b2b] rounded self-start lg:self-center border border-[#1E293B]">
            <div className="flex flex-col pr-3">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Signal Invariant</span>
              <span className="text-sm font-semibold font-mono text-[#ef4444]">
                {finding.handshakeRate} Handshake
              </span>
            </div>
            <div className="w-px h-7 bg-[#1E293B]"></div>
            <div className="flex flex-col pr-3">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Flagged Incidents</span>
              <span className="text-sm font-semibold font-mono text-[#4cd7f6]">
                {finding.flaggedIncidentsCount} Incidents
              </span>
            </div>
            <div className="w-px h-7 bg-[#1E293B]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Detection Confidence</span>
              <span className="text-sm font-semibold font-mono text-[#38BDF8]">
                {finding.confidence}% Valid
              </span>
            </div>
          </div>
        </div>

        {/* Forensic Metadata Bar (6 Columns) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 pt-1 font-mono text-[11px]">
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Supervised Entity</span>
            <span className="text-[#dde2f7] truncate font-semibold">{finding.entityName} ({finding.entityCode})</span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Target Criticality</span>
            <span className="text-[#4cd7f6] font-semibold">{finding.targetCriticality}</span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Assessment Period</span>
            <span className="text-[#dde2f7] font-semibold">{finding.assessmentCycle}</span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Assigned Inspector</span>
            <span className="text-[#dde2f7] font-semibold">{finding.inspector}</span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Evidence Integrity</span>
            <span className="text-[#10b981] flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" />
              {finding.ledgerSealStatus}
            </span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Review / Remediation Deadline</span>
            <span className="text-[#ef4444] font-semibold">{finding.remediationDeadline}</span>
          </div>
        </div>
      </div>

      {/* MAIN ANALYTICAL WORKSTATION CANVAS */}
      <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">

        {/* LEVEL 2: WORKFLOW PROVENANCE DIVERGENCE MATRIX (State Machine Comparative) */}
        <section className="bg-[#151b2b] rounded p-4 sm:p-5 flex flex-col gap-4 border border-[#1E293B]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-[#1A243B] text-[#4cd7f6]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#dde2f7] tracking-tight">
                  Workflow Provenance Divergence Matrix
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Comparative state machine: Standard operating baseline vs. ingested telemetry trace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[10px]">
              <span className="px-2.5 py-0.5 rounded bg-[#131B2E] text-[#c3c6d7] border border-[#1E293B]">
                REQUIRED CONTROL
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#93000a]/50 text-[#ffb4ab] font-semibold border border-[#ef4444]/40">
                DIAGNOSTIC GAP LOCATED
              </span>
            </div>
          </div>

          {/* State Machine Tracks Container */}
          <div className="flex flex-col gap-3 p-3 sm:p-4 bg-[#080e1d] rounded border border-[#1E293B]">
            {/* Track A: Control Baseline */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  TRACK A: CONTROL BASELINE (STANDARD OPERATING PROCEDURE)
                </span>
                <span className="font-mono text-[10px] text-[#8d90a0]">
                  Baseline SLA: 45 Minutes Cumulative
                </span>
              </div>

              {/* Expected Pipeline Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                {/* Step 1 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 01</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Alert Ingest</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">SIEM Telemetry Catch</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">t0 (Offset 0.0s)</span>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 02</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Tier-1 Triage</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Max 15m Response SLA</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Disposition Assigned</span>
                </div>

                {/* Step 3 (Required Key Step) */}
                <div className="p-3 bg-[#1A243B] rounded flex flex-col gap-1 border border-[#03b5d3]/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#03b5d3] font-semibold">
                      STEP 03 [REQUIRED CONTROL]
                    </span>
                    <Shield className="w-3.5 h-3.5 text-[#03b5d3]" />
                  </div>
                  <span className="text-xs font-semibold text-[#acedff]">Tier-3 Escalation</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Dual-Key Handshake Token</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Required for P0/P1</span>
                </div>

                {/* Step 4 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 04</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">CSIRT Containment</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Active Isolation Matrix</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Forensic Memory Snapshot</span>
                </div>

                {/* Step 5 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 05</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Attested Closure</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Supervisor Counter-Sign</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Archived to Vault</span>
                </div>
              </div>
            </div>

            {/* Visual Flow Connector & Bypass Arrow */}
            <div className="py-1 flex items-center justify-between px-2 text-[#8d90a0]">
              <div className="flex items-center gap-2 text-[#ef4444] font-mono text-[10px]">
                <ArrowLeft className="w-3.5 h-3.5 rotate-[-45deg]" />
                <span className="font-semibold uppercase tracking-wider">
                  Observed Invariant Deviation: Escalation Step Bypassed Directly Into Closure
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8d90a0]">
                FLOW CONFLICT // DELTA DETECTED
              </span>
            </div>

            {/* Track B: Observed Ingest */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#ef4444] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                  TRACK B: OBSERVED TELEMETRY INGEST (CYCLE 14 FORENSIC ARTIFACTS)
                </span>
                <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
                  Anomaly: Premature Closure in 4.2m Avg
                </span>
              </div>

              {/* Observed Pipeline Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                {/* Step 1 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 01</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Alert Ingest</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">14 Ingest Events Sealed</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">100% Ingested</span>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 02</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Tier-1 Triage</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
                    Classified: Critical P0
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">Duration: 1.8 mins</span>
                </div>

                {/* Step 3: CRITICAL DEFECT MISSING */}
                <div className="p-3 bg-[#93000a]/30 rounded flex flex-col gap-1 border border-[#ef4444]/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#ffb4ab] font-semibold">
                      STEP 03 // DEFECT
                    </span>
                    <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                  </div>
                  <span className="text-xs font-bold text-[#ffdad6]">ESCALATION ABSENT</span>
                  <span className="font-mono text-[10px] text-[#ffdad6]">0 Handshake Packets</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold mt-1">
                    VIOLATION DETECTED
                  </span>
                </div>

                {/* Step 4: BYPASSED */}
                <div className="p-3 bg-[#1A243B]/40 rounded flex flex-col gap-1 opacity-60 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 04</span>
                    <span className="font-mono text-[10px] text-[#8d90a0] line-through">N/A</span>
                  </div>
                  <span className="text-xs font-semibold text-[#8d90a0] line-through">
                    CSIRT Containment
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Bypassed Entirely</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">0 Log Entries</span>
                </div>

                {/* Step 5: PREMATURE CLOSURE */}
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 05</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                  </div>
                  <span className="text-xs font-semibold text-[#ef4444]">Premature Direct Closure</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">L1 Operator Disposal</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold mt-1">
                    4.2m Avg Close Time
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytical Footnote */}
          <div className="p-2.5 bg-[#131B2E] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px] border border-[#1E293B]">
            <div className="flex items-center gap-2 text-[#c3c6d7]">
              <BrainCircuit className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>
                Deterministic Detection Trigger: <code className="text-[#4cd7f6]">{finding.ruleCode}</code> (Required Control Engine)
              </span>
            </div>
            <div className="text-[#8d90a0]">
              Mathematical Grounding: {finding.flaggedIncidentsCount} out of {finding.totalEvaluatedIncidents} high-severity incidents show exactly zero Tier-3 supervisory handshakes.
            </div>
          </div>
        </section>

        {/* LEVEL 3: WHY THIS MATTERS (PROMINENT ANCHOR CARD) */}
        <section className="bg-gradient-to-r from-[#151b2b] via-[#131B2E] to-[#151b2b] rounded p-5 sm:p-6 border-l-4 border-l-[#ef4444] border border-[#1E293B] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              <span className="font-mono text-[11px] text-[#ef4444] tracking-wider uppercase font-semibold">
                WHY THIS MATTERS
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#dde2f7] tracking-tight">
              14 / 14 critical incidents reached closure without a recorded Tier-3 supervisory escalation.
            </h3>
            <p className="text-xs text-[#c3c6d7] leading-relaxed">
              SAT-SA identified the same structural workflow gap across all 14 evaluated incident dossiers. The pattern is consistent across the assessment scope and requires human supervisory review.
            </p>
          </div>

          {/* 3-Step Process Indicator Pill */}
          <div className="flex items-center gap-1.5 bg-[#080e1d] p-1.5 rounded border border-[#1E293B] shrink-0 font-mono text-[10px]">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#93000a]/40 border border-[#ef4444]/40 text-[#ffb4ab]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
              <span className="font-semibold">PATTERN DETECTED</span>
            </div>
            <span className="text-[#8d90a0]">→</span>
            {/* Step 2 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#03b5d3]/20 border border-[#03b5d3]/40 text-[#4cd7f6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
              <span className="font-semibold">EVIDENCE HASH VERIFIED</span>
            </div>
            <span className="text-[#8d90a0]">→</span>
            {/* Step 3 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2563eb]/30 border border-[#2563eb] text-[#b4c5ff] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
              <span className="font-semibold">HUMAN REVIEW</span>
            </div>
          </div>
        </section>

        {/* LEVEL 4: DUAL-COLUMN MIDDLE GRID: REASONER (A) & TRACEABILITY CHAIN (B) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN A: SUPERVISORY REASONER */}
          <section className="lg:col-span-7 bg-[#151b2b] rounded p-4 sm:p-5 flex flex-col gap-4 border border-[#1E293B]">
            {/* Reasoner Header */}
            <div className="flex items-center justify-between pb-1 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-[#7d4ce7]/20 text-[#d0bcff]">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#dde2f7] tracking-tight">
                      Supervisory Reasoner
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-[#191f2f] text-[#d0bcff] font-mono text-[10px] border border-[#7d4ce7]/30">
                      STRUCTURED ANALYTICS
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8d90a0]">
                    Evidence-grounded deductive synthesis against control framework rules.
                  </p>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded bg-[#1A243B] text-[#4cd7f6] font-mono text-[10px] flex items-center gap-1 border border-[#1E293B]">
                <FileCheck className="w-3 h-3" />
                <span>Unsupported Claims: 0</span>
              </div>
            </div>

            {/* Section 1: Ground Truth */}
            <div className="p-3.5 bg-[#080e1d] rounded flex flex-col gap-2 border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#03b5d3] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  GROUND TRUTH
                </span>
                <span className="font-mono text-[10px] text-[#8d90a0]">Ingested Telemetry Stream</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1">
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Evaluated Dossiers</span>
                  <span className="text-sm font-semibold font-mono text-[#dde2f7]">14 dossiers</span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Escalations Logged</span>
                  <span className="text-sm font-semibold font-mono text-[#ef4444]">0 records</span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Dispatch Tokens</span>
                  <span className="text-sm font-semibold font-mono text-[#ef4444]">0 tokens</span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Supervisor Signoffs</span>
                  <span className="text-sm font-semibold font-mono text-[#ef4444]">0 signoffs</span>
                </div>
              </div>

              <ul className="text-xs text-[#c3c6d7] space-y-1 font-mono bg-[#131B2E]/60 p-2.5 rounded border border-[#1E293B]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  14 Tier-3 security event dossiers evaluated during Cycle 14.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                  0 recorded Tier-3 escalation records or dispatch handshakes.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                  0 supervisor dispatch tokens or counter-sign packets in pipeline.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  Initial triage disposition immediately followed by case closure.
                </li>
              </ul>

              <div className="flex items-center gap-3 pt-1 font-mono text-[10px] text-[#8d90a0] flex-wrap">
                <span>Primary Offset: <span className="text-[#dde2f7]">{finding.primaryOffset}</span></span>
                <span>•</span>
                <span>Target Protocol: <span className="text-[#dde2f7]">{finding.targetProtocol}</span></span>
                <span>•</span>
                <span>Sensor: <span className="text-[#dde2f7]">{finding.sensorSource}</span></span>
              </div>
            </div>

            {/* Section 2: Interpretation */}
            <div className="p-3.5 bg-[#080e1d] rounded flex flex-col gap-2 border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#ef4444] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  INTERPRETATION
                </span>
                <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
                  Policy / Control Deviation
                </span>
              </div>
              <p className="text-xs text-[#dde2f7] leading-relaxed">
                The evidence indicates a recurring workflow deviation rather than an isolated incident. The automated orchestration pipeline permitted direct case closure bypassing mandatory escalation protocols. This pattern across multiple shifts demonstrates an orchestration gap allowing high-severity alerts to be closed without required supervisory review.
              </p>
              <div className="p-2.5 bg-[#93000a]/20 rounded flex items-center gap-2 text-[#ffdad6] font-mono text-[11px] border border-[#ef4444]/30">
                <FileCheck className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>
                  Recommended Supervisory Action: Corrective Action Plan Recommended under FinSec Operational Guidelines §12.
                </span>
              </div>
            </div>

            {/* Section 3: Evidence Consistency */}
            <div className="p-3.5 bg-[#080e1d] rounded flex flex-col gap-1.5 border border-[#1E293B]">
              <span className="font-mono text-[10px] text-[#03b5d3] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                EVIDENCE CONSISTENCY
              </span>
              <div className="p-2 bg-[#131B2E] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono border border-[#1E293B]">
                <span className="text-[#4cd7f6]">
                  99.4% evidence consistency • 14 dossiers • 3 parquet volumes • Unsupported Claims: 0
                </span>
                <span className="text-[#8d90a0]">41,208 records verified</span>
              </div>
            </div>

            {/* Reasoner Footer */}
            <div className="flex items-center justify-between p-2.5 bg-[#131B2E] rounded font-mono text-[10px] border border-[#1E293B]">
              <div className="flex items-center gap-1.5 text-[#03b5d3]">
                <Shield className="w-3 h-3" />
                <span>Deterministic Trigger: <code className="text-[#4cd7f6]">{finding.ruleCode}</code></span>
              </div>
              <div className="text-[#8d90a0]">
                Detection Confidence: <strong className="text-[#dde2f7]">{finding.confidence}%</strong> (84 Records Verified)
              </div>
            </div>
          </section>

          {/* COLUMN B: TRACEABILITY EVIDENCE CHAIN */}
          <section className="lg:col-span-5 bg-[#151b2b] rounded p-4 sm:p-5 flex flex-col gap-4 border border-[#1E293B]">
            <div className="flex items-center justify-between pb-1 border-b border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-[#1A243B] text-[#4cd7f6]">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#dde2f7] tracking-tight">
                    Traceability Chain
                  </h3>
                  <p className="text-[11px] text-[#8d90a0]">
                    Signal-to-source provenance and verification link.
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#4cd7f6]" />
            </div>

            {/* Vertical Linked Chain Graph (Nodes 1 to 6) */}
            <div className="flex flex-col gap-1.5 relative">
              {/* Node 1 */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">Finding Identity</span>
                  <span className="text-xs font-semibold text-[#dde2f7]">{finding.id}</span>
                  <span className="font-mono text-[10px] text-[#ef4444] truncate">{finding.title}</span>
                </div>
                <ShieldAlert className="w-3.5 h-3.5 text-[#8d90a0]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 2 */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">Evaluated Control Rule</span>
                  <span className="text-xs font-semibold font-mono text-[#dde2f7]">{finding.ruleCode}</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] truncate">
                    Mandatory Tier-3 Escalation Protocols ({finding.targetProtocol})
                  </span>
                </div>
                <FileCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 3 */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">Quantitative Metric</span>
                  <span className="text-xs font-semibold text-[#ef4444] font-mono">
                    Escalation Handshake Rate = {finding.handshakeRate}
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">
                    Expected Benchmark: 100.0% // Status: FAILED
                  </span>
                </div>
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 4 */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">Forensic Scope</span>
                  <span className="text-xs font-semibold text-[#dde2f7]">
                    {finding.flaggedIncidentsCount} Flagged Incident Dossiers
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">
                    Range: INC-8821 through INC-8834
                  </span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 5 */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  5
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">Source Telemetry Ingest</span>
                  <span className="text-xs font-semibold font-mono text-[#dde2f7] truncate">
                    {finding.telemetryFile}
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">
                    {finding.telemetryOffset}
                  </span>
                </div>
                <Download className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#4cd7f6]"></div>
              </div>

              {/* Node 6: Evidence Integrity Verification */}
              <div className="p-3 bg-[#131B2E] rounded flex items-start gap-3 border border-[#03b5d3]/40">
                <div className="w-5 h-5 rounded-full bg-[#03b5d3] text-[#001f26] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#4cd7f6] uppercase font-semibold">
                      Evidence Integrity Verification
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-[9px] border border-[#4cd7f6]/30">
                      VERIFIED
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#dde2f7] truncate mt-0.5">
                    SHA-256 Hash Verified: {finding.sha256Hash}
                  </span>
                  <span className="font-mono text-[9px] text-[#8d90a0]">
                    Verification Timestamp: {finding.evidenceTimestamp}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* LEVEL 4b: FORENSIC SOURCE RECORDS EXPLORER (Raw Telemetry Drawer) */}
        <section className="bg-[#151b2b] rounded p-4 sm:p-5 flex flex-col gap-4 border border-[#1E293B]">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-[#1A243B] text-[#4cd7f6]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#dde2f7] tracking-tight">
                  Forensic Source Records Explorer
                </h3>
                <p className="text-xs text-[#8d90a0]">
                  Raw Parquet event records ingested from {finding.sensorSource} during Cycle 14 window.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by Incident or Hash..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="pl-3 pr-3 py-1 rounded bg-[#080e1d] text-[#dde2f7] font-mono text-xs placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8] border border-[#1E293B] w-56"
                />
              </div>
              <button
                onClick={() => showToast('Initiated secure Parquet volume download (18.4 MB)')}
                className="px-3 py-1 bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] rounded transition-colors flex items-center gap-1.5 border border-[#1E293B]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Parquet</span>
              </button>
              <span className="px-2.5 py-1 bg-[#1A243B] text-[#4cd7f6] rounded font-mono text-[10px] font-semibold border border-[#1E293B]">
                {filteredRecords.length} Verified Records
              </span>
            </div>
          </div>

          {/* Data Table with Expandable Payloads */}
          <div className="overflow-x-auto bg-[#080e1d] rounded border border-[#1E293B]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#131B2E] text-[#8d90a0] text-[10px] uppercase tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="px-4 py-2.5">Case Identifier</th>
                  <th className="px-4 py-2.5">Alert Timestamp</th>
                  <th className="px-4 py-2.5">Triage Complete</th>
                  <th className="px-4 py-2.5 text-[#ef4444]">Recorded Escalation</th>
                  <th className="px-4 py-2.5">Closure Timestamp</th>
                  <th className="px-4 py-2.5">Disposition Given</th>
                  <th className="px-4 py-2.5">Provenance Hash</th>
                  <th className="px-4 py-2.5 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredRecords.map((record) => {
                  const isExpanded = expandedRow === record.incidentId;
                  return (
                    <React.Fragment key={record.incidentId}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? '' : record.incidentId)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[#131B2E]/90' : 'hover:bg-[#131B2E]/50'
                        }`}
                      >
                        <td className="px-4 py-2.5 font-semibold text-[#4cd7f6] flex items-center gap-1.5">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#4cd7f6]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#8d90a0]" />
                          )}
                          <span>{record.incidentId}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[#c3c6d7]">{record.alertTimestamp}</td>
                        <td className="px-4 py-2.5 text-[#c3c6d7]">{record.triageComplete}</td>
                        <td className="px-4 py-2.5 text-[#ef4444] font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-[#ef4444]" />
                          <span>{record.recordedEscalation}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[#c3c6d7]">{record.closureTimestamp}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#c3c6d7] text-[10px] border border-[#1E293B]">
                            {record.dispositionGiven}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#8d90a0] truncate max-w-[120px]">
                          {record.provenanceHash}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              record.auditActionStatus === 'Inspected'
                                ? 'bg-[#151b2b] text-[#4cd7f6] border border-[#4cd7f6]/30'
                                : 'bg-[#151b2b] text-[#8d90a0] border border-[#1E293B]'
                            }`}
                          >
                            {record.auditActionStatus}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable JSON Telemetry Payload Snapshot */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <div className="bg-[#080e1d] p-4 flex flex-col gap-2.5 border-l-2 border-[#4cd7f6] border-b border-[#1E293B]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#4cd7f6] font-semibold uppercase tracking-wider flex items-center gap-2">
                                  <Terminal className="w-3.5 h-3.5" />
                                  Raw Telemetry Payload Snapshot: {record.incidentId} (Parquet Partition 20250325-01)
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[#8d90a0] text-[11px]">
                                    Offset: 41,206 // ByteLength: 1,842
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyJson(record);
                                    }}
                                    className="px-2.5 py-0.5 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#4cd7f6] text-[11px] flex items-center gap-1 border border-[#1E293B] transition-colors"
                                  >
                                    {copiedId === record.incidentId ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#10b981]" />
                                        <span className="text-[#10b981]">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy JSON</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Structured Syntax Highlighted Code Viewer */}
                              <div className="p-3.5 bg-[#090D16] rounded font-mono text-[11px] text-[#dde2f7] overflow-x-auto leading-relaxed border border-[#1E293B]">
                                <pre className="m-0">
                                  <code>
{`{
  `}<span className="text-[#8d90a0]">"incident_id"</span>{`: `}<span className="text-[#4cd7f6]">"${record.rawPayload.incident_id}"</span>{`,
  `}<span className="text-[#8d90a0]">"entity_urn"</span>{`: `}<span className="text-[#4cd7f6]">"${record.rawPayload.entity_urn}"</span>{`,
  `}<span className="text-[#8d90a0]">"classification"</span>{`: `}<span className="text-[#ef4444]">"${record.rawPayload.classification}"</span>{`,
  `}<span className="text-[#8d90a0]">"initial_triage"</span>{`: {
    `}<span className="text-[#8d90a0]">"operator_id"</span>{`: `}<span className="text-[#dde2f7]">"${record.rawPayload.initial_triage.operator_id}"</span>{`,
    `}<span className="text-[#8d90a0]">"timestamp"</span>{`: `}<span className="text-[#acedff]">"${record.rawPayload.initial_triage.timestamp}"</span>{`,
    `}<span className="text-[#8d90a0]">"threat_vector"</span>{`: `}<span className="text-[#dde2f7]">"${record.rawPayload.initial_triage.threat_vector}"</span>{`
  },
  `}<span className="text-[#8d90a0]">"escalation_event_recorded"</span>{`: `}<span className="text-[#ef4444] font-bold">null</span>{`,
  `}<span className="text-[#8d90a0]">"escalation_handshake_tokens"</span>{`: `}<span className="text-[#ef4444] font-bold">[]</span>{`,
  `}<span className="text-[#8d90a0]">"supervisor_review_signoff"</span>{`: `}<span className="text-[#ef4444] font-bold">false</span>{`,
  `}<span className="text-[#8d90a0]">"closure_event"</span>{`: {
    `}<span className="text-[#8d90a0]">"disposition"</span>{`: `}<span className="text-[#dde2f7]">"${record.rawPayload.closure_event.disposition}"</span>{`,
    `}<span className="text-[#8d90a0]">"timestamp"</span>{`: `}<span className="text-[#acedff]">"${record.rawPayload.closure_event.timestamp}"</span>{`,
    `}<span className="text-[#8d90a0]">"elapsed_seconds"</span>{`: `}<span className="text-[#dde2f7]">${record.rawPayload.closure_event.elapsed_seconds}</span>{`
  },
  `}<span className="text-[#8d90a0]">"audit_violation_flag"</span>{`: `}<span className="text-[#ef4444] font-bold">true</span>{`,
  `}<span className="text-[#8d90a0]">"rule_violated"</span>{`: `}<span className="text-[#ef4444]">"${record.rawPayload.rule_violated}"</span>{`
}`}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* LEVEL 5: HUMAN SUPERVISOR DECISION PANEL (Supervisory Determination) */}
        <section className="bg-[#151b2b] rounded p-4 sm:p-6 flex flex-col gap-4 border border-[#1E293B] shadow-xl">
          {/* Decision Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#2563eb] text-white">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#dde2f7] tracking-tight">
                    SUPERVISOR DECISION
                  </h2>
                  {isDecisionConfirmed ? (
                    <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-mono text-[10px] font-semibold border border-[#10b981]/40">
                      DECISION RECORDED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-mono text-[10px] font-semibold border border-[#f59e0b]/40">
                      REVIEW PENDING
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8d90a0]">
                  SAT-SA provides the evidence and recommendation. The supervisor makes the final review decision.{' '}
                  <strong className="text-[#4cd7f6] uppercase font-mono text-[11px] ml-1">
                    SAT-SA recommends. Human decides.
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#8d90a0] font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#4cd7f6]" />
              <span>Evidence Integrity Verification Active</span>
            </div>
          </div>

          {/* READ-ONLY RECORD STATE: Rendered when decision is confirmed */}
          {isDecisionConfirmed && confirmationRecord ? (
            <div
              className={`p-4 rounded bg-[#080e1d] border-2 flex flex-col gap-3.5 transition-all ${
                currentSyncStatus === 'PENDING_SYNC'
                  ? 'border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  : currentSyncStatus === 'SYNCING'
                  ? 'border-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.15)] animate-pulse'
                  : 'border-[#10b981]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                  {currentSyncStatus === 'PENDING_SYNC' ? (
                    <>
                      <Clock className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-[#f59e0b]">DECISION RECORDED LOCALLY</span>
                    </>
                  ) : currentSyncStatus === 'SYNCING' ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-[#38BDF8] animate-spin" />
                      <span className="text-[#38BDF8]">SYNCHRONIZING WITH SUPERVISORY REGISTRY...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                      <span className="text-[#10b981]">SUPERVISORY DECISION RECORDED & SYNCED</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold border ${
                      currentSyncStatus === 'PENDING_SYNC'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
                        : currentSyncStatus === 'SYNCING'
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40'
                        : 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                    }`}
                  >
                    STATUS: {currentSyncStatus || 'SAVED LOCALLY'}
                  </span>

                  {currentSyncStatus === 'PENDING_SYNC' && (
                    <button
                      onClick={() => setIsQueueDrawerOpen(true)}
                      className="px-2 py-0.5 rounded bg-[#131B2E] text-[#4cd7f6] hover:text-white border border-[#38BDF8]/40 hover:bg-[#1A243B] transition-colors"
                    >
                      Inspect Queue →
                    </button>
                  )}
                </div>
              </div>

              {currentSyncStatus === 'PENDING_SYNC' && (
                <div className="p-2.5 rounded bg-[#1A1810] border border-[#f59e0b]/30 text-[11px] font-mono text-[#f59e0b] flex items-center justify-between">
                  <span>
                    Offline Resilience: Decision stored in IndexedDB Vault. Survives page reloads and will automatically synchronize once connectivity is established.
                  </span>
                </div>
              )}

              <div className="p-3 bg-[#131B2E]/60 rounded border border-[#1E293B]">
                <div className="text-[10px] font-mono text-[#8d90a0] uppercase mb-1">
                  Recorded Determination:
                </div>
                <div className="text-sm font-semibold text-[#dde2f7]">
                  {confirmationRecord.decision}
                </div>
              </div>

              <div className="p-3 bg-[#090D16] rounded border border-[#1E293B] text-xs font-mono text-[#c3c6d7] leading-relaxed">
                <div className="text-[10px] text-[#8d90a0] uppercase font-semibold mb-1">
                  Supervisory Rationale & Justification:
                </div>
                "{decisionRationale}"
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#1E293B] font-mono text-[10px] text-[#8d90a0] gap-2">
                <span>Supervisor: {finding.inspector} (Lead Supervisory Inspector)</span>
                <span>Subsequent Supervisory Review: {confirmationRecord.timestamp}</span>
                <span>Local Verification Hash: <code className="text-[#4cd7f6]">{confirmationRecord.commitHash}</code></span>
              </div>

              {/* Action Controls for Recorded State */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1E293B] gap-2">
                <button
                  onClick={handleReopenDecision}
                  className="px-3 py-1.5 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  <span>Modify Decision / Reopen Review</span>
                </button>
                {currentSyncStatus === 'PENDING_SYNC' && (
                  <button
                    onClick={() => setIsQueueDrawerOpen(true)}
                    className="px-3 py-1.5 rounded bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#f59e0b]/30"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Inspect Sync Queue ({pendingActions.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* INTERACTIVE REVIEW STATE: Rendered when decision is pending */
            <>
              {/* Decision Selection Cards (3 Options) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option 1: Uphold (Recommended) */}
                <label
                  onClick={() => setSelectedDecision('UPHOLD')}
                  className={`cursor-pointer p-4 rounded flex flex-col gap-2 transition-all border ${
                    selectedDecision === 'UPHOLD'
                      ? 'bg-[#1A243B] border-[#ef4444]'
                      : 'bg-[#080e1d] border-[#1E293B] hover:bg-[#131B2E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="supervisor_decision"
                        checked={selectedDecision === 'UPHOLD'}
                        onChange={() => setSelectedDecision('UPHOLD')}
                        className="w-4 h-4 text-[#2563eb] bg-[#090D16]"
                      />
                      <span className="text-sm font-semibold text-[#ef4444]">
                        Uphold Critical Defect
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#93000a]/50 text-[#ffdad6] text-[9px] font-mono font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-xs text-[#c3c6d7] mt-0.5">
                    Confirm Critical Defect & Recommend Corrective Action Plan. Affirms systemic breach of RULE-ESC-04 across 14 high-severity events.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#ef4444] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Corrective Action Plan Recommended</span>
                  </div>
                </label>

                {/* Option 2: Downgrade */}
                <label
                  onClick={() => setSelectedDecision('DOWNGRADE')}
                  className={`cursor-pointer p-4 rounded flex flex-col gap-2 transition-all border ${
                    selectedDecision === 'DOWNGRADE'
                      ? 'bg-[#1A243B] border-[#f59e0b]'
                      : 'bg-[#080e1d] border-[#1E293B] hover:bg-[#131B2E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="supervisor_decision"
                        checked={selectedDecision === 'DOWNGRADE'}
                        onChange={() => setSelectedDecision('DOWNGRADE')}
                        className="w-4 h-4 text-[#2563eb] bg-[#090D16]"
                      />
                      <span className="text-sm font-semibold text-[#dde2f7]">
                        Downgrade to Observation
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#c3c6d7] mt-0.5">
                    Classifies event as an uncalibrated telemetry ingest delay rather than an operational failure. Requires supplementary logs from Apex within 48 hours.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#8d90a0] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Deferred Attestation Window</span>
                  </div>
                </label>

                {/* Option 3: Dismiss */}
                <label
                  onClick={() => setSelectedDecision('DISMISS')}
                  className={`cursor-pointer p-4 rounded flex flex-col gap-2 transition-all border ${
                    selectedDecision === 'DISMISS'
                      ? 'bg-[#1A243B] border-[#8d90a0]'
                      : 'bg-[#080e1d] border-[#1E293B] hover:bg-[#131B2E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="supervisor_decision"
                        checked={selectedDecision === 'DISMISS'}
                        onChange={() => setSelectedDecision('DISMISS')}
                        className="w-4 h-4 text-[#2563eb] bg-[#090D16]"
                      />
                      <span className="text-sm font-semibold text-[#dde2f7]">
                        Dismiss Finding
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#c3c6d7] mt-0.5">
                    Accepts entity assertion of an authorized operational waiver or valid out-of-band supervisory phone dispatch log not captured in SIEM data.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#8d90a0] flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Requires Review Note</span>
                  </div>
                </label>
              </div>

              {/* Inquest Rationale Editor */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-[#8d90a0] uppercase tracking-wider font-semibold">
                    SUPERVISORY REVIEW RATIONALE & JUSTIFICATION
                  </label>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Supervisory Decision Record</span>
                </div>
                <textarea
                  rows={3}
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  className="w-full p-3 bg-[#080e1d] rounded text-xs text-[#dde2f7] leading-relaxed focus:outline-none focus:border-[#38BDF8] resize-none font-mono border border-[#1E293B]"
                />
              </div>

              {/* Supervisory Execution Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                {/* Inspector Identity & Stamp */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1A243B] flex items-center justify-center text-[#4cd7f6] border border-[#1E293B]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dde2f7]">{finding.inspector}</span>
                    <span className="font-mono text-[10px] text-[#8d90a0]">
                      Lead Supervisory Inspector • Supervisory Oversight Team
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedDecision('DISMISS');
                      showToast('Drafted dismissal review note');
                    }}
                    className="px-3 py-2 rounded bg-[#080e1d] hover:bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss with Review Note</span>
                  </button>

                  <button
                    onClick={() =>
                      showToast('Formal request for supplementary telemetry dispatched to CSE-FIN-08')
                    }
                    className="px-3 py-2 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Additional Records from CSE-FIN-08</span>
                  </button>

                  <button
                    onClick={handleConfirmDecision}
                    className="px-4 py-2 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-mono text-[11px] font-semibold transition-colors flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CONFIRM SUPERVISORY DECISION</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Evidence Integrity & Verification Footer */}
          <div className="p-2 px-3 bg-[#080e1d] rounded flex flex-col sm:flex-row sm:items-center justify-between text-[#8d90a0] font-mono text-[10px] border border-[#1E293B]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span>Evidence Integrity: <span className="text-[#dde2f7] font-semibold">SHA-256 Verified</span></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span>Evidence Snapshot: <span className="text-[#4cd7f6] font-semibold">Ingested & Verified</span></span>
              </div>
            </div>
            <div>Verification Timestamp: <span className="text-[#dde2f7]">{finding.lastUpdated}</span></div>
          </div>
        </section>

      </div>
    </div>
  );
};
