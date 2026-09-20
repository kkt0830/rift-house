export const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;
export type Position = (typeof POSITIONS)[number];
export const TIERS = [
  'IRON 4', 'IRON 3', 'IRON 2', 'IRON 1',
  'BRONZE 4', 'BRONZE 3', 'BRONZE 2', 'BRONZE 1',
  'SILVER 4', 'SILVER 3', 'SILVER 2', 'SILVER 1',
  'GOLD 4', 'GOLD 3', 'GOLD 2', 'GOLD 1',
  'PLATINUM 4', 'PLATINUM 3', 'PLATINUM 2', 'PLATINUM 1',
  'EMERALD 4', 'EMERALD 3', 'EMERALD 2', 'EMERALD 1',
  'DIAMOND 4', 'DIAMOND 3', 'DIAMOND 2', 'DIAMOND 1',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
] as const;
export const TIER_GROUPS = [
  'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD',
  'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER',
] as const;
export type Tier = (typeof TIERS)[number];
export type Side = 'BLUE' | 'RED';
export type Format = 1 | 3 | 5;
export type MatchStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface Player {
  id: string;
  displayName: string;
  riotId: string;
  riotTag: string;
  tier: Tier;
  mainPosition: Position;
  subPosition: Position;
  internalRating: number;
  adminAdjustment: number;
  positionRatings?: Partial<Record<Position, number>>;
}
export type CreatePlayerInput = Omit<Player, 'id'>;
export type UpdatePlayerInput = Partial<CreatePlayerInput>;
export interface TeamSlot {
  playerId: string;
  position: Position;
  side: Side;
}
export interface ChampionPick {
  playerId: string;
  champion: string;
}
export interface Game {
  id: string;
  number: number;
  winner: Side;
  picks: ChampionPick[];
  roster: TeamSlot[];
  completedAt: string;
}
export interface Series {
  id: string;
  format: Format;
  fearless: boolean;
  games: Game[];
}
export interface Match {
  id: string;
  name: string;
  scheduledAt: string;
  status: MatchStatus;
  participantIds: string[];
  teams: TeamSlot[];
  series: Series;
  hostIds: string[];
}
export interface CreateMatchInput {
  name: string;
  scheduledAt: string;
  format: Format;
  fearless: boolean;
  participantIds: string[];
}
export const REGISTRATION_STATUSES = [
  'APPLIED',
  'CONFIRMED',
  'WAITLIST',
  'CANCELLED',
  'LATE_CANCEL',
  'PRESENT',
  'LATE',
  'NO_SHOW',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  scheduledAt: string;
  capacity: number;
  matchIds: string[];
  registrations: { playerId: string; status: RegistrationStatus }[];
}
export type CreateEventInput = Pick<
  CommunityEvent,
  'name' | 'description' | 'scheduledAt' | 'capacity'
>;
export interface RatingEvent {
  id: string;
  playerId: string;
  matchId?: string;
  before: number;
  delta: number;
  reason: string;
  createdAt: string;
}
// HOST is scoped to a match, never a global administrator role.
export type GlobalRole = 'GUEST' | 'ADMIN' | 'OWNER';
export interface MatchMembership {
  matchId: string;
  identityId: string;
  role: 'HOST' | 'CO_HOST';
}
export interface Database {
  version: 1;
  migrations?: string[];
  players: Player[];
  matches: Match[];
  events: CommunityEvent[];
  ratingEvents: RatingEvent[];
}
