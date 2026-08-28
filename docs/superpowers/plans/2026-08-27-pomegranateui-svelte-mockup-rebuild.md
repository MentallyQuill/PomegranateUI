# PomegranateUI Svelte Mockup Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the approved Atmospheric Workbench and Widget Overhaul direction as PomegranateUI's Svelte-first Workbench Lab, prove the behavior through portable renderer contracts and mockup-fidelity browser evidence, provide a repeatable local Vite workflow, and retire React only after the replacement is dual-green.

**Architecture:** Framework-neutral contracts, layout operations, the Workbench store, Catalog state, view projections, persistence, and conformance drivers remain below the view boundary. `@pomegranate-ui/svelte` supplies reactive/context/renderer integration while editable recipes own visible markup; `apps/workbench-lab` owns copied recipes, mock roleplaying fixtures, composition, visual styling, and the static demo artifact. Preserved Sonder prototypes remain immutable acceptance oracles and never become runtime package imports.

**Tech Stack:** Node.js 24+, TypeScript 7, Zod, Svelte 5.56.10, `@sveltejs/vite-plugin-svelte` 7.3.0, `@testing-library/svelte` 5.4.2, `svelte-check` 4.7.6, Vite 8, Vitest 4, Playwright 1.62, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-08-27-pomegranateui-svelte-view-layer-design.md`

## Global Constraints

- Use `npm.cmd` on Windows and preserve the repository's locked Node.js `>=24` contract.
- Preserve the runtime dependency direction `contracts -> layout -> core -> svelte`; `testkit` consumes public APIs only.
- Keep `contracts`, `layout`, and `core` free of React, Svelte, SvelteKit, and DOM imports.
- Parse every untrusted public object through a schema in `@pomegranate-ui/contracts`.
- Treat `prototypes/sonder-baseline/atmospheric-workbench` as the authority for macro composition, typography, material, docking feedback, floating geometry, and restoration behavior.
- Treat `prototypes/sonder-baseline/widget-overhaul` as the later authority for Panels, Widgets, Catalog, sub-panels, audited geometry, responsive height, icons, and Widget states.
- Preserve every baseline artifact byte-for-byte and keep both preserved browser harnesses green.
- Keep Sonder-shaped fixture content inside `apps/workbench-lab`; never import Sonder server code or promote its domain data into package contracts.
- Svelte is a peer dependency of `@pomegranate-ui/svelte`; SvelteKit is not a dependency or package authority.
- Recipes may compose public controllers and actions but may not copy layout transitions, persistence codecs, or store mutation logic.
- Preserve the eight existing dual-green contract IDs; remap their native evidence paths instead of retiring or duplicating them.
- Recipe registry output and hashes must be deterministic; copy tooling refuses to overwrite a modified destination.
- `npm.cmd run dev:lab` binds Vite to `127.0.0.1:5173` with `--strictPort`; production preview uses the built artifact on `127.0.0.1:4174`.
- Only `apps/workbench-lab/dist` is demo-hostable. Do not deploy it or add provider credentials/configuration in this tranche.
- Do not publish npm packages, modify Sonder, cut Sonder over, choose a public license, or introduce `@pomegranate-ui/theme`.
- Preserve unrelated work and stage only files named by each task.

---

### Task 1: Acquire Catalog Metadata and Framework-Neutral View Controllers

**Files:**
- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/contracts/src/contracts.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/registry.ts`
- Create: `packages/core/src/catalog.ts`
- Create: `packages/core/src/catalog.test.ts`
- Create: `packages/core/src/view-model.ts`
- Create: `packages/core/src/view-model.test.ts`

**Interfaces:**
- Consumes: `WidgetManifest`, `WidgetRegistry`, `WorkbenchStore`, `WorkbenchState`, `WidgetPlacement`, `PanelId`, and `WidgetInstanceId` from existing public packages.
- Produces: `WidgetCatalogMetadata`, `CatalogState`, `CatalogController`, `createCatalogController`, `PanelTabProjection`, `PanelSurfaceProjection`, `WidgetFrameProjection`, `selectPanelTabs`, `selectPanelSurface`, and `createWidgetActions`.

- [ ] **Step 1: Add failing manifest-schema tests for Catalog metadata**

Add a valid manifest with literal metadata and rejection cases for duplicate keywords, an empty category, invalid geometry, and duplicate supported states:

