import { describe, expect, it } from 'vitest';

import {
  asWidgetType,
  type WidgetManifest
} from '@pomegranate-ui/contracts';

import { createWidgetRegistry } from './index.js';

function manifest(type = 'story.summary'): WidgetManifest {
  return {
    type: asWidgetType(type),
    version: '1.0.0',
    title: 'Story summary',
    capabilities: ['story.read'],
    defaultConfiguration: { presentation: { density: 'compact' } },
    defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
  };
}

describe('Widget registry', () => {
  it('copies and freezes admitted manifests', () => {
    const registry = createWidgetRegistry();
    const source = manifest();
    const result = registry.register(source);
    expect(result.ok).toBe(true);

    (source.capabilities as string[]).push('mutated');
    (source.defaultConfiguration.presentation as { density: string }).density = 'spacious';

    const stored = registry.get(source.type);
    expect(stored?.capabilities).toEqual(['story.read']);
    expect(stored?.defaultConfiguration).toEqual({ presentation: { density: 'compact' } });
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored?.capabilities)).toBe(true);
    expect(Object.isFrozen(stored?.defaultConfiguration.presentation)).toBe(true);
  });

  it('rejects invalid and duplicate manifests with named results', () => {
    const registry = createWidgetRegistry();
    expect(registry.register(manifest()).ok).toBe(true);
    const duplicate = registry.register(manifest());
    const invalid = registry.register({ ...manifest('bad'), title: '  ' });
    expect(duplicate.ok).toBe(false);
    expect(!duplicate.ok && duplicate.error.code).toBe('DUPLICATE_WIDGET_TYPE');
    expect(invalid.ok).toBe(false);
    expect(!invalid.ok && invalid.error.code).toBe('INVALID_MANIFEST');
  });

  it('lists deterministically and unregisters without other state authority', () => {
    const registry = createWidgetRegistry();
    registry.register(manifest('story.zeta'));
    registry.register(manifest('story.alpha'));
    expect(registry.list().map((entry) => entry.type)).toEqual(['story.alpha', 'story.zeta']);
    expect(registry.has(asWidgetType('story.alpha'))).toBe(true);
    expect(registry.unregister(asWidgetType('story.alpha'))).toBe(true);
    expect(registry.unregister(asWidgetType('story.alpha'))).toBe(false);
  });
});
