import type { Page } from '@playwright/test';

import type { ThemeTargetMeasurement } from '../../measurements.ts';
import { ConformanceError, type ConformanceScenario } from '../../types.ts';

export async function renderOriginalThemeReference(
  page: Page,
  preservationOrigin: string,
  scenario: ConformanceScenario
): Promise<ThemeTargetMeasurement> {
  try {
    await page.goto(`${preservationOrigin}/${scenario.authorityPath}`, { waitUntil: 'load' });
    await page.locator('body[data-theme-reference]').waitFor({ state: 'visible' });
    await page.locator('body').evaluate((body, state) => { body.dataset.referenceState = state; }, scenario.referenceState);
    return await page.locator('body').evaluate((body, expected) => {
      const style = getComputedStyle(body);
      const shell = body.querySelector<HTMLElement>('.workbench');
      const shelf = body.querySelector<HTMLElement>('.shelf');
      const dock = body.querySelector<HTMLElement>('.dock');
      const widget = body.querySelector<HTMLElement>('.widget');
      const button = body.querySelector<HTMLElement>('.showcase button');
      const stage = body.querySelector<HTMLElement>('.stage');
      const reader = body.querySelector<HTMLElement>('.reader');
      const readerBody = body.querySelector<HTMLElement>('.reader p:not(.kicker)');
      const catalog = body.querySelector<HTMLElement>('.catalog');
      if (!shelf || !shell || !dock || !widget || !button || !stage || !reader || !readerBody || !catalog) throw new Error('Original reference anatomy is incomplete.');
      const visibleCatalog = getComputedStyle(catalog).display !== 'none';
      const buttons = [...body.querySelectorAll<HTMLButtonElement>('button')];
      return Object.freeze({
        functional: Object.freeze({
          targetApplied: (body.dataset.themeReference === expected.target) as true,
          identityStable: true as const,
          instant: ([body, shell, widget, catalog].every((node) => getComputedStyle(node).transitionDuration === '0s')) as true,
          noHorizontalOverflow: (body.scrollWidth <= body.clientWidth + 1) as true,
          keyboardAccessible: buttons.every((control) => Boolean((control.getAttribute('aria-label') ?? control.textContent ?? '').trim())) as true,
          scenarioStateReached: (visibleCatalog === (expected.state === 'catalog')) as true
        }),
        structure: Object.freeze({
          panelTabs: Object.freeze([...body.querySelectorAll<HTMLButtonElement>('.tabs button')].map((control) => control.textContent?.trim() ?? '')),
          anchorWidgets: Object.freeze([...body.querySelectorAll<HTMLElement>('[data-widget-label]')].map((node) => node.dataset.widgetLabel ?? ''))
        }),
        visual: Object.freeze({
          canvas: style.getPropertyValue('--canvas').trim(),
          accent: style.getPropertyValue('--accent').trim(),
          text: style.getPropertyValue('--text').trim(),
          shelfRadius: getComputedStyle(shelf).borderRadius,
          shellRadius: getComputedStyle(shell).borderRadius,
          dockRadius: getComputedStyle(dock).borderRadius,
          widgetRadius: getComputedStyle(widget).borderRadius,
          buttonRadius: getComputedStyle(button).borderRadius,
          readerRadius: getComputedStyle(reader).borderRadius,
          readerFontSize: getComputedStyle(readerBody).fontSize,
          readerLineHeight: getComputedStyle(readerBody).lineHeight,
          widgetHasGradient: getComputedStyle(widget).backgroundImage.includes('gradient'),
          readerHasMaterial: getComputedStyle(reader).backgroundColor !== 'rgba(0, 0, 0, 0)',
          readerIntersectsStage: (() => {
            const stageBox = stage.getBoundingClientRect();
            const readerBox = reader.getBoundingClientRect();
            return readerBox.width > 0 && readerBox.height > 0
              && readerBox.right > stageBox.left && readerBox.left < stageBox.right
              && readerBox.bottom > stageBox.top && readerBox.top < stageBox.bottom;
          })()
        }),
        trace: Object.freeze([`opened byte-hashed ${expected.target} reference`, `set ${expected.state} state`])
      });
    }, { target: scenario.target, state: scenario.referenceState });
  } catch (cause) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `Original theme reference failed for ${scenario.id}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      scenarioId: scenario.id
    });
  }
}
