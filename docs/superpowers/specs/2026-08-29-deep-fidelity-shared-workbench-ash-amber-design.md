# Deep Fidelity, Shared Workbench Capabilities, and Ash & Amber Design

**Status:** Approved for implementation

**Approved:** 2026-08-29

**Date:** 2026-08-29

**Repository:** PomegranateUI

**Depends on:**

- `2026-08-27-pomegranateui-svelte-view-layer-design.md`
- `2026-08-28-pom-mockup-conformance-design.md`
- `2026-08-28-pom-theme-foundation-design.md`
- `2026-08-28-pom-theme-art-direction-design.md`

This decision supersedes the earlier tranche non-goals that limited the Lab to
three targets and excluded a visual theme editor. It does not weaken their
toolkit, preservation, shared-tree, or accessibility constraints.

## Upstream coordination and integration order

The concurrent `Align Svelte rebuild goals` task owns the
`codex/theme-recipes-pomos-overhaul` work until it completes its gate and merges
to `main`. Its accepted upstream surface is the exact versioned
`pomegranate.ui.theme.v2` schema and migration, `resolveThemeV2`, host-owned
`ThemeAssetRegistry`, `applyThemePolicy`, deterministic binding and fixed-part
stylesheet compilers, layered root-only canvas compiler, the complete
`data-pom-part` vocabulary, data-only target definitions, and their visual and
browser evidence.

This program does not cherry-pick that branch or edit its worktree. Plan 1
starts only after the upstream task reports its final merged `main` SHA. The
approved separation into `ThemeDefinition`, `CanvasDefinition`, and
`AmbientProfile` is added through a new versioned target envelope and migration;
the accepted V2 input schema remains byte-for-byte compatible. The rest of this
program owns Panel/layout/persistence, Ash & Amber, Theme Settings and ambient
follow-on work, and Deep exact fidelity. The upstream task has explicitly
excluded new Panel templates, regions, shelves, docking, undo, and persistence
contracts.

## Decision

PomegranateUI will make the Panel, layout-template, shelf, docking, floating,
grouping, theme-authoring, ambient, persistence, keyboard, touch, and
accessibility behaviors demonstrated by the preserved Sonder references into
shared toolkit capabilities. All visual targets use those capabilities through
one mounted Panel and Widget tree. No behavior is exclusive to a theme.

Deep Current remains the exact fidelity target for the two `SonderUI_RW2`
recordings and the preserved Atmospheric Workbench. Deep therefore owns the
acceptance threshold for shell composition, proportions, title bars, story
staging, glass, lighting, typography, density, restraint, and interaction feel.
PomOS, Bunny, and Ash & Amber use the same structural and behavioral system but
express their own semantic materials.

Ash & Amber becomes the fourth Lab-owned target with stable ID `ash-amber` and
label `Ash & Amber`. It is a complete target, not a temporary custom-draft
fixture and not a renamed Deep Current state.

## Why the current implementation is insufficient

The current Lab has real top-level Panel identity, per-Panel Widget placement,
left/main/right docking, floating placement, Widget tab groups, dock resizing,
layout persistence, focus presentation, and Catalog placement. It does not yet
implement the complete reference system:

- every Panel template renders through the same left/main/right surface;
- the Create Panel dialog always creates a two-column `columns.v1` state;
- there is no template registry or selectable Story Stage, Focus + Support, or
  two-through-six-column layout;
- there is no first-class shelf state, horizontal shelf proportion, shelved or
  hidden Widget placement, or Removed Widget inventory;
- removing a Widget destroys the instance rather than preserving it for
  restoration;
- Panel rename, duplicate, reset, clear, delete, and layout undo are absent;
- Theme Settings can select presets and tune four materials but cannot author
  the six semantic colors or ambient profile shown in the recording; and
- Deep still renders inside the generic Lab composition, including the extra
  developer rail, framed shell, card-heavy Widgets, and boxed transcript.

