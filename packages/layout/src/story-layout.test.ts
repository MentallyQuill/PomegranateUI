import { describe, expect, it } from 'vitest';

import { asPanelId, type PanelState } from '@pomegranate-ui/contracts';
import {
  STORY_DEFAULT_MEASURE,
  STORY_MIN_MEASURE,
  resolveStoryLayoutGeometry,
  storyLayoutFor
} from './story-layout.js';

const storyPanel = (overrides: Partial<PanelState> = {}): PanelState => ({
  id: asPanelId('scene'),
  name: 'Scene',
  templateId: 'story-stage.v1',
  order: 0,
  configuration: { dockWidths: { left: 286, right: 286 } },
  ...overrides
});

describe('Story layout geometry', () => {
  it('uses the authored measure and one toolbar column for legacy Story Panels', () => {
    expect(storyLayoutFor(storyPanel())).toEqual({
      preferredMeasure: 800,
      toolbarColumns: { left: 1, right: 1 }
    });
    expect(STORY_DEFAULT_MEASURE).toBe(800);
    expect(STORY_MIN_MEASURE).toBe(420);
  });

  it('clamps rendered measure without overwriting the preferred measure', () => {
    const result = resolveStoryLayoutGeometry({
      panel: storyPanel({
        storyLayout: { preferredMeasure: 1100, toolbarColumns: { left: 1, right: 1 } }
      }),
      availableWidth: 1200
    });

    expect(result.preferredMeasure).toBe(1100);
    expect(result.renderedMeasure).toBe(580);
    expect(result.left.renderedWidth).toBe(286);
    expect(result.right.renderedWidth).toBe(286);
  });

  it('honors usable per-column dock bounds on wide surfaces', () => {
    const result = resolveStoryLayoutGeometry({
      panel: storyPanel({
        storyLayout: { preferredMeasure: 800, toolbarColumns: { left: 2, right: 3 } },
        configuration: { dockWidths: { left: 9999, right: 1 } }
      }),
      availableWidth: 2600
    });

    expect(result.left.renderedWidth).toBe(840);
    expect(result.right.renderedWidth).toBe(600);
    expect(result.left.compressed).toBe(false);
    expect(result.right.compressed).toBe(false);
  });

  it('reports add eligibility from the next column minimum and center reserve', () => {
    const wide = resolveStoryLayoutGeometry({ panel: storyPanel(), availableWidth: 1800 });
    const tight = resolveStoryLayoutGeometry({ panel: storyPanel(), availableWidth: 1050 });

    expect(wide.left.canAddColumn).toBe(true);
    expect(wide.right.canAddColumn).toBe(true);
    expect(tight.left.canAddColumn).toBe(false);
    expect(tight.right.canAddColumn).toBe(false);
  });

  it('temporarily compresses saved multi-column toolbars without changing their counts', () => {
    const result = resolveStoryLayoutGeometry({
      panel: storyPanel({
        storyLayout: { preferredMeasure: 800, toolbarColumns: { left: 3, right: 2 } }
      }),
      availableWidth: 1180
    });

    expect(result.left).toMatchObject({ columnCount: 3, compressed: true, renderedColumnCount: 1 });
    expect(result.right).toMatchObject({ columnCount: 2, compressed: true, renderedColumnCount: 1 });
    expect(storyLayoutFor(result.panel).toolbarColumns).toEqual({ left: 3, right: 2 });
  });

  it('hides toolbars and makes the Story measure fluid on compact surfaces', () => {
    const result = resolveStoryLayoutGeometry({ panel: storyPanel(), availableWidth: 820 });

    expect(result.compact).toBe(true);
    expect(result.left.visible).toBe(false);
    expect(result.right.visible).toBe(false);
    expect(result.renderedMeasure).toBe(772);
  });

  it('never returns desktop geometry wider than the available surface', () => {
    const result = resolveStoryLayoutGeometry({ panel: storyPanel(), availableWidth: 864 });

    expect(result.compact).toBe(true);
    expect(
      result.left.renderedWidth
      + result.renderedMeasure
      + result.right.renderedWidth
      + 48
    ).toBeLessThanOrEqual(864);
  });

  it('returns finite non-negative geometry for malformed runtime numbers', () => {
    const result = resolveStoryLayoutGeometry({ panel: storyPanel(), availableWidth: Number.NaN });
    const values = [
      result.renderedMeasure,
      result.left.renderedWidth,
      result.right.renderedWidth
    ];

    expect(values.every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
  });
});
