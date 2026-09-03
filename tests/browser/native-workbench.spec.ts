import { expect, test } from '@playwright/test';
import { IMPLEMENTED_SURFACES } from '../../apps/workbench-lab/src/mockup/implemented-surfaces.ts';
import { SURFACE_FIXTURES, SURFACE_STATE_COPY } from '../../apps/workbench-lab/src/mockup/surface-fixtures.ts';

async function openDeveloperTools(page: import('@playwright/test').Page) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
}

async function closeDeveloperTools(page: import('@playwright/test').Page) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') !== null) await page.getByText('Developer tools', { exact: true }).click();
}

async function seedPanelRail(page: import('@playwright/test').Page) {
  await openDeveloperTools(page);
  for (const name of ['Archive', 'Lore', 'Cast', 'Timeline', 'Notes']) {
    const launchers = page.getByRole('button', { name: 'Create Panel' });
    const count = await launchers.count();
    let opened = false;
    for (let index = 0; index < count; index += 1) {
      if (!await launchers.nth(index).isVisible()) continue;
      await launchers.nth(index).click();
      opened = true;
      break;
    }
    if (!opened) throw new Error('Expected a visible Create Panel launcher.');
    const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
    await dialog.getByRole('textbox', { name: 'Panel name' }).fill(name);
    await dialog.getByRole('button', { name: 'Create Panel' }).click();
  }
  await closeDeveloperTools(page);
}

async function dragHorizontally(
  page: import('@playwright/test').Page,
  target: import('@playwright/test').Locator,
  deltaX: number
) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Expected horizontal drag target geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + deltaX, start.y, { steps: 8 });
  await page.mouse.up();
}

async function openWidgetCatalog(page: import('@playwright/test').Page) {
  const launcher = page.getByRole('button', { name: 'Open Widget Catalog' });
  await launcher.focus();
  await expect(launcher).toBeFocused();
  await expect(launcher).toBeVisible();
  await launcher.press('Enter');
}

async function dragTo(
  page: import('@playwright/test').Page,
  handle: import('@playwright/test').Locator,
  point: { x: number; y: number }
) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected drag handle geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, { steps: 6 });
  await page.mouse.up();
}

async function dragToShelfRail(
  page: import('@playwright/test').Page,
  handle: import('@playwright/test').Locator,
  region: string,
  railKind: 'before' | 'between' | 'after' | 'append' = 'append'
) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected drag handle geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  if (await handle.getAttribute('data-group-tab')) {
    await page.mouse.move(start.x, start.y + 18, { steps: 3 });
  } else {
    await page.mouse.move(start.x + 12, start.y + 12, { steps: 3 });
  }
  const rail = page.locator(`[data-pom-part="widget.drop-rail"][data-drop-region="${region}"][data-drop-rail-kind="${railKind}"]`).last();
  const railBox = await rail.boundingBox();
  if (!railBox) throw new Error(`Expected ${region} ${railKind} shelf rail geometry.`);
  await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2, { steps: 6 });
  await expect(rail).toHaveAttribute('data-active', 'true');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
}

async function dispatchHeldTouchDrag(
  page: import('@playwright/test').Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  await page.waitForTimeout(190);
  for (const ratio of [0.35, 0.7, 1]) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio
      }]
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function tearOffTo(
  page: import('@playwright/test').Page,
  handle: import('@playwright/test').Locator,
  point: { x: number; y: number }
) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected grouped Widget tab geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + 18, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await page.mouse.move(point.x, point.y, { steps: 8 });
  await page.mouse.up();
}

