import { fileURLToPath } from 'node:url';

import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  beginPointerDrag,
  cancelPointerDrag,
  capturePlacementSnapshot,
  captureWidgetIdentity,
  dispatchPointerCancel,
  dragToShelfRail,
  expectActiveWidgetDrag,
  expectNoWidgetDragResidue,
  finishPointerDrag,
  invokeWidgetAction,
  movePointerPath,
  widgetDragSurface
} from './support/widget-interaction-driver.ts';
import type { ActiveDragExpectation } from './support/widget-interaction-driver.ts';
import { INTERACTION_CASES } from './support/widget-interaction-matrix.ts';

const DRAG_PREVIEW_SCREENSHOT_STYLE = fileURLToPath(
  new URL('./support/widget-drag-screenshot.css', import.meta.url)
);
const DRAG_DESTINATION_SCREENSHOT_STYLE = fileURLToPath(
  new URL('./support/widget-drag-destination-screenshot.css', import.meta.url)
);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

async function expectWindowsPageScreenshot(page: Page, name: string): Promise<void> {
  if (process.platform === 'win32') await expect(page).toHaveScreenshot(name, { animations: 'disabled' });
}

async function expectWindowsLocatorScreenshot(locator: Locator, name: string, stylePath: string): Promise<void> {
  if (process.platform === 'win32') {
    await expect(locator).toHaveScreenshot(name, {
      animations: 'disabled',
      stylePath
    });
  }
}

async function expectWindowsClippedScreenshot(
  page: Page,
  name: string,
  clip: { x: number; y: number; width: number; height: number }
): Promise<void> {
  if (process.platform === 'win32') await expect(page).toHaveScreenshot(name, { animations: 'disabled', clip });
}

async function expectSettledDockPreview(page: Page, expectedText: string): Promise<void> {
  const preview = page.locator('[data-pom-part="widget.drag-preview"]');
  const destination = page.locator('[data-pom-part="widget.dock-slot"]');
  await expect(preview).not.toHaveAttribute('data-float-ready');
  await expect(preview).toHaveText(expectedText);
  await expect(preview).toHaveCSS('pointer-events', 'none');
  await expect(preview).toHaveCSS('border-style', 'solid');
  await expect.poll(() => preview.evaluate((node) => getComputedStyle(node).opacity)).toBe('0.9');
  const previewBox = await preview.boundingBox();
  expect(previewBox).not.toBeNull();
  expect(previewBox?.width).toBeGreaterThanOrEqual(180);
  expect(previewBox?.width).toBeLessThanOrEqual(280);
  expect(previewBox?.height).toBe(42);
  await expect(destination).toHaveText('');
  await expect(destination.locator('article, button, input, select, textarea, [data-widget-type]')).toHaveCount(0);
}

async function createGroup(page: Page, sourceName: string, targetName: string) {
  const source = page.getByRole('article', { name: sourceName });
  const target = page.getByRole('article', { name: targetName });
  const sourceIdentity = await captureWidgetIdentity(source);
  const sourceRect = await source.boundingBox();
  const start = await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: start.x + 12, y: start.y + 12 }]);
  const targetBox = await widgetDragSurface(target).boundingBox();
  if (!targetBox) throw new Error('Expected live Widget grouping target geometry.');
  await movePointerPath(page, [{ x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'tab');
  await expectActiveWidgetDrag(page, sourceIdentity, { reservationCount: 1, originRect: sourceRect });
  await finishPointerDrag(page);
  return page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: sourceName, exact: true }) });
}

async function createReferenceGroup(page: Page) {
  return createGroup(page, 'Theme Materials', 'Characters (Story)');
}

async function openDeveloperTools(page: Page): Promise<void> {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) {
    await page.getByText('Developer tools', { exact: true }).click();
  }
}

async function workbenchRevision(page: Page): Promise<number> {
  return Number(await page.locator('main').getAttribute('data-workbench-revision'));
}

