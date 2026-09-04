import { expect, type Locator, type Page } from '@playwright/test';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface RectSnapshot {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface InteractionEvidence {
  readonly proxyCount: number;
  readonly proxyText: string;
  readonly proxyArticleCount: number;
  readonly proxyInteractiveCount: number;
  readonly overlayText: string;
  readonly activeReservationCount: number;
  readonly originVacant: boolean;
  readonly originRect: RectSnapshot | null;
  readonly revision: string | null;
}

export interface ActiveDragExpectation {
  readonly reservationCount: 0 | 1 | 'at-most-one';
  readonly originRect?: RectSnapshot | null;
}

export interface PlacementSnapshot {
  readonly instanceId: string;
  readonly placement: string | null;
  readonly region: string | null;
  readonly shelf: string | null;
  readonly order: string | null;
  readonly group: string | null;
}

export async function beginPointerDrag(page: Page, handle: Locator): Promise<Point> {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected Widget drag-handle geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  return start;
}

export async function movePointerPath(page: Page, points: readonly Point[]): Promise<void> {
  for (const point of points) await page.mouse.move(point.x, point.y, { steps: 4 });
}

export async function finishPointerDrag(page: Page): Promise<void> {
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
}

export async function cancelPointerDrag(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expectNoWidgetDragResidue(page);
}

export async function dispatchPointerCancel(
  page: Page,
  handle: Locator,
  point: Point,
  pointerType: 'mouse' | 'pen' | 'touch' = 'mouse',
  pointerId = 1
): Promise<void> {
  const element = await handle.elementHandle();
  if (!element) throw new Error('Expected a connected Widget drag handle.');
  await element.dispatchEvent('pointercancel', {
    pointerId,
    pointerType,
    isPrimary: true,
    button: 0,
    clientX: point.x,
    clientY: point.y
  });
  await page.mouse.up();
  await expectNoWidgetDragResidue(page);
}

export async function expectNoWidgetDragResidue(page: Page): Promise<void> {
  await expect(page.locator([
    '[data-pom-part="widget.drag-preview"]',
    '[data-pom-part="widget.drop-overlay"]',
    '[data-pom-part="widget.dock-slot"]',
    '[data-pom-part="widget.tab-insertion"]',
    '[data-pom-part="tab.drag-preview"]',
    '[data-pom-part="tab.insertion"]'
  ].join(', '))).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/pom-(widget-drag|tab-reorder)-active/);
  await expect(page.locator('main')).not.toHaveAttribute('data-drag-reveal-left');
  await expect(page.locator('main')).not.toHaveAttribute('data-drag-reveal-right');
}

export async function expectActiveWidgetDrag(
  page: Page,
  origin: Locator | string,
  expectation: ActiveDragExpectation
): Promise<InteractionEvidence> {
  const evidence = await captureInteractionEvidence(page, origin);
  expect(evidence.proxyCount).toBe(1);
  expect(evidence.proxyArticleCount).toBe(0);
  expect(evidence.proxyInteractiveCount).toBe(0);
  expect(evidence.overlayText).toBe('');
  expect(evidence.originVacant).toBe(true);
  if (expectation.reservationCount === 'at-most-one') {
    expect(evidence.activeReservationCount).toBeLessThanOrEqual(1);
  } else {
    expect(evidence.activeReservationCount).toBe(expectation.reservationCount);
  }
  await expect(page.locator('body')).toHaveClass(/pom-widget-drag-active/);

  const proxyRect = await page.locator('[data-pom-part="widget.drag-preview"]').boundingBox();
  const viewport = page.viewportSize();
  if (!proxyRect || !viewport) throw new Error('Expected visible drag proxy and viewport geometry.');
  expect(proxyRect.x).toBeGreaterThanOrEqual(0);
  expect(proxyRect.y).toBeGreaterThanOrEqual(0);
  expect(proxyRect.x + proxyRect.width).toBeLessThanOrEqual(viewport.width);
  expect(proxyRect.y + proxyRect.height).toBeLessThanOrEqual(viewport.height);

  if (expectation.originRect) {
    expect(evidence.originRect).not.toBeNull();
    expect(evidence.originRect?.width).toBeCloseTo(expectation.originRect.width, 0);
    expect(evidence.originRect?.height).toBeCloseTo(expectation.originRect.height, 0);
  }
  return evidence;
}

export async function dragTo(page: Page, handle: Locator, point: Point): Promise<void> {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected drag handle geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, { steps: 6 });
  await page.mouse.up();
}

export async function dragToShelfRail(
  page: Page,
  handle: Locator,
  region: string,
  railKind: 'before' | 'between' | 'after' | 'append' = 'append'
): Promise<void> {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected drag handle geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  if (await handle.getAttribute('data-group-tab')) {
    await page.mouse.move(start.x, box.y + box.height + 10, { steps: 3 });
  } else {
    await page.mouse.move(start.x + 12, start.y + 12, { steps: 3 });
  }
  const rail = page
    .locator(`[data-pom-part="widget.drop-rail"][data-drop-region="${region}"][data-drop-rail-kind="${railKind}"]`)
    .last();
  const railBox = await rail.boundingBox();
  if (!railBox) throw new Error(`Expected ${region} ${railKind} shelf rail geometry.`);
  await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2, { steps: 6 });
  await expect(rail).toHaveAttribute('data-active', 'true');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
}

