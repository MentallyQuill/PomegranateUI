// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import IconAction from './IconAction.svelte';

afterEach(cleanup);

describe('IconAction', () => {
  it('keeps a real accessible name and native pointer and keyboard activation', async () => {
    const onclick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(IconAction, {
      props: { label: 'Save layout', action: 'save-layout', onclick }
    });
    const button = screen.getByRole('button', { name: 'Save layout' });

    expect(button).toHaveAttribute('data-pom-icon-action');
    expect(button).toHaveAttribute('data-pom-action', 'save-layout');
    expect(button).toHaveAttribute('data-pom-part', 'button.icon');
    expect(container.querySelector('[data-pom-action-icon]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-pom-action-label]')).toHaveTextContent('Save layout');

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onclick).toHaveBeenCalledTimes(2);
  });

  it('retains text when presentation bindings are absent and exposes a 44px minimum target', () => {
    const { container } = render(IconAction, {
      props: { label: 'Open catalog', action: 'open-catalog' }
    });
    const button = screen.getByRole('button', { name: 'Open catalog' });
    const label = container.querySelector<HTMLElement>('[data-pom-action-label]');
    const buttonStyle = getComputedStyle(button);

    expect(buttonStyle.display).toBe('inline-grid');
    expect(buttonStyle.alignItems).toBe('center');
    expect(buttonStyle.justifyContent).toBe('center');
    expect(buttonStyle.minWidth).toBe('44px');
    expect(buttonStyle.minHeight).toBe('44px');
    expect(getComputedStyle(label!).display).toBe('inline');
  });
});
