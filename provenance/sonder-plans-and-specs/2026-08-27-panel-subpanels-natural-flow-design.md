# Panel Sub-panels and Natural-flow Layout Design

## Status

Approved in chat for the editable Widget Overhaul mockup. This recorded design
awaits written-spec review before implementation. It changes no runtime route,
Settings persistence owner, or Design Bible authority.

## Goal

Let a Panel organize Widgets into one optional row of named sub-panels. Each
sub-panel owns its own natural-flow column layout, Widget membership, order,
and scroll position. Settings uses this mechanism to expose its canonical
groups without forcing unrelated settings into one equal-height grid.

The Panel surface is the vertical scroll owner. Widget containers expand to
their complete natural height instead of acquiring an internal scrollbar to
fit an equal-height slot.

## Hierarchy

The interface has exactly three organizational levels:

1. **Panel** — a major workspace such as Scene, Library, or Settings.
2. **Sub-panel** — an optional category or task within one Panel.
3. **Widget or Widget group** — the tools and local organization within one
   sub-panel.

Sub-panels cannot contain sub-panels. If a user needs another level, they add a
sibling sub-panel, organize Widgets into groups, or create another top-level
Panel. The mockup must not render, persist, import, or create sub-sub-panels.

## Conditional sub-panel strip

The primary top shelf remains 40 px high. A Panel with sub-panels adds one
quiet 32 px strip immediately beneath it. Panels without sub-panels retain the
original 40 px shell and do not reserve empty space.

The strip contains, in order:

1. the ordered sub-panel tabs;
2. the active sub-panel action menu; and
3. a trailing **Add sub-panel** `+` action.

The strip never wraps into a third line. Desktop keeps a horizontal tab rail;
tablet may scroll that rail and must reveal the active tab; phone replaces the
rail with one compact sub-panel selector plus the same Add action. Overflow is
a sibling-tab presentation problem, not another hierarchy level.

Tabs follow the ARIA tab pattern. Arrow keys move between tabs, Home and End
reach the boundaries, and activation restores the selected sub-panel's scroll
position. Right-click, Shift+F10, and the Menu key open the same action menu as
the visible sub-panel menu button.

## Creating sub-panels

The active top-level Panel action menu is the canonical first entry point and
contains **Add sub-panel**. Right-clicking the Panel tab opens that same menu;
right-click is never the only access path.

Creating the first sub-panel on a flat Panel performs one lossless conversion:

1. the Panel's current Widget layout becomes a sub-panel named **Overview**;
2. a second sub-panel is created from the user's creation choices;
3. the 32 px strip appears;
4. the new sub-panel becomes active; and
5. focus moves into its selected name or empty canvas.

Existing Widgets, groups, drafts, placement order, and layout are preserved in
Overview. Nothing is copied, deleted, or silently redistributed.

Once the strip exists, its trailing `+` is the primary creation action. The
creation popover contains:

- **Name**;
- **Starting content:** Blank or Duplicate current; and
- **Layout:** one of the natural-flow templates defined below.

Blank is the default. Duplicating creates new Widget placements but preserves
the underlying single-owner behavior of Widgets that project one shared draft
or service owner.

## Managing sub-panels

The active sub-panel menu and each tab's context menu expose the same bounded
operations:

- Rename;
- Duplicate;
- Change layout;
- Move left;
- Move right;
- Move Widgets to another sub-panel; and
- Delete.

Pointer drag may reorder tabs, but every reorder remains available through the
menu and keyboard. Destructive operations name the affected sub-panel and its
Widget count. Cancellation restores exact focus and leaves persistence
unchanged.

If deletion would leave one sub-panel, the interface offers to remove
sub-panel navigation and promote that remaining layout back to the Panel root.
The Widgets and layout survive unchanged. Shipped Settings groups cannot be
accidentally flattened through ordinary deletion; users may reorder or hide
them and may restore the shipped Settings organization.

## Natural-flow layout templates

Each sub-panel independently selects one of five initial templates:

1. **Single column** — `1fr`;
2. **Two equal columns** — `1fr 1fr`;
3. **Three equal columns** — `1fr 1fr 1fr`;
4. **Wide left** — `2fr 1fr`; or
5. **Wide right** — `1fr 2fr`.

These templates define lane count and width only. They never define row height
or Widget height. Stage, dashboard, fixed-grid, and dominant-above-columns
templates are outside this first sub-panel contract.

Each lane is an independent ordered vertical stack. Uneven lower edges are
intentional. Widgets do not stretch to match a neighbor and do not rebalance
automatically when another Widget changes height.

