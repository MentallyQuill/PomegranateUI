import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { IMPLEMENTED_SURFACES } from '../../apps/workbench-lab/src/mockup/implemented-surfaces.ts';
import { SURFACE_FIXTURES, SURFACE_STATE_COPY } from '../../apps/workbench-lab/src/mockup/surface-fixtures.ts';
import {
  CATALOG_AUTHORITY_MATRIX,
  CATALOG_AUTHORITY_SHA256
} from '../reference/widget-catalog-authority.ts';
import {
  dragTo,
  dragToShelfRail,
  dragToWidgetTab,
  invokeWidgetAction,
  tearOffTo,
  widgetDragSurface
} from './support/widget-interaction-driver.ts';

const labOrigin = `http://127.0.0.1:${process.env.POM_PLAYWRIGHT_PORT ?? '4174'}`;

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

async function toggleAndSampleToolbar(
  toggle: import('@playwright/test').Locator,
  side: 'left' | 'right',
  frames = 16
) {
  return toggle.evaluate(async (node: HTMLButtonElement, options) => {
    const region = document.querySelector<HTMLElement>(`[data-conformance-region="${options.side}"]`);
    if (!region) throw new Error(`Missing ${options.side} toolbar.`);
    const root = node.closest('main[data-pom-theme-root]');
    if (!root) throw new Error('Missing theme root.');
    const collapsedClass = `${options.side}-collapsed`;
    const wasCollapsed = root.classList.contains(collapsedClass);
    const startedAt = performance.now();
    node.click();
    await Promise.resolve();
    const stateChangedBeforeFirstFrame = root.classList.contains(collapsedClass) !== wasCollapsed;
    const samples: Array<{ elapsedMs: number; stateChangedBeforeFirstFrame: boolean; x: number; width: number }> = [];
    for (let frame = 0; frame < options.frames; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const rect = region.getBoundingClientRect();
      samples.push({ elapsedMs: performance.now() - startedAt, stateChangedBeforeFirstFrame, x: rect.x, width: rect.width });
    }
    return samples;
  }, { side, frames });
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
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

test('native workbench POM-PANEL-07856BFE9A POM-PANEL-DF4EC7C581 keeps story context inside the Scene stage', async ({ page }) => {
  const shelf = page.locator('.top-shelf');
  const storyStage = page.getByRole('region', { name: 'Story reading stage' });
  await expect(shelf).not.toContainText('The Water Remembers');
  await expect(storyStage.getByRole('heading', { level: 1, name: 'The Water Remembers' })).toBeVisible();
  await expect(storyStage.locator('.story-context-heading p')).toHaveText('Current scene: FIG. 07 / LIMINAL RESERVOIR');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await expect(shelf).not.toContainText('The Water Remembers');
  await expect(page.getByRole('region', { name: 'Story reading stage' })).toHaveCount(0);
  await expect(page.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
  await expect(page.locator('[data-surface-type="library.workspace"]')).toBeVisible();
});

test('Panel context actions target an inactive tab without activating it and restore focus', async ({ page }) => {
  const scene = page.getByRole('tab', { name: 'Scene' });
  const library = page.getByRole('tab', { name: 'Library' });
  await expect(page.getByRole('button', { name: /^Manage / })).toHaveCount(0);
  await expect(page.locator('.panel-menu-surface:not(.widget-actions-menu)')).toHaveCount(1);
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

test('Panel action controls use themed field and button surfaces', async ({ page }) => {
  await page.getByRole('tab', { name: 'Scene' }).click({ button: 'right' });
  const menu = page.getByRole('dialog', { name: 'Scene Panel actions' });
  const field = menu.getByRole('textbox', { name: 'Panel name' });
  const buttons = menu.getByRole('button');

  await expect(field).toHaveAttribute('data-pom-part', 'field.surface');
  await expect(buttons).toHaveCount(7);
  expect(await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-pom-part'))))
    .toEqual(Array(7).fill('button.surface'));
  expect(await field.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  expect(await buttons.first().evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgb(239, 239, 239)');
});

test('sub-panel action controls use themed button surfaces', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const target = page.getByRole('tablist', { name: 'Settings sub-panels' }).getByRole('tab').first();
  const targetName = await target.textContent();
  if (!targetName) throw new Error('Expected a Settings sub-panel action target.');
  await target.click({ button: 'right' });
  const buttons = page.getByRole('dialog', { name: `${targetName} sub-panel actions` }).getByRole('button');

  await expect(buttons).toHaveCount(6);
  expect(await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-pom-part'))))
    .toEqual(Array(6).fill('button.surface'));
  expect(await buttons.first().evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe('rgb(239, 239, 239)');
});

test('Create Panel follows the last Panel tab while the rail has room', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1280 });
  const lastTab = page.getByRole('tablist', { name: 'Panels' }).getByRole('tab').last();
  const addPanel = page.getByRole('button', { name: 'Create Panel' });
  const widgets = page.getByRole('button', { name: 'Open Widget Catalog' });
  const geometry = await Promise.all([lastTab.boundingBox(), addPanel.boundingBox(), widgets.boundingBox()]);
  if (geometry.some((box) => !box)) throw new Error('Expected visible Panel chrome geometry.');
  const [tabBox, addBox, widgetBox] = geometry as [
    NonNullable<typeof geometry[0]>,
    NonNullable<typeof geometry[1]>,
    NonNullable<typeof geometry[2]>
  ];

  expect(Math.abs(addBox.x - (tabBox.x + tabBox.width))).toBeLessThanOrEqual(1);
  expect(widgetBox.x - (addBox.x + addBox.width)).toBeGreaterThan(40);
  await expect(page.locator('.top-shelf')).not.toContainText('The Water Remembers');
});

test('four short Panel tabs keep story context in the stage while Create Panel follows the rail', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1280 });
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('Log');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await closeDeveloperTools(page);

  const lastTab = page.getByRole('tablist', { name: 'Panels' }).getByRole('tab').last();
  const addPanel = page.getByRole('button', { name: 'Create Panel' });
  const geometry = await Promise.all([lastTab.boundingBox(), addPanel.boundingBox()]);
  if (geometry.some((box) => !box)) throw new Error('Expected four-Panel chrome geometry.');
  const [tabBox, addBox] = geometry as [NonNullable<typeof geometry[0]>, NonNullable<typeof geometry[1]>];

  expect(Math.abs(addBox.x - (tabBox.x + tabBox.width))).toBeLessThanOrEqual(1);
  await expect(page.locator('.top-shelf')).not.toContainText('The Water Remembers');
  await expect(page.getByRole('region', { name: 'Story reading stage' })).toHaveCount(0);
});

test('Create Panel pins immediately before Widgets when the wide Panel rail overflows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDeveloperTools(page);
  for (const name of [
    'Archive Ledger and Canon Continuity',
    'Lore Compendium and World Reference',
    'Character Roster and Relationship Matrix',
    'Master Timeline and Session Chronology',
    'Session Notes and Narrative Threads',
    'Locations Factions and Political History',
    'Rules Systems and Campaign Procedures',
    'Mysteries Clues and Unresolved Questions'
  ]) {
    await page.getByRole('button', { name: 'Create Panel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
    await dialog.getByRole('textbox', { name: 'Panel name' }).fill(name);
    await dialog.getByRole('button', { name: 'Create Panel' }).click();
  }
  await closeDeveloperTools(page);

  const rail = page.getByRole('tablist', { name: 'Panels' });
  const addPanel = page.getByRole('button', { name: 'Create Panel' });
  const widgets = page.getByRole('button', { name: 'Open Widget Catalog' });
  const railSize = await rail.evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }));
  const geometry = await Promise.all([rail.boundingBox(), addPanel.boundingBox(), widgets.boundingBox()]);
  if (geometry.some((box) => !box)) throw new Error('Expected overflowing Panel chrome geometry.');
  const [railBox, addBox, widgetBox] = geometry as [NonNullable<typeof geometry[0]>, NonNullable<typeof geometry[1]>, NonNullable<typeof geometry[2]>];

  expect(railSize.scrollWidth).toBeGreaterThan(railSize.clientWidth);
  expect(Math.abs(addBox.x - (railBox.x + railBox.width))).toBeLessThanOrEqual(1);
  expect(Math.abs(widgetBox.x - (addBox.x + addBox.width))).toBeLessThanOrEqual(1);
  await expect(page.locator('.top-shelf')).not.toContainText('The Water Remembers');
  await expect(page.getByRole('region', { name: 'Story reading stage' })).toHaveCount(0);
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

test('held Widget dwells over a Panel tab and docks on the activated Panel', async ({ page }) => {
  const source = page.getByRole('article', { name: 'Characters (Story)' });
  const handleBox = await widgetDragSurface(source).boundingBox();
  const libraryTab = page.getByRole('tab', { name: 'Library' });
  const libraryTabBox = await libraryTab.boundingBox();
  if (!handleBox || !libraryTabBox) throw new Error('Expected cross-Panel drag geometry.');

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 18, handleBox.y + handleBox.height / 2 + 18, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();

  await page.mouse.move(
    libraryTabBox.x + libraryTabBox.width / 2,
    libraryTabBox.y + libraryTabBox.height / 2,
    { steps: 8 }
  );
  await expect.poll(() => libraryTab.evaluate((tab) => ({
    style: getComputedStyle(tab).outlineStyle,
    width: getComputedStyle(tab).outlineWidth
  }))).toEqual({ style: 'solid', width: '2px' });
  await page.waitForTimeout(200);
  await expect(libraryTab).toHaveAttribute('aria-selected', 'false');
  await page.waitForTimeout(200);

  await expect(libraryTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  const support = page.locator('[data-pomegranate-region-surface="support"]');
  const supportBox = await support.boundingBox();
  if (!supportBox) throw new Error('Expected activated Library dock geometry.');
  await page.mouse.move(supportBox.x + supportBox.width / 2, supportBox.y + supportBox.height - 8, { steps: 8 });
  const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="support"][data-drop-rail-kind="append"]');
  const railBox = await rail.boundingBox();
  if (!railBox) throw new Error('Expected a Library support dock rail.');
  await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2, { steps: 4 });
  await expect(rail).toHaveAttribute('data-active', 'true');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);

  const moved = page.locator('[data-widget-type="story.characters"]');
  await expect(moved).toHaveAttribute('data-pomegranate-region', 'support');
  await expect(moved.locator('xpath=ancestor::*[@data-pomegranate-panel][1]')).toHaveAttribute('data-pomegranate-panel', 'library');
  await page.getByRole('tab', { name: 'Scene' }).click();
  await expect(page.locator('[data-widget-type="story.characters"]')).toHaveCount(0);
});

