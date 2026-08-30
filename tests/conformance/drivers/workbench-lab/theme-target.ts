import type { Page } from '@playwright/test';

import type { ThemeTargetMeasurement } from '../../measurements.ts';
import { ConformanceError, type ConformanceScenario } from '../../types.ts';

export async function renderLabThemeTarget(
  page: Page,
  labOrigin: string,
  scenario: ConformanceScenario
): Promise<ThemeTargetMeasurement> {
  try {
    await page.goto(labOrigin, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const beforeIds = await widgetIds(page);
    const label = scenario.target === 'pom-neutral' ? 'PomOS'
      : scenario.target === 'bunny' ? 'Bunny'
        : scenario.target === 'ash-amber' ? 'Ash & Amber'
          : 'Deep Current';
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: label, exact: true }).click();
    await page.getByText('Developer tools', { exact: true }).click();
    if (scenario.implementationState === 'catalog') await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const afterIds = await widgetIds(page);
    return await page.locator('main').evaluate((root, expected) => {
      const style = getComputedStyle(root);
      const shelf = root.querySelector<HTMLElement>('.top-shelf');
      const shell = root.querySelector<HTMLElement>('.workbench-shell');
      const dock = root.querySelector<HTMLElement>('[data-conformance-region="left"]');
      const widget = root.querySelector<HTMLElement>('[data-conformance-region="left"] .widget-frame');
      const activeButton = root.querySelector<HTMLElement>('.theme-targets button[aria-pressed="true"]');
      const stage = root.querySelector<HTMLElement>('[data-conformance-region="stage"]');
      const readerHost = root.querySelector<HTMLElement>('[data-widget-type="story.transcript"]');
      const reader = readerHost?.querySelector<HTMLElement>('.widget-frame > [data-pom-part="widget.content"]');
      const readerBody = readerHost?.querySelector<HTMLElement>('.transcript');
      const catalog = document.querySelector<HTMLElement>('.widget-catalog');
      if (!shelf || !shell || !dock || !widget || !activeButton || !stage || !reader || !readerBody) throw new Error('Lab theme anatomy is incomplete.');
      const visibleCatalog = Boolean(catalog && getComputedStyle(catalog).display !== 'none');
      const visibleButtons = [...document.querySelectorAll<HTMLButtonElement>('button')].filter((control) => control.getClientRects().length > 0);
      const transitionNodes = [root, shell, widget, ...(catalog ? [catalog] : [])];
      return Object.freeze({
        functional: Object.freeze({
          targetApplied: (root.dataset.pomTheme === expected.target) as true,
          identityStable: expected.identityStable as true,
          instant: transitionNodes.every((node) => getComputedStyle(node).transitionDuration === '0s') as true,
          noHorizontalOverflow: (document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) as true,
          keyboardAccessible: visibleButtons.every((control) => Boolean((control.getAttribute('aria-label') ?? control.textContent ?? '').trim())) as true,
          scenarioStateReached: (visibleCatalog === (expected.state === 'catalog')) as true
        }),
        structure: Object.freeze({
          panelTabs: Object.freeze([...root.querySelectorAll<HTMLElement>('[role="tab"]')].map((control) => control.textContent?.trim() ?? '')),
          anchorWidgets: Object.freeze([...root.querySelectorAll<HTMLElement>('.widget-frame[aria-label]')].map((node) => node.getAttribute('aria-label') ?? ''))
        }),
        visual: Object.freeze({
          canvas: style.getPropertyValue('--pom-color-canvas').trim(),
          accent: style.getPropertyValue('--pom-color-accent').trim(),
          text: style.getPropertyValue('--pom-color-text').trim(),
          shelfRadius: getComputedStyle(shelf).borderRadius,
          shellRadius: getComputedStyle(shell).borderRadius,
          dockRadius: getComputedStyle(dock).borderRadius,
          widgetRadius: getComputedStyle(widget).borderRadius,
          buttonRadius: getComputedStyle(activeButton).borderRadius,
          readerRadius: getComputedStyle(reader).borderRadius,
          readerFontSize: getComputedStyle(readerBody).fontSize,
          readerLineHeight: getComputedStyle(readerBody).lineHeight,
          widgetHasGradient: getComputedStyle(widget).backgroundImage.includes('gradient'),
          readerHasMaterial: getComputedStyle(reader).backgroundColor !== 'rgba(0, 0, 0, 0)'
            || getComputedStyle(reader).backgroundImage !== 'none',
          readerIntersectsStage: (() => {
            const stageBox = stage.getBoundingClientRect();
            const readerBox = reader.getBoundingClientRect();
            return readerBox.width > 0 && readerBox.height > 0
              && readerBox.right > stageBox.left && readerBox.left < stageBox.right
              && readerBox.bottom > stageBox.top && readerBox.top < stageBox.bottom;
          })()
        }),
        trace: Object.freeze([`activated ${expected.target} atomically`, `verified ${expected.state} state without replacing Widget identities`])
      });
    }, {
      target: scenario.target,
      state: scenario.implementationState,
      identityStable: beforeIds.length > 0 && beforeIds.length === afterIds.length && beforeIds.every((id, index) => id === afterIds[index])
    });
  } catch (cause) {
    throw new ConformanceError('IMPLEMENTATION_SETUP_FAILED', `Workbench Lab theme target failed for ${scenario.id}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      scenarioId: scenario.id
    });
  }
}

async function widgetIds(page: Page): Promise<string[]> {
  return page.locator('[data-pomegranate-widget]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-pomegranate-widget') ?? ''));
}
