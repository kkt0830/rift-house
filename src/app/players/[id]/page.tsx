'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/components/provider';
import { Empty, MatchCard, Modal, PageHeading, PlayerIdentity } from '@/components/ui';
import { PlayerForm } from '@/components/player-form';
import { effectiveRating, playerStats } from '@/domain/rules';
export default function PlayerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, currentPlayer } = usePlatform();
  const [editing, setEditing] = useState(false);
  const p = data.players.find((p) => p.id === id);
  if (!p) return <Empty text="이 선수를 찾을 수 없습니다." />;
  const stats = playerStats(id, data.matches);
  const history = data.matches.filter((m) =>
    m.series.games.some((g) => g.roster.some((t) => t.playerId === id)),
  );
  return (
    <>
      <Link href="/players" className="back-link">
        ← 선수 목록
      </Link>
      <PageHeading
        eyebrow="PLAYER PROFILE"
        title={p.displayName}
        action={
          currentPlayer?.id === id && (
            <button onClick={() => setEditing(true)}>선수 정보 수정</button>
          )
        }
      />
      <div className="panel profile">
        <PlayerIdentity player={p} />
        <span className="tier">{p.tier}</span>
        <span>
          {p.mainPosition} / {p.subPosition}
        </span>
      </div>
      <div className="stats-grid">
        {[
          ['최종 레이팅', effectiveRating(p)],
          [
            '내부 / 보정',
            `${p.internalRating} / ${p.adminAdjustment > 0 ? '+' : ''}${p.adminAdjustment}`,
          ],
          ['참여 게임', stats.played],
          ['승률', `${stats.winRate}%`],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="section">
        <h2>참여 경기 기록</h2>
        <div className="match-grid three">
          {history.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {!history.length && <Empty text="아직 참여한 게임 기록이 없습니다." />}
        </div>
      </section>
      <section className="section panel padded">
        <h2>레이팅 변경 기록</h2>
        {data.ratingEvents
          .filter((r) => r.playerId === id)
          .map((r) => (
            <p key={r.id}>
              {r.before} → {r.before + r.delta} · {r.reason}
            </p>
          ))}
        {!data.ratingEvents.some((r) => r.playerId === id) && (
          <p className="muted">
            변경 기록이 없습니다. 자동 경기 레이팅은 이후 버전에서 제공됩니다.
          </p>
        )}
      </section>
      {editing && (
        <Modal title="선수 정보 수정" onClose={() => setEditing(false)}>
          <PlayerForm player={p} onDone={() => setEditing(false)} />
        </Modal>
      )}
    </>
  );
}
