import { describe, expect, it } from 'vitest';

import { createEyeDropperAdapter } from './eyedropper.js';

describe('Lab EyeDropper adapter', () => {
  it('reports an unavailable browser capability without touching it', async () => {
    const adapter = createEyeDropperAdapter({});
    expect(adapter.available()).toBe(false);
    expect(await adapter.sample()).toBeNull();
  });

  it('normalizes a sampled color and treats a denied request as a local cancellation', async () => {
    const sampled = createEyeDropperAdapter({
      EyeDropper: class {
        async open() { return { sRGBHex: '#A1B2C3' }; }
      }
    });
    expect(sampled.available()).toBe(true);
    expect(await sampled.sample()).toBe('#a1b2c3');

    const denied = createEyeDropperAdapter({
      EyeDropper: class {
        async open(): Promise<{ sRGBHex: string }> { throw new DOMException('Denied', 'NotAllowedError'); }
      }
    });
    expect(await denied.sample()).toBeNull();
  });
});
