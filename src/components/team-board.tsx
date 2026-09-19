'use client';
import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Match } from '@/domain/types';
import { teamAverage } from '@/domain/rules';
import { usePlatform } from './provider';
import { PlayerIdentity, Rating } from './ui';
export function TeamBoard({ match }: { match: Match }) {
  const { data, services, run, busy } = usePlatform();
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const editable = ['DRAFT', 'READY'].includes(match.status);
  return (
    <>
      <div className="team-grid">
        {(['BLUE', 'RED'] as const).map((side) => (
          <section className={`team-panel ${side.toLowerCase()}`} key={side}>
            <div className="team-header">
              <h2>{side} TEAM</h2>
              <span>
                평균 <strong>{teamAverage(match.teams, data.players, side)}</strong>
              </span>
            </div>
            {match.teams
              .filter((t) => t.side === side)
              .map((slot) => {
                const p = data.players.find((p) => p.id === slot.playerId)!;
                return (
                  <div className="team-player" key={slot.position}>
                    <span className="position-label">{slot.position}</span>
                    <PlayerIdentity player={p} />
                    <Rating player={p} />
                  </div>
                );
              })}
          </section>
        ))}
      </div>
      {editable && (
        <div className="swap-controls">
          <ArrowLeftRight size={19} />
          <label>
            <span className="sr-only">교환할 첫 번째 선수</span>
            <select value={first} onChange={(e) => setFirst(e.target.value)}>
              <option value="">첫 번째 선수 선택</option>
              {match.teams.map((t) => (
                <option key={t.playerId} value={t.playerId}>
                  {t.side} · {t.position} ·{' '}
                  {data.players.find((p) => p.id === t.playerId)?.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">교환할 두 번째 선수</span>
            <select value={second} onChange={(e) => setSecond(e.target.value)}>
              <option value="">두 번째 선수 선택</option>
              {match.teams
                .filter((t) => t.playerId !== first)
                .map((t) => (
                  <option key={t.playerId} value={t.playerId}>
                    {t.side} · {t.position} ·{' '}
                    {data.players.find((p) => p.id === t.playerId)?.displayName}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={busy || !first || !second || first === second}
            onClick={() =>
              run(() => services.matches.swap(match.id, first, second), '선수 위치를 교환했습니다.')
            }
          >
            선수 교환
          </button>
        </div>
      )}
    </>
  );
}
