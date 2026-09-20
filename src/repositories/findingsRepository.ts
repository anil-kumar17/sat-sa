import { getSATDatabase, inMemoryFallback } from '../storage/db';
import {
  IFindingRepository,
  Finding,
  FindingStatus,
  SupervisorDecision
} from '../types';

const isPersistedFinding = (finding: Finding): boolean => {
  return Boolean(
    finding.submissionId ||
    finding.provenance?.submissionId
  );
};

const filterPersistedFindings = (
  findings: Finding[]
): Finding[] => {
  return findings.filter(isPersistedFinding);
};

const getSubmissionId = (
  finding: Finding
): string | undefined => {
  return finding.submissionId || finding.provenance?.submissionId;
};

export class IndexedDBFindingsRepository
  implements IFindingRepository
{
  async getAll(): Promise<Finding[]> {
    try {
      const db = await getSATDatabase();

      if (!db) {
        return filterPersistedFindings(
          Array.from(inMemoryFallback.findings.values())
        );
      }

      const records = await db.getAll('findings');

      return filterPersistedFindings(records);
    } catch (error) {
      console.warn(
        'Failed to read findings from IndexedDB, using in-memory fallback:',
        error
      );

      return filterPersistedFindings(
        Array.from(inMemoryFallback.findings.values())
      );
    }
  }

  async getById(
    id: string
  ): Promise<Finding | undefined> {
    try {
      const db = await getSATDatabase();

      if (!db) {
        const fallback =
          inMemoryFallback.findings.get(id);

        return fallback && isPersistedFinding(fallback)
          ? fallback
          : undefined;
      }

      const record = await db.get('findings', id);

      if (record && isPersistedFinding(record)) {
        return record;
      }

      return undefined;
    } catch (error) {
      console.warn(
        `Failed to read finding ${id} from IndexedDB, using in-memory fallback:`,
        error
      );

      const fallback =
        inMemoryFallback.findings.get(id);

      return fallback && isPersistedFinding(fallback)
        ? fallback
        : undefined;
    }
  }

  async save(
    finding: Finding
  ): Promise<Finding> {
    if (!isPersistedFinding(finding)) {
      throw new Error(
        `Finding ${finding.id} cannot be persisted without a submission reference`
      );
    }

    try {
      const db = await getSATDatabase();

      if (!db) {
        inMemoryFallback.findings.set(
          finding.id,
          finding
        );

        return finding;
      }

      await db.put('findings', finding);

      inMemoryFallback.findings.set(
        finding.id,
        finding
      );

      return finding;
    } catch (error) {
      console.warn(
        `Failed to save finding ${finding.id} to IndexedDB, using in-memory fallback:`,
        error
      );

      inMemoryFallback.findings.set(
        finding.id,
        finding
      );

      return finding;
    }
  }

  async getBySubmissionId(
    submissionId: string
  ): Promise<Finding[]> {
    if (!submissionId) {
      return [];
    }

    const all = await this.getAll();

    return all.filter(
      finding =>
        getSubmissionId(finding) === submissionId
    );
  }

  async getByRuleAndSubmission(
    ruleCode: string,
    submissionId: string
  ): Promise<Finding | undefined> {
    if (!ruleCode || !submissionId) {
      return undefined;
    }

    const all = await this.getAll();

    return all.find(
      finding =>
        finding.ruleCode === ruleCode &&
        getSubmissionId(finding) === submissionId
    );
  }

  async updateStatus(
    id: string,
    status: FindingStatus
  ): Promise<Finding> {
    const finding = await this.getById(id);

    if (!finding) {
      throw new Error(
        `Finding ${id} not found in local vault`
      );
    }

    const updated: Finding = {
      ...finding,
      status,
      lastUpdated:
        new Date()
          .toISOString()
          .replace('T', ' ')
          .substring(0, 19) + ' UTC'
    };

    try {
      const db = await getSATDatabase();

      if (!db) {
        inMemoryFallback.findings.set(
          id,
          updated
        );

        return updated;
      }

      await db.put('findings', updated);

      inMemoryFallback.findings.set(
        id,
        updated
      );

      return updated;
    } catch (error) {
      console.warn(
        `Failed to update finding ${id} in IndexedDB, using in-memory fallback:`,
        error
      );

      inMemoryFallback.findings.set(
        id,
        updated
      );

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
    } catch (error) {
      console.warn(
        `Failed to delete finding ${id} from IndexedDB:`,
        error
      );

      inMemoryFallback.findings.delete(id);
    }
  }

  async getSupervisorDecision(
    findingId: string
  ): Promise<SupervisorDecision | undefined> {
    try {
      const db = await getSATDatabase();

      if (!db) {
        return inMemoryFallback.supervisor_decisions.get(
          findingId
        );
      }

      const decision = await db.get(
        'supervisor_decisions',
        findingId
      );

      return (
        decision ||
        inMemoryFallback.supervisor_decisions.get(
          findingId
        )
      );
    } catch (error) {
      console.warn(
        `Failed to read supervisor decision for ${findingId}:`,
        error
      );

      return inMemoryFallback.supervisor_decisions.get(
        findingId
      );
    }
  }

  async saveSupervisorDecision(
    decision: SupervisorDecision
  ): Promise<void> {
    try {
      const db = await getSATDatabase();

      if (!db) {
        inMemoryFallback.supervisor_decisions.set(
          decision.findingId,
          decision
        );

        return;
      }

      await db.put(
        'supervisor_decisions',
        decision
      );

      inMemoryFallback.supervisor_decisions.set(
        decision.findingId,
        decision
      );
    } catch (error) {
      console.warn(
        `Failed to save supervisor decision for ${decision.findingId}:`,
        error
      );

      inMemoryFallback.supervisor_decisions.set(
        decision.findingId,
        decision
      );
    }
  }
}

export const findingsRepository =
  new IndexedDBFindingsRepository();