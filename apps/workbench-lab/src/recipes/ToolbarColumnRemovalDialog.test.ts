// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { asWidgetInstanceId, type WidgetInstanceId } from '@pomegranate-ui/contracts';
import ToolbarColumnRemovalDialog from './ToolbarColumnRemovalDialog.svelte';

describe('ToolbarColumnRemovalDialog', () => {
  afterEach(cleanup);

  it('refreshes its confirmation snapshot after a stale rejection', async () => {
    const original = asWidgetInstanceId('original');
    const changed = asWidgetInstanceId('changed');
    const confirmations: WidgetInstanceId[][] = [];
    const props = {
      edge: 'left' as const,
      widgets: [{ id: original, title: 'Original Widget' }],
      onconfirm: (ids: readonly WidgetInstanceId[]) => {
        confirmations.push([...ids]);
        return false;
      },
      oncancel: () => undefined
    };
    const view = render(ToolbarColumnRemovalDialog, props);

    view.component.open();
    await view.rerender({ ...props, widgets: [{ id: changed, title: 'Changed Widget' }] });
    expect(screen.getByRole('dialog')).toHaveTextContent('Changed Widget');

    await fireEvent.click(screen.getByRole('button', { name: 'Remove column' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Remove column' }));

    expect(confirmations).toEqual([[original], [changed]]);
  });
});