```ts
catalog: {
  category: 'story',
  purpose: 'Read the current story transcript.',
  keywords: ['story', 'transcript'],
  iconKey: 'story.transcript',
  shape: 'stage',
  minColumns: 2,
  geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
  supportedStates: ['ready', 'loading', 'failure']
}
```

- [ ] **Step 2: Run the focused contracts test and verify red**

Run: `npm.cmd exec vitest run packages/contracts/src/contracts.test.ts`

Expected: FAIL because `WidgetManifestSchema` does not accept `catalog`.

- [ ] **Step 3: Add the Catalog metadata contract and schema**

Define and export this optional manifest member:

```ts
export interface WidgetCatalogMetadata {
  readonly category: string;
  readonly purpose: string;
  readonly keywords: readonly string[];
  readonly iconKey: string;
  readonly shape: 'narrow' | 'medium' | 'wide' | 'stage' | 'strip';
  readonly minColumns: number;
  readonly geometry: {
    readonly minHeight: number;
    readonly idealHeight: number;
    readonly maxHeight: number;
  };
  readonly supportedStates: readonly string[];
}

export interface WidgetManifest {
  // existing fields stay unchanged
  readonly catalog?: WidgetCatalogMetadata;
}
```

Use strict Zod objects, non-empty trimmed strings, unique arrays, positive integer columns, and a refinement enforcing `minHeight <= idealHeight <= maxHeight`. Update the registry's admitted immutable copy so optional metadata is deeply cloned and frozen.

- [ ] **Step 4: Add failing tests for the Catalog controller**

Cover closed/open state, drawer/expanded presentation, visual/compact mode, case-insensitive title/purpose/keyword search, category filters, stable type ordering, reset-on-close, frozen snapshots, listener isolation, and unregister refresh behavior. Use this public shape:

```ts
export interface CatalogState {
  readonly open: boolean;
  readonly presentation: 'drawer' | 'expanded';
  readonly resultMode: 'visual' | 'compact';
  readonly query: string;
  readonly category: string | null;
  readonly results: readonly WidgetManifest[];
}

export interface CatalogController {
  getState(): CatalogState;
  open(presentation?: CatalogState['presentation']): void;
  close(): void;
  setPresentation(value: CatalogState['presentation']): void;
  setResultMode(value: CatalogState['resultMode']): void;
  setQuery(value: string): void;
  setCategory(value: string | null): void;
  refresh(): void;
  subscribe(listener: (state: CatalogState) => void): () => void;
}
```

- [ ] **Step 5: Run Catalog tests and verify red**

Run: `npm.cmd exec vitest run packages/core/src/catalog.test.ts`

Expected: FAIL because `createCatalogController` is absent.

- [ ] **Step 6: Implement the minimal framework-neutral Catalog controller**

Create `createCatalogController(registry)` with one frozen state snapshot, normalized lower-case search, exact category matching, title-then-type sorting, safe sibling notification, and no DOM or framework imports. Catalog selection and Widget-instance ID creation stay adopter-owned; the controller owns discovery state only.

- [ ] **Step 7: Add failing view-projection/controller tests**

Cover sorted tabs and disabled reorder directions, stable encoded IDs, active surface ARIA relationships, deterministic left/main/right/floating order, missing manifest titles, dock append, float defaults, and atomic rejection. Use literal public projections:

```ts
export interface PanelTabProjection {
  readonly panelId: PanelId;
  readonly name: string;
  readonly tabId: string;
  readonly panelIdAttribute: string;
  readonly selected: boolean;
  readonly moveLeftDisabled: boolean;
  readonly moveRightDisabled: boolean;
}

export interface PanelSurfaceProjection {
  readonly panelId: PanelId;
  readonly tabId: string;
  readonly surfaceId: string;
  readonly docks: Readonly<Record<'left' | 'main' | 'right', readonly WidgetFrameProjection[]>>;
  readonly floating: readonly WidgetFrameProjection[];
}
```

- [ ] **Step 8: Run view-model tests and verify red**

Run: `npm.cmd exec vitest run packages/core/src/view-model.test.ts`

Expected: FAIL because the public selectors do not exist.

- [ ] **Step 9: Implement projections and Widget actions**

Move sorting, DOM-safe ID projection, dock append order, floating default geometry, and next-z calculation out of the React layer. `createWidgetActions(store, instanceId)` returns `dock(edge)`, `float()`, and `remove()` functions that only dispatch public commands and return `CommandResult`.

