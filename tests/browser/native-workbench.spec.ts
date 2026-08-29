import { expect, test } from '@playwright/test';
import { IMPLEMENTED_SURFACES } from '../../apps/workbench-lab/src/mockup/implemented-surfaces.ts';
import { SURFACE_FIXTURES, SURFACE_STATE_COPY } from '../../apps/workbench-lab/src/mockup/surface-fixtures.ts';

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
  await expect(story).toContainText('story-lab-reservoir');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  await expect(story).toContainText('story-lab-reservoir');
  await expect(page.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
  await expect(page.locator('[data-surface-type="library.workspace"]')).toBeVisible();
});

test('native workbench POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {
  const leftDock = page.locator('[data-pomegranate-dock="left"]');
  await expect(leftDock.getByRole('article')).toHaveCount(2);
  const world = page.getByRole('article', { name: 'World State' });
  await world.getByRole('button', { name: 'Dock left' }).click();
  await expect(leftDock.getByRole('article')).toHaveCount(3);
  await expect(leftDock.getByRole('article').nth(0)).toHaveAttribute('aria-label', 'Characters (Story)');
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'Theme Library');
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

  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '320');
  await expect(page.getByRole('separator', { name: 'Resize right toolbar' })).toHaveAttribute('aria-valuenow', '420');
  await expect.poll(() => page.locator('[data-pomegranate-dock="left"]').evaluate((node) => node.getBoundingClientRect().width)).toBe(320);
  await expect.poll(() => page.locator('[data-pomegranate-dock="right"]').evaluate((node) => node.getBoundingClientRect().width)).toBe(420);
});

