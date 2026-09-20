import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  FileCheck2,
  Fingerprint,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ExternalLink
} from 'lucide-react';

import {
  sourceRecordRepository,
  submissionRepository
} from '../repositories';

import {
  CSESubmission,
  SourceRecord
} from '../types';

interface EvidenceEntry {
  record: SourceRecord;
  submission?: CSESubmission;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const truncateHash = (value?: string | null): string => {
  if (!value) return 'Not available';

  if (value.length <= 32) {
    return value;
  }

  return `${value.slice(0, 16)}…${value.slice(-12)}`;
};

const getPayloadValue = (
  record: SourceRecord,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const value = record.rawPayload?.[key];

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
  }

  return null;
};

const getCaseId = (
  record: SourceRecord
): string | null => {
  return getPayloadValue(record, [
    'case_id',
    'caseId',
    'case',
    'incident_id',
    'incidentId'
  ]);
};

const getAlertId = (
  record: SourceRecord
): string | null => {
  return getPayloadValue(record, [
    'alert_id',
    'alertId',
    'alert',
    'alert_identifier',
    'alertIdentifier'
  ]);
};

const getFingerprint = (
  record: SourceRecord
): string | null => {
  return record.sha256Fingerprint || null;
};

const getRawPayload = (
  record: SourceRecord
): Record<string, unknown> | null => {
  return record.rawPayload || null;
};

const getSourceFile = (
  submission?: CSESubmission
): string => {
  return submission?.fileName || 'Imported source record';
};

const getEvidenceState = (
  record: SourceRecord
): {
  label: string;
  className: string;
} => {
  const fingerprint = getFingerprint(record);
  const rawPayload = getRawPayload(record);

  if (fingerprint && rawPayload !== null) {
    return {
      label: 'TRACEABLE',
      className:
        'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
    };
  }

  if (fingerprint) {
    return {
      label: 'FINGERPRINTED',
      className:
        'bg-[#38BDF8]/10 text-[#4cd7f6] border-[#38BDF8]/30'
    };
  }

  if (rawPayload !== null) {
    return {
      label: 'SOURCE RETAINED',
      className:
        'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
    };
  }

  return {
    label: 'METADATA ONLY',
    className:
      'bg-[#64748b]/10 text-[#94a3b8] border-[#334155]'
  };
};

