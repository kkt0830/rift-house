'use client';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, PageHeading, PlayerIdentity, Rating } from '@/components/ui';
import { effectiveRating, playerStats } from '@/domain/rules';
import { TIER_GROUPS } from '@/domain/types';
export default function Rankings() {
  const { data } = usePlatform();
  const [tier, setTier] = useState('ALL');
  const players = [...data.players].filter(
    (player) => tier === 'ALL' || player.tier.split(' ')[0] === tier,
  ).sort(
    (a, b) => effectiveRating(b) - effectiveRating(a) || a.id.localeCompare(b.id),
  );
  return (
    <>
      <PageHeading
        eyebrow="LEADERBOARD"
        title="커뮤니티 랭킹"
        description="최종 레이팅 기준 순위입니다. 승률은 기록된 개별 게임을 기준으로 계산합니다."
      />
      <div className="toolbar ranking-toolbar">
        <div className="filter-field">
          <SlidersHorizontal size={17} />
          <select aria-label="티어 필터" value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="ALL">모든 티어</option>
            {TIER_GROUPS.map((group) => <option key={group}>{group}</option>)}
          </select>
        </div>
        <span className="muted">총 {players.length}명</span>
      </div>
      <div className="panel ranking-table">
        <div className="ranking-table-head">
          <span>순위</span>
          <span>선수</span>
          <span>주 포지션</span>
          <span>게임 / 승률</span>
          <span>레이팅</span>
        </div>
        {players.map((p, i) => {
          const stats = playerStats(p.id, data.matches);
          return (
            <div className="ranking-table-row" key={p.id}>
              <span className={`rank rank-${i}`}>{String(i + 1).padStart(2, '0')}</span>
              <PlayerIdentity player={p} />
              <span className="position-label">{p.mainPosition}</span>
              <span className="muted">
                {stats.played}게임 · {stats.winRate}%
              </span>
              <Rating player={p} />
            </div>
          );
        })}
        {!players.length && <Empty text="선택한 티어에 등록된 선수가 없습니다." />}
      </div>
      <p className="form-note">
        초기 버전은 경기 결과에 따른 레이팅 자동 변경을 적용하지 않습니다.
      </p>
    </>
  );
}
