import { Database } from '../domain/types';
import { emptyDatabase, migrateDatabase } from './migrations';
export interface Repository {
  read(): Promise<Database>;
  transact<T>(change: (draft: Database) => T): Promise<T>;
}
export class MemoryRepository implements Repository {
  protected data: Database;
  constructor(initial = emptyDatabase()) {
    this.data = structuredClone(initial);
  }
  async read() {
    return structuredClone(this.data);
  }
  async transact<T>(change: (draft: Database) => T): Promise<T> {
    const draft = structuredClone(this.data);
    const result = change(draft);
    this.data = draft;
    return structuredClone(result);
  }
}
// Device-local development adapter. Supabase implementation must replace transactions
// with server-authorized operations, constraints and concurrency control.
export class LocalRepository implements Repository {
  private key = 'rift-house:development:v1';
  private load(): Database {
    const value = localStorage.getItem(this.key);
    if (!value) return emptyDatabase();
    try {
      const data = JSON.parse(value) as Database;
      if (
        data.version !== 1 ||
        !Array.isArray(data.players) ||
        !Array.isArray(data.matches) ||
        !Array.isArray(data.events) ||
        !Array.isArray(data.ratingEvents)
      )
        throw new Error();
      const migrated = migrateDatabase(data);
      if (migrated !== data) localStorage.setItem(this.key, JSON.stringify(migrated));
      return migrated;
    } catch {
      throw new Error(
        '저장된 개발 데이터를 읽을 수 없습니다. 브라우저의 사이트 저장 데이터를 확인해 주세요.',
      );
    }
  }
  async read() {
    return structuredClone(this.load());
  }
  async transact<T>(change: (draft: Database) => T) {
    const draft = this.load();
    const result = change(draft);
    try {
      localStorage.setItem(this.key, JSON.stringify(draft));
    } catch {
      throw new Error('데이터를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
    }
    return structuredClone(result);
  }
}