async function dragToWidgetTab(
  page: import('@playwright/test').Page,
  handle: import('@playwright/test').Locator,
  target: import('@playwright/test').Locator
) {
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

function widgetDragSurface(widget: import('@playwright/test').Locator) {
  return widget
    .locator(':scope > header[data-widget-drag-surface], :scope > .widget-frame > header[data-widget-drag-surface]')
    .or(widget.locator('xpath=ancestor::section[@data-widget-group][1]//button[@data-widget-drag-surface][@aria-selected="true"]'))
    .first();
}

async function invokeWidgetAction(widget: import('@playwright/test').Locator, name: string) {
  await widget.getByRole('button', { name: 'Widget actions' }).click();
  await widget.getByRole('menuitem', { name }).click();
}

async function horizontalOverflowEvidence(locator: import('@playwright/test').Locator) {
  return locator.evaluate((root) => {
    const rootRect = root.getBoundingClientRect();
    const descendants = [root, ...root.querySelectorAll<HTMLElement>('*')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: `${element.tagName.toLowerCase()}.${element.className || '-'}`,
          overflow: element.scrollWidth - element.clientWidth,
          outside: Math.max(0, rect.right - rootRect.right, rootRect.left - rect.left),
          overflowX: getComputedStyle(element).overflowX
        };
      })
      .filter(({ overflow, outside }) => overflow > 1 || outside > 1)
      .map(({ label, overflow, outside, overflowX }) => `${label} overflow=${overflow} outside=${outside.toFixed(2)} overflow-x=${overflowX}`);
    return { amount: root.scrollWidth - root.clientWidth, descendants };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

test('native workbench POM-PANEL-07856BFE9A POM-PANEL-DF4EC7C581 activates a Panel without changing story identity', async ({ page }) => {
  const story = page.getByLabel('Active story identity');
  await expect(story).toContainText('STORY / 7E-19');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await expect(story).toContainText('STORY / 7E-19');
  await expect(page.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
  await expect(page.locator('[data-surface-type="library.workspace"]')).toBeVisible();
});

test('Panel context actions target an inactive tab without activating it and restore focus', async ({ page }) => {
  const scene = page.getByRole('tab', { name: 'Scene' });
  const library = page.getByRole('tab', { name: 'Library' });
  await expect(page.getByRole('button', { name: /^Manage / })).toHaveCount(0);
  await expect(page.locator('.panel-menu-surface')).toHaveCount(1);
  await library.click({ button: 'right' });
  const menu = page.getByRole('dialog', { name: 'Library Panel actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('textbox', { name: 'Panel name' })).toBeFocused();
  await expect(menu).toHaveAttribute('data-pom-part', 'menu.surface');
  await expect(menu.getByRole('button')).toHaveText([
    'Rename', 'Duplicate', 'Create first sub-panel', 'Reset', 'Clear', 'Delete', 'Reorder Panels…'
  ]);
  await expect(scene).toHaveAttribute('aria-selected', 'true');
  const material = await menu.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backdrop: style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter'),
      background: style.backgroundColor,
      radius: style.borderRadius
    };
  });
  expect(material.backdrop).not.toBe('none');
  expect(material.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(material.radius).not.toBe('');

  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(library).toBeFocused();

  await library.press('Shift+F10');
  await expect(menu).toBeVisible();
  await menu.getByRole('textbox', { name: 'Panel name' }).fill('Reference Library');
  await menu.getByRole('button', { name: 'Rename' }).click();
  const renamed = page.getByRole('tab', { name: 'Reference Library' });
  await expect(renamed).toBeFocused();
  await expect(scene).toHaveAttribute('aria-selected', 'true');

  await renamed.press('ContextMenu');
  await expect(page.getByRole('dialog', { name: 'Reference Library Panel actions' })).toBeVisible();
});

test('an early native contextmenu waits for secondary pointer release', async ({ page }) => {
  const scene = page.getByRole('tab', { name: 'Scene' });
  const library = page.getByRole('tab', { name: 'Library' });
  const pointer = {
    button: 2,
    buttons: 2,
    cancelable: true,
    clientX: 120,
    clientY: 24,
    pointerId: 71,
    pointerType: 'mouse'
  };

  await library.dispatchEvent('pointerdown', pointer);
  await library.dispatchEvent('contextmenu', { ...pointer, buttons: 0 });
  await expect(page.getByRole('dialog', { name: 'Library Panel actions' })).not.toBeVisible();
  await library.dispatchEvent('pointerup', { ...pointer, buttons: 0 });

  await expect(page.getByRole('dialog', { name: 'Library Panel actions' })).toBeVisible();
  await expect(scene).toHaveAttribute('aria-selected', 'true');
});

test('Reorder Panels exposes full names and reorders only from a dedicated handle', async ({ page }) => {
  const panelTabs = page.getByRole('tablist', { name: 'Panels' });
  const directTabs = panelTabs.locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  const settings = panelTabs.getByRole('tab', { name: 'Settings' });
  await settings.click();
  await settings.click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Settings Panel actions' })
    .getByRole('button', { name: 'Reorder Panels…' }).click();

  const dialog = page.getByRole('dialog', { name: 'Reorder Panels' });
  const list = dialog.getByRole('list', { name: 'Panels order' });
  await expect(list.locator('.tab-order-name')).toHaveText(['Scene', 'Library', 'Settings']);
  await expect(list.getByRole('listitem').filter({ hasText: 'Settings' })).toContainText('Active');
  const handle = dialog.getByRole('button', { name: 'Reorder Settings' });
  const handleBox = await handle.boundingBox();
  const sceneBox = await list.getByRole('listitem').filter({ hasText: 'Scene' }).boundingBox();
  if (!handleBox || !sceneBox) throw new Error('Expected Panel order handle geometry.');
  expect(handleBox.width).toBeGreaterThanOrEqual(44);
  expect(handleBox.height).toBeGreaterThanOrEqual(44);
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, sceneBox.y + 4, { steps: 8 });
  const dragPreview = page.locator('[data-pom-part="tab.drag-preview"]');
  await expect(dragPreview).toBeVisible();
  await expect(dragPreview).toHaveText('Settings');
  await page.mouse.up();

  await expect(directTabs).toHaveText(['Settings', 'Scene', 'Library']);
  await expect(panelTabs.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(settings).toBeFocused();
});

test('Panel order row dragging scrolls while handle cancellation commits nothing', async ({ page }) => {
  await seedPanelRail(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const panelTabs = page.getByRole('tablist', { name: 'Panels' });
  const directTabs = panelTabs.locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  const settings = panelTabs.getByRole('tab', { name: 'Settings' });
  const before = await directTabs.allTextContents();
  await settings.click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Settings Panel actions' })
    .getByRole('button', { name: 'Reorder Panels…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reorder Panels' });
  const list = dialog.getByRole('list', { name: 'Panels order' });
  const listExtent = await list.evaluate((node) => ({ client: node.clientHeight, scroll: node.scrollHeight }));
  expect(listExtent.scroll).toBeGreaterThan(listExtent.client);
  const firstRow = list.getByRole('listitem').first();
  const rowBox = await firstRow.locator('.tab-order-name').boundingBox();
  if (!rowBox) throw new Error('Expected Panel order row geometry.');
  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y - 180, { steps: 8 });
  await page.mouse.up();
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect(directTabs).toHaveText(before);

  const handle = dialog.getByRole('button', { name: 'Reorder Settings' });
  const handleBox = await handle.boundingBox();
  const handleElement = await handle.elementHandle();
  if (!handleBox || !handleElement) throw new Error('Expected Settings order handle geometry.');
  await handleElement.dispatchEvent('pointerdown', {
    pointerId: 77, pointerType: 'mouse', isPrimary: true, button: 0,
    clientX: handleBox.x + handleBox.width / 2, clientY: handleBox.y + handleBox.height / 2
  });
  await handleElement.dispatchEvent('pointermove', {
    pointerId: 77, pointerType: 'mouse', isPrimary: true, button: 0,
    clientX: handleBox.x + handleBox.width / 2, clientY: handleBox.y - 100
  });
  await handleElement.dispatchEvent('pointercancel', {
    pointerId: 77, pointerType: 'mouse', isPrimary: true, button: 0,
    clientX: handleBox.x + handleBox.width / 2, clientY: handleBox.y - 100
  });
  await expect(directTabs).toHaveText(before);
});

test('one Escape cancels an active Panel reorder gesture, closes, and restores focus', async ({ page }) => {
  const panelTabs = page.getByRole('tablist', { name: 'Panels' });
  const directTabs = panelTabs.locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  const settings = panelTabs.getByRole('tab', { name: 'Settings' });
  const before = await directTabs.allTextContents();
  await settings.click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Settings Panel actions' })
    .getByRole('button', { name: 'Reorder Panels…' }).click();

  const dialog = page.getByRole('dialog', { name: 'Reorder Panels' });
  const handle = dialog.getByRole('button', { name: 'Reorder Settings' });
  const sceneRow = dialog.getByRole('listitem').filter({ hasText: 'Scene' });
  const handleBox = await handle.boundingBox();
  const sceneBox = await sceneRow.boundingBox();
  if (!handleBox || !sceneBox) throw new Error('Expected active reorder geometry.');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, sceneBox.y + 4, { steps: 8 });
  await expect(page.locator('[data-pom-part="tab.drag-preview"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(settings).toBeFocused();
  await page.mouse.up();
  await expect(directTabs).toHaveText(before);
});

test('Panel order keyboard moves persist and Cancel does not roll back committed commands', async ({ page }) => {
  const panelTabs = page.getByRole('tablist', { name: 'Panels' });
  const directTabs = panelTabs.locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  const settings = panelTabs.getByRole('tab', { name: 'Settings' });
  await settings.click();
  await settings.click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Settings Panel actions' })
    .getByRole('button', { name: 'Reorder Panels…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reorder Panels' });
  const moveUp = dialog.getByRole('button', { name: 'Move Settings up' });
  await moveUp.focus();
  await moveUp.press('Enter');
  await expect(directTabs).toHaveText(['Scene', 'Settings', 'Library']);
  await dialog.getByRole('button', { name: 'Move Settings down' }).press('Enter');
  await expect(directTabs).toHaveText(['Scene', 'Library', 'Settings']);
  await moveUp.press('Enter');
  await expect(directTabs).toHaveText(['Scene', 'Settings', 'Library']);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(settings).toBeFocused();
  await expect(directTabs).toHaveText(['Scene', 'Settings', 'Library']);

  await settings.click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Settings Panel actions' })
    .getByRole('button', { name: 'Reorder Panels…' }).click();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(directTabs).toHaveText(['Scene', 'Settings', 'Library']);
  await expect(panelTabs.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
});

test('Panel action material follows every theme and becomes opaque for accessibility fallbacks', async ({ page }) => {
  await openDeveloperTools(page);
  const themeTargets = page.getByRole('group', { name: 'Visual target' });
  const backgrounds = new Set<string>();
  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await themeTargets.getByRole('button', { name: theme, exact: true }).click();
    await closeDeveloperTools(page);
    await page.getByRole('tab', { name: 'Scene' }).click({ button: 'right' });
    const menu = page.getByRole('dialog', { name: 'Scene Panel actions' });
    await expect(menu).toBeVisible();
    const material = await menu.evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, backdrop: style.backdropFilter };
    });
    expect(material.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(material.backdrop).not.toBe('none');
    backgrounds.add(material.background);
    await page.keyboard.press('Escape');
    await openDeveloperTools(page);
  }
  expect(backgrounds.size).toBeGreaterThanOrEqual(3);
  await closeDeveloperTools(page);

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }]
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Scene' }).click({ button: 'right' });
  const reducedMenu = page.getByRole('dialog', { name: 'Scene Panel actions' });
  await expect(reducedMenu).toHaveCSS('backdrop-filter', 'none');
  expect(await reducedMenu.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');

  await page.keyboard.press('Escape');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForTimeout(130);
  await page.getByRole('tab', { name: 'Scene' }).click({ button: 'right' });
  await expect(page.getByRole('dialog', { name: 'Scene Panel actions' })).toHaveCSS('backdrop-filter', 'none');
});

test('Panel tab drag pans an overflowing rail without activation or reorder', async ({ page }) => {
  await seedPanelRail(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const rail = page.getByRole('tablist', { name: 'Panels' });
  const beforeOrder = await rail.getByRole('tab').allTextContents();
  const activeBefore = await rail.getByRole('tab', { selected: true }).textContent();

  await rail.evaluate((node) => { node.scrollLeft = 0; });
  await dragHorizontally(page, rail.getByRole('tab', { name: 'Settings' }), -120);

  expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(rail.getByRole('tab')).toHaveText(beforeOrder);
  await expect(rail.getByRole('tab', { selected: true })).toHaveText(activeBefore ?? '');
});

test('Panel tab jitter remains a click until the shared seven-pixel threshold', async ({ page }) => {
  const rail = page.getByRole('tablist', { name: 'Panels' });
  const scene = rail.getByRole('tab', { name: 'Scene' });
  const library = rail.getByRole('tab', { name: 'Library' });
  const box = await library.boundingBox();
  const element = await library.elementHandle();
  if (!box || !element) throw new Error('Expected Panel tab geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const pointer = (pointerId: number, x: number) => ({
    pointerId, pointerType: 'mouse', isPrimary: true, button: 0, clientX: x, clientY: start.y
  });
  const click = async (pointerId: number, x: number) => element.evaluate((node, init) => (
    node.dispatchEvent(new PointerEvent('click', { bubbles: true, detail: 1, ...init }))
  ), pointer(pointerId, x));

  await element.dispatchEvent('pointerdown', pointer(81, start.x));
  await element.dispatchEvent('pointermove', pointer(81, start.x - 6));
  await element.dispatchEvent('pointerup', pointer(81, start.x - 6));
  await click(81, start.x - 6);
  await expect(library).toHaveAttribute('aria-selected', 'true');

  await scene.click();
  await element.dispatchEvent('pointerdown', pointer(82, start.x));
  await element.dispatchEvent('pointermove', pointer(82, start.x - 7));
  await element.dispatchEvent('pointerup', pointer(82, start.x - 7));
  await click(82, start.x - 7);
  await expect(scene).toHaveAttribute('aria-selected', 'true');
});

test('Panel arrows and boundaries activate and reveal without changing order', async ({ page }) => {
  await seedPanelRail(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const rail = page.getByRole('tablist', { name: 'Panels' });
  const directTabs = rail.locator(':scope > [data-pomegranate-panel-tab] > [role="tab"]');
  const order = await directTabs.allTextContents();
  const scene = rail.getByRole('tab', { name: 'Scene' });
  await rail.evaluate((node) => { node.scrollLeft = 0; });
  await scene.focus();

  await scene.press('End');
  await expect(rail.getByRole('tab', { name: 'Notes' })).toBeFocused();
  await expect(rail.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
  expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(directTabs).toHaveText(order);

  await rail.getByRole('tab', { name: 'Notes' }).press('Home');
  await expect(scene).toBeFocused();
  await expect(scene).toHaveAttribute('aria-selected', 'true');
  expect(await rail.evaluate((node) => node.scrollLeft)).toBe(0);
  await scene.press('Control+Shift+ArrowRight');
  await expect(rail.getByRole('tab', { name: 'Library' })).toBeFocused();
  await expect(directTabs).toHaveText(order);
});

test('Panel tab drag cancels cleanly when the window loses focus', async ({ page }) => {
  await seedPanelRail(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const rail = page.getByRole('tablist', { name: 'Panels' });
  const beforeOrder = await rail.getByRole('tab').allTextContents();
  const scene = rail.getByRole('tab', { name: 'Scene' });
  const sceneBox = await scene.boundingBox();
  if (!sceneBox) throw new Error('Expected Panel tab geometry.');
  await page.mouse.move(sceneBox.x + sceneBox.width / 2, sceneBox.y + sceneBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sceneBox.x + sceneBox.width / 2 - 120, sceneBox.y + sceneBox.height / 2, { steps: 8 });
  expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('[data-pom-part="tab.insertion"], [data-pom-part="tab.drag-preview"]')).toHaveCount(0);
  await expect(page.locator('.is-tab-reorder-origin')).toHaveCount(0);
  await page.mouse.up();
  await expect(rail.getByRole('tab')).toHaveText(beforeOrder);
});

test('Widget drag teardown clears global held state when its Panel unmounts', async ({ page }) => {
  const source = page.getByRole('article', { name: 'Characters (Story)' });
  const box = await widgetDragSurface(source).boundingBox();
  if (!box) throw new Error('Expected Widget drag geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 18, box.y + box.height / 2 + 18, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();

  await page.getByRole('tab', { name: 'Library' }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-pom-part="widget.drop-overlay"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/pom-widget-drag-active/);
  await page.mouse.up();
});

test('Panel tabs pan by pen and never expose a reorder gesture on touch', async ({ page }) => {
  await seedPanelRail(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const tablist = page.getByRole('tablist', { name: 'Panels' });
  const beforeOrder = await tablist.getByRole('tab').allTextContents();
  const scene = tablist.getByRole('tab', { name: 'Scene' });
  const sceneBox = await scene.boundingBox();
  if (!sceneBox) throw new Error('Expected Panel tab geometry.');
  const penStart = { x: sceneBox.x + sceneBox.width / 2, y: sceneBox.y + sceneBox.height / 2 };
  const penEnd = { x: penStart.x - 120, y: penStart.y };
  const sceneHandle = await scene.elementHandle();
  if (!sceneHandle) throw new Error('Expected the Scene tab handle.');
  await sceneHandle.dispatchEvent('pointerdown', { pointerId: 31, pointerType: 'pen', isPrimary: true, button: 0, clientX: penStart.x, clientY: penStart.y });
  await sceneHandle.dispatchEvent('pointermove', { pointerId: 31, pointerType: 'pen', isPrimary: true, button: 0, clientX: penEnd.x, clientY: penEnd.y });
  await sceneHandle.dispatchEvent('pointerup', { pointerId: 31, pointerType: 'pen', isPrimary: true, button: 0, clientX: penEnd.x, clientY: penEnd.y });
  expect(await tablist.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(tablist.getByRole('tab')).toHaveText(beforeOrder);

  await sceneHandle.dispatchEvent('pointerdown', { pointerId: 32, pointerType: 'touch', isPrimary: true, button: 0, clientX: penStart.x, clientY: penStart.y });
  await page.waitForTimeout(190);
  await sceneHandle.dispatchEvent('pointermove', { pointerId: 32, pointerType: 'touch', isPrimary: true, button: 0, clientX: penEnd.x, clientY: penEnd.y });
  await sceneHandle.dispatchEvent('pointerup', { pointerId: 32, pointerType: 'touch', isPrimary: true, button: 0, clientX: penEnd.x, clientY: penEnd.y });
  await expect(tablist.getByRole('tab')).toHaveText(beforeOrder);
});

test('phone portrait touch exploration preserves Panel order and document containment', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await seedPanelRail(page);
    await page.setViewportSize({ width: 390, height: 844 });
    const tablist = page.getByRole('tablist', { name: 'Panels' });
    const beforeOrder = await tablist.getByRole('tab').allTextContents();
    const scene = tablist.getByRole('tab', { name: 'Scene' });
    const sceneBox = await scene.boundingBox();
    if (!sceneBox) throw new Error('Expected phone Panel tab geometry.');
    expect(sceneBox.width).toBeGreaterThanOrEqual(44);
    expect(sceneBox.height).toBeGreaterThanOrEqual(44);
    const start = { x: sceneBox.x + sceneBox.width / 2, y: sceneBox.y + sceneBox.height / 2 };
    const end = { x: start.x - 120, y: start.y };
    await dispatchHeldTouchDrag(page, start, end);
    await expect(tablist.getByRole('tab')).toHaveText(beforeOrder);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    await tablist.evaluate((node) => { node.scrollLeft = 0; });
    const settings = tablist.getByRole('tab', { name: 'Settings' });
    const settingsBox = await settings.boundingBox();
    if (!settingsBox) throw new Error('Expected stationary touch target geometry.');
    const hold = {
      x: settingsBox.x + settingsBox.width / 2,
      y: settingsBox.y + settingsBox.height / 2
    };
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [hold] });
    await page.waitForTimeout(550);
    const menu = page.getByRole('dialog', { name: 'Settings Panel actions' });
    expect(await page.evaluate(() => getSelection()?.toString() ?? '')).toBe('');
    await expect(menu).toHaveCount(0);
    await expect(tablist.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('data-context-source', 'touch');
    await page.waitForTimeout(100);
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(settings).toBeFocused();
  } finally {
    await context.close();
  }
});

test('native workbench POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {
  const leftDock = page.locator('[data-pomegranate-dock="left"]');
  await expect(leftDock.getByRole('article')).toHaveCount(2);
  const worldState = page.getByRole('article', { name: 'World State' });
  await invokeWidgetAction(worldState, 'Dock left');
  await expect(leftDock.getByRole('article')).toHaveCount(3);
  await expect(leftDock.getByRole('article').nth(0)).toHaveAttribute('aria-label', 'Characters (Story)');
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'Custom Theme');
  await expect(leftDock.getByRole('article').nth(2)).toHaveAttribute('aria-label', 'World State');
});

test('Deep Current dock separators resize with keyboard and persist exact bounded widths', async ({ page }) => {
  const left = page.getByRole('separator', { name: 'Resize left toolbar' });
  const right = page.getByRole('separator', { name: 'Resize right toolbar' });
  await expect(left).toHaveAttribute('aria-valuemin', '200');
  await expect(left).toHaveAttribute('aria-valuemax', '420');
  await expect(left).toHaveAttribute('aria-valuenow', '286');

  await left.focus();
  await left.press('ArrowRight');
  await expect(left).toHaveAttribute('aria-valuenow', '294');
  await right.focus();
  await right.press('End');
  await expect(right).toHaveAttribute('aria-valuenow', '420');

  const handle = await left.boundingBox();
  if (!handle) throw new Error('Expected the left toolbar resize handle to have geometry.');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 26, handle.y + handle.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(left).toHaveAttribute('aria-valuenow', '320');

  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '320');
  await expect(page.getByRole('separator', { name: 'Resize right toolbar' })).toHaveAttribute('aria-valuenow', '420');
  await expect.poll(() => page.locator('[data-pomegranate-dock="left"]').evaluate((node) => node.getBoundingClientRect().width)).toBe(320);
  await expect.poll(() => page.locator('[data-pomegranate-dock="right"]').evaluate((node) => node.getBoundingClientRect().width)).toBe(420);
});

