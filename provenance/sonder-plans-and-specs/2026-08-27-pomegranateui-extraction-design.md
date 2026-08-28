# PomegranateUI Extraction and Incubation Design

**Date:** 2026-08-27

**Status:** Approved direction; written specification awaiting product-owner review

**Source project:** Sonder Engine `interface`

**Destination project:** PomegranateUI

## Purpose

PomegranateUI is a developer toolkit for authors building new AI roleplaying
frontends, including alternatives to SillyTavern. It is not a branded end-user
frontend. It supplies difficult, reusable interaction behavior while adopting
developers retain ownership of their application, branding, information
architecture, markup, layout choices, and backend integration.

This design defines how to establish PomegranateUI as an independent repository
without losing the active Sonder Workbench and Widget work. The extraction must
preserve the complete current design corpus, executable regression evidence,
assets, licenses, provenance, and integration knowledge before any TypeScript
rewrite or genericization begins.

## Product boundary

PomegranateUI owns reusable frontend infrastructure:

- Panel identity, layout, persistence envelopes, and migration behavior;
- Widget manifests, instances, placement, lifecycle, and recovery;
- the Widget Catalog and discovery/filtering behavior;
- shelves, slots, tabs, docking, floating, resizing, and undo;
- responsive staging and input-equivalent interaction;
- accessible focus, announcements, keyboard placement, and cancellation;
- semantic theme tokens and source-owned component foundations;
- framework-neutral commands, events, capability declarations, and test
  drivers; and
- React-first bindings and components built on a framework-neutral TypeScript
  core.

Sonder continues to own its application and backend truth:

- routes, authentication, saves, stories, frames, and archives;
- Director pipeline stages and runtime status;
- Living World, Charter, cognition, and information-firewall semantics;
- provider configuration and server-side persistence;
- extension-runtime integration; and
- conversion between Sonder data and PomegranateUI contracts.

Sonder is the first demanding consumer of PomegranateUI, not the definition of
the toolkit's internal model.

## Non-negotiable extraction rule

Every in-scope source artifact, contract, test, Widget or renderer surface,
asset, license, and evidence record must be one of:

1. preserved byte-for-byte in PomegranateUI;
2. mapped to executable native PomegranateUI evidence;
3. assigned to the Sonder integration boundary; or
4. retired later through an explicit, approved change record.

The initial extraction permits no retirement. Unaccounted items fail the
extraction gate.

## Why extraction and rewrite are separate

The current implementation is not TypeScript. Sonder's production frontend is
plain JavaScript, and the Workbench candidates are large HTML files containing
embedded JavaScript and CSS. Translating them while moving them would combine
three sources of uncertainty: file transfer, product-boundary changes, and
implementation changes.

PomegranateUI therefore starts with two evidence lanes:

- **Legacy evidence lane:** preserved HTML prototypes and their browser
  harnesses run unchanged as executable behavioral oracles.
- **Native toolkit lane:** strict TypeScript packages acquire unit, component,
  and Playwright tests contract family by contract family.

A contract becomes `dual-green` only when its preserved evidence remains
available and its native replacement passes. The legacy lane may be retired
only after every mapped contract has native evidence and a later approved
change record authorizes removal.

## Extraction baseline

The current Sonder checkout is an active working tree. The extraction baseline
must not be inferred from an arbitrary timestamp or copied while a Widget cycle
is still changing it.

The baseline-selection procedure is:

1. pause new Widget implementation at the end of a documented green cycle;
2. inventory tracked, staged, modified, and untracked paths;
3. separate the canonical Workbench calibration from the active Widget
   overhaul checkpoint into coherent commits;
4. run and record the applicable browser harnesses;
5. record the exact source commit and SHA-256 for every in-scope file;
6. record excluded dirty paths without modifying or deleting them; and
7. mark the resulting commit as the sole PomegranateUI extraction baseline.

The observed repository state during specification work is context only, not
the baseline. Active work may continue until the explicit checkpoint is
selected.

## Complete source corpus

The extraction inventory begins with these evidence classes:

- the canonical Atmospheric Workbench editable source, preview wrapper,
  browser harness, README, fonts, and license files;
- the active Widget overhaul editable source, preview wrapper, browser
  harness, README, fonts, licenses, screenshots, and renders;
- the Panels, Widgets, Widget Catalog, icon, state, persistence, responsive,
  accessibility, adoption, and overhaul design documents;
- the complete Widget inventory and every audited surface in the overhaul
  ledger;
- applicable Design Bible chapters, decisions, reference notes, checksums, and
  change records;
- approved implementation plans and review evidence that explain behavioral
  intent;
- tracked frontend contract and browser tests that prove generic UI behavior;
- tracked tests that remain in Sonder but prove its consumer boundary;
- icon manifests, selected source records, hashes, and third-party notices;
  and
- relevant source commits and branch identity.

Temporary extracted repositories and recoverable candidate snapshots are not
silently treated as real suite changes. They receive an inventory disposition,
but only tracked or explicitly adopted evidence enters the authoritative
baseline.

## Repository structure

The independent repository begins with this structure:

