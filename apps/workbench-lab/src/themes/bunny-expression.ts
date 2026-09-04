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

export const BUNNY_SURFACE_EXPRESSION: SurfaceExpressionProfile = deepFreeze(
  SurfaceExpressionProfileSchema.parse({
    schemaVersion: 'pomegranate.ui.surface-expression.v1',
    id: 'bunny-stationery',
    shapes: {
      chrome: { cornerRadiiPx: { topLeft: 24, topRight: 24, bottomRight: 12, bottomLeft: 12 } },
      shell: { cornerRadiiPx: { topLeft: 12, topRight: 12, bottomRight: 26, bottomLeft: 26 } },
      dock: { cornerRadiiPx: { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 } },
      group: { cornerRadiiPx: { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 } },
      pane: { cornerRadiiPx: { topLeft: 17, topRight: 17, bottomRight: 17, bottomLeft: 17 } },
      header: { cornerRadiiPx: { topLeft: 17, topRight: 17, bottomRight: 17, bottomLeft: 17 } },
      reader: { cornerRadiiPx: { topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 } }
    },
    materials: {
      panel: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.72, position: 0 },
            { colorRole: 'chrome', opacity: 0.58, position: 1 }
          ]
        }
      },
      header: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.76, position: 0 },
            { colorRole: 'surface', opacity: 0.64, position: 1 }
          ]
        }
      },
      content: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.88, position: 0 },
            { colorRole: 'surface', opacity: 0.84, position: 1 }
          ]
        }
      },
      row: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.72, position: 0 },
            { colorRole: 'surface', opacity: 0.66, position: 1 }
          ]
        }
      },
      field: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.82, position: 0 },
            { colorRole: 'surface', opacity: 0.76, position: 1 }
          ]
        }
      },
      button: {
        fill: {
          kind: 'linear-gradient', angleDeg: 150,
          stops: [
            { colorRole: 'surfaceElevated', opacity: 0.86, position: 0 },
            { colorRole: 'surface', opacity: 0.78, position: 1 }
          ]
        }
      }
    },
    parts: {
      'chrome.shelf': { typeScale: 'sm', textTransform: 'none' },
      'chrome.context': { typeScale: 'sm', textTransform: 'none' },
      'widget.surface': { typeScale: 'sm', textTransform: 'none' },
      'widget.header': { typeScale: 'sm', textTransform: 'none' },
      'widget.content': { typeScale: 'lg', textTransform: 'none' },
      'widget.actions': { typeScale: 'sm', textTransform: 'none' },
      'row.surface': { typeScale: 'sm', textTransform: 'none' },
      'field.surface': { typeScale: 'sm', textTransform: 'none' },
      'button.surface': { typeScale: 'sm', textTransform: 'none' },
      'menu.surface': { typeScale: 'sm', textTransform: 'none' },
      'dialog.surface': { typeScale: 'sm', textTransform: 'none' },
      'floating.surface': { typeScale: 'sm', textTransform: 'none' }
    }
  })
);
