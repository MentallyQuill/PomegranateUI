# PomegranateUI Svelte View Layer and Framework-Portability Design

- **Date:** 2026-08-27
- **Status:** Approved implementation direction
- **Repository:** `MentallyQuill/PomegranateUI`
- **Amends:** `2026-08-27-pomegranateui-tranche-3-foundation-design.md`

## Decision

PomegranateUI will maintain one official view technology: Svelte. The project
will not maintain parallel React, Svelte, Solid, or Vue component bindings
without future evidence of sustained adopter demand and separately approved
scope.

The reusable toolkit remains framework-portable below the view boundary.
PomegranateUI's public promise is:

> PomegranateUI behavior can be adopted from any JavaScript frontend
> framework. Its maintained reference UI uses Svelte.

This is not a promise that prebuilt visible components install unchanged into
every framework. Non-Svelte adopters consume the framework-neutral packages,
implement their own presentation, and verify it through public conformance
drivers.

This document supersedes the React-specific package and Workbench Lab choices
in the Tranche 3 design. The Tranche 3 document remains an unchanged historical
record of the approved and implemented first native slice.

## Goals

- Replace the React-first view layer with one maintained Svelte integration.
- Preserve `contracts`, `layout`, and `core` as framework-neutral TypeScript
  packages with no Svelte, React, DOM, or SvelteKit imports.
- Give AI frontend developers editable source recipes, literal public
  contracts, deterministic fixtures, and executable tests rather than an
  opaque application frontend.
- Rebuild the approved Atmospheric Workbench and Widget Overhaul direction as
  the inspectable Svelte Workbench Lab, with explicit visual, geometry,
  responsive, and interaction fidelity evidence.
- Keep difficult Panel, Widget, Catalog, placement, responsive, accessibility,
  command, event, persistence, and error contracts under PomegranateUI
  authority.
- Let adopters own their markup, composition, branding, information
  architecture, layout choices, backend integration, and domain semantics.
- Retire React only after the Svelte path and framework-portable renderer
  conformance are green.

## Non-goals

- PomegranateUI does not become a SvelteKit application shell.
- SvelteKit routing, loaders, form actions, authentication, server modules, and
  deployment adapters are not PomegranateUI package authority.
- This work does not add a second maintained UI binding.
- This work does not use Web Components as a universal rendering layer.
- This work does not publish packages to npm, cut Sonder over to PomegranateUI,
  choose a public license, or change Sonder source.
- This work does not deploy a public demo or configure a production hosting
  provider. It leaves the Lab as a host-ready static artifact whose deployment
  is separately approved work.
- This work does not implement the future public `pom` CLI. Private-incubator
  tooling may prove deterministic recipe copying without defining a public CLI
  contract.
- Existing React code is not retained as a compatibility package after the
  migration gate passes; no public release depends on it.

## Why this shape

Three alternatives were considered and rejected.

1. **Maintain React and Svelte bindings.** This duplicates structural
   components, renderer registries, error handling, accessibility behavior,
   browser evidence, documentation, and every future contract-family change.
   No current adopter evidence justifies that permanent cost.
2. **Ship a complete compiled Svelte component library as the product.** This
   makes Pom's markup and composition the default application architecture and
   weakens the adopter-owned frontend boundary.
3. **Compile Svelte components to custom elements.** This makes them broadly
   mountable but introduces shadow-DOM, styling, context, and server-rendering
   trade-offs that work against source ownership and framework-native
   composition.

The selected model keeps versioned behavior and verification in packages while
shipping editable Svelte recipes as the maintained reference presentation.

## Package and source architecture

Runtime dependencies remain one-directional:

```text
@pomegranate-ui/contracts
            ↓
@pomegranate-ui/layout
            ↓
@pomegranate-ui/core
            ↓
@pomegranate-ui/svelte

@pomegranate-ui/testkit consumes public APIs and renderer harnesses only.
```

### `@pomegranate-ui/contracts`

Continues to own JSON-safe schemas, IDs, manifests, commands, events,
capabilities, results, and persistence envelopes. A Widget manifest names a
Widget type and declares plain capabilities; it never contains a Svelte
component or another framework object.

### `@pomegranate-ui/layout`

