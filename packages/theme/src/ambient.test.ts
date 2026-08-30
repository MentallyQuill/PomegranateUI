import { describe, expect, it } from 'vitest';

import type { AmbientProfile } from '@pomegranate-ui/contracts';
import { resolveAmbientProfile } from './ambient.js';

const profile = (id: string, power: number, motion = true): AmbientProfile => ({
  schemaVersion: 'pomegranate.ui.ambient.v1',
  id,
  colorRole: 'accent',
  position: { x: 0.4, y: 0.6 },
  radius: 0.5,
  power,
  motion: { enabled: motion, driftX: 0.2, driftY: -0.1, durationMs: 24000 }
});

const limits = { enabled: true, maximumPower: 1, allowMotion: true, allowTransparency: true };
const accessibility = { reducedMotion: false, reducedTransparency: false };

describe('ambient precedence and accessibility vetoes', () => {
  it('selects scene over target and target over fallback without mutating inputs', () => {
    const fallback = profile('fallback', 0.1);
    const target = profile('target', 0.3);
    const scene = profile('scene', 0.7);
    const before = structuredClone({ fallback, target, scene });
    expect(resolveAmbientProfile({ fallback, target, sceneOverride: scene, limits, accessibility })).toMatchObject({ id: 'scene', source: 'scene', power: 0.7 });
    expect(resolveAmbientProfile({ fallback, target, limits, accessibility })).toMatchObject({ id: 'target', source: 'target', power: 0.3 });
    expect(resolveAmbientProfile({ fallback, limits, accessibility })).toMatchObject({ id: 'fallback', source: 'fallback', power: 0.1 });
    expect({ fallback, target, scene }).toEqual(before);
  });

  it('applies capability limits before accessibility vetoes and returns a complete frozen profile', () => {
    const resolved = resolveAmbientProfile({
      fallback: profile('fallback', 0.9),
      limits: { enabled: true, maximumPower: 0.42, allowMotion: true, allowTransparency: true },
      accessibility: { reducedMotion: true, reducedTransparency: true }
    });
    expect(resolved).toMatchObject({
      source: 'fallback', power: 0.42, transparencyEnabled: false,
      motion: { enabled: false, driftX: 0.2, driftY: -0.1, durationMs: 24000 }
    });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.motion)).toBe(true);
  });

  it('zeros power when ambient capability is disabled and disables disallowed motion or transparency', () => {
    expect(resolveAmbientProfile({
      fallback: profile('fallback', 0.9),
      limits: { enabled: false, maximumPower: 0.8, allowMotion: false, allowTransparency: false },
      accessibility
    })).toMatchObject({ power: 0, transparencyEnabled: false, motion: { enabled: false } });
  });

  it('supplies explicit inert motion when the selected profile has no motion block', () => {
    const { motion: _motion, ...fallback } = profile('fallback', 0.2);
    expect(resolveAmbientProfile({ fallback, limits, accessibility }).motion).toEqual({
      enabled: false, driftX: 0, driftY: 0, durationMs: 1000
    });
  });
});
