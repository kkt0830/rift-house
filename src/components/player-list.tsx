'use client';
import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { usePlatform } from '@/components/provider';
import { Empty, Modal, PageHeading, PlayerIdentity, Rating } from '@/components/ui';
import { PlayerForm } from '@/components/player-form';
import { Player, POSITIONS, TIER_GROUPS } from '@/domain/types';
import { PlayerImport } from './player-import';
export default function PlayerList({ administrative = false }: { administrative?: boolean }) {
  const { data, currentPlayer, selectProfile, clearProfile, services, run, busy } = usePlatform();
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [tier, setTier] = useState('ALL');
  const [editing, setEditing] = useState<Player | 'new' | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const players = data.players.filter(
    (p) =>
      (position === 'ALL' || p.mainPosition === position) &&
      (tier === 'ALL' || p.tier.split(' ')[0] === tier) &&
      `${p.displayName} ${p.riotId}#${p.riotTag}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      {administrative && <PlayerImport />}
      <PageHeading
        eyebrow="PLAYERS"
        title="함께하는 선수들"
        description="우리 커뮤니티의 선수와 포지션, 레이팅을 관리하세요."
        action={
          <div className="heading-actions">
            {administrative && data.players.length > 0 && (
              <button className="danger" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 size={17} /> 선수 전체 삭제
              </button>
            )}
            <button className="primary" onClick={() => setEditing('new')}>
              <Plus size={18} /> 선수 등록
            </button>
          </div>
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
        {administrative && (
          <div className="filter-field">
            <select aria-label="티어 필터" value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="ALL">모든 티어</option>
              {TIER_GROUPS.map((group) => <option key={group}>{group}</option>)}
            </select>
          </div>
        )}
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
            <span className={`tier tier-${p.tier.split(' ')[0].toLowerCase()}`}>{p.tier}</span>
            <div className="positions">
              <span>{p.mainPosition}</span>
              <small>{p.subPosition}</small>
            </div>
            <Rating player={p} />
            <div className="row-actions">
              {(administrative || currentPlayer?.id === p.id) && (
                <button className="small" onClick={() => setEditing(p)}>수정</button>
              )}
              {administrative && (
                <button
                  className="small danger"
                  disabled={busy}
                  aria-label={`${p.displayName} 삭제`}
                  onClick={() => {
                    if (window.confirm(`${p.displayName} 선수를 삭제할까요?`))
                      void run(() => services.players.delete(p.id), '선수를 삭제했습니다.');
                  }}
                >
                  <Trash2 size={15} /> 삭제
                </button>
              )}
            </div>
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
      {deleteAllOpen && (
        <Modal
          title="선수 전체 삭제"
          onClose={() => {
            setDeleteAllOpen(false);
            setDeleteAllConfirmation('');
          }}
        >
          <p className="form-error">
            등록된 선수 {data.players.length}명과 선수에 연결된 참가·레이팅 기록이 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <label>
            계속하려면 <strong>전체 삭제</strong>를 입력하세요.
            <input
              autoFocus
              value={deleteAllConfirmation}
              onChange={(event) => setDeleteAllConfirmation(event.target.value)}
              placeholder="전체 삭제"
            />
          </label>
          <div className="form-actions">
            <button type="button" onClick={() => setDeleteAllOpen(false)}>취소</button>
            <button
              className="danger"
              disabled={busy || deleteAllConfirmation !== '전체 삭제'}
              onClick={async () => {
                const deleted = await run(
                  () => services.players.deleteAll(),
                  `${data.players.length}명의 선수를 삭제했습니다.`,
                );
                if (deleted !== undefined) {
                  clearProfile();
                  setDeleteAllOpen(false);
                  setDeleteAllConfirmation('');
                }
              }}
            >
              {busy ? '삭제 중…' : '전체 선수 삭제'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
