/**
 * SAT-SA (Supervisory Analytics) - Offline-First Connectivity & Synchronization Engine
 * 
 * Manages:
 * 1. Global network connectivity status (ONLINE, OFFLINE, SYNCING)
 * 2. Simulated offline toggle for testing and audit verification
 * 3. Pending supervisory action queue and local state synchronization
 * 4. PWA installability lifecycle
 * 5. Last synchronization timestamps
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ConnectivityState,
  PendingSyncAction,
  QueuedActionType,
  SupervisorDecision,
  FindingStatus
} from '../types';
import {
  findingsRepository,
  syncRepository,
  auditRepository
} from '../repositories';
import { initializeDatabase } from '../storage/db';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface OfflineContextType {
  // Connectivity
  connectivityState: ConnectivityState;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (offline: boolean) => void;
  lastSyncTime: string;

  // Queue & Actions
  pendingActions: PendingSyncAction[];
  pendingCount: number;
  enqueueSupervisorDecision: (
    findingId: string,
    decision: 'UPHOLD' | 'DOWNGRADE' | 'DISMISS',
    rationale: string,
    inspector: string
  ) => Promise<PendingSyncAction>;
  syncPendingQueue: () => Promise<void>;

  // Queue Inspection UI
  isQueueDrawerOpen: boolean;
  setIsQueueDrawerOpen: (open: boolean) => void;

  // PWA Install
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installPWA: () => Promise<boolean>;

  // Data Refresh
  refreshQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:42 UTC');
  const [pendingActions, setPendingActions] = useState<PendingSyncAction[]>([]);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  // Derived connectivity
  const effectiveOnline = browserOnline && !isSimulatedOffline;
  const connectivityState: ConnectivityState = isSyncing
    ? 'SYNCING'
    : effectiveOnline
    ? 'ONLINE'
    : 'OFFLINE';

  // Load initial queue and last sync timestamp from local IndexedDB
  const refreshQueue = useCallback(async () => {
    try {
      const queue = await syncRepository.getQueue();
      setPendingActions(queue);
      const syncTime = await syncRepository.getLastSyncTime();
      if (syncTime) {
        setLastSyncTime(syncTime);
      }
    } catch (err) {
      console.warn('Could not refresh offline queue:', err);
    }
  }, []);

  // Initialize DB and load queue
  useEffect(() => {
    initializeDatabase().then(() => {
      refreshQueue();
    });
  }, [refreshQueue]);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA standalone check
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // PWA prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Synchronization routine
  const syncPendingQueue = useCallback(async () => {
    if (isSyncing) return;
    const currentQueue = await syncRepository.getQueue();
    const pendingItems = currentQueue.filter(
      (item) => item.syncStatus === 'PENDING_SYNC' || item.syncStatus === 'FAILED'
    );

    if (pendingItems.length === 0) {
      const now = new Date();
      const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now
        .getUTCMinutes()
        .toString()
        .padStart(2, '0')} UTC`;
      setLastSyncTime(timeStr);
      await syncRepository.setLastSyncTime(timeStr);
      return;
    }

    setIsSyncing(true);

    try {
      // Mark items as SYNCING
      for (const item of pendingItems) {
        await syncRepository.updateActionStatus(item.id, 'SYNCING');
      }
      setPendingActions(await syncRepository.getQueue());

      // Simulate network roundtrip latency to central ledger
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const now = new Date();
      const timeStr = `${now.getUTCHours().toString().padStart(2, '0')}:${now
        .getUTCMinutes()
        .toString()
        .padStart(2, '0')} UTC`;
      const fullTimestamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      // Mark items as SYNCED
      for (const item of pendingItems) {
        await syncRepository.updateActionStatus(item.id, 'SYNCED', fullTimestamp);
      }

      setLastSyncTime(timeStr);
      await syncRepository.setLastSyncTime(timeStr);

      // Log sync reconciliation event in local audit trail
      await auditRepository.logEvent({
        timestamp: fullTimestamp,
        inspector: 'Automated Sync Daemon',
        actionType: 'DECISION_COMMITTED',
        targetEntity: 'Apex Interbank & Monitored CSEs',
        targetRef: `SYNC-BATCH-${pendingItems.length}-ACTIONS`,
        provenanceHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random()
          .toString(16)
          .substring(2, 10)}...`,
        integrityStatus: 'VALIDATED',
        summary: `Synchronized ${pendingItems.length} offline supervisory decisions with local vault state.`
      });

      setPendingActions(await syncRepository.getQueue());
    } catch (err) {
      console.error('Synchronization failed:', err);
      for (const item of pendingItems) {
        await syncRepository.updateActionStatus(item.id, 'FAILED');
      }
      setPendingActions(await syncRepository.getQueue());
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // When returning to effective online state, auto-sync pending items
  useEffect(() => {
    if (effectiveOnline) {
      syncRepository.getQueue().then((queue) => {
        const hasPending = queue.some((i) => i.syncStatus === 'PENDING_SYNC');
        if (hasPending) {
          syncPendingQueue();
        }
      });
    }
  }, [effectiveOnline, syncPendingQueue]);

  // Enqueue a human supervisor decision
  const enqueueSupervisorDecision = async (
    findingId: string,
    decision: 'UPHOLD' | 'DOWNGRADE' | 'DISMISS',
    rationale: string,
    inspector: string
  ): Promise<PendingSyncAction> => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const commitHash =
      '0x' +
      Math.random().toString(16).substring(2, 10) +
      Math.random().toString(16).substring(2, 10) +
      '...';

    let actionType: QueuedActionType = 'UPHOLD_FINDING';
    let newStatus: FindingStatus = 'UPHELD';

    if (decision === 'DOWNGRADE') {
      actionType = 'DOWNGRADE_FINDING';
      newStatus = 'DOWNGRADED';
    } else if (decision === 'DISMISS') {
      actionType = 'DISMISS_FINDING';
      newStatus = 'DISMISSED';
    }

    // 1. Save decision object to local repository
    const decisionRecord: SupervisorDecision = {
      findingId,
      decision,
      decisionTitle:
        decision === 'UPHOLD'
          ? 'Affirmed Critical Defect (P0) — Corrective Action Plan Mandated'
          : decision === 'DOWNGRADE'
          ? 'Downgraded to Observation — Telemetry Recalibration Window'
          : 'Finding Dismissed — Supervisory Waiver Recorded',
      rationale,
      decidedAt: timestamp,
      inspectorName: inspector,
      inspectorRole: 'Lead Supervisory Inspector • Oversight Team',
      correctiveActionPlanRequired: decision === 'UPHOLD',
      ledgerTimestamp: timestamp,
      sha256Verification: commitHash
    };

    await findingsRepository.saveSupervisorDecision(decisionRecord);

    // 2. Update finding status in local store
    await findingsRepository.updateStatus(findingId, newStatus);

    // 3. Log event into local audit trail
    await auditRepository.logEvent({
      timestamp,
      inspector,
      actionType: 'DECISION_COMMITTED',
      targetEntity: findingId,
      targetRef: findingId,
      provenanceHash: commitHash,
      integrityStatus: 'VALIDATED',
      summary: `Supervisory determination [${decision}] recorded locally: ${rationale.substring(0, 90)}...`
    });

    // 4. Enqueue action into offline sync queue
    const queuedAction = await syncRepository.enqueue({
      findingId,
      actionType,
      rationale,
      timestamp,
      inspector,
      localStatus: 'PENDING_SYNC',
      decision
    });

    await refreshQueue();

    // 5. If online, trigger background sync
    if (effectiveOnline) {
      setTimeout(() => {
        syncPendingQueue();
      }, 400);
    }

    return queuedAction;
  };

  // PWA install trigger
  const installPWA = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const pendingCount = pendingActions.filter((a) => a.syncStatus === 'PENDING_SYNC').length;

  return (
    <OfflineContext.Provider
      value={{
        connectivityState,
        isOnline: effectiveOnline,
        isSimulatedOffline,
        setSimulatedOffline: setIsSimulatedOffline,
        lastSyncTime,
        pendingActions,
        pendingCount,
        enqueueSupervisorDecision,
        syncPendingQueue,
        isQueueDrawerOpen,
        setIsQueueDrawerOpen,
        isInstallable: !!deferredPrompt,
        isInstalled,
        isIOS,
        installPWA,
        refreshQueue
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
