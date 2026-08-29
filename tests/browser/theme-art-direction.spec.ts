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
  return page.locator(selector).evaluate((element) => {
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
    const root = await material(page, 'main');

    expect(blurPx(shelf.backdropFilter), `${target.label} shelf blur`).toBeGreaterThanOrEqual(16);
    expect(blurPx(utility.backdropFilter), `${target.label} utility blur`).toBeGreaterThanOrEqual(16);
    expect(blurPx(workbench.backdropFilter), `${target.label} Workbench blur`).toBeGreaterThanOrEqual(12);
    expect(alpha(shelf.backgroundColor), `${target.label} shelf transparency`).toBeLessThan(1);
    expect(alpha(utility.backgroundColor), `${target.label} utility transparency`).toBeLessThan(1);
    expect(shelf.boxShadow, `${target.label} shelf depth`).not.toBe('none');
    expect(workbench.boxShadow, `${target.label} Workbench depth`).not.toBe('none');
    expect(root.backgroundImage, `${target.label} dimensional canvas`).not.toBe('none');
    expect(shelf.borderRadius, `${target.label} authored geometry`).not.toBe('0px');
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