Continues to own pure Panel ordering, docked and floating placement,
normalization, persistence, and migration behavior. Presentation packages do
not reimplement layout transitions.

### `@pomegranate-ui/core`

Continues to own Widget registration, instances, deterministic dispatch,
subscriptions, state invariants, and atomic failure behavior. It remains the
only live UI-state authority.

Where a visible recipe currently needs to derive behavior itself, such as
ordered Panel projections, dock projections, floating stacking, or a safe
placement command, that behavior moves into a public framework-neutral
selector or controller before React is retired. A view binding may adapt a
selector to reactivity but may not invent a second state model.

### `@pomegranate-ui/svelte`

Provides the sole maintained framework-specific integration. Svelte is a peer
dependency; SvelteKit is not a dependency. The package contains:

- a reactive adapter over `WorkbenchStore.getState()` and `subscribe()`;
- typed context helpers for the store, host context, and renderer registry;
- a Svelte renderer registry keyed by framework-neutral Widget type;
- headless Panel, Widget, dock, floating-layer, and error-state controllers;
- Svelte actions or bindings for interaction behavior that necessarily touches
  the DOM, such as focus management and later pointer placement; and
- stable attribute, relationship, and diagnostic projections needed by public
  renderer conformance.

The package does not ship product branding, routes, backend assumptions,
application navigation, a default information architecture, or a visual
theme. It avoids rendering fixed application composition where a controller,
action, snippet contract, or prop projection can leave markup under adopter
control.

### `@pomegranate-ui/testkit`

Expands from core-only conformance into two public lanes:

- `runCoreConformance` continues to prove framework-neutral state, placement,
  persistence, and host-boundary behavior.
- `runRendererConformance` proves a frontend implementation through a public
  harness without importing Svelte, React, package internals, or adopter
  internals.

Renderer conformance receives a documented harness that mounts a fixture,
performs semantic operations, and exposes the resulting DOM and focus state.
The driver owns literal assertions for roles, names, ARIA relationships,
keyboard behavior, placement controls, focus movement, missing renderers,
failed renderers, and stable contract attributes. Adopters may implement the
harness with their framework's normal testing tools.

Every renderer assertion maps to stable contract IDs and reports frozen plain
results with literal diagnostics, matching the core conformance model.
The testkit's own tests exercise the public driver through both the Svelte
reference harness and a minimal framework-neutral DOM harness. The latter is a
test fixture, not a second maintained view binding.

### Source-owned Svelte recipes

Editable reference components live in a deterministic Svelte recipe registry,
not inside the framework-neutral packages. Initial recipes cover the existing
native vertical slice:

- Panel tabs and accessible reorder controls;
- the active Panel surface and dock regions;
- Widget frame, title, action controls, and placement state;
- the floating layer;
- unresolved-renderer status; and
- failed-renderer containment and recovery presentation.

Recipes import versioned selectors, controllers, contexts, and actions. They
do not copy state transitions, persistence codecs, or placement algorithms.
Adopters own the copied files and may change the elements, composition,
classes, CSS, copy, and product-specific affordances as long as their chosen
contract profile continues to pass renderer conformance.

Each registry entry records a stable recipe ID, recipe revision, compatible
package range, owned files, SHA-256 hashes, required contract IDs, and declared
dependencies. Registry output is deterministic. Copy tooling refuses to
overwrite a modified destination; updates are reviewed as diffs rather than
silently merged.

The private-incubator tranche proves this model through repository scripts and
clean fixtures. A user-facing `pom add` command remains future work.

## Workbench Lab and consumer proof

`apps/workbench-lab` becomes the demanding Svelte reference consumer. The Lab
keeps its status as an application-owned proof, not package authority. It owns
its copied recipes, sample Widgets, host context, storage adapter, composition,
and CSS.

The Lab is also the native rebuild of the approved mockup direction. The
preserved files remain immutable oracles; they are not embedded, framed, or
served as the new implementation. Authority is applied in this order:

1. `prototypes/sonder-baseline/atmospheric-workbench` owns macro composition,
   typography, material, proportions, top-shelf behavior, docking feedback,
   floating geometry, and exact restoration behavior.