test('Deep Current Widgets merge into an accessible persistent tab group and reorder', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Custom Theme' });
  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(customTheme), characters);

  const group = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Characters (Story)' }) });
  await expect(group.getByRole('tab')).toHaveText(['Characters (Story)', 'Custom Theme']);
  await expect(group.getByRole('tab', { name: 'Custom Theme' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('article', { name: 'Characters (Story)' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  await expect(page.getByRole('article', { name: 'Characters (Story)' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Custom Theme' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'Custom Theme' }).press('Control+Shift+ArrowLeft');
  await expect(group.getByRole('tab')).toHaveText(['Custom Theme', 'Characters (Story)']);
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  const restored = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Characters (Story)' }) });
  await expect(restored.getByRole('tab')).toHaveText(['Custom Theme', 'Characters (Story)']);
  await expect(restored.getByRole('tab', { name: 'Characters (Story)' })).toHaveAttribute('aria-selected', 'true');
});

test('dragging an inactive grouped Widget holds that Widget rather than the active tab', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Custom Theme' });
  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(customTheme), characters);

  const group = page.getByRole('group', { name: 'Widget group' });
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const inactiveTab = group.getByRole('tab', { name: 'Custom Theme' });
  const target = page.getByRole('article', { name: 'World State' });
  const tabBox = await inactiveTab.boundingBox();
  const targetBox = await target.boundingBox();
  if (!tabBox || !targetBox) throw new Error('Expected grouped drag geometry.');
  await page.mouse.move(tabBox.x + tabBox.width / 2, tabBox.y + tabBox.height / 2);
  await page.mouse.down();
  await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  await page.mouse.move(tabBox.x + tabBox.width / 2, tabBox.y + tabBox.height / 2 + 18, { steps: 3 });
  await page.mouse.move(tabBox.x + tabBox.width + 100, tabBox.y + tabBox.height / 2 + 18, { steps: 3 });
  await expect(page.locator('[data-pom-part="tab.insertion"]')).toHaveCount(0);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });

  const held = page.locator('[data-pom-part="widget.drag-preview"]');
  await expect(held).toContainText('Custom Theme');
  await expect(held).not.toContainText('Characters (Story)');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  await expect(group.getByRole('tab', { name: 'Characters (Story)' })).toHaveAttribute('aria-selected', 'true');
});

test('Deep Current Focus and Back keep one Widget identity and restore invoking focus', async ({ page }) => {
  const worldState = page.getByRole('article', { name: 'World State' });
  await invokeWidgetAction(worldState, 'Focus Widget');

  const dialog = page.getByRole('dialog', { name: 'Focused World State' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-pomegranate-widget="scene-world"]')).toHaveCount(1);
  await expect(page.locator('[data-focused-widget-placeholder="scene-world"]')).toBeVisible();
  await expect(page.locator('[data-pomegranate-widget="scene-world"]')).toHaveCount(1);

  await dialog.getByRole('button', { name: 'Back to Workbench' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Widget actions' })).toBeFocused();
});

test('Deep Current pointer drag floats and subsequently moves a Widget within the canvas', async ({ page }) => {
  const effects = page.getByRole('article', { name: 'Room Ambience' });
  const stageBox = await page.locator('[data-pomegranate-dock="main"]').boundingBox();
  if (!stageBox) throw new Error('Expected stage geometry.');
  await tearOffTo(page, widgetDragSurface(effects), {
    x: stageBox.x + stageBox.width * 0.72,
    y: stageBox.y + 90
  });

  const floating = page.locator('[data-widget-type="story.room-ambience"][data-pomegranate-placement="floating"]');
  await expect(floating).toBeVisible();
  const first = await floating.boundingBox();
  if (!first) throw new Error('Expected floating Widget geometry.');
  const floatingHandle = widgetDragSurface(floating);
  const floatingHandleBox = await floatingHandle.boundingBox();
  if (!floatingHandleBox) throw new Error('Expected floating drag handle geometry.');
  await dragTo(page, floatingHandle, {
    x: floatingHandleBox.x + floatingHandleBox.width / 2 + 60,
    y: floatingHandleBox.y + floatingHandleBox.height / 2 + 40
  });
  const second = await floating.boundingBox();
  expect(second?.x).toBeGreaterThan(first.x + 20);
  expect(second?.y).toBeGreaterThan(first.y + 10);
});

test('Deep Current edge controls collapse and restore both toolbars without hiding themselves', async ({ page }) => {
  const left = page.getByRole('button', { name: 'Toggle left dock' });
  const right = page.getByRole('button', { name: 'Toggle right dock' });

  await left.focus();
  await left.press('Enter');
  await expect(page.locator('main')).toHaveClass(/left-collapsed/);
  await expect(page.locator('[data-conformance-region="left"]')).toBeHidden();
  await expect(left).toBeVisible();
  await right.click();
  await expect(page.locator('main')).toHaveClass(/right-collapsed/);
  await expect(page.locator('[data-conformance-region="right"]')).toBeHidden();
  await expect(right).toBeVisible();
  await left.click();
  await right.click();
  await expect(page.locator('[data-conformance-region="left"]')).toBeVisible();
  await expect(page.locator('[data-conformance-region="right"]')).toBeVisible();
});

test('Deep Current narrow dock keeps the complete contextual Widget Actions menu', async ({ page }) => {
  const worldState = page.getByRole('article', { name: 'World State' });
  const header = widgetDragSurface(worldState);

  await header.hover();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(header.getByRole('button')).toHaveCount(1);

  await header.getByRole('button', { name: 'Widget actions' }).click();
  await expect(page.getByRole('menu').getByRole('menuitem')).toHaveText([
    'Dock left',
    'Dock main',
    'Float',
    'Group with previous Widget',
    'Focus Widget',
    'Move to Widget Shelf'
  ]);
});

test('Deep Current held Widget exposes the Atmospheric card, rails, and tab preview', async ({ page }) => {
  const characters = page.locator('[data-widget-type="story.characters"]').first();
  const worldState = page.getByRole('article', { name: 'World State' });
  const handle = widgetDragSurface(characters);
  const handleBox = await handle.boundingBox();
  const targetBox = await worldState.boundingBox();
  if (!handleBox || !targetBox) throw new Error('Expected held Widget and target geometry.');

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });

  const held = page.locator('[data-pom-part="widget.drag-preview"]');
  await expect(held).toBeVisible();
  await expect(held).toContainText('Characters');
  await expect(held.locator('article')).toHaveCount(1);
  await expect(page.locator('[data-pom-part="widget.drop-rail"]')).not.toHaveCount(0);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toBeVisible();
  await expect(page.locator('[data-pom-part="widget.tab-insertion"]')).toBeVisible();
  await expect(characters).toHaveAttribute('data-widget-drag-placeholder', 'true');

  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(held).toHaveCount(0);
  await expect(page.locator('[data-pom-part="widget.drop-rail"]')).toHaveCount(0);
  await expect(characters).not.toHaveAttribute('data-widget-drag-placeholder', 'true');
  await expect(characters).toHaveAttribute('data-pomegranate-edge', 'left');
});

test('held Widget leaves a vacant origin and a full-size in-layout welcoming slot', async ({ page }) => {
  const source = page.locator('[data-widget-type="story.characters"]').first();
  const target = page.getByRole('article', { name: 'World State' });
  const handleBox = await widgetDragSurface(source).boundingBox();
  const before = await target.boundingBox();
  if (!handleBox || !before) throw new Error('Expected origin and target geometry.');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height * .12, { steps: 8 });

  await expect(source).toHaveAttribute('data-widget-drag-placeholder', 'true');
  expect(await source.evaluate((node) => getComputedStyle(node.firstElementChild as Element).visibility)).toBe('hidden');
  const slot = page.locator('[data-pom-part="widget.dock-slot"]');
  await expect(slot).toBeVisible();
  const slotBox = await slot.boundingBox();
  const during = await target.boundingBox();
  expect(slotBox?.height).toBeGreaterThanOrEqual(72);
  expect(slotBox?.width).toBeGreaterThan(100);
  expect(during?.y).toBeGreaterThan((before?.y ?? 0) + 50);

  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(slot).toHaveCount(0);
  await expect(target).toHaveJSProperty('isConnected', true);
  expect(Math.abs(((await target.boundingBox())?.y ?? 0) - before.y)).toBeLessThan(4);
});

test('dragging to a collapsed edge reveals and widens that dock before commit', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle left dock' }).click();
  const source = page.getByRole('article', { name: 'Room Ambience' });
  const handleBox = await widgetDragSurface(source).boundingBox();
  if (!handleBox) throw new Error('Expected Room Ambience drag geometry.');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 28, { steps: 4 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await page.mouse.move(18, 320, { steps: 10 });

  await expect(page.locator('main')).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-conformance-region="left"]')).toBeVisible();
  const slot = page.locator('[data-pom-part="widget.dock-slot"]');
  await expect(slot).toBeVisible();
  expect((await slot.boundingBox())?.height).toBeGreaterThanOrEqual(72);
  await page.mouse.up();
  await expect(page.getByRole('article', { name: 'Room Ambience' }).locator('xpath=ancestor::*[@data-widget-type][1]'))
    .toHaveAttribute('data-pomegranate-edge', 'left');
  await expect(page.locator('main')).not.toHaveAttribute('data-drag-reveal-left');
});

test('grouped Widget tabs reorder horizontally without accidental detachment', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Custom Theme' });
  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(customTheme), characters);

  const group = page.locator('[data-widget-group]:has([data-group-widget-type="story.characters"])');
  await expect(group.getByRole('tab')).toHaveCount(2);
  const first = group.getByRole('tab').first();
  const second = group.getByRole('tab').nth(1);
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  if (!firstBox || !secondBox) throw new Error('Expected grouped tab geometry.');
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondBox.x + secondBox.width - 2, secondBox.y + secondBox.height / 2, { steps: 8 });
  await expect(page.locator('[data-pom-part="tab.insertion"]')).toBeVisible();
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height + 160, { steps: 4 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
  await page.mouse.up();
  await expect(group.getByRole('tab')).toHaveText(['Custom Theme', 'Characters (Story)']);
  await group.getByRole('tab', { name: 'Custom Theme' }).click();
  const renderedTheme = page.getByRole('article', { name: 'Custom Theme' }).locator('xpath=ancestor::*[@data-widget-type][1]');
  await expect(renderedTheme).toHaveAttribute('data-pomegranate-placement', 'docked');
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const renderedCharacters = page.getByRole('article', { name: 'Characters (Story)' }).locator('xpath=ancestor::*[@data-widget-type][1]');
  await expect(renderedCharacters).toHaveAttribute('data-pomegranate-placement', 'docked');
});

