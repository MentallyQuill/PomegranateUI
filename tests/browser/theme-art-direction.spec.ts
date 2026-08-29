import { expect, test, type Page } from '@playwright/test';

const TARGETS = [
  { id: 'deep-current', label: 'Deep Current' },
  { id: 'pom-neutral', label: 'Pom Neutral' },
  { id: 'bunny', label: 'Bunny' }
] as const;

type MaterialSample = {
  backdropFilter: string;
  backgroundColor: string;
  backgroundImage: string;
  borderBottomRightRadius: string;
  borderTopLeftRadius: string;
  boxShadow: string;
};

type SurfaceName = 'shelf' | 'utility' | 'workbench' | 'dock' | 'transcript' | 'composer' | 'catalog' | 'dialog' | 'focused' | 'floating';
type SurfaceExpectation = {
  blur: number;
  radii: readonly [number, number];
  shadow: boolean;
  tone: 'dark' | 'light';
  translucent: boolean;
};

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

async function selectTheme(page: Page, target: (typeof TARGETS)[number]) {
  const button = page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: target.label, exact: true });
  await button.click();
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', target.id);
  await expect(button).toBeFocused();
}

async function material(page: Page, selector: string): Promise<MaterialSample> {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderBottomRightRadius: style.borderBottomRightRadius,
      borderTopLeftRadius: style.borderTopLeftRadius,
      boxShadow: style.boxShadow
    };
  });
}

async function pseudoMaterial(page: Page, selector: string, pseudo: '::before' | '::after'): Promise<MaterialSample> {
  return page.locator(selector).evaluate((element, pseudoElement) => {
    const style = getComputedStyle(element, pseudoElement);
    return {
      backdropFilter: style.backdropFilter,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderBottomRightRadius: style.borderBottomRightRadius,
      borderTopLeftRadius: style.borderTopLeftRadius,
      boxShadow: style.boxShadow
    };
  }, pseudo);
}

function blurPx(filter: string): number {
  return Number(filter.match(/blur\((\d+(?:\.\d+)?)px\)/)?.[1] ?? 0);
}

function alpha(color: string): number {
  const commaAlpha = color.match(/^rgba?\([^,]+,[^,]+,[^,]+(?:,\s*([\d.]+))?\)$/)?.[1];
  if (commaAlpha) return Number(commaAlpha);
  const slashAlpha = color.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
  return slashAlpha ? Number(slashAlpha) : 1;
}

function radiusPx(radius: string): number {
  return Number(radius.replace('px', ''));
}

