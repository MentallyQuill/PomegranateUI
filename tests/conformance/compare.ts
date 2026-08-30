import { isDeepStrictEqual } from 'node:util';

import { normalizeMeasurement, type NormalizedValue } from './normalize.ts';
import { ConformanceError } from './types.ts';

export type ComparatorKind = 'equal' | 'within' | 'contains' | 'ordered' | 'no-overflow' | 'ratio-within';

export interface ComparisonDefinition {
  readonly path: string;
  readonly comparator: ComparatorKind;
  readonly tolerance?: number;
  readonly category: string;
  readonly severity: string;
}

export interface ComparisonResult extends ComparisonDefinition {
  readonly expected: NormalizedValue;
  readonly actual: NormalizedValue;
  readonly tolerance: number;
  readonly pass: boolean;
}

export interface ComparisonReport {
  readonly pass: boolean;
  readonly results: readonly ComparisonResult[];
}

const geometry = (path: string, severity: 'P1' | 'P2' = 'P1'): ComparisonDefinition => (
  Object.freeze({ path, comparator: 'within', tolerance: 2, category: 'geometry', severity })
);
const exact = (path: string, category: 'structure' | 'visual' = 'structure'): ComparisonDefinition => (
  Object.freeze({ path, comparator: 'equal', category, severity: category === 'visual' ? 'P2' : 'P1' })
);
const noOverflow = (path: string): ComparisonDefinition => (
  Object.freeze({ path, comparator: 'no-overflow', category: 'geometry', severity: 'P1' })
);

const shellProfile: readonly ComparisonDefinition[] = Object.freeze([
  noOverflow('document'),
  geometry('regions.composer.box.bottom'),
  geometry('regions.composer.box.height'),
  geometry('regions.composer.box.width'),
  geometry('regions.composer.box.x'),
  geometry('regions.composer.box.y'),
  noOverflow('regions.composer.overflow'),
  exact('regions.composer.styles.backdropFilter', 'visual'),
  exact('regions.composer.styles.backgroundColor', 'visual'),
  exact('regions.composer.styles.borderTopColor', 'visual'),
  exact('regions.composer.visible'),
  geometry('regions.left.box.bottom'),
  geometry('regions.left.box.height'),
  geometry('regions.left.box.width', 'P2'),
  geometry('regions.left.box.x'),
  noOverflow('regions.left.overflow'),
  exact('regions.left.styles.backdropFilter', 'visual'),
  exact('regions.left.styles.backgroundColor', 'visual'),
  exact('regions.left.visible'),
  geometry('regions.right.box.bottom'),
  geometry('regions.right.box.height'),
  geometry('regions.right.box.width', 'P2'),
  geometry('regions.right.box.x'),
  noOverflow('regions.right.overflow'),
  exact('regions.right.styles.backdropFilter', 'visual'),
  exact('regions.right.styles.backgroundColor', 'visual'),
  exact('regions.right.visible'),
  geometry('regions.shelf.box.bottom'),
  geometry('regions.shelf.box.height', 'P2'),
  geometry('regions.shelf.box.width'),
  geometry('regions.shelf.box.x'),
  geometry('regions.shelf.box.y'),
  noOverflow('regions.shelf.overflow'),
  exact('regions.shelf.styles.backdropFilter', 'visual'),
  exact('regions.shelf.styles.backgroundColor', 'visual'),
  exact('regions.shelf.styles.borderTopColor', 'visual'),
  exact('regions.shelf.visible'),
  geometry('regions.stage.box.bottom'),
  geometry('regions.stage.box.height'),
  geometry('regions.stage.box.width'),
  geometry('regions.stage.box.x'),
  geometry('regions.stage.box.y'),
  noOverflow('regions.stage.overflow'),
  exact('regions.stage.visible')
]);

const interactionProfile: readonly ComparisonDefinition[] = Object.freeze([
  exact('functional.authorityCasePassed'),
  exact('functional.outcomeReached'),
  exact('functional.identityStable'),
  exact('functional.persistenceVerified'),
  exact('functional.keyboardAccessible')
]);

const widgetSurfaceProfile: readonly ComparisonDefinition[] = Object.freeze([
  exact('functional.authorityCasePassed'),
  exact('functional.rendered'),
  exact('functional.named'),
  exact('functional.ready'),
  exact('functional.noHorizontalOverflow'),
  exact('functional.oneScrollOwner'),
  exact('functional.keyboardAccessible'),
  exact('content.scope'),
  exact('content.boundary'),
  exact('content.rowLabels'),
  exact('content.actions'),
  exact('visual.darkSurface', 'visual'),
  exact('visual.visibleBorder', 'visual'),
  exact('visual.compactCorners', 'visual')
]);

