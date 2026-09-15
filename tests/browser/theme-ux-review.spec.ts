import { expect, test, type Page } from '@playwright/test';

async function selectTheme(page: Page, label: string) {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: label, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}

test('Bunny catalog previews retain content-card corners', async ({ page }) => {
  await page.goto('/?dev=1');
  await selectTheme(page, 'Bunny');
  await page.getByRole('button', { name: 'Open Widget Catalog', exact: true }).click();
  const card = page.locator('[data-catalog-result]').first();
  await expect(card).toBeVisible();
  const geometry = await card.evaluate((element) => ({
    radius: parseFloat(getComputedStyle(element).borderTopLeftRadius),
    width: element.getBoundingClientRect().width
  }));
  expect(geometry.radius).toBeLessThan(geometry.width / 4);
});

test('metadata authoring updates labels in real widgets', async ({ page }) => {
  await page.goto('/?dev=1');
  await page.getByRole('tab', { name: 'Settings', exact: true }).click();
  await page.getByRole('tab', { name: 'Appearance and Accessibility', exact: true }).click();
  await page.getByRole('slider', { name: 'Metadata size', exact: true }).fill('12');
  for (const selector of ['.surface-scope', '.theme-authoring-meta']) {
    await expect(page.locator(selector).first()).toHaveCSS('font-size', '12px');
  }
  await page.getByRole('tab', { name: 'Scene', exact: true }).click();
  await expect(page.locator('.atmospheric-room-ambience dd').first()).toHaveCSS('font-size', '12px');
});

test('light-theme grouped tabs use a theme header material', async ({ page }) => {
  await page.goto('/?dev=1');
  await selectTheme(page, 'Bunny');
  const rail = page.locator('.widget-group-tabs').first();
  const colors = await rail.evaluate((element) => {
    const sample = document.createElement('span');
    sample.style.backgroundColor = 'var(--pom-part-widget-header-material-fill)';
    element.append(sample);
    const result = { actual: getComputedStyle(element).backgroundColor, expected: getComputedStyle(sample).backgroundColor };
    sample.remove();
    return result;
  });
  expect(colors.actual).toBe(colors.expected);
});

test('Story resize hit areas do not paint solid bars beside the composer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?dev=1');
  await selectTheme(page, 'Bunny');
  await expect(page.locator('.story-measure-resize-handle').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

for (const theme of ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']) {
  test(`${theme} Library navigation retains readable content labels`, async ({ page }) => {
    await page.goto('/?dev=1');
    await selectTheme(page, theme);
    await page.getByRole('tab', { name: 'Library', exact: true }).click();
    const navigation = page.locator('.surface-workspace nav');
    await expect(navigation).toHaveCSS('opacity', '1');
    const label = navigation.getByRole('button').first();
    expect(await label.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(11);
    expect((await label.boundingBox())!.width).toBeGreaterThan(100);
  });

  test(`${theme} toolbar toggles use readable theme foregrounds`, async ({ page }) => {
    await page.goto('/?dev=1');
    await selectTheme(page, theme);
    const toggle = page.locator('.toolbar-edge-toggle-left');
    await expect.poll(() => toggle.evaluate((element) => {
      const expected = document.createElement('span');
      expected.style.color = 'var(--pom-part-button-surface-foreground)';
      element.append(expected);
      const result = { actual: getComputedStyle(element).color, expected: getComputedStyle(expected).color };
      expected.remove();
      return result.actual === result.expected;
    })).toBe(true);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Open left toolbar');
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 1440, height: 600 }]) {
    test(`${theme} composer exposes multiline drafts at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/?dev=1');
      await selectTheme(page, theme);
      const field = page.locator('#lab-composer');
      await expect.poll(() => page.locator('.composer').evaluate((element) => element.clientHeight))
        .toBeLessThan(180);
      await field.fill('First line\nSecond line\nThird line');
      await expect.poll(() => field.evaluate((element) => element.clientHeight)).toBeGreaterThan(45);
      await field.fill(Array.from({ length: 30 }, (_, index) => `Draft line ${index}`).join('\n'));
      const geometry = await field.evaluate((element) => ({
        height: element.clientHeight,
        scroll: element.scrollHeight,
        overflow: getComputedStyle(element).overflowY,
        bottom: element.getBoundingClientRect().bottom
      }));
      expect(geometry.height).toBeLessThan(300);
      expect(geometry.scroll).toBeGreaterThan(geometry.height);
      expect(geometry.overflow).toBe('auto');
      await expect.poll(() => field.evaluate((element) => element.getBoundingClientRect().bottom))
        .toBeLessThanOrEqual(viewport.height);
      await expect.poll(() => page.locator('.composer').evaluate((element) => {
        const placement = element.closest('[data-widget-type][data-pomegranate-placement]')!;
        return element.getBoundingClientRect().bottom <= placement.getBoundingClientRect().bottom + 1;
      })).toBe(true);
      await expect.poll(() => page.evaluate(() => {
        const transcript = document.querySelector('.transcript')!.getBoundingClientRect();
        const composer = document.querySelector('.composer')!.getBoundingClientRect();
        return transcript.bottom <= composer.top;
      })).toBe(true);
      await field.fill('');
      await expect.poll(() => field.evaluate((element) => element.clientHeight)).toBeLessThan(45);
    });
  }
}
