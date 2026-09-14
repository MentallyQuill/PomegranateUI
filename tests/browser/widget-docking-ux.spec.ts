import { expect, test, type Page } from '@playwright/test';
import { beginPointerDrag, cancelPointerDrag, dragToShelfRail, dragToWidgetTab, widgetDragSurface } from './support/widget-interaction-driver.js';

const themes = ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const;

async function freshTheme(page: Page, theme: typeof themes[number]) {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}

test('a singleton fills its shelf after a cross-dock move in every theme', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const theme of themes) {
    await freshTheme(page, theme);
    const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
    await dragToShelfRail(page, widgetDragSurface(materials), 'right', 'before');
    await expect(materials).toBeVisible();
    const allocation = await materials.evaluate((article) => {
      const shelf = article.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      return {
        widgetHeight: article.getBoundingClientRect().height,
        availableHeight: shelf.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        contentOverflow: article.querySelector('[data-pom-part="widget.content"]')!.scrollHeight
          - article.querySelector('[data-pom-part="widget.content"]')!.clientHeight
      };
    });
    await testInfo.attach(`${theme}-allocation`, { body: JSON.stringify(allocation), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`${theme}-shelf.png`) });
    expect(allocation.widgetHeight, `${theme}: singleton should fill the shelf`).toBeGreaterThan(allocation.availableHeight - 3);
    expect(allocation.contentOverflow, `${theme}: controls should fit at desktop height`).toBeLessThanOrEqual(2);
    const characters = page.getByRole('article', { name: 'Characters (Story)', exact: true });
    const source = await characters.evaluate((article) => {
      const shelf = article.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      return { widget: article.getBoundingClientRect().height, shelf: shelf.getBoundingClientRect().height - parseFloat(style.paddingBottom) };
    });
    expect(source.widget, `${theme}: source must not retain a phantom row`).toBeGreaterThan(source.shelf - 3);
  }
});

test('an insertion stays stable under a stationary pointer and one-pixel adjustments', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(600, 350);
  const body = await page.getByRole('article', { name: 'World State', exact: true }).locator(':scope > [data-pom-part="widget.content"]').boundingBox();
  if (!body) throw new Error('Expected World State body geometry.');
  const preview = page.locator('[data-pom-part="widget.snap-preview"]');
  const samples = [];
  const state = () => preview.evaluateAll((nodes) => nodes.map((node) => ({
    intent: node.getAttribute('data-drop-intent'), region: node.getAttribute('data-drop-region'),
    y: node.getBoundingClientRect().y
  })));
  for (let ratio = 0; ratio <= 1; ratio += .05) {
    const point = { x: body.x + body.width / 2, y: body.y + body.height * ratio };
    await page.mouse.move(point.x, point.y);
    const first = await state();
    for (const delta of [0, 1, 0, -1, 0]) {
      await page.mouse.move(point.x + delta, point.y);
      samples.push({ point, first, next: await state() });
    }
  }
  await testInfo.attach('stationary-preview-samples', { body: JSON.stringify(samples), contentType: 'application/json' });
  for (const sample of samples) {
    expect(sample.next.map(({ intent, region }) => ({ intent, region })), JSON.stringify(sample.point))
      .toEqual(sample.first.map(({ intent, region }) => ({ intent, region })));
    if (sample.first[0] && sample.next[0]) expect(Math.abs(sample.first[0].y - sample.next[0].y)).toBeLessThanOrEqual(1);
  }
  await cancelPointerDrag(page);
});

test('a held docking preview follows a viewport resize without another pointer move', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  await beginPointerDrag(page, widgetDragSurface(page.getByRole('article', { name: 'Theme Materials', exact: true })));
  await page.mouse.move(600, 350);
  const body = await page.getByRole('article', { name: 'World State', exact: true }).locator(':scope > [data-pom-part="widget.content"]').boundingBox();
  if (!body) throw new Error('Expected World State body geometry.');
  await page.mouse.move(body.x + body.width * .8, body.y + body.height * .1);
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toHaveCount(1);
  await page.setViewportSize({ width: 1360, height: 720 });
  await expect.poll(async () => {
    const snap = await page.locator('[data-pom-part="widget.snap-preview"]').boundingBox();
    const slot = await page.locator('[data-pom-part="widget.dock-slot"]').boundingBox();
    return snap && slot ? Math.abs(snap.x - slot.x) + Math.abs(snap.width - slot.width) : Infinity;
  }).toBeLessThanOrEqual(1);
  await cancelPointerDrag(page);
});

async function liftCatalogWidget(page: Page) {
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const box = await result.boundingBox();
  if (!box) throw new Error('Expected Catalog result geometry.');
  await page.mouse.move(box.x + 8, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + 14, box.y + 8);
  await expect(catalog).toBeHidden();
}