const shellBehaviorProfile: readonly ComparisonDefinition[] = Object.freeze([
  noOverflow('document'),
  exact('regions.composer.overflow.x'),
  exact('regions.composer.styles.borderTopColor', 'visual'),
  exact('regions.composer.visible'),
  exact('regions.left.visible'),
  exact('regions.right.visible'),
  exact('regions.shelf.overflow.x'),
  exact('regions.shelf.styles.backgroundColor', 'visual'),
  exact('regions.shelf.visible'),
  exact('regions.stage.overflow.x'),
  exact('regions.stage.visible')
]);

const catalogProfile: readonly ComparisonDefinition[] = Object.freeze([
  exact('functional.authorityCasePassed'),
  exact('functional.outcomeReached'),
  exact('functional.keyboardAccessible'),
  exact('inventory.total'),
  exact('inventory.story'),
  exact('inventory.library'),
  exact('inventory.systems'),
  exact('inventory.settings'),
  exact('inventory.extensions'),
  exact('lifecycle.placed'),
  exact('lifecycle.persisted'),
  exact('lifecycle.rendered'),
  exact('lifecycle.removed')
]);

const themeTargetBehaviorProfile: readonly ComparisonDefinition[] = Object.freeze([
  exact('functional.targetApplied'),
  exact('functional.identityStable'),
  exact('functional.instant'),
  exact('functional.noHorizontalOverflow'),
  exact('functional.keyboardAccessible'),
  exact('functional.scenarioStateReached'),
  exact('structure.panelTabs'),
  Object.freeze({ path: 'structure.anchorWidgets', comparator: 'contains', category: 'structure', severity: 'P1' })
]);

const bunnyFidelityProfile: readonly ComparisonDefinition[] = Object.freeze([
  ...themeTargetBehaviorProfile,
  exact('visual.canvas', 'visual'),
  exact('visual.accent', 'visual'),
  exact('visual.text', 'visual'),
  exact('visual.shelfRadius', 'visual'),
  exact('visual.shellRadius', 'visual'),
  exact('visual.dockRadius', 'visual'),
  exact('visual.widgetRadius', 'visual'),
  exact('visual.buttonRadius', 'visual'),
  exact('visual.readerRadius', 'visual'),
  exact('visual.readerFontSize', 'visual'),
  exact('visual.readerLineHeight', 'visual'),
  exact('visual.widgetHasGradient', 'visual'),
  exact('visual.readerHasMaterial', 'visual'),
  exact('visual.readerIntersectsStage', 'visual')
]);

const themeAuthoringProfile: readonly ComparisonDefinition[] = Object.freeze([
  exact('functional.controlsPresent'),
  exact('functional.targetApplied'),
  exact('functional.appliedEditableIndependent'),
  exact('functional.workbenchIdentityStable'),
  exact('functional.layoutIndependent'),
  exact('outcome')
]);

const fidelityGeometryRegions = Object.freeze([
  'header', 'left', 'stage', 'right', 'story', 'composer', 'floating', 'widgetShelf'
] as const);
const fidelityTypographyRoles = Object.freeze([
  'wordmark', 'navigation', 'widgetTitle', 'technical', 'storyHeading', 'storyBody', 'composer'
] as const);
const fidelityMaterials = Object.freeze([
  'header', 'widget', 'widgetHeader', 'storyVeil', 'composer', 'floating', 'dialog'
] as const);
const fidelityOverflowDimensions = Object.freeze([
  'scrollWidth', 'clientWidth', 'scrollHeight', 'clientHeight'
] as const);

const fidelityProfile: readonly ComparisonDefinition[] = Object.freeze([
  ...fidelityGeometryRegions.flatMap((region) => [
    ...['x', 'y', 'width', 'height', 'right', 'bottom'].map((field) => geometry(`geometry.${region}.box.${field}`)),
    exact(`geometry.${region}.visible`),
    exact(`geometry.${region}.overflow.x`),
    exact(`geometry.${region}.overflow.y`),
    ...fidelityOverflowDimensions.map((field) => Object.freeze({
      path: `geometry.${region}.overflow.${field}`,
      comparator: 'within' as const,
      tolerance: 1,
      category: 'geometry',
      severity: 'P1'
    }))
  ]),
  ...fidelityTypographyRoles.flatMap((role) => [
    exact(`typography.${role}.family`, 'visual'),
    Object.freeze({ path: `typography.${role}.size`, comparator: 'within' as const, tolerance: 0.5, category: 'visual', severity: 'P1' }),
    exact(`typography.${role}.weight`, 'visual'),
    Object.freeze({ path: `typography.${role}.lineHeight`, comparator: 'within' as const, tolerance: 0.5, category: 'visual', severity: 'P1' }),
    Object.freeze({ path: `typography.${role}.tracking`, comparator: 'within' as const, tolerance: 0.1, category: 'visual', severity: 'P2' }),
    exact(`typography.${role}.transform`, 'visual')
  ]),
  ...fidelityMaterials.flatMap((material) => [
    exact(`materials.${material}.background`, 'visual'),
    Object.freeze({ path: `materials.${material}.opacity`, comparator: 'within' as const, tolerance: 0.01, category: 'visual', severity: 'P1' }),
    Object.freeze({ path: `materials.${material}.blur`, comparator: 'within' as const, tolerance: 0.5, category: 'visual', severity: 'P1' }),
    exact(`materials.${material}.border`, 'visual'),
    Object.freeze({ path: `materials.${material}.radius`, comparator: 'within' as const, tolerance: 0.5, category: 'visual', severity: 'P1' }),
    exact(`materials.${material}.shadow`, 'visual')
  ]),
  exact('structure.panelTabs'),
  exact('structure.regions'),
  exact('structure.visibleWidgets'),
  exact('structure.widgetLocations'),
  exact('functional.stateReached'),
  exact('functional.identityStable'),
  exact('functional.noOverflow'),
  exact('functional.keyboardAccessible')
]);

