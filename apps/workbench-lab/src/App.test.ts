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
  it('renders exactly six Settings sub-panel tabs and switches the active Widget owner', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));

    const tabs = screen.getByRole('tablist', { name: 'Settings sub-panels' });
    expect(within(tabs).getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual([
      'Account and Access',
      'AI and Models',
      'Appearance and Accessibility',
      'Story Defaults and Content',
      'Data, Extensions, and Maintenance',
      'Advanced'
    ]);
    expect(screen.getByRole('article', { name: 'Provider Credentials' })).toBeVisible();
    expect(screen.getByRole('article', { name: 'AI Connections' })).toBeVisible();
    expect(screen.queryByRole('article', { name: 'Theme Library' })).toBeNull();
    const accountTab = within(tabs).getByRole('tab', { name: 'Account and Access' });
    const accountSurface = screen.getByRole('tabpanel', { name: 'Account and Access' });
    expect(accountTab).toHaveAttribute('aria-controls', accountSurface.id);
    await user.hover(accountTab);
    expect(screen.queryByRole('menu')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Manage Account and Access' }));
    expect(screen.getByRole('menu', { name: 'Account and Access actions' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: 'Account and Access actions' })).toBeNull();

    await user.click(within(tabs).getByRole('tab', { name: 'Appearance and Accessibility' }));
    expect(screen.getByRole('article', { name: 'Theme Library' })).toBeVisible();
    expect(screen.queryByRole('article', { name: 'Provider Credentials' })).toBeNull();
    expect(screen.getByRole('tabpanel', { name: 'Appearance and Accessibility' })).toBeVisible();
  });

  it('uses one Atmospheric composition with integrated story surfaces and a dormant developer drawer', () => {
    const { container } = render(App);
    expect(container.querySelector('.context-rail')).toBeNull();
    expect(container.querySelector('.lab-footer')).toBeNull();
    const drawer = container.querySelector('[data-workbench-developer-drawer]');
    expect(drawer).not.toBeNull();
    expect(drawer).not.toHaveAttribute('open');
    expect(screen.getByText('Developer tools')).toBeVisible();
    expect(drawer?.closest('.top-shelf')).not.toBeNull();

    const transcript = container.querySelector('[data-widget-type="story.transcript"]');
    expect(transcript).not.toBeNull();
    expect(transcript?.querySelector('[data-pom-part="widget.surface"]')).toBeNull();
    const stage = transcript?.closest('[data-story-stage]');
    expect(stage).not.toBeNull();
    expect(stage).not.toHaveAttribute('data-pom-part');
    expect(stage?.querySelectorAll('[data-pom-part="widget.content"]')).toHaveLength(1);
    expect(transcript?.querySelector(':scope > .widget-frame > [data-pom-part="widget.content"]')).not.toBeNull();
    expect(stage?.querySelectorAll('[data-pom-part="dock.surface"]')).toHaveLength(0);
    const composer = screen.getByRole('textbox', { name: /Next action/ });
    const composerInstrument = composer.closest('[data-story-composer]');
    expect(composerInstrument).not.toHaveAttribute('data-pom-part');
    expect(composerInstrument?.querySelectorAll('[data-pom-part="widget.content"]')).toHaveLength(1);
    expect(composerInstrument?.querySelectorAll('[data-pom-part="dock.surface"]')).toHaveLength(0);

    const stageRegion = container.querySelector('[data-conformance-region="stage"]');
    const composerRegion = container.querySelector('[data-conformance-region="composer"]');
    const leftRegion = container.querySelector('[data-conformance-region="left"]');
    expect(stageRegion).not.toHaveAttribute('data-pom-part');
    expect(composerRegion).not.toHaveAttribute('data-pom-part');
    expect(leftRegion).toHaveAttribute('data-pom-part', 'dock.surface');
    expect(container.querySelectorAll('.dock-shelf[data-pom-part]')).toHaveLength(0);
  });

  it('renders one pointer-transparent theme canvas below the Workbench with the exact image layer', () => {
    const { container } = render(App);
    const root = container.querySelector('main');
    const canvas = container.querySelector('[data-pom-canvas-root]');

    expect(root).toHaveAttribute('data-pom-theme-root');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('data-pom-part', 'canvas.surface');
    expect(container.querySelectorAll('[data-pom-canvas-root]')).toHaveLength(1);
    expect(canvas?.querySelectorAll('[data-pom-canvas-layer]').length).toBeGreaterThan(0);
    expect(canvas?.querySelectorAll('[data-pom-canvas-layer="image"]')).toHaveLength(1);
    expect(canvas?.querySelector('[data-pom-ambient-layer]')).not.toBeNull();
    for (const layer of canvas?.querySelectorAll<HTMLElement>('[data-pom-canvas-layer]') ?? []) {
      expect(layer.style.pointerEvents).toBe('none');
    }
    const stage = container.querySelector('[data-conformance-region="stage"]');
    expect(stage?.querySelector('[data-pom-canvas-root]')).toBeNull();
    expect([...stage?.querySelectorAll<HTMLElement>('*') ?? []].some((node) => node.style.backgroundImage !== '')).toBe(false);
  });

  it('renders the atmospheric shell and the exact recording-visible Scene stack', () => {
    const { container } = render(App);
    expect(screen.getByText('PomegranateUI')).toBeVisible();
    expect(screen.getAllByText('The Water Remembers').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Active story identity')).toHaveTextContent('STORY / 7E-19');
    expect(screen.getByText('FIG. 07 / LIMINAL RESERVOIR')).toBeVisible();
    expect(within(screen.getByRole('tablist', { name: 'Panels' })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Library', 'Settings']);
    for (const title of ['Characters (Story)', 'Custom Theme', 'Transcript', 'Composer', 'World State', 'Room Ambience']) {
      expect(screen.getByRole('article', { name: title })).toBeVisible();
    }
    expect(within(screen.getByRole('article', { name: 'Characters (Story)' })).getByText('4 / 7')).toHaveClass('widget-frame-meta');
    expect(within(screen.getByRole('list', { name: 'Characters roster' })).getAllByRole('listitem')[0]).toHaveClass('is-current');
    const characterHeader = screen.getByRole('article', { name: 'Characters (Story)' }).querySelector(':scope > header') as HTMLElement;
    expect(characterHeader).toHaveAttribute('data-widget-drag-surface');
    expect(within(characterHeader).getByRole('navigation', { name: 'Characters (Story) actions' })).toBeVisible();
    expect(within(characterHeader).getAllByRole('button')).toHaveLength(1);
    expect(within(characterHeader).getByRole('button', { name: 'Widget actions' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(screen.getByRole('article', { name: 'Custom Theme' })).getByText('Ready')).toHaveClass('widget-frame-meta');
    expect(within(screen.getByRole('article', { name: 'World State' })).getByText('Frame 3')).toHaveClass('widget-frame-meta');
    expect(within(screen.getByRole('article', { name: 'World State' })).getAllByRole('term').map((term) => term.textContent)).toEqual(['Location', 'Time', 'Weather', 'Frame']);
    expect(container.querySelector('.atmospheric-state-glyph')).toBeNull();
    expect(screen.queryByRole('article', { name: 'Scene Effects' })).toBeNull();
    expect(screen.queryByRole('article', { name: 'Personas' })).toBeNull();
    expect(screen.queryByRole('article', { name: 'Character Relationships' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Widget group' }).querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'Room Ambience' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Room Ambience' })).toHaveAttribute('data-widget-drag-surface');
    expect(screen.getByRole('tab', { name: 'Promise Ledger' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Promise Ledger' })).toHaveAttribute('data-group-widget-type', 'systems.promise-ledger');
    expect(screen.getByRole('tab', { name: 'Promise Ledger' })).toHaveAttribute('data-widget-drag-surface');
    const ambienceGroup = screen.getByRole('group', { name: 'Widget group' });
    expect(ambienceGroup.querySelector('[data-pom-part="widget.surface"]')).toBeNull();
    expect(ambienceGroup.querySelector('[data-surface-type="story.room-ambience"]')).not.toBeNull();
    expect(container.querySelector('[data-surface-presentation="compact-theme"]')).not.toBeNull();
    expect(screen.getByText('Chapter 04 · The Drowned Observatory')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The Water Remembers' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveAttribute('placeholder', ' ');
    expect(screen.getByText('Enter to send')).toBeVisible();
    expect(screen.getByText('Shift + Enter for line break')).toBeVisible();
    expect(screen.getByText('Perspective: Aven')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
    expect(container.querySelector('.composer-placeholder')).toHaveTextContent('Describe what you do, say, or notice…');
    expect(screen.getByRole('button', { name: 'Toggle left dock' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Toggle right dock' })).toHaveAttribute('aria-pressed', 'false');
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

  it('toggles both Atmospheric docks from persistent keyboard-accessible edge controls', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    const root = container.querySelector('main');
    const leftToggle = screen.getByRole('button', { name: 'Toggle left dock' });
    const rightToggle = screen.getByRole('button', { name: 'Toggle right dock' });

    expect(leftToggle).toHaveTextContent('OPEN TOOLBAR LFT');
    expect(rightToggle).toHaveTextContent('OPEN TOOLBAR RGT');
    await user.click(leftToggle);
    expect(root).toHaveClass('left-collapsed');
    expect(leftToggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(rightToggle);
    expect(root).toHaveClass('right-collapsed');
    expect(rightToggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('carries the full audited 94-definition Catalog with exact category totals', async () => {
    expect(createCatalogManifests()).toHaveLength(94);
    expect(CATALOG_TOTALS).toEqual({ story: 12, library: 19, systems: 21, settings: 39, extensions: 3 });
    const user = userEvent.setup();
    render(App);
    const launcher = screen.getByRole('button', { name: 'Open Widget Catalog' });
    expect(launcher).toHaveAttribute('data-pom-icon-action');
    expect(screen.getByRole('button', { name: 'Undo layout' })).toHaveAttribute('data-pom-icon-action');
    expect(screen.getByRole('button', { name: 'Focus reading' })).toHaveAttribute('data-pom-icon-action');
    expect(screen.getByLabelText('Open Widget Shelf')).toHaveAttribute('data-pom-icon-action');
    expect(screen.getByLabelText('Open Widget Shelf')).toHaveAttribute('data-pom-part', 'button.icon');
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    await user.click(launcher);
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const catalog = screen.getByRole('dialog', { name: 'Widget Catalog' });
    expect(catalog).toHaveAttribute('open');
    expect(within(catalog).getByRole('button', { name: 'Close Catalog' }))
      .toHaveAttribute('data-pom-part', 'button.surface');
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
  }, 15_000);

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
    screen.getByRole('tab', { name: 'Settings' }).focus();
    await user.keyboard('{Control>}{Shift>}{ArrowLeft}{/Shift}{/Control}');
    expect(within(screen.getByRole('tablist', { name: 'Panels' })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Settings', 'Library']);
    const ambience = screen.getByRole('article', { name: 'Room Ambience' });
    await user.click(within(ambience).getByRole('button', { name: 'Widget actions' }));
    await user.click(within(ambience).getByRole('menuitem', { name: 'Dock left' }));
    const dockedAmbience = screen.getByRole('article', { name: 'Room Ambience' });
    expect(dockedAmbience.closest('[data-pomegranate-dock]')).toHaveAttribute('data-pomegranate-dock', 'left');
    await user.click(within(dockedAmbience).getByRole('button', { name: 'Widget actions' }));
    await user.click(within(dockedAmbience).getByRole('menuitem', { name: 'Float' }));
    expect(screen.getByRole('article', { name: 'Room Ambience' })).toHaveAttribute('data-pomegranate-placement', 'floating');
  });

  it('keeps host presentation titles through Focus', async () => {
    const user = userEvent.setup();
    render(App);
    const ambience = screen.getByRole('article', { name: 'Room Ambience' });
    await user.click(within(ambience).getByRole('button', { name: 'Widget actions' }));
    const focus = within(ambience).getByRole('menuitem', { name: 'Focus Widget' });
    await user.click(focus);
    const dialog = screen.getByRole('dialog', { name: 'Focused Room Ambience' });
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Back to Workbench' }));
  });

  it('exposes persistence, focus, dock, and Panel creation controls without credential-shaped fixture text', () => {
    const { container } = render(App);
    (container.querySelector('[data-workbench-developer-drawer]') as HTMLDetailsElement).open = true;
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
    await user.click(within(transcript).getByRole('button', { name: 'Widget actions' }));
    await user.click(within(transcript).getByRole('menuitem', { name: 'Move to Widget Shelf' }));
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

    for (const [label, id, actionContent] of [
      ['PomOS', 'pom-neutral', 'icon'],
      ['Bunny', 'bunny', 'text'],
      ['Ash & Amber', 'ash-amber', 'text'],
      ['Deep Current', 'deep-current', 'text']
    ] as const) {
      await user.click(within(group).getByRole('button', { name: label }));
      expect(root).toHaveAttribute('data-pom-theme', id);
      expect(root).toHaveAttribute('data-pom-action-content', actionContent);
      expect(root).toHaveAttribute('data-workbench-revision', identity.revision);
      expect([...container.querySelectorAll('[data-pomegranate-panel]')].map((node) => node.getAttribute('data-pomegranate-panel'))).toEqual(identity.panels);
      expect([...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))).toEqual(identity.widgets);
      expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveValue('Atomic target draft.');
    }
  });

  it('authors one shared Theme Settings draft with synchronized color, material, and ambient controls', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    await user.click(within(screen.getByRole('article', { name: 'Theme Library' })).getByRole('button', { name: 'Open Theme Settings' }));
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');

    const settings = screen.getByRole('article', { name: 'Custom Theme' });
    for (const role of ['Canvas', 'Glass', 'Chrome', 'Ambient', 'Text', 'Source']) {
      expect(within(settings).getByRole('button', { name: role })).toBeVisible();
    }
    for (const control of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level', 'Radius', 'Power']) {
      expect(within(settings).getByRole('slider', { name: control })).toBeVisible();
    }

    const hex = within(settings).getByRole('textbox', { name: 'Hex color' });
    await user.clear(hex);
    await user.type(hex, '#101820');
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-color-canvas')).toBe('#101820');

    await user.clear(hex);
    await user.type(hex, 'unsafe');
    expect(hex).toHaveValue('unsafe');
    expect(within(settings).getAllByText(/#RRGGBB/).length).toBeGreaterThan(0);
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-color-canvas')).toBe('#101820');

    const plane = within(settings).getByRole('application', { name: 'Saturation and value' });
    plane.focus();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(plane).toHaveFocus();
    expect(within(settings).getByText(/Saturation .* Value/)).toBeVisible();

    await user.click(within(settings).getByRole('button', { name: 'Reset' }));
    expect(within(settings).getByRole('textbox', { name: 'Hex color' })).not.toHaveValue('unsafe');
    await user.click(within(settings).getByRole('button', { name: 'Save draft' }));
    expect(window.localStorage.getItem('pomegranate-ui.workbench-lab.theme-draft.v1')).not.toBeNull();
  });
});
