# Pom Mockup Conformance and Three-Target Showcase Design

**Status:** Approved

**Date:** 2026-08-28

**Repository:** PomegranateUI

**Depends on:** `2026-08-27-pomegranateui-svelte-view-layer-design.md` and
`2026-08-28-pom-theme-foundation-design.md`

## Decision

PomegranateUI will replace its current self-referential screenshot process with
a repeatable Playwright conformance loop. The loop compares the maintained
Svelte Workbench Lab against explicit visual, geometry, interaction,
accessibility, and feature authorities.

Deep Current is the first target. It uses the preserved Atmospheric Workbench
for macro composition and visual character, and the preserved Widget Overhaul
for audited Widget, Panel, Catalog, responsive, and state behavior. The current
Lab screenshots are evidence of the implementation, not reference authority.

After Deep Current is conformant and frozen, Pom will create and approve
original reference frames for Pom Neutral and Bunny. Those targets will use the
same markup, Panels, Widgets, commands, persistence, layout, and accessibility
contracts. Theme definitions may change semantic presentation values; they may
not select a different component tree or feature set.

Theme changes remain immediate and atomic. Animated theme morphing is excluded:
it would add motion policy, intermediary-state, performance, and visual
regression costs to a showcase effect without improving Pom's reusable theme
contract.

## Problem statement

The existing Workbench Lab proves a small native Svelte slice and captures
stable screenshots of that slice. It does not prove visual or functional
conformance to the preserved mockups. In particular:

- the current screenshots became goldens from the implementation under test;
- the visual test compares the Lab only to those goldens, not to the preserved
  Atmospheric Workbench or Widget Overhaul;
- the earlier Svelte plan intentionally limited the Lab to six seeded Scene
  Widgets and a generic dashboard composition;
- the current Lab consequently differs in shell proportions, canvas staging,
  integrated toolbars, shelf geometry, composer geometry, portraits, resizing,
  tabbed Widgets, and audited Widget bodies; and
- theme switching demonstrates color and material variation over the wrong
  structure, so it cannot yet demonstrate Pom's intended flexibility.

The remedy is not to refresh the current screenshots. Pom needs a comparison
system whose source of truth is explicit, immutable where possible, and
independent from the implementation.

## Authority model

### Deep Current macro authority

The preserved Atmospheric Workbench owns:

- the overall workbench silhouette and usable-height behavior;
- top shelf, left toolbar, center stage, right toolbar, and composer staging;
- macro proportions and supported resizing ranges;
- canvas imagery, veils, lighting, material, typography, and atmosphere;
- docking feedback, shelf seams, tab merge/reorder, floating geometry, and
  invalid-drop restoration; and
- responsive macro transformations shown or tested by the reference.

Its immutable executable inputs are:

- `prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html`
  at SHA-256
  `38878D2CF8A86F5E879FABA4B41A214E4293F22ED755975023E02C962D61B913`;
- `prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration-preview.html`
  at SHA-256
  `14C735C159724E03B66E84CF166B7937F99F0654D9EA9D7D36374D0A9A15E557`;
  and
- `prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html`
  at SHA-256
  `737BB396B5D522E5449C9EC66F4689D525F0B4109D4E40693BE50CB6C447F0C0`.

The regression must continue to report `95/95 passed`.

### Deep Current Widget authority

The preserved Widget Overhaul owns:

- all audited Panel, sub-panel, Widget, and Catalog identities;
- Widget geometry, ready/error/empty/pending/focused states, actions, and
  authority boundaries;
- responsive Widget projections at audited toolbar widths and focused sizes;
- Catalog visual and compact preview anatomy;
- current interaction details that deliberately succeed the Atmospheric
  Workbench; and
- the complete Widget registry and category totals.

Its immutable executable inputs are:

- `prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html` at
  SHA-256
  `043167AD75C07FA5FF8661FBE8A86943A9C0B38EEEA9811739309CB866E8A2A5`;
  and
- `prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html`
  at SHA-256
  `79AA122ABAE1D51DFF5D1CF292590EFE03A53641B2FF44008E6A165BEB3DB8B3`.

The regression must continue to report `212/212 passed`.

The audited ledger records `49 of 95 surfaces implemented`. All 49 implemented
surfaces are in this conformance scope. The Catalog still exposes all 94
top-level Widget identities and their existing category totals. Pom preserves
those identities and safe discovery previews, but does not invent production
bodies for the other 46 unaudited surfaces. A later authoritative Widget audit
may expand the implemented-surface count through explicit change control.

### Pom runtime authority

