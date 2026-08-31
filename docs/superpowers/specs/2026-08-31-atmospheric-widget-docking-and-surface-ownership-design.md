# Atmospheric Widget Docking and Surface Ownership Design

**Date:** 2026-08-31  
**Status:** Approved for implementation

## Outcome

The shared Workbench will reproduce the Atmospheric interaction language while preserving PomegranateUI's reusable contracts. A held Widget will be the only complete rendering of that Widget, every valid destination will disclose and physically reserve its geometry before release, and the committed placement will animate into the reserved slot. Top-level Panel, Settings sub-panel, and grouped Widget tabs will reorder directly by drag. The top-level Panel overflow menu will be a theme-bound, unclipped control for non-ordering Panel actions. Custom Theme will have one authoring implementation used by both its Scene and Settings placements.

## Authority and constraints

- The preserved Atmospheric Workbench is the authority for drag geometry, held-state treatment, drop previews, insertion behavior, hysteresis, cancellation, and motion.
- PomegranateUI remains the authority for store commands, Panel/Widget identity, accessibility, theme expressions, persistence, and reusable recipes.
- Theme switching must keep one mounted Workbench tree. No theme-ID selectors, theme-specific component forks, or adopter-domain imports may be introduced.
- Drag previews are ephemeral interaction state. They must never enter the persisted Workbench schema.

## Current failures

### Docking

The first docking pass retained a dim but complete source card while also moving a cloned card, and painted fixed overlay rails without changing the dock layout. That read as a frozen duplicate. It also left collapsed docks undiscoverable and allowed grouped-tab horizontal motion to detach the Widget. The correction requires a vacant origin, real in-layout slots, collapsed-edge opening, stable target hysteresis, and explicit horizontal-reorder versus vertical-tear-off arbitration.

### Panel overflow menu

The Settings ellipsis is a Panel action menu, but the first pass retained redundant Move left/right commands and did not opt its popup into the semantic `menu.surface` material contract. Reordering belongs to the tab strip. The menu must use each active theme's fill, border, radius, shadow, saturation, and backdrop blur, with opaque fallbacks for reduced transparency and forced colors.

### Custom Theme

Scene and Settings already write through the same host authoring controller, but they render separate components with different capabilities. The compact Scene renderer lacks the full diagnostics, reset, save, and validation behavior of Settings. Shared state alone is insufficient when the user-facing implementations can drift.

## Docking interaction contract

### Held Widget

- Drag starts after an intent threshold for mouse and pen. Touch starts only from the dedicated title/tab grip after a stationary short hold; motion beyond slop before the hold cancels that candidate permanently, while the rest of an ordinary Widget header retains vertical panning.
- The held visual is an inert, accessibility-hidden rendering of the complete Widget card, clamped to a practical preview size while preserving its recognizable material and content.
- The source footprint stays in layout but its entire card becomes visually vacant. No frozen title, content, or menu remains behind the held card.
- Pointer offset within the source is preserved and the held card is clamped to the viewport.

### Destinations and intent

For every currently visible dock region, the controller derives live targets from actual region, shelf, group, header, and Widget rectangles.

- A group title or tab strip is a hard tab-group target.
- A Widget body is divided vertically into 25% insert-before, 50% tab-group, and 25% insert-after zones.
- Shelf gaps expose before, between, after, and append rails.
- Empty regions expose a full-region placement target.
- A held Widget within 34 pixels of a collapsed left or right edge temporarily opens that dock as a live destination without persisting a collapse-state change.
- Canvas space with no dock target exposes a floating placement preview.
- The active target remains stable inside a ten-pixel hysteresis envelope to prevent flicker at boundaries.

The resolved intent contains the placement kind and every value required to commit it: Panel, sub-panel, lane, region, shelf, neighboring shelf or Widget, and group target as applicable.

### Visual feedback

- All valid rails appear only while a Widget is held. Their hit zones remain narrow, but an active rail creates a full-width 72–112 pixel in-layout slot.
- The active rail or group target receives the focus-color glow.
- Insert and empty-region intents insert a real ephemeral slot that makes neighboring shelves reflow before release; the overlay only reinforces that reserved geometry.
- Tab-group intent paints a tab insertion marker and visibly highlights the destination group.
- Floating intent keeps the held card in a float-ready state without showing a false dock promise.
- A successful release animates the held card into the reserved slot before cleanup. Motion uses short transform/opacity transitions and is disabled by `prefers-reduced-motion`.

