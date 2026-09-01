import { expect, test, type Page } from '@playwright/test';

const draftKey = 'pomegranate-ui.workbench-lab.theme-draft.v1';

async function fresh(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

async function openThemeSettings(page: Page) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  const settings = page.locator('[data-widget-type="settings.custom-theme"]');
  await expect(settings).toBeVisible();
  return settings;
}

async function binding(page: Page, property: string) {
  return page.locator('main').evaluate((root, name) => getComputedStyle(root).getPropertyValue(name).trim(), property);
}

test('Theme Settings propagates six semantic roles and preserves the last valid target', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  const settings = await openThemeSettings(page);
  const revision = await root.getAttribute('data-workbench-revision');
  const hex = settings.getByRole('textbox', { name: 'Hex color' });

  for (const [role, value, property] of [
    ['Canvas', '#101820', '--pom-color-canvas'],
    ['Glass', '#203038', '--pom-color-surface'],
    ['Chrome', '#18282f', '--pom-color-chrome'],
    ['Ambient', '#70c4b8', '--pom-color-accent'],
    ['Text', '#f3fbf8', '--pom-color-text'],
    ['Source', '#d2b57a', '--pom-color-warning']
  ] as const) {
    await settings.getByRole('button', { name: role, exact: true }).click();
    await hex.fill(value);
    await expect.poll(() => binding(page, property)).toBe(value);
  }

  const lastText = await binding(page, '--pom-color-text');
  await settings.getByRole('button', { name: 'Text', exact: true }).click();
  await hex.fill('url(javascript:unsafe)');
  await expect(hex).toHaveValue('url(javascript:unsafe)');
  await expect(settings.getByRole('list', { name: 'Theme diagnostics' })).toContainText('#RRGGBB');
  expect(await binding(page, '--pom-color-text')).toBe(lastText);

  await hex.fill('#203038');
  await expect(hex).toHaveValue('#203038');
  await expect(settings.getByRole('list', { name: 'Theme diagnostics' })).toContainText(/contrast/i);
  expect(await binding(page, '--pom-color-text')).toBe(lastText);
  await hex.fill('#f3fbf8');
  await expect(settings.getByRole('list', { name: 'Theme diagnostics' })).toHaveCount(0);
  await expect(root).toHaveAttribute('data-workbench-revision', revision!);
});

test('Theme Settings controls materials and ambient light by keyboard and pointer-safe ranges', async ({ page }) => {
  await fresh(page);
  const settings = await openThemeSettings(page);

  for (const [name, property] of [
    ['Glass Density', '--pom-material-widget'],
    ['Bar Opacity', '--pom-material-shelf']
  ] as const) {
    const control = settings.getByRole('slider', { name });
    await control.fill('0');
    await expect.poll(() => binding(page, property)).toMatch(/(?:rgba\([^)]*, 0\)|transparent)/);
    await control.fill('100');
    await expect(control).toHaveValue('100');
  }
  await settings.getByRole('slider', { name: 'Selected Strength' }).fill('22');
  await settings.getByRole('slider', { name: 'Frost Level' }).fill('75');
  await expect.poll(() => binding(page, '--pom-material-widget-blur')).toBe('30px');

  const position = settings.getByRole('application', { name: 'Ambient position' });
  const beforeX = await binding(page, '--pom-ambient-x');
  await position.focus();
  await position.press('ArrowRight');
  await expect(position).toBeFocused();
  await expect.poll(() => binding(page, '--pom-ambient-x')).not.toBe(beforeX);

  await settings.getByRole('slider', { name: 'Radius' }).fill('72');
  await settings.getByRole('slider', { name: 'Power' }).fill('41');
  await expect.poll(() => binding(page, '--pom-ambient-radius')).toBe('75.84%');
  await expect.poll(() => binding(page, '--pom-ambient-power')).toBe('0.41');
  const ambient = page.locator('[data-pom-ambient-layer]');
  await expect(ambient).toHaveCount(1);
  expect(Number(await ambient.evaluate((node) => getComputedStyle(node).opacity))).toBeCloseTo(0.41, 2);
});

