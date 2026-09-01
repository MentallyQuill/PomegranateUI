import { expect, test, type Browser, type Page } from '@playwright/test';

const labOrigin = process.env.POM_LAB_ORIGIN ?? 'http://127.0.0.1:4174';
const names = [
  'Account and Access',
  'AI and Models',
  'Appearance and Accessibility',
  'Story Defaults and Content',
  'Data, Extensions, and Maintenance',
  'Advanced'
] as const;

async function openClean(page: Page) {
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('tab', { name: 'Settings' }).click();
}

async function assertContained(page: Page) {
  const evidence = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    surfaceRight: document.querySelector('[data-pom-part="sub-panel.surface"]')?.getBoundingClientRect().right ?? 0
  }));
  expect(evidence.documentWidth).toBeLessThanOrEqual(evidence.viewport + 1);
  expect(evidence.surfaceRight).toBeLessThanOrEqual(evidence.viewport + 1);
}

async function dispatchHeldTouchDrag(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
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

test('all four themes expose the same exact six functional Settings sub-panels', async ({ page }) => {
  await openClean(page);
  await page.getByText('Developer tools', { exact: true }).click();
  const themes = page.getByRole('group', { name: 'Visual target' });

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await themes.getByRole('button', { name: theme, exact: true }).click();
    const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
    await expect(tablist.getByRole('tab')).toHaveText(names);
    const account = tablist.getByRole('tab', { name: names[0] });
    await account.click();
    await account.hover();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('tabpanel', { name: names[0] })).toHaveId(await account.getAttribute('aria-controls') ?? 'missing');

    await tablist.getByRole('tab', { name: names[2] }).click();
    await expect(page.getByRole('article', { name: 'Theme Library' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Provider Credentials' })).toHaveCount(0);
    await expect(page.getByRole('tabpanel', { name: names[2] })).toBeVisible();
  }
});

test('Settings sub-panel tabs pan and navigate without reordering on the normal rail', async ({ page }) => {
  await openClean(page);
  await addSubPanel(page, 'Research');
  await addSubPanel(page, 'Notes');
  await page.setViewportSize({ width: 390, height: 844 });
  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const before = await tablist.getByRole('tab').allTextContents();
  const account = tablist.getByRole('tab', { name: names[0] });
  const accountBox = await account.boundingBox();
  if (!accountBox) throw new Error('Expected Settings tab geometry.');
  await page.mouse.move(accountBox.x + accountBox.width / 2, accountBox.y + accountBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(accountBox.x - 120, accountBox.y + accountBox.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(await tablist.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(tablist.getByRole('tab')).toHaveText(before);
  await expect(account).toHaveAttribute('aria-selected', 'false');

  await account.focus();
  await account.press('Control+Shift+ArrowRight');
  await expect(tablist.getByRole('tab', { name: names[1] })).toBeFocused();
  await expect(tablist.getByRole('tab', { name: names[1] })).toHaveAttribute('aria-selected', 'true');
  await expect(tablist.getByRole('tab')).toHaveText(before);
});

test('create, rename, layout, duplicate, move, delete, and persistence operate through explicit controls', async ({ page }) => {
  await openClean(page);
  await page.getByRole('button', { name: 'Add sub-panel' }).click();
  const create = page.getByRole('dialog', { name: 'Create sub-panel' });
  await create.getByLabel('Sub-panel name').fill('Research');
  await create.getByLabel('Layout').selectOption('two-equal');
  await create.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('tab', { name: 'Research' })).toBeVisible();

  await page.getByRole('tab', { name: 'Research' }).click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Research sub-panel actions' }).getByRole('button', { name: 'Rename' }).click();
  const rename = page.getByRole('dialog', { name: 'Rename sub-panel' });
  await rename.getByLabel('Sub-panel name').fill('Research Notes');
  await rename.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes' })).toBeVisible();

  await page.getByRole('tab', { name: 'Research Notes' }).click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Research Notes sub-panel actions' }).getByRole('button', { name: 'Change layout' }).click();
  const layout = page.getByRole('dialog', { name: 'Choose sub-panel layout' });
  await layout.getByLabel('Layout').selectOption('wide-left');
  await layout.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('[data-pom-part="sub-panel.bar"]')).toHaveAttribute('data-sub-panel-layout', 'wide-left');

  await page.getByRole('tab', { name: 'Research Notes' }).click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Research Notes sub-panel actions' }).getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes Copy' })).toBeVisible();

  await page.getByRole('tab', { name: names[0] }).click();
  await page.getByRole('tab', { name: names[0] }).click({ button: 'right' });
  await page.getByRole('dialog', { name: `${names[0]} sub-panel actions` }).getByRole('button', { name: 'Move Widgets' }).click();
  const move = page.getByRole('dialog', { name: 'Move all Widgets' });
  await move.getByLabel('Destination').selectOption({ label: 'Research Notes' });
  await move.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('article', { name: 'Provider Credentials' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Research Notes', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Provider Credentials' })).toBeVisible();

  await page.getByRole('tab', { name: 'Research Notes Copy' }).click();
  await page.getByRole('tab', { name: 'Research Notes Copy' }).click({ button: 'right' });
  await page.getByRole('dialog', { name: 'Research Notes Copy sub-panel actions' }).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog', { name: 'Delete sub-panel' }).getByRole('button', { name: 'Delete sub-panel' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes Copy' })).toHaveCount(0);

  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Research Notes', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Provider Credentials' })).toBeVisible();
});

