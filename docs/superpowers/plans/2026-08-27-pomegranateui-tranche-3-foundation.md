# PomegranateUI Tranche 3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the first framework-neutral TypeScript Panel/Widget slice with React bindings, packed consumers, and eight dual-green preservation contracts.

**Architecture:** Use separately packable npm workspaces with `contracts -> layout -> core -> react` runtime dependencies and a public-only `testkit`. The Workbench Lab and clean consumer fixtures use package APIs exactly as adopters do; Sonder-shaped data crosses a plain adapter and no Sonder code enters a package.

**Tech Stack:** Node.js 24, npm workspaces, TypeScript 7.0.2, React 19.2.8, Vite 8.2.2, Vitest 4.1.11, jsdom 30.0.1, Testing Library React 16.3.3, Testing Library DOM Matchers 7.0.1, Testing Library User Event 14.6.6, Node types 26.4.0, and Playwright 1.62.1.

**Spec:** `docs/superpowers/specs/2026-08-27-pomegranateui-tranche-3-foundation-design.md`

## Global Constraints

- PomegranateUI remains a developer toolkit, not an application frontend.
- Packages never import Sonder server or frontend code.
- Backend and domain state never enter PomegranateUI layout snapshots.
- Implemented package outputs are ESM JavaScript, declarations, declaration maps, and source maps.
- TypeScript uses `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- React is a peer dependency of `@pomegranate-ui/react`; the framework-neutral packages contain no React or DOM imports.
- Rejected commands preserve the prior state by reference and by value.
- The persistence schema is exactly `pomegranate.ui.layout.v1`.
- Pointer drag, Catalog discovery, nested sub-panels, responsive geometry, accessibility placement, and theme contracts remain outside this plan.
- The eight named preservation contracts change to `dual-green` only after native evidence and both preserved harnesses pass.
- No baseline artifact is edited or retired; unaccounted contracts remain zero.
- Packages remain private and are verified with `npm pack`; no npm publication occurs.
- Use `npm.cmd` on Windows.

---

### Task 1: Establish strict TypeScript workspaces

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `tests/unit/repository-boundary.test.mjs`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `tsconfig.tests.json`
- Create: `vitest.config.ts`
- Create: `tests/native/setup.ts`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/layout/package.json`
- Create: `packages/layout/tsconfig.json`
- Create: `packages/layout/src/index.ts`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/src/index.ts`
- Create: `packages/testkit/package.json`
- Create: `packages/testkit/tsconfig.json`
- Create: `packages/testkit/src/index.ts`

**Interfaces:**
- Consumes: the Tranche 3 package dependency graph from the design.
- Produces: buildable workspaces named `@pomegranate-ui/contracts`, `@pomegranate-ui/layout`, `@pomegranate-ui/core`, `@pomegranate-ui/react`, and `@pomegranate-ui/testkit` at version `0.1.0-private.0`.

- [ ] **Step 1: Replace the Tranches 0-2 boundary assertions with failing Tranche 3 assertions**

Update `tests/unit/repository-boundary.test.mjs` so it requires each implemented package to have `package.json`, `tsconfig.json`, and `src/index.ts`; requires npm workspaces; requires `typecheck`, `test:native`, and `build` scripts; and rejects React imports under `contracts`, `layout`, and `core`. Keep every preserved-evidence and toolkit-boundary assertion. `test:pack` becomes required when Task 8 adds its executable verifier.

```js
test('Tranche 3 exposes strict separately packable packages', async () => {
  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(rootPackage.workspaces, ['packages/*', 'apps/*', 'examples/*']);
  for (const name of ['contracts', 'layout', 'core', 'react', 'testkit']) {
    const manifest = JSON.parse(await readFile(path.join(root, 'packages', name, 'package.json'), 'utf8'));
    assert.equal(manifest.name, `@pomegranate-ui/${name}`);
    assert.equal(manifest.private, true);
    assert.ok(manifest.exports['.']);
  }
});
```

- [ ] **Step 2: Run the boundary test and verify it fails**

Run: `node --test tests/unit/repository-boundary.test.mjs`

Expected: FAIL because workspace package manifests and TypeScript scripts are absent.

- [ ] **Step 3: Add the pinned toolchain and workspace manifests**

Set root workspaces to `packages/*`, `apps/*`, and `examples/*`. Add exact dev dependencies:

```json
{
  "@testing-library/react": "16.3.3",
  "@testing-library/jest-dom": "7.0.1",
  "@testing-library/user-event": "14.6.6",
  "@types/node": "26.4.0",
  "@types/react": "19.2.18",
  "@types/react-dom": "19.2.5",
  "@vitejs/plugin-react": "6.1.0",
  "jsdom": "30.0.1",
  "react": "19.2.8",
  "react-dom": "19.2.8",
  "typescript": "7.0.2",
  "vite": "8.2.2",
  "vitest": "4.1.11"
}
```

Add scripts with these exact entry points:

```json
{
  "typecheck": "tsc -b --pretty false",
  "test:native": "vitest run",
  "build": "tsc -b"
}
```

Each package manifest uses `type: module`, `private: true`, `files: ["dist", "README.md"]`, and exports `dist/index.js` plus `dist/index.d.ts`. Internal dependencies use exact `0.1.0-private.0`; React uses peer range `>=18.2.0 <20` while the workspace dev version stays pinned to 19.2.8.

- [ ] **Step 4: Add strict project references**

`tsconfig.base.json` sets `target: ES2024`, `module: NodeNext`, `moduleResolution: NodeNext`, `lib: ["ES2024"]`, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`, `declaration: true`, `declarationMap: true`, `sourceMap: true`, `composite: true`, and `skipLibCheck: true`.

Root `tsconfig.json` references packages in dependency order. Package configs set `rootDir: src`, `outDir: dist`, exclude `src/**/*.test.ts` and `src/**/*.test.tsx`, and carry their dependency references. React sets `jsx: react-jsx` and adds `DOM` plus `DOM.Iterable`; the Workbench Lab does the same. Framework-neutral package configs inherit the ES-only library so accidental DOM types fail typecheck.

Add `tsconfig.tests.json` with `noEmit: true`, `composite: false`, `jsx: react-jsx`, DOM libraries, Node/Vitest/jest-dom types, and includes for package/example native tests plus TypeScript Playwright tests. Change `typecheck` to `tsc -b --pretty false && tsc -p tsconfig.tests.json --noEmit --pretty false`, so tests are strict without entering package tarballs. Configure Vitest to load `tests/native/setup.ts`, whose only import is `@testing-library/jest-dom/vitest`.

Create initial `src/index.ts` files with one exported package-version constant each so every package emits a real module:

```ts
export const POMEGRANATE_CONTRACTS_VERSION = '0.1.0-private.0' as const;
```

Use the matching constant name per package.

- [ ] **Step 5: Update root and package documentation**

Remove claims that production TypeScript is absent or packages are merely reserved. Document the package graph, the private-incubator status, the native check commands, and the unchanged adopter/backend boundary. Keep `theme` explicitly reserved.

- [ ] **Step 6: Install and verify the scaffold**

Run:

```powershell
npm.cmd install
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run build
```

Expected: all commands pass and each implemented package contains `dist/index.js`, `dist/index.d.ts`, maps, and no CommonJS output.

- [ ] **Step 7: Commit the toolchain**

```powershell
git add package.json package-lock.json tsconfig.base.json tsconfig.json tsconfig.tests.json vitest.config.ts README.md AGENTS.md tests/native/setup.ts tests/unit/repository-boundary.test.mjs packages
git commit -m "build: establish TypeScript workspaces"
```

### Task 2: Define framework-neutral public contracts

**Files:**
- Create: `packages/contracts/src/ids.ts`
- Create: `packages/contracts/src/json.ts`
- Create: `packages/contracts/src/model.ts`
- Create: `packages/contracts/src/commands.ts`
- Create: `packages/contracts/src/events.ts`
- Create: `packages/contracts/src/storage.ts`
- Create: `packages/contracts/src/contracts.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/README.md`

**Interfaces:**
- Consumes: no PomegranateUI runtime package.
- Produces: `asPanelId`, `asWidgetInstanceId`, `asWidgetType`, `WidgetManifest`, `WidgetInstance`, `PanelState`, `WidgetPlacement`, `WorkbenchState`, `LayoutSnapshotV1`, `WorkbenchCommand`, `WorkbenchEvent`, `CommandResult`, and `LayoutStorage`.

- [ ] **Step 1: Write failing public-contract tests**

Create tests that prove non-empty branded ids, JSON-safe configuration, the exact state/snapshot schema strings, docked and floating discriminants, command exhaustiveness, and storage round trips.

```ts
import { describe, expect, it } from 'vitest';
import { asPanelId, asWidgetType, isJsonValue } from './index.js';

