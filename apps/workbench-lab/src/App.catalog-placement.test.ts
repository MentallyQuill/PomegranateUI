// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import App from './App.svelte';
import { LAB_LAYOUT_KEY } from './storage.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});

describe('App catalog placement integration', () => {
  it('routes automatic and panel-targeted placement through one widget.create boundary without leaking active sub-panel scope', async () => {
    const user = userEvent.setup();
    const { container } = render(App);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    const main = container.querySelector<HTMLElement>('main[data-workbench-revision]')!;
    const activePanel = () => container.querySelector<HTMLElement>('[data-pomegranate-panel]')!;
    const revision = () => Number(main.dataset.workbenchRevision);
    const initialRevision = revision();
    const launcher = screen.getByRole('button', { name: 'Open Widget Catalog' });

    await user.click(launcher);
    let dialog = screen.getByRole('dialog', { name: 'Widget Catalog' });
    let result = dialog.querySelector<HTMLElement>('[data-widget-type="library.workspace"]')!;
    await user.click(result);
    await waitFor(() => expect(revision()).toBe(initialRevision + 1));
    expect(activePanel().querySelectorAll('[data-widget-type="library.workspace"]')).toHaveLength(1);
    await user.click(within(dialog).getByRole('button', { name: 'Close Widget Catalog' }));

    const settingsPanel = activePanel();
    const subPanelSurface = settingsPanel.querySelector<HTMLElement>('[data-sub-panel]')!;
    subPanelSurface.removeAttribute('data-sub-panel');
    for (const target of settingsPanel.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')) {
      Object.defineProperty(target, 'getBoundingClientRect', {
        configurable: true,
        value: () => new DOMRect(100, 100, 400, 300)
      });
    }

    await user.click(launcher);
    dialog = screen.getByRole('dialog', { name: 'Widget Catalog' });
    result = dialog.querySelector<HTMLElement>('[data-widget-type="library.workspace"]')!;
    Object.defineProperty(result, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(10, 10, 286, 360)
    });
    result.focus();
    await fireEvent.keyDown(result, { key: ' ' });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    const selectedTarget = settingsPanel.querySelector<HTMLElement>('.is-catalog-target-active')!;
    await waitFor(() => expect(selectedTarget).toHaveFocus());
    await fireEvent.keyDown(document, { key: 'Enter' });

    await waitFor(() => expect(revision()).toBe(initialRevision + 2));
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    await user.click(within(dialog).getByRole('button', { name: 'Close Widget Catalog' }));
    await user.click(screen.getByRole('button', { name: 'Save layout' }));
    await waitFor(() => expect(window.localStorage.getItem(LAB_LAYOUT_KEY)).not.toBeNull());

    const snapshot = JSON.parse(window.localStorage.getItem(LAB_LAYOUT_KEY)!) as {
      placements: Record<string, Record<string, unknown>>;
    };
    const automaticId = `catalog-library-workspace-${initialRevision + 1}`;
    const targetedId = `catalog-library-workspace-${initialRevision + 2}`;
    expect(snapshot.placements[automaticId]).toMatchObject({
      kind: 'docked',
      panelId: settingsPanel.dataset.pomegranatePanel,
      subPanelId: expect.any(String),
      lane: 0
    });
    expect(snapshot.placements[targetedId]).toMatchObject({
      kind: 'docked',
      panelId: settingsPanel.dataset.pomegranatePanel
    });
    expect(snapshot.placements[targetedId]).not.toHaveProperty('subPanelId');
    expect(snapshot.placements[targetedId]).not.toHaveProperty('lane');
  }, 20_000);
});