test('all themes preserve the same held-card docking composition', async ({ page }, testInfo) => {
  await openDeveloperTools(page);
  const themes = page.getByRole('group', { name: 'Visual target' });

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await themes.getByRole('button', { name: theme, exact: true }).click();
    await closeDeveloperTools(page);
    const source = page.locator('[data-widget-type="story.characters"]');
    const target = page.getByRole('article', { name: 'World State' });
    const handleBox = await widgetDragSurface(source).boundingBox();
    const targetBox = await target.boundingBox();
    if (!handleBox || !targetBox) throw new Error(`Missing ${theme} docking geometry.`);
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });

    const held = page.locator('[data-pom-part="widget.drag-preview"]');
    await expect(held.locator('xpath=ancestor::main[@data-pom-theme-root]')).toHaveCount(1);
    await expect(held.locator('[data-widget-type="story.characters"]')).toHaveCount(1);
    const [heldBox, snapBox, railCount, colors, viewport] = await Promise.all([
      held.boundingBox(),
      page.locator('[data-pom-part="widget.snap-preview"]').boundingBox(),
      page.locator('[data-pom-part="widget.drop-rail"]').count(),
      held.evaluate((node) => ({ border: getComputedStyle(node).borderColor, background: getComputedStyle(node).backgroundColor })),
      page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }))
    ]);
    expect(heldBox?.width).toBeGreaterThanOrEqual(230);
    expect(heldBox?.height).toBeGreaterThanOrEqual(120);
    expect(heldBox?.x).toBeGreaterThanOrEqual(0);
    expect(heldBox?.y).toBeGreaterThanOrEqual(0);
    expect((heldBox?.x ?? viewport.width) + (heldBox?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
    expect((heldBox?.y ?? viewport.height) + (heldBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    expect(snapBox?.width).toBeGreaterThan(100);
    expect(snapBox?.height).toBeGreaterThan(20);
    expect(railCount).toBeGreaterThanOrEqual(6);
    expect(colors.border).not.toBe('rgba(0, 0, 0, 0)');
    expect(colors.background).not.toBe('rgba(0, 0, 0, 0)');
    await testInfo.attach(`held-widget-${theme.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`, {
      body: await page.screenshot(),
      contentType: 'image/png'
    });

    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(held).toHaveCount(0);

    const freshHandleBox = await widgetDragSurface(source).boundingBox();
    const freshTargetBox = await target.boundingBox();
    const freshTargetBody = await target.locator('[data-pom-part="widget.content"]').first().boundingBox();
    if (!freshHandleBox || !freshTargetBox || !freshTargetBody) throw new Error(`Missing ${theme} slot geometry.`);
    await page.mouse.move(freshHandleBox.x + freshHandleBox.width / 2, freshHandleBox.y + freshHandleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(freshTargetBody.x + freshTargetBody.width / 2, freshTargetBody.y + freshTargetBody.height * .12, { steps: 8 });
    const slot = page.locator('[data-pom-part="widget.dock-slot"]');
    await expect(slot).toBeVisible();
    const [slotBox, slotMaterial] = await Promise.all([
      slot.boundingBox(),
      slot.evaluate((node) => ({ border: getComputedStyle(node).borderColor, background: getComputedStyle(node).backgroundColor }))
    ]);
    expect(slotBox?.height).toBeGreaterThanOrEqual(72);
    expect(slotBox?.width).toBeGreaterThan(100);
    expect(slotMaterial.border).not.toBe('rgba(0, 0, 0, 0)');
    await testInfo.attach(`welcoming-slot-${theme.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`, {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await openDeveloperTools(page);
  }
  await closeDeveloperTools(page);
});

test('held-Widget docking removes transition motion when the user requests it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const source = page.locator('[data-widget-type="story.characters"]');
  const target = page.getByRole('article', { name: 'World State' });
  const handleBox = await widgetDragSurface(source).boundingBox();
  const targetBox = await target.boundingBox();
  if (!handleBox || !targetBox) throw new Error('Missing reduced-motion docking geometry.');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });

  for (const selector of [
    '[data-pom-part="widget.drag-preview"]',
    '[data-pom-part="widget.drop-rail"]',
    '[data-pom-part="widget.snap-preview"]'
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS('transition-duration', '0s');
  }
  await page.keyboard.press('Escape');
  await page.mouse.up();
});

test('Deep Current title-bar drag docks a Widget across both instrument rails', async ({ page }) => {
  const characters = page.locator('[data-widget-type="story.characters"]');
  await dragToShelfRail(page, widgetDragSurface(characters), 'right');
  await expect(characters).toHaveAttribute('data-pomegranate-edge', 'right');
  await expect(characters).toHaveAttribute('data-pomegranate-shelf', /right-shelf-/);

  await dragToShelfRail(page, widgetDragSurface(characters), 'left');
  await expect(characters).toHaveAttribute('data-pomegranate-edge', 'left');
  await expect(characters).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);
});

test('Deep Current drag creates a new shelf and invalid release restores exact origin', async ({ page }) => {
  const effects = page.getByRole('article', { name: 'Room Ambience' });
  const effectsRoot = effects.locator('xpath=ancestor::*[@data-widget-type][1]');
  const effectsOrigin = await effectsRoot.evaluate((node) => ({
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order')
  }));
  await dragToShelfRail(page, widgetDragSurface(effects), 'left');
  const placed = page.locator('[data-widget-type="story.room-ambience"]');
  await expect(placed).toHaveAttribute('data-pomegranate-edge', 'left');
  await expect(placed).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);

  await page.getByRole('button', { name: 'Undo layout' }).press('Enter');
  await expect.poll(() => effectsRoot.evaluate((node) => ({
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order')
  }))).toEqual(effectsOrigin);
  await expect(page.locator('[data-pomegranate-shelf^="left-shelf-"]')).toHaveCount(0);

  await dragToShelfRail(page, widgetDragSurface(effects), 'left');
  await expect(placed).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);

  const characters = page.locator('[data-widget-type="story.characters"]');
  const origin = await characters.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }));
  const revision = await page.locator('main').getAttribute('data-workbench-revision');
  await dragTo(page, widgetDragSurface(characters), { x: 2, y: 2 });
  await expect.poll(() => characters.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }))).toEqual(origin);
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', revision ?? '');

  const cancelHandle = widgetDragSurface(characters);
  const cancelBox = await cancelHandle.boundingBox();
  if (!cancelBox) throw new Error('Expected cancel drag handle geometry.');
  const cancelElement = await cancelHandle.elementHandle();
  if (!cancelElement) throw new Error('Expected cancel drag handle.');
  await page.mouse.move(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cancelBox.x + cancelBox.width / 2 + 18, cancelBox.y + cancelBox.height / 2 + 18);
  await cancelElement.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await page.mouse.up();
  await expect.poll(() => characters.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }))).toEqual(origin);
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', revision ?? '');
});

