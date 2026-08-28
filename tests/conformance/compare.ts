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

export const MEASUREMENT_PROFILES: ReadonlyMap<string, readonly ComparisonDefinition[]> = new Map([
  ['deep-current-shell', shellProfile],
  ['deep-current-interaction', interactionProfile]
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
