import { describe, expect, it } from 'vitest';

import { railPanDecision, revealTabScrollLeft, tabRailOverflow } from './tab-rail.js';

describe('shared tab-rail decisions', () => {
  it('turns horizontal mouse movement into rail panning without treating vertical movement as pan', () => {
    expect(railPanDecision({ dx: 8, dy: 2 })).toBe('pan');
    expect(railPanDecision({ dx: 2, dy: 8 })).toBe('cancelled');
    expect(railPanDecision({ dx: 4, dy: 2 })).toBe('pending');
  });

  it('reports exact before and after overflow states', () => {
    expect(tabRailOverflow({ scrollLeft: 0, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: false, after: true });
    expect(tabRailOverflow({ scrollLeft: 150, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: true, after: true });
    expect(tabRailOverflow({ scrollLeft: 300, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: true, after: false });
    expect(tabRailOverflow({ scrollLeft: 2, clientWidth: 200, scrollWidth: 500, tolerance: 3 })).toEqual({ before: false, after: true });
    expect(tabRailOverflow({ scrollLeft: 298, clientWidth: 200, scrollWidth: 500, tolerance: 3 })).toEqual({ before: true, after: false });
  });

  it('returns a clamped rail-local scroll position that reveals the tab', () => {
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 40, tabRight: 90 })).toBe(40);
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 280, tabRight: 340 })).toBe(140);
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 120, tabRight: 260 })).toBe(100);
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 490, tabRight: 550 })).toBe(300);
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 92, tabRight: 150, padding: 12 })).toBe(80);
    expect(revealTabScrollLeft({ scrollLeft: 100, clientWidth: 200, scrollWidth: 500, tabLeft: 250, tabRight: 292, padding: 12 })).toBe(104);
  });
});