- [ ] **Step 10: Run focused and boundary verification**

Run: `npm.cmd exec vitest run packages/contracts/src/contracts.test.ts packages/core/src/catalog.test.ts packages/core/src/view-model.test.ts`

Run: `npm.cmd run typecheck`

Expected: PASS; repository-boundary tests still report no framework/DOM import in neutral packages.

- [ ] **Step 11: Commit Task 1**

```powershell
git add packages/contracts/src/model.ts packages/contracts/src/contracts.test.ts packages/core/src/index.ts packages/core/src/catalog.ts packages/core/src/catalog.test.ts packages/core/src/view-model.ts packages/core/src/view-model.test.ts packages/core/src/registry.ts
git commit -m "feat(core): add view and catalog controllers"
```

### Task 2: Add Public Renderer Conformance

**Files:**
- Modify: `packages/testkit/src/contract-ids.ts`
- Modify: `packages/testkit/src/index.ts`
- Create: `packages/testkit/src/renderer-conformance.ts`
- Create: `packages/testkit/src/renderer-conformance.test.ts`
- Create: `packages/testkit/src/renderer-fixture.ts`
- Modify: `packages/testkit/README.md`
- Create: `tests/fixtures/renderer-dom-harness.mjs`

**Interfaces:**
- Consumes: public contracts and the Task 1 projection vocabulary only.
- Produces: `RendererHarness`, `RendererSnapshot`, `RendererOperation`, `RendererConformanceResult`, `runRendererConformance`, and `assertRendererConformance` without importing Svelte or adopter internals.

- [ ] **Step 1: Write failing renderer-driver tests**

Define a plain asynchronous harness contract:

```ts
export interface RendererHarness {
  reset(): Promise<void>;
  snapshot(): Promise<RendererSnapshot>;
  perform(operation: RendererOperation): Promise<void>;
}

export type RendererOperation =
  | { readonly type: 'panel.activate'; readonly name: string }
  | { readonly type: 'panel.reorder'; readonly name: string; readonly direction: 'left' | 'right' }
  | { readonly type: 'widget.place'; readonly title: string; readonly destination: 'left' | 'right' | 'floating' }
  | { readonly type: 'focus.next' }
  | { readonly type: 'renderer.fail'; readonly title: string };
```

The frozen `RendererSnapshot` contains plain tab, panel, Widget, dock, floating, status, alert, active-element, and stable-attribute records. Test a passing fake harness and deliberately broken harnesses for tabs, ARIA pairs, placement, focus, unavailable renderers, failed-renderer isolation, and diagnostic text.

- [ ] **Step 2: Run renderer conformance tests and verify red**

Run: `npm.cmd exec vitest run packages/testkit/src/renderer-conformance.test.ts`

Expected: FAIL because the renderer driver is absent.

- [ ] **Step 3: Implement the renderer driver and literal IDs**

Add renderer IDs alongside the eight existing `FIRST_SLICE_CONTRACT_IDS`; do not replace or renumber the existing IDs. Every result is frozen and has this shape:

```ts
export interface RendererConformanceResult {
  readonly contractId: RendererContractId;
  readonly passed: boolean;
  readonly diagnostic: string;
}
```

The driver catches harness failures per assertion and reports literal expected/actual diagnostics instead of throwing until `assertRendererConformance` aggregates failures.

- [ ] **Step 4: Prove non-Svelte portability**

Implement `tests/fixtures/renderer-dom-harness.mjs` with `document.createElement`, DOM event dispatch, and no Svelte/React import. Adapt it in the test so the same `runRendererConformance` call is green.

- [ ] **Step 5: Document the public adoption contract**

Document how a non-Svelte adopter maps its normal test tools into `RendererHarness`, which attributes and ARIA relationships are literal, and which presentation choices remain adopter-owned.

- [ ] **Step 6: Verify and commit Task 2**

Run: `npm.cmd exec vitest run packages/testkit/src/renderer-conformance.test.ts`

Run: `npm.cmd run typecheck`

```powershell
git add packages/testkit tests/fixtures/renderer-dom-harness.mjs
git commit -m "test(testkit): add renderer conformance"
```

### Task 3: Build the Headless Svelte Integration