test('Scene and Settings use one canonical Custom Theme authoring surface bidirectionally', async ({ page }) => {
  await fresh(page);
  const scene = page.locator('[data-widget-type="settings.custom-theme"]');
  const sceneOwner = scene.locator('[data-theme-settings-owner="canonical"]');
  await expect(sceneOwner).toHaveAttribute('data-theme-settings-presentation', 'compact');
  for (const name of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level', 'Radius', 'Power']) {
    await expect(scene.getByRole('slider', { name })).toHaveCount(1);
  }
  await scene.getByRole('slider', { name: 'Glass Density' }).fill('73');

  const settings = await openThemeSettings(page);
  const settingsOwner = settings.locator('[data-theme-settings-owner="canonical"]');
  await expect(settingsOwner).toHaveAttribute('data-theme-settings-presentation', 'full');
  for (const name of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level', 'Radius', 'Power']) {
    await expect(settings.getByRole('slider', { name })).toHaveCount(1);
  }
  await expect(settings.getByRole('slider', { name: 'Glass Density' })).toHaveValue('73');
  await settings.getByRole('slider', { name: 'Bar Opacity' }).fill('41');

  await page.getByRole('tab', { name: 'Scene' }).click();
  const restoredScene = page.locator('[data-widget-type="settings.custom-theme"]');
  await expect(restoredScene.getByRole('slider', { name: 'Bar Opacity' })).toHaveValue('41');

  const resetSettings = await openThemeSettings(page);
  await resetSettings.getByRole('button', { name: 'Reset' }).click();
  await expect(resetSettings.getByRole('slider', { name: 'Glass Density' })).toHaveValue('20');
  await expect(resetSettings.getByRole('slider', { name: 'Bar Opacity' })).toHaveValue('60');
});

test('Custom Theme validation survives switching between its two placements', async ({ page }) => {
  await fresh(page);
  const scene = page.locator('[data-widget-type="settings.custom-theme"]');
  await scene.getByRole('button', { name: 'Text', exact: true }).click();
  await scene.getByRole('textbox', { name: 'Hex color' }).fill('not-a-color');
  await expect(scene.getByRole('list', { name: 'Theme diagnostics' })).toContainText('#RRGGBB');

  const settings = await openThemeSettings(page);
  await expect(settings.getByRole('list', { name: 'Theme diagnostics' })).toContainText('#RRGGBB');
  await expect(settings.getByRole('article', { name: /failed/i })).toHaveCount(0);
  await settings.getByRole('button', { name: 'Text', exact: true }).click();
  await settings.getByRole('textbox', { name: 'Hex color' }).fill('#f3fbf8');
  await expect(settings.getByRole('list', { name: 'Theme diagnostics' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Scene' }).click();
  await expect(page.locator('[data-widget-type="settings.custom-theme"]').getByRole('list', { name: 'Theme diagnostics' })).toHaveCount(0);
});

test('Theme drafts save and restore independently of layout persistence', async ({ page }) => {
  await fresh(page);
  const settings = await openThemeSettings(page);
  await settings.getByRole('textbox', { name: 'Hex color' }).fill('#111c24');
  await settings.getByRole('button', { name: 'Save draft' }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), draftKey)).not.toBeNull();

  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Clear saved layout' }).click();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), draftKey)).not.toBeNull();
  await page.reload();
  await expect.poll(() => binding(page, '--pom-color-canvas')).toBe('#111c24');
  await openThemeSettings(page);
  await expect(page.locator('[data-widget-type="settings.custom-theme"]').getByRole('textbox', { name: 'Hex color' })).toHaveValue('#111c24');
});

test('compact Custom Theme owns one keyboard-scrollable region through its ambient footer', async ({ page }) => {
  await fresh(page, 1280, 450);
  const card = page.getByRole('article', { name: 'Custom Theme' });
  const controls = card.getByRole('region', { name: 'Custom Theme controls' });
  await expect(controls).toBeVisible();

  const before = await controls.evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    overflowY: getComputedStyle(node).overflowY,
    documentScrollY: window.scrollY
  }));
  expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
  expect(before.overflowY).toBe('auto');
  expect(before.documentScrollY).toBe(0);

  await controls.focus();
  await controls.press('End');
  await expect(controls).toBeFocused();
  await expect.poll(() => controls.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);

  const containment = await controls.evaluate((node) => {
    const footer = node.querySelector('.compact-ambient footer');
    if (!(footer instanceof HTMLElement)) throw new Error('Missing compact ambient footer.');
    const owner = node.getBoundingClientRect();
    const last = footer.getBoundingClientRect();
    return {
      footerTop: last.top,
      footerBottom: last.bottom,
      ownerTop: owner.top,
      ownerBottom: owner.bottom,
      viewportBottom: innerHeight,
      documentScrollY: window.scrollY
    };
  });
  expect(containment.footerTop).toBeGreaterThanOrEqual(containment.ownerTop);
  expect(containment.footerBottom).toBeLessThanOrEqual(containment.ownerBottom + 1);
  expect(containment.footerBottom).toBeLessThanOrEqual(containment.viewportBottom);
  expect(containment.documentScrollY).toBe(0);
});

