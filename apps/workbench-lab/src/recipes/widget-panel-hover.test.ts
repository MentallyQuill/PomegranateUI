import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWidgetPanelHover } from './widget-panel-hover.js';

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe('widget panel hover', () => {
  it('exposes the pending destination, then activates it only after the dwell', () => {
    vi.useFakeTimers();
    const root = document.body.appendChild(document.createElement('main'));
    root.innerHTML = '<span data-pomegranate-panel-tab="library"><button role="tab" aria-selected="false">Library</button></span>';
    const tab = root.querySelector('button')!;
    tab.getBoundingClientRect = () => new DOMRect(100, 10, 80, 30);
    const activate = vi.fn();
    const hover = createWidgetPanelHover(() => root, activate);
    hover.update({ x: 120, y: 20 });
    expect(hover.getHint()?.label).toBe('Hold to open Library');
    vi.advanceTimersByTime(200);
    hover.update({ x: 121, y: 20 });
    expect(activate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(activate).toHaveBeenCalledExactlyOnceWith('library');
    expect(hover.getHint()).toBeUndefined();
    expect(tab.hasAttribute('data-widget-drag-hover')).toBe(false);
  });

  it('leaving or cancelling removes feedback and prevents a delayed activation', () => {
    vi.useFakeTimers();
    const root = document.body.appendChild(document.createElement('main'));
    root.innerHTML = '<span data-pomegranate-panel-tab="library"><button role="tab" aria-selected="false">Library</button></span>';
    root.querySelector('button')!.getBoundingClientRect = () => new DOMRect(100, 10, 80, 30);
    const activate = vi.fn();
    const hover = createWidgetPanelHover(() => root, activate);
    hover.update({ x: 120, y: 20 });
    hover.update({ x: 220, y: 20 });
    vi.advanceTimersByTime(400);
    hover.update({ x: 120, y: 20 });
    hover.clear();
    vi.advanceTimersByTime(400);
    expect(activate).not.toHaveBeenCalled();
    expect(hover.getHint()).toBeUndefined();
  });
});