test('AUDIT-P1-GROUP-DIRECT-FLOAT grouped tab reaches open Scene space after horizontal departure', async ({ page }, testInfo) => {
  const group = await createReferenceGroup(page);
  const tab = group.getByRole('tab', { name: 'Theme Materials' });
  const stage = page.locator('[data-pomegranate-region-surface="stage"]');
  const tabBox = await tab.boundingBox();
  const stageBox = await stage.boundingBox();
  if (!tabBox || !stageBox) throw new Error('Expected grouped-tab and Scene geometry.');
  const originRect = await group.locator('[data-widget-type]').boundingBox();
  const sourceIdentity = await captureWidgetIdentity(tab);
  const start = await beginPointerDrag(page, tab);
  await movePointerPath(page, [
    { x: start.x + 18, y: start.y },
    { x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }
  ]);
  await expectActiveWidgetDrag(page, sourceIdentity, { reservationCount: 0, originRect });
  await expectWindowsPageScreenshot(page, 'widget-grouped-tab-direct-float.png');
  await testInfo.attach('AUDIT-P1-GROUP-DIRECT-FLOAT', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  const lifted = await page.locator('[data-pom-part="widget.drag-preview"]').isVisible();
  expect.soft(lifted).toBe(true);
  if (lifted) {
    await finishPointerDrag(page);
    await expect(page.locator('[data-widget-type="settings.theme-materials"][data-pomegranate-placement="floating"]')).toBeVisible();
  } else {
    await page.mouse.up();
    await expectNoWidgetDragResidue(page);
  }
});

test('AUDIT-P1-SINGLE-PRESENTATION lifted Widget has one compact payload and one text-free destination', async ({ page }, testInfo) => {
  const source = page.locator('[data-widget-type="story.characters"]').first();
  const target = page.getByRole('article', { name: 'World State' });
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('Expected occupied destination geometry.');
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height * 0.12 }]);
  const evidence = await expectActiveWidgetDrag(page, sourceIdentity, { reservationCount: 1, originRect });
  await expectSettledDockPreview(page, 'Characters (Story)');
  await expectWindowsLocatorScreenshot(
    page.locator('[data-pom-part="widget.drag-preview"]'),
    'widget-lifted-singleton.png',
    DRAG_PREVIEW_SCREENSHOT_STYLE
  );
  await expectWindowsLocatorScreenshot(
    page.locator('[data-pomegranate-region-surface="right"]'),
    'widget-occupied-gap-insertion.png',
    DRAG_DESTINATION_SCREENSHOT_STYLE
  );
  await testInfo.attach('AUDIT-P1-SINGLE-PRESENTATION', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  await testInfo.attach('AUDIT-P1-SINGLE-PRESENTATION-evidence', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json'
  });
  await cancelPointerDrag(page);
});

test('AUDIT-P1-GROUP-ACTIONS desktop grouped Widget tabs expose unobstructed context actions', async ({ page }, testInfo) => {
  const article = page.getByRole('article', { name: 'Room Ambience' });
  const group = article.locator('xpath=ancestor::*[@data-widget-group][1]');
  const action = group.getByRole('button', { name: 'Widget actions' });
  const activeTab = group.getByRole('tab', { selected: true });
  await expect(action).toBeHidden();
  const hit = await activeTab.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const target = document.elementFromPoint(box.right - 4, box.y + box.height / 2);
    return {
      tabReceivesPoint: target === node || node.contains(target),
      hitTag: target?.tagName ?? null,
      hitRole: target?.getAttribute('role') ?? null,
      hitClass: target?.getAttribute('class') ?? null
    };
  });
  await activeTab.click({ button: 'right' });
  await expect(page.getByRole('menu', { name: 'Room Ambience Widget actions' })).toBeVisible();
  await testInfo.attach('AUDIT-P1-GROUP-ACTIONS', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  await testInfo.attach('AUDIT-P1-GROUP-ACTIONS-evidence', {
    body: JSON.stringify(hit, null, 2),
    contentType: 'application/json'
  });
  expect(hit.tabReceivesPoint).toBe(true);
});

