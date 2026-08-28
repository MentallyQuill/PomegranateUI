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

- Runtime dependencies flow `contracts -> layout -> core -> react`; `testkit` consumes public APIs only.
- Keep `contracts`, `layout`, and `core` free of React and DOM imports.
- Parse untrusted public input through schemas in `@pomegranate-ui/contracts`.
- Keep package exports source-ownable and backend-neutral; host/domain data enters through explicit adapters.
- `@pomegranate-ui/theme` remains reserved until its own approved tranche.

## Verification

Use `npm.cmd` on Windows.

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:extraction
npm.cmd run report
npm.cmd run test:browser
npm.cmd run check
```

Write tooling behavior test-first and keep generated provenance deterministic.
