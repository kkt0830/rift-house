'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Database, Player } from '@/domain/types';
import { LocalIdentityRepository } from '@/data/identity';
import { LocalRepository } from '@/data/repository';
import { createServices, Services } from '@/services/platform';
type Context = {
  data: Database;
  services: Services;
  run: <T>(work: () => Promise<T>, message?: string) => Promise<T | undefined>;
  busy: boolean;
  currentPlayer: Player | null;
  selectProfile: (playerId: string) => void;
  clearProfile: () => void;
  pendingName: { riotId: string; riotTag: string } | null;
  setPendingName: (value: { riotId: string; riotTag: string } | null) => void;
};
const PlatformContext = createContext<Context | null>(null);
export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [services] = useState(() => createServices(new LocalRepository()));
  const [identity] = useState(() => new LocalIdentityRepository());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<{ riotId: string; riotTag: string } | null>(null);
  const [data, setData] = useState<Database | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const refresh = useCallback(async () => {
    setData(await services.snapshot());
  }, [services]);
  useEffect(() => {
    let mounted = true;
    services
      .snapshot()
      .then((snapshot) => {
        if (mounted) {
          setData(snapshot);
          setCurrentId(identity.read());
        }
      })
      .catch((e) => {
        if (mounted) setNotice({ text: String(e.message), error: true });
      });
    const onStorage = () => {
      refresh().catch((e) => setNotice({ text: String(e.message), error: true }));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh, services, identity]);
  function selectProfile(playerId: string) {
    identity.select(playerId);
    setCurrentId(playerId);
    setPendingName(null);
  }
  function clearProfile() {
    identity.clear();
    setCurrentId(null);
    setPendingName(null);
  }
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function run<T>(work: () => Promise<T>, message = '저장했습니다.'): Promise<T | undefined> {
    setBusy(true);
    try {
      const result = await work();
      await refresh();
      if (message) setNotice({ text: message, error: false });
      return result;
    } catch (e) {
      setNotice({
        text: e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.',
        error: true,
      });
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {notice && (
        <div
          className={`toast ${notice.error ? 'error' : ''}`}
          role={notice.error ? 'alert' : 'status'}
        >
          {notice.text}
          <button aria-label="알림 닫기" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
      {data ? (
        <PlatformContext.Provider
          value={{
            data,
            services,
            run,
            busy,
            currentPlayer: data.players.find((p) => p.id === currentId) ?? null,
            selectProfile,
            clearProfile,
            pendingName,
            setPendingName,
          }}
        >
          {children}
        </PlatformContext.Provider>
      ) : (
        <div className="loading">
          <h2>{notice?.error ? '데이터를 불러올 수 없습니다' : '협곡을 준비하고 있어요'}</h2>
          <p>{notice?.error ? notice.text : '선수와 경기 정보를 불러오는 중입니다.'}</p>
          <button
            onClick={() => refresh().catch((e) => setNotice({ text: e.message, error: true }))}
          >
            다시 불러오기
          </button>
        </div>
      )}
    </>
  );
}
export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('PlatformProvider가 필요합니다.');
  return context;
}
