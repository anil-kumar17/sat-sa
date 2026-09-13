import React, { useState, useEffect } from 'react';
import {
  FileClock,
  ShieldCheck,
  Lock,
  Terminal,
  UserCheck,
  CheckCircle2,
  Search
} from 'lucide-react';
import { mockAuditTrail } from '../data/mockData';
import { AuditTrailEvent } from '../types';
import { auditRepository } from '../repositories';

export const AuditTrail: React.FC = () => {
  const [events, setEvents] = useState<AuditTrailEvent[]>(mockAuditTrail);

  useEffect(() => {
    auditRepository.getAll().then((res) => {
      if (res && res.length > 0) {
        setEvents(res);
      }
    });
  }, []);

  return (
    <div className="page-container p-4 sm:p-6 lg:p-8 xl:px-10 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#4cd7f6] mb-1">
            <FileClock className="w-3.5 h-3.5" />
            IMMUTABLE SUPERVISORY LOG // PROVENANCE CHAIN
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#dde2f7] tracking-tight">
            Audit Trail
          </h1>
          <p className="text-xs text-[#8d90a0] mt-0.5">
            Tamper-evident, cryptographically chained record of all supervisory actions, findings, decisions, and evidence seals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-xs font-mono text-[#10b981] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Chained Ledger Synced ({events.length} Records)</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#131B2E] rounded border border-[#1E293B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0D1322] text-[#8d90a0] text-[10px] uppercase tracking-wider border-b border-[#1E293B]">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target / Scope</th>
                <th className="px-4 py-3">Actor / Inspector</th>
                <th className="px-4 py-3">Event Details</th>
                <th className="px-4 py-3 text-right">Commit Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-[#1A243B]/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#4cd7f6] whitespace-nowrap">
                    {event.id}
                  </td>
                  <td className="px-4 py-3 text-[#c3c6d7] whitespace-nowrap">
                    {event.timestamp}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        event.actionType === 'DECISION_COMMITTED'
                          ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ef4444]/30'
                          : event.actionType === 'FINDING_FLAGGED'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                          : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                      }`}
                    >
                      {event.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#dde2f7] whitespace-nowrap">
                    <div>{event.targetEntity}</div>
                    <div className="text-[10px] text-[#8d90a0]">{event.targetRef}</div>
                  </td>
                  <td className="px-4 py-3 text-[#c3c6d7] whitespace-nowrap">
                    {event.inspector}
                  </td>
                  <td className="px-4 py-3 text-[#8d90a0] max-w-md truncate font-sans text-xs">
                    {event.summary}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4cd7f6] whitespace-nowrap">
                    {event.provenanceHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
