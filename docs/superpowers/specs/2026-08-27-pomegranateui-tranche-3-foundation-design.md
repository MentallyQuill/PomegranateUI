# PomegranateUI Tranche 3 TypeScript Foundation Design

**Date:** 2026-08-27  
**Status:** Approved for implementation  
**Repository:** `MentallyQuill/PomegranateUI`  
**Baseline:** `0fb98e43f303d62c42ef5c74e6ae38126f68161d`

## Goal

Tranche 3 establishes PomegranateUI's native toolkit lane without turning the
project into an application frontend. It delivers a framework-neutral
TypeScript core, React bindings, a reusable Panel/Widget vertical slice,
native contract evidence, clean-consumer packaging, and a private-repository
release gate. The preserved Sonder prototypes remain executable oracles.

The approved first slice covers:

- Widget manifest registration and stable Widget instances;
- source-owned React rendering;
- Panel creation, activation, and ordering;
- command-driven docked and floating placement;
- versioned JSON persistence, hydration, and exact restoration; and
- packed-package use by a backend-neutral consumer and a Sonder-shaped
  boundary fixture.

Catalog discovery, pointer-driven drag/drop, nested sub-panels, responsive
geometry, accessibility placement flows, theming, and production Sonder
cutover remain later contract-family migrations.

## Product and authority boundary

PomegranateUI owns reusable interaction machinery. Adopters own their
application shell, information architecture, branding, routes,
authentication, backend, saves, and domain meaning.

No PomegranateUI package imports Sonder server or frontend code. Backend
adapters exchange JSON-safe data, commands, events, and capability
declarations. React components never become backend objects, and persisted UI
state never becomes a shadow save format for an adopter's story or campaign.

The repository remains a private incubator. Tranche 3 produces local package
tarballs and verifies them in clean consumers; it does not publish to npm or
make a public-license decision.

## Package architecture

PomegranateUI uses npm workspaces and separately packable packages. Runtime
dependencies flow in one direction.

| Package | Responsibility | Allowed dependencies |
|---|---|---|
| `@pomegranate-ui/contracts` | JSON-safe IDs, manifests, commands, events, capabilities, snapshots, results, and runtime codecs | No UI framework or DOM dependency |
| `@pomegranate-ui/layout` | Pure Panel ordering, docked/floating placement, normalization, persistence envelopes, and migrations | `contracts` |
| `@pomegranate-ui/core` | Widget registry, instances, Panels, deterministic command dispatch, subscriptions, and invariants | `contracts`, `layout` |
| `@pomegranate-ui/react` | Provider, hooks, source-ownable structural primitives, and renderer registry | `contracts`, `core` as runtime dependencies; React as a peer dependency |
| `@pomegranate-ui/testkit` | Public conformance drivers, fixtures, contract-ID reporting, and adapter assertions | Public package APIs only |

`@pomegranate-ui/theme` stays reserved during this slice. The Workbench Lab
may use application-local CSS to make states inspectable, but that CSS is not
promoted into a theme contract.

Each implemented package emits ESM JavaScript, declaration files, source maps,
and an explicit export map. Strict TypeScript applies across the workspace,
including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
declaration generation. Internal source paths are not public exports.

## Public state model

The contracts package defines branded string aliases for public identity while
keeping serialized values ordinary strings. The first model includes:

- `WidgetManifest`: stable type, manifest version, title, optional default
  placement, declared capabilities, and JSON-safe default configuration;
- `WidgetInstance`: stable instance id, Widget type, manifest version, and
  JSON-safe UI configuration;
- `PanelState`: stable Panel id, name, template id, order, and optional template
  configuration;
- `DockedPlacement`: Panel id, edge or main region, shelf id, and order;
- `FloatingPlacement`: Panel id plus finite x, y, width, height, and stacking
  order in the Workbench coordinate space;
- `WorkbenchState`: schema revision, state revision, active Panel, ordered
  Panels, Widget instances, and exactly one placement per instance; and
- `LayoutSnapshotV1`: the persisted JSON envelope for the same UI-owned data.

The model enforces these invariants:

1. Panel, Widget instance, and Widget type identities are unique and stable.
2. Every Widget instance has exactly one valid placement.
3. Every placement references an existing Panel and instance.
4. Dock orders are contiguous after normalization.
5. Floating geometry is finite, positive where required, and preserved exactly
   once accepted.
6. The active Panel exists whenever Panels exist.
7. Backend/domain state is not present in the snapshot.

Unknown renderer types may survive hydration as unresolved Widget instances so
a temporarily absent extension does not erase layout. React renders a named
unavailable fallback until an adopter registers the renderer. Structurally
invalid snapshots are rejected without mutating the last good state.

## Commands, events, and atomicity

The core exposes a deterministic store created from an initial state and a
manifest registry. Public mutation occurs through typed commands:

- register or unregister a Widget manifest;
- create, activate, rename, reorder, or remove a Panel;
- create or remove a Widget instance;
- place or move a Widget into a docked or floating destination; and
- hydrate a validated layout snapshot.

Dispatch returns a discriminated result. Successful commands return the new
revision and emitted events. Rejected commands return a stable error code,
message, and relevant ids. A rejected command preserves the prior state by
reference as well as by value; no partial move is observable.

Events describe accepted UI transitions such as `panel.created`,
`panel.activated`, `panel.reordered`, `widget.created`, `widget.placed`, and
`layout.hydrated`. Events are notifications, not a second mutable store. The
first slice does not implement networking, collaboration, or an event-sourced
backend.

