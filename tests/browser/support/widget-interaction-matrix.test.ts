import { describe, expect, it } from 'vitest';

import { INTERACTION_CASES, interactionCoverageGaps } from './widget-interaction-matrix.js';

describe('Widget interaction playtest matrix', () => {
  it('covers every approved axis value and required reachable pair', () => {
    expect(INTERACTION_CASES.map(({ id }) => id)).toEqual([...INTERACTION_CASES.map(({ id }) => id)].sort());
    expect(interactionCoverageGaps(INTERACTION_CASES)).toEqual([]);
  });
});
