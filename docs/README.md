# PomegranateUI documentation

Pom is a modular UI toolkit for teams building AI roleplay frontends. These documents explain the product boundary first: what Pom provides, what remains application-owned, and how a frontend adopts only the pieces it needs.

## Start here

1. [What is Pom?](what-is-pom.md) — the problem Pom solves, its building blocks, and its non-goals.
2. [Adoption boundary](adoption-boundary.md) — the concrete ownership split between Pom and an AI roleplay frontend.
3. [Main project README](../README.md) — repository status, package graph, Workbench Lab commands, and verification gates.

## Build with Pom

- [Svelte integration](../packages/svelte/README.md) — headless Svelte stores, context, renderers, and actions.
- [Source-owned recipes](../registry/recipes/README.md) — editable Svelte components that become adopter-owned source.
- [Contracts](../packages/contracts/README.md) — JSON-safe public contracts and runtime validation.
- [Theme authoring](theme-authoring.md) — v2 materials, shapes, semantic parts, canvas, policy, assets, and v1 migration.
- [Theme engine](../packages/theme/README.md) — framework-neutral resolution and compilation boundary.
- [Layout](../packages/layout/README.md) — framework-neutral Panel and Widget transitions.
- [Core](../packages/core/README.md) — registration, command dispatch, and subscriptions.
- [Testkit](../packages/testkit/README.md) — public conformance fixtures and drivers.
- [Workbench Lab](../apps/workbench-lab/README.md) — the demanding Svelte reference consumer.

## Understand the public boundary

- [Design foundations](../design/foundations/README.md) and [Widget specifications](../design/widget-specifications/README.md) reserve public, PomegranateUI-owned design records.
- [Workbench Lab](../apps/workbench-lab/README.md) is an example consumer, not mandatory product structure.

## Documentation principles

- Explain Pom as a toolkit for AI roleplay frontends, not as a frontend of its own.
- Keep the adopter's branding, information architecture, markup, backend, persistence, and domain semantics explicit.
- Distinguish current package behavior from reserved or future work.
- Use SillyTavern-class applications to clarify the problem space without implying a dependency, clone, endorsement, or completed integration.
- Treat the Workbench Lab as an example and evidence surface, not mandatory product structure.
