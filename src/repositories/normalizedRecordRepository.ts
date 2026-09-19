import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { INormalizedRecordRepository, NormalizedCaseRecord } from '../types';

export class IndexedDBNormalizedRecordRepository implements INormalizedRecordRepository {
  async createMany(records: NormalizedCaseRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      const db = await getSATDatabase();
      if (!db) {
        records.forEach(r => inMemoryFallback.normalized_records.set(r.id, r));
        return;
      }
      const tx = db.transaction('normalized_records', 'readwrite');
      for (const record of records) {
        await tx.store.put(record);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to save normalized records to IndexedDB, using fallback:', err);
      records.forEach(r => inMemoryFallback.normalized_records.set(r.id, r));
    }
  }

  async getBySubmissionId(submissionId: string): Promise<NormalizedCaseRecord[]> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        return Array.from(inMemoryFallback.normalized_records.values())
          .filter(r => r.submissionId === submissionId);
      }
      return await db.getAllFromIndex('normalized_records', 'by_submission', submissionId);
    } catch {
      return Array.from(inMemoryFallback.normalized_records.values())
        .filter(r => r.submissionId === submissionId);
    }
  }

  async getAll(): Promise<NormalizedCaseRecord[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.normalized_records.values());
      return await db.getAll('normalized_records');
    } catch {
      return Array.from(inMemoryFallback.normalized_records.values());
    }
  }

  async getById(id: string): Promise<NormalizedCaseRecord | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.normalized_records.get(id);
      return await db.get('normalized_records', id);
    } catch {
      return inMemoryFallback.normalized_records.get(id);
    }
  }

  async deleteBySubmissionId(submissionId: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        Array.from(inMemoryFallback.normalized_records.keys()).forEach(key => {
          const item = inMemoryFallback.normalized_records.get(key);
          if (item?.submissionId === submissionId) {
            inMemoryFallback.normalized_records.delete(key);
          }
        });
        return;
      }
      const records = await db.getAllFromIndex('normalized_records', 'by_submission', submissionId);
      const tx = db.transaction('normalized_records', 'readwrite');
      for (const rec of records) {
        await tx.store.delete(rec.id);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to delete normalized records for submission:', err);
    }
  }
}

export const normalizedRecordRepository = new IndexedDBNormalizedRecordRepository();
