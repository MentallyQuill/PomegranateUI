import type { Page } from '@playwright/test';

import { ConformanceError } from '../../types.ts';

const harnessPath = '/prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html';

export const REFERENCE_INTERACTION_CASES: Readonly<Record<string, string>> = Object.freeze({
  'dc-int-resize-left': 'Accessibility opens and responds at its audited toolbar heights',
  'dc-int-resize-right': 'Accessibility opens and responds at its audited toolbar heights',
  'dc-int-shelf-insert': 'Catalog Widgets can create new shelves through toolbar seams',
  'dc-int-tab-merge': 'Dragging Room Ambience onto the World State title bar merges it as a tab',
  'dc-int-tab-reorder': 'Dragging a tab left reshuffles it before its neighbor',
  'dc-int-float': 'Catalog-placed floating Widget remains movable',
  'dc-int-invalid-restore': 'Scene invalid release restores the exact docked Widget origin',
  'dc-int-cancel-restore': 'Pointer cancellation restores the exact Widget origin',
  'dc-int-focus-back': 'World State covers first record, validation/conflict/read-only guards, responsive staging, and exact focus return',
  'dc-int-panel-persist': 'Panel persistence keeps flat Panels and rejects nested sub-panels',
  'dc-int-catalog-place': 'Keyboard placement can select a target, confirm, and cancel',
  'dc-int-coarse-targets': 'Accessibility preview preserves solid, contrast, reduced-motion, focus, and large-target contracts'
});

export async function prepareWidgetOverhaulHarness(
  page: Page,
  preservationOrigin: string
): Promise<ReadonlySet<string>> {
  try {
    await page.goto(`${preservationOrigin}${harnessPath}`, { waitUntil: 'load' });
    await page.waitForFunction(() => /^(?:PASS|FAIL) —/.test(document.title), null, { timeout: 120_000 });
    if (!(await page.title()).startsWith('PASS —')) throw new Error('The preserved Widget Overhaul harness did not pass.');
    const rows = await page.locator('#results > p.pass').allInnerTexts();
    const titles = rows.map((text) => text.replace(/^PASS — /, '').split('\n', 1)[0] ?? '');
    return new Set(titles);
  } catch (cause) {
    throw new ConformanceError(
      'REFERENCE_SETUP_FAILED',
      'The Widget Overhaul interaction authority did not reach its passed harness state.',
      { cause: cause instanceof Error ? cause.message : String(cause) }
    );
  }
}

export function requireWidgetOverhaulCase(cases: ReadonlySet<string>, scenarioId: string): string {
  const title = REFERENCE_INTERACTION_CASES[scenarioId];
  if (!title || !cases.has(title)) {
    throw new ConformanceError(
      'REFERENCE_SETUP_FAILED',
      `The Widget Overhaul harness lacks the required passing case for ${scenarioId}.`,
      { scenarioId, title: title ?? null }
    );
  }
  return title;
}