for (const source of ['existing', 'Catalog'] as const) {
  for (const relation of ['before', 'after'] as const) {
    test(`${source} ${relation} insertion uses the widget boundary within a shared shelf`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await freshTheme(page, 'Bunny');
      const targetName = relation === 'after' ? 'World State' : 'Room Ambience';
      const target = page.getByRole('article', { name: targetName, exact: true });
      if (source === 'existing') await beginPointerDrag(page, widgetDragSurface(page.getByRole('article', { name: 'Theme Materials', exact: true })));
      else await liftCatalogWidget(page);
      await page.mouse.move(600, 350);
      const body = await target.locator(':scope > [data-pom-part="widget.content"]').boundingBox();
      if (!body) throw new Error('Expected target body geometry.');
      await page.mouse.move(body.x + body.width / 2, body.y + body.height * (relation === 'before' ? .1 : .9));
      await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', `insert-${relation}`);
      const slot = await page.locator('[data-pom-part="widget.dock-slot"]').boundingBox();
      const targetBox = await target.evaluate(node => (node.closest('[data-widget-group]') ?? node).getBoundingClientRect().toJSON());
      expect(slot).not.toBeNull();
      expect(Math.abs(slot!.y + slot!.height / 2 - (relation === 'before' ? targetBox!.y : targetBox!.y + targetBox!.height))).toBeLessThanOrEqual(6);
      await page.screenshot({ path: testInfo.outputPath('before-release.png') });
      await page.mouse.up();
      await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-catalog-placement-proxy]')).toHaveCount(0);
      if (source === 'Catalog') await page.getByRole('button', { name: 'Close Widget Catalog' }).click();
      const right = page.getByRole('region', { name: 'Right instruments column 1', exact: true });
      await expect(right.locator(':scope > .dock-shelf')).toHaveCount(1);
      const titles = await right.locator('[data-pomegranate-widget]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
      expect(titles[0]).toBe('World State');
      expect(titles[2]).toBe('Room Ambience');
      expect(titles[1]).toBe(source === 'existing' ? 'Theme Materials' : 'Library');
      await page.screenshot({ path: testInfo.outputPath('after-release.png') });
      await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
      await expect(right.locator('[data-pomegranate-widget]')).toHaveCount(2);
    });
  }
}

test('a Catalog docking preview follows resize without pointer movement', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  await liftCatalogWidget(page);
  const body = await page.getByRole('article', { name: 'World State', exact: true }).locator(':scope > [data-pom-part="widget.content"]').boundingBox();
  if (!body) throw new Error('Expected World State body geometry.');
  await page.mouse.move(body.x + body.width * .8, body.y + body.height * .1);
  await expect(page.locator('[data-pom-part="widget.dock-slot"]')).toHaveCount(1);
  await page.setViewportSize({ width: 1360, height: 720 });
  await expect.poll(async () => {
    const snap = await page.locator('[data-pom-part="widget.snap-preview"]').boundingBox();
    const slot = await page.locator('[data-pom-part="widget.dock-slot"]').boundingBox();
    return snap && slot ? Math.abs(snap.x - slot.x) + Math.abs(snap.width - slot.width) : Infinity;
  }).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
});

test('Catalog keeps a collapsed dock revealed while moving from its edge into a widget', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  await page.getByRole('button', { name: 'Close left toolbar' }).click();
  await liftCatalogWidget(page);
  const surface = await page.locator('#workbench').boundingBox();
  if (!surface) throw new Error('Expected Workbench geometry.');
  await page.mouse.move(surface.x + 4, surface.y + surface.height / 2);
  const main = page.locator('main[data-pom-theme-root]');
  await expect(main).toHaveAttribute('data-drag-reveal-left', 'true');
  const widget = await page.getByRole('article', { name: 'Characters (Story)', exact: true }).boundingBox();
  if (!widget) throw new Error('Expected revealed widget geometry.');
  await page.mouse.move(widget.x + widget.width / 2, widget.y + 12, { steps: 8 });
  await expect(main).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-region', 'left');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(main).not.toHaveAttribute('data-drag-reveal-left');
  await expect(main).toHaveClass(/left-collapsed/);
});

test('moving the final widget out of a shelf removes its space and divider', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Bunny');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  const right = page.getByRole('region', { name: 'Right instruments column 1', exact: true });
  await dragToShelfRail(page, widgetDragSurface(materials), 'right', 'before');
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(2);
  await dragToWidgetTab(page, widgetDragSurface(materials), page.getByRole('article', { name: 'World State', exact: true }));
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(1);
  await expect(right.locator(':scope > .shelf-resize-handle')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('empty-shelf-removed.png') });
  await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(2);
  await expect(right.locator(':scope > .shelf-resize-handle')).toHaveCount(1);
  await expect(materials).toBeVisible();
});

test('one grouped item fills a short shelf without clipping its controls', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 580 });
  for (const theme of themes) {
    await freshTheme(page, theme);
    const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
    const characters = page.getByRole('article', { name: 'Characters (Story)', exact: true });
    await dragToWidgetTab(page, widgetDragSurface(materials), characters);
    const group = page.getByRole('group', { name: 'Widget group', exact: true }).filter({ has: page.getByRole('tab', { name: 'Theme Materials', exact: true }) });
    const allocation = await group.evaluate((node) => {
      const shelf = node.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      const content = node.querySelector('[data-pom-part="widget.content"]')!;
      return {
        height: node.getBoundingClientRect().height,
        available: shelf.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        contentHeight: content.clientHeight
      };
    });
    expect(allocation.height, theme).toBeGreaterThan(allocation.available - 3);
    expect(allocation.contentHeight, theme).toBeGreaterThan(100);
    const lastControl = await group.getByRole('slider', { name: 'Frost Level' }).boundingBox();
    const groupBox = await group.boundingBox();
    expect(lastControl).not.toBeNull();
    expect(lastControl!.y + lastControl!.height, theme).toBeLessThanOrEqual(groupBox!.y + groupBox!.height);
    await page.screenshot({ path: testInfo.outputPath(`${theme}-group-short.png`) });
  }
});