test('held Widget can float on the free canvas of an activated Panel', async ({ page }) => {
  const source = page.getByRole('article', { name: 'Characters (Story)' });
  const handleBox = await widgetDragSurface(source).boundingBox();
  const sourceBox = await source.locator('xpath=ancestor::*[@data-widget-type][1]').boundingBox();
  const libraryTab = page.getByRole('tab', { name: 'Library' });
  const libraryTabBox = await libraryTab.boundingBox();
  if (!handleBox || !sourceBox || !libraryTabBox) throw new Error('Expected cross-Panel float geometry.');

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 18, handleBox.y + handleBox.height / 2 + 18, { steps: 3 });
  await page.mouse.move(libraryTabBox.x + libraryTabBox.width / 2, libraryTabBox.y + libraryTabBox.height / 2, { steps: 8 });
  await expect(libraryTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();

  const freePoint = await page.locator('[data-pomegranate-panel="library"]').evaluate((surface) => {
    const box = surface.getBoundingClientRect();
    const blockers = [...surface.querySelectorAll<HTMLElement>('[data-widget-type]'),
      ...document.querySelectorAll<HTMLElement>('[data-pom-part="widget.drop-rail"]')]
      .map((element) => element.getBoundingClientRect());
    for (let y = box.y + 24; y < box.bottom - 24; y += 24) {
      for (let x = box.x + 24; x < box.right - 24; x += 24) {
        if (blockers.every((blocker) => x < blocker.left || x > blocker.right || y < blocker.top || y > blocker.bottom)) {
          return { x, y };
        }
      }
    }
    throw new Error('Expected free Library canvas geometry.');
  });
  await page.mouse.move(freePoint.x, freePoint.y, { steps: 8 });
  const held = page.locator('[data-pom-part="widget.drag-preview"]');
  await expect(held).toHaveAttribute('data-float-ready', '');
  await page.mouse.up();
  await expect(held).toHaveCount(0);

  const moved = page.locator('[data-widget-type="story.characters"]');
  await expect(moved).toHaveAttribute('data-pomegranate-placement', 'floating');
  await expect(moved.locator('xpath=ancestor::*[@data-pomegranate-panel][1]')).toHaveAttribute('data-pomegranate-panel', 'library');
  const floatingSize = await moved.evaluate((node) => ({
    width: Number.parseFloat(node.style.width),
    height: Number.parseFloat(node.style.minHeight)
  }));
  expect(floatingSize.width).toBeCloseTo(Math.min(420, Math.max(320, sourceBox.width)), 1);
  expect(floatingSize.height).toBeCloseTo(Math.min(520, Math.max(240, sourceBox.height)), 1);
});

test('Escape after a drag-activated Panel restores the exact Widget origin', async ({ page }) => {
  const source = page.locator('[data-pomegranate-panel="scene"] [data-widget-type="story.characters"]');
  const handleBox = await widgetDragSurface(source).boundingBox();
  const libraryTab = page.getByRole('tab', { name: 'Library' });
  const libraryTabBox = await libraryTab.boundingBox();
  const sceneTab = page.getByRole('tab', { name: 'Scene' });
  const sceneTabBox = await sceneTab.boundingBox();
  if (!handleBox || !libraryTabBox || !sceneTabBox) throw new Error('Expected cross-Panel cancellation geometry.');
  await expect(source).toHaveAttribute('data-pomegranate-region', 'left');
  await expect(source).toHaveAttribute('data-pomegranate-shelf', 'primary');
  await expect(source).toHaveAttribute('data-pomegranate-order', '0');

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 18, handleBox.y + handleBox.height / 2 + 18, { steps: 3 });
  await page.mouse.move(libraryTabBox.x + libraryTabBox.width / 2, libraryTabBox.y + libraryTabBox.height / 2, { steps: 8 });
  await expect(libraryTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();

  await page.mouse.move(sceneTabBox.x + sceneTabBox.width / 2, sceneTabBox.y + sceneTabBox.height / 2, { steps: 8 });
  await expect(sceneTab).toHaveAttribute('aria-selected', 'true');
  await expect(source).toHaveAttribute('data-widget-drag-placeholder', 'true');

  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-pom-part="widget.drop-overlay"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/pom-widget-drag-active/);
  const restored = page.locator('[data-pomegranate-panel="scene"] [data-widget-type="story.characters"]');
  await expect(restored).toHaveAttribute('data-pomegranate-region', 'left');
  await expect(restored).toHaveAttribute('data-pomegranate-shelf', 'primary');
  await expect(restored).toHaveAttribute('data-pomegranate-order', '0');
});

test('a grouped Widget tears off and docks through a Panel tab', async ({ page }) => {
  const group = page.locator('[data-widget-group]').filter({ has: page.getByRole('tab', { name: 'Room Ambience' }) });
  const sourceTab = group.getByRole('tab', { name: 'Room Ambience' });
  const sourceBox = await sourceTab.boundingBox();
  const libraryTab = page.getByRole('tab', { name: 'Library' });
  const libraryBox = await libraryTab.boundingBox();
  if (!sourceBox || !libraryBox) throw new Error('Expected grouped cross-Panel drag geometry.');

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2 + 28, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await page.mouse.move(libraryBox.x + libraryBox.width / 2, libraryBox.y + libraryBox.height / 2, { steps: 8 });
  await expect(libraryTab).toHaveAttribute('aria-selected', 'true');

  const support = page.locator('[data-pomegranate-region-surface="support"]');
  const supportBox = await support.boundingBox();
  if (!supportBox) throw new Error('Expected Library support geometry.');
  await page.mouse.move(supportBox.x + supportBox.width / 2, supportBox.y + supportBox.height - 8, { steps: 8 });
  const rail = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="support"][data-drop-rail-kind="append"]');
  const railBox = await rail.boundingBox();
  if (!railBox) throw new Error('Expected grouped Widget destination rail.');
  await page.mouse.move(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2, { steps: 4 });
  await expect(rail).toHaveAttribute('data-active', 'true');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);

  const moved = page.locator('[data-pomegranate-panel="library"] [data-widget-type="story.room-ambience"]');
  await expect(moved).toHaveAttribute('data-pomegranate-region', 'support');
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

test('phone portrait touch exploration pans tabs and opens actions from the active trigger', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.goto(labOrigin);
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

    const initialTrigger = page.locator('[data-panel-tab-actions-trigger]');
    await expect(initialTrigger).toHaveCount(1);
    await expect(initialTrigger).toHaveAccessibleName('Open Notes Panel actions');
    await expect(initialTrigger).toBeVisible();
    const initialTriggerBox = await initialTrigger.boundingBox();
    expect(initialTriggerBox?.width).toBeGreaterThanOrEqual(44);
    expect(initialTriggerBox?.height).toBeGreaterThanOrEqual(44);

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
    await expect(settings).toHaveAttribute('aria-selected', 'true');
    await expect(menu).toHaveCount(0);

    const trigger = page.locator('[data-panel-tab-actions-trigger]');
    await expect(trigger).toHaveCount(1);
    await expect(trigger).toHaveAccessibleName('Open Settings Panel actions');
    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('data-context-source', 'pointer');
    await page.waitForTimeout(100);
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
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
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'Theme Materials');
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

