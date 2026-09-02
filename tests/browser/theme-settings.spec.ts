import { expect, test, type Locator, type Page } from '@playwright/test';

const draftKey = 'pomegranate-ui.workbench-lab.theme-draft.v1';

async function fresh(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

function widget(page: Page, type: string) {
  return page.locator(`[data-widget-type="${type}"]`);
}

async function openAppearance(page: Page) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const selector = page.locator('[data-sub-panel-selector-trigger]');
  if (await selector.isVisible()) {
    await selector.click();
    await page.getByRole('option', { name: 'Appearance and Accessibility' }).click();
  } else {
    await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  }
  const result = {
    overview: widget(page, 'settings.custom-theme'),
    colors: widget(page, 'settings.theme-colors'),
    materials: widget(page, 'settings.theme-materials'),
    canvas: widget(page, 'settings.theme-canvas'),
    ambient: widget(page, 'settings.theme-ambient')
  };
  await expect(result.overview).toBeVisible();
  return result;
}

async function selectTheme(page: Page, label: string) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: label, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
}

async function binding(page: Page, property: string) {
  return page.locator('main').evaluate((root, name) => getComputedStyle(root).getPropertyValue(name).trim(), property);
}

async function materialContract(root: Locator) {
  return root.locator('[data-theme-authoring-element="materials"]').evaluate((element) => ({
    marker: element.getAttribute('data-theme-authoring-element'),
    className: element.className,
    font: getComputedStyle(element).font,
    controls: [...element.querySelectorAll('label')].map((label) => ({
      label: label.querySelector('span')?.textContent?.trim(),
      output: label.querySelector('output')?.textContent?.trim(),
      input: {
        type: label.querySelector('input')?.type,
        min: label.querySelector('input')?.min,
        max: label.querySelector('input')?.max,
        ariaLabel: label.querySelector('input')?.getAttribute('aria-label')
      }
    }))
  }));
}

test('Scene contains the same focused Materials element used by Settings', async ({ page }) => {
  await fresh(page);
  const sceneMaterials = widget(page, 'settings.theme-materials');
  await expect(sceneMaterials).toHaveCount(1);
  await expect(sceneMaterials.locator('[data-theme-authoring-element="materials"]')).toBeVisible();
  for (const absent of ['settings.custom-theme', 'settings.theme-colors', 'settings.theme-canvas', 'settings.theme-ambient']) {
    await expect(widget(page, absent)).toHaveCount(0);
  }
  const sceneContract = await materialContract(sceneMaterials);

  const settings = await openAppearance(page);
  await expect(settings.overview.locator('[data-theme-authoring-element="overview"]')).toBeVisible();
  await expect(settings.colors.locator('[data-theme-authoring-element="colors"]')).toBeVisible();
  await expect(settings.materials.locator('[data-theme-authoring-element="materials"]')).toBeVisible();
  await expect(settings.canvas.locator('[data-theme-authoring-element="canvas"]')).toBeVisible();
  await expect(settings.ambient.locator('[data-theme-authoring-element="ambient"]')).toBeVisible();
  expect(await materialContract(settings.materials)).toEqual(sceneContract);
});

test('Scene and Settings material controls share one draft bidirectionally', async ({ page }) => {
  await fresh(page);
  const scene = widget(page, 'settings.theme-materials');
  await scene.getByRole('slider', { name: 'Glass Density' }).fill('73');

  let settings = await openAppearance(page);
  await expect(settings.materials.getByRole('slider', { name: 'Glass Density' })).toHaveValue('73');
  await settings.materials.getByRole('slider', { name: 'Bar Opacity' }).fill('41');

  await page.getByRole('tab', { name: 'Scene' }).click();
  await expect(widget(page, 'settings.theme-materials').getByRole('slider', { name: 'Bar Opacity' })).toHaveValue('41');

  settings = await openAppearance(page);
  await settings.overview.getByRole('button', { name: 'Reset' }).click();
  await expect(settings.materials.getByRole('slider', { name: 'Glass Density' })).toHaveValue('20');
  await expect(settings.materials.getByRole('slider', { name: 'Bar Opacity' })).toHaveValue('60');
});

