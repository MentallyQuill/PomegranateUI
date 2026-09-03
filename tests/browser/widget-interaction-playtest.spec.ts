import { expect, test, type Page } from '@playwright/test';

import {
  beginPointerDrag,
  cancelPointerDrag,
  captureInteractionEvidence,
  capturePlacementSnapshot,
  dispatchPointerCancel,
  dragToShelfRail,
  dragToWidgetTab,
  expectNoWidgetDragResidue,
  finishPointerDrag,
  invokeWidgetAction,
  movePointerPath,
  widgetDragSurface
} from './support/widget-interaction-driver.ts';
import { INTERACTION_CASES } from './support/widget-interaction-matrix.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

async function createGroup(page: Page, sourceName: string, targetName: string) {
  const source = page.getByRole('article', { name: sourceName });
  const target = page.getByRole('article', { name: targetName });
  await dragToWidgetTab(page, widgetDragSurface(source), target);
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
  const start = await beginPointerDrag(page, tab);
  await movePointerPath(page, [
    { x: start.x + 18, y: start.y },
    { x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }
  ]);
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
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height * 0.12 }]);
  const evidence = await captureInteractionEvidence(page, source);
  await testInfo.attach('AUDIT-P1-SINGLE-PRESENTATION', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  await testInfo.attach('AUDIT-P1-SINGLE-PRESENTATION-evidence', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json'
  });
  expect(evidence.proxyCount).toBe(1);
  expect.soft(evidence.proxyArticleCount).toBe(0);
  expect.soft(evidence.proxyInteractiveCount).toBe(0);
  expect.soft(evidence.overlayText).toBe('');
  expect.soft(evidence.originVacant).toBe(true);
  expect.soft(evidence.activeReservationCount).toBe(1);
  await cancelPointerDrag(page);
});

test('AUDIT-P1-GROUP-ACTIONS grouped Widget tabs do not cover the active Widget actions', async ({ page }, testInfo) => {
  const article = page.getByRole('article', { name: 'Room Ambience' });
  const group = article.locator('xpath=ancestor::*[@data-widget-group][1]');
  await group.hover({ position: { x: 8, y: 50 } });
  const action = article.getByRole('button', { name: 'Widget actions' });
  await expect(action).toHaveCSS('pointer-events', 'auto');
  const hit = await action.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return {
      actionReceivesPoint: target === node || node.contains(target),
      hitTag: target?.tagName ?? null,
      hitRole: target?.getAttribute('role') ?? null,
      hitClass: target?.getAttribute('class') ?? null
    };
  });
  await testInfo.attach('AUDIT-P1-GROUP-ACTIONS', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  await testInfo.attach('AUDIT-P1-GROUP-ACTIONS-evidence', {
    body: JSON.stringify(hit, null, 2),
    contentType: 'application/json'
  });
  expect(hit.actionReceivesPoint).toBe(true);
});

const implementedCaseIds = new Set<string>();
type PlaytestBody = (args: { page: Page }) => Promise<void>;

function interactionTest(id: string, body: PlaytestBody): void {
  implementedCaseIds.add(id);
  test(id, body);
}

test.afterAll(() => {
  expect([...implementedCaseIds].sort()).toEqual(INTERACTION_CASES.map(({ id }) => id));
});

interactionTest('collapsed-dock-reveal-commit', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle left dock' });
  await toggle.click();
  const source = page.getByRole('article', { name: 'Room Ambience' });
  const beforeRevision = await workbenchRevision(page);
  let start = await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [
    { x: start.x, y: start.y + 28 },
    { x: 18, y: 320 }
  ]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
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
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await finishPointerDrag(page);

  const placed = page.locator('[data-widget-type="story.room-ambience"]');
  await expect(placed).toHaveAttribute('data-pomegranate-edge', 'left');
  expect(await workbenchRevision(page)).toBeGreaterThan(beforeRevision);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-conformance-region="left"]')).toBeVisible();
  await expectNoWidgetDragResidue(page);
});

test('AUDIT-P2-COLLAPSED-DOCK-SYMMETRY accepted right-dock drop expands its destination', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle right dock' });
  await toggle.click();
  const source = page.getByRole('article', { name: 'Theme Materials' });
  const beforeRevision = await workbenchRevision(page);
  const start = await beginPointerDrag(page, widgetDragSurface(source));
  const targetX = await page.evaluate(() => window.innerWidth - 18);
  await movePointerPath(page, [
    { x: start.x, y: start.y + 28 },
    { x: targetX, y: 120 }
  ]);
  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-right', 'true');
  const targetBox = await page.getByRole('article', { name: 'World State' }).boundingBox();
  if (!targetBox) throw new Error('Expected revealed right-dock Widget geometry.');
  await movePointerPath(page, [{ x: targetX, y: targetBox.y + targetBox.height * 0.12 }]);
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toBeVisible();
  await finishPointerDrag(page);

  await expect(page.locator('[data-widget-type="settings.theme-materials"]')).toHaveAttribute('data-pomegranate-edge', 'right');
  expect(await workbenchRevision(page)).toBeGreaterThan(beforeRevision);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-conformance-region="right"]')).toBeVisible();
  await expectNoWidgetDragResidue(page);
});

