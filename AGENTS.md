# PomegranateUI Agent Guide

PomegranateUI is a developer toolkit for teams building AI roleplaying applications. It is not a branded application frontend.

## Authority boundaries

- PomegranateUI owns reusable Panel, Widget, Catalog, layout, responsive, accessibility, theme, command, event, and test-driver contracts.
- Adopters own their product branding, information architecture, markup, layout choices, backend, authentication, persistence, and domain semantics.
- Sonder Engine is the first demanding consumer and source of the preserved baseline. It is not PomegranateUI's internal data model.
- Never import Sonder server code into a PomegranateUI package or example.

## Extraction rules

- Treat `provenance/extraction-manifest.json` as the completeness authority.
- Preserve baseline artifacts byte-for-byte and verify them by SHA-256.
- Every legacy contract and audited Widget surface needs a stable contract ID and one destination owner.
- Tranches 0-2 permit no retirement and no unaccounted evidence.
- The preserved prototypes are executable oracles, not production package authority.

## TypeScript package rules

- Runtime dependencies flow `contracts -> layout -> core -> svelte`; `testkit` consumes public APIs only.
- Keep `contracts`, `layout`, and `core` free of Svelte, React, and DOM imports.
- Parse untrusted public input through schemas in `@pomegranate-ui/contracts`.
- Keep package exports source-ownable and backend-neutral; host/domain data enters through explicit adapters.
- Treat `@pomegranate-ui/svelte` as headless integration and `registry/recipes` as copy-owned Svelte source, not as a branded application shell.
- `@pomegranate-ui/theme` remains reserved until its own approved tranche.

## Local Workbench Lab

- The Atmospheric Workbench owns macro layout/material/responsive mockup authority; the Widget Overhaul owns Widget inventory/geometry/state authority.
- Use `npm.cmd run dev:lab` for `http://127.0.0.1:5173/`.
- Use `npm.cmd run build` then `npm.cmd run preview:lab` for `http://127.0.0.1:4174/`.
- `apps/workbench-lab/dist` is the static relative-base artifact boundary. Do not add SvelteKit, hosting, package publication, Sonder server imports, or a Sonder cutover in this tranche.

## Verification

Use `npm.cmd` on Windows.

```powershell
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

Write tooling behavior test-first and keep generated provenance deterministic.

Npm package publication has not occurred. Sonder cutover has not occurred. Do not publish packages or change Sonder from this repository without a separately approved integration tranche.