test('Theme Colors propagates all semantic roles and preserves the last valid target', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  const settings = await openAppearance(page);
  const revision = await root.getAttribute('data-workbench-revision');
  const hex = settings.colors.getByRole('textbox', { name: 'Hex color' });

  for (const [role, value, property] of [
    ['Canvas', '#101820', '--pom-color-canvas'],
    ['Glass', '#203038', '--pom-color-surface'],
    ['Chrome', '#18282f', '--pom-color-chrome'],
    ['Ambient', '#70c4b8', '--pom-color-accent'],
    ['Text', '#f3fbf8', '--pom-color-text'],
    ['Source', '#d2b57a', '--pom-color-warning']
  ] as const) {
    await settings.colors.getByRole('button', { name: role, exact: true }).click();
    await hex.fill(value);
    await expect.poll(() => binding(page, property)).toBe(value);
  }

  const lastText = await binding(page, '--pom-color-text');
  await settings.colors.getByRole('button', { name: 'Text', exact: true }).click();
  await hex.fill('url(javascript:unsafe)');
  await expect(hex).toHaveValue('url(javascript:unsafe)');
  await expect(settings.colors.getByRole('list', { name: 'Color diagnostics' })).toContainText('#RRGGBB');
  await expect(settings.overview.getByRole('list', { name: 'Theme diagnostics' })).toContainText('#RRGGBB');
  expect(await binding(page, '--pom-color-text')).toBe(lastText);

  await hex.fill('#f3fbf8');
  await expect(settings.colors.getByRole('list', { name: 'Color diagnostics' })).toHaveCount(0);
  await expect(settings.overview.getByRole('list', { name: 'Theme diagnostics' })).toHaveCount(0);
  await expect(root).toHaveAttribute('data-workbench-revision', revision!);
});

test('Materials and Ambient elements control their semantic bindings', async ({ page }) => {
  await fresh(page);
  const settings = await openAppearance(page);

  for (const [name, property] of [
    ['Glass Density', '--pom-material-widget'],
    ['Bar Opacity', '--pom-material-shelf']
  ] as const) {
    const control = settings.materials.getByRole('slider', { name });
    await control.fill('0');
    await expect.poll(() => binding(page, property)).toMatch(/(?:rgba\([^)]*, 0\)|transparent)/);
    await control.fill('100');
    await expect(control).toHaveValue('100');
  }
  await settings.materials.getByRole('slider', { name: 'Selected Strength' }).fill('22');
  await settings.materials.getByRole('slider', { name: 'Frost Level' }).fill('75');
  await expect.poll(() => binding(page, '--pom-material-widget-blur')).toBe('30px');

  const position = settings.ambient.getByRole('application', { name: 'Ambient position' });
  const beforeX = await binding(page, '--pom-ambient-x');
  await position.focus();
  await position.press('ArrowRight');
  await expect.poll(() => binding(page, '--pom-ambient-x')).not.toBe(beforeX);
  await settings.ambient.getByRole('slider', { name: 'Radius' }).fill('72');
  await settings.ambient.getByRole('slider', { name: 'Power' }).fill('41');
  await expect.poll(() => binding(page, '--pom-ambient-radius')).toBe('75.84%');
  await expect.poll(() => binding(page, '--pom-ambient-power')).toBe('0.41');
});

