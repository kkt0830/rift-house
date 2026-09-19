import { Database } from '../domain/types';
import { MAX_RATING, MIN_RATING } from '../domain/rating';
export const CLEAN_START_MIGRATION = 'v0.1.1-remove-demo';
export function emptyDatabase(): Database {
  return {
    version: 1,
    players: [],
    matches: [],
    events: [],
    ratingEvents: [],
    migrations: [CLEAN_START_MIGRATION],
  };
}
// Remove only IDs reserved by v0.1 demo data, preserving user-created UUID records.
export function migrateDatabase(input: Database): Database {
  if (input.migrations?.includes(CLEAN_START_MIGRATION)) return input;
  const db = structuredClone(input);
  const demoIds = new Set(Array.from({ length: 20 }, (_, i) => `player-${i + 1}`));
  db.players = db.players
    .filter((p) => !demoIds.has(p.id))
    .map((p) => {
      const internalRating = Math.min(MAX_RATING, Math.max(MIN_RATING, p.internalRating));
      const total = Math.min(MAX_RATING, Math.max(MIN_RATING, internalRating + p.adminAdjustment));
      return { ...p, internalRating, adminAdjustment: total - internalRating };
    });
  db.matches = db.matches.filter(
    (m) => !['friday-night', 'weekend-warmup', 'september-friendly'].includes(m.id),
  );
  for (const m of db.matches) {
    const changed = m.participantIds.some((id) => demoIds.has(id));
    m.participantIds = m.participantIds.filter((id) => !demoIds.has(id));
    m.teams = m.teams.filter((t) => !demoIds.has(t.playerId));
    if (changed && ['DRAFT', 'READY'].includes(m.status)) {
      m.status = 'DRAFT';
      m.teams = [];
    }
    for (const g of m.series.games) {
      g.roster = g.roster.filter((t) => !demoIds.has(t.playerId));
      g.picks = g.picks.filter((p) => !demoIds.has(p.playerId));
    }
  }
  db.events = db.events.filter((e) => e.id !== 'autumn-community');
  for (const e of db.events) {
    e.registrations = e.registrations.filter((r) => !demoIds.has(r.playerId));
    e.matchIds = e.matchIds.filter((id) => db.matches.some((m) => m.id === id));
  }
  db.ratingEvents = db.ratingEvents.filter((r) => !demoIds.has(r.playerId));
  db.migrations = [...(db.migrations ?? []), CLEAN_START_MIGRATION];
  return db;
}
