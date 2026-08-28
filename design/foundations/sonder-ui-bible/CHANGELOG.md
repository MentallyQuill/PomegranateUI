# Changelog

## 2.0.2 -- 2026-08-27

Calibration `UI-CAL-2026-08-27-02`, approved by the product owner, replaces
edge-only Widget docking with stable intent bands. Outside the title/tab strip,
the top quarter creates a shelf above, the middle half joins the target as a
tab, and the bottom quarter creates a shelf below. The title/tab strip and
explicit insertion rails remain hard targets, and a 10 px stability margin
prevents tab/shelf intent from flickering at band boundaries.

- Affected decisions and files: Experience Principles, Component Contracts,
  Scene Workspace, Motion and Feedback, the canonical fragment, regression
  harness, and recorded artifact hashes. The workbench's shelf/tab ownership
  model does not change.
- Current and proposed outcome: the former 18 px boundary target required
  precise edge dragging and placed the final rail inside footer controls; the
  new broad intent regions activate the same exact insertion seams. The first
  rail clears the title strip, and append previews compress into constrained
  space instead of falling back over existing Widget content or footer controls.
- User benefit: shelf creation is deliberate without requiring pixel-precise
  dragging, while the large center region and title strip retain predictable
  tab behavior.
- Artifact and responsive impact: desktop, tablet, short-height, and tall
  toolbars use the same proportional bands; staged compact/mobile toolbars keep
  their existing composition and non-drag placement routes.
- Accessibility and localization: keyboard/menu placement, accessible target
  names, and language-neutral result labels are unchanged.
- Runtime and migration: mockup-only calibration; no production owner, data,
  route, persistence, or migration contract changes.
- Evidence: the focused browser harness passed 95/95 after failing first on
  quarter-band ownership, stability, and Characters-footer collision. Matching
  renders were reviewed at desktop, tablet, narrow portrait, landscape,
  short-height, and tall-height viewports. Status: approved and applied.

## 2.0.1 -- 2026-08-27

Calibration `UI-CAL-2026-08-27-01`, approved by the product owner, restores the
canonical Atmospheric Workbench's quiet typographic controls: borderless `−`
and `+` for Characters portrait scale, `⋮` for Widget and Panel action menus,
and `+` for Create Panel. This replaces the framed plus/minus and ringed menu
marks from the collection SVG pack without changing the pack elsewhere.

- Affected decisions and files: Iconography, Integrated Control Clusters,
  Component Contracts, Scene Workspace, the canonical fragment, regression
  harness, and recorded artifact hashes. The normative chapters already
  specified borderless portrait controls, so their outcomes do not change.
- User benefit: the frequently repeated controls return to the quieter,
  lighter visual rhythm of the approved mockup direction.
- Artifact and responsive impact: the fragment and harness receive new hashes;
  desktop, short-height, compact, and mobile retain their existing control
  dimensions, order, and responsive staging.
- Accessibility and localization: existing accessible names and hit regions
  are retained; the conventional glyphs are language-neutral.
- Runtime and migration: mockup-only calibration; no production owner, data,
  route, persistence, or migration contract changes.
- Evidence: the focused browser harness passed 86/86, with same-state visual
  review at 1600×900 and 390×844 confirming the restored glyphs and unchanged
  geometry. Status: approved and applied.

## 2.0 -- 2026-08-25

Replaces the prior rail-and-inspector direction with the approved Atmospheric
Digital Workbench.

- renames the primary story workspace from Play to Scene;
- moves Scene, Library, and Settings into one integrated top shelf and removes
  decorative destination indices;
- establishes two collapsible, resizable modular toolbars with shelves, tabs,
  floating modules, a Widget Shelf, and clear drag previews;
- makes shelf capacity respond to usable height, from two to four shelves;
- adopts Geist Sans, Geist Mono, and Newsreader at the mockup's compact scale;
- makes full atmospheric canvases the default and adds preset/configurable
  gradients;
- adopts translucent adjustable glass with 20% Glass Density, 60% Bar Opacity,
  6% Selected Strength, and 50% Frost Level defaults;
- standardizes 4 px rounded bevels and rejects chamfers;
- removes CRT grain, animated noise, and decorative numeric indices from
  workspace/module tabs and window titles while retaining canonical Story and
  scene instrument metadata; retires fixed curated-theme doctrine, the left
  navigation rail, default right inspector, and mobile bottom navigation;
- promotes the committed mockup and interaction harness to canonical visual
  evidence.

## 1.2 -- 2026-08-24

Historical release. Formalized the compact type scale and 3-5 px geometry.
Superseded by 2.0 where its composition, theme, navigation, or component rules
differ.

## 1.1 -- 2026-08-23

Historical release. Added focused person-authoring guidance.

## 1.0 -- 2026-08-20

Historical initial consolidated Design Bible.
