import { expect, test, type Page } from '@playwright/test';

test.setTimeout(45_000);

async function fresh(page: Page, theme = 'Deep Current') {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
}

async function shelve(page: Page) {
  const widget = page.getByRole('article', { name: 'Theme Materials', exact: true });
  const id = await widget.getAttribute('data-pomegranate-widget');
  await widget.getByRole('button', { name: 'Widget actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Move to Widget Shelf', exact: true }).click();
  await expect(widget).toHaveCount(0);
  return id!;
}

async function save(page: Page) {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Save layout', exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
}

test('shelved widgets choose relative destinations, cancel without moving, undo and put back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await fresh(page);
  const id = await shelve(page);
  const trigger = page.getByRole('button', { name: 'Open Widget Shelf', exact: true });
  await trigger.click();
  const shelf = page.getByRole('dialog', { name: 'Widget Shelf', exact: true });
  const row = shelf.getByRole('article', { name: 'Theme Materials', exact: true });
  await expect(row).toContainText('Left instruments');
  await expect(row).not.toContainText('primary');
  await row.getByRole('button', { name: 'Place…', exact: true }).click();
  await row.getByLabel('Destination').selectOption({ label: 'Before World State' });
  await page.keyboard.press('Escape');
  await expect(shelf).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await row.getByRole('button', { name: 'Place…', exact: true }).click();
  await row.getByLabel('Destination').selectOption({ label: 'Before World State' });
  await row.getByRole('button', { name: 'Place widget', exact: true }).click();
  const placed = page.locator(`[data-pomegranate-widget="${id}"]`);
  await expect(placed).toHaveAttribute('data-pomegranate-region', 'right');
  const order = await placed.locator('xpath=ancestor::*[@data-pomegranate-shelf]').first().locator('[data-pomegranate-widget]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
  expect(order.indexOf('Theme Materials')).toBeLessThan(order.indexOf('World State'));
  await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
  await trigger.click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Put back', exact: true }).click();
  await expect(placed).toHaveAttribute('data-pomegranate-region', 'left');
  await save(page);
  await page.reload();
  await expect(placed).toHaveAttribute('data-pomegranate-region', 'left');
});

test('Widget Shelf controls stay readable and reachable in every theme at desktop and phone widths', async ({ page }, testInfo) => {
  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await fresh(page, theme);
    await shelve(page);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 720 });
      const undo = page.getByRole('button', { name: 'Undo layout', exact: true });
      await expect(undo, `${theme} at ${width}px`).toBeInViewport({ ratio: 1 });
      await expect(page.getByText('Developer tools', { exact: true })).toBeInViewport({ ratio: 1 });
      await page.getByRole('button', { name: 'Open Widget Shelf', exact: true }).click();
      const shelf = page.getByRole('dialog', { name: 'Widget Shelf', exact: true });
      await expect(shelf).toBeVisible();
      const geometry = await shelf.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, bottom: rect.bottom, scroll: node.scrollWidth, width: node.clientWidth, background: getComputedStyle(node).backgroundColor };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(8);
      expect(geometry.right).toBeLessThanOrEqual(width - 8);
      expect(geometry.bottom).toBeLessThanOrEqual(712);
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.background).toMatch(/^rgb\(/);
      await shelf.getByRole('button', { name: 'Place…', exact: true }).click();
      await expect(shelf.getByLabel('Destination')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}-shelf.png`) });
      await shelf.getByRole('button', { name: 'Cancel placement', exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(shelf).toBeHidden();
    }
  }
});

test('Shelf keeps Panel ownership and floating positions through restore and reload', async ({ page }) => {
  await fresh(page);
  const id = await shelve(page);
  await page.getByRole('button', { name: 'Open Widget Shelf', exact: true }).click();
  const shelf = page.getByRole('dialog', { name: 'Widget Shelf', exact: true });
  const row = shelf.getByRole('article', { name: 'Theme Materials', exact: true });
  await row.getByRole('button', { name: 'Place…', exact: true }).click();
  await row.getByLabel('Destination').selectOption({ label: 'Float on this Panel' });
  await row.getByRole('button', { name: 'Place widget', exact: true }).click();
  const widget = page.locator(`[data-pomegranate-widget="${id}"]`);
  await expect(widget).toHaveAttribute('data-pomegranate-placement', 'floating');
  await shelve(page);
  await page.getByRole('tab', { name: 'Library', exact: true }).click();
  await page.getByRole('button', { name: 'Open Widget Shelf', exact: true }).click();
  await expect(shelf).toContainText('No saved widgets');
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Scene', exact: true }).click();
  await save(page);
  await page.reload();
  await page.getByRole('button', { name: 'Open Widget Shelf', exact: true }).click();
  await expect(row).toContainText('Floating');
  await row.getByRole('button', { name: 'Put back', exact: true }).click();
  await expect(widget).toHaveAttribute('data-pomegranate-placement', 'floating');
});

test('keyboard Shelf placement groups a widget in one undoable change', async ({ page }) => {
  await fresh(page);
  const id = await shelve(page);
  const trigger = page.getByRole('button', { name: 'Open Widget Shelf', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const shelf = page.getByRole('dialog', { name: 'Widget Shelf', exact: true });
  await shelf.getByRole('button', { name: 'Place…', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(shelf.getByLabel('Destination')).toBeFocused();
  await shelf.getByLabel('Destination').selectOption({ label: 'Group with World State' });
  const before = Number(await page.locator('main').getAttribute('data-workbench-revision'));
  await shelf.getByRole('button', { name: 'Place widget', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`[data-focus-widget-for="${id}"]`)).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', String(before + 1));
  const group = page.getByRole('group', { name: 'Widget group', exact: true }).filter({ has: page.getByRole('tab', { name: 'World State', exact: true }) });
  await expect(group.getByRole('tab')).toHaveText(['World State', 'Theme Materials']);
  await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
  await trigger.click();
  await expect(shelf.getByRole('article', { name: 'Theme Materials', exact: true })).toBeVisible();
});

test('touch Shelf placement reveals its chosen dock and retains 44px controls', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, isMobile: true, ...(baseURL ? { baseURL } : {}) });
  const page = await context.newPage();
  try {
    for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
      await page.setViewportSize({ width: 1280, height: 720 });
      await fresh(page, theme);
      const id = await shelve(page);
      await page.setViewportSize({ width: 390, height: 844 });
      const trigger = page.getByRole('button', { name: 'Open Widget Shelf', exact: true });
      await trigger.tap();
      const shelf = page.getByRole('dialog', { name: 'Widget Shelf', exact: true });
      await shelf.getByRole('button', { name: 'Place…', exact: true }).tap();
      for (const node of await shelf.locator('button, select').all()) {
        expect((await node.boundingBox())!.height).toBeGreaterThanOrEqual(43.99);
      }
      await shelf.getByLabel('Destination').selectOption({ label: 'Dock in Right instruments' });
      await shelf.getByRole('button', { name: 'Place widget', exact: true }).tap();
      await expect(shelf).toBeHidden();
      await expect(page.locator(`[data-pomegranate-widget="${id}"]`)).toHaveAttribute('data-pomegranate-region', 'right');
      await expect(page.locator(`[data-focus-widget-for="${id}"]`)).toBeFocused();
      await expect(page.locator(`[data-focus-widget-for="${id}"]`), theme).toBeInViewport();
    }
  } finally { await context.close(); }
});
