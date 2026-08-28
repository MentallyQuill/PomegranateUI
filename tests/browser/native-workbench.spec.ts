import { expect, test } from '@playwright/test';

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
  await expect(page.getByRole('status', { name: 'Library renderer unavailable' })).toBeVisible();
});

test('native workbench POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {
  const leftDock = page.locator('[data-pomegranate-dock="left"]');
  await expect(leftDock.getByRole('article')).toHaveCount(2);
  const world = page.getByRole('article', { name: 'World State' });
  await world.getByRole('button', { name: 'Dock left' }).click();
  await expect(leftDock.getByRole('article')).toHaveCount(3);
  await expect(leftDock.getByRole('article').nth(0)).toHaveAttribute('aria-label', 'Characters (Story)');
  await expect(leftDock.getByRole('article').nth(1)).toHaveAttribute('aria-label', 'Theme Settings');
  await expect(leftDock.getByRole('article').nth(2)).toHaveAttribute('aria-label', 'World State');
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
  const neutral = themeTargets.getByRole('button', { name: 'Pom Neutral', exact: true });
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
      { label: 'Pom Neutral', id: 'pom-neutral', text: 'rgb(31, 37, 45)' },
      { label: 'Bunny', id: 'bunny', text: 'rgb(64, 55, 71)' }
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
