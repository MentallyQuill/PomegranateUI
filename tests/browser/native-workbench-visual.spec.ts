import { expect, test, type Page } from '@playwright/test';

test.skip(process.platform !== 'win32', 'Visual baselines are reviewed on Windows; functional browser coverage remains cross-platform.');

const labOrigin = process.env.POM_LAB_ORIGIN ?? `http://127.0.0.1:${process.env.POM_PLAYWRIGHT_PORT ?? '4174'}`;

async function fresh(page: Page, width: number, height: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height });
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

type ThemeLabel = 'Deep Current' | 'PomOS' | 'Bunny' | 'Ash & Amber';

const maintainedThemes = [
  { label: 'Deep Current' as const, id: 'deep-current', slug: 'deep-current' },
  { label: 'PomOS' as const, id: 'pom-neutral', slug: 'pom-neutral' },
  { label: 'Bunny' as const, id: 'bunny', slug: 'bunny' },
  { label: 'Ash & Amber' as const, id: 'ash-amber', slug: 'ash-amber' }
] as const;
const reviewedLongSubPanelName = 'Session History: Worldbuilding Reference Notes';

async function selectTheme(page: Page, label: ThemeLabel) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' })
    .getByRole('button', { name: label, exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  const themeId = label === 'Deep Current' ? 'deep-current'
    : label === 'PomOS' ? 'pom-neutral'
      : label === 'Bunny' ? 'bunny'
        : 'ash-amber';
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', themeId);
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('tab', { name: 'Scene' }).click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

async function openDeveloperTools(page: Page) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') === null) await page.getByText('Developer tools', { exact: true }).click();
}

async function closeDeveloperTools(page: Page) {
  const drawer = page.locator('[data-workbench-developer-drawer]');
  if (await drawer.getAttribute('open') !== null) await page.getByText('Developer tools', { exact: true }).click();
}

async function openPanelCreateDialog(page: Page) {
  await openDeveloperTools(page);
  const launchers = page.getByRole('button', { name: 'Create Panel' });
  for (let index = 0; index < await launchers.count(); index += 1) {
    if (!await launchers.nth(index).isVisible()) continue;
    await launchers.nth(index).click();
    const drawer = page.locator('[data-workbench-developer-drawer]');
    await drawer.evaluate((node: HTMLDetailsElement) => { node.open = false; });
    return page.getByRole('dialog', { name: 'Create a Panel' });
  }
  throw new Error('Expected a visible Create Panel launcher.');
}

async function seedOverflowingPanels(page: Page) {
  await openDeveloperTools(page);
  for (const name of [
    'Archive Ledger and Canon Continuity',
    'Lore Compendium and World Reference',
    'Character Roster and Relationship Matrix',
    'Master Timeline and Session Chronology',
    'Session Notes and Narrative Threads'
  ]) {
    const launchers = page.getByRole('button', { name: 'Create Panel' });
    let opened = false;
    for (let index = 0; index < await launchers.count(); index += 1) {
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
  await expect(page.getByRole('tablist', { name: 'Panels' }).getByRole('tab')).toHaveCount(8);
}

async function seedOverflowingSubPanels(page: Page) {
  const settings = page.getByRole('tab', { name: 'Settings' });
  await settings.focus();
  await settings.press('Enter');
  await expect(settings).toHaveAttribute('aria-selected', 'true');
  for (const name of [
    'Research Notes: Narrative Continuity Archive',
    reviewedLongSubPanelName,
    'Continuity Index'
  ]) {
    await page.getByRole('button', { name: 'Add sub-panel' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create sub-panel' });
    await dialog.getByLabel('Sub-panel name').fill(name);
    await dialog.getByRole('button', { name: 'Apply' }).click();
  }
  await expect(page.getByRole('tablist', { name: 'Settings sub-panels' }).getByRole('tab')).toHaveCount(9);
}

async function seedOverflowingRails(page: Page) {
  await seedOverflowingPanels(page);
  await seedOverflowingSubPanels(page);
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

async function setRailPosition(rail: ReturnType<Page['locator']>, position: 'start' | 'middle' | 'end') {
  await rail.evaluate((node, requested) => {
    const maximum = node.scrollWidth - node.clientWidth;
    node.scrollLeft = requested === 'start' ? 0 : requested === 'middle' ? maximum / 2 : maximum;
    node.dispatchEvent(new Event('scroll'));
  }, position);
}

async function panRail(page: Page, rail: ReturnType<Page['locator']>) {
  await setRailPosition(rail, 'start');
  const start = await rail.evaluate((node) => {
    const railRect = node.getBoundingClientRect();
    const candidates = [...node.querySelectorAll<HTMLElement>('[role="tab"]')]
      .map((tab) => tab.getBoundingClientRect())
      .filter((rect) => Math.min(rect.right, railRect.right) - Math.max(rect.left, railRect.left) >= 24);
    const target = candidates.at(-1);
    if (!target) return null;
    return {
      x: Math.min(target.right - 8, railRect.right - 8),
      y: target.top + target.height / 2,
      deltaX: Math.min(96, Math.max(16, Math.min(target.right - 8, railRect.right - 8) - railRect.left - 8))
    };
  });
  if (!start) throw new Error('Expected a visible tab target for rail panning.');
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - start.deltaX, start.y, { steps: 8 });
  await page.mouse.up();
  expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
}

async function proveRailGeometry(page: Page, viewport: { name: string; width: number; height: number }) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await settle(page);

  const panelRail = page.locator('[data-tab-rail-scroll][aria-label="Panels"]');
  const panelOrder = await panelRail.getByRole('tab').allTextContents();
  const catalog = page.locator('[data-pom-action="open-catalog"]:visible');
  const catalogBefore = await catalog.boundingBox();
  const panelExtent = await panelRail.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }));
  expect(panelExtent.scroll, `${viewport.name} Panel rail overflow`).toBeGreaterThan(panelExtent.client);
  await panRail(page, panelRail);
  await expect(panelRail.getByRole('tab')).toHaveText(panelOrder);
  const catalogAfter = await catalog.boundingBox();
  if (!catalogBefore || !catalogAfter) throw new Error(`Missing ${viewport.name} fixed Catalog geometry.`);
  expect(Math.abs(catalogAfter.x - catalogBefore.x), `${viewport.name} Catalog x`).toBeLessThanOrEqual(1);
  expect(await panelRail.evaluate((node) => node.contains(document.querySelector('[data-pom-action="open-catalog"]')))).toBe(false);
  await setRailPosition(panelRail, 'start');
  await expect.poll(() => panelRail.getAttribute('data-overflow-before')).toBe('false');
  await expect.poll(() => panelRail.getAttribute('data-overflow-after')).toBe('true');
  await setRailPosition(panelRail, 'middle');
  await expect.poll(() => panelRail.getAttribute('data-overflow-before')).toBe('true');
  await expect.poll(() => panelRail.getAttribute('data-overflow-after')).toBe('true');
  await setRailPosition(panelRail, 'end');
  await expect.poll(() => panelRail.getAttribute('data-overflow-after')).toBe('false');
  await setRailPosition(panelRail, 'start');
  await panelRail.evaluate((node: HTMLElement) => node.focus());
  await panelRail.getByRole('tab').last().evaluate((node: HTMLElement) => node.focus());
  await expect.poll(() => panelRail.evaluate((node) => node.scrollLeft), {
    message: `${viewport.name} Panel auto-reveal`
  }).toBeGreaterThan(0);

  const settings = page.getByRole('tab', { name: 'Settings' });
  await settings.evaluate((node: HTMLButtonElement) => {
    node.focus();
    node.click();
    node.click();
  });
  await expect(settings).toHaveAttribute('aria-selected', 'true');
  const subPanelRail = page.locator('[data-tab-rail-scroll][aria-label="Settings sub-panels"]');
  const subPanelOrder = await subPanelRail.getByRole('tab').allTextContents();
  const add = page.getByRole('button', { name: 'Add sub-panel' });
  const addBefore = await add.boundingBox();
  const subPanelExtent = await subPanelRail.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }));
  expect(subPanelExtent.scroll, `${viewport.name} sub-panel rail overflow`).toBeGreaterThan(subPanelExtent.client);
  await panRail(page, subPanelRail);
  await expect(subPanelRail.getByRole('tab')).toHaveText(subPanelOrder);
  const addAfter = await add.boundingBox();
  if (!addBefore || !addAfter) throw new Error(`Missing ${viewport.name} fixed Add geometry.`);
  expect(Math.abs(addAfter.x - addBefore.x), `${viewport.name} Add x`).toBeLessThanOrEqual(1);
  expect(await subPanelRail.evaluate((node) => node.contains(document.querySelector('[aria-label="Add sub-panel"]')))).toBe(false);
  await setRailPosition(subPanelRail, 'start');
  await expect.poll(() => subPanelRail.getAttribute('data-overflow-before')).toBe('false');
  await expect.poll(() => subPanelRail.getAttribute('data-overflow-after')).toBe('true');
  await setRailPosition(subPanelRail, 'middle');
  await expect.poll(() => subPanelRail.getAttribute('data-overflow-before')).toBe('true');
  await expect.poll(() => subPanelRail.getAttribute('data-overflow-after')).toBe('true');
  await setRailPosition(subPanelRail, 'end');
  await expect.poll(() => subPanelRail.getAttribute('data-overflow-after')).toBe('false');
  await setRailPosition(subPanelRail, 'start');
  await subPanelRail.evaluate((node: HTMLElement) => node.focus());
  await subPanelRail.getByRole('tab').last().evaluate((node: HTMLElement) => node.focus());
  await expect.poll(() => subPanelRail.evaluate((node) => node.scrollLeft), {
    message: `${viewport.name} sub-panel auto-reveal`
  }).toBeGreaterThan(0);

  const containment = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth
  }));
  expect(containment.documentWidth, `${viewport.name} document overflow`).toBeLessThanOrEqual(containment.viewportWidth + 1);
}

