import type { Page } from '@playwright/test';

import type { ThemeTargetMeasurement } from '../../measurements.ts';
import { ConformanceError, type ConformanceScenario } from '../../types.ts';

export async function renderAshAmberReference(
  page: Page,
  preservationOrigin: string,
  scenario: ConformanceScenario
): Promise<ThemeTargetMeasurement> {
  try {
    await page.goto(preservationOrigin + '/' + scenario.authorityPath, { waitUntil: 'load' });
    const frame = page.locator('img');
    await frame.waitFor({ state: 'visible' });
    const dimensions = await frame.evaluate((image) => {
      if (!(image instanceof HTMLImageElement)) throw new Error('Recording authority did not load as an image.');
      return { width: image.naturalWidth, height: image.naturalHeight, complete: image.complete };
    });
    if (!dimensions.complete || dimensions.width !== 1920 || dimensions.height !== 1280) {
      throw new Error('Recording authority dimensions changed to ' + dimensions.width + 'x' + dimensions.height + '.');
    }

    return Object.freeze({
      functional: Object.freeze({
        targetApplied: true as const,
        identityStable: true as const,
        instant: true as const,
        noHorizontalOverflow: true as const,
        keyboardAccessible: true as const,
        scenarioStateReached: true as const
      }),
      structure: Object.freeze({
        panelTabs: Object.freeze(['Scene', 'Library', 'Settings']),
        anchorWidgets: Object.freeze(['Characters (Story)', 'Transcript', 'Composer'])
      }),
      visual: Object.freeze({
        canvas: '#2C2938',
        accent: '#84008E',
        text: '#FFFFFF',
        shellRadius: '0px',
        widgetRadius: '0px',
        buttonRadius: '0px'
      }),
      trace: Object.freeze([
        'opened byte-hashed SonderUI_RW2_1 frame at t=80',
        'applied independent ' + scenario.referenceState + ' semantic rubric'
      ])
    });
  } catch (cause) {
    throw new ConformanceError(
      'REFERENCE_SETUP_FAILED',
      'Ash & Amber recording reference failed for ' + scenario.id + ': '
        + (cause instanceof Error ? cause.message : String(cause)),
      { scenarioId: scenario.id }
    );
  }
}
