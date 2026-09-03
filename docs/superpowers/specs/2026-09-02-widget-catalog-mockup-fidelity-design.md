# Widget Catalog Mockup Fidelity Design

## Status and authority

This design implements the active Widget Catalog fidelity goal. The visual and
interaction authority is the current authoritative Widget Overhaul source/mockup.
At a 1920x1080 viewport, its expanded catalog is a centered 1523x830 surface
with five 286px tracks. The current Workbench catalog is a 1872x1032 surface
with five marketplace-card columns, 52 rendered previews, and 42 unavailable
placeholders.

PomegranateUI remains a backend-neutral toolkit. The reusable catalog state,
geometry, focus, and placement contracts belong to public packages and copy-owned
recipes. The Workbench Lab continues to own the 94 roleplay identities, neutral
sample data, host context, and renderer registrations.

## Required experience

The expanded Visual catalog recreates the authoritative Widget Overhaul composition:

- centered surface occupying 80% of the usable viewport at wide sizes;
- fixed 42px title row with `Widget Catalog`, `Build this Panel`, and an
  accessible icon close action;
- fixed search row with search, the 200-420px preview-size control, and
  Visual/Compact selection;
- fixed primary filters for All, Story, Library, Systems, Settings, Extensions;
- fixed secondary filters for Favorites, Recent, On this Panel, Fits this layout;
- optional removable contextual-filter notice;
- exactly one scrolling results region;
- fixed footer with result count and host context;
- Deep Current materials, type, spacing, geometry, and contrast matched to the
  source render; all other themes consume the same DOM through theme tokens.

Drawer and narrow-screen presentations reuse this tree. They reflow controls
and results and do not introduce a second catalog implementation.

## Preview architecture

Every manifest is registered with the same Lab renderer used after placement.
The Catalog creates a preview-only Widget instance and renders it through that
registry. The preview host:

- sets `surfacePreview: true` and a meaningful ready-state configuration;
- is `inert` and `aria-hidden` so internal controls cannot receive input;
- removes placed-Widget chrome and renders the real Widget content/anatomy;
- never creates persistence, subscriptions, secrets, duplicate IDs, or live
  host mutations;
- uses neutral Lab fixtures rather than current private data;
- has no unavailable fallback for any of the 94 identities.

The result contains only a compact identity line and the real miniature. It
does not contain a marketplace description block or separate Add button. The
result itself is the focusable placement affordance.

## Geometry

Visual preview width is clamped to 200-420px and defaults to 286px. The named
detents are Small 200, Medium 286, and Large 420. Available width determines the
track count. Compact mode always uses one full-width names-first row and hides
the preview-size control.

Each visual result uses its manifest shape:

- narrow and medium: one track, 4:5 default frame;
- wide: two tracks, 16:9 frame;
- stage: two tracks, 4:3 frame;
- strip: two tracks, 3:1 frame.

At one track, every shape collapses to one track without horizontal overflow.
A small grid-auto-row plus measured row span preserves natural result heights
without stretching siblings. Changing preview width captures the first visible
result and its offset, restacks, and restores that anchor.

## Catalog state and filtering

The reusable controller owns presentation, Visual/Compact mode, preview width,
query, primary category, and one active utility filter. It accepts an optional
host adapter that evaluates Favorites, Recent, On this Panel, and Fits this
layout without importing DOM, Svelte, or product concepts.

Catalog metadata declares `multiplicity: 'single' | 'multiple'`. The Lab's 94
manifests carry the reviewed value explicitly; the Catalog never infers
singleton behavior from rendered DOM or a title/type convention.

Full close clears query and contextual placement filters while retaining
display preferences. A placement suspension keeps the complete controller
state plus result-scroll anchor until placement commits or cancels.

## Placement

Automatic placement remains available to touch and assistive-technology users.
Pointer drag and keyboard pickup operate on the whole result:

- pointer: press, cross the drag threshold, recede the catalog, illuminate
  compatible regions, move the proxy, and drop;
- keyboard: Space lifts, arrows cycle compatible targets, Enter commits,
  Escape cancels;
- cancellation restores the same presentation, query, filters, preview width,
  result mode, and scroll anchor;
- commit creates one Widget instance through the existing Workbench store and
  uses the selected compatible region;
- singleton/multiplicity status is derived from manifest policy and current
  Panel state, never inferred from preview DOM.

## Responsive and accessibility contract

The dialog remains modal, contains focus, closes with Escape, and restores focus
to its launcher. The results region is the only scroll owner. Controls retain
44px targets for coarse pointer. At compact widths the catalog is a full sheet,
the header rows wrap without clipping, Compact results are full width, and
actual descendants remain inside the viewport at short landscape and 200%
zoom-equivalent sizes. Reduced transparency removes backdrop blur and supplies
an opaque semantic surface. Reduced motion removes lift/recede animation.

## Verification

Tests must prove behavior rather than source text:

- core tests for retained preferences, utility adapters, search/category
  composition, suspension/restoration, and immutable snapshots;
- renderer tests proving 94 manifests, 94 fixtures, and 94 registered renderers;
- geometry tests for clamp/detents, columns, shape spans, measured row spans,
  and scroll-anchor restoration;
- Svelte/browser tests proving no unavailable previews or Add buttons, inert
  shared renderers, whole-result automatic/pointer/keyboard placement,
  cancellation restoration, modal focus, and one-scroll containment;
- screenshot comparison of Deep Current at the source authority viewport plus
  wide, drawer, compact, short-landscape, and 200%-zoom states;
- cross-theme DOM identity and containment checks for Deep Current, PomOS,
  Bunny, and Ash and Amber;
- final `npm.cmd run check` on Windows after an explicit
  `PORTS_4173_4174_FREE` ownership receipt.
