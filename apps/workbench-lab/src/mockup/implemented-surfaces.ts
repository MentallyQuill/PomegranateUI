import { asWidgetType, type WidgetType } from '@pomegranate-ui/contracts';

import { createCatalogManifests } from './catalog.js';

export type ImplementedSurfaceFamily = 'settings' | 'story' | 'library' | 'systems';

export interface ImplementedSurfaceDefinition {
  readonly type: WidgetType;
  readonly title: string;
  readonly family: ImplementedSurfaceFamily;
}

const IMPLEMENTED_TYPES = Object.freeze([
  'settings.provider-credentials',
  'settings.model-assignments',
  'settings.theme',
  'settings.custom-theme',
  'settings.accessibility',
  'settings.maintenance',
  'settings.prompt-editor',
  'story.transcript',
  'story.composer',
  'story.context',
  'story.turn-progress',
  'story.live-technical-detail',
  'story.turn-versions',
  'story.turn-inspector',
  'story.player-condition',
  'story.cast-condition',
  'story.room-ambience',
  'story.scene-backdrop',
  'runtime.background-work',
  'library.workspace',
  'library.stories',
  'library.characters',
  'story.characters',
  'library.personas',
  'story.personas',
  'library.lore',
  'story.lorebooks',
  'library.new-story',
  'library.character-card',
  'story.character-card',
  'library.persona-card',
  'library.greetings-quick-start',
  'library.lore-entries',
  'library.lore-entry-editor',
  'library.lorebook-details',
  'library.lore-relationships',
  'library.lore-generator',
  'library.lived-location-builder',
  'systems.cast',
  'systems.background-presences',
  'systems.world-state',
  'systems.attire',
  'systems.genre-style',
  'systems.dialogue-agency',
  'systems.offscreen-life',
  'systems.living-world',
  'systems.institutions-charter',
  'systems.institution-diagnostics',
  'systems.background-life',
  'systems.character-relationships'
] as const);

const manifestByType = new Map(createCatalogManifests().map((manifest) => [manifest.type, manifest]));

function familyFor(category: string): ImplementedSurfaceFamily {
  if (category === 'settings' || category === 'story' || category === 'library' || category === 'systems') return category;
  throw new Error(`Implemented surface uses unsupported family ${category}.`);
}

export const IMPLEMENTED_SURFACES: readonly ImplementedSurfaceDefinition[] = Object.freeze(
  IMPLEMENTED_TYPES.map((rawType) => {
    const type = asWidgetType(rawType);
    const manifest = manifestByType.get(type);
    if (!manifest?.catalog) throw new Error(`Implemented surface manifest is missing: ${type}.`);
    return Object.freeze({
      type,
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
  }, { settings: 0, story: 0, library: 0, systems: 0 })
);