function backgroundLuminance(sample: MaterialSample): number {
  const source = alpha(sample.backgroundColor) > 0 ? sample.backgroundColor : sample.backgroundImage;
  const channels = source.match(/rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/)?.slice(1, 4).map(Number);
  if (!channels || channels.length !== 3) return Number.NaN;
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

const MATERIAL_EXPECTATIONS: Record<(typeof TARGETS)[number]['id'], Record<SurfaceName, SurfaceExpectation>> = {
  'deep-current': {
    shelf: { blur: 7.2, radii: [0, 0], shadow: false, tone: 'dark', translucent: true },
    utility: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true },
    workbench: { blur: 7.2, radii: [0, 0], shadow: false, tone: 'dark', translucent: true },
    dock: { blur: 7.2, radii: [0, 0], shadow: false, tone: 'dark', translucent: true },
    transcript: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true },
    composer: { blur: 7.2, radii: [0, 0], shadow: false, tone: 'dark', translucent: true },
    catalog: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true },
    dialog: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true },
    focused: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true },
    floating: { blur: 7.2, radii: [2, 2], shadow: true, tone: 'dark', translucent: true }
  },
  'pom-neutral': {
    shelf: { blur: 12, radii: [18, 10], shadow: true, tone: 'light', translucent: true },
    utility: { blur: 12, radii: [10, 10], shadow: true, tone: 'light', translucent: true },
    workbench: { blur: 12, radii: [12, 18], shadow: true, tone: 'light', translucent: true },
    dock: { blur: 12, radii: [16, 16], shadow: true, tone: 'light', translucent: true },
    transcript: { blur: 12, radii: [15, 15], shadow: true, tone: 'light', translucent: true },
    composer: { blur: 12, radii: [15, 15], shadow: true, tone: 'light', translucent: true },
    catalog: { blur: 12, radii: [18, 18], shadow: true, tone: 'light', translucent: true },
    dialog: { blur: 12, radii: [18, 18], shadow: true, tone: 'light', translucent: true },
    focused: { blur: 12, radii: [18, 18], shadow: true, tone: 'light', translucent: true },
    floating: { blur: 12, radii: [10, 10], shadow: true, tone: 'light', translucent: true }
  },
  bunny: {
    shelf: { blur: 4.8, radii: [24, 12], shadow: true, tone: 'light', translucent: true },
    utility: { blur: 4.8, radii: [12, 12], shadow: true, tone: 'light', translucent: true },
    workbench: { blur: 4.8, radii: [14, 26], shadow: true, tone: 'light', translucent: true },
    dock: { blur: 4.8, radii: [20, 20], shadow: true, tone: 'light', translucent: true },
    transcript: { blur: 4.8, radii: [18, 18], shadow: true, tone: 'light', translucent: true },
    composer: { blur: 4.8, radii: [18, 18], shadow: true, tone: 'light', translucent: true },
    catalog: { blur: 4.8, radii: [26, 26], shadow: true, tone: 'light', translucent: true },
    dialog: { blur: 4.8, radii: [26, 26], shadow: true, tone: 'light', translucent: true },
    focused: { blur: 4.8, radii: [26, 26], shadow: true, tone: 'light', translucent: true },
    floating: { blur: 4.8, radii: [17, 17], shadow: true, tone: 'light', translucent: true }
  }
};

function assertMaterial(target: (typeof TARGETS)[number], name: SurfaceName, sample: MaterialSample): void {
  const expected = MATERIAL_EXPECTATIONS[target.id][name];
  const label = `${target.label} ${name}`;
  expect(blurPx(sample.backdropFilter), `${label} blur`).toBeGreaterThanOrEqual(expected.blur);
  expect([radiusPx(sample.borderTopLeftRadius), radiusPx(sample.borderBottomRightRadius)], `${label} radii`).toEqual(expected.radii);
  expect(sample.boxShadow !== 'none', `${label} shadow`).toBe(expected.shadow);
  expect(alpha(sample.backgroundColor) < 1, `${label} translucency`).toBe(expected.translucent);
  const luminance = backgroundLuminance(sample);
  expect(Number.isFinite(luminance), `${label} background`).toBe(true);
  if (expected.tone === 'dark') expect(luminance, `${label} dark material`).toBeLessThan(80);
  else expect(luminance, `${label} light material`).toBeGreaterThan(180);
}

