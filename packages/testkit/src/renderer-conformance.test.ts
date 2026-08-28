import { describe, expect, it } from 'vitest';

// @ts-expect-error This JavaScript fixture proves the public harness needs no framework types.
import { createRendererDomHarness } from '../../../tests/fixtures/renderer-dom-harness.mjs';

import {
  assertRendererConformance,
  RENDERER_MARKUP,
  RENDERER_CONTRACT_IDS,
  runRendererConformance,
  type RendererHarness,
  type RendererOperation,
  type RendererSnapshot
} from './index.js';

function snapshot(overrides: Partial<RendererSnapshot> = {}): RendererSnapshot {
  return {
    tabListName: 'Panels',
    tabs: [
      {
        name: 'Scene',
        id: 'pomegranate-panel-tab-scene',
        controls: 'pomegranate-panel-scene',
        selected: true,
        moveLeftDisabled: true,
        moveRightDisabled: false
      },
      {
        name: 'Library',
        id: 'pomegranate-panel-tab-library',
        controls: 'pomegranate-panel-library',
        selected: false,
        moveLeftDisabled: false,
        moveRightDisabled: true
      }
    ],
    panel: {
      id: 'pomegranate-panel-scene',
      labelledBy: 'pomegranate-panel-tab-scene'
    },
    docks: { left: ['Story Summary'], main: ['System Status'], right: ['Missing Widget'] },
    floating: [],
    widgets: [
      {
        title: 'Story Summary',
        instanceId: 'story-summary',
        placement: 'docked',
        actionNames: ['Dock left', 'Dock right', 'Float']
      },
      {
        title: 'System Status',
        instanceId: 'system-status',
        placement: 'docked',
        actionNames: ['Dock left', 'Dock right', 'Float']
      },
      {
        title: 'Missing Widget',
        instanceId: 'missing-widget',
        placement: 'docked',
        actionNames: ['Dock left', 'Dock right', 'Float']
      }
    ],
    statuses: ['Renderer unavailable for Missing Widget.'],
    alerts: [],
    activeElementName: null,
    hostStoryId: 'story-7',
    revision: 0,
    ...overrides
  };
}

class PassingHarness implements RendererHarness {
  protected current = snapshot();

  async reset(): Promise<void> { this.current = snapshot(); }
  async snapshot(): Promise<RendererSnapshot> { return this.current; }
  async perform(operation: RendererOperation): Promise<void> {
    if (operation.type === 'panel.activate' && operation.name === 'Library') {
      this.current = snapshot({
        tabs: this.current.tabs.map((tab) => ({ ...tab, selected: tab.name === 'Library' })),
        panel: {
          id: 'pomegranate-panel-library',
          labelledBy: 'pomegranate-panel-tab-library'
        },
        revision: 1
      });
    }
    if (operation.type === 'panel.reorder' && operation.name === 'Library' && operation.direction === 'left') {
      const library = this.current.tabs.find((tab) => tab.name === 'Library')!;
      const scene = this.current.tabs.find((tab) => tab.name === 'Scene')!;
      this.current = {
        ...this.current,
        tabs: [
          { ...library, moveLeftDisabled: true, moveRightDisabled: false },
          { ...scene, moveLeftDisabled: false, moveRightDisabled: true }
        ],
        revision: 2
      };
    }
    if (operation.type === 'widget.place' && operation.title === 'System Status' && operation.destination === 'left') {
      this.current = {
        ...this.current,
        docks: { ...this.current.docks, left: ['Story Summary', 'System Status'], main: [] },
        widgets: this.current.widgets.map((widget) => (
          widget.title === 'System Status' ? { ...widget, placement: 'docked' as const } : widget
        )),
        revision: 3
      };
    }
    if (operation.type === 'renderer.fail' && operation.title === 'Story Summary') {
      this.current = {
        ...this.current,
        alerts: ['Story Summary failed to render.'],
        widgets: this.current.widgets.filter((widget) => widget.title !== 'Story Summary')
      };
    }
    if (operation.type === 'focus.next') {
      this.current = { ...this.current, activeElementName: 'Library' };
    }
  }
}

