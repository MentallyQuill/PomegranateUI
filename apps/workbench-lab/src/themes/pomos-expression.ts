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

export const POMOS_SURFACE_EXPRESSION: SurfaceExpressionProfile = deepFreeze(
  SurfaceExpressionProfileSchema.parse({
    schemaVersion: 'pomegranate.ui.surface-expression.v1',
    id: 'pomos-tahoe-glass',
    shapes: {},
    materials: {
      content: {
        fill: {
          kind: 'linear-gradient',
          angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.7, position: 0 },
            { colorRole: 'surface', opacity: 0.66, position: 1 }
          ]
        }
      }
    },
    parts: {}
  })
);