```text
PomegranateUI/
  apps/
    workbench-lab/
    documentation/
  design/
    foundations/
    widget-specifications/
  examples/
    mock-roleplay-backend/
    sonder-integration/
  packages/
    contracts/
    core/
    layout/
    react/
    testkit/
    theme/
  prototypes/
    sonder-baseline/
      atmospheric-workbench/
      widget-overhaul/
  provenance/
    extraction-manifest.json
    extraction-ledger.md
    source-commits.md
  registry/
    widgets/
```

The prototypes remain visibly named as a Sonder-derived baseline so
provenance is honest. Product packages and public contracts use neutral
PomegranateUI terminology. The Workbench Lab is a development and
demonstration consumer, not a mandatory application shell.

Examples use the symbolic package scope `@pomegranate-ui/*`. Package-name and
scope availability must be checked before public publication. Local and private
incubation do not depend on that availability.

## Migration manifest

`provenance/extraction-manifest.json` is the machine-readable completeness
authority. Each entry records:

```json
{
  "contractId": "POM-LAYOUT-DRAG-RESTORE-001",
  "sourcePath": "docs/experiments/sonder-atmospheric-workbench/sonder-drag-regression.html",
  "sourceCommit": "resolved-by-baseline-capture",
  "sourceSha256": "resolved-by-baseline-capture",
  "sourceEvidence": "Settings invalid release restores the exact Widget origin",
  "classification": "toolkit-generic",
  "destinationOwner": "@pomegranate-ui/layout",
  "destinationEvidence": [],
  "status": "preserved-verbatim"
}
```

The two baseline values above are populated with the selected Git commit and
the file's computed SHA-256 by the baseline-capture tool.

Valid classifications are:

- `toolkit-generic`;
- `reference-theme`;
- `sonder-integration`;
- `historical-evidence`; and
- `asset-or-license`.

Valid states are:

- `preserved-verbatim`;
- `native-test-added`;
- `dual-green`;
- `sonder-owned`; and
- `retired-approved`.

The extraction gate rejects `retired-approved`. That state exists for later
versioned maintenance after the baseline has been proven complete.

## Stable contract identity

Every legacy browser case, documented acceptance item, and Widget-ledger row
receives a stable PomegranateUI contract ID. IDs describe the behavior rather
than its current file or implementation. Families include:

- `POM-PANEL-*`;
- `POM-WIDGET-*`;
- `POM-CATALOG-*`;
- `POM-LAYOUT-*`;
- `POM-DRAG-*`;
- `POM-PERSIST-*`;
- `POM-RESPONSIVE-*`;
- `POM-A11Y-*`;
- `POM-THEME-*`; and
- `POM-INTEGRATION-SONDER-*`.

The preserved harness may retain its current titles. A generated sidecar maps
those titles and source locations to stable IDs, avoiding a mutation of the
oracle merely to introduce the new naming system. Native tests cite the same
IDs.

## Test ownership

Tests move according to the authority they prove:

| Evidence | Owner |
|---|---|
| Panel, Catalog, docking, floating, placement, responsive behavior | PomegranateUI |
| Widget manifests, lifecycle, state families, and migrations | PomegranateUI |
| Theme, focus, keyboard, announcement, and accessibility behavior | PomegranateUI |
| Generic transcript, composer, and capability behavior | PomegranateUI |
| Mock backend and clean-consumer package behavior | PomegranateUI |
| Sonder routes, authentication, saves, and server persistence | Sonder |
| Living World, Charter, Director, and engine semantics | Sonder |
| PomegranateUI-to-Sonder conversion and integration | Sonder consumer suite |
| Frozen visual and interaction provenance | PomegranateUI |

A test that stays in Sonder is still listed in the extraction ledger when it
proves a PomegranateUI integration boundary. Physical movement is not required
for complete accountability.

## Continuous-integration gates

PomegranateUI CI must fail when:

- a baseline artifact is missing or hash-mismatched;
- a legacy browser case lacks a stable contract ID;
- a Widget-ledger row lacks a destination or Sonder owner;
- a native test cites an unknown contract;
- a contract loses all executable or documented evidence;
- an asset loses its license or provenance record;
- a preserved browser harness no longer runs in its recorded environment;
- TypeScript type checking, unit tests, component tests, or browser tests fail;
- the packed distribution fails in a clean example consumer; or
- viewport, input, accessibility, or state-family coverage shrinks without an
  approved contract change.

The generated migration report includes total baseline contracts, preserved
artifacts, assigned Widget surfaces, native `dual-green` contracts,
Sonder-owned contracts, awaiting-native-port contracts, and unaccounted
contracts. Native coverage may increase incrementally; unaccounted coverage
must always be zero.

## Native implementation approach

PomegranateUI production code uses strict TypeScript. The core and contracts
packages do not depend on a UI framework. React is the first supported binding
and component implementation. Backend interfaces exchange plain data,
commands, events, and capability declarations rather than React components or
backend-specific Widget objects.

Visible components are source-ownable where deep customization is expected.
Stable machinery such as state transitions, layout operations, migrations, and
contract validation remains in versioned packages.

Native migration proceeds one contract family at a time:

