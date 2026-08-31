import { expect, test, type Page } from '@playwright/test';

test.skip(process.platform !== 'win32', 'Visual baselines are reviewed on Windows; functional browser coverage remains cross-platform.');

const labOrigin = process.env.POM_LAB_ORIGIN ?? 'http://127.0.0.1:4174';

async function fresh(page: Page, width: number, height: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height });
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

type ThemeLabel = 'Deep Current' | 'PomOS' | 'Bunny' | 'Ash & Amber';

async function selectTheme(page: Page, label: ThemeLabel) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: label, exact: true }).click();
  const themeId = label === 'Deep Current' ? 'deep-current'
    : label === 'PomOS' ? 'pom-neutral'
      : label === 'Bunny' ? 'bunny'
        : 'ash-amber';
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', themeId);
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('tab', { name: 'Scene' }).click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function invokeCompactChromeAction(page: Page, name: string) {
  const action = page.getByRole('button', { name });
  await action.focus();
  await expect(action).toBeVisible();
  await action.press('Enter');
}

async function invokeWidgetAction(widget: ReturnType<Page['locator']>, name: string) {
  const trigger = widget.getByRole('button', { name: 'Widget actions' });
  await trigger.focus();
  await trigger.press('Enter');
  await widget.getByRole('menuitem', { name }).press('Enter');
}

async function setMaterialControls(page: Page, values: readonly [number, number, number, number]) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const themeSettings = page.getByRole('article', { name: 'Custom Theme' });
  for (const [label, value] of [
    ['Glass Density', values[0]],
    ['Bar Opacity', values[1]],
    ['Selected Strength', values[2]],
    ['Frost Level', values[3]]
  ] as const) {
    const control = themeSettings.getByRole('slider', { name: label });
    await control.fill(String(value));
    await expect(control).toHaveValue(String(value));
  }
  await page.getByRole('tab', { name: 'Scene' }).click();
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

  await page.getByRole('tab', { name: 'Settings' }).click();
  await shot(page, 'wide-material-controls.png');
  await page.getByRole('tab', { name: 'Scene' }).click();

  await invokeCompactChromeAction(page, 'Open Widget Catalog');
  await shot(page, 'wide-catalog-drawer.png');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  await catalog.getByRole('button', { name: 'Expanded' }).click();
  await shot(page, 'wide-catalog-expanded.png');
  await catalog.getByRole('button', { name: 'Close Catalog' }).click();

  await invokeCompactChromeAction(page, 'Focus reading');
  await page.getByRole('button', { name: 'Focus reading' }).evaluate((button: HTMLButtonElement) => button.blur());
  await shot(page, 'focus-transcript.png');

  await fresh(page, 390, 844);
  await shot(page, 'compact-scene.png');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await shot(page, 'compact-settings.png');

  await fresh(page, 1440, 900);
  await invokeWidgetAction(page.getByRole('article', { name: 'Room Ambience' }), 'Float');
  await shot(page, 'floating-widget.png');
  await page.getByRole('tab', { name: 'Library' }).click();
  await shot(page, 'renderer-error.png');
});

test('Theme Settings freezes the focused wide and compact authoring surfaces', async ({ page }) => {
  await fresh(page, 1440, 900);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await shot(page, 'wide-theme-settings.png');

  await fresh(page, 390, 844);
  await page.getByRole('tab', { name: 'Settings' }).click();
  await invokeWidgetAction(page.locator('[data-widget-type="settings.custom-theme"]'), 'Focus Widget');
  await expect(page.getByRole('dialog', { name: 'Focused Custom Theme' })).toBeVisible();
  await shot(page, 'compact-theme-settings.png');
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

    await fresh(page, 1440, 900);
    await selectTheme(page, theme.label);
    await invokeCompactChromeAction(page, 'Open Widget Catalog');
    await shot(page, `wide-catalog-${theme.name}.png`);
  }
});

test('PomOS freezes short desktop, landscape, and zoom-equivalent fidelity', async ({ page }) => {
  for (const viewport of [
    { name: 'short-desktop-pom-neutral.png', width: 1280, height: 720 },
    { name: 'short-landscape-pom-neutral.png', width: 844, height: 390 },
    { name: 'zoom-200-pom-neutral.png', width: 800, height: 450 }
  ]) {
    await fresh(page, viewport.width, viewport.height);
    await selectTheme(page, 'PomOS');
    await shot(page, viewport.name);
  }
});

test('Ash and Amber freezes the reviewed wide, compact, and Catalog target states', async ({ page }) => {
  await fresh(page, 1920, 1280);
  await selectTheme(page, 'Ash & Amber');
  await shot(page, 'wide-ash-amber.png');

  await fresh(page, 390, 844);
  await selectTheme(page, 'Ash & Amber');
  await shot(page, 'compact-ash-amber.png');

  await fresh(page, 1440, 900);
  await selectTheme(page, 'Ash & Amber');
  await invokeCompactChromeAction(page, 'Open Widget Catalog');
  await shot(page, 'wide-catalog-ash-amber.png');
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
