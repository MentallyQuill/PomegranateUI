import { expect, test, type Page } from '@playwright/test';
import { beginPointerDrag, cancelPointerDrag, dragToShelfRail, dragToWidgetTab, widgetDragSurface } from './support/widget-interaction-driver.js';

const themes = ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const;

test('held widgets retain recognizable content and a stable grab anchor as shelves resize', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(620, 280);
  const held = page.locator('[data-pom-part="widget.drag-preview"]');
  await expect(held).toContainText('Glass Density');
  await expect(held).toHaveAttribute('inert', '');
  await page.mouse.move(620, 280);
  const before = await held.boundingBox();
  const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"][data-drop-rail-kind="before"]');
  const box = await rail.boundingBox();
  if (!box || !before) throw new Error('Expected held and rail geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(620, 280);
  const after = await held.boundingBox();
  expect(after!.x).toBeCloseTo(before.x, 0);
  expect(after!.y).toBeCloseTo(before.y, 0);
  expect(after!.width).toBeCloseTo(before.width, 0);
  expect(after!.height).toBeCloseTo(before.height, 0);
  await page.screenshot({ path: testInfo.outputPath('held-content.png') });
  await cancelPointerDrag(page);
});

test('the floating footprint matches the committed widget bounds', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Bunny');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(630, 270);
  const footprint = page.locator('[data-pom-part="widget.float-preview"]');
  await expect(footprint).toBeVisible();
  const expected = await footprint.boundingBox();
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
  const actual = await materials.locator('xpath=..').boundingBox();
  for (const key of ['x', 'y', 'width', 'height'] as const) expect(actual![key]).toBeCloseTo(expected![key], 0);
});

test('docking settles into the committed widget instead of stretching into the preview slot', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  const id = await materials.getAttribute('data-pomegranate-widget');
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(620, 280);
  const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="right"][data-drop-rail-kind="before"]');
  const box = await rail.boundingBox();
  if (!box || !id) throw new Error('Expected docking geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.evaluate((id) => {
    const samples: unknown[] = [];
    (window as any).__motionSamples = samples;
    const start = performance.now();
    function sample() {
      const held = document.querySelector<HTMLElement>('[data-pom-part="widget.drag-preview"]');
      const target = document.querySelector(`[data-pomegranate-widget="${id}"]`)?.closest('[data-widget-type]');
      samples.push({ time: performance.now() - start, held: held?.getBoundingClientRect().toJSON(), target: target?.getBoundingClientRect().toJSON(),
        neighbours: document.getAnimations().filter(animation => animation.id === 'pom-widget-reflow').length,
        animation: held?.getAnimations().find(animation => animation.id === 'pom-widget-settle')?.effect?.getComputedTiming().progress,
        frames: (held?.getAnimations().find(animation => animation.id === 'pom-widget-settle')?.effect as KeyframeEffect | undefined)?.getKeyframes() });
      if (performance.now() - start < 500) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }, id);
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
  const samples = await page.evaluate(() => (window as any).__motionSamples);
  await testInfo.attach('motion-frames', { body: JSON.stringify(samples), contentType: 'application/json' });
  const moving = samples.filter((sample: any) => sample.frames?.length);
  expect(moving.length).toBeGreaterThan(1);
  expect(moving.some((sample: any) => sample.neighbours > 0)).toBe(true);
  const errors = moving.map((sample: any) => ['x', 'y', 'width', 'height'].reduce((error, key) => error + Math.abs(sample.held[key] - sample.target[key]), 0));
  expect(Math.max(...errors)).toBeGreaterThan(20);
  expect(Math.min(...errors)).toBeLessThan(2);
  const last = moving.at(-1);
  expect(parseFloat(last.frames.at(-1).width)).toBeCloseTo(last.target.width, 0);
  expect(parseFloat(last.frames.at(-1).height)).toBeCloseTo(last.target.height, 0);
  expect(last.frames.at(-1).transform).not.toContain('scale(');
  expect(await materials.evaluate(node => node.getAnimations({ subtree: true }).some(animation => (animation as CSSAnimation).animationName === 'surface-in'))).toBe(false);
});

