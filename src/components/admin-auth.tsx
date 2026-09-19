'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut, Shield } from 'lucide-react';
import { usePlatform } from './provider';
import { Modal } from './ui';
import { useRouter } from 'next/navigation';

export function AdminAuthButton() {
  const { isAdmin, adminId, adminLogin, adminLogout, busy } = usePlatform();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  if (isAdmin)
    return (
      <>
        <Link className="small button" href="/admin">
          <Shield size={15} /> 관리자
        </Link>
        <button className="small" onClick={() => void adminLogout()} title={adminId ?? undefined}>
          <LogOut size={15} /> 로그아웃
        </button>
      </>
    );
  return (
    <>
      <button className="small" onClick={() => setOpen(true)}>
        <LogIn size={15} /> 관리자 로그인
      </button>
      {open && (
        <Modal title="관리자 로그인" onClose={() => setOpen(false)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (await adminLogin(username, password)) {
                setOpen(false);
                router.push('/admin');
              }
            }}
          >
            <label>
              아이디
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <p className="form-note">등록된 관리자 아이디만 로그인할 수 있습니다.</p>
            <div className="form-actions">
              <button type="button" onClick={() => setOpen(false)}>취소</button>
              <button className="primary" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = usePlatform();
  if (!isAdmin)
    return (
      <section className="panel padded">
        <h1>관리자 로그인이 필요합니다</h1>
        <p className="muted">오른쪽 위의 관리자 로그인 버튼으로 권한이 있는 계정에 로그인해 주세요.</p>
      </section>
    );
  return children;
}
