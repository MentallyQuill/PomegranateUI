// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { asPanelId, type WorkbenchState } from '@pomegranate-ui/contracts';
import { createWorkbenchStore } from '@pomegranate-ui/core';
import StoryMeasureResizeHandle from './StoryMeasureResizeHandle.svelte';

const panelId = asPanelId('scene');

const state = (): WorkbenchState => ({
  schema: 'pomegranate.ui.state.v2',
  revision: 0,
  activePanelId: panelId,
  panels: [{ id: panelId, name: 'Scene', templateId: 'story-stage.v1', order: 0 }],
  shelves: [],
  widgets: {},
  placements: {}
});

const pointerEvent = (type: string, clientX: number): PointerEvent => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX });
  Object.defineProperty(event, 'pointerId', { configurable: true, value: 1 });
  return event as PointerEvent;
};

describe('StoryMeasureResizeHandle', () => {
  afterEach(cleanup);

  it('publishes the approved separator contract and leaves clicks inert', async () => {
    const store = createWorkbenchStore({ initialState: state() });
    render(StoryMeasureResizeHandle, {
      edge: 'left', panelId, measure: 800, minimum: 420, maximum: 1200, store
    });
    const handle = screen.getByRole('separator', { name: 'Resize Story width from left edge' });

    expect(handle).toHaveAttribute('data-story-measure-resizer', 'left');
    expect(handle).toHaveAttribute('data-pom-part', 'story.measure-resizer');
    expect(handle).toHaveAttribute('aria-valuenow', '800');
    await fireEvent.click(handle);
    await fireEvent.dblClick(handle);
    await fireEvent(handle, pointerEvent('pointerdown', 400));
    await fireEvent(handle, pointerEvent('pointerup', 400));
    expect(store.getState().revision).toBe(0);
  });

  it('previews pointer movement and commits exactly once on pointer release', async () => {
    const store = createWorkbenchStore({ initialState: state() });
    const { container } = render(StoryMeasureResizeHandle, {
      edge: 'left', panelId, measure: 800, minimum: 420, maximum: 1200, store
    });
    const handle = screen.getByRole('separator', { name: /left edge/i });
    const surface = document.createElement('div');
    surface.className = 'panel-template-surface';
    container.insertBefore(surface, container.firstChild);
    surface.append(handle);

    await fireEvent(handle, pointerEvent('pointerdown', 400));
    await fireEvent(handle, pointerEvent('pointermove', 352));
    expect(store.getState().revision).toBe(0);
    expect(surface.style.getPropertyValue('--pom-story-measure')).toBe('896px');
    await fireEvent(handle, pointerEvent('pointerup', 352));
    expect(store.getState().revision).toBe(1);
    expect(store.getState().panels[0]?.storyLayout?.preferredMeasure).toBe(896);
    expect(surface.style.getPropertyValue('--pom-story-measure')).toBe('');
  });

  it('cancels pointer previews and supports spatial keyboard resizing', async () => {
    const store = createWorkbenchStore({ initialState: state() });
    render(StoryMeasureResizeHandle, {
      edge: 'right', panelId, measure: 800, minimum: 420, maximum: 1000, store
    });
    const handle = screen.getByRole('separator', { name: /right edge/i });

    await fireEvent(handle, pointerEvent('pointerdown', 400));
    await fireEvent(handle, pointerEvent('pointermove', 440));
    await fireEvent(handle, pointerEvent('pointercancel', 440));
    expect(store.getState().revision).toBe(0);
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(store.getState().panels[0]?.storyLayout?.preferredMeasure).toBe(816);
    await fireEvent.keyDown(handle, { key: 'Home' });
    expect(store.getState().panels[0]?.storyLayout?.preferredMeasure).toBe(420);
    await fireEvent.keyDown(handle, { key: 'End' });
    expect(store.getState().panels[0]?.storyLayout?.preferredMeasure).toBe(1000);
  });
});
