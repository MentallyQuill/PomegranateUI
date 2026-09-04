// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { asPanelId, type WorkbenchState } from '@pomegranate-ui/contracts';
import { createWorkbenchStore } from '@pomegranate-ui/core';
import ToolbarResizeHandle from './ToolbarResizeHandle.svelte';

const panelId = asPanelId('scene');
const pointer = (type: string, clientX: number): PointerEvent => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX });
  Object.defineProperty(event, 'pointerId', { configurable: true, value: 1 });
  return event as PointerEvent;
};

describe('ToolbarResizeHandle', () => {
  afterEach(cleanup);

  it('coalesces pointer previews into one command and clears the preview override', async () => {
    const initialState: WorkbenchState = {
      schema: 'pomegranate.ui.state.v2', revision: 0, activePanelId: panelId,
      panels: [{ id: panelId, name: 'Scene', templateId: 'story-stage.v1', order: 0 }],
      shelves: [], widgets: {}, placements: {}
    };
    const store = createWorkbenchStore({ initialState });
    const { container } = render(ToolbarResizeHandle, { edge: 'left', panelId, width: 286, store });
    const owner = document.createElement('div');
    owner.dataset.pomegranatePanel = panelId;
    container.insertBefore(owner, container.firstChild);
    const handle = screen.getByRole('separator', { name: 'Resize left toolbar' });
    owner.append(handle);

    await fireEvent(handle, pointer('pointerdown', 300));
    await fireEvent(handle, pointer('pointermove', 320));
    await fireEvent(handle, pointer('pointermove', 340));
    expect(owner.style.getPropertyValue('--pom-left-width')).toBe('326px');
    expect(store.getState().revision).toBe(0);
    await fireEvent(handle, pointer('pointerup', 340));

    expect(store.getState().revision).toBe(1);
    expect(store.getState().panels[0]?.configuration?.dockWidths).toMatchObject({ left: 326 });
    expect(owner.style.getPropertyValue('--pom-left-width')).toBe('');
  });
});
