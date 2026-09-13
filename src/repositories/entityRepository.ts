import { getSATDatabase, inMemoryFallback } from '../storage/db';
import { IEntityRepository, Entity } from '../types';
import { mockEntities } from '../data/mockData';

export class IndexedDBEntityRepository implements IEntityRepository {
  async getAll(): Promise<Entity[]> {
    try {
      const db = await getSATDatabase();
      if (!db) return Array.from(inMemoryFallback.entities.values());
      const records = await db.getAll('entities');
      return records.length > 0 ? records : mockEntities;
    } catch {
      return Array.from(inMemoryFallback.entities.values());
    }
  }

  async getById(id: string): Promise<Entity | undefined> {
    try {
      const db = await getSATDatabase();
      if (!db) return inMemoryFallback.entities.get(id) || mockEntities.find(e => e.id === id);
      const record = await db.get('entities', id);
      return record || mockEntities.find(e => e.id === id);
    } catch {
      return inMemoryFallback.entities.get(id) || mockEntities.find(e => e.id === id);
    }
  }
}

export const entityRepository = new IndexedDBEntityRepository();
