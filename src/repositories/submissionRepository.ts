import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { ISubmissionRepository, CSESubmission } from '../types';

export class IndexedDBSubmissionRepository implements ISubmissionRepository {
  async getAll(): Promise<CSESubmission[]> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        return Array.from(inMemoryFallback.submissions.values()).sort(
          (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
        );
      }
      const records = await db.getAll('submissions');
      return records.sort(
        (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
      );
    } catch (err) {
      console.warn('Failed to get submissions from IndexedDB, using fallback:', err);
      return Array.from(inMemoryFallback.submissions.values());
    }
  }

  async getById(submissionId: string): Promise<CSESubmission | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.submissions.get(submissionId);
      return await db.get('submissions', submissionId);
    } catch {
      return inMemoryFallback.submissions.get(submissionId);
    }
  }

  async save(submission: CSESubmission): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.submissions.set(submission.submissionId, submission);
        return;
      }
      await db.put('submissions', submission);
    } catch (err) {
      console.warn('Failed to save submission to IndexedDB, using fallback:', err);
      inMemoryFallback.submissions.set(submission.submissionId, submission);
    }
  }

  async delete(submissionId: string): Promise<void> {
    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.submissions.delete(submissionId);
        return;
      }
      await db.delete('submissions', submissionId);
    } catch (err) {
      console.warn('Failed to delete submission from IndexedDB:', err);
      inMemoryFallback.submissions.delete(submissionId);
    }
  }
}

export const submissionRepository = new IndexedDBSubmissionRepository();