**Files:**
- Create: `packages/svelte/package.json`
- Create: `packages/svelte/tsconfig.json`
- Create: `packages/svelte/README.md`
- Create: `packages/svelte/src/index.ts`
- Create: `packages/svelte/src/store.ts`
- Create: `packages/svelte/src/context.ts`
- Create: `packages/svelte/src/renderer-registry.ts`
- Create: `packages/svelte/src/focus.ts`
- Create: `packages/svelte/src/svelte.test.ts`
- Create: `packages/svelte/src/fixtures/BindingFixture.svelte`
- Modify: `tsconfig.json`
- Modify: `tsconfig.tests.json`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: public `WorkbenchStore`, Catalog controller, core projections, Svelte `readable`, context APIs, `Component`, and actions.
- Produces: `toSvelteWorkbenchStore`, `toSvelteCatalogStore`, `setWorkbenchContext`, `getWorkbenchContext`, `createWidgetRendererRegistry`, `focusOnMount`, and typed renderer props.

- [ ] **Step 1: Install and pin the Svelte toolchain**

Run:

```powershell
npm.cmd install --save-dev --save-exact svelte@5.56.10 @sveltejs/vite-plugin-svelte@7.3.0 @testing-library/svelte@5.4.2 svelte-check@4.7.6
```

Add `packages/svelte` as a TypeScript project reference and configure Vitest with the official Svelte Vite plugin. Keep Svelte as a peer dependency of the package and a root development dependency for tests.

- [ ] **Step 2: Write failing adapter/context/registry tests**

Cover immediate initial snapshot, one update per accepted dispatch, unsubscribe idempotence, read-only Svelte stores, typed context setup errors, duplicate renderers, missing renderer lookup, host context identity, and catalog subscription. Mount `BindingFixture.svelte` with Testing Library.

- [ ] **Step 3: Run Svelte package tests and verify red**

Run: `npm.cmd exec vitest run packages/svelte/src/svelte.test.ts`

Expected: FAIL because `@pomegranate-ui/svelte` is not implemented.

- [ ] **Step 4: Implement store adapters and contexts**

Use Svelte's `readable` without creating writable state:

```ts
export function toSvelteWorkbenchStore(store: WorkbenchStore): Readable<WorkbenchState> {
  return readable(store.getState(), (set) => store.subscribe(set));
}
```

Store context contains the authoritative Workbench store, its readable adapter, host context, renderer registry, and optional Catalog controller. Missing context throws the stable setup message `PomegranateUI Workbench context is not configured.`

- [ ] **Step 5: Implement renderer registry and focus action**

Use a typed `Map<WidgetType, Component<WidgetRendererProps<THostContext>>>`. Registration rejects duplicates with `DUPLICATE_RENDERER`; `focusOnMount(node, enabled)` schedules focus only when enabled and returns an `update`/`destroy` action result without retaining stale nodes.

- [ ] **Step 6: Verify package boundaries and package output**

Run: `npm.cmd exec vitest run packages/svelte/src/svelte.test.ts`

Run: `npm.cmd run typecheck`

Run: `npm.cmd run build`

Expected: PASS; `packages/svelte/dist` contains JavaScript and declarations, and no SvelteKit import exists.

- [ ] **Step 7: Commit Task 3**

```powershell
git add package.json package-lock.json tsconfig.json tsconfig.tests.json vitest.config.ts packages/svelte
git commit -m "feat(svelte): add headless integration"
```

### Task 4: Create Source-Owned Svelte Recipes and Deterministic Registry Tooling

