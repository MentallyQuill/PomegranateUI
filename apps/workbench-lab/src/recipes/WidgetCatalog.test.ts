// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLabHostContext, type LabHostContext } from '../mockup/host-context.js';
import { createLabThemeController } from '../themes/controller.js';
import { createLabRuntime } from '../mockup/widgets.js';
import WidgetCatalog from './WidgetCatalog.svelte';

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() {
        this.setAttribute('open', '');
      }
    },
    close: {
      configurable: true,
      value() {
        this.removeAttribute('open');
      }
    }
  });
});

function previewHostContext(): LabHostContext {
  const controller = createLabThemeController({ initialId: 'deep-current' });
  const snapshot = controller.getSnapshot();
  return createLabHostContext({
    activeId: 'deep-current',
    presets: [],
    inspector: {
      colors: snapshot.compiled.theme.colors,
      typography: [],
      geometry: 'faceted · 4px',
      density: 'compact',
      iconPackId: snapshot.compiled.theme.iconPackId
    },
    materialControls: snapshot.materialControls,
    authoring: controller.getAuthoringSnapshot(),
    activate: () => undefined,
    setMaterialControl: () => undefined,
    resetMaterialControls: () => undefined,
    openSettings: () => undefined,
    editDraft: (next) => controller.editDraft(next),
    resetDraft: () => controller.resetDraft(),
    saveDraft: () => controller.saveDraft()
  });
}

function renderCatalog() {
  const runtime = createLabRuntime();
  runtime.catalog.open('expanded');
  const oncreate = vi.fn();
  const rendered = render(WidgetCatalog, {
    catalog: runtime.catalog,
    rendererRegistry: runtime.rendererRegistry,
    hostContext: previewHostContext(),
    instanceCounts: {},
    oncreate
  });
  return { ...runtime, ...rendered, oncreate };
}

describe('WidgetCatalog', () => {
  it('renders the fixed source controls and all 94 whole-result shared previews', () => {
    const { container } = renderCatalog();
    const dialog = screen.getByRole('dialog', { name: 'Widget Catalog' });

    expect(within(dialog).getByRole('heading', { name: 'Widget Catalog' })).toBeVisible();
    expect(within(dialog).getByText('Build this Panel')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Close Widget Catalog' })).toBeVisible();
    expect(within(dialog).getByRole('searchbox', { name: 'Search Widgets' })).toHaveAttribute('placeholder', 'Search widgets…');

    const slider = within(dialog).getByRole('slider', { name: 'Preview size' });
    expect(slider).toHaveAttribute('min', '200');
    expect(slider).toHaveAttribute('max', '420');
    expect(slider).toHaveValue('286');
    expect(slider).toHaveAttribute('aria-valuetext', 'Medium preview, 286 pixels');
    expect(within(dialog).getByText('Medium · 286 px')).toBeVisible();
    expect([...dialog.querySelectorAll('datalist option')].map((option) => [option.getAttribute('value'), option.getAttribute('label')])).toEqual([
      ['200', 'Small'],
      ['286', 'Medium'],
      ['420', 'Large']
    ]);

    expect(within(within(dialog).getByRole('navigation', { name: 'Widget categories' })).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All', 'Story', 'Library', 'Systems', 'Settings', 'Extensions'
    ]);
    expect(within(within(dialog).getByRole('group', { name: 'Catalog filters' })).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Favorites', 'Recent', 'On this Panel', 'Fits this layout'
    ]);
    expect(within(within(dialog).getByRole('group', { name: 'Catalog view' })).getAllByRole('button').map((button) => button.textContent)).toEqual(['Visual', 'Compact']);
    expect(within(dialog).getByText('94 widgets')).toBeVisible();
    expect(within(dialog).getByText('Strictly active story')).toBeVisible();

    const results = container.querySelectorAll<HTMLElement>('[data-catalog-result]');
    expect(results).toHaveLength(94);
    expect([...results].every((result) => result.getAttribute('role') === 'button' && result.tabIndex === 0)).toBe(true);
    const previews = container.querySelectorAll<HTMLElement>('[data-catalog-preview]');
    expect(previews).toHaveLength(94);
    expect([...previews].every((preview) => preview.hasAttribute('inert') && preview.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(container.querySelectorAll('[data-surface-type]')).toHaveLength(94);
    expect(screen.queryByText(/Renderer unavailable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument();

    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses Compact as the same one-column result tree without previews or preview sizing', async () => {
    const user = userEvent.setup();
    const { container } = renderCatalog();

    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(screen.queryByRole('slider', { name: 'Preview size' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-catalog-preview]')).toHaveLength(0);
    expect(container.querySelector('[data-catalog-results]')).toHaveAttribute('data-catalog-view', 'compact');
    expect(container.querySelectorAll('[data-catalog-result]')).toHaveLength(94);
  });

  it('closes on Escape and restores focus to the launcher', async () => {
    const runtime = createLabRuntime();
    const launcher = document.createElement('button');
    launcher.textContent = 'Widgets';
    document.body.append(launcher);
    launcher.focus();
    render(WidgetCatalog, {
      catalog: runtime.catalog,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn()
    });
    runtime.catalog.open('expanded');

    const search = await screen.findByRole('searchbox', { name: 'Search Widgets' });
    await waitFor(() => expect(search).toHaveFocus());
    await fireEvent.keyDown(search, { key: 'Escape' });

    expect(runtime.catalog.getState().open).toBe(false);
    await waitFor(() => expect(launcher).toHaveFocus());
    launcher.remove();
  });
});