test('Settings columns and Theme Canvas row resize by keyboard and pointer and persist', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();

  const firstBoundary = page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' });
  await expect(firstBoundary).toHaveAttribute('aria-valuenow', '50');
  const firstColumn = page.locator('[data-sub-panel-lane="0"]');
  const initialWidth = await firstColumn.evaluate((node) => node.getBoundingClientRect().width);
  await firstBoundary.press('ArrowRight');
  await expect(firstBoundary).toHaveAttribute('aria-valuenow', '55');
  await expect.poll(() => firstColumn.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(initialWidth + 20);

  const boundaryBox = await firstBoundary.boundingBox();
  if (!boundaryBox) throw new Error('Expected the Settings column separator to have geometry.');
  await page.mouse.move(boundaryBox.x + boundaryBox.width / 2, boundaryBox.y + boundaryBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(boundaryBox.x + boundaryBox.width / 2 + 35, boundaryBox.y + boundaryBox.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(firstBoundary).not.toHaveAttribute('aria-valuenow', '55');

  const canvas = page.locator('[data-widget-type="settings.theme-canvas"]');
  const row = page.getByRole('separator', { name: 'Resize Theme Canvas row' });
  await expect(row).toHaveAttribute('aria-valuemin', '220');
  await expect(row).toHaveAttribute('aria-valuemax', '420');
  await row.press('Home');
  await expect(canvas).toHaveAttribute('data-pomegranate-row-height', '220');
  await expect.poll(() => canvas.evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(220);

  const rowBox = await row.boundingBox();
  if (!rowBox) throw new Error('Expected the Theme Canvas row separator to have geometry.');
  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-pomegranate-row-height', '260');

  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' })).not.toHaveAttribute('aria-valuenow', '50');
  await expect(page.locator('[data-widget-type="settings.theme-canvas"]')).toHaveAttribute('data-pomegranate-row-height', '260');

  await page.getByRole('separator', { name: 'Resize Theme Canvas row' }).dblclick();
  await expect(page.locator('[data-widget-type="settings.theme-canvas"]')).not.toHaveAttribute('data-pomegranate-row-height');
  await page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' }).dblclick();
  await expect(page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' })).toHaveAttribute('aria-valuenow', '50');
});

test('all themes expose the same transparent row and column resize controls', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  await openDeveloperTools(page);
  const themes = page.getByRole('group', { name: 'Visual target' });
  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await themes.getByRole('button', { name: theme, exact: true }).click();
    await closeDeveloperTools(page);
    for (const [separator, cursor] of [
      [page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' }), 'col-resize'],
      [page.getByRole('separator', { name: 'Resize Theme Canvas row' }), 'row-resize']
    ] as const) {
      await expect(separator).toBeVisible();
      expect(await separator.evaluate((node) => ({
        cursor: getComputedStyle(node).cursor,
        background: getComputedStyle(node).backgroundColor
      }))).toEqual({ cursor, background: 'rgba(0, 0, 0, 0)' });
    }
    await openDeveloperTools(page);
  }
});

test('responsive Settings collapse hides desktop column separators without losing weights', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  const boundary = page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' });
  await boundary.press('ArrowRight');
  await expect(boundary).toHaveAttribute('aria-valuenow', '55');

  await page.setViewportSize({ width: 800, height: 720 });
  await expect(boundary).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(boundary).toBeVisible();
  await expect(boundary).toHaveAttribute('aria-valuenow', '55');
});

test('multi-shelf separators resize by pointer drag', async ({ page }) => {
  await dragToShelfRail(page, widgetDragSurface(page.getByRole('article', { name: 'World State' })), 'left', 'after');
  const shelf = page.getByRole('separator', { name: 'Resize primary shelf in left' });
  const before = Number(await shelf.getAttribute('aria-valuenow'));
  const box = await shelf.boundingBox();
  if (!box) throw new Error('Expected a shelf separator to have geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 35, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => Number(await shelf.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
});

test('Deep Current Widgets merge into an accessible persistent tab group and reorder', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Theme Materials' });
  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(customTheme), characters);

  const group = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Characters (Story)' }) });
  await expect(group.getByRole('tab')).toHaveText(['Characters (Story)', 'Theme Materials']);
  await expect(group.getByRole('tab', { name: 'Theme Materials' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('article', { name: 'Characters (Story)' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  await expect(page.getByRole('article', { name: 'Characters (Story)' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Theme Materials' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'Theme Materials' }).press('Control+Shift+ArrowLeft');
  await expect(group.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  const restored = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Characters (Story)' }) });
  await expect(restored.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
  await expect(restored.getByRole('tab', { name: 'Characters (Story)' })).toHaveAttribute('aria-selected', 'true');
});

test('dragging an inactive grouped Widget holds that Widget rather than the active tab', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Theme Materials' });
  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(customTheme), characters);

  const group = page.getByRole('group', { name: 'Widget group' });
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const inactiveTab = group.getByRole('tab', { name: 'Theme Materials' });
  const target = page.getByRole('article', { name: 'World State' });
  const tabBox = await inactiveTab.boundingBox();
  const targetBox = await target.boundingBox();
  if (!tabBox || !targetBox) throw new Error('Expected grouped drag geometry.');
  await page.mouse.move(tabBox.x + tabBox.width / 2, tabBox.y + tabBox.height / 2);
  await page.mouse.down();
  await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  await page.mouse.move(tabBox.x + tabBox.width + 100, tabBox.y + tabBox.height + 10, { steps: 3 });
  await expect(page.locator('[data-pom-part="tab.insertion"]')).toHaveCount(0);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });

  const held = page.locator('[data-pom-part="widget.drag-preview"]');
  await expect(held).toContainText('Theme Materials');
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
  await expect(widgetDragSurface(page.getByRole('article', { name: 'World State' }))).toBeFocused();
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
  const left = page.locator('.toolbar-edge-toggle-left');
  const right = page.locator('.toolbar-edge-toggle-right');

  await expect(left).toHaveText('CLOSE TOOLBAR LFT');
  await expect(right).toHaveText('CLOSE TOOLBAR RGT');

  await left.focus();
  await left.press('Enter');
  await expect(page.locator('main')).toHaveClass(/left-collapsed/);
  await expect(page.locator('[data-conformance-region="left"]')).toBeHidden();
  await expect(left).toBeVisible();
  await expect(left).toHaveAccessibleName('Open left toolbar');
  await expect(left).toHaveText('OPEN TOOLBAR LFT');
  await right.click();
  await expect(page.locator('main')).toHaveClass(/right-collapsed/);
  await expect(page.locator('[data-conformance-region="right"]')).toBeHidden();
  await expect(right).toBeVisible();
  await expect(right).toHaveAccessibleName('Open right toolbar');
  await expect(right).toHaveText('OPEN TOOLBAR RGT');
  await left.click();
  await right.click();
  await expect(page.locator('[data-conformance-region="left"]')).toBeVisible();
  await expect(page.locator('[data-conformance-region="right"]')).toBeVisible();
});

test('Story Stage side toolbars ease through intermediate widths and reverse without snapping', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const side of ['left', 'right'] as const) {
    const toggle = page.getByRole('button', { name: `Close ${side} toolbar` });
    const toolbar = page.locator(`[data-conformance-region="${side}"]`);
    const expandedWidth = await toolbar.evaluate((node) => node.getBoundingClientRect().width);
    expect(expandedWidth).toBeGreaterThan(200);

    const closing = await toggleAndSampleToolbar(toggle, side);
    const closingWidths = closing.map(({ width }) => width);
    const firstClosingFrame = closingWidths.findIndex((width) => width < expandedWidth - 1);
    expect(firstClosingFrame, JSON.stringify(closingWidths)).toBeGreaterThanOrEqual(0);
    expect(closing[0]!.stateChangedBeforeFirstFrame, JSON.stringify(closing)).toBe(true);
    expect(closingWidths.some((width) => width > 1 && width < expandedWidth - 1), JSON.stringify(closingWidths)).toBe(true);

    await expect(toolbar).toBeHidden();
    await expect.poll(() => toolbar.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThanOrEqual(1);

    const opening = await toggleAndSampleToolbar(
      page.getByRole('button', { name: `Open ${side} toolbar` }),
      side
    );
    const openingWidths = opening.map(({ width }) => width);
    const firstOpeningFrame = openingWidths.findIndex((width) => width > 1);
    expect(firstOpeningFrame, JSON.stringify(openingWidths)).toBeGreaterThanOrEqual(0);
    expect(opening[0]!.stateChangedBeforeFirstFrame, JSON.stringify(opening)).toBe(true);
    expect(openingWidths.some((width) => width > 1 && width < expandedWidth - 1), JSON.stringify(openingWidths)).toBe(true);

    await expect(toolbar).toBeVisible();
    await expect.poll(() => toolbar.evaluate((node) => node.getBoundingClientRect().width)).toBeCloseTo(expandedWidth, 0);

    const reversal = await page.getByRole('button', { name: `Close ${side} toolbar` })
      .evaluate(async (node: HTMLButtonElement, dockSide) => {
        const region = document.querySelector<HTMLElement>(`[data-conformance-region="${dockSide}"]`);
        if (!region) throw new Error(`Missing ${dockSide} toolbar.`);
        const root = node.closest('main[data-pom-theme-root]');
        if (!root) throw new Error('Missing theme root.');
        const collapsedClass = `${dockSide}-collapsed`;
        node.click();
        await Promise.resolve();
        const closingStateChangedBeforeFirstFrame = root.classList.contains(collapsedClass);
        const closing: number[] = [];
        for (let frame = 0; frame < 4; frame += 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          closing.push(region.getBoundingClientRect().width);
        }
        node.click();
        await Promise.resolve();
        const reopeningStateChangedBeforeFirstFrame = !root.classList.contains(collapsedClass);
        const reopening: number[] = [];
        for (let frame = 0; frame < 16; frame += 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          reopening.push(region.getBoundingClientRect().width);
        }
        return { closing, closingStateChangedBeforeFirstFrame, reopening, reopeningStateChangedBeforeFirstFrame };
      }, side);
    expect(reversal.closingStateChangedBeforeFirstFrame, JSON.stringify(reversal)).toBe(true);
    expect(reversal.closing.at(-1), JSON.stringify(reversal)).toBeGreaterThan(1);
    expect(reversal.closing.at(-1), JSON.stringify(reversal)).toBeLessThan(expandedWidth - 1);
    expect(reversal.reopeningStateChangedBeforeFirstFrame, JSON.stringify(reversal)).toBe(true);
    expect(reversal.reopening[0], JSON.stringify(reversal)).toBeGreaterThan(1);
    expect(reversal.reopening[0], JSON.stringify(reversal)).toBeLessThan(expandedWidth - 1);
    expect(Math.max(...reversal.reopening), JSON.stringify(reversal)).toBeGreaterThan(reversal.reopening[0]! + 1);
    await expect(toolbar).toBeVisible();
    await expect.poll(() => toolbar.evaluate((node) => node.getBoundingClientRect().width)).toBeCloseTo(expandedWidth, 0);
  }
});

test('compact Story Stage side toolbars ease off canvas without collapsing their width', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 720 });
  const main = page.locator('main');
  await expect(main).toHaveAttribute('data-pom-shell-presentation', 'instrumented');
  await expect(main).toHaveClass(/left-collapsed/);
  await expect(main).toHaveClass(/right-collapsed/);

  for (const side of ['left', 'right'] as const) {
    const direction = side === 'left' ? -1 : 1;
    const toolbar = page.locator(`[data-conformance-region="${side}"]`);
    await expect(toolbar).toBeHidden();
    const collapsedRect = await toolbar.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { x: rect.x, width: rect.width, display: style.display, position: style.position, visibility: style.visibility, styleWidth: style.width };
    });
    expect(collapsedRect.width, JSON.stringify(collapsedRect)).toBeGreaterThan(250);

    const opening = await toggleAndSampleToolbar(
      page.getByRole('button', { name: `Open ${side} toolbar` }),
      side
    );
    const firstOpeningFrame = opening.findIndex(({ x }) => direction * (x - collapsedRect.x) < -1);
    expect(firstOpeningFrame, JSON.stringify(opening)).toBeGreaterThanOrEqual(0);
    expect(opening[0]!.stateChangedBeforeFirstFrame, JSON.stringify(opening)).toBe(true);
    expect(opening.some(({ x }) => {
      const travel = direction * (x - collapsedRect.x);
      return travel < -1 && travel > -(collapsedRect.width - 1);
    }), JSON.stringify(opening)).toBe(true);
    expect(opening.every(({ width }) => Math.abs(width - collapsedRect.width) <= 1), JSON.stringify(opening)).toBe(true);
    await expect(toolbar).toBeVisible();
    const expandedX = await toolbar.evaluate((node) => node.getBoundingClientRect().x);
    const toggleInset = await page.getByRole('button', { name: `Close ${side} toolbar` })
      .evaluate((node: HTMLButtonElement, dockSide) => {
        const toggleRect = node.getBoundingClientRect();
        return dockSide === 'left'
          ? toggleRect.left
          : innerWidth - toggleRect.right;
      }, side);
    expect(toggleInset).toBeCloseTo(14, 0);

    const closing = await toggleAndSampleToolbar(
      page.getByRole('button', { name: `Close ${side} toolbar` }),
      side
    );
    const firstClosingFrame = closing.findIndex(({ x }) => direction * (x - expandedX) > 1);
    expect(firstClosingFrame, JSON.stringify(closing)).toBeGreaterThanOrEqual(0);
    expect(closing[0]!.stateChangedBeforeFirstFrame, JSON.stringify(closing)).toBe(true);
    expect(closing.some(({ x }) => {
      const travel = direction * (x - expandedX);
      return travel > 1 && travel < collapsedRect.width - 1;
    }), JSON.stringify(closing)).toBe(true);
    expect(closing.every(({ width }) => Math.abs(width - collapsedRect.width) <= 1), JSON.stringify(closing)).toBe(true);
    await expect(toolbar).toBeHidden();
    await expect.poll(() => toolbar.evaluate((node) => node.getBoundingClientRect().x)).toBeCloseTo(collapsedRect.x, 0);
  }
});

test('closing the desktop left toolbar keeps the open right toolbar flush beneath the top shelf', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const main = page.locator('main[data-pom-theme-root]');
  const shelf = page.locator('.top-shelf');
  const leftToolbar = page.locator('[data-conformance-region="left"]');
  const rightToolbar = page.locator('[data-conformance-region="right"]');
  await expect(main).toHaveAttribute('data-pom-shell-presentation', 'instrumented');
  await expect(leftToolbar).toBeVisible();
  await expect(rightToolbar).toBeVisible();

  const shelfGap = async () => {
    const [shelfBox, rightBox] = await Promise.all([shelf.boundingBox(), rightToolbar.boundingBox()]);
    if (!shelfBox || !rightBox) return Number.POSITIVE_INFINITY;
    return rightBox.y - (shelfBox.y + shelfBox.height);
  };

  await expect.poll(shelfGap).toBeLessThan(1);
  const expandedRightBox = await rightToolbar.boundingBox();
  if (!expandedRightBox) throw new Error('Expected open right-toolbar geometry.');

  await page.getByRole('button', { name: 'Close left toolbar' }).click();
  await expect(main).toHaveClass(/left-collapsed/);
  await expect(leftToolbar).toBeHidden();
  await expect(rightToolbar).toBeVisible();
  await expect.poll(shelfGap).toBeLessThan(1);

  const collapsedLeftRightBox = await rightToolbar.boundingBox();
  if (!collapsedLeftRightBox) throw new Error('Expected right-toolbar geometry after closing the left toolbar.');
  expect(collapsedLeftRightBox.y).toBeCloseTo(expandedRightBox.y, 0);
  expect(collapsedLeftRightBox.height).toBeCloseTo(expandedRightBox.height, 0);
});

