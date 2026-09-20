'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Play, Shuffle, Scale, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePlatform } from '@/components/provider';
import { Badge, Empty, formatDate, Modal, PageHeading, PlayerIdentity } from '@/components/ui';
import { TeamBoard } from '@/components/team-board';
import { GameResults } from '@/components/game-results';
import { BalanceOption } from '@/lib/balancing';
export default function MatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, services, run, busy, isAdmin } = usePlatform();
  const router = useRouter();
  const [options, setOptions] = useState<BalanceOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const m = data.matches.find((m) => m.id === id);
  if (!m) return <Empty text="경기를 찾을 수 없습니다." />;
  const editable = ['DRAFT', 'READY'].includes(m.status);
  return (
    <>
      <Link href="/matches" className="back-link">
        ← 경기 목록
      </Link>
      <PageHeading
        eyebrow="MATCH ROOM"
        title={m.name}
        description={`${formatDate(m.scheduledAt)} · BO${m.series.format}${m.series.fearless ? ' · FEARLESS' : ''}`}
        action={<Badge status={m.status} />}
      />
      <div className="match-actions">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="tag">{m.participantIds.length} / 10명 참가</span>
          <span className="muted text-sm">
            {editable
              ? '참가자와 팀을 확인한 뒤 경기를 시작하세요.'
              : m.status === 'IN_PROGRESS'
                ? '진행 중에는 팀 구성이 고정됩니다.'
                : '경기 기록을 확인하세요.'}
          </span>
        </div>
        {m.status === 'READY' && (
          <button
            className="primary"
            disabled={busy}
            onClick={() => run(() => services.matches.start(id), '경기를 시작했습니다.')}
          >
            <Play size={16} />
            경기 시작
          </button>
        )}
      </div>
      <section className="section">
        <div className="section-heading">
          <h2>팀 구성</h2>
          {editable && (
            <div className="button-group">
              <button
                disabled={busy || m.participantIds.length !== 10}
                onClick={() => {
                  setOptions([]);
                  run(() => services.matches.assignTeams(id), '무작위 팀을 구성했습니다.');
                }}
              >
                <Shuffle size={16} />
                랜덤 편성
              </button>
              <button
                disabled={busy || m.participantIds.length !== 10}
                onClick={async () => {
                  const result = await run(
                    () => services.matches.recommendations(id),
                    '균형 편성 후보 3개를 찾았습니다.',
                  );
                  if (result) setOptions(result);
                }}
              >
                <Scale size={16} />
                균형 편성
              </button>
            </div>
          )}
        </div>
        {options.length > 0 && editable && (
          <div className="balance-options">
            {options.map((option, i) => (
              <button
                key={i}
                disabled={busy}
                onClick={async () => {
                  const ok = await run(
                    async () => {
                      await services.matches.assignTeams(id, option.teams);
                      return true;
                    },
                    `후보 ${i + 1}을 적용했습니다.`,
                  );
                  if (ok) setOptions([]);
                }}
              >
                <b>OPTION {String.fromCharCode(65 + i)}</b>
                <span>평균 레이팅 차이 {option.ratingGap}</span>
                <small>주 포지션 외 배정 {option.offRoleCount}명 · 눌러서 적용</small>
              </button>
            ))}
          </div>
        )}
        {m.teams.length ? (
          <TeamBoard match={m} />
        ) : (
          <div className="panel">
            <Empty
              text={
                m.participantIds.length === 10
                  ? '선수가 모두 모였습니다. 랜덤 또는 균형 편성을 선택하세요.'
                  : '참가자 10명을 모으면 팀을 구성할 수 있습니다.'
              }
            />
          </div>
        )}
      </section>
      {editable && (
        <section className="section panel padded">
          <div className="section-heading">
            <h2>
              참가자 <span className="count">{m.participantIds.length}</span>
            </h2>
            <button
              disabled={busy || m.participantIds.length >= 10}
              onClick={() => setAdding(true)}
            >
              <UserPlus size={16} />
              선수 추가
            </button>
          </div>
          <p className="form-note">참가자를 변경하면 기존 팀 편성이 초기화됩니다.</p>
          <div className="roster-grid">
            {m.participantIds.map((pid) => {
              const p = data.players.find((p) => p.id === pid)!;
              return (
                <div className="roster-person" key={pid}>
                  <PlayerIdentity player={p} />
                  <button
                    className="small"
                    disabled={busy}
                    onClick={() => {
                      setOptions([]);
                      run(
                        () => services.matches.removeParticipant(id, pid),
                        '참가자를 제거했습니다.',
                      );
                    }}
                  >
                    제거
                  </button>
                </div>
              );
            })}
          </div>
          {!m.participantIds.length && <Empty text="함께할 선수를 추가해 주세요." />}
        </section>
      )}
      <GameResults match={m} />
      {isAdmin && m.status === 'IN_PROGRESS' && (
        <div className="form-actions">
          <button
            disabled={busy || !m.series.games.length}
            onClick={() => run(() => services.matches.complete(id), '내전을 종료했습니다.')}
          >
            <CheckCircle2 size={16} /> 내전 종료
          </button>
        </div>
      )}
      {editable && (
        <div className="form-actions">
          <button className="danger-quiet" onClick={() => setCancel(true)}>
            경기 취소
          </button>
        </div>
      )}
      {isAdmin && (
        <div className="form-actions">
          <button className="danger-quiet" onClick={() => setDeleting(true)}>
            <Trash2 size={16} /> 내전 삭제
          </button>
        </div>
      )}
      {adding && (
        <Modal title="참가 선수 추가" onClose={() => setAdding(false)}>
          <p className="muted">{m.participantIds.length}/10명 참가</p>
          <div className="participant-picker">
            {data.players
              .filter((p) => !m.participantIds.includes(p.id))
              .map((p) => (
                <div className="pick-player" key={p.id}>
                  <PlayerIdentity player={p} />
                  <button
                    className="small"
                    disabled={busy || m.participantIds.length >= 10}
                    onClick={() => {
                      setOptions([]);
                      run(
                        () => services.matches.addParticipant(id, p.id),
                        '참가자를 추가했습니다.',
                      );
                    }}
                  >
                    추가
                  </button>
                </div>
              ))}
          </div>
        </Modal>
      )}
      {cancel && (
        <Modal title="경기를 취소할까요?" onClose={() => setCancel(false)}>
          <p>취소한 경기는 기록에 남으며 다시 시작할 수 없습니다.</p>
          <div className="form-actions">
            <button onClick={() => setCancel(false)}>돌아가기</button>
            <button
              disabled={busy}
              onClick={async () => {
                await run(() => services.matches.cancel(id), '경기를 취소했습니다.');
                setCancel(false);
              }}
            >
              경기 취소 확정
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal title="내전을 삭제할까요?" onClose={() => setDeleting(false)}>
          <p>경기 결과와 이벤트 연결을 포함한 이 내전 기록이 삭제됩니다.</p>
          <div className="form-actions">
            <button onClick={() => setDeleting(false)}>돌아가기</button>
            <button
              className="danger-quiet"
              disabled={busy}
              onClick={async () => {
                const removed = await run(() => services.matches.delete(id), '내전을 삭제했습니다.');
                if (removed) router.replace('/matches');
              }}
            >
              내전 삭제 확정
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
