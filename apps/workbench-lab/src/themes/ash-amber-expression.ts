import {
  SurfaceExpressionProfileSchema,
  type SurfaceExpressionProfile
} from '@pomegranate-ui/contracts';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

/**
 * Keeps compact technical labels legible through target-owned expression data.
 * Consumers without this profile retain the framework defaults exactly.
 */
export const ASH_AMBER_SURFACE_EXPRESSION: SurfaceExpressionProfile = deepFreeze(
  SurfaceExpressionProfileSchema.parse({
    schemaVersion: 'pomegranate.ui.surface-expression.v1',
    id: 'warm-compact-readability',
    shapes: {},
    materials: {},
    parts: {
      'widget.header': { typeScale: 'xs' },
      'row.surface': { typeScale: 'xs' },
      'slider.input': { typeScale: 'xs' }
    }
  })
);