Current Pom packages own framework-neutral runtime behavior, parsing,
commands, layout transitions, persistence, accessibility, Svelte integration,
and test-driver contracts. The preserved mockups are executable reference
oracles; they are never imported as application runtime or treated as a backend
model.

If the two mockups conflict, Atmospheric Workbench wins for macro
composition/material and Widget Overhaul wins for later Widget/Panel/Catalog
behavior. If a mockup conflicts with an acquired Pom runtime or accessibility
contract, the discrepancy is recorded and resolved deliberately rather than
silently changing either authority.

## Goals

- Make every conformance scenario declare its authority, setup, viewport,
  evidence, measurements, assertions, and allowed deviations.
- Produce deterministic reference, actual, overlay, pixel-diff, geometry,
  computed-style, functional, and accessibility evidence.
- Make preserved-reference hash drift and reference-driver failure distinct,
  fail-closed errors.
- Restore Deep Current's macro composition before iterating detailed Widget
  surfaces.
- Conform all 49 audited Widget Overhaul surfaces and preserve all 94 Catalog
  identities without inventing the remaining 46 bodies.
- Close Deep Current with zero unresolved P0/P1 discrepancies, zero unapproved
  P2 discrepancies, and only explicitly reviewed P3 deviations.
- Freeze Deep Current regressions before authoring Pom Neutral or Bunny visual
  references.
- Prove Pom Neutral and Bunny against original approved reference frames using
  the same scenario and discrepancy machinery.
- Keep all three themes on the same semantic component tree, including focus,
  pending, error, empty, compact, coarse-pointer, and responsive states.
- Preserve deterministic extraction, package boundaries, static Lab output,
  and a cross-platform repository gate.
- Leave `apps/workbench-lab/dist` as the relative-base static artifact boundary
  for the later public GitHub Pages showcase.

## Non-goals

- Animated theme transitions or a theme-morphing engine.
- A visual theme editor, remote theme loading, uploads, or a marketplace.
- Importing Sonder server code, domain persistence, authentication, or model
  provider behavior.
- Editing any file under `prototypes/sonder-baseline/**`,
  `design/foundations/sonder-ui-bible/**`, or
  `design/widget-specifications/sonder-panels-and-widgets/**`.
- Treating the standalone mockups as production package source.
- Implementing unaudited specialized bodies for the 46 remaining Widget
  surfaces.
- Npm publication, a Sonder cutover, or public deployment in the conformance
  tranche. Pages configuration follows only after all three targets are frozen.
- Committing every generated screenshot and pixel diff to Git.
- Passing solely by relaxing a global pixel-difference threshold.

## Conformance architecture

The system is a hybrid dual-driver harness. One driver operates the authority
surface; another operates the Workbench Lab. A scenario describes intent once
while allowing the two independently structured documents to reach equivalent
semantic states.

```text
scenario manifest
      |                        preserved hash manifest
      v                                   |
reference driver -> authority page -------+
      |                                   |
      +-> reference screenshot + measurements

implementation driver -> Workbench Lab
      |
      +-> actual screenshot + measurements + assertions

reference + actual
      |
      +-> overlay + pixel diff + structured comparison
      |
      +-> discrepancy ledger + Playwright result attachments
```

The reference and implementation drivers must not share selectors or call one
another. Shared scenario state is semantic, such as `scene-ready`,
`catalog-expanded`, `world-state-focused`, or `invalid-drag-restored`.

### Repository boundaries

```text
tests/conformance/
  manifest.ts
  types.ts
  authorities.ts
  viewports.ts
  drivers/
    reference/
    workbench-lab/
  measurements/
  specs/
  baselines/
scripts/conformance/
docs/conformance/
  README.md
  deep-current-ledger.md
  pom-neutral-ledger.md
  bunny-ledger.md
```

`tests/conformance/baselines/` contains small reviewed structured baselines and
approved Pom Neutral/Bunny reference frames only. Deep Current reference images
are generated from the preserved executable sources on each run. Generated
actual images, overlays, diffs, traces, and JSON reports live under Playwright's
ignored `test-results/` boundary and become CI artifacts on failure.

No conformance file is shipped by a package. No Lab or package source imports
from `tests/conformance`, `scripts/conformance`, or the preserved mockups.

## Scenario contract

The public test-only contract is discriminated and serializable except for its
driver functions:

