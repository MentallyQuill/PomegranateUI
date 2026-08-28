import { describe, expect, it } from 'vitest';

import { createMockRoleplayConsumer } from './index.js';

describe('mock roleplay backend consumer', () => {
  it('restores toolkit layout while backend state remains a separate object', () => {
    const backendRecord = {
      storyId: 'story-consumer-1',
      turnCount: 42,
      privateSummary: 'Backend-owned narrative state'
    } as const;
    const consumer = createMockRoleplayConsumer(backendRecord);
    const created = consumer.store.dispatch(consumer.createSummaryWidgetCommand);
    expect(created.ok).toBe(true);

    const restored = consumer.roundTripLayout();
    expect(restored.ok).toBe(true);
    expect(restored.state.widgets['summary-1']?.type).toBe('story.summary');
    expect(consumer.backendRecord).toBe(backendRecord);
    expect(consumer.backendRecord.turnCount).toBe(42);
    expect(JSON.stringify(restored.state)).not.toContain('privateSummary');
    expect(JSON.stringify(restored.state)).not.toContain('Backend-owned narrative state');
  });
});
