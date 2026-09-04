import { describe, expect, it } from 'vitest';

import { CURATED_REQUIRED_PAIRS_DESCRIPTION, INTERACTION_CASES, curatedInteractionCoverageGaps } from './widget-interaction-matrix.js';

describe('Widget interaction playtest matrix', () => {
  it('covers every approved axis value and curated required pair', () => {
    expect(INTERACTION_CASES.map(({ id }) => id)).toEqual([...INTERACTION_CASES.map(({ id }) => id)].sort());
    expect(CURATED_REQUIRED_PAIRS_DESCRIPTION).toMatch(/not exhaustive/i);
    expect(curatedInteractionCoverageGaps(INTERACTION_CASES)).toEqual([]);
  });
});