test('interrupting arrival leaves the committed widget visible and allows another drag', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Deep Current');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(630, 270);
  await page.mouse.up();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-widget-arriving]')).toHaveCount(0);
  await expect(materials).toBeVisible();
  await beginPointerDrag(page, widgetDragSurface(materials));
  await page.mouse.move(650, 300);
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await cancelPointerDrag(page);
  await expect(materials).toBeVisible();
});

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
  test(`${source} retains its destination indicators and shows an unobstructed action in every theme`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const theme of themes) {
      await freshTheme(page, theme);
      if (source === 'Catalog') await liftCatalogWidget(page);
      else await beginPointerDrag(page, widgetDragSurface(page.getByRole('article', { name: 'Theme Materials', exact: true })));
      await page.mouse.move(620, 200);
      const body = await page.getByRole('article', { name: 'World State', exact: true }).locator(':scope > [data-pom-part="widget.content"]').boundingBox();
      if (!body) throw new Error('Missing target body');
      const x = body.x + body.width / 2;
      await page.mouse.move(x, body.y + body.height / 2);
      await page.evaluate(() => {
        (window as any).__indicatorNodes = [...document.querySelectorAll('.widget-drop-rail, .widget-snap-preview')];
      });
      await page.mouse.move(x + 1, body.y + body.height / 2);
      expect(await page.evaluate(() => (window as any).__indicatorNodes.every((node: Element) => node.isConnected))).toBe(true);
      const label = page.locator('.widget-drop-intent-label');
      for (const [ratio, text] of [[.5, 'Group with World State'], [.1, 'Insert before World State'], [.9, 'Insert after World State'], [-1, 'Float here']] as const) {
        if (ratio < 0) await page.mouse.move(620, 200);
        else await page.mouse.move(x, body.y + body.height * ratio);
        await expect(label).toHaveText(text);
        await expect(label).toBeVisible();
        if (ratio === .5) {
          const target = await page.getByRole('article', { name: 'World State', exact: true }).boundingBox();
          const cue = await page.locator('.widget-snap-preview').boundingBox();
          for (const key of ['x', 'y', 'width', 'height'] as const) expect(cue![key]).toBeCloseTo(target![key], 0);
        }
        const geometry = await label.evaluate(node => {
          const label = node.getBoundingClientRect();
          const held = document.querySelector('.widget-drag-preview, [data-catalog-placement-proxy]')!.getBoundingClientRect();
          const style = getComputedStyle(node);
          const luminance = (color: string) => {
            const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
            return values[0]! * .2126 + values[1]! * .7152 + values[2]! * .0722;
          };
          const foreground = luminance(style.color), background = luminance(style.backgroundColor);
          return { contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05), overlap: Math.max(0, Math.min(label.right, held.right) - Math.max(label.left, held.left)) * Math.max(0, Math.min(label.bottom, held.bottom) - Math.max(label.top, held.top)),
            inViewport: label.left >= 0 && label.top >= 0 && label.right <= innerWidth && label.bottom <= innerHeight,
            background: getComputedStyle(node).backgroundColor };
        });
        expect(geometry.overlap).toBe(0);
        expect(geometry.contrast).toBeGreaterThanOrEqual(4.5);
        expect(geometry.inViewport).toBe(true);
        expect(geometry.background).not.toBe('rgba(0, 0, 0, 0)');
        if (ratio >= 0) expect(await page.evaluate(() => (window as any).__indicatorNodes.every((node: Element) => node.isConnected))).toBe(true);
        if (ratio === .5 || ratio === .1) await page.screenshot({ path: testInfo.outputPath(`${source}-${theme}-${ratio === .5 ? 'group' : 'insert'}.png`) });
      }
      await page.mouse.move(620, 200);
      await expect(label).toHaveText('Float here');
      await expect(page.locator('.widget-snap-preview')).toHaveCount(0);
      await expect(page.locator('.widget-float-preview')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`${source}-${theme}-feedback.png`) });
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expect(page.locator('.widget-drop-overlay, .widget-float-preview, .widget-drop-intent-label')).toHaveCount(0);
    }
  });
}

