import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchCommand
} from '@pomegranate-ui/contracts';
import { createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';
import {
  createInitialWorkbenchState,
  createPanel,
  decodeLayoutSnapshot,
  encodeLayoutSnapshot,
  type LayoutResult
} from '@pomegranate-ui/layout';

export interface MockBackendRecord {
  readonly storyId: string;
  readonly turnCount: number;
  readonly privateSummary: string;
}

export function createMockRoleplayConsumer<TBackend extends MockBackendRecord>(backendRecord: TBackend) {
  const panelId = asPanelId('scene');
  const widgetType = asWidgetType('story.summary');
  const widgetId = asWidgetInstanceId('summary-1');
  const registry = createWidgetRegistry();
  registry.register({
    type: widgetType,
    version: '1.0.0',
    title: 'Story Summary',
    capabilities: ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', edge: 'main', shelfId: 'primary' }
  });

  const panel = createPanel(createInitialWorkbenchState(), {
    id: panelId,
    name: 'Scene',
    templateId: 'standard',
    order: 0
  });
  if (!panel.ok) throw new Error(panel.error.message);
  const store = createWorkbenchStore({
    initialState: { ...panel.state, revision: 0 },
    registry
  });
  const createSummaryWidgetCommand: WorkbenchCommand = {
    type: 'widget.create',
    instance: {
      id: widgetId,
      type: widgetType,
      manifestVersion: '1.0.0',
      configuration: { presentation: 'compact' }
    },
    placement: {
      kind: 'docked',
      panelId,
      edge: 'main',
      shelfId: 'primary',
      order: 0
    }
  };

  return Object.freeze({
    backendRecord,
    store,
    createSummaryWidgetCommand,
    roundTripLayout(): LayoutResult {
      const encoded = encodeLayoutSnapshot(store.getState());
      if (!encoded.ok) return { ok: false, state: store.getState(), error: encoded.error };
      return decodeLayoutSnapshot(encoded.value, store.getState());
    }
  });
}
