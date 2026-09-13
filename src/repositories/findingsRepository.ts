import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IFindingRepository, Finding, FindingStatus, SupervisorDecision } from '../types';
import { mockFindings } from '../data/mockData';

export class IndexedDBFindingsRepository implements IFindingRepository {
  async getAll(): Promise<Finding[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.findings.values());
      const records = await db.getAll('findings');
      return records.length > 0 ? records : mockFindings;
    } catch {
      return Array.from(inMemoryFallback.findings.values());
    }
  }

  async getById(id: string): Promise<Finding | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.findings.get(id) || mockFindings.find(f => f.id === id);
      const record = await db.get('findings', id);
      return record || mockFindings.find(f => f.id === id);
    } catch {
      return inMemoryFallback.findings.get(id) || mockFindings.find(f => f.id === id);
    }
  }

  async updateStatus(id: string, status: FindingStatus): Promise<Finding> {
    const finding = await this.getById(id);
    if (!finding) throw new Error(`Finding ${id} not found in local vault`);

    const updated: Finding = {
      ...finding,
      status,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };

    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.findings.set(id, updated);
        return updated;
      }
      await db.put('findings', updated);
      return updated;
    } catch {
      inMemoryFallback.findings.set(id, updated);
      return updated;
    }
  }

  async getSupervisorDecision(findingId: string): Promise<SupervisorDecision | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.supervisor_decisions.get(findingId);
      return await db.get('supervisor_decisions', findingId);
    } catch {
      return inMemoryFallback.supervisor_decisions.get(findingId);
    }
  }

  async saveSupervisorDecision(decision: SupervisorDecision): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.supervisor_decisions.set(decision.findingId, decision);
        return;
      }
      await db.put('supervisor_decisions', decision);
    } catch {
      inMemoryFallback.supervisor_decisions.set(decision.findingId, decision);
    }
  }
}

export const findingsRepository = new IndexedDBFindingsRepository();
