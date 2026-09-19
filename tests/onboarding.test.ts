import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServices } from '../src/services/platform';
import { MemoryRepository } from '../src/data/repository';
import { migrateDatabase, emptyDatabase } from '../src/data/migrations';
import { TIER_RATINGS, MAX_RATING } from '../src/domain/rating';
import { createSeed } from './fixtures';
const input = {
  displayName: '새 선수',
  riotId: 'My Player',
  riotTag: 'KR1',
  tier: 'GOLD' as const,
  mainPosition: 'MID' as const,
  subPosition: 'TOP' as const,
};
test('fresh database contains no demonstration records', async () => {
  assert.deepEqual((await createServices(new MemoryRepository()).snapshot()).players, []);
  assert.equal(emptyDatabase().matches.length, 0);
});
test('self registration derives all tier ratings and ignores injected rating fields', async () => {
  for (const [tier, rating] of Object.entries(TIER_RATINGS)) {
    const s = createServices(new MemoryRepository());
    const p = await s.players.registerSelf({
      ...input,
      tier: tier as typeof input.tier,
      internalRating: 99999,
      adminAdjustment: 99999,
    } as typeof input);
    assert.equal(p.internalRating, rating);
    assert.equal(p.adminAdjustment, 0);
    assert.ok(rating <= MAX_RATING);
  }
});
test('rating cap applies to both internal and effective values', async () => {
  const s = createServices(new MemoryRepository());
  const p = await s.players.registerSelf(input);
  await assert.rejects(() => s.players.update(p.id, { internalRating: 3001 }), /3000/);
  await assert.rejects(
    () => s.players.update(p.id, { internalRating: 2900, adminAdjustment: 101 }),
    /3000/,
  );
  await s.players.update(p.id, { internalRating: 2900, adminAdjustment: 100 });
  assert.equal((await s.players.getById(p.id))!.adminAdjustment, 100);
});
test('self profile edits preserve ratings and administrative adjustment', async () => {
  const s = createServices(new MemoryRepository());
  const p = await s.players.registerSelf(input);
  await s.players.update(p.id, { adminAdjustment: 50 });
  const edited = await s.players.updateSelf(p.id, { ...input, tier: 'CHALLENGER' });
  assert.equal(edited.internalRating, 1250);
  assert.equal(edited.adminAdjustment, 50);
});
test('nickname lookup handles casing, tags, missing names and ambiguity', async () => {
  const s = createServices(new MemoryRepository());
  const a = await s.players.registerSelf(input);
  assert.equal((await s.players.findByNickname(' my player '))!.id, a.id);
  assert.equal(await s.players.findByNickname('missing'), null);
  await s.players.registerSelf({ ...input, riotTag: 'KR2' });
  await assert.rejects(() => s.players.findByNickname('My Player'), /여러 명/);
  assert.equal((await s.players.findByNickname('MY PLAYER#kr1'))!.id, a.id);
  await assert.rejects(() => s.players.findByNickname('My Player#'), /형식/);
});
test('one-time cleanup removes demo records, retains custom records and fixes their references', () => {
  const db = createSeed();
  db.players.push({
    ...db.players[0],
    id: 'custom-player',
    internalRating: 9000,
    adminAdjustment: 100,
  });
  db.matches.push({
    ...structuredClone(db.matches[0]),
    id: 'custom-match',
    participantIds: ['player-1', 'custom-player'],
  });
  const result = migrateDatabase(db);
  assert.deepEqual(
    result.players.map((p) => p.id),
    ['custom-player'],
  );
  assert.equal(result.players[0].internalRating + result.players[0].adminAdjustment, 3000);
  assert.deepEqual(
    result.matches.map((m) => m.id),
    ['custom-match'],
  );
  assert.deepEqual(result.matches[0].participantIds, ['custom-player']);
  assert.equal(result.matches[0].status, 'DRAFT');
  assert.equal(result.events.length, 0);
  assert.equal(migrateDatabase(result), result);
  assert.equal(db.players.length, 21);
});
