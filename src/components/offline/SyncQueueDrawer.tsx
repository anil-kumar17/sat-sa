import React from 'react';
import {
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Wifi,
  WifiOff,
  Trash2,
  ArrowRight,
  Database
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { syncRepository } from '../../repositories';

export const SyncQueueDrawer: React.FC = () => {
  const {
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    connectivityState,
    isSimulatedOffline,
    setSimulatedOffline,
    pendingActions,
    syncPendingQueue,
    refreshQueue,
    lastSyncTime
  } = useOffline();

  if (!isQueueDrawerOpen) return null;

  const handleClearSynced = async () => {
    await syncRepository.clearCompleted();
    await refreshQueue();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsQueueDrawerOpen(false)}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-[#0D1322] border-l border-[#1E293B] shadow-2xl h-full flex flex-col z-10 text-[#dde2f7]">
        {/* Header */}
        <div className="p-4 bg-[#080e1d] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#131B2E] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight">Supervisory Sync Queue</h3>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#131B2E] text-[#4cd7f6] border border-[#1E293B]">
                  {pendingActions.length} Records
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#8d90a0]">
                Local IndexedDB Vault Queue • Last Sync: {lastSyncTime}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsQueueDrawerOpen(false)}
            className="p-1 text-[#8d90a0] hover:text-[#dde2f7] rounded hover:bg-[#151b2b]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connectivity & Diagnostic Control Strip */}
        <div className="p-3 bg-[#131B2E]/70 border-b border-[#1E293B] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8d90a0]">Network State:</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                connectivityState === 'ONLINE'
                  ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                  : connectivityState === 'SYNCING'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 animate-pulse'
                  : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
              }`}
            >
              {connectivityState === 'ONLINE' ? (
                <Wifi className="w-3 h-3" />
              ) : connectivityState === 'SYNCING' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {connectivityState}
            </span>
          </div>

          {/* Offline Mode Simulator Switch */}
          <button
            onClick={() => setSimulatedOffline(!isSimulatedOffline)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors flex items-center gap-1.5 border ${
              isSimulatedOffline
                ? 'bg-[#ef4444]/20 text-[#ffb4ab] border-[#ef4444]/40 hover:bg-[#ef4444]/30'
                : 'bg-[#090D16] text-[#8d90a0] border-[#1E293B] hover:text-[#dde2f7]'
            }`}
            title="Toggle offline simulation to test supervisory queueing and recovery"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSimulatedOffline ? 'bg-[#ef4444] animate-pulse' : 'bg-[#8d90a0]'
              }`}
            />
            <span>{isSimulatedOffline ? 'Simulating Offline' : 'Simulate Offline'}</span>
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-4 py-2 bg-[#090D16] border-b border-[#1E293B] flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#8d90a0] uppercase">
            Queued Operations ({pendingActions.filter((a) => a.syncStatus === 'PENDING_SYNC').length} Pending)
          </span>
          <div className="flex items-center gap-2">
            {pendingActions.some((a) => a.syncStatus === 'SYNCED') && (
              <button
                onClick={handleClearSynced}
                className="text-[10px] font-mono text-[#8d90a0] hover:text-[#dde2f7] flex items-center gap-1"
                title="Clear already synced items"
              >
                <Trash2 className="w-3 h-3" />
                <span>Prune Synced</span>
              </button>
            )}
            <button
              onClick={() => syncPendingQueue()}
              disabled={connectivityState === 'SYNCING' || connectivityState === 'OFFLINE'}
              className="px-2.5 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#1A243B] disabled:text-[#8d90a0] text-white text-[10px] font-mono font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${connectivityState === 'SYNCING' ? 'animate-spin' : ''}`}
              />
              <span>Force Sync</span>
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-xs">
          {pendingActions.length === 0 ? (
            <div className="p-8 text-center text-[#8d90a0] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto opacity-70" />
              <p className="text-xs">No pending synchronization operations in queue.</p>
              <p className="text-[10px] text-[#8d90a0]/70">
                Any human review decisions made offline will be buffered here and synchronized when network connectivity is established.
              </p>
            </div>
          ) : (
            pendingActions.map((action) => (
              <div
                key={action.id}
                className={`p-3 rounded bg-[#090D16] border transition-colors space-y-2 ${
                  action.syncStatus === 'PENDING_SYNC'
                    ? 'border-[#ef4444]/40 bg-[#090D16]'
                    : action.syncStatus === 'SYNCING'
                    ? 'border-[#38BDF8]/40 bg-[#0A1326]'
                    : 'border-[#1E293B] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#4cd7f6]">{action.id}</span>
                    <span className="text-[#8d90a0]">•</span>
                    <span className="text-[#dde2f7] font-semibold">{action.findingId}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      action.syncStatus === 'PENDING_SYNC'
                        ? 'bg-[#ef4444]/20 text-[#ffb4ab] border border-[#ef4444]/30'
                        : action.syncStatus === 'SYNCING'
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 animate-pulse'
                        : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                    }`}
                  >
                    {action.syncStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#dde2f7] font-semibold">{action.actionType}</span>
                  <span className="text-[10px] text-[#8d90a0]">{action.timestamp}</span>
                </div>

                <p className="text-[11px] text-[#8d90a0] font-sans line-clamp-2 leading-relaxed">
                  "{action.rationale}"
                </p>

                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-[#8d90a0]">
                  <span>Inspector: {action.inspector}</span>
                  <span>{action.syncedAt ? `Synced: ${action.syncedAt}` : 'Stored in Local Vault'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Supervisory Prototype Boundary Disclaimer */}
        <div className="p-3 bg-[#080e1d] border-t border-[#1E293B] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#f59e0b] font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>SUPERVISORY PROTOTYPE NOTICE</span>
          </div>
          <p className="text-[10px] text-[#8d90a0] leading-relaxed">
            Local determinations persist in browser IndexedDB. Synchronization is simulated against the local vault. In production, this queue mandates hardware-backed encrypted key derivation and authenticated mutual-TLS transmission to the central oversight ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
