'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { usePlatform } from './provider';
import { parseRiotName } from '@/services/platform';
export function EntryGate({ children }: { children: React.ReactNode }) {
  const { currentPlayer, services, run, busy, selectProfile, setPendingName } = usePlatform();
  const [nickname, setNickname] = useState('');
  const path = usePathname();
  const router = useRouter();
  if (currentPlayer || path === '/players/register') return children;
  return (
    <main className="entry-screen">
      <section className="entry-card panel">
        <div className="brand entry-brand">
          <Swords />
          <span>RIFTHOUSE</span>
        </div>
        <div className="eyebrow">WELCOME TO THE RIFT</div>
        <h1>
          협곡에서 어떤 이름으로
          <br />
          만날까요?
        </h1>
        <p>롤 닉네임을 입력하면 등록된 내 프로필을 찾아드려요.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await run(async () => {
              const name = parseRiotName(nickname);
              const player = await services.players.findByNickname(nickname);
              if (player) {
                selectProfile(player.id);
                router.replace(`/players/${player.id}`);
              } else {
                setPendingName(name);
                router.push('/players/register');
              }
            }, '');
          }}
        >
          <label>
            롤 닉네임
            <input
              autoFocus
              required
              maxLength={121}
              placeholder="닉네임 또는 닉네임#KR1"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? '프로필 찾는 중…' : '시작하기'}
          </button>
        </form>
        <p className="form-note">
          처음 오셨다면 선수 등록으로 안내합니다.
          <br />이 브라우저에서 사용할 프로필을 선택하는 기능이며, Riot 계정 인증은 아닙니다.
        </p>
      </section>
    </main>
  );
}