export const EvidenceRegistry: React.FC = () => {
  const [entries, setEntries] = useState<EvidenceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submissionFilter, setSubmissionFilter] =
    useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<EvidenceEntry | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadEvidence = async () => {
      try {
        setLoading(true);
        setError(null);

        const submissions =
          await submissionRepository.getAll();

        const recordGroups = await Promise.all(
          submissions.map(async submission => {
            const records =
              await sourceRecordRepository.getBySubmissionId(
                submission.submissionId
              );

            return records.map(record => ({
              record,
              submission
            }));
          })
        );

        if (!mounted) return;

        setEntries(recordGroups.flat());
      } catch (err) {
        console.error(
          'Failed to load evidence registry:',
          err
        );

        if (mounted) {
          setError(
            'The local evidence registry could not be loaded. Refresh and try again.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvidence();

    const refreshInterval =
      window.setInterval(loadEvidence, 5000);

    const handleFocus = () => {
      loadEvidence();
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      mounted = false;

      window.clearInterval(refreshInterval);

      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, []);

  const submissions = useMemo(() => {
    const unique = new Map<
      string,
      CSESubmission
    >();

    for (const entry of entries) {
      if (entry.submission) {
        unique.set(
          entry.submission.submissionId,
          entry.submission
        );
      }
    }

    return Array.from(unique.values()).sort(
      (a, b) =>
        a.submissionId.localeCompare(
          b.submissionId
        )
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return entries.filter(
      ({ record, submission }) => {
        if (
          submissionFilter !== 'ALL' &&
          record.submissionId !==
            submissionFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const fingerprint =
          getFingerprint(record);

        const caseId =
          getCaseId(record);

        const alertId =
          getAlertId(record);

        const sourceFile =
          getSourceFile(submission);

        const searchable = [
          record.id,
          record.submissionId,
          record.entityCode,
          record.entityId,
          record.assessmentPeriod,
          caseId || '',
          alertId || '',
          sourceFile,
          fingerprint || '',
          String(record.rowNumber)
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(query);
      }
    );
  }, [
    entries,
    searchTerm,
    submissionFilter
  ]);

  const registryStats = useMemo(() => {
    let fingerprinted = 0;
    let traceable = 0;
    let rawPayloads = 0;

    for (const entry of entries) {
      const fingerprint =
        getFingerprint(entry.record);

      const rawPayload =
        getRawPayload(entry.record);

      if (fingerprint) {
        fingerprinted += 1;
      }

      if (rawPayload !== null) {
        rawPayloads += 1;
      }

      if (
        fingerprint &&
        rawPayload !== null
      ) {
        traceable += 1;
      }
    }

    return {
      records: entries.length,
      submissions: submissions.length,
      fingerprinted,
      traceable,
      rawPayloads
    };
  }, [entries, submissions.length]);

  const handleVerify = (
    entry: EvidenceEntry
  ) => {
    const fingerprint =
      getFingerprint(entry.record);

    if (!fingerprint) {
      setVerificationResult(
        `No SHA-256 fingerprint is registered for source record ${entry.record.id}.`
      );
      return;
    }

    setVerificationResult(
      `Registered fingerprint found for ${entry.record.id}: ${truncateHash(
        fingerprint
      )}`
    );

    window.setTimeout(() => {
      setVerificationResult(null);
    }, 5000);
  };

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <Lock className="w-3.5 h-3.5" />
            EVIDENCE REGISTRY // SOURCE TRACEABILITY
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Evidence Registry
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl">
            Source records retained from persisted CSE
            submissions. Each record can be traced back
            to its submission and used as the evidence
            basis for supervisory findings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
            <ShieldCheck className="w-3.5 h-3.5" />
            LOCAL EVIDENCE VAULT
          </span>

          <span className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#8d90a0]">
            {registryStats.records} SOURCE RECORDS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <Database className="w-3.5 h-3.5" />
            SOURCE RECORDS
          </div>

          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {registryStats.records}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <FileCheck2 className="w-3.5 h-3.5" />
            SUBMISSIONS
          </div>

          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {registryStats.submissions}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <Fingerprint className="w-3.5 h-3.5" />
            FINGERPRINTED
          </div>

          <div className="text-lg font-semibold text-[#4cd7f6] mt-1">
            {registryStats.fingerprinted}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <ShieldCheck className="w-3.5 h-3.5" />
            TRACEABLE
          </div>

          <div className="text-lg font-semibold text-[#10b981] mt-1">
            {registryStats.traceable}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <FileCheck2 className="w-3.5 h-3.5" />
            RAW PAYLOADS
          </div>

          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {registryStats.rawPayloads}
          </div>
        </div>
      </div>

      <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

            <input
              type="text"
              placeholder="Search source ID, case ID, alert ID, entity, fingerprint..."
              value={searchTerm}
              onChange={event =>
                setSearchTerm(
                  event.target.value
                )
              }
              className="w-full pl-9 pr-3 py-2 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <select
            value={submissionFilter}
            onChange={event =>
              setSubmissionFilter(
                event.target.value
              )
            }
            className="w-full lg:w-80 px-3 py-2 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="ALL">
              All Stored Submissions
            </option>

            {submissions.map(submission => (
              <option
                key={submission.submissionId}
                value={submission.submissionId}
              >
                {submission.submissionId}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-[#64748b]">
          <ShieldAlert className="w-3.5 h-3.5" />

          <span>
            SHA-256 fingerprints shown here are
            provenance metadata registered during
            ingestion. The registry does not claim
            independent cryptographic verification of
            source bytes.
          </span>
        </div>
      </div>

      {verificationResult && (
        <div className="p-3 bg-[#131B2E] border border-[#10b981]/40 rounded text-xs font-mono text-[#10b981] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{verificationResult}</span>
        </div>
      )}

      {loading ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <div className="text-xs font-mono text-[#8d90a0]">
            Loading local evidence registry...
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded bg-[#131B2E] border border-[#ef4444]/30">
          <div className="text-sm font-semibold text-[#ffb4ab]">
            Evidence registry unavailable
          </div>

          <div className="text-xs text-[#8d90a0] mt-1">
            {error}
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <Database className="w-8 h-8 mx-auto text-[#475569]" />

          <h3 className="text-sm font-semibold text-[#dde2f7] mt-3">
            {entries.length === 0
              ? 'No source evidence stored'
              : 'No matching source records'}
          </h3>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-lg mx-auto">
            {entries.length === 0
              ? 'Persist a CSE submission from Assessments to populate the Evidence Registry with its original source records.'
              : 'Adjust the search or submission filter to locate another source record.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const {
              record,
              submission
            } = entry;

            const evidenceState =
              getEvidenceState(record);

            const fingerprint =
              getFingerprint(record);

            const caseId =
              getCaseId(record);

            const alertId =
              getAlertId(record);

            return (
              <div
                key={record.id}
                className="p-4 rounded bg-[#131B2E] border border-[#1E293B] hover:border-[#334155] transition-colors"
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#4cd7f6]">
                        {record.id}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border ${evidenceState.className}`}
                      >
                        {evidenceState.label}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-[#090D16] border border-[#1E293B] text-[9px] font-mono text-[#8d90a0]">
                        ROW {record.rowNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="text-sm font-semibold text-[#dde2f7]">
                        {caseId ||
                          'Case unavailable'}
                      </span>

                      <span className="text-[11px] font-mono text-[#8d90a0]">
                        {alertId ||
                          'Alert unavailable'}
                      </span>

                      <span className="text-[10px] font-mono text-[#8d90a0]">
                        {record.entityCode ||
                          record.entityId ||
                          'Entity unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#64748b]/10 text-[#94a3b8] border border-[#334155]">
                      SOURCE RECORD
                    </span>

                    <button
                      onClick={() =>
                        setSelectedRecord(entry)
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#090D16] border border-[#1E293B] text-[#4cd7f6] hover:bg-[#1A243B] font-mono text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspect
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Submission
                    </span>

                    <span className="text-xs font-mono text-[#dde2f7]">
                      {record.submissionId}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Source File
                    </span>

                    <span className="text-xs font-mono text-[#dde2f7] truncate block">
                      {getSourceFile(
                        submission
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      SHA-256 Fingerprint
                    </span>

                    <span className="text-[10px] font-mono text-[#4cd7f6] truncate block">
                      {truncateHash(
                        fingerprint
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Assessment Period
                    </span>

                    <span className="text-xs font-mono text-[#dde2f7]">
                      {record.assessmentPeriod ||
                        submission?.assessmentPeriod ||
                        'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-[#1E293B]">
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#8d90a0]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#64748b]" />
                      {formatDate(
                        record.createdAt
                      )}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#64748b]" />
                      {getRawPayload(record) !==
                      null
                        ? 'Raw payload retained'
                        : 'Raw payload unavailable'}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleVerify(entry)
                    }
                    className="px-2.5 py-1 rounded bg-[#090D16] hover:bg-[#1A243B] text-[#4cd7f6] font-mono text-[10px] border border-[#1E293B]"
                  >
                    Check Registered Fingerprint
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-[#0D1321] border border-[#334155] shadow-2xl">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-[#1E293B]">
              <div>
                <div className="text-[10px] font-mono text-[#4cd7f6]">
                  SOURCE RECORD INSPECTION
                </div>

                <h2 className="text-base font-semibold text-[#dde2f7] mt-1">
                  {selectedRecord.record.id}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedRecord(null)
                }
                className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#8d90a0] hover:text-[#dde2f7] text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-76px)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                  <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                    Submission
                  </span>

                  <span className="text-xs font-mono text-[#dde2f7]">
                    {selectedRecord.record.submissionId}
                  </span>
                </div>

                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                  <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                    Assessment Period
                  </span>

                  <span className="text-xs font-mono text-[#dde2f7]">
                    {selectedRecord.record.assessmentPeriod}
                  </span>
                </div>

                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                  <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                    Case ID
                  </span>

                  <span className="text-xs font-mono text-[#dde2f7]">
                    {getCaseId(
                      selectedRecord.record
                    ) || 'Unavailable'}
                  </span>
                </div>

                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                  <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                    Alert ID
                  </span>

                  <span className="text-xs font-mono text-[#dde2f7]">
                    {getAlertId(
                      selectedRecord.record
                    ) || 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#4cd7f6]" />

                  <span className="text-xs font-semibold text-[#dde2f7]">
                    Provenance Fingerprint
                  </span>
                </div>

                <div className="mt-3 p-3 rounded bg-[#090D16] border border-[#1E293B] break-all">
                  <span className="text-[10px] font-mono text-[#4cd7f6]">
                    {getFingerprint(
                      selectedRecord.record
                    ) ||
                      'No SHA-256 fingerprint registered'}
                  </span>
                </div>

                <p className="text-[10px] text-[#64748b] mt-2">
                  This value is the SHA-256 fingerprint
                  registered for the source record during
                  ingestion. It is displayed as provenance
                  metadata and is not presented as a fresh
                  cryptographic verification.
                </p>
              </div>

              <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#4cd7f6]" />

                  <span className="text-xs font-semibold text-[#dde2f7]">
                    Traceability Context
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <div>
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Entity
                    </span>

                    <span className="text-xs text-[#dde2f7]">
                      {selectedRecord.record.entityCode ||
                        selectedRecord.record.entityId ||
                        'Unavailable'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Case
                    </span>

                    <span className="text-xs text-[#dde2f7]">
                      {getCaseId(
                        selectedRecord.record
                      ) || 'Unavailable'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Alert
                    </span>

                    <span className="text-xs text-[#dde2f7]">
                      {getAlertId(
                        selectedRecord.record
                      ) || 'Unavailable'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-[#8d90a0] uppercase block font-mono">
                      Source Row
                    </span>

                    <span className="text-xs text-[#dde2f7]">
                      {selectedRecord.record.rowNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#4cd7f6]" />

                  <span className="text-xs font-semibold text-[#dde2f7]">
                    Original Source Payload
                  </span>
                </div>

                <div className="mt-3 rounded bg-[#090D16] border border-[#1E293B] p-3 overflow-x-auto">
                  <pre className="text-[10px] leading-5 font-mono text-[#c3c6d7] whitespace-pre-wrap break-words">
                    {getRawPayload(
                      selectedRecord.record
                    ) !== null
                      ? JSON.stringify(
                          getRawPayload(
                            selectedRecord.record
                          ),
                          null,
                          2
                        )
                      : 'Original raw payload is not available on this source record.'}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded bg-[#090D16] border border-[#1E293B] text-[10px] font-mono text-[#64748b]">
                Traceability path:{' '}
                <span className="text-[#8d90a0]">
                  Finding → Evidence Reference →
                  Source Record → Submission → Original
                  Source Payload
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};