test('reduced motion makes Story Stage toolbar state changes immediate and transition-free', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);

  const surface = page.locator('.workbench-surface');
  const leftToolbar = page.locator('[data-conformance-region="left"]');
  const leftToggle = page.getByRole('button', { name: 'Close left toolbar' });
  for (const target of [surface, leftToolbar, leftToggle]) {
    await expect.poll(() => target.evaluate((node) => {
      const style = getComputedStyle(node);
      return { duration: style.transitionDuration, property: style.transitionProperty };
    })).toEqual({ duration: '0s', property: 'none' });
  }

  await leftToggle.evaluate((node: HTMLButtonElement) => node.click());
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await expect(leftToolbar).toBeHidden();
  expect(await leftToolbar.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
});

test('Theme Library bottom-edge chevrons reuse edge tabs outside each toolbar and flip with collapsed state', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  await page.getByRole('article', { name: 'Theme Library' }).getByRole('button', { name: /^PomOS/ }).click();
  await expect(page.locator('main')).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'bottom-chevrons');
  await page.getByRole('tab', { name: 'Scene' }).click();

  const left = page.locator('.toolbar-edge-toggle-left');
  const right = page.locator('.toolbar-edge-toggle-right');
  const leftRegion = page.locator('[data-conformance-region="left"]');
  const rightRegion = page.locator('[data-conformance-region="right"]');
  await expect.poll(async () => {
    const [leftToggleBox, rightToggleBox, leftDockBox, rightDockBox] = await Promise.all([
      left.boundingBox(), right.boundingBox(), leftRegion.boundingBox(), rightRegion.boundingBox()
    ]);
    if (!leftToggleBox || !rightToggleBox || !leftDockBox || !rightDockBox) return Number.POSITIVE_INFINITY;
    return Math.max(
      Math.abs(leftToggleBox.x - (leftDockBox.x + leftDockBox.width)),
      Math.abs(rightToggleBox.x + rightToggleBox.width - rightDockBox.x)
    );
  }).toBeLessThan(2);
  const viewport = page.viewportSize();
  const [leftBox, rightBox, leftRegionBox, rightRegionBox] = await Promise.all([
    left.boundingBox(), right.boundingBox(), leftRegion.boundingBox(), rightRegion.boundingBox()
  ]);
  if (!viewport || !leftBox || !rightBox || !leftRegionBox || !rightRegionBox) throw new Error('Expected toolbar toggle, dock, and viewport geometry.');

  expect(leftBox.width).toBe(30);
  expect(leftBox.height).toBe(116);
  expect(rightBox.width).toBe(30);
  expect(rightBox.height).toBe(116);
  expect(Math.abs(leftBox.x - (leftRegionBox.x + leftRegionBox.width))).toBeLessThan(2);
  expect(Math.abs(leftBox.y + leftBox.height - viewport.height)).toBeLessThan(2);
  expect(Math.abs(rightBox.x + rightBox.width - rightRegionBox.x)).toBeLessThan(2);
  expect(Math.abs(rightBox.y + rightBox.height - viewport.height)).toBeLessThan(2);
  await expect(left).toHaveText('‹');
  await expect(right).toHaveText('›');

  await left.click();
  await right.click();
  await expect(left).toHaveAccessibleName('Open left toolbar');
  await expect(right).toHaveAccessibleName('Open right toolbar');
  await expect(left).toHaveText('›');
  await expect(right).toHaveText('‹');
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  const [collapsedLeftBox, collapsedRightBox] = await Promise.all([left.boundingBox(), right.boundingBox()]);
  if (!collapsedLeftBox || !collapsedRightBox) throw new Error('Expected collapsed toolbar toggle geometry.');
  expect(Math.abs(collapsedLeftBox.x)).toBeLessThan(2);
  expect(Math.abs(collapsedLeftBox.y + collapsedLeftBox.height - viewport.height)).toBeLessThan(2);
  expect(Math.abs(collapsedRightBox.x + collapsedRightBox.width - viewport.width)).toBeLessThan(2);
  expect(Math.abs(collapsedRightBox.y + collapsedRightBox.height - viewport.height)).toBeLessThan(2);
});

test('desktop Widget headers replace the ellipsis with context and keyboard actions', async ({ page }) => {
  const worldState = page.getByRole('article', { name: 'World State' });
  const header = widgetDragSurface(worldState);
  const trigger = header.getByRole('button', { name: 'Widget actions' });

  await expect(trigger).toBeHidden();
  await expect(header).toHaveAttribute('tabindex', '0');
  await expect(header).toHaveAttribute('aria-keyshortcuts', 'Shift+F10');

  await header.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'World State Widget actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Dock left',
    'Dock main',
    'Float',
    'Group with previous Widget',
    'Focus Widget',
    'Move to Widget Shelf'
  ]);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(header).toBeFocused();

  await header.press('Shift+F10');
  await expect(menu).toBeVisible();
  const items = menu.getByRole('menuitem');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(items.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(items.last()).toBeFocused();
});

