import { describe, expect, it } from 'vitest';

import { adaptSonderProjection } from './adapter.js';

describe('Sonder-shaped plain-data adapter', () => {
  it('maps only explicit host context fields without retaining the source object', () => {
    const capabilities = ['story.read', 'library.read'];
    const source = {
      active_story_id: 'story-7',
      capabilities,
      server_secret: 'must-not-cross'
    };
    const adapted = adaptSonderProjection(source);
    capabilities.push('mutated');

    expect(adapted).toEqual({
      storyId: 'story-7',
      capabilities: ['story.read', 'library.read']
    });
    expect(adapted).not.toBe(source);
    expect(Object.isFrozen(adapted)).toBe(true);
    expect(Object.isFrozen(adapted.capabilities)).toBe(true);
    expect(JSON.stringify(adapted)).not.toContain('server_secret');
  });
});
