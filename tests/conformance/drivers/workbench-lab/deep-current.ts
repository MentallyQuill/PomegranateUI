import type { Locator, Page } from '@playwright/test';

import { measureFidelitySurface } from '../../measurements.ts';
import { ConformanceError, type FidelityMeasurement, type RegionMeasurement, type ShellMeasurement, type ShellRegionId } from '../../types.ts';

const layoutKey = 'pomegranate-ui.workbench-lab.layout.v1';
const themeKey = 'pomegranate-ui.workbench-lab.theme.v1';
const regionSelectors: Readonly<Record<ShellRegionId, string>> = Object.freeze({
  shelf: '[data-conformance-region="shelf"]',
  left: '[data-conformance-region="left"]',
  stage: '[data-conformance-region="stage"]',
  right: '[data-conformance-region="right"]',
  composer: '[data-pomegranate-region-surface="composer"] .composer'
});
export const VISIBLE_IMPLEMENTATION_REGION_IDS: readonly ShellRegionId[] = Object.freeze([
  'shelf',
  'stage',
  'composer'
]);

export const DEEP_RECORDING_IMPLEMENTATION_STATES = Object.freeze([
  'deep-base-scene',
  'deep-floating-connections',
  'deep-right-stack',
  'deep-widget-shelf',
  'deep-restored-theme-tab',
  'deep-canvas-ink',
  'deep-control-chrome',
  'deep-ambient-chrome',
  'deep-interface-text',
  'deep-muted-chrome'
] as const);

async function settle(locator: Locator): Promise<void> {
  await locator.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      try { animation.finish(); } catch { /* Infinite host motion remains governed by its own policy. */ }
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

async function applyPreservedMaterialState(page: Page, root: Locator): Promise<void> {
  await page.getByRole('tab', { name: 'Settings' }).click();
  for (const [name, value] of [
    ['Glass Density', '20'],
    ['Bar Opacity', '60'],
    ['Selected Strength', '6'],
    ['Frost Level', '50']
  ] as const) {
    await page.getByRole('slider', { name, includeHidden: true }).evaluate((input, nextValue) => {
      if (!(input instanceof HTMLInputElement)) throw new Error(`${nextValue} material control is not an input.`);
      input.value = nextValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }
  await page.getByRole('tab', { name: 'Scene' }).click();
  const materialState = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      glass: style.getPropertyValue('--pom-material-widget').trim(),
      bars: style.getPropertyValue('--pom-material-shelf').trim(),
      selected: style.getPropertyValue('--pom-part-button-surface-state-selected-fill').trim(),
      frost: style.getPropertyValue('--pom-material-widget-blur').trim()
    };
  });
  if (JSON.stringify(materialState) !== JSON.stringify({
    glass: 'rgba(16, 25, 26, 0.2)',
    bars: 'rgba(11, 18, 19, 0.6)',
    selected: 'rgba(36, 76, 74, 0.06)',
    frost: '20px'
  })) {
    throw new Error(`Preserved Deep Current material setup did not apply: ${JSON.stringify(materialState)}.`);
  }
}

async function widgetAction(page: Page, title: string, action: string): Promise<void> {
  const widget = page.getByRole('article', { name: title });
  await widget.waitFor({ state: 'visible' });
  await widget.hover();
  await widget.getByRole('button', { name: action }).click();
}

async function activateGroupedWidget(page: Page, title: string): Promise<void> {
  const tab = page.getByRole('tab', { name: title });
  if (await tab.count()) await tab.click();
}

async function buildSceneEffectsPersonaGroup(page: Page): Promise<void> {
  await activateGroupedWidget(page, 'AI Connections');
  await widgetAction(page, 'AI Connections', 'Dock right');
  await widgetAction(page, 'Personas', 'Group with previous Widget');
}