test('AUDIT-P1-STAGE-TOP Widget remains hittable, actionable, and draggable after docking above the Story', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="settings.accessibility-controls"]');
  await result.scrollIntoViewIfNeeded();
  await result.focus();
  await result.press('Enter');
  await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();

  const widget = page.getByRole('article', { name: 'Accessibility Controls' });
  await dragToShelfRail(page, widgetDragSurface(widget), 'stage', 'before');
  await expect(widget).toHaveAttribute('data-pomegranate-edge', 'main');

  const header = widgetDragSurface(widget);
  expect(await header.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit === node || Boolean(hit && node.contains(hit));
  })).toBe(true);

  await widget.locator(':scope > [data-pom-part="widget.content"]').click({ button: 'right' });
  await expect(page.getByRole('menu', { name: 'Accessibility Controls Widget actions' })).toBeVisible();
  await page.keyboard.press('Escape');

  const stageBox = await page.locator('[data-pomegranate-region-surface="stage"]').boundingBox();
  if (!stageBox) throw new Error('Expected open Story geometry.');
  const beforeRevision = await workbenchRevision(page);
  await beginPointerDrag(page, header);
  await movePointerPath(page, [{ x: stageBox.x + stageBox.width * .72, y: stageBox.y + 90 }]);
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await finishPointerDrag(page);

  await expect(widget).toHaveAttribute('data-pomegranate-placement', 'floating');
  expect(await workbenchRevision(page)).toBe(beforeRevision + 1);
  await expectNoWidgetDragResidue(page);
});

const implementedCaseIds = new Set<string>();
type PlaytestBody = (args: {
  page: Page;
  expectActiveDrag(origin: Locator | string, expectation: ActiveDragExpectation): Promise<void>;
}) => Promise<void>;

function interactionTest(id: string, body: PlaytestBody): void {
  implementedCaseIds.add(id);
  test(id, async ({ page }) => {
    await body({
      page,
      expectActiveDrag: async (origin, expectation) => {
        await expectActiveWidgetDrag(page, origin, expectation);
      }
    });
    await expectNoWidgetDragResidue(page);
  });
}

test.afterAll(() => {
  expect([...implementedCaseIds].sort()).toEqual(INTERACTION_CASES.map(({ id }) => id));
});

interactionTest('collapsed-dock-reveal-commit', async ({ page, expectActiveDrag }) => {
  const toggle = page.locator('.toolbar-edge-toggle-left');
  await toggle.click();
  const source = page.getByRole('article', { name: 'Room Ambience' });
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  const beforeRevision = await workbenchRevision(page);
  let start = await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [
    { x: start.x, y: start.y + 28 },
    { x: 18, y: 320 }
  ]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  let targetBox = await page.getByRole('article', { name: 'Characters (Story)' }).boundingBox();
  if (!targetBox) throw new Error('Expected revealed left-dock Widget geometry.');
  await movePointerPath(page, [{
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height * 0.12
  }]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  await expectSettledDockPreview(page, 'Room Ambience');
  await expectWindowsLocatorScreenshot(
    page.locator('[data-pomegranate-region-surface="left"]'),
    'widget-collapsed-dock-reveal.png',
    DRAG_DESTINATION_SCREENSHOT_STYLE
  );
  await cancelPointerDrag(page);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-conformance-region="left"]')).toBeHidden();
  await expectNoWidgetDragResidue(page);

  start = await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [
    { x: start.x, y: start.y + 28 },
    { x: 18, y: 320 }
  ]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  targetBox = await page.getByRole('article', { name: 'Characters (Story)' }).boundingBox();
  if (!targetBox) throw new Error('Expected revealed left-dock Widget geometry.');
  await movePointerPath(page, [{
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height * 0.12
  }]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  await finishPointerDrag(page);

  const placed = page.locator('[data-widget-type="story.room-ambience"]');
  await expect(placed).toHaveAttribute('data-pomegranate-edge', 'left');
  expect(await workbenchRevision(page)).toBeGreaterThan(beforeRevision);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-conformance-region="left"]')).toBeVisible();
  await expectNoWidgetDragResidue(page);
});

