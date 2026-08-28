# Pom Theme Foundation and Three-Target Conformance Design

**Status:** Proposed for user review

**Date:** 2026-08-28

**Repository:** PomegranateUI

**Depends on:** `2026-08-27-pomegranateui-svelte-view-layer-design.md`

## Decision

PomegranateUI will add a framework-neutral theme foundation and prove it by
rendering the same live Workbench through three deliberately different visual
targets:

1. **Pom Neutral:** a calm, modern, macOS-like experience built from original
   Pom assets and design decisions rather than copied platform furniture.
2. **Deep Current:** the industrial dark-tech direction governed by the
   preserved Sonder Atmospheric Workbench and Widget Overhaul evidence.
3. **Bunny:** an original kawaii-inspired pastel theme with soft geometry,
   playful typography, and optional bunny motifs.

All three targets use the same Panels, Widgets, Catalog, commands, layout,
persistence, accessibility behavior, and semantic markup. Switching themes is
atomic and immediate. Pom will not implement animated theme morphing.

The theme foundation is a reusable toolkit contract, not a branded application
shell. The existing Svelte Workbench Lab remains the first demanding consumer
and the initial local showcase. Public GitHub Pages hosting is a later tranche
after the theme foundation and three-target conformance are complete.

## Why this scope

The three targets form a useful conformance triangle:

- Pom Neutral proves that the toolkit can provide a restrained and broadly
  approachable reference experience.
- Deep Current proves exacting dark materials, dense Widget chrome, technical
  geometry, and preserved Sonder fidelity.
- Bunny proves that the same UI can become bright, rounded, decorative, and
  playful without component forks.

The value is the contrast between complete target themes, not a large theme
authoring application. An animated transition engine would add runtime,
testing, accessibility, and maintenance cost for a showcase effect that does
not improve adopter capability. Immediate switching makes the architectural
proof clearer because the unchanged interface is directly comparable.

## Goals

- Define versioned, schema-validated semantic theme input.
- Keep theme contracts, validation, resolution, and merging free of Svelte,
  React, DOM, browser storage, and adopter domain semantics.
- Replace the Workbench Lab's hardcoded Deep Current constants with resolved
  theme values without changing its approved appearance.
- Provide Pom Neutral, Deep Current, and Bunny as deterministic conformance
  presets for the Lab.
- Apply a validated theme atomically without remounting the Workbench or
  mutating its state.
- Preserve adopter ownership of markup, composition, branding, assets,
  persistence, and product semantics.
- Prove that the three targets use the same component tree and public Pom
  behavior contracts.
- Keep theme assets local, attributable, bounded, and suitable for an eventual
  static public showcase.
- Retain responsive, accessibility, extraction, packed-consumer, and preserved
  mockup gates.

## Non-goals

- Animated transitions or a theme-transition controller.
- A full visual theme editor.
- Ambient effect engines such as rain, snow, petals, lightning, or fog.
- User uploads, an asset library, remote theme loading, or automatic remote URL
  fetching.
- A theme marketplace, shareable theme URLs, or account-backed theme storage.
- Arbitrary CSS, JavaScript, HTML, selectors, or executable hooks in imported
  theme data.
- Theme-specific component trees, information architecture, Widget behavior,
  or layout state.
- A second public showcase application while the Workbench Lab can prove the
  required behavior.
- GitHub Pages workflow configuration or public deployment in the foundation
  tranche.
- Npm publication, public-license selection, or Sonder Engine cutover.

## Alternatives considered

### 1. Keep themes as unvalidated application CSS

This is the least work, but it cannot prove that external adopters receive a
stable theme contract. It also encourages component-specific overrides and
allows Deep Current assumptions to remain hidden in the Lab.

### 2. Ship a complete themed component library

This would make switching easy but would weaken adopter ownership of markup and
composition. It would turn Pom toward a fixed frontend rather than a toolkit.

### 3. Framework-neutral theme data with source-owned presentation

This is the selected approach. Pom owns validated semantic data and resolution.
Source-owned recipes and adopter applications decide how that data is applied
to their markup. The Lab proves the maintained Svelte path without making its
composition package authority.

## Authority and dependency boundaries

The existing runtime direction remains intact:

```text
contracts -> layout -> core -> svelte
```

Theme support adds a separate framework-neutral branch:

```text
contracts -> theme
```

