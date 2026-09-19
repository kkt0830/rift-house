import { Match, Player, Series, Side, TeamSlot, POSITIONS } from './types';
export const effectiveRating = (p: Player) => p.internalRating + p.adminAdjustment;
export const seriesScore = (series: Series) => ({
  BLUE: series.games.filter((g) => g.winner === 'BLUE').length,
  RED: series.games.filter((g) => g.winner === 'RED').length,
});
export function seriesWinner(series: Series): Side | null {
  const score = seriesScore(series);
  const target = Math.floor(series.format / 2) + 1;
  return score.BLUE >= target ? 'BLUE' : score.RED >= target ? 'RED' : null;
}
export function validateParticipants(ids: string[]) {
  if (new Set(ids).size !== ids.length) throw new Error('이미 참가한 선수입니다.');
  if (ids.length > 10) throw new Error('한 경기에는 최대 10명까지 참가할 수 있습니다.');
}
export function validateTeams(teams: TeamSlot[], ids: string[]) {
  validateParticipants(ids);
  if (
    ids.length !== 10 ||
    teams.length !== 10 ||
    new Set(teams.map((t) => t.playerId)).size !== 10 ||
    teams.some((t) => !ids.includes(t.playerId))
  )
    throw new Error('팀 구성에는 중복 없는 참가자 10명이 필요합니다.');
  for (const side of ['BLUE', 'RED'] as const)
    if (
      POSITIONS.some(
        (pos) => teams.filter((t) => t.side === side && t.position === pos).length !== 1,
      )
    )
      throw new Error('각 팀에 포지션별 한 명씩 배정해 주세요.');
}
export const teamAverage = (teams: TeamSlot[], players: Player[], side: Side) => {
  const list = teams
    .filter((t) => t.side === side)
    .map((t) => players.find((p) => p.id === t.playerId))
    .filter((p): p is Player => !!p);
  return list.length
    ? Math.round(list.reduce((n, p) => n + effectiveRating(p), 0) / list.length)
    : 0;
};
export function playerStats(id: string, matches: Match[]) {
  let wins = 0;
  let played = 0;
  for (const match of matches)
    for (const game of match.series.games) {
      const slot = game.roster.find((t) => t.playerId === id);
      if (slot) {
        played++;
        if (slot.side === game.winner) wins++;
      }
    }
  return { wins, played, winRate: played ? Math.round((wins / played) * 100) : 0 };
}
