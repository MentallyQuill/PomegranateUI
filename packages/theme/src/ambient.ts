import { AmbientProfileSchema, type AmbientProfile } from '@pomegranate-ui/contracts';

export interface AmbientCapabilityLimits {
  readonly enabled: boolean;
  readonly maximumPower: number;
  readonly allowMotion: boolean;
  readonly allowTransparency: boolean;
}

export interface AmbientAccessibilityPreferences {
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
}

export interface AmbientResolutionInput {
  readonly fallback: AmbientProfile;
  readonly target?: AmbientProfile;
  readonly sceneOverride?: AmbientProfile;
  readonly limits: AmbientCapabilityLimits;
  readonly accessibility: AmbientAccessibilityPreferences;
}

export interface ResolvedAmbientProfile extends Omit<AmbientProfile, 'motion'> {
  readonly source: 'fallback' | 'target' | 'scene';
  readonly transparencyEnabled: boolean;
  readonly motion: NonNullable<AmbientProfile['motion']>;
}

function parseLimits(limits: AmbientCapabilityLimits): AmbientCapabilityLimits {
  if (
    typeof limits.enabled !== 'boolean'
    || typeof limits.allowMotion !== 'boolean'
    || typeof limits.allowTransparency !== 'boolean'
    || !Number.isFinite(limits.maximumPower)
    || limits.maximumPower < 0
    || limits.maximumPower > 1
  ) throw new TypeError('Ambient capability limits are invalid.');
  return limits;
}

function parseAccessibility(preferences: AmbientAccessibilityPreferences): AmbientAccessibilityPreferences {
  if (typeof preferences.reducedMotion !== 'boolean' || typeof preferences.reducedTransparency !== 'boolean') {
    throw new TypeError('Ambient accessibility preferences are invalid.');
  }
  return preferences;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export function resolveAmbientProfile(input: AmbientResolutionInput): ResolvedAmbientProfile {
  const fallback = AmbientProfileSchema.parse(input.fallback);
  const target = input.target === undefined ? undefined : AmbientProfileSchema.parse(input.target);
  const scene = input.sceneOverride === undefined ? undefined : AmbientProfileSchema.parse(input.sceneOverride);
  const limits = parseLimits(input.limits);
  const accessibility = parseAccessibility(input.accessibility);
  const selected = scene ?? target ?? fallback;
  const source = scene ? 'scene' : target ? 'target' : 'fallback';
  const motion = selected.motion ?? { enabled: false, driftX: 0, driftY: 0, durationMs: 1000 };

  return deepFreeze({
    ...selected,
    source,
    power: limits.enabled ? Math.min(selected.power, limits.maximumPower) : 0,
    transparencyEnabled: limits.allowTransparency && !accessibility.reducedTransparency,
    motion: { ...motion, enabled: motion.enabled && limits.allowMotion && !accessibility.reducedMotion }
  });
}
