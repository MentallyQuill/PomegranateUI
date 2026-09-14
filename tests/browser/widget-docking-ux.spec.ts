import { expect, test, type Page } from '@playwright/test';
import { dragToShelfRail, dragToWidgetTab, widgetDragSurface } from './support/widget-interaction-driver.js';

const themes = ['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber'] as const;

async function freshTheme(page: Page, theme: typeof themes[number]) {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' }).getByRole('button', { name: theme, exact: true }).click();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
}

test('a singleton fills its shelf after a cross-dock move in every theme', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const theme of themes) {
    await freshTheme(page, theme);
    const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
    await dragToShelfRail(page, widgetDragSurface(materials), 'right', 'before');
    await expect(materials).toBeVisible();
    const allocation = await materials.evaluate((article) => {
      const shelf = article.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      return {
        widgetHeight: article.getBoundingClientRect().height,
        availableHeight: shelf.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        contentOverflow: article.querySelector('[data-pom-part="widget.content"]')!.scrollHeight
          - article.querySelector('[data-pom-part="widget.content"]')!.clientHeight
      };
    });
    await testInfo.attach(`${theme}-allocation`, { body: JSON.stringify(allocation), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`${theme}-shelf.png`) });
    expect(allocation.widgetHeight, `${theme}: singleton should fill the shelf`).toBeGreaterThan(allocation.availableHeight - 3);
    expect(allocation.contentOverflow, `${theme}: controls should fit at desktop height`).toBeLessThanOrEqual(2);
    const characters = page.getByRole('article', { name: 'Characters (Story)', exact: true });
    const source = await characters.evaluate((article) => {
      const shelf = article.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      return { widget: article.getBoundingClientRect().height, shelf: shelf.getBoundingClientRect().height - parseFloat(style.paddingBottom) };
    });
    expect(source.widget, `${theme}: source must not retain a phantom row`).toBeGreaterThan(source.shelf - 3);
  }
});

test('moving the final widget out of a shelf removes its space and divider', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await freshTheme(page, 'Bunny');
  const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
  const right = page.getByRole('region', { name: 'Right instruments column 1', exact: true });
  await dragToShelfRail(page, widgetDragSurface(materials), 'right', 'before');
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(2);
  await dragToWidgetTab(page, widgetDragSurface(materials), page.getByRole('article', { name: 'World State', exact: true }));
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(1);
  await expect(right.locator(':scope > .shelf-resize-handle')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('empty-shelf-removed.png') });
  await page.getByRole('button', { name: 'Undo layout', exact: true }).click();
  await expect(right.locator(':scope > .dock-shelf')).toHaveCount(2);
  await expect(right.locator(':scope > .shelf-resize-handle')).toHaveCount(1);
  await expect(materials).toBeVisible();
});

test('one grouped item fills a short shelf without clipping its controls', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 580 });
  for (const theme of themes) {
    await freshTheme(page, theme);
    const materials = page.getByRole('article', { name: 'Theme Materials', exact: true });
    const characters = page.getByRole('article', { name: 'Characters (Story)', exact: true });
    await dragToWidgetTab(page, widgetDragSurface(materials), characters);
    const group = page.getByRole('group', { name: 'Widget group', exact: true }).filter({ has: page.getByRole('tab', { name: 'Theme Materials', exact: true }) });
    const allocation = await group.evaluate((node) => {
      const shelf = node.closest('.dock-shelf')!;
      const style = getComputedStyle(shelf);
      const content = node.querySelector('[data-pom-part="widget.content"]')!;
      return {
        height: node.getBoundingClientRect().height,
        available: shelf.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        contentHeight: content.clientHeight
      };
    });
    expect(allocation.height, theme).toBeGreaterThan(allocation.available - 3);
    expect(allocation.contentHeight, theme).toBeGreaterThan(100);
    const lastControl = await group.getByRole('slider', { name: 'Frost Level' }).boundingBox();
    const groupBox = await group.boundingBox();
    expect(lastControl).not.toBeNull();
    expect(lastControl!.y + lastControl!.height, theme).toBeLessThanOrEqual(groupBox!.y + groupBox!.height);
    await page.screenshot({ path: testInfo.outputPath(`${theme}-group-short.png`) });
  }
});
