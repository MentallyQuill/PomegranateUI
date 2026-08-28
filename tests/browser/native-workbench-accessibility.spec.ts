import { expect, test, type Page } from '@playwright/test';

async function openFresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

test('native workbench keeps literal relationships and keyboard reorder behavior', async ({ page }) => {
  await openFresh(page, 1440, 900);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  const scene = page.getByRole('tab', { name: 'Scene' });
  const scenePanelId = await scene.getAttribute('aria-controls');
  const sceneTabId = await scene.getAttribute('id');
  expect(scenePanelId).toBeTruthy();
  expect(sceneTabId).toBeTruthy();
  await expect(page.locator(`#${scenePanelId}`)).toHaveAttribute('aria-labelledby', sceneTabId!);
  await expect(scene.locator('xpath=..')).toHaveAttribute('data-pomegranate-panel-tab', 'scene');
  await page.getByRole('tab', { name: 'Library' }).press('ArrowLeft');
  await expect(tabs).toHaveText(['Library', 'Scene', 'Settings']);
  await expect(page.getByLabel('Active story identity')).toContainText('story-lab-reservoir');
});

test('native workbench Catalog supports keyboard placement and stable attributes', async ({ page }) => {
  await openFresh(page, 1024, 768);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
  await expect(catalog.getByRole('listitem')).toHaveCount(94);
  await catalog.getByRole('button', { name: 'Compact' }).click();
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  const add = catalog.getByRole('button', { name: 'Add Accessibility', exact: true });
  await add.focus();
  await add.press('Enter');
  await expect(page.getByRole('article', { name: 'Accessibility' })).toHaveAttribute('data-pomegranate-placement', 'docked');
  await expect(page.getByRole('status', { name: 'Accessibility renderer unavailable' })).toBeVisible();
});

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'medium', width: 1024, height: 768 },
  { name: 'compact', width: 390, height: 844 }
]) {
  test(`native workbench ${viewport.name} surface has no horizontal overflow`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('article', { name: 'Transcript' })).toBeVisible();
  });
}

test('native workbench exposes coarse-pointer targets separately from compact icons', async ({ page }) => {
  await openFresh(page, 390, 844);
  const style = await page.locator('body').evaluate(() => {
    const sheet = [...document.styleSheets].find((entry) => [...entry.cssRules].some((rule) => rule.cssText.includes('pointer: coarse')));
    return sheet ? [...sheet.cssRules].map((rule) => rule.cssText).join('\n') : '';
  });
  expect(style).toContain('min-height: 44px');
  expect(style).toContain('width: 44px');
});

test('Panel creation uses the browser modal top layer and restores focus', async ({ page }) => {
  await openFresh(page, 1024, 768);
  const launcher = page.getByRole('button', { name: 'Create Panel' });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
});