The Svelte recipes and Workbench Lab may consume both `core` and `theme`; the
framework-neutral runtime packages do not depend on theme presentation.

### `@pomegranate-ui/contracts`

Owns the public versioned schemas and TypeScript types for untrusted theme
input, including `ThemeDefinition`, token groups, canvas layers, asset
references, and schema-version discrimination.

### `@pomegranate-ui/theme`

Depends only on public contracts. It owns:

- schema entry points for parsing theme input;
- deterministic defaulting and merge behavior;
- semantic resolution into a complete `ResolvedTheme`;
- stable conversion to presentation-neutral bindings such as named token
  values and asset references;
- validation diagnostics with literal error codes and paths; and
- conformance helpers for preset and consumer tests.

It does not import DOM APIs, Svelte, browser storage, filesystem APIs, a network
client, or Sonder code.

### `@pomegranate-ui/svelte`

Remains a headless integration package. The initial tranche does not require a
compiled themed component library. A small theme-root helper belongs in a
source-owned recipe unless repeated consumer evidence later justifies a public
Svelte binding.

### Source-owned recipes

Recipes consume semantic bindings and expose stable classes, attributes, and
slots. They do not inspect theme IDs or encode branches such as
`theme === "deep-current"`. Adopters may change the markup while retaining the
public behavioral and accessibility contracts.

### Workbench Lab

The Lab owns the three preset definitions, their original or licensed assets,
theme selection UI, persistence of the selected preset, and the application of
resolved theme bindings to its root. The presets begin as conformance fixtures,
not mandatory package defaults. Promotion to a copy-owned theme registry is
separate future work.

## Theme data model

`ThemeDefinition` is declarative and serializable. It includes:

- `schemaVersion`, stable `id`, label, and optional description;
- semantic color roles;
- typography roles;
- geometry roles;
- material recipes;
- spacing and density roles;
- semantic icon-pack reference;
- canvas layers; and
- accessibility fallbacks and capability metadata.

It does not contain selectors, element names, component source, arbitrary CSS,
or executable expressions.

### Semantic colors

The initial roles cover application canvas, elevated and inset surfaces,
chrome, text, muted text, faint text, accent, selection, focus, success,
warning, danger, borders, and shadows. Component-specific one-off colors are
not public theme roles unless evidence shows a reusable semantic need.

Every resolved theme must provide safe text, focus, and state combinations.
Validation rejects missing roles and invalid color syntax. Browser conformance
checks contrast in rendered target surfaces because schema validation alone
cannot prove composited contrast.

### Typography

Typography is role-based rather than component-based:

- UI sans;
- literary or prose;
- technical or monospace; and
- optional display/accent.

Each role resolves family, fallback stack, weight, size scale, line height, and
tracking. Themes reference locally available or adopter-resolved fonts. The
theme package does not bundle font binaries.

### Geometry

Geometry separates corner shape from tonal bevel:

- corner family: square, rounded, pill, or chamfered;
- corner amount;
- chamfer amount and angle where applicable;
- border width;
- shared-edge treatment; and
- focus geometry.

Materials separately control highlight and shadow depth, direction, and
contrast. This permits a rounded surface with a strong tonal edge or an angular
surface with no bevel.

### Materials

Reusable material roles cover canvas, shelf, panel, Widget, field, button,
menu, dialog, and floating surfaces. A recipe may combine:

- base color and opacity;
- blur and saturation intent;
- border and inset treatment;
- highlight, shadow, and bloom;
- optional texture reference; and
- a solid fallback for environments where translucency is unavailable or
  inappropriate.

The resolved model supplies values; recipes retain control of actual markup and
CSS composition.

### Density and spacing

Themes may select compact, balanced, or roomy density and resolve semantic
spacing steps. Density may change padding, gaps, chrome height, and typography
metrics within accessible bounds. It may not change Panel identity, Widget
placement, Catalog inventory, navigation semantics, or the Workbench layout
model.

Coarse-pointer targets remain at least 44 by 44 CSS pixels even when the visible
face is compact.

### Icons

Themes select a semantic icon-pack ID. The adopter or Lab resolves keys such as
`panel.close`, `widget.float`, or `catalog.open` to local assets or source-owned
components. The theme package does not bundle a large icon library and does not
accept arbitrary remote URLs.

### Canvas

The foundation supports an ordered, validated layer stack sufficient for the
three targets:

