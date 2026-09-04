import { describe, expect, it } from 'vitest';

import { THEME_COLOR_ROLES, THEME_PART_IDS } from '@pomegranate-ui/contracts';
import {
  compileThemeBindings,
  contrastRatio,
  createThemeDraft,
  hexToHsv,
  projectThemeDraft,
  resolveThemeTarget,
  resolveThemeV2,
  validateThemePalette,
  type ThemePaletteRoleGroupConstraint
} from '@pomegranate-ui/theme';
import { ASH_AMBER_THEME } from './ash-amber.js';
import { BUNNY_THEME } from './bunny.js';
import { createLabThemeController } from './controller.js';
import { DEEP_CURRENT_THEME } from './deep-current.js';
import { defaultMaterialControls, materialControlPresentationStyle } from './material-controls.js';
import { LAB_THEME_IDS, LAB_THEME_PRESETS, LAB_THEME_TARGETS } from './presets.js';
import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { createLocalThemePreference, LAB_THEME_KEY } from './theme-storage.js';

const assetRegistry = {
  'icons.minimal': { kind: 'icon-pack' as const, source: 'icons.minimal' },
  'image.atmospheric-reservoir': { kind: 'image' as const, source: '/assets/atmospheric-reservoir-stage.jpg' },
  'image.pomos-tahoe': { kind: 'image' as const, source: '/assets/pomos-tahoe-canvas.webp' },
  'image.bunny-garden': { kind: 'image' as const, source: '/assets/bunny-garden.webp' },
  'image.ash-amber-stage': { kind: 'image' as const, source: '/assets/ash-amber-stage.webp' }
};

const EXPECTED_ASH_CONSTRAINTS = [
  {
    id: 'ash-neutral-chrome',
    roles: ['canvas', 'surface', 'surfaceElevated', 'surfaceInset', 'chrome', 'border', 'borderStrong', 'shadow'],
    maximumSaturation: 0.2
  },
  {
    id: 'ash-no-purple-magenta',
    roles: THEME_COLOR_ROLES,
    hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
  },
  {
    id: 'ash-restrained-accents',
    roles: ['accent', 'selection', 'focus', 'warning'],
    maximumSaturation: 0.7
  }
] as const satisfies readonly ThemePaletteRoleGroupConstraint[];

function collectHexValues(value: unknown): string[] {
  if (typeof value === 'string') return /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectHexValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectHexValues);
  return [];
}

