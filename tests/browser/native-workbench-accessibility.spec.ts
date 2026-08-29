import { expect, test, type Page } from '@playwright/test';

async function openFresh(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4174');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}

test('native workbench keeps literal relationships and keyboard reorder behavior', async ({ page }) => {
  await openFresh(page, 1440, 900);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  const scene = page.getByRole('tab', { name: 'Scene' });
  const scenePanelId = await scene.getAttribute('aria-controls');
  const sceneTabId = await scene.getAttribute('id');
  expect(scenePanelId).toBeTruthy();
  expect(sceneTabId).toBeTruthy();
  await expect(page.locator(`#${scenePanelId}`)).toHaveAttribute('aria-labelledby', sceneTabId!);
  await expect(scene.locator('xpath=..')).toHaveAttribute('data-pomegranate-panel-tab', 'scene');
  await page.getByRole('tab', { name: 'Library' }).press('ArrowLeft');
  await expect(tabs).toHaveText(['Library', 'Scene', 'Settings']);
  await expect(page.getByLabel('Active story identity')).toContainText('story-lab-reservoir');
});

test('native workbench Catalog supports keyboard placement and stable attributes', async ({ page }) => {
  await openFresh(page, 1024, 768);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
  await expect(catalog.getByRole('listitem')).toHaveCount(94);
  await catalog.getByRole('button', { name: 'Compact' }).click();
  await expect(catalog).toHaveAttribute('data-result-mode', 'compact');
  const add = catalog.getByRole('button', { name: 'Add Accessibility', exact: true });
  await add.focus();
  await add.press('Enter');
  await expect(page.getByRole('article', { name: 'Accessibility' })).toHaveAttribute('data-pomegranate-placement', 'docked');
  await expect(page.locator('[data-surface-type="settings.accessibility"]')).toHaveAttribute('data-surface-state', 'ready');
});

test('native workbench keeps persistence actions reachable at the medium breakpoint', async ({ page }) => {
  await openFresh(page, 1024, 768);

  for (const name of ['Save layout', 'Reload saved layout', 'Clear saved layout']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});

test('compact Panel changes keep chrome anchored and the document contained', async ({ page }) => {
  await openFresh(page, 390, 844);
  await page.screenshot({ animations: 'disabled', caret: 'hide' });
  await page.getByRole('tab', { name: 'Settings' }).click();

  const evidence = await page.evaluate(() => {
    function rect(selector: string) {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}.`);
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    }
    return {
      scrollY: window.scrollY,
      mainScrollTop: document.querySelector('main')?.scrollTop ?? -1,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      context: rect('.context-rail'),
      shelf: rect('.top-shelf')
    };
  });
  expect(evidence.scrollY).toBe(0);
  expect(evidence.mainScrollTop).toBe(0);
  expect(evidence.documentHeight).toBe(evidence.viewportHeight);
  expect(evidence.context.top).toBeGreaterThanOrEqual(0);
  expect(evidence.context.height).toBeGreaterThanOrEqual(126);
  expect(evidence.shelf.top).toBeGreaterThanOrEqual(evidence.context.bottom);
});

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'medium', width: 1024, height: 768 },
  { name: 'compact', width: 390, height: 844 }
]) {
  test(`native workbench ${viewport.name} surface has no horizontal overflow`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('article', { name: 'Transcript' })).toBeVisible();
  });
}

for (const viewport of [
  { name: 'authority wide', width: 1600, height: 900 },
  { name: 'authority medium', width: 1180, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'large phone', width: 430, height: 932 },
  { name: 'small phone', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: '200-percent zoom equivalent', width: 800, height: 450 }
]) {
  test(`Deep Current ${viewport.name} keeps the stage and composer reachable`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    const evidence = await page.evaluate(() => {
      const region = (id: string) => {
        const element = document.querySelector(`[data-conformance-region="${id}"]`);
        if (!(element instanceof HTMLElement)) throw new Error(`Missing ${id} region.`);
        const box = element.getBoundingClientRect();
        return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
      };
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        shelf: region('shelf'),
        left: region('left'),
        stage: region('stage'),
        right: region('right'),
        composer: region('composer')
      };
    });
    expect(evidence.documentWidth).toBeLessThanOrEqual(evidence.viewport.width);
    expect(evidence.documentHeight).toBeLessThanOrEqual(evidence.viewport.height);
    expect(evidence.composer.bottom).toBeLessThanOrEqual(evidence.viewport.height);
    expect(evidence.composer.top).toBeGreaterThanOrEqual(evidence.stage.top);
    expect(evidence.composer.left).toBeGreaterThanOrEqual(evidence.stage.left);
    expect(evidence.composer.right).toBeLessThanOrEqual(evidence.stage.right);
    if (viewport.width <= 860) {
      expect(evidence.left.width).toBeLessThanOrEqual(1);
      expect(evidence.right.width).toBeLessThanOrEqual(1);
    }
  });
}

test('native workbench exposes coarse-pointer targets separately from compact icons', async ({ page }) => {
  await openFresh(page, 390, 844);
  const style = await page.locator('body').evaluate(() => {
    const sheet = [...document.styleSheets].find((entry) => [...entry.cssRules].some((rule) => rule.cssText.includes('pointer: coarse')));
    return sheet ? [...sheet.cssRules].map((rule) => rule.cssText).join('\n') : '';
  });
  expect(style).toContain('min-height: 44px');
  expect(style).toContain('width: 44px');
});

test('Panel creation uses the browser modal top layer and restores focus', async ({ page }) => {
  await openFresh(page, 1024, 768);
  const launcher = page.getByRole('button', { name: 'Create Panel' });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
});