1. preserve and map the legacy evidence;
2. add failing native tests for the selected stable contract IDs;
3. implement the smallest package behavior that satisfies them;
4. run both evidence lanes;
5. inspect required browser states at the recorded viewports;
6. install the packed package in a clean consumer fixture;
7. run the corresponding Sonder consumer tests; and
8. mark contracts `dual-green` only when every required check succeeds.

The HTML prototype is not translated line by line. It remains the oracle while
behavior is extracted behind deliberate public contracts.

## Sonder integration and dependency boundary

PomegranateUI does not use a Git submodule. It publishes versioned package
tarballs or prereleases. Sonder pins an exact version and owns an adapter that
converts its runtime state and commands to PomegranateUI contracts.

PomegranateUI's mock consumer proves independence from Sonder. Sonder's
consumer suite proves compatibility with a complex real backend. A generic fix
lands in PomegranateUI first; a Sonder-specific fix remains in Sonder unless it
reveals a missing generic contract.

During incubation, the example Sonder integration in PomegranateUI contains
fixtures and explanatory adapters only. It does not import Sonder server code
or become a second owner of engine semantics.

## Assets, licensing, and publication

All imported font license files, icon provenance records, and asset hashes move
with the artifacts they cover. The root repository license and publication
model require an explicit product-owner decision before public release. Until
then, PomegranateUI may be created and exercised as a local or private
incubator, but no npm or public GitHub publication occurs.

Generated or selected third-party assets may enter reusable packages only when
their recorded license permits that distribution. Provenance files remain in
the published package or its accompanying notices as required.

## Failure handling and rollback

The extraction is additive until cutover:

- no source artifact is deleted from Sonder during baseline capture;
- copying is verified by hash before either repository changes authority;
- legacy and native evidence coexist;
- Sonder retains its prior UI dependency until a pinned PomegranateUI package
  passes the consumer suite; and
- a failed tranche rolls back by leaving the previous pinned package and
  source artifacts untouched.

The active Sonder dirty worktree is never cleaned, reset, or used as an
implicit transfer mechanism. Each commit stages only reviewed paths.

## Delivery tranches

The project is intentionally decomposed so the first implementation plan stays
bounded.

### Tranche 0: Sonder baseline checkpoint

- finish the active green Widget cycle;
- inventory the complete working tree;
- commit the canonical calibration and Widget overhaul as separate reviewed
  checkpoints;
- run and record the legacy evidence; and
- select the exact extraction baseline.

### Tranche 1: PomegranateUI repository and lossless import

- create the local/private repository skeleton;
- copy the complete incubating corpus;
- record source commits and hashes;
- add the extraction manifest and ledger;
- assign every source artifact and Widget surface; and
- make the preserved harnesses run from PomegranateUI.

### Tranche 2: Preservation CI

- validate hashes, licenses, stable IDs, and completeness;
- publish the generated migration report;
- install the repository tooling from a clean checkout; and
- prove zero unaccounted contracts.

### Tranche 3: TypeScript foundation

- establish strict TypeScript packages and build outputs;
- implement framework-neutral contracts and test drivers;
- add React bindings and the Workbench Lab shell; and
- verify packed-package installation in a clean consumer.

### Tranche 4: Contract-family migration

- migrate manifests and state families;
- migrate Panel persistence and layout operations;
- migrate Catalog and placement behavior;
- migrate responsive and accessibility contracts;
- migrate theme foundations; and
- migrate generic roleplaying components in independently reviewable waves.

### Tranche 5: Sonder consumer integration

- implement the exact-version Sonder adapter;
- run the mapped consumer contract suite;
- compare required browser states; and
- prove rollback to the previous Sonder UI path.

### Tranche 6: Authority cutover

- tag the first PomegranateUI prerelease;
- update Sonder documentation to the pinned PomegranateUI authority where
  appropriate;
- retain Sonder-specific requirements locally;
- remove duplicated generic authority only after dual-green evidence; and
- record every deliberate retirement through change control.

The first implementation plan covers Tranches 0 through 2 only. TypeScript
implementation begins in a later plan after lossless import is proven.

## Cutover gates

No authority moves from Sonder until all of the following are true:

- every baseline file has a verified destination and hash;
- every legacy browser case has a stable contract ID;
- every audited Widget or renderer surface has an owner;
- licenses and provenance are complete;
- preserved harnesses pass from the PomegranateUI repository;
- the migration report shows zero unaccounted contracts;
- PomegranateUI has a tagged prerelease or immutable package artifact;
- Sonder pins that exact artifact and its consumer tests pass; and
- rollback remains available.

No successful test class substitutes for another: hashes prove transfer,
legacy harnesses prove preservation, native tests prove the TypeScript
implementation, screenshots prove visual comparison, and Sonder consumer tests
prove real integration.

## Definition of success

The extraction is successful when PomegranateUI independently contains the
complete, verifiable incubating corpus; can run the preserved regression
evidence; reports zero unaccounted contracts; and provides a bounded path for
incremental TypeScript migration without making PomegranateUI a branded
frontend or duplicating Sonder's backend authority.