describe('Workbench Lab theme conformance', () => {
  it('activates only complete target snapshots with separated resolved and compiled owners', () => {
    const snapshot = createLabThemeController().getSnapshot() as any;

    expect(snapshot.resolved).toMatchObject({
      id: 'deep-current',
      theme: { schemaVersion: 'pomegranate.ui.theme.v2', id: 'deep-current' },
      canvas: { schemaVersion: 'pomegranate.ui.canvas.v1', id: 'deep-current' },
      ambient: { schemaVersion: 'pomegranate.ui.ambient.v1', id: 'deep-current' }
    });
    expect(snapshot.compiled).toMatchObject({
      id: 'deep-current',
      theme: { id: 'deep-current' },
      ambient: { id: 'deep-current' }
    });
    expect(Object.keys(snapshot.compiled.bindings)).toContain('--pom-ambient-power');
    expect(snapshot.compiled.canvas).toHaveLength(snapshot.resolved.canvas.layers.length);
  });

  it('declares exactly four complete local target bundles including Ash & Amber', () => {
    expect(LAB_THEME_TARGETS.map(({ id }) => id)).toEqual(['deep-current', 'pom-neutral', 'bunny', 'ash-amber']);
    expect(new Set(LAB_THEME_TARGETS.map(({ id }) => id)).size).toBe(4);
    expect(LAB_THEME_TARGETS.map(({ target }) => target.theme.label)).toEqual(['Deep Current', 'PomOS', 'Bunny', 'Ash & Amber']);

    for (const { id, target } of LAB_THEME_TARGETS) {
      expect(target).toMatchObject({
        schemaVersion: 'pomegranate.ui.theme-target.v1',
        id,
        theme: { schemaVersion: 'pomegranate.ui.theme.v3', id },
        canvas: { schemaVersion: 'pomegranate.ui.canvas.v1', id },
        ambient: { schemaVersion: 'pomegranate.ui.ambient.v1', id }
      });
      expect(target.theme).not.toHaveProperty('canvas');
      expect(target.canvas).not.toHaveProperty('materials');
      expect(JSON.stringify(target)).not.toMatch(/https?:\/\//);
      const resolution = resolveThemeTarget(target, assetRegistry);
      expect(resolution.ok, resolution.ok ? undefined : JSON.stringify(resolution.diagnostics)).toBe(true);
    }
  });

  it('declares data-only canvas authoring profiles for every Lab preset', () => {
    expect(LAB_THEME_PRESETS.map(({ id, canvasAuthoring }) => ({
      id,
      groups: [...new Set(canvasAuthoring.layers.flatMap(({ authoringGroup }) => authoringGroup ? [authoringGroup] : []))],
      defaults: canvasAuthoring.defaults
    }))).toEqual([
      expect.objectContaining({ id: 'deep-current', groups: expect.arrayContaining(['image', 'overlay', 'vignette']) }),
      expect.objectContaining({ id: 'pom-neutral', groups: expect.arrayContaining(['image', 'overlay', 'vignette']) }),
      expect.objectContaining({ id: 'bunny', groups: expect.arrayContaining(['image', 'overlay', 'vignette']) }),
      expect.objectContaining({ id: 'ash-amber', groups: expect.arrayContaining(['image', 'overlay', 'vignette']) })
    ]);
  });

  it('pins Ash Theme Canvas defaults to the approved composition', () => {
    const ash = LAB_THEME_PRESETS.find(({ id }) => id === 'ash-amber');

    expect(ash?.canvasAuthoring.defaults).toEqual({
      imageStrength: 100,
      overlayStrength: 90,
      gradientAngle: 90,
      vignetteStrength: 40
    });
  });

  it('calibrates instrumented presentation materials continuously through their authored defaults', () => {
    const defaults = defaultMaterialControls('deep-current');
    const style = materialControlPresentationStyle(defaults, '#244c4a');

    expect(style).toContain('--pom-presentation-instrumented-glass-fill:rgb(4 7 8 / 0.2)');
    expect(style).toContain('--pom-presentation-instrumented-mobile-glass-fill:rgb(4 7 8 / 0.88)');
    expect(style).toContain('--pom-presentation-instrumented-bar-fill:rgb(11 18 19 / 0.6)');
    expect(style).toContain('--pom-presentation-instrumented-selected-fill:rgb(17 28 27 / 1)');
    expect(style).toContain('--pom-presentation-instrumented-mobile-selected-fill:rgb(17 28 27 / 0.82)');
    expect(style).toContain('--pom-presentation-instrumented-frost-backdrop:blur(12px) saturate(.82)');
    expect(style).toContain('--pom-presentation-instrumented-mobile-frost-backdrop:blur(18px) saturate(.82)');
  });

  it.each(LAB_THEME_PRESETS)('$id authoring defaults reproduce the authored target canvas exactly', ({ target, canvasAuthoring }) => {
    const draft = createThemeDraft(target, canvasAuthoring.defaults);
    expect(draft.colors).toEqual(createThemeDraft(target).colors);
    const projected = projectThemeDraft(target, draft, target.ambient, canvasAuthoring);

    expect(projected.ok, projected.ok ? undefined : JSON.stringify(projected.diagnostics)).toBe(true);
    if (!projected.ok) return;
    expect(projected.target.canvas.layers).toEqual(target.canvas.layers);
  });

  it('pins Ash & Amber to the corrected neutral palette, semantic chrome, and restrained amber canvas accents', () => {
    const ash = LAB_THEME_TARGETS.find(({ id }) => id === 'ash-amber')?.target;

    expect(ash?.theme).toMatchObject({
      label: 'Ash & Amber',
      colors: {
        canvas: '#242321',
        surface: '#302E2A',
        surfaceElevated: '#413D36',
        surfaceInset: '#191918',
        chrome: '#625B52',
        accent: '#C18A3D',
        selection: '#51493E',
        focus: '#E0B568',
        text: '#F3F0EA',
        warning: '#D2B57A'
      }
    });
    expect(ash?.ambient).toEqual({
      schemaVersion: 'pomegranate.ui.ambient.v1',
      id: 'ash-amber',
      colorRole: 'selection',
      position: { x: 0.57, y: 0.97 },
      radius: 0.6,
      power: 0.56
    });
    expect(defaultMaterialControls('ash-amber')).toEqual({
      glassDensity: 20,
      barOpacity: 60,
      selectedStrength: 6,
      frostLevel: 50
    });
    expect(ash?.theme.materials.header).toMatchObject({ base: 'chrome', fallback: 'chrome' });
    expect(ash?.theme.materials.shelf).toMatchObject({ base: 'chrome', fallback: 'surface' });
    expect(ash?.theme.recipes.parts['widget.header'].material).toBe('header');
    expect(ash?.theme.recipes.parts['chrome.shelf'].material).toBe('shelf');
    expect(ash?.canvas.layers).toEqual([
      { kind: 'solid', color: '#242321' },
      expect.objectContaining({ kind: 'image', assetId: 'image.ash-amber-stage', opacity: 0.72, saturation: 0.82 }),
      {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { color: '#191918D3', position: 0 },
          { color: '#302E2A81', position: 0.5 },
          { color: '#242321CA', position: 1 }
        ]
      },
      {
        kind: 'radial-gradient',
        shape: 'ellipse',
        x: 0.57,
        y: 0.97,
        stops: [
          { color: '#D2B57A3C', position: 0 },
          { color: '#625B521C', position: 0.34 },
          { color: '#24232100', position: 0.68 }
        ]
      },
      { kind: 'veil', mode: 'reading', color: '#302E2A', opacity: 0.112 }
    ]);
  });

  it('exports opt-in Ash palette constraints and rejects no ordinary palette globally', async () => {
    const ashModule = await import('./ash-amber.js') as Record<string, unknown>;
    expect(ashModule.ASH_AMBER_PALETTE_CONSTRAINTS).toEqual(EXPECTED_ASH_CONSTRAINTS);
    expect(validateThemePalette(
      ASH_AMBER_THEME.colors,
      ashModule.ASH_AMBER_PALETTE_CONSTRAINTS as readonly ThemePaletteRoleGroupConstraint[]
    )).toEqual({ ok: true, diagnostics: [] });
  });

  it('contains no purple or magenta raw target color and keeps neutral fallbacks under reduced transparency', () => {
    const ash = LAB_THEME_TARGETS.find(({ id }) => id === 'ash-amber')!.target;
    for (const hex of collectHexValues(ash)) {
      const { hue, saturation } = hexToHsv(hex.slice(0, 7));
      expect(
        saturation < 0.06 || hue < 270 || hue > 350,
        `Ash & Amber contains excluded purple/magenta ${hex} at hue ${hue} and saturation ${saturation}`
      ).toBe(true);
    }

    const reduced = createLabThemeController({
      initialId: 'ash-amber',
      devicePolicy: { reducedTransparency: true, backdropFilterSupported: false }
    }).getSnapshot().compiled.theme;
    expect(reduced.recipes.parts['widget.header'].material).toBe('opaque');
    expect(reduced.recipes.parts['chrome.shelf'].material).toBe('opaque');
    expect(reduced.materials.opaque).toMatchObject({
      base: '#302E2A',
      fallback: '#302E2A',
      opacity: 1,
      backdrop: { blurPx: 0, saturation: 1, brightness: 1 }
    });
  });

  it('uses rounded 4px bevel geometry with no chamfered Ash silhouettes', () => {
    for (const shape of ['chrome', 'pane', 'header', 'content', 'group', 'row', 'field', 'button'] as const) {
      expect(ASH_AMBER_THEME.shapes[shape]).toMatchObject({ family: 'rounded', radiusPx: 4, chamferPx: 0 });
    }
  });

  it.each(LAB_THEME_IDS)('authors and resolves %s directly as a complete target', (id) => {
    const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
    expect(preset?.target.schemaVersion).toBe('pomegranate.ui.theme-target.v1');
    const result = resolveThemeTarget(preset?.target, assetRegistry);
    expect(result.ok, result.ok ? undefined : JSON.stringify(result.diagnostics)).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.target.theme.recipes.parts)).toEqual([...THEME_PART_IDS]);
    expect(Object.isFrozen(result.target)).toBe(true);
  });

  it.each([
    { theme: DEEP_CURRENT_THEME, family: 'rounded', density: 'compact', grouping: 'unified' },
    { theme: POM_NEUTRAL_THEME, family: 'continuous-rounded', density: 'balanced', grouping: 'individual' },
    { theme: BUNNY_THEME, family: 'continuous-rounded', density: 'roomy', grouping: 'individual' },
    { theme: ASH_AMBER_THEME, family: 'rounded', density: 'compact', grouping: 'unified' }
  ] as const)('gives $theme.id a distinct material, shape, and composition identity', ({ theme, family, density, grouping }) => {
    expect(theme.shapes.pane?.family).toBe(family);
    expect(theme.spacing.density).toBe(density);
    expect(theme.recipes.widgetGrouping).toBe(grouping);
    expect(theme.materials.pane?.backdrop.blurPx).toBeGreaterThan(0);
    expect(theme.materials.pane?.opacity).toBeLessThan(0.9);
    expect(theme.canvas.some((layer) => layer.kind !== 'solid')).toBe(true);
  });

  it.each([DEEP_CURRENT_THEME, ASH_AMBER_THEME])('$label uses the tonal 4px bevel contract without chamfered silhouettes', (theme) => {
    for (const shape of ['chrome', 'pane', 'header', 'content', 'group', 'row', 'field', 'button'] as const) {
      expect(theme.shapes[shape]).toMatchObject({ family: 'rounded', radiusPx: 4, chamferPx: 0 });
    }
  });

  it('selects the instrumented shell through Deep theme data without changing other compact themes', () => {
    expect(DEEP_CURRENT_THEME.recipes.shellPresentation).toBe('instrumented');
    expect(ASH_AMBER_THEME.recipes.shellPresentation).toBeUndefined();
  });

  it('compiles Deep Current free edges as an upper highlight and lower shadow tonal bevel', () => {
    const result = resolveThemeV2(DEEP_CURRENT_THEME, assetRegistry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bindings = compileThemeBindings(result.theme);
    const widgetShadow = bindings['--pom-part-widget-surface-material-shadow'];

    expect(widgetShadow).toContain('inset 0px 1px 0 0');
    expect(widgetShadow).toContain('inset 0px -1px 0px 0px');
    expect(bindings['--pom-part-widget-surface-radius']).toBe('4px 4px 4px 4px');
    expect(bindings['--pom-part-widget-surface-clip-path']).toBe('none');
  });

  it('pins every preset to its approved bundled, theme-owned font combination', () => {
    expect(Object.fromEntries(LAB_THEME_PRESETS.map(({ id, target }) => [id, {
      ui: target.theme.typography.ui.family,
      prose: target.theme.typography.prose.family,
      display: target.theme.typography.display?.family,
      technical: target.theme.typography.technical.family
    }]))).toEqual({
      'deep-current': { ui: 'Pomegranate Sans', prose: 'Pomegranate Serif', display: 'Pomegranate Serif', technical: 'Pomegranate Mono' },
      'pom-neutral': { ui: 'Inter', prose: 'Inter', display: 'Inter', technical: 'Roboto Mono' },
      bunny: { ui: 'Nunito', prose: 'Fraunces', display: 'Fraunces', technical: 'Nunito' },
      'ash-amber': { ui: 'Source Sans 3', prose: 'Alegreya', display: 'Alegreya', technical: 'Source Sans 3' }
    });
  });

  it.each(LAB_THEME_IDS)('uses only bundled primary fonts and generic fallbacks in %s', (id) => {
    const theme = LAB_THEME_PRESETS.find((candidate) => candidate.id === id)!.target.theme;
    const packaged = new Set([
      'Pomegranate Sans', 'Pomegranate Serif', 'Pomegranate Mono',
      'Inter', 'Roboto Mono', 'Nunito', 'Fraunces', 'Source Sans 3', 'Alegreya'
    ]);
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
      shapes: { pane: { family: 'continuous-rounded', radiusPx: 20 } },
      controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } }
    });
    expect(POM_NEUTRAL_THEME.materials.panel).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 }, shadows: [] });
    expect(POM_NEUTRAL_THEME.materials.pane).toMatchObject({ opacity: 0.3, backdrop: { blurPx: 34 } });
    expect(POM_NEUTRAL_THEME.recipes.parts['group.surface']).toMatchObject({ material: 'pane', overflow: 'clip' });
    expect(POM_NEUTRAL_THEME.materials.header?.backdrop.blurPx).toBe(0);
    expect(POM_NEUTRAL_THEME.materials.content?.backdrop.blurPx).toBe(0);
    expect(POM_NEUTRAL_THEME.assets).toContainEqual({ id: 'image.pomos-tahoe', kind: 'image', required: true });
    expect(POM_NEUTRAL_THEME.capabilities.localImages).toBe(true);
    expect(POM_NEUTRAL_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({
      assetId: 'image.pomos-tahoe',
      fit: 'cover',
      opacity: 1,
      blurPx: 0
    });
  });

  it('pins Bunny to the expressive stationery target with its local garden canvas', () => {
    const preset = LAB_THEME_PRESETS.find(({ id }) => id === 'bunny');

    expect(preset).toBeDefined();
    expect(BUNNY_THEME).toMatchObject({
      colors: {
        canvas: '#faeef6',
        accent: '#ed75aa',
        text: '#45364d',
        border: '#e8cddd',
        borderStrong: '#c891ae'
      },
      shapes: {
        chrome: { radiusPx: 24 },
        shell: { radiusPx: 26 },
        dock: { radiusPx: 20 },
        pane: { radiusPx: 17 },
        reader: { radiusPx: 18, joinedEdges: [] }
      },
      recipes: { widgetGrouping: 'individual', chromePresentation: 'full', actionPresentation: 'always' }
    });
    expect(BUNNY_THEME.assets).toContainEqual({ id: 'image.bunny-garden', kind: 'image', required: true });
    expect(BUNNY_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({
      assetId: 'image.bunny-garden', fit: 'cover', opacity: 1, saturation: 1
    });
    expect(preset?.surfaceExpression).toMatchObject({
      schemaVersion: 'pomegranate.ui.surface-expression.v1',
      id: 'bunny-stationery',
      shapes: {
        chrome: { cornerRadiiPx: { topLeft: 24, topRight: 24, bottomRight: 12, bottomLeft: 12 } },
        shell: { cornerRadiiPx: { topLeft: 12, topRight: 12, bottomRight: 26, bottomLeft: 26 } }
      },
      parts: {
        'widget.content': { typeScale: 'lg', textTransform: 'none' }
      }
    });
    expect(preset?.surfaceExpression?.materials).not.toHaveProperty('shelf');
    expect(preset?.surfaceExpression?.materials).not.toHaveProperty('pane');
    expect(preset?.surfaceExpression?.materials).not.toHaveProperty('menu');
    expect(preset?.surfaceExpression?.materials).not.toHaveProperty('dialog');
    expect(preset?.surfaceExpression?.materials).not.toHaveProperty('floating');
  });

  it.each(LAB_THEME_IDS)('keeps opaque semantic text pairings readable in %s', (id) => {
    const theme = LAB_THEME_PRESETS.find((candidate) => candidate.id === id)!.target.theme;
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
    expect(bindings['--pom-radius-widget']).toContain('17px');
    expect(Object.values(bindings).join(';')).not.toContain('data-pom-theme');
    expect(Object.values(bindings).join(';')).not.toContain('transition');
  });

  it('keeps the reusable Deep theme image-neutral while the Atmospheric Lab target owns its declared fixture', () => {
    const deepLabTarget = LAB_THEME_PRESETS.find(({ id }) => id === 'deep-current')!.target;
    expect(DEEP_CURRENT_THEME.assets.some(({ kind }) => kind === 'image')).toBe(false);
    expect(DEEP_CURRENT_THEME.canvas.some(({ kind }) => kind === 'image')).toBe(false);
    expect(DEEP_CURRENT_THEME.capabilities.localImages).toBe(false);
    expect(deepLabTarget.theme.assets).toContainEqual({ id: 'image.atmospheric-reservoir', kind: 'image', required: true });
    expect(deepLabTarget.canvas.layers.find((layer) => layer.kind === 'image')).toMatchObject({ assetId: 'image.atmospheric-reservoir', fit: 'cover' });
    expect(BUNNY_THEME.assets).toContainEqual({ id: 'image.bunny-garden', kind: 'image', required: true });
    expect(BUNNY_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({ assetId: 'image.bunny-garden', fit: 'cover' });
    expect(ASH_AMBER_THEME.assets).toContainEqual({ id: 'image.ash-amber-stage', kind: 'image', required: true });
    expect(ASH_AMBER_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({ assetId: 'image.ash-amber-stage', fit: 'cover' });
  });

  it('switches one complete binding and persists only after validation succeeds', () => {
    const writes: string[] = [];
    const controller = createLabThemeController({ preference: { read: () => null, write: (id) => writes.push(id) } });
    const before = controller.getSnapshot();
    const result = controller.activate('bunny');
    expect(result.ok).toBe(true);
    expect(controller.getSnapshot().activeId).toBe('bunny');
    expect(controller.getSnapshot().cssText).not.toBe(before.cssText);
    expect(controller.getSnapshot().compiled.canvas.length).toBeGreaterThan(0);
    expect(writes).toEqual(['bunny']);
  });

  it('atomically replaces PomOS reader expression bindings with Bunny stationery bindings', () => {
    const controller = createLabThemeController({ initialId: 'pom-neutral' });
    expect(controller.getSnapshot().expressionBindings).toEqual({
      '--pom-expression-widget-content-background-image': 'linear-gradient(150deg, rgba(255, 255, 255, 0.7) 0%, rgba(234, 244, 255, 0.66) 100%)'
    });

    const result = controller.activate('bunny');
    expect(result.ok).toBe(true);
    expect(controller.getSnapshot().cssText).toContain('--pom-expression-panel-surface-radius:12px 12px 26px 26px');
    expect(controller.getSnapshot().cssText).toContain('--pom-expression-widget-content-radius:18px 18px 18px 18px');
    expect(controller.getSnapshot().cssText).toContain('--pom-expression-widget-content-font-size:17px');
    expect(controller.getSnapshot().cssText).toContain('--pom-expression-panel-surface-background-image:linear-gradient(150deg');
    expect(controller.getSnapshot().cssText).not.toContain('--pom-expression-widget-surface-background-image');

    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.getSnapshot().cssText).not.toContain('--pom-expression-');
  });

  it('projects Ash readability through target expression data without changing Deep rail defaults', () => {
    const controller = createLabThemeController({ initialId: 'deep-current' });
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-widget-header-font-size');
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-row-surface-font-size');
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-slider-input-font-size');

    expect(controller.activate('ash-amber').ok).toBe(true);
    expect(controller.getSnapshot().expressionBindings).toMatchObject({
      '--pom-expression-widget-header-font-size': '11px',
      '--pom-expression-row-surface-font-size': '11px',
      '--pom-expression-slider-input-font-size': '11px'
    });

    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-widget-header-font-size');
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-row-surface-font-size');
    expect(controller.getSnapshot().expressionBindings).not.toHaveProperty('--pom-expression-slider-input-font-size');
  });

  it('compiles Bunny expression after reduced-transparency policy redirects decorative materials', () => {
    const controller = createLabThemeController({
      initialId: 'bunny',
      devicePolicy: { reducedTransparency: true }
    });

    expect(controller.getSnapshot().compiled.theme.recipes.parts['widget.surface'].material).toBe('opaque');
    expect(controller.getSnapshot().cssText).not.toContain('--pom-expression-widget-surface-background-image');
    expect(controller.getSnapshot().cssText).toContain('--pom-expression-widget-surface-radius:17px 17px 17px 17px');
  });

  it('retains the last complete snapshot when a preset carries an invalid expression profile', () => {
    const presets = LAB_THEME_PRESETS.map((preset) => preset.id === 'bunny'
      ? { ...preset, surfaceExpression: { ...preset.surfaceExpression, unexpected: true } }
      : preset);
    const writes: string[] = [];
    const controller = createLabThemeController({
      presets,
      initialId: 'deep-current',
      preference: { read: () => null, write: (id) => writes.push(id) }
    });
    const before = controller.getSnapshot();

    const result = controller.activate('bunny');

    expect(result.ok).toBe(false);
    expect(controller.getSnapshot()).toBe(before);
    expect(writes).toEqual([]);
    if (!result.ok) expect(result.diagnostics[0]).toMatchObject({
      code: 'THEME_SCHEMA_INVALID',
      path: ['surfaceExpression']
    });
  });

  it('projects recovered controls through bounded public theme policy', () => {
    const controller = createLabThemeController();
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 });
    expect(controller.getSnapshot().compiled.theme.materials.pane?.opacity).toBe(0.2);
    expect(controller.getSnapshot().compiled.theme.materials.shelf?.opacity).toBe(0.6);
    expect(controller.getSnapshot().compiled.theme.materials.pane?.backdrop.blurPx).toBe(20);

    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 24, barOpacity: 72, selectedStrength: 62, frostLevel: 24 });
    expect(controller.getSnapshot().compiled.theme.materials.pane?.opacity).toBe(0.24);
    expect(controller.getSnapshot().compiled.theme.materials.pane?.backdrop.blurPx).toBe(9.6);
  });

  it('applies the host device policy before compiling a snapshot', () => {
    const controller = createLabThemeController({
      initialId: 'pom-neutral',
      devicePolicy: { reducedTransparency: true, coarsePointer: true }
    });
    expect(controller.getSnapshot().compiled.theme.recipes.parts['widget.surface'].material).toBe('opaque');
    expect(controller.getSnapshot().compiled.theme.materials.opaque).toMatchObject({ opacity: 1, backdrop: { blurPx: 0 } });
    expect(controller.getSnapshot().compiled.theme.controls.slider.hitTargetPx).toBeGreaterThanOrEqual(44);
  });

  it('compiles true transparent and opaque endpoints for controlled materials', () => {
    const controller = createLabThemeController();
    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) expect(controller.setMaterialControl(id, 0).ok).toBe(true);
    expect(controller.getSnapshot().compiled.theme.materials.pane).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 } });
    expect(controller.getSnapshot().compiled.theme.materials.shelf).toMatchObject({ opacity: 0, backdrop: { blurPx: 0 } });
    for (const id of ['glassDensity', 'barOpacity', 'selectedStrength', 'frostLevel'] as const) expect(controller.setMaterialControl(id, 100).ok).toBe(true);
    expect(controller.getSnapshot().compiled.theme.materials.pane).toMatchObject({ opacity: 1, backdrop: { blurPx: 40 } });
    expect(controller.getSnapshot().compiled.theme.materials.selected?.opacity).toBe(1);
  });

  it('retains independent drafts while switching and resets only the active theme', () => {
    const controller = createLabThemeController();
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.setMaterialControl('glassDensity', 38).ok).toBe(true);
    expect(controller.setMaterialControl('frostLevel', 45).ok).toBe(true);
    expect(controller.getSnapshot().compiled.theme.materials.dialog).toMatchObject({ opacity: 0.38, backdrop: { blurPx: 18 } });
    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.setMaterialControl('barOpacity', 44).ok).toBe(true);
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toMatchObject({ glassDensity: 38, frostLevel: 45 });
    expect(controller.resetMaterialControls().ok).toBe(true);
    expect(controller.getSnapshot().materialControls).toEqual({ glassDensity: 24, barOpacity: 72, selectedStrength: 62, frostLevel: 24 });
  });

  it('retains the last valid snapshot for an invalid preset or unavailable required asset', () => {
    const invalidPresets = LAB_THEME_PRESETS.map((preset) => preset.id === 'bunny' ? { id: preset.id, target: { schemaVersion: 'wrong' } } : preset);
    const invalidController = createLabThemeController({ presets: invalidPresets });
    const beforeInvalid = invalidController.getSnapshot();
    const invalid = invalidController.activate('bunny');
    expect(invalid.ok).toBe(false);
    expect(invalidController.getSnapshot()).toBe(beforeInvalid);
    if (!invalid.ok) expect(invalid.diagnostics[0]).toMatchObject({ code: 'THEME_MIGRATION_VERSION_UNSUPPORTED' });

    const missingController = createLabThemeController({
      initialId: 'deep-current',
      availableAssets: new Set(['icons.minimal', 'image.atmospheric-reservoir'])
    });
    const beforeMissing = missingController.getSnapshot();
    const missing = missingController.activate('bunny');
    expect(missing.ok).toBe(false);
    expect(missingController.getSnapshot()).toBe(beforeMissing);
    if (!missing.ok) expect(missing.diagnostics[0]).toMatchObject({ code: 'THEME_ASSET_MISSING' });
    expect(missingController.getSnapshot().compiled.canvas).toBe(beforeMissing.compiled.canvas);
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
