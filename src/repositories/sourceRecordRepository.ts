import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { ISourceRecordRepository, SourceRecord } from '../types';

export class IndexedDBSourceRecordRepository implements ISourceRecordRepository {
  async createMany(records: SourceRecord[]): Promise<void> {
    if (records.length === 0) return;
    try {
      const db = await getSATDatabase();
      if (!db) {
        records.forEach(r => inMemoryFallback.source_records.set(r.id, r));
        return;
      }
      const tx = db.transaction('source_records', 'readwrite');
      for (const record of records) {
        await tx.store.put(record);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to save source records to IndexedDB, using fallback:', err);
      records.forEach(r => inMemoryFallback.source_records.set(r.id, r));
    }
  }

  async getBySubmissionId(submissionId: string): Promise<SourceRecord[]> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        return Array.from(inMemoryFallback.source_records.values())
          .filter(r => r.submissionId === submissionId)
          .sort((a, b) => a.rowNumber - b.rowNumber);
      }
      const records = await db.getAllFromIndex('source_records', 'by_submission', submissionId);
      return records.sort((a, b) => a.rowNumber - b.rowNumber);
    } catch {
      return Array.from(inMemoryFallback.source_records.values())
        .filter(r => r.submissionId === submissionId)
        .sort((a, b) => a.rowNumber - b.rowNumber);
    }
  }

  async getById(id: string): Promise<SourceRecord | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.source_records.get(id);
      return await db.get('source_records', id);
    } catch {
      return inMemoryFallback.source_records.get(id);
    }
  }

  async deleteBySubmissionId(submissionId: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        Array.from(inMemoryFallback.source_records.keys()).forEach(key => {
          const item = inMemoryFallback.source_records.get(key);
          if (item?.submissionId === submissionId) {
            inMemoryFallback.source_records.delete(key);
          }
        });
        return;
      }
      const records = await db.getAllFromIndex('source_records', 'by_submission', submissionId);
      const tx = db.transaction('source_records', 'readwrite');
      for (const rec of records) {
        await tx.store.delete(rec.id);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to delete source records for submission:', err);
    }
  }
}

export const sourceRecordRepository = new IndexedDBSourceRecordRepository();
