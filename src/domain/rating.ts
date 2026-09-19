import { Tier } from './types';

export const MAX_RATING = 3000;
export const MIN_RATING = 0;
export const TIER_RATINGS: Record<Tier, number> = {
  'IRON 4': 500, 'IRON 3': 560, 'IRON 2': 620, 'IRON 1': 680,
  'BRONZE 4': 750, 'BRONZE 3': 810, 'BRONZE 2': 870, 'BRONZE 1': 930,
  'SILVER 4': 1000, 'SILVER 3': 1060, 'SILVER 2': 1120, 'SILVER 1': 1180,
  'GOLD 4': 1250, 'GOLD 3': 1310, 'GOLD 2': 1370, 'GOLD 1': 1430,
  'PLATINUM 4': 1500, 'PLATINUM 3': 1560, 'PLATINUM 2': 1620, 'PLATINUM 1': 1680,
  'EMERALD 4': 1750, 'EMERALD 3': 1810, 'EMERALD 2': 1870, 'EMERALD 1': 1930,
  'DIAMOND 4': 2000, 'DIAMOND 3': 2100, 'DIAMOND 2': 2200, 'DIAMOND 1': 2300,
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