test('pre-hold touch movement cancels the Widget drag candidate permanently', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    const handle = widgetDragSurface(page.getByRole('article', { name: 'Room Ambience' }));
    const grip = await handle.getAttribute('data-widget-touch-drag-grip') === null
      ? handle.locator('[data-widget-touch-drag-grip]')
      : handle;
    const handleBox = await grip.boundingBox();
    if (!handleBox) throw new Error('Expected touch placement geometry.');
    const handleElement = await grip.elementHandle();
    if (!handleElement) throw new Error('Expected touch placement handle.');
    const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
    await handleElement.dispatchEvent('pointerdown', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y });
    await handleElement.dispatchEvent('pointermove', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y + 18 });
    await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
    await page.waitForTimeout(190);
    await handleElement.dispatchEvent('pointermove', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y + 20 });
    await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
    await handleElement.dispatchEvent('pointerup', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y + 20 });
  } finally {
    await context.close();
  }
});

test('Deep Current accepts the same shelf placement path from a deliberate coarse touch hold', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    const handle = widgetDragSurface(page.getByRole('article', { name: 'Room Ambience' }));
    const grip = await handle.getAttribute('data-widget-touch-drag-grip') === null
      ? handle.locator('[data-widget-touch-drag-grip]')
      : handle;
    const handleBox = await grip.boundingBox();
    if (!handleBox) throw new Error('Expected touch placement geometry.');
    const handleElement = await grip.elementHandle();
    if (!handleElement) throw new Error('Expected touch placement handle.');
    const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
    await handleElement.dispatchEvent('pointerdown', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y });
    await page.waitForTimeout(190);
    await handleElement.dispatchEvent('pointermove', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y + 20 });
    await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
    const railBox = await page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"][data-drop-rail-kind="append"]').last().boundingBox();
    if (!railBox) throw new Error('Expected touch shelf rail geometry.');
    const end = { x: railBox.x + railBox.width / 2, y: railBox.y + railBox.height / 2 };
    await handleElement.dispatchEvent('pointermove', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: end.x, clientY: end.y });
    await handleElement.dispatchEvent('pointerup', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: end.x, clientY: end.y });
    await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
    await expect(page.locator('[data-widget-type="story.room-ambience"]')).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);
  } finally {
    await context.close();
  }
});