async function compactActionButtonMetrics(actions: ReturnType<Page['locator']>) {
  return actions.getByRole('button').evaluateAll((buttons) => {
    type Color = { r: number; g: number; b: number; a: number };
    const parse = (value: string): Color => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new Error(`Unsupported computed color: ${value}`);
      return { r: channels[0]!, g: channels[1]!, b: channels[2]!, a: channels[3] ?? 1 };
    };
    const composite = (top: Color, bottom: Color): Color => {
      const alpha = top.a + bottom.a * (1 - top.a);
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
        a: alpha
      };
    };
    const luminance = (color: Color) => {
      const linear = [color.r, color.g, color.b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };

    return buttons.map((button) => {
      const style = getComputedStyle(button);
      const surfaceStyle = getComputedStyle(button.parentElement!);
      const rawBackground = parse(style.backgroundColor);
      const background = composite(rawBackground, parse(surfaceStyle.backgroundColor));
      const foreground = composite(parse(style.color), background);
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return {
        label: button.textContent?.trim() ?? '',
        foreground: style.color,
        background: style.backgroundColor,
        contrast: Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100,
        nativeButtonFace: rawBackground.a === 1
          && Math.max(rawBackground.r, rawBackground.g, rawBackground.b) - Math.min(rawBackground.r, rawBackground.g, rawBackground.b) <= 1
          && rawBackground.r >= 238
          && rawBackground.r <= 242
      };
    });
  });
}

