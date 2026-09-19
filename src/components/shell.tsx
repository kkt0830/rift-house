'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatform } from './provider';
import {
  CalendarDays,
  ChevronRight,
  Crown,
  LayoutDashboard,
  Shield,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
const nav = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/players', label: '선수 관리', icon: Users },
  { href: '/matches', label: '내전 경기', icon: Swords },
  { href: '/events', label: '이벤트', icon: CalendarDays },
  { href: '/rankings', label: '랭킹', icon: Trophy },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { currentPlayer, clearProfile } = usePlatform();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Swords size={23} />
          </span>
          <span>
            RIFT<span className="brand-light">HOUSE</span>
            <small>내전 커뮤니티</small>
          </span>
        </Link>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="주 메뉴">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={path === href || (href !== '/' && path.startsWith(href)) ? 'active' : ''}
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === '/matches' && <span className="nav-hint">5v5</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-caption">MANAGEMENT</div>
          <Link className={path === '/admin' ? 'active' : ''} href="/admin">
            <Shield size={18} />
            운영자
          </Link>
          <Link href="/owner">
            <Crown size={18} />
            시스템 설정
          </Link>
          <div className="community-label">
            <span className="community-icon">RH</span>
            <div>
              {currentPlayer ? (
                <Link href={`/players/${currentPlayer.id}`}>
                  {currentPlayer.riotId}
                  <small>내 프로필</small>
                </Link>
              ) : (
                <>
                  우리들의 협곡<small>커뮤니티 워크스페이스</small>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            워크스페이스
            <ChevronRight size={14} />
            <strong>
              {nav.find((n) => (n.href === '/' ? path === '/' : path.startsWith(n.href)))?.label ??
                '운영 관리'}
            </strong>
          </div>
          <div className="topbar-actions">
            {currentPlayer && (
              <>
                <Link className="my-profile-link" href={`/players/${currentPlayer.id}`}>
                  {currentPlayer.riotId}
                </Link>
                <button className="small" onClick={clearProfile}>
                  프로필 전환
                </button>
              </>
            )}
            <Link href="/admin" className="mobile-admin">
              <Shield size={16} />
              <span>운영자</span>
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          RIFTHOUSE{' '}
          <span>독립적인 LoL 커뮤니티 내전 플랫폼 · Riot Games 공식 서비스가 아닙니다.</span>
        </footer>
      </div>
    </div>
  );
}
