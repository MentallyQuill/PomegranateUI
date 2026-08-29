import { describe, expect, it } from 'vitest';

import { contrastRatio, resolveTheme } from '@pomegranate-ui/theme';
import { BUNNY_THEME } from './bunny.js';
import { compileThemeBindings } from './bindings.js';
import { createLabThemeController } from './controller.js';
import { DEEP_CURRENT_THEME } from './deep-current.js';
import { LAB_THEME_IDS, LAB_THEME_PRESETS } from './presets.js';
import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { createLocalThemePreference, LAB_THEME_KEY } from './theme-storage.js';

describe('Workbench Lab theme conformance', () => {
  it.each(LAB_THEME_IDS)('resolves the complete %s Lab preset', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    expect(preset).toBeDefined();
    const result = resolveTheme(preset?.definition);
    expect(result.ok).toBe(true);
  });

  it.each([
    { id: 'deep-current', cornerFamily: 'chamfered', density: 'compact' },
    { id: 'pom-neutral', cornerFamily: 'rounded', density: 'balanced' },
    { id: 'bunny', cornerFamily: 'rounded', density: 'roomy' }
  ] as const)('gives $id visibly frosted structural materials', ({ id, cornerFamily, density }) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    const result = resolveTheme(preset?.definition);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.theme.materials.shelf.blurPx, `${id}: shelf blur`).toBeGreaterThanOrEqual(16);
    expect(result.theme.materials.panel.blurPx, `${id}: panel blur`).toBeGreaterThanOrEqual(12);
    expect(result.theme.materials.shelf.opacity, `${id}: shelf translucency`).toBeLessThan(0.95);
    expect(result.theme.materials.panel.opacity, `${id}: panel translucency`).toBeLessThan(0.9);
    expect(result.theme.geometry.cornerFamily).toBe(cornerFamily);
    expect(result.theme.spacing.density).toBe(density);
    expect(result.theme.canvas.some((layer) => layer.kind !== 'solid')).toBe(true);
  });

  it.each(LAB_THEME_IDS)('uses only packaged primary fonts and generic fallbacks in %s', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    expect(preset).toBeDefined();
    if (!preset) return;
    const packaged = new Set(['Pomegranate Sans', 'Pomegranate Serif', 'Pomegranate Mono']);
    const generic = new Set(['monospace', 'sans-serif', 'serif', 'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif']);
    const roles = [
      preset.definition.typography.ui,
      preset.definition.typography.prose,
      preset.definition.typography.technical,
      preset.definition.typography.display
    ].filter((role) => role !== undefined);
    for (const role of roles) {
      expect(packaged.has(role.family), `${id}: ${role.family}`).toBe(true);
      expect(role.fallbacks.every((fallback) => generic.has(fallback)), `${id}: ${role.fallbacks.join(', ')}`).toBe(true);
    }
  });

  it('keeps the stable neutral id while presenting the target as blue-glass PomOS', () => {
    expect(POM_NEUTRAL_THEME).toMatchObject({
      id: 'pom-neutral',
      label: 'PomOS',
      colors: { canvas: '#1687ed', accent: '#0868c4' },
      geometry: { cornerSm: 10, cornerMd: 18, cornerLg: 24 },
      spacing: { chromeHeight: 36 },
      typography: {
        prose: { family: 'Pomegranate Sans' },
        technical: { family: 'Pomegranate Sans' }
      }
    });
    expect(POM_NEUTRAL_THEME.canvas).toContainEqual(expect.objectContaining({
      kind: 'four-corner',
      topLeft: '#8bd6ff',
      topRight: '#1687ed'
    }));
    expect(POM_NEUTRAL_THEME.canvas.filter((layer) => layer.kind === 'radial-gradient')).toHaveLength(3);
  });

  it.each(LAB_THEME_IDS)('keeps rendered text and interaction colors readable in %s', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    const result = resolveTheme(preset?.definition);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { colors, accessibility } = result.theme;
    for (const background of [colors.canvas, colors.surface, colors.surfaceElevated, colors.surfaceInset]) {
      expect(contrastRatio(colors.text, background)).toBeGreaterThanOrEqual(accessibility.minimumContrast);
      expect(contrastRatio(colors.textMuted, background)).toBeGreaterThanOrEqual(accessibility.minimumContrast);
      expect(contrastRatio(colors.textFaint, background), `${id}: faint text on ${background}`).toBeGreaterThanOrEqual(accessibility.minimumContrast);
    }
    expect(contrastRatio(colors.textOnAccent, colors.accent)).toBeGreaterThanOrEqual(accessibility.minimumContrast);
    expect(contrastRatio(colors.focus, colors.canvas)).toBeGreaterThanOrEqual(accessibility.minimumContrast);
  });

  it('compiles semantic values and ordered canvas layers without a theme-id selector', () => {
    const result = resolveTheme(BUNNY_THEME);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const cssText = compileThemeBindings(result.theme);
    expect(cssText).toContain('--pom-color-text:#45364d');
    expect(cssText).toContain('--pom-radius-widget:17px');
    expect(cssText).toContain('--pom-canvas:');
    expect(cssText).not.toContain('data-pom-theme');
    expect(cssText).not.toContain('transition');
  });

  it('declares the Deep Current stage image as a local semantic theme asset', () => {
    expect(DEEP_CURRENT_THEME.assets).toContainEqual({
      id: 'image.deep-current-stage',
      kind: 'image',
      required: true
    });
    expect(DEEP_CURRENT_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({
      kind: 'image',
      assetId: 'image.deep-current-stage',
      fit: 'cover'
    });
    expect(DEEP_CURRENT_THEME.capabilities.localImages).toBe(true);
  });

  it('declares the Bunny garden canvas as a local semantic theme asset', () => {
    expect(BUNNY_THEME.assets).toContainEqual({
      id: 'image.bunny-garden',
      kind: 'image',
      required: true
    });
    expect(BUNNY_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({
      kind: 'image',
      assetId: 'image.bunny-garden',
      fit: 'cover'
    });
    expect(BUNNY_THEME.capabilities.localImages).toBe(true);
  });

  it('expresses the preserved Deep Current shell materials through theme tokens', () => {
    expect(DEEP_CURRENT_THEME.colors).toMatchObject({
      canvas: '#080c0d',
      surfaceInset: '#040708',
      chrome: '#0b1213',
      accent: '#94d9d0'
    });
    expect(DEEP_CURRENT_THEME.materials.shelf).toMatchObject({
      base: 'chrome',
      opacity: 0.62,
      blurPx: 24,
      saturation: 0.9
    });
    expect(DEEP_CURRENT_THEME.materials.panel).toMatchObject({
      base: 'surfaceInset',
      opacity: 0.48,
      blurPx: 20,
      saturation: 0.92
    });
  });

  it('pins the PomOS and Bunny visual target contracts', () => {
    expect(POM_NEUTRAL_THEME).toMatchObject({
      id: 'pom-neutral',
      label: 'PomOS',
      colors: { canvas: '#1687ed', surfaceElevated: '#ffffff', accent: '#0868c4', focus: '#071d38' },
      geometry: { cornerFamily: 'rounded', cornerMd: 18, cornerLg: 24 },
      spacing: { density: 'balanced' },
      capabilities: { localImages: false, textures: false, translucency: true }
    });
    expect(POM_NEUTRAL_THEME.canvas.every((layer) => layer.kind !== 'image')).toBe(true);
    expect(BUNNY_THEME).toMatchObject({
      id: 'bunny',
      colors: { canvas: '#faeef6', surfaceElevated: '#fffdfb', accent: '#ed75aa', focus: '#6951a1' },
      geometry: { cornerFamily: 'rounded', cornerMd: 17, cornerLg: 26, cornerPill: 999 },
      spacing: { density: 'roomy' },
      capabilities: { localImages: true, textures: false, translucency: true }
    });
    expect(BUNNY_THEME.canvas.some((layer) => layer.kind === 'four-corner')).toBe(true);
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

  it('projects the recovered material controls onto the active theme', () => {
    const controller = createLabThemeController({
      availableAssets: new Set(['icons.minimal', 'image.deep-current-stage', 'image.bunny-garden'])
    });

    expect(controller.getSnapshot().materialControls).toEqual({
      glassDensity: 30,
      barOpacity: 60,
      selectedStrength: 6,
      frostLevel: 30
    });
    expect(controller.getSnapshot().resolved.materials.widget.opacity).toBe(0.3);
    expect(controller.getSnapshot().resolved.materials.shelf.opacity).toBe(0.6);
    expect(controller.getSnapshot().resolved.materials.widget.blurPx).toBe(7.2);
    expect(controller.getSnapshot().cssText).toContain('--pom-selected-strength:6%');
    expect(controller.getSnapshot().cssText).toContain('--pom-glass-density:30%');
    expect(controller.getSnapshot().cssText).toContain('--pom-bar-opacity:60%');
    expect(controller.getSnapshot().cssText).toContain('--pom-handle-density:54%');
    expect(controller.getSnapshot().cssText).toContain('--pom-frost-level:30%');
    expect(controller.getSnapshot().cssText).toContain('--pom-frost-blur:7.2px');

    const bunny = controller.activate('bunny');
    expect(bunny.ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({
      glassDensity: 20,
      barOpacity: 60,
      selectedStrength: 6,
      frostLevel: 20
    });
    expect(controller.getSnapshot().resolved.materials.widget.opacity).toBe(0.2);
    expect(controller.getSnapshot().resolved.materials.widget.blurPx).toBe(4.8);
  });

  it('compiles true transparent and opaque endpoints for every recovered material layer', () => {
    const controller = createLabThemeController();
    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) {
      expect(controller.setMaterialControl(id, 0).ok).toBe(true);
    }
    expect(controller.getSnapshot().cssText).toContain('--pom-material-glass-highlight:rgb(255 255 255 / 0)');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-frost-haze:rgb(255 255 255 / 0)');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-frost-accent:rgb(148 217 208 / 0)');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-bar-highlight:rgb(255 255 255 / 0)');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-panel-fallback-surface:rgb(4 7 8 / 0)');
    expect(controller.getSnapshot().cssText).toContain('--pom-handle-density:24%');

    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) {
      expect(controller.setMaterialControl(id, 100).ok).toBe(true);
    }
    expect(controller.getSnapshot().cssText).toContain('--pom-glass-density:100%');
    expect(controller.getSnapshot().cssText).toContain('--pom-bar-opacity:100%');
    expect(controller.getSnapshot().cssText).toContain('--pom-handle-density:100%');
    expect(controller.getSnapshot().cssText).toContain('--pom-frost-blur:24px');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-frost-haze:rgb(255 255 255 / 0.2)');
    expect(controller.getSnapshot().cssText).toContain('--pom-material-frost-accent:rgb(148 217 208 / 0.06)');
  });

  it('retains independent material drafts while switching and resets only the active theme', () => {
    const controller = createLabThemeController({
      availableAssets: new Set(['icons.minimal', 'image.deep-current-stage', 'image.bunny-garden'])
    });
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.setMaterialControl('glassDensity', 38).ok).toBe(true);
    expect(controller.setMaterialControl('frostLevel', 45).ok).toBe(true);
    expect(controller.getSnapshot().resolved.materials.dialog).toMatchObject({ opacity: 0.38, blurPx: 10.8 });

    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.setMaterialControl('barOpacity', 44).ok).toBe(true);
    expect(controller.getSnapshot().resolved.materials.shelf.opacity).toBe(0.44);

    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toMatchObject({ glassDensity: 38, frostLevel: 45 });
    expect(controller.resetMaterialControls().ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({
      glassDensity: 20,
      barOpacity: 60,
      selectedStrength: 6,
      frostLevel: 20
    });
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
    const controller = createLabThemeController({
      presets,
      availableAssets: new Set(['icons.minimal', 'image.deep-current-stage'])
    });
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
