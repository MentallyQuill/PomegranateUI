import { describe, expect, it } from 'vitest';

import type { CanvasDefinition } from '@pomegranate-ui/contracts';
import {
  DEFAULT_PRESENTATION_PROFILE,
  compilePresentationProfile
} from './index.js';

const canvas: CanvasDefinition = {
  schemaVersion: 'pomegranate.ui.canvas.v1',
  id: 'presentation-test-canvas',
  layers: [{ kind: 'solid', color: '#086cad' }]
};

describe('compilePresentationProfile', () => {
  it('uses deeply frozen legacy defaults when the profile is undefined', () => {
    const result = compilePresentationProfile(undefined, canvas);

    expect(result).toEqual({
      ok: true,
      profile: DEFAULT_PRESENTATION_PROFILE,
      bindings: {
        '--pom-presentation-slider-track-opacity': '1',
        '--pom-presentation-slider-fill-opacity': '1',
        '--pom-presentation-slider-thumb-opacity': '1',
        '--pom-presentation-action-icon-display': 'none',
        '--pom-presentation-action-label-display': 'inline'
      },
      diagnostics: []
    });
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PROFILE)).toBe(true);
    expect(Object.isFrozen(DEFAULT_PRESENTATION_PROFILE.slider)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.profile)).toBe(true);
    expect(Object.isFrozen(result.bindings)).toBe(true);
    expect(Object.isFrozen(result.diagnostics)).toBe(true);
  });

  it('compiles a valid profile into only the fixed opacity and display bindings', () => {
    const result = compilePresentationProfile({
      schemaVersion: 'pomegranate.ui.presentation-profile.v1',
      id: 'pomos-controls',
      slider: {
        trackVisibility: 'visible',
        fillVisibility: 'visible',
        thumbVisibility: 'hidden'
      },
      actions: { content: 'icon' },
      canvas: { blurPolicy: 'forbid' }
    }, canvas);

    expect(result).toEqual({
      ok: true,
      profile: {
        schemaVersion: 'pomegranate.ui.presentation-profile.v1',
        id: 'pomos-controls',
        slider: {
          trackVisibility: 'visible',
          fillVisibility: 'visible',
          thumbVisibility: 'hidden'
        },
        actions: { content: 'icon' },
        canvas: { blurPolicy: 'forbid' }
      },
      bindings: {
        '--pom-presentation-slider-track-opacity': '1',
        '--pom-presentation-slider-fill-opacity': '1',
        '--pom-presentation-slider-thumb-opacity': '0',
        '--pom-presentation-action-icon-display': 'inline-grid',
        '--pom-presentation-action-label-display': 'none'
      },
      diagnostics: []
    });
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.profile)).toBe(true);
    expect(Object.isFrozen(result.profile.slider)).toBe(true);
    expect(Object.isFrozen(result.bindings)).toBe(true);
  });

  it('fails closed with the exact profile path for explicit invalid input', () => {
    const result = compilePresentationProfile({
      schemaVersion: 'pomegranate.ui.presentation-profile.v1',
      id: 'invalid-content',
      slider: {
        trackVisibility: 'visible',
        fillVisibility: 'visible',
        thumbVisibility: 'visible'
      },
      actions: { content: 'artwork' },
      canvas: { blurPolicy: 'allow' }
    }, canvas);

    expect(result).toEqual({
      ok: false,
      diagnostics: [{
        code: 'PRESENTATION_PROFILE_INVALID',
        path: ['profile', 'actions', 'content'],
        message: expect.any(String)
      }]
    });
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('bindings');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.diagnostics)).toBe(true);
    expect(Object.isFrozen(result.diagnostics[0])).toBe(true);
    expect(Object.isFrozen(result.diagnostics[0]?.path)).toBe(true);
  });

  it('fails closed at every nonzero image blur path when blur is forbidden', () => {
    const blurredCanvas: CanvasDefinition = {
      schemaVersion: 'pomegranate.ui.canvas.v1',
      id: 'blurred-canvas',
      layers: [
        { kind: 'solid', color: '#086cad' },
        {
          kind: 'image',
          assetId: 'wallpaper.back',
          fit: 'cover',
          x: 0.5,
          y: 0.5,
          opacity: 1,
          blurPx: 2,
          saturation: 1,
          blend: 'normal'
        },
        {
          kind: 'image',
          assetId: 'wallpaper.front',
          fit: 'cover',
          x: 0.5,
          y: 0.5,
          opacity: 0.8,
          blurPx: 0.5,
          saturation: 1,
          blend: 'screen'
        },
        {
          kind: 'image',
          assetId: 'wallpaper.sharp',
          fit: 'cover',
          x: 0.5,
          y: 0.5,
          opacity: 1,
          blurPx: 0,
          saturation: 1,
          blend: 'normal'
        }
      ]
    };
    const result = compilePresentationProfile({
      schemaVersion: 'pomegranate.ui.presentation-profile.v1',
      id: 'sharp-canvas-controls',
      slider: {
        trackVisibility: 'visible',
        fillVisibility: 'visible',
        thumbVisibility: 'hidden'
      },
      actions: { content: 'icon' },
      canvas: { blurPolicy: 'forbid' }
    }, blurredCanvas);

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          code: 'PRESENTATION_CANVAS_BLUR_FORBIDDEN',
          path: ['canvas', 'layers', 1, 'blurPx'],
          message: expect.any(String)
        },
        {
          code: 'PRESENTATION_CANVAS_BLUR_FORBIDDEN',
          path: ['canvas', 'layers', 2, 'blurPx'],
          message: expect.any(String)
        }
      ]
    });
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('bindings');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.diagnostics)).toBe(true);
    expect(Object.isFrozen(result.diagnostics[0]?.path)).toBe(true);
  });
});
