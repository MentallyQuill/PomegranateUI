import type { PanelState, StoryLayoutState } from '@pomegranate-ui/contracts';

export const STORY_DEFAULT_MEASURE = 800;
export const STORY_MIN_MEASURE = 420;
export const STORY_MAX_TOOLBAR_COLUMNS = 6;
export const STORY_TOOLBAR_COLUMN_MIN = 200;
export const STORY_TOOLBAR_COLUMN_IDEAL = 286;
export const STORY_TOOLBAR_COLUMN_MAX = 420;
export const STORY_OUTER_GUTTERS = 48;
export const STORY_COMPACT_BREAKPOINT = 860;

export type StoryToolbarEdge = 'left' | 'right';

export interface StoryToolbarGeometry {
  readonly columnCount: number;
  readonly renderedColumnCount: number;
  readonly requestedWidth: number;
  readonly renderedWidth: number;
  readonly visible: boolean;
  readonly compressed: boolean;
  readonly canAddColumn: boolean;
}

export interface StoryLayoutGeometry {
  readonly panel: PanelState;
  readonly compact: boolean;
  readonly preferredMeasure: number;
  readonly renderedMeasure: number;
  readonly left: StoryToolbarGeometry;
  readonly right: StoryToolbarGeometry;
}

export interface StoryLayoutGeometryInput {
  readonly panel: PanelState;
  readonly availableWidth: number;
  readonly leftOpen?: boolean;
  readonly rightOpen?: boolean;
}

const DEFAULT_STORY_LAYOUT: StoryLayoutState = Object.freeze({
  preferredMeasure: STORY_DEFAULT_MEASURE,
  toolbarColumns: Object.freeze({ left: 1, right: 1 })
});

const clamp = (value: number, minimum: number, maximum: number): number => (
  Math.min(maximum, Math.max(minimum, value))
);

const requestedDockWidth = (panel: PanelState, edge: StoryToolbarEdge, columnCount: number): number => {
  const rawWidths = panel.configuration?.dockWidths;
  const widths = rawWidths !== null && typeof rawWidths === 'object' && !Array.isArray(rawWidths)
    ? rawWidths as Readonly<Record<string, unknown>>
    : undefined;
  const requested = widths?.[edge];
  return typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : STORY_TOOLBAR_COLUMN_IDEAL * columnCount;
};

export function storyLayoutFor(panel: PanelState): StoryLayoutState {
  return panel.storyLayout ?? DEFAULT_STORY_LAYOUT;
}

export function resolveStoryLayoutGeometry({
  panel,
  availableWidth: rawAvailableWidth,
  leftOpen = true,
  rightOpen = true
}: StoryLayoutGeometryInput): StoryLayoutGeometry {
  const availableWidth = Number.isFinite(rawAvailableWidth) ? Math.max(0, rawAvailableWidth) : 0;
  const layout = storyLayoutFor(panel);
  const minimumWideWidth = (
    STORY_TOOLBAR_COLUMN_MIN * 2
    + STORY_MIN_MEASURE
    + STORY_OUTER_GUTTERS
  );
  const compact = availableWidth < Math.max(STORY_COMPACT_BREAKPOINT, minimumWideWidth);
  const leftVisible = leftOpen && !compact;
  const rightVisible = rightOpen && !compact;
  const visibleLeftColumns = leftVisible ? layout.toolbarColumns.left : 0;
  const visibleRightColumns = rightVisible ? layout.toolbarColumns.right : 0;
  const fullMinimum = (
    visibleLeftColumns * STORY_TOOLBAR_COLUMN_MIN
    + visibleRightColumns * STORY_TOOLBAR_COLUMN_MIN
    + STORY_MIN_MEASURE
    + STORY_OUTER_GUTTERS
  );
  const compress = !compact && availableWidth < fullMinimum;
  const leftRenderedColumns = leftVisible ? (compress ? 1 : layout.toolbarColumns.left) : 0;
  const rightRenderedColumns = rightVisible ? (compress ? 1 : layout.toolbarColumns.right) : 0;

  const requestedLeft = requestedDockWidth(panel, 'left', layout.toolbarColumns.left);
  const requestedRight = requestedDockWidth(panel, 'right', layout.toolbarColumns.right);
  const leftWidth = leftVisible
    ? clamp(
      requestedLeft,
      leftRenderedColumns * STORY_TOOLBAR_COLUMN_MIN,
      leftRenderedColumns * STORY_TOOLBAR_COLUMN_MAX
    )
    : 0;
  const rightWidth = rightVisible
    ? clamp(
      requestedRight,
      rightRenderedColumns * STORY_TOOLBAR_COLUMN_MIN,
      rightRenderedColumns * STORY_TOOLBAR_COLUMN_MAX
    )
    : 0;
  const centerCapacity = Math.max(0, availableWidth - leftWidth - rightWidth - STORY_OUTER_GUTTERS);
  const renderedMeasure = compact
    ? centerCapacity
    : Math.min(layout.preferredMeasure, Math.max(STORY_MIN_MEASURE, centerCapacity));

  const canAdd = (edge: StoryToolbarEdge): boolean => {
    const own = edge === 'left' ? layout.toolbarColumns.left : layout.toolbarColumns.right;
    const opposite = edge === 'left' ? layout.toolbarColumns.right : layout.toolbarColumns.left;
    if (compact || compress || own >= STORY_MAX_TOOLBAR_COLUMNS) return false;
    const nextMinimum = (
      (own + 1) * STORY_TOOLBAR_COLUMN_MIN
      + opposite * STORY_TOOLBAR_COLUMN_MIN
      + STORY_MIN_MEASURE
      + STORY_OUTER_GUTTERS
    );
    return availableWidth >= nextMinimum;
  };

  return Object.freeze({
    panel,
    compact,
    preferredMeasure: layout.preferredMeasure,
    renderedMeasure,
    left: Object.freeze({
      columnCount: layout.toolbarColumns.left,
      renderedColumnCount: leftRenderedColumns,
      requestedWidth: requestedLeft,
      renderedWidth: leftWidth,
      visible: leftVisible,
      compressed: compress && layout.toolbarColumns.left > 1,
      canAddColumn: canAdd('left')
    }),
    right: Object.freeze({
      columnCount: layout.toolbarColumns.right,
      renderedColumnCount: rightRenderedColumns,
      requestedWidth: requestedRight,
      renderedWidth: rightWidth,
      visible: rightVisible,
      compressed: compress && layout.toolbarColumns.right > 1,
      canAddColumn: canAdd('right')
    })
  });
}