test('AUDIT-P2-COLLAPSED-DOCK-SYMMETRY accepted right-dock drop expands its destination', async ({ page }) => {
  const toggle = page.locator('.toolbar-edge-toggle-right');
  await toggle.click();
  const source = page.getByRole('article', { name: 'Characters (Story)' });
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  const beforeRevision = await workbenchRevision(page);
  const start = await beginPointerDrag(page, widgetDragSurface(source));
  const targetX = await page.evaluate(() => window.innerWidth - 18);
  await movePointerPath(page, [
    { x: start.x, y: start.y + 28 },
    { x: targetX, y: 120 }
  ]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-right', 'true');
  const targetBox = await page.getByRole('article', { name: 'World State' })
    .locator(':scope > [data-pom-part="widget.content"]')
    .boundingBox();
  if (!targetBox) throw new Error('Expected revealed right-dock Widget geometry.');
  await movePointerPath(page, [{
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height * 0.12
  }]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-right', 'true');
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await expectActiveWidgetDrag(page, sourceIdentity, { reservationCount: 1, originRect });
  await finishPointerDrag(page);

  await expect(page.locator('[data-widget-type="story.characters"]')).toHaveAttribute('data-pomegranate-edge', 'right');
  expect(await workbenchRevision(page)).toBeGreaterThan(beforeRevision);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-conformance-region="right"]')).toBeVisible();
  await expectNoWidgetDragResidue(page);
});

interactionTest('floating-invalid-cancel', async ({ page, expectActiveDrag }) => {
  await invokeWidgetAction(page.getByRole('article', { name: 'World State' }), 'Move…');
  await page.getByRole('menu', { name: 'World State Widget move' })
    .getByRole('menuitem', { name: 'Float' })
    .click();
  const source = page.locator('[data-widget-type="systems.world-state"][data-pomegranate-placement="floating"]');
  const before = await capturePlacementSnapshot(source);
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  const beforeRevision = await workbenchRevision(page);
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: 2, y: 2 }]);
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await expectActiveDrag(sourceIdentity, { reservationCount: 0, originRect });
  await cancelPointerDrag(page);

  expect(await capturePlacementSnapshot(source)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
});

interactionTest('floating-to-empty-pointercancel', async ({ page, expectActiveDrag }) => {
  await invokeWidgetAction(page.getByRole('article', { name: 'Characters (Story)' }), 'Move…');
  await page.getByRole('menu', { name: 'Characters (Story) Widget move' })
    .getByRole('menuitem', { name: 'Dock right' })
    .click();
  await invokeWidgetAction(page.getByRole('article', { name: 'Theme Materials' }), 'Move…');
  await page.getByRole('menu', { name: 'Theme Materials Widget move' })
    .getByRole('menuitem', { name: 'Dock right' })
    .click();
  const emptyRegion = page.locator('[data-pomegranate-region-surface="left"]');
  await expect(emptyRegion.locator('[data-widget-type]')).toHaveCount(0);
  const source = page.locator('[data-widget-type="systems.world-state"]');
  const sourceIdentity = await captureWidgetIdentity(source);
  let originRect = await source.boundingBox();
  const stageBox = await page.locator('[data-pomegranate-dock="main"]').boundingBox();
  if (!stageBox) throw new Error('Expected Scene stage geometry.');
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }]);
  await expectActiveDrag(sourceIdentity, { reservationCount: 0, originRect });
  await finishPointerDrag(page);
  await expect(source).toHaveAttribute('data-pomegranate-placement', 'floating');
  const before = await capturePlacementSnapshot(source);
  const beforeRevision = await workbenchRevision(page);
  const targetBox = await emptyRegion.boundingBox();
  if (!targetBox) throw new Error('Expected empty composer region geometry.');
  const handle = widgetDragSurface(source);
  originRect = await source.boundingBox();
  await beginPointerDrag(page, handle);
  const target = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  await movePointerPath(page, [target]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'region');
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  await dispatchPointerCancel(page, handle, target);

  expect(await capturePlacementSnapshot(source)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
});