async function compactOrderGeometry(order: ReturnType<Page['locator']>) {
  return order.getByRole('listitem').evaluateAll((items) => items.flatMap((item, index) => {
    const row = item.getBoundingClientRect();
    const children = Array.from(item.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    const problems: string[] = [];
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      const label = child.getAttribute('aria-label') ?? child.textContent?.trim() ?? child.className;
      if (rect.left < row.left - 0.5 || rect.right > row.right + 0.5 || rect.top < row.top - 0.5 || rect.bottom > row.bottom + 0.5) {
        problems.push(`row ${index + 1} ${label} escapes ${Math.round(row.width)}x${Math.round(row.height)} row with ${Math.round(rect.width)}x${Math.round(rect.height)} child`);
      }
    }
    for (let left = 0; left < children.length; left += 1) {
      const a = children[left]!.getBoundingClientRect();
      for (let right = left + 1; right < children.length; right += 1) {
        const b = children[right]!.getBoundingClientRect();
        if (a.right > b.left + 0.5 && b.right > a.left + 0.5 && a.bottom > b.top + 0.5 && b.bottom > a.top + 0.5) {
          problems.push(`row ${index + 1} child ${left + 1} overlaps child ${right + 1}`);
        }
      }
    }
    const handle = item.querySelector<HTMLElement>('[data-tab-order-handle]')?.getBoundingClientRect();
    if (!handle || handle.width < 44 || handle.height < 44) problems.push(`row ${index + 1} handle is smaller than 44px`);
    return problems;
  }));
}

