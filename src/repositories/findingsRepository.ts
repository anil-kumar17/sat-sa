import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IFindingRepository, Finding, FindingStatus, SupervisorDecision } from '../types';
import { mockFindings } from '../data/mockData';

export class IndexedDBFindingsRepository implements IFindingRepository {
  async getAll(): Promise<Finding[]> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        const inMem = Array.from(inMemoryFallback.findings.values());
        if (inMem.length === 0) return mockFindings;
        const inMemIds = new Set(inMem.map(r => r.id));
        const unshadowed = mockFindings.filter(m => !inMemIds.has(m.id));
        return [...inMem, ...unshadowed];
      }
      const records = await db.getAll('findings');
      if (records.length === 0) return mockFindings;
      const recordIds = new Set(records.map(r => r.id));
      const unshadowedMocks = mockFindings.filter(m => !recordIds.has(m.id));
      return [...records, ...unshadowedMocks];
    } catch {
      return Array.from(inMemoryFallback.findings.values());
    }
  }

  async getById(id: string): Promise<Finding | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.findings.get(id) || mockFindings.find(f => f.id === id);
      const record = await db.get('findings', id);
      return record || inMemoryFallback.findings.get(id) || mockFindings.find(f => f.id === id);
    } catch {
      return inMemoryFallback.findings.get(id) || mockFindings.find(f => f.id === id);
    }
  }

  async save(finding: Finding): Promise<Finding> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.findings.set(finding.id, finding);
        return finding;
      }
      await db.put('findings', finding);
      inMemoryFallback.findings.set(finding.id, finding);
      return finding;
    } catch {
      inMemoryFallback.findings.set(finding.id, finding);
      return finding;
    }
  }

  async getBySubmissionId(submissionId: string): Promise<Finding[]> {
    const all = await this.getAll();
    return all.filter(f => f.submissionId === submissionId || f.provenance?.submissionId === submissionId);
  }

  async getByRuleAndSubmission(ruleCode: string, submissionId: string): Promise<Finding | undefined> {
    const all = await this.getAll();
    return all.find(
      f =>
        f.ruleCode === ruleCode &&
        (f.submissionId === submissionId || f.provenance?.submissionId === submissionId)
    );
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

  async delete(id: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (db) {
        await db.delete('findings', id);
      }
      inMemoryFallback.findings.delete(id);
    } catch {
      inMemoryFallback.findings.delete(id);
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
