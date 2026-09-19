import { test, expect } from '@playwright/test';
import { createSeed } from '../tests/fixtures';
test('fresh visit requires nickname, registration auto-fills rating and remembers profile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/matches');
  await expect(page.getByLabel('롤 닉네임', { exact: true })).toBeVisible();
  await page.getByLabel('롤 닉네임', { exact: true }).fill('나의소환사#KR9');
  await page.getByRole('button', { name: '시작하기', exact: true }).click();
  await expect(page).toHaveURL(/\/players\/register$/);
  await expect(page.getByLabel('Riot ID', { exact: true })).toHaveValue('나의소환사');
  await expect(page.getByLabel('Riot Tag', { exact: true })).toHaveValue('KR9');
  await expect(page.getByLabel('내부 레이팅', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('운영자 보정', { exact: true })).toHaveCount(0);
  await page.getByLabel('Riot Tier').selectOption('DIAMOND 4');
  await expect(page.locator('.derived-value strong')).toHaveText('2000');
  await page.getByRole('button', { name: '선수 등록', exact: true }).click();
  await expect(page.getByRole('heading', { name: '나의소환사', exact: true })).toBeVisible();
  await expect(page.locator('.my-profile-link')).toHaveText('나의소환사');
  await page.reload();
  await expect(page.locator('.my-profile-link')).toHaveText('나의소환사');
  await page.getByRole('button', { name: '프로필 전환' }).click();
  await page.getByLabel('롤 닉네임', { exact: true }).fill('나의소환사');
  await page.getByRole('button', { name: '시작하기', exact: true }).click();
  await expect(page.getByRole('heading', { name: '나의소환사', exact: true })).toBeVisible();
  await page.goto('/matches');
  await expect(page.getByText('해당하는 경기가 없습니다. 새 내전을 만들어보세요.')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});
test('legacy browser data is cleaned while an existing real profile still matches', async ({
  page,
}) => {
  const data = createSeed();
  data.players.push({
    ...data.players[0],
    id: 'real-player',
    displayName: '실제유저',
    riotId: 'Real User',
    riotTag: 'KR7',
  });
  await page.addInitScript((db) => {
    if (!localStorage.getItem('rift-house:development:v1'))
      localStorage.setItem('rift-house:development:v1', JSON.stringify(db));
  }, data);
  await page.goto('/');
  await page.getByLabel('롤 닉네임', { exact: true }).fill('real user#kr7');
  await page.getByRole('button', { name: '시작하기', exact: true }).click();
  await expect(page).toHaveURL(/players\/real-player$/);
  await expect(page.locator('.my-profile-link')).toHaveText('Real User');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('rift-house:development:v1')!),
  );
  expect(saved.players).toHaveLength(1);
  expect(saved.matches).toHaveLength(0);
  expect(saved.events).toHaveLength(0);
});
