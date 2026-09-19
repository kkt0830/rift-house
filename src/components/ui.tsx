'use client';
import Link from 'next/link';
import { ArrowUpRight, Swords, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Match, MatchStatus, Player } from '@/domain/types';
import { effectiveRating, seriesScore } from '@/domain/rules';
export const statusLabels: Record<MatchStatus, string> = {
  DRAFT: '참가 모집',
  READY: '준비 완료',
  IN_PROGRESS: '진행 중',
  COMPLETED: '경기 종료',
  CANCELLED: '취소됨',
};
export function Badge({ status }: { status: MatchStatus }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <i />
      {statusLabels[status]}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Avatar({ player }: { player: Player }) {
  return (
    <span className={`avatar tone-${player.mainPosition.toLowerCase()}`}>
      {player.displayName.slice(0, 1)}
    </span>
  );
}
export function PlayerIdentity({ player }: { player: Player }) {
  return (
    <div className="identity">
      <Avatar player={player} />
      <div>
        <Link href={`/players/${player.id}`} className="player-name">
          {player.displayName}
        </Link>
        <small>
          {player.riotId} <span>#{player.riotTag}</span>
        </small>
      </div>
    </div>
  );
}
export function Rating({ player }: { player: Player }) {
  return <span className="rating">{effectiveRating(player).toLocaleString()}</span>;
}
export function Empty({ text = '아직 등록된 항목이 없습니다.' }: { text?: string }) {
  return (
    <div className="empty">
      <Swords size={26} />
      <p>{text}</p>
    </div>
  );
}
export function MatchCard({ match }: { match: Match }) {
  const score = seriesScore(match.series);
  return (
    <Link href={`/matches/${match.id}`} className="match-card">
      <div className="flex items-center justify-between gap-2">
        <Badge status={match.status} />
        <span className="muted text-sm">BO{match.series.format}</span>
      </div>
      <h3>{match.name}</h3>
      <p className="muted text-sm">{formatDate(match.scheduledAt)}</p>
      <div className="match-versus">
        <span className="blue-text">BLUE</span>
        <strong>
          {match.series.games.length ? (
            `${score.BLUE} : ${score.RED}`
          ) : (
            <span className="versus">VS</span>
          )}
        </strong>
        <span className="red-text">RED</span>
      </div>
      <div className="card-footer">
        <span>
          {match.participantIds.length}/10명 {match.series.fearless ? '· FEARLESS' : ''}
        </span>
        <ArrowUpRight size={18} />
      </div>
    </Link>
  );
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-body">
        <div className="section-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
