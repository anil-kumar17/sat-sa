/**
 * SAT-SA (Supervisory Analytics) - IndexedDB Local Persistence Engine
 * 
 * ============================================================================
 * SECURITY BOUNDARY & ARCHITECTURAL NOTE:
 * This implementation provides offline-first durability via browser IndexedDB
 * for supervisory workflows in this prototype environment.
 * 
 * In an enterprise production deployment, local offline retention of supervisory
 * telemetry, findings, and human review determinations would require:
 *  1. Hardware-backed local envelope encryption (AES-256-GCM via WebCrypto with
 *     TPM / FIDO2 biometric key derivation).
 *  2. Mandatory attestation of the endpoint posture and verified supervisor PKI.
 *  3. Ephemeral cache purge timers upon session deauthorization.
 * ============================================================================
 */

import { openDB, IDBPDatabase } from 'idb';
import {
  mockFindings,
  mockForensicRecords,
  mockEntities,
  mockAssessments,
  mockAuditTrail
} from '../data/mockData';
import {
  Finding,
  ForensicRecord,
  Entity,
  AssessmentCycle,
  AuditTrailEvent,
  SupervisorDecision,
  PendingSyncAction
} from '../types';

const DB_NAME = 'sat_sa_supervisory_vault_v1';
const DB_VERSION = 1;

export interface SATDatabaseSchema {
  findings: {
    key: string;
    value: Finding;
  };
  evidence: {
    key: string;
    value: ForensicRecord;
  };
  entities: {
    key: string;
    value: Entity;
  };
  assessments: {
    key: string;
    value: AssessmentCycle;
  };
  audit_trail: {
    key: string;
    value: AuditTrailEvent;
  };
  supervisor_decisions: {
    key: string;
    value: SupervisorDecision;
  };
  sync_queue: {
    key: string;
    value: PendingSyncAction;
  };
  metadata: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<SATDatabaseSchema>> | null = null;
let isStorageAvailable = true;

// In-memory fallback if IndexedDB is blocked or disabled in private browser mode
const inMemoryFallback = {
  findings: new Map<string, Finding>(),
  evidence: new Map<string, ForensicRecord>(),
  entities: new Map<string, Entity>(),
  assessments: new Map<string, AssessmentCycle>(),
  audit_trail: new Map<string, AuditTrailEvent>(),
  supervisor_decisions: new Map<string, SupervisorDecision>(),
  sync_queue: new Map<string, PendingSyncAction>(),
  metadata: new Map<string, { key: string; value: string }>()
};

function seedInMemory() {
  mockFindings.forEach(f => inMemoryFallback.findings.set(f.id, f));
  mockForensicRecords.forEach(r => inMemoryFallback.evidence.set(r.incidentId, r));
  mockEntities.forEach(e => inMemoryFallback.entities.set(e.id, e));
  mockAssessments.forEach(a => inMemoryFallback.assessments.set(a.id, a));
  mockAuditTrail.forEach(t => inMemoryFallback.audit_trail.set(t.id, t));
  inMemoryFallback.metadata.set('lastSyncTime', { key: 'lastSyncTime', value: '09:42 UTC' });
}

export async function getSATDatabase(): Promise<IDBPDatabase<SATDatabaseSchema> | null> {
  if (!isStorageAvailable) return null;
  if (typeof window === 'undefined' || !window.indexedDB) {
    isStorageAvailable = false;
    seedInMemory();
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<SATDatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Findings store
        if (!db.objectStoreNames.contains('findings')) {
          db.createObjectStore('findings', { keyPath: 'id' });
        }
        // Forensic telemetry evidence store
        if (!db.objectStoreNames.contains('evidence')) {
          db.createObjectStore('evidence', { keyPath: 'incidentId' });
        }
        // Entities store
        if (!db.objectStoreNames.contains('entities')) {
          db.createObjectStore('entities', { keyPath: 'id' });
        }
        // Assessment cycles store
        if (!db.objectStoreNames.contains('assessments')) {
          db.createObjectStore('assessments', { keyPath: 'id' });
        }
        // Audit trail store
        if (!db.objectStoreNames.contains('audit_trail')) {
          db.createObjectStore('audit_trail', { keyPath: 'id' });
        }
        // Supervisor decisions store
        if (!db.objectStoreNames.contains('supervisor_decisions')) {
          db.createObjectStore('supervisor_decisions', { keyPath: 'findingId' });
        }
        // Offline sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    }).catch((err) => {
      console.warn('IndexedDB unavailable or blocked; initializing in-memory fallback:', err);
      isStorageAvailable = false;
      seedInMemory();
      return null as unknown as IDBPDatabase<SATDatabaseSchema>;
    });
  }

  return dbPromise;
}

/**
 * Initialize and seed the local database on initial launch if empty
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const db = await getSATDatabase();
    if (!db) {
      seedInMemory();
      return;
    }

    const count = await db.count('findings');
    if (count === 0) {
      // Seed findings
      const tx = db.transaction(
        ['findings', 'evidence', 'entities', 'assessments', 'audit_trail', 'metadata'],
        'readwrite'
      );

      for (const finding of mockFindings) {
        await tx.objectStore('findings').put(finding);
      }
      for (const record of mockForensicRecords) {
        await tx.objectStore('evidence').put(record);
      }
      for (const entity of mockEntities) {
        await tx.objectStore('entities').put(entity);
      }
      for (const cycle of mockAssessments) {
        await tx.objectStore('assessments').put(cycle);
      }
      for (const audit of mockAuditTrail) {
        await tx.objectStore('audit_trail').put(audit);
      }

      await tx.objectStore('metadata').put({
        key: 'lastSyncTime',
        value: '09:42 UTC'
      });
      await tx.objectStore('metadata').put({
        key: 'seedVersion',
        value: '1.0'
      });

      await tx.done;
      console.log('SAT-SA Local Evidence Vault seeded successfully into IndexedDB');
    }
  } catch (err) {
    console.warn('Failed to seed IndexedDB, falling back to in-memory store:', err);
    seedInMemory();
  }
}

export { inMemoryFallback, isStorageAvailable };