interactionTest('grouped-active-reorder-commit', async ({ page }) => {
  const group = await createReferenceGroup(page);
  const active = group.getByRole('tab', { name: 'Theme Materials' });
  const first = group.getByRole('tab', { name: 'Characters (Story)' });
  const firstBox = await first.boundingBox();
  if (!firstBox) throw new Error('Expected grouped reorder geometry.');
  const beforeRevision = await workbenchRevision(page);
  await beginPointerDrag(page, active);
  await movePointerPath(page, [{ x: firstBox.x + 2, y: firstBox.y + firstBox.height / 2 }]);
  await expect(page.locator('[data-pom-part="tab.insertion"]')).toBeVisible();
  await page.mouse.up();

  await expect(group.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
  expect(await workbenchRevision(page)).toBe(beforeRevision + 1);
  await expectNoWidgetDragResidue(page);
});

interactionTest('grouped-active-to-existing-group-blur', async ({ page, expectActiveDrag }) => {
  const sourceGroup = await createReferenceGroup(page);
  const targetGroup = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Room Ambience', exact: true }) });
  const sourceRoot = page.locator('[data-widget-type="settings.theme-materials"]');
  const before = await capturePlacementSnapshot(sourceRoot);
  const originRect = await sourceRoot.boundingBox();
  const beforeRevision = await workbenchRevision(page);
  const sourceTab = sourceGroup.getByRole('tab', { name: 'Theme Materials' });
  const sourceIdentity = await captureWidgetIdentity(sourceTab);
  const targetTabs = targetGroup.getByRole('tablist', { name: 'Grouped Widgets' });
  const start = await beginPointerDrag(page, sourceTab);
  const targetBox = await targetTabs.boundingBox();
  if (!targetBox) throw new Error('Expected existing group geometry.');
  await movePointerPath(page, [
    { x: start.x, y: start.y + 18 },
    { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }
  ]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'tab');
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  const groupBox = await targetGroup.boundingBox();
  const viewport = page.viewportSize();
  if (!groupBox || !viewport) throw new Error('Expected grouped-tab insertion screenshot geometry.');
  const clipX = Math.max(0, groupBox.x - 180);
  const clipY = Math.max(0, groupBox.y - 32);
  await expectWindowsClippedScreenshot(page, 'widget-grouped-tab-insertion.png', {
    x: clipX,
    y: clipY,
    width: Math.min(viewport.width - clipX, groupBox.width + 180),
    height: Math.min(viewport.height - clipY, groupBox.height + 64)
  });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();

  expect(await capturePlacementSnapshot(sourceRoot)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
  await expectNoWidgetDragResidue(page);
});

interactionTest('grouped-inactive-direct-float', async ({ page, expectActiveDrag }) => {
  const group = await createReferenceGroup(page);
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const sourceTab = group.getByRole('tab', { name: 'Theme Materials' });
  const originRect = await group.locator('[data-widget-type]').boundingBox();
  const sourceIdentity = await captureWidgetIdentity(sourceTab);
  const stage = page.locator('[data-pomegranate-region-surface="stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error('Expected open Scene canvas geometry.');
  const beforeRevision = await workbenchRevision(page);
  const start = await beginPointerDrag(page, sourceTab);
  await movePointerPath(page, [
    { x: start.x + 18, y: start.y },
    { x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }
  ]);
  await expectActiveDrag(sourceIdentity, { reservationCount: 0, originRect });
  await test.info().attach('grouped-inactive-direct-float', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  const lifted = await page.locator('[data-pom-part="widget.drag-preview"]').isVisible();
  expect.soft(lifted).toBe(true);
  if (lifted) {
    await finishPointerDrag(page);
    await expect(page.locator('[data-widget-type="settings.theme-materials"][data-pomegranate-placement="floating"]')).toBeVisible();
    expect(await workbenchRevision(page)).toBeGreaterThan(beforeRevision);
  } else {
    await page.mouse.up();
  }
  await expectNoWidgetDragResidue(page);
});

interactionTest('grouped-inactive-insert-after-unmount', async ({ page, expectActiveDrag }) => {
  const group = await createReferenceGroup(page);
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const tabsBefore = await group.getByRole('tab').allTextContents();
  const sourceTab = group.getByRole('tab', { name: 'Theme Materials' });
  const originRect = await group.locator('[data-widget-type]').boundingBox();
  const sourceIdentity = await captureWidgetIdentity(sourceTab);
  const targetBody = page.getByRole('article', { name: 'World State' })
    .locator('[data-pom-part="widget.content"]');
  const targetBox = await targetBody.boundingBox();
  if (!targetBox) throw new Error('Expected insert-after target geometry.');
  const beforeRevision = await workbenchRevision(page);
  const start = await beginPointerDrag(page, sourceTab);
  await movePointerPath(page, [
    { x: start.x, y: start.y + 18 },
    { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height * 0.88 }
  ]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'insert-after');
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  await page.getByRole('tab', { name: 'Library' }).evaluate((button: HTMLButtonElement) => button.click());
  await expectNoWidgetDragResidue(page);
  await page.mouse.up();
  await page.getByRole('tab', { name: 'Scene' }).click();

  const restored = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Theme Materials', exact: true }) });
  await expect(restored.getByRole('tab')).toHaveText(tabsBefore);
  await expect(restored.getByRole('tab', { name: 'Characters (Story)' })).toHaveAttribute('aria-selected', 'true');
  expect(await workbenchRevision(page)).toBe(beforeRevision + 2);
});

interactionTest('singleton-group-existing', async ({ page }) => {
  const group = await createReferenceGroup(page);
  const source = page.locator('[data-widget-type="settings.theme-materials"]');
  const before = await capturePlacementSnapshot(source);
  const tabsBefore = await group.getByRole('tab').allTextContents();
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();

  const restored = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Theme Materials', exact: true }) });
  await expect(restored.getByRole('tab')).toHaveText(tabsBefore);
  expect(await capturePlacementSnapshot(page.locator('[data-widget-type="settings.theme-materials"]'))).toEqual(before);
  await expectNoWidgetDragResidue(page);
});

interactionTest('singleton-insert-before-undo', async ({ page, expectActiveDrag }) => {
  const source = page.locator('[data-widget-type="systems.world-state"]');
  const before = await capturePlacementSnapshot(source);
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  const targetBody = page.getByRole('article', { name: 'Characters (Story)' })
    .locator('[data-pom-part="widget.content"]');
  const targetBox = await targetBody.boundingBox();
  if (!targetBox) throw new Error('Expected insert-before target geometry.');
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height * 0.12
  }]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'insert-before');
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await expectActiveDrag(sourceIdentity, { reservationCount: 1, originRect });
  await finishPointerDrag(page);
  await expect(source).toHaveAttribute('data-pomegranate-edge', 'left');

  await page.getByRole('button', { name: 'Undo layout' }).press('Enter');
  await expect.poll(() => capturePlacementSnapshot(source)).toEqual(before);
  await expectNoWidgetDragResidue(page);
});

test('AUDIT-P2-RESIZE-PERSISTENCE dock and shelf dimensions survive save and reload', async ({ page }) => {
  await dragToShelfRail(
    page,
    widgetDragSurface(page.getByRole('article', { name: 'Room Ambience' })),
    'left'
  );
  const left = page.getByRole('separator', { name: 'Resize left toolbar' });
  const right = page.getByRole('separator', { name: 'Resize right toolbar' });
  const shelf = page.getByRole('separator', { name: 'Resize primary shelf in left' });
  await left.focus();
  await left.press('ArrowRight');
  await right.focus();
  await right.press('End');
  await shelf.focus();
  await shelf.press('ArrowDown');
  await expect(left).toHaveAttribute('aria-valuenow', '294');
  await expect(right).toHaveAttribute('aria-valuenow', '420');
  await expect(shelf).toHaveAttribute('aria-valuenow', '45');

  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '294');
  await expect(page.getByRole('separator', { name: 'Resize right toolbar' })).toHaveAttribute('aria-valuenow', '420');
  await expect(page.getByRole('separator', { name: 'Resize primary shelf in left' })).toHaveAttribute('aria-valuenow', '45');
});

