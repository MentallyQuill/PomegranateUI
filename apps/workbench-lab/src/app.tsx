import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import {
  asPanelId,
  asWidgetInstanceId,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import { createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';
import {
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  loadLayout,
  saveLayout,
  type LayoutResult
} from '@pomegranate-ui/layout';
import {
  PanelTabs,
  WorkbenchProvider,
  WorkbenchView,
  createWidgetRendererRegistry
} from '@pomegranate-ui/react';
import { FIRST_SLICE_CONTRACT_IDS } from '@pomegranate-ui/testkit';

import { createLocalLayoutStorage, LAB_LAYOUT_KEY } from './storage.js';
import {
  registerLabWidgets,
  STORY_SUMMARY_TYPE,
  SYSTEM_STATUS_TYPE,
  type LabHostContext
} from './widgets.js';

const scenePanelId = asPanelId('scene');
const libraryPanelId = asPanelId('library');
const summaryWidgetId = asWidgetInstanceId('story-summary');
const statusWidgetId = asWidgetInstanceId('system-status');

function requireState(result: LayoutResult): WorkbenchState {
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function createLabState(): WorkbenchState {
  let state = createInitialWorkbenchState();
  state = requireState(createPanel(state, {
    id: scenePanelId,
    name: 'Scene',
    templateId: 'standard',
    order: 0,
    configuration: { columns: 3 }
  }));
  state = requireState(createPanel(state, {
    id: libraryPanelId,
    name: 'Library',
    templateId: 'library',
    order: 1,
    configuration: { columns: 1 }
  }));
  state = requireState(createWidget(state, {
    id: summaryWidgetId,
    type: STORY_SUMMARY_TYPE,
    manifestVersion: '1.0.0',
    configuration: { density: 'compact' }
  }, {
    kind: 'docked',
    panelId: scenePanelId,
    edge: 'left',
    shelfId: 'primary',
    order: 0
  }));
  state = requireState(createWidget(state, {
    id: statusWidgetId,
    type: SYSTEM_STATUS_TYPE,
    manifestVersion: '1.0.0',
    configuration: { showRevision: true }
  }, {
    kind: 'docked',
    panelId: scenePanelId,
    edge: 'main',
    shelfId: 'primary',
    order: 0
  }));
  return { ...state, revision: 0 };
}

function createRuntime() {
  const registry = createWidgetRegistry();
  const rendererRegistry = createWidgetRendererRegistry<LabHostContext>();
  registerLabWidgets(registry, rendererRegistry);
  return {
    store: createWorkbenchStore({ initialState: createLabState(), registry }),
    rendererRegistry
  };
}

export function App() {
  const runtime = useMemo(createRuntime, []);
  const storage = useMemo(createLocalLayoutStorage, []);
  const hostContext = useMemo<LabHostContext>(() => ({
    storyId: 'story-lab-1',
    systemStatus: 'All systems nominal'
  }), []);
  const [state, setState] = useState(runtime.store.getState());
  const [panelName, setPanelName] = useState('My Panel');
  const [panelTemplate, setPanelTemplate] = useState('standard');
  const [panelColumns, setPanelColumns] = useState(2);
  const [eventLog, setEventLog] = useState<readonly string[]>([]);
  const logSequence = useRef(0);

  const log = useCallback((message: string) => {
    logSequence.current += 1;
    setEventLog((current) => [`${logSequence.current}. ${message}`, ...current].slice(0, 8));
  }, []);

  useEffect(() => runtime.store.subscribe((nextState) => {
    setState(nextState);
    log(`Workbench advanced to revision ${nextState.revision}.`);
  }), [log, runtime.store]);

  useEffect(() => {
    let current = true;
    void loadLayout(storage, LAB_LAYOUT_KEY, runtime.store.getState()).then((loaded) => {
      if (current && loaded.ok) {
        runtime.store.dispatch({ type: 'layout.hydrate', state: loaded.state });
        log('Restored the saved layout on startup.');
      }
    });
    return () => { current = false; };
  }, [log, runtime.store, storage]);

  const activePanel = state.panels.find((panel) => panel.id === state.activePanelId);
  const activeColumns = activePanel?.configuration?.columns;

  const createUserPanel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const panelId = asPanelId(`user-panel-${state.panels.length - 1}`);
    const created = runtime.store.dispatch({
      type: 'panel.create',
      panel: {
        id: panelId,
        name: panelName,
        templateId: panelTemplate,
        order: state.panels.length,
        configuration: { columns: panelColumns }
      }
    });
    if (created.ok) {
      runtime.store.dispatch({ type: 'panel.activate', panelId });
      log(`Created Panel '${panelName}'.`);
    } else {
      log(`Create rejected: ${created.error.code}.`);
    }
  };

  const save = async () => {
    const saved = await saveLayout(storage, LAB_LAYOUT_KEY, runtime.store.getState());
    log(saved.ok ? 'Saved pomegranate.ui.layout.v1.' : `Save rejected: ${saved.error.code}.`);
  };

  const reloadSaved = async () => {
    const loaded = await loadLayout(storage, LAB_LAYOUT_KEY, runtime.store.getState());
    if (loaded.ok) runtime.store.dispatch({ type: 'layout.hydrate', state: loaded.state });
    log(loaded.ok ? 'Reloaded the saved layout.' : `Reload rejected: ${loaded.error.code}.`);
  };

  const clearSaved = async () => {
    await storage.remove?.(LAB_LAYOUT_KEY);
    log('Cleared the saved layout.');
  };

  const invalidMove = () => {
    const result = runtime.store.dispatch({
      type: 'widget.place',
      instanceId: asWidgetInstanceId('missing-widget'),
      placement: {
        kind: 'docked',
        panelId: state.activePanelId ?? scenePanelId,
        edge: 'right',
        shelfId: 'primary',
        order: 0
      }
    });
    log(result.ok ? 'Unexpectedly accepted invalid move.' : `Invalid move rejected: ${result.error.code}.`);
  };

  return (
    <main>
      <header className="lab-header">
        <div>
          <p className="eyebrow">PomegranateUI private incubator</p>
          <h1>Workbench Lab</h1>
          <p>Inspectable package-consumer proof, not a prescribed application shell.</p>
        </div>
        <dl className="host-context">
          <div><dt>Host story</dt><dd data-testid="story-id">{hostContext.storyId}</dd></div>
          <div><dt>Revision</dt><dd data-testid="current-revision">{state.revision}</dd></div>
        </dl>
      </header>

      <WorkbenchProvider
        store={runtime.store}
        rendererRegistry={runtime.rendererRegistry}
        hostContext={hostContext}
      >
        <section className="control-surface" aria-label="Workbench controls">
          <PanelTabs className="panel-tabs" />
          <p data-testid="active-panel-meta">
            {activePanel
              ? `${activePanel.templateId} · ${typeof activeColumns === 'number' ? activeColumns : 1} columns · order ${activePanel.order}`
              : 'No active Panel'}
          </p>
          <div className="persistence-actions">
            <button type="button" onClick={() => void save()}>Save layout</button>
            <button type="button" onClick={() => void reloadSaved()}>Reload saved layout</button>
            <button type="button" onClick={() => void clearSaved()}>Clear saved layout</button>
            <button type="button" onClick={invalidMove}>Invalid move</button>
          </div>
        </section>

        <WorkbenchView className="workbench" widgetClassName="widget-frame" />
      </WorkbenchProvider>

      <aside className="lab-sidebar">
        <form onSubmit={createUserPanel}>
          <h2>Create a Panel</h2>
          <label>Panel name<input value={panelName} onChange={(event) => setPanelName(event.target.value)} /></label>
          <label>Panel template<input value={panelTemplate} onChange={(event) => setPanelTemplate(event.target.value)} /></label>
          <label>Panel columns<input type="number" min="1" max="4" value={panelColumns} onChange={(event) => setPanelColumns(Number(event.target.value))} /></label>
          <button type="submit">Create Panel</button>
        </form>

        <section>
          <h2>Event log</h2>
          <ol aria-label="Event log">
            {eventLog.length > 0
              ? eventLog.map((entry) => <li key={entry}>{entry}</li>)
              : <li>No transitions yet.</li>}
          </ol>
        </section>

        <details>
          <summary>Native contract evidence</summary>
          <ul>{FIRST_SLICE_CONTRACT_IDS.map((id) => <li key={id}>{id}</li>)}</ul>
        </details>
      </aside>
    </main>
  );
}
