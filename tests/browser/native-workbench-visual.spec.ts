import { expect, test, type Page } from '@playwright/test';

async function fresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

const shot = (page: Page, name: string) => expect(page).toHaveScreenshot(name, {
  animations: 'disabled',
  caret: 'hide',
  fullPage: false
});

test('native workbench stable mockup surfaces', async ({ page }) => {
  await fresh(page, 1440, 900);
  await shot(page, 'wide-scene.png');

  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  await shot(page, 'wide-catalog-drawer.png');
  const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
  await catalog.getByRole('button', { name: 'Expanded' }).click();
  await shot(page, 'wide-catalog-expanded.png');
  await catalog.getByRole('button', { name: 'Close Catalog' }).click();

  await page.getByRole('button', { name: 'Focus reading' }).click();
  await shot(page, 'focus-transcript.png');

  await fresh(page, 390, 844);
  await shot(page, 'compact-scene.png');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await shot(page, 'compact-settings.png');

  await fresh(page, 1440, 900);
  await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Float' }).click();
  await shot(page, 'floating-widget.png');
  await page.getByRole('tab', { name: 'Library' }).click();
  await shot(page, 'renderer-error.png');
});