for (const viewport of [
  { name: 'compact', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: '200-percent zoom equivalent', width: 800, height: 450 }
]) {
  test(`Theme Settings ${viewport.name} remains keyboard reachable and contained`, async ({ page }) => {
    await fresh(page, viewport.width, viewport.height);
    const settings = await openThemeSettings(page);
    const plane = settings.getByRole('application', { name: 'Saturation and value' });
    await plane.focus();
    await plane.press('End');
    await expect(plane).toBeFocused();
    const evidence = await page.evaluate(() => {
      const root = document.querySelector('main')!;
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollOwners: elements.filter((node) => !['TEXTAREA', 'INPUT', 'SELECT'].includes(node.tagName)
          && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)
          && node.scrollHeight > node.clientHeight + 1).length
      };
    });
    expect(evidence.overflow).toBeLessThanOrEqual(1);
    expect(evidence.scrollOwners).toBeLessThanOrEqual(1);

    const save = settings.getByRole('button', { name: 'Save draft' });
    await save.scrollIntoViewIfNeeded();
    const reachability = await save.evaluate((button) => {
      const settingsRoot = button.closest('[data-widget-type="settings.custom-theme"]');
      if (!(settingsRoot instanceof HTMLElement)) throw new Error('Missing Theme Settings root.');
      const buttonBox = button.getBoundingClientRect();
      const settingsBox = settingsRoot.getBoundingClientRect();
      return {
        buttonTop: buttonBox.top,
        buttonBottom: buttonBox.bottom,
        settingsTop: settingsBox.top,
        settingsBottom: settingsBox.bottom,
        viewportBottom: innerHeight,
        documentScrollY: window.scrollY
      };
    });
    expect(reachability.buttonTop).toBeGreaterThanOrEqual(reachability.settingsTop);
    expect(reachability.buttonBottom).toBeLessThanOrEqual(reachability.settingsBottom + 1);
    expect(reachability.buttonBottom).toBeLessThanOrEqual(reachability.viewportBottom);
    expect(reachability.documentScrollY).toBe(0);
  });
}

test('ambient accessibility vetoes reduced motion and transparency at activation', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'reduce' },
      { name: 'prefers-reduced-transparency', value: 'reduce' }
    ]
  });
  await fresh(page);
  expect(await binding(page, '--pom-ambient-motion-enabled')).toBe('0');
  expect(await binding(page, '--pom-ambient-transparency-enabled')).toBe('0');
  expect(Number(await page.locator('[data-pom-ambient-layer]').evaluate((node) => getComputedStyle(node).opacity))).toBe(0);
});
