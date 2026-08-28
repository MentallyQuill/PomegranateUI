# PomegranateUI

PomegranateUI is a developer toolkit for teams building AI roleplaying applications. It is not an application frontend and does not prescribe an adopter's brand, information architecture, backend, or product shell.

The project begins with two evidence lanes:

- The **legacy evidence lane** preserves Sonder's HTML, CSS, JavaScript, design records, assets, and browser regressions byte-for-byte as executable behavioral oracles.
- The **native toolkit lane** acquires framework-neutral contracts, state machines, test drivers, and React-first bindings one contract family at a time.

Tranche 3 establishes strict TypeScript workspaces after the extraction manifest proved that every baseline artifact, regression contract, audited Widget surface, license, and source-side integration test has an accountable owner.

This repository remains a private incubator. Nothing in this phase is published to npm or presented as a finished component library.

The preserved source baseline is Sonder Engine commit `0fb98e43f303d62c42ef5c74e6ae38126f68161d`.

## Package graph

- `@pomegranate-ui/contracts` owns JSON-safe public contracts and runtime schemas.
- `@pomegranate-ui/layout` owns framework-neutral Panel and Widget layout transitions.
- `@pomegranate-ui/core` owns registration, deterministic command dispatch, and subscriptions.
- `@pomegranate-ui/react` provides React bindings over the public core.
- `@pomegranate-ui/testkit` provides public conformance fixtures and drivers.
- `@pomegranate-ui/theme` remains reserved for a later tranche.

Runtime dependencies flow from `contracts` to `layout` to `core` to `react`. The testkit consumes public package APIs only.

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