async function openSubPanelActions(page: Page) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const rail = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const target = rail.getByRole('tab').first();
  const targetName = await target.textContent();
  if (!targetName) throw new Error('Expected a compact sub-panel action target.');
  await target.click({ button: 'right' });
  const actions = page.getByRole('dialog', { name: `${targetName} sub-panel actions` });
  await expect(actions).toBeVisible();
  return { actions, target };
}

async function proveExactContextAndReorder(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'Scene' }).click();
  const library = page.getByRole('tab', { name: 'Library' });
  await library.click({ button: 'right' });
  await expect(page.getByRole('dialog', { name: 'Library Panel actions' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Scene' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');

  await page.getByRole('tab', { name: 'Settings' }).click();
  const rail = page.getByRole('tablist', { name: 'Settings sub-panels' });
  const tabs = rail.getByRole('tab');
  const names = await tabs.allTextContents();
  const active = rail.locator('[role="tab"][aria-selected="true"]');
  const target = tabs.nth(1);
  const targetName = names[1];
  if (!targetName) throw new Error('Expected an inactive sub-panel context target.');
  await target.click({ button: 'right' });
  const actions = page.getByRole('dialog', { name: `${targetName} sub-panel actions` });
  await expect(actions).toBeVisible();
  await expect(active).toHaveCount(1);
  await actions.getByRole('button', { name: 'Reorder sub-panels…' }).click();
  const orderDialog = page.getByRole('dialog', { name: 'Reorder Settings sub-panels' });
  const orderList = orderDialog.getByRole('list', { name: 'Settings sub-panels order' });
  await expect(orderList.getByRole('listitem')).toHaveCount(9);
  await orderDialog.getByRole('button', { name: `Move ${targetName} down` }).press('Enter');
  const moved = [...names];
  [moved[1], moved[2]] = [moved[2]!, moved[1]!];
  await expect(tabs).toHaveText(moved);
  await orderDialog.getByRole('button', { name: `Move ${targetName} up` }).press('Enter');
  await expect(tabs).toHaveText(names);
  await orderDialog.getByRole('button', { name: 'Done' }).click();
  await expect(target).toBeFocused();
}

async function invokeCompactChromeAction(page: Page, name: string) {
  const action = page.getByRole('button', { name });
  await action.focus();
  await expect(action).toBeVisible();
  await action.press('Enter');
}

async function invokeWidgetAction(page: Page, widget: ReturnType<Page['locator']>, name: string) {
  const group = widget.locator('xpath=ancestor::section[@data-widget-group][1]');
  const surface = await group.count()
    ? group.getByRole('tab', { selected: true })
    : widget.locator(':scope > header[data-widget-drag-surface], :scope > .widget-frame > header[data-widget-drag-surface]').first();
  await surface.click({ button: 'right' });
  await page.getByRole('menu').getByRole('menuitem', { name }).press('Enter');
}

async function openAppearanceSettings(page: Page) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  const selector = page.locator('[data-sub-panel-selector-trigger]');
  if (await selector.isVisible()) {
    await selector.click();
    await page.getByRole('option', { name: 'Appearance and Accessibility' }).click();
  } else {
    await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
  }
}

async function setMaterialControls(page: Page, values: readonly [number, number, number, number]) {
  await openAppearanceSettings(page);
  const themeSettings = page.getByRole('article', { name: 'Theme Materials' });
  for (const [label, value] of [
    ['Glass Density', values[0]],
    ['Bar Opacity', values[1]],
    ['Selected Strength', values[2]],
    ['Frost Level', values[3]]
  ] as const) {
    const control = themeSettings.getByRole('slider', { name: label });
    await control.fill(String(value));
    await expect(control).toHaveValue(String(value));
  }
  await page.getByRole('tab', { name: 'Scene' }).click();
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.scrollTo(0, 0);
  });
}

