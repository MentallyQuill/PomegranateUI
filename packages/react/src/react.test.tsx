// @vitest-environment jsdom

import type { ComponentType } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WidgetInstance,
  type WidgetManifest,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import { createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';

import {
  PanelTabs,
  WorkbenchProvider,
  WorkbenchView,
  createWidgetRendererRegistry,
  type WidgetRendererProps
} from './index.js';

interface HostContext {
  readonly storyId: string;
}

const sceneId = asPanelId('scene');
const libraryId = asPanelId('library');

const ids = {
  summary: asWidgetInstanceId('summary'),
  notes: asWidgetInstanceId('notes'),
  portrait: asWidgetInstanceId('portrait'),
  broken: asWidgetInstanceId('broken'),
  unavailable: asWidgetInstanceId('unavailable'),
  library: asWidgetInstanceId('library-summary')
};

function manifest(type: string, title: string): WidgetManifest {
  return {
    type: asWidgetType(type),
    version: '1.0.0',
    title,
    capabilities: ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
  };
}

function instance(id: string, type: string): WidgetInstance {
  return {
    id: asWidgetInstanceId(id),
    type: asWidgetType(type),
    manifestVersion: '1.0.0',
    configuration: {}
  };
}

afterEach(cleanup);

function fixture(breakRenderer = false) {
  const manifests = [
    manifest('story.summary', 'Summary'),
    manifest('story.notes', 'Notes'),
    manifest('story.portrait', 'Portrait'),
    manifest('story.broken', 'Broken Widget'),
    manifest('extension.unavailable', 'Unavailable Widget')
  ];
  const registry = createWidgetRegistry();
  manifests.forEach((entry) => registry.register(entry));

  const widgets = {
    [ids.summary]: instance(ids.summary, 'story.summary'),
    [ids.notes]: instance(ids.notes, 'story.notes'),
    [ids.portrait]: instance(ids.portrait, 'story.portrait'),
    [ids.broken]: instance(ids.broken, 'story.broken'),
    [ids.unavailable]: instance(ids.unavailable, 'extension.unavailable'),
    [ids.library]: instance(ids.library, 'story.summary')
  };
  const state: WorkbenchState = {
    schema: 'pomegranate.ui.state.v1',
    revision: 0,
    activePanelId: sceneId,
    panels: [
      { id: sceneId, name: 'Scene', templateId: 'standard', order: 0 },
      { id: libraryId, name: 'Library', templateId: 'standard', order: 1 }
    ],
    widgets,
    placements: {
      [ids.summary]: { kind: 'docked', panelId: sceneId, edge: 'left', shelfId: 'primary', order: 0 },
      [ids.notes]: { kind: 'docked', panelId: sceneId, edge: 'left', shelfId: 'primary', order: 1 },
      [ids.portrait]: {
        kind: 'floating', panelId: sceneId, x: 12.5, y: 24.25, width: 360, height: 220, z: 4
      },
      [ids.broken]: { kind: 'docked', panelId: sceneId, edge: 'right', shelfId: 'primary', order: 0 },
      [ids.unavailable]: { kind: 'docked', panelId: sceneId, edge: 'main', shelfId: 'primary', order: 0 },
      [ids.library]: { kind: 'docked', panelId: libraryId, edge: 'main', shelfId: 'primary', order: 0 }
    }
  };
  const store = createWorkbenchStore({ initialState: state, registry });
  const renderers = createWidgetRendererRegistry<HostContext>();

  const Reader: ComponentType<WidgetRendererProps<HostContext>> = ({ instance: widget, hostContext, capabilities }) => (
    <div data-testid={`renderer-${widget.id}`}>
      <span>{hostContext.storyId}</span>
      <span>{capabilities.join(',')}</span>
    </div>
  );
  renderers.register(asWidgetType('story.summary'), Reader);
  renderers.register(asWidgetType('story.notes'), Reader);
  renderers.register(asWidgetType('story.portrait'), Reader);
  renderers.register(
    asWidgetType('story.broken'),
    breakRenderer ? () => { throw new Error('renderer failed'); } : Reader
  );

  return { store, renderers };
}

function Harness({
  host = { storyId: 'story-7' },
  breakRenderer = false
}: {
  readonly host?: HostContext;
  readonly breakRenderer?: boolean;
}) {
  const { store, renderers } = fixture(breakRenderer);
  return (
    <WorkbenchProvider store={store} rendererRegistry={renderers} hostContext={host}>
      <PanelTabs />
      <WorkbenchView />
    </WorkbenchProvider>
  );
}

describe('React Workbench bindings', () => {
  it('rejects duplicate renderer registration without replacing the first renderer', () => {
    const renderers = createWidgetRendererRegistry<HostContext>();
    const First = () => <div>first</div>;
    const Second = () => <div>second</div>;
    const type = asWidgetType('story.summary');
    expect(renderers.register(type, First).ok).toBe(true);
    const duplicate = renderers.register(type, Second);
    expect(duplicate.ok).toBe(false);
    expect(renderers.get(type)).toBe(First);
  });

  it('activates a Panel through subscription rendering without changing host context', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByTestId(`renderer-${ids.summary}`)).toHaveTextContent('story-7');

    await user.click(screen.getByRole('tab', { name: 'Library' }));
    expect(screen.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId(`renderer-${ids.library}`)).toHaveTextContent('story-7');
  });

  it('provides accessible Panel reordering controls and reflects the new sequence', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Move Library left' }));
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Library', 'Scene']);
    expect(screen.getByRole('button', { name: 'Move Library left' })).toBeDisabled();
  });

  it('renders dock order and exact floating geometry', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness />);
    const left = screen.getByTestId('pomegranate-dock-left');
    expect(within(left).getAllByRole('article').map((article) => article.getAttribute('aria-label'))).toEqual([
      'Summary',
      'Notes'
    ]);
    const portrait = screen.getByRole('article', { name: 'Portrait' });
    expect(portrait).toHaveStyle({
      position: 'absolute',
      left: '12.5px',
      top: '24.25px',
      width: '360px',
      height: '220px',
      zIndex: '4'
    });
    error.mockRestore();
  });

  it('routes Widget placement controls through the core store', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Harness />);
    const portrait = screen.getByRole('article', { name: 'Portrait' });
    await user.click(within(portrait).getByRole('button', { name: 'Dock right' }));
    expect(within(screen.getByTestId('pomegranate-dock-right')).getByRole('article', { name: 'Portrait' })).toBeVisible();
    error.mockRestore();
  });

  it('renders a named unresolved fallback', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness />);
    expect(screen.getByRole('status', { name: 'Unavailable Widget renderer unavailable' })).toBeVisible();
    error.mockRestore();
  });

  it('contains a failed renderer to its Widget frame and keeps siblings mounted', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness breakRenderer />);
    expect(screen.getByRole('alert')).toHaveTextContent('Broken Widget');
    expect(screen.getByTestId(`renderer-${ids.summary}`)).toBeVisible();
    error.mockRestore();
  });
});