test('Deep Current Widgets merge into an accessible persistent tab group and reorder', async ({ page }) => {
  const ambience = page.getByRole('article', { name: 'Room Ambience' });
  const worldBox = await page.getByRole('article', { name: 'World State' }).boundingBox();
  if (!worldBox) throw new Error('Expected World State geometry.');
  await dragTo(page, ambience.getByRole('button', { name: 'Drag Widget' }), {
    x: worldBox.x + worldBox.width / 2,
    y: worldBox.y + worldBox.height / 2
  });

  const group = page.getByRole('group', { name: 'Widget group' });
  await expect(group.getByRole('tab')).toHaveText(['World State', 'Room Ambience']);
  await expect(group.getByRole('tab', { name: 'Room Ambience' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('article', { name: 'World State' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'World State' }).click();
  await expect(page.getByRole('article', { name: 'World State' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Room Ambience' })).toHaveCount(0);

  await group.getByRole('tab', { name: 'Room Ambience' }).press('Alt+ArrowLeft');
  await expect(group.getByRole('tab')).toHaveText(['Room Ambience', 'World State']);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  const restored = page.getByRole('group', { name: 'Widget group' });
  await expect(restored.getByRole('tab')).toHaveText(['Room Ambience', 'World State']);
  await expect(restored.getByRole('tab', { name: 'World State' })).toHaveAttribute('aria-selected', 'true');
});

test('Deep Current Focus and Back keep one Widget identity and restore invoking focus', async ({ page }) => {
  const world = page.getByRole('article', { name: 'World State' });
  const focus = world.getByRole('button', { name: 'Focus Widget' });
  await focus.click();

  const dialog = page.getByRole('dialog', { name: 'Focused World State' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-pomegranate-widget="scene-world"]')).toHaveCount(1);
  await expect(page.locator('[data-focused-widget-placeholder="scene-world"]')).toBeVisible();
  await expect(page.locator('[data-pomegranate-widget="scene-world"]')).toHaveCount(1);

  await dialog.getByRole('button', { name: 'Back to Workbench' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Focus Widget' })).toBeFocused();
});

test('Deep Current pointer drag floats and subsequently moves a Widget within the canvas', async ({ page }) => {
  const world = page.getByRole('article', { name: 'World State' });
  const stageBox = await page.locator('[data-pomegranate-dock="main"]').boundingBox();
  if (!stageBox) throw new Error('Expected stage geometry.');
  await dragTo(page, world.getByRole('button', { name: 'Drag Widget' }), {
    x: stageBox.x + stageBox.width * 0.72,
    y: stageBox.y + 90
  });

  const floating = page.locator('[data-widget-type="systems.world-state"][data-pomegranate-placement="floating"]');
  await expect(floating).toBeVisible();
  const first = await floating.boundingBox();
  if (!first) throw new Error('Expected floating Widget geometry.');
  const floatingHandle = floating.getByRole('button', { name: 'Drag Widget' });
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

test('Deep Current drag creates a new shelf and invalid release restores exact origin', async ({ page }) => {
  const world = page.getByRole('article', { name: 'World State' });
  const seam = page.locator('[data-shelf-insertion="left"]');
  const seamBox = await seam.boundingBox();
  if (!seamBox) throw new Error('Expected left shelf seam geometry.');
  await dragTo(page, world.getByRole('button', { name: 'Drag Widget' }), {
    x: seamBox.x + seamBox.width / 2,
    y: seamBox.y + seamBox.height / 2
  });
  const placed = page.locator('[data-widget-type="systems.world-state"]');
  await expect(placed).toHaveAttribute('data-pomegranate-edge', 'left');
  await expect(placed).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);

  const ambience = page.locator('[data-widget-type="story.room-ambience"]');
  const origin = await ambience.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }));
  const revision = await page.locator('main').getAttribute('data-workbench-revision');
  await dragTo(page, ambience.getByRole('button', { name: 'Drag Widget' }), { x: 2, y: 2 });
  await expect.poll(() => ambience.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }))).toEqual(origin);
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', revision ?? '');

  const cancelHandle = ambience.getByRole('button', { name: 'Drag Widget' });
  const cancelBox = await cancelHandle.boundingBox();
  if (!cancelBox) throw new Error('Expected cancel drag handle geometry.');
  await page.mouse.move(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cancelBox.x + cancelBox.width / 2 + 18, cancelBox.y + cancelBox.height / 2 + 18);
  await cancelHandle.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await page.mouse.up();
  await expect.poll(() => ambience.evaluate((node) => ({
    parent: node.parentElement?.getAttribute('data-pomegranate-dock'),
    edge: node.getAttribute('data-pomegranate-edge'),
    shelf: node.getAttribute('data-pomegranate-shelf'),
    order: node.getAttribute('data-pomegranate-order'),
    style: node.getAttribute('style')
  }))).toEqual(origin);
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', revision ?? '');
});

test('Deep Current accepts the same shelf placement path from a coarse touch pointer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4174');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    const handle = page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Drag Widget' });
    const handleBox = await handle.boundingBox();
    const seamBox = await page.locator('[data-shelf-insertion="left"]').boundingBox();
    if (!handleBox || !seamBox) throw new Error('Expected touch placement geometry.');
    const start = { x: handleBox.x + handleBox.width / 2, y: handleBox.y + handleBox.height / 2 };
    const end = { x: seamBox.x + seamBox.width / 2, y: seamBox.y + seamBox.height / 2 };
    await handle.dispatchEvent('pointerdown', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: start.x, clientY: start.y });
    await handle.dispatchEvent('pointermove', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: end.x, clientY: end.y });
    await handle.dispatchEvent('pointerup', { pointerId: 17, pointerType: 'touch', isPrimary: true, button: 0, clientX: end.x, clientY: end.y });
    await expect(page.locator('[data-widget-type="systems.world-state"]')).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);
  } finally {
    await context.close();
  }
});

