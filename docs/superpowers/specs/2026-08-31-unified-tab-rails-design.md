# Unified Panel And Sub-Panel Tab Rails Design

**Date:** 2026-08-31
**Status:** Approved by the active user goal
**Repository:** `MentallyQuill/PomegranateUI`
**Authority:** The user-provided mobile screenshots, the approved unified interaction contract, the existing Panel/sub-panel state model, and the four maintained Workbench themes.

## Outcome

PomegranateUI will replace its competing responsive Panel and sub-panel navigation patterns with one scroll-first tab-rail contract. The same mounted semantic tablists will serve mouse, keyboard, pen, and touch. Normal rails will activate and reveal workspaces, but will never reorder them. Reordering will happen only in an explicit management surface where a dedicated handle has one unambiguous meaning.

The result must scale to user-created inventories of at least eight Panels and eight sub-panels without compressing short names into unreadable fragments, hiding mobile sub-panels behind a selector, or introducing document-level horizontal overflow. It must preserve the existing backend-neutral state, command, persistence, and theme boundaries.

## Unified interaction contract

### Activation and exploration

- Click and tap activate the targeted tab.
- A primary mouse or pen drag that crosses a horizontal threshold pans the entire overflowing rail, even when the gesture starts on a tab. The drag suppresses the subsequent click, text selection, and native element drag.
- Touch uses native horizontal overflow scrolling. A moving touch never becomes a context request.
- Arrow Left/Right navigates the tablist; Home/End reaches its boundaries. Focused or activated tabs are revealed with a rail-local scroll adjustment that does not move the document.
- The normal rail never dispatches `panel.reorder` or `sub-panel.reorder`, including through modified arrow shortcuts.

### Context actions

Right-click, the keyboard context-menu route (`Shift+F10` or the ContextMenu key), and a stationary touch hold request the same action surface for the exact tab. Opening actions for an inactive tab does not activate its workspace. Touch movement, pointer cancellation, scrolling, window blur, or Escape cancels a pending hold without a stray click.

Per-tab ellipsis triggers are removed from normal rails. Tabs expose the keyboard shortcut and an accessible description. A restrained first-use message after creating a custom tab teaches: “Right-click or press and hold a tab for options.”

### Explicit reordering

Panel and sub-panel action surfaces expose `Reorder Panels…` or `Reorder sub-panels…`. That command opens one shared `TabOrderDialog` contract:

- every current tab appears once, in canonical order, with its complete name and active marker;
- a dedicated 44px handle is the only pointer surface that begins drag reordering;
- dragging elsewhere scrolls the management list;
- Move up and Move down buttons provide keyboard and non-drag equivalents;
- reorder commands commit through the existing store, so identity, persistence, undo history, and active selection remain authoritative;
- Done closes and restores focus to the invoking tab; Escape or Cancel closes without changing any in-progress, uncommitted gesture;
- desktop uses a contained dialog presentation and phone/coarse compact presentation uses the same DOM and commands as an opaque bottom sheet.

The current direct rail-drag and modified-arrow reorder paths are retired. This makes “drag the rail” mean pan everywhere and “drag a reorder handle” mean reorder everywhere.

## Shared tab-rail controller

Workbench integration will own one DOM-side controller shared by `PanelTabs.svelte` and `SubPanelBar.svelte`. Framework-neutral packages remain DOM-free.

The pure decision layer will export:

```ts
export type RailPanDecision = 'pending' | 'pan' | 'cancelled';

export function railPanDecision(input: {
  dx: number;
  dy: number;
  threshold?: number;
}): RailPanDecision;

export function tabRailOverflow(input: {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
  tolerance?: number;
}): { before: boolean; after: boolean };

export function revealTabScrollLeft(input: {
  scrollLeft: number;
  clientWidth: number;
  tabLeft: number;
  tabRight: number;
  padding?: number;
}): number;
```

The DOM controller will bind a rail, reflect `data-overflow-before`, `data-overflow-after`, and `data-panning`, implement mouse/pen panning and touch-hold cancellation, expose context requests, reveal tabs, suppress consumed clicks, react to scrolling and resizing, and clean up every timer/listener/capture on cancellation or destruction. It must not capture the pointer until a mouse/pen gesture actually becomes a pan; touch remains native-scroll-owned.

## Rail structure and visual behavior