test('sub-panel context actions use the exact inactive target and restore focus', async ({ page }) => {
  await openClean(page);
  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const account = tablist.getByRole('tab', { name: names[0] });
  const appearance = tablist.getByRole('tab', { name: names[2] });
  await appearance.click();

  await account.click({ button: 'right' });
  const menu = page.getByRole('dialog', { name: `${names[0]} sub-panel actions` });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button')).toHaveText([
    'Rename', 'Duplicate', 'Change layout', 'Move Widgets', 'Delete', 'Reorder sub-panels…'
  ]);
  await expect(appearance).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(account).toBeFocused();

  await account.press('Shift+F10');
  await expect(menu).toBeVisible();
  await expect(appearance).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await account.press('ContextMenu');
  await expect(menu).toBeVisible();
});

test('Reorder sub-panels preserves active identity and persists only through the explicit dialog', async ({ page }) => {
  await openClean(page);
  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const appearance = tablist.getByRole('tab', { name: names[2] });
  const account = tablist.getByRole('tab', { name: names[0] });
  await appearance.click();
  await account.click({ button: 'right' });
  await page.getByRole('dialog', { name: `${names[0]} sub-panel actions` })
    .getByRole('button', { name: 'Reorder sub-panels…' }).click();

  const dialog = page.getByRole('dialog', { name: 'Reorder Settings sub-panels' });
  const list = dialog.getByRole('list', { name: 'Settings sub-panels order' });
  await expect(list.locator('.tab-order-name')).toHaveText(names);
  await dialog.getByRole('button', { name: `Move ${names[0]} down` }).click();
  await dialog.getByRole('button', { name: `Move ${names[0]} down` }).click();
  await expect(tablist.getByRole('tab')).toHaveText([
    names[1], names[2], names[0], names[3], names[4], names[5]
  ]);
  await expect(appearance).toHaveAttribute('aria-selected', 'true');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(account).toBeFocused();

  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(tablist.getByRole('tab')).toHaveText([
    names[1], names[2], names[0], names[3], names[4], names[5]
  ]);
  await expect(tablist.getByRole('tab', { name: names[2] })).toHaveAttribute('aria-selected', 'true');
});

test('sub-panel activation preserves each tab vertical scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openClean(page);
  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const owner = page.locator('[data-pomegranate-panel="settings"]');
  await tablist.getByRole('tab', { name: names[4] }).click();
  const saved = await owner.evaluate((node) => {
    node.scrollTop = Math.min(180, node.scrollHeight - node.clientHeight);
    return node.scrollTop;
  });
  expect(saved).toBeGreaterThan(0);
  await tablist.getByRole('tab', { name: names[2] }).click();
  await owner.evaluate((node) => { node.scrollTop = 0; });
  await tablist.getByRole('tab', { name: names[4] }).click();
  expect(await owner.evaluate((node) => node.scrollTop)).toBeGreaterThanOrEqual(saved - 1);
});

test('the Lab announces the tab-options hint once per browser session after custom creation', async ({ page }) => {
  await openClean(page);
  await addSubPanel(page, 'Research');
  const status = page.locator('[data-workbench-developer-drawer]').getByRole('status');
  await page.getByText('Developer tools', { exact: true }).click();
  await expect(status).toContainText('Right-click or press and hold a tab for options.');
  await page.getByRole('button', { name: 'Save layout' }).click();
  await expect(status).not.toContainText('Right-click or press and hold a tab for options.');
  await page.reload();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await addSubPanel(page, 'Notes');
  await page.getByText('Developer tools', { exact: true }).click();
  await expect(status).toHaveText('Notes created.');
});

async function addSubPanel(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add sub-panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create sub-panel' });
  await dialog.getByLabel('Sub-panel name').fill(name);
  await dialog.getByRole('button', { name: 'Apply' }).click();
}