test('all visual targets render their configured layered frost', async ({ page }) => {
  await fresh(page);

  for (const target of TARGETS) {
    await selectTheme(page, target);

    const shelf = await material(page, '.top-shelf');
    const utility = await material(page, '.context-rail');
    const workbench = await material(page, '.workbench-shell');
    const dock = await material(page, '[data-conformance-region="left"]');
    const stage = await material(page, '[data-conformance-region="stage"]');
    const stageDecoration = await page.locator('[data-conformance-region="stage"]').evaluate((element) => getComputedStyle(element, '::after').backgroundImage);
    const root = await material(page, 'main');

    const shelfDepth = target.id === 'deep-current'
      ? await pseudoMaterial(page, '.top-shelf', '::before')
      : shelf;
    const configuredBlur = MATERIAL_EXPECTATIONS[target.id].shelf.blur;
    expect(blurPx(shelf.backdropFilter), `${target.label} shelf authority blur`).toBeCloseTo(configuredBlur, 1);
    expect(blurPx(shelfDepth.backdropFilter), `${target.label} visible shelf frost`).toBeCloseTo(configuredBlur, 1);
    expect(blurPx(utility.backdropFilter), `${target.label} utility blur`).toBeCloseTo(configuredBlur, 1);
    expect(Math.max(blurPx(workbench.backdropFilter), blurPx(dock.backdropFilter)), `${target.label} Workbench layer blur`).toBeCloseTo(configuredBlur, 1);
    expect(alpha(shelf.backgroundColor), `${target.label} shelf transparency`).toBeLessThan(1);
    expect(alpha(utility.backgroundColor), `${target.label} utility transparency`).toBeLessThan(1);
    expect(shelf.boxShadow !== 'none' || shelfDepth.boxShadow !== 'none', `${target.label} shelf depth`).toBe(true);
    expect(workbench.boxShadow !== 'none' || dock.backdropFilter !== 'none', `${target.label} Workbench depth`).toBe(true);
    expect(root.backgroundImage, `${target.label} dimensional canvas`).not.toBe('none');
    expect(stage.backgroundImage !== 'none' || stageDecoration !== 'none', `${target.label} stage canvas`).toBe(true);
    if (target.id === 'deep-current' || target.id === 'bunny') {
      expect(stage.backgroundImage, `${target.label} approved local stage image`).toContain('url(');
    }
  }
});

test('every named elevated surface exposes its material contract', async ({ page }) => {
  for (const target of TARGETS) {
    await fresh(page);
    await selectTheme(page, target);
    const samples = new Map<SurfaceName, MaterialSample>();
    for (const [name, selector] of [
      ['shelf', '.top-shelf'],
      ['utility', '.context-rail'],
      ['workbench', '.workbench-shell'],
      ['dock', '[data-conformance-region="left"]'],
      ['transcript', '.transcript'],
      ['composer', '.composer']
    ] as const) samples.set(name, await material(page, selector));

    await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
    samples.set('catalog', await material(page, '.widget-catalog'));
    await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Close Catalog' }).click();

    await page.getByRole('button', { name: 'Create Panel' }).click();
    samples.set('dialog', await material(page, 'dialog[open]:not(.focused-widget-dialog)'));
    await page.getByRole('dialog', { name: 'Create a Panel' }).getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' }).click();
    await expect(page.locator('.focused-widget-dialog')).toBeVisible();
    samples.set('focused', await material(page, '.focused-widget-dialog'));
    await page.getByRole('button', { name: 'Back to Workbench' }).click();

    await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Float' }).click();
    samples.set('floating', await material(page, '.widget-float .widget-frame'));

    for (const name of Object.keys(MATERIAL_EXPECTATIONS[target.id]) as SurfaceName[]) {
      assertMaterial(target, name, samples.get(name)!);
    }
  }
});

test('reduced transparency makes every glass surface opaque', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const reducedCatalog = await material(page, '.widget-catalog');
  expect(reducedCatalog.backdropFilter, '.widget-catalog blur').toBe('none');
  expect(reducedCatalog.backgroundImage, '.widget-catalog image').toBe('none');
  expect(alpha(reducedCatalog.backgroundColor), '.widget-catalog opacity').toBe(1);
  await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Close Catalog' }).click();
  await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' }).click();

  for (const selector of [
    '.top-shelf',
    '.context-rail',
    '.workbench-shell',
    '[data-conformance-region="left"]',
    '.widget-frame',
    '.transcript',
    '.composer',
    'dialog:not(.focused-widget-dialog)',
    '.focused-widget-dialog'
  ]) {
    const sample = await material(page, selector);
    expect(sample.backdropFilter, `${selector} blur`).toBe('none');
    expect(sample.backgroundImage, `${selector} image`).toBe('none');
    expect(alpha(sample.backgroundColor), `${selector} opacity`).toBe(1);
  }
});