export const MEASUREMENT_PROFILES: ReadonlyMap<string, readonly ComparisonDefinition[]> = new Map([
  ['deep-current-shell', shellProfile],
  ['deep-current-shell-behavior', shellBehaviorProfile],
  ['deep-current-interaction', interactionProfile],
  ['deep-current-widget-surface', widgetSurfaceProfile],
  ['deep-current-catalog', catalogProfile],
  ['theme-target-behavior', themeTargetBehaviorProfile],
  ['bunny-fidelity', bunnyFidelityProfile],
  ['theme-authoring', themeAuthoringProfile],
  ['deep-fidelity', fidelityProfile]
]);

function valueAtPath(root: NormalizedValue, evidencePath: string): NormalizedValue {
  let current: NormalizedValue = root;
  for (const segment of evidencePath.split('.')) {
    if (!current || Array.isArray(current) || typeof current !== 'object' || !(segment in current)) {
      throw new ConformanceError(
        'MEASUREMENT_FAILED',
        `Required measurement is missing at ${evidencePath}.`,
        { path: evidencePath }
      );
    }
    current = (current as { readonly [key: string]: NormalizedValue })[segment] as NormalizedValue;
  }
  return current;
}

function contains(expected: NormalizedValue, actual: NormalizedValue): boolean {
  if (typeof expected === 'string' && typeof actual === 'string') return actual.includes(expected);
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.every((expectedItem) => actual.some((actualItem) => isDeepStrictEqual(expectedItem, actualItem)));
  }
  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    return Object.entries(expected).every(([key, value]) => (
      key in actual && isDeepStrictEqual(value, (actual as { readonly [name: string]: NormalizedValue })[key])
    ));
  }
  return false;
}

function comparisonPass(
  comparator: ComparatorKind,
  expected: NormalizedValue,
  actual: NormalizedValue,
  tolerance: number
): boolean {
  switch (comparator) {
    case 'equal':
    case 'ordered':
      return isDeepStrictEqual(expected, actual);
    case 'within':
      return typeof expected === 'number' && typeof actual === 'number' && Math.abs(expected - actual) <= tolerance;
    case 'contains':
      return contains(expected, actual);
    case 'no-overflow': {
      if (!actual || Array.isArray(actual) || typeof actual !== 'object') return false;
      const record = actual as { readonly [key: string]: NormalizedValue };
      const scrollWidth = record.scrollWidth;
      const clientWidth = record.clientWidth;
      const scrollHeight = record.scrollHeight;
      const clientHeight = record.clientHeight;
      return typeof scrollWidth === 'number'
        && typeof clientWidth === 'number'
        && scrollWidth <= clientWidth + tolerance
        && (scrollHeight === undefined || clientHeight === undefined
          || (typeof scrollHeight === 'number' && typeof clientHeight === 'number' && scrollHeight <= clientHeight + tolerance));
    }
    case 'ratio-within':
      if (typeof expected !== 'number' || typeof actual !== 'number') return false;
      return expected === 0
        ? Math.abs(actual) <= tolerance
        : Math.abs(actual - expected) / Math.abs(expected) <= tolerance;
  }
}

export function compareMeasurements(
  referenceInput: unknown,
  actualInput: unknown,
  profile: readonly ComparisonDefinition[]
): ComparisonReport {
  const reference = normalizeMeasurement(referenceInput);
  const actual = normalizeMeasurement(actualInput);
  const results = [...profile].sort((left, right) => left.path.localeCompare(right.path)).map((definition) => {
    const expected = valueAtPath(reference, definition.path);
    const observed = valueAtPath(actual, definition.path);
    const tolerance = definition.tolerance ?? 0;
    const pass = comparisonPass(definition.comparator, expected, observed, tolerance);
    return Object.freeze({ ...definition, expected, actual: observed, tolerance, pass });
  });
  return Object.freeze({ pass: results.every((result) => result.pass), results: Object.freeze(results) });
}
