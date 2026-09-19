import { Database, Player, POSITIONS } from '../src/domain/types';
import { balancedAssignment } from '../src/lib/balancing';
const names = [
  '새벽의협곡',
  '정글산책',
  '미드나잇',
  '카이팅장인',
  '든든한서폿',
  '탑은고독해',
  '오브젝트헌터',
  '별빛아리',
  '바텀듀오',
  '와드요정',
  '블루노트',
  '달빛검객',
  '피치티',
  '잔잔한파도',
  '돌아온너구리',
  '오후의게임',
  '민트초코',
  '한타의정석',
  '여름소나기',
  '작은별',
];
export function createSeed(): Database {
  const players: Player[] = names.map((displayName, i) => ({
    id: `player-${i + 1}`,
    displayName,
    riotId: ['Dawn', 'Forest Walk', 'Midnight', 'Kiting', 'Guardian'][i % 5] + (i + 1),
    riotTag: 'KR1',
    tier: (['EMERALD', 'PLATINUM', 'DIAMOND', 'GOLD', 'EMERALD'] as const)[i % 5],
    mainPosition: POSITIONS[i % 5],
    subPosition: POSITIONS[(i + 2) % 5],
    internalRating: 1300 + ((i * 73) % 480),
    adminAdjustment: i % 4 === 0 ? 25 : 0,
  }));
  const teams = balancedAssignment(players.slice(0, 10))[0].teams;
  return {
    version: 1,
    players,
    ratingEvents: [],
    matches: [
      {
        id: 'friday-night',
        name: '금요일 밤, 협곡 한 판',
        scheduledAt: '2026-09-19T20:00:00+09:00',
        status: 'READY',
        participantIds: players.slice(0, 10).map((p) => p.id),
        teams,
        hostIds: [],
        series: { id: 'series-friday', format: 3, fearless: true, games: [] },
      },
      {
        id: 'weekend-warmup',
        name: '주말 워밍업 내전',
        scheduledAt: '2026-09-20T19:00:00+09:00',
        status: 'DRAFT',
        participantIds: players.slice(10, 16).map((p) => p.id),
        teams: [],
        hostIds: [],
        series: { id: 'series-weekend', format: 1, fearless: false, games: [] },
      },
      {
        id: 'september-friendly',
        name: '9월 정기 친선전',
        scheduledAt: '2026-09-18T20:00:00+09:00',
        status: 'COMPLETED',
        participantIds: players.slice(0, 10).map((p) => p.id),
        teams,
        hostIds: [],
        series: {
          id: 'series-friendly',
          format: 3,
          fearless: false,
          games: (['BLUE', 'RED', 'BLUE'] as const).map((winner, i) => ({
            id: `demo-game-${i}`,
            number: i + 1,
            winner,
            picks: [],
            roster: structuredClone(teams),
            completedAt: `2026-09-18T${21 + i}:00:00+09:00`,
          })),
        },
      },
    ],
    events: [
      {
        id: 'autumn-community',
        name: '가을 커뮤니티 내전',
        description: '함께 즐기는 주말 내전. 참가 신청과 출석을 확인하고 연결된 경기를 운영하세요.',
        scheduledAt: '2026-09-26T19:00:00+09:00',
        capacity: 40,
        matchIds: ['friday-night', 'weekend-warmup'],
        registrations: players
          .slice(0, 14)
          .map((p, i) => ({ playerId: p.id, status: i < 10 ? 'CONFIRMED' : 'APPLIED' })),
      },
    ],
  };
}
