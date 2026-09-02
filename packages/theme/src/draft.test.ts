import { describe, expect, it } from 'vitest';

import { ASH_AMBER_TARGET } from '../../../apps/workbench-lab/src/themes/ash-amber.js';
import { DEEP_CURRENT_TARGET } from '../../../apps/workbench-lab/src/themes/deep-current.js';
import { bestContrastingText, hexToHsv, hsvToHex, mixHex } from './color.js';
import { createThemeDraft, projectThemeDraft } from './draft.js';
import type { ThemeCanvasAuthoringProfile } from './semantic-canvas.js';

const AUTHORABLE_CANVAS = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 90, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: { role: 'canvas' } } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.ash-amber-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 0.8, blurPx: 0, saturation: 1, blend: 'normal' }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 90, stops: [{ color: { role: 'canvas', alpha: 0.8 }, position: 0 }, { color: { role: 'surface', alpha: 0.4 }, position: 1 }] }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'vignette', color: { role: 'canvas' }, opacity: 0.5 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

describe('Theme draft color math', () => {
  it.each([
    ['#ff0000', { hue: 0, saturation: 1, value: 1 }],
    ['#00ff00', { hue: 120, saturation: 1, value: 1 }],
    ['#0000ff', { hue: 240, saturation: 1, value: 1 }],
    ['#808080', { hue: 0, saturation: 0, value: 128 / 255 }]
  ])('converts %s to HSV deterministically', (hex, expected) => {
    expect(hexToHsv(hex)).toEqual(expected);
  });

  it('wraps hue, normalizes output to lower case, and round-trips RGB within one channel', () => {
    expect(hsvToHex({ hue: 360, saturation: 1, value: 1 })).toBe('#ff0000');
    expect(hsvToHex({ hue: -120, saturation: 1, value: 1 })).toBe('#0000ff');
    const source = '#D2B57A';
    const restored = hsvToHex(hexToHsv(source));
    expect(restored).toBe(source.toLowerCase());
  });

  it('mixes exact endpoints and chooses the stronger black or white contrast', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(bestContrastingText('#ffffff')).toBe('#000000');
    expect(bestContrastingText('#050607')).toBe('#FFFFFF');
  });
});

describe('Theme draft projection', () => {
  it('creates the exact six-role Ash and Amber authoring seed', () => {
    expect(createThemeDraft(ASH_AMBER_TARGET)).toEqual({
      schemaVersion: 'pomegranate.ui.theme-draft.v2',
      baseTargetId: 'ash-amber',
      colors: {
        canvas: '#242321', glass: '#302E2A', chrome: '#625B52',
        ambient: '#51493E', text: '#F3F0EA', source: '#D2B57A'
      },
      materials: { glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 },
      canvas: { imageStrength: 100, overlayStrength: 100, gradientAngle: 0, vignetteStrength: 100 }
    });
  });

  it('round-trips a target-owned non-accent ambient role without rewriting its accent', () => {
    const draft = createThemeDraft(ASH_AMBER_TARGET);
    const result = projectThemeDraft(ASH_AMBER_TARGET, draft, ASH_AMBER_TARGET.ambient);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.target.ambient.colorRole).toBe('selection');
    expect(result.target.theme.colors.selection).toBe('#51493E');
    expect(result.target.theme.colors.accent).toBe('#C18A3D');
  });

  it('projects semantic roles without mutating V3 recipes, assets, success, danger, or the base target', () => {
    const before = structuredClone(DEEP_CURRENT_TARGET);
    const draft = createThemeDraft(DEEP_CURRENT_TARGET);
    const edited = {
      ...draft,
      colors: { ...draft.colors, canvas: '#101820', glass: '#203040', ambient: '#cc8844', text: '#f0f4f8' }
    };
    const result = projectThemeDraft(DEEP_CURRENT_TARGET, edited, DEEP_CURRENT_TARGET.ambient);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.target.theme.colors).toMatchObject({
      canvas: '#101820', surface: '#203040', surfaceElevated: '#31404f', surfaceInset: '#1d2c3a',
      text: '#f0f4f8', textMuted: '#b2b9c1', textFaint: '#929ca5', textOnAccent: '#000000',
      accent: '#cc8844', selection: '#cc8844', focus: '#d29b64', warning: draft.colors.source,
      success: DEEP_CURRENT_TARGET.theme.colors.success, danger: DEEP_CURRENT_TARGET.theme.colors.danger
    });
    expect(result.target.theme.recipes).toEqual(DEEP_CURRENT_TARGET.theme.recipes);
    expect(result.target.theme.assets).toEqual(DEEP_CURRENT_TARGET.theme.assets);
    expect(result.target.ambient.colorRole).toBe('accent');
    expect(DEEP_CURRENT_TARGET).toEqual(before);
  });

  it('resolves edited semantic canvas roles and applies treatment only to declared groups', () => {
    const draft = createThemeDraft(ASH_AMBER_TARGET, AUTHORABLE_CANVAS.defaults);
    const edited = {
      ...draft,
      colors: { ...draft.colors, canvas: '#101820', glass: '#203040' },
      canvas: { imageStrength: 40, overlayStrength: 50, gradientAngle: 125, vignetteStrength: 20 }
    };
    const result = projectThemeDraft(ASH_AMBER_TARGET, edited, ASH_AMBER_TARGET.ambient, AUTHORABLE_CANVAS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canvasAvailability).toEqual({ image: true, overlay: true, vignette: true });
    expect(result.target.canvas.layers).toEqual([
      { kind: 'solid', color: '#101820' },
      expect.objectContaining({ kind: 'image', opacity: 0.32 }),
      { kind: 'linear-gradient', angle: 125, stops: [{ color: '#10182066', position: 0 }, { color: '#20304033', position: 1 }] },
      { kind: 'veil', mode: 'vignette', color: '#101820', opacity: 0.1 }
    ]);
  });

  it('reports absent image authoring without rejecting overlay edits', () => {
    const profile = {
      ...AUTHORABLE_CANVAS,
      layers: AUTHORABLE_CANVAS.layers.filter((entry) => !('authoringGroup' in entry) || entry.authoringGroup !== 'image')
    } satisfies ThemeCanvasAuthoringProfile;
    const result = projectThemeDraft(
      ASH_AMBER_TARGET,
      createThemeDraft(ASH_AMBER_TARGET, profile.defaults),
      ASH_AMBER_TARGET.ambient,
      profile
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.canvasAvailability).toEqual({ image: false, overlay: true, vignette: true });
  });

  it('keeps an invalid or inaccessible projection out of the applied target', () => {
    const draft = createThemeDraft(DEEP_CURRENT_TARGET);
    const invalid = { ...draft, colors: { ...draft.colors, text: '#080c0d' } };
    const result = projectThemeDraft(DEEP_CURRENT_TARGET, invalid, DEEP_CURRENT_TARGET.ambient);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.diagnostics.some(({ code }) => code === 'THEME_CONTRAST_UNSAFE')).toBe(true);
  });

  it('rejects authored Ash text that only a derived text-on-accent fallback could rescue', () => {
    const draft = createThemeDraft(ASH_AMBER_TARGET);
    const unsafe = { ...draft, colors: { ...draft.colors, text: '#302E2A' } };
    const result = projectThemeDraft(ASH_AMBER_TARGET, unsafe, ASH_AMBER_TARGET.ambient);
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'THEME_CONTRAST_UNSAFE',
      path: ['colors', 'text']
    }));
  });
});
