import { describe, expect, it } from 'vitest';

import { createWorkbenchStore, type WorkbenchStore } from '@pomegranate-ui/core';

import {
  FIRST_SLICE_CONTRACT_IDS,
  assertCoreConformance,
  createConformanceFixture,
  runCoreConformance
} from './index.js';

function nativeStore(): WorkbenchStore {
  return createWorkbenchStore(createConformanceFixture().storeOptions);
}

describe('first-slice conformance', () => {
  it('exports the exact eight approved preservation contract ids', () => {
    expect(FIRST_SLICE_CONTRACT_IDS).toEqual([
      'POM-PANEL-07856BFE9A',
      'POM-PANEL-DF4EC7C581',
      'POM-PANEL-0C32491298',
      'POM-PANEL-E6D6A0E64B',
      'POM-PERSIST-842D422EB3',
      'POM-PERSIST-9FA69F9FC1',
      'POM-PERSIST-28DFDC9A8F',
      'POM-PERSIST-D50D69D3C4'
    ]);
    expect(Object.isFrozen(FIRST_SLICE_CONTRACT_IDS)).toBe(true);
  });

  it('passes every contract against the native store through public APIs', () => {
    const results = runCoreConformance(nativeStore);
    expect(results).toHaveLength(8);
    expect(results.filter((result) => !result.passed)).toEqual([]);
    expect(results.map((result) => result.contractId)).toEqual(FIRST_SLICE_CONTRACT_IDS);
    expect(Object.isFrozen(results)).toBe(true);
    expect(results.every(Object.isFrozen)).toBe(true);
    expect(() => assertCoreConformance(nativeStore)).not.toThrow();
  });

  it('reports a literal diagnostic for a deliberately broken activation store', () => {
    const brokenFactory = (): WorkbenchStore => {
      const store = nativeStore();
      return {
        registry: store.registry,
        templates: store.templates,
        canUndo: store.canUndo,
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch(command: unknown) {
          if ((command as { type?: unknown }).type === 'panel.activate') {
            return { ok: true, state: store.getState(), events: [] };
          }
          return store.dispatch(command);
        }
      };
    };

    const results = runCoreConformance(brokenFactory);
    const activation = results.filter((result) => result.contractId.startsWith('POM-PANEL-07')
      || result.contractId.startsWith('POM-PANEL-DF'));
    expect(activation.every((result) => !result.passed)).toBe(true);
    expect(activation.every((result) => /active Panel/i.test(result.diagnostic))).toBe(true);
    expect(() => assertCoreConformance(brokenFactory)).toThrow(/POM-PANEL-07856BFE9A/);
  });
});
