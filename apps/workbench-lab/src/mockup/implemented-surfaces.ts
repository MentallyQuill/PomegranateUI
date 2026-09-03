import type { WidgetType } from '@pomegranate-ui/contracts';

import { createCatalogManifests } from './catalog.js';
import { SURFACE_FIXTURES } from './surface-fixtures.js';

export type ImplementedSurfaceFamily = 'settings' | 'story' | 'library' | 'systems' | 'extensions';

export interface ImplementedSurfaceDefinition {
  readonly type: WidgetType;
  readonly title: string;
  readonly family: ImplementedSurfaceFamily;
}

function familyFor(category: string): ImplementedSurfaceFamily {
  if (category === 'settings' || category === 'story' || category === 'library' || category === 'systems' || category === 'extensions') return category;
  throw new Error(`Implemented surface uses unsupported family ${category}.`);
}

export const IMPLEMENTED_SURFACES: readonly ImplementedSurfaceDefinition[] = Object.freeze(
  createCatalogManifests().map((manifest) => {
    if (!manifest.catalog) throw new Error(`Implemented surface catalog metadata is missing: ${manifest.type}.`);
    if (!SURFACE_FIXTURES.has(manifest.type)) throw new Error(`Implemented surface fixture is missing: ${manifest.type}.`);
    return Object.freeze({
      type: manifest.type,
      title: manifest.title,
      family: familyFor(manifest.catalog.category)
    });
  })
);

export const IMPLEMENTED_SURFACE_TYPES: ReadonlySet<WidgetType> = new Set(
  IMPLEMENTED_SURFACES.map(({ type }) => type)
);

export const IMPLEMENTED_SURFACE_TOTALS = Object.freeze(
  IMPLEMENTED_SURFACES.reduce((totals, surface) => {
    totals[surface.family] += 1;
    return totals;
  }, { story: 0, library: 0, systems: 0, settings: 0, extensions: 0 } as Record<ImplementedSurfaceFamily, number>)
);
