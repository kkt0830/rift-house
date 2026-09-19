import { Database } from '../domain/types';
import { emptyDatabase, migrateDatabase } from './migrations';
import { supabase } from '../lib/supabase';
export interface Repository {
  read(): Promise<Database>;
  transact<T>(change: (draft: Database) => T): Promise<T>;
  subscribe?(onChange: () => void): () => void;
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

type StateRow = { data: Database; revision: number };

export class SupabaseRepository implements Repository {
  async read() {
    if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    const { data, error } = await supabase
      .from('app_state')
      .select('data, revision')
      .eq('id', 'global')
      .single<StateRow>();
    if (error) throw new Error(`공용 데이터를 불러오지 못했습니다: ${error.message}`);
    return migrateDatabase(data.data);
  }

  async transact<T>(change: (draft: Database) => T): Promise<T> {
    if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: row, error: readError } = await supabase
        .from('app_state')
        .select('data, revision')
        .eq('id', 'global')
        .single<StateRow>();
      if (readError) throw new Error(`공용 데이터를 불러오지 못했습니다: ${readError.message}`);
      const draft = structuredClone(migrateDatabase(row.data));
      const result = change(draft);
      const { data: updated, error: updateError } = await supabase
        .from('app_state')
        .update({ data: draft, revision: row.revision + 1, updated_at: new Date().toISOString() })
        .eq('id', 'global')
        .eq('revision', row.revision)
        .select('revision');
      if (updateError) throw new Error(`공용 데이터를 저장하지 못했습니다: ${updateError.message}`);
      if (updated?.length) return structuredClone(result);
    }
    throw new Error('다른 사용자가 동시에 수정했습니다. 최신 데이터를 불러온 뒤 다시 시도해 주세요.');
  }

  subscribe(onChange: () => void) {
    if (!supabase) return () => undefined;
    const client = supabase;
    const channel = client
      .channel('rift-house-shared-state')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.global' },
        onChange,
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }
}

export function createRepository(): Repository {
  return supabase ? new SupabaseRepository() : new LocalRepository();
}
