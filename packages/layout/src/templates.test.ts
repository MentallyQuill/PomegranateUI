import { describe, expect, it } from 'vitest';
import { asPanelId, type PanelState } from '@pomegranate-ui/contracts';

import { createPanelTemplateRegistry } from './templates.js';

const panel = (templateId: string, columns?: number): PanelState => ({
  id: asPanelId('panel'),
  name: 'Panel',
  templateId,
  order: 0,
  ...(columns === undefined ? {} : { configuration: { columns } })
});

describe('Panel template registry', () => {
  it.each([
    ['story-stage.v1', ['left', 'stage', 'composer', 'right']],
    ['focus-support.v1', ['focus', 'support']]
  ])('resolves %s with stable ordered regions', (templateId, regionIds) => {
    const result = createPanelTemplateRegistry().resolve(panel(templateId));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.template.regions.map((region) => region.id)).toEqual(regionIds);
  });

  it.each([2, 3, 4, 5, 6])('resolves exactly %i Columns regions', (columns) => {
    const result = createPanelTemplateRegistry().resolve(panel('columns.v1', columns));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.template.regions.map((region) => region.id)).toEqual(
        Array.from({ length: columns }, (_, index) => `column-${index + 1}`)
      );
    }
  });

  it('rejects unknown templates and unsupported Columns options without rewriting the Panel', () => {
    const registry = createPanelTemplateRegistry();
    expect(registry.resolve(panel('missing.v1'))).toMatchObject({ ok: false, code: 'UNKNOWN_TEMPLATE' });
    expect(registry.resolve(panel('columns.v1', 1))).toMatchObject({ ok: false, code: 'INVALID_TEMPLATE_OPTIONS' });
    expect(registry.resolve(panel('columns.v1', 7))).toMatchObject({ ok: false, code: 'INVALID_TEMPLATE_OPTIONS' });
    expect(registry.resolve(panel('columns.v1', 2.5))).toMatchObject({ ok: false, code: 'INVALID_TEMPLATE_OPTIONS' });
  });

  it('returns immutable snapshots and rejects duplicate template IDs', () => {
    const registry = createPanelTemplateRegistry();
    expect(Object.isFrozen(registry.list())).toBe(true);
    expect(Object.isFrozen(registry.get('story-stage.v1'))).toBe(true);
    expect(Object.isFrozen(registry.resolve(panel('story-stage.v1')))).toBe(true);
    expect(() => createPanelTemplateRegistry([
      registry.get('story-stage.v1')!,
      registry.get('story-stage.v1')!
    ])).toThrow(/duplicate/i);
  });
});
