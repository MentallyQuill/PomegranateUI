import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
});

test('POM-PANEL-07856BFE9A POM-PANEL-DF4EC7C581 activates a Panel without changing story identity', async ({ page }) => {
  await expect(page.getByTestId('story-id')).toHaveText('story-lab-1');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('story-id')).toHaveText('story-lab-1');
});

test('POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {
  const leftDock = page.getByTestId('pomegranate-dock-left');
  await expect(leftDock.getByRole('article')).toHaveCount(1);
  await page.getByRole('group', { name: 'System Status actions' }).getByRole('button', { name: 'Dock left' }).click();
  await expect(leftDock.getByRole('article')).toHaveCount(2);
  await expect(leftDock.getByRole('article').nth(0)).toHaveAttribute('aria-label', 'Story Summary');
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'System Status');
});

test('POM-PERSIST-842D422EB3 POM-PERSIST-9FA69F9FC1 restores a user Panel template and order', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Panel name' }).fill('My Chronicle');
  await page.getByRole('textbox', { name: 'Panel template' }).fill('split-view');
  await page.getByRole('spinbutton', { name: 'Panel columns' }).fill('3');
  await page.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('active-panel-meta')).toHaveText('split-view · 3 columns · order 2');

  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();

  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('active-panel-meta')).toHaveText('split-view · 3 columns · order 2');
});

test('POM-PERSIST-28DFDC9A8F POM-PERSIST-D50D69D3C4 restores reordered Panels', async ({ page }) => {
  await page.getByRole('button', { name: 'Move Library left' }).click();
  await expect(page.getByRole('tab')).toHaveText(['Library', 'Scene']);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab')).toHaveText(['Library', 'Scene']);
});
