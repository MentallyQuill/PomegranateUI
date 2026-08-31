import { describe, expect, it } from 'vitest';
import { asWidgetType } from '@pomegranate-ui/contracts';

import { IMPLEMENTED_SURFACE_TOTALS, IMPLEMENTED_SURFACES } from './implemented-surfaces.js';
import { SURFACE_FIXTURES } from './surface-fixtures.js';
import { createLabRuntime } from './widgets.js';

describe('implemented Deep Current surface boundary', () => {
  it('freezes the exact 52 reviewed Widget identities and family totals', () => {
    expect(IMPLEMENTED_SURFACES).toHaveLength(52);
    expect(new Set(IMPLEMENTED_SURFACES.map(({ type }) => type)).size).toBe(52);
    expect(IMPLEMENTED_SURFACE_TOTALS).toEqual({ settings: 8, story: 12, library: 19, systems: 13 });
    expect(Object.isFrozen(IMPLEMENTED_SURFACES)).toBe(true);
    expect(IMPLEMENTED_SURFACES.every(Object.isFrozen)).toBe(true);
  });

  it('keeps exact manifest title parity at both ends of every reviewed family', () => {
    expect(IMPLEMENTED_SURFACES.map(({ type, title }) => `${type}|${title}`)).toEqual(expect.arrayContaining([
      'settings.provider-credentials|Provider Credentials',
      'settings.prompt-editor|Prompt Editor',
      'story.transcript|Transcript',
      'runtime.background-work|Background Work',
      'library.workspace|Library',
      'library.lived-location-builder|Lived-in Location Builder',
      'systems.cast|Cast',
      'systems.character-relationships|Character Relationships'
    ]));
  });

  it('gives every reviewed identity one state-aware fixture and specialized renderer', () => {
    const runtime = createLabRuntime();
    expect(SURFACE_FIXTURES.size).toBe(52);
    for (const surface of IMPLEMENTED_SURFACES) {
      const fixture = SURFACE_FIXTURES.get(surface.type);
      expect(fixture?.states).toContain('ready');
      expect(fixture?.states).toContain('failure');
      expect(runtime.rendererRegistry.get(surface.type)).toBeDefined();
    }
  });

  it('keeps an explicit unavailable fallback for a non-implemented Catalog identity', () => {
    const runtime = createLabRuntime();
    expect(runtime.rendererRegistry.get(asWidgetType('systems.temporal-ledger'))).toBeUndefined();
  });
});
