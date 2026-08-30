import type { WorkbenchStore } from '@pomegranate-ui/core';
import { decodeLayoutSnapshot, encodeLayoutSnapshot } from '@pomegranate-ui/layout';

import {
  FIRST_SLICE_CONTRACT_IDS,
  type FirstSliceContractId
} from './contract-ids.js';
import { CONFORMANCE_IDS, createConformanceFixture } from './fixtures.js';

export type WorkbenchStoreFactory = () => WorkbenchStore;

export interface ConformanceResult {
  readonly contractId: FirstSliceContractId;
  readonly passed: boolean;
  readonly diagnostic: string;
}

function result(
  contractId: FirstSliceContractId,
  passed: boolean,
  diagnostic: string
): ConformanceResult {
  return Object.freeze({ contractId, passed, diagnostic });
}

function paired(
  ids: readonly [FirstSliceContractId, FirstSliceContractId],
  passed: boolean,
  diagnostic: string
): readonly ConformanceResult[] {
  return ids.map((contractId) => result(contractId, passed, diagnostic));
}

function activation(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  const hostContext = createConformanceFixture().hostContext;
  try {
    const store = factory();
    const dispatched = store.dispatch({
      type: 'panel.activate',
      panelId: CONFORMANCE_IDS.libraryPanel
    });
    const passed = dispatched.ok
      && store.getState().activePanelId === CONFORMANCE_IDS.libraryPanel
      && hostContext.storyId === 'story-7'
      && !JSON.stringify(store.getState()).includes('story-7');
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[0], FIRST_SLICE_CONTRACT_IDS[1]],
      passed,
      passed
        ? 'Panel activation changed only the active Panel identity; host story context remained external.'
        : 'Expected the active Panel to become library without copying or changing host story context.'
    );
  } catch (error) {
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[0], FIRST_SLICE_CONTRACT_IDS[1]],
      false,
      `Panel activation conformance threw: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function occupiedDock(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  try {
    const store = factory();
    const dispatched = store.dispatch({
      type: 'widget.place',
      instanceId: CONFORMANCE_IDS.notesWidget,
      placement: {
        kind: 'docked',
        panelId: CONFORMANCE_IDS.scenePanel,
        regionId: 'left',
        shelfId: 'primary',
        order: Number.MAX_SAFE_INTEGER
      }
    });
    const state = store.getState();
    const summary = state.placements[CONFORMANCE_IDS.summaryWidget];
    const notes = state.placements[CONFORMANCE_IDS.notesWidget];
    const passed = dispatched.ok
      && summary?.kind === 'docked'
      && summary.regionId === 'left'
      && summary.order === 0
      && notes?.kind === 'docked'
      && notes.regionId === 'left'
      && notes.order === 1;
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[2], FIRST_SLICE_CONTRACT_IDS[3]],
      passed,
      passed
        ? 'Menu docking appended the Widget after the occupied left destination.'
        : 'Expected docking into the occupied left destination to retain order 0 and append at order 1.'
    );
  } catch (error) {
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[2], FIRST_SLICE_CONTRACT_IDS[3]],
      false,
      `Occupied-dock conformance threw: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function userPanelPersistence(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  try {
    const store = factory();
    const created = store.dispatch({
      type: 'panel.create',
      panel: {
        id: CONFORMANCE_IDS.userPanel,
        name: 'My Panel',
        templateId: 'user.custom',
        order: 2,
        configuration: { density: 'compact' }
      }
    });
    const encoded = encodeLayoutSnapshot(store.getState());
    const decoded = encoded.ok
      ? decodeLayoutSnapshot(encoded.value, store.getState())
      : encoded;
    const restored = decoded.state.panels.find((panel) => panel.id === CONFORMANCE_IDS.userPanel);
    const passed = created.ok
      && encoded.ok
      && decoded.ok
      && restored?.templateId === 'user.custom'
      && restored.order === 2
      && restored.configuration?.density === 'compact';
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[4], FIRST_SLICE_CONTRACT_IDS[5]],
      passed,
      passed
        ? 'The user Panel restored its template, configuration, and order from pomegranate.ui.layout.v2.'
        : 'Expected the user Panel template, configuration, and order 2 to survive encode and restore.'
    );
  } catch (error) {
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[4], FIRST_SLICE_CONTRACT_IDS[5]],
      false,
      `User-Panel persistence conformance threw: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function reorderedPersistence(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  try {
    const store = factory();
    const reordered = store.dispatch({
      type: 'panel.reorder',
      panelId: CONFORMANCE_IDS.libraryPanel,
      toIndex: 0
    });
    const encoded = encodeLayoutSnapshot(store.getState());
    const decoded = encoded.ok
      ? decodeLayoutSnapshot(encoded.value, store.getState())
      : encoded;
    const passed = reordered.ok
      && encoded.ok
      && decoded.ok
      && decoded.state.panels.map((panel) => panel.id).join(',') === 'library,scene'
      && decoded.state.panels.map((panel) => panel.order).join(',') === '0,1';
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[6], FIRST_SLICE_CONTRACT_IDS[7]],
      passed,
      passed
        ? 'The reordered Panel sequence restored as library, scene with contiguous order.'
        : 'Expected the reordered Panel sequence library, scene to survive encode and restore.'
    );
  } catch (error) {
    return paired(
      [FIRST_SLICE_CONTRACT_IDS[6], FIRST_SLICE_CONTRACT_IDS[7]],
      false,
      `Panel-sequence persistence conformance threw: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function runCoreConformance(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  return Object.freeze([
    ...activation(factory),
    ...occupiedDock(factory),
    ...userPanelPersistence(factory),
    ...reorderedPersistence(factory)
  ]);
}

export function assertCoreConformance(factory: WorkbenchStoreFactory): readonly ConformanceResult[] {
  const results = runCoreConformance(factory);
  const failures = results.filter((entry) => !entry.passed);
  if (failures.length > 0) {
    throw new Error(failures.map((entry) => `${entry.contractId}: ${entry.diagnostic}`).join('\n'));
  }
  return results;
}
