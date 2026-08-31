# PomegranateUI Agent Guide

PomegranateUI is a developer toolkit for teams building AI roleplaying applications. It is not a branded application frontend.

## Authority boundaries

- PomegranateUI owns reusable Panel, Widget, Catalog, layout, responsive, accessibility, theme, command, event, and test-driver contracts.
- Adopters own product branding, information architecture, markup, layout choices, backend, authentication, persistence, and domain semantics.
- Keep package exports source-ownable and backend-neutral. Host and domain data enter through explicit adapters.

## TypeScript package rules

- Runtime dependencies flow `contracts -> layout -> core -> svelte`; `testkit` consumes public APIs only.
- Keep `contracts`, `layout`, `core`, and `theme` free of Svelte, React, and DOM imports.
- Parse untrusted public input through schemas in `@pomegranate-ui/contracts`.
- Treat `@pomegranate-ui/svelte` as headless integration and `registry/recipes` as copy-owned Svelte source, not as a branded application shell.
- Npm package publication requires a separately approved release.

## Workbench Lab

- Theme switching is immediate and atomic; keep one mounted Panel and Widget tree and do not branch recipes on theme IDs.
- Use `npm.cmd run dev:lab` for `http://127.0.0.1:5173/`.
- Use `npm.cmd run build` then `npm.cmd run preview:lab` for `http://127.0.0.1:4174/`.
- `apps/workbench-lab/dist` is the static relative-base artifact boundary published by GitHub Pages.

## Verification

Use `npm.cmd` on Windows.

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:recipes
npm.cmd run test:pack
npm.cmd run test:browser
npm.cmd run check
```

Write tooling behavior test-first and keep generated output deterministic.
