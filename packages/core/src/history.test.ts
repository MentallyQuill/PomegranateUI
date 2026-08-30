import { describe, expect, it } from 'vitest';
import { createInitialWorkbenchState } from '@pomegranate-ui/layout';
import { createOneStepLayoutHistory } from './history.js';

describe('one-step layout history', () => {
  it('replaces, consumes, and clears the single record', () => {
    const history = createOneStepLayoutHistory();
    const first = createInitialWorkbenchState();
    history.record(first, 'panel.activate');
    expect(history.canUndo()).toBe(true);
    expect(history.consume()).toEqual({ before: first, commandType: 'panel.activate' });
    expect(history.consume()).toBeNull();
    history.record(first, 'panel.rename');
    history.clear();
    expect(history.canUndo()).toBe(false);
  });
});
