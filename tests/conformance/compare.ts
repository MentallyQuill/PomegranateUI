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

const shellProfile: readonly ComparisonDefinition[] = Object.freeze([
  Object.freeze({ path: 'document', comparator: 'no-overflow', category: 'geometry', severity: 'P1' }),
  Object.freeze({ path: 'regions.composer.box.height', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P1' }),
  Object.freeze({ path: 'regions.composer.visible', comparator: 'equal', category: 'structure', severity: 'P1' }),
  Object.freeze({ path: 'regions.left.box.width', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P2' }),
  Object.freeze({ path: 'regions.left.visible', comparator: 'equal', category: 'structure', severity: 'P1' }),
  Object.freeze({ path: 'regions.right.box.width', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P2' }),
  Object.freeze({ path: 'regions.right.visible', comparator: 'equal', category: 'structure', severity: 'P1' }),
  Object.freeze({ path: 'regions.shelf.box.height', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P2' }),
  Object.freeze({ path: 'regions.shelf.visible', comparator: 'equal', category: 'structure', severity: 'P1' }),
  Object.freeze({ path: 'regions.stage.box.height', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P1' }),
  Object.freeze({ path: 'regions.stage.box.width', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P1' }),
  Object.freeze({ path: 'regions.stage.visible', comparator: 'equal', category: 'structure', severity: 'P1' })
]);

export const MEASUREMENT_PROFILES: ReadonlyMap<string, readonly ComparisonDefinition[]> = new Map([
  ['deep-current-shell', shellProfile]
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
      return typeof scrollWidth === 'number' && typeof clientWidth === 'number' && scrollWidth <= clientWidth + tolerance;
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
