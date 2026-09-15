import { expect, test, type Page } from '@playwright/test';
import { beginPointerDrag, widgetDragSurface } from './support/widget-interaction-driver.ts';

async function fresh(page: Page, theme = 'Deep Current') {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}

test('delayed menu opening preserves the selected keyboard action', async ({ page }) => {
  await fresh(page);
  const group = page.getByRole('group', { name: 'Widget group' });
  const before = await group.getByRole('tab').allTextContents();
  await page.evaluate(() => {
    const requestFrame = window.requestAnimationFrame;
    const callbacks: FrameRequestCallback[] = [];
    window.requestAnimationFrame = callback => callbacks.push(callback);
    (window as any).__flushMenuOpening = () => {
      window.requestAnimationFrame = requestFrame;
      for (const callback of callbacks) callback(performance.now());
    };
  });
  await group.getByRole('tab', { name: 'Room Ambience', exact: true }).dispatchEvent('contextmenu', {
    button: 2, clientX: 1100, clientY: 350
  });
  const move = page.getByRole('menu', { name: 'Room Ambience Widget actions' }).getByRole('menuitem', { name: 'Move…', exact: true });
  await move.focus();
  await page.evaluate(() => (window as any).__flushMenuOpening());
  await expect(move).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu', { name: 'Room Ambience Widget move' }).getByRole('menuitem', { name: 'Float', exact: true })).toBeVisible();
  await expect(group.getByRole('tab')).toHaveText(before);
});

test('visible Widget actions remain separate from titles and tabs in every theme', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await fresh(page, theme);
    const world = page.getByRole('article', { name: 'World State', exact: true });
    const button = world.getByRole('button', { name: 'Widget actions', exact: true });
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    const heading = await world.locator('.widget-frame-heading').boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(28);
    expect(bounds!.height).toBeGreaterThanOrEqual(28);
    expect(heading!.x + heading!.width).toBeLessThanOrEqual(bounds!.x + 1);
    const group = page.getByRole('group', { name: 'Widget group' });
    const groupButton = group.getByRole('button', { name: 'Widget actions', exact: true });
    await expect(groupButton).toBeVisible();
    const tabs = await group.getByRole('tablist').boundingBox();
    const action = await groupButton.boundingBox();
    expect(tabs!.x + tabs!.width).toBeLessThanOrEqual(action!.x + 1);
    await button.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'World State Widget actions' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Move…' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await expect(page.locator('.widget-drag-preview')).toHaveCount(0);
    for (const type of ['story.transcript', 'story.composer']) {
      const widget = page.locator(`[data-widget-type="${type}"] .widget-frame`);
      await expect(widget.getByRole('button', { name: 'Widget actions', exact: true })).toBeVisible();
      await expect(widget.getByRole('toolbar')).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`${theme}-actions.png`) });
    await page.getByRole('tab', { name: 'Settings', exact: true }).click();
    await page.getByRole('tab', { name: 'Appearance and Accessibility', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Custom Theme', exact: true }).getByRole('button', { name: 'Widget actions', exact: true })).toBeVisible();
  }
});

test('group actions explain gestures and offer keyboard reorder and detach with undo', async ({ page }) => {
  await fresh(page);
  const group = page.getByRole('group', { name: 'Widget group' });
  const tab = group.getByRole('tab', { name: 'Room Ambience', exact: true });
  await expect(tab).toHaveAccessibleDescription(/reorder.*detach/);
  const trigger = group.getByRole('button', { name: 'Widget actions', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  let menu = page.getByRole('menu', { name: 'Room Ambience Widget actions' });
  await expect(menu).toContainText('Drag along the tabs to reorder. Drag away to detach.');
  await expect(menu.getByRole('menuitem', { name: 'Move tab left' })).toBeDisabled();
  await menu.getByRole('menuitem', { name: 'Move tab right' }).focus();
  await page.keyboard.press('Enter');
  await expect(group.getByRole('tab')).toHaveText(['Promise Ledger', 'Room Ambience']);
  await trigger.press('Enter');
  menu = page.getByRole('menu', { name: 'Room Ambience Widget actions' });
  await menu.getByRole('menuitem', { name: 'Detach from group' }).focus();
  await page.keyboard.press('Enter');
  const room = page.getByRole('article', { name: 'Room Ambience', exact: true });
  await expect(room).toHaveAttribute('data-pomegranate-placement', 'floating');
  await expect(room.locator('xpath=ancestor::*[@data-widget-group]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
  await expect(group.getByRole('tab')).toHaveText(['Promise Ledger', 'Room Ambience']);
});

test('panel hover announces its pending switch and cancels before activation', async ({ page }) => {
  await fresh(page);
  await page.clock.install();
  const source = page.getByRole('article', { name: 'Theme Materials', exact: true });
  const library = page.getByRole('tab', { name: 'Library', exact: true });
  const box = await library.boundingBox();
  await beginPointerDrag(page, widgetDragSurface(source));
  await page.mouse.move(600, 200);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page.locator('[data-panel-hover-hint]')).toHaveText('Hold to open Library');
  await page.clock.runFor(150);
  await expect(library).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.clock.runFor(500);
  await expect(library).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('[data-panel-hover-hint], .widget-drag-preview')).toHaveCount(0);
});

test('Catalog uses the same panel-hover cue and docks on the opened Panel', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const origin = await result.boundingBox();
  await page.mouse.move(origin!.x + 8, origin!.y + 8);
  await page.mouse.down();
  await page.mouse.move(origin!.x + 14, origin!.y + 8);
  await expect(catalog).toBeHidden();
  const library = page.getByRole('tab', { name: 'Library', exact: true });
  const tab = await library.boundingBox();
  await page.mouse.move(tab!.x + tab!.width / 2, tab!.y + tab!.height / 2);
  await expect(page.locator('[data-panel-hover-hint]')).toHaveText('Hold to open Library');
  await expect(library).toHaveAttribute('aria-selected', 'true');
  const before = await page.locator('[data-pomegranate-widget]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-pomegranate-widget')));
  const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="support"][data-drop-rail-kind="append"]');
  await expect(rail).toBeVisible();
  const box = await rail.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(rail).toHaveAttribute('data-active', 'true');
  await page.mouse.up();
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
  const added = await page.locator('[data-pomegranate-widget]').evaluateAll((nodes, before) => nodes.filter(node => !before.includes(node.getAttribute('data-pomegranate-widget'))).map(node => ({ panel: node.closest('[data-pomegranate-panel]')?.getAttribute('data-pomegranate-panel'), region: node.getAttribute('data-pomegranate-region') })), before);
  expect(added).toEqual([{ panel: 'library', region: 'support' }]);
});

