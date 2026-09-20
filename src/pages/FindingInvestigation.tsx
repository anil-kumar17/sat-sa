import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  Gavel,
  ShieldCheck,
  Terminal,
  Activity,
  RefreshCw,
  Database,
  Hash,
  X,
  FileCode
} from 'lucide-react';
import { mockFindings, mockForensicRecords } from '../data/mockData';
import { Finding, ForensicRecord, SourceRecord } from '../types';
import { useOffline } from '../context/OfflineContext';
import {
  findingsRepository,
  evidenceRepository,
  sourceRecordRepository,
  auditRepository
} from '../repositories';

export const FindingInvestigation: React.FC = () => {
  const { findingId: routeFindingId } = useParams<{ findingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeFindingId = routeFindingId || searchParams.get('id') || 'FND-2025-014';

  const {
    connectivityState,
    pendingActions,
    enqueueSupervisorDecision,
    setIsQueueDrawerOpen
  } = useOffline();

  // Primary states
  const [finding, setFinding] = useState<Finding>(
    mockFindings.find((f) => f.id === activeFindingId) || mockFindings[0]
  );
  const [forensicRecords, setForensicRecords] = useState<ForensicRecord[]>([]);
  const [sourceRecordsMap, setSourceRecordsMap] = useState<Map<string, SourceRecord>>(new Map());
  const [inspectingSourceRecord, setInspectingSourceRecord] = useState<SourceRecord | null>(null);

  // Table state
  const [expandedRow, setExpandedRow] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Human Supervisor Decision State
  const [selectedDecision, setSelectedDecision] = useState<'UPHOLD' | 'DOWNGRADE' | 'DISMISS'>('UPHOLD');
  const [decisionRationale, setDecisionRationale] = useState<string>('');
  const [isDecisionConfirmed, setIsDecisionConfirmed] = useState<boolean>(false);
  const [confirmationRecord, setConfirmationRecord] = useState<{
    decision: string;
    timestamp: string;
    verificationReference: string;
  } | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getRawPayloadValue = (
    sourceRecord: SourceRecord | undefined,
    keys: string[]
  ): string | undefined => {
    if (!sourceRecord?.rawPayload) return undefined;

    for (const key of keys) {
      const value = sourceRecord.rawPayload[key];
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }

    return undefined;
  };

  const getDisplayClosureTimestamp = (
    record: ForensicRecord,
    sourceRecord?: SourceRecord
  ): string => {
    if (record.closureTimestamp && record.closureTimestamp !== 'Not recorded') {
      return record.closureTimestamp;
    }

    return (
      getRawPayloadValue(sourceRecord, ['closure_timestamp', 'closureTimestamp']) ||
      'Not recorded'
    );
  };

  // Load finding, decision, explicit evidence, and source records
  useEffect(() => {
    async function loadData() {
      // 1. Fetch Finding
      let currentFinding = await findingsRepository.getById(activeFindingId);
      if (!currentFinding) {
        currentFinding = mockFindings.find((f) => f.id === activeFindingId) || mockFindings[0];
      }
      setFinding(currentFinding);

      // Start with a neutral review note; the supervisor records the determination.
      const defaultRationale =
        `Review of ${currentFinding.gapCount ?? currentFinding.flaggedIncidentsCount} potential execution gap(s) across ` +
        `${currentFinding.applicableCaseCount ?? currentFinding.totalEvaluatedIncidents} applicable case(s) under ${currentFinding.ruleCode}. ` +
        `Submitted records show missing escalation evidence for the affected cases. ` +
        `Supervisor review is required to determine whether the finding should be upheld, downgraded, or dismissed.`;
      setDecisionRationale(defaultRationale);

      // 2. Fetch specific evidence by ID list - STRICT PROVENANCE: NEVER CALL evidenceRepository.getAll()!
      const evidenceIds = currentFinding.evidenceRecordIds || currentFinding.affectedCaseIds;
      if (evidenceIds && evidenceIds.length > 0) {
        const specificEvidence = await evidenceRepository.getByIds(evidenceIds);
        setForensicRecords(specificEvidence);
        if (specificEvidence.length > 0) {
          setExpandedRow(specificEvidence[0].incidentId);
        }
      } else if (currentFinding.id === 'FND-2025-014') {
        // Fallback for initial demo finding
        setForensicRecords(mockForensicRecords);
        setExpandedRow('INC-8821');
      } else {
        setForensicRecords([]);
      }

      // 3. Fetch source records if referenced for complete provenance trace
      const srcIds = currentFinding.sourceRecordIds || [];
      const sMap = new Map<string, SourceRecord>();
      if (srcIds.length > 0) {
        for (const sId of srcIds) {
          const sRecord = await sourceRecordRepository.getById(sId);
          if (sRecord) {
            sMap.set(sId, sRecord);
            const caseId = (sRecord.rawPayload?.case_id || sRecord.rawPayload?.caseId || '') as string;
            if (caseId) {
              sMap.set(caseId, sRecord);
            }
          }
        }
      }
      setSourceRecordsMap(sMap);

      // 4. Load existing decision
      const existingDecision = await findingsRepository.getSupervisorDecision(currentFinding.id);
      if (existingDecision) {
        setIsDecisionConfirmed(true);
        setSelectedDecision(existingDecision.decision);
        setDecisionRationale(existingDecision.rationale);
        setConfirmationRecord({
          decision: existingDecision.decisionTitle,
          timestamp: existingDecision.decidedAt,
          verificationReference: existingDecision.sha256Verification
        });
      } else {
        setIsDecisionConfirmed(false);
        setConfirmationRecord(null);
      }
    }

    loadData();
  }, [activeFindingId]);

  // Derived metrics ensuring dynamic synchronization with Finding model
  const applicableCount = finding.applicableCaseCount ?? finding.totalEvaluatedIncidents;
  const gapCount = finding.gapCount ?? finding.flaggedIncidentsCount;
  const observedCount = finding.observedCount ?? Math.max(0, applicableCount - gapCount);
  const gapRateFormatted = finding.gapRate !== undefined
    ? `${finding.gapRate.toFixed(1)}%`
    : finding.handshakeRate;
  const evidenceRecordCount = forensicRecords.length;
  const evidenceCoverageRate = gapCount > 0
    ? Math.min(100, Math.round((evidenceRecordCount / gapCount) * 100))
    : 100;

  // Determine current synchronization status for this finding
  const queuedAction = pendingActions.find((a) => a.findingId === finding.id);
  const currentSyncStatus = queuedAction
    ? queuedAction.syncStatus
    : isDecisionConfirmed
    ? (connectivityState === 'OFFLINE' ? 'PENDING_SYNC' : 'SYNCED')
    : null;

  const handleCopyJson = (payload: unknown, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    showToast(`Copied raw payload for ${id} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDecision = async () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const verificationReference =
      finding.sourceIntegrityFingerprint || finding.sha256Hash || 'Not available';

    try {
      await enqueueSupervisorDecision(
        finding.id,
        selectedDecision,
        decisionRationale,
        finding.inspector
      );

      // Log formal audit trail event for supervisor decision
      try {
        await auditRepository.logEvent({
          timestamp: new Date().toISOString(),
          inspector: finding.inspector,
          actionType: 'SUPERVISOR_DECISION_RECORDED',
          targetEntity: finding.entityCode,
          targetRef: finding.id,
          provenanceHash: finding.sha256Hash || finding.sourceIntegrityFingerprint || 'Not available',
          integrityStatus: 'VALIDATED',
          summary: `Supervisor ${finding.inspector} recorded decision '${selectedDecision}' on finding ${finding.id}.`
        });
      } catch (err) {
        console.warn('Could not log supervisor audit event:', err);
      }

      setConfirmationRecord({
        decision:
          selectedDecision === 'UPHOLD'
            ? 'Finding upheld — supervisory review recorded'
            : selectedDecision === 'DOWNGRADE'
            ? 'Finding downgraded to observation — supervisory review recorded'
            : 'Finding dismissed — supervisory review recorded',
        timestamp,
        verificationReference
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
            <Link to="/findings" className="hover:text-[#dde2f7] transition-colors">
              Findings Registry
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
              onClick={() => navigate('/findings')}
              className="px-3 py-1 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Registry</span>
            </button>
          </div>
        </div>

        {/* Finding Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-mono text-[11px] font-semibold tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" />
                POTENTIAL CONTROL DEVIATION
              </span>
              <span className="font-mono text-[11px] text-[#03b5d3] font-semibold tracking-wider">
                RULE {finding.ruleCode}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#191f2f] text-[#8d90a0] font-mono text-[10px]">
                SUPERVISORY RULE
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
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Gap Rate</span>
              <span className="text-sm font-semibold font-mono text-[#ef4444]">
                {gapRateFormatted}
              </span>
            </div>
            <div className="w-px h-7 bg-[#1E293B]"></div>
            <div className="flex flex-col pr-3">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Flagged Cases</span>
              <span className="text-sm font-semibold font-mono text-[#4cd7f6]">
                {gapCount} Cases
              </span>
            </div>
            <div className="w-px h-7 bg-[#1E293B]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase">Detection Basis</span>
              <span className="text-sm font-semibold font-mono text-[#38BDF8]">
                Deterministic Rule
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
              {finding.sourceIntegrityFingerprint || finding.sha256Hash ? "SHA-256 fingerprint recorded" : "Not available"}
            </span>
          </div>
          <div className="p-2 bg-[#151b2b] rounded flex flex-col border border-[#1E293B]/60">
            <span className="text-[#8d90a0] text-[10px]">Remediation Deadline</span>
            <span className="text-[#ef4444] font-semibold">{finding.remediationDeadline}</span>
          </div>
        </div>
      </div>

      {/* MAIN ANALYTICAL WORKSTATION CANVAS */}
      <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">

        {/* PROMINENT DATA QUALITY LIMITATION CALLOUT (Step 3 Requirement) */}
        {((finding.dataQualityLimitedCount ?? 0) > 0 || finding.overallDataQuality === 'DATA_QUALITY_LIMITED') && (
          <div className="p-4 rounded-lg bg-[#78350f]/25 border-l-4 border-[#f59e0b] border-[#f59e0b]/40 text-[#fde047] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-mono font-bold uppercase tracking-wider text-[#f59e0b]">
                SUPERVISORY DATA QUALITY NOTICE: ANALYSIS LIMITED BY SOURCE DATA QUALITY
              </div>
              <p className="leading-relaxed text-[#fde047]/95">
                {finding.dataQualityLimitedCount || 1} evaluated operational case(s) in this submission had data-quality limitations ({finding.dataQualityLimitedCaseIds?.join(', ') || 'flagged'}).
                Analysis is strictly constrained by source data quality. These cases are flagged for manual review and are <strong>NOT</strong> counted as confirmed operational gaps.
              </p>
            </div>
          </div>
        )}

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
                  Comparative state machine: Standard operating baseline vs. ingested operational trace.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[10px]">
              <span className="px-2.5 py-0.5 rounded bg-[#131B2E] text-[#c3c6d7] border border-[#1E293B]">
                REQUIRED CONTROL
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#93000a]/50 text-[#ffb4ab] font-semibold border border-[#ef4444]/40">
                POTENTIAL GAP LOCATED
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
                  TRACK A: CONTROL BASELINE ({finding.ruleCode} MANDATORY ESCALATION)
                </span>
                <span className="font-mono text-[10px] text-[#8d90a0]">
                  Baseline SLA: Mandatory Escalation Before Closure
                </span>
              </div>

              {/* Expected Pipeline Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 01</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Alert Ingest</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Event Ingestion Catch</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">t0 (Offset 0.0s)</span>
                </div>

                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 02</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Triage Assessment</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Severity Evaluated</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Disposition Assigned</span>
                </div>

                <div className="p-3 bg-[#1A243B] rounded flex flex-col gap-1 border border-[#03b5d3]/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#03b5d3] font-semibold">
                      STEP 03 [REQUIRED CONTROL]
                    </span>
                    <Shield className="w-3.5 h-3.5 text-[#03b5d3]" />
                  </div>
                  <span className="text-xs font-semibold text-[#acedff]">Mandatory Escalation</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Escalation Evidence Record</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Required for Critical</span>
                </div>

                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 04</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Supervisory Signoff</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Escalation Attestation</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Evidence Record</span>
                </div>

                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 05</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Attested Closure</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Final Disposal Validated</span>
                  <span className="font-mono text-[10px] text-[#4cd7f6] mt-1">Retained in Submission</span>
                </div>
              </div>
            </div>

            {/* Visual Flow Connector */}
            <div className="py-1 flex items-center justify-between px-2 text-[#8d90a0]">
              <div className="flex items-center gap-2 text-[#ef4444] font-mono text-[10px]">
                <ArrowLeft className="w-3.5 h-3.5 rotate-[-45deg]" />
                <span className="font-semibold uppercase tracking-wider">
                  Observed Deviation: Escalation Evidence Absent Prior to Closure
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8d90a0]">
                EXECUTION GAP IDENTIFIED
              </span>
            </div>

            {/* Track B: Observed Ingest */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#ef4444] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                  TRACK B: OBSERVED OPERATIONAL STREAM ({finding.submissionId || 'Operational Batch'})
                </span>
                <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
                  Deviation: {gapCount} Cases Closed Without Recorded Escalation
                </span>
              </div>

              {/* Observed Pipeline Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 01</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Alert Ingest</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">{applicableCount} Cases Ingested</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">Submission record retained</span>
                </div>

                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 02</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  </div>
                  <span className="text-xs font-semibold text-[#dde2f7]">Triage Complete</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold">
                    Target: Critical Severity
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">Triage Recorded</span>
                </div>

                <div className="p-3 bg-[#93000a]/30 rounded flex flex-col gap-1 border border-[#ef4444]/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#ffb4ab] font-semibold">
                      STEP 03 // DEFECT
                    </span>
                    <XCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                  </div>
                  <span className="text-xs font-bold text-[#ffdad6]">ESCALATION ABSENT</span>
                  <span className="font-mono text-[10px] text-[#ffdad6]">{observedCount} Recorded Escalations</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold mt-1">
                    {gapCount} GAPS DETECTED
                  </span>
                </div>

                <div className="p-3 bg-[#1A243B]/40 rounded flex flex-col gap-1 opacity-60 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 04</span>
                    <span className="font-mono text-[10px] text-[#8d90a0] line-through">N/A</span>
                  </div>
                  <span className="text-xs font-semibold text-[#8d90a0] line-through">
                    Supervisory Review
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Bypassed / Not Logged</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] mt-1">0 Signoff Records</span>
                </div>

                <div className="p-3 bg-[#131B2E] rounded flex flex-col gap-1 border border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#8d90a0]">STEP 05</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                  </div>
                  <span className="text-xs font-semibold text-[#ef4444]">Direct Case Closure</span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">Operational Disposal</span>
                  <span className="font-mono text-[10px] text-[#ef4444] font-semibold mt-1">
                    Closed Without Escalation
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#080e1d] rounded font-mono text-[11px] border border-[#1E293B]">
            <div className="text-[#8d90a0]">
              Mathematical Grounding: {gapCount} out of {applicableCount} applicable critical cases lack required escalation evidence in submitted records.
            </div>
            <div className="text-[#4cd7f6] font-semibold">
              Execution Gap Rate = {gapRateFormatted}
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
              {gapCount} / {applicableCount} critical cases reached closure without recorded escalation evidence.
            </h3>
            <p className="text-xs text-[#c3c6d7] leading-relaxed">
              SAT-SA identified the same structural workflow gap across all {gapCount} evaluated operational cases. The pattern requires human supervisory review.
            </p>
          </div>

          {/* 3-Step Process Indicator Pill */}
          <div className="flex items-center gap-1.5 bg-[#080e1d] p-1.5 rounded border border-[#1E293B] shrink-0 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#93000a]/40 border border-[#ef4444]/40 text-[#ffb4ab]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
              <span className="font-semibold">GAP IDENTIFIED</span>
            </div>
            <span className="text-[#8d90a0]">→</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#03b5d3]/20 border border-[#03b5d3]/40 text-[#4cd7f6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
              <span className="font-semibold">EVIDENCE ANCHORED</span>
            </div>
            <span className="text-[#8d90a0]">→</span>
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
                <span>Deterministic Output</span>
              </div>
            </div>

            {/* Section 1: Ground Truth */}
            <div className="p-3.5 bg-[#080e1d] rounded flex flex-col gap-2 border border-[#1E293B]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#03b5d3] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  EVALUATED DATASET
                </span>
                <span className="font-mono text-[10px] text-[#8d90a0]">Ingested Operational Dataset</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1">
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Evaluated Cases</span>
                  <span className="text-sm font-semibold font-mono text-[#dde2f7]">{applicableCount} cases</span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Escalations Logged</span>
                  <span className={`text-sm font-semibold font-mono ${observedCount > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {observedCount} records
                  </span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Execution Gaps</span>
                  <span className={`text-sm font-semibold font-mono ${gapCount > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    {gapCount} cases
                  </span>
                </div>
                <div className="p-2 bg-[#131B2E] rounded flex flex-col border border-[#1E293B]">
                  <span className="font-mono text-[10px] text-[#8d90a0]">Gap Rate</span>
                  <span className={`text-sm font-semibold font-mono ${gapCount > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    {gapRateFormatted}
                  </span>
                </div>
              </div>

              <ul className="text-xs text-[#c3c6d7] space-y-1 font-mono bg-[#131B2E]/60 p-2.5 rounded border border-[#1E293B]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  {applicableCount} critical operational cases evaluated under {finding.ruleCode}.
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${observedCount > 0 ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                  {observedCount} recorded escalation events observed in operational records.
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${gapCount > 0 ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`}></span>
                  {gapCount} critical operational cases missing mandatory escalation evidence before closure.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  Initial triage classification followed by direct closure without requisite escalation anchor.
                </li>
              </ul>

              <div className="flex items-center gap-3 pt-1 font-mono text-[10px] text-[#8d90a0] flex-wrap">
                <span>Rule Code: <span className="text-[#dde2f7]">{finding.ruleCode}</span></span>
                <span>•</span>
                <span>Target Protocol: <span className="text-[#dde2f7]">{finding.targetProtocol}</span></span>
                <span>•</span>
                <span>Submission: <span className="text-[#dde2f7]">{finding.submissionId || 'Operational Ingest'}</span></span>
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
                The evidence indicates a recurring operational pattern. Critical cases reached closure bypassing mandatory escalation protocols. The deterministic engine flagged {gapCount} potential execution gaps for human supervisory determination.
              </p>
              <div className="p-2.5 bg-[#93000a]/20 rounded flex items-center gap-2 text-[#ffdad6] font-mono text-[11px] border border-[#ef4444]/30">
                <FileCheck className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>
                  Recommended Supervisory Action: Review evidence chain and render supervisory determination.
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
                  {evidenceCoverageRate}% evidence coverage • {applicableCount} applicable cases evaluated • Deterministic analysis
                </span>
                <span className="text-[#8d90a0]">{evidenceRecordCount} records linked</span>
              </div>
            </div>

            {/* Reasoner Footer */}
            <div className="flex items-center justify-between p-2.5 bg-[#131B2E] rounded font-mono text-[10px] border border-[#1E293B]">
              <div className="flex items-center gap-1.5 text-[#03b5d3]">
                <Shield className="w-3 h-3" />
                <span>Deterministic Trigger: <code className="text-[#4cd7f6]">{finding.ruleCode}</code></span>
              </div>
              <div className="text-[#8d90a0]">
                Detection Method: <strong className="text-[#dde2f7]">Deterministic</strong> ({evidenceRecordCount} Evidence Records)
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
                    Finding → Rule → Metric → Affected Case → sourceRecordId → SourceRecord → Raw Payload
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#4cd7f6]" />
            </div>

            {/* Vertical Linked Chain Graph (Nodes 1 to 6) */}
            <div className="flex flex-col gap-1.5 relative">
              {/* Node 1: Finding Identity */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">1. Finding Identity</span>
                  <span className="text-xs font-semibold text-[#dde2f7]">{finding.id}</span>
                  <span className="font-mono text-[10px] text-[#ef4444] truncate">{finding.title}</span>
                </div>
                <ShieldAlert className="w-3.5 h-3.5 text-[#8d90a0]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 2: Evaluated Rule */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">2. Evaluated Control Rule</span>
                  <span className="text-xs font-semibold font-mono text-[#dde2f7]">{finding.ruleCode}</span>
                  <span className="font-mono text-[10px] text-[#8d90a0] truncate">
                    Mandatory Escalation Protocols ({finding.targetProtocol})
                  </span>
                </div>
                <FileCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 3: Quantitative Metric */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">3. Quantitative Metric</span>
                  <span className="text-xs font-semibold text-[#ef4444] font-mono">
                    Execution Gap Rate = {gapRateFormatted}
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">
                    Reference: 0.0% Gaps ({observedCount} / {applicableCount} with escalation evidence)
                  </span>
                </div>
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 4: Forensic Scope */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">4. Affected Cases ({gapCount})</span>
                  <span className="text-xs font-semibold text-[#dde2f7]">
                    {finding.affectedCaseIds && finding.affectedCaseIds.length > 0
                      ? finding.affectedCaseIds.join(', ')
                      : `${gapCount} Flagged Cases`}
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0]">
                    Linked to {finding.sourceRecordIds?.length || gapCount} Source Records
                  </span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#1E293B]"></div>
              </div>

              {/* Node 5: Source Ingestion Anchor */}
              <div className="p-2.5 bg-[#080e1d] rounded flex items-start gap-3 border border-[#1E293B]">
                <div className="w-5 h-5 rounded-full bg-[#1A243B] text-[#4cd7f6] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  5
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-[9px] text-[#8d90a0] uppercase">5. Operational Submission Ingest</span>
                  <span className="text-xs font-semibold font-mono text-[#dde2f7] truncate">
                    {finding.telemetryFile || 'Operational Ingest Batch'}
                  </span>
                  <span className="font-mono text-[10px] text-[#8d90a0] truncate">
                    Submission ID: {finding.submissionId || 'Operational Ingest'}
                  </span>
                </div>
                <Download className="w-3.5 h-3.5 text-[#4cd7f6]" />
              </div>

              <div className="h-2 flex items-center justify-center">
                <div className="w-0.5 h-full bg-[#4cd7f6]"></div>
              </div>

              {/* Node 6: Source Evidence Integrity */}
              <div className="p-3 bg-[#131B2E] rounded flex items-start gap-3 border border-[#03b5d3]/40">
                <div className="w-5 h-5 rounded-full bg-[#03b5d3] text-[#001f26] flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#4cd7f6] uppercase font-semibold">
                      6. Evidence Integrity Fingerprint
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-[9px] border border-[#4cd7f6]/30">
                      RECORDED
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#dde2f7] truncate mt-0.5" title={finding.sourceIntegrityFingerprint || finding.sha256Hash}>
                    SHA-256 fingerprint: {finding.sourceIntegrityFingerprint || finding.sha256Hash || 'Not available'}
                  </span>
                  <span className="font-mono text-[9px] text-[#8d90a0]">
                    Evidence Reference Time: {finding.evidenceTimestamp || finding.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* LEVEL 4.5: FORENSIC SOURCE RECORDS EXPLORER (Interactive Table with Real Payloads) */}
        <section className="bg-[#151b2b] rounded p-4 sm:p-5 flex flex-col gap-4 border border-[#1E293B]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E293B]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-[#1A243B] text-[#4cd7f6]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#dde2f7] tracking-tight">
                  Forensic Evidence & Source Records Explorer
                </h3>
                <p className="text-xs text-[#8d90a0]">
                  Explicit evidence records associated with finding {finding.id} from {finding.entityName}.
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
                onClick={() => showToast(`Exported ${filteredRecords.length} evidence records`)}
                className="px-3 py-1 bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] rounded transition-colors flex items-center gap-1.5 border border-[#1E293B]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Evidence</span>
              </button>
              <span className="px-2.5 py-1 bg-[#1A243B] text-[#4cd7f6] rounded font-mono text-[10px] font-semibold border border-[#1E293B]">
                {filteredRecords.length} Linked Evidence Records
              </span>
            </div>
          </div>

          {/* Evidence Data Table */}
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center bg-[#080e1d] rounded border border-[#1E293B] text-xs font-mono text-[#8d90a0]">
              No evidence records found matching the active filter.
            </div>
          ) : (
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
                    <th className="px-4 py-2.5">Data Quality</th>
                    <th className="px-4 py-2.5 text-right">Source Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {filteredRecords.map((record) => {
                    const isExpanded = expandedRow === record.incidentId;
                    const sourceRec = sourceRecordsMap.get(record.sourceRecordId || record.incidentId);

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
                          <td className="px-4 py-2.5 text-[#c3c6d7]">{getDisplayClosureTimestamp(record, sourceRec)}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-[#1A243B] text-[#c3c6d7] text-[10px] border border-[#1E293B]">
                              {record.dispositionGiven}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {record.dataQualityStatus === 'DATA_QUALITY_LIMITED' ? (
                              <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] border border-[#f59e0b]/40">
                                LIMITED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] text-[10px] border border-[#10b981]/40">
                                SUFFICIENT
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {sourceRec ? (
                              <button
                                onClick={() => setInspectingSourceRecord(sourceRec)}
                                className="px-2.5 py-1 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#4cd7f6] hover:text-[#acedff] text-[10px] font-mono border border-[#38BDF8]/40 transition-colors flex items-center gap-1 ml-auto"
                              >
                                <Database className="w-3 h-3" />
                                <span>Inspect Source</span>
                              </button>
                            ) : (
                              <span className="text-[#8d90a0] text-[10px]">
                                {record.provenanceHash.substring(0, 10)}...
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Raw Telemetry / Operational Payload Snapshot */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className="bg-[#080e1d] p-4 flex flex-col gap-2.5 border-l-2 border-[#4cd7f6] border-b border-[#1E293B]">
                                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                  <span className="text-[#4cd7f6] font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <Terminal className="w-3.5 h-3.5" />
                                    Preserved Operational Record Payload: {record.incidentId}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {record.sourceRecordId && (
                                      <span className="text-[#8d90a0] text-[11px] font-mono">
                                        Source ID: <code className="text-[#4cd7f6]">{record.sourceRecordId}</code>
                                      </span>
                                    )}
                                    {sourceRec && (
                                      <button
                                        onClick={() => setInspectingSourceRecord(sourceRec)}
                                        className="px-2.5 py-0.5 rounded bg-[#1A243B] hover:bg-[#24324f] text-[#38BDF8] text-[11px] flex items-center gap-1 border border-[#38BDF8]/40 transition-colors"
                                      >
                                        <FileCode className="w-3 h-3" />
                                        <span>Full Source Ingest View</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleCopyJson(record.rawPayload, record.incidentId)}
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

                                {/* Structured Safe Syntax Highlighted Code Viewer */}
                                <div className="p-3.5 bg-[#090D16] rounded font-mono text-[11px] text-[#dde2f7] overflow-x-auto leading-relaxed border border-[#1E293B]">
                                  <pre className="m-0 text-[#dde2f7]">
                                    <code>{JSON.stringify(record.rawPayload, null, 2)}</code>
                                  </pre>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono text-[#8d90a0] pt-1">
                                  <span>Provenance Hash: <code className="text-[#4cd7f6]">{record.provenanceHash}</code></span>
                                  <span>Audit Action Status: <span className="text-[#10b981] font-semibold">{record.auditActionStatus}</span></span>
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
          )}
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
                  SAT-SA provides evidence and analytical context. The supervisor records the final review decision.{' '}
                  <strong className="text-[#4cd7f6] uppercase font-mono text-[11px] ml-1">
                    SAT-SA recommends. Human decides.
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#8d90a0] font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-[#4cd7f6]" />
              <span>Source Evidence Integrity Reference</span>
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
                <span>Supervisory Review Time: {confirmationRecord.timestamp}</span>
                <span>Evidence Reference: <code className="text-[#4cd7f6]">{confirmationRecord.verificationReference}</code></span>
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
                        Uphold Finding
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] font-mono text-[10px] font-semibold border border-[#ef4444]/30">
                      REVIEW OPTION
                    </span>
                  </div>
                  <p className="text-xs text-[#c3c6d7] mt-0.5">
                    Confirms the potential control deviation based on the evidence reviewed. The supervisor records the determination; SAT-SA does not make the final decision.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#8d90a0] flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span>Record remediation or follow-up action as appropriate</span>
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
                    Treats the finding as potentially explained by incomplete or unrepresentative submitted evidence. Additional records may be requested for review.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#8d90a0] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Additional evidence may be requested</span>
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
                    Dismisses the finding when the supervisor has sufficient documented evidence that the observed gap is not a control deviation.
                  </p>
                  <div className="mt-auto pt-2 font-mono text-[10px] text-[#8d90a0] flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Record supporting review rationale</span>
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
                      showToast(`Request for supplementary records prepared for ${finding.entityCode}`)
                    }
                    className="px-3 py-2 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#dde2f7] font-mono text-[11px] transition-colors flex items-center gap-1.5 border border-[#1E293B]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Additional Records from {finding.entityCode}</span>
                  </button>

                  <button
                    onClick={handleConfirmDecision}
                    className="px-4 py-2 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-mono text-[11px] font-semibold transition-colors flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CONFIRM SUPERVISOR DECISION</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Evidence Integrity & Provenance Footer */}
          <div className="p-2 px-3 bg-[#080e1d] rounded flex flex-col sm:flex-row sm:items-center justify-between text-[#8d90a0] font-mono text-[10px] border border-[#1E293B]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span>Source Integrity: <span className="text-[#dde2f7] font-semibold">SHA-256 fingerprint recorded</span></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span>Evidence Snapshot: <span className="text-[#4cd7f6] font-semibold">Ingested & traceable</span></span>
              </div>
            </div>
            <div>Reference Timestamp: <span className="text-[#dde2f7]">{finding.lastUpdated}</span></div>
          </div>
        </section>

      </div>

      {/* MODAL: INSPECT PRESERVED SOURCE RECORD (Step 3 Requirement) */}
      {inspectingSourceRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e172a] border border-[#38BDF8]/40 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-[#131B2E] border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#dde2f7] flex items-center gap-2">
                    <span>Preserved Operational Source Record</span>
                    <span className="text-[#38BDF8] font-mono">{inspectingSourceRecord.caseId}</span>
                  </h3>
                  <p className="text-[11px] font-mono text-[#8d90a0]">
                    Preserved Source Ingest // Traceability Anchor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingSourceRecord(null)}
                className="p-1 rounded text-[#8d90a0] hover:text-[#dde2f7] hover:bg-[#1E293B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs text-[#dde2f7]">
              {/* Key Provenance Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#080e1d] p-3 rounded border border-[#1E293B]">
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Source Record ID</span>
                  <span className="text-[#4cd7f6] font-semibold truncate block" title={inspectingSourceRecord.id}>
                    {inspectingSourceRecord.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Submission ID</span>
                  <span className="text-[#dde2f7] truncate block" title={inspectingSourceRecord.submissionId}>
                    {inspectingSourceRecord.submissionId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Entity ID</span>
                  <span className="text-[#dde2f7] block">{inspectingSourceRecord.entityId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Batch Ingest Row</span>
                  <span className="text-[#dde2f7] block">Row #{inspectingSourceRecord.rowNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Severity</span>
                  <span className="text-[#ef4444] font-bold block">{inspectingSourceRecord.severity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Ingestion Time</span>
                  <span className="text-[#dde2f7] truncate block" title={inspectingSourceRecord.ingestedAt}>
                    {new Date(inspectingSourceRecord.ingestedAt).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-[#8d90a0] uppercase block">SHA-256 Digest</span>
                  <span className="text-[#38BDF8] text-[11px] truncate block font-mono" title={inspectingSourceRecord.sha256Digest}>
                    {inspectingSourceRecord.sha256Digest}
                  </span>
                </div>
              </div>

              {/* Timestamps & Evidence Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#080e1d] p-3 rounded border border-[#1E293B]">
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Alert Timestamp</span>
                  <span className="text-[#dde2f7] block">{inspectingSourceRecord.alertTimestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Triage Timestamp</span>
                  <span className="text-[#dde2f7] block">{inspectingSourceRecord.triageTimestamp || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Escalation Evidence</span>
                  <span className={`font-bold block ${inspectingSourceRecord.escalationTimestamp ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {inspectingSourceRecord.escalationTimestamp || 'NO RECORD FOUND'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Closure Timestamp</span>
                  <span className="text-[#dde2f7] block">{inspectingSourceRecord.closureTimestamp || 'Open'}</span>
                </div>
              </div>

              {/* Verbatim Preserved Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-[#8d90a0] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#4cd7f6]" />
                    Preserved Original Raw Payload (Exact un-altered input from submission)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(inspectingSourceRecord.rawRecord, null, 2));
                      showToast(`Copied source record ${inspectingSourceRecord.caseId} payload to clipboard`);
                    }}
                    className="px-2 py-0.5 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#4cd7f6] text-[10px] flex items-center gap-1 border border-[#1E293B] transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Raw JSON</span>
                  </button>
                </div>
                <div className="p-3 bg-[#080e1d] rounded border border-[#1E293B] overflow-x-auto max-h-60 text-[11px] leading-relaxed">
                  <pre className="text-[#4cd7f6]">
                    <code>{JSON.stringify(inspectingSourceRecord.rawRecord, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#131B2E] border-t border-[#1E293B] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8d90a0] text-[11px]">
                Anchored into Finding Traceability Chain • Preserved Source Record
              </span>
              <button
                onClick={() => setInspectingSourceRecord(null)}
                className="px-3 py-1.5 rounded bg-[#1A243B] hover:bg-[#24324f] text-[#dde2f7] text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