The creation popover shows small structural previews. The active sub-panel menu
offers **Change layout** with the same previews. Changing layout preserves
Widget identity and uses deterministic placement rules:

- adding lanes leaves existing lanes unchanged and creates empty lanes;
- removing lanes appends Widgets from removed lanes to the last surviving lane
  in their existing order; and
- Cancel restores the exact former template and placement.

After Apply, the same Widget remains the visual/focus anchor where possible.
Users may drag or use Widget placement commands to distribute Widgets among
the resulting lanes.

## Widget height and scroll ownership

Within a natural-flow sub-panel:

- the sub-panel surface is the sole vertical page-scroll owner;
- slots, Widget groups, modules, and module bodies use natural height;
- Widget min/ideal/max height metadata may guide initial dock or preview
  geometry but cannot clamp an expanded sub-panel Widget;
- lists, review states, validation, warnings, and recovery actions expand with
  their Widget; and
- opening or closing content may reflow following Widgets without changing
  their lane or order.

Intrinsic authoring controls such as a prompt textarea or code editor may keep
their own editor scrollbar. That scrollbar belongs to the bounded input
control, not to the Widget container. No Widget body may use a scrollbar merely
to satisfy Panel geometry.

## Settings defaults

The shipped Settings Panel declares six sub-panels from the current interface
branch information architecture:

| Sub-panel | Default layout | Initial owners |
|---|---|---|
| Account and Access | Two equal columns | Provider credentials and access-related owners |
| AI and Models | Two equal columns | Model assignments and model-routing owners |
| Appearance and Accessibility | Three equal columns | Theme, reading/layout, sound/motion, and accessibility owners |
| Story Defaults and Content | Two equal columns | Content, narrator voice, and Story-default owners |
| Data, Extensions, and Maintenance | Wide left | Add-ons, updates, storage, repair, and diagnostics owners |
| Advanced | Single column | Prompt and guarded raw-data owners |

These labels, ordering, and ownership groupings are shared with the interface
branch Settings navigation rather than copied into a conflicting taxonomy.
Each shipped layout can be changed by the user and restored to its shipped
default.

## Responsive projection

A chosen template is the maximum desktop structure. Responsive collapse never
rewrites persisted placement:

- three lanes may project as two and then one;
- equal or asymmetric two-lane layouts project as one when either lane would
  become unusably narrow; and
- returning to a wider viewport restores the chosen template and assignments.

The visible responsive order is deterministic and keyboard reading order stays
consistent with the persisted lane and Widget order. No responsive state adds
a nested Widget scrollbar.

## State and persistence

Panel state gains optional sub-panel state. A flat Panel remains compatible
with the existing schema and rendering path. Each sub-panel persists:

- stable identity;
- name;
- layout template;
- Widget membership;
- Widget lane and order;
- hidden/shipped status where applicable; and
- last scroll position.

Each Panel persists its active sub-panel identity. Panel duplication duplicates
its sub-panel structure and Widget placements. Panel deletion removes the
owned sub-panel layout records with the Panel. Unknown or invalid layout ids
fall back to a single-column projection without discarding Widget placements.

Legacy flat Panels load unchanged. The first explicit Add sub-panel operation
performs the Overview conversion; there is no eager migration of every Panel.

## Mockup scope and ownership

This work changes the editable Widget Overhaul mockup and its regression
harness. It demonstrates composition, state, persistence, keyboard behavior,
responsive geometry, natural-height Widgets, and Settings defaults. It does
not replace runtime Settings routes, server-confirmed save boundaries, Design
Bible authority, or the frozen Atmospheric Workbench artifact.

## Verification

Focused regressions must prove:

- flat Panels retain the 40 px shelf and existing behavior;
- the first Add sub-panel conversion is lossless;
- only one 32 px local strip can exist;
- sub-sub-panel creation and persisted nested input are rejected;
- visible and context-menu creation paths share one operation;
- rename, duplicate, reorder, move, delete, flatten, Cancel, and focus recovery
  preserve exact state;
- each sub-panel remembers active identity, layout, placement, and scroll;
- all five layouts use natural-height lanes with no Widget-body scrollbar;
- layout changes follow the deterministic lane rules;
- the six shipped Settings groups and default layouts match this specification;
- tablet and phone projections never wrap the strip or rewrite placement;
- keyboard tab behavior and 44 px coarse-pointer targets remain usable; and
- Panel persistence excludes Story identity and Widget-owned draft/service
  state exactly as before.

Browser review compares the updated mockup against the current Widget Overhaul
and the matching Design Bible states at desktop, tablet, phone, short-height,
and 200-percent zoom-equivalent viewports. Behavioral tests and screenshots are
both required because neither proves the other.
