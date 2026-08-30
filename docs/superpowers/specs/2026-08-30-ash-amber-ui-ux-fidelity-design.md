# Ash & Amber UI/UX Fidelity Design

## Authority and scope

The visual authorities are the reviewed Ash & Amber Workbench captures in
`tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/` and
`design/theme-targets/ash-amber/sonderui-rw2-1-t80.png`. The correction applies
through shared Workbench components and semantic theme roles. It must not add a
concrete theme-id selector, fork a component tree, change a theme schema or
compiler contract, introduce chamfered corners, or merge independently to
`main`.

Ash & Amber retains neutral graphite/ash surfaces, warm muted grey-brown chrome,
restrained amber accents, a quiet atmospheric canvas, zero purple or magenta,
and the approved rounded 4px bevel language. Text controls use the button shape;
only square icon-only controls may consume the pill shape as a circle.

## Measured root causes

- The compact composer textarea exposes 14px of client height for a 16px line
  box because the semantic field border remains part of a fixed 16px box. The
  metadata requires 278px inside a 234px single-line clipped box.
- Compact-chrome shelf actions are visually clipped at 1px until keyboard focus
  changes them to normal-flow 44px controls. The Catalog action becomes 110px
  wide and its positive outline offset crosses the 44px shelf boundary.
- Widget action rails are opacity-hidden but remain in flex layout, taking most
  of a narrow header and wrapping `Scene Effects` and `Custom Theme`.
- The compact Custom Theme surface has 504px of content in a 467px
  `overflow:hidden` owner. Its last status row lands below the viewport and no
  descendant owns vertical scrolling.
- Widget Catalog is a fixed `aside`, not a browser-modal dialog. It leaves the
  live Workbench focusable, has no backdrop, exposes a 24px chopped background
  strip, retains focus on the launcher, and presents a 15,310px list through a
  591px viewport without a visible scroll cue.
- Several operational labels and values use hard-coded 8px faint text even
  though the theme exposes readable technical typography and muted text roles.
- The active Panel tab relies on a very low-opacity selected material without a
  stable structural indicator.

## Shared design

The compact composer remains one mounted Widget. Its textarea will provide a
client box at least as tall as its line box, while metadata wraps without
horizontal clipping at phone width. Composer geometry stays inside the stage
and retains a 44px coarse-pointer send target.

Hover/focus action rails will be absolutely layered over Widget headers so
hidden controls do not reserve width. Heading text remains a single ellipsized
line; metadata remains visible and does not collide with the title. The selected
Panel tab receives a semantic accent edge in addition to the selected material.

Widget Catalog becomes a native modal `dialog` driven by the existing
`CatalogController`. It consumes `dialog.surface`, opens and closes from the
same state, supports Escape, restores launcher focus, isolates keyboard focus in
the top layer, and uses a semantic backdrop with an opaque no-blur reduced-
transparency fallback. Its results remain an independently scrolling list with
stable scrollbar space and a persistent count/scroll cue. The registry recipe
mirrors the Lab recipe.

The compact Custom Theme surface becomes its own named, focusable scroll region.
Its last ambient control must be reachable by keyboard scrolling without moving
the document or crossing its Widget frame. Technical secondary labels and
values use the muted role and a minimum readable size while retaining the dense
recording vocabulary.

## Responsive and verification contract

Automated geometry covers 1920x1280, 1440x900, 390x844, and 844x390. It proves
composer line-box and metadata containment, one-line Widget headings, Custom
Theme scroll reachability, Catalog top-layer/backdrop/focus behavior, list
scroll ownership and cue visibility, selected Panel indication, document
containment, and 44px coarse-pointer targets. Reduced motion and transparency
remain deterministic.

Same-state Windows screenshots cover every affected wide and compact theme and
the Catalog for all four themes. Baselines are regenerated only after the
functional tests pass, then inspected at original resolution. Completion also
requires clean typecheck, build, focused native/browser/conformance tests, the
full repository gate, SHA-256 hashes for reviewed images, and one scoped commit.