test('phone touch panning outside the dedicated Widget grip scrolls and never becomes a drag', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 500 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByRole('tab', { name: 'Settings' }).click();
    const header = widgetDragSurface(page.getByRole('article', { name: 'Provider Credentials' }));
    const point = await header.evaluate((node) => {
      let owner: HTMLElement | null = node.parentElement;
      while (owner) {
        const style = getComputedStyle(owner);
        if (owner.scrollHeight > owner.clientHeight + 1 && /auto|scroll/.test(style.overflowY)) break;
        owner = owner.parentElement;
      }
      if (!owner) throw new Error('Expected a mobile Settings scroll owner.');
      owner.dataset.touchScrollOwner = 'true';
      owner.scrollTop = 0;
      const rect = node.getBoundingClientRect();
      for (let offset = 1; offset < rect.width; offset += 2) {
        const x = rect.left + offset;
        const y = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(x, y);
        if (hit && hit.closest('[data-widget-drag-surface]') === node
          && !hit.closest('[data-widget-touch-drag-grip], button, a, input, textarea, select')) return { x, y };
      }
      throw new Error('Expected scroll-compatible Widget header chrome outside the touch grip.');
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
    for (const distance of [20, 40, 70, 100, 130]) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: point.x, y: point.y - distance }]
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect.poll(() => page.locator('[data-touch-scroll-owner="true"]').evaluate((node) => node.scrollTop)).toBeGreaterThan(20);
    await page.waitForTimeout(220);
    await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('Scene, Library, and Settings retain independent interaction layouts after reload', async ({ page }) => {
  const sceneLeft = page.getByRole('separator', { name: 'Resize left toolbar' });
  await sceneLeft.focus();
  await sceneLeft.press('End');
  await invokeWidgetAction(page.getByRole('article', { name: 'Characters (Story)' }), 'Float');
  await dragToShelfRail(page, widgetDragSurface(page.getByRole('article', { name: 'Room Ambience' })), 'left');

  await page.getByRole('tab', { name: 'Library' }).click();
  const libraryLeft = page.getByRole('separator', { name: 'Resize left toolbar' });
  await libraryLeft.focus();
  await libraryLeft.press('Home');
  const character = page.getByRole('article', { name: 'Character Card' });
  const characterBox = await character.boundingBox();
  if (!characterBox) throw new Error('Expected Character Card geometry.');
  await dragTo(page, widgetDragSurface(page.getByRole('article', { name: 'Lore Entry Tree' })), {
    x: characterBox.x + characterBox.width / 2,
    y: characterBox.y + 16
  });

  await page.getByRole('tab', { name: 'Settings' }).click();
  const settingsRight = page.getByRole('separator', { name: 'Resize right toolbar' });
  await settingsRight.focus();
  await settingsRight.press('ArrowLeft');
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();

  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('separator', { name: 'Resize right toolbar' })).toHaveAttribute('aria-valuenow', '278');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '200');
  await expect(page.getByRole('group', { name: 'Widget group' }).getByRole('tab')).toHaveText(['Character Card', 'Lore Entry Tree']);
  await page.getByRole('tab', { name: 'Scene' }).click();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '420');
  await expect(page.locator('[data-widget-type="story.room-ambience"]')).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);
  await expect(page.locator('[data-widget-type="story.characters"]')).toHaveAttribute('data-pomegranate-placement', 'floating');
});

test('native workbench POM-PERSIST-842D422EB3 POM-PERSIST-9FA69F9FC1 restores a user Panel template and order', async ({ page }) => {
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('My Chronicle');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');

  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');
});

test('native workbench persists Panel navigation without modified-arrow rail reorder', async ({ page }) => {
  const panelTabs = page.getByRole('tablist', { name: 'Panels' });
  const order = await panelTabs.getByRole('tab').allTextContents();
  await panelTabs.getByRole('tab', { name: 'Settings' }).focus();
  await panelTabs.getByRole('tab', { name: 'Settings' }).press('Control+Shift+ArrowLeft');
  await expect(panelTabs.getByRole('tab')).toHaveText(order);
  await expect(panelTabs.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(panelTabs.getByRole('tab')).toHaveText(order);
  await expect(panelTabs.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
});

test('native workbench applies complete themes without replacing live Workbench identity', async ({ page }) => {
  const root = page.locator('main');
  const composer = page.getByRole('textbox', { name: /Next action/ });
  await composer.fill('Keep this exact live draft across all targets.');
  await composer.focus();
  const identity = await root.evaluate((node) => ({
    revision: node.getAttribute('data-workbench-revision'),
    activePanel: node.getAttribute('data-active-panel'),
    panels: [...node.querySelectorAll('[data-pomegranate-panel]')].map((panel) => panel.getAttribute('data-pomegranate-panel')),
    widgets: [...node.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget')),
    focusedWidget: document.activeElement?.closest('[data-pomegranate-widget]')?.getAttribute('data-pomegranate-widget') ?? null
  }));
  await openDeveloperTools(page);
  const themeTargets = page.getByRole('group', { name: 'Visual target' });
  for (const theme of [
    { label: 'PomOS', id: 'pom-neutral' },
    { label: 'Bunny', id: 'bunny' },
    { label: 'Ash & Amber', id: 'ash-amber' },
    { label: 'Deep Current', id: 'deep-current' },
    { label: 'Ash & Amber', id: 'ash-amber' }
  ]) {
    const button = themeTargets.getByRole('button', { name: theme.label, exact: true });
    await button.click();
    await expect(root).toHaveAttribute('data-pom-theme', theme.id);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(root).toHaveAttribute('data-workbench-revision', identity.revision ?? '');
    await expect(root).toHaveAttribute('data-active-panel', identity.activePanel ?? '');
    await expect(composer).toHaveValue('Keep this exact live draft across all targets.');
    await expect.poll(() => root.evaluate((node) => ({
      panels: [...node.querySelectorAll('[data-pomegranate-panel]')].map((panel) => panel.getAttribute('data-pomegranate-panel')),
      widgets: [...node.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
    }))).toEqual({ panels: identity.panels, widgets: identity.widgets });
  }
  expect(identity.focusedWidget).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pomegranate-ui.workbench-lab.theme.v1'))).toBe('ash-amber');
  await page.getByText('Developer tools', { exact: true }).click();
  await openWidgetCatalog(page);
  await expect(page.getByRole('dialog', { name: 'Widget Catalog' })).toBeVisible();
});

test('every theme keeps Panel tabs pointer-accessible beside the active Panel menu', async ({ page }) => {
  for (const viewport of [{ width: 1920, height: 1280 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await openDeveloperTools(page);
    const themes = page.getByRole('group', { name: 'Visual target' });
    for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
      await themes.getByRole('button', { name: theme, exact: true }).click();
      await closeDeveloperTools(page);
      await page.getByRole('tab', { name: 'Library' }).click();
      await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
      await page.getByRole('tab', { name: 'Scene' }).click();
      await expect(page.getByRole('tab', { name: 'Scene' })).toHaveAttribute('aria-selected', 'true');
      await openDeveloperTools(page);
    }
    await closeDeveloperTools(page);
  }
});

test('all theme targets remain readable, transition-free, and contained at wide and compact sizes', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await openDeveloperTools(page);
    for (const theme of [
      { label: 'Deep Current', id: 'deep-current', text: 'rgb(239, 244, 241)' },
      { label: 'PomOS', id: 'pom-neutral', text: 'rgb(16, 24, 32)' },
      { label: 'Bunny', id: 'bunny', text: 'rgb(69, 54, 77)' },
      { label: 'Ash & Amber', id: 'ash-amber', text: 'rgb(243, 240, 234)' }
    ]) {
      const button = page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme.label, exact: true });
      await button.click();
      await expect(page.locator('main')).toHaveAttribute('data-pom-theme', theme.id);
      const evidence = await page.locator('main').evaluate((root) => {
        const rootStyle = getComputedStyle(root);
        const widget = root.querySelector('.widget-frame');
        if (!(widget instanceof HTMLElement)) throw new Error('Expected a rendered Widget frame.');
        const widgetStyle = getComputedStyle(widget);
        return {
          viewportWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          transitionDuration: rootStyle.transitionDuration,
          text: rootStyle.color,
          widgetBackground: widgetStyle.backgroundColor,
          focusWidth: rootStyle.getPropertyValue('--pom-focus-width').trim()
        };
      });
      expect(evidence.scrollWidth).toBeLessThanOrEqual(evidence.viewportWidth);
      expect(evidence.transitionDuration).toBe('0s');
      expect(evidence.text).toBe(theme.text);
      expect(evidence.widgetBackground).toMatch(/^rgba?/);
      expect(Number.parseFloat(evidence.focusWidth)).toBeGreaterThanOrEqual(2);
    }
  }
});

test('coarse-pointer controls retain 44px interaction targets independently of their visual face', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)).toBe(true);
    await openDeveloperTools(page);
    await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: 'Bunny', exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'bunny');
    for (const control of [
      page.getByRole('tab', { name: 'Scene' }),
      page.getByRole('button', { name: 'Open Widget Catalog' }),
      page.getByRole('button', { name: 'Collapse left dock' }),
      page.getByRole('button', { name: 'Continue' })
    ]) {
      const box = await control.boundingBox();
      const label = await control.getAttribute('aria-label') ?? await control.textContent() ?? 'control';
      expect(box?.width, `${label} width`).toBeGreaterThanOrEqual(44);
      expect(box?.height, `${label} height`).toBeGreaterThanOrEqual(44);
    }
  } finally {
    await context.close();
  }
});