```ts
type ThemeTarget = 'deep-current' | 'pom-neutral' | 'bunny';
type AuthorityId = 'atmospheric-workbench' | 'widget-overhaul' | 'approved-frame';
type ViewportId =
  | 'wide'
  | 'standard'
  | 'medium'
  | 'tablet'
  | 'compact'
  | 'compact-small'
  | 'landscape-short'
  | 'zoom-200';
type InputMode = 'fine-pointer' | 'coarse-pointer' | 'keyboard';

interface ConformanceScenario {
  readonly id: string;
  readonly title: string;
  readonly target: ThemeTarget;
  readonly authority: AuthorityId;
  readonly authorityPath: string;
  readonly authoritySha256?: string;
  readonly viewport: ViewportId;
  readonly inputModes: readonly InputMode[];
  readonly referenceState: string;
  readonly implementationState: string;
  readonly capture: CaptureDefinition;
  readonly measurementProfile: string;
  readonly assertionProfile: string;
  readonly allowedDeviationIds: readonly string[];
}

interface CaptureDefinition {
  readonly kind: 'viewport' | 'locator';
  readonly referenceLocator?: string;
  readonly implementationLocator?: string;
  readonly maskProfiles?: readonly string[];
}
```

Manifest validation rejects duplicate IDs, unknown authorities/viewports,
missing paths, invalid hashes, unknown drivers, unknown measurement/assertion
profiles, and deviation IDs absent from the target ledger. Paths must be
repository-relative and cannot escape the repository.

### Required viewport matrix

The exact CSS viewports are:

| ID | Width x height | Purpose |
|---|---:|---|
| `wide` | 1600 x 900 | canonical desktop composition and Catalog |
| `standard` | 1440 x 900 | comparison with the maintained wide Lab surface |
| `medium` | 1180 x 800 | toolbar pressure and integrated controls |
| `tablet` | 768 x 1024 | portrait reflow |
| `compact` | 430 x 932 | large phone and coarse pointer |
| `compact-small` | 390 x 844 | small phone and existing Lab baseline |
| `landscape-short` | 844 x 390 | short-height reachability |
| `zoom-200` | 800 x 450 | 200-percent zoom equivalent |

The Widget Overhaul's `1024 x 768` and `1024 x 600` states are also mandatory
for scenarios whose audited surface calls for them. A scenario lists only the
viewports that reveal a meaningful contract, but the macro-shell suite covers
the complete matrix.

Chromium device scale factor is fixed at `1`; fonts are local; animations and
carets are disabled for capture; timezone and color scheme are explicit; and
the driver waits for fonts plus two animation frames before measurement.

## Evidence flow

For every scenario, the runner performs these stages in order:

1. Validate the scenario manifest and authority hash before starting a browser.
2. Open the preserved or approved reference through the repository's static
   server and run its independent reference driver.
3. Assert the reference reached the requested semantic state. Reference setup
   failure is an infrastructure error, never a visual discrepancy.
4. Capture the reference image and normalized measurements.
5. Open a fresh Lab state, clear only the Lab's documented local keys, select
   the target theme, and run the implementation driver.
6. Assert the Lab reached the requested state and capture actual evidence.
7. Normalize browser measurements to CSS pixels and compare named geometry,
   styles, content, accessibility, and state assertions.
8. Generate an overlay and diagnostic pixel diff without overwriting either
   source image.
9. Attach a deterministic JSON report and the relevant images to the
   Playwright result.
10. Match every failing comparison to an open discrepancy ledger item or fail
    with an unledgered-discrepancy error.

Successful routine runs retain only structured summaries. Failed runs retain
all evidence locally and upload it in CI. An explicit inspection command may
retain the complete evidence set for human review without changing baselines.

## Measurements and comparison

Pixel comparison is diagnostic, not the sole acceptance mechanism. Each
scenario combines the smallest relevant profiles from these groups:

- **geometry:** bounding boxes, grid tracks, gaps, toolbar widths, shelf
  heights, composer bounds, stage bounds, scroll ownership, and visible area;
- **computed style:** fonts, sizes, line heights, weights, colors, borders,
  radii, shadows, filters, material opacity, and overflow;
- **semantic content:** visible labels, Widget identity, state copy, action
  ownership, category totals, and required regions;
- **interaction:** focus order, command result, drag/drop, cancellation,
  resizing, tabbing, floating, persistence, and exact-origin restoration;
- **accessibility:** roles, names, keyboard route, focus visibility, contrast,
  reduced motion, coarse-pointer targets, and reflow; and
- **visual:** reference image, actual image, overlay, and absolute pixel diff.

Measurements use stable semantic locators, never line-number-derived selectors.
Normalized JSON sorts object keys and rounds geometry to two decimal places.
Every numeric comparison declares an explicit tolerance justified by rendering
behavior. Structural relationships such as shared edges, ordering, no-overflow,
and containment remain exact.