2. `prototypes/sonder-baseline/widget-overhaul` owns the later Panel, Widget,
   Widget Catalog, sub-panel, responsive-height, icon, and audited Widget-state
   direction where it intentionally extends the Atmospheric Workbench.
3. `design/foundations` and `design/widget-specifications` generalize the
   preserved examples into reusable contracts, inventory, accessibility,
   geometry, responsive, and ownership rules.
4. Current PomegranateUI package contracts remain the runtime authority. A
   mockup interaction that has not yet been acquired must be implemented
   through a new framework-neutral contract before a Svelte recipe uses it.

The rebuild includes the atmospheric application canvas, top shelf and Panel
tabs, active Panel surface, Widget chrome, dock regions, floating layer,
Widget Catalog drawer and expanded presentation, representative ready/error
states, responsive staging, keyboard-equivalent placement, and the audited
sample Widget surfaces needed to demonstrate the system coherently. Sonder
domain data remains Lab-owned fixture data; it does not enter package schemas
or become PomegranateUI product semantics.

Mockup fidelity is an acceptance contract rather than a mood-board reference.
Playwright evidence must exercise the named wide, compact, focus, drawer,
expanded-Catalog, docked, floating, unavailable-renderer, failed-renderer, and
keyboard paths. Assertions cover literal geometry, stable attributes, focus,
control availability, responsive layout, and interaction results. Approved
reference screenshots or narrowly reviewed native snapshots cover typography,
material, spacing, and composition. The preserved 95-case Atmospheric harness
and the complete Widget Overhaul harness remain green independently.

The clean-consumer gate adds a Svelte consumer installed only from packed Pom
tarballs plus copied recipe source. It must build without workspace symlinks,
Sonder imports, repository-internal source imports, or SvelteKit-only APIs.

`examples/mock-roleplay-backend` remains a framework-neutral core consumer.
`examples/sonder-integration` remains a plain-data boundary fixture. Neither
example imports Svelte unless it is explicitly the Svelte clean consumer.

### Local development and future demo artifact

The repository exposes one friendly Windows entry point for daily browser
work:

```powershell
npm.cmd run dev:lab
```

It starts Vite with hot reload on `http://127.0.0.1:5173/` using a strict,
documented port. Production-artifact verification remains a separate build and
preview path on `http://127.0.0.1:4174/`. Server lifecycle tests must prove
startup failure on an occupied strict port and clean teardown.

`apps/workbench-lab/dist` is the only deployable demo artifact. It uses a
relative Vite base, contains no repository-source dependency, and can be served
by a generic static host. Cloudflare Pages or another provider may later deploy
that directory, but provider configuration, credentials, domains, analytics,
and production publication are outside this tranche.

## Data and rendering flow

1. The adopter creates a framework-neutral `WorkbenchStore` and registers
   JSON-safe Widget manifests.
2. The Svelte integration exposes the store snapshot reactively without
   becoming a second writable authority.
3. A source-owned recipe requests public controller projections and renders
   adopter-owned markup.
4. User interaction dispatches typed Pom commands through controller actions.
5. The core validates the command, performs one atomic transition, and notifies
   subscribers.
6. The Svelte binding reflects the accepted state into the recipe.
7. A registered Widget renderer receives its Widget instance, adopter host
   context, capabilities, and dispatcher. Host context remains external to Pom
   persistence.

Storage remains adopter-supplied through `LayoutStorage`. The Svelte package
does not call browser storage directly.

## Accessibility and error authority

Adopter-owned markup does not transfer accessibility authority away from
PomegranateUI. Pom defines and verifies the contract; the adopter chooses the
presentation that satisfies it.

The first renderer-conformance profile preserves the existing native
expectations:

- the Panel collection exposes one named tab list;
- each Panel tab and Panel surface have stable two-way ARIA relationships;
- active identity, disabled reorder actions, and keyboard operation are
  truthful;
- Widget frames expose stable identity, title, placement, and named actions;
- unavailable renderers expose a named status without deleting layout state;
- renderer failures are contained to the owning Widget and expose an alert;
- sibling Widgets and the store remain usable after one renderer fails; and
- floating geometry and stacking are reflected without leaking domain state.

A recipe that changes its markup must still satisfy these literal behaviors or
declare a future, separately versioned conformance profile. It cannot silently
weaken the default profile.

