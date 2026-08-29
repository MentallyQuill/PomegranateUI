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
  borderRadius: string;
  boxShadow: string;
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
      borderRadius: style.borderRadius,
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
      borderRadius: style.borderRadius,
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

test('all visual targets render meaningful layered frost', async ({ page }) => {
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
    expect(blurPx(shelf.backdropFilter), `${target.label} shelf authority blur`).toBeGreaterThanOrEqual(target.id === 'deep-current' ? 12 : 16);
    expect(blurPx(shelfDepth.backdropFilter), `${target.label} visible shelf frost`).toBeGreaterThanOrEqual(16);
    expect(blurPx(utility.backdropFilter), `${target.label} utility blur`).toBeGreaterThanOrEqual(16);
    expect(Math.max(blurPx(workbench.backdropFilter), blurPx(dock.backdropFilter)), `${target.label} Workbench layer blur`).toBeGreaterThanOrEqual(12);
    expect(alpha(shelf.backgroundColor), `${target.label} shelf transparency`).toBeLessThan(1);
    expect(alpha(utility.backgroundColor), `${target.label} utility transparency`).toBeLessThan(1);
    expect(shelf.boxShadow !== 'none' || shelfDepth.boxShadow !== 'none', `${target.label} shelf depth`).toBe(true);
    expect(workbench.boxShadow !== 'none' || dock.backdropFilter !== 'none', `${target.label} Workbench depth`).toBe(true);
    expect(root.backgroundImage, `${target.label} dimensional canvas`).not.toBe('none');
    expect(stage.backgroundImage !== 'none' || stageDecoration !== 'none', `${target.label} stage canvas`).toBe(true);
    if (target.id === 'deep-current') {
      expect(stage.backgroundImage, 'Deep Current approved local stage image').toContain('url(');
    }
    expect(shelf.borderRadius, `${target.label} authored geometry`).toBeTruthy();
  }
});

test('every named elevated surface exposes its material contract', async ({ page }) => {
  await fresh(page);

  const structuralSurfaces = [
    { label: 'utility', selector: '.context-rail', minimumBlur: 16 },
    { label: 'dock', selector: '[data-conformance-region="left"]', minimumBlur: 12 },
    { label: 'transcript', selector: '.transcript', minimumBlur: 12 },
    { label: 'composer', selector: '.composer', minimumBlur: 12 }
  ] as const;

  for (const target of TARGETS) {
    await selectTheme(page, target);
    for (const surface of structuralSurfaces) {
      const sample = await material(page, surface.selector);
      expect(blurPx(sample.backdropFilter), `${target.label} ${surface.label} blur`).toBeGreaterThanOrEqual(surface.minimumBlur);
      expect(alpha(sample.backgroundColor), `${target.label} ${surface.label} translucency`).toBeLessThan(1);
      expect(sample.backgroundColor !== 'rgba(0, 0, 0, 0)' || sample.backgroundImage !== 'none', `${target.label} ${surface.label} material`).toBe(true);
      expect(sample.borderRadius, `${target.label} ${surface.label} geometry`).toBeTruthy();
    }

    await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
    const catalog = await material(page, '.widget-catalog');
    const panelDialog = await material(page, 'dialog');
    for (const [label, sample] of [['Catalog', catalog], ['dialog', panelDialog]] as const) {
      expect(blurPx(sample.backdropFilter), `${target.label} ${label} blur`).toBeGreaterThanOrEqual(16);
      expect(alpha(sample.backgroundColor), `${target.label} ${label} translucency`).toBeLessThan(1);
      expect(sample.boxShadow, `${target.label} ${label} depth`).not.toBe('none');
    }
    await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Close Catalog' }).click();
  }

  await fresh(page);
  await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' }).click();
  await expect(page.locator('.focused-widget-dialog')).toBeVisible();
  const focused = await material(page, '.focused-widget-dialog');
  expect(blurPx(focused.backdropFilter), 'focused Widget blur').toBeGreaterThanOrEqual(16);
  expect(alpha(focused.backgroundColor), 'focused Widget translucency').toBeLessThan(1);
  expect(focused.boxShadow, 'focused Widget depth').not.toBe('none');

  await page.getByRole('button', { name: 'Back to Workbench' }).click();
  await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Float' }).click();
  const floating = await material(page, '.widget-float .widget-frame');
  expect(blurPx(floating.backdropFilter), 'floating Widget blur').toBeGreaterThanOrEqual(12);
  expect(alpha(floating.backgroundColor), 'floating Widget translucency').toBeLessThan(1);
  expect(floating.boxShadow, 'floating Widget depth').not.toBe('none');
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
