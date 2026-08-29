import { expect, test, type Page } from '@playwright/test';

const TARGETS = [
  { id: 'deep-current', label: 'Deep Current' },
  { id: 'pom-neutral', label: 'PomOS' },
  { id: 'bunny', label: 'Bunny' }
] as const;

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
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: target.label, exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', target.id);
}

type MaterialSample = {
  readonly alpha: number;
  readonly backdrop: string;
  readonly borderRadius: string;
  readonly borderWidth: string;
  readonly boxShadow: string;
  readonly clipPath: string;
};

async function material(page: Page, selector: string): Promise<MaterialSample> {
  return page.locator(selector).first().evaluate((element) => {
    const style = getComputedStyle(element);
    const match = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    return {
      alpha: match.length === 4 ? match[3]! : 1,
      backdrop: style.backdropFilter,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      clipPath: style.clipPath
    };
  });
}

function blurPx(filter: string): number {
  return Number(filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0);
}

test('the canvas remains behind every interactive Workbench surface', async ({ page }) => {
  await fresh(page);

  await expect(page.locator('[data-pomegranate-floating-layer]')).not.toHaveAttribute('data-pom-part');

  for (const target of TARGETS) {
    await selectTheme(page, target);
    await expect.poll(() => page.locator('[data-pom-canvas-root]').evaluate((canvas) => Number(getComputedStyle(canvas).zIndex)))
      .toBeLessThan(0);
    const widget = page.getByRole('article', { name: 'Characters (Story)' });
    const box = await widget.boundingBox();
    expect(box, `${target.label} widget bounds`).not.toBeNull();
    const painted = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return {
        canvas: element?.closest('[data-pom-canvas-root]') !== null,
        widget: element?.closest('[data-pomegranate-widget]')?.getAttribute('data-pomegranate-widget') ?? null
      };
    }, { x: box!.x + box!.width / 2, y: box!.y + 24 });
    expect(painted.canvas, `${target.label} canvas interception`).toBe(false);
    expect(painted.widget, `${target.label} visible Widget`).toBe('scene-characters');
  }
});

test('composition metadata and icon art survive data-only theme compilation', async ({ page }) => {
  await fresh(page);

  for (const target of TARGETS) {
    await selectTheme(page, target);
    const root = page.locator('main');
    await expect(root).toHaveAttribute('data-pom-widget-grouping', /^(individual|unified)$/);
    await expect(root).toHaveAttribute('data-pom-chrome-presentation', /^(compact|overlay|full)$/);
    await expect(root).toHaveAttribute('data-pom-action-presentation', /^(compact|hover-focus|full)$/);
    const image = await page.getByRole('article', { name: 'Characters (Story)' })
      .getByRole('button', { name: 'Drag Widget' })
      .evaluate((button) => getComputedStyle(button).backgroundImage);
    expect(image, `${target.label} icon image`).toContain('url(');
    const pseudoContent = await page.getByRole('article', { name: 'Characters (Story)' })
      .locator('header')
      .evaluate((header) => [getComputedStyle(header, '::before').content, getComputedStyle(header, '::after').content]);
    expect(pseudoContent, `${target.label} decorative stoplights`).toEqual(['none', 'none']);
  }
});

