import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { ISyncRepository, PendingSyncAction, SyncStatus } from '../types';

export class IndexedDBSyncRepository implements ISyncRepository {
  async getQueue(): Promise<PendingSyncAction[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.sync_queue.values());
      const actions = await db.getAll('sync_queue');
      // Sort newest first
      return actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return Array.from(inMemoryFallback.sync_queue.values());
    }
  }

  async enqueue(action: Omit<PendingSyncAction, 'id' | 'syncStatus' | 'retryCount'>): Promise<PendingSyncAction> {
    const queue = await this.getQueue();
    const actionIndex = (queue.length + 1).toString().padStart(5, '0');
    const id = `ACTION-${actionIndex}`;

    const newAction: PendingSyncAction = {
      ...action,
      id,
      syncStatus: 'PENDING_SYNC',
      retryCount: 0
    };

    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.sync_queue.set(id, newAction);
        return newAction;
      }
      await db.put('sync_queue', newAction);
      return newAction;
    } catch {
      inMemoryFallback.sync_queue.set(id, newAction);
      return newAction;
    }
  }

  async updateActionStatus(id: string, syncStatus: SyncStatus, syncedAt?: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        const item = inMemoryFallback.sync_queue.get(id);
        if (item) {
          item.syncStatus = syncStatus;
          if (syncedAt) item.syncedAt = syncedAt;
          inMemoryFallback.sync_queue.set(id, item);
        }
        return;
      }

      const item = await db.get('sync_queue', id);
      if (item) {
        item.syncStatus = syncStatus;
        if (syncedAt) item.syncedAt = syncedAt;
        if (syncStatus === 'SYNCING') item.lastAttempt = new Date().toISOString();
        await db.put('sync_queue', item);
      }
    } catch {
      const item = inMemoryFallback.sync_queue.get(id);
      if (item) {
        item.syncStatus = syncStatus;
        if (syncedAt) item.syncedAt = syncedAt;
        inMemoryFallback.sync_queue.set(id, item);
      }
    }
  }

  async clearCompleted(): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        for (const [id, item] of inMemoryFallback.sync_queue.entries()) {
          if (item.syncStatus === 'SYNCED') inMemoryFallback.sync_queue.delete(id);
        }
        return;
      }
      const all = await db.getAll('sync_queue');
      const tx = db.transaction('sync_queue', 'readwrite');
      for (const item of all) {
        if (item.syncStatus === 'SYNCED') {
          await tx.store.delete(item.id);
        }
      }
      await tx.done;
    } catch {
      // ignore
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        const meta = inMemoryFallback.metadata.get('lastSyncTime');
        return meta ? meta.value : '09:42 UTC';
      }
      const record = await db.get('metadata', 'lastSyncTime');
      return record ? record.value : '09:42 UTC';
    } catch {
      return '09:42 UTC';
    }
  }

  async setLastSyncTime(timestamp: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.metadata.set('lastSyncTime', { key: 'lastSyncTime', value: timestamp });
        return;
      }
      await db.put('metadata', { key: 'lastSyncTime', value: timestamp });
    } catch {
      inMemoryFallback.metadata.set('lastSyncTime', { key: 'lastSyncTime', value: timestamp });
    }
  }
}

export const syncRepository = new IndexedDBSyncRepository();