## Persistence and restoration

`@pomegranate-ui/layout` owns the `pomegranate.ui.layout.v1` envelope, runtime
validation, normalization, and a migration registry. It does not own storage.
Adopters provide a small asynchronous `LayoutStorage` interface with `load`,
`save`, and optional `remove` operations.

Encoding is deterministic. Hydration follows this sequence:

1. parse and validate the envelope without touching live state;
2. migrate known older schemas through registered pure migrations;
3. normalize ordering and safe numeric bounds;
4. retain unresolved Widget types without inventing a renderer;
5. validate all cross-references and invariants; and
6. atomically replace live UI state or return a named diagnostic.

Unknown future schemas and malformed cross-references fail closed. The caller
retains the last good state and may show recovery UI. PomegranateUI never
silently resets an adopter's layout after a decode failure.

The React package may provide persistence hooks over `LayoutStorage`, but it
does not call `localStorage` directly. The Workbench Lab supplies a local
storage adapter as application code.

## React binding and source ownership

`@pomegranate-ui/react` is a binding over the store, not a second state model.
It provides:

- `WorkbenchProvider` and stable subscription hooks;
- Panel tab, Panel surface, dock, floating layer, and Widget frame primitives;
- a generic `WidgetRendererRegistry<THostContext>` keyed by Widget type; and
- explicit fallback rendering for unresolved or failed renderers.

Renderers receive the Widget instance, host context, declared capabilities,
and the core dispatcher. The generic host context is supplied by the adopter
and is never persisted by PomegranateUI. Renderer failures are contained to
the owning Widget frame and report a named error surface; they do not corrupt
the store or disable sibling Widgets.

Structural primitives expose stable roles, labels, data attributes, slot
props, and class-name hooks. They ship no Sonder branding or information
architecture. Adopters can wrap or source-own visible composition while the
versioned packages retain state, placement, persistence, and conformance
behavior.

## Workbench Lab and clean consumers

`apps/workbench-lab` is an inspectable React application that exercises the
public packages. It includes two backend-neutral sample Widgets, at least two
Panels, dock and float command controls, Panel creation and ordering controls,
save/reload recovery, an event log, and deliberate invalid-command controls.
It does not become package authority.

`examples/mock-roleplay-backend` is the clean independent consumer. Verification
packs each package, installs the tarballs into a temporary clean checkout, and
builds/tests the consumer without workspace symlinks or Sonder code.

`examples/sonder-integration` contains only fixtures and an explanatory adapter
that translates a small Sonder-shaped projection into plain PomegranateUI host
context and capabilities. An import-boundary test rejects any dependency on
the Sonder repository or server modules. Production Sonder adoption and
cutover remain Tranche 5 work; this tranche proves that Sonder can remain a
consumer rather than becoming PomegranateUI's data model.

## Native testing and dual-green migration

Native behavior is developed test-first. The verification stack includes:

- strict TypeScript build and public API type tests;
- unit tests for codecs, layout operations, core invariants, command atomicity,
  renderer registration, and error isolation;
- React component tests for bindings and structural accessibility;
- Playwright tests against the Workbench Lab;
- packed-tarball installation and build in the clean mock consumer;
- the Sonder-shaped import-boundary fixture; and
- the unchanged preserved harnesses (`95/95` and `212/212`).

The first dual-green wave covers these existing stable contracts:

- `POM-PANEL-07856BFE9A` and `POM-PANEL-DF4EC7C581`: Panel activation changes
  active identity without changing the application's story identity;
- `POM-PANEL-0C32491298` and `POM-PANEL-E6D6A0E64B`: menu-command docking adds
  an ordered shelf even when the destination is populated;
- `POM-PERSIST-842D422EB3` and `POM-PERSIST-9FA69F9FC1`: a user Panel persists
  with its template and order; and
- `POM-PERSIST-28DFDC9A8F` and `POM-PERSIST-D50D69D3C4`: reordered Panel
  sequence persists after reload.

The native reorder proof uses explicit accessible reorder controls because
pointer-driven Panel drag is outside this slice. Pointer interaction contracts
remain preserved-only. A contract changes to `dual-green` only after its named
native test passes, its destination evidence points to that test, both legacy
harnesses remain green, and the completeness verifier confirms zero
unaccounted evidence.

## CI and delivery

The existing preservation matrix remains intact on Windows and Ubuntu. Native
CI adds install, strict typecheck, unit/component tests, build, package-content
inspection, clean-consumer installation, Workbench Lab browser tests, and the
full preservation gate.

All dependency versions and action revisions are pinned. Generated reports
remain deterministic. The final delivery requires:

- clean PomegranateUI and Sonder worktrees;
- local and remote `main` at the same reviewed commit;
- both CI platforms green;
- eight contracts reported `dual-green` and all other baseline contracts still
  assigned;
- zero retired or unaccounted contracts;
- no import of Sonder code into a PomegranateUI package or example; and
- no public npm publication or authority cutover.

## Failure and rollback behavior

Implementation is additive. The legacy evidence lane remains unchanged while
the native lane grows. If native packaging or consumer verification fails,
Sonder keeps its existing UI path and no contract status changes to
`dual-green`. A rejected persistence migration leaves the prior snapshot and
live state available for recovery. A failed renderer is isolated to its Widget
frame. A failed CI run is fixed in PomegranateUI before `main` advances.

