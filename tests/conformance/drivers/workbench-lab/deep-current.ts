import type { Locator, Page } from '@playwright/test';

import { ConformanceError, type RegionMeasurement, type ShellMeasurement, type ShellRegionId } from '../../types.ts';

const layoutKey = 'pomegranate-ui.workbench-lab.layout.v1';
const themeKey = 'pomegranate-ui.workbench-lab.theme.v1';
const regionSelectors: Readonly<Record<ShellRegionId, string>> = Object.freeze({
  shelf: '[data-conformance-region="shelf"]',
  left: '[data-conformance-region="left"]',
  stage: '[data-conformance-region="stage"]',
  right: '[data-conformance-region="right"]',
  composer: '[data-conformance-region="composer"]'
});

async function settle(locator: Locator): Promise<void> {
  await locator.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

export async function prepareDeepCurrentState(page: Page, labOrigin: string): Promise<void> {
  try {
    await page.goto(labOrigin, { waitUntil: 'load' });
    await page.evaluate(({ savedLayoutKey, savedThemeKey }) => {
      window.localStorage.removeItem(savedLayoutKey);
      window.localStorage.removeItem(savedThemeKey);
    }, { savedLayoutKey: layoutKey, savedThemeKey: themeKey });
    await page.reload({ waitUntil: 'load' });
    const root = page.locator('main[data-pom-theme="deep-current"]');
    await root.waitFor({ state: 'visible' });
    await settle(root);
    for (const selector of Object.values(regionSelectors)) {
      await page.locator(selector).waitFor({ state: 'visible' });
    }
  } catch (cause) {
    throw new ConformanceError(
      'IMPLEMENTATION_SETUP_FAILED',
      'The Workbench Lab did not reach its Deep Current scene-ready state.',
      { cause: cause instanceof Error ? cause.message : String(cause) }
    );
  }
}

async function measureRegion(locator: Locator): Promise<RegionMeasurement> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        right: box.right,
        bottom: box.bottom
      },
      visible: box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0,
      overflow: {
        x: element.scrollWidth > element.clientWidth,
        y: element.scrollHeight > element.clientHeight,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      },
      styles: {
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        color: style.color,
        fontFamily: style.fontFamily,
        backdropFilter: style.backdropFilter
      }
    };
  });
}

export async function measureLabShell(page: Page): Promise<ShellMeasurement> {
  try {
    const entries = await Promise.all(Object.entries(regionSelectors).map(async ([id, selector]) => (
      [id, await measureRegion(page.locator(selector))] as const
    )));
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('The Playwright page has no viewport.');
    const documentMeasurement = await page.locator('html').evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    return {
      viewport,
      regions: Object.fromEntries(entries) as Readonly<Record<ShellRegionId, RegionMeasurement>>,
      document: documentMeasurement
    };
  } catch (cause) {
    throw new ConformanceError(
      'MEASUREMENT_FAILED',
      'The Workbench Lab shell could not be measured.',
      { driver: 'implementation', cause: cause instanceof Error ? cause.message : String(cause) }
    );
  }
}
