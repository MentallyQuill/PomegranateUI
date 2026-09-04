import { expect, test, type Locator, type Page } from '@playwright/test';

const draftKey = 'pomegranate-ui.workbench-lab.theme-draft.v2.deep-current';

async function fresh(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
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

test('Toolbar controls author, persist, and reset the live toggle presentation', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  let settings = await openAppearance(page);
  let controls = settings.overview.getByRole('group', { name: 'Toolbar controls' });

  await expect(controls.getByRole('radio', { name: 'Edge labels' })).toBeChecked();
  await controls.getByRole('radio', { name: 'Bottom-edge chevrons' }).click();
  await expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'bottom-chevrons');

  await page.getByRole('tab', { name: 'Scene' }).click();
  const left = page.locator('.toolbar-edge-toggle-left');
  const right = page.locator('.toolbar-edge-toggle-right');
  await expect(left).toHaveText('‹');
  await expect(right).toHaveText('›');
  await left.click();
  await expect(left).toHaveAccessibleName('Open left toolbar');
  await expect(left).toHaveText('›');

  settings = await openAppearance(page);
  await settings.overview.getByRole('button', { name: 'Save draft' }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), draftKey)).not.toBeNull();
  await page.reload();
  await expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'bottom-chevrons');

  settings = await openAppearance(page);
  controls = settings.overview.getByRole('group', { name: 'Toolbar controls' });
  await expect(controls.getByRole('radio', { name: 'Bottom-edge chevrons' })).toBeChecked();
  await settings.overview.getByRole('button', { name: 'Reset' }).click();
  await expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'edge-labels');
  await expect(controls.getByRole('radio', { name: 'Edge labels' })).toBeChecked();
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

  await settings.colors.getByRole('button', { name: 'Canvas', exact: true }).click();
  const red = settings.colors.getByRole('textbox', { name: 'Red' });
  await red.fill('999');
  await expect(red).toHaveValue('999');
  await expect(settings.colors.getByRole('list', { name: 'Color diagnostics' })).toContainText('0 to 255');
  await expect(settings.overview.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  await settings.materials.getByRole('slider', { name: 'Glass Density' }).fill('61');
  await expect(red).toHaveValue('999');
  await red.fill('16');
  await expect(settings.colors.getByRole('list', { name: 'Color diagnostics' })).toHaveCount(0);
  await expect(settings.materials.getByRole('slider', { name: 'Glass Density' })).toHaveValue('61');
  await expect(root).toHaveAttribute('data-workbench-revision', revision!);
});

test('Theme Colors tracks saturation and value throughout a pointer drag', async ({ page }) => {
  await fresh(page);
  const settings = await openAppearance(page);
  await expect(settings.colors.locator('.widget-frame')).toHaveCSS('transform', 'none');
  const plane = settings.colors.getByRole('application', { name: 'Saturation and value' });
  const box = await plane.boundingBox();
  expect(box).not.toBeNull();
  const position = async () => {
    const text = await settings.colors.locator('.theme-color-plane-value').textContent();
    const match = text?.match(/Saturation (\d+)% · Value (\d+)%/);
    expect(match).not.toBeNull();
    return { saturation: Number(match![1]), value: Number(match![2]) };
  };
  const isNear = async (saturation: number, value: number) => {
    const current = await position();
    return Math.abs(current.saturation - saturation) <= 3 && Math.abs(current.value - value) <= 3;
  };

  await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.2);
  await page.mouse.down();
  await expect.poll(() => isNear(20, 80)).toBe(true);

  await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.7, { steps: 6 });
  await expect.poll(() => isNear(80, 30)).toBe(true);

  await page.mouse.move(box!.x + box!.width * 0.9, box!.y + box!.height * 0.9);
  await page.mouse.up();
  await expect.poll(() => isNear(90, 10)).toBe(true);
  const released = await position();

  await page.mouse.move(box!.x + box!.width * 0.1, box!.y + box!.height * 0.1);
  expect(await position()).toEqual(released);
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

