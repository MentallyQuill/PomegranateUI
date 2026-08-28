# PomegranateUI

PomegranateUI is a developer toolkit for teams building AI roleplaying applications. It is not an application frontend and does not prescribe an adopter's brand, information architecture, backend, or product shell.

The project begins with two evidence lanes:

- The **legacy evidence lane** preserves Sonder's HTML, CSS, JavaScript, design records, assets, and browser regressions byte-for-byte as executable behavioral oracles.
- The **native toolkit lane** acquires framework-neutral contracts, state machines, test drivers, and a Svelte view integration one contract family at a time.

Tranche 3 establishes strict TypeScript workspaces after the extraction manifest proved that every baseline artifact, regression contract, audited Widget surface, license, and source-side integration test has an accountable owner.

This repository remains a private incubator. Nothing in this phase is published to npm or presented as a finished component library.

The preserved source baseline is Sonder Engine commit `0fb98e43f303d62c42ef5c74e6ae38126f68161d`.

## Package graph

- `@pomegranate-ui/contracts` owns JSON-safe public contracts and runtime schemas.
- `@pomegranate-ui/layout` owns framework-neutral Panel and Widget layout transitions.
- `@pomegranate-ui/core` owns registration, deterministic command dispatch, and subscriptions.
- `@pomegranate-ui/theme` validates versioned declarative themes and resolves framework-neutral semantic colors, typography, geometry, spacing, materials, assets, canvas layers, and accessibility metadata.
- `@pomegranate-ui/svelte` provides headless readable stores, typed context, renderer registration, and focus actions over public core APIs.
- `@pomegranate-ui/testkit` provides public conformance fixtures and drivers.

The maintained view path is `contracts -> layout -> core -> svelte`, with the separate framework-neutral `contracts -> theme` path supplying semantic values to adopter-owned views. The testkit consumes public package APIs only. Reusable UI is distributed as source-owned recipes under `registry/recipes`: adopters copy and own those `.svelte` files instead of receiving a fixed branded component shell.

## Workbench Lab

The Svelte Workbench Lab rebuilds the approved mockup direction without making that mockup PomegranateUI's product model. The Atmospheric Workbench is the authority for macro layout, material, and responsive staging. The Widget Overhaul is the authority for Widget inventory, geometry, and state coverage. Both preserved prototypes remain executable evidence oracles; production authority belongs to the packages and the Lab's owned recipe copies.

Start the development server at `http://127.0.0.1:5173/`:

```powershell
npm.cmd run dev:lab
```

Build and inspect the static production artifact at `http://127.0.0.1:4174/`:

```powershell
npm.cmd run build
npm.cmd run preview:lab
```

The deployable boundary is the relative-base static output in `apps/workbench-lab/dist`. It does not require SvelteKit, a PomegranateUI backend, Sonder server code, or a network-only asset host. Production hosting is outside this tranche.

The Lab applies three complete definitions to the same live Panel and Widget tree: Pom Neutral, Deep Current, and Bunny. Switching is immediate and atomic; a failed definition or missing required local asset leaves the last valid theme active. These presets are Lab-owned demonstrations, not bundled product branding. Adopters continue to own markup, composition, asset resolution, preference persistence, and final visual identity.

This tranche intentionally does not add animated theme morphing, a visual theme editor, remote theme loading, package publication, public hosting, or a Sonder cutover. That keeps the foundation small enough to evaluate before any of those costs become product commitments.

## Local verification gate

On Windows, install and verify the locked toolchain with:

```powershell
npm.cmd ci
npm.cmd exec playwright install chromium
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:extraction
npm.cmd run report
npm.cmd run test:pack
npm.cmd run test:browser
npm.cmd run check
```

The individual commands are useful while developing. The final `npm.cmd run check` executes them in the repository's required order and verifies unit contracts, strict types, native packages, clean packed consumers, source hashes, ownership and license provenance, generated reports, the Workbench Lab, and both preserved browser oracles.

Npm package publication has not occurred. Sonder cutover has not occurred; Sonder remains an unchanged consumer candidate until a separately approved integration tranche.

## Product boundary

PomegranateUI will own reusable interaction machinery: Panels, Widgets, the Widget Catalog, layout and persistence envelopes, responsive staging, accessibility behavior, semantic theme foundations, commands, events, capability declarations, and test drivers.

Adopters remain responsible for their application, backend integration, routes, authentication, saves, domain semantics, and final source-owned presentation.
