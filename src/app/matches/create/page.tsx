'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/components/provider';
import { PageHeading, PlayerIdentity } from '@/components/ui';
import { Format } from '@/domain/types';
export default function CreateMatch() {
  const { data, services, run, busy } = usePlatform();
  const router = useRouter();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [format, setFormat] = useState<Format>(3);
  const [fearless, setFearless] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  return (
    <>
      <Link href="/matches" className="back-link">
        ← 경기 목록
      </Link>
      <PageHeading
        eyebrow="NEW MATCH"
        title="새로운 내전 만들기"
        description="경기 정보를 입력하고 함께할 선수를 선택하세요."
      />
      <form
        className="create-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          const m = await run(
            () =>
              services.matches.create({
                name,
                scheduledAt: new Date(date).toISOString(),
                format,
                fearless,
                participantIds: ids,
              }),
            '내전을 만들었습니다.',
          );
          if (m) router.push(`/matches/${m.id}`);
        }}
      >
        <section className="panel padded">
          <h2>경기 기본 정보</h2>
          <label>
            경기 이름
            <input
              required
              maxLength={100}
              placeholder="예: 금요일 밤, 협곡 한 판"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            경기 일시 <small>기기 현지 시간 기준</small>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            경기 형식
            <select value={format} onChange={(e) => setFormat(Number(e.target.value) as Format)}>
              <option value={1}>BO1 · 단판 승부</option>
              <option value={3}>BO3 · 2선승제</option>
              <option value={5}>BO5 · 3선승제</option>
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={fearless}
              onChange={(e) => setFearless(e.target.checked)}
            />
            <span>
              Fearless 기록 활성화<small>이전 게임의 챔피언을 확인할 수 있습니다.</small>
            </span>
          </label>
          <div className="info-note">
            참가자는 나중에 추가할 수 있습니다. 팀 구성과 경기 시작에는 10명이 필요합니다.
          </div>
          <div className="form-actions">
            <Link href="/matches" className="button">
              취소
            </Link>
            <button disabled={busy} className="primary">
              내전 만들기
            </button>
          </div>
        </section>
        <section className="panel padded">
          <div className="section-heading">
            <h2>참가 선수</h2>
            <span className="count">{ids.length} / 10</span>
          </div>
          <div className="participant-picker">
            {data.players.map((p) => (
              <label className="pick-player" key={p.id}>
                <input
                  type="checkbox"
                  aria-label={`${p.displayName} 참가`}
                  checked={ids.includes(p.id)}
                  disabled={!ids.includes(p.id) && ids.length >= 10}
                  onChange={(e) =>
                    setIds(e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id))
                  }
                />
                <PlayerIdentity player={p} />
                <span className="muted text-xs">{p.mainPosition}</span>
              </label>
            ))}
          </div>
        </section>
      </form>
    </>
  );
}
