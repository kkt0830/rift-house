import { Repository } from '../data/repository';
import {
  ChampionPick,
  CreateMatchInput,
  CreatePlayerInput,
  Database,
  Match,
  Player,
  REGISTRATION_STATUSES,
  RegistrationStatus,
  Side,
  TeamSlot,
  TIERS,
  POSITIONS,
  UpdatePlayerInput,
} from '../domain/types';
import { seriesWinner, validateParticipants, validateTeams } from '../domain/rules';
import { balancedAssignment, randomAssignment } from '../lib/balancing';
import { TIER_RATINGS, validateRating } from '../domain/rating';
export type SelfRegistrationInput = Omit<CreatePlayerInput, 'internalRating' | 'adminAdjustment'>;
export function parseRiotName(value: string) {
  const parts = value.trim().split('#');
  if (
    parts.length > 2 ||
    !parts[0]?.trim() ||
    parts[0].trim().length > 60 ||
    (parts.length === 2 && (!parts[1].trim() || parts[1].trim().length > 60))
  )
    throw new Error('롤 닉네임 또는 닉네임#태그 형식으로 입력해 주세요.');
  return { riotId: parts[0].trim(), riotTag: parts[1]?.trim() ?? '' };
}
const id = () => crypto.randomUUID();
function getMatch(db: Database, matchId: string) {
  const m = db.matches.find((m) => m.id === matchId);
  if (!m) throw new Error('경기를 찾을 수 없습니다.');
  return m;
}
function editable(m: Match) {
  if (!['DRAFT', 'READY'].includes(m.status))
    throw new Error('진행 중이거나 종료된 경기의 참가자와 팀은 수정할 수 없습니다.');
}
function validatePlayer(p: CreatePlayerInput) {
  if (!p.displayName.trim() || !p.riotId.trim() || !p.riotTag.trim())
    throw new Error('선수 이름과 Riot ID, 태그를 입력해 주세요.');
  if ([p.displayName, p.riotId, p.riotTag].some((s) => s.length > 60))
    throw new Error('이름과 ID는 60자 이내로 입력해 주세요.');
  if (
    !TIERS.includes(p.tier) ||
    !POSITIONS.includes(p.mainPosition) ||
    !POSITIONS.includes(p.subPosition)
  )
    throw new Error('티어와 포지션을 확인해 주세요.');
  if (p.mainPosition === p.subPosition)
    throw new Error('주 포지션과 부 포지션을 다르게 선택해 주세요.');
  validateRating(p.internalRating, p.adminAdjustment);
}
function uniqueRiot(db: Database, p: Player) {
  if (
    db.players.some(
      (q) =>
        q.id !== p.id &&
        q.riotId.toLowerCase() === p.riotId.toLowerCase() &&
        q.riotTag.toLowerCase() === p.riotTag.toLowerCase(),
    )
  )
    throw new Error('이미 등록된 Riot ID입니다.');
}
export function createServices(repository: Repository) {
  return {
    snapshot: () => repository.read(),
    players: {
      findByNickname: async (nickname: string) => {
        const name = parseRiotName(nickname);
        const found = (await repository.read()).players.filter(
          (p) =>
            p.riotId.trim().toLowerCase() === name.riotId.toLowerCase() &&
            (!name.riotTag || p.riotTag.toLowerCase() === name.riotTag.toLowerCase()),
        );
        if (found.length > 1)
          throw new Error('같은 닉네임의 선수가 여러 명입니다. 닉네임#태그로 입력해 주세요.');
        return found[0] ?? null;
      },
      registerSelf: (input: SelfRegistrationInput) =>
        repository.transact((db) => {
          // Explicit projection prevents caller-supplied rating fields from overriding the tier policy.
          const p: Player = {
            id: id(),
            displayName: input.displayName.trim(),
            riotId: input.riotId.trim(),
            riotTag: input.riotTag.trim(),
            tier: input.tier,
            mainPosition: input.mainPosition,
            subPosition: input.subPosition,
            internalRating: TIER_RATINGS[input.tier],
            adminAdjustment: 0,
          };
          validatePlayer(p);
          uniqueRiot(db, p);
          db.players.push(p);
          return p;
        }),
      updateSelf: (playerId: string, input: SelfRegistrationInput) =>
        repository.transact((db) => {
          const p = db.players.find((p) => p.id === playerId);
          if (!p) throw new Error('이 선수를 찾을 수 없습니다.');
          // Tier editing after registration does not reset earned/internal ratings or adjustments.
          const next: Player = {
            ...p,
            displayName: input.displayName.trim(),
            riotId: input.riotId.trim(),
            riotTag: input.riotTag.trim(),
            tier: input.tier,
            mainPosition: input.mainPosition,
            subPosition: input.subPosition,
          };
          validatePlayer(next);
          uniqueRiot(db, next);
          Object.assign(p, next);
          return p;
        }),
      list: async () => (await repository.read()).players,
      getById: async (playerId: string) =>
        (await repository.read()).players.find((p) => p.id === playerId) ?? null,
      create: (input: CreatePlayerInput) =>
        repository.transact((db) => {
          validatePlayer(input);
          const p: Player = {
            ...input,
            displayName: input.displayName.trim(),
            riotId: input.riotId.trim(),
            riotTag: input.riotTag.trim(),
            id: id(),
          };
          uniqueRiot(db, p);
          db.players.push(p);
          return p;
        }),
      update: (playerId: string, input: UpdatePlayerInput) =>
        repository.transact((db) => {
          const p = db.players.find((p) => p.id === playerId);
          if (!p) throw new Error('이 선수를 찾을 수 없습니다.');
          const next = { ...p, ...input };
          next.displayName = next.displayName.trim();
          next.riotId = next.riotId.trim();
          next.riotTag = next.riotTag.trim();
          validatePlayer(next);
          uniqueRiot(db, next);
          if (p.internalRating !== next.internalRating)
            db.ratingEvents.push({
              id: id(),
              playerId,
              before: p.internalRating,
              delta: next.internalRating - p.internalRating,
              reason: '개발 모드 운영자 수정',
              createdAt: new Date().toISOString(),
            });
          Object.assign(p, next);
          return p;
        }),
    },
    matches: {
      list: async () => (await repository.read()).matches,
      getById: async (matchId: string) =>
        (await repository.read()).matches.find((m) => m.id === matchId) ?? null,
      create: (input: CreateMatchInput) =>
        repository.transact((db) => {
          if (
            !input.name.trim() ||
            input.name.length > 100 ||
            !Number.isFinite(Date.parse(input.scheduledAt)) ||
            ![1, 3, 5].includes(input.format)
          )
            throw new Error('경기 이름, 일정, 형식을 확인해 주세요.');
          validateParticipants(input.participantIds);
          if (input.participantIds.some((pid) => !db.players.some((p) => p.id === pid)))
            throw new Error('등록되지 않은 선수입니다.');
          const m: Match = {
            id: id(),
            name: input.name.trim(),
            scheduledAt: input.scheduledAt,
            participantIds: input.participantIds,
            status: 'DRAFT',
            teams: [],
            hostIds: [],
            series: { id: id(), format: input.format, fearless: input.fearless, games: [] },
          };
          db.matches.unshift(m);
          return m;
        }),
      addParticipant: (matchId: string, playerId: string) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          editable(m);
          if (!db.players.some((p) => p.id === playerId))
            throw new Error('이 선수를 찾을 수 없습니다.');
          const ids = [...m.participantIds, playerId];
          validateParticipants(ids);
          m.participantIds = ids;
          m.teams = [];
          m.status = 'DRAFT';
        }),
      removeParticipant: (matchId: string, playerId: string) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          editable(m);
          m.participantIds = m.participantIds.filter((p) => p !== playerId);
          m.teams = [];
          m.status = 'DRAFT';
        }),
      recommendations: async (matchId: string) => {
        const db = await repository.read();
        const m = getMatch(db, matchId);
        editable(m);
        return balancedAssignment(
          m.participantIds.map((pid) => db.players.find((p) => p.id === pid)!),
        );
      },
      assignTeams: (matchId: string, teams?: TeamSlot[]) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          editable(m);
          const next =
            teams ??
            randomAssignment(m.participantIds.map((pid) => db.players.find((p) => p.id === pid)!));
          validateTeams(next, m.participantIds);
          m.teams = structuredClone(next);
          m.status = 'READY';
        }),
      swap: (matchId: string, first: string, second: string) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          editable(m);
          const a = m.teams.find((t) => t.playerId === first),
            b = m.teams.find((t) => t.playerId === second);
          if (!a || !b) throw new Error('교환할 선수를 선택해 주세요.');
          [a.playerId, b.playerId] = [b.playerId, a.playerId];
          validateTeams(m.teams, m.participantIds);
        }),
      start: (matchId: string) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          if (m.status !== 'READY')
            throw new Error('팀 구성을 완료한 준비 상태에서 시작할 수 있습니다.');
          validateTeams(m.teams, m.participantIds);
          m.status = 'IN_PROGRESS';
        }),
      cancel: (matchId: string) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          editable(m);
          m.status = 'CANCELLED';
        }),
      submitGameResult: (
        matchId: string,
        winner: Side,
        picks: ChampionPick[],
        expectedGame: number,
      ) =>
        repository.transact((db) => {
          const m = getMatch(db, matchId);
          if (m.status !== 'IN_PROGRESS' || seriesWinner(m.series))
            throw new Error('진행 중인 경기가 아니거나 이미 종료되었습니다.');
          if (m.series.games.length + 1 !== expectedGame)
            throw new Error('이미 처리된 게임입니다. 최신 결과를 확인해 주세요.');
          if (!['BLUE', 'RED'].includes(winner)) throw new Error('승리 팀을 선택해 주세요.');
          if (
            new Set(picks.map((p) => p.playerId)).size !== picks.length ||
            picks.some(
              (p) =>
                !m.participantIds.includes(p.playerId) ||
                !p.champion.trim() ||
                p.champion.length > 40,
            )
          )
            throw new Error('챔피언 기록을 확인해 주세요.');
          m.series.games.push({
            id: id(),
            number: expectedGame,
            winner,
            picks: picks.map((p) => ({ ...p, champion: p.champion.trim() })),
            roster: structuredClone(m.teams),
            completedAt: new Date().toISOString(),
          });
          if (seriesWinner(m.series)) m.status = 'COMPLETED';
        }),
    },
    events: {
      register: (eventId: string, playerId: string) =>
        repository.transact((db) => {
          const e = db.events.find((e) => e.id === eventId);
          if (!e || !db.players.some((p) => p.id === playerId))
            throw new Error('이벤트 또는 선수를 찾을 수 없습니다.');
          if (e.registrations.some((r) => r.playerId === playerId))
            throw new Error('이미 신청한 선수입니다.');
          const active = e.registrations.filter(
            (r) => !['CANCELLED', 'LATE_CANCEL', 'WAITLIST'].includes(r.status),
          ).length;
          e.registrations.push({ playerId, status: active >= e.capacity ? 'WAITLIST' : 'APPLIED' });
        }),
      setStatus: (eventId: string, playerId: string, status: RegistrationStatus) =>
        repository.transact((db) => {
          const e = db.events.find((e) => e.id === eventId);
          const r = e?.registrations.find((r) => r.playerId === playerId);
          if (!r || !REGISTRATION_STATUSES.includes(status))
            throw new Error('신청 정보를 확인해 주세요.');
          r.status = status;
        }),
    },
  };
}
export type Services = ReturnType<typeof createServices>;
