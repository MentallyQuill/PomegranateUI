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
  const tabs = page.getByRole('tablist', { name: 'Panels' }).getByRole('tab');
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

test('Atmospheric composition keeps developer chrome out of the default stage and keyboard reachable', async ({ page }) => {
  await openFresh(page, 1600, 900);
  await expect(page.locator('.context-rail, .lab-footer')).toHaveCount(0);
  const drawer = page.locator('[data-workbench-developer-drawer]');
  await expect(drawer).not.toHaveAttribute('open', '');
  const launcher = page.getByText('Developer tools', { exact: true });
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(drawer).toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Save layout' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveAttribute('open', '');
  await expect(launcher).toBeFocused();

  const transcript = page.locator('[data-widget-type="story.transcript"]');
  await expect(transcript.locator('[data-pom-part="widget.surface"]')).toHaveCount(0);
  await expect(transcript.locator('.transcript')).toBeVisible();
  await expect(page.locator('[data-story-composer] textarea')).toBeVisible();
});

test('all themes keep centered story prose aligned with the composer instrument', async ({ page }) => {
  await openFresh(page, 1600, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await page.getByText('Developer tools', { exact: true }).click();

    const geometry = await page.evaluate(() => {
      const box = (selector: string) => {
        const node = document.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`Missing alignment owner: ${selector}`);
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          center: (rect.left + rect.right) / 2
        };
      };
      const field = document.querySelector<HTMLElement>('[data-widget-type="story.composer"] .composer-field');
      if (!field) throw new Error('Missing composer field');
      return {
        stage: box('[data-conformance-region="stage"]'),
        prose: box('[data-widget-type="story.transcript"] .transcript > p:not(.widget-kicker)'),
        transcript: box('[data-widget-type="story.transcript"] .widget-frame'),
        composer: box('[data-widget-type="story.composer"] .composer'),
        field: box('[data-widget-type="story.composer"] .composer-field'),
        textarea: box('[data-widget-type="story.composer"] textarea'),
        fieldDisplay: getComputedStyle(field).display
      };
    });

    expect(Math.abs(geometry.transcript.center - geometry.stage.center), `${theme} transcript center`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.prose.center - geometry.stage.center), `${theme} prose center`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.composer.center - geometry.stage.center), `${theme} composer center`).toBeLessThanOrEqual(1);
    expect(
      Math.abs((geometry.prose.left - geometry.composer.left) - (geometry.composer.right - geometry.prose.right)),
      `${theme} prose inset within composer`
    ).toBeLessThanOrEqual(1);
    expect(geometry.fieldDisplay, `${theme} composer field layout`).toBe('grid');
    expect(Math.abs(geometry.textarea.left - (geometry.field.left + 12)), `${theme} textarea left inset`).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.textarea.right - (geometry.field.right - 12)), `${theme} textarea right inset`).toBeLessThanOrEqual(1);
  }
});

test('all themes keep story prose inside the visible reading stage', async ({ page }) => {
  for (const viewport of [
    { name: 'wide', width: 1440, height: 900 },
    { name: 'short landscape', width: 844, height: 390 }
  ]) {
    await openFresh(page, viewport.width, viewport.height);
    await page.locator('[data-widget-type="story.transcript"] [data-pom-part="widget.content"]')
      .evaluateAll((nodes) => {
        for (const node of nodes as HTMLElement[]) {
          node.style.fontSize = '17px';
          node.style.lineHeight = '1.4';
          node.style.letterSpacing = '.01em';
        }
      });

    for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
      await page.getByText('Developer tools', { exact: true }).click();
      await page.getByRole('group', { name: 'Visual target' })
        .getByRole('button', { name: theme, exact: true })
        .click();
      await page.getByText('Developer tools', { exact: true }).click();

      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const node = document.querySelector<HTMLElement>(selector);
          if (!node) throw new Error(`Missing visibility owner: ${selector}`);
          const box = node.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        };
        return {
          stage: rect('[data-conformance-region="stage"]'),
          transcript: rect('[data-widget-type="story.transcript"]'),
          prose: rect('[data-widget-type="story.transcript"] .transcript')
        };
      });

      const transcriptIntersection = Math.max(
        0,
        Math.min(geometry.stage.bottom, geometry.transcript.bottom)
          - Math.max(geometry.stage.top, geometry.transcript.top)
      );
      const proseIntersection = Math.max(
        0,
        Math.min(geometry.stage.bottom, geometry.prose.bottom)
          - Math.max(geometry.stage.top, geometry.prose.top)
      );
      expect(transcriptIntersection, `${theme} transcript intersects the ${viewport.name} stage`).toBeGreaterThan(0);
      expect(proseIntersection, `${theme} prose intersects the ${viewport.name} stage`).toBeGreaterThan(0);
    }
  }
});

test('reduced motion removes themed Widget action-rail transitions', async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await openFresh(page, 1440, 900);

  for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
    await page.getByText('Developer tools', { exact: true }).click();
    await page.getByRole('group', { name: 'Visual target' })
      .getByRole('button', { name: theme, exact: true })
      .click();
    await page.getByText('Developer tools', { exact: true }).click();

    const transition = await page.locator('[data-widget-type="story.characters"]')
      .getByRole('navigation')
      .evaluate((nav) => {
        const style = getComputedStyle(nav);
        return { duration: style.transitionDuration, property: style.transitionProperty };
      });
    expect(transition, `${theme} reduced-motion action rail`).toEqual({ duration: '0s', property: 'none' });
  }
});

test('native workbench Catalog supports keyboard placement and stable attributes', async ({ page }) => {
  await openFresh(page, 1024, 768);
  const launcher = page.getByRole('button', { name: 'Open Widget Catalog', includeHidden: true });
  await launcher.focus();
  await expect(launcher).toBeVisible();
  await launcher.press('Enter');
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
  await page.getByText('Developer tools', { exact: true }).click();

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
      shelf: rect('.top-shelf'),
      workbench: rect('.workbench-shell')
    };
  });
  expect(evidence.scrollY).toBe(0);
  expect(evidence.mainScrollTop).toBe(0);
  expect(evidence.documentHeight).toBe(evidence.viewportHeight);
  expect(evidence.shelf.top).toBeGreaterThanOrEqual(0);
  expect(evidence.shelf.height).toBeGreaterThanOrEqual(40);
  expect(evidence.workbench.top).toBeGreaterThanOrEqual(evidence.shelf.bottom);
});

for (const viewport of [
  { name: 'wide', width: 1440, height: 900 },
  { name: 'medium', width: 1024, height: 768 },
  { name: 'compact', width: 390, height: 844 }
]) {
  test(`native workbench ${viewport.name} surface has no horizontal overflow`, async ({ page }) => {
    await openFresh(page, viewport.width, viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('tablist', { name: 'Panels' }).getByRole('tab')).toHaveCount(3);
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
  await page.getByText('Developer tools', { exact: true }).click();
  const launcher = page.getByRole('button', { name: 'Create Panel' });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
});