test('AUDIT-P2-KEYBOARD-GROUP grouped tabs reorder and persist without pointer ownership', async ({ page }) => {
  const group = await createReferenceGroup(page);
  await group.getByRole('tab', { name: 'Theme Materials' }).press('Control+Shift+ArrowLeft');
  await expect(group.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  const restored = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Theme Materials', exact: true }) });
  await expect(restored.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
});

test('AUDIT-P2-PEN-CANCEL pen lift exposes the same drag state and cancels exactly', async ({ page }) => {
  const source = page.locator('[data-widget-type="systems.world-state"]');
  const before = await capturePlacementSnapshot(source);
  const originRect = await source.boundingBox();
  const sourceIdentity = await captureWidgetIdentity(source);
  const beforeRevision = await workbenchRevision(page);
  const handle = widgetDragSurface(source);
  const box = await handle.boundingBox();
  const element = await handle.elementHandle();
  if (!box || !element) throw new Error('Expected pen drag geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const end = { x: start.x + 28, y: start.y + 28 };
  await element.dispatchEvent('pointerdown', {
    pointerId: 31,
    pointerType: 'pen',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: start.x,
    clientY: start.y
  });
  await element.dispatchEvent('pointermove', {
    pointerId: 31,
    pointerType: 'pen',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: end.x,
    clientY: end.y
  });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await expectActiveWidgetDrag(page, sourceIdentity, { reservationCount: 'at-most-one', originRect });
  await dispatchPointerCancel(page, handle, end, 'pen', 31);
  expect(await capturePlacementSnapshot(source)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
});

test('AUDIT-P2-TOUCH-COMMIT deliberate coarse hold lifts and docks through the same intent model', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    isMobile: true,
    ...(baseURL === undefined ? {} : { baseURL })
  });
  const touchPage = await context.newPage();
  try {
    await touchPage.goto('/');
    await touchPage.evaluate(() => window.localStorage.clear());
    await touchPage.reload();
    await touchPage.evaluate(() => document.fonts.ready);
    expect(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const source = touchPage.locator('[data-widget-type="systems.world-state"]');
    const before = await capturePlacementSnapshot(source);
    const originRect = await source.boundingBox();
    const sourceIdentity = await captureWidgetIdentity(source);
    const beforeRevision = await workbenchRevision(touchPage);
    const handle = widgetDragSurface(source);
    const grip = await handle.getAttribute('data-widget-touch-drag-grip') === null
      ? handle.locator('[data-widget-touch-drag-grip]')
      : handle;
    const handleBox = await grip.boundingBox();
    if (!handleBox) throw new Error('Expected touch drag geometry.');
    const handleElement = await grip.elementHandle();
    if (!handleElement) throw new Error('Expected a connected touch drag grip.');
    const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
    await handleElement.dispatchEvent('pointerdown', {
      pointerId: 18,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: start.x,
      clientY: start.y
    });
    await touchPage.waitForTimeout(190);
    await handleElement.dispatchEvent('pointermove', {
      pointerId: 18,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: start.x,
      clientY: start.y + 20
    });
    await expect(touchPage.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
    const railBox = await touchPage
      .locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"][data-drop-rail-kind="append"]')
      .last()
      .boundingBox();
    if (!railBox) throw new Error('Expected touch shelf rail geometry.');
    const end = { x: railBox.x + railBox.width / 2, y: railBox.y + railBox.height / 2 };
    await handleElement.dispatchEvent('pointermove', {
      pointerId: 18,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: end.x,
      clientY: end.y
    });
    await expectActiveWidgetDrag(touchPage, sourceIdentity, { reservationCount: 1, originRect });
    await handleElement.dispatchEvent('pointerup', {
      pointerId: 18,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      clientX: end.x,
      clientY: end.y
    });
    await expectNoWidgetDragResidue(touchPage);
    const after = await capturePlacementSnapshot(source);
    expect(after).not.toEqual(before);
    expect(after.region).toBe('left');
    expect(after.shelf).toMatch(/^left-shelf-/);
    expect(await workbenchRevision(touchPage)).toBe(beforeRevision + 1);
  } finally {
    await context.close();
  }
});

test('AUDIT-P2-TOUCH-GROUP-REORDER deliberate coarse hold reorders a grouped tab in its corridor', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    isMobile: true,
    ...(baseURL === undefined ? {} : { baseURL })
  });
  const touchPage = await context.newPage();
  try {
    await touchPage.goto('/');
    await touchPage.evaluate(() => window.localStorage.clear());
    await touchPage.reload();
    await touchPage.evaluate(() => document.fonts.ready);
    expect(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const group = await createReferenceGroup(touchPage);
    const source = group.getByRole('tab', { name: 'Theme Materials' });
    await expect(source).toHaveAttribute('data-tab-touch-reorder-grip', '');
    const target = group.getByRole('tab', { name: 'Characters (Story)' });
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    const sourceElement = await source.elementHandle();
    if (!sourceBox || !targetBox || !sourceElement) throw new Error('Expected grouped touch reorder geometry.');
    const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 };
    const end = { x: targetBox.x + 2, y: targetBox.y + targetBox.height / 2 };
    const beforeRevision = await workbenchRevision(touchPage);
    await sourceElement.dispatchEvent('pointerdown', {
      pointerId: 41, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
      clientX: start.x, clientY: start.y
    });
    await touchPage.waitForTimeout(190);
    await sourceElement.dispatchEvent('pointermove', {
      pointerId: 41, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
      clientX: end.x, clientY: end.y
    });
    await expect(touchPage.locator('[data-pom-part="tab.insertion"]')).toBeVisible();
    await sourceElement.dispatchEvent('pointerup', {
      pointerId: 41, pointerType: 'touch', isPrimary: true, button: 0, buttons: 0,
      clientX: end.x, clientY: end.y
    });
    await expect(group.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
    expect(await workbenchRevision(touchPage)).toBe(beforeRevision + 1);
    await expectNoWidgetDragResidue(touchPage);
  } finally {
    await context.close();
  }
});

test('AUDIT-P2-TOUCH-GROUP-TEAROFF one coarse departure leaves the tab corridor and floats directly', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    isMobile: true,
    ...(baseURL === undefined ? {} : { baseURL })
  });
  const touchPage = await context.newPage();
  try {
    await touchPage.goto('/');
    await touchPage.evaluate(() => window.localStorage.clear());
    await touchPage.reload();
    await touchPage.evaluate(() => document.fonts.ready);
    expect(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const group = await createReferenceGroup(touchPage);
    const source = group.getByRole('tab', { name: 'Theme Materials' });
    const originRect = await group.locator('[data-widget-type]').boundingBox();
    const sourceIdentity = await captureWidgetIdentity(source);
    const stageBox = await touchPage.locator('[data-pomegranate-region-surface="stage"]').boundingBox();
    const sourceBox = await source.boundingBox();
    const sourceElement = await source.elementHandle();
    if (!originRect || !stageBox || !sourceBox || !sourceElement) throw new Error('Expected grouped touch tear-off geometry.');
    const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 };
    const departure = { x: start.x + 60, y: sourceBox.y + sourceBox.height + 12 };
    await sourceElement.dispatchEvent('pointerdown', {
      pointerId: 42, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
      clientX: start.x, clientY: start.y
    });
    await touchPage.waitForTimeout(190);
    await sourceElement.dispatchEvent('pointermove', {
      pointerId: 42, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
      clientX: departure.x, clientY: departure.y
    });
    await expect(touchPage.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
    const end = { x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 };
    await sourceElement.dispatchEvent('pointermove', {
      pointerId: 42, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
      clientX: end.x, clientY: end.y
    });
    await expectActiveWidgetDrag(touchPage, sourceIdentity, { reservationCount: 0, originRect });
    await sourceElement.dispatchEvent('pointerup', {
      pointerId: 42, pointerType: 'touch', isPrimary: true, button: 0, buttons: 0,
      clientX: end.x, clientY: end.y
    });
    await expect(touchPage.locator('[data-widget-type="settings.theme-materials"][data-pomegranate-placement="floating"]')).toBeVisible();
    await expectNoWidgetDragResidue(touchPage);
  } finally {
    await context.close();
  }
});
