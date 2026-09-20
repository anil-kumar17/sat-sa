import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IAuditRepository, AuditTrailEvent } from '../types';

const isLegacyAuditEvent = (
  event: AuditTrailEvent
): boolean => {
  return /^AUD-\d+$/.test(event.id);
};

const getCurrentAuditEvents = (
  events: AuditTrailEvent[]
): AuditTrailEvent[] => {
  return events
    .filter(event => !isLegacyAuditEvent(event))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();

      if (
        !Number.isNaN(timeA) &&
        !Number.isNaN(timeB)
      ) {
        return timeB - timeA;
      }

      return b.id.localeCompare(a.id);
    });
};

export class IndexedDBAuditRepository
  implements IAuditRepository
{
  async getAll(): Promise<AuditTrailEvent[]> {
    try {
      const db = await getSATDatabase();

      if (!db) {
        return getCurrentAuditEvents(
          Array.from(
            inMemoryFallback.audit_trail.values()
          )
        );
      }

      const records =
        await db.getAll('audit_trail');

      return getCurrentAuditEvents(records);
    } catch (error) {
      console.warn(
        'Failed to read audit trail from IndexedDB, using in-memory fallback:',
        error
      );

      return getCurrentAuditEvents(
        Array.from(
          inMemoryFallback.audit_trail.values()
        )
      );
    }
  }

  async logEvent(
    event: Omit<AuditTrailEvent, 'id'>
  ): Promise<AuditTrailEvent> {
    const id = `LOG-${new Date().getFullYear()}-${Date.now()}`;

    const fullEvent: AuditTrailEvent = {
      ...event,
      id
    };

    try {
      const db = await getSATDatabase();

      if (!db) {
        inMemoryFallback.audit_trail.set(
          id,
          fullEvent
        );

        return fullEvent;
      }

      await db.put(
        'audit_trail',
        fullEvent
      );

      inMemoryFallback.audit_trail.set(
        id,
        fullEvent
      );

      return fullEvent;
    } catch (error) {
      console.warn(
        `Failed to save audit event ${id} to IndexedDB, using in-memory fallback:`,
        error
      );

      inMemoryFallback.audit_trail.set(
        id,
        fullEvent
      );

      return fullEvent;
    }
  }
}

export const auditRepository =
  new IndexedDBAuditRepository();