const shot = (page: Page, name: string) => expect(page).toHaveScreenshot(name, {
  animations: 'disabled',
  caret: 'hide',
  fullPage: false
});

for (const theme of maintainedThemes) {
  test(`${theme.label} visually composes the responsive Panel template picker`, async ({ page }) => {
    await fresh(page, 1200, 800);
    await selectTheme(page, theme.label);
    let dialog = await openPanelCreateDialog(page);
    await expect(dialog.locator('[data-panel-template-card]')).toHaveCount(3);
    await expect(dialog).toHaveScreenshot(`create-panel-${theme.slug}.png`, {
      animations: 'disabled',
      caret: 'hide'
    });

    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await settle(page);
    dialog = await openPanelCreateDialog(page);
    await expect(dialog).toHaveScreenshot(`create-panel-${theme.slug}-compact.png`, {
      animations: 'disabled',
      caret: 'hide'
    });
  });
}

test('native workbench stable mockup surfaces', async ({ page }) => {
  await fresh(page, 1440, 900);
  await shot(page, 'wide-scene.png');

  await openAppearanceSettings(page);
  await shot(page, 'wide-material-controls.png');
  await page.getByRole('tab', { name: 'Scene' }).click();

  await invokeCompactChromeAction(page, 'Open Widget Catalog');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  await shot(page, 'wide-catalog-expanded.png');
  await catalog.getByRole('button', { name: 'Close Widget Catalog' }).click();

  await invokeCompactChromeAction(page, 'Focus reading');
  await page.getByRole('button', { name: 'Focus reading' }).evaluate((button: HTMLButtonElement) => button.blur());
  await shot(page, 'focus-transcript.png');

  await fresh(page, 390, 844);
  await shot(page, 'compact-scene.png');
  await openAppearanceSettings(page);
  await shot(page, 'compact-settings.png');

  await fresh(page, 1440, 900);
  await invokeWidgetAction(page, page.getByRole('article', { name: 'Room Ambience' }), 'Float');
  await shot(page, 'floating-widget.png');
  await page.getByRole('tab', { name: 'Library' }).click();
  await shot(page, 'renderer-error.png');
});

test('Deep Current freezes the polished wide Panel action surface', async ({ page }) => {
  await fresh(page, 1440, 900);
  await page.getByRole('tab', { name: 'Scene' }).click({ button: 'right' });
  await expect(page.getByRole('dialog', { name: 'Scene Panel actions' })).toBeVisible();
  await shot(page, 'wide-panel-actions-deep-current.png');
});

test('Deep Current freezes the expanded source-authority Catalog at 1920x1080', async ({ page }) => {
  await fresh(page, 1920, 1080);
  await selectTheme(page, 'Deep Current');
  await invokeCompactChromeAction(page, 'Open Widget Catalog');
  const catalog = page.getByRole('dialog', { name: 'Widget Catalog' });
  await expect(catalog).toHaveAttribute('data-presentation', 'expanded');
  await expect(catalog.locator('[data-catalog-result]')).toHaveCount(98);
  await expect(catalog.locator('.catalog-widget-preview')).toHaveCount(98);
  await shot(page, 'deep-current-catalog-expanded-1920x1080.png');
});