The correction is a shared capability expansion followed by an exact Deep
presentation pass. A fourth palette alone would preserve the underlying gap.

## Authority model

### Deep presentation and interaction authority

The authority order is:

1. the preserved Atmospheric Workbench owns macro composition, material,
   lighting, typography, spacing, responsive transformation, dock seams, and
   interaction restraint;
2. the preserved Widget Overhaul owns later Widget, Panel, Catalog, state, and
   feature behavior;
3. the two reviewed `SonderUI_RW2` recordings add explicit visual and workflow
   evidence, including Widget Shelf management, live theme authoring, and the
   Ash & Amber target state; and
4. PomegranateUI packages own reusable schemas, layout transitions, commands,
   persistence, accessibility, Svelte integration, and adopter-facing APIs.

Preserved prototype bytes remain immutable and executable. Production code may
observe their contracts through independent drivers; it may not import their
runtime JavaScript, HTML, CSS, or Sonder server code.

### Toolkit boundary

PomegranateUI remains an AI-roleplay frontend toolkit, not a turnkey Sonder
frontend. The toolkit owns reusable Panel, region, shelf, Widget placement,
theme, ambient, command, persistence, and test-driver contracts. Adopters own
branding, information architecture, product markup, backend state,
authentication, and domain semantics.

The Workbench Lab is a demanding inspectable consumer. Its Deep presentation
may match the Atmospheric reference exactly without making that composition a
mandatory adopter application shell.

## Ash & Amber authority lock

### Source evidence

The locked target is the final edited Theme state around timestamp `00:01:20`
in `SonderUI_RW2_1.mp4`:

- source video dimensions: `1920x1280` at `60 fps`;
- source video duration: `101.682` seconds;
- source video SHA-256:
  `56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889`;
- canonical extracted frame timestamp: `80.000` seconds; and
- canonical extracted PNG SHA-256:
  `6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997`.

The implementation tranche imports the canonical PNG into a reviewed,
repository-owned visual-reference directory and records the extraction command,
timestamp, dimensions, source hash, and frame hash in a deterministic manifest.
It does not commit the full recording.

### Corrected semantic seed

The recording remains the composition and material-restraint authority. A
later explicit user correction supersedes its earlier high-chroma palette
interpretation and establishes this six-role seed:

| Recorded role | Value | Pom projection |
|---|---:|---|
| Canvas Ink | `#242321` | neutral graphite canvas and darkest inset surfaces |
| Glass Panel | `#302E2A` | ash panel, Widget fallback, and field material base |
| Control Chrome | `#625B52` | warm muted grey-brown title bars, top shelf, tabs, and control chrome |
| Ambient Field | `#51493E` | quiet warm-neutral atmospheric energy through the target's `selection` role |
| Interface Text | `#F3F0EA` | primary text, with derived muted/faint roles |
| Source Accent | `#D2B57A` | source, warning, provenance, and warm amber detail |

The complete target palette retains `#C18A3D` as its restrained amber
`accent`; the six-role authoring surface edits the ambient profile's declared
`selection` role independently and does not rewrite that accent.

The recorded material controls are:

- Glass Density: `20`
- Bar Opacity: `60`
- Selected Strength: `6`
- Frost Level: `50`

The recorded ambient profile is:

- screen position: `x=57`, `y=97`;
- radius: `60`; and
- power: `56`.

The target intentionally combines neutral graphite/ash surfaces and warm taupe
chrome with small amber source accents. Purple and magenta are excluded from
the target palette and canvas. Visual conformance uses the locked frame for
composition and material restraint while the later correction governs palette
semantics.

### Target contract

Ash & Amber must:

- resolve as one complete `ThemeDefinition`, `CanvasDefinition`, and
  `AmbientProfile` target bundle;
- apply atomically through the same controller as the other targets;
- retain the exact live Panel, Widget, focus, and revision identities when
  selected;