test('Catalog keyboard placement cancels, restores focus, and commits its chosen destination', async ({ page }) => {
  await fresh(page);
  const before = await page.locator('[data-pomegranate-widget]').count();
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.focus();
  await page.keyboard.press('Space');
  await expect(catalog).toBeHidden();
  await expect(page.locator('[data-catalog-placement-proxy]')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(catalog).toBeVisible();
  await expect(result).toBeFocused();
  expect(await page.locator('[data-pomegranate-widget]').count()).toBe(before);
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  const selected = await page.locator('.is-catalog-target-active').getAttribute('data-pomegranate-region-surface');
  const ids = await page.locator('[data-pomegranate-widget]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-pomegranate-widget')));
  await page.keyboard.press('Enter');
  await expect(catalog).toBeVisible();
  const added = await page.locator('[data-pomegranate-widget]').evaluateAll((nodes, ids) => nodes.filter(node => !ids.includes(node.getAttribute('data-pomegranate-widget'))).map(node => node.getAttribute('data-pomegranate-region')), ids);
  expect(added).toEqual([selected]);
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Catalog pending panel switch cancels and respects ${reducedMotion} motion`, async ({ page }) => {
    await fresh(page);
    await page.emulateMedia({ reducedMotion });
    await page.clock.install();
    await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
    const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
    await catalog.getByRole('searchbox', { name: 'Search Widgets' }).fill('Workspace');
    const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
    const box = await result.boundingBox();
    await page.mouse.move(box!.x + 8, box!.y + 8);
    await page.mouse.down();
    await page.mouse.move(box!.x + 16, box!.y + 8);
    await expect(catalog).toBeHidden();
    const library = page.getByRole('tab', { name: 'Library', exact: true });
    const tab = await library.boundingBox();
    await page.mouse.move(tab!.x + tab!.width / 2, tab!.y + tab!.height / 2);
    const hint = page.locator('[data-panel-hover-hint]');
    await expect(hint).toHaveText('Hold to open Library');
    expect(await hint.evaluate(node => getComputedStyle(node, '::after').animationName))
      .toBe(reducedMotion === 'reduce' ? 'none' : 'panel-hover-progress');
    await page.clock.runFor(150);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.clock.runFor(500);
    await expect(library).toHaveAttribute('aria-selected', 'false');
    await expect(catalog).toBeVisible();
    await expect(page.locator('[data-panel-hover-hint], [data-catalog-placement-proxy]')).toHaveCount(0);
  });
}

for (const pointerType of ['pen', 'touch'] as const) {
  test(`Catalog ${pointerType} placement cancels cleanly and commits through the shared shelf target`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: pointerType === 'touch', isMobile: pointerType === 'touch', ...(baseURL ? { baseURL } : {}) });
    const page = await context.newPage();
    try {
      await fresh(page);
      const before = await page.locator('[data-pomegranate-widget]').count();
      await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
      const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
      await catalog.getByRole('searchbox', { name: 'Search Widgets' }).fill('Workspace');
      const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
      await expect(result).toBeInViewport();
      const origin = await result.boundingBox();
      const element = await result.elementHandle();
      const pointer = { pointerId: 41, pointerType, isPrimary: true, button: 0, buttons: 1 };
      for (const cancel of [true, false]) {
        await element!.dispatchEvent('pointerdown', { ...pointer, clientX: origin!.x + 8, clientY: origin!.y + 8 });
        if (pointerType === 'touch') await page.waitForTimeout(310);
        else await element!.dispatchEvent('pointermove', { ...pointer, clientX: origin!.x + 16, clientY: origin!.y + 8 });
        await expect(catalog, cancel ? 'Lift before cancellation' : 'Lift before commit').toBeHidden();
        const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="right"][data-drop-rail-kind="before"]');
        const box = await rail.boundingBox();
        await element!.dispatchEvent('pointermove', { ...pointer, clientX: box!.x + box!.width / 2, clientY: box!.y + box!.height / 2 });
        await expect(rail).toHaveAttribute('data-active', 'true');
        await element!.dispatchEvent(cancel ? 'pointercancel' : 'pointerup', { ...pointer, buttons: 0 });
        await expect(page.locator('[data-catalog-placement-proxy], .widget-drop-overlay')).toHaveCount(0);
        await expect(catalog).toBeVisible();
        expect(await page.locator('[data-pomegranate-widget]').count()).toBe(before + (cancel ? 0 : 1));
      }
    } finally { await context.close(); }
  });
}
