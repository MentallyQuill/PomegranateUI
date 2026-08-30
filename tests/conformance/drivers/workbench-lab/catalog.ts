import type { Locator, Page } from '@playwright/test';

import type { CatalogMeasurement } from '../../measurements.ts';
import { ConformanceError } from '../../types.ts';
import type { CatalogCase } from '../../widget-manifest.ts';

export async function renderLabCatalog(
  page: Page,
  labOrigin: string,
  catalogCase: CatalogCase
): Promise<CatalogMeasurement> {
  try {
    await page.goto(labOrigin, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    if (catalogCase.scenarioId === 'dc-catalog-placement-all') await createCatalogProofPanel(page);
    const catalogLauncher = page.getByRole('button', { name: 'Open Widget Catalog' });
    await catalogLauncher.focus();
    await catalogLauncher.press('Enter');
    const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
    await catalog.waitFor({ state: 'visible' });
    const inventory = await measureInventory(catalog);

    let outcomeReached = false;
    let lifecycle = { placed: 0, persisted: 0, rendered: 0, removed: 0 };
    switch (catalogCase.scenarioId) {
      case 'dc-catalog-inventory':
        outcomeReached = await catalog.getByRole('listitem').count() === 94;
        break;
      case 'dc-catalog-search': {
        await catalog.getByRole('searchbox', { name: 'Search Widgets' }).fill('character relationships');
        const results = catalog.getByRole('listitem');
        outcomeReached = await results.count() === 1 && /Character Relationships/.test(await results.first().innerText());
        break;
      }
      case 'dc-catalog-visual-preview':
        await catalog.getByRole('button', { name: 'Visual', exact: true }).click();
        outcomeReached = await catalog.locator('.catalog-miniature').count() === 94;
        break;
      case 'dc-catalog-compact-preview':
        await catalog.getByRole('button', { name: 'Compact', exact: true }).click();
        outcomeReached = await catalog.getByRole('listitem').count() === 94
          && await catalog.locator('.catalog-miniature').count() === 0;
        break;
      case 'dc-catalog-placement-all': {
        await catalog.getByRole('button', { name: /^Add / }).evaluateAll((buttons) => {
          for (const button of buttons) (button as HTMLButtonElement).click();
        });
        await catalog.getByRole('button', { name: 'Close Catalog' }).click();
        const placed = await catalogPanelSnapshot(page);
        await page.getByText('Developer tools', { exact: true }).click();
        await page.getByRole('button', { name: 'Save layout' }).click();
        await page.reload({ waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const persisted = await catalogPanelSnapshot(page);
        const panel = page.getByRole('tabpanel', { name: 'Catalog Proof' });
        const removeButtons = panel.locator('button.action-remove');
        if (await removeButtons.count() !== 94) throw new Error('Catalog Proof does not expose 94 removal controls.');
        await removeButtons.evaluateAll((buttons) => {
          for (const button of buttons) (button as HTMLButtonElement).click();
        });
        await panel.locator('[data-widget-type]').first().waitFor({ state: 'detached' });
        await page.getByText('Developer tools', { exact: true }).click();
        await page.getByRole('button', { name: 'Save layout' }).click();
        await page.reload({ waitUntil: 'load' });
        await page.getByRole('tabpanel', { name: 'Catalog Proof' }).waitFor({ state: 'visible' });
        const remaining = await page.getByRole('tabpanel', { name: 'Catalog Proof' }).locator('[data-widget-type]').count();
        lifecycle = {
          placed: placed.distinct,
          persisted: persisted.distinct,
          rendered: persisted.implemented + persisted.unavailable,
          removed: 94 - remaining
        };
        outcomeReached = Object.values(lifecycle).every((count) => count === 94);
        break;
      }
      case 'dc-catalog-fallback-46':
        outcomeReached = await catalog.locator('[data-renderer-status="implemented"]').count() === 51
          && await catalog.locator('[data-renderer-status="unavailable"]').count() === 43
          && await catalog.locator('.catalog-miniature').count() === 94;
        break;
      default:
        throw new Error(`Unknown Catalog scenario ${catalogCase.scenarioId}.`);
    }

    const keyboardAccessible = await page.locator('button:visible').evaluateAll((buttons) => buttons.every((button) => (
      Boolean((button.getAttribute('aria-label') ?? button.textContent ?? '').trim())
    )));
    if (!outcomeReached || !keyboardAccessible) throw new Error('Workbench Lab Catalog failed its scenario audit.');
    return Object.freeze({
      functional: Object.freeze({ authorityCasePassed: true, outcomeReached: true, keyboardAccessible: true }),
      inventory: Object.freeze(inventory),
      lifecycle: Object.freeze(lifecycle),
      trace: Object.freeze([`opened Lab Catalog for ${catalogCase.scenarioId}`, 'verified manifest-backed Catalog outcome'])
    });
  } catch (cause) {
    throw new ConformanceError('IMPLEMENTATION_SETUP_FAILED', `Workbench Lab Catalog failed for ${catalogCase.scenarioId}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      scenarioId: catalogCase.scenarioId
    });
  }
}

async function catalogPanelSnapshot(page: Page) {
  const panel = page.getByRole('tabpanel', { name: 'Catalog Proof' });
  await panel.waitFor({ state: 'visible' });
  const identities = await panel.locator('[data-widget-type]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-widget-type') ?? ''));
  return {
    distinct: new Set(identities).size,
    implemented: await panel.locator('.implemented-widget').count(),
    unavailable: await panel.locator('[aria-label$="renderer unavailable"]').count()
  };
}

async function createCatalogProofPanel(page: Page): Promise<void> {
  const drawerToggle = page.getByText('Developer tools', { exact: true });
  await drawerToggle.click();
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('Catalog Proof');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
  await drawerToggle.click();
}

async function measureInventory(catalog: Locator) {
  const total = await catalog.getByRole('listitem').count();
  const categories = {} as Record<'story' | 'library' | 'systems' | 'settings' | 'extensions', number>;
  for (const category of ['story', 'library', 'systems', 'settings', 'extensions'] as const) {
    await catalog.getByRole('button', { name: category, exact: true }).click();
    categories[category] = await catalog.getByRole('listitem').count();
  }
  await catalog.getByRole('button', { name: 'All', exact: true }).click();
  return { total, ...categories };
}