async function prepareRecordingLayout(page: Page, state: string): Promise<void> {
  if (state === 'deep-floating-connections') {
    await activateGroupedWidget(page, 'AI Connections');
    await widgetAction(page, 'AI Connections', 'Float');
    await widgetAction(page, 'Personas', 'Group with previous Widget');
    await activateGroupedWidget(page, 'Personas');
    const floating = page.getByRole('article', { name: 'AI Connections' });
    const drag = floating.getByRole('button', { name: 'Drag Widget' });
    const box = await drag.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 1070, box.y + 150, { steps: 4 });
      await page.mouse.up();
    }
    return;
  }
  if (state === 'deep-right-stack') {
    await widgetAction(page, 'Characters', 'Dock right');
    await activateGroupedWidget(page, 'AI Connections');
    await widgetAction(page, 'AI Connections', 'Dock right');
    await widgetAction(page, 'Personas', 'Group with previous Widget');
    await widgetAction(page, 'Characters', 'Group with previous Widget');
    await activateGroupedWidget(page, 'Characters');
    return;
  }
  if (state === 'deep-widget-shelf') {
    await buildSceneEffectsPersonaGroup(page);
    await widgetAction(page, 'Custom Theme', 'Move to Widget Shelf');
    await page.locator('[data-widget-shelf] > summary').click();
    return;
  }
  if (state === 'deep-restored-theme-tab') {
    await activateGroupedWidget(page, 'AI Connections');
    await widgetAction(page, 'AI Connections', 'Move to Widget Shelf');
    await widgetAction(page, 'Personas', 'Group with previous Widget');
    await widgetAction(page, 'Custom Theme', 'Group with previous Widget');
    await activateGroupedWidget(page, 'Custom Theme');
  }
}

