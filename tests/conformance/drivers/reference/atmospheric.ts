import type { FrameLocator, Locator, Page } from '@playwright/test';

import { measureFidelitySurface } from '../../measurements.ts';
import { ConformanceError, type FidelityMeasurement, type RegionMeasurement, type ShellMeasurement, type ShellRegionId } from '../../types.ts';

const previewPath = '/prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration-preview.html';
const calibrationPath = './sonder-workbench-calibration.html?test=1';
const persistenceKey = 'sonder.mock.panels.v1';
const frameTitle = 'Sonder Workbench Calibration';
const regionSelectors: Readonly<Record<ShellRegionId, string>> = Object.freeze({
  shelf: '.sonder-topbar',
  left: '.sonder-dock-left',
  stage: '.sonder-scene',
  right: '.sonder-dock-right',
  composer: '.sonder-composer'
});

async function settle(locator: Locator): Promise<void> {
  await locator.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

function referenceFrame(page: Page): FrameLocator {
  return page.frameLocator(`iframe[title="${frameTitle}"]`);
}

export async function prepareAtmosphericState(page: Page, preservationOrigin: string): Promise<void> {
  try {
    await page.goto(`${preservationOrigin}${previewPath}`, { waitUntil: 'load' });
    const frame = referenceFrame(page);
    const root = frame.locator('#sonder-calibration');
    await root.waitFor({ state: 'attached' });
    await root.evaluate((element, setup) => {
      window.localStorage.removeItem(setup.persistenceKey);
      const ownerFrame = element.ownerDocument.defaultView?.frameElement;
      ownerFrame?.setAttribute('src', setup.calibrationPath);
    }, { calibrationPath, persistenceKey });
    await root.waitFor({ state: 'attached' });
    await settle(root);
    for (const selector of Object.values(regionSelectors)) {
      await frame.locator(selector).waitFor({ state: 'visible' });
    }
  } catch (cause) {
    throw new ConformanceError(
      'REFERENCE_SETUP_FAILED',
      'The Atmospheric Workbench did not reach its scene-ready state.',
      { cause: cause instanceof Error ? cause.message : String(cause) }
    );
  }
}

async function measureRegion(locator: Locator, offset: { x: number; y: number }): Promise<RegionMeasurement> {
  return locator.evaluate((element, frameOffset) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      box: {
        x: box.x + frameOffset.x,
        y: box.y + frameOffset.y,
        width: box.width,
        height: box.height,
        right: box.right + frameOffset.x,
        bottom: box.bottom + frameOffset.y
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
  }, offset);
}

export async function measureAtmosphericShell(page: Page): Promise<ShellMeasurement> {
  try {
    const frameElement = page.locator(`iframe[title="${frameTitle}"]`);
    const frameBox = await frameElement.boundingBox();
    if (!frameBox) throw new Error('The calibration iframe has no rendered box.');
    const frame = referenceFrame(page);
    const offset = { x: frameBox.x, y: frameBox.y };
    const entries = await Promise.all(Object.entries(regionSelectors).map(async ([id, selector]) => (
      [id, await measureRegion(frame.locator(selector), offset)] as const
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
      'The Atmospheric Workbench shell could not be measured.',
      { driver: 'reference', cause: cause instanceof Error ? cause.message : String(cause) }
    );
  }
}

export async function measureAtmosphericFidelity(page: Page): Promise<FidelityMeasurement> {
  const frame = referenceFrame(page);
  return measureFidelitySurface((selector) => frame.locator(selector), {
    root: '#sonder-calibration',
    geometry: {
      header: '.sonder-topbar',
      left: '.sonder-dock-left',
      stage: '.sonder-scene',
      right: '.sonder-dock-right',
      story: '.sonder-transcript',
      composer: '.sonder-composer',
      floating: '.sonder-floating-layer > .sonder-module',
      widgetShelf: '.sonder-widget-shelf'
    },
    typography: {
      wordmark: '.sonder-wordmark',
      navigation: '.sonder-panel-tabs button',
      widgetTitle: '.sonder-module-title',
      technical: '.sonder-module-meta',
      storyHeading: '.sonder-story-title',
      storyBody: '.sonder-prose',
      composer: '.sonder-composer-field'
    },
    materials: {
      header: '.sonder-topbar',
      widget: '.sonder-module',
      widgetHeader: '.sonder-module-head',
      storyVeil: '.sonder-transcript',
      composer: '.sonder-composer',
      floating: '.sonder-floating-layer > .sonder-module',
      dialog: '.sonder-widget-shelf'
    },
    panelTabs: '.sonder-panel-tabs [role="tab"]',
    widgets: '[data-widget-id]'
  });
}
