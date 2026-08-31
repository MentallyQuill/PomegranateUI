# PomegranateUI One-Level Sub-Panels Design

**Date:** 2026-08-31  
**Status:** Approved by the active user goal  
**Repository:** `MentallyQuill/PomegranateUI`  
**Authority:** The preserved Widget Overhaul sub-panel model and regression harness define behavior; Atmospheric and the four reviewed theme targets define presentation.

## Outcome

PomegranateUI will expose one reusable, backend-neutral sub-panel system beneath a top-level Panel. Settings will no longer flatten unrelated Widgets into one three-column workspace. It will ship the six authoritative sibling workspaces while Deep Current, PomOS, Bunny, and Ash & Amber render the same semantic tree through their existing data-only theme definitions.

Sub-panels are not recursive Panels. They are an explicitly bounded, one-level child workspace owned by a Panel. Each sub-panel owns its Widget membership, lane and order placement, chosen layout, and retained scroll position. A flat Panel remains valid and reserves no sub-panel chrome.

## Public contracts

Add a branded `SubPanelId`, the five `SubPanelLayoutId` values, and a `SubPanelState` record:

```ts
type SubPanelLayoutId = 'single' | 'two-equal' | 'three-equal' | 'wide-left' | 'wide-right';

interface SubPanelState {
  readonly id: SubPanelId;
  readonly name: string;
  readonly layoutId: SubPanelLayoutId;
  readonly order: number;
  readonly scrollTop: number;
  readonly shipped?: boolean;
  readonly hidden?: boolean;
}
```

`PanelState` gains optional `activeSubPanelId` and `subPanels`. These fields must appear together, IDs must be unique, ordering must normalize deterministically, and the active identity must name a visible sibling. `SubPanelState` cannot contain a Panel or another sub-panel, so nesting beyond one level is structurally impossible.

Docked and floating Widget placements gain optional `subPanelId` and `lane`. A placement either belongs to the flat Panel or exactly one sibling. Lane is clamped to the selected layout's lane count. Existing Panel, region, shelf, grouping, floating, and shelved semantics remain intact inside that owner.

Commands and events cover activation, creation, renaming, duplication, reordering, layout changes, scroll retention, moving Widgets, and deletion. Commands that create duplicate Widgets receive explicit new Widget identities, matching existing Panel duplication and keeping layout functions deterministic.

## Layout ownership and transitions

`@pomegranate-ui/layout` owns every state transition and normalization rule:

- Activating a sibling captures the outgoing scroll position and restores the incoming value.
- Creating the first sibling converts a flat Panel losslessly into `Overview`, preserving every Widget instance, group, shelf relationship, and deterministic lane/order projection, then creates and activates the requested sibling.
- Duplicating a sibling copies its layout and Widget configurations under caller-supplied instance/group identities.
- Shrinking a layout appends Widgets from removed lanes to the last surviving lane in stable lane/order order. Growing does not rebalance existing Widgets.
- Moving all Widgets to another sibling projects them into the destination layout and appends after existing destination Widgets without identity loss.
- Deleting a sibling deletes its owned Widget instances. When one sibling remains, that sibling flattens into the Panel deterministically and the sub-panel chrome disappears.
- Invalid persisted IDs, layouts, lanes, orders, scroll positions, active identities, or nested data normalize without losing valid Widget instances.

The layout registry publishes the five lane weight definitions. The active sub-panel layout derives the visible Columns regions without mutating persisted layout merely because the viewport narrows. Responsive presentation reduces three lanes to two and then one in CSS while preserving canonical lane ownership.

## Shipped Settings migration

Settings ships these sub-panels and layouts:

| Sub-panel | Layout | Default Widgets |
|---|---|---|
| Account and Access | `two-equal` | Provider Credentials; AI Connections |
| AI and Models | `two-equal` | Model Assignments; Default Model; Memory Search Model |
| Appearance and Accessibility | `three-equal` | Theme Library; Custom Theme; Reading Layout; Sound and Motion; Accessibility |
| Story Defaults and Content | `two-equal` | Content Preferences; Narrator Voice; Living World Controls |
| Data, Extensions, and Maintenance | `wide-left` | Add-ons; Maintenance |
| Advanced | `single` | Prompt Editor; Raw Story Data |

Versioned hydration upgrades the existing flat shipped Settings Panel once. Known Widget types replace the matching shipped seed while retaining their instance identity and configuration. Extension Settings Widgets route to Data, Extensions, and Maintenance; unmatched settings Widgets route to Advanced. A migrated Settings Panel never falls back to the obsolete flat grid on subsequent loads.

## Core projections

`@pomegranate-ui/core` projects sub-panel tabs and only the active sub-panel's visible Widgets. Every catalog placement, dock action, drag target, group merge, shelve/restore, focus action, remove operation, and undo snapshot uses the active sub-panel owner when one exists. The Widget Shelf is scoped to the active sibling and restores the exact saved owner, region, shelf, group, lane, and order.

The top-level Panel APIs remain source-compatible for adopters that never use sub-panels.

## Shared Svelte presentation

One `SubPanelBar.svelte` recipe renders beneath `PanelTabs` only when the active Panel owns siblings. Wide layouts expose a `tablist` with sibling tabs, a trailing Add action, and one actions control for the active sibling. Phone widths expose one compact selector that opens the same sibling list and actions without changing the state model.

The bar provides pointer, keyboard, touch, and context-menu routes. Arrow keys move focus, Home/End reach boundaries, Enter/Space activate, modified Arrow keys reorder, Shift+F10 opens actions, and Escape closes the selector/menu/dialog. All controls meet the 44px coarse-pointer target requirement even when Deep Current visually preserves the reference's quiet 32px strip.

Dialogs cover create, rename, layout, move Widgets, and delete consequences. Panel menus expose Add sub-panel. Widget Catalog placement and drag targets identify the active sibling and lane.

## Theme and responsive contract

All themes receive the same `data-pom-part` structure. No selector may contain a concrete theme ID. Existing theme tokens control surfaces, separators, selection, typography, radius, and shadows.

- Deep Current follows Atmospheric restraint and the Widget Overhaul 32px bar geometry.
- PomOS uses its continuous rounded-window and blue adaptive-glass language.
- Bunny uses its soft stationery geometry and rounded controls.
- Ash & Amber uses graphite glass, ash-brown chrome, and restrained amber selection.

Required viewports include wide desktop, 390x844 mobile, 980x720 touch desktop-site, 844x390 short landscape, 200% zoom, reduced motion, and high contrast. The active Panel surface is the sole vertical scroll owner. On phones the selector remains visible while the active content scrolls.

## Verification and release

Every behavior starts as a failing real-state unit or Playwright test. Native conformance must assert the same behavior named by the preserved reference instead of mapping sub-panel persistence to unrelated Panel-width checks. Reviewed screenshots cover Settings in all four themes at wide and compact sizes, plus selector-open and dialog states. The full `npm.cmd run check` gate, Windows and Ubuntu CI, reviewed PR, merge, Pages deployment, and live Playwright proof are required before completion.