- expose no theme-specific Widget or Panel implementation;
- have wide Scene, compact Scene, and wide Catalog conformance scenarios;
- have a reviewed discrepancy ledger and canonical Windows screenshots; and
- remain reproducible by the shared Custom Theme editor from its corrected seed.

## Shared layout architecture

### Panel versus sub-Panel

A `Panel` remains a top-level workspace tab with independent persisted
presentation. The reference does not demonstrate recursively nested workspace
tabs. What appears visually as a sub-Panel is a named region, shelf stack, or
Widget tab group inside one Panel.

PomegranateUI therefore adds first-class Panel regions and shelves instead of a
recursive `PanelState.parentPanelId` graph. This preserves the visible behavior
without inventing a second navigation hierarchy. The public vocabulary is:

- **Panel:** top-level workspace and persistence boundary;
- **Region:** named template slot such as `stage`, `composer`, `left`, `right`,
  `focus`, `support`, or `column-3`;
- **Shelf:** ordered, proportioned stack within a region;
- **Widget group:** tabbed Widgets sharing one shelf location; and
- **Shelved Widget:** retained instance removed from the visible layout and
  available from the Widget Shelf.

### Panel template registry

The shared layout package gains a backend-neutral template definition and
registry. A template declares stable region IDs, region roles, ordering,
geometry constraints, supported Widget shapes, and configurable options. It
does not carry Svelte components, DOM selectors, CSS, product copy, or backend
semantics.

The first built-in recipe definitions are:

1. `story-stage.v1`: left instruments, center stage, composer, and right
   instruments;
2. `focus-support.v1`: one dominant focus region with ordered support shelves;
   and
3. `columns.v1`: two through six regular columns.

The source-owned Svelte `WorkbenchSurface` recipe projects the active template
through a renderer registry. Unknown templates fail safely to an explicit
unavailable surface; they do not silently masquerade as three columns.

Panel creation presents visual template choices, validates the selected option,
and persists the chosen template configuration. Changing themes never changes
the template or moves Widgets.

### Placement and snapshot migration

The current left/main/right edge placement is generalized to a stable `regionId`
plus `shelfId`, order, and optional tab-group state. Existing edge placements
migrate deterministically:

- `left` -> region `left`;
- `main` -> region `stage` for `story-stage.v1`, `focus` for
  `focus-support.v1`, and the first compatible column for `columns.v1`; and
- `right` -> region `right` or the first support region.

Layout persistence advances through a versioned snapshot migration. Migration
must preserve Widget identity, order, active Panel, dock widths, floating
bounds, group identity, and the last valid theme preference. It never persists
pointer sessions, hover rails, color-picker popovers, or host/domain data.

## Shared shelf and docking capabilities

### Shelf state

Shelf identity and size weight become framework-neutral layout state. A region
may contain one or more ordered shelves separated by accessible resizers.
Resizing clamps against template and Widget minimum geometry, supports pointer
and keyboard input, and persists one normalized weight per shelf.

The Widget Shelf is a presentation over retained placement state. It lists every
Panel Widget and reports `Left`, `Right`, another named region, `Floating`, or
`Hidden`. Selecting a hidden Widget restores it to its exact last valid visible
placement when possible and otherwise uses the template's compatible default.

Removing a Widget from a Panel becomes `shelved`, not destructive. Explicit
deletion remains a separate command for adopters that allow it.

### Docking transaction

One shared placement transaction supports:

- dock to a compatible region or existing shelf;
- create a shelf above or below an existing shelf;
- merge as a tab through the reference `25% / 50% / 25%` body zones;
- separate a tab into its own shelf or floating frame;
- reorder tabs and shelf members;
- float at a clamped stage coordinate;
- return a floating Widget to the Widget Shelf;
- restore the exact origin on invalid release, Escape, or `pointercancel`; and
- raise and subsequently move multiple floating Widgets.

The visible drop rails, snap ghost, insertion caret, and removal zone are
transient view state. They never enter the persisted layout snapshot.