test('all 94 reviewed Widget surfaces expose exact ready, state, focus, and responsive contracts', async ({ page }) => {
  test.setTimeout(120_000);
  const presentationTitleOverrides = new Map<string, string>([
    ['settings.connections', 'AI Connections'],
    ['settings.custom-theme', 'Custom Theme'],
    ['story.characters', 'Characters (Story)'],
    ['story.personas', 'Personas'],
    ['story.room-ambience', 'Room Ambience']
  ]);
  for (const surface of IMPLEMENTED_SURFACES) {
    const fixture = SURFACE_FIXTURES.get(surface.type);
    if (!fixture) throw new Error(`Missing fixture for ${surface.type}.`);
    await page.goto(`http://127.0.0.1:4174/?surface=${encodeURIComponent(surface.type)}`);
    await page.evaluate(() => document.fonts.ready);
    const article = page.locator(`[data-widget-type="${surface.type}"] > article`);
    await expect(article).toHaveCount(1);
    const expectedPresentationTitle = presentationTitleOverrides.get(surface.type) ?? surface.title;
    await expect(article).toHaveAttribute('aria-label', expectedPresentationTitle);
    const implemented = article.locator(`[data-surface-type="${surface.type}"]`);
    await expect(implemented).toHaveAttribute('data-surface-state', 'ready');
    await expect(implemented.locator('.surface-scope')).toHaveText(fixture.scope);
    await expect(implemented.locator('.surface-contract-facts dt')).toHaveText(fixture.rows.map(([label]) => label));
    await expect(implemented.locator('.surface-actions button, .widget-content.composer > button')).toHaveText(fixture.actions);

    const containment = await article.evaluate((root) => {
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
      return {
        horizontalOverflow: root.scrollWidth - root.clientWidth,
        scrollOwners: elements.filter((node) => (
          !['TEXTAREA', 'INPUT', 'SELECT'].includes(node.tagName)
            && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)
            && node.scrollHeight > node.clientHeight + 1
        )).length,
        unnamedButtons: elements.filter((node) => node instanceof HTMLButtonElement && !(node.getAttribute('aria-label') ?? node.textContent ?? '').trim()).length
      };
    });
    expect(containment.horizontalOverflow, `${surface.type} horizontal overflow`).toBeLessThanOrEqual(1);
    expect(containment.scrollOwners, `${surface.type} scroll owners`).toBeLessThanOrEqual(1);
    expect(containment.unnamedButtons, `${surface.type} unnamed buttons`).toBe(0);

    await openDeveloperTools(page);
    const statePicker = page.getByRole('combobox', { name: 'Surface preview state' });
    for (const fixtureState of fixture.states) {
      await statePicker.selectOption(fixtureState);
      await expect(implemented).toHaveAttribute('data-surface-state', fixtureState);
      if (fixtureState !== 'ready') {
        const stateCopy = SURFACE_STATE_COPY[fixtureState];
        await expect(implemented.locator('.surface-state')).toContainText(stateCopy[0]);
        await expect(implemented.locator('.surface-state')).toContainText(stateCopy[1]);
      }
    }
    await statePicker.selectOption('ready');
    await expect(implemented.locator('.surface-state')).toHaveCount(0);
    await closeDeveloperTools(page);

    const previewRegionRole = await article.evaluate((root) => root.closest<HTMLElement>('[data-pomegranate-region-role]')?.dataset.pomegranateRegionRole ?? '');
    if (surface.family !== 'story' && previewRegionRole === 'support') {
      const side = surface.family === 'systems' ? 'right' : 'left';
      const separator = page.getByRole('separator', { name: `Resize ${side} toolbar` });
      await separator.press('Home');
      expect((await article.boundingBox())?.width, `${surface.type} compact width`).toBeLessThanOrEqual(202);
      const compactOverflow = await horizontalOverflowEvidence(article);
      expect(compactOverflow.amount, `${surface.type} compact overflow: ${compactOverflow.descendants.join('; ')}`).toBeLessThanOrEqual(1);
      await separator.press('End');
      expect((await article.boundingBox())?.width, `${surface.type} wide width`).toBeLessThanOrEqual(422);
      const wideOverflow = await horizontalOverflowEvidence(article);
      expect(wideOverflow.amount, `${surface.type} wide overflow: ${wideOverflow.descendants.join('; ')}`).toBeLessThanOrEqual(1);
    }

    await invokeWidgetAction(article, 'Focus Widget');
    const dialog = page.getByRole('dialog', { name: `Focused ${expectedPresentationTitle}` });
    await expect(dialog.locator(`[data-surface-type="${surface.type}"]`)).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Back to Workbench' }).click();
    await expect(article.getByRole('button', { name: 'Widget actions' })).toBeFocused();
  }
});

