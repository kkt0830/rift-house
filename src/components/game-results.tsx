'use client';
import { useState } from 'react';
import { Match, Side } from '@/domain/types';
import { seriesScore, seriesWinner } from '@/domain/rules';
import { usePlatform } from './provider';
import { Modal } from './ui';
export function GameResults({ match }: { match: Match }) {
  const { data, services, run, busy } = usePlatform();
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Side | null>(null);
  const score = seriesScore(match.series);
  const winner = seriesWinner(match.series);
  const gameNumber = match.series.games.length + 1;
  return (
    <section className="section panel padded">
      <div className="section-heading">
        <h2>시리즈 스코어</h2>
        <span className="muted">
          BO{match.series.format} · {Math.floor(match.series.format / 2) + 1}선승제
        </span>
      </div>
      <div className="series-score">
        <span className="blue-text">BLUE</span>
        <strong>
          {score.BLUE}
          <em>:</em>
          {score.RED}
        </strong>
        <span className="red-text">RED</span>
      </div>
      {winner && <p className="winner-banner">{winner} TEAM이 시리즈에서 승리했습니다.</p>}
      <div className="game-history">
        {match.series.games.map((g) => (
          <details key={g.id}>
            <summary>
              <span>GAME {g.number}</span>
              <strong className={g.winner === 'BLUE' ? 'blue-text' : 'red-text'}>
                {g.winner} WIN
              </strong>
              <span className="muted">라인업 및 챔피언 기록</span>
            </summary>
            <div className="history-roster">
              {g.roster.map((t) => (
                <div key={t.playerId}>
                  <span className={t.side === 'BLUE' ? 'blue-text' : 'red-text'}>
                    {t.side} · {t.position}
                  </span>
                  <span>
                    {data.players.find((p) => p.id === t.playerId)?.displayName ??
                      '알 수 없는 선수'}
                  </span>
                  <span>
                    {g.picks.find((p) => p.playerId === t.playerId)?.champion || '미기록'}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      {match.status === 'IN_PROGRESS' && (
        <div className="current-game">
          <div className="section-heading">
            <h3>GAME {gameNumber} 결과 입력</h3>
            {match.series.fearless && <span className="tag">FEARLESS</span>}
          </div>
          {match.series.fearless && (
            <p className="info-note">
              이전 게임 사용 챔피언:{' '}
              {match.series.games.flatMap((g) => g.picks.map((p) => p.champion)).join(', ') ||
                '아직 없습니다.'}
              <br />
              v0.1은 기록과 조회를 지원합니다. 챔피언 사용 제한은 자동 적용하지 않습니다.
            </p>
          )}
          <details className="champion-editor">
            <summary>챔피언 기록 (선택)</summary>
            <div className="form-grid">
              {match.teams.map((t) => (
                <label key={t.playerId}>
                  {t.side} · {data.players.find((p) => p.id === t.playerId)?.displayName}
                  <input
                    aria-label={`${data.players.find((p) => p.id === t.playerId)?.displayName} 챔피언`}
                    maxLength={40}
                    placeholder="챔피언 이름"
                    value={picks[t.playerId] ?? ''}
                    onChange={(e) => setPicks({ ...picks, [t.playerId]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </details>
          <div className="result-buttons">
            <button className="blue-button" disabled={busy} onClick={() => setConfirm('BLUE')}>
              BLUE 승리
            </button>
            <button className="red-button" disabled={busy} onClick={() => setConfirm('RED')}>
              RED 승리
            </button>
          </div>
        </div>
      )}
      {confirm && (
        <Modal title={`GAME ${gameNumber} 결과 확정`} onClose={() => setConfirm(null)}>
          <p>
            {confirm} TEAM의 승리로 기록합니다. 초기 버전에서는 확정한 결과를 수정할 수 없습니다.
          </p>
          <div className="form-actions">
            <button onClick={() => setConfirm(null)}>돌아가기</button>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                const ok = await run(async () => {
                  await services.matches.submitGameResult(
                    match.id,
                    confirm,
                    Object.entries(picks)
                      .filter(([, champion]) => champion.trim())
                      .map(([playerId, champion]) => ({ playerId, champion })),
                    gameNumber,
                  );
                  return true;
                }, '게임 결과를 기록했습니다.');
                if (ok) {
                  setConfirm(null);
                  setPicks({});
                }
              }}
            >
              결과 확정
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