Every pointer operation has a keyboard equivalent. Coarse-pointer faces remain
visually compact while their hit targets meet the existing 44-by-44 contract.

### Panel management and undo

Shared commands cover rename, duplicate, reset shipped Panel, clear user Panel,
delete user Panel, reorder, and activate. Shipped Panel protection is expressed
through adopter-provided capabilities, not hard-coded Sonder IDs.

Layout mutations produce reversible operation records. The Lab exposes one-step
layout undo for the most recent Panel or Widget presentation mutation. Undo is
session presentation state and is not restored after reload.

## Shared theme authoring architecture

### Separation of responsibilities

The theme system retains separate validated owners:

- `ThemeDefinition`: semantic colors, typography, geometry, spacing,
  component materials, and icons;
- `CanvasDefinition`: static background images, veils, gradients, positions,
  blend modes, and other bounded visual layers;
- `ThemeDraft`: the editable six-role palette and material-control values; and
- `AmbientProfile`: position, radius, power, optional motion parameters, and
  accessibility veto behavior.

The precedence for the Lab is deterministic:

1. reduced-transparency and reduced-motion accessibility vetoes;
2. adopter/device capability limits;
3. temporary story or scene ambient override;
4. active theme ambient profile; and
5. theme fallback values.

A Theme draft cannot inject CSS, HTML, JavaScript, remote URLs, or unvalidated
assets. Invalid edits remain visible as a draft error but cannot replace the
last valid applied theme.

### Theme Settings Widget

The shared recipe implements:

- six semantic swatches;
- saturation/value plane;
- hue control;
- hexadecimal and RGB inputs;
- local eyedropper when the browser capability is available, with an honest
  unavailable state otherwise;
- Glass Density, Bar Opacity, Selected Strength, and Frost Level;
- two-dimensional ambient position;
- accessible radius and power controls;
- live semantic propagation across canvas, chrome, Panels, Widgets, tabs,
  fields, text, selected states, and floating frames;
- keyboard operation and labeled live readouts; and
- one long-lived device-local draft separate from layout persistence.

Theme Library remains the preset chooser. Theme Settings remains the canonical
authoring surface. Neither is duplicated as a second independent owner on the
Scene Panel; the Lab may place a view of the canonical Widget where useful.

## Deep Current fidelity requirements

### Shared composition, Deep acceptance target

The Atmospheric composition becomes the shared Workbench recipe, so all themes
inherit its useful geometry and behaviors. Deep is the target against which
that recipe is judged exactly.

The Lab removes the current double-band presentation from the reference frame.
The visible Workbench contains one compact integrated header with wordmark,
Panel tabs, story identity, and runtime status. Lab-only theme, persistence,
fixture, and debugging controls move into one shared utility drawer or test
surface that does not consume macro Workbench height.

Required Deep corrections are:

- edge-to-edge stage with no decorative outer card frame;
- authority-sized left and right instrument docks and exact responsive hiding;
- vertically resizable shelf stacks with quiet separators;
- flush Widget surfaces with hairlines rather than nested dashboard cards;
- compact title bars, tab strips, quiet glyph controls, and exact active states;
- unboxed literary transcript positioned directly on the reading stage;
- authority-shaped lower composer with no oversized generic Widget wrapper;
- image-led canvas, reading veil, localized ambient falloff, and controlled
  saturation;
- reference typography roles and compact technical scale;
- exact floating-window geometry, title treatment, and restrained shadow; and
- exact Scene Effects, Characters, Personas, AI Connections, and Custom Theme
  surfaces demonstrated in the recordings.

Deep-specific values are expressed through semantic definitions and
source-owned CSS recipes. Svelte component logic may branch on capability,
template, Widget type, or state, but never on a theme ID.

### Other themes

PomOS, Bunny, and Ash & Amber use the same header, Panel templates, regions,
shelves, Widget actions, Catalog, floating layer, Theme Settings, persistence,
keyboard behavior, and responsive rules. They may vary `ThemeDefinition`,
`CanvasDefinition`, and `AmbientProfile` values.