describe('public contracts', () => {
  it('rejects blank public ids', () => {
    expect(() => asPanelId('  ')).toThrow(/PanelId/);
    expect(asWidgetType('story.summary')).toBe('story.summary');
  });

  it('admits only JSON-safe values', () => {
    expect(isJsonValue({ safe: ['yes', 1, true, null] })).toBe(true);
    expect(isJsonValue({ unsafe: new Date() })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the contracts test and verify RED**

Run: `npm.cmd exec vitest run packages/contracts/src/contracts.test.ts`

Expected: FAIL because the public contracts do not exist.

- [ ] **Step 3: Implement ids and JSON safety**

Define branded aliases whose serialized form remains a string:

```ts
declare const brand: unique symbol;
export type BrandedId<Name extends string> = string & { readonly [brand]: Name };
export type PanelId = BrandedId<'PanelId'>;
export type WidgetInstanceId = BrandedId<'WidgetInstanceId'>;
export type WidgetType = BrandedId<'WidgetType'>;
```

`asPanelId`, `asWidgetInstanceId`, and `asWidgetType` trim nothing and reject an empty or surrounding-whitespace value. Define recursive `JsonValue`, `JsonObject`, and `isJsonValue` without accepting `undefined`, functions, symbols, bigint, class instances, or non-finite numbers.

- [ ] **Step 4: Implement the state, command, event, result, and storage types**

Use these exact discriminants:

```ts
export type WidgetPlacement =
  | { readonly kind: 'docked'; readonly panelId: PanelId; readonly edge: 'left' | 'main' | 'right'; readonly shelfId: string; readonly order: number }
  | { readonly kind: 'floating'; readonly panelId: PanelId; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly z: number };

export type WorkbenchCommand =
  | { readonly type: 'panel.create'; readonly panel: PanelState }
  | { readonly type: 'panel.activate'; readonly panelId: PanelId }
  | { readonly type: 'panel.reorder'; readonly panelId: PanelId; readonly toIndex: number }
  | { readonly type: 'widget.create'; readonly instance: WidgetInstance; readonly placement: WidgetPlacement }
  | { readonly type: 'widget.place'; readonly instanceId: WidgetInstanceId; readonly placement: WidgetPlacement }
  | { readonly type: 'widget.remove'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'layout.hydrate'; readonly state: WorkbenchState };
```

`WorkbenchState.schema` is `pomegranate.ui.state.v1`. `LayoutSnapshotV1.schema` is `pomegranate.ui.layout.v1`. `LayoutStorage` has async `load(key)`, `save(key,value)`, and optional `remove(key)` methods. Command errors use stable codes `DUPLICATE_ID`, `MISSING_PANEL`, `MISSING_WIDGET`, `UNKNOWN_WIDGET_TYPE`, `INVALID_INDEX`, `INVALID_PLACEMENT`, and `INVALID_SNAPSHOT`.

- [ ] **Step 5: Export the public surface and verify GREEN**

Run:

```powershell
npm.cmd exec vitest run packages/contracts/src/contracts.test.ts
npm.cmd run typecheck
```

Expected: tests and strict typecheck pass; `contracts` contains no React or DOM imports.

- [ ] **Step 6: Commit contracts**

```powershell
git add packages/contracts
git commit -m "feat(contracts): define workbench protocol"
```

### Task 3: Implement atomic layout and persistence

**Files:**
- Create: `packages/layout/src/errors.ts`
- Create: `packages/layout/src/state.ts`
- Create: `packages/layout/src/operations.ts`
- Create: `packages/layout/src/persistence.ts`
- Create: `packages/layout/src/operations.test.ts`
- Create: `packages/layout/src/persistence.test.ts`
- Modify: `packages/layout/src/index.ts`
- Modify: `packages/layout/README.md`

**Interfaces:**
- Consumes: all state and id contracts from `@pomegranate-ui/contracts`.
- Produces: `createInitialWorkbenchState`, `createPanel`, `activatePanel`, `reorderPanel`, `createWidget`, `placeWidget`, `removeWidget`, `encodeLayoutSnapshot`, `decodeLayoutSnapshot`, `loadLayout`, and `saveLayout`.

- [ ] **Step 1: Write failing atomic-operation tests**

Cover unique ids, active Panel repair, contiguous orders, dock append into a populated edge, floating geometry, exactly-one placement, remove cleanup, and state-reference preservation on rejection.

```ts
it('rejects an invalid move without changing state identity', () => {
  const before = populatedState();
  const result = placeWidget(before, asWidgetInstanceId('missing'), dock('scene', 'left', 1));
  expect(result.ok).toBe(false);
  expect(result.state).toBe(before);
});

it('appends a dock shelf in a populated destination', () => {
  const result = placeWidget(populatedState(), widgetId('world'), dock('scene', 'left', 99));
  expect(result.ok && result.state.placements.world).toMatchObject({ edge: 'left', order: 1 });
});
```

- [ ] **Step 2: Run the operation tests and verify RED**

Run: `npm.cmd exec vitest run packages/layout/src/operations.test.ts`

Expected: FAIL because layout operations are absent.

- [ ] **Step 3: Implement immutable normalized operations**

Every function returns:

```ts
export type LayoutResult =
  | { readonly ok: true; readonly state: WorkbenchState }
  | { readonly ok: false; readonly state: WorkbenchState; readonly error: CommandError };
```

Validate the entire requested transition before cloning. On failure return the original `state`. On success clone only changed collections, increment revision once, normalize Panel order and dock order, and retain accepted floating geometry exactly.

- [ ] **Step 4: Verify operation GREEN**

Run: `npm.cmd exec vitest run packages/layout/src/operations.test.ts`

Expected: all operation tests pass.

- [ ] **Step 5: Write failing persistence tests**

Prove deterministic encoding, a byte-stable encode/decode/encode round trip, asynchronous storage, retained unresolved types, malformed cross-reference rejection, unknown future schema rejection, finite geometry checks, and unchanged current state after a decode error.

```ts
it('keeps the last good state when hydration is invalid', () => {
  const before = populatedState();
  const decoded = decodeLayoutSnapshot('{"schema":"future.v9"}', before);
  expect(decoded.ok).toBe(false);
  expect(decoded.state).toBe(before);
  expect(decoded.error.code).toBe('INVALID_SNAPSHOT');
});
```

- [ ] **Step 6: Run persistence tests and verify RED**

Run: `npm.cmd exec vitest run packages/layout/src/persistence.test.ts`

Expected: FAIL because codecs and storage helpers are absent.

- [ ] **Step 7: Implement `pomegranate.ui.layout.v1`**

Serialize object keys in a fixed construction order and sort record keys. Decode into fresh null-prototype records, validate every id and reference, normalize orders, and return named diagnostics. `loadLayout` reads through `LayoutStorage`; `saveLayout` saves only the UI snapshot string. Do not call browser storage APIs.

- [ ] **Step 8: Verify and commit layout**

Run:

```powershell
npm.cmd exec vitest run packages/layout/src
npm.cmd run typecheck
git add packages/layout
git commit -m "feat(layout): add atomic placement storage"
```

### Task 4: Implement the deterministic core store and Widget registry

**Files:**
- Create: `packages/core/src/registry.ts`
- Create: `packages/core/src/store.ts`
- Create: `packages/core/src/registry.test.ts`
- Create: `packages/core/src/store.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/README.md`

**Interfaces:**
- Consumes: contracts and layout operations.
- Produces: `createWidgetRegistry`, `createWorkbenchStore`, `WidgetRegistry`, and `WorkbenchStore`.

- [ ] **Step 1: Write failing registry and store tests**

Test duplicate manifest rejection, manifest unregister without instance deletion, unknown type rejection on creation, unresolved hydrated instances, synchronous snapshots, subscription ordering, one revision per accepted command, stable events, and no notification on rejection.

```ts
it('publishes one event after an accepted command', () => {
  const store = createWorkbenchStore(fixtureOptions());
  const seen: number[] = [];
  store.subscribe((state) => seen.push(state.revision));
  const result = store.dispatch({ type: 'panel.activate', panelId: panelId('library') });
  expect(result.ok).toBe(true);
  expect(seen).toEqual([1]);
  expect(result.events[0]?.type).toBe('panel.activated');
});
```

- [ ] **Step 2: Run core tests and verify RED**

Run: `npm.cmd exec vitest run packages/core/src`

Expected: FAIL because registry and store APIs are absent.

- [ ] **Step 3: Implement registry and dispatch**

`WidgetRegistry` exposes `register`, `unregister`, `get`, `has`, and `list`. It copies and freezes admitted manifests. `WorkbenchStore` exposes `getState`, `dispatch`, `subscribe`, and `registry`. Dispatch switches exhaustively over `WorkbenchCommand`, calls layout functions, emits one frozen event per accepted transition, and returns the original state with zero events on rejection.

Use `useSyncExternalStore`-compatible subscription semantics: subscribe returns an idempotent unsubscribe function and listeners run from a snapshot so unsubscription during notification is safe.

- [ ] **Step 4: Verify core and package boundaries**

Run:

```powershell
npm.cmd exec vitest run packages/core/src
npm.cmd run typecheck
rg -n "from ['\"]react|document\.|window\." packages/contracts/src packages/layout/src packages/core/src
```

Expected: tests/typecheck pass and `rg` finds no framework or browser dependency.

- [ ] **Step 5: Commit core**

```powershell
git add packages/core
git commit -m "feat(core): add Panel Widget state store"
```

### Task 5: Add React bindings and renderer containment

**Files:**
- Create: `packages/react/src/renderer-registry.tsx`
- Create: `packages/react/src/provider.tsx`
- Create: `packages/react/src/error-boundary.tsx`
- Create: `packages/react/src/components.tsx`
- Create: `packages/react/src/react.test.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/README.md`

**Interfaces:**
- Consumes: `WorkbenchStore`, public contracts, and React 18/19 APIs.
- Produces: `createWidgetRendererRegistry<THostContext>`, `WorkbenchProvider`, `useWorkbenchState`, `useWorkbenchDispatch`, `PanelTabs`, `WorkbenchView`, `WidgetFrame`, and `WidgetErrorBoundary`.

- [ ] **Step 1: Write failing component tests in jsdom**

Add `// @vitest-environment jsdom`. Prove subscription rendering, active-tab ARIA state, accessible left/right reorder controls, dock order, floating geometry, generic host context delivery, unresolved fallback, and one-renderer error containment.

```tsx
it('activates a Panel without changing host context', async () => {
  const host = { storyId: 'story-7' };
  render(<Harness host={host} />);
  await userEvent.click(screen.getByRole('tab', { name: 'Library' }));
  expect(screen.getByRole('tab', { name: 'Library' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByTestId('story-id')).toHaveTextContent('story-7');
});
```

- [ ] **Step 2: Run React tests and verify RED**

Run: `npm.cmd exec vitest run packages/react/src/react.test.tsx`

Expected: FAIL because bindings and primitives are absent.

- [ ] **Step 3: Implement typed renderer registry and provider**

`createWidgetRendererRegistry<THostContext>()` maps `WidgetType` to `ComponentType<WidgetRendererProps<THostContext>>`. Duplicate registration is rejected. `WorkbenchProvider` holds store, renderer registry, and generic host context in React contexts. `useWorkbenchState` uses `useSyncExternalStore`.

- [ ] **Step 4: Implement structural components**

`PanelTabs` uses `role=tablist`, stable `role=tab` ids, `aria-selected`, and buttons labelled `Move {name} left/right`. `WorkbenchView` renders left/main/right dock regions and a floating layer for the active Panel. `WidgetFrame` exposes a labelled action menu with `Dock left`, `Dock right`, and `Float`; commands route through the store. Floating styles use accepted x/y/width/height values. No package stylesheet or Sonder class name ships.

`WidgetErrorBoundary` renders `role=alert` with the Widget title and keeps sibling frames mounted.

- [ ] **Step 5: Verify React and commit**

Run:

```powershell
npm.cmd exec vitest run packages/react/src
npm.cmd run typecheck
git add packages/react
git commit -m "feat(react): bind source-owned Widget views"
```

### Task 6: Add reusable testkit conformance drivers

**Files:**
- Create: `packages/testkit/src/contract-ids.ts`
- Create: `packages/testkit/src/fixtures.ts`
- Create: `packages/testkit/src/conformance.ts`
- Create: `packages/testkit/src/conformance.test.ts`
- Modify: `packages/testkit/src/index.ts`
- Modify: `packages/testkit/README.md`

**Interfaces:**
- Consumes: public contracts, layout, and core APIs only.
- Produces: `FIRST_SLICE_CONTRACT_IDS`, `createConformanceFixture`, `runCoreConformance`, and `assertCoreConformance`.

- [ ] **Step 1: Write failing conformance tests**

Define the exact eight ids in `FIRST_SLICE_CONTRACT_IDS`. The driver accepts a store factory and returns frozen results containing `contractId`, `passed`, and a plain diagnostic. Tests prove all results pass for the native store and fail meaningfully for a deliberately broken factory.

```ts
expect(runCoreConformance(() => createWorkbenchStore(options))).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ contractId: 'POM-PANEL-07856BFE9A', passed: true })
  ])
);
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd exec vitest run packages/testkit/src/conformance.test.ts`

Expected: FAIL because testkit APIs are absent.

- [ ] **Step 3: Implement public-only drivers**

Build fixtures through exported id helpers and public store APIs. Do not reach into package internals. Activation checks host/domain data by carrying a separate immutable fixture object. Docking checks an occupied left edge and order normalization. Persistence checks the v1 codec and Panel ordering.

- [ ] **Step 4: Verify and commit testkit**

Run:

```powershell
npm.cmd exec vitest run packages/testkit/src
npm.cmd run typecheck
git add packages/testkit
git commit -m "test(testkit): add first-slice conformance"
```

### Task 7: Build the Workbench Lab and native browser proof

**Files:**
- Create: `apps/workbench-lab/package.json`
- Create: `apps/workbench-lab/tsconfig.json`
- Create: `apps/workbench-lab/vite.config.ts`
- Create: `apps/workbench-lab/index.html`
- Create: `apps/workbench-lab/src/main.tsx`
- Create: `apps/workbench-lab/src/app.tsx`
- Create: `apps/workbench-lab/src/widgets.tsx`
- Create: `apps/workbench-lab/src/storage.ts`
- Create: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/README.md`
- Create: `tests/browser/native-workbench.spec.ts`
- Modify: `playwright.config.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the five package public APIs.
- Produces: a Vite-built inspectable Lab at port 4174 and browser evidence containing every first-slice contract id.

- [ ] **Step 1: Write failing Playwright scenarios**

Add four tests whose titles contain both baseline ids for their behavior:

```ts
test('POM-PANEL-07856BFE9A POM-PANEL-DF4EC7C581 activates a Panel without changing story identity', async ({ page }) => {});
test('POM-PANEL-0C32491298 POM-PANEL-E6D6A0E64B appends menu docking to an occupied edge', async ({ page }) => {});
test('POM-PERSIST-842D422EB3 POM-PERSIST-9FA69F9FC1 restores a user Panel template and order', async ({ page }) => {});
test('POM-PERSIST-28DFDC9A8F POM-PERSIST-D50D69D3C4 restores reordered Panels', async ({ page }) => {});
```

Each test opens `http://127.0.0.1:4174`, uses roles or stable Lab data attributes, reloads where required, and asserts visible state after reload.

- [ ] **Step 2: Run native browser tests and verify RED**

Run: `npm.cmd exec playwright test tests/browser/native-workbench.spec.ts`

Expected: FAIL because the Lab server and application are absent.

- [ ] **Step 3: Implement the Lab as an adopter**

Register `story.summary` and `system.status` manifests and React renderers. Initialize Scene and Library Panels with an occupied Scene left dock. Keep `{ storyId: 'story-lab-1' }` in app-owned host context and render it separately. Provide:

- Panel tabs and accessible reorder controls;
- a labelled create-Panel form with name, template, and column count;
- Widget menu docking and floating controls;
- Save, Reload saved layout, Clear saved layout, and Invalid move controls;
- a visible event log and current revision; and
- application-local CSS for readable docks and floating geometry.

Use a Lab-owned `LayoutStorage` wrapper over `localStorage`; packages never call it directly.

- [ ] **Step 4: Serve both browser lanes**

Keep the existing static server at 4173. Add a second Playwright `webServer` entry running `npm run preview:lab -- --host 127.0.0.1 --port 4174`. Change root `build` to `tsc -b && npm run build --workspace @pomegranate-ui/workbench-lab`, add `preview:lab` and `pretest:browser: npm run build`, and keep both preserved harness tests unchanged.

- [ ] **Step 5: Verify native and preserved browser GREEN**

Run:

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts
npm.cmd run test:browser
```

Expected: four native scenarios pass; Atmospheric Workbench reports 95/95; Widget overhaul reports 212/212.

- [ ] **Step 6: Commit the Lab**

```powershell
git add apps/workbench-lab tests/browser/native-workbench.spec.ts playwright.config.mjs package.json package-lock.json
git commit -m "feat(lab): prove Panel Widget vertical slice"
```

### Task 8: Verify packed packages and clean consumers

**Files:**
- Create: `examples/mock-roleplay-backend/package.json`
- Create: `examples/mock-roleplay-backend/tsconfig.json`
- Create: `examples/mock-roleplay-backend/src/index.ts`
- Create: `examples/mock-roleplay-backend/src/index.test.ts`
- Modify: `examples/mock-roleplay-backend/README.md`
- Create: `examples/sonder-integration/package.json`
- Create: `examples/sonder-integration/tsconfig.json`
- Create: `examples/sonder-integration/src/adapter.ts`
- Create: `examples/sonder-integration/src/adapter.test.ts`
- Modify: `examples/sonder-integration/README.md`
- Create: `scripts/verify-packed-consumers.mjs`
- Create: `tests/unit/packed-consumer.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: package tarballs and public exports only.
- Produces: clean-install proof for a backend-neutral consumer and a Sonder-shaped plain-data adapter with no repository import.

- [ ] **Step 1: Write failing boundary and consumer tests**

`packed-consumer.test.mjs` statically scans package and example imports. Reject `Sonder_Engine`, absolute drive paths, imports escaping an example, package-internal `src/` imports, and any React import outside `packages/react`, Workbench Lab, or consumer UI.

The mock consumer test creates a store, places a Widget, encodes/reloads it, and asserts the backend record remains a separate object. The Sonder-shaped adapter test maps `{ active_story_id, capabilities }` to `{ storyId, capabilities }` without importing Sonder modules.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --test tests/unit/packed-consumer.test.mjs
npm.cmd exec vitest run examples
```

Expected: FAIL because consumers and pack verifier are absent.

- [ ] **Step 3: Implement both consumers**

Give each example its own private package manifest, strict TypeScript config, public package imports, build script, and Vitest tests. Keep all fixtures plain and small; no copied Sonder implementation or mock backend hidden inside PomegranateUI packages.

- [ ] **Step 4: Implement clean tarball verification**

`scripts/verify-packed-consumers.mjs` must:

1. create a temporary directory with `mkdtemp`;
2. run `npm pack --json --pack-destination <temp>` for each implemented package;
3. parse each tarball with `npm pack --dry-run --json` evidence and reject `src`, tests, prototypes, or provenance files in package contents;
4. copy each example into a separate clean directory;
5. rewrite only dependency values to absolute `file:` tarball paths;
6. run `npm install --ignore-scripts`, `npm run build`, and `npm test` in each clean directory; and
7. remove only the exact temporary root in `finally`.

Use `npm.cmd` on Windows and `npm` elsewhere through `spawnSync` argument arrays without a shell.

Add root script `test:pack: node scripts/verify-packed-consumers.mjs` and extend the repository-boundary test so the script and verifier file are both required.

- [ ] **Step 5: Verify packed consumers GREEN**

Run:

```powershell
npm.cmd run test:native
npm.cmd run build
npm.cmd run test:pack
```

Expected: both examples build/test from tarballs; package content contains only `dist`, package metadata, and README.

- [ ] **Step 6: Commit consumers**

```powershell
git add examples scripts/verify-packed-consumers.mjs tests/unit/packed-consumer.test.mjs package.json package-lock.json
git commit -m "test: verify packed clean consumers"
```

### Task 9: Make native contract evidence deterministic and dual-green

**Files:**
- Create: `provenance/native-contract-evidence.json`
- Modify: `scripts/generate-contract-index.mjs`
- Modify: `scripts/verify-extraction.mjs`
- Modify: `scripts/generate-migration-report.mjs`
- Modify: `tests/unit/contracts.test.mjs`
- Modify: `tests/unit/extraction.test.mjs`
- Modify: `tests/unit/report.test.mjs`
- Modify: `.gitattributes`
- Regenerate: `provenance/contract-index.json`
- Regenerate: `provenance/extraction-manifest.json`
- Regenerate: `provenance/extraction-ledger.md`
- Regenerate: `provenance/migration-report.md`

**Interfaces:**
- Consumes: exact native Playwright test ids and the existing generated contract index.
- Produces: a reviewed overlay that is the only source allowed to promote a baseline contract to `native-test-added` or `dual-green`.

- [ ] **Step 1: Write failing overlay and verifier tests**

Add tests that reject unknown ids, duplicate overlay ids, unsupported statuses, missing native files, evidence files that do not contain their cited id, dual-green entries without preserved evidence, and stale generated reports. Require exactly eight dual-green ids in production.

```js
assert.deepEqual(
  index.contracts.filter((item) => item.status === 'dual-green').map((item) => item.contractId).sort(),
  [...expectedFirstSliceIds].sort()
);
```

- [ ] **Step 2: Run focused provenance tests and verify RED**

Run: `node --test tests/unit/contracts.test.mjs tests/unit/extraction.test.mjs tests/unit/report.test.mjs`

Expected: FAIL because the native evidence overlay and enforcement do not exist.

- [ ] **Step 3: Add the native evidence overlay**

Create schema version 1 with eight entries. Each entry has `contractId`, `status: dual-green`, and `nativeEvidence: ["tests/browser/native-workbench.spec.ts"]`.

- [ ] **Step 4: Merge overlay evidence during generation**

Extend `buildContractIndex` with a `nativeEvidence` input. Build preserved contracts first, validate the overlay against their ids, append native paths after the preserved path, and change only the mapped status. Main reads the overlay and writes the index and manifest deterministically.

- [ ] **Step 5: Enforce native evidence in extraction verification**

For `native-test-added` or `dual-green`, require at least one destination path outside `prototypes/`; require the file to exist; require its UTF-8 text to contain the contract id; and require the preserved source path to remain in destination evidence. Reject retired contracts exactly as before.

- [ ] **Step 6: Add line-ending protection and regenerate reports**

Add `-text` entries for `provenance/contract-index.json`, `provenance/extraction-manifest.json`, and `provenance/native-contract-evidence.json`. Run:

```powershell
node scripts/generate-contract-index.mjs --write
node scripts/generate-migration-report.mjs --write
node --test tests/unit/contracts.test.mjs tests/unit/extraction.test.mjs tests/unit/report.test.mjs
npm.cmd run check:extraction
npm.cmd run report
```

Expected report totals: 497 baseline contracts, 8 dual-green, 54 Sonder-owned, 435 awaiting native port, and 0 unaccounted.

- [ ] **Step 7: Commit dual-green provenance**

```powershell
git add provenance scripts/generate-contract-index.mjs scripts/verify-extraction.mjs scripts/generate-migration-report.mjs tests/unit/contracts.test.mjs tests/unit/extraction.test.mjs tests/unit/report.test.mjs .gitattributes
git commit -m "test: record first dual-green contracts"
```

### Task 10: Integrate CI, documentation, and final audit

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: package and example READMEs where verification commands changed

**Interfaces:**
- Consumes: every implemented package, consumer, native test, and preserved oracle.
- Produces: one cross-platform `npm run check` gate and publishable private-repository evidence.

- [ ] **Step 1: Write failing CI/documentation boundary assertions**

Update `repository-boundary.test.mjs` to require CI to run strict typecheck, native tests, builds, packed consumers, extraction/report verification, and browser tests through `npm run check`. Require README commands to match package scripts and require explicit text that npm publication and Sonder cutover have not occurred.

- [ ] **Step 2: Run the boundary test and verify RED**

Run: `node --test tests/unit/repository-boundary.test.mjs`

Expected: FAIL until CI and docs name all native gates.

- [ ] **Step 3: Compose the root check and CI matrix**

Set the root check order to:

```json
"check": "npm run test:unit && npm run typecheck && npm run test:native && npm run build && npm run check:extraction && npm run report && npm run test:pack && npm run test:browser"
```

Keep Node 24, `npm ci`, Linux/Windows, pinned immutable GitHub Action SHAs, minimal `contents: read`, Chromium installation, and Playwright failure artifacts. Rename workflow/job copy to cover native and preservation verification without weakening any existing step.

- [ ] **Step 4: Run focused and full local verification**

Run:

```powershell
node --test tests/unit/repository-boundary.test.mjs
npm.cmd run check
git diff --check
git status --short
```

Expected: all unit/native/component/pack/browser/preservation gates pass; the only status paths are the intentional final documentation/CI changes before commit.

- [ ] **Step 5: Verify clean-clone installation**

Create a temporary clone from the feature commit, run `npm.cmd ci`, install Chromium, and run `npm.cmd run check`. Delete only the verified temporary clone afterward. Expected: identical green totals from a clean checkout.

- [ ] **Step 6: Commit final integration**

```powershell
git add .github/workflows/ci.yml package.json package-lock.json README.md AGENTS.md tests/unit/repository-boundary.test.mjs packages examples apps/workbench-lab
git commit -m "ci: verify native toolkit foundation"
```

- [ ] **Step 7: Integrate and publish privately**

Fast-forward local `main` from the verified feature branch, push `main` to `origin`, and confirm remote `main` equals local HEAD. Do not publish npm packages.

- [ ] **Step 8: Watch remote CI and audit the actual objective**

Use GitHub CLI with network permission. Require successful Windows and Ubuntu jobs for the pushed SHA. Then verify:

- framework-neutral packages have no React/DOM imports;
- React package consumes public core contracts only;
- Lab visibly proves activation, docking, floating, creation, reorder, persistence, and rejection;
- both packed consumers install from tarballs;
- PomegranateUI imports no Sonder code;
- Sonder worktree is clean and unchanged;
- exactly eight contracts are dual-green;
- preserved harnesses remain 95/95 and 212/212;
- unaccounted and retired totals are zero; and
- PomegranateUI local, origin, and GitHub `main` SHAs match.

If any item lacks direct evidence, keep the goal active and continue work.