The reference capture remains visible alongside the actual even when a
structured tolerance passes; small local tolerances cannot conceal a globally
wrong composition.

## Discrepancy ledger

Each target owns a checked-in Markdown ledger with a machine-readable table.
Every row has:

| Field | Meaning |
|---|---|
| ID | stable `DC-`, `PN-`, or `BN-` identifier |
| Category | structure, geometry, visual, behavior, content, accessibility, or infrastructure |
| Severity | P0, P1, P2, or P3 |
| Authority | exact mockup, design document, approved frame, or Pom contract |
| Scenario | manifest scenario ID |
| Evidence | deterministic report/image attachment names |
| Diagnosis | concrete cause, not only the symptom |
| Status | open, fixing, verified, deviation-requested, or closed |
| Regression | test or assertion that prevents recurrence |
| Deviation | approval note when a literal match is intentionally rejected |

Severity is defined as:

- **P0:** reference integrity failure, data/security boundary break, unusable
  primary flow, or a change that invalidates conformance evidence;
- **P1:** missing required feature/state, wrong macro structure, inaccessible
  interaction, lost persistence, or severe responsive failure;
- **P2:** material geometry, styling, content, or interaction mismatch visible
  in ordinary use;
- **P3:** minor polish mismatch with no feature, comprehension, accessibility,
  or layout consequence.

A target may freeze only with zero open P0/P1 rows, zero unapproved P2 rows,
and only reviewed P3 rows. A deviation is not a tolerance increase: it records
the competing authority, rationale, bounded scenario, reviewer, and regression.

## Failure model

The runner distinguishes these failures:

- `REFERENCE_HASH_DRIFT`: preserved or approved reference bytes differ;
- `REFERENCE_SETUP_FAILED`: the reference driver did not reach its declared
  state;
- `IMPLEMENTATION_SETUP_FAILED`: the Lab driver did not reach its state;
- `MANIFEST_INVALID`: scenario metadata is incomplete or inconsistent;
- `MEASUREMENT_FAILED`: a required locator or computed value is unavailable;
- `UNLEDGERED_DISCREPANCY`: a comparison failed without an open ledger row;
- `DISCREPANCY_REMAINS`: a known row still fails;
- `STALE_DISCREPANCY`: a closed row has no passing regression evidence; and
- `UNAPPROVED_DEVIATION`: a scenario cites a deviation without its complete
  review record.

Reference integrity and setup failures stop the affected target immediately.
Implementation differences continue through the scenario batch so one run
produces a useful discrepancy set.

After three attempted fixes fail to improve the same discrepancy, work pauses
on that row to revisit structure, authority interpretation, selector quality,
or tolerance rationale. It does not respond by raising a threshold or looping
blindly.

## Deep Current delivery sequence

### 1. Harness and truthful red baseline

Land manifest validation, dual drivers, evidence collection, comparison,
ledger validation, deterministic reports, and a small macro scenario set. The
first conformance run is expected to fail against the current generic Lab. Its
ledger becomes the bounded work queue.

### 2. Macro shell restoration

Restore the Atmospheric Workbench silhouette and geometry in source-owned
Svelte recipes and Lab composition:

- top shelf and story lockup;
- left and right integrated toolbars;
- image-led center stage and reading veil;
- portrait/character strip;
- shelf, tab, and footer-safe docking zones;
- bottom composer proportions and ownership; and
- the complete responsive macro matrix.

The implementation remains Pom-owned Svelte and framework-neutral runtime. It
must not copy the preserved standalone JavaScript as production source.

### 3. Interaction parity

Restore and freeze resizing, shelf creation/insertion, tab merge/reorder,
floating, invalid-drop and pointer-cancel restoration, focus/Back behavior,
keyboard/touch equivalents, and persistence across Scene, Library, and
Settings.

### 4. Audited Widget parity

Create a manifest scenario for each of the 49 implemented ledger surfaces.
Scenarios cover the authoritative ready projection and the smallest additional
state set needed to prove named error/empty/pending/focused/responsive/action
contracts. Shared renderer recipes are extracted when evidence repeats; Widget
state and role remain explicit rather than encoded as theme branches.

The 94 Catalog identities, category totals `{ story: 12, library: 19, systems:
21, settings: 39, extensions: 3 }`, search synonyms, visual/compact modes,
placement eligibility, and safe fallback blueprints remain intact. The 46
surfaces outside the implemented ledger receive discovery previews and honest
unavailable/fallback treatment only.

### 5. Closure and freeze

Resolve the Deep Current ledger under the severity gate. Promote structured
measurements and the minimum Windows screenshots needed to prevent regression.
Preserved hashes, the 95/95 oracle, the 212/212 oracle, all acquired Pom tests,
and the full repository check must remain green.