test('theme changes preserve the live Workbench tree and focus', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  const initial = await root.evaluate((element) => ({
    panel: element.getAttribute('data-active-panel'),
    revision: element.getAttribute('data-workbench-revision'),
    widgets: [...element.querySelectorAll<HTMLElement>('[data-widget-type][data-pomegranate-placement]')].map((widget) => [
      widget.dataset.widgetType,
      widget.dataset.pomegranatePlacement,
      widget.dataset.pomegranateEdge ?? '',
      widget.dataset.pomegranateOrder ?? ''
    ].join('|'))
  }));

  for (const target of TARGETS) {
    await selectTheme(page, target);
    await expect.poll(() => root.evaluate((element) => ({
      panel: element.getAttribute('data-active-panel'),
      revision: element.getAttribute('data-workbench-revision'),
      widgets: [...element.querySelectorAll<HTMLElement>('[data-widget-type][data-pomegranate-placement]')].map((widget) => [
        widget.dataset.widgetType,
        widget.dataset.pomegranatePlacement,
        widget.dataset.pomegranateEdge ?? '',
        widget.dataset.pomegranateOrder ?? ''
      ].join('|'))
    }))).toEqual(initial);
  }
});

test('recovered material controls tune and retain each theme draft', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[2]);

  const themeLibrary = page.getByRole('article', { name: 'Theme Library' });
  await themeLibrary.getByText('Material controls', { exact: true }).click();
  const glass = themeLibrary.getByRole('slider', { name: 'Glass density' });
  const bars = themeLibrary.getByRole('slider', { name: 'Bar opacity' });
  const selected = themeLibrary.getByRole('slider', { name: 'Selected strength' });
  const frost = themeLibrary.getByRole('slider', { name: 'Frost level' });

  await expect(glass).toHaveValue('20');
  await expect(bars).toHaveValue('60');
  await expect(selected).toHaveValue('6');
  await expect(frost).toHaveValue('20');
  expect(alpha((await material(page, '.transcript')).backgroundColor)).toBeCloseTo(0.2, 2);
  expect(blurPx((await material(page, '.transcript')).backdropFilter)).toBeCloseTo(4.8, 1);

  await glass.fill('38');
  await frost.fill('45');
  await bars.fill('44');
  await selected.fill('18');
  await expect(themeLibrary.getByText('38%', { exact: true })).toBeVisible();
  await expect(themeLibrary.getByText('45%', { exact: true })).toBeVisible();
  expect(alpha((await material(page, '.transcript')).backgroundColor)).toBeCloseTo(0.38, 2);
  expect(blurPx((await material(page, '.transcript')).backdropFilter)).toBeCloseTo(10.8, 1);
  expect(alpha((await material(page, '.top-shelf')).backgroundColor)).toBeCloseTo(0.44, 2);
  expect(alpha((await material(page, '.widget-frame > header')).backgroundColor)).toBeCloseTo(0.44, 2);
  expect(alpha((await material(page, '.toolbar-resize-handle span')).backgroundColor)).toBeCloseTo(0.62, 2);
  expect(alpha((await material(page, '.surface-themes button[aria-pressed="true"]')).backgroundColor)).toBeCloseTo(0.18, 2);
  await expect.poll(() => page.locator('main').evaluate((root) => getComputedStyle(root).getPropertyValue('--pom-selected-strength').trim())).toBe('18%');

  await page.locator('.panel-tabs').getByRole('tab', { name: 'Library' }).click();
  expect(alpha((await material(page, '.surface-workspace nav button[aria-current="true"]')).backgroundColor)).toBeCloseTo(0.18, 2);
  expect(alpha((await material(page, '.surface-tree button.is-selected')).backgroundColor)).toBeCloseTo(0.18, 2);
  await page.locator('.panel-tabs').getByRole('tab', { name: 'Scene' }).click();
  await themeLibrary.getByText('Material controls', { exact: true }).click();

  await selectTheme(page, TARGETS[0]);
  await expect(glass).toHaveValue('30');
  await expect(frost).toHaveValue('30');
  await selectTheme(page, TARGETS[2]);
  await expect(glass).toHaveValue('38');
  await expect(frost).toHaveValue('45');

  await themeLibrary.getByRole('button', { name: 'Reset material controls' }).click();
  await expect(glass).toHaveValue('20');
  await expect(frost).toHaveValue('20');

  for (const control of [glass, bars, selected, frost]) await control.fill('0');
  expect(alpha((await material(page, '.transcript')).backgroundColor)).toBe(0);
  expect(alpha((await material(page, '.top-shelf')).backgroundColor)).toBe(0);
  expect(alpha((await material(page, '.widget-frame > header')).backgroundColor)).toBe(0);
  expect(alpha((await material(page, '.toolbar-resize-handle span')).backgroundColor)).toBeCloseTo(0.24, 2);
  expect(alpha((await material(page, '.surface-themes button[aria-pressed="true"]')).backgroundColor)).toBe(0);
  expect(blurPx((await material(page, '.transcript')).backdropFilter)).toBe(0);
  await page.locator('.panel-tabs').getByRole('tab', { name: 'Library' }).click();
  expect(alpha((await material(page, '.surface-workspace nav button[aria-current="true"]')).backgroundColor)).toBe(0);
  expect(alpha((await material(page, '.surface-tree button.is-selected')).backgroundColor)).toBe(0);
  await page.locator('.panel-tabs').getByRole('tab', { name: 'Scene' }).click();
  await themeLibrary.getByText('Material controls', { exact: true }).click();

  for (const control of [glass, bars, selected, frost]) await control.fill('100');
  expect(alpha((await material(page, '.transcript')).backgroundColor)).toBe(1);
  expect(alpha((await material(page, '.top-shelf')).backgroundColor)).toBe(1);
  expect(alpha((await material(page, '.widget-frame > header')).backgroundColor)).toBe(1);
  expect(alpha((await material(page, '.toolbar-resize-handle span')).backgroundColor)).toBe(1);
  expect(alpha((await material(page, '.surface-themes button[aria-pressed="true"]')).backgroundColor)).toBe(1);
  expect(blurPx((await material(page, '.transcript')).backdropFilter)).toBe(24);
  await page.locator('.panel-tabs').getByRole('tab', { name: 'Library' }).click();
  expect(alpha((await material(page, '.surface-workspace nav button[aria-current="true"]')).backgroundColor)).toBe(1);
  expect(alpha((await material(page, '.surface-tree button.is-selected')).backgroundColor)).toBe(1);
});

test('material controls retain 44px coarse-pointer targets', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await fresh(page, 1024, 900);
    const themeLibrary = page.getByRole('article', { name: 'Theme Library' });
    const disclosure = themeLibrary.getByText('Material controls', { exact: true });
    await disclosure.click();
    for (const control of [
      disclosure,
      themeLibrary.getByRole('slider', { name: 'Glass density' }),
      themeLibrary.getByRole('slider', { name: 'Bar opacity' }),
      themeLibrary.getByRole('slider', { name: 'Selected strength' }),
      themeLibrary.getByRole('slider', { name: 'Frost level' }),
      themeLibrary.getByRole('button', { name: 'Reset material controls' })
    ]) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  } finally {
    await context.close();
  }
});

test('all visual targets remain contained at the compact viewport', async ({ page }) => {
  await fresh(page, 390, 844);

  for (const target of TARGETS) {
    await selectTheme(page, target);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      root: document.querySelector('main')!.scrollWidth - document.querySelector('main')!.clientWidth
    }));
    expect(overflow, `${target.label} horizontal overflow`).toEqual({ document: 0, root: 0 });
  }
});