**Files:**
- Create: `registry/recipes/panel-tabs/PanelTabs.svelte`
- Create: `registry/recipes/workbench-surface/WorkbenchSurface.svelte`
- Create: `registry/recipes/widget-frame/WidgetFrame.svelte`
- Create: `registry/recipes/widget-catalog/WidgetCatalog.svelte`
- Create: `registry/recipes/error-state/RendererState.svelte`
- Create: `registry/recipes/recipe-manifest.json`
- Create: `registry/recipes/README.md`
- Create: `scripts/verify-recipes.mjs`
- Create: `tests/unit/recipes.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 projections/controllers, Task 2 literal attributes, Task 3 context/registry/focus APIs.
- Produces: five editable recipes, schema version `pomegranate.ui.recipes.v1`, deterministic hashes, `node scripts/verify-recipes.mjs --check`, and non-destructive commands such as `--copy panel-tabs --to apps/workbench-lab/src/recipes`.

- [ ] **Step 1: Write failing registry/tooling tests**

Test stable entry ordering, POSIX manifest paths, uppercase SHA-256 values, compatible package range, dependency declarations, required renderer contract IDs, exact owned-file sets, check-mode drift, clean copy, and refusal with `RECIPE_DESTINATION_MODIFIED` when a destination hash differs.

- [ ] **Step 2: Run recipe tests and verify red**

Run: `npm.cmd run test:unit -- --test-name-pattern="recipe"`

Expected: FAIL because the recipe manifest and verifier do not exist.

- [ ] **Step 3: Implement Panel, surface, frame, Catalog, and error recipes**

Recipes use Svelte 5 props and public adapters only. `PanelTabs.svelte` renders the named tablist, ARIA pairs, activation, and keyboard/menu reorder. `WorkbenchSurface.svelte` renders three docks plus the floating layer from `selectPanelSurface`. `WidgetFrame.svelte` uses public Widget actions and `<svelte:boundary>` for per-Widget failure containment. `WidgetCatalog.svelte` supports drawer/expanded plus visual/compact modes and exposes an adopter callback for instance creation. `RendererState.svelte` renders literal named status/alert recovery states.

- [ ] **Step 4: Generate and check deterministic metadata**

Each entry records recipe ID, revision `1`, compatible range `>=0.1.0-private.0 <0.2.0`, exact owned files, required renderer contract IDs, and declared package dependencies. Compute each actual hash rather than entering a sample value:

```js
const recipeHash = createHash('sha256').update(sourceBytes).digest('hex').toUpperCase();
entry.sha256[relativePath] = recipeHash;
```

Use the verifier's `--write` mode once to record those computed values, then require `--check` in `npm.cmd run check`.

- [ ] **Step 5: Verify recipes and commit Task 4**

Run: `npm.cmd run test:unit -- --test-name-pattern="recipe"`

Run: `npm.cmd run check:recipes`

Run: `npm.cmd run typecheck`

```powershell
git add registry/recipes scripts/verify-recipes.mjs tests/unit/recipes.test.mjs package.json
git commit -m "feat(recipes): add Svelte workbench sources"
```

### Task 5: Rebuild the Workbench Lab from the Approved Mockups

**Files:**
- Create: `apps/workbench-lab/src/main.ts`
- Create: `apps/workbench-lab/src/App.svelte`
- Create: `apps/workbench-lab/src/mockup/widgets.ts`
- Create: `apps/workbench-lab/src/mockup/catalog.ts`
- Create: `apps/workbench-lab/src/mockup/state.ts`
- Create: `apps/workbench-lab/src/mockup/host-context.ts`
- Create: `apps/workbench-lab/src/mockup/renderers/CharactersWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/TranscriptWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/ComposerWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/WorldStateWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/AmbienceWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/PromiseLedgerWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/SettingsWidget.svelte`
- Create: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Create: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Create: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Create: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Create: `apps/workbench-lab/src/recipes/RendererState.svelte`
- Modify: `apps/workbench-lab/src/storage.ts`
- Replace: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/index.html`
- Modify: `apps/workbench-lab/package.json`
- Modify: `apps/workbench-lab/tsconfig.json`
- Modify: `apps/workbench-lab/vite.config.ts`
- Modify: `apps/workbench-lab/README.md`
- Create: `apps/workbench-lab/src/App.test.ts`

**Interfaces:**
- Consumes: packed-package-compatible public Pom APIs and app-owned copies of Task 4 recipes.
- Produces: a Svelte Workbench with the seeded Scene, Library, Settings, Catalog, docked/floating/error states, mock roleplaying fixtures, and no Sonder runtime import.

- [ ] **Step 1: Copy recipe sources into the Lab and prove source ownership**

Run the non-destructive recipe copier into `apps/workbench-lab/src/recipes`, commit the copies, and test that the Lab imports only its owned files. Do not import `.svelte` files from `registry/recipes` at runtime.

- [ ] **Step 2: Write failing Lab component tests**

Cover the visible wordmark, story lockup, Scene/Library/Settings tabs, active story identity, six seeded Scene Widgets, 94 Catalog definitions with category totals `{ story: 12, library: 19, systems: 21, settings: 39, extensions: 3 }`, drawer/expanded and visual/compact toggles, unavailable and failed renderers, Panel reorder, docking, floating, persistence controls, and no credential-shaped fixture text.

- [ ] **Step 3: Run Lab tests and verify red**

Run: `npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts`

Expected: FAIL because the Svelte app and fixture inventory are absent.

