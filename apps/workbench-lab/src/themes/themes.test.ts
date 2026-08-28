import { describe, expect, it } from 'vitest';

import { resolveTheme } from '@pomegranate-ui/theme';
import { BUNNY_THEME } from './bunny.js';
import { compileThemeBindings } from './bindings.js';
import { createLabThemeController } from './controller.js';
import { LAB_THEME_IDS, LAB_THEME_PRESETS } from './presets.js';
import { createLocalThemePreference, LAB_THEME_KEY } from './theme-storage.js';

describe('Workbench Lab theme conformance', () => {
  it.each(LAB_THEME_IDS)('resolves the complete %s Lab preset', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    expect(preset).toBeDefined();
    const result = resolveTheme(preset?.definition);
    expect(result.ok).toBe(true);
  });

  it('compiles semantic values and ordered canvas layers without a theme-id selector', () => {
    const result = resolveTheme(BUNNY_THEME);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const cssText = compileThemeBindings(result.theme);
    expect(cssText).toContain('--pom-color-text:#403747');
    expect(cssText).toContain('--pom-radius-widget:18px');
    expect(cssText).toContain('--pom-canvas:');
    expect(cssText).not.toContain('bunny');
    expect(cssText).not.toContain('transition');
  });

  it('switches one complete binding and persists only after validation succeeds', () => {
    const writes: string[] = [];
    const controller = createLabThemeController({
      preference: { read: () => null, write: (id) => writes.push(id) }
    });
    const before = controller.getSnapshot();
    const result = controller.activate('bunny');
    expect(result.ok).toBe(true);
    expect(controller.getSnapshot().activeId).toBe('bunny');
    expect(controller.getSnapshot().cssText).not.toBe(before.cssText);
    expect(writes).toEqual(['bunny']);
  });

  it('retains the last valid snapshot for an invalid preset', () => {
    const presets = LAB_THEME_PRESETS.map((preset) => preset.id === 'bunny'
      ? { id: preset.id, definition: { schemaVersion: 'wrong' } }
      : preset);
    const controller = createLabThemeController({ presets });
    const before = controller.getSnapshot();
    const result = controller.activate('bunny');
    expect(result.ok).toBe(false);
    expect(controller.getSnapshot()).toBe(before);
    if (!result.ok) expect(result.diagnostics[0]).toMatchObject({ code: 'THEME_SCHEMA_INVALID' });
  });

  it('retains the last valid snapshot when a required local asset is missing', () => {
    const presets = LAB_THEME_PRESETS.map((preset) => preset.id === 'bunny'
      ? {
          id: preset.id,
          definition: {
            ...preset.definition,
            iconPackId: 'icons.missing',
            assets: [{ id: 'icons.missing', kind: 'icon-pack', required: true }]
          }
        }
      : preset);
    const controller = createLabThemeController({ presets, availableAssets: new Set(['icons.minimal']) });
    const before = controller.getSnapshot();
    const result = controller.activate('bunny');
    expect(result.ok).toBe(false);
    expect(controller.getSnapshot()).toBe(before);
    if (!result.ok) expect(result.diagnostics[0]).toMatchObject({ code: 'THEME_ASSET_MISSING' });
  });

  it('falls back to Deep Current for an unknown stored preference', () => {
    const controller = createLabThemeController({ initialId: 'removed-theme' });
    expect(controller.getSnapshot().activeId).toBe('deep-current');
  });

  it('persists only the Lab preset id through the app-owned adapter', () => {
    window.localStorage.clear();
    const preference = createLocalThemePreference(window.localStorage);
    preference.write('pom-neutral');
    expect(preference.read()).toBe('pom-neutral');
    expect(window.localStorage.getItem(LAB_THEME_KEY)).toBe('pom-neutral');
    expect(window.localStorage.length).toBe(1);
  });
});