test('narrow fine-pointer Widgets keep context menus and no touch ellipsis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${labOrigin}/?surface=settings.theme-materials`);
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() => matchMedia('(pointer: fine)').matches)).toBe(true);

  const header = widgetDragSurface(page.getByRole('article', { name: 'Theme Materials' }));
  await expect(header.getByRole('button', { name: 'Widget actions' })).toBeHidden();
  await header.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Theme Materials Widget actions' });
  const box = await menu.boundingBox();
  if (!box) throw new Error('Expected a narrow fine-pointer Widget menu.');
  expect(box.width).toBeLessThan(390);
  expect(box.x).toBeGreaterThan(0);
});

test('outside Widget menu activation keeps focus on the activated control', async ({ page }) => {
  const header = widgetDragSurface(page.getByRole('article', { name: 'World State' }));
  await header.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'World State Widget actions' });
  await expect(menu).toBeVisible();

  const library = page.getByRole('tab', { name: 'Library' });
  await library.click();
  await expect(menu).toBeHidden();
  await expect(library).toHaveAttribute('aria-selected', 'true');
  await expect(library).toBeFocused();
});

test('Widget placement actions restore focus to the moved Widget header', async ({ page }) => {
  const worldState = page.getByRole('article', { name: 'World State' });
  await widgetDragSurface(worldState).click({ button: 'right' });
  await page.getByRole('menu', { name: 'World State Widget actions' })
    .getByRole('menuitem', { name: 'Dock left' })
    .click();

  await expect(widgetDragSurface(page.getByRole('article', { name: 'World State' }))).toBeFocused();
});

test('desktop grouped Widget tabs open actions for an inactive Widget without activating it', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Widget group' }).filter({
    has: page.getByRole('tab', { name: 'Promise Ledger' })
  });
  const active = group.getByRole('tab', { name: 'Room Ambience' });
  const inactive = group.getByRole('tab', { name: 'Promise Ledger' });

  await expect(active).toHaveAttribute('aria-selected', 'true');
  await expect(inactive).toHaveAttribute('aria-selected', 'false');
  await inactive.click({ button: 'right' });

  const menu = page.getByRole('menu', { name: 'Promise Ledger Widget actions' });
  await expect(menu).toBeVisible();
  await expect(active).toHaveAttribute('aria-selected', 'true');
  await expect(inactive).toHaveAttribute('aria-selected', 'false');

  await page.keyboard.press('Escape');
  await expect(inactive).toBeFocused();
  await inactive.press('Shift+F10');
  await expect(menu).toBeVisible();
});

test.describe('coarse-pointer Widget actions', () => {
  test.use({ hasTouch: true, viewport: { width: 1440, height: 900 } });

  test('standalone trigger is a stable 44px header cell that opens a bottom sheet', async ({ page }) => {
    const article = page.getByRole('article', { name: 'Theme Materials' });
    const header = widgetDragSurface(article);
    const trigger = header.getByRole('button', { name: 'Widget actions' });
    const geometry = () => header.evaluate((element) => {
      const action = element.querySelector<HTMLElement>('.widget-actions-trigger');
      if (!action) throw new Error('Expected standalone Widget action trigger.');
      const headerBox = element.getBoundingClientRect();
      const triggerBox = action.getBoundingClientRect();
      return {
        header: { x: headerBox.x, y: headerBox.y, width: headerBox.width, height: headerBox.height },
        trigger: { x: triggerBox.x, y: triggerBox.y, width: triggerBox.width, height: triggerBox.height }
      };
    });
    const before = await geometry();

    expect(before.trigger.width).toBeGreaterThanOrEqual(44);
    expect(before.trigger.height).toBeGreaterThanOrEqual(44);
    expect(before.trigger.x).toBeGreaterThanOrEqual(before.header.x - 1);
    expect(before.trigger.x + before.trigger.width).toBeLessThanOrEqual(before.header.x + before.header.width + 1);
    expect(before.trigger.y).toBeGreaterThanOrEqual(before.header.y - 1);
    expect(before.trigger.y + before.trigger.height).toBeLessThanOrEqual(before.header.y + before.header.height + 1);

    await trigger.click();
    const after = await geometry();
    expect(after.trigger.width).toBe(before.trigger.width);
    expect(after.trigger.height).toBe(before.trigger.height);
    expect(after.trigger.x - after.header.x).toBeCloseTo(before.trigger.x - before.header.x, 5);
    expect(after.trigger.y - after.header.y).toBeCloseTo(before.trigger.y - before.header.y, 5);

    const menu = page.getByRole('menu', { name: 'Theme Materials Widget actions' });
    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error('Expected standalone Widget action sheet geometry.');
    expect(Math.abs(menuBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuBox.width - 1440)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuBox.y + menuBox.height - 900)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('grouped trigger reserves the tab-row corner and follows the active Widget', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Widget group' }).filter({
      has: page.getByRole('tab', { name: 'Promise Ledger' })
    });
    const groupHeader = group.locator('[data-widget-group-header]');
    const trigger = groupHeader.getByRole('button', { name: 'Widget actions' });
    const headerBox = await groupHeader.boundingBox();
    const before = await trigger.boundingBox();
    if (!headerBox || !before) throw new Error('Expected grouped Widget action geometry.');

    expect(before.width).toBeGreaterThanOrEqual(44);
    expect(before.height).toBeGreaterThanOrEqual(44);
    expect(before.x + before.width).toBeLessThanOrEqual(headerBox.x + headerBox.width + 1);
    expect(before.y + before.height).toBeLessThanOrEqual(headerBox.y + headerBox.height + 1);

    const containment = await group.evaluate((element) => {
      const header = element.querySelector<HTMLElement>('[data-widget-group-header]');
      const content = element.querySelector<HTMLElement>(':scope > [data-widget-type]');
      if (!header || !content) throw new Error('Expected grouped Widget content geometry.');
      const groupBox = element.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();
      const contentBox = content.getBoundingClientRect();
      return {
        groupBottom: groupBox.bottom,
        groupHeight: groupBox.height,
        headerHeight: headerBox.height,
        contentHeight: contentBox.height,
        contentBottom: contentBox.bottom
      };
    });
    expect(containment.contentBottom).toBeLessThanOrEqual(containment.groupBottom + 1);
    expect(containment.contentHeight).toBeCloseTo(containment.groupHeight - containment.headerHeight, 0);

    await trigger.click();
    expect(await trigger.boundingBox()).toEqual(before);
    await expect(page.getByRole('menu', { name: 'Room Ambience Widget actions' })).toBeVisible();

    await page.keyboard.press('Escape');
    await group.getByRole('tab', { name: 'Promise Ledger' }).click();
    await trigger.click();
    await expect(page.getByRole('menu', { name: 'Promise Ledger Widget actions' })).toBeVisible();
  });
});

test('Deep Current held Widget exposes one compact identity, rails, and tab preview', async ({ page }) => {
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
  await expect(held).toHaveAttribute('data-widget-drag-type', 'story.characters');
  await expect(held.locator('article')).toHaveCount(0);
  await expect(held.locator('button, input, select, textarea, a[href]')).toHaveCount(0);
  await expect(page.locator('[data-pom-part="widget.drop-overlay"]')).toHaveText('');
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
  await page.getByRole('button', { name: 'Close left toolbar' }).click();
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

test('grouped Widget tabs reorder when released inside the tab corridor', async ({ page }) => {
  const customTheme = page.getByRole('article', { name: 'Theme Materials' });
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
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
  await page.mouse.up();
  await expect(group.getByRole('tab')).toHaveText(['Theme Materials', 'Characters (Story)']);
  await group.getByRole('tab', { name: 'Theme Materials' }).click();
  const renderedTheme = page.getByRole('article', { name: 'Theme Materials' }).locator('xpath=ancestor::*[@data-widget-type][1]');
  await expect(renderedTheme).toHaveAttribute('data-pomegranate-placement', 'docked');
  await group.getByRole('tab', { name: 'Characters (Story)' }).click();
  const renderedCharacters = page.getByRole('article', { name: 'Characters (Story)' }).locator('xpath=ancestor::*[@data-widget-type][1]');
  await expect(renderedCharacters).toHaveAttribute('data-pomegranate-placement', 'docked');
});

test('all themes preserve the same compact held-identity docking composition', async ({ page }, testInfo) => {
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
    await expect(held).toHaveAttribute('data-widget-drag-type', 'story.characters');
    await expect(held).toContainText('Characters');
    await expect(held.locator('article, button, input, select, textarea, a[href]')).toHaveCount(0);
    await expect(page.locator('[data-pom-part="widget.drop-overlay"]')).toHaveText('');
    const [heldBox, snapBox, railCount, colors, viewport] = await Promise.all([
      held.boundingBox(),
      page.locator('[data-pom-part="widget.snap-preview"]').boundingBox(),
      page.locator('[data-pom-part="widget.drop-rail"]').count(),
      held.evaluate((node) => ({ border: getComputedStyle(node).borderColor, background: getComputedStyle(node).backgroundColor })),
      page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }))
    ]);
    expect(heldBox?.width).toBeGreaterThanOrEqual(180);
    expect(heldBox?.width).toBeLessThanOrEqual(280);
    expect(heldBox?.height).toBeCloseTo(42, 1);
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
    await page.goto(labOrigin);
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
    await page.goto(labOrigin);
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
    const departureY = handleBox.y + handleBox.height + 10;
    await handleElement.dispatchEvent('pointerdown', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y });
    await page.waitForTimeout(190);
    await handleElement.dispatchEvent('pointermove', { pointerId: 18, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: departureY });
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
    await page.goto(labOrigin);
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
  const libraryColumns = page.getByRole('separator', { name: 'Resize Focus and Support columns' });
  await libraryColumns.focus();
  await libraryColumns.press('Home');
  const character = page.getByRole('article', { name: 'Character Card' });
  await dragToWidgetTab(
    page,
    widgetDragSurface(page.getByRole('article', { name: 'Lore Entry Tree' })),
    character
  );

  await page.getByRole('tab', { name: 'Settings' }).click();
  const settingsColumns = page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' });
  await settingsColumns.focus();
  await settingsColumns.press('ArrowLeft');
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();

  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('separator', { name: 'Resize Column 1 and Column 2 columns' })).toHaveAttribute('aria-valuenow', '45');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('separator', { name: 'Resize Focus and Support columns' })).toHaveAttribute('aria-valuenow', '10');
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
    await page.goto(labOrigin);
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