test('PomOS is a seamless continuous-rounded blue glass composition', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[1]);

  await expect(page.locator('[data-pom-canvas-layer]')).toHaveCount(6);
  const root = page.locator('main');
  await expect(root).toHaveAttribute('data-pom-widget-grouping', 'individual');
  await expect(root).toHaveAttribute('data-pom-chrome-presentation', 'overlay');
  await expect(root).toHaveAttribute('data-pom-action-presentation', 'hover-focus');

  for (const selector of ['.workbench-shell', '[data-conformance-region="left"]', '[data-conformance-region="right"]']) {
    const sample = await material(page, selector);
    expect(sample.alpha, `${selector} fill`).toBe(0);
    expect(blurPx(sample.backdrop), `${selector} blur`).toBe(0);
    expect(sample.borderWidth, `${selector} border`).toBe('0px');
    expect(sample.boxShadow, `${selector} shadow`).toBe('none');
    expect(sample.clipPath, `${selector} clipping`).toBe('none');
  }

  const widget = await material(page, '[data-conformance-region="left"] .widget-frame');
  expect(widget.alpha).toBeCloseTo(0.42, 2);
  expect(blurPx(widget.backdrop)).toBe(28);
  expect(widget.borderRadius).toBe('18px');
  expect(widget.boxShadow).not.toBe('none');
  for (const selector of [
    '[data-conformance-region="left"] .widget-frame > header',
    '[data-conformance-region="left"] .widget-frame > [data-pom-part="widget.content"]'
  ]) {
    const child = await material(page, selector);
    expect(blurPx(child.backdrop), `${selector} duplicate blur`).toBe(0);
    expect(child.borderWidth, `${selector} artifact edge`).toBe('0px');
    expect(child.boxShadow, `${selector} bevel`).toBe('none');
  }

  for (const edge of ['left', 'right']) {
    const handle = page.locator(`[data-dock-resizer="${edge}"]`);
    await expect(handle).not.toHaveAttribute('data-pom-part');
    await expect(handle.locator('span')).toHaveAttribute('data-pom-part', 'separator');
    const hitSurface = await material(page, `[data-dock-resizer="${edge}"]`);
    expect(hitSurface.alpha, `${edge} resize hit surface`).toBe(0);
    expect(hitSurface.borderWidth, `${edge} resize artifact`).toBe('0px');
  }

  const factRows = page.getByRole('article', { name: 'World State' }).locator('.surface-facts > div');
  expect(await factRows.count()).toBeGreaterThan(1);
  for (const row of await factRows.all()) {
    await expect(row).toHaveAttribute('data-pom-part', 'row.surface');
    expect(await row.evaluate((element) => getComputedStyle(element).borderRadius)).not.toBe('0px');
  }

  const worldWindow = page.getByRole('article', { name: 'World State' });
  const unusedTail = await worldWindow.evaluate((article) => {
    const content = article.querySelector('.surface-facts')!;
    return article.getBoundingClientRect().bottom - content.getBoundingClientRect().bottom;
  });
  expect(unusedTail, 'individual window dead space').toBeLessThanOrEqual(32);

  for (const target of TARGETS.slice(1)) {
    await selectTheme(page, target);
    const rightDock = page.locator('[data-conformance-region="right"]');
    const rightDockBox = await rightDock.boundingBox();
    const finalRightWidgetBox = await rightDock.getByRole('article').last().boundingBox();
    expect(rightDockBox).not.toBeNull();
    expect(finalRightWidgetBox).not.toBeNull();
    expect(
      finalRightWidgetBox!.y + finalRightWidgetBox!.height,
      `${target.label} right-stack widgets stay inside their dock`,
    ).toBeLessThanOrEqual(rightDockBox!.y + rightDockBox!.height + 1);
  }
});

test('unified compositions allocate rail space to functional content', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[0]);

  const ambience = page.getByRole('article', { name: 'Room Ambience' });
  const action = ambience.getByRole('button', { name: 'Pause ambience' });
  const ambienceBox = await ambience.boundingBox();
  const actionBox = await action.boundingBox();
  expect(ambienceBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(actionBox!.y + actionBox!.height, 'ambience action stays inside its assigned unified row')
    .toBeLessThanOrEqual(ambienceBox!.y + ambienceBox!.height + 1);
});

test('each target keeps one glass owner per Widget and a seamless structural dock', async ({ page }) => {
  await fresh(page);
  for (const target of TARGETS) {
    await selectTheme(page, target);
    const dock = await material(page, '[data-conformance-region="left"]');
    const widget = await material(page, '[data-conformance-region="left"] .widget-frame');
    const header = await material(page, '[data-conformance-region="left"] .widget-frame > header');
    const content = await material(page, '[data-conformance-region="left"] .widget-frame > [data-pom-part="widget.content"]');
    expect(dock.alpha, `${target.label} dock fill`).toBe(0);
    expect(blurPx(dock.backdrop), `${target.label} dock blur`).toBe(0);
    expect(blurPx(widget.backdrop), `${target.label} Widget blur`).toBeGreaterThan(0);
    expect(widget.alpha, `${target.label} Widget alpha`).toBeGreaterThan(0);
    expect(widget.alpha, `${target.label} Widget translucency`).toBeLessThan(1);
    expect(blurPx(header.backdrop), `${target.label} header duplicate blur`).toBe(0);
    expect(blurPx(content.backdrop), `${target.label} content duplicate blur`).toBe(0);
  }
});

