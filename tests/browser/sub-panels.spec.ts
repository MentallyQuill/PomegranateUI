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

test('create, rename, layout, duplicate, move, delete, and persistence operate through explicit controls', async ({ page }) => {
  await openClean(page);
  await page.getByRole('button', { name: 'Add sub-panel' }).click();
  const create = page.getByRole('dialog', { name: 'Create sub-panel' });
  await create.getByLabel('Sub-panel name').fill('Research');
  await create.getByLabel('Layout').selectOption('two-equal');
  await create.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('tab', { name: 'Research' })).toBeVisible();

  await page.getByRole('button', { name: 'Manage Research' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const rename = page.getByRole('dialog', { name: 'Rename sub-panel' });
  await rename.getByLabel('Sub-panel name').fill('Research Notes');
  await rename.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes' })).toBeVisible();

  await page.getByRole('button', { name: 'Manage Research Notes' }).click();
  await page.getByRole('menuitem', { name: 'Change layout' }).click();
  const layout = page.getByRole('dialog', { name: 'Choose sub-panel layout' });
  await layout.getByLabel('Layout').selectOption('wide-left');
  await layout.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('[data-pom-part="sub-panel.bar"]')).toHaveAttribute('data-sub-panel-layout', 'wide-left');

  await page.getByRole('button', { name: 'Manage Research Notes' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(page.getByRole('tab', { name: 'Research Notes Copy' })).toBeVisible();

  await page.getByRole('tab', { name: names[0] }).click();
  await page.getByRole('button', { name: `Manage ${names[0]}` }).click();
  await page.getByRole('menuitem', { name: 'Move Widgets' }).click();
  const move = page.getByRole('dialog', { name: 'Move all Widgets' });
  await move.getByLabel('Destination').selectOption({ label: 'Research Notes' });
  await move.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('article', { name: 'Provider Credentials' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Research Notes', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Provider Credentials' })).toBeVisible();

  await page.getByRole('tab', { name: 'Research Notes Copy' }).click();
  await page.getByRole('button', { name: 'Manage Research Notes Copy' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
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

test('phone portrait uses the selector without clipping and switches content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openClean(page);
  const selector = page.locator('[data-sub-panel-selector-trigger]');
  await expect(selector).toBeVisible();
  await selector.click();
  await page.getByRole('option', { name: names[2] }).click();
  await expect(page.getByRole('article', { name: 'Theme Library' })).toBeVisible();
  await assertContained(page);
});

test('short mobile landscape keeps every sub-panel and management action reachable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openClean(page);
  const selector = page.locator('[data-sub-panel-selector-trigger]');
  await expect(selector).toBeVisible();
  await selector.click();
  await expect(page.getByRole('option')).toHaveText(names);
  await page.getByRole('option', { name: names[5] }).click();
  await expect(page.getByRole('tabpanel', { name: names[5] })).toBeVisible();
  await expect(page.getByRole('button', { name: `Manage ${names[5]}` })).toBeVisible();
  await assertContained(page);
});

async function touchDesktopPage(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 980, height: 720 }, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  await openClean(page);
  return { context, page };
}

test('mobile desktop-site viewport retains a usable coarse-pointer bar and responsive lanes', async ({ browser }) => {
  const { context, page } = await touchDesktopPage(browser);
  try {
    const bar = page.locator('[data-pom-part="sub-panel.bar"]');
    await expect(bar).toBeVisible();
    expect((await bar.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('tablist', { name: 'Settings sub-panels' })).toBeVisible();
    await page.getByRole('tab', { name: names[2] }).click();
    await expect(page.getByRole('article', { name: 'Theme Library' })).toBeVisible();
    await assertContained(page);
  } finally {
    await context.close();
  }
});