test('Deep Current freezes reviewed phone and mobile desktop-site compositions', async ({ browser }) => {
  for (const target of [
    { name: 'deep-mobile-scene.png', viewport: { width: 390, height: 844 }, isMobile: true },
    { name: 'deep-mobile-desktop-site.png', viewport: { width: 980, height: 720 }, isMobile: false }
  ]) {
    const context = await browser.newContext({
      viewport: target.viewport,
      hasTouch: true,
      isMobile: target.isMobile
    });
    const page = await context.newPage();
    await fresh(page, target.viewport.width, target.viewport.height);
    await expect.poll(() => page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await shot(page, target.name);
    await context.close();
  }
});

test('Deep Current freezes the authored bottom-edge toolbar controls', async ({ page }) => {
  await fresh(page, 408, 844);
  await openAppearanceSettings(page);
  await page.getByRole('group', { name: 'Toolbar controls' })
    .getByRole('radio', { name: 'Bottom-edge chevrons' })
    .click();
  await page.getByRole('tab', { name: 'Scene' }).click();
  const leftDock = page.locator('[data-conformance-region="left"]');
  if (!await leftDock.isVisible()) await page.locator('.toolbar-edge-toggle-left').click();
  await expect(leftDock).toBeVisible();
  await shot(page, 'deep-mobile-bottom-edge-chevrons.png');
});

test('Theme Settings freezes the focused wide and compact authoring surfaces', async ({ page }) => {
  await fresh(page, 1440, 900);
  await openAppearanceSettings(page);
  await shot(page, 'wide-theme-settings.png');
  for (const theme of [
    { label: 'PomOS' as const, id: 'pom-neutral' },
    { label: 'Bunny' as const, id: 'bunny' },
    { label: 'Ash & Amber' as const, id: 'ash-amber' }
  ]) {
    await selectTheme(page, theme.label);
    await openAppearanceSettings(page);
    await shot(page, `wide-theme-settings-${theme.id}.png`);
  }

  await fresh(page, 390, 844);
  await openAppearanceSettings(page);
  await invokeWidgetAction(page, page.locator('[data-widget-type="settings.theme-colors"]'), 'Focus Widget');
  await expect(page.getByRole('dialog', { name: 'Focused Theme Colors' })).toBeVisible();
  await shot(page, 'compact-theme-settings.png');
});

test('native workbench exposes the two original visual flexibility targets', async ({ page }) => {
  for (const theme of [
    { label: 'PomOS' as const, name: 'pom-neutral' },
    { label: 'Bunny' as const, name: 'bunny' }
  ]) {
    await fresh(page, 1440, 900);
    await selectTheme(page, theme.label);
    await shot(page, `wide-${theme.name}.png`);

    await fresh(page, 390, 844);
    await selectTheme(page, theme.label);
    await shot(page, `compact-${theme.name}.png`);

    await fresh(page, 1440, 900);
    await selectTheme(page, theme.label);
    await invokeCompactChromeAction(page, 'Open Widget Catalog');
    await shot(page, `wide-catalog-${theme.name}.png`);
  }
});

test('PomOS freezes short desktop, landscape, and zoom-equivalent fidelity', async ({ page }) => {
  for (const viewport of [
    { name: 'short-desktop-pom-neutral.png', width: 1280, height: 720 },
    { name: 'short-landscape-pom-neutral.png', width: 844, height: 390 },
    { name: 'zoom-200-pom-neutral.png', width: 800, height: 450 }
  ]) {
    await fresh(page, viewport.width, viewport.height);
    await selectTheme(page, 'PomOS');
    await shot(page, viewport.name);
  }
});

test('Ash and Amber freezes the reviewed wide, compact, and Catalog target states', async ({ page }) => {
  await fresh(page, 1920, 1280);
  await selectTheme(page, 'Ash & Amber');
  await shot(page, 'wide-ash-amber.png');

  await fresh(page, 390, 844);
  await selectTheme(page, 'Ash & Amber');
  await shot(page, 'compact-ash-amber.png');

  await fresh(page, 1440, 900);
  await selectTheme(page, 'Ash & Amber');
  await invokeCompactChromeAction(page, 'Open Widget Catalog');
  await shot(page, 'wide-catalog-ash-amber.png');
});

test('material stress states stay coherent at wide and compact viewports', async ({ page }) => {
  for (const state of [
    { label: 'Deep Current' as const, name: 'zero-deep-current', values: [0, 0, 0, 0] as const },
    { label: 'PomOS' as const, name: 'adjusted-pom-neutral', values: [68, 54, 20, 42] as const },
    { label: 'Bunny' as const, name: 'full-bunny', values: [100, 100, 100, 100] as const }
  ]) {
    await fresh(page, 1440, 900);
    await selectTheme(page, state.label);
    await setMaterialControls(page, state.values);
    await shot(page, `wide-material-${state.name}.png`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      window.scrollTo(0, 0);
    });
    await shot(page, `compact-material-${state.name}.png`);
  }
});

