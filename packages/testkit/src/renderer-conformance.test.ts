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
        selected: true
      },
      {
        name: 'Library',
        id: 'pomegranate-panel-tab-library',
        controls: 'pomegranate-panel-library',
        selected: false
      }
    ],
    panelOrder: null,
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

function panelOrderSnapshot(items: readonly {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly movePreviousDisabled: boolean;
  readonly moveNextDisabled: boolean;
}[]): NonNullable<RendererSnapshot['panelOrder']> {
  return { label: 'Reorder Panels', items };
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
    if (operation.type === 'panel.reorder' && operation.name === 'Library' && operation.direction === 'previous') {
      const library = this.current.tabs.find((tab) => tab.name === 'Library')!;
      const scene = this.current.tabs.find((tab) => tab.name === 'Scene')!;
      this.current = {
        ...this.current,
        tabs: [library, scene],
        panelOrder: {
          label: 'Reorder Panels',
          items: [
            { id: 'pomegranate-panel-tab-library', name: 'Library', active: true, movePreviousDisabled: true, moveNextDisabled: false },
            { id: 'pomegranate-panel-tab-scene', name: 'Scene', active: false, movePreviousDisabled: false, moveNextDisabled: true }
          ]
        },
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
    if (operation.type === 'widget.place' && operation.title === 'System Status' && operation.destination === 'right') {
      this.current = {
        ...this.current,
        docks: { ...this.current.docks, left: ['Story Summary'], main: [], right: ['Missing Widget', 'System Status'] },
        revision: this.current.revision + 1
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

class ThrowingResetHarness extends PassingHarness {
  override async reset(): Promise<void> { throw new Error('reset boom'); }
}

class ThrowingInitialSnapshotHarness extends PassingHarness {
  override async snapshot(): Promise<RendererSnapshot> { throw new Error('snapshot boom'); }
}

describe('renderer conformance', () => {
  it('publishes the reviewed native renderer contract identities', () => {
    expect(Object.values(RENDERER_CONTRACT_IDS)).toEqual([
      'POM-RENDER-4E5A79B301',
      'POM-RENDER-5F6B8AC412',
      'POM-RENDER-607C9BD523',
      'POM-RENDER-718DACF634',
      'POM-RENDER-829EBD0745',
      'POM-RENDER-93AFCE1856',
      'POM-RENDER-A4B0DF2967',
      'POM-RENDER-B5C1E03A78'
    ]);
  });

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

  it('reorders Panels through an explicit surface with truthful disabled edges', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelReorder,
      passed: true,
      diagnostic: 'Panel reorder opened an explicit ordering surface, moved Library exactly one position previous, advanced revision, retained active relationships, and exposed truthful edge controls.'
    });
  });

  it('requests a semantic previous move instead of a normal-rail direction', async () => {
    const operations: RendererOperation[] = [];
    class RecordingHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        operations.push(operation);
        await super.perform(operation);
      }
    }

    await runRendererConformance(new RecordingHarness());

    expect(operations.find((operation) => operation.type === 'panel.reorder')).toEqual({
      type: 'panel.reorder',
      name: 'Library',
      direction: 'previous'
    });
  });

  it('rejects a no-op when Library was already previous before the reorder operation', async () => {
    class PreorderedNoOpHarness extends PassingHarness {
      override async reset(): Promise<void> {
        const base = snapshot();
        this.current = {
          ...base,
          tabs: [base.tabs[1]!, base.tabs[0]!]
        };
      }

      override async perform(operation: RendererOperation): Promise<void> {
        if (operation.type === 'panel.activate') {
          this.current = {
            ...this.current,
            tabs: this.current.tabs.map((tab) => ({ ...tab, selected: tab.name === 'Library' })),
            panel: { id: 'pomegranate-panel-library', labelledBy: 'pomegranate-panel-tab-library' },
            revision: 1
          };
          return;
        }
        if (operation.type === 'panel.reorder') {
          this.current = {
            ...this.current,
            panelOrder: {
              label: 'Reorder Panels',
              items: [
                { id: 'pomegranate-panel-tab-library', name: 'Library', active: true, movePreviousDisabled: true, moveNextDisabled: false },
                { id: 'pomegranate-panel-tab-scene', name: 'Scene', active: false, movePreviousDisabled: false, moveNextDisabled: true }
              ]
            },
            revision: 2
          };
          return;
        }
        await super.perform(operation);
      }
    }

    const results = await runRendererConformance(new PreorderedNoOpHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it('rejects DOM-only reorder snapshots whose store revision did not advance', async () => {
    class UnchangedRevisionHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder') this.current = { ...this.current, revision: 1 };
      }
    }

    const results = await runRendererConformance(new UnchangedRevisionHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it('rejects reordered tabs without an explicit ordering surface', async () => {
    class MissingOrderSurfaceHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder') this.current = { ...this.current, panelOrder: null };
      }
    }

    const results = await runRendererConformance(new MissingOrderSurfaceHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.panelReorder,
      passed: false,
      diagnostic: 'Expected an explicit Panel ordering surface to move Library exactly one position previous, advance revision, retain one reciprocal active identity, and disable controls only at sequence edges.'
    });
  });

  it('rejects false disabled edges on the explicit ordering surface', async () => {
    class FalseOrderEdgesHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder' && this.current.panelOrder) {
          this.current = {
            ...this.current,
            panelOrder: {
              ...this.current.panelOrder,
              items: this.current.panelOrder.items.map((item) => ({
                ...item,
                movePreviousDisabled: false,
                moveNextDisabled: false
              }))
            }
          };
        }
      }
    }

    const results = await runRendererConformance(new FalseOrderEdgesHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it.each([
    ['duplicate', ['Duplicate', 'Duplicate'], ['Duplicate', 'Duplicate']],
    ['pipe-delimited', ['Draft|Archive', 'Draft'], ['Draft', 'Archive|Draft']]
  ])('rejects swapped stable IDs hidden by %s display names', async (_case, tabNames, orderNames) => {
    class AmbiguousNamesHarness extends PassingHarness {
      override async reset(): Promise<void> {
        this.current = snapshot({
          tabs: [
            { name: tabNames[0]!, id: 'pomegranate-panel-tab-scene', controls: 'pomegranate-panel-scene', selected: true },
            { name: 'Library', id: 'pomegranate-panel-tab-library', controls: 'pomegranate-panel-library', selected: false },
            { name: tabNames[1]!, id: 'pomegranate-panel-tab-archive', controls: 'pomegranate-panel-archive', selected: false }
          ]
        });
      }

      override async perform(operation: RendererOperation): Promise<void> {
        if (operation.type === 'panel.activate') {
          this.current = {
            ...this.current,
            tabs: this.current.tabs.map((tab) => ({ ...tab, selected: tab.id === 'pomegranate-panel-tab-library' })),
            panel: { id: 'pomegranate-panel-library', labelledBy: 'pomegranate-panel-tab-library' },
            revision: 1
          };
          return;
        }
        if (operation.type === 'panel.reorder') {
          this.current = {
            ...this.current,
            tabs: [this.current.tabs[1]!, this.current.tabs[0]!, this.current.tabs[2]!],
            panelOrder: panelOrderSnapshot([
              { id: 'pomegranate-panel-tab-library', name: 'Library', active: true, movePreviousDisabled: true, moveNextDisabled: false },
              { id: 'pomegranate-panel-tab-archive', name: orderNames[0]!, active: false, movePreviousDisabled: false, moveNextDisabled: false },
              { id: 'pomegranate-panel-tab-scene', name: orderNames[1]!, active: false, movePreviousDisabled: false, moveNextDisabled: true }
            ]),
            revision: 2
          };
          return;
        }
        await super.perform(operation);
      }
    }

    const results = await runRendererConformance(new AmbiguousNamesHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it('rejects false disabled state on a middle order row', async () => {
    class FalseMiddleEdgeHarness extends PassingHarness {
      override async reset(): Promise<void> {
        const base = snapshot();
        this.current = {
          ...base,
          tabs: [
            base.tabs[0]!,
            base.tabs[1]!,
            { name: 'Archive', id: 'pomegranate-panel-tab-archive', controls: 'pomegranate-panel-archive', selected: false }
          ]
        };
      }

      override async perform(operation: RendererOperation): Promise<void> {
        if (operation.type === 'panel.activate') {
          this.current = {
            ...this.current,
            tabs: this.current.tabs.map((tab) => ({ ...tab, selected: tab.name === 'Library' })),
            panel: { id: 'pomegranate-panel-library', labelledBy: 'pomegranate-panel-tab-library' },
            revision: 1
          };
          return;
        }
        if (operation.type === 'panel.reorder') {
          this.current = {
            ...this.current,
            tabs: [this.current.tabs[1]!, this.current.tabs[0]!, this.current.tabs[2]!],
            panelOrder: panelOrderSnapshot([
              { id: 'pomegranate-panel-tab-library', name: 'Library', active: true, movePreviousDisabled: true, moveNextDisabled: false },
              { id: 'pomegranate-panel-tab-scene', name: 'Scene', active: false, movePreviousDisabled: true, moveNextDisabled: false },
              { id: 'pomegranate-panel-tab-archive', name: 'Archive', active: false, movePreviousDisabled: false, moveNextDisabled: true }
            ]),
            revision: 2
          };
          return;
        }
        await super.perform(operation);
      }
    }

    const results = await runRendererConformance(new FalseMiddleEdgeHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it('rejects an explicit order surface with no active marker', async () => {
    class MissingActiveMarkerHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder' && this.current.panelOrder) {
          this.current = {
            ...this.current,
            panelOrder: {
              ...this.current.panelOrder,
              items: this.current.panelOrder.items.map((item) => {
                const { active: _active, ...withoutActive } = item as typeof item & { readonly active?: boolean };
                return withoutActive;
              })
            } as unknown as NonNullable<RendererSnapshot['panelOrder']>
          };
        }
      }
    }

    const results = await runRendererConformance(new MissingActiveMarkerHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it.each([
    ['wrong', [false, true]],
    ['multiple', [true, true]]
  ])('rejects %s active markers on the explicit order surface', async (_case, active) => {
    class InvalidActiveMarkerHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder' && this.current.panelOrder) {
          this.current = {
            ...this.current,
            panelOrder: {
              ...this.current.panelOrder,
              items: this.current.panelOrder.items.map((item, index) => ({ ...item, active: active[index]! }))
            } as unknown as NonNullable<RendererSnapshot['panelOrder']>
          };
        }
      }
    }

    const results = await runRendererConformance(new InvalidActiveMarkerHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
  });

  it('rejects a reordered selected tab that loses its reciprocal active tabpanel', async () => {
    class BrokenReorderedRelationshipHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        await super.perform(operation);
        if (operation.type === 'panel.reorder') {
          this.current = {
            ...this.current,
            panel: { id: 'pomegranate-panel-scene', labelledBy: 'pomegranate-panel-tab-scene' }
          };
        }
      }
    }

    const results = await runRendererConformance(new BrokenReorderedRelationshipHarness());

    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.panelReorder)?.passed).toBe(false);
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

  it('rejects an unavailable Widget record that is absent from every layout collection', async () => {
    class StaleUnavailableHarness extends PassingHarness {
      override async reset(): Promise<void> {
        this.current = snapshot({
          docks: { left: ['Story Summary'], main: ['System Status'], right: [] },
          floating: []
        });
      }
    }
    const results = await runRendererConformance(new StaleUnavailableHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.unavailableRenderer)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.unavailableRenderer,
      passed: false,
      diagnostic: 'Expected Missing Widget to remain in layout with a named renderer-unavailable status.'
    });
  });

  it('contains a renderer failure without mutating state or disabling siblings', async () => {
    const results = await runRendererConformance(new PassingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.rendererFailure)).toEqual({
      contractId: RENDERER_CONTRACT_IDS.rendererFailure,
      passed: true,
      diagnostic: 'Story Summary failure remained represented while System Status accepted a subsequent placement.'
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

  it.each([
    ['reset', new ThrowingResetHarness(), 'Renderer setup failed during reset: reset boom'],
    ['initial snapshot', new ThrowingInitialSnapshotHarness(), 'Renderer setup failed during initial snapshot: snapshot boom']
  ])('reports %s failures as per-contract results instead of throwing', async (_label, harness, diagnostic) => {
    const results = await runRendererConformance(harness);
    expect(results).toHaveLength(Object.keys(RENDERER_CONTRACT_IDS).length);
    expect(results.every((entry) => !entry.passed && entry.diagnostic === diagnostic)).toBe(true);
    expect(Object.isFrozen(results)).toBe(true);
  });

  it('requires a post-failure sibling action and retained failed layout identity', async () => {
    class FrozenSiblingHarness extends PassingHarness {
      override async perform(operation: RendererOperation): Promise<void> {
        if (operation.type === 'widget.place' && operation.destination === 'right') return;
        await super.perform(operation);
      }
    }
    const results = await runRendererConformance(new FrozenSiblingHarness());
    expect(results.find((entry) => entry.contractId === RENDERER_CONTRACT_IDS.rendererFailure)?.passed).toBe(false);
  });

  it('aggregates literal renderer failures for CI gates', async () => {
    await expect(assertRendererConformance(new ThrowingActivationHarness())).rejects.toThrow(
      `${RENDERER_CONTRACT_IDS.panelActivation}: Panel activation conformance failed: activation boom`
    );
  });

  it('accepts a document.createElement harness with no framework imports', async () => {
    const results = await runRendererConformance(createRendererDomHarness(document));
    expect(results).toHaveLength(Object.keys(RENDERER_CONTRACT_IDS).length);
    expect(results.filter((entry) => !entry.passed)).toEqual([]);
  });

  it('drives the framework-free explicit order controls and snapshots exact edges', async () => {
    const harness = createRendererDomHarness(document);
    await harness.reset();

    await harness.perform({ type: 'panel.activate', name: 'Library' });
    await harness.perform({ type: 'panel.reorder', name: 'Library', direction: 'previous' });

    const reordered = await harness.snapshot();
    expect(reordered.tabs.map((tab: RendererSnapshot['tabs'][number]) => tab.name)).toEqual(['Library', 'Scene']);
    expect(reordered.panelOrder).toEqual({
      label: 'Reorder Panels',
      items: [
        { id: 'pomegranate-panel-tab-library', name: 'Library', active: true, movePreviousDisabled: true, moveNextDisabled: false },
        { id: 'pomegranate-panel-tab-scene', name: 'Scene', active: false, movePreviousDisabled: false, moveNextDisabled: true }
      ]
    });
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
