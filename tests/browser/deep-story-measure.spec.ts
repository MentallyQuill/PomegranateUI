import { expect, test, type Locator, type Page } from '@playwright/test';

const labOrigin = process.env.POM_LAB_ORIGIN
  ?? `http://127.0.0.1:${process.env.POM_PLAYWRIGHT_PORT ?? '4174'}`;

type StoryGeometry = {
  readonly transcript: { readonly width: number; readonly centerX: number };
  readonly composer: { readonly width: number; readonly centerX: number };
};

async function freshDeepScene(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(labOrigin);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'deep-current');
}

async function storyGeometry(page: Page): Promise<StoryGeometry> {
  const [transcript, composer] = await Promise.all([
    page.locator('[data-widget-type="story.transcript"] .widget-frame').boundingBox(),
    page.locator('[data-widget-type="story.composer"] .widget-frame').boundingBox()
  ]);
  if (!transcript || !composer) throw new Error('Expected visible Deep Story transcript and composer geometry.');
  return {
    transcript: { width: transcript.width, centerX: transcript.x + transcript.width / 2 },
    composer: { width: composer.width, centerX: composer.x + composer.width / 2 }
  };
}

async function dragOutward(page: Page, handle: Locator, side: 'left' | 'right') {
  const box = await handle.boundingBox();
  if (!box) throw new Error(`Expected the ${side} Story-width boundary to have geometry.`);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await expect(handle).toHaveCSS('cursor', 'col-resize');
  await page.mouse.down();
  await page.mouse.move(start.x + (side === 'left' ? -48 : 48), start.y, { steps: 6 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await freshDeepScene(page);
});

for (const side of ['left', 'right'] as const) {
  test(`Deep ${side} Story-width boundary exposes the resize cursor and expands both Story surfaces`, async ({ page }) => {
    const handle = page.getByRole('separator', {
      name: new RegExp(`resize story width.*${side} edge`, 'i')
    });
    await expect(handle).toHaveCount(1);

    const before = await storyGeometry(page);
    await dragOutward(page, handle, side);
    const after = await storyGeometry(page);

    const transcriptGrowth = after.transcript.width - before.transcript.width;
    const composerGrowth = after.composer.width - before.composer.width;
    expect(transcriptGrowth).toBeGreaterThan(40);
    expect(composerGrowth).toBeGreaterThan(40);
    expect(Math.abs(transcriptGrowth - composerGrowth)).toBeLessThan(2);
    expect(Math.abs(after.transcript.centerX - before.transcript.centerX)).toBeLessThan(2);
    expect(Math.abs(after.composer.centerX - before.composer.centerX)).toBeLessThan(2);
  });
}