for (const viewport of [
  { name: 'small phone portrait', width: 320, height: 568 },
  { name: 'large phone portrait', width: 430, height: 932 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: 'tablet desktop-site', width: 980, height: 720 },
  { name: '200%-equivalent', width: 800, height: 450 }
]) {
  test(`all maintained themes preserve overflowing rails at ${viewport.name}`, async ({ browser }, testInfo) => {
    testInfo.setTimeout(180_000);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true, isMobile: false });
    const page = await context.newPage();
    try {
      await fresh(page, 1440, 900);
      await seedOverflowingRails(page);
      const mountedRoot = await page.locator('main[data-pom-theme-root]').elementHandle();
      if (!mountedRoot) throw new Error('Expected the mounted coarse Workbench theme root.');
      await expect.poll(() => page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
      for (const theme of maintainedThemes) {
        await test.step(theme.label, async () => {
          await selectTheme(page, theme.label);
          await expect(page.locator('main')).toHaveAttribute('data-pom-theme', theme.id);
          expect(await mountedRoot.evaluate((node) => node === document.querySelector('main[data-pom-theme-root]'))).toBe(true);
          await proveRailGeometry(page, { ...viewport, name: `${theme.slug} ${viewport.name}` });
        });
      }
    } finally {
      await context.close();
    }
  });
}

test('all maintained themes preserve exact context and explicit reorder on phone', async ({ browser }, testInfo) => {
  testInfo.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  try {
    await fresh(page, 1440, 900);
    await seedOverflowingRails(page);
    const mountedRoot = await page.locator('main[data-pom-theme-root]').elementHandle();
    if (!mountedRoot) throw new Error('Expected the mounted phone Workbench theme root.');
    for (const theme of maintainedThemes) {
      await test.step(theme.label, async () => {
        await selectTheme(page, theme.label);
        expect(await mountedRoot.evaluate((node) => node === document.querySelector('main[data-pom-theme-root]'))).toBe(true);
        await proveExactContextAndReorder(page);
      });
    }
  } finally {
    await context.close();
  }
});

test('all maintained themes keep compact action sheets readable', async ({ browser }, testInfo) => {
  testInfo.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  try {
    await fresh(page, 1440, 900);
    await seedOverflowingRails(page);
    const failures: string[] = [];
    for (const theme of maintainedThemes) {
      await selectTheme(page, theme.label);
      await page.setViewportSize({ width: 430, height: 932 });
      const { actions } = await openSubPanelActions(page);
      for (const metric of await compactActionButtonMetrics(actions)) {
        if (metric.nativeButtonFace) failures.push(`${theme.label} ${metric.label}: native ${metric.background}`);
        if (metric.contrast < 4.5) {
          failures.push(`${theme.label} ${metric.label}: ${metric.contrast}:1 (${metric.foreground} on ${metric.background})`);
        }
      }
      await page.keyboard.press('Escape');
    }
    expect(failures).toEqual([]);
  } finally {
    await context.close();
  }
});

test('all maintained themes keep long reorder labels separate at 390 and 430', async ({ browser }, testInfo) => {
  testInfo.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true, isMobile: false });
  const page = await context.newPage();
  try {
    await fresh(page, 1440, 900);
    await seedOverflowingRails(page);
    const failures: string[] = [];
    for (const theme of maintainedThemes) {
      await selectTheme(page, theme.label);
      await page.setViewportSize({ width: 430, height: 932 });
      const { actions } = await openSubPanelActions(page);
      await actions.getByRole('button', { name: 'Reorder sub-panels…' }).click();
      const order = page.getByRole('dialog', { name: 'Reorder Settings sub-panels' });
      const names = await order.locator('.tab-order-name').allTextContents();
      expect(names.some((name) => name.length >= 36)).toBe(true);
      for (const width of [390, 430]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 932 });
        await settle(page);
        for (const problem of await compactOrderGeometry(order)) failures.push(`${theme.label} ${width}px: ${problem}`);
      }
      await order.getByRole('button', { name: 'Done' }).click();
    }
    expect(failures).toEqual([]);
  } finally {
    await context.close();
  }
});

