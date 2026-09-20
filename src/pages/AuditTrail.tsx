import React, { useEffect, useMemo, useState } from 'react';
import {
  FileClock,
  ShieldCheck,
  Database,
  Search,
  UserCheck,
  AlertCircle
} from 'lucide-react';

import { AuditTrailEvent } from '../types';
import { auditRepository } from '../repositories';

const formatTimestamp = (value: string): string => {
  if (!value) return '—';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
};

const getActionClass = (actionType: string): string => {
  if (actionType === 'DECISION_COMMITTED') {
    return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
  }

  if (actionType === 'FINDING_FLAGGED') {
    return 'bg-[#ef4444]/10 text-[#ffb4ab] border-[#ef4444]/30';
  }

  return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30';
};

export const AuditTrail: React.FC = () => {
  const [events, setEvents] = useState<AuditTrailEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAuditTrail = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedEvents = await auditRepository.getAll();

        if (!mounted) return;

        setEvents(storedEvents);
      } catch (err) {
        console.error('Failed to load audit trail:', err);

        if (mounted) {
          setError(
            'The local audit trail could not be loaded. Refresh and try again.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAuditTrail();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((event) => {
      const searchable = [
        event.id,
        event.timestamp,
        event.actionType,
        event.targetEntity,
        event.targetRef,
        event.inspector,
        event.summary,
        event.provenanceHash
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [events, searchTerm]);

  const actionCounts = useMemo(() => {
    return events.reduce<Record<string, number>>(
      (counts, event) => {
        counts[event.actionType] =
          (counts[event.actionType] || 0) + 1;

        return counts;
      },
      {}
    );
  }, [events]);

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileClock className="w-3.5 h-3.5" />
            SUPERVISORY AUDIT LOG // LOCAL RECORD
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Audit Trail
          </h1>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-3xl">
            Timestamped record of supervisory actions and system-generated
            events recorded during local assessment processing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
            <ShieldCheck className="w-3.5 h-3.5" />
            LOCAL AUDIT STORE
          </span>

          <span className="px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[#8d90a0]">
            {events.length} EVENTS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <Database className="w-3.5 h-3.5" />
            TOTAL EVENTS
          </div>

          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {events.length}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <AlertCircle className="w-3.5 h-3.5" />
            FINDINGS FLAGGED
          </div>

          <div className="text-lg font-semibold text-[#f59e0b] mt-1">
            {actionCounts.FINDING_FLAGGED || 0}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <UserCheck className="w-3.5 h-3.5" />
            DECISIONS
          </div>

          <div className="text-lg font-semibold text-[#dde2f7] mt-1">
            {actionCounts.DECISION_COMMITTED || 0}
          </div>
        </div>

        <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B]">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8d90a0]">
            <FileClock className="w-3.5 h-3.5" />
            EVENT TYPES
          </div>

          <div className="text-lg font-semibold text-[#4cd7f6] mt-1">
            {Object.keys(actionCounts).length}
          </div>
        </div>
      </div>

      <div className="p-4 rounded bg-[#131B2E] border border-[#1E293B]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

          <input
            type="text"
            placeholder="Search event ID, action, target, inspector, details..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full pl-9 pr-3 py-2 rounded bg-[#090D16] border border-[#1E293B] text-xs text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <div className="text-xs font-mono text-[#8d90a0]">
            Loading local audit records...
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded bg-[#131B2E] border border-[#ef4444]/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#ffb4ab]">
            <AlertCircle className="w-4 h-4" />
            Audit trail unavailable
          </div>

          <div className="text-xs text-[#8d90a0] mt-1">
            {error}
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-10 rounded bg-[#131B2E] border border-[#1E293B] text-center">
          <FileClock className="w-8 h-8 mx-auto text-[#475569]" />

          <h3 className="text-sm font-semibold text-[#dde2f7] mt-3">
            {events.length === 0
              ? 'No audit events recorded'
              : 'No matching audit events'}
          </h3>

          <p className="text-xs text-[#8d90a0] mt-1 max-w-lg mx-auto">
            {events.length === 0
              ? 'Audit events will appear here when ingestion, finding generation, evidence processing, or supervisory decisions create audit records.'
              : 'Adjust the search term to locate another event.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0D1322] text-[#8d90a0] text-[10px] uppercase tracking-wider border-b border-[#1E293B]">
                <tr>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target / Scope</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Event Details</th>
                  <th className="px-4 py-3 text-right">
                    Provenance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-[#1A243B]/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-[#4cd7f6] whitespace-nowrap">
                      {event.id}
                    </td>

                    <td className="px-4 py-3 text-[#c3c6d7] whitespace-nowrap">
                      {formatTimestamp(event.timestamp)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionClass(
                          event.actionType
                        )}`}
                      >
                        {event.actionType}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[#dde2f7] whitespace-nowrap">
                      <div>{event.targetEntity || '—'}</div>

                      {event.targetRef && (
                        <div className="text-[10px] text-[#8d90a0]">
                          {event.targetRef}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[#c3c6d7] whitespace-nowrap">
                      {event.inspector || 'System'}
                    </td>

                    <td className="px-4 py-3 text-[#8d90a0] max-w-md font-sans text-xs">
                      <div className="truncate">
                        {event.summary || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right text-[#4cd7f6] whitespace-nowrap">
                      {event.provenanceHash || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-3 rounded bg-[#131B2E] border border-[#1E293B] text-[10px] font-mono text-[#64748b]">
        Audit records shown here are locally persisted application
        events. A provenance hash, when present, is displayed as
        recorded metadata and is not represented as a cryptographic
        chain or tamper-proof ledger.
      </div>
    </div>
  );
};