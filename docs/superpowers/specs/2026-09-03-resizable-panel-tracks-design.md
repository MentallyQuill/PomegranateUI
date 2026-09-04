# Resizable Panel Tracks Design

**Date:** 2026-09-03
**Status:** Approved by the active user goal
**Repository:** `MentallyQuill/PomegranateUI`

## Outcome

Every desktop Panel family will expose the sizing controls its geometry implies. Story-stage Panels retain their bounded left and right dock handles. Focus-support and columns Panels gain draggable column separators. Docked Widgets in non-story Panels gain draggable bottom-edge row separators, including a tab group treated as one row. Existing multi-shelf separators gain pointer dragging in addition to keyboard control.

The Theme Canvas surface is not padded with intentional blank content. Its apparent waste comes from a short Widget occupying one independently stretched Settings column. The new controls let users narrow that column, resize the Widget row, or restore authored defaults without adding theme-specific layout branches.

## Public state and commands

- `PanelState.columnWeights` stores an optional normalized split for a flat focus-support or columns Panel.
- `SubPanelState.columnWeights` stores an optional normalized split for that sibling's selected layout.
- `DockedPlacement.height` stores an optional bounded CSS-pixel row height. Every member of a Widget tab group shares the same height.
- `panel.resize-columns`, `sub-panel.resize-columns`, and `widget.resize-row` commands own mutations and publish typed events.
- `widget.resize-row` accepts `null` to restore content-driven height.

Persisted snapshots remain on layout v3 because all fields are optional, old snapshots parse unchanged, and encode/decode remains deterministic.

## Interaction

Column separators are pointer-, touch-, and keyboard-operable vertical WAI-ARIA separators. Arrow keys move the boundary in small increments, Home and End use the bounded extremes, and double-click restores authored preset weights. A separator updates only its adjacent pair while preserving the total normalized track weight.

Widget row separators use the same input paths horizontally. Dragging begins from the rendered row height and clamps to the Widget catalog's minimum and maximum geometry. Arrow keys adjust by eight pixels, Home/End select catalog bounds, and double-click restores content-driven height. Resizing any tab-group member updates the whole group.

Shelf separators preserve their existing normalized contract but add pointer capture, cancellation, and height-relative drag calculations.

## Layout and responsive behavior

Core projection resolves active weights in this order: matching sub-panel weights, matching Panel weights, then authored template/layout defaults. Invalid or mismatched saved weights normalize away. Shared Svelte recipes render one semantic tree for every theme; no concrete theme selector is added.

At responsive collapse breakpoints, column handles disappear and the existing two-column then one-column presentation remains authoritative. Persisted desktop weights are retained and reappear when the viewport grows. Story-stage transcript/composer geometry remains controlled by its existing dock and shelf contracts, so generic Widget row handles are limited to focus-support and columns families.

## Verification

Contract, layout, persistence, store, and view-model tests cover validation, normalization, grouping, reset, events, undo, and round trips. Playwright proves pointer and keyboard operation, Theme Canvas height changes, column changes, persistence after reload, and responsive hiding. The complete `npm.cmd run check` gate must pass before integration and push to `main`.
