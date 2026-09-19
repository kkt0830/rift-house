'use client';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, Plus, Swords, Users, Zap } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, formatDate, MatchCard, PageHeading, PlayerIdentity, Rating } from '@/components/ui';
import { effectiveRating, seriesScore } from '@/domain/rules';
export default function Home() {
  const { data } = usePlatform();
  const active = data.matches.filter((m) => ['READY', 'IN_PROGRESS', 'DRAFT'].includes(m.status));
  const recent = data.matches.filter((m) => m.status === 'COMPLETED');
  const leaders = [...data.players]
    .sort((a, b) => effectiveRating(b) - effectiveRating(a))
    .slice(0, 4);
  return (
    <>
      <PageHeading
        eyebrow="YOUR COMMUNITY, YOUR GAME"
        title="우리들의 내전, 한눈에."
        description="선수를 모으고, 팀을 나누고, 함께 기록하세요."
        action={
          <Link href="/matches/create" className="button primary">
            <Plus size={18} />
            내전 만들기
          </Link>
        }
      />
      <div className="stats-grid">
        {[
          {
            label: '등록된 선수',
            value: data.players.length,
            unit: '명',
            sub: '함께 플레이하는 우리 커뮤니티',
            icon: Users,
          },
          {
            label: '진행 중인 경기',
            value: data.matches.filter((m) => m.status === 'IN_PROGRESS').length,
            unit: '경기',
            sub: '지금 협곡에서 만나는 중',
            icon: Zap,
          },
          {
            label: '예정된 경기',
            value: data.matches.filter((m) => ['DRAFT', 'READY'].includes(m.status)).length,
            unit: '경기',
            sub: '다음 한 판을 준비하세요',
            icon: CalendarDays,
          },
          {
            label: '완료된 경기',
            value: recent.length,
            unit: '경기',
            sub: '쌓여가는 우리들의 기록',
            icon: Check,
          },
        ].map(({ label, value, unit, sub, icon: Icon }) => (
          <section className="stat" key={label}>
            <div className="stat-label">
              {label}
              <Icon size={18} />
            </div>
            <strong>
              {value}
              <span>{unit}</span>
            </strong>
            <small>{sub}</small>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <div>
          <section className="section">
            <div className="section-heading">
              <h2>
                <Swords size={20} />
                다가오는 내전<span className="count">{active.length}</span>
              </h2>
              <Link className="text-link" href="/matches">
                전체 보기 <ArrowRight size={15} />
              </Link>
            </div>
            <div className="match-grid">
              {active.slice(0, 2).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
              {!active.length && <Empty text="새 내전을 만들어 첫 경기를 준비하세요." />}
            </div>
          </section>
          <section className="section">
            <div className="section-heading">
              <h2>최근 경기 결과</h2>
              <Link className="text-link" href="/matches?status=COMPLETED">
                경기 기록 <ArrowRight size={15} />
              </Link>
            </div>
            <div className="panel">
              {recent.slice(0, 4).map((m) => {
                const s = seriesScore(m.series);
                return (
                  <Link key={m.id} className="result-row" href={`/matches/${m.id}`}>
                    <div className="result-icon">
                      <Swords size={19} />
                    </div>
                    <div className="grow min-w-0">
                      <strong>{m.name}</strong>
                      <small>
                        {formatDate(m.scheduledAt)} · BO{m.series.format}
                      </small>
                    </div>
                    <div className="result-score">
                      <span className="blue-text">BLUE</span>
                      <b>
                        {s.BLUE} : {s.RED}
                      </b>
                      <span className="red-text">RED</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                );
              })}
              {!recent.length && <Empty text="첫 경기의 결과를 기다리고 있어요." />}
            </div>
          </section>
          <section className="event-banner">
            <div className="event-banner-icon">
              <CalendarDays size={30} />
            </div>
            <div>
              <div className="eyebrow">COMMUNITY EVENT</div>
              <h2>{data.events[0]?.name ?? '커뮤니티 이벤트'}</h2>
              <p>
                {data.events[0]
                  ? formatDate(data.events[0].scheduledAt)
                  : '새로운 이벤트를 기다려 주세요.'}
              </p>
            </div>
            <Link
              className="button"
              href={data.events[0] ? `/events/${data.events[0].id}` : '/events'}
            >
              이벤트 보기 <ArrowRight size={16} />
            </Link>
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="panel ranking-panel">
            <div className="section-heading">
              <h2>커뮤니티 랭킹</h2>
              <span className="muted text-xs">RATING</span>
            </div>
            {leaders.map((p, i) => (
              <div className="leader-row" key={p.id}>
                <span className={`rank rank-${i}`}>{String(i + 1).padStart(2, '0')}</span>
                <PlayerIdentity player={p} />
                <Rating player={p} />
              </div>
            ))}
            <Link href="/rankings" className="ranking-link">
              전체 랭킹 보기 <ArrowRight size={15} />
            </Link>
          </section>
          <section className="guide-panel">
            <span className="eyebrow">READY TO PLAY?</span>
            <h2>좋은 내전의 시작</h2>
            <p>
              실력과 포지션을 고려해
              <br />더 즐거운 한 판을 준비하세요.
            </p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  선수 등록<small>주 포지션과 레이팅을 확인하세요</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  내전 생성<small>10명의 선수를 모아주세요</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  팀 구성 & 경기 시작<small>균형 잡힌 팀으로 만나세요</small>
                </div>
              </li>
            </ol>
            <Link href="/players" className="text-link">
              선수 관리로 이동 <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