- solid color;
- linear, radial, and conic multi-stop gradients;
- four-corner color fields compiled deterministically from layered gradients;
- optional local image references;
- a reading veil or vignette; and
- an optional lightweight texture reference.

Image references describe fit, focal position, opacity, blur, basic color
adjustment, and blend mode. An adopter-supplied asset resolver maps references
to usable local assets. The first tranche does not implement uploads, asset
management, remote fetching, or an image browser.

Ambient animation is not part of `CanvasDefinition` in this tranche.

## Three conformance targets

### Pom Neutral

Pom Neutral is the restrained initial showcase target. It uses original Pom
design choices inspired by modern desktop clarity:

- neutral light or balanced surfaces;
- restrained translucency and shadow;
- moderate rounding;
- spacious but efficient density;
- calm system-oriented typography; and
- minimal original icons.

It must not copy Apple icons, window controls, assets, or exact platform trade
dress.

### Deep Current

Deep Current is the exacting industrial dark-tech target. Authority remains:

1. Atmospheric Workbench for macro composition, typography, materials,
   proportions, lighting, docking feedback, and floating geometry.
2. Widget Overhaul for later Panel, Widget, Catalog, icon, responsive-height,
   and audited Widget-state direction.
3. Current Pom packages for runtime, persistence, commands, accessibility, and
   acquired behavior.

Converting the Lab to resolved theme data must not weaken its existing approved
native screenshots or the preserved prototype harnesses.

### Bunny

Bunny is an original kawaii-inspired pastel target:

- bright or soft pastel semantic colors;
- rounded or pillowy geometry;
- soft material depth rather than industrial bevels;
- friendly typography with robust fallbacks;
- lightweight original bunny motifs or icon variants; and
- a pastel multi-stop or four-corner canvas.

It must remain readable and operable rather than using cuteness to excuse low
contrast, cramped labels, excessive decoration, or undersized targets.

## Atomic theme selection

Theme selection changes presentation without changing Workbench state.

1. The Lab receives a preset ID.
2. It parses and resolves the complete target definition.
3. Its asset resolver confirms required local font, icon, texture, and image
   references or selects declared fallbacks.
4. Only after validation succeeds does the Lab replace the complete resolved
   theme binding and root theme attribute.
5. The selected preset ID is persisted through an app-owned preference adapter.

Validation or asset-resolution failure leaves the last valid theme active and
returns a literal diagnostic. Theme activation does not recreate the
`WorkbenchStore`, reset layout state, remount Widgets, change focus, or navigate.

There is no public transition duration, intermediate theme state, animation
queue, or morphing API. The initial Lab applies the new theme immediately.

## Workbench Lab showcase scope

The first showcase extension is intentionally small:

- three theme cards or a comparably compact selector;
- immediate application;
- the existing Scene, Library, Settings, Panels, Widgets, and Catalog;
- a concise developer inspector for resolved semantic groups; and
- plain-language ownership guidance.

It does not include a general-purpose theme editor. If the finished three-theme
showcase needs more evidence, a later bounded change may expose a few controlled
adjustments such as accent, rounding, glass opacity, or density.

Creating a separate public app is deferred. The Lab already provides a static,
inspectable consumer and deployment boundary. A second app requires evidence
that public presentation and engineering conformance cannot coexist cleanly.

## Accessibility and responsive authority

PomegranateUI retains authority for reusable accessibility behavior even when
adopters own presentation. Every target must preserve:

- keyboard navigation and focus restoration;
- visible focus treatment;
- semantic relationships and accessible names;
- color contrast on composited materials;
- non-color state indicators;
- 44 by 44 CSS pixel coarse-pointer targets;
- usable 200%-zoom-equivalent layouts;
- reduced-motion behavior for existing UI motion; and
- no horizontal overflow at approved compact viewports.

Themes cannot suppress accessibility fallbacks or replace functional state
semantics with decoration.

## Testing and evidence

Implementation remains test-first.

### Contract and theme-package tests

Tests cover:

- complete valid definitions for all three targets;
- every invalid or missing semantic group;
- schema-version rejection;
- deterministic defaulting, merging, ordering, and resolution;
- no arbitrary CSS, script, HTML, selectors, or automatically fetched URLs;
- diagnostic codes and paths;
- asset-reference validation; and
- DOM- and framework-free package boundaries.

### Lab component tests

Tests prove:

