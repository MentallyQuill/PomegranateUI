# Atmospheric Widget Docking and Surface Ownership Design

**Date:** 2026-08-31  
**Status:** Approved for implementation

## Outcome

The shared Workbench will reproduce the Atmospheric interaction language while preserving PomegranateUI's reusable contracts. A held Widget will remain visibly identifiable, every valid destination will disclose its geometry before release, and the committed placement will match the preview. The top-level Panel overflow menu will become a real, unclipped control. Custom Theme will have one authoring implementation used by both its Scene and Settings placements.

## Authority and constraints

- The preserved Atmospheric Workbench is the authority for drag geometry, held-state treatment, drop previews, insertion behavior, hysteresis, cancellation, and motion.
- PomegranateUI remains the authority for store commands, Panel/Widget identity, accessibility, theme expressions, persistence, and reusable recipes.
- Theme switching must keep one mounted Workbench tree. No theme-ID selectors, theme-specific component forks, or Sonder domain imports may be introduced.
- Drag previews are ephemeral interaction state. They must never enter the persisted Workbench schema.

## Current failures

### Docking

The existing drag controller creates a title-only ghost, paints two fixed 18px dashed seams at the bottom of the viewport, and resolves a destination only at pointer release. This makes the visual promise weaker than the actual layout contract and prevents users from understanding tab grouping, shelf insertion, and empty-region placement before they drop.

### Panel overflow menu

The Settings ellipsis already contains Panel commands, but its popup is absolutely positioned inside a tab strip with `overflow: hidden`. The menu opens in the DOM and is entirely clipped. This is a presentation defect, not an absent command model.

### Custom Theme

Scene and Settings already write through the same host authoring controller, but they render separate components with different capabilities. The compact Scene renderer lacks the full diagnostics, reset, save, and validation behavior of Settings. Shared state alone is insufficient when the user-facing implementations can drift.

## Docking interaction contract

### Held Widget

- Drag starts after a four-pixel intent threshold for mouse, pen, and touch pointers.
- The held visual is an inert, accessibility-hidden rendering of the complete Widget card, clamped to a practical preview size while preserving its recognizable material and content.
- The source stays in layout as a full-size placeholder so shelves do not collapse or jump.
- Pointer offset within the source is preserved and the held card is clamped to the viewport.

### Destinations and intent

For every currently visible dock region, the controller derives live targets from actual region, shelf, group, header, and Widget rectangles.

- A group title or tab strip is a hard tab-group target.
- A Widget body is divided vertically into 25% insert-before, 50% tab-group, and 25% insert-after zones.
- Shelf gaps expose before, between, after, and append rails.
- Empty regions expose a full-region placement target.
- Canvas space with no dock target exposes a floating placement preview.
- The active target remains stable inside a ten-pixel hysteresis envelope to prevent flicker at boundaries.

The resolved intent contains the placement kind and every value required to commit it: Panel, sub-panel, lane, region, shelf, neighboring shelf or Widget, and group target as applicable.

### Visual feedback

- All valid rails appear only while a Widget is held. They are contextual, labeled, and low emphasis.
- The active rail or group target receives the focus-color glow.
- Insert and empty-region intents paint a full-size snap ghost matching the committed destination.
- Tab-group intent paints a tab insertion marker and visibly highlights the destination group.
- Floating intent keeps the held card in a float-ready state without showing a false dock promise.
- Motion uses short transform/opacity transitions and is disabled by `prefers-reduced-motion`.

### Commit, cancellation, and failure

- Pointer release commits the last stable preview intent; it does not perform a second unrelated hit test.
- `pointercancel`, Escape, lost capture, or an invalid command restores the exact origin and removes every ephemeral layer/class.
- Shelf insertion normalizes shelf ordering deterministically.
- Existing keyboard placement and Widget action menus remain first-class non-pointer paths.

## Panel and sub-panel menu ownership

- The ellipsis beside a top-level Panel tab is retained. It owns Panel-wide actions: reorder, rename, duplicate, reset, clear, and delete.
- If a Panel has no sub-panels, this menu may create the first sub-panel. Once a sub-panel bar exists, its `+` owns creation and the far-right sub-panel ellipsis owns active sub-panel actions.
- The Panel menu surface uses the browser top layer and fixed anchor geometry, so tab-strip overflow cannot clip it on desktop, compact, zoomed, or coarse-pointer layouts.
- The trigger exposes expanded state and menu semantics; Escape, outside dismissal, and action completion restore focus predictably.

## One Custom Theme implementation

- `ThemeSettings.svelte` becomes the sole renderer and state/validation owner for `settings.custom-theme`.
- Its `presentation` input changes responsive composition only. Both compact and full placements expose semantic colors, material ranges, ambient controls, diagnostics, reset, and save through the same functions and authoring controller.
- `CompactThemeWidget.svelte` is removed.
- Edits made from either placement must be immediately visible from the other without a page reload. Invalid drafts must preserve the last valid applied theme in both placements.

## Semantic hooks

Interaction styling will use shared semantic hooks such as `data-pom-part="widget.drag-preview"`, `widget.drop-rail`, `widget.snap-preview`, and `widget.tab-insertion`. Themes may express these parts through data, but behavior and DOM structure remain shared.

## Verification

The work is complete only when:

1. Pure geometry tests cover body zones, hard tab targets, rail ordering, hysteresis, viewport clamping, and empty-region/floating fallbacks.
2. Browser tests prove held full-card geometry, contextual rails, preview-to-commit fidelity, grouping, before/after/append shelf insertion, touch input, Escape and pointer cancellation.
3. Browser tests prove the Settings Panel menu is visible, actionable, keyboard operable, and unclipped at wide, phone portrait, short landscape, desktop-site mobile, and 200% zoom-equivalent viewports.
4. Browser tests prove bidirectional Custom Theme parity, common diagnostics/reset/save behavior, one implementation, and scroll containment.
5. Visual inspection covers all four themes, normal and reduced motion, normal and reduced transparency, and the Atmospheric authority sizes.
6. `npm.cmd run check` passes, the reviewed branch is integrated to `main`, GitHub CI is green, Pages publishes the exact main SHA, and the live page is inspected.
