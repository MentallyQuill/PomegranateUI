// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { asPanelId, asWidgetInstanceId, asWidgetType, type WorkbenchState } from '@pomegranate-ui/contracts';
import { createWidgetRegistry, createWorkbenchStore, selectPanelSurface } from '@pomegranate-ui/core';
import type { StoryToolbarGeometry } from '@pomegranate-ui/layout';
import StoryToolbar from './StoryToolbar.svelte';

const panelId = asPanelId('scene');
const widgetId = asWidgetInstanceId('notes');

const geometry = (columnCount: number): StoryToolbarGeometry => ({
  columnCount,
  renderedColumnCount: columnCount,
  requestedWidth: columnCount * 286,
  renderedWidth: columnCount * 286,
  visible: true,
  compressed: false,
  canAddColumn: true
});

function state(columnCount = 1, populated = false): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 0,
    activePanelId: panelId,
    panels: [{
      id: panelId,
      name: 'Scene',
      templateId: 'story-stage.v1',
      order: 0,
      storyLayout: { preferredMeasure: 800, toolbarColumns: { left: columnCount, right: 1 } }
    }],
    shelves: [
      { id: 'primary', panelId, regionId: 'left', order: 0, weight: 1 },
      ...(columnCount > 1
        ? [{ id: 'column-1-primary', panelId, regionId: 'left', dockColumn: 1, order: 0, weight: 1 }]
        : [])
    ],
    widgets: populated ? {
      [widgetId]: { id: widgetId, type: asWidgetType('story.notes'), manifestVersion: '1.0.0', configuration: {} }
    } : {},
    placements: populated ? {
      [widgetId]: { kind: 'docked', panelId, regionId: 'left', shelfId: 'column-1-primary', order: 0 }
    } : {}
  };
}

function renderToolbar(columnCount = 1, populated = false) {
  const registry = createWidgetRegistry();
  registry.register({
    type: asWidgetType('story.notes'),
    version: '1.0.0',
    title: 'Story notes',
    capabilities: [],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
  });
  const store = createWorkbenchStore({ initialState: state(columnCount, populated), registry });
  const surface = selectPanelSurface(store.getState(), registry)!;
  const projection = surface.regions.find(({ region }) => region.id === 'left')!;
  render(StoryToolbar, {
    panelId,
    projection,
    edge: 'left',
    geometry: geometry(columnCount),
    collapsed: false,
    store,
    renderWidget: (() => undefined) as never
  });
  return store;
}

describe('StoryToolbar', () => {
  afterEach(cleanup);

  it('uses compact symbol-only controls and preserves the outer column', async () => {
    const user = userEvent.setup();
    const store = renderToolbar();
    const remove = screen.getByRole('button', { name: 'Remove column from left toolbar' });
    const add = screen.getByRole('button', { name: 'Add column to left toolbar' });

    expect(remove).toBeDisabled();
    expect(remove).toHaveTextContent('−');
    expect(add).toHaveTextContent('+');
    await user.click(add);
    expect(store.getState().panels[0]?.storyLayout?.toolbarColumns.left).toBe(2);
  });

  it('warns before removing a populated column and restores it through Undo', async () => {
    const user = userEvent.setup();
    const store = renderToolbar(2, true);
    await user.click(screen.getByRole('button', { name: 'Remove column from left toolbar' }));

    const dialog = screen.getByRole('dialog', { name: 'Remove left toolbar column?' });
    expect(dialog).toHaveTextContent('1 Widget');
    expect(dialog).toHaveTextContent('Story notes');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(store.getState().widgets[widgetId]).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Remove column from left toolbar' }));
    await user.click(screen.getByRole('button', { name: 'Remove column' }));
    expect(store.getState().widgets[widgetId]).toBeUndefined();
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState().widgets[widgetId]).toBeDefined();
  });
});