export async function tearOffTo(page: Page, handle: Locator, point: Point): Promise<void> {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected grouped Widget tab geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, box.y + box.height + 10, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await page.mouse.move(point.x, point.y, { steps: 8 });
  await page.mouse.up();
}

export async function dragToWidgetTab(page: Page, handle: Locator, target: Locator): Promise<void> {
  const sourceBox = await handle.boundingBox();
  if (!sourceBox) throw new Error('Expected Widget grouping geometry.');
  const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 12, start.y + 12, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  const targetBox = await widgetDragSurface(target).boundingBox();
  if (!targetBox) throw new Error('Expected live Widget grouping target geometry.');
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'tab');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
}

export function widgetDragSurface(widget: Locator): Locator {
  return widget
    .locator(':scope > header[data-widget-drag-surface], :scope > .widget-frame > header[data-widget-drag-surface]')
    .or(widget.locator('xpath=ancestor::section[@data-widget-group][1]//button[@data-widget-drag-surface][@aria-selected="true"]'))
    .first();
}

export async function captureWidgetIdentity(origin: Locator): Promise<string> {
  const originIdentity = await origin.evaluate((node) => {
    const root = node.matches('[data-pomegranate-widget]')
      ? node
      : node.closest('[data-pomegranate-widget]') ?? node.querySelector('[data-pomegranate-widget]');
    return root?.getAttribute('data-pomegranate-widget')
      ?? node.getAttribute('data-group-tab')
      ?? node.closest('[data-group-tab]')?.getAttribute('data-group-tab')
      ?? null;
  });
  if (!originIdentity) throw new Error('Expected an origin Widget identity.');
  return originIdentity;
}

export async function captureInteractionEvidence(page: Page, origin: Locator | string): Promise<InteractionEvidence> {
  const originIdentity = typeof origin === 'string' ? origin : await captureWidgetIdentity(origin);
  return page.evaluate((instanceId) => {
    const originNode = [...document.querySelectorAll<HTMLElement>('[data-pomegranate-widget]')]
      .find((node) => node.getAttribute('data-pomegranate-widget') === instanceId);
    const visualRoot = originNode?.closest<HTMLElement>('[data-widget-type]') ?? originNode;
    const proxy = document.querySelector<HTMLElement>('[data-pom-part="widget.drag-preview"]');
    const overlay = document.querySelector<HTMLElement>('[data-pom-part="widget.drop-overlay"]');
    const box = visualRoot?.getBoundingClientRect();
    return {
      proxyCount: document.querySelectorAll('[data-pom-part="widget.drag-preview"]').length,
      proxyText: proxy?.textContent?.trim() ?? '',
      proxyArticleCount: proxy?.querySelectorAll('article').length ?? 0,
      proxyInteractiveCount: proxy?.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])').length ?? 0,
      overlayText: overlay?.textContent?.trim() ?? '',
      activeReservationCount: document.querySelectorAll('[data-pom-part="widget.dock-slot"], [data-pom-part="widget.tab-insertion"]').length,
      originVacant: visualRoot?.hasAttribute('data-widget-drag-placeholder') ?? false,
      originRect: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      revision: document.querySelector('main')?.getAttribute('data-workbench-revision') ?? null
    };
  }, originIdentity);
}

export async function capturePlacementSnapshot(widget: Locator): Promise<PlacementSnapshot> {
  return widget.evaluate((node) => {
    const widgetIdentity = node.matches('[data-pomegranate-widget]')
      ? node as HTMLElement
      : node.closest<HTMLElement>('[data-pomegranate-widget]')
        ?? node.querySelector<HTMLElement>('[data-pomegranate-widget]')
        ?? node as HTMLElement;
    const root = node.matches('[data-widget-type]')
      ? node as HTMLElement
      : node.closest<HTMLElement>('[data-widget-type]')
        ?? widgetIdentity.closest<HTMLElement>('[data-widget-type]')
        ?? node as HTMLElement;
    return {
      instanceId: widgetIdentity.getAttribute('data-pomegranate-widget') ?? '',
      placement: root.getAttribute('data-pomegranate-placement'),
      region: root.getAttribute('data-pomegranate-region'),
      shelf: root.getAttribute('data-pomegranate-shelf'),
      order: root.getAttribute('data-pomegranate-order'),
      group: root.closest('[data-widget-group]')?.getAttribute('data-widget-group-id') ?? null
    };
  });
}

export async function invokeWidgetAction(widget: Locator, name: string): Promise<void> {
  await widget.getByRole('button', { name: 'Widget actions' }).click();
  await widget.getByRole('menuitem', { name }).click();
}
