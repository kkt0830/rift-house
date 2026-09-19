'use client';
import { useState } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, Modal, PageHeading, PlayerIdentity, Rating } from '@/components/ui';
import { PlayerForm } from '@/components/player-form';
import { Player, POSITIONS } from '@/domain/types';
export default function PlayerList({ administrative = false }: { administrative?: boolean }) {
  const { data, currentPlayer, selectProfile } = usePlatform();
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [editing, setEditing] = useState<Player | 'new' | null>(null);
  const players = data.players.filter(
    (p) =>
      (position === 'ALL' || p.mainPosition === position) &&
      `${p.displayName} ${p.riotId}#${p.riotTag}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="PLAYERS"
        title="함께하는 선수들"
        description="우리 커뮤니티의 선수와 포지션, 레이팅을 관리하세요."
        action={
          <button className="primary" onClick={() => setEditing('new')}>
            <Plus size={18} />
            선수 등록
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="선수 검색"
            placeholder="선수 이름 또는 Riot ID 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <SlidersHorizontal size={17} />
          <select
            aria-label="포지션 필터"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="ALL">모든 포지션</option>
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <span className="muted">총 {players.length}명</span>
      </div>
      <div className="panel player-table">
        <div className="player-table-head">
          <span>선수</span>
          <span>RIOT TIER</span>
          <span>주 / 부 포지션</span>
          <span>최종 레이팅</span>
          <span />
        </div>
        {players.map((p) => (
          <div className="player-table-row" key={p.id}>
            <PlayerIdentity player={p} />
            <span className={`tier tier-${p.tier.toLowerCase()}`}>{p.tier}</span>
            <div className="positions">
              <span>{p.mainPosition}</span>
              <small>{p.subPosition}</small>
            </div>
            <Rating player={p} />
            {(administrative || currentPlayer?.id === p.id) && (
              <button className="small" onClick={() => setEditing(p)}>
                수정
              </button>
            )}
          </div>
        ))}
        {!players.length && <Empty text="검색 조건에 맞는 선수가 없습니다." />}
      </div>
      {editing && (
        <Modal
          title={editing === 'new' ? '새 선수 등록' : '선수 정보 수정'}
          onClose={() => setEditing(null)}
        >
          <PlayerForm
            administrative={administrative}
            player={editing === 'new' ? undefined : editing}
            onDone={(player) => {
              if (player && editing === 'new' && !administrative) selectProfile(player.id);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
