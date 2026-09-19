import { Player, POSITIONS, TeamSlot } from '../../domain/types';
import { effectiveRating, validateParticipants } from '../../domain/rules';
export interface BalanceOption {
  teams: TeamSlot[];
  ratingGap: number;
  offRoleCount: number;
  score: number;
}
function check(players: Player[]) {
  validateParticipants(players.map((p) => p.id));
  if (players.length !== 10) throw new Error('팀 구성에는 선수 10명이 필요합니다.');
}
export function randomAssignment(players: Player[], random = Math.random): TeamSlot[] {
  check(players);
  const shuffled = [...players];
  for (let i = 9; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((p, i) => ({
    playerId: p.id,
    side: i < 5 ? 'BLUE' : 'RED',
    position: POSITIONS[i % 5],
  }));
}
const penalty = (p: Player, pos: string) =>
  p.mainPosition === pos ? 0 : p.subPosition === pos ? 35 : 120;
function positionAssignment(players: Player[]) {
  let best: Player[] = [];
  let bestCost = Infinity;
  function visit(order: Player[], remaining: Player[], cost: number) {
    if (cost >= bestCost) return;
    if (!remaining.length) {
      best = order;
      bestCost = cost;
      return;
    }
    for (const p of remaining)
      visit(
        [...order, p],
        remaining.filter((q) => q.id !== p.id),
        cost + penalty(p, POSITIONS[order.length]),
      );
  }
  visit([], players, 0);
  return { players: best, cost: bestCost };
}
// Enumerate 126 unique 5v5 partitions, fixing the first ID to Blue to exclude mirrors.
// Each team uses an exact 5! role assignment; no AI or mutable UI state is involved.
export function balancedAssignment(input: Player[]): BalanceOption[] {
  check(input);
  const players = [...input].sort((a, b) => a.id.localeCompare(b.id));
  const options: BalanceOption[] = [];
  for (let mask = 0; mask < 512; mask++) {
    const blue = [players[0]],
      red: Player[] = [];
    for (let i = 0; i < 9; i++) (mask & (1 << i) ? blue : red).push(players[i + 1]);
    if (blue.length !== 5) continue;
    const a = positionAssignment(blue),
      b = positionAssignment(red);
    const gap =
      Math.abs(
        blue.reduce((n, p) => n + effectiveRating(p), 0) -
          red.reduce((n, p) => n + effectiveRating(p), 0),
      ) / 5;
    const teams: TeamSlot[] = [
      ...a.players.map((p, i) => ({
        playerId: p.id,
        side: 'BLUE' as const,
        position: POSITIONS[i],
      })),
      ...b.players.map((p, i) => ({
        playerId: p.id,
        side: 'RED' as const,
        position: POSITIONS[i],
      })),
    ];
    options.push({
      teams,
      ratingGap: Math.round(gap),
      offRoleCount: teams.filter(
        (t) => players.find((p) => p.id === t.playerId)!.mainPosition !== t.position,
      ).length,
      score: gap + a.cost + b.cost,
    });
  }
  return options.sort((a, b) => a.score - b.score).slice(0, 3);
}