- [ ] **Step 4: Build deterministic app-owned Catalog fixtures**

Translate the preserved 91 built-in plus three extension definitions into plain `WidgetManifest` objects with Catalog metadata. Keep the exact category totals and audited title/type/geometry/state values. Registration must pass `WidgetManifestSchema`; fixtures contain no server types, secrets, prices, or private memory payloads.

- [ ] **Step 5: Seed the mockup Workbench state through public layout APIs**

Create Scene, Library, and Settings Panels. Seed the Scene with Characters at left; Transcript and Composer on the main stage; World State, Room Ambience, and Promise Ledger at right. Seed representative Library and Settings layouts from the approved Widget Overhaul, including Theme Library and Theme Settings as distinct owners. Return revision `0` after construction so persistence tests remain deterministic.

- [ ] **Step 6: Implement the Svelte application shell**

Compose the atmospheric canvas, top shelf, Panel tabs, story lockup, Widgets launcher, status, active surface, dock collapse controls, Catalog, Panel-create dialog, persistence controls, and accessible diagnostics. Use one authoritative Workbench store and one framework-neutral Catalog controller. Product-specific copy and fixtures stay inside the Lab.

- [ ] **Step 7: Implement the mockup visual system**

Port the approved font stack, type scale, compact Widget chrome, glass/material tokens, restrained atmospheric canvas, fixed reading measure, dock widths, top-shelf geometry, responsive breakpoints, focus mode, drawer, expanded Catalog, floating shadows, icon sprite usage, coarse-pointer targets, and reduced-motion behavior. Preserve visible faces from the mockup while keeping interactive targets at least 44px on coarse pointers.

- [ ] **Step 8: Run component, type, and build verification**

Run: `npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts`

Run: `npm.cmd run typecheck`

Run: `npm.cmd run build`

Expected: PASS; the active Lab build emits only static Svelte Lab assets and contains no React chunk. The unused React baseline sources remain temporarily for the retirement gate.

- [ ] **Step 9: Commit Task 5**

```powershell
git add apps/workbench-lab
git commit -m "feat(lab): rebuild mockup in Svelte"
```

### Task 6: Prove Mockup Fidelity and Repeatable Local Startup

**Files:**
- Modify: `package.json`
- Modify: `apps/workbench-lab/package.json`
- Modify: `apps/workbench-lab/vite.config.ts`
- Modify: `tests/browser/global-setup.mjs`
- Replace: `tests/browser/native-workbench.spec.ts`
- Create: `tests/browser/native-workbench-visual.spec.ts`
- Create: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/unit/browser-server-lifecycle.test.mjs`
- Create: `tests/unit/lab-scripts.test.mjs`
- Create: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/*`

**Interfaces:**
- Consumes: the Svelte Lab at dev port 5173 and production-preview port 4174.
- Produces: root `dev:lab`, fixed production preview, server lifecycle proof, native mockup behavior tests, and narrowly reviewed visual baselines.

- [ ] **Step 1: Write failing script/lifecycle tests**

Assert that root `dev:lab` resolves to Vite with `--host 127.0.0.1 --port 5173 --strictPort`, preview resolves to `127.0.0.1:4174 --strictPort`, Vite base is `./`, an occupied port fails instead of drifting, and teardown closes both listeners idempotently.

- [ ] **Step 2: Run script tests and verify red**

Run: `npm.cmd run test:unit -- --test-name-pattern="Lab|browser server"`

Expected: FAIL because the durable script contract is incomplete.

- [ ] **Step 3: Add durable dev/preview scripts**

Use direct workspace `vite` commands so nested npm forwarding cannot drop flags:

```json
{
  "dev:lab": "npm exec --workspace @pomegranate-ui/workbench-lab -- vite --host 127.0.0.1 --port 5173 --strictPort",
  "preview:lab": "npm exec --workspace @pomegranate-ui/workbench-lab -- vite preview --host 127.0.0.1 --port 4174 --strictPort"
}
```

Keep Playwright startup on the production artifact and expose the actual bound URLs from the server helper.

- [ ] **Step 4: Write failing wide/compact/focus/Catalog browser tests**

At `1440x900`, `1024x768`, and `390x844`, assert top-shelf height and ordering, readable transcript measure, dock visibility/collapse, Panel tabs or compact selector, Widget geometry bounds, no horizontal overflow, 44px coarse-pointer targets, focus-mode staging, drawer and expanded Catalog geometry, visual/compact results, category counts, and stable data attributes.