interactionTest('floating-invalid-cancel', async ({ page }) => {
  await invokeWidgetAction(page.getByRole('article', { name: 'World State' }), 'Float');
  const source = page.locator('[data-widget-type="systems.world-state"][data-pomegranate-placement="floating"]');
  const before = await capturePlacementSnapshot(source);
  const beforeRevision = await workbenchRevision(page);
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: 2, y: 2 }]);
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await cancelPointerDrag(page);

  expect(await capturePlacementSnapshot(source)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
});

interactionTest('floating-to-empty-pointercancel', async ({ page }) => {
  await invokeWidgetAction(page.getByRole('article', { name: 'Characters (Story)' }), 'Dock right');
  await invokeWidgetAction(page.getByRole('article', { name: 'Theme Materials' }), 'Dock right');
  const emptyRegion = page.locator('[data-pomegranate-region-surface="left"]');
  await expect(emptyRegion.locator('[data-widget-type]')).toHaveCount(0);
  const source = page.locator('[data-widget-type="systems.world-state"]');
  const stageBox = await page.locator('[data-pomegranate-dock="main"]').boundingBox();
  if (!stageBox) throw new Error('Expected Scene stage geometry.');
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }]);
  await finishPointerDrag(page);
  await expect(source).toHaveAttribute('data-pomegranate-placement', 'floating');
  const before = await capturePlacementSnapshot(source);
  const beforeRevision = await workbenchRevision(page);
  const targetBox = await emptyRegion.boundingBox();
  if (!targetBox) throw new Error('Expected empty composer region geometry.');
  const handle = widgetDragSurface(source);
  await beginPointerDrag(page, handle);
  const target = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  await movePointerPath(page, [target]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'region');
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

interactionTest('grouped-active-to-existing-group-blur', async ({ page }) => {
  const sourceGroup = await createReferenceGroup(page);
  const targetGroup = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Room Ambience', exact: true }) });
  const sourceRoot = page.locator('[data-widget-type="settings.theme-materials"]');
  const before = await capturePlacementSnapshot(sourceRoot);
  const beforeRevision = await workbenchRevision(page);
  const sourceTab = sourceGroup.getByRole('tab', { name: 'Theme Materials' });
  const targetTabs = targetGroup.getByRole('tablist', { name: 'Grouped Widgets' });
  const start = await beginPointerDrag(page, sourceTab);
  const targetBox = await targetTabs.boundingBox();
  if (!targetBox) throw new Error('Expected existing group geometry.');
  await movePointerPath(page, [
    { x: start.x, y: start.y + 18 },
    { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 }
  ]);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'tab');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();

  expect(await capturePlacementSnapshot(sourceRoot)).toEqual(before);
  expect(await workbenchRevision(page)).toBe(beforeRevision);
  await expectNoWidgetDragResidue(page);
});

interactionTest('grouped-inactive-direct-float', async ({ page }) => {
  const group = await createReferenceGroup(page);
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const sourceTab = group.getByRole('tab', { name: 'Theme Materials' });
  const stage = page.locator('[data-pomegranate-region-surface="stage"]');
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error('Expected open Scene canvas geometry.');
  const beforeRevision = await workbenchRevision(page);
  const start = await beginPointerDrag(page, sourceTab);
  await movePointerPath(page, [
    { x: start.x + 18, y: start.y },
    { x: stageBox.x + stageBox.width * 0.72, y: stageBox.y + 90 }
  ]);
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

interactionTest('grouped-inactive-insert-after-unmount', async ({ page }) => {
  const group = await createReferenceGroup(page);
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const tabsBefore = await group.getByRole('tab').allTextContents();
  const sourceTab = group.getByRole('tab', { name: 'Theme Materials' });
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

interactionTest('singleton-insert-before-undo', async ({ page }) => {
  const source = page.locator('[data-widget-type="systems.world-state"]');
  const before = await capturePlacementSnapshot(source);
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
    const source = touchPage.locator('[data-widget-type="story.room-ambience"]');
    const before = await capturePlacementSnapshot(source);
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