### Commit, cancellation, and failure

- Pointer release commits the last stable preview intent; it does not perform a second unrelated hit test.
- Creating a destination shelf and placing its Widget is one validated store command, revision, event, notification, and undo record. A rejected placement cannot leave an empty shelf or changed weights behind.
- `pointercancel`, Escape, window blur, or an invalid command restores the exact origin and removes every ephemeral slot, layer, class, and temporary dock reveal.
- Unmounting a pending or active drag destroys its controller state and global listeners; an already accepted release retains only its short completion animation before the same cleanup.
- Shelf insertion normalizes shelf ordering deterministically.
- Existing keyboard placement and Widget action menus remain first-class non-pointer paths.

## Tab reordering and menu ownership

- Top-level Panel tabs and Settings sub-panel tabs reorder by horizontal mouse, pen, or held-touch drag. Standard arrows navigate tabs; Ctrl+Shift+Arrow reorders them. Home and End retain tab-navigation semantics.
- Grouped Widget tabs use the same horizontal reorder preview and store command. Horizontal motion cannot detach a Widget. Deliberate vertical motion leaves the tab corridor and begins the existing Widget docking drag.
- The ellipsis beside a top-level Panel tab is retained. It owns Panel-wide actions: rename, duplicate, reset, clear, and delete. It never duplicates tab-reorder controls.
- If a Panel has no sub-panels, this menu may create the first sub-panel. Once a sub-panel bar exists, its `+` owns creation and the far-right sub-panel ellipsis owns active sub-panel actions.
- The Panel menu surface uses the browser top layer and fixed anchor geometry, so tab-strip overflow cannot clip it on desktop, compact, zoomed, or coarse-pointer layouts.
- Because the Panel surface mixes a rename field with ordinary buttons, the trigger exposes `aria-haspopup="dialog"` and the popover uses normal Tab semantics rather than an invalid ARIA menu pattern. Opening focuses the name field; Escape and action completion restore the trigger, while outside dismissal preserves the external control the user chose.

## One Custom Theme implementation

- `ThemeSettings.svelte` becomes the sole renderer and state/validation owner for `settings.custom-theme`.
- Its `presentation` input changes responsive composition only. Both compact and full placements expose semantic colors, material ranges, ambient controls, diagnostics, reset, and save through the same functions and authoring controller.
- `CompactThemeWidget.svelte` is removed.
- Edits made from either placement must be immediately visible from the other without a page reload. Invalid drafts must preserve the last valid applied theme in both placements.

## Semantic hooks

Interaction styling will use shared semantic hooks such as `data-pom-part="tab.drag-preview"`, `tab.insertion`, `widget.drag-preview`, `widget.drop-rail`, `widget.dock-slot`, `widget.snap-preview`, and `widget.tab-insertion`. Themes may express these parts through data, but behavior and DOM structure remain shared.

## Verification

The work is complete only when:

1. Pure geometry tests cover tab insertion, true touch-hold cancellation, touch/tear-off arbitration, body zones, hard tab targets, narrow-hit/full-slot rail geometry, collapsed-edge discovery, hysteresis, viewport clamping, and empty-region/floating fallbacks.
2. Browser tests prove mouse, pen, touch, and keyboard tab reorder; pre-hold touch cancellation; real mobile panning outside the dedicated grip; deliberate post-hold docking and grouped-tab tear-off; vacant origin; neighboring reflow; collapsed-dock reveal; preview-to-commit fidelity; grouping; atomic shelf insertion/undo; Escape, blur, unmount, and pointer cancellation.
3. Browser tests prove the Settings Panel menu is visible, actionable, keyboard operable, and unclipped at wide, phone portrait, short landscape, desktop-site mobile, and 200% zoom-equivalent viewports.
4. Browser tests prove bidirectional Custom Theme parity, common diagnostics/reset/save behavior, one implementation, and scroll containment.
5. Visual inspection covers all four themes, normal and reduced motion, normal and reduced transparency, and the Atmospheric authority sizes.
6. `npm.cmd run check` passes, the reviewed branch is integrated to `main`, GitHub CI is green, Pages publishes the exact main SHA, and the live page is inspected.