test('all 98 reviewed Widget surfaces expose exact ready, state, focus, and responsive contracts', async ({ page }) => {
  test.setTimeout(180_000);
  const themeAuthoringElements = new Map<string, string>([
    ['settings.custom-theme', 'overview'],
    ['settings.theme-colors', 'colors'],
    ['settings.theme-materials', 'materials'],
    ['settings.theme-canvas', 'canvas'],
    ['settings.theme-ambient', 'ambient']
  ]);
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
    await page.goto(`${labOrigin}/?surface=${encodeURIComponent(surface.type)}`);
    await page.evaluate(() => document.fonts.ready);
    const article = page.locator(`[data-widget-type="${surface.type}"] > article`);
    await expect(article).toHaveCount(1);
    const expectedPresentationTitle = presentationTitleOverrides.get(surface.type) ?? surface.title;
    await expect(article).toHaveAttribute('aria-label', expectedPresentationTitle);
    const implemented = article.locator(`[data-surface-type="${surface.type}"]`);
    await expect(implemented).toHaveAttribute('data-surface-state', 'ready');
    const themeAuthoringElement = themeAuthoringElements.get(surface.type);
    if (themeAuthoringElement) {
      await expect(implemented.locator(`[data-theme-authoring-element="${themeAuthoringElement}"]`)).toHaveCount(1);
      if (surface.type === 'settings.custom-theme') {
        await expect(implemented.locator('.theme-authoring-actions button')).toHaveText(fixture.actions);
      }
    } else {
      await expect(implemented.locator('.surface-scope')).toHaveText(fixture.scope);
      await expect(implemented.locator('.surface-contract-facts dt')).toHaveText(fixture.rows.map(([label]) => label));
      await expect(implemented.locator('.surface-actions button, .widget-content.composer > button')).toHaveText(fixture.actions);
    }

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
    const initialOverflow = containment.horizontalOverflow > 1
      ? await horizontalOverflowEvidence(article)
      : null;
    expect(
      containment.horizontalOverflow,
      `${surface.type} horizontal overflow: ${initialOverflow?.descendants.join('; ') ?? 'none'}`
    ).toBeLessThanOrEqual(1);
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
    await expect(widgetDragSurface(article)).toBeFocused();
  }
});

