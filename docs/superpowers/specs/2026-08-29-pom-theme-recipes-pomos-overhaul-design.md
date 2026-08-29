# Pom Theme Recipes and PomOS Overhaul Design

**Status:** Approved through the active thread goal

**Date:** 2026-08-29

**Repository:** PomegranateUI

**Supersedes presentation assumptions in:**

- `2026-08-28-pom-theme-foundation-design.md`
- `2026-08-28-pom-theme-art-direction-design.md`

## Decision

PomegranateUI will evolve its framework-neutral theme contract from a token
bundle into a bounded material, shape, canvas, and semantic-part recipe system.
Pom-owned recipes and adopter markup that opts into stable `data-pom-part`
annotations will change visual identity without theme-specific CSS edits. Pom
will not claim to style arbitrary unannotated markup, accept raw CSS, or replace
adopter ownership of branding, information architecture, product layout, and
domain behavior.

PomOS, Deep Current, Bunny, and a fourth external conformance fixture will use
the same component and state tree. A theme may select only validated material,
shape, spacing, typography, icon, composition, and interaction-state recipes.
Theme activation remains immediate and atomic; animated cross-theme morphing
remains out of scope.

PomOS will be rebuilt through this public contract. It will use the supplied
macOS 26 Tahoe images as visual evidence for material hierarchy, continuous
canvas composition, restraint, control metrics, and coherent geometry while
remaining an original Pom design with no copied Apple asset or product identity.

## Why the existing foundation is insufficient

The current schema validates useful semantic values, but the live result still
depends on application-owned selectors and hard-coded component decisions:

- `apps/workbench-lab/src/themes/bindings.ts` is the only CSS binding compiler;
- `apps/workbench-lab/src/themes/art-direction.css` contains concrete theme-ID
  branches for all three targets;
- `pom-neutral.ts` inherits from the branded Deep Current definition;
- global geometry fields such as corner family, chamfer, shared edge, and
  density are not consistently consumed by components;
- bloom, texture, icon-pack, and several canvas-image fields are validated more
  completely than they are rendered;
- component classes and element selectors, rather than stable semantic parts,
  decide which material applies; and
- native range controls remain outside the material contract.

Consequently the current system proves that a determined application author
can write three CSS skins. It does not prove that a Pom consumer can produce a
fourth complete visual identity from validated theme data.

## Product boundary

The no-custom-CSS promise is intentionally bounded.

Pom owns:

- versioned theme, canvas, material, shape, part, and asset contracts;
- deterministic validation, migration, resolution, and compilation;
- stable semantic part names and generic part-consumer CSS;
- accessible visual primitives used by Pom-owned recipes;
- framework-neutral conformance and a maintained Svelte reference binding; and
- the Workbench Lab proof that one tree can express opposing identities.

Adopters own:

- branding, copy, information architecture, arbitrary markup, and product
  layout outside Pom contracts;
- which markup opts into Pom part annotations or source-owned recipes;
- backend, authentication, storage, domain data, and application semantics;
- local asset availability and persistence policy; and
- additional presentation for adopter-owned parts not declared by Pom.

A theme cannot add selectors, elements, actions, scripts, remote URLs, or
executable expressions. A new anatomy requires a versioned Pom part/recipe or
adopter code, not a more permissive theme file.

## Authority and dependency boundaries

The runtime direction remains:

```text
contracts -> layout -> core -> svelte
contracts -> theme
```

`@pomegranate-ui/contracts` owns schemas and serializable public types.
`@pomegranate-ui/theme` owns pure migration, resolution, diagnostics, compiled
custom-property bindings, canvas presentation descriptors, asset requirements,
and conformance helpers. It imports neither a DOM nor a view framework.

The maintained Svelte integration and copy-owned recipes consume compiled
values. They do not inspect concrete theme IDs. The Workbench Lab owns the four
conformance definitions, local demo assets, selected-theme persistence, and the
visual evidence loop.

Atmospheric Workbench remains Deep Current's glass, lighting, typography,
spacing, restraint, and composition authority. Widget Overhaul remains the
Widget inventory and state authority. The supplied Tahoe images govern the
PomOS review rubric. Preserved artifacts remain byte-identical.

## Versioned data model

### Input and migration

The existing `pomegranate.ui.theme.v1` schema remains accepted. A new
`pomegranate.ui.theme.v2` schema becomes the authored target. Parsing is a
two-stage operation:

1. validate the exact versioned input;
2. migrate valid v1 input deterministically to complete v2 data;
3. validate v2 cross-references; and
4. resolve colors, materials, shapes, assets, parts, states, and policy into an
   immutable `ResolvedTheme`.

Invalid input never partially applies. Migration diagnostics retain literal
paths and distinguish invalid schema, unsupported version, missing material,
missing shape, missing asset, unsupported part, and unsafe contrast.

### Material palette

