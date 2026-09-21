'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Database, Player } from '@/domain/types';
import { LocalIdentityRepository } from '@/data/identity';
import { createRepository } from '@/data/repository';
import { createServices, Services } from '@/services/platform';
import { supabase } from '@/lib/supabase';
export type AdminRole = 'ADMIN' | 'OWNER';
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
  isAdmin: boolean;
  isOwner: boolean;
  adminRole: AdminRole | null;
  adminId: string | null;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
};
const PlatformContext = createContext<Context | null>(null);
export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [repository] = useState(() => createRepository());
  const [services] = useState(() => createServices(repository));
  const [identity] = useState(() => new LocalIdentityRepository());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<{ riotId: string; riotTag: string } | null>(null);
  const [data, setData] = useState<Database | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
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
    const unsubscribe = repository.subscribe?.(onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      unsubscribe?.();
    };
  }, [refresh, services, identity, repository]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const checkAdmin = async () => {
      const token = localStorage.getItem('rift-house:admin-session');
      if (!token) return setIsAdmin(false);
      const { data, error } = await client.rpc('admin_session_role', { p_token: token });
      if (error || !data) {
        localStorage.removeItem('rift-house:admin-session');
        setAdminRole(null);
        setAdminId(null);
        return setIsAdmin(false);
      }
      const [role, ...idParts] = String(data).split(':');
      if ((role !== 'ADMIN' && role !== 'OWNER') || !idParts.length) {
        localStorage.removeItem('rift-house:admin-session');
        setAdminRole(null);
        setAdminId(null);
        return setIsAdmin(false);
      }
      setAdminRole(role);
      setAdminId(idParts.join(':'));
      setIsAdmin(true);
    };
    void checkAdmin();
  }, []);
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
  async function adminLogin(username: string, password: string) {
    if (!supabase) throw new Error('Supabase 연결이 필요합니다.');
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('admin_login', {
        p_username: username.trim().toLowerCase(),
        p_password: password,
      });
      if (error) throw error;
      if (!data) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      const token = String(data);
      const { data: session, error: sessionError } = await supabase.rpc('admin_session_role', {
        p_token: token,
      });
      if (sessionError || !session) throw new Error('관리자 권한을 확인하지 못했습니다.');
      const [role, ...idParts] = String(session).split(':');
      if ((role !== 'ADMIN' && role !== 'OWNER') || !idParts.length)
        throw new Error('관리자 권한 정보가 올바르지 않습니다.');
      localStorage.setItem('rift-house:admin-session', token);
      setIsAdmin(true);
      setAdminRole(role);
      setAdminId(idParts.join(':'));
      setNotice({ text: '관리자로 로그인했습니다.', error: false });
      return true;
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : '관리자 로그인에 실패했습니다.',
        error: true,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function adminLogout() {
    const token = localStorage.getItem('rift-house:admin-session');
    if (token) await supabase?.rpc('admin_logout', { p_token: token });
    localStorage.removeItem('rift-house:admin-session');
    setIsAdmin(false);
    setAdminRole(null);
    setAdminId(null);
    setNotice({ text: '관리자에서 로그아웃했습니다.', error: false });
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
            isAdmin,
            isOwner: adminRole === 'OWNER',
            adminRole,
            adminId,
            adminLogin,
            adminLogout,
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