for (const target of [
  { label: 'Deep Current', id: 'deep-current' },
  { label: 'Ash & Amber', id: 'ash-amber' }
] as const) {
  test(`${target.label} Canvas controls recolor and rotate the rendered overlay`, async ({ page }) => {
    await fresh(page);
    await selectTheme(page, target.label);
    await expect(page.locator('main')).toHaveAttribute('data-pom-theme', target.id);
    const settings = await openAppearance(page);

    await settings.colors.getByRole('button', { name: 'Canvas', exact: true }).click();
    await settings.colors.getByRole('textbox', { name: 'Hex color' }).fill('#101820');
    await expect(page.locator('[data-pom-canvas-layer="solid"]')).toHaveCSS('background-color', 'rgb(16, 24, 32)');

    const before = await page.locator('[data-pom-canvas-layer="linear-gradient"]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style')));
    await settings.canvas.getByRole('slider', { name: 'Gradient Direction' }).fill('125');
    await expect(settings.canvas.getByRole('slider', { name: 'Gradient Direction' })).toHaveValue('125');
    await expect.poll(() => page.locator('[data-pom-canvas-layer="linear-gradient"]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style'))))
      .toContainEqual(expect.stringContaining('125deg'));
    const rotated = await page.locator('[data-pom-canvas-layer="linear-gradient"]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style')));
    expect(rotated).not.toEqual(before);

    await settings.canvas.getByRole('slider', { name: 'Overlay Strength' }).fill('35');
    const faded = await page.locator('[data-pom-canvas-layer="linear-gradient"]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style')));
    expect(faded).not.toEqual(rotated);
  });
}

test('Canvas exposes preset-backed availability instead of theme-specific branches', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, 'PomOS');
  let settings = await openAppearance(page);
  await expect(settings.canvas.getByRole('slider', { name: 'Image Strength' })).toBeDisabled();
  await expect(settings.canvas.getByText('Not used by this preset')).toHaveCount(1);

  await page.getByRole('tab', { name: 'Scene' }).click();
  await selectTheme(page, 'Deep Current');
  settings = await openAppearance(page);
  await expect(settings.canvas.getByRole('slider', { name: 'Image Strength' })).toBeEnabled();
});

test('Theme drafts save independently of layout persistence and restore through the overview', async ({ page }) => {
  await fresh(page);
  let settings = await openAppearance(page);
  await settings.colors.getByRole('textbox', { name: 'Hex color' }).fill('#111c24');
  await settings.overview.getByRole('button', { name: 'Save draft' }).click();
  await expect(settings.overview.getByRole('status')).toContainText('saved');
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), draftKey)).not.toBeNull();

  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Clear saved layout' }).click();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), draftKey)).not.toBeNull();
  await page.reload();
  await expect.poll(() => binding(page, '--pom-color-canvas')).toBe('#111c24');
  settings = await openAppearance(page);
  await expect(settings.colors.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#111c24');
});

test('Theme elements use compact Widget typography and accessible control geometry', async ({ page }) => {
  await fresh(page);
  const scene = widget(page, 'settings.theme-materials');
  const settings = await openAppearance(page);
  const samples = [scene, settings.overview, settings.colors, settings.materials, settings.canvas, settings.ambient];

  for (const sample of samples) {
    const element = sample.locator('[data-theme-authoring-element]');
    expect(await element.evaluate((node) => getComputedStyle(node).fontSize)).toBe('10px');
  }
  await expect(settings.colors.getByRole('application', { name: 'Saturation and value' })).toHaveCSS('min-height', '96px');
  for (const slider of await page.locator('[data-theme-authoring-element] input[type="range"]').all()) {
    expect((await slider.boundingBox())?.height).toBeGreaterThanOrEqual(43.99);
  }
});

for (const viewport of [
  { name: 'compact', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: '200-percent zoom equivalent', width: 800, height: 450 }
]) {
  test(`Theme elements remain contained at ${viewport.name}`, async ({ page }) => {
    await fresh(page, viewport.width, viewport.height);
    const settings = await openAppearance(page);
    await settings.overview.getByRole('button', { name: 'Save draft' }).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    for (const root of Object.values(settings)) {
      await expect(root.locator('[data-theme-authoring-element]')).toBeAttached();
    }
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
