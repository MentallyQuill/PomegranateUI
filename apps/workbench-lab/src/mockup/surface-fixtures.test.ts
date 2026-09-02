import { describe, expect, it } from 'vitest';

import { createCatalogManifests } from './catalog.js';
import { SURFACE_FIXTURES } from './surface-fixtures.js';

describe('Lab surface fixtures', () => {
  it('provides one explicit reviewed fixture for every catalog manifest', () => {
    const manifests = createCatalogManifests();
    expect(SURFACE_FIXTURES.size).toBe(94);
    expect([...SURFACE_FIXTURES.keys()].sort()).toEqual(manifests.map(({ type }) => type).sort());

    for (const manifest of manifests) {
      const fixture = SURFACE_FIXTURES.get(manifest.type);
      expect(fixture?.type).toBe(manifest.type);
      expect(fixture?.scope.trim()).toBeTruthy();
      expect(fixture?.presentation).toBeTruthy();
      expect(fixture?.rows.length).toBeGreaterThan(0);
      expect(fixture?.rows.every(([label, value]) => label.trim().length > 0 && value.trim().length > 0)).toBe(true);
      expect(fixture?.boundary.trim()).toBeTruthy();
      expect(fixture?.states).toContain('ready');
      expect(fixture?.states).toContain('failure');
    }
  });

  it('keeps fixture copy free of catalog geometry and renderer diagnostics', () => {
    const visibleCopy = [...SURFACE_FIXTURES.values()]
      .flatMap(({ scope, rows, boundary, actions }) => [scope, ...rows.flat(), boundary, ...actions])
      .join(' ');

    expect(visibleCopy).not.toMatch(/minHeight|maxHeight|idealHeight|renderer unavailable|registry entry/i);
  });
});
