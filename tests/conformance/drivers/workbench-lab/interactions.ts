import type { Locator, Page } from '@playwright/test';

import { ConformanceError, type ConformanceScenario } from '../../types.ts';

export interface InteractionMeasurement {
  readonly functional: {
    readonly authorityCasePassed: true;
    readonly outcomeReached: true;
    readonly identityStable: true;
    readonly persistenceVerified: true;
    readonly keyboardAccessible: true;
  };
  readonly trace: readonly string[];
}

function requireOutcome(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function dragTo(page: Page, handle: Locator, target: { x: number; y: number }) {
  const box = await handle.boundingBox();
  requireOutcome(box, 'Drag handle lacks geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 6 });
  await page.mouse.up();
}

async function resetLab(page: Page, origin: string) {
  await page.goto(origin, { waitUntil: 'load' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.locator('main[data-pom-theme="deep-current"]').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
}

async function saveAndReload(page: Page) {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload({ waitUntil: 'load' });
  await page.locator('main[data-pom-theme="deep-current"]').waitFor({ state: 'visible' });
}

async function uniqueWidgetIds(page: Page): Promise<readonly string[]> {
  return page.locator('[data-pomegranate-widget], [data-group-tab]').evaluateAll((nodes) => (
    [...new Set(nodes.map((node) => node.getAttribute('data-pomegranate-widget') ?? node.getAttribute('data-group-tab')).filter(Boolean))].sort()
  )) as Promise<readonly string[]>;
}

async function mergeSceneWidgets(page: Page) {
  const target = page.getByRole('article', { name: 'World State' });
  const box = await target.boundingBox();
  requireOutcome(box, 'World State lacks merge geometry.');
  await dragTo(page, page.getByRole('article', { name: 'Room Ambience' }).getByRole('button', { name: 'Drag Widget' }), {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  });
}

async function exerciseScenario(page: Page, scenarioId: string, trace: string[]) {
  const left = page.getByRole('separator', { name: 'Resize left toolbar' });
  const right = page.getByRole('separator', { name: 'Resize right toolbar' });

  switch (scenarioId) {
    case 'dc-int-resize-left':
      await left.focus();
      await left.press('End');
      trace.push('left dock keyboard resize reached 420');
      await saveAndReload(page);
      requireOutcome(await page.getByRole('separator', { name: 'Resize left toolbar' }).getAttribute('aria-valuenow') === '420', 'Left dock width did not persist.');
      return;
    case 'dc-int-resize-right':
      await right.focus();
      await right.press('Home');
      trace.push('right dock keyboard resize reached 200');
      await saveAndReload(page);
      requireOutcome(await page.getByRole('separator', { name: 'Resize right toolbar' }).getAttribute('aria-valuenow') === '200', 'Right dock width did not persist.');
      return;
    case 'dc-int-shelf-insert': {
      const seam = await page.locator('[data-shelf-insertion="left"]').boundingBox();
      requireOutcome(seam, 'Left shelf seam lacks geometry.');
      await dragTo(page, page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Drag Widget' }), {
        x: seam.x + seam.width / 2,
        y: seam.y + seam.height / 2
      });
      trace.push('pointer drop created a left shelf');
      await saveAndReload(page);
      requireOutcome((await page.locator('[data-widget-type="systems.world-state"]').getAttribute('data-pomegranate-shelf'))?.startsWith('left-shelf-'), 'New shelf did not persist.');
      return;
    }
    case 'dc-int-tab-merge':
      await mergeSceneWidgets(page);
      trace.push('Room Ambience merged onto World State');
      await saveAndReload(page);
      requireOutcome(await page.getByRole('group', { name: 'Widget group' }).getByRole('tab').count() === 2, 'Merged tab group did not persist.');
      return;
    case 'dc-int-tab-reorder': {
      await mergeSceneWidgets(page);
      const ambience = page.getByRole('group', { name: 'Widget group' }).getByRole('tab', { name: 'Room Ambience' });
      await ambience.press('Alt+ArrowLeft');
      trace.push('Alt+ArrowLeft reordered the active tab');
      await saveAndReload(page);
      const titles = await page.getByRole('group', { name: 'Widget group' }).getByRole('tab').allInnerTexts();
      requireOutcome(titles.join('|') === 'Room Ambience|World State', 'Tab order did not persist.');
      return;
    }
    case 'dc-int-float': {
      const stage = await page.locator('[data-pomegranate-dock="main"]').boundingBox();
      requireOutcome(stage, 'Stage lacks floating geometry.');
      await dragTo(page, page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Drag Widget' }), {
        x: stage.x + stage.width * .72,
        y: stage.y + 90
      });
      trace.push('pointer drop floated World State');
      await saveAndReload(page);
      requireOutcome(await page.locator('[data-widget-type="systems.world-state"]').getAttribute('data-pomegranate-placement') === 'floating', 'Floating placement did not persist.');
      return;
    }
    case 'dc-int-invalid-restore': {
      const widget = page.locator('[data-widget-type="story.room-ambience"]');
      const origin = await widget.evaluate((node) => [node.getAttribute('data-pomegranate-edge'), node.getAttribute('data-pomegranate-shelf'), node.getAttribute('data-pomegranate-order')].join('|'));
      const revision = await page.locator('main').getAttribute('data-workbench-revision');
      await dragTo(page, widget.getByRole('button', { name: 'Drag Widget' }), { x: 2, y: 2 });
      requireOutcome(await widget.evaluate((node) => [node.getAttribute('data-pomegranate-edge'), node.getAttribute('data-pomegranate-shelf'), node.getAttribute('data-pomegranate-order')].join('|')) === origin, 'Invalid release changed origin.');
      requireOutcome(await page.locator('main').getAttribute('data-workbench-revision') === revision, 'Invalid release advanced revision.');
      trace.push('invalid release retained exact origin');
      await saveAndReload(page);
      return;
    }
    case 'dc-int-cancel-restore': {
      const widget = page.locator('[data-widget-type="story.room-ambience"]');
      const handle = widget.getByRole('button', { name: 'Drag Widget' });
      const box = await handle.boundingBox();
      requireOutcome(box, 'Cancel handle lacks geometry.');
      const revision = await page.locator('main').getAttribute('data-workbench-revision');
      await handle.dispatchEvent('pointerdown', { pointerId: 29, pointerType: 'touch', isPrimary: true, button: 0, clientX: box.x, clientY: box.y });
      await handle.dispatchEvent('pointermove', { pointerId: 29, pointerType: 'touch', isPrimary: true, button: 0, clientX: box.x + 18, clientY: box.y + 18 });
      await handle.dispatchEvent('pointercancel', { pointerId: 29, pointerType: 'touch', isPrimary: true, button: 0, clientX: box.x + 18, clientY: box.y + 18 });
      requireOutcome(await page.locator('main').getAttribute('data-workbench-revision') === revision, 'Pointer cancellation advanced revision.');
      trace.push('pointercancel retained exact origin');
      await saveAndReload(page);
      return;
    }
    case 'dc-int-focus-back': {
      const focus = page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' });
      await focus.click();
      const dialog = page.getByRole('dialog', { name: 'Focused World State' });
      await dialog.getByRole('button', { name: 'Back to Workbench' }).click();
      requireOutcome(await page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' }).evaluate((node) => node === document.activeElement), 'Focus did not return to the invoker.');
      trace.push('Focus and Back restored the invoking control');
      await saveAndReload(page);
      return;
    }
    case 'dc-int-panel-persist':
      await left.focus();
      await left.press('End');
      await page.getByRole('tab', { name: 'Library' }).click();
      await page.getByRole('separator', { name: 'Resize left toolbar' }).press('Home');
      await page.getByRole('tab', { name: 'Settings' }).click();
      await page.getByRole('separator', { name: 'Resize right toolbar' }).press('ArrowLeft');
      await saveAndReload(page);
      requireOutcome(await page.getByRole('separator', { name: 'Resize right toolbar' }).getAttribute('aria-valuenow') === '278', 'Settings width did not restore.');
      await page.getByRole('tab', { name: 'Library' }).click();
      requireOutcome(await page.getByRole('separator', { name: 'Resize left toolbar' }).getAttribute('aria-valuenow') === '200', 'Library width did not restore.');
      await page.getByRole('tab', { name: 'Scene' }).click();
      requireOutcome(await page.getByRole('separator', { name: 'Resize left toolbar' }).getAttribute('aria-valuenow') === '420', 'Scene width did not restore.');
      trace.push('three Panel presentation states restored independently');
      return;
    case 'dc-int-catalog-place':
      await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
      await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Compact' }).click();
      await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Add Accessibility', exact: true }).press('Enter');
      trace.push('keyboard Catalog placement created Accessibility');
      await saveAndReload(page);
      requireOutcome(await page.getByRole('article', { name: 'Accessibility' }).count() === 1, 'Catalog placement did not persist.');
      return;
    case 'dc-int-coarse-targets': {
      const controls = [
        { label: 'Scene tab', locator: page.getByRole('tab', { name: 'Scene' }) },
        { label: 'Catalog launcher', locator: page.getByRole('button', { name: 'Open Widget Catalog' }) },
        { label: 'World State drag handle', locator: page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Drag Widget' }) }
      ];
      for (const { label, locator } of controls) {
        const box = await locator.boundingBox();
        const subpixelTolerance = 0.01;
        requireOutcome(
          box && box.width >= 44 - subpixelTolerance && box.height >= 44 - subpixelTolerance,
          `${label} is below 44 CSS pixels (${box ? `${box.width}x${box.height}` : 'missing geometry'}).`
        );
      }
      trace.push('coarse-pointer controls meet 44px targets');
      await saveAndReload(page);
      return;
    }
    default:
      throw new Error(`Unknown Lab interaction scenario ${scenarioId}.`);
  }
}

export async function exerciseLabInteraction(
  page: Page,
  labOrigin: string,
  scenario: ConformanceScenario
): Promise<InteractionMeasurement> {
  try {
    await resetLab(page, labOrigin);
    const beforeIds = await uniqueWidgetIds(page);
    const trace: string[] = [];
    await exerciseScenario(page, scenario.id, trace);
    const afterIds = await uniqueWidgetIds(page);
    requireOutcome(beforeIds.every((id) => afterIds.includes(id)), 'An existing Widget identity was replaced.');
    const dragHandle = page.getByRole('button', { name: 'Drag Widget' }).first();
    requireOutcome(await dragHandle.count() === 1 && await dragHandle.evaluate((node) => node.tabIndex >= 0), 'The drag interaction lacks a keyboard-reachable named control.');
    return Object.freeze({
      functional: Object.freeze({
        authorityCasePassed: true,
        outcomeReached: true,
        identityStable: true,
        persistenceVerified: true,
        keyboardAccessible: true
      }),
      trace: Object.freeze(trace)
    });
  } catch (cause) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    throw new ConformanceError(
      'IMPLEMENTATION_SETUP_FAILED',
      `The Workbench Lab failed interaction scenario ${scenario.id}: ${causeMessage}`,
      { scenarioId: scenario.id, cause: causeMessage }
    );
  }
}