If a target cannot be expressed without changing behavior or mounting a
different component tree, the shared capability or semantic contract is fixed;
the target does not receive a fork.

## Widget and Catalog gaps

The implementation closes the recording-visible surfaces before inventing new
ones:

- Characters gains compact portrait rows, presence state, and roster scale;
- Scene Effects gains atmosphere, contrast, motion, and reading-veil controls;
- Personas exposes the recorded active-perspective facts;
- AI Connections exposes inference route, connection, route count, and latency
  states; and
- Custom Theme becomes the complete authoring surface defined above.

The existing 49 audited Widget surface boundary and 94 Catalog identities
remain authoritative. A reference-visible improvement may promote an existing
audited surface, but no unaudited domain behavior is invented.

The Catalog keeps search, categories, visual and compact previews, favorites,
recent, on-Panel, and fits-layout filtering. Placement eligibility is computed
from the active Panel template and current region geometry. Catalog creation and
Widget Shelf restoration are distinct operations.

## Accessibility and responsive behavior

The complete system must support:

- keyboard Panel/template selection, shelf resizing, Widget pickup, target
  traversal, placement, tab activation/reordering, restoration, and undo;
- pointer cancellation and touch cancellation with exact-origin restoration;
- correct tablist, tabpanel, separator, dialog, slider, status, and application
  semantics;
- focus restoration after Catalog, Panel creation, Theme Settings popover,
  Focus, Widget Shelf, and dialogs;
- 44-by-44 coarse-pointer targets independent of their visual face;
- reduced transparency and reduced motion;
- no horizontal overflow at `1440x900`, `390x844`, short landscape, or the
  existing 200-percent zoom equivalent; and
- hidden compact docks with reachable open-toolbar controls.

Color authoring reports invalid or inaccessible combinations and preserves the
last valid applied draft. The four frozen presets individually satisfy the
existing contrast policy.

## Error handling and safety

- Unknown template IDs render an explicit unavailable state and preserve the
  serialized state for a future compatible registry; they are never rewritten
  silently.
- Missing regions or incompatible Widgets fail placement without advancing the
  Workbench revision.
- Invalid hydration returns the known default state and an inspectable error;
  it does not partially apply a layout.
- Removing the active Panel selects the nearest surviving Panel before
  committing the mutation.
- Deleting a Panel with retained Widgets requires an adopter-authorized command;
  the Lab uses its existing confirmation pattern.
- Invalid theme or ambient edits cannot replace the last valid applied target.
- Eyedropper denial or unavailability is local to that control and never blocks
  manual color entry.
- Preserved prototypes, source videos, and imported canonical frames are read
  only and hash-verified.

## Implementation program

This design is deliberately split into four implementation plans. Each produces
working, testable software and closes its own review gate.

### Plan 1: Authority lock and fourth target

- import and manifest the canonical Ash & Amber frame;
- add the fourth complete theme, canvas, and ambient definitions;
- update theme controller, material defaults, storage, docs, and count tests;
- add wide Scene, compact Scene, and wide Catalog target scenarios; and
- prove atomic switching across all four targets with unchanged Workbench
  identity.

### Plan 2: Panel templates, regions, shelves, and placement

- add template, region, shelf, shelved-placement, migration, command, event,
  persistence, and undo contracts test-first;
- implement Story Stage, Focus + Support, and Columns two through six;
- implement Widget Shelf, shelf resizing, restoration, Panel management, and
  the complete docking transaction; and
- verify the full interaction matrix across all four themes.

### Plan 3: Theme Settings and ambient authoring

- add validated Theme draft and Ambient profile contracts;
- implement the complete shared editor and device-local draft persistence;
- prove semantic live propagation, invalid-draft safety, accessibility vetoes,
  and Ash & Amber reproducibility; and
- freeze focused editor browser evidence.

### Plan 4: Deep exact presentation and reference-visible Widgets