async function editCompactColor(page: Page, role: string, hex: string, keepOpen = false): Promise<void> {
  await page.getByRole('button', { name: role, exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Hex color' });
  await input.fill(hex);
  if (!keepOpen) await page.getByRole('button', { name: 'Back to theme overview' }).click();
}

async function setCompactSlider(page: Page, name: string, value: number): Promise<void> {
  await page.getByRole('slider', { name, includeHidden: true }).evaluate((input, nextValue) => {
    if (!(input instanceof HTMLInputElement)) throw new Error(`${nextValue} is not a slider input.`);
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function setAmbientPosition(page: Page, x: number, y: number): Promise<void> {
  await page.getByRole('application', { name: 'Ambient position' }).evaluate((element, position) => {
    const box = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: box.left + box.width * position.x,
      clientY: box.top + box.height * position.y
    }));
  }, { x, y });
}

async function prepareRecordingAuthoring(page: Page, state: string): Promise<void> {
  if (!state.startsWith('deep-') || !['deep-canvas-ink', 'deep-control-chrome', 'deep-ambient-chrome', 'deep-interface-text', 'deep-muted-chrome'].includes(state)) return;
  if (state === 'deep-canvas-ink') {
    await editCompactColor(page, 'Canvas', '#266c83', true);
    await setAmbientPosition(page, 0.68, 0.38);
    await setCompactSlider(page, 'Radius', 42);
    await setCompactSlider(page, 'Power', 64);
    return;
  }

  await editCompactColor(page, 'Canvas', '#266c83');
  if (state === 'deep-control-chrome') {
    await editCompactColor(page, 'Chrome', '#360308', true);
    await setAmbientPosition(page, 0.68, 0.38);
    await setCompactSlider(page, 'Radius', 42);
    await setCompactSlider(page, 'Power', 64);
    return;
  }

  await editCompactColor(page, 'Chrome', '#360308');
  await editCompactColor(page, 'Ambient', '#84008e');
  await setAmbientPosition(page, state === 'deep-ambient-chrome' ? 0.74 : 0.57, state === 'deep-ambient-chrome' ? 0.53 : 0.97);
  for (const [name, value] of [['Glass Density', 20], ['Bar Opacity', 60], ['Selected Strength', 6], ['Frost Level', 50]] as const) {
    await setCompactSlider(page, name, value);
  }
  await setCompactSlider(page, 'Radius', state === 'deep-muted-chrome' ? 60 : 42);
  await setCompactSlider(page, 'Power', 56);
  if (state === 'deep-ambient-chrome') return;

  if (state === 'deep-interface-text') {
    await editCompactColor(page, 'Text', '#f30079', true);
    return;
  }
  await editCompactColor(page, 'Text', '#f30079');
  await editCompactColor(page, 'Ambient', '#84008e', true);
}

export async function prepareDeepCurrentState(page: Page, labOrigin: string, implementationState = 'scene-ready'): Promise<void> {
  try {
    await page.goto(labOrigin, { waitUntil: 'load' });
    await page.evaluate(({ savedLayoutKey, savedThemeKey }) => {
      window.localStorage.removeItem(savedLayoutKey);
      window.localStorage.removeItem(savedThemeKey);
    }, { savedLayoutKey: layoutKey, savedThemeKey: themeKey });
    await page.reload({ waitUntil: 'load' });
    const root = page.locator('main[data-pom-theme="deep-current"]');
    await root.waitFor({ state: 'visible' });
    if (implementationState === 'scene-ready') await applyPreservedMaterialState(page, root);
    else {
      await prepareRecordingLayout(page, implementationState);
      await prepareRecordingAuthoring(page, implementationState);
    }
    await settle(root);
    for (const selector of Object.values(regionSelectors)) {
      await page.locator(selector).waitFor({ state: 'attached' });
    }
    for (const id of VISIBLE_IMPLEMENTATION_REGION_IDS) {
      await page.locator(regionSelectors[id]).waitFor({ state: 'visible' });
    }
  } catch (cause) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    throw new ConformanceError(
      'IMPLEMENTATION_SETUP_FAILED',
      `The Workbench Lab did not reach its Deep Current scene-ready state: ${causeMessage}`,
      { cause: causeMessage }
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

export async function measureLabFidelity(page: Page, initialIdentity?: string): Promise<FidelityMeasurement> {
  const root = page.locator('main[data-pom-theme="deep-current"]');
  const currentIdentity = await root.getAttribute('data-active-panel');
  return measureFidelitySurface((selector) => page.locator(selector), {
    root: 'main[data-pom-theme="deep-current"]',
    geometry: {
      header: '.top-shelf',
      left: '[data-conformance-region="left"]',
      stage: '[data-conformance-region="stage"]',
      right: '[data-conformance-region="right"]',
      story: '[data-widget-type="story.transcript"] .transcript',
      composer: '[data-pomegranate-region-surface="composer"] .composer',
      floating: '[data-pomegranate-floating-layer] > [data-widget-type]',
      widgetShelf: '[data-widget-shelf][open]'
    },
    typography: {
      wordmark: '.wordmark',
      navigation: '.panel-tabs [role="tab"]',
      widgetTitle: '[data-pom-part="widget.header"]',
      technical: '.widget-kicker',
      storyHeading: '[data-widget-type="story.transcript"] blockquote',
      storyBody: '[data-widget-type="story.transcript"] .transcript > p:not(.widget-kicker)',
      composer: '[data-pomegranate-region-surface="composer"] textarea'
    },
    materials: {
      header: '.top-shelf',
      widget: '[data-pom-part="widget.surface"]',
      widgetHeader: '[data-pom-part="widget.header"]',
      storyVeil: '[data-widget-type="story.transcript"]',
      composer: '[data-pomegranate-region-surface="composer"] .composer',
      floating: '[data-pom-part="floating.surface"]',
      dialog: 'dialog[open], [data-widget-shelf][open]'
    },
    panelTabs: '.panel-tabs [role="tab"]',
    widgets: '[data-widget-type]'
  }, { identityStable: initialIdentity === undefined || initialIdentity === currentIdentity });
}