test('Catalog renders the source composition, 94 shared previews, and exact expanded geometry', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('Catalog Proof');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'Catalog Proof' })).toHaveAttribute('aria-selected', 'true');

  await closeDeveloperTools(page);
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const results = catalog.locator('[data-catalog-result]');
  await expect(catalog.locator('.catalog-title h2')).toHaveText('Widget Catalog');
  await expect(catalog.locator('.catalog-title span')).toHaveText('Build this Panel');
  await expect(catalog.getByRole('button', { name: 'Close Widget Catalog' })).toBeVisible();
  await expect(catalog.getByRole('searchbox', { name: 'Search Widgets' })).toHaveAttribute('placeholder', 'Search widgets…');
  const previewSize = catalog.getByRole('slider', { name: 'Preview size' });
  await expect(previewSize).toHaveValue('286');
  await expect(previewSize).toHaveAttribute('min', '200');
  await expect(previewSize).toHaveAttribute('max', '420');
  await expect(catalog.getByRole('group', { name: 'Catalog view' }).getByRole('button')).toHaveText(['Visual', 'Compact']);
  await expect(catalog.getByRole('navigation', { name: 'Widget categories' }).getByRole('button')).toHaveText([
    'All', 'Story', 'Library', 'Systems', 'Settings', 'Extensions'
  ]);
  await expect(catalog.getByRole('group', { name: 'Catalog filters' }).getByRole('button')).toHaveText([
    'Favorites', 'Recent', 'On this Panel', 'Fits this layout'
  ]);
  await expect(catalog.locator('.catalog-foot')).toHaveText(['94 widgetsStrictly active story']);
  await expect(results).toHaveCount(94);
  await expect(results.locator('[data-catalog-result-content]')).toHaveCount(94);
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(94);
  await expect(catalog.locator('.catalog-widget-preview [data-surface-type]')).toHaveCount(94);
  await expect(catalog.locator('[data-renderer-status="unavailable"]')).toHaveCount(0);
  await expect(catalog.getByRole('button', { name: /^Add / })).toHaveCount(0);
  expect(await results.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('role') === 'button' && node.getAttribute('tabindex') === '0'))).toBe(true);

  const geometry = await catalog.evaluate((dialog) => {
    const header = dialog.querySelector<HTMLElement>('.catalog-head')!;
    const results = dialog.querySelector<HTMLElement>('.catalog-results')!;
    const cards = [...dialog.querySelectorAll<HTMLElement>('[data-catalog-result]')];
    const box = dialog.getBoundingClientRect();
    const cardWidths = cards.map((card) => Math.round(card.getBoundingClientRect().width));
    const cardHeights = cards.map((card) => Math.round(card.getBoundingClientRect().height));
    const scrollOwners = [dialog, ...dialog.querySelectorAll<HTMLElement>('*')].filter((node) => {
      const overflow = getComputedStyle(node).overflowY;
      return ['auto', 'scroll'].includes(overflow) && node.scrollHeight > node.clientHeight + 1;
    });
    return {
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      headerHeight: header.getBoundingClientRect().height,
      columns: getComputedStyle(results).gridTemplateColumns.split(' ').map(Number.parseFloat),
      rowGap: getComputedStyle(results).rowGap,
      narrowWidths: cards.filter((card) => ['narrow', 'medium'].includes(card.dataset.previewShape ?? '')).map((card) => Math.round(card.getBoundingClientRect().width)),
      wideWidths: cards.filter((card) => ['wide', 'stage', 'strip'].includes(card.dataset.previewShape ?? '')).map((card) => Math.round(card.getBoundingClientRect().width)),
      rowEnds: new Set(cards.map((card) => getComputedStyle(card).gridRowEnd)).size,
      heights: new Set(cardHeights).size,
      widths: new Set(cardWidths).size,
      scrollOwnerClass: scrollOwners.map((node) => node.className)
    };
  });
  expect(geometry.box).toEqual({ x: 192, y: 108, width: 1536, height: 864 });
  expect(geometry.headerHeight).toBe(42);
  expect(geometry.columns).toEqual([286, 286, 286, 286, 286]);
  expect(geometry.rowGap).toBe('8px');
  expect(new Set(geometry.narrowWidths)).toEqual(new Set([286]));
  expect(new Set(geometry.wideWidths)).toEqual(new Set([580]));
  expect(geometry.rowEnds).toBeGreaterThan(1);
  expect(geometry.heights).toBeGreaterThan(1);
  expect(geometry.widths).toBe(2);
  expect(geometry.scrollOwnerClass).toEqual(['catalog-results']);

  for (const [category, total] of [['Story', 12], ['Library', 19], ['Systems', 21], ['Settings', 39], ['Extensions', 3]] as const) {
    await catalog.getByRole('button', { name: category, exact: true }).click();
    await expect(results, `${category} Catalog total`).toHaveCount(total);
  }
  await catalog.getByRole('button', { name: 'All', exact: true }).click();
  const search = catalog.getByRole('searchbox', { name: 'Search Widgets' });
  await search.fill('character relationships');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText('Character Relationships');
  await search.fill('');

  await catalog.locator('.catalog-results').evaluate((region) => { region.scrollTop = 400; });
  await expect.poll(() => catalog.locator('.catalog-results').evaluate((region) => region.scrollTop)).toBeGreaterThan(0);
  const anchorKey = await catalog.locator('.catalog-results').evaluate((region) => {
    const regionBox = region.getBoundingClientRect();
    const results = [...region.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')];
    const visible = results.find((result) => {
      const box = result.getBoundingClientRect();
      return box.top >= regionBox.top && box.top < regionBox.bottom;
    }) ?? results.find((result) => {
      const box = result.getBoundingClientRect();
      return box.bottom > regionBox.top && box.top < regionBox.bottom;
    });
    return visible?.dataset.widgetType ?? null;
  });
  if (!anchorKey) throw new Error('Missing first visible Catalog anchor.');
  const anchored = catalog.locator(`[data-catalog-result][data-widget-type="${anchorKey}"]`);
  const anchorTop = await anchored.evaluate((node) => node.getBoundingClientRect().top);
  await previewSize.fill('420');
  await expect(previewSize).toHaveValue('420');
  await expect.poll(() => anchored.evaluate((node) => node.getBoundingClientRect().top)).toBeCloseTo(anchorTop, 0);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(anchored).toBeVisible();
  expect(await anchored.evaluate((node) => node.getBoundingClientRect().top)).toBeCloseTo(anchorTop, 0);
  const nextAnchorKey = await catalog.locator('.catalog-results').evaluate((region) => {
    const regionBox = region.getBoundingClientRect();
    const results = [...region.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')];
    const visible = results.find((result) => {
      const box = result.getBoundingClientRect();
      return box.top >= regionBox.top && box.top < regionBox.bottom;
    }) ?? results.find((result) => {
      const box = result.getBoundingClientRect();
      return box.bottom > regionBox.top && box.top < regionBox.bottom;
    });
    return visible?.dataset.widgetType ?? null;
  });
  if (!nextAnchorKey) throw new Error('Missing Large Catalog anchor.');
  const nextAnchored = catalog.locator(`[data-catalog-result][data-widget-type="${nextAnchorKey}"]`);
  const nextAnchorTop = await nextAnchored.evaluate((node) => node.getBoundingClientRect().top);
  await previewSize.fill('286');
  await expect(previewSize).toHaveValue('286');
  await expect.poll(() => nextAnchored.evaluate((node) => node.getBoundingClientRect().top)).toBeCloseTo(nextAnchorTop, 0);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await nextAnchored.evaluate((node) => node.getBoundingClientRect().top)).toBeCloseTo(nextAnchorTop, 0);

  await catalog.getByRole('button', { name: 'Compact', exact: true }).click();
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(0);
  await expect(catalog.getByRole('slider', { name: 'Preview size' })).toHaveCount(0);
  await expect(results).toHaveCount(94);
  const compactWidths = await results.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().width)));
  expect(new Set(compactWidths).size).toBe(1);
  expect(compactWidths[0]).toBeGreaterThan(1400);
  await catalog.getByRole('button', { name: 'Visual', exact: true }).click();
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(94);
});

test('Catalog whole-result automatic and pointer placement each dispatch exactly one canonical Widget', async ({ page }) => {
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const automatic = catalog.locator('[data-catalog-result][data-widget-type="settings.accessibility"]');
  await automatic.focus();
  await automatic.press('Enter');
  await expect(page.locator('[data-widget-type="settings.accessibility"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(automatic).toHaveAttribute('aria-disabled', 'true');

  const pointerResult = catalog.locator('[data-catalog-result][data-widget-type="ext:trail:location-notes"]');
  await pointerResult.scrollIntoViewIfNeeded();
  const originBox = await pointerResult.boundingBox();
  if (!originBox) throw new Error('Missing Catalog pointer-result geometry.');
  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 13, originBox.y + 8);
  await expect(catalog).toBeVisible();
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveCount(0);
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  const proxy = page.locator('[data-catalog-placement-proxy]');
  await expect(proxy).toBeVisible();
  await expect(catalog).toBeHidden();
  const targets = page.locator('[data-catalog-placement-target]');
  await expect(targets).not.toHaveCount(0);
  const target = targets.first();
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('Missing compatible Catalog placement target.');
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 2 });
  const proxyEvidence = await proxy.evaluate((node) => ({
    input: node.getAttribute('data-placement-input'),
    x: Number(node.getAttribute('data-placement-x')),
    y: Number(node.getAttribute('data-placement-y')),
    target: node.getAttribute('data-placement-target')
  }));
  expect(proxyEvidence).toMatchObject({
    input: 'pointer',
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2
  });
  expect(proxyEvidence.target).not.toBe('');
  const selectedTarget = page.locator(`[data-catalog-placement-target=${JSON.stringify(proxyEvidence.target)}]`);
  await expect(selectedTarget).toHaveCount(1);
  await expect(selectedTarget).toHaveClass(/is-catalog-target-active/);
  const selectedBox = await selectedTarget.boundingBox();
  if (!selectedBox) throw new Error('Missing selected Catalog placement target geometry.');
  expect(proxyEvidence.x).toBeGreaterThanOrEqual(selectedBox.x);
  expect(proxyEvidence.x).toBeLessThanOrEqual(selectedBox.x + selectedBox.width);
  expect(proxyEvidence.y).toBeGreaterThanOrEqual(selectedBox.y);
  expect(proxyEvidence.y).toBeLessThanOrEqual(selectedBox.y + selectedBox.height);
  await page.mouse.up();
  await expect(page.locator('[data-widget-type="ext:trail:location-notes"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(proxy).toHaveCount(0);
});
