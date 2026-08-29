import type { Page } from '@playwright/test';

import type { CatalogMeasurement } from '../../measurements.ts';
import { ConformanceError } from '../../types.ts';
import type { CatalogCase } from '../../widget-manifest.ts';

const sourcePath = '/prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html?test=1';

interface ReferenceDefinition {
  readonly type: string;
  readonly category: 'story' | 'library' | 'systems' | 'settings' | 'extensions';
}

export function requireCatalogHarnessCase(cases: ReadonlySet<string>, catalogCase: CatalogCase): string {
  const match = [...cases].find((title) => title.includes(catalogCase.harnessCaseFragment));
  if (!match) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `No passing Widget Overhaul case covers ${catalogCase.scenarioId}.`, {
      fragment: catalogCase.harnessCaseFragment,
      scenarioId: catalogCase.scenarioId
    });
  }
  return match;
}

export async function renderWidgetOverhaulCatalog(
  page: Page,
  preservationOrigin: string,
  catalogCase: CatalogCase
): Promise<CatalogMeasurement> {
  try {
    await page.goto(`${preservationOrigin}${sourcePath}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { SonderWidgetMockup?: unknown }).SonderWidgetMockup));
    const definitions = await page.evaluate(() => {
      const api = (window as unknown as { SonderWidgetMockup?: { catalogDefinitions: readonly ReferenceDefinition[] } }).SonderWidgetMockup;
      if (!api) throw new Error('Widget Overhaul API missing.');
      return api.catalogDefinitions.map(({ type, category }) => ({ type, category }));
    });
    const inventory = inventoryFrom(definitions);
    await page.locator('[data-widget-catalog-launcher]').click();
    const catalog = page.locator('[data-widget-catalog]');
    await catalog.waitFor({ state: 'visible' });

    let outcomeReached = false;
    let lifecycle = { placed: 0, persisted: 0, rendered: 0, removed: 0 };
    switch (catalogCase.scenarioId) {
      case 'dc-catalog-inventory':
        outcomeReached = await catalog.locator('[data-catalog-result]').count() === 94;
        break;
      case 'dc-catalog-search': {
        await catalog.locator('[data-catalog-search]').fill('character relationships');
        const results = catalog.locator('[data-catalog-result]');
        outcomeReached = await results.count() === 1 && /Character Relationships/.test(await results.first().innerText());
        break;
      }
      case 'dc-catalog-visual-preview':
        await catalog.locator('button[data-catalog-view="visual"]').click();
        outcomeReached = await catalog.locator('.sonder-widget-miniature').count() === 94;
        break;
      case 'dc-catalog-compact-preview':
        await catalog.locator('button[data-catalog-view="compact"]').click();
        outcomeReached = await catalog.locator('[data-catalog-result]').count() === 94
          && await catalog.locator('.sonder-widget-miniature').count() === 0;
        break;
      case 'dc-catalog-placement-all': {
        const results = await page.evaluate((types) => {
          const api = (window as unknown as {
            SonderWidgetMockup?: { exerciseDefinitionPlacement: (type: string) => Record<string, boolean> }
          }).SonderWidgetMockup;
          if (!api) throw new Error('Widget Overhaul placement API missing.');
          return types.map((type) => api.exerciseDefinitionPlacement(type));
        }, definitions.map(({ type }) => type));
        lifecycle = {
          placed: results.filter(({ placed }) => placed).length,
          persisted: results.filter(({ persisted }) => persisted).length,
          rendered: results.filter(({ rendered }) => rendered).length,
          removed: results.filter(({ removed }) => removed).length
        };
        outcomeReached = Object.values(lifecycle).every((count) => count === 94);
        break;
      }
      case 'dc-catalog-fallback-46':
        outcomeReached = await page.evaluate(() => {
          const api = (window as unknown as {
            SonderWidgetMockup?: { readyBlueprints: Readonly<Record<string, unknown>> }
          }).SonderWidgetMockup;
          return Boolean(api && Object.keys(api.readyBlueprints).length === 94);
        });
        break;
      default:
        throw new Error(`Unknown Catalog scenario ${catalogCase.scenarioId}.`);
    }

    const keyboardAccessible = await catalog.locator('button').evaluateAll((buttons) => buttons.every((button) => (
      Boolean((button.getAttribute('aria-label') ?? button.textContent ?? '').trim())
    )));
    if (!outcomeReached || !keyboardAccessible) throw new Error('Reference Catalog failed its scenario audit.');
    return Object.freeze({
      functional: Object.freeze({ authorityCasePassed: true, outcomeReached: true, keyboardAccessible: true }),
      inventory: Object.freeze(inventory),
      lifecycle: Object.freeze(lifecycle),
      trace: Object.freeze([`opened preserved Catalog for ${catalogCase.scenarioId}`, catalogCase.harnessCaseFragment])
    });
  } catch (cause) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `Widget Overhaul Catalog failed for ${catalogCase.scenarioId}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      scenarioId: catalogCase.scenarioId
    });
  }
}

function inventoryFrom(definitions: readonly ReferenceDefinition[]) {
  const count = (category: ReferenceDefinition['category']) => definitions.filter((definition) => definition.category === category).length;
  return {
    total: definitions.length,
    story: count('story'),
    library: count('library'),
    systems: count('systems'),
    settings: count('settings'),
    extensions: count('extensions')
  };
}
