import { expect, test, type Page } from '@playwright/test';

test.skip(process.platform !== 'win32', 'Visual baselines are reviewed on Windows; functional browser coverage remains cross-platform.');

async function fresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

type ThemeLabel = 'Deep Current' | 'PomOS' | 'Bunny';

async function selectTheme(page: Page, label: ThemeLabel) {
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: label, exact: true }).click();
  const themeId = label === 'Deep Current' ? 'deep-current' : label === 'PomOS' ? 'pom-neutral' : 'bunny';
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', themeId);
  await page.getByRole('tab', { name: 'Scene' }).click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function setMaterialControls(page: Page, values: readonly [number, number, number, number]) {
  const themeLibrary = page.getByRole('article', { name: 'Theme Library' });
  await themeLibrary.getByText('Material controls', { exact: true }).click();
  for (const [label, value] of [
    ['Glass density', values[0]],
    ['Bar opacity', values[1]],
    ['Selected strength', values[2]],
    ['Frost level', values[3]]
  ] as const) {
    const control = themeLibrary.getByRole('slider', { name: label });
    await control.fill(String(value));
    await expect(control).toHaveValue(String(value));
  }
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

const shot = (page: Page, name: string) => expect(page).toHaveScreenshot(name, {
  animations: 'disabled',
  caret: 'hide',
  fullPage: false
});

test('native workbench stable mockup surfaces', async ({ page }) => {
  await fresh(page, 1440, 900);
  await shot(page, 'wide-scene.png');

  const materialControls = page.getByRole('article', { name: 'Theme Library' }).getByText('Material controls', { exact: true });
  await materialControls.click();
  await shot(page, 'wide-material-controls.png');
  await materialControls.click();

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

test('native workbench exposes the two original visual flexibility targets', async ({ page }) => {
  for (const theme of [
    { label: 'PomOS' as const, name: 'pom-neutral' },
    { label: 'Bunny' as const, name: 'bunny' }
  ]) {
    await fresh(page, 1440, 900);
    await selectTheme(page, theme.label);
    await shot(page, `wide-${theme.name}.png`);

    await fresh(page, 390, 844);
    await selectTheme(page, theme.label);
    await shot(page, `compact-${theme.name}.png`);
  }
});

test('material stress states stay coherent at wide and compact viewports', async ({ page }) => {
  for (const state of [
    { label: 'Deep Current' as const, name: 'zero-deep-current', values: [0, 0, 0, 0] as const },
    { label: 'PomOS' as const, name: 'adjusted-pom-neutral', values: [68, 54, 20, 42] as const },
    { label: 'Bunny' as const, name: 'full-bunny', values: [100, 100, 100, 100] as const }
  ]) {
    await fresh(page, 1440, 900);
    await selectTheme(page, state.label);
    await setMaterialControls(page, state.values);
    await shot(page, `wide-material-${state.name}.png`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      window.scrollTo(0, 0);
    });
    await shot(page, `compact-material-${state.name}.png`);
  }
});