Public commands remain non-throwing. A rejected command leaves the prior state
unchanged. A controller creation or binding error returns a named diagnostic
where recovery is possible; programmer misuse may throw a stable setup error.
Renderer exceptions are caught at the Widget boundary and do not mutate the
core state.

## React retirement

React is removed only at the end of a dual-green migration window. Temporary
coexistence inside the implementation branch is sequencing, not a supported
product architecture.

Before deletion:

1. Existing React component expectations are translated into framework-neutral
   renderer contract IDs and failing public conformance tests.
2. The Svelte binding and copied recipes pass those tests.
3. The Svelte Workbench Lab passes the native browser suite.
4. A clean packed Svelte consumer builds and passes renderer conformance.
5. Native contract evidence and generated reports point at the replacement
   Svelte tests without retiring or duplicating the existing dual-green IDs.
6. Both preserved Sonder browser oracles remain green and extraction reports
   retain zero unaccounted evidence.

After those gates pass, `packages/react`, React-only tests, React dependencies,
React Vite configuration, and active React documentation are removed together.
Historical design records and git history are not rewritten. Repository
boundary tests reject active React imports and dependencies after retirement.

Because no Pom package has been published and Sonder has not adopted one, no
runtime compatibility shim or deprecation release is required.

## Verification

Implementation remains test-first. The completed migration must prove:

- framework-neutral packages contain no React, Svelte, SvelteKit, or DOM
  imports;
- `@pomegranate-ui/svelte` consumes only public Pom APIs and a supported Svelte
  peer range;
- recipes contain presentation and controller composition but no duplicated
  layout transition or persistence logic;
- core conformance remains green;
- renderer conformance passes against the Svelte recipes and a deliberately
  broken harness fails with literal diagnostics;
- the same public renderer driver runs against a minimal framework-neutral DOM
  fixture without importing Svelte;
- Svelte component tests cover subscriptions, context, renderer registration,
  unresolved renderers, and error containment;
- recipe metadata and hashes are deterministic;
- clean packed core and Svelte consumers build without workspace leakage;
- the Svelte Workbench Lab passes Playwright coverage;
- the Lab reproduces the named approved mockup surfaces at the required wide,
  compact, focus, Catalog, docked, floating, and error states;
- `npm.cmd run dev:lab` serves the Lab with hot reload at the documented strict
  local address, while the production preview serves only the built artifact;
- preserved Sonder harnesses and extraction completeness remain green;
- native evidence and migration reports deterministically replace React test
  paths with Svelte test paths while preserving contract identity;
- active source, manifests, lockfiles, and documentation contain no React
  runtime dependency after retirement; and
- the repository's full `npm.cmd run check` gate passes on the supported CI
  platforms.

Focused test commands may change as workspaces change, but the final Windows
gate remains `npm.cmd run check`.

## Migration and rollback

The implementation plan must stage the change so that every commit builds and
the preserved evidence lane remains intact. React is not deleted first.

If the Svelte clean consumer, renderer conformance, accessibility behavior,
packaging, or browser evidence cannot reach parity, React remains the active
private binding and the Svelte work does not become package authority. No
contract status changes merely because a Svelte fixture renders.

Recipe copying is recoverable: it creates new adopter-owned files and never
overwrites modified files. Package upgrades do not rewrite recipe source. A
compatibility mismatch produces a deterministic report that names the recipe,
its source revision, the installed package version, and the affected contract
IDs.

## Acceptance criteria

This design is complete when the implementation plan can produce all of the
following without expanding product scope:

- one maintained Svelte view integration and no active React binding;
- framework-neutral contracts, layout, core, persistence, and backend
  boundaries;
- editable Svelte recipes whose presentation is adopter-owned;
- a public renderer-conformance lane usable by a non-Svelte adopter;
- Svelte Workbench Lab and packed-consumer proof;
- an explicit native rebuild of the approved mockup direction, with visual,
  geometry, responsive, keyboard, and interaction evidence;
- a one-command local live-reload workflow and a provider-neutral static demo
  artifact;
- preserved provenance with no retired or unaccounted baseline contracts;
- no npm publication or Sonder cutover; and
- a clean full verification gate.
