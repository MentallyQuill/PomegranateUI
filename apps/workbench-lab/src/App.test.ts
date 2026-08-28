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
  it('renders the atmospheric shell, story lockup, Panels, and six seeded Scene Widgets', () => {
    const { container } = render(App);
    expect(screen.getByText('PomegranateUI')).toBeVisible();
    expect(screen.getByText('The Reservoir at Blue Hour')).toBeVisible();
    expect(screen.getByLabelText('Active story identity')).toHaveTextContent('story-lab-reservoir');
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Library', 'Settings']);
    for (const title of ['Characters (Story)', 'Transcript', 'Composer', 'World State', 'Room Ambience', 'Promise Ledger']) {
      expect(screen.getByRole('article', { name: title })).toBeVisible();
    }
    expect([...container.querySelectorAll('[data-conformance-region]')].map((region) => region.getAttribute('data-conformance-region'))).toEqual([
      'shelf', 'left', 'stage', 'composer', 'right'
    ]);
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

  it('contains unavailable and failed renderers without disabling siblings', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('tab', { name: 'Library' }));
    expect(screen.getByRole('status', { name: 'Library renderer unavailable' })).toBeVisible();
    expect(screen.getByRole('alert', { name: 'Character Card renderer failed' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Lore Entry Tree renderer unavailable' })).toBeVisible();
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
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const before = {
      revision: root?.getAttribute('data-workbench-revision'),
      panel: container.querySelector('[data-pomegranate-panel]')?.getAttribute('data-pomegranate-panel'),
      widgets: [...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))
    };
    await user.click(screen.getByRole('button', { name: 'Bunny' }));
    expect(root).toHaveAttribute('data-pom-theme', 'bunny');
    expect(root).toHaveAttribute('data-workbench-revision', before.revision);
    expect(container.querySelector('[data-pomegranate-panel]')).toHaveAttribute('data-pomegranate-panel', before.panel);
    expect([...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))).toEqual(before.widgets);
    expect(window.localStorage.getItem('pomegranate-ui.workbench-lab.theme.v1')).toBe('bunny');
  });
});
