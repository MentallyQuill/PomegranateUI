# @pomegranate-ui/testkit

Public conformance drivers and fixtures that adopters can run against their own frontend and backend adapters without reaching into package internals.

`runCoreConformance` reports the first eight dual-green preservation contracts as frozen plain results. It exercises only public contracts, layout, and core APIs; `assertCoreConformance` is available for CI gates that should fail on any literal contract regression.

## Renderer conformance

`runRendererConformance` accepts a framework-neutral `RendererHarness`. Adapt the test tools already used by an adopter—DOM queries, Playwright locators, a native accessibility driver, or another semantic UI driver—to three asynchronous operations: reset the surface, return a plain snapshot, and perform a named operation. The driver neither imports a renderer nor reaches into component internals. `assertRendererConformance` is the equivalent CI gate and aggregates every failed renderer contract into one error.

The literal interoperability surface is intentionally small:

- one tablist named `Panels`, with stable tab IDs and reciprocal `aria-controls` / `aria-labelledby` relationships;
- `data-pomegranate-panel-tab`, `data-pomegranate-panel`, `data-pomegranate-dock`, `data-pomegranate-floating-layer`, `data-pomegranate-widget`, and `data-pomegranate-placement` attributes;
- named `status` output for an unavailable Widget renderer and named `alert` output for a contained renderer failure;
- semantic operations for Panel activation/reorder, Widget placement, failure injection, and focus movement.

`RENDERER_MARKUP` exports the literal name and attributes. Typography, class names, HTML nesting, icons, spacing, animation, adopter branding, and product information architecture remain adopter-owned. `tests/fixtures/renderer-dom-harness.mjs` is the portability proof: it uses `document.createElement` and DOM events without importing Svelte or React.