test('Scene, Library, and Settings retain independent interaction layouts after reload', async ({ page }) => {
  const sceneLeft = page.getByRole('separator', { name: 'Resize left toolbar' });
  await sceneLeft.focus();
  await sceneLeft.press('End');
  const sceneSeam = await page.locator('[data-shelf-insertion="left"]').boundingBox();
  if (!sceneSeam) throw new Error('Expected Scene shelf seam.');
  await dragTo(page, page.getByRole('article', { name: 'World State' }).getByRole('button', { name: 'Drag Widget' }), {
    x: sceneSeam.x + sceneSeam.width / 2,
    y: sceneSeam.y + sceneSeam.height / 2
  });
  await page.getByRole('article', { name: 'Character Relationships' }).getByRole('button', { name: 'Float' }).click();

  await page.getByRole('tab', { name: 'Library' }).click();
  const libraryLeft = page.getByRole('separator', { name: 'Resize left toolbar' });
  await libraryLeft.focus();
  await libraryLeft.press('Home');
  const character = page.getByRole('article', { name: 'Character Card' });
  const characterBox = await character.boundingBox();
  if (!characterBox) throw new Error('Expected Character Card geometry.');
  await dragTo(page, page.getByRole('article', { name: 'Lore Entry Tree' }).getByRole('button', { name: 'Drag Widget' }), {
    x: characterBox.x + characterBox.width / 2,
    y: characterBox.y + characterBox.height / 2
  });

  await page.getByRole('tab', { name: 'Settings' }).click();
  const settingsRight = page.getByRole('separator', { name: 'Resize right toolbar' });
  await settingsRight.focus();
  await settingsRight.press('ArrowLeft');
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();

  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('separator', { name: 'Resize right toolbar' })).toHaveAttribute('aria-valuenow', '278');
  await page.getByRole('tab', { name: 'Library' }).click();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '200');
  await expect(page.getByRole('group', { name: 'Widget group' }).getByRole('tab')).toHaveText(['Character Card', 'Lore Entry Tree']);
  await page.getByRole('tab', { name: 'Scene' }).click();
  await expect(page.getByRole('separator', { name: 'Resize left toolbar' })).toHaveAttribute('aria-valuenow', '420');
  await expect(page.locator('[data-widget-type="systems.world-state"]')).toHaveAttribute('data-pomegranate-shelf', /left-shelf-/);
  await expect(page.locator('[data-widget-type="systems.character-relationships"]')).toHaveAttribute('data-pomegranate-placement', 'floating');
});

test('native workbench POM-PERSIST-842D422EB3 POM-PERSIST-9FA69F9FC1 restores a user Panel template and order', async ({ page }) => {
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('My Chronicle');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');

  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'My Chronicle' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('Workbench context')).toContainText('columns.v1');
});

test('native workbench POM-PERSIST-28DFDC9A8F POM-PERSIST-D50D69D3C4 restores reordered Panels', async ({ page }) => {
  await page.getByRole('button', { name: 'Move Settings left' }).click();
  await expect(page.getByRole('tab')).toHaveText(['Scene', 'Settings', 'Library']);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tab')).toHaveText(['Scene', 'Settings', 'Library']);
});

test('native workbench applies complete themes without replacing live Workbench identity', async ({ page }) => {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const root = page.locator('main');
  const identity = await root.evaluate((node) => ({
    revision: node.getAttribute('data-workbench-revision'),
    panels: [...node.querySelectorAll('[data-pomegranate-panel]')].map((panel) => panel.getAttribute('data-pomegranate-panel')),
    widgets: [...node.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }));
  const themeTargets = page.getByRole('group', { name: 'Visual target' });
  const neutral = themeTargets.getByRole('button', { name: 'PomOS', exact: true });
  await neutral.click();
  await expect(root).toHaveAttribute('data-pom-theme', 'pom-neutral');
  await expect(neutral).toHaveAttribute('aria-pressed', 'true');
  const bunny = themeTargets.getByRole('button', { name: 'Bunny', exact: true });
  await bunny.click();
  await expect(root).toHaveAttribute('data-pom-theme', 'bunny');
  await expect(bunny).toBeFocused();
  await expect(root).toHaveAttribute('data-workbench-revision', identity.revision ?? '');
  await expect.poll(() => root.evaluate((node) => ({
    panels: [...node.querySelectorAll('[data-pomegranate-panel]')].map((panel) => panel.getAttribute('data-pomegranate-panel')),
    widgets: [...node.querySelectorAll('[data-pomegranate-widget]')].map((widget) => widget.getAttribute('data-pomegranate-widget'))
  }))).toEqual({ panels: identity.panels, widgets: identity.widgets });
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('pomegranate-ui.workbench-lab.theme.v1'))).toBe('bunny');
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  await expect(page.getByRole('complementary', { name: 'Widget Catalog' })).toBeVisible();
});

