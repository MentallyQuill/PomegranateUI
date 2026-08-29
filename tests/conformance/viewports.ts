import type { ViewportDefinition } from './types.ts';

export const CONFORMANCE_VIEWPORTS: ReadonlyMap<string, ViewportDefinition> = new Map<string, ViewportDefinition>([
  ['wide', Object.freeze({ width: 1600, height: 900 })],
  ['standard', Object.freeze({ width: 1440, height: 900 })],
  ['medium', Object.freeze({ width: 1180, height: 800 })],
  ['widget-standard', Object.freeze({ width: 1024, height: 768 })],
  ['tablet', Object.freeze({ width: 768, height: 1024 })],
  ['compact', Object.freeze({ width: 430, height: 932 })],
  ['compact-small', Object.freeze({ width: 390, height: 844 })],
  ['landscape-short', Object.freeze({ width: 844, height: 390 })],
  ['widget-short', Object.freeze({ width: 1024, height: 600 })],
  ['zoom-200', Object.freeze({ width: 800, height: 450 })]
]);
