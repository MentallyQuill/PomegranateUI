import { THEME_MATERIAL_ROLES } from '@pomegranate-ui/contracts';

import type { ResolvedTheme } from './resolve.js';

function parseHex(color: string): readonly [number, number, number, number] {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color);
  if (!match) throw new TypeError(`Expected a #RRGGBB or #RRGGBBAA color, received '${color}'.`);
  const rgb = match[1]!;
  return [
    Number.parseInt(rgb.slice(0, 2), 16) / 255,
    Number.parseInt(rgb.slice(2, 4), 16) / 255,
    Number.parseInt(rgb.slice(4, 6), 16) / 255,
    match[2] ? Number.parseInt(match[2], 16) / 255 : 1
  ];
}

function linearChannel(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(red: number, green: number, blue: number): number {
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function contrastRatio(foreground: string, background: string): number {
  const [backgroundRed, backgroundGreen, backgroundBlue, backgroundAlpha] = parseHex(background);
  if (backgroundAlpha !== 1) throw new TypeError('Contrast backgrounds must be opaque.');
  const [foregroundRed, foregroundGreen, foregroundBlue, foregroundAlpha] = parseHex(foreground);
  const red = foregroundRed * foregroundAlpha + backgroundRed * (1 - foregroundAlpha);
  const green = foregroundGreen * foregroundAlpha + backgroundGreen * (1 - foregroundAlpha);
  const blue = foregroundBlue * foregroundAlpha + backgroundBlue * (1 - foregroundAlpha);
  const foregroundLuminance = luminance(red, green, blue);
  const backgroundLuminance = luminance(backgroundRed, backgroundGreen, backgroundBlue);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

export function collectThemeAssetIds(theme: ResolvedTheme): readonly string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (id: string | undefined) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  };

  add(theme.iconPackId);
  for (const asset of theme.assets) add(asset.id);
  for (const role of THEME_MATERIAL_ROLES) add(theme.materials[role].textureAssetId);
  for (const layer of theme.canvas) {
    if (layer.kind === 'image' || layer.kind === 'texture') add(layer.assetId);
  }
  return Object.freeze(ordered);
}