- replace the generic Lab macro presentation with the Atmospheric recipe;
- close the listed typography, material, stage, dock, composer, title-bar,
  floating, and responsive gaps;
- conform Characters, Scene Effects, Personas, AI Connections, and Custom Theme;
- run the adversarial visual critic loop at original resolution; and
- freeze Deep only after screenshot, computed-style, geometry, interaction, and
  accessibility evidence agree with the references.

The plans execute in order. Plans 2 and 3 depend on Plan 1's four-target
vocabulary. Plan 4 depends on Plans 2 and 3 so visual closure is judged against
the final shared behavior rather than a temporary structure.

## Test and evidence strategy

Every production behavior follows a witnessed red-green-refactor cycle.

### Framework-neutral tests

Package tests cover template and theme schemas, registry validation, placement
compatibility, shelf normalization, migration, restoration, undo, draft
validation, ambient precedence, persistence, and deterministic serialization.

### Svelte and browser tests

Component and Playwright tests cover real rendered behavior without importing
prototype runtime code. New tests prove:

- all four targets use the same Panel and Widget identities;
- each template renders its declared regions and choices;
- shelf resize, hide, restore, dock, tab, separate, float, cancel, and undo;
- Panel rename, duplicate, reset, clear, and delete capability boundaries;
- the six-role Theme Settings editor and ambient controls;
- keyboard, touch, focus, reduced-motion, reduced-transparency, and coarse
  pointer behavior; and
- no responsive overflow or unreachable control.

### Conformance

Independent reference and Lab drivers produce screenshots, normalized geometry,
computed styles, semantic measurements, functional traces, overlays, and pixel
diffs. Deep's two recordings are treated as supplemental frozen evidence, not
as a replacement for the executable 95/95 and 212/212 oracles.

The visual gate does not equate a closed structured ledger with perceptual
equality. Deep closure additionally requires original-resolution human review
with zero blocking or substantive critic findings across wide, compact, short
landscape, zoom, floating, Widget Shelf, Theme Settings, and Panel-template
states.

Canonical Windows screenshots remain authoritative for raster comparisons.
Cross-platform lanes retain semantic, geometry, accessibility, and interaction
coverage.

## Completion criteria

The program is complete only when:

1. Ash & Amber is a hash-backed fourth target with the recorded palette,
   materials, ambient profile, and three frozen target scenarios;
2. all four themes switch atomically over one unchanged mounted Workbench tree;
3. Story Stage, Focus + Support, and Columns two through six render as distinct
   shared Panel templates;
4. named regions and shelves provide the reference-visible sub-Panel behavior
   without recursive Panel navigation;
5. Widget Shelf, hidden retention, exact restoration, shelf resizing, tab
   operations, floating, Panel management, and undo work with pointer, keyboard,
   and touch;
6. Theme Settings authors all six semantic roles, four materials, and the
   ambient profile while preserving the last valid applied draft;
7. the reference-visible Widget surfaces match their recording states;
8. Deep matches Atmospheric composition and the reviewed videos with zero
   blocking or substantive visual critic findings;
9. PomOS, Bunny, and Ash & Amber retain the same complete behavior matrix;
10. every new behavior has witnessed red-green evidence and focused tests;
11. `npm.cmd run check` passes freshly with preserved extraction, 95/95, and
    212/212 gates unchanged; and
12. the branch is reviewed and integrated without package publication, public
    hosting, Sonder cutover, or mutation of preserved artifacts.

## Non-goals

- recursive Panels inside Panels;
- arbitrary unconstrained desktop or node-graph layout editing;
- top or bottom edge docks not demonstrated by the approved references;
- theme-specific Svelte component trees or behavior branches;
- remote theme loading, arbitrary theme code, or automatic remote assets;
- animated theme morphing;
- invention of unaudited Widget domain behavior;
- package publication, public hosting, license-boundary changes, or Sonder
  Engine cutover; and
- modification of the preserved Atmospheric Workbench or Widget Overhaul.
