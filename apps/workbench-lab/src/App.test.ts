// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.svelte';
import { CATALOG_TOTALS, createCatalogManifests } from './mockup/catalog.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('Svelte Workbench Lab mockup', () => {
  it('renders one pointer-transparent theme canvas below the Workbench without stage wallpaper ownership', () => {
    const { container } = render(App);
    const root = container.querySelector('main');
    const canvas = container.querySelector('[data-pom-canvas-root]');

    expect(root).toHaveAttribute('data-pom-theme-root');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('data-pom-part', 'canvas.surface');
    expect(container.querySelectorAll('[data-pom-canvas-root]')).toHaveLength(1);
    expect(canvas?.querySelectorAll('[data-pom-canvas-layer]').length).toBeGreaterThan(0);
    for (const layer of canvas?.querySelectorAll<HTMLElement>('[data-pom-canvas-layer]') ?? []) {
      expect(layer.style.pointerEvents).toBe('none');
    }
    const stage = container.querySelector('[data-conformance-region="stage"]');
    expect(stage?.querySelector('[data-pom-canvas-root]')).toBeNull();
    expect([...stage?.querySelectorAll<HTMLElement>('*') ?? []].some((node) => node.style.backgroundImage !== '')).toBe(false);
  });

  it('renders the atmospheric shell, story lockup, Panels, and seven seeded Scene Widgets', () => {
    const { container } = render(App);
    expect(screen.getByText('PomegranateUI')).toBeVisible();
    expect(screen.getByText('The Reservoir at Blue Hour')).toBeVisible();
    expect(screen.getByLabelText('Active story identity')).toHaveTextContent('story-lab-reservoir');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Library', 'Settings']);
    for (const title of ['Characters (Story)', 'Theme Library', 'Transcript', 'Composer', 'World State', 'Room Ambience', 'Character Relationships']) {
      expect(screen.getByRole('article', { name: title })).toBeVisible();
    }
    expect([...container.querySelectorAll('[data-conformance-region="shelf"], [data-pomegranate-region-surface]')].map((region) => region.getAttribute('data-conformance-region') ?? region.getAttribute('data-pomegranate-region-surface'))).toEqual([
      'shelf', 'left', 'stage', 'composer', 'right'
    ]);
    expect([...container.querySelectorAll('[data-pomegranate-region-surface]')].map((region) => region.getAttribute('data-pomegranate-region-surface'))).toEqual([
      'left', 'stage', 'composer', 'right'
    ]);
    const composer = container.querySelector('[data-conformance-region="composer"]');
    expect(composer?.querySelector('[data-widget-type="story.composer"]')).not.toBeNull();
    expect(screen.getAllByRole('separator').length).toBeGreaterThan(0);
  });

  it('carries the full audited 94-definition Catalog with exact category totals', async () => {
    expect(createCatalogManifests()).toHaveLength(94);
    expect(CATALOG_TOTALS).toEqual({ story: 12, library: 19, systems: 21, settings: 39, extensions: 3 });
    const user = userEvent.setup();
    render(App);
    const launcher = screen.getByRole('button', { name: 'Open Widget Catalog' });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    await user.click(launcher);
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const catalog = screen.getByLabelText('Widget Catalog');
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(94);
    await user.click(within(catalog).getByRole('button', { name: 'story' }));
    for (const category of ['extensions', 'library', 'settings', 'story', 'systems']) {
      expect(within(catalog).getByRole('button', { name: category })).toBeVisible();
    }
    await user.click(within(catalog).getByRole('button', { name: 'All' }));
    await user.click(within(catalog).getByRole('button', { name: 'Expanded' }));
    await user.click(within(catalog).getByRole('button', { name: 'Compact' }));
    expect(catalog).toHaveAttribute('data-presentation', 'expanded');
    expect(catalog).toHaveAttribute('data-result-mode', 'compact');
    await user.click(within(catalog).getByRole('button', { name: 'Close Catalog' }));
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens Panel creation as a native modal dialog', async () => {
    const user = userEvent.setup();
    render(App);
    const launcher = screen.getByRole('button', { name: 'Create Panel' });
    await user.click(launcher);
    const dialog = screen.getByRole('dialog', { name: 'Create a Panel' });
    expect(dialog).toHaveAttribute('open');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(dialog).not.toHaveAttribute('open');
  });

  it('contains one failed implemented renderer without disabling its implemented siblings', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('tab', { name: 'Library' }));
    expect(screen.getByText('Global Library · all material')).toBeVisible();
    expect(screen.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
    expect(screen.getByText('Drowned Observatory · entry tree')).toBeVisible();
  });

  it('routes Panel reorder, docking, and floating through the public store', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('button', { name: 'Move Settings left' }));
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Settings', 'Library']);
    const world = screen.getByRole('article', { name: 'World State' });
    await user.click(within(world).getByRole('button', { name: 'Dock left' }));
    const dockedWorld = screen.getByRole('article', { name: 'World State' });
    expect(dockedWorld.closest('[data-pomegranate-dock]')).toHaveAttribute('data-pomegranate-dock', 'left');
    await user.click(within(dockedWorld).getByRole('button', { name: 'Float' }));
    expect(screen.getByRole('article', { name: 'World State' })).toHaveAttribute('data-pomegranate-placement', 'floating');
  });

  it('exposes persistence, focus, dock, and Panel creation controls without credential-shaped fixture text', () => {
    const { container } = render(App);
    for (const name of ['Save layout', 'Reload saved layout', 'Clear saved layout', 'Focus reading', 'Collapse left dock', 'Create Panel']) {
      expect(screen.getByRole('button', { name })).toBeVisible();
    }
    expect(container.textContent).not.toMatch(/(?:sk-[A-Za-z0-9]{12,}|api[_-]?key\s*[:=])/i);
  });

  it('applies Bunny immediately without changing the live Workbench identity', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    const root = container.querySelector('main');
    const composer = screen.getByRole('textbox', { name: /Next action/ });
    await user.clear(composer);
    await user.type(composer, 'Keep this draft through the theme swap.');
    const before = {
      revision: root?.getAttribute('data-workbench-revision'),
      panel: container.querySelector('[data-pomegranate-panel]')?.getAttribute('data-pomegranate-panel'),
      widgets: [...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))
    };
    const bunny = within(screen.getByRole('group', { name: 'Visual target' })).getByRole('button', { name: 'Bunny' });
    await user.click(bunny);
    expect(root).toHaveAttribute('data-pom-theme', 'bunny');
    expect(bunny).toHaveFocus();
    expect(root).toHaveAttribute('data-workbench-revision', before.revision);
    expect(container.querySelector('[data-pomegranate-panel]')).toHaveAttribute('data-pomegranate-panel', before.panel);
    expect([...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))).toEqual(before.widgets);
    expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveValue('Keep this draft through the theme swap.');
    expect(window.localStorage.getItem('pomegranate-ui.workbench-lab.theme.v1')).toBe('bunny');
  });

  it('creates a selected Panel template with bounded Columns regions', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('button', { name: 'Create Panel' }));
    const dialog = screen.getByRole('dialog', { name: 'Create a Panel' });
    await user.clear(within(dialog).getByRole('textbox', { name: 'Panel name' }));
    await user.type(within(dialog).getByRole('textbox', { name: 'Panel name' }), 'Four Columns');
    await user.click(within(dialog).getByRole('radio', { name: /Columns/ }));
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Columns' }), '4');
    await user.click(within(dialog).getByRole('button', { name: 'Create Panel' }));
    expect(screen.getByRole('tab', { name: 'Four Columns' })).toHaveAttribute('aria-selected', 'true');
    expect([...container.querySelectorAll('[data-pomegranate-region-surface]')].map((node) => node.getAttribute('data-pomegranate-region-surface'))).toEqual([
      'column-1', 'column-2', 'column-3', 'column-4'
    ]);
  });

  it('moves a Widget to the retained Shelf and restores it with one-step Undo', async () => {
    const user = userEvent.setup();
    render(App);
    const transcript = screen.getByRole('article', { name: 'Transcript' });
    await user.click(within(transcript).getByRole('button', { name: 'Move to Widget Shelf' }));
    expect(screen.queryByRole('article', { name: 'Transcript' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo layout' })).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Undo layout' }));
    expect(screen.getByRole('article', { name: 'Transcript' })).toBeVisible();
  });

  it('switches through all four complete targets without remounting the Workbench tree', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    const root = container.querySelector('main');
    const composer = screen.getByRole('textbox', { name: /Next action/ });
    await user.clear(composer);
    await user.type(composer, 'Atomic target draft.');
    const identity = {
      revision: root?.getAttribute('data-workbench-revision'),
      panels: [...container.querySelectorAll('[data-pomegranate-panel]')].map((node) => node.getAttribute('data-pomegranate-panel')),
      widgets: [...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))
    };
    const group = screen.getByRole('group', { name: 'Visual target' });

    for (const [label, id] of [['PomOS', 'pom-neutral'], ['Bunny', 'bunny'], ['Ash & Amber', 'ash-amber'], ['Deep Current', 'deep-current']] as const) {
      await user.click(within(group).getByRole('button', { name: label }));
      expect(root).toHaveAttribute('data-pom-theme', id);
      expect(root).toHaveAttribute('data-workbench-revision', identity.revision);
      expect([...container.querySelectorAll('[data-pomegranate-panel]')].map((node) => node.getAttribute('data-pomegranate-panel'))).toEqual(identity.panels);
      expect([...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))).toEqual(identity.widgets);
      expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveValue('Atomic target draft.');
    }
  });
});