- [ ] **Step 5: Write failing interaction/error/keyboard tests**

Exercise Panel activation/reorder/create, menu docking into an occupied edge, floating geometry/stacking, unavailable renderer status, renderer failure containment, sibling usability, Tab order, arrow/menu reorder, keyboard Catalog placement, persistence reload, and unmodified host story identity. Keep the eight existing contract IDs in the replacement test titles.

- [ ] **Step 6: Run browser tests and correct implementation gaps**

Run: `npm.cmd run test:browser -- --grep "native workbench"`

Expected first run: FAIL on unimplemented geometry or state details. Change Svelte recipes/Lab CSS and framework-neutral controllers, never preserved prototype files, until all literal behavior is green.

- [ ] **Step 7: Capture and review narrow native visual baselines**

Capture only named stable states: `wide-scene`, `wide-catalog-drawer`, `wide-catalog-expanded`, `focus-transcript`, `compact-scene`, `compact-settings`, `floating-widget`, and `renderer-error`. Disable animation, wait for local fonts, mask changing diagnostics, compare against the approved mockup surfaces, and commit only the reviewed native snapshots.

- [ ] **Step 8: Verify local and static artifact behavior**

Run `npm.cmd run dev:lab`, verify HTTP 200 at `http://127.0.0.1:5173/`, edit/reload through Vite during development, and stop the server cleanly. Then run `npm.cmd run build` plus `npm.cmd run preview:lab`, verify HTTP 200 at `http://127.0.0.1:4174/`, and confirm the preview serves only `apps/workbench-lab/dist`.

- [ ] **Step 9: Commit Task 6**

```powershell
git add package.json apps/workbench-lab/package.json apps/workbench-lab/vite.config.ts tests/browser tests/unit/browser-server-lifecycle.test.mjs tests/unit/lab-scripts.test.mjs
git commit -m "test(lab): prove mockup fidelity"
```

### Task 7: Add Packed Svelte Consumer, Recipe Provenance, and Evidence Remapping