test('Catalog renders the source composition, 98 shared previews, and exact expanded geometry', async ({ page }) => {
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
  await expect(catalog.locator('.catalog-foot')).toHaveText(['98 widgetsStrictly active story']);
  await expect(results).toHaveCount(98);
  await expect(results.locator('[data-catalog-result-content]')).toHaveCount(98);
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(98);
  await expect(catalog.locator('.catalog-widget-preview [data-surface-type]')).toHaveCount(98);
  await expect(catalog.locator('[data-renderer-status="unavailable"]')).toHaveCount(0);
  await expect(catalog.getByRole('button', { name: /^Add / })).toHaveCount(0);
  expect(await results.evaluateAll((nodes) => nodes.every((node) => node.getAttribute('role') === 'button' && node.getAttribute('tabindex') === '0'))).toBe(true);
  expect(CATALOG_AUTHORITY_MATRIX).toHaveLength(98);
  expect(Object.isFrozen(CATALOG_AUTHORITY_MATRIX)).toBe(true);
  expect(CATALOG_AUTHORITY_MATRIX.every((entry) => Object.isFrozen(entry))).toBe(true);
  expect(new Set(CATALOG_AUTHORITY_MATRIX.map(([widgetType]) => widgetType)).size).toBe(98);
  expect(new Set(CATALOG_AUTHORITY_MATRIX.map(([, surfaceType]) => surfaceType)).size).toBe(98);
  expect(CATALOG_AUTHORITY_MATRIX.map(([, , title]) => title)).toEqual(
    [...CATALOG_AUTHORITY_MATRIX].map(([, , title]) => title).sort((left, right) => left.localeCompare(right))
  );
  expect(createHash('sha256').update(JSON.stringify(CATALOG_AUTHORITY_MATRIX)).digest('hex')).toBe(
    CATALOG_AUTHORITY_SHA256
  );
  const renderedMatrix = await results.evaluateAll((nodes) => nodes.map((node) => [
    node.getAttribute('data-widget-type'),
    node.querySelector('[data-surface-type]')?.getAttribute('data-surface-type') ?? null,
    node.getAttribute('data-preview-shape')
  ]));
  expect(new Set(renderedMatrix.map(([widgetType]) => widgetType)).size).toBe(98);
  expect(renderedMatrix).toEqual(
    CATALOG_AUTHORITY_MATRIX.map(([widgetType, surfaceType, , , , shape]) => [widgetType, surfaceType, shape])
  );

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

  for (const [category, total] of [['Story', 12], ['Library', 19], ['Systems', 21], ['Settings', 43], ['Extensions', 3]] as const) {
    await catalog.getByRole('button', { name: category, exact: true }).click();
    await expect(results, `${category} Catalog total`).toHaveCount(total);
  }
  await catalog.getByRole('button', { name: 'All', exact: true }).click();
  const search = catalog.getByRole('searchbox', { name: 'Search Widgets' });
  await search.fill('character relationships');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText('Character Relationships');
  await search.fill('');

  const widthAnchorSeed = catalog.locator('[data-catalog-result][data-widget-type="systems.living-world"]');
  await widthAnchorSeed.scrollIntoViewIfNeeded();
  await catalog.locator('.catalog-results').evaluate((region) => {
    const anchor = region.querySelector<HTMLElement>('[data-widget-type="systems.living-world"]');
    if (!anchor) throw new Error('Missing width-restack anchor.');
    region.scrollTop += anchor.getBoundingClientRect().top - region.getBoundingClientRect().top - 32;
  });
  const anchor = await catalog.locator('.catalog-results').evaluate((region) => {
    const regionBox = region.getBoundingClientRect();
    const candidates = [...region.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')];
    const visible = candidates.find((result) => {
      const box = result.getBoundingClientRect();
      return box.top >= regionBox.top && box.top < regionBox.bottom;
    }) ?? candidates.find((result) => {
      const box = result.getBoundingClientRect();
      return box.bottom > regionBox.top && box.top < regionBox.bottom;
    });
    return visible ? {
      widgetType: visible.dataset.widgetType ?? '',
      category: visible.dataset.widgetCategory ?? '',
      offset: visible.getBoundingClientRect().top - regionBox.top
    } : null;
  });
  if (!anchor) throw new Error('Missing first visible Catalog anchor.');
  expect(anchor.widgetType).not.toBe('');
  const anchored = catalog.locator(`[data-catalog-result][data-widget-type="${anchor.widgetType}"]`);
  await previewSize.fill('420');
  await expect(previewSize).toHaveValue('420');
  await expect.poll(() => anchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(anchor.offset, 0);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(anchored).toBeVisible();
  expect(await anchored.evaluate((node) => node.dataset.widgetType)).toBe(anchor.widgetType);
  await previewSize.fill('286');
  await expect(previewSize).toHaveValue('286');
  await expect.poll(() => anchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(anchor.offset, 0);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await anchored.evaluate((node) => node.dataset.widgetType)).toBe(anchor.widgetType);

  await catalog.getByRole('button', { name: 'Compact', exact: true }).click();
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(0);
  await expect(catalog.getByRole('slider', { name: 'Preview size' })).toHaveCount(0);
  await expect(results).toHaveCount(98);
  const compactWidths = await results.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().width)));
  expect(new Set(compactWidths).size).toBe(1);
  expect(compactWidths[0]).toBeGreaterThan(1400);
  const oversizedCompactRows = await results.evaluateAll((nodes) => nodes.flatMap((node) => {
    const height = Math.round(node.getBoundingClientRect().height);
    return height <= 44 ? [] : [{
      widgetType: node.getAttribute('data-widget-type'),
      shape: node.getAttribute('data-preview-shape'),
      height
    }];
  }));
  expect(oversizedCompactRows).toEqual([]);
  await expect.poll(() => anchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(anchor.offset, 0);
  const filterSeed = catalog.locator('[data-catalog-result][data-widget-type="settings.narrator-voice"]');
  await filterSeed.scrollIntoViewIfNeeded();
  await catalog.locator('.catalog-results').evaluate((region) => {
    const target = region.querySelector<HTMLElement>('[data-widget-type="settings.narrator-voice"]');
    if (!target) throw new Error('Missing compact filter anchor.');
    region.scrollTop += target.getBoundingClientRect().top - region.getBoundingClientRect().top - 32;
  });
  const filterAnchor = await catalog.locator('.catalog-results').evaluate((region) => {
    const regionBox = region.getBoundingClientRect();
    const visible = [...region.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')]
      .find((result) => {
        const box = result.getBoundingClientRect();
        return box.top >= regionBox.top && box.top < regionBox.bottom;
      });
    return visible ? {
      widgetType: visible.dataset.widgetType ?? '',
      category: visible.dataset.widgetCategory ?? '',
      offset: visible.getBoundingClientRect().top - regionBox.top
    } : null;
  });
  if (!filterAnchor) throw new Error('Missing compact filter anchor evidence.');
  expect(filterAnchor.category).toBe('settings');
  const filterAnchored = catalog.locator(`[data-catalog-result][data-widget-type="${filterAnchor.widgetType}"]`);
  await catalog.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(results).toHaveCount(43);
  await expect.poll(() => filterAnchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(filterAnchor.offset, 0);
  await catalog.getByRole('button', { name: 'All', exact: true }).click();
  await expect(results).toHaveCount(98);
  await expect.poll(() => filterAnchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(filterAnchor.offset, 0);
  await catalog.getByRole('button', { name: 'Visual', exact: true }).click();
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(98);
  await expect.poll(() => filterAnchored.evaluate((node) => {
    const region = node.closest<HTMLElement>('.catalog-results')!;
    return node.getBoundingClientRect().top - region.getBoundingClientRect().top;
  })).toBeCloseTo(filterAnchor.offset, 0);
});

test('Catalog whole-result automatic and pointer placement each dispatch exactly one canonical Widget', async ({ page }) => {
  const workbench = page.locator('main[data-workbench-revision]');
  const initialRevision = Number(await workbench.getAttribute('data-workbench-revision'));
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const automatic = catalog.locator('[data-catalog-result][data-widget-type="settings.accessibility"]');
  await automatic.focus();
  await automatic.press('Enter');
  await expect(page.locator('[data-widget-type="settings.accessibility"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(automatic).toHaveAttribute('aria-disabled', 'true');
  await expect(workbench).toHaveAttribute('data-workbench-revision', String(initialRevision + 1));

  const pointerResult = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await expect(pointerResult).toHaveAttribute('aria-disabled', 'false');
  await pointerResult.evaluate((node) => {
    (window as typeof window & { __catalogFollowupClicks?: number }).__catalogFollowupClicks = 0;
    node.addEventListener('click', () => {
      const state = window as typeof window & { __catalogFollowupClicks?: number };
      state.__catalogFollowupClicks = (state.__catalogFollowupClicks ?? 0) + 1;
    });
  });
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
  const targets = page.locator('[data-pom-part="widget.drop-rail"]');
  await expect(targets).not.toHaveCount(0);
  const leftTarget = page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"][data-drop-rail-kind="append"]');
  await expect(leftTarget).toBeVisible();
  const targetBox = await leftTarget.boundingBox();
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
  expect(proxyEvidence.target).toBe(`${JSON.stringify(['rail', 'scene', null, 0, 'left', 'append'])}:append`);
  const selectedTarget = page.locator('[data-pom-part="widget.drop-rail"][data-active="true"]');
  await expect(selectedTarget).toHaveCount(1);
  await expect(selectedTarget).toHaveAttribute('data-drop-region', 'left');
  const selectedBox = await selectedTarget.boundingBox();
  if (!selectedBox) throw new Error('Missing selected Catalog placement target geometry.');
  expect(proxyEvidence.x).toBeGreaterThanOrEqual(selectedBox.x);
  expect(proxyEvidence.x).toBeLessThanOrEqual(selectedBox.x + selectedBox.width);
  expect(proxyEvidence.y).toBeGreaterThanOrEqual(selectedBox.y);
  expect(proxyEvidence.y).toBeLessThanOrEqual(selectedBox.y + selectedBox.height);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __catalogFollowupClicks?: number }).__catalogFollowupClicks ?? 0)).toBe(1);
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(1);
  await expect(workbench).toHaveAttribute('data-workbench-revision', String(initialRevision + 2));
  await expect(proxy).toHaveCount(0);
  await expect(pointerResult).toHaveAttribute('aria-disabled', 'false');

  await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pomegranate-ui.workbench-lab.layout.v1') ?? 'null') as {
    revision: number;
    widgets: Record<string, { type: string }>;
    placements: Record<string, {
      kind: 'docked'; panelId: string; subPanelId?: string; lane?: number;
      regionId: string; shelfId: string; order: number;
    }>;
  } | null);
  expect(saved).not.toBeNull();
  expect(saved?.revision).toBe(initialRevision + 2);
  const persistedLibraryIds = Object.entries(saved?.widgets ?? {})
    .filter(([id, instance]) => id.startsWith('catalog-library-workspace-') && instance.type === 'library.workspace')
    .map(([id]) => id);
  expect(persistedLibraryIds).toHaveLength(1);
  const firstLibraryId = persistedLibraryIds[0] ?? '';
  const firstLibraryShelfId = `left-shelf-${initialRevision + 2}`;
  const firstLibraryPlacement = {
    kind: 'docked', panelId: 'scene', regionId: 'left', shelfId: firstLibraryShelfId, order: 0
  } as const;
  expect(saved?.placements[firstLibraryId]).toEqual(firstLibraryPlacement);

  await page.getByRole('button', { name: 'Reload saved layout' }).click();
  await expect(workbench).toHaveAttribute('data-workbench-revision', String(initialRevision + 3));
  await expect(page.locator(`[data-pomegranate-placement][data-widget-type="library.workspace"][data-pomegranate-region="left"][data-pomegranate-shelf="${firstLibraryShelfId}"]`)).toHaveCount(1);
  await page.getByRole('button', { name: 'Save layout' }).click();
  const hydrated = await page.evaluate(() => JSON.parse(localStorage.getItem('pomegranate-ui.workbench-lab.layout.v1') ?? 'null') as {
    revision: number;
    widgets: Record<string, { type: string }>;
    placements: Record<string, {
      kind: 'docked'; panelId: string; subPanelId?: string; lane?: number;
      regionId: string; shelfId: string; order: number;
    }>;
  } | null);
  expect(hydrated?.revision).toBe(initialRevision + 3);
  expect(hydrated?.widgets[firstLibraryId]).toEqual({
    id: firstLibraryId,
    type: 'library.workspace',
    manifestVersion: '1.0.0',
    configuration: {}
  });
  expect(hydrated?.placements[firstLibraryId]).toEqual(firstLibraryPlacement);
  const hydratedRevision = Number(await workbench.getAttribute('data-workbench-revision'));
  expect(hydratedRevision).toBe(initialRevision + 3);
  await closeDeveloperTools(page);
  await openWidgetCatalog(page);
  const restoredCatalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const restoredMultiple = restoredCatalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await expect(restoredMultiple).toHaveAttribute('aria-disabled', 'false');
  await restoredMultiple.press('Enter');
  await expect(workbench).toHaveAttribute('data-workbench-revision', String(hydratedRevision + 1));
  await expect(restoredMultiple).toHaveAttribute('aria-disabled', 'false');
  await restoredCatalog.getByRole('button', { name: 'Close Widget Catalog' }).click();
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  const twiceSaved = await page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem('pomegranate-ui.workbench-lab.layout.v1') ?? 'null') as {
      widgets: Record<string, { id: string; type: string; manifestVersion: string; configuration: Record<string, unknown> }>;
      placements: Record<string, {
        kind: 'docked'; panelId: string; subPanelId?: string; lane?: number;
        regionId: string; shelfId: string; order: number;
      }>;
    } | null;
    const ids = Object.entries(snapshot?.widgets ?? {})
      .filter(([id, instance]) => id.startsWith('catalog-library-workspace-') && instance.type === 'library.workspace')
      .map(([id]) => id)
      .sort();
    return { ids, pairs: ids.map((id) => ({ widget: snapshot!.widgets[id], placement: snapshot!.placements[id] })) };
  });
  expect(twiceSaved.ids).toHaveLength(2);
  expect(new Set(twiceSaved.ids).size).toBe(2);
  expect(twiceSaved.pairs).toEqual([
    {
      widget: { id: firstLibraryId, type: 'library.workspace', manifestVersion: '1.0.0', configuration: {} },
      placement: firstLibraryPlacement
    },
    {
      widget: {
        id: expect.stringMatching(/^catalog-library-workspace-/),
        type: 'library.workspace', manifestVersion: '1.0.0', configuration: {}
      },
      placement: { kind: 'docked', panelId: 'scene', regionId: 'left', shelfId: 'primary', order: 3 }
    }
  ]);
});

test('Catalog pointer drag exposes populated dock rails and widget body docking zones before placement', async ({ page }) => {
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const originBox = await result.boundingBox();
  if (!originBox) throw new Error('Missing Catalog docking-parity origin geometry.');

  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  await expect(catalog).toBeHidden();

  const rails = page.locator('[data-pom-part="widget.drop-rail"]');
  await expect(rails).not.toHaveCount(0);
  await expect(page.locator('[data-catalog-placement-target].is-catalog-placement-target')).toHaveCount(0);

  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  const body = characters.locator(':scope > [data-pom-part="widget.content"]');
  const bodyBox = await body.boundingBox();
  if (!bodyBox) throw new Error('Missing populated Widget body geometry.');
  await page.mouse.move(
    bodyBox.x + bodyBox.width / 2,
    bodyBox.y + bodyBox.height * .875,
    { steps: 3 }
  );

  const slot = page.locator('[data-pom-part="widget.dock-slot"]');
  await expect(slot).toBeVisible();
  await expect(slot).toHaveAttribute('data-drop-intent', 'insert-after');
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'insert-after');

  await page.mouse.up();
  const placed = page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])');
  await expect(placed).toHaveCount(1);
  await expect(placed).toHaveAttribute('data-pomegranate-region', 'left');
  await expect(placed).not.toHaveAttribute('data-pomegranate-shelf', 'primary');
  await expect(page.locator('[data-pom-part="widget.drop-overlay"], [data-pom-part="widget.dock-slot"]')).toHaveCount(0);
});

