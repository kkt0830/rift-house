import { test, expect } from '@playwright/test';
import { createSeed } from '../tests/fixtures';
import { CLEAN_START_MIGRATION } from '../src/data/migrations';
test.beforeEach(async ({ page }) => {
  const fixture = createSeed();
  fixture.migrations = [CLEAN_START_MIGRATION];
  await page.addInitScript((data) => {
    if (!localStorage.getItem('rift-house:development:v1'))
      localStorage.setItem('rift-house:development:v1', JSON.stringify(data));
    if (!localStorage.getItem('rift-house:profile:v1'))
      localStorage.setItem('rift-house:profile:v1', 'player-1');
  }, fixture);
});
test('player create/edit, match participants, balance, swap, BO3 results, persistence', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/players');
  await page.getByRole('button', { name: '선수 등록', exact: true }).click();
  await page.getByLabel('선수 이름', { exact: true }).fill('테스트선수');
  await page.getByLabel('Riot ID', { exact: true }).fill('Test Player');
  await page.getByRole('dialog').getByRole('button', { name: '선수 등록', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('선수 검색').fill('테스트선수');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await page.getByLabel('선수 이름', { exact: true }).fill('테스트선수수정');
  await page.getByRole('button', { name: '변경사항 저장' }).click();
  await expect(page.getByRole('link', { name: '테스트선수수정', exact: true })).toBeVisible();
  await page.goto('/matches/create');
  await page.getByLabel('경기 이름').fill('E2E 내전');
  await page.getByLabel('경기 일시').fill('2026-10-01T20:00');
  await page.getByRole('button', { name: '내전 만들기', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'E2E 내전', exact: true })).toBeVisible();
  const matchUrl = page.url();
  await page.getByRole('button', { name: '선수 추가' }).click();
  for (let i = 0; i < 10; i++)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '추가', exact: true })
      .first()
      .click();
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: '균형 편성' }).click();
  await page.getByRole('button', { name: /OPTION A/ }).click();
  await expect(page.getByRole('heading', { name: 'BLUE TEAM' })).toBeVisible();
  await page.getByLabel('교환할 첫 번째 선수').selectOption({ index: 1 });
  await page.getByLabel('교환할 두 번째 선수').selectOption({ index: 5 });
  await page.getByRole('button', { name: '선수 교환', exact: true }).click();
  await page.getByRole('button', { name: '경기 시작', exact: true }).click();
  for (const side of ['BLUE', 'RED', 'BLUE']) {
    await page.getByRole('button', { name: `${side} 승리`, exact: true }).click();
    await page.getByRole('button', { name: '결과 확정', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await expect(page.getByText('BLUE TEAM이 시리즈에서 승리했습니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'BLUE 승리', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('BLUE TEAM이 시리즈에서 승리했습니다.')).toBeVisible();
  await page.goto('/matches');
  await expect(page.getByRole('link').filter({ hasText: 'E2E 내전' })).toContainText('2 : 1');
  await page.goto(matchUrl);
  await page.getByText('GAME 1', { exact: true }).click();
  await expect(page.locator('.history-roster').first()).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [360, 390, 430, 768, 1024, 1440])
  test(`responsive layout ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/',
      '/players',
      '/players/player-1',
      '/matches',
      '/matches/create',
      '/matches/friday-night',
      '/events',
      '/events/autumn-community',
      '/rankings',
      '/admin',
      '/owner',
    ]) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        route,
      ).toBeTruthy();
    }
    await page.goto('/players');
    await page.getByRole('button', { name: '선수 등록', exact: true }).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: '닫기', exact: true }).click();
  });
test('mobile touch flow allows creation, team swaps and BO1 results', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/players');
  await page.getByRole('button', { name: '선수 등록', exact: true }).click();
  await page.getByLabel('선수 이름', { exact: true }).fill('모바일선수');
  await page.getByLabel('Riot ID', { exact: true }).fill('Mobile Player');
  await page.getByRole('dialog').getByRole('button', { name: '선수 등록', exact: true }).click();
  await page.getByLabel('선수 검색').fill('모바일선수');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await page.getByLabel('선수 이름', { exact: true }).fill('모바일수정완료');
  await page.getByRole('button', { name: '변경사항 저장' }).click();
  await page.getByLabel('선수 검색').fill('모바일수정완료');
  await expect(page.getByRole('link', { name: '모바일수정완료', exact: true })).toBeVisible();
  await page.goto('/matches/create');
  await page.getByLabel('경기 이름').fill('모바일 단판');
  await page.getByLabel('경기 일시').fill('2026-10-01T20:00');
  await page.getByLabel('경기 형식').selectOption('1');
  for (let i = 0; i < 10; i++)
    await page
      .getByRole('checkbox')
      .nth(i + 1)
      .check();
  await page.getByRole('button', { name: '내전 만들기', exact: true }).click();
  await page.getByRole('button', { name: '랜덤 편성' }).click();
  await page.getByLabel('교환할 첫 번째 선수').selectOption({ index: 1 });
  await page.getByLabel('교환할 두 번째 선수').selectOption({ index: 5 });
  await page.getByRole('button', { name: '선수 교환', exact: true }).click();
  await page.getByRole('button', { name: '경기 시작', exact: true }).click();
  await page.getByRole('button', { name: 'RED 승리', exact: true }).click();
  await page.getByRole('button', { name: '결과 확정', exact: true }).click();
  await expect(page.getByText('RED TEAM이 시리즈에서 승리했습니다.')).toBeVisible();
});

test('BO5 plays five games, saves champion history and ends at three wins', async ({ page }) => {
  await page.goto('/matches/create');
  await page.getByLabel('경기 이름').fill('풀세트 테스트');
  await page.getByLabel('경기 일시').fill('2026-10-01T20:00');
  await page.getByLabel('경기 형식').selectOption('5');
  await page.getByRole('checkbox').first().check();
  for (let i = 0; i < 10; i++)
    await page
      .getByRole('checkbox')
      .nth(i + 1)
      .check();
  await page.getByRole('button', { name: '내전 만들기', exact: true }).click();
  await page.getByRole('button', { name: '랜덤 편성' }).click();
  await page.getByRole('button', { name: '경기 시작', exact: true }).click();
  await page.getByText('챔피언 기록 (선택)', { exact: true }).click();
  await page.getByPlaceholder('챔피언 이름').first().fill('아리');
  for (const side of ['BLUE', 'RED', 'BLUE', 'RED', 'BLUE']) {
    await page.getByRole('button', { name: `${side} 승리`, exact: true }).click();
    await page.getByRole('button', { name: '결과 확정', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await expect(page.getByText('BLUE TEAM이 시리즈에서 승리했습니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'BLUE 승리', exact: true })).toHaveCount(0);
  await expect(page.locator('.game-history details')).toHaveCount(5);
  await page.getByText('GAME 1', { exact: true }).click();
  await expect(page.getByText('아리', { exact: true })).toBeVisible();
});
