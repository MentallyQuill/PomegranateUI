import { describe, expect, it } from 'vitest';

import type { ThemeCanvasLayer } from '@pomegranate-ui/contracts';
import { compileCanvasLayers } from './index.js';

const canvas: readonly ThemeCanvasLayer[] = [
  { kind: 'solid', color: '#102040' },
  { kind: 'linear-gradient', angle: 135, stops: [{ color: '#ffffff00', position: 0 }, { color: '#1677ff', position: 1 }] },
  { kind: 'radial-gradient', shape: 'ellipse', x: 0.2, y: 0.3, stops: [{ color: '#ffffff', position: 0 }, { color: '#ffffff00', position: 1 }] },
  { kind: 'conic-gradient', angle: 20, x: 0.5, y: 0.5, stops: [{ color: '#1677ff', position: 0 }, { color: '#102040', position: 1 }] },
  { kind: 'four-corner', topLeft: '#ffffff', topRight: '#1677ff', bottomLeft: '#102040', bottomRight: '#eaf4ff' },
  {
    kind: 'grid',
    widthPx: 72,
    heightPx: 72,
    horizontal: '#cde7dd0f',
    vertical: '#cde7dd0b',
    lineWidthPx: 1,
    opacity: 0.2,
    mask: { angle: 90, stops: [{ color: '#00000000', position: 0.2 }, { color: '#000000', position: 0.72 }, { color: '#00000000', position: 1 }] }
  },
  { kind: 'image', assetId: 'image.wallpaper', fit: 'cover', x: 0.6, y: 0.4, opacity: 0.8, blurPx: 3, saturation: 1.2, contrast: 1.04, brightness: 0.83, blend: 'soft-light' } as ThemeCanvasLayer,
  { kind: 'texture', assetId: 'texture.grain', opacity: 0.16, blend: 'overlay' },
  { kind: 'veil', mode: 'vignette', color: '#102040', opacity: 0.3 }
];

describe('compileCanvasLayers', () => {
  it('preserves layer order and compiles every canvas kind into an immutable descriptor', () => {
    const result = compileCanvasLayers({ canvas }, {
      'image.wallpaper': { kind: 'image', source: '/assets/wallpaper.webp' },
      'texture.grain': { kind: 'texture', source: '/assets/grain.webp' }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.layers.map(({ kind, order }) => [kind, order])).toEqual(canvas.map(({ kind }, order) => [kind, order]));
    expect(result.layers[5]).toMatchObject({
      kind: 'grid',
      style: {
        backgroundImage: 'linear-gradient(#cde7dd0f 1px, transparent 1px), linear-gradient(90deg, #cde7dd0b 1px, transparent 1px)',
        backgroundSize: '72px 72px',
        maskImage: 'linear-gradient(90deg, #00000000 20%, #000000 72%, #00000000 100%)',
        opacity: '0.2'
      }
    });
    expect(result.layers[6]).toMatchObject({
      kind: 'image',
      style: {
        backgroundImage: 'url("/assets/wallpaper.webp")',
        backgroundSize: 'cover',
        backgroundPosition: '60% 40%',
        opacity: '0.8',
        filter: 'blur(3px) saturate(1.2) contrast(1.04) brightness(0.83)',
        mixBlendMode: 'soft-light'
      }
    });
    expect(result.layers[7]).toMatchObject({
      kind: 'texture',
      style: { backgroundImage: 'url("/assets/grain.webp")', opacity: '0.16', mixBlendMode: 'overlay' }
    });
    expect(result.layers[8]?.style.backgroundImage).toContain('radial-gradient');
    expect(Object.isFrozen(result.layers)).toBe(true);
    expect(Object.isFrozen(result.layers[6]?.style)).toBe(true);
  });

  it('fails closed without returning partial layers when a canvas asset is unresolved', () => {
    const result = compileCanvasLayers({ canvas }, {
      'image.wallpaper': { kind: 'image', source: '/assets/wallpaper.webp' }
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result).not.toHaveProperty('layers');
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'THEME_CANVAS_ASSET_MISSING', path: ['canvas', 7, 'assetId'] })
    ]));
  });
});
