import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IAssessmentRepository, AssessmentCycle } from '../types';
import { mockAssessments } from '../data/mockData';

export class IndexedDBAssessmentRepository implements IAssessmentRepository {
  async getAll(): Promise<AssessmentCycle[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.assessments.values());
      const records = await db.getAll('assessments');
      return records.length > 0 ? records : mockAssessments;
    } catch {
      return Array.from(inMemoryFallback.assessments.values());
    }
  }

  async getActive(): Promise<AssessmentCycle | undefined> {
    const all = await this.getAll();
    return all.find(c => c.status === 'ACTIVE') || all[0];
  }
}

export const assessmentRepository = new IndexedDBAssessmentRepository();
