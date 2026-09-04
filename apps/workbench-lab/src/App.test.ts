// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.svelte';
import { CATALOG_TOTALS, createCatalogManifests } from './mockup/catalog.js';
import { themeDraftStorageKey } from './themes/draft-storage.js';
import { LAB_THEME_PRESETS } from './themes/presets.js';
import { themePreviewStyle } from './themes/preview.js';

const nativeMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: nativeMatchMedia
  });
});

describe('Svelte Workbench Lab mockup', () => {
  it('exposes one active Panel action trigger and retargets it when the active tab changes', async () => {
    const user = userEvent.setup();
    const { container } = render(App);

    expect(container.querySelectorAll('[data-panel-tab-actions-trigger]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Open Scene Panel actions', hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Library Panel actions', hidden: true })).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Library' }));
    expect(container.querySelectorAll('[data-panel-tab-actions-trigger]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Open Scene Panel actions', hidden: true })).toBeNull();
    const trigger = screen.getByRole('button', { name: 'Open Library Panel actions', hidden: true });
    await fireEvent.click(trigger);

    const actions = container.querySelector<HTMLElement>('.panel-menu-surface:not(.sub-panel-menu-surface)');
    if (!actions) throw new Error('Expected the shared Panel action surface.');
    expect(actions).toHaveAttribute('aria-label', 'Library Panel actions');
    expect(actions).toHaveAttribute('data-context-source', 'pointer');
    expect(actions).toHaveAttribute('data-fallback-open');
  });

  it('exposes one active sub-panel action trigger that opens its menu immediately', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));

    expect(container.querySelectorAll('[data-sub-panel-tab-actions-trigger]')).toHaveLength(1);
    const accountTrigger = screen.getByRole('button', {
      name: 'Open Account and Access sub-panel actions',
      hidden: true
    });
    expect(screen.queryByRole('button', {
      name: 'Open Appearance and Accessibility sub-panel actions',
      hidden: true
    })).toBeNull();

    await fireEvent.click(accountTrigger);
    const actions = container.querySelector<HTMLElement>('.sub-panel-menu-surface');
    if (!actions) throw new Error('Expected the shared sub-panel action surface.');
    expect(actions).toHaveAttribute('aria-label', 'Account and Access sub-panel actions');
    expect(actions).toHaveAttribute('data-context-source', 'pointer');
    expect(actions).toHaveAttribute('data-fallback-open');
  });

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
    expect(accountTab).toHaveAttribute('aria-keyshortcuts', 'Shift+F10');
    expect(screen.queryByRole('button', { name: /^Manage / })).toBeNull();
    await user.hover(accountTab);
    expect(screen.queryByRole('menu')).toBeNull();

    const appearanceTab = within(tabs).getByRole('tab', { name: 'Appearance and Accessibility' });
    await user.click(appearanceTab);
    accountTab.focus();
    expect(await fireEvent.keyDown(accountTab, { key: 'ContextMenu' })).toBe(false);
    const actions = document.querySelector<HTMLElement>('.sub-panel-menu-surface');
    if (!actions) throw new Error('Expected the shared sub-panel action surface.');
    expect(actions).toHaveAttribute('role', 'dialog');
    expect(actions).toHaveAttribute('aria-label', 'Account and Access sub-panel actions');
    expect(actions).toHaveAttribute('data-fallback-open');
    expect(actions).toHaveAttribute('data-context-source', 'keyboard');
    expect(within(actions).getAllByRole('button', { hidden: true }).map((button) => button.textContent?.trim())).toEqual([
      'Rename', 'Duplicate', 'Change layout', 'Move Widgets', 'Delete', 'Reorder sub-panels…'
    ]);
    expect(accountTab).toHaveAttribute('aria-selected', 'false');
    expect(appearanceTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('article', { name: 'Theme Library' })).toBeVisible();
    for (const name of ['Custom Theme', 'Theme Colors', 'Theme Materials', 'Theme Canvas', 'Ambient Light']) {
      expect(screen.getByRole('article', { name })).toBeVisible();
    }
    expect(screen.queryByRole('article', { name: 'Provider Credentials' })).toBeNull();
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(actions).not.toHaveAttribute('data-fallback-open');
    expect(accountTab).toHaveFocus();
    expect(appearanceTab).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('article', { name: 'Theme Library' })).toBeVisible();
    expect(screen.queryByRole('article', { name: 'Provider Credentials' })).toBeNull();
    expect(screen.getByRole('tabpanel', { name: 'Appearance and Accessibility' })).toBeVisible();
  });

  it('renders theme picker previews from preset data without theme-id hooks', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));

    const library = screen.getByRole('article', { name: 'Theme Library' });
    const pickerButtons = [...library.querySelectorAll<HTMLButtonElement>('.surface-themes button')];
    for (const { target } of LAB_THEME_PRESETS) {
      const label = target.theme.label;
      const button = pickerButtons.find((candidate) => candidate.querySelector('strong')?.textContent === label);
      const swatch = button?.querySelector<HTMLElement>('i');
      const expected = document.createElement('i');
      expected.setAttribute('style', themePreviewStyle(target.theme));
      expect(swatch).not.toBeNull();
      expect(swatch).not.toHaveAttribute('data-theme-swatch');
      expect(swatch?.style.backgroundImage).toBe(expected.style.backgroundImage);
      expect(swatch?.style.borderRadius).toBe(expected.style.borderRadius);
    }
    expect(library.querySelectorAll('.surface-themes i')).toHaveLength(4);

    const deepSwatch = pickerButtons[0]!.querySelector<HTMLElement>('i')!;
    const before = deepSwatch.style.backgroundImage;
    const colors = screen.getByRole('article', { name: 'Theme Colors' });
    await fireEvent.input(within(colors).getByRole('textbox', { name: 'Hex color' }), { target: { value: '#101820' } });
    expect(deepSwatch.style.backgroundImage).not.toBe(before);
    expect(deepSwatch.style.backgroundImage).toContain('rgb(16, 24, 32)');
  });

  it('authors bundled typography per theme instead of repeating the Theme Library', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));

    const typography = screen.getByRole('article', { name: 'Theme Typography' });
    expect(typography.querySelector('.surface-themes')).toBeNull();
    expect(within(typography).getByRole('combobox', { name: 'Interface font' })).toHaveValue('Pomegranate Sans');
    expect(within(typography).getByRole('combobox', { name: 'Prose font' })).toHaveValue('Pomegranate Serif');
    expect(within(typography).getByRole('combobox', { name: 'Display font' })).toHaveValue('Pomegranate Serif');
    expect(within(typography).getByRole('combobox', { name: 'Technical font' })).toHaveValue('Pomegranate Mono');
    expect(within(typography).getAllByRole('slider')).toHaveLength(13);
    expect(within(typography).getByText('A quiet page remembers every voice.')).toBeVisible();

    const library = screen.getByRole('article', { name: 'Theme Library' });
    await user.click(within(library).getByRole('button', { name: /^Bunny/ }));
    expect(within(typography).getByRole('combobox', { name: 'Interface font' })).toHaveValue('Nunito');
    expect(within(typography).getByRole('combobox', { name: 'Prose font' })).toHaveValue('Fraunces');
    await user.selectOptions(within(typography).getByRole('combobox', { name: 'Prose font' }), 'Pomegranate Serif');
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-font-prose')).toContain('Pomegranate Serif');

    await user.click(within(library).getByRole('button', { name: /^PomOS/ }));
    expect(within(typography).getByRole('combobox', { name: 'Prose font' })).toHaveValue('Inter');
    await user.click(within(library).getByRole('button', { name: /^Bunny/ }));
    expect(within(typography).getByRole('combobox', { name: 'Prose font' })).toHaveValue('Pomegranate Serif');

    await fireEvent.input(within(typography).getByRole('slider', { name: 'Reading size' }), { target: { value: '18' } });
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-type-lg')).toBe('18px');
  });

  it('restores independently saved typography when revisiting each theme', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    let typography = screen.getByRole('article', { name: 'Theme Typography' });
    let library = screen.getByRole('article', { name: 'Theme Library' });

    await user.click(within(library).getByRole('button', { name: /^Bunny/ }));
    await user.selectOptions(within(typography).getByRole('combobox', { name: 'Prose font' }), 'Pomegranate Serif');
    await user.click(within(typography).getByRole('button', { name: 'Save theme typography' }));
    await waitFor(() => expect(window.localStorage.getItem(themeDraftStorageKey('bunny'))).not.toBeNull());

    await user.click(within(library).getByRole('button', { name: /^PomOS/ }));
    await user.selectOptions(within(typography).getByRole('combobox', { name: 'Technical font' }), 'Pomegranate Mono');
    await user.click(within(typography).getByRole('button', { name: 'Save theme typography' }));
    await waitFor(() => expect(window.localStorage.getItem(themeDraftStorageKey('pom-neutral'))).not.toBeNull());

    cleanup();
    render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    typography = screen.getByRole('article', { name: 'Theme Typography' });
    library = screen.getByRole('article', { name: 'Theme Library' });
    await waitFor(() => expect(within(typography).getByRole('combobox', { name: 'Technical font' })).toHaveValue('Pomegranate Mono'));

    await user.click(within(library).getByRole('button', { name: /^Bunny/ }));
    await waitFor(() => expect(within(typography).getByRole('combobox', { name: 'Prose font' })).toHaveValue('Pomegranate Serif'));
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

  it('removes Lab-only developer tools from normal public chrome', () => {
    window.history.replaceState({}, '', '/?dev=0');
    const { container } = render(App);

    expect(container.querySelector('main')).toHaveAttribute('data-workbench-developer-tools', 'disabled');
    expect(container.querySelector('[data-workbench-developer-drawer]')).toBeNull();
    expect(screen.queryByText('Developer tools')).toBeNull();
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

  it('keeps the story title and current scene in the reading stage instead of the Panel shelf', () => {
    const { container } = render(App);
    const shelf = container.querySelector('.top-shelf') as HTMLElement;
    const storyStage = screen.getByRole('region', { name: 'Story reading stage' });

    expect(within(shelf).queryByText('The Water Remembers')).toBeNull();
    expect(within(shelf).queryByText('STORY / 7E-19')).toBeNull();
    const storyTitle = within(storyStage).getByRole('heading', { level: 1, name: 'The Water Remembers' });
    const currentScene = storyStage.querySelector('.story-context-heading p') as HTMLElement;
    expect(currentScene).toHaveTextContent('Current scene: FIG. 07 / LIMINAL RESERVOIR');
    expect(storyTitle.compareDocumentPosition(currentScene) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'The Water Remembers' })).toHaveLength(1);
  });

  it('renders the atmospheric shell and the exact recording-visible Scene stack', () => {
    const { container } = render(App);
    expect(screen.getByText('PomegranateUI')).toBeVisible();
    expect(within(screen.getByRole('tablist', { name: 'Panels' })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Scene', 'Library', 'Settings']);
    for (const title of ['Characters (Story)', 'Theme Materials', 'Transcript', 'Composer', 'World State', 'Room Ambience']) {
      expect(screen.getByRole('article', { name: title })).toBeVisible();
    }
    expect(within(screen.getByRole('article', { name: 'Characters (Story)' })).getByText('4 / 7')).toHaveClass('widget-frame-meta');
    expect(within(screen.getByRole('list', { name: 'Characters roster' })).getAllByRole('listitem')[0]).toHaveClass('is-current');
    const characterHeader = screen.getByRole('article', { name: 'Characters (Story)' }).querySelector(':scope > header') as HTMLElement;
    expect(characterHeader).toHaveAttribute('data-widget-drag-surface');
    expect(within(characterHeader).getByRole('navigation', { name: 'Characters (Story) actions' })).toBeVisible();
    expect(within(characterHeader).getAllByRole('button')).toHaveLength(1);
    expect(within(characterHeader).getByRole('button', { name: 'Widget actions' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(screen.getByRole('article', { name: 'Theme Materials' })).getByText('Ready')).toHaveClass('widget-frame-meta');
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
    expect(container.querySelector('[data-surface-type="settings.theme-materials"]')).not.toBeNull();
    expect(screen.getByText('Chapter 04 · The Drowned Observatory')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The Water Remembers' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Next action/ })).toHaveAttribute('placeholder', ' ');
    expect(screen.getByText('Enter to send')).toBeVisible();
    expect(screen.getByText('Shift + Enter for line break')).toBeVisible();
    expect(screen.getByText('Perspective: Aven')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
    expect(container.querySelector('.composer-placeholder')).toHaveTextContent('Describe what you do, say, or notice…');
    expect(screen.getByRole('button', { name: 'Close left toolbar' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Close right toolbar' })).toHaveAttribute('aria-pressed', 'false');
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
    const leftToggle = screen.getByRole('button', { name: 'Close left toolbar' });
    const rightToggle = screen.getByRole('button', { name: 'Close right toolbar' });

    expect(leftToggle).toHaveTextContent('CLOSE TOOLBAR LFT');
    expect(rightToggle).toHaveTextContent('CLOSE TOOLBAR RGT');
    await user.click(leftToggle);
    expect(root).toHaveClass('left-collapsed');
    expect(leftToggle).toHaveAttribute('aria-pressed', 'true');
    expect(leftToggle).toHaveAccessibleName('Open left toolbar');
    expect(leftToggle).toHaveTextContent('OPEN TOOLBAR LFT');
    await user.click(rightToggle);
    expect(root).toHaveClass('right-collapsed');
    expect(rightToggle).toHaveAttribute('aria-pressed', 'true');
    expect(rightToggle).toHaveAccessibleName('Open right toolbar');
    expect(rightToggle).toHaveTextContent('OPEN TOOLBAR RGT');
  });

  it('carries the full audited 98-definition Catalog with exact category totals', async () => {
    expect(createCatalogManifests()).toHaveLength(98);
    expect(CATALOG_TOTALS).toEqual({ story: 12, library: 19, systems: 21, settings: 43, extensions: 3 });
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
    expect(within(catalog).getByRole('button', { name: 'Close Widget Catalog' }))
      .toHaveAttribute('data-pom-part', 'button.icon');
    expect(catalog.querySelectorAll('[data-catalog-result]')).toHaveLength(98);
    expect(catalog.querySelectorAll('.catalog-widget-preview')).toHaveLength(98);
    expect(within(catalog).queryByRole('button', { name: /^Add / })).toBeNull();
    await user.click(within(catalog).getByRole('button', { name: 'Story' }));
    for (const category of ['Extensions', 'Library', 'Settings', 'Story', 'Systems']) {
      expect(within(catalog).getByRole('button', { name: category })).toBeVisible();
    }
    await user.click(within(catalog).getByRole('button', { name: 'All' }));
    await user.click(within(catalog).getByRole('button', { name: 'Compact' }));
    expect(catalog).toHaveAttribute('data-presentation', 'expanded');
    expect(catalog).toHaveAttribute('data-result-mode', 'compact');
    expect(catalog.querySelectorAll('.catalog-widget-preview')).toHaveLength(0);
    await user.click(within(catalog).getByRole('button', { name: 'Close Widget Catalog' }));
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
  }, 30_000);

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

  it('renders each Panel template as a theme-selected visual card', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('button', { name: 'Create Panel' }));
    const dialog = screen.getByRole('dialog', { name: 'Create a Panel' });
    const layoutGroup = within(dialog).getByRole('group', { name: 'Panel layout' });

    const cardFor = (name: RegExp) => {
      const radio = within(layoutGroup).getByRole('radio', { name });
      const card = radio.closest('[data-panel-template-card]');
      if (!(card instanceof HTMLElement)) throw new Error(`Missing visual template card for ${name}.`);
      return card;
    };

    const storyStage = cardFor(/Story Stage/);
    const focusSupport = cardFor(/Focus \+ Support/);
    const columns = cardFor(/Columns/);

    expect(storyStage).toHaveAttribute('data-pom-part', 'row.surface');
    expect(focusSupport).toHaveAttribute('data-pom-part', 'row.surface');
    expect(columns).toHaveAttribute('data-pom-part', 'row.surface');
    expect(columns).toHaveAttribute('data-pom-selected', 'true');
    expect(storyStage).not.toHaveAttribute('data-pom-selected');
    expect(storyStage.querySelectorAll('[data-panel-preview-region]')).toHaveLength(4);
    expect(focusSupport.querySelectorAll('[data-panel-preview-region]')).toHaveLength(2);
    expect(columns.querySelectorAll('[data-panel-preview-region="column"]')).toHaveLength(3);

    const columnsRadio = within(layoutGroup).getByRole('radio', { name: /Columns/ });
    columnsRadio.focus();
    await user.keyboard('{ArrowLeft}');
    expect(within(layoutGroup).getByRole('radio', { name: /Focus \+ Support/ })).toBeChecked();
    expect(focusSupport).toHaveAttribute('data-pom-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(storyStage).toHaveAttribute('data-pom-selected', 'true');
    expect(columns).not.toHaveAttribute('data-pom-selected');
  });

  it('updates the Columns miniature from an accessible segmented count selector', async () => {
    const user = userEvent.setup();
    render(App);
    await user.click(screen.getByRole('button', { name: 'Create Panel' }));
    const dialog = screen.getByRole('dialog', { name: 'Create a Panel' });
    const countGroup = within(dialog).getByRole('group', { name: 'Columns' });
    const columnsCard = within(dialog).getByRole('radio', { name: /Columns/ }).closest('[data-panel-template-card]');
    if (!(columnsCard instanceof HTMLElement)) throw new Error('Missing Columns visual template card.');

    expect(within(countGroup).getAllByRole('radio')).toHaveLength(5);
    expect(within(countGroup).getByRole('radio', { name: '3' })).toBeChecked();
    expect(within(dialog).queryByRole('combobox', { name: 'Columns' })).toBeNull();
    const threeColumns = within(countGroup).getByRole('radio', { name: '3' });
    threeColumns.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(within(countGroup).getByRole('radio', { name: '5' })).toBeChecked();
    expect(within(countGroup).getByRole('radio', { name: '5' }).closest('[data-column-count-option]')).toHaveAttribute('data-pom-selected', 'true');
    expect(columnsCard.querySelectorAll('[data-panel-preview-region="column"]')).toHaveLength(5);

    await user.click(within(dialog).getByRole('radio', { name: /Focus \+ Support/ }));
    expect(within(dialog).queryByRole('group', { name: 'Columns' })).toBeNull();
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
    const panelTablist = screen.getByRole('tablist', { name: 'Panels' });
    const panelOrder = () => within(panelTablist).getAllByRole('tab').map((tab) => tab.textContent?.trim());
    const settingsTab = within(panelTablist).getByRole('tab', { name: 'Settings' });
    settingsTab.focus();
    await user.keyboard('{Control>}{Shift>}{ArrowLeft}{/Shift}{/Control}');
    expect(panelOrder()).toEqual(['Scene', 'Library', 'Settings']);
    expect(within(panelTablist).getByRole('tab', { name: 'Library' })).toHaveFocus();
    expect(within(panelTablist).getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');

    settingsTab.focus();
    expect(await fireEvent.keyDown(settingsTab, { key: 'ContextMenu' })).toBe(false);
    const panelActions = document.querySelector<HTMLElement>('#panel-menu');
    if (!panelActions) throw new Error('Expected the shared Panel action surface.');
    expect(panelActions).toHaveAttribute('role', 'dialog');
    expect(panelActions).toHaveAttribute('aria-label', 'Settings Panel actions');
    expect(panelActions).toHaveAttribute('data-fallback-open');
    await fireEvent.click(within(panelActions).getByRole('button', { name: 'Reorder Panels…', hidden: true }));
    const orderDialog = await screen.findByRole('dialog', { name: 'Reorder Panels' });
    await waitFor(() => expect(within(orderDialog).getByRole('button', { name: 'Reorder Scene' })).toHaveFocus());
    const moveSettingsUp = within(orderDialog).getByRole('button', { name: 'Move Settings up' });
    moveSettingsUp.focus();
    expect(moveSettingsUp).toHaveFocus();
    await userEvent.setup({ document: moveSettingsUp.ownerDocument, delay: null }).keyboard('{Enter}');
    expect(panelOrder()).toEqual(['Scene', 'Settings', 'Library']);
    expect(within(panelTablist).getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
    await user.click(within(orderDialog).getByRole('button', { name: 'Done' }));

    await user.click(within(panelTablist).getByRole('tab', { name: 'Scene' }));
    const ambience = screen.getByRole('article', { name: 'Room Ambience' });
    await fireEvent.contextMenu(screen.getByRole('tab', { name: 'Room Ambience' }), { clientX: 20, clientY: 20 });
    const widgetActions = document.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');
    expect(widgetActions).toHaveAttribute('aria-label', 'Room Ambience Widget actions');
    expect(widgetActions).toHaveAttribute('data-fallback-open');
    await fireEvent.click(within(widgetActions).getByRole('menuitem', { name: 'Dock left', hidden: true }));
    const dockedAmbience = screen.getByRole('article', { name: 'Room Ambience' });
    expect(dockedAmbience.closest('[data-pomegranate-dock]')).toHaveAttribute('data-pomegranate-dock', 'left');
    await user.click(within(dockedAmbience).getByRole('button', { name: 'Widget actions' }));
    await fireEvent.click(within(widgetActions).getByRole('menuitem', { name: 'Float', hidden: true }));
    expect(screen.getByRole('article', { name: 'Room Ambience' })).toHaveAttribute('data-pomegranate-placement', 'floating');
  });

  it('defers secondary-pointer Widget actions until release on standalone and grouped headers', async () => {
    const { container } = render(App);
    const widgetActions = container.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');

    const worldStateHeader = within(screen.getByRole('article', { name: 'World State' }))
      .getByRole('toolbar', { name: 'World State draggable Widget header' });
    await fireEvent.pointerDown(worldStateHeader, {
      button: 2,
      clientX: 20,
      clientY: 20,
      pointerId: 91,
      pointerType: 'mouse'
    });
    await fireEvent.contextMenu(worldStateHeader, { clientX: 20, clientY: 20 });
    expect(widgetActions).not.toHaveAttribute('data-fallback-open');
    await fireEvent.pointerUp(worldStateHeader, {
      button: 2,
      clientX: 20,
      clientY: 20,
      pointerId: 91,
      pointerType: 'mouse'
    });
    await waitFor(() => expect(widgetActions).toHaveAttribute('aria-label', 'World State Widget actions'));
    expect(widgetActions).toHaveAttribute('data-fallback-open');

    await fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(widgetActions).not.toHaveAttribute('data-fallback-open'));
    const promiseLedger = screen.getByRole('tab', { name: 'Promise Ledger' });
    await fireEvent.pointerDown(promiseLedger, {
      button: 2,
      clientX: 24,
      clientY: 24,
      pointerId: 92,
      pointerType: 'mouse'
    });
    await fireEvent.contextMenu(promiseLedger, { clientX: 24, clientY: 24 });
    expect(widgetActions).not.toHaveAttribute('data-fallback-open');
    await fireEvent.pointerUp(promiseLedger, {
      button: 2,
      clientX: 24,
      clientY: 24,
      pointerId: 92,
      pointerType: 'mouse'
    });
    await waitFor(() => expect(widgetActions).toHaveAttribute('aria-label', 'Promise Ledger Widget actions'));
    expect(widgetActions).toHaveAttribute('data-fallback-open');
  });

  it('honors an actual mouse context menu even when pointer media reports coarse-only input', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === '(pointer: coarse)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      }) satisfies MediaQueryList
    });
    render(App);
    const worldStateHeader = within(screen.getByRole('article', { name: 'World State' }))
      .getByRole('toolbar', { name: 'World State draggable Widget header' });

    await fireEvent.contextMenu(worldStateHeader, {
      button: 2,
      pointerType: 'mouse',
      clientX: 32,
      clientY: 48
    });

    const widgetActions = document.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');
    expect(widgetActions).toHaveAttribute('aria-label', 'World State Widget actions');
    expect(widgetActions).toHaveAttribute('data-fallback-open');
  });

  it('does not turn a touch long-press context menu into a Widget action request', async () => {
    render(App);
    const worldStateHeader = within(screen.getByRole('article', { name: 'World State' }))
      .getByRole('toolbar', { name: 'World State draggable Widget header' });

    await fireEvent.pointerDown(worldStateHeader, {
      button: 0,
      pointerId: 14,
      pointerType: 'touch',
      clientX: 32,
      clientY: 48
    });
    await fireEvent.contextMenu(worldStateHeader, {
      button: 2,
      clientX: 32,
      clientY: 48
    });
    await fireEvent.pointerCancel(worldStateHeader, {
      pointerId: 14,
      pointerType: 'touch'
    });

    const widgetActions = document.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');
    expect(widgetActions).toHaveAttribute('aria-label', 'Widget actions');
    expect(widgetActions).not.toHaveAttribute('data-fallback-open');
  });

  it('keeps host presentation titles through Focus', async () => {
    const user = userEvent.setup();
    render(App);
    await fireEvent.contextMenu(screen.getByRole('tab', { name: 'Room Ambience' }), { clientX: 20, clientY: 20 });
    const widgetActions = document.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');
    expect(widgetActions).toHaveAttribute('aria-label', 'Room Ambience Widget actions');
    expect(widgetActions).toHaveAttribute('data-fallback-open');
    await fireEvent.click(within(widgetActions).getByRole('menuitem', { name: 'Focus Widget', hidden: true }));
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
    await user.click(within(within(dialog).getByRole('group', { name: 'Columns' })).getByRole('radio', { name: '4' }));
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
    const widgetActions = document.querySelector<HTMLElement>('.widget-actions-menu');
    if (!widgetActions) throw new Error('Expected the shared Widget action surface.');
    expect(widgetActions).toHaveAttribute('aria-label', 'Transcript Widget actions');
    expect(widgetActions).toHaveAttribute('data-fallback-open');
    await fireEvent.click(within(widgetActions).getByRole('menuitem', { name: 'Move to Widget Shelf', hidden: true }));
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

  it('renders focused theme elements and synchronizes the identical Theme Materials Widget across Panels', async () => {
    const user = userEvent.setup();
    const { container } = render(App);

    const sceneMaterials = screen.getByRole('article', { name: 'Theme Materials' });
    expect(sceneMaterials.querySelector('[data-theme-authoring-element="materials"]')).not.toBeNull();
    expect(within(sceneMaterials).queryByRole('button', { name: 'Reset' })).toBeNull();
    await fireEvent.input(within(sceneMaterials).getByRole('slider', { name: 'Glass Density' }), { target: { value: '37' } });

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    await user.click(within(screen.getByRole('article', { name: 'Theme Library' })).getByRole('button', { name: 'Open Custom Theme' }));
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Appearance and Accessibility' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('article', { name: 'Custom Theme' })).getByRole('button', { name: 'Reset' })).toHaveFocus();

    const overview = screen.getByRole('article', { name: 'Custom Theme' });
    const colors = screen.getByRole('article', { name: 'Theme Colors' });
    const materials = screen.getByRole('article', { name: 'Theme Materials' });
    const canvas = screen.getByRole('article', { name: 'Theme Canvas' });
    const ambient = screen.getByRole('article', { name: 'Ambient Light' });
    expect(within(overview).getByRole('button', { name: 'Reset' })).toBeVisible();
    expect(within(overview).getByRole('button', { name: 'Save draft' })).toBeVisible();
    expect(within(overview).queryByRole('slider')).toBeNull();
    for (const role of ['Canvas', 'Glass', 'Chrome', 'Ambient', 'Text', 'Source']) {
      expect(within(colors).getByRole('button', { name: role })).toBeVisible();
    }
    for (const control of ['Glass Density', 'Bar Opacity', 'Selected Strength', 'Frost Level']) {
      expect(within(materials).getByRole('slider', { name: control })).toBeVisible();
    }
    for (const control of ['Image Strength', 'Overlay Strength', 'Gradient Direction', 'Vignette Strength']) {
      expect(within(canvas).getByRole('slider', { name: control })).toBeVisible();
    }
    for (const control of ['Radius', 'Power']) {
      expect(within(ambient).getByRole('slider', { name: control })).toBeVisible();
    }
    expect(within(materials).getByRole('slider', { name: 'Glass Density' })).toHaveValue('37');
    await fireEvent.input(within(materials).getByRole('slider', { name: 'Bar Opacity' }), { target: { value: '44' } });

    const hex = within(colors).getByRole('textbox', { name: 'Hex color' });
    await fireEvent.input(hex, { target: { value: '#101820' } });
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-color-canvas')).toBe('#101820');

    await fireEvent.input(hex, { target: { value: 'unsafe' } });
    expect(hex).toHaveValue('unsafe');
    expect(within(colors).getAllByText(/#RRGGBB/).length).toBeGreaterThan(0);
    expect((container.querySelector('main') as HTMLElement).style.getPropertyValue('--pom-color-canvas')).toBe('#101820');

    const plane = within(colors).getByRole('application', { name: 'Saturation and value' });
    plane.focus();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(plane).toHaveFocus();
    expect(within(colors).getByText(/Saturation .* Value/)).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Scene' }));
    expect(within(screen.getByRole('article', { name: 'Theme Materials' })).getByRole('slider', { name: 'Bar Opacity' })).toHaveValue('44');
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    await user.click(within(screen.getByRole('article', { name: 'Custom Theme' })).getByRole('button', { name: 'Reset' }));
    expect(within(screen.getByRole('article', { name: 'Theme Colors' })).getByRole('textbox', { name: 'Hex color' })).not.toHaveValue('unsafe');
    await user.click(within(screen.getByRole('article', { name: 'Custom Theme' })).getByRole('button', { name: 'Save draft' }));
    expect(window.localStorage.getItem(themeDraftStorageKey('deep-current'))).not.toBeNull();
  }, 10_000);

  it('authors toolbar controls in Theme Settings and resets them to the active Theme Library target', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    const root = container.querySelector('main');

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    const customTheme = screen.getByRole('article', { name: 'Custom Theme' });
    const controls = within(customTheme).getByRole('group', { name: 'Toolbar controls' });

    expect(within(controls).getByRole('radio', { name: 'Edge labels' })).toBeChecked();
    await user.click(within(controls).getByRole('radio', { name: 'Bottom-edge chevrons' }));
    expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'bottom-chevrons');
    await user.click(screen.getByRole('tab', { name: 'Scene' }));
    expect(screen.getByRole('button', { name: 'Close left toolbar' })).toHaveTextContent('‹');
    expect(screen.getByRole('button', { name: 'Close right toolbar' })).toHaveTextContent('›');

    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    await user.click(screen.getByRole('tab', { name: 'Appearance and Accessibility' }));
    const resetTheme = screen.getByRole('article', { name: 'Custom Theme' });
    const resetControls = within(resetTheme).getByRole('group', { name: 'Toolbar controls' });
    await user.click(within(resetTheme).getByRole('button', { name: 'Reset' }));
    expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'edge-labels');
    expect(within(resetControls).getByRole('radio', { name: 'Edge labels' })).toBeChecked();

    const library = screen.getByRole('article', { name: 'Theme Library' });
    await user.click(within(library).getByRole('button', { name: /^PomOS/ }));
    expect(root).toHaveAttribute('data-pom-toolbar-toggle-presentation', 'bottom-chevrons');
    expect(within(resetControls).getByRole('radio', { name: 'Bottom-edge chevrons' })).toBeChecked();
  });

  it('exposes the shared Story measure and one-column toolbar controls', () => {
    render(App);

    expect(screen.getByRole('separator', { name: 'Resize Story width from left edge' })).toHaveAttribute(
      'data-story-measure-resizer', 'left'
    );
    expect(screen.getByRole('separator', { name: 'Resize Story width from right edge' })).toHaveAttribute(
      'data-story-measure-resizer', 'right'
    );
    expect(screen.getByRole('button', { name: 'Remove column from left toolbar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add column to left toolbar' })).toHaveTextContent('+');
    expect(screen.getByRole('button', { name: 'Remove column from right toolbar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add column to right toolbar' })).toHaveTextContent('+');
  });
});
