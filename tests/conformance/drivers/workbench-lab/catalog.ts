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
    await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
    const catalog = page.getByRole('complementary', { name: 'Widget Catalog' });
    await catalog.waitFor({ state: 'visible' });
    const inventory = await measureInventory(catalog);

    let outcomeReached = false;
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
        const panel = page.getByRole('tabpanel', { name: 'Catalog Proof' });
        const identities = await panel.locator('[data-widget-type]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-widget-type')));
        outcomeReached = identities.length === 94 && new Set(identities).size === 94;
        break;
      }
      case 'dc-catalog-fallback-46':
        outcomeReached = await catalog.locator('[data-renderer-status="implemented"]').count() === 49
          && await catalog.locator('[data-renderer-status="unavailable"]').count() === 45
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
      trace: Object.freeze([`opened Lab Catalog for ${catalogCase.scenarioId}`, 'verified manifest-backed Catalog outcome'])
    });
  } catch (cause) {
    throw new ConformanceError('IMPLEMENTATION_SETUP_FAILED', `Workbench Lab Catalog failed for ${catalogCase.scenarioId}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      scenarioId: catalogCase.scenarioId
    });
  }
}

async function createCatalogProofPanel(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Create Panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a Panel' });
  await dialog.getByRole('textbox', { name: 'Panel name' }).fill('Catalog Proof');
  await dialog.getByRole('button', { name: 'Create Panel' }).click();
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
