import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function finishOnboarding(page) {
  await page.goto('/');
  await expect(page.locator('.loading-screen')).toBeHidden({ timeout: 10_000 });
  await page.getByRole('button', { name: '跳过引导' }).click();
  await page.locator('#player-name').fill('测试探索者');
  await page.locator('[data-skin="mint"]').click();
  await page.getByRole('button', { name: '开启旅程' }).click();
  await expect(page.locator('#home-canvas')).toBeVisible();
}

test('HOME hotspot opens Kitchen study mode and restores the real scene', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await finishOnboarding(page);
  await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.moveHomeTo('kitchen'));
  await expect(page.locator('#interaction-prompt')).toContainText('Kitchen');
  await page.keyboard.press('Space');
  await expect(page.locator('.mode-modal')).toContainText('Kitchen');
  await page.keyboard.press('r');
  await expect(page.locator('#scene-root')).toBeVisible();
  await expect(page.locator('#breadcrumb')).toContainText('学习模式');
  expect(await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.world.scenes.find((scene) => scene.id === 'kitchen').areas.length)).toBe(7);
  expect(errors).toEqual([]);
});

test('practice hides the answer, preserves typed WASD/F/R/E/Q, and allows wrong-to-study R', async ({ page }) => {
  await finishOnboarding(page);
  await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.moveHomeTo('kitchen'));
  await page.keyboard.press('Space');
  await page.keyboard.press('f');
  const word = await page.evaluate(() => {
    const scene = window.__HOME_ATLAS_DEBUG__.world.scenes.find((item) => item.id === 'kitchen');
    window.__HOME_ATLAS_DEBUG__.moveSceneToFirstWord();
    return scene.areas[0].words[0].word;
  });
  await expect(page.locator('.practice-card')).toBeVisible();
  await expect(page.locator('.memory-panel')).not.toContainText(word);
  const position = await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.player);
  await page.keyboard.press('f');
  await page.keyboard.type('frewareq');
  await expect(page.locator('#practice-input')).toHaveValue('frewareq');
  expect(await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.player)).toEqual(position);
  await page.keyboard.press('Enter');
  await expect(page.locator('.practice-status')).toContainText('再试一次');
  await page.keyboard.press('r');
  await expect(page.locator('#breadcrumb')).toContainText('学习模式');
  await expect(page.locator('.study-card')).toContainText(word);
});

test('responsive layout remains usable at 1024px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await finishOnboarding(page);
  await expect(page.locator('.memory-panel')).toBeVisible();
  await expect(page.locator('#home-canvas')).toBeVisible();
  const box = await page.locator('.memory-panel').boundingBox();
  expect(box.width).toBeGreaterThan(400);
  expect(box.height).toBeGreaterThan(180);
});

test('study card loads live Youdao data and Q/E request US/UK audio separately', async ({ page }) => {
  await finishOnboarding(page);
  await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.moveHomeTo('kitchen'));
  await page.keyboard.press('Space');
  await page.keyboard.press('r');
  await page.evaluate(() => window.__HOME_ATLAS_DEBUG__.moveSceneToFirstWord());
  await expect(page.locator('.study-card')).toContainText('数据来源：有道词典在线查询', { timeout: 20_000 });
  await expect(page.locator('.dictionary-loading')).toHaveCount(0);
  await expect(page.locator('[data-accent="us"]')).toBeEnabled();
  await expect(page.locator('[data-accent="uk"]')).toBeEnabled();

  const usResponse = page.waitForResponse((response) => response.url().includes('/api/youdao/voice') && response.url().includes('accent=us'));
  await page.keyboard.press('q');
  expect((await usResponse).status()).toBe(200);

  const ukResponse = page.waitForResponse((response) => response.url().includes('/api/youdao/voice') && response.url().includes('accent=uk'));
  await page.keyboard.press('e');
  expect((await ukResponse).status()).toBe(200);
});
