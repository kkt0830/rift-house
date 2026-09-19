import { Tier } from './types';

export const MAX_RATING = 3000;
export const MIN_RATING = 0;
export const TIER_RATINGS: Record<Tier, number> = {
  IRON: 500,
  BRONZE: 750,
  SILVER: 1000,
  GOLD: 1250,
  PLATINUM: 1500,
  EMERALD: 1750,
  DIAMOND: 2000,
  MASTER: 2400,
  GRANDMASTER: 2700,
  CHALLENGER: 3000,
};
export function validateRating(internal: number, adjustment: number) {
  if (
    !Number.isInteger(internal) ||
    !Number.isInteger(adjustment) ||
    internal < MIN_RATING ||
    internal > MAX_RATING ||
    internal + adjustment < MIN_RATING ||
    internal + adjustment > MAX_RATING
  ) {
    throw new Error(`내부 및 최종 레이팅은 ${MIN_RATING}~${MAX_RATING}점 사이의 정수여야 합니다.`);
  }
}
