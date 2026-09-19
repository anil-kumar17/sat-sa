import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IDataQualityRepository, DataQualityReport } from '../types';

export class IndexedDBDataQualityRepository implements IDataQualityRepository {
  async saveReport(report: DataQualityReport): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.data_quality_reports.set(report.submissionId, report);
        return;
      }
      await db.put('data_quality_reports', report);
    } catch (err) {
      console.warn('Failed to save data quality report to IndexedDB, using fallback:', err);
      inMemoryFallback.data_quality_reports.set(report.submissionId, report);
    }
  }

  async getBySubmissionId(submissionId: string): Promise<DataQualityReport | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.data_quality_reports.get(submissionId);
      return await db.get('data_quality_reports', submissionId);
    } catch {
      return inMemoryFallback.data_quality_reports.get(submissionId);
    }
  }

  async deleteBySubmissionId(submissionId: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.data_quality_reports.delete(submissionId);
        return;
      }
      await db.delete('data_quality_reports', submissionId);
    } catch (err) {
      console.warn('Failed to delete data quality report for submission:', err);
      inMemoryFallback.data_quality_reports.delete(submissionId);
    }
  }
}

export const dataQualityRepository = new IndexedDBDataQualityRepository();
