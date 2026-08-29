import { ConformanceError } from './types.ts';

export type NormalizedValue = null | boolean | number | string | readonly NormalizedValue[] | {
  readonly [key: string]: NormalizedValue;
};

function roundCssPixel(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function canonicalColor(value: string): string {
  const comma = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+%?))?\s*\)$/i);
  const modern = value.match(/^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i);
  const match = comma ?? modern;
  if (!match) return value;
  const alphaText = match[4] ?? '1';
  const alpha = alphaText.endsWith('%') ? Number.parseFloat(alphaText) / 100 : Number.parseFloat(alphaText);
  return `rgba(${Number(match[1])}, ${Number(match[2])}, ${Number(match[3])}, ${roundCssPixel(alpha)})`;
}

function normalizeAtPath(value: unknown, currentPath: string): NormalizedValue {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ConformanceError(
        'MEASUREMENT_FAILED',
        `Measurement is not finite at ${currentPath}.`,
        { path: currentPath }
      );
    }
    return roundCssPixel(value);
  }
  if (typeof value === 'string') return canonicalColor(value);
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item, index) => normalizeAtPath(item, `${currentPath}[${index}]`)));
  }
  if (typeof value === 'object') {
    const normalized: Record<string, NormalizedValue> = {};
    for (const key of Object.keys(value).sort()) {
      normalized[key] = normalizeAtPath(
        (value as Record<string, unknown>)[key],
        currentPath ? `${currentPath}.${key}` : key
      );
    }
    return Object.freeze(normalized);
  }
  throw new ConformanceError(
    'MEASUREMENT_FAILED',
    `Unsupported measurement value at ${currentPath}: ${typeof value}.`,
    { path: currentPath }
  );
}

export function normalizeMeasurement(value: unknown): NormalizedValue {
  return normalizeAtPath(value, '');
}