test('all maintained themes preserve overflowing rails at wide desktop', async ({ browser }, testInfo) => {
  testInfo.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });
  const page = await context.newPage();
  try {
    await fresh(page, 1440, 900);
    await seedOverflowingRails(page);
    const mountedRoot = await page.locator('main[data-pom-theme-root]').elementHandle();
    if (!mountedRoot) throw new Error('Expected the mounted wide Workbench theme root.');
    await expect.poll(() => page.evaluate(() => matchMedia('(pointer: fine)').matches)).toBe(true);
    for (const theme of maintainedThemes) {
      await test.step(theme.label, async () => {
        await selectTheme(page, theme.label);
        await expect(page.locator('main')).toHaveAttribute('data-pom-theme', theme.id);
        expect(await mountedRoot.evaluate((node) => node === document.querySelector('main[data-pom-theme-root]'))).toBe(true);
        await proveRailGeometry(page, { name: `${theme.slug} wide desktop`, width: 1440, height: 900 });
      });
    }
  } finally {
    await context.close();
  }
});

test('all maintained themes freeze phone rails, actions, ordering, and desktop overflow', async ({ page }, testInfo) => {
  testInfo.setTimeout(300_000);
  await fresh(page, 1440, 900);
  await seedOverflowingRails(page);
  const mountedRoot = await page.locator('main[data-pom-theme-root]').elementHandle();
  if (!mountedRoot) throw new Error('Expected the mounted visual Workbench theme root.');

  for (const theme of maintainedThemes) {
    await page.setViewportSize({ width: 430, height: 932 });
    await selectTheme(page, theme.label);
    expect(await mountedRoot.evaluate((node) => node === document.querySelector('main[data-pom-theme-root]'))).toBe(true);
    await page.getByRole('tab', { name: 'Settings' }).click();
    const panelRail = page.locator('[data-tab-rail-scroll][aria-label="Panels"]');
    const subPanelRail = page.locator('[data-tab-rail-scroll][aria-label="Settings sub-panels"]');
    await setRailPosition(panelRail, 'middle');
    await setRailPosition(subPanelRail, 'middle');
    await settle(page);
    await shot(page, `rails-phone-${theme.slug}.png`);

    const target = subPanelRail.getByRole('tab').first();
    const targetName = await target.textContent();
    if (!targetName) throw new Error(`Expected ${theme.label} sub-panel action target.`);
    await target.click({ button: 'right' });
    const actions = page.getByRole('dialog', { name: `${targetName} sub-panel actions` });
    await expect(actions).toBeVisible();
    await shot(page, `actions-phone-${theme.slug}.png`);

    await page.keyboard.press('Escape');
    await subPanelRail.getByRole('tab', { name: reviewedLongSubPanelName }).click();
    await target.click({ button: 'right' });
    await expect(actions).toBeVisible();
    await actions.getByRole('button', { name: 'Reorder sub-panels…' }).click();
    const order = page.getByRole('dialog', { name: 'Reorder Settings sub-panels' });
    await expect(order.getByRole('listitem')).toHaveCount(9);
    const reviewedRow = order.getByRole('listitem').filter({ hasText: reviewedLongSubPanelName });
    await expect(reviewedRow.locator('.tab-order-active')).toHaveText('Active');
    await reviewedRow.scrollIntoViewIfNeeded();
    expect(await reviewedRow.evaluate((row) => {
      const rowRect = row.getBoundingClientRect();
      const listRect = row.parentElement!.getBoundingClientRect();
      return rowRect.top >= listRect.top - 0.5 && rowRect.bottom <= listRect.bottom + 0.5;
    })).toBe(true);
    await shot(page, `order-phone-${theme.slug}.png`);
    await order.getByRole('button', { name: 'Done' }).click();
    await subPanelRail.getByRole('tab', { name: 'Continuity Index' }).click();

    await page.setViewportSize({ width: 1440, height: 900 });
    await setRailPosition(panelRail, 'middle');
    await setRailPosition(subPanelRail, 'middle');
    await settle(page);
    await shot(page, `overflow-wide-${theme.slug}.png`);
  }
});