class BrokenRelationshipsHarness extends PassingHarness {
  override async snapshot(): Promise<RendererSnapshot> {
    return snapshot({
      panel: { id: 'pomegranate-panel-scene', labelledBy: 'wrong-tab' }
    });
  }
}

class ThrowingActivationHarness extends PassingHarness {
  override async perform(operation: RendererOperation): Promise<void> {
    if (operation.type === 'panel.activate') throw new Error('activation boom');
    await super.perform(operation);
  }
}

describe('renderer conformance', () => {
  it('accepts a named Panel tablist with stable tab identities', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results[0]).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelTabs,
      passed: true,
      diagnostic: 'The renderer exposed one named Panels tablist with stable tab identities.'
    });
    expect(Object.isFrozen(results)).toBe(true);
    expect(Object.isFrozen(results[0])).toBe(true);
  });

  it('rejects broken two-way Panel tab relationships', async () => {
    const results = await runRendererConformance(new BrokenRelationshipsHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelRelationships)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelRelationships,
      passed: false,
      diagnostic: 'Expected the selected Panel tab and active panel to reference each other.'
    });
  });

  it('activates another Panel without changing host story identity', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelActivation)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelActivation,
      passed: true,
      diagnostic: 'Panel activation selected Library while host story identity remained external and unchanged.'
    });
  });

  it('reorders Panels with truthful disabled directions', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelReorder,
      passed: true,
      diagnostic: 'Panel reorder moved Library left and exposed truthful edge controls.'
    });
  });

  it('appends menu placement to an occupied dock', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.widgetPlacement)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.widgetPlacement,
      passed: true,
      diagnostic: 'Widget placement appended System Status after Story Summary in the occupied left dock.'
    });
  });

  it('requires a named unresolved-renderer status', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.unavailableRenderer)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.unavailableRenderer,
      passed: true,
      diagnostic: 'The unresolved Widget remained in layout and exposed its named renderer-unavailable status.'
    });
  });

  it('contains a renderer failure without mutating state or disabling siblings', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.rendererFailure)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.rendererFailure,
      passed: true,
      diagnostic: 'Story Summary failure was contained while System Status and the Workbench revision remained usable.'
    });
  });

  it('exposes deterministic keyboard focus movement', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.keyboardFocus)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.keyboardFocus,
      passed: true,
      diagnostic: 'The renderer moved focus to the named Library control through its semantic focus operation.'
    });
  });

  it('reports harness operation failures as literal conformance diagnostics', async () => {
    const results = await runRendererConformance(new ThrowingActivationHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelActivation)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelActivation,
      passed: false,
      diagnostic: 'Panel activation conformance failed: activation boom'
    });
  });

  it('aggregates literal renderer failures for CI gates', async () => {
    await expect(assertRendererConformance(new ThrowingActivationHarness())).rejects.toThrow(
      `${RENDERER_CONTRACT_IDS.panelActivation}: Panel activation conformance failed: activation boom`
    );
  });

  it('accepts a document.createElement harness with no framework imports', async () => {
    const results = await runRendererConformance(createRendererDomHarness(document));
    expect(results).toHaveLength(Object.keys(RENDERER_CONTRACT_IDS).length);
    expect(results.every((entry) => entry.passed)).toBe(true);
  });

  it('publishes the literal renderer markup vocabulary', () => {
    expect(RENDERER_MARKUP).toEqual({
      tabListName: 'Panels',
      panelTab: 'data-pomegranate-panel-tab',
      panel: 'data-pomegranate-panel',
      dock: 'data-pomegranate-dock',
      floatingLayer: 'data-pomegranate-floating-layer',
      widget: 'data-pomegranate-widget',
      placement: 'data-pomegranate-placement'
    });
    expect(Object.isFrozen(RENDERER_MARKUP)).toBe(true);
  });
});