for (const destination of ['dock', 'float'] as const) {
  test(`Catalog ${destination} placement carries its held preview into the real destination`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await freshTheme(page, 'Bunny');
    await liftCatalogWidget(page);
    if (destination === 'dock') {
      const box = await page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="right"][data-drop-rail-kind="before"]').boundingBox();
      if (!box) throw new Error('Expected Catalog rail.');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    } else await page.mouse.move(630, 270);
    const footprint = destination === 'float' ? page.locator('[data-pom-part="widget.float-preview"]') : null;
    if (footprint) await expect(footprint).toBeVisible();
    const expected = await footprint?.boundingBox();
    await page.evaluate(() => {
      const frames: unknown[] = [];
      (window as any).__catalogMotion = frames;
      const start = performance.now();
      function sample() {
        const proxy = document.querySelector('[data-catalog-placement-proxy]');
        frames.push(proxy?.getAnimations().find(animation => animation.id === 'pom-widget-settle')?.effect?.getComputedTiming().progress);
        if (performance.now() - start < 500) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page.mouse.up();
    await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
    const frames = await page.evaluate(() => (window as any).__catalogMotion as Array<number | undefined>);
    await testInfo.attach('catalog-motion-frames', { body: JSON.stringify(frames), contentType: 'application/json' });
    expect(frames.filter(frame => typeof frame === 'number' && frame > 0 && frame < 1).length).toBeGreaterThan(1);
    await page.getByRole('button', { name: 'Close Widget Catalog' }).click();
    const widget = page.getByRole('article', { name: 'Library', exact: true });
    await expect(widget).toBeVisible();
    if (expected) {
      const actual = await widget.locator('xpath=..').boundingBox();
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(actual![key]).toBeCloseTo(expected[key], 0);
    }
    await page.screenshot({ path: testInfo.outputPath('catalog-placed.png') });
  });
}

for (const source of ['existing', 'Catalog'] as const) {
  test(`${source} placement respects reduced motion and cleans up arrival state`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
    await freshTheme(page, 'Bunny');
    if (source === 'Catalog') await liftCatalogWidget(page);
    else await beginPointerDrag(page, widgetDragSurface(page.getByRole('article', { name: 'Theme Materials', exact: true })));
    await page.mouse.move(630, 270);
    await expect(page.locator('[data-pom-part="widget.float-preview"]')).toBeVisible();
    await page.mouse.up();
    await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-catalog-placement-proxy], [data-widget-arriving], [data-pom-part="widget.float-preview"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('pom-widget-')).length)).toBe(0);
    if (source === 'Catalog') await page.getByRole('button', { name: 'Close Widget Catalog' }).click();
    await expect(page.getByRole('article', { name: source === 'Catalog' ? 'Library' : 'Theme Materials', exact: true })).toBeVisible();
  });

  for (const cancel of ['Escape', 'blur', 'pointercancel'] as const) {
    test(`${source} floating preview cancels cleanly on ${cancel}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await freshTheme(page, 'Deep Current');
      const before = await page.locator('main').getAttribute('data-workbench-revision');
      if (source === 'Catalog') await liftCatalogWidget(page);
      else await beginPointerDrag(page, widgetDragSurface(page.getByRole('article', { name: 'Theme Materials', exact: true })));
      await page.mouse.move(630, 270);
      await expect(page.locator('[data-pom-part="widget.float-preview"]')).toBeVisible();
      if (cancel === 'Escape') await page.keyboard.press('Escape');
      else if (cancel === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      else await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true })));
      await page.mouse.up();
      await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-catalog-placement-proxy], [data-pom-part="widget.float-preview"], [data-widget-arriving], [data-widget-drag-placeholder]')).toHaveCount(0);
      await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', before!);
      await expect(page.locator('body')).not.toHaveClass(/pom-widget-drag-active/);
    });
  }
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
