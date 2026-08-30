import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import {
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  type LayoutResult
} from '@pomegranate-ui/layout';

export const LAB_PANEL_IDS = Object.freeze({
  scene: asPanelId('scene'),
  library: asPanelId('library'),
  settings: asPanelId('settings')
});

export const LAB_WIDGET_TYPES = Object.freeze({
  characters: asWidgetType('story.characters'),
  transcript: asWidgetType('story.transcript'),
  composer: asWidgetType('story.composer'),
  worldState: asWidgetType('systems.world-state'),
  ambience: asWidgetType('story.room-ambience'),
  characterRelationships: asWidgetType('systems.character-relationships'),
  library: asWidgetType('library.workspace'),
  characterCard: asWidgetType('library.character-card'),
  loreEntries: asWidgetType('library.lore-entries'),
  themeLibrary: asWidgetType('settings.theme'),
  accessibility: asWidgetType('settings.accessibility'),
  promptEditor: asWidgetType('settings.prompt-editor')
});

function requireState(result: LayoutResult): WorkbenchState {
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function createLabState(): WorkbenchState {
  let state = createInitialWorkbenchState();
  for (const panel of [
    { id: LAB_PANEL_IDS.scene, name: 'Scene', templateId: 'story-stage.v1', order: 0, configuration: { columns: 3 } },
    { id: LAB_PANEL_IDS.library, name: 'Library', templateId: 'focus-support.v1', order: 1, configuration: { columns: 2 } },
    { id: LAB_PANEL_IDS.settings, name: 'Settings', templateId: 'columns.v1', order: 2, configuration: { columns: 3 } }
  ]) state = requireState(createPanel(state, panel));
  state = {
    ...state,
    shelves: [
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'stage', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'composer', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'right', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.library, regionId: 'focus', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.library, regionId: 'support', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.settings, regionId: 'column-1', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.settings, regionId: 'column-2', order: 0, weight: 1 }
    ]
  };

  const fixtures = [
    ['scene-characters', LAB_WIDGET_TYPES.characters, LAB_PANEL_IDS.scene, 'left', 0, {}],
    ['scene-theme-library', LAB_WIDGET_TYPES.themeLibrary, LAB_PANEL_IDS.scene, 'left', 1, {}],
    ['scene-transcript', LAB_WIDGET_TYPES.transcript, LAB_PANEL_IDS.scene, 'stage', 0, {}],
    ['scene-composer', LAB_WIDGET_TYPES.composer, LAB_PANEL_IDS.scene, 'composer', 0, {}],
    ['scene-world', LAB_WIDGET_TYPES.worldState, LAB_PANEL_IDS.scene, 'right', 0, {}],
    ['scene-ambience', LAB_WIDGET_TYPES.ambience, LAB_PANEL_IDS.scene, 'right', 1, {}],
    ['scene-relationships', LAB_WIDGET_TYPES.characterRelationships, LAB_PANEL_IDS.scene, 'right', 2, {}],
    ['library-main', LAB_WIDGET_TYPES.library, LAB_PANEL_IDS.library, 'focus', 0, {}],
    ['library-character', LAB_WIDGET_TYPES.characterCard, LAB_PANEL_IDS.library, 'support', 0, { fixtureMode: 'failure' }],
    ['library-lore', LAB_WIDGET_TYPES.loreEntries, LAB_PANEL_IDS.library, 'support', 1, {}],
    ['settings-theme-library', LAB_WIDGET_TYPES.themeLibrary, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-accessibility', LAB_WIDGET_TYPES.accessibility, LAB_PANEL_IDS.settings, 'column-2', 0, {}]
  ] as const;
  for (const [id, type, panelId, regionId, order, configuration] of fixtures) {
    state = requireState(createWidget(state, {
      id: asWidgetInstanceId(id),
      type,
      manifestVersion: '1.0.0',
      configuration
    }, {
      kind: 'docked', panelId, regionId, shelfId: 'primary', order
    }));
  }
  state = requireState(createWidget(state, {
    id: asWidgetInstanceId('settings-prompt-editor'),
    type: LAB_WIDGET_TYPES.promptEditor,
    manifestVersion: '1.0.0',
    configuration: {}
  }, {
    kind: 'floating',
    panelId: LAB_PANEL_IDS.settings,
    x: 72,
    y: 68,
    width: 420,
    height: 520,
    z: 2
  }));
  return { ...state, revision: 0 };
}