## Pom Neutral and Bunny sequence

Deep Current's component tree and behavior matrix become the shared frozen
architecture. Pom Neutral and Bunny then follow the same sequence:

1. author original wide, compact, focus, Catalog, error/pending, and
   coarse-pointer reference frames from the frozen semantic states;
2. record the approved reference hashes and target-specific visual intent;
3. add scenarios that reuse the implementation drivers and behavior profiles;
4. vary only theme definitions, semantic assets, and token-driven recipe
   presentation;
5. resolve each target ledger under the same severity gate; and
6. freeze the reviewed structured baselines and minimum reference frames.

Pom Neutral is a neutral, modern, macOS-like experience, but uses original Pom
geometry, icons, assets, and composition rather than Apple trade dress. Bunny
is an original pastel Japanese kawaii direction with soft materials, rounded
geometry, playful type roles, and restrained bunny motifs. Both must retain
readability, complete technical states, and the unchanged workbench identity.

If a target cannot be expressed without a component fork, the target design is
revised or the shared semantic contract is generalized for all themes. Recipes
never branch on `deep-current`, `pom-neutral`, or `bunny` IDs.

## Test and CI topology

### Cross-platform lane

Ubuntu and Windows run:

- manifest, authority-hash, ledger, and report unit tests;
- all framework-neutral and Svelte tests;
- preserved 95/95 and 212/212 harnesses;
- conformance functional, semantic, geometry, responsive, keyboard,
  coarse-pointer, accessibility, and state assertions; and
- the complete repository `npm run check` gate.

### Canonical visual lane

Windows is the canonical pixel environment because the existing repository
already reviews visual baselines there. It runs reference/actual capture,
overlays, diffs, and checked-in screenshot comparisons. Ubuntu still exercises
the same drivers and structured comparisons but does not authoritatively fail
on OS-specific rasterization pixels.

CI uploads Playwright reports, traces, reference images, actual images,
overlays, diffs, normalized measurements, and discrepancy summaries when a
conformance step fails. Successful jobs do not publish large image sets.

### Local commands

The tranche adds focused commands with these responsibilities:

- `npm.cmd run test:conformance:unit` validates manifests, ledgers, hashes,
  normalization, and comparison logic;
- `npm.cmd run test:conformance:deep-current` runs Deep Current scenarios;
- `npm.cmd run test:conformance` runs every frozen target; and
- `npm.cmd run inspect:conformance -- --scenario <id>` retains the full evidence
  set for one human review.

The root `npm.cmd run check` includes all frozen target gates. During the
truthful-red implementation phase, incomplete target scenarios run through an
explicit development command and may not be hidden as a permanent CI skip.
Before merge, every scenario committed as a required gate must pass or cite a
complete approved deviation.

## Security, preservation, and toolkit boundaries

- All authority and baseline paths are repository-relative and validated
  against traversal.
- Drivers do not fetch remote assets or execute network requests outside the
  loopback static servers.
- No credentials, adopter data, or real story data enter captures.
- Mockup hashes are verified before rendering and still verified by the
  extraction gate.
- The conformance harness may read preserved HTML; application and package code
  may not import it.
- Runtime dependencies remain `contracts -> layout -> core -> svelte` plus the
  separate `contracts -> theme` path. Testkit and conformance consume public
  APIs only.
- `@pomegranate-ui/svelte` stays headless. The Workbench Lab and copy-owned
  recipes demonstrate one composition; they do not become a branded turnkey
  frontend.
- Generated evidence cannot mutate preserved files or approved reference
  frames.

## Completion criteria

The conformance goal is complete when:

1. the deterministic dual-driver system and local commands are documented and
   tested;
2. every preserved authority hash is verified before use;
3. Deep Current's macro shell, interactions, all 49 implemented surfaces, and
   all 94 Catalog identities satisfy the ledger gate;
4. Pom Neutral and Bunny have approved original reference packs and satisfy the
   same shared behavior and ledger gates;
5. the three targets switch immediately without remounting or losing live UI
   state;
6. Windows canonical visual and Windows/Linux structured conformance lanes are
   green;
7. `npm.cmd run check` passes with preserved harnesses still at 95/95 and
   212/212;
8. no preserved mockup, Design Bible, or Widget specification byte changed;
9. the static relative-base Lab build remains suitable for the later GitHub
   Pages showcase; and
10. the implementation is reviewed, merged without bypassing branch
    protection, and remote `main` is verified at the merge commit.

Public Pages deployment is the next delivery tranche, not a substitute for
these conformance gates.
