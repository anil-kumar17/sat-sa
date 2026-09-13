import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IAuditRepository, AuditTrailEvent } from '../types';
import { mockAuditTrail } from '../data/mockData';

export class IndexedDBAuditRepository implements IAuditRepository {
  async getAll(): Promise<AuditTrailEvent[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.audit_trail.values());
      const records = await db.getAll('audit_trail');
      return records.length > 0 ? records : mockAuditTrail;
    } catch {
      return Array.from(inMemoryFallback.audit_trail.values());
    }
  }

  async logEvent(event: Omit<AuditTrailEvent, 'id'>): Promise<AuditTrailEvent> {
    const id = `LOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullEvent: AuditTrailEvent = {
      ...event,
      id
    };

    try {
      const db = await getSATDatabase();
      if (!db) {
        inMemoryFallback.audit_trail.set(id, fullEvent);
        return fullEvent;
      }
      await db.put('audit_trail', fullEvent);
      return fullEvent;
    } catch {
      inMemoryFallback.audit_trail.set(id, fullEvent);
      return fullEvent;
    }
  }
}

export const auditRepository = new IndexedDBAuditRepository();