V2 replaces the fixed assumption that one `widget` material can style every
Widget descendant with a bounded named palette. IDs use local kebab case; a
theme contains at most 32 materials. Each material describes:

- semantic base and opaque fallback colors;
- fill opacity;
- backdrop blur, saturation, and brightness;
- light, dark, or automatic content tone;
- border width/color/opacity;
- one directional specular rim with angle and opacity;
- at most four outer or inset shadow layers;
- optional local texture asset and blend intent; and
- an explicit reduced-transparency material or opaque fallback.

The compiler owns CSS syntax. Theme data contains numbers, enums, semantic
color references, and local asset IDs only.

### Shape palette

A bounded named shape palette separates geometry from material. A shape has a
family (`none`, `square`, `rounded`, `continuous-rounded`, `pill`, or
`chamfered`), radius, optional chamfer amount/angle, and a joined-edge policy.
The initial continuous-rounded implementation uses a conservative high-radius
fallback; no unstable browser feature or artifact-prone mask is required for
the first release. Joined-edge policy can suppress selected corners and shared
borders without changing DOM order.

### Semantic parts

V2 requires a complete resolved recipe for these initial parts:

```text
canvas.surface
chrome.shelf
chrome.context
dock.surface
panel.surface
group.surface
widget.surface
widget.header
widget.content
widget.actions
row.surface
separator
field.surface
button.surface
button.icon
menu.surface
dialog.surface
floating.surface
slider.input
slider.track
slider.fill
slider.thumb
```

Each recipe references a material and shape, plus bounded typography role,
spacing, overflow, separator, elevation, and state mappings. State mappings
cover hover, pressed, selected, disabled, focus, and inactive presentation.
They cannot remove an accessible name, action, focusability, or status.

The resolved theme also owns presentation-only composition values:

- individual or unified group surface treatment;
- full, compact, or overlay chrome treatment; and
- always-visible, compact, or hover/focus Widget action treatment.

All functional actions remain mounted and keyboard reachable in every mode.

### Static part consumer

`@pomegranate-ui/theme` exports deterministic root custom properties for every
resolved part. A static, package-owned part stylesheet maps stable
`data-pom-part` attributes to those properties. Concrete theme IDs are metadata
only and never appear in selectors.

This structure supports nested themed roots without generating arbitrary
selectors: the nearest `[data-pom-theme-root]` supplies the variables, while
the generic part stylesheet is constant across themes.

### CanvasDefinition

Canvas compilation remains separate from component materials. The pure theme
package compiles each validated layer into an immutable presentation descriptor
containing its kind, order, color/image reference, geometry, opacity, filter,
and blend. A maintained Svelte canvas recipe renders those descriptors as
absolutely positioned, pointer-transparent layers under the Workbench.

Layer rendering, rather than a single `background-image` string, is required so
image fit, focal position, per-layer blur, saturation, opacity, blend, veil,
and texture behavior remain independent. The root canvas is the only wallpaper
owner. Docks and the stage cannot add target-specific wallpaper contours.

Animated ambient effects remain a separate future `AmbientProfile`; this work
does not add an animation engine.

### Assets and icons

The host registers local asset IDs and semantic icon keys. Resolution produces
literal missing-asset diagnostics and uses only declared deterministic
fallbacks. It does not load a URL or filesystem path supplied by imported theme
data.

Widget actions refer to semantic icon keys such as `widget.drag`,
`widget.dock-left`, `widget.float`, `widget.focus`, and `widget.remove`. The Lab
registers its existing local icon set. PomOS cannot introduce decorative window
controls because no corresponding action exists.

## Accessibility and policy order

Effective presentation resolves in this order:

1. theme defaults;
2. host/runtime bounded overrides;
3. user preference; and
4. device or accessibility safety veto.

Reduced transparency replaces translucent materials with their declared opaque
fallback and disables backdrop filters. Reduced motion continues to suppress
existing motion. Contrast checks evaluate supported opaque/fallback pairings
and browser tests inspect real composited surfaces. Coarse-pointer hit areas
remain at least 44 by 44 CSS pixels even when a control's visible face is much
smaller.

## PomOS visual specification

### Canvas and composition

- One original blue dimensional canvas covers the complete root.
- No stage pseudo-element owns wallpaper artwork.
- Dock regions have no fill, border, shadow, radius, or clipping surface.
- Widget stacks use deliberate gaps and scroll without cropped corners,
  permanent gutters, or seams.
- Wide, compact, and phone compositions preserve access to the transcript,
  composer, theme selector, and required actions.

### Material hierarchy

- Shelf, context chrome, Widget windows, overlays, fields, and selected controls
  use distinct materials rather than one universal glass value.
- A Widget surface owns blur; ordinary rows and content groups do not establish
  another backdrop-filter owner.
- Headers share the parent window and use only a restrained tonal distinction
  or hairline.
