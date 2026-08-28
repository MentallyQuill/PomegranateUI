import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

test('native workbench POM-PANEL-07856BFE9A POM-PANEL-DF4EC7C581 activates a Panel without changing story identity', async ({ page }) => {
  const story = page.getByLabel('Active story identity');
  await expect(story).toContainText('story-lab-reservoir');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await expect(story).toContainText('story-lab-reservoir');
  await expect(page.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Library renderer unavailable' })).toBeVisible();
});

test('native workbench POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {
  const leftDock = page.locator('[data-pomegranate-dock="left"]');
  await expect(leftDock.getByRole('article')).toHaveCount(1);
  const world = page.getByRole('article', { name: 'World State' });
  await world.getByRole('button', { name: 'Dock left' }).click();
  await expect(leftDock.getByRole('article')).toHaveCount(2);
  await expect(leftDock.getByRole('article').nth(0)).toHaveAttribute('aria-label', 'Characters (Story)');
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'World State');
});

test('native workbench POM-PERSIST-842D422EB3 POM-PERSIST-9FA69F9FC1 restores a user Panel template and order', async ({ page }) => {
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('My Chronicle');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');

  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');
});

test('native workbench POM-PERSIST-28DFDC9A8F POM-PERSIST-D50D69D3C4 restores reordered Panels', async ({ page }) => {
  await page.getByRole('button', { name: 'Move Settings left' }).click();
  await expect(page.getByRole('tab')).toHaveText(['Scene', 'Settings', 'Library']);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab')).toHaveText(['Scene', 'Settings', 'Library']);
});