test('material controls have refined geometry and visibly control glass', async ({ page }) => {
  for (const target of TARGETS) {
    await fresh(page);
    await selectTheme(page, target);
    const library = page.getByRole('article', { name: 'Theme Library' });
    await library.getByText('Material controls', { exact: true }).click();
    const glass = library.getByRole('slider', { name: 'Glass density' });
    const frost = library.getByRole('slider', { name: 'Frost level' });
    const geometry = await glass.evaluate((input) => {
      const root = input.closest('[data-pom-theme-root]')!;
      const style = getComputedStyle(root);
      return {
        height: input.getBoundingClientRect().height,
        track: Number.parseFloat(style.getPropertyValue('--pom-control-slider-track-size')),
        thumb: Number.parseFloat(style.getPropertyValue('--pom-control-slider-thumb-size')),
        hit: Number.parseFloat(style.getPropertyValue('--pom-control-slider-hit-size'))
      };
    });
    expect(geometry.track).toBeGreaterThanOrEqual(3);
    expect(geometry.track).toBeLessThanOrEqual(4);
    expect(geometry.thumb).toBeGreaterThanOrEqual(10);
    expect(geometry.thumb).toBeLessThanOrEqual(12);
    expect(geometry.hit).toBeGreaterThanOrEqual(44);
    expect(geometry.height).toBeGreaterThanOrEqual(geometry.hit);

    await glass.fill('0');
    await frost.fill('0');
    expect((await material(page, '[data-conformance-region="left"] .widget-frame')).alpha).toBe(0);
    expect(blurPx((await material(page, '[data-conformance-region="left"] .widget-frame')).backdrop)).toBe(0);
    await glass.fill('100');
    await frost.fill('100');
    expect((await material(page, '[data-conformance-region="left"] .widget-frame')).alpha).toBe(1);
    expect(blurPx((await material(page, '[data-conformance-region="left"] .widget-frame')).backdrop)).toBe(40);
  }
});

test('reduced transparency selects an opaque no-blur semantic fallback', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await fresh(page);
  await selectTheme(page, TARGETS[1]);
  for (const selector of ['.top-shelf', '.context-rail', '[data-conformance-region="left"] .widget-frame']) {
    const sample = await material(page, selector);
    expect(sample.alpha, `${selector} opacity`).toBe(1);
    expect(blurPx(sample.backdrop), `${selector} blur`).toBe(0);
  }
});

test('focused and floating compositions retain exactly one elevated material owner', async ({ page }) => {
  await fresh(page);
  await selectTheme(page, TARGETS[1]);
  const world = page.getByRole('article', { name: 'World State' });

  await world.getByRole('button', { name: 'Focus Widget' }).click();
  const dialog = await material(page, '.focused-widget-dialog');
  expect(blurPx(dialog.backdrop)).toBeGreaterThan(0);
  const focusedFrame = page.locator('.focused-widget-dialog .widget-frame');
  await expect(focusedFrame).not.toHaveAttribute('data-pom-part');
  expect(blurPx((await material(page, '.focused-widget-dialog .widget-frame')).backdrop)).toBe(0);
  await page.getByRole('button', { name: 'Back to Workbench' }).click();

  await world.getByRole('button', { name: 'Float' }).click();
  const floatingWrapper = page.locator('.widget-float');
  await expect(floatingWrapper).not.toHaveAttribute('data-pom-part');
  const floatingFrame = floatingWrapper.locator('.widget-frame');
  await expect(floatingFrame).toHaveAttribute('data-pom-part', 'floating.surface');
  expect(blurPx((await material(page, '.widget-float .widget-frame')).backdrop)).toBeGreaterThan(0);
});

test('theme changes retain the Workbench tree and keyboard focus', async ({ page }) => {
  await fresh(page);
  const root = page.locator('main');
  const before = await root.evaluate((element) => ({
    revision: element.getAttribute('data-workbench-revision'),
    widgets: [...element.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }));
  for (const target of TARGETS) {
    await selectTheme(page, target);
    await expect(page.getByRole('button', { name: target.label, exact: true })).toBeFocused();
    expect(await root.evaluate((element) => ({
      revision: element.getAttribute('data-workbench-revision'),
      widgets: [...element.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
    }))).toEqual(before);
  }
});

test('all target compositions remain horizontally contained across wide, compact, and phone viewports', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await fresh(page, viewport.width, viewport.height);
    for (const target of TARGETS) {
      await selectTheme(page, target);
      expect(await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        root: document.querySelector('main')!.scrollWidth - document.querySelector('main')!.clientWidth
      })), `${target.label} at ${viewport.width}`).toEqual({ document: 0, root: 0 });
    }
  }
});