- Content may use an opaque or near-opaque material when readability benefits,
  matching the reference evidence that not every Tahoe surface is transparent.
- Rims, borders, and shadows follow one recipe per elevation. Mixed bevel,
  square intersection, and stacked inset artifacts are prohibited.

### Geometry and controls

- Decorative traffic-light dots are removed without replacement.
- Window, control, pill, circular, joined, and borderless-row shapes use the
  declared palette; accidental 2px or square bordered cards are prohibited.
- Range controls use a shared accessible primitive with a 3–4px visual track,
  restrained thumb, active fill, visible focus/drag feedback, and a separate
  44px coarse-pointer target.
- Widget actions remain real, consistently aligned, and available to mouse,
  keyboard, and touch users.

### Chrome, typography, and icons

- The shelf and context controls form a restrained hierarchy instead of two
  equally loud web-dashboard toolbars.
- Ordinary UI labels use readable system-like casing and scale; technical
  uppercase is reserved for genuinely technical metadata.
- Icons come from the semantic registry and share stroke/weight conventions.
- Theme switching changes no product information architecture or behavior.

## Opposing-target and external proof

Deep Current and Bunny migrate to the same v2 palette and semantic parts.
Their visual identities must remain distinct; generalized recipes cannot flatten
them toward PomOS. A fourth fixture, stored outside the Lab preset module,
must resolve, compile, and render a visibly different identity without adding or
modifying a stylesheet. It is a conformance input, not a new product theme.

The same live tree proof records Panel IDs, Widget instance IDs, placement,
active Panel, layout revision, theme-independent DOM part inventory, and focus
before and after each activation.

## Test-first evidence

### Unit and package tests

- v1 validation and deterministic v1-to-v2 migration;
- complete v2 validation and cross-reference diagnostics;
- bounded palette, shapes, parts, shadows, states, and asset references;
- rejection of raw CSS, selectors, scripts, HTML, URLs, and unknown parts;
- deterministic immutable resolution and custom-property compilation;
- canvas descriptor compilation for every layer kind and property;
- accessibility override precedence and reduced-transparency substitution;
- package boundary remains free of DOM and view-framework imports; and
- packed consumers use the public compiler rather than a Lab copy.

### Component and source conformance

- every Pom-owned visual part has a stable annotation and resolved recipe;
- no production CSS or Svelte source selects a concrete theme ID;
- no preset extends another branded preset;
- the generic part stylesheet is the only theme consumer for covered parts;
- the fourth fixture requires no CSS change; and
- switching retains the same live component/state tree and actions.

### Browser and visual evidence

Playwright covers 1440x900, 640x900, and 390x844 where supported. It exercises
theme switching, range controls, overlays, docking, resizing, grouping,
scrolling, saved layouts, focus, selected/disabled states, reduced transparency,
and realistic persisted state.

Computed-style checks cover single blur ownership, material fallback, allowed
radii, canvas continuity, dock transparency/overflow, custom range anatomy,
contrast, focus, and coarse-pointer hit size.

The visual critic loop captures PomOS before/after/final renders, compares every
supplied Tahoe image and the rubric above, records substantive findings, fixes
them, and repeats. A fresh final pass must contain no substantive hierarchy,
edge, geometry, control, readability, responsive, affordance, or identity
finding. Negligible taste-level pixel differences do not keep the loop open.
Deep Current and Bunny receive a regression critic pass after migration.

## Delivery and non-goals

The static Lab remains the demo and `apps/workbench-lab/dist` remains the
relative-base hosting artifact. Documentation covers authoring, migration,
assets, parts, materials, policy, canvas, examples, and the honest boundary.

This work does not add SvelteKit, package publication, a theme marketplace,
remote themes, user-uploaded assets, ambient animation, Apple assets, Sonder
server imports, Sonder cutover, or a branded turnkey Pom frontend.

Delivery requires scoped commits, focused and full Windows verification,
reviewed visual evidence, code review, a green pull request, merge, remote-main
verification, and verification of the applicable GitHub Pages artifact.

## Acceptance criteria

The goal is complete only when all of the following are proven:

1. v1 input migrates deterministically and v2 is fully validated.
2. `@pomegranate-ui/theme` owns reusable resolution, part bindings, canvas
   descriptors, asset/icon requirements, policy, and conformance.
3. Pom-owned recipes expose the stable part inventory and consume no theme IDs.
4. PomOS, Deep Current, Bunny, and the external fixture render the same live
   tree through data-only definitions and the generic part consumer.
5. PomOS satisfies the complete visual specification and final critic pass.
6. Deep Current and Bunny retain distinct reviewed identities and behavior.
7. Accessibility, responsive, persistence, packed-consumer, extraction,
   preserved-oracle, browser, conformance, and full `npm.cmd run check` gates
   pass.
8. Documentation and static hosting remain correct.
9. The reviewed PR is merged and remote/Pages evidence identifies the delivered
   revision.
