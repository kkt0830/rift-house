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
  tier: 'GOLD 4' as const,
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
test('bulk import is atomic and applies tier ratings', async () => {
  const s = createServices(new MemoryRepository());
  const players = await s.players.importMany([
    input,
    { ...input, displayName: '두 번째', riotId: 'Second', tier: 'DIAMOND 4' },
  ]);
  assert.equal(players.length, 2);
  assert.equal(players[1].internalRating, TIER_RATINGS['DIAMOND 4']);
  await assert.rejects(
    () => s.players.importMany([{ ...input, displayName: '중복', riotId: 'second', tier: 'IRON 4' }]),
    /이미 등록/,
  );
  assert.equal((await s.players.list()).length, 2);
});
test('admins can create events with validated capacity and schedule', async () => {
  const s = createServices(new MemoryRepository());
  const event = await s.events.create({
    name: '주말 내전',
    description: '함께하는 내전',
    scheduledAt: '2026-10-10T19:00:00+09:00',
    capacity: 20,
  });
  assert.equal(event.name, '주말 내전');
  assert.equal((await s.snapshot()).events.length, 1);
  await assert.rejects(
    () => s.events.create({ ...event, scheduledAt: 'invalid', capacity: 0 }),
    /이벤트 이름, 일정, 정원/,
  );
});
test('player deletion cleans references even when a match has started', async () => {
  const s = createServices(new MemoryRepository());
  const player = await s.players.registerSelf(input);
  const match = await s.matches.create({
    name: '삭제 확인', scheduledAt: '2026-10-10T19:00:00+09:00', format: 1,
    fearless: false, participantIds: [player.id],
  });
  const event = await s.events.create({
    name: '참가 이벤트', description: '', scheduledAt: '2026-10-11T19:00:00+09:00', capacity: 10,
  });
  await s.events.register(event.id, player.id);
  await s.players.delete(player.id);
  const db = await s.snapshot();
  assert.equal(db.players.length, 0);
  assert.deepEqual(db.matches.find((item) => item.id === match.id)?.participantIds, []);
  assert.deepEqual(db.events[0].registrations, []);

  const protectedPlayer = await s.players.registerSelf({ ...input, riotId: 'Recorded' });
  const protectedMatch = await s.matches.create({
    name: '기록 경기', scheduledAt: '2026-10-12T19:00:00+09:00', format: 1,
    fearless: false, participantIds: [protectedPlayer.id],
  });
  const state = await s.snapshot();
  state.matches.find((item) => item.id === protectedMatch.id)!.status = 'IN_PROGRESS';
  const protectedServices = createServices(new MemoryRepository(state));
  await protectedServices.players.delete(protectedPlayer.id);
  const cleaned = await protectedServices.snapshot();
  assert.equal(cleaned.players.some((item) => item.id === protectedPlayer.id), false);
  assert.equal(cleaned.matches.find((item) => item.id === protectedMatch.id)?.status, 'CANCELLED');
});
test('admins can finish and delete matches while cleaning linked records', async () => {
  const state = emptyDatabase();
  state.matches.push({
    id: 'manual-finish', name: '수동 종료', scheduledAt: '2026-10-12T19:00:00+09:00',
    status: 'IN_PROGRESS', participantIds: [], teams: [], hostIds: [],
    series: {
      id: 'series-manual', format: 3, fearless: false,
      games: [{ id: 'game-1', number: 1, winner: 'BLUE', picks: [], roster: [], completedAt: '2026-10-12T20:00:00+09:00' }],
    },
  });
  state.events.push({
    id: 'linked-event', name: '연결 이벤트', description: '', scheduledAt: '2026-10-12T19:00:00+09:00',
    capacity: 10, matchIds: ['manual-finish'], registrations: [],
  });
  const s = createServices(new MemoryRepository(state));
  await s.matches.complete('manual-finish');
  assert.equal((await s.matches.getById('manual-finish'))?.status, 'COMPLETED');
  await s.matches.delete('manual-finish');
  const deleted = await s.snapshot();
  assert.equal(deleted.matches.length, 0);
  assert.deepEqual(deleted.events[0].matchIds, []);
});
test('migration repairs a match whose series has a winner but status is still in progress', () => {
  const state = emptyDatabase();
  state.matches.push({
    id: 'stale-finish', name: '자동 보정', scheduledAt: '2026-10-12T19:00:00+09:00',
    status: 'IN_PROGRESS', participantIds: [], teams: [], hostIds: [],
    series: {
      id: 'series-stale', format: 1, fearless: false,
      games: [{ id: 'game-stale', number: 1, winner: 'RED', picks: [], roster: [], completedAt: '2026-10-12T20:00:00+09:00' }],
    },
  });
  assert.equal(migrateDatabase(state).matches[0].status, 'COMPLETED');
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
