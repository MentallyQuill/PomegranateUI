import { describe, expect, it } from 'vitest';

import { THEME_PART_IDS } from '@pomegranate-ui/contracts';
import { compileThemeBindings, contrastRatio, resolveThemeV2 } from '@pomegranate-ui/theme';
import { BUNNY_THEME } from './bunny.js';
import { createLabThemeController } from './controller.js';
import { DEEP_CURRENT_THEME } from './deep-current.js';
import { LAB_THEME_IDS, LAB_THEME_PRESETS } from './presets.js';
import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { createLocalThemePreference, LAB_THEME_KEY } from './theme-storage.js';

const assetRegistry = {
  'icons.minimal': { kind: 'icon-pack' as const, source: 'icons.minimal' },
  'image.deep-current-stage': { kind: 'image' as const, source: '/assets/deep-current.jpg' },
  'image.bunny-garden': { kind: 'image' as const, source: '/assets/bunny.webp' }
};

describe('Workbench Lab theme conformance', () => {
  it.each(LAB_THEME_IDS)('authors and resolves %s directly as a complete v2 theme', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    expect(preset?.definition.schemaVersion).toBe('pomegranate.ui.theme.v2');
    const result = resolveThemeV2(preset?.definition, assetRegistry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.theme.recipes.parts)).toEqual([...THEME_PART_IDS]);
    expect(Object.isFrozen(result.theme)).toBe(true);
  });

  it.each([
    { theme: DEEP_CURRENT_THEME, family: 'chamfered', density: 'compact', grouping: 'unified' },
    { theme: POM_NEUTRAL_THEME, family: 'continuous-rounded', density: 'balanced', grouping: 'individual' },
    { theme: BUNNY_THEME, family: 'continuous-rounded', density: 'roomy', grouping: 'individual' }
  ] as const)('gives $theme.id a distinct material, shape, and composition identity', ({ theme, family, density, grouping }) => {
    expect(theme.shapes.window?.family).toBe(family);
    expect(theme.spacing.density).toBe(density);
    expect(theme.recipes.widgetGrouping).toBe(grouping);
    expect(theme.materials.window?.backdrop.blurPx).toBeGreaterThan(0);
    expect(theme.materials.window?.opacity).toBeLessThan(0.9);
    expect(theme.canvas.some((layer) => layer.kind !== 'solid')).toBe(true);
  });

  it.each(LAB_THEME_IDS)('uses only packaged primary fonts and generic fallbacks in %s', (id) => {
    const theme = LAB_THEME_PRESETS.find((candidate) => candidate.id === id)!.definition;
    const packaged = new Set(['Pomegranate Sans', 'Pomegranate Serif', 'Pomegranate Mono']);
    const generic = new Set(['monospace', 'sans-serif', 'serif', 'system-ui', 'ui-monospace', 'ui-rounded', 'ui-sans-serif', 'ui-serif']);
    for (const role of [theme.typography.ui, theme.typography.prose, theme.typography.technical, theme.typography.display].filter(Boolean)) {
      expect(packaged.has(role!.family), `${id}: ${role!.family}`).toBe(true);
      expect(role!.fallbacks.every((fallback) => generic.has(fallback)), `${id}: ${role!.fallbacks.join(', ')}`).toBe(true);
    }
  });

  it('pins PomOS to the blue continuous-rounded adaptive-glass contract', () => {
    expect(POM_NEUTRAL_THEME).toMatchObject({
      schemaVersion: 'pomegranate.ui.theme.v2', id: 'pom-neutral', label: 'PomOS',
      colors: { canvas: '#167fdc', surfaceElevated: '#ffffff', accent: '#0868c4' },
      shapes: { window: { family: 'continuous-rounded', radiusPx: 18 } },
      controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } }
    });
    expect(POM_NEUTRAL_THEME.materials.panel).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 }, shadows: [] });
    expect(POM_NEUTRAL_THEME.materials.window).toMatchObject({ opacity: 0.42, backdrop: { blurPx: 30 } });
    expect(POM_NEUTRAL_THEME.materials.header?.backdrop.blurPx).toBe(0);
    expect(POM_NEUTRAL_THEME.materials.content?.backdrop.blurPx).toBe(0);
    expect(POM_NEUTRAL_THEME.canvas.every((layer) => layer.kind !== 'image')).toBe(true);
  });

  it.each(LAB_THEME_IDS)('keeps opaque semantic text pairings readable in %s', (id) => {
    const theme = LAB_THEME_PRESETS.find((candidate) => candidate.id === id)!.definition;
    for (const background of [theme.colors.surface, theme.colors.surfaceElevated, theme.colors.surfaceInset]) {
      expect(contrastRatio(theme.colors.text, background)).toBeGreaterThanOrEqual(theme.accessibility.minimumContrast);
      expect(contrastRatio(theme.colors.textMuted, background)).toBeGreaterThanOrEqual(theme.accessibility.minimumContrast);
    }
    expect(contrastRatio(theme.colors.textOnAccent, theme.colors.accent)).toBeGreaterThanOrEqual(theme.accessibility.minimumContrast);
  });

  it('compiles public semantic parts without a concrete theme selector or transition', () => {
    const result = resolveThemeV2(BUNNY_THEME, assetRegistry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bindings = compileThemeBindings(result.theme);
    expect(bindings['--pom-color-text']).toBe('#45364d');
    expect(bindings['--pom-radius-widget']).toContain('20px');
    expect(Object.values(bindings).join(';')).not.toContain('data-pom-theme');
    expect(Object.values(bindings).join(';')).not.toContain('transition');
  });

  it('declares each photographic canvas through local semantic asset IDs', () => {
    expect(DEEP_CURRENT_THEME.assets).toContainEqual({ id: 'image.deep-current-stage', kind: 'image', required: true });
    expect(DEEP_CURRENT_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({ assetId: 'image.deep-current-stage', fit: 'cover' });
    expect(BUNNY_THEME.assets).toContainEqual({ id: 'image.bunny-garden', kind: 'image', required: true });
    expect(BUNNY_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({ assetId: 'image.bunny-garden', fit: 'cover' });
  });

  it('switches one complete binding and persists only after validation succeeds', () => {
    const writes: string[] = [];
    const controller = createLabThemeController({ preference: { read: () => null, write: (id) => writes.push(id) } });
    const before = controller.getSnapshot();
    const result = controller.activate('bunny');
    expect(result.ok).toBe(true);
    expect(controller.getSnapshot().activeId).toBe('bunny');
    expect(controller.getSnapshot().cssText).not.toBe(before.cssText);
    expect(writes).toEqual(['bunny']);
  });

  it('projects recovered controls through bounded public theme policy', () => {
    const controller = createLabThemeController();
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 30, barOpacity: 60, selectedStrength: 6, frostLevel: 30 });
    expect(controller.getSnapshot().resolved.materials.window?.opacity).toBe(0.3);
    expect(controller.getSnapshot().resolved.materials.shelf?.opacity).toBe(0.6);
    expect(controller.getSnapshot().resolved.materials.window?.backdrop.blurPx).toBe(12);

    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 24, barOpacity: 28, selectedStrength: 62, frostLevel: 54 });
    expect(controller.getSnapshot().resolved.materials.window?.opacity).toBe(0.24);
    expect(controller.getSnapshot().resolved.materials.window?.backdrop.blurPx).toBe(21.6);
  });

  it('compiles true transparent and opaque endpoints for controlled materials', () => {
    const controller = createLabThemeController();
    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) expect(controller.setMaterialControl(id, 0).ok).toBe(true);
    expect(controller.getSnapshot().resolved.materials.window).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 } });
    expect(controller.getSnapshot().resolved.materials.shelf).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 } });
    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) expect(controller.setMaterialControl(id, 100).ok).toBe(true);
    expect(controller.getSnapshot().resolved.materials.window).toMatchObject({ opacity: 1, backdrop: { blurPx: 40 } });
    expect(controller.getSnapshot().resolved.materials.selected?.opacity).toBe(1);
  });

  it('retains independent drafts while switching and resets only the active theme', () => {
    const controller = createLabThemeController();
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.setMaterialControl('glassDensity', 38).ok).toBe(true);
    expect(controller.setMaterialControl('frostLevel', 45).ok).toBe(true);
    expect(controller.getSnapshot().resolved.materials.dialog).toMatchObject({ opacity: 0.38, backdrop: { blurPx: 18 } });
    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.setMaterialControl('barOpacity', 44).ok).toBe(true);
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toMatchObject({ glassDensity: 38, frostLevel: 45 });
    expect(controller.resetMaterialControls().ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 24, barOpacity: 28, selectedStrength: 62, frostLevel: 54 });
  });

  it('retains the last valid snapshot for an invalid preset or unavailable required asset', () => {
    const invalidPresets = LAB_THEME_PRESETS.map((preset) => preset.id === 'bunny' ? { id: preset.id, definition: { schemaVersion: 'wrong' } } : preset);
    const invalidController = createLabThemeController({ presets: invalidPresets });
    const beforeInvalid = invalidController.getSnapshot();
    const invalid = invalidController.activate('bunny');
    expect(invalid.ok).toBe(false);
    expect(invalidController.getSnapshot()).toBe(beforeInvalid);
    if (!invalid.ok) expect(invalid.diagnostics[0]).toMatchObject({ code: 'THEME_MIGRATION_INPUT_INVALID' });

    const missingController = createLabThemeController({ availableAssets: new Set(['icons.minimal', 'image.deep-current-stage']) });
    const beforeMissing = missingController.getSnapshot();
    const missing = missingController.activate('bunny');
    expect(missing.ok).toBe(false);
    expect(missingController.getSnapshot()).toBe(beforeMissing);
    if (!missing.ok) expect(missing.diagnostics[0]).toMatchObject({ code: 'THEME_ASSET_MISSING' });
  });

  it('falls back from unknown preference and persists only the Lab preset ID', () => {
    expect(createLabThemeController({ initialId: 'removed-theme' }).getSnapshot().activeId).toBe('deep-current');
    window.localStorage.clear();
    const preference = createLocalThemePreference(window.localStorage);
    preference.write('pom-neutral');
    expect(preference.read()).toBe('pom-neutral');
    expect(window.localStorage.getItem(LAB_THEME_KEY)).toBe('pom-neutral');
    expect(window.localStorage.length).toBe(1);
  });
});
