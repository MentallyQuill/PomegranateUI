import { describe, expect, it } from 'vitest';

import { dragActivationDecision, reorderIndexAtPoint, tabDragDecision } from './tab-reorder.js';

describe('shared tab reordering geometry', () => {
  it('selects an insertion index from literal tab centers while excluding the origin', () => {
    const tabs = [
      { id: 'scene', left: 0, right: 100 },
      { id: 'library', left: 100, right: 220 },
      { id: 'settings', left: 220, right: 340 }
    ];
    expect(reorderIndexAtPoint('scene', 300, tabs)).toBe(2);
    expect(reorderIndexAtPoint('settings', 40, tabs)).toBe(0);
    expect(reorderIndexAtPoint('library', 160, tabs)).toBe(1);
  });

  it('keeps taps as activation, starts horizontal reordering, and reserves vertical motion for tear-off', () => {
    expect(tabDragDecision({ dx: 3, dy: 2, pointerType: 'mouse', elapsedMs: 40 })).toBe('pending');
    expect(tabDragDecision({ dx: 9, dy: 2, pointerType: 'mouse', elapsedMs: 40 })).toBe('reorder');
    expect(tabDragDecision({ dx: 2, dy: 12, pointerType: 'mouse', elapsedMs: 40, allowTearOff: true })).toBe('tear-off');
    expect(tabDragDecision({ dx: 12, dy: 2, pointerType: 'touch', elapsedMs: 120 })).toBe('cancelled');
    expect(tabDragDecision({ dx: 12, dy: 2, pointerType: 'touch', elapsedMs: 190 })).toBe('reorder');
  });

  it('requires a deliberate touch hold for free-axis Widget drags', () => {
    expect(dragActivationDecision({ dx: 8, dy: 1, pointerType: 'touch', elapsedMs: 120 })).toBe('cancelled');
    expect(dragActivationDecision({ dx: 1, dy: 8, pointerType: 'touch', elapsedMs: 190 })).toBe('ready');
    expect(dragActivationDecision({ dx: 3, dy: 2, pointerType: 'touch', elapsedMs: 220 })).toBe('pending');
    expect(dragActivationDecision({ dx: 4, dy: 0, pointerType: 'mouse', elapsedMs: 10 })).toBe('ready');
  });
});
