# PomegranateUI

PomegranateUI is a developer toolkit for teams building AI roleplaying applications. It is not an application frontend and does not prescribe an adopter's brand, information architecture, backend, or product shell.

The project begins with two evidence lanes:

- The **legacy evidence lane** preserves Sonder's HTML, CSS, JavaScript, design records, assets, and browser regressions byte-for-byte as executable behavioral oracles.
- The **native toolkit lane** will acquire framework-neutral contracts, state machines, test drivers, and React-first bindings one contract family at a time.

TypeScript begins in Tranche 3, after the extraction manifest proves that every baseline artifact, regression contract, audited Widget surface, license, and source-side integration test has an accountable owner.

This repository remains a private incubator during Tranches 0-2. Nothing in this phase is published to npm or presented as a finished component library.

The preserved source baseline is Sonder Engine commit `0fb98e43f303d62c42ef5c74e6ae38126f68161d`. There is no production TypeScript package yet; the package directories remain reserved until the separately planned Tranche 3.

## Local preservation gate

On Windows, install and verify the locked toolchain with:

```powershell
npm.cmd ci
npm.cmd exec playwright install chromium
npm.cmd run check
```

The full check verifies unit contracts, source hashes, ownership and license provenance, generated reports, and both preserved browser oracles.

## Product boundary

PomegranateUI will own reusable interaction machinery: Panels, Widgets, the Widget Catalog, layout and persistence envelopes, responsive staging, accessibility behavior, semantic theme foundations, commands, events, capability declarations, and test drivers.

Adopters remain responsible for their application, backend integration, routes, authentication, saves, domain semantics, and final source-owned presentation.
