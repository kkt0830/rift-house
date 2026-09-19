import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from './fixtures';
import { MemoryRepository } from '../src/data/repository';
import { createServices } from '../src/services/platform';
import {
  effectiveRating,
  seriesScore,
  seriesWinner,
  validateParticipants,
  validateTeams,
} from '../src/domain/rules';
import { balancedAssignment, randomAssignment } from '../src/lib/balancing';
import { Format } from '../src/domain/types';
const players = createSeed().players.slice(0, 10);
test('effective rating is derived; duplicate participants are rejected', () => {
  assert.equal(
    effectiveRating({ ...players[0], internalRating: 1500, adminAdjustment: -30 }),
    1470,
  );
  assert.throws(() => validateParticipants(['same', 'same']), /이미 참가/);
});
test('random assignment always creates unique 5v5 slots', () => {
  for (let i = 0; i < 50; i++) {
    const teams = randomAssignment(players);
    validateTeams(
      teams,
      players.map((p) => p.id),
    );
    assert.equal(new Set(teams.map((t) => t.playerId)).size, 10);
  }
  assert.throws(() => randomAssignment(players.slice(0, 9)), /10명/);
});
test('balanced assignment is deterministic and has three non-mirrored candidates', () => {
  const options = balancedAssignment(players);
  assert.equal(options.length, 3);
  assert.deepEqual(options, balancedAssignment([...players].reverse()));
  const keys = options.map((o) => {
    validateTeams(
      o.teams,
      players.map((p) => p.id),
    );
    return o.teams
      .filter((t) => t.side === 'BLUE')
      .map((t) => t.playerId)
      .sort()
      .join(',');
  });
  assert.equal(new Set(keys).size, 3);
  assert.ok(options[0].score <= options[1].score);
});
test('balanced assignment respects primary roles when a perfect fit exists', () => {
  const equal = players.map((p) => ({ ...p, internalRating: 1500, adminAdjustment: 0 }));
  assert.equal(balancedAssignment(equal)[0].offRoleCount, 0);
});
for (const format of [1, 3, 5] as Format[])
  test(`BO${format} ends at the required wins and rejects extra games`, async () => {
    const services = createServices(new MemoryRepository(createSeed()));
    const m = await services.matches.create({
      name: '검증 경기',
      scheduledAt: new Date().toISOString(),
      format,
      fearless: false,
      participantIds: players.map((p) => p.id),
    });
    await assert.rejects(() => services.matches.start(m.id), /준비 상태/);
    await services.matches.assignTeams(m.id, balancedAssignment(players)[0].teams);
    await services.matches.start(m.id);
    const target = Math.floor(format / 2) + 1;
    for (let i = 1; i <= target; i++) await services.matches.submitGameResult(m.id, 'BLUE', [], i);
    const ended = await services.matches.getById(m.id);
    assert.equal(ended?.status, 'COMPLETED');
    assert.equal(seriesWinner(ended!.series), 'BLUE');
    assert.deepEqual(seriesScore(ended!.series), { BLUE: target, RED: 0 });
    await assert.rejects(
      () => services.matches.submitGameResult(m.id, 'RED', [], target + 1),
      /종료/,
    );
  });
test('participant edits invalidate assignments; manual swaps preserve all slots', async () => {
  const s = createServices(new MemoryRepository(createSeed()));
  await s.matches.swap('friday-night', players[0].id, players[1].id);
  let m = await s.matches.getById('friday-night');
  validateTeams(m!.teams, m!.participantIds);
  await assert.rejects(() => s.matches.addParticipant(m!.id, players[0].id), /이미 참가/);
  await s.matches.removeParticipant(m!.id, players[0].id);
  m = await s.matches.getById(m!.id);
  assert.equal(m!.status, 'DRAFT');
  assert.equal(m!.teams.length, 0);
});
test('duplicate result submissions cannot record the next game', async () => {
  const s = createServices(new MemoryRepository(createSeed()));
  await s.matches.start('friday-night');
  await s.matches.submitGameResult('friday-night', 'BLUE', [], 1);
  await assert.rejects(() => s.matches.submitGameResult('friday-night', 'RED', [], 1), /이미 처리/);
  await assert.rejects(
    () => s.matches.swap('friday-night', players[0].id, players[1].id),
    /진행 중/,
  );
  const m = await s.matches.getById('friday-night');
  assert.equal(m!.series.games.length, 1);
  assert.equal(m!.series.games[0].roster.length, 10);
});
test('failed transactions do not mutate existing data; rating edits create history', async () => {
  const s = createServices(new MemoryRepository(createSeed()));
  await assert.rejects(() => s.players.update(players[0].id, { internalRating: NaN }), /레이팅/);
  assert.equal((await s.players.getById(players[0].id))!.internalRating, players[0].internalRating);
  await s.players.update(players[0].id, { internalRating: 1600 });
  assert.equal((await s.snapshot()).ratingEvents.length, 1);
  await assert.rejects(() => s.players.create(players[0]), /이미 등록/);
});
test('event registrations reject duplicates and permit attendance updates', async () => {
  const s = createServices(new MemoryRepository(createSeed()));
  await assert.rejects(() => s.events.register('autumn-community', 'player-1'), /이미 신청/);
  await s.events.register('autumn-community', 'player-20');
  await s.events.setStatus('autumn-community', 'player-20', 'PRESENT');
  assert.equal(
    (await s.snapshot()).events[0].registrations.find((r) => r.playerId === 'player-20')!.status,
    'PRESENT',
  );
});
