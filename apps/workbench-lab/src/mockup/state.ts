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
  promiseLedger: asWidgetType('systems.promise-ledger'),
  library: asWidgetType('library.workspace'),
  characterCard: asWidgetType('library.character-card'),
  loreEntries: asWidgetType('library.lore-entries'),
  themeLibrary: asWidgetType('settings.theme'),
  themeSettings: asWidgetType('settings.custom-theme'),
  readingLayout: asWidgetType('settings.reading-layout')
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

  const fixtures = [
    ['scene-characters', LAB_WIDGET_TYPES.characters, LAB_PANEL_IDS.scene, 'left', 0, {}],
    ['scene-transcript', LAB_WIDGET_TYPES.transcript, LAB_PANEL_IDS.scene, 'main', 0, {}],
    ['scene-composer', LAB_WIDGET_TYPES.composer, LAB_PANEL_IDS.scene, 'main', 1, {}],
    ['scene-world', LAB_WIDGET_TYPES.worldState, LAB_PANEL_IDS.scene, 'right', 0, {}],
    ['scene-ambience', LAB_WIDGET_TYPES.ambience, LAB_PANEL_IDS.scene, 'right', 1, {}],
    ['scene-promises', LAB_WIDGET_TYPES.promiseLedger, LAB_PANEL_IDS.scene, 'right', 2, {}],
    ['library-main', LAB_WIDGET_TYPES.library, LAB_PANEL_IDS.library, 'main', 0, {}],
    ['library-character', LAB_WIDGET_TYPES.characterCard, LAB_PANEL_IDS.library, 'right', 0, { fixtureMode: 'failure' }],
    ['library-lore', LAB_WIDGET_TYPES.loreEntries, LAB_PANEL_IDS.library, 'right', 1, {}],
    ['settings-theme-library', LAB_WIDGET_TYPES.themeLibrary, LAB_PANEL_IDS.settings, 'left', 0, {}],
    ['settings-reading', LAB_WIDGET_TYPES.readingLayout, LAB_PANEL_IDS.settings, 'main', 0, {}]
  ] as const;
  for (const [id, type, panelId, edge, order, configuration] of fixtures) {
    state = requireState(createWidget(state, {
      id: asWidgetInstanceId(id),
      type,
      manifestVersion: '1.0.0',
      configuration
    }, {
      kind: 'docked', panelId, edge, shelfId: 'primary', order
    }));
  }
  state = requireState(createWidget(state, {
    id: asWidgetInstanceId('settings-theme-settings'),
    type: LAB_WIDGET_TYPES.themeSettings,
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