test('Theme Materials slider hover keeps the enlarged hit target visually transparent', async ({ page }) => {
  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await fresh(page);
    await selectTheme(page, theme);

    for (const viewport of [{ width: 1440, height: 900 }, { width: 980, height: 720 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const materials = widget(page, 'settings.theme-materials');
      if (!await materials.isVisible()) await page.getByRole('button', { name: 'Open left toolbar' }).click();
      await expect(materials).toBeVisible();

      for (const name of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level']) {
        const slider = materials.getByRole('slider', { name });
        await slider.hover();
        await expect(slider, `${theme} at ${viewport.width}px: ${name} hover must not paint its 44px hit target`)
          .toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      }
    }
  }
});

test('every Theme Materials control changes a rendered surface in every theme and presentation', async ({ page }) => {
  test.setTimeout(180_000);
  const cases = [
    { name: 'Glass Density', surface: 'glass', property: 'backgroundColor' },
    { name: 'Bar Opacity', selector: '.top-shelf', property: 'backgroundColor' },
    { name: 'Selected Strength', selector: '.panel-tabs [role="tab"][aria-selected="true"]', property: 'backgroundColor' },
    { name: 'Frost Level', surface: 'glass', property: 'backdropFilter' },
    { name: 'Frost Level', selector: '.top-shelf', property: 'backdropFilter' }
  ] as const;

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await fresh(page);
    await selectTheme(page, theme);

    for (const viewport of [{ width: 1440, height: 900 }, { width: 980, height: 720 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const materials = widget(page, 'settings.theme-materials');
      if (!await materials.isVisible()) await page.getByRole('button', { name: 'Open left toolbar' }).click();
      await expect(materials).toBeVisible();
      if (theme === 'Deep Current' && !await page.locator('[data-conformance-region="right"]').isVisible()) {
        await page.getByRole('button', { name: 'Open right toolbar' }).click();
      }

      for (const control of cases) {
        const selector = 'surface' in control
          ? theme === 'Deep Current'
            ? '[data-conformance-region="right"]'
            : '[data-widget-type="story.characters"] .widget-frame'
          : control.selector;
        const slider = materials.getByRole('slider', { name: control.name });
        const surface = page.locator(selector);
        await expect(surface).toBeVisible();
        if (control.name === 'Frost Level') {
          await materials.getByRole('slider', { name: 'surface' in control ? 'Glass Density' : 'Bar Opacity' }).fill('50');
        }
        await slider.fill('0');
        const zero = await surface.evaluate((element, property) => getComputedStyle(element)[property], control.property);
        const zeroPixels = control.property === 'backdropFilter'
          ? await surface.screenshot({ animations: 'disabled', caret: 'hide' })
          : null;
        await slider.fill('100');
        await expect.poll(() => surface.evaluate((element, property) => getComputedStyle(element)[property], control.property), {
          message: `${theme} at ${viewport.width}px: ${control.name} should change ${selector} ${control.property}`
        }).not.toBe(zero);
        if (zeroPixels) {
          const fullPixels = await surface.screenshot({ animations: 'disabled', caret: 'hide' });
          expect(fullPixels.equals(zeroPixels), `${theme} at ${viewport.width}px: ${control.name} should visibly repaint ${selector}`).toBe(false);
        }
      }
    }
  }
});

test('Deep Current material calibration stays monotonic through its authored defaults', async ({ page }) => {
  const cases = [
    { name: 'Glass Density', value: 20, selector: '[data-conformance-region="right"]', property: 'backgroundColor', metric: 'alpha' },
    { name: 'Bar Opacity', value: 60, selector: '.top-shelf', property: 'backgroundColor', metric: 'alpha' },
    { name: 'Selected Strength', value: 6, selector: '.panel-tabs [role="tab"][aria-selected="true"]', property: 'backgroundColor', metric: 'selected' },
    { name: 'Frost Level', value: 50, selector: '[data-conformance-region="right"]', property: 'backdropFilter', metric: 'blur' }
  ] as const;

  await fresh(page);
  await selectTheme(page, 'Deep Current');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 980, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const materials = widget(page, 'settings.theme-materials');
    if (!await materials.isVisible()) await page.getByRole('button', { name: 'Open left toolbar' }).click();
    if (!await page.locator('[data-conformance-region="right"]').isVisible()) {
      await page.getByRole('button', { name: 'Open right toolbar' }).click();
    }

    for (const control of cases) {
      const slider = materials.getByRole('slider', { name: control.name });
      const surface = page.locator(control.selector);
      await expect(surface).toBeVisible();
      const samples: number[] = [];
      for (const value of [control.value - 1, control.value, control.value + 1]) {
        await slider.fill(String(value));
        const computed = await surface.evaluate((element, property) => getComputedStyle(element)[property], control.property);
        const numbers = computed.match(/[\d.]+/g)?.map(Number) ?? [];
        if (control.metric === 'blur') samples.push(numbers[0] ?? Number.NaN);
        else {
          const alpha = numbers.length >= 4 ? (numbers[3] ?? 1) : 1;
          samples.push(control.metric === 'selected' ? alpha * 1000 + (numbers[1] ?? 0) : alpha);
        }
      }
      expect(samples[1]!, `${control.name} should increase into its default at ${viewport.width}px`).toBeGreaterThan(samples[0]!);
      expect(samples[2]!, `${control.name} should increase out of its default at ${viewport.width}px`).toBeGreaterThan(samples[1]!);
    }
  }
});

for (const target of [
  { label: 'Deep Current', id: 'deep-current', image: true, canvas: '#101820', rgb: 'rgb(16, 24, 32)' },
  { label: 'PomOS', id: 'pom-neutral', image: false, canvas: '#f8fbff', rgb: 'rgb(248, 251, 255)' },
  { label: 'Ash & Amber', id: 'ash-amber', image: true, canvas: '#101820', rgb: 'rgb(16, 24, 32)' }
] as const) {
  test(`${target.label} Canvas controls recolor and rotate the rendered overlay`, async ({ page }) => {
    await fresh(page);
    await selectTheme(page, target.label);
    await expect(page.locator('main')).toHaveAttribute('data-pom-theme', target.id);
    const settings = await openAppearance(page);

    await settings.colors.getByRole('button', { name: 'Canvas', exact: true }).click();
    await settings.colors.getByRole('textbox', { name: 'Hex color' }).fill(target.canvas);
    await expect(page.locator('[data-pom-canvas-layer="solid"]')).toHaveCSS('background-color', target.rgb);

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

    const image = settings.canvas.getByRole('slider', { name: 'Image Strength' });
    if (target.image) {
      const beforeImage = await page.locator('[data-pom-canvas-layer="image"]').getAttribute('style');
      await image.fill('37');
      await expect.poll(() => page.locator('[data-pom-canvas-layer="image"]').getAttribute('style')).not.toBe(beforeImage);
    } else await expect(image).toBeDisabled();

    const beforeVignette = await page.locator('[data-pom-canvas-layer]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style')));
    await settings.canvas.getByRole('slider', { name: 'Vignette Strength' }).fill('42');
    await expect.poll(() => page.locator('[data-pom-canvas-layer]').evaluateAll((layers) => layers.map((layer) => layer.getAttribute('style')))).not.toEqual(beforeVignette);
  });
}

test('Bunny exposes its image, four-corner overlay, and vignette without a fake gradient control', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, 'Bunny');
  const settings = await openAppearance(page);
  await expect(settings.canvas.getByRole('slider', { name: 'Gradient Direction' })).toBeDisabled();
  for (const [name, selector] of [
    ['Image Strength', '[data-pom-canvas-layer="image"]'],
    ['Overlay Strength', '[data-pom-canvas-layer="four-corner"]'],
    ['Vignette Strength', '[data-pom-canvas-layer="veil"]']
  ] as const) {
    const before = await page.locator(selector).getAttribute('style');
    await settings.canvas.getByRole('slider', { name }).fill('36');
    await expect.poll(() => page.locator(selector).getAttribute('style')).not.toBe(before);
  }
});

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