Both navigators use a stable shell with a scroll owner and pointer-transparent edge cues. The Panel rail sits between fixed brand and global/create controls. The sub-panel bar keeps its Add control fixed outside the scroll owner. The compact selector, listbox popup, and active-sub-panel ellipsis are removed.

Tabs use `flex: 0 0 auto`, readable inline padding, and a bounded maximum only for exceptionally long names. They no longer flex-shrink collectively to fit the viewport. Scrollbars are visually hidden without removing scrollability.

When content exists offscreen, the rail shows a partial neighboring tab plus a subtle semantic edge treatment. `before` is present only away from the start, `after` only before the end, both in the middle, and neither when content fits. Cues use existing shelf/chrome fallback colors, never concrete theme IDs, and `pointer-events: none`. Fine-pointer overflow uses `grab`; active panning uses `grabbing`. Ordinary vertical-wheel scrolling is not intercepted.

## Responsive action surfaces

The same Panel and sub-panel action DOM is anchored beside the target on wide/fine layouts. At compact/coarse phone geometry it becomes a fixed bottom sheet with a scrim, safe-area padding, bounded height, internal scrolling, and an effectively opaque semantic fallback. Underlying Widget text must not show through. Focus containment, Escape, outside dismissal, and restoration remain deterministic.

No responsive presentation may change command names, target identity, or consequences.

## Settings glyph

`WorkbenchDeveloperDrawer` will replace the Unicode gear pseudo-element with a real inline SVG from the existing icon language. The SVG has an explicit view box, fixed visual size, `aria-hidden="true"`, and a separate accessible label. Grid centering must place its geometric center within one CSS pixel of the 44px button center at compact/coarse viewports.

## Accessibility and state invariants

- Preserve one named `Panels` tablist and one active Panel tabpanel relationship.
- Preserve each active Panel's named sub-panel tablist and reciprocal tabpanel relationship.
- Tabs maintain roving `tabindex`, selected state, visible focus, and minimum 44x44 coarse-pointer hit areas.
- Visual tab faces and icons are measured separately from their hit targets.
- Context actions target the requested ID rather than whichever tab is active.
- Creation, renaming, duplication, deletion, reordering, activation, scroll retention, persistence, and undo continue through current commands and IDs.
- Rail scrolling never changes Panel content scroll state or creates document horizontal overflow.
- Reduced motion removes decorative transitions without removing state cues. Reduced transparency and phone action sheets remain opaque and readable.

## Recipe and theme boundary

The Workbench Lab owns the complete executable behavior. Copy-owned `panel-tabs` and `sub-panel-navigation` recipes receive the maintained semantic structure and host callback interfaces needed to adopt the shared contract without importing Lab mock data. Recipe hashes remain deterministic.

All four themes render the same DOM. Theme tokens own materials, borders, typography, selection, radius, shadow, and cue colors. No selector may name `deep-current`, `pom-neutral`, `bunny`, `ash-amber`, or any other concrete preset ID.

## Verification matrix

Tests seed at least eight Panels and eight sub-panels and cover:

- small and large phone portrait;
- 844x390 short landscape;
- tablet and 980x720 coarse desktop-site mode;
- 200%-zoom equivalent geometry;
- wide mouse desktop;
- Deep Current, PomOS, Bunny, and Ash & Amber on the same mounted tree.

Unit tests prove pan thresholds, horizontal dominance, overflow boundaries, reveal math, cancellations, and click suppression. Browser tests prove mouse panning from a tab, native touch scrolling, stationary long press, right-click and keyboard context equivalence, inactive-target actions, explicit handle-only reorder, surrounding management-list scrolling, focus restoration, exact keyboard behavior, fixed Add controls, conditional cues, opaque phone sheets, 44px targets, optical gear centering, deterministic persistence, and zero document overflow.

Reviewed visual baselines cover mobile top and sub-panel rails, a phone action sheet, a populated reorder surface, and desktop overflow in every maintained theme.

## Delivery

Run focused gates and `npm.cmd run check` on Windows. Review the full diff and every changed screenshot, obtain independent review, push a `codex/` branch, merge only after hosted Windows and Ubuntu checks pass, and follow the exact merge SHA through GitHub Pages publication. Live proof must verify the public desktop and mobile geometry, interactions, opaque surfaces, centered gear, assets, clean console, exact SHA, and the retained static Dark Reader lock. Remove the merged remote branch only after that proof; retain history and all unrelated user work.
