'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/components/provider';
import { Empty, formatDate, MatchCard, PageHeading, PlayerIdentity } from '@/components/ui';
import { REGISTRATION_STATUSES, RegistrationStatus } from '@/domain/types';
const labels: Record<RegistrationStatus, string> = {
  APPLIED: '신청',
  CONFIRMED: '확정',
  WAITLIST: '대기',
  CANCELLED: '취소',
  LATE_CANCEL: '당일 취소',
  PRESENT: '출석',
  LATE: '지각',
  NO_SHOW: '불참',
};
export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, services, run, busy } = usePlatform();
  const [pid, setPid] = useState('');
  const event = data.events.find((e) => e.id === id);
  if (!event) return <Empty text="이벤트를 찾을 수 없습니다." />;
  return (
    <>
      <Link className="back-link" href="/events">
        ← 이벤트 목록
      </Link>
      <PageHeading
        eyebrow="COMMUNITY EVENT"
        title={event.name}
        description={`${formatDate(event.scheduledAt)} · 정원 ${event.capacity}명`}
      />
      <p className="muted">{event.description}</p>
      <section className="section">
        <h2>연결된 경기</h2>
        <div className="match-grid three">
          {data.matches
            .filter((m) => event.matchIds.includes(m.id))
            .map((m) => (
              <MatchCard match={m} key={m.id} />
            ))}
        </div>
      </section>
      <section className="panel padded section">
        <div className="section-heading">
          <h2>
            참가 및 출석 <span className="count">{event.registrations.length}명</span>
          </h2>
        </div>
        <div className="toolbar">
          <select
            aria-label="이벤트 참가 선수"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
          >
            <option value="">선수 선택</option>
            {data.players
              .filter((p) => !event.registrations.some((r) => r.playerId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
          </select>
          <button
            disabled={busy || !pid}
            onClick={async () => {
              const ok = await run(async () => {
                await services.events.register(id, pid);
                return true;
              }, '참가 신청을 등록했습니다.');
              if (ok) setPid('');
            }}
          >
            참가 신청
          </button>
        </div>
        {event.registrations.map((r) => (
          <div className="registration-row" key={r.playerId}>
            <PlayerIdentity player={data.players.find((p) => p.id === r.playerId)!} />
            <select
              aria-label={`${data.players.find((p) => p.id === r.playerId)?.displayName} 출석 상태`}
              value={r.status}
              disabled={busy}
              onChange={(e) =>
                run(
                  () =>
                    services.events.setStatus(id, r.playerId, e.target.value as RegistrationStatus),
                  '참가 상태를 변경했습니다.',
                )
              }
            >
              {REGISTRATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>
    </>
  );
}
