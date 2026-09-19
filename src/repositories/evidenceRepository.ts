import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IEvidenceRepository, ForensicRecord } from '../types';
import { mockForensicRecords } from '../data/mockData';

export class IndexedDBEvidenceRepository implements IEvidenceRepository {
  async getAll(): Promise<ForensicRecord[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.evidence.values());
      const records = await db.getAll('evidence');
      return records.length > 0 ? records : mockForensicRecords;
    } catch {
      return Array.from(inMemoryFallback.evidence.values());
    }
  }

  async getById(incidentId: string): Promise<ForensicRecord | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.evidence.get(incidentId) || mockForensicRecords.find(r => r.incidentId === incidentId);
      const record = await db.get('evidence', incidentId);
      return record || inMemoryFallback.evidence.get(incidentId) || mockForensicRecords.find(r => r.incidentId === incidentId);
    } catch {
      return inMemoryFallback.evidence.get(incidentId) || mockForensicRecords.find(r => r.incidentId === incidentId);
    }
  }

  async getByIds(incidentIds: string[]): Promise<ForensicRecord[]> {
    if (!incidentIds || incidentIds.length === 0) return [];
    const results: ForensicRecord[] = [];
    for (const id of incidentIds) {
      const rec = await this.getById(id);
      if (rec) results.push(rec);
    }
    return results;
  }

  async getByFindingId(findingId: string): Promise<ForensicRecord[]> {
    const all = await this.getAll();
    return all.filter(r => r.findingId === findingId);
  }

  async save(record: ForensicRecord): Promise<ForensicRecord> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.evidence.set(record.incidentId, record);
        return record;
      }
      await db.put('evidence', record);
      inMemoryFallback.evidence.set(record.incidentId, record);
      return record;
    } catch {
      inMemoryFallback.evidence.set(record.incidentId, record);
      return record;
    }
  }

  async saveMany(records: ForensicRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    try {
      const db = await getSATDatabase();
      if (!db) {
        records.forEach(r => inMemoryFallback.evidence.set(r.incidentId, r));
        return;
      }
      const tx = db.transaction('evidence', 'readwrite');
      for (const record of records) {
        await tx.store.put(record);
        inMemoryFallback.evidence.set(record.incidentId, record);
      }
      await tx.done;
    } catch {
      records.forEach(r => inMemoryFallback.evidence.set(r.incidentId, r));
    }
  }

  async search(query: string): Promise<ForensicRecord[]> {
    const all = await this.getAll();
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      r =>
        r.incidentId.toLowerCase().includes(q) ||
        r.provenanceHash.toLowerCase().includes(q) ||
        r.dispositionGiven.toLowerCase().includes(q) ||
        r.rawPayload.rule_violated?.toLowerCase().includes(q) ||
        r.rawPayload.entity_urn?.toLowerCase().includes(q)
    );
  }
}

export const evidenceRepository = new IndexedDBEvidenceRepository();