test('all theme targets remain readable, transition-free, and contained at wide and compact sizes', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const theme of [
      { label: 'Deep Current', id: 'deep-current', text: 'rgb(231, 246, 240)' },
      { label: 'PomOS', id: 'pom-neutral', text: 'rgb(16, 24, 32)' },
      { label: 'Bunny', id: 'bunny', text: 'rgb(69, 54, 77)' }
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
    for (const control of [
      page.getByRole('tab', { name: 'Scene' }),
      page.getByRole('button', { name: 'Open Widget Catalog' }),
      page.getByRole('button', { name: 'Collapse left dock' }),
      page.getByRole('button', { name: 'Send action' })
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

test('all 49 reviewed Widget surfaces expose exact ready, state, focus, and responsive contracts', async ({ page }) => {
  test.setTimeout(120_000);
  for (const surface of IMPLEMENTED_SURFACES) {
    const fixture = SURFACE_FIXTURES.get(surface.type);
    if (!fixture) throw new Error(`Missing fixture for ${surface.type}.`);
    await page.goto(`http://127.0.0.1:4174/?surface=${encodeURIComponent(surface.type)}`);
    await page.evaluate(() => document.fonts.ready);
    const article = page.getByRole('article', { name: surface.title });
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

    if (surface.family !== 'story') {
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

    await article.getByRole('button', { name: 'Focus Widget' }).click();
    const dialog = page.getByRole('dialog', { name: `Focused ${surface.title}` });
    await expect(dialog.locator(`[data-surface-type="${surface.type}"]`)).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Back to Workbench' }).click();
    await expect(article.getByRole('button', { name: 'Focus Widget' })).toBeFocused();
  }
});

test('Catalog preserves all 94 identities, honest previews, search, and placement', async ({ page }) => {
  test.setTimeout(120_000);
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('Catalog Proof');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await expect(page.getByRole('tab', { name: 'Catalog Proof' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
  const results = catalog.getByRole('listitem');
  await expect(results).toHaveCount(94);
  await expect(catalog.locator('.catalog-miniature')).toHaveCount(94);
  await expect(catalog.locator('[data-renderer-status="implemented"]')).toHaveCount(49);
  await expect(catalog.locator('[data-renderer-status="unavailable"]')).toHaveCount(45);

  for (const [category, total] of [['story', 12], ['library', 19], ['systems', 21], ['settings', 39], ['extensions', 3]] as const) {
    await catalog.getByRole('button', { name: category, exact: true }).click();
    await expect(results, `${category} Catalog total`).toHaveCount(total);
  }
  await catalog.getByRole('button', { name: 'All', exact: true }).click();
  const search = catalog.getByRole('searchbox', { name: 'Search Widgets' });
  await search.fill('character relationships');
  await expect(results).toHaveCount(1);
  await expect(results.first()).toContainText('Character Relationships');
  await search.fill('');

  await catalog.getByRole('button', { name: 'Compact', exact: true }).click();
  await expect(catalog.locator('.catalog-miniature')).toHaveCount(0);
  await expect(results).toHaveCount(94);
  await catalog.getByRole('button', { name: 'Visual', exact: true }).click();
  await expect(catalog.locator('.catalog-miniature')).toHaveCount(94);

  await catalog.getByRole('button', { name: /^Add / }).evaluateAll((buttons) => {
    for (const button of buttons) (button as HTMLButtonElement).click();
  });
  await catalog.getByRole('button', { name: 'Close Catalog' }).click();
  const activePanel = page.getByRole('tabpanel', { name: 'Catalog Proof' });
  await expect(activePanel.getByRole('article')).toHaveCount(94);
  await expect(activePanel.locator('.implemented-widget')).toHaveCount(49);
  await expect(activePanel.locator('[aria-label$="renderer unavailable"]')).toHaveCount(45);
  const identities = await activePanel.locator('[data-widget-type]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-widget-type')));
  expect(new Set(identities).size).toBe(94);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  const restoredPanel = page.getByRole('tabpanel', { name: 'Catalog Proof' });
  await expect(restoredPanel.locator('[data-widget-type]')).toHaveCount(94);
  await expect(restoredPanel.locator('.implemented-widget')).toHaveCount(49);
  await expect(restoredPanel.locator('[aria-label$="renderer unavailable"]')).toHaveCount(45);
  await expect(restoredPanel.locator('button.action-remove')).toHaveCount(94);
  await restoredPanel.locator('button.action-remove').evaluateAll((buttons) => {
    for (const button of buttons) (button as HTMLButtonElement).click();
  });
  await expect(restoredPanel.locator('[data-widget-type]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await expect(page.getByRole('tabpanel', { name: 'Catalog Proof' }).locator('[data-widget-type]')).toHaveCount(0);
});
