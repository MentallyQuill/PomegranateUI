import { describe, expect, it } from 'vitest';

import { THEME_PART_IDS, type ThemePartId } from '@pomegranate-ui/contracts';
import { compileThemeBindings, compileThemeStyleSheet, type ResolvedThemeV2 } from './index.js';

const part = {
  material: 'glass',
  shape: 'adaptive-pane',
  typography: 'ui',
  spacing: 'md',
  overflow: 'visible',
  separator: 'none',
  elevation: 2,
  states: { disabledOpacity: 0.5 }
} as const;

const parts = Object.fromEntries(THEME_PART_IDS.map((id) => [id, part])) as Record<ThemePartId, typeof part>;

const RESOLVED_THEME = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'compiler-fixture',
  label: 'Compiler fixture',
  colors: {
    canvas: '#102040', surface: '#eaf4ff', surfaceElevated: '#ffffff', surfaceInset: '#dcecff', chrome: '#f4f9ff',
    text: '#101820', textMuted: '#405060', textFaint: '#687888', textOnAccent: '#ffffff', accent: '#1677ff',
    selection: '#86bfff', focus: '#1677ff', success: '#168050', warning: '#a06000', danger: '#c03030',
    border: '#ffffff', borderStrong: '#adc8e8', shadow: '#102040'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['system-ui'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.02 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  spacing: { density: 'balanced', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 44 },
  materials: {
    glass: {
      base: '#ffffff', fallback: '#eaf4ff', opacity: 0.38,
      backdrop: { blurPx: 24, saturation: 1.2, brightness: 1 }, contentTone: 'dark',
      border: { color: '#ffffff', widthPx: 1, opacity: 0.55 },
      rim: { color: '#ffffff', opacity: 0.62, angleDeg: 180 },
      shadows: [{ x: 0, y: 18, blurPx: 50, spreadPx: -8, color: '#102040', opacity: 0.22, inset: false }],
      reducedTransparency: 'opaque'
    },
    opaque: {
      base: '#eaf4ff', fallback: '#eaf4ff', opacity: 1,
      backdrop: { blurPx: 0, saturation: 1, brightness: 1 }, contentTone: 'dark',
      border: { color: '#adc8e8', widthPx: 1, opacity: 0.8 },
      rim: { color: '#ffffff', opacity: 0.4, angleDeg: 180 }, shadows: [], reducedTransparency: 'opaque'
    }
  },
  shapes: {
    'adaptive-pane': { family: 'continuous-rounded', radiusPx: 18, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: [] }
  },
  recipes: {
    parts,
    widgetGrouping: 'individual',
    chromePresentation: 'compact',
    actionPresentation: 'hover-focus'
  },
  controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: { 'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' } },
  canvas: [{ kind: 'solid', color: '#102040' }],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
} as const satisfies ResolvedThemeV2;

describe('theme compiler', () => {
  it('compiles deterministic bindings and fixed semantic-part selectors without theme IDs', () => {
    const first = compileThemeStyleSheet(RESOLVED_THEME);
    const second = compileThemeStyleSheet(RESOLVED_THEME);
    const bindings = compileThemeBindings(RESOLVED_THEME);

    expect(second).toBe(first);
    expect(first).toContain('[data-pom-theme-root] [data-pom-part="widget.surface"]');
    expect(first).not.toContain('compiler-fixture');
    expect(first).toContain('background-color: var(--pom-part-widget-surface-material-fill)');
    expect(first).toContain('[data-pom-part="button.surface"][aria-pressed="true"]');
    expect(first).not.toMatch(/\[data-pom-part="button\.icon"\][^{]*\{[^}]*\bbackground:/s);
    expect(bindings['--pom-part-widget-surface-material-fill']).toBe('rgba(255, 255, 255, 0.38)');
  });

  it('compiles separate visible slider geometry and coarse-pointer hit geometry for WebKit and Firefox', () => {
    const css = compileThemeStyleSheet(RESOLVED_THEME);
    const bindings = compileThemeBindings(RESOLVED_THEME);

    expect(css).toContain('::-webkit-slider-runnable-track');
    expect(css).toContain('::-webkit-slider-thumb');
    expect(css).toContain('::-moz-range-track');
    expect(css).toContain('::-moz-range-progress');
    expect(css).toContain('::-moz-range-thumb');
    expect(bindings['--pom-control-slider-track-size']).toBe('4px');
    expect(bindings['--pom-control-slider-thumb-size']).toBe('11px');
    expect(bindings['--pom-control-slider-hit-size']).toBe('44px');
  });

  it('isolates a changed recipe to that semantic part bindings', () => {
    const variant = structuredClone(RESOLVED_THEME) as any;
    variant.recipes.parts['widget.surface'] = {
      ...variant.recipes.parts['widget.surface'],
      material: 'opaque'
    };
    const baseline = compileThemeBindings(RESOLVED_THEME);
    const changed = compileThemeBindings(variant);
    const changedKeys = Object.keys(baseline).filter((key) => baseline[key] !== changed[key]);

    expect(changedKeys.length).toBeGreaterThan(0);
    expect(changedKeys.every((key) => key.startsWith('--pom-part-widget-surface-'))).toBe(true);
  });
});