test('Catalog tab drop creates and groups the Widget in one undo step', async ({ page }) => {
  const workbench = page.locator('main[data-workbench-revision]');
  const initialRevision = Number(await workbench.getAttribute('data-workbench-revision'));
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const originBox = await result.boundingBox();
  if (!originBox) throw new Error('Missing Catalog tab-drop origin geometry.');
  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  await expect(catalog).toBeHidden();

  const characters = page.getByRole('article', { name: 'Characters (Story)' });
  const headerBox = await widgetDragSurface(characters).boundingBox();
  if (!headerBox) throw new Error('Missing Catalog tab-drop target geometry.');
  await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2, { steps: 3 });
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-intent', 'tab');
  await expect(page.locator('[data-pom-part="widget.tab-insertion"]')).toBeVisible();
  await page.mouse.up();

  await expect(workbench).toHaveAttribute('data-workbench-revision', String(initialRevision + 1));
  const group = page.getByRole('group', { name: 'Widget group' })
    .filter({ has: page.getByRole('tab', { name: 'Characters (Story)' }) });
  await expect(group.getByRole('tab')).toHaveText(['Characters (Story)', 'Library']);
  await expect(group.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');

  await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();
  await page.getByRole('button', { name: 'Undo layout' }).press('Enter');
  await expect(workbench).toHaveAttribute('data-workbench-revision', String(initialRevision + 2));
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'Characters (Story)' })).toBeVisible();
});

test('Catalog pointer drag derives dock rails from every built-in Panel layout', async ({ page }) => {
  const panels = page.getByRole('tablist', { name: 'Panels' });
  for (const expectation of [
    { panel: 'Scene', regions: ['left', 'right', 'stage'] },
    { panel: 'Library', regions: ['focus', 'support'] },
    {
      panel: 'Settings',
      subPanel: 'Appearance and Accessibility',
      regions: ['column-1', 'column-2', 'column-3']
    }
  ]) {
    await panels.getByRole('tab', { name: expectation.panel, exact: true }).click();
    if (expectation.subPanel) {
      await page.getByRole('tab', { name: expectation.subPanel, exact: true }).click();
    }
    await openWidgetCatalog(page);
    const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
    const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
    await result.scrollIntoViewIfNeeded();
    const originBox = await result.boundingBox();
    if (!originBox) throw new Error(`Missing ${expectation.panel} Catalog origin geometry.`);

    await page.mouse.move(originBox.x + 8, originBox.y + 8);
    await page.mouse.down();
    await page.mouse.move(originBox.x + 14, originBox.y + 8);
    await expect(catalog).toBeHidden();
    const rails = page.locator('[data-pom-part="widget.drop-rail"]');
    await expect(rails).not.toHaveCount(0);
    const regions = await rails.evaluateAll((nodes) => [...new Set(nodes.map((node) => (
      (node as HTMLElement).dataset.dropRegion ?? ''
    )))].filter(Boolean).sort());
    expect(regions).toEqual(expectation.regions);

    await page.mouse.up();
    await expect(catalog).toBeVisible();
    await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();
  }
});

test('Catalog pointer drag reveals a collapsed dock as a live destination', async ({ page }) => {
  const main = page.locator('main[data-pom-theme-root]');
  const leftRegion = page.locator('[data-pomegranate-region-surface="left"]');
  await page.getByRole('button', { name: 'Close left toolbar' }).click();
  await expect(main).toHaveClass(/left-collapsed/);

  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const originBox = await result.boundingBox();
  if (!originBox) throw new Error('Missing collapsed-dock Catalog origin geometry.');
  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  await expect(catalog).toBeHidden();

  const surfaceBox = await page.locator('#workbench').boundingBox();
  if (!surfaceBox) throw new Error('Missing collapsed-dock Workbench geometry.');
  await page.mouse.move(surfaceBox.x + 4, surfaceBox.y + surfaceBox.height / 2, { steps: 3 });
  await expect(main).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect.poll(() => leftRegion.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(200);
  await expect(page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"]')).not.toHaveCount(0);

  await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, 8);
  await page.mouse.up();
  await expect(catalog).toBeVisible();
  await expect(main).not.toHaveAttribute('data-drag-reveal-left');
});

test('Catalog drag starts when every compatible side dock is collapsed', async ({ page }) => {
  const main = page.locator('main[data-pom-theme-root]');
  await page.getByRole('button', { name: 'Close left toolbar' }).click();
  await page.getByRole('button', { name: 'Close right toolbar' }).click();
  await expect(main).toHaveClass(/left-collapsed/);
  await expect(main).toHaveClass(/right-collapsed/);

  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="ext:atlas:campaign-clock"]');
  await result.scrollIntoViewIfNeeded();
  const originBox = await result.boundingBox();
  if (!originBox) throw new Error('Missing collapsed-only Catalog origin geometry.');
  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  await expect(catalog).toBeHidden();

  const surfaceBox = await page.locator('#workbench').boundingBox();
  if (!surfaceBox) throw new Error('Missing collapsed-only Workbench geometry.');
  await page.mouse.move(surfaceBox.x + 4, surfaceBox.y + surfaceBox.height / 2, { steps: 3 });
  await expect(main).toHaveAttribute('data-drag-reveal-left', 'true');
  await expect(page.locator('[data-pom-part="widget.drop-rail"][data-drop-region="left"]')).not.toHaveCount(0);

  await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, 8);
  await page.mouse.up();
  await expect(catalog).toBeVisible();
  await expect(main).not.toHaveAttribute('data-drag-reveal-left');
});

test('Catalog pointer placement selects the topmost nested compatible target beneath an overlay', async ({ page }) => {
  await openWidgetCatalog(page);
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  const result = catalog.locator('[data-catalog-result][data-widget-type="library.workspace"]');
  await result.scrollIntoViewIfNeeded();
  const originBox = await result.boundingBox();
  if (!originBox) throw new Error('Missing nested-target Catalog result geometry.');
  await page.evaluate(() => {
    const outer = document.querySelector<HTMLElement>('[data-pomegranate-region-surface="stage"]');
    if (!outer) throw new Error('Missing outer stage target.');
    outer.style.position = 'relative';
    const inner = document.createElement('section');
    inner.dataset.reviewNestedTarget = 'true';
    inner.dataset.pomegranateRegionSurface = 'right';
    inner.dataset.pomegranateRegionRole = 'right-instruments';
    inner.dataset.subPanelLane = '0';
    inner.setAttribute('aria-label', 'Nested right instruments region');
    Object.assign(inner.style, {
      position: 'absolute', left: '24%', top: '24%', width: '52%', height: '52%', zIndex: '20', pointerEvents: 'auto'
    });
    outer.append(inner);
  });

  await page.mouse.move(originBox.x + 8, originBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(originBox.x + 14, originBox.y + 8);
  await expect(catalog).toBeHidden();
  const inner = page.locator('[data-review-nested-target]');
  const innerBox = await inner.boundingBox();
  if (!innerBox) throw new Error('Missing nested compatible target geometry.');
  const point = { x: innerBox.x + innerBox.width / 2, y: innerBox.y + innerBox.height / 2 };
  await page.evaluate(({ x, y, width, height }) => {
    const overlay = document.createElement('div');
    overlay.dataset.reviewTargetOverlay = 'true';
    Object.assign(overlay.style, {
      position: 'fixed', left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, zIndex: '2147483647', pointerEvents: 'auto'
    });
    document.body.append(overlay);
  }, { x: innerBox.x, y: innerBox.y, width: innerBox.width, height: innerBox.height });
  await page.mouse.move(point.x, point.y, { steps: 2 });

  const expectedTarget = `${JSON.stringify(['region', 'scene', null, 0, 'right'])}:region`;
  await expect(page.locator('[data-catalog-placement-proxy]')).toHaveAttribute('data-placement-target', expectedTarget);
  await expect(page.locator('[data-pom-part="widget.snap-preview"]')).toHaveAttribute('data-drop-region', 'right');
  await expect(page.locator('.widget-drop-intent-label')).toContainText('Nested right instruments region');
  await page.mouse.up();
  await expect(page.locator('[data-widget-type="library.workspace"]:not([data-catalog-result])')).toHaveCount(1);
  await page.locator('[data-review-target-overlay]').evaluate((overlay) => overlay.remove());
  await expect(page.locator('[data-review-target-overlay]')).toHaveCount(0);
  await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();
  await openDeveloperTools(page);
  await page.getByRole('button', { name: 'Save layout' }).click();
  const committed = await page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem('pomegranate-ui.workbench-lab.layout.v1') ?? 'null') as {
      widgets: Record<string, { type: string }>;
      placements: Record<string, {
        kind: 'docked'; panelId: string; subPanelId?: string; lane?: number;
        regionId: string; shelfId: string; order: number;
      }>;
    } | null;
    const id = Object.entries(snapshot?.widgets ?? {})
      .find(([widgetId, instance]) => widgetId.startsWith('catalog-library-workspace-') && instance.type === 'library.workspace')?.[0];
    return id ? { id, placement: snapshot!.placements[id] } : null;
  });
  expect(committed).not.toBeNull();
  if (!committed?.placement) throw new Error('Missing committed nested Catalog placement.');
  expect(committed.placement).toEqual({
    kind: 'docked', panelId: 'scene', regionId: 'right', shelfId: 'primary', order: 3
  });
  expect([
    committed.placement.panelId,
    committed.placement.subPanelId ?? null,
    committed.placement.regionId,
    committed.placement.lane ?? 0,
    committed.placement.shelfId
  ]).toEqual(['scene', null, 'right', 0, 'primary']);
  expect(committed.placement.regionId).not.toBe('stage');
});