test('phone portrait keeps an eight-sub-panel rail visible with fixed Add and no compact selector', async ({ page }) => {
  await openClean(page);
  await addSubPanel(page, 'Research');
  await addSubPanel(page, 'Notes');
  await page.setViewportSize({ width: 390, height: 844 });

  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  await expect(tablist).toBeVisible();
  await expect(tablist.getByRole('tab')).toHaveCount(8);
  await expect(page.locator('[data-sub-panel-selector-trigger]')).toHaveCount(0);
  await expect(page.locator('[data-sub-panel-actions-trigger]')).toHaveCount(0);
  const add = page.getByRole('button', { name: 'Add sub-panel' });
  await expect(add).toBeVisible();
  expect(await add.evaluate((node) => node.parentElement?.matches('[data-tab-rail-scroll]'))).toBe(false);

  await tablist.getByRole('tab', { name: names[2] }).click();
  await expect(page.getByRole('article', { name: 'Theme Library' })).toBeVisible();
  await assertContained(page);
});

test('short mobile landscape keeps the eight-sub-panel rail and fixed Add reachable', async ({ page }) => {
  await openClean(page);
  await addSubPanel(page, 'Research');
  await addSubPanel(page, 'Notes');
  await page.setViewportSize({ width: 844, height: 390 });

  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  await expect(tablist).toBeVisible();
  await expect(tablist.getByRole('tab')).toHaveCount(8);
  await expect(page.locator('[data-sub-panel-selector-trigger]')).toHaveCount(0);
  await expect(page.locator('[data-sub-panel-actions-trigger]')).toHaveCount(0);
  const add = page.getByRole('button', { name: 'Add sub-panel' });
  await expect(add).toBeVisible();
  expect(await add.evaluate((node) => node.parentElement?.matches('[data-tab-rail-scroll]'))).toBe(false);

  await tablist.getByRole('tab', { name: names[5] }).click();
  await expect(page.getByRole('tabpanel', { name: names[5] })).toBeVisible();
  await assertContained(page);
});

async function touchDesktopPage(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 980, height: 720 }, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  await openClean(page);
  return { context, page };
}

test('touch hold targets an inactive sub-panel while movement scrolls without activation', async ({ browser }) => {
  const { context, page } = await touchDesktopPage(browser);
  try {
    await addSubPanel(page, 'Research');
    await addSubPanel(page, 'Notes');
    await page.setViewportSize({ width: 390, height: 844 });
    const bar = page.locator('[data-pom-part="sub-panel.bar"]');
    await expect(bar).toBeVisible();
    expect((await bar.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
    const account = tablist.getByRole('tab', { name: names[0] });
    const notes = tablist.getByRole('tab', { name: 'Notes' });
    await notes.click();
    await tablist.evaluate((node) => { node.scrollLeft = 0; });
    const accountBox = await account.boundingBox();
    if (!accountBox) throw new Error('Expected desktop-site touch tab geometry.');
    expect(accountBox.width).toBeGreaterThanOrEqual(44);
    expect(accountBox.height).toBeGreaterThanOrEqual(44);
    const start = { x: accountBox.x + accountBox.width / 2, y: accountBox.y + accountBox.height / 2 };
    const end = { x: start.x - 120, y: start.y };
    await dispatchHeldTouchDrag(page, start, end);
    expect(await tablist.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await expect(notes).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('dialog', { name: `${names[0]} sub-panel actions` })).toHaveCount(0);

    await tablist.evaluate((node) => { node.scrollLeft = 0; });
    const heldBox = await account.boundingBox();
    if (!heldBox) throw new Error('Expected stationary touch target geometry.');
    const hold = { x: heldBox.x + heldBox.width / 2, y: heldBox.y + heldBox.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [hold] });
    await page.waitForTimeout(550);
    const menu = page.getByRole('dialog', { name: `${names[0]} sub-panel actions` });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('data-context-source', 'touch');
    await expect(notes).toHaveAttribute('aria-selected', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    await assertContained(page);
  } finally {
    await context.close();
  }
});

test('sub-panel touch candidates cancel on pointer cancellation and window blur without stray activation', async ({ page }) => {
  await openClean(page);
  const tablist = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const account = tablist.getByRole('tab', { name: names[0] });
  const appearance = tablist.getByRole('tab', { name: names[2] });
  await appearance.click();
  const box = await account.boundingBox();
  const element = await account.elementHandle();
  if (!box || !element) throw new Error('Expected cancellation target geometry.');
  const event = (pointerId: number) => ({
    pointerId, pointerType: 'touch', isPrimary: true, button: 0,
    clientX: box.x + box.width / 2, clientY: box.y + box.height / 2
  });

  await element.dispatchEvent('pointerdown', event(71));
  await element.dispatchEvent('pointercancel', event(71));
  await page.waitForTimeout(550);
  await expect(page.getByRole('dialog', { name: `${names[0]} sub-panel actions` })).toHaveCount(0);

  await element.dispatchEvent('pointerdown', event(72));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(550);
  await expect(page.getByRole('dialog', { name: `${names[0]} sub-panel actions` })).toHaveCount(0);
  await element.dispatchEvent('click');
  await expect(appearance).toHaveAttribute('aria-selected', 'true');
});
