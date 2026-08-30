import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WidgetManifest,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import {
  createWidgetRegistry,
  type WorkbenchStoreOptions
} from '@pomegranate-ui/core';
import {
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  type LayoutResult
} from '@pomegranate-ui/layout';

export const CONFORMANCE_IDS = Object.freeze({
  scenePanel: asPanelId('scene'),
  libraryPanel: asPanelId('library'),
  summaryWidget: asWidgetInstanceId('summary'),
  notesWidget: asWidgetInstanceId('notes'),
  userPanel: asPanelId('user-panel'),
  summaryType: asWidgetType('story.summary'),
  notesType: asWidgetType('story.notes')
});

export interface ConformanceFixture {
  readonly storeOptions: WorkbenchStoreOptions;
  readonly hostContext: Readonly<{ storyId: string }>;
}

function requireState(result: LayoutResult): WorkbenchState {
  if (!result.ok) throw new Error(`Invalid conformance fixture: ${result.error.message}`);
  return result.state;
}

function manifest(type: typeof CONFORMANCE_IDS.summaryType, title: string): WidgetManifest {
  return {
    type,
    version: '1.0.0',
    title,
    capabilities: ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
  };
}

export function createConformanceFixture(): ConformanceFixture {
  let state = createInitialWorkbenchState();
  state = requireState(createPanel(state, {
    id: CONFORMANCE_IDS.scenePanel,
    name: 'Scene',
    templateId: 'story-stage.v1',
    order: 0
  }));
  state = requireState(createPanel(state, {
    id: CONFORMANCE_IDS.libraryPanel,
    name: 'Library',
    templateId: 'focus-support.v1',
    order: 1
  }));
  state = {
    ...state,
    shelves: [
      { id: 'primary', panelId: CONFORMANCE_IDS.scenePanel, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: CONFORMANCE_IDS.scenePanel, regionId: 'right', order: 0, weight: 1 }
    ]
  };
  state = requireState(createWidget(state, {
    id: CONFORMANCE_IDS.summaryWidget,
    type: CONFORMANCE_IDS.summaryType,
    manifestVersion: '1.0.0',
    configuration: {}
  }, {
    kind: 'docked',
    panelId: CONFORMANCE_IDS.scenePanel,
    regionId: 'left',
    shelfId: 'primary',
    order: 0
  }));
  state = requireState(createWidget(state, {
    id: CONFORMANCE_IDS.notesWidget,
    type: CONFORMANCE_IDS.notesType,
    manifestVersion: '1.0.0',
    configuration: {}
  }, {
    kind: 'docked',
    panelId: CONFORMANCE_IDS.scenePanel,
    regionId: 'right',
    shelfId: 'primary',
    order: 0
  }));
  state = { ...state, revision: 0 };

  const registry = createWidgetRegistry();
  registry.register(manifest(CONFORMANCE_IDS.summaryType, 'Summary'));
  registry.register(manifest(CONFORMANCE_IDS.notesType, 'Notes'));

  return Object.freeze({
    storeOptions: Object.freeze({ initialState: state, registry }),
    hostContext: Object.freeze({ storyId: 'story-7' })
  });
}