**Files:**
- Modify: `scripts/verify-packed-consumers.mjs`
- Modify: `tests/unit/packed-consumer.test.mjs`
- Modify: `tests/unit/repository-boundary.test.mjs`
- Modify: `provenance/native-contract-evidence.json`
- Modify: `scripts/generate-contract-index.mjs`
- Modify: `scripts/generate-migration-report.mjs`
- Modify: `tests/unit/report.test.mjs`
- Modify: `provenance/contract-index.json`
- Modify: `provenance/migration-report.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: packed tarballs for neutral packages, Svelte package, testkit, and copied recipe sources.
- Produces: a clean Svelte consumer build/conformance proof, deterministic recipe provenance, preserved contract identity, and current project documentation.

- [ ] **Step 1: Write failing clean-consumer and boundary tests**

Require the pack verifier to install only generated tarballs plus exact Svelte dev dependencies in a temporary directory, copy recipes through the non-destructive tool, run `svelte-check`, build with Vite, and execute renderer conformance. Reject workspace links, repository-source imports, SvelteKit imports, active React packages, and missing recipe hashes.

- [ ] **Step 2: Run focused tests and verify red**

Run: `npm.cmd run test:unit -- --test-name-pattern="packed|boundary|report"`

Expected: FAIL because the clean Svelte lane and evidence mapping are absent.

- [ ] **Step 3: Implement the packed Svelte consumer**

Generate a minimal `package.json`, `vite.config.ts`, `src/App.svelte`, `src/main.ts`, and renderer-harness test in the temporary consumer. Install with `--ignore-scripts`, assert resolved dependency paths remain inside the fixture, then build and run conformance.

- [ ] **Step 4: Remap native evidence without changing promoted IDs**

Change every existing `tests/browser/native-workbench.spec.ts` evidence reference to the Svelte replacement paths while retaining status `dual-green`. Add renderer contract entries only for genuinely new contracts. Regenerate the contract index and migration report deterministically; preserve zero retired and zero unaccounted evidence.

- [ ] **Step 5: Update active documentation**

Describe the `contracts -> layout -> core -> svelte` graph, headless Svelte package, source-owned recipes, mockup authority hierarchy, `npm.cmd run dev:lab`, build/preview workflow, static `dist` boundary, and non-goals. Keep historical React design documents unchanged.

- [ ] **Step 6: Verify and commit Task 7**

Run: `npm.cmd run test:pack`

Run: `npm.cmd run check:extraction`

Run: `npm.cmd run report`

```powershell
git add scripts tests/unit provenance README.md AGENTS.md
git commit -m "test(pack): prove Svelte consumer"
```

### Task 8: Retire React After Dual-Green Parity

**Files:**
- Delete: `packages/react/**`
- Delete: `apps/workbench-lab/src/main.tsx`
- Delete: `apps/workbench-lab/src/app.tsx`
- Delete: `apps/workbench-lab/src/widgets.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `tsconfig.tests.json`
- Modify: `vitest.config.ts`
- Modify: `apps/workbench-lab/package.json`
- Modify: `apps/workbench-lab/tsconfig.json`
- Modify: `apps/workbench-lab/vite.config.ts`
- Modify: `tests/unit/repository-boundary.test.mjs`

**Interfaces:**
- Consumes: green Tasks 1-7 verification and evidence remapping.
- Produces: one maintained Svelte view integration and no active React runtime, type, Vite, test, or documentation dependency.

- [ ] **Step 1: Run the pre-retirement parity gate**

Run: `npm.cmd run test:unit`

Run: `npm.cmd run typecheck`

Run: `npm.cmd run test:native`

Run: `npm.cmd run build`

Run: `npm.cmd run test:pack`

Run: `npm.cmd run test:browser`

Expected: PASS while React still exists temporarily.

- [ ] **Step 2: Strengthen boundary tests before deletion**

Add assertions that active manifests, lockfile packages, source imports, Vite plugins, testing libraries, and current documentation contain none of: `@pomegranate-ui/react`, `react`, `react-dom`, `@vitejs/plugin-react`, `@testing-library/react`, or `@types/react*`. Exempt only immutable historical design/provenance records and git history.

- [ ] **Step 3: Run the new boundary test and verify red**

Run: `npm.cmd run test:unit -- --test-name-pattern="boundary"`

Expected: FAIL while React dependencies and `packages/react` remain.

- [ ] **Step 4: Remove React and clean project configuration**

Delete the React workspace and superseded TSX sources. Remove React dependencies, project references, Vitest globs that exist only for TSX, Vite React configuration, and active README references. Run `npm.cmd install --package-lock-only` so the lockfile is deterministic and contains no active React package.

- [ ] **Step 5: Run focused retirement checks**

Run: `npm.cmd run test:unit -- --test-name-pattern="boundary"`

Run: `rg -n "@pomegranate-ui/react|react-dom|@vitejs/plugin-react|@testing-library/react|@types/react" package.json package-lock.json packages apps tests scripts README.md AGENTS.md`

Expected: boundary test PASS and `rg` returns no active match.

- [ ] **Step 6: Commit Task 8**

```powershell
git add -A packages/react apps/workbench-lab package.json package-lock.json tsconfig.json tsconfig.tests.json vitest.config.ts tests/unit/repository-boundary.test.mjs README.md
git commit -m "refactor: retire React view layer"
```

### Task 9: Complete Full Verification and Final Review

**Files:**
- Modify only files required to correct failures attributable to Tasks 1-8.

**Interfaces:**
- Consumes: the completed Svelte rebuild.
- Produces: fresh full-gate evidence, a scoped final diff, and a clean committed repository state.

- [ ] **Step 1: Run every named verification command independently**

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

Record exact pass counts for core tests, Svelte tests, renderer conformance, packed consumers, Atmospheric harness, Widget Overhaul harness, native browser tests, and visual snapshots.

- [ ] **Step 2: Inspect build and repository boundaries**

Confirm `apps/workbench-lab/dist` is self-contained, relative-base static output; no source map or bundle contains repository-absolute paths, Sonder server code, React, credentials, or network-only assets. Confirm the preserved artifact hashes still match `provenance/extraction-manifest.json`.

- [ ] **Step 3: Review the complete branch diff**

Run: `git diff origin/main...HEAD --check`

Run: `git status --short`

Verify that every changed file belongs to the approved rebuild, generated provenance is deterministic, and no unrelated user work was staged or modified.

- [ ] **Step 4: Report the completed result**

Report the Svelte package and recipe boundary, mockup surfaces rebuilt, local URLs and commands, static artifact location, React retirement, contract/provenance status, exact verification counts, commit range, and explicitly unchanged scopes: npm publication, Sonder, and production hosting.