- all three presets are selectable;
- invalid activation retains the last valid theme;
- the selected preset persists through the Lab adapter;
- switching does not recreate the Workbench store;
- Panel IDs, Widget instance IDs, Catalog state, active Panel, and layout
  revision remain unchanged; and
- recipes do not branch on known theme IDs.

### Browser behavior and accessibility

At approved wide and compact viewports, tests switch through all three themes
and verify state identity, focus continuity, interaction availability, no
horizontal overflow, coarse-pointer target size, and rendered contrast.

The existing Deep Current browser paths remain the comprehensive behavioral
lane. Pom Neutral and Bunny add narrowly scoped conformance paths rather than
multiplying every existing scenario by three.

### Visual evidence

- Existing Deep Current native baselines remain authoritative for their named
  states and should not be refreshed merely because the CSS source changed.
- Add one reviewed wide and one reviewed compact stable-state baseline for Pom
  Neutral.
- Add one reviewed wide and one reviewed compact stable-state baseline for
  Bunny.
- Disable animation, wait for local fonts and assets, and mask only genuinely
  changing fixture data.
- Keep the preserved Atmospheric and Widget Overhaul harnesses green and their
  files byte-identical.

### Package and artifact evidence

- Packed neutral and Svelte consumers continue to build without workspace
  leakage.
- `@pomegranate-ui/theme` is separately packable and carries no DOM or Svelte
  runtime dependency.
- The Workbench Lab production artifact remains relative-base static output.
- Verification records JavaScript, CSS, font, image, and total compressed
  artifact sizes before and after the tranche.
- Theme code adds no third-party runtime dependency without separately reviewed
  justification.
- New binary assets require provenance, license evidence, and an explicit size
  entry.

## Public showcase and hosting boundary

The eventual Pom GitHub Pages site will deploy the tested static Lab artifact or
a later evidence-justified public presentation derived from it. Hosting work is
separate and begins only after three-target conformance is complete.

Before public deployment, the project must audit:

- repository visibility and chosen public license;
- font, icon, texture, and image redistribution rights;
- product copy and trademark-safe naming;
- absence of secrets, private fixtures, absolute paths, and Sonder server code;
- GitHub Pages base-path behavior;
- desktop and mobile live rendering; and
- exact deployed revision identity.

No deployment provider configuration or credential enters the theme-foundation
implementation.

## Implementation decomposition

After this design is approved, one detailed implementation plan should sequence:

1. theme contracts and failing schema tests;
2. framework-neutral resolution and package-boundary tests;
3. Deep Current extraction with unchanged visual evidence;
4. Pom Neutral and Bunny conformance presets;
5. atomic Lab selection and state-preservation coverage;
6. narrow cross-theme accessibility and visual proof;
7. packed-consumer, extraction, build-size, and full repository verification;
   and
8. documentation of the theme/adopter/showcase boundaries.

GitHub Pages publication receives its own later design and plan.

## Migration and rollback

Deep Current is migrated one semantic group at a time while its current Lab CSS
remains the visual reference. The theme package does not become authority merely
because a partial preset parses.

If the generalized contract cannot reproduce Deep Current or either opposing
target without theme-ID branches, the tranche stops and the contract is revised.
The preserved mockups are never edited to make the new implementation pass.

The Lab can temporarily retain its previous fixed stylesheet until resolved
Deep Current output is dual-green. Removing the fixed path occurs only after
component, browser, and visual parity are demonstrated.

## Acceptance criteria

The theme-foundation tranche is complete when:

- `@pomegranate-ui/theme` provides deterministic, versioned, framework-neutral
  resolution over schema-validated public input;
- Pom Neutral, Deep Current, and Bunny render the same Workbench component tree
  and state through three complete presets;
- theme activation is immediate, atomic, recoverable, and state-preserving;
- Deep Current retains approved mockup fidelity;
- Pom Neutral and Bunny have reviewed wide and compact evidence and are clearly
  different visual systems rather than palette swaps;
- no recipe or component branches on a target theme ID;
- all three targets pass focused responsive, accessibility, and contrast gates;
- preserved prototype bytes, harnesses, extraction completeness, and existing
  public behavior contracts remain green;
- the static artifact remains self-contained and its size impact is recorded;
- all new assets carry provenance and redistribution evidence;
- ambient effects, full editing, remote assets, animated transitions, public
  hosting, package publication, and Sonder cutover remain outside scope; and
- the full repository verification gate passes.
