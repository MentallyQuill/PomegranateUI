import { describe, expect, it } from 'vitest';

import { ASH_AMBER_TARGET } from '../../../apps/workbench-lab/src/themes/ash-amber.js';
import { DEEP_CURRENT_TARGET } from '../../../apps/workbench-lab/src/themes/deep-current.js';
import { bestContrastingText, hexToHsv, hsvToHex, mixHex } from './color.js';
import { createThemeDraft, projectThemeDraft } from './draft.js';

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
      schemaVersion: 'pomegranate.ui.theme-draft.v1',
      baseTargetId: 'ash-amber',
      colors: {
        canvas: '#2C2938', glass: '#382D31', chrome: '#716667',
        ambient: '#84008E', text: '#FFFFFF', source: '#D2B57A'
      },
      materials: { glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 }
    });
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

  it('keeps an invalid or inaccessible projection out of the applied target', () => {
    const draft = createThemeDraft(DEEP_CURRENT_TARGET);
    const invalid = { ...draft, colors: { ...draft.colors, text: '#080c0d' } };
    const result = projectThemeDraft(DEEP_CURRENT_TARGET, invalid, DEEP_CURRENT_TARGET.ambient);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.diagnostics.some(({ code }) => code === 'THEME_CONTRAST_UNSAFE')).toBe(true);
  });
});
