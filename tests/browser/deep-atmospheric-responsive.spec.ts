import { expect, test, type Page, type TestInfo } from '@playwright/test';

const labOrigin = process.env.POM_LAB_ORIGIN ?? `http://127.0.0.1:${process.env.POM_PLAYWRIGHT_PORT ?? '4174'}`;

type Rectangle = { x: number; y: number; width: number; height: number; right: number; bottom: number };

async function fresh(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(labOrigin, { waitUntil: 'networkidle' });
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'deep-current');
  await expect(page.locator('main')).toHaveAttribute('data-pom-shell-presentation', 'instrumented');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function openAppearanceSettings(page: Page) {
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility' }).click();
}

async function responsiveEvidence(page: Page, testInfo: TestInfo, name: string) {
  const evidence = await page.evaluate(() => {
    const rectangle = (selector: string): Rectangle | null => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    };
    const style = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const computed = getComputedStyle(element);
      return {
        display: computed.display,
        visibility: computed.visibility,
        fontSize: Number.parseFloat(computed.fontSize),
        lineHeight: Number.parseFloat(computed.lineHeight),
        overflow: computed.overflow,
        position: computed.position
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      },
      geometry: {
        shelf: rectangle('[data-conformance-region="shelf"]'),
        wordmark: rectangle('.wordmark'),
        tabs: rectangle('.panel-tabs'),
        createPanel: rectangle('.panel-create-action'),
        shelfActions: rectangle('.shelf-actions'),
        stage: rectangle('[data-conformance-region="stage"]'),
        transcript: rectangle('[data-widget-type="story.transcript"][data-pomegranate-placement]'),
        composer: rectangle('[data-widget-type="story.composer"][data-pomegranate-placement]'),
        leftToggle: rectangle('.toolbar-edge-toggle-left'),
        rightToggle: rectangle('.toolbar-edge-toggle-right'),
        leftDock: rectangle('[data-conformance-region="left"]'),
        rightDock: rectangle('[data-conformance-region="right"]')
      },
      styles: {
        tab: style('.panel-tabs [role="tab"]'),
        prose: style('.transcript-prose'),
        title: style('.transcript h1, .transcript h2'),
        placeholder: style('.composer-placeholder'),
        meta: style('.composer-meta'),
        leftDock: style('[data-conformance-region="left"]'),
        rightDock: style('[data-conformance-region="right"]')
      }
    };
  });
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot({ animations: 'disabled', caret: 'hide', fullPage: false }),
    contentType: 'image/png'
  });
  await testInfo.attach(`${name}.json`, {
    body: Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`),
    contentType: 'application/json'
  });
  return evidence;
}

function expectContained(rectangle: Rectangle | null, viewport: { width: number; height: number }, label: string) {
  expect(rectangle, `${label} exists`).not.toBeNull();
  expect(rectangle!.x, `${label} left edge`).toBeGreaterThanOrEqual(0);
  expect(rectangle!.y, `${label} top edge`).toBeGreaterThanOrEqual(0);
  expect(rectangle!.right, `${label} right edge`).toBeLessThanOrEqual(viewport.width);
  expect(rectangle!.bottom, `${label} bottom edge`).toBeLessThanOrEqual(viewport.height);
}

function overlaps(first: Rectangle, second: Rectangle) {
  return first.x < second.right && first.right > second.x && first.y < second.bottom && first.bottom > second.y;
}

function expectResponsiveAtmosphericContract(
  evidence: Awaited<ReturnType<typeof responsiveEvidence>>,
  minimumProseSize: number
) {
  const { viewport, document, geometry, styles } = evidence;
  expect(document.scrollWidth, 'page has no horizontal overflow').toBe(viewport.width);
  expect(document.scrollHeight, 'page stays locked to the browser viewport').toBe(viewport.height);
  expect(geometry.shelf?.y, 'Atmospheric shelf begins at the page edge').toBe(0);
  expect(geometry.shelf?.height, 'Atmospheric shelf is a single touch row').toBe(44);
  for (const [label, rectangle] of Object.entries({
    wordmark: geometry.wordmark,
    tabs: geometry.tabs,
    createPanel: geometry.createPanel,
    shelfActions: geometry.shelfActions,
    stage: geometry.stage,
    transcript: geometry.transcript,
    composer: geometry.composer,
    leftToggle: geometry.leftToggle,
    rightToggle: geometry.rightToggle
  })) expectContained(rectangle, viewport, label);

  const shelfItems = [geometry.wordmark!, geometry.tabs!, geometry.createPanel!, geometry.shelfActions!];
  for (let first = 0; first < shelfItems.length; first += 1) {
    for (let second = first + 1; second < shelfItems.length; second += 1) {
      expect(overlaps(shelfItems[first]!, shelfItems[second]!), `shelf items ${first} and ${second} do not overlap`).toBe(false);
    }
  }
  expect(overlaps(geometry.transcript!, geometry.leftToggle!), 'left dock control clears the story').toBe(false);
  expect(overlaps(geometry.transcript!, geometry.rightToggle!), 'right dock control clears the story').toBe(false);
  expect(styles.prose?.fontSize, 'story prose stays readable').toBeGreaterThanOrEqual(minimumProseSize);
  expect(styles.tab?.fontSize, 'Panel labels stay readable').toBeGreaterThanOrEqual(11);
  expect(styles.placeholder?.fontSize, 'composer prompt stays readable').toBeGreaterThanOrEqual(14);
  expect(styles.meta?.fontSize, 'composer instructions stay readable').toBeGreaterThanOrEqual(10);
}

async function expectOverlayDock(page: Page, side: 'left' | 'right') {
  const stageBefore = await page.locator('[data-conformance-region="stage"]').boundingBox();
  const toggle = page.getByRole('button', { name: `Toggle ${side} dock` });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const dock = page.locator(`[data-conformance-region="${side}"]`);
  await expect(dock).toBeVisible();
  const [stageAfter, dockBox] = await Promise.all([page.locator('[data-conformance-region="stage"]').boundingBox(), dock.boundingBox()]);
  expect(stageAfter, `${side} dock does not reflow the stage`).toEqual(stageBefore);
  expect(dockBox?.width, `${side} dock is usable`).toBeGreaterThanOrEqual(280);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(dock).toBeHidden();
}

test.describe('Deep Atmospheric responsive phone presentation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('normal mobile is a clean, readable Atmospheric composition with reachable overlay docks', async ({ page }, testInfo) => {
    await fresh(page);
    const evidence = await responsiveEvidence(page, testInfo, 'deep-mobile-390x844');
    expectResponsiveAtmosphericContract(evidence, 17);
    await expectOverlayDock(page, 'left');
    await expectOverlayDock(page, 'right');
  });

  test('normal mobile gives the Settings panel one deterministic vertical scroll owner', async ({ page }) => {
    await fresh(page);
    await openAppearanceSettings(page);
    const panel = page.locator('.workbench-surface');
    const evidence = await panel.evaluate((element) => {
      const before = element.scrollTop;
      element.scrollTop = element.scrollHeight;
      return {
        overflowY: getComputedStyle(element).overflowY,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        before,
        after: element.scrollTop
      };
    });
    expect(evidence.overflowY).toBe('auto');
    expect(evidence.scrollHeight).toBeGreaterThan(evidence.clientHeight);
    expect(evidence.after).toBeGreaterThan(evidence.before);
    await expect(page.getByRole('article', { name: 'Custom Theme' })).toBeVisible();
  });
});

test.describe('Deep Atmospheric mobile desktop-site presentation', () => {
  test.use({ viewport: { width: 980, height: 720 }, hasTouch: true, isMobile: false });

  test('desktop-site mode uses an intentional touch-desktop composition instead of a scaled wide shell', async ({ page }, testInfo) => {
    await fresh(page);
    await expect.poll(() => page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const evidence = await responsiveEvidence(page, testInfo, 'deep-mobile-desktop-site-980x720');
    expectResponsiveAtmosphericContract(evidence, 21);
    await expectOverlayDock(page, 'left');
    await expectOverlayDock(page, 'right');
  });
});

test('a wide Deep session converges to the same mobile composition after material editing and resize', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fresh(page);
  await openAppearanceSettings(page);
  const themeSettings = page.getByRole('article', { name: 'Theme Materials' });
  for (const label of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level']) {
    await themeSettings.getByRole('slider', { name: label }).fill('0');
  }
  await page.getByRole('tab', { name: 'Scene' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  const evidence = await responsiveEvidence(page, testInfo, 'deep-wide-to-mobile-390x844');
  expectResponsiveAtmosphericContract(evidence, 17);
  await expect(page.locator('[data-pom-canvas-layer="image"]')).toHaveCSS('opacity', '1');
});
