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
      return record || mockForensicRecords.find(r => r.incidentId === incidentId);
    } catch {
      return inMemoryFallback.evidence.get(incidentId) || mockForensicRecords.find(r => r.incidentId === incidentId);
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
