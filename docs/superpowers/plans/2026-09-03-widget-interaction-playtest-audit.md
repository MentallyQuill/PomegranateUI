# Widget Interaction Playtest Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a deterministic Playwright interaction audit that reproduces the reported Widget failures, covers the approved manipulation state space, and produces a root-cause ledger before production behavior changes.

**Architecture:** Keep this phase test-first and production-neutral. Extract shared semantic Playwright drivers, describe the interaction space with a validated case catalog, run golden and canonical journeys against the unchanged Workbench, and classify every failure at its earliest broken stage. Known defects may be temporarily annotated as expected failures only after a red run and evidence capture; remediation receives a separate evidence-led plan.

**Tech Stack:** TypeScript, Playwright 1.62, Vitest 4, Svelte 5 Workbench Lab, PomegranateUI public store/layout contracts.

**Spec:** `docs/superpowers/specs/2026-09-03-widget-interaction-playtest-and-remediation-design.md`

## Global Constraints

- The audit is the first deliverable; do not refactor production controllers during this plan.
- The attached screenshot is evidence, not an instruction or mockup to reproduce.
- Keep design and review text-only.
- Use authoritative UI actions, validated persistence, or existing public store/layout contracts; never mutate rendered DOM to create layout state.
- Theme switching retains one mounted Workbench tree and behavior cannot branch on theme IDs.
- Drag diagnostics are transient and cannot enter persisted state.
- Use fixed ports and establish listener ownership before starting Playwright; never terminate another task's listener.
- Preserve unrelated working-tree changes and untracked material.
- Use `npm.cmd` on Windows.

---

### Task 1: Shared semantic Widget interaction driver

**Files:**
- Create: `tests/browser/support/widget-interaction-driver.ts`
- Modify: `tests/browser/native-workbench.spec.ts:40-160`
- Test: `tests/browser/native-workbench.spec.ts`

**Interfaces:**
- Consumes: Playwright `Page` and `Locator`; current semantic attributes such as `data-widget-drag-surface`, `data-widget-group`, `data-pom-part`, and canonical placement attributes.
- Produces: `Point`, `RectSnapshot`, `InteractionEvidence`, `widgetDragSurface()`, `dragTo()`, `dragToShelfRail()`, `dragToWidgetTab()`, `beginPointerDrag()`, `movePointerPath()`, `finishPointerDrag()`, `cancelPointerDrag()`, `captureInteractionEvidence()`, and `capturePlacementSnapshot()`.

- [ ] **Step 1: Create the support file with explicit evidence types**

```ts
import { expect, type Locator, type Page } from '@playwright/test';

export interface Point { readonly x: number; readonly y: number }
export interface RectSnapshot {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface InteractionEvidence {
  readonly proxyCount: number;
  readonly proxyText: string;
  readonly proxyArticleCount: number;
  readonly proxyInteractiveCount: number;
  readonly overlayText: string;
  readonly activeReservationCount: number;
  readonly originVacant: boolean;
  readonly originRect: RectSnapshot | null;
  readonly revision: string | null;
}
export interface PlacementSnapshot {
  readonly instanceId: string;
  readonly placement: string | null;
  readonly region: string | null;
  readonly shelf: string | null;
  readonly order: string | null;
  readonly group: string | null;
}
```

- [ ] **Step 2: Implement pointer lifecycle helpers without fixed waits**

```ts
export async function beginPointerDrag(page: Page, handle: Locator): Promise<Point> {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Expected Widget drag-handle geometry.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  return start;
}

export async function movePointerPath(page: Page, points: readonly Point[]): Promise<void> {
  for (const point of points) await page.mouse.move(point.x, point.y, { steps: 4 });
}

export async function finishPointerDrag(page: Page): Promise<void> {
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toHaveCount(0);
}

export async function cancelPointerDrag(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('[data-pom-part="widget.drag-preview"], [data-pom-part="widget.drop-overlay"]')).toHaveCount(0);
}
```

- [ ] **Step 3: Implement semantic locators and evidence capture**

```ts
export function widgetDragSurface(widget: Locator): Locator {
  return widget
    .locator(':scope > header[data-widget-drag-surface], :scope > .widget-frame > header[data-widget-drag-surface]')
    .or(widget.locator('xpath=ancestor::section[@data-widget-group][1]//button[@data-widget-drag-surface][@aria-selected="true"]'))
    .first();
}

export async function captureInteractionEvidence(page: Page, origin: Locator): Promise<InteractionEvidence> {
  return page.evaluate(({ originSelector }) => {
    const originNode = document.querySelector<HTMLElement>(originSelector);
    const proxy = document.querySelector<HTMLElement>('[data-pom-part="widget.drag-preview"]');
    const overlay = document.querySelector<HTMLElement>('[data-pom-part="widget.drop-overlay"]');
    const box = originNode?.getBoundingClientRect();
    return {
      proxyCount: document.querySelectorAll('[data-pom-part="widget.drag-preview"]').length,
      proxyText: proxy?.textContent?.trim() ?? '',
      proxyArticleCount: proxy?.querySelectorAll('article').length ?? 0,
      proxyInteractiveCount: proxy?.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])').length ?? 0,
      overlayText: overlay?.textContent?.trim() ?? '',
      activeReservationCount: document.querySelectorAll('[data-pom-part="widget.dock-slot"], [data-pom-part="widget.tab-insertion"]').length,
      originVacant: originNode?.hasAttribute('data-widget-drag-placeholder') ?? false,
      originRect: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      revision: document.querySelector('main')?.getAttribute('data-workbench-revision') ?? null
    };
  }, { originSelector: await origin.evaluate((node) => {
    const id = node.getAttribute('data-pomegranate-widget');
    if (!id) throw new Error('Expected an origin Widget identity.');
    return `[data-pomegranate-widget="${CSS.escape(id)}"]`;
  }) });
}

export async function capturePlacementSnapshot(widget: Locator): Promise<PlacementSnapshot> {
  return widget.evaluate((node) => {
    const root = node.closest<HTMLElement>('[data-pomegranate-widget]') ?? node as HTMLElement;
    return {
      instanceId: root.getAttribute('data-pomegranate-widget') ?? '',
      placement: root.getAttribute('data-pomegranate-placement'),
      region: root.getAttribute('data-pomegranate-region'),
      shelf: root.getAttribute('data-pomegranate-shelf'),
      order: root.getAttribute('data-pomegranate-order'),
      group: root.closest('[data-widget-group]')?.getAttribute('data-widget-group-id') ?? null
    };
  });
}

export async function invokeWidgetAction(widget: Locator, name: string): Promise<void> {
  await widget.getByRole('button', { name: 'Widget actions' }).click();
  await widget.getByRole('menuitem', { name }).click();
}
```

- [ ] **Step 4: Move the existing drag helpers from `native-workbench.spec.ts` into the support file**

Move `dragTo`, `dragToShelfRail`, `tearOffTo`, `dragToWidgetTab`, and `widgetDragSurface` without changing behavior. Export them, import them in `native-workbench.spec.ts`, and retain every existing assertion.

- [ ] **Step 5: Run the existing focused browser file**

Run: `npm.cmd run build` followed by `npx.cmd playwright test tests/browser/native-workbench.spec.ts`

Expected: all existing tests pass with helper behavior unchanged.

- [ ] **Step 6: Commit the shared driver**

```powershell
git add tests/browser/support/widget-interaction-driver.ts tests/browser/native-workbench.spec.ts
git commit -m "test(browser): share widget interaction driver"
```

### Task 2: Golden reproductions for the reported failures

**Files:**
- Create: `tests/browser/widget-interaction-playtest.spec.ts`
- Modify: `tests/browser/support/widget-interaction-driver.ts`

**Interfaces:**
- Consumes: Task 1 pointer and evidence helpers.
- Produces: two literal golden journeys named `AUDIT-P1-GROUP-DIRECT-FLOAT` and `AUDIT-P1-SINGLE-PRESENTATION`.

- [ ] **Step 1: Add a clean Workbench setup and grouping helper**

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

async function createReferenceGroup(page: Page) {
  const source = page.getByRole('article', { name: 'Theme Materials' });
  const target = page.getByRole('article', { name: 'Characters (Story)' });
  await dragToWidgetTab(page, widgetDragSurface(source), target);
  return page.getByRole('group', { name: 'Widget group' });
}
```

- [ ] **Step 2: Write the direct grouped-tab-to-Scene journey**

```ts
test('AUDIT-P1-GROUP-DIRECT-FLOAT grouped tab reaches open Scene space after horizontal departure', async ({ page }) => {
  const group = await createReferenceGroup(page);
  const tab = group.getByRole('tab', { name: 'Theme Materials' });
  const stage = page.locator('[data-pomegranate-region-surface="stage"]');
  const tabBox = await tab.boundingBox();
  const stageBox = await stage.boundingBox();
  if (!tabBox || !stageBox) throw new Error('Expected grouped-tab and Scene geometry.');
  const start = await beginPointerDrag(page, tab);
  await movePointerPath(page, [
    { x: start.x + 18, y: start.y },
    { x: stageBox.x + stageBox.width * .72, y: stageBox.y + 90 }
  ]);
  await expect(page.locator('[data-pom-part="widget.drag-preview"]')).toBeVisible();
  await finishPointerDrag(page);
  await expect(page.locator('[data-widget-type="settings.theme-materials"][data-pomegranate-placement="floating"]')).toBeVisible();
});
```

- [ ] **Step 3: Run the direct-float journey and preserve the red evidence**

Run: `npx.cmd playwright test tests/browser/widget-interaction-playtest.spec.ts -g AUDIT-P1-GROUP-DIRECT-FLOAT --trace on`

Expected before remediation: FAIL because horizontal movement locks the gesture into reorder and no Widget drag preview or floating placement appears. Retain the trace path and exact assertion in the audit ledger.

- [ ] **Step 4: Write the single-presentation journey**

```ts
test('AUDIT-P1-SINGLE-PRESENTATION lifted Widget has one compact payload and one text-free destination', async ({ page }, testInfo) => {
  const source = page.locator('[data-widget-type="story.characters"]').first();
  const target = page.getByRole('article', { name: 'World State' });
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('Expected occupied destination geometry.');
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height * .12 }]);
  const evidence = await captureInteractionEvidence(page, source);
  await testInfo.attach('AUDIT-P1-SINGLE-PRESENTATION', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png'
  });
  expect(evidence.proxyCount).toBe(1);
  expect(evidence.proxyArticleCount).toBe(0);
  expect(evidence.proxyInteractiveCount).toBe(0);
  expect(evidence.overlayText).toBe('');
  expect(evidence.originVacant).toBe(true);
  expect(evidence.activeReservationCount).toBe(1);
  await cancelPointerDrag(page);
});
```

- [ ] **Step 5: Run the single-presentation journey and preserve the red evidence**

Run: `npx.cmd playwright test tests/browser/widget-interaction-playtest.spec.ts -g AUDIT-P1-SINGLE-PRESENTATION --trace on`

Expected before remediation: FAIL because the current proxy clones a complete `article` and the overlay contains textual labels. Retain the trace and screenshot diff path in the audit ledger.

- [ ] **Step 6: Mark only the reproduced defects as expected failures for the audit commit**

Add `test.fail(true, 'AUDIT-P1: reproduced current production defect; remediation pending.');` as the first line of each verified failing test. Rerun both tests and confirm Playwright reports them as expected failures rather than skipped tests. Do not use `test.fixme()` or weaken any assertion.

- [ ] **Step 7: Commit the golden audit cases**

```powershell
git add tests/browser/widget-interaction-playtest.spec.ts tests/browser/support/widget-interaction-driver.ts
git commit -m "test(browser): reproduce widget interaction defects"
```

### Task 3: Validated interaction coverage catalog

**Files:**
- Create: `tests/browser/support/widget-interaction-matrix.ts`
- Create: `tests/browser/support/widget-interaction-matrix.test.ts`

**Interfaces:**
- Produces: `OriginKind`, `IntentKind`, `DestinationKind`, `CompletionKind`, `InteractionCase`, `INTERACTION_CASES`, and `interactionCoverageGaps()`.

- [ ] **Step 1: Write a failing coverage validation test**

```ts
import { describe, expect, it } from 'vitest';
import { INTERACTION_CASES, interactionCoverageGaps } from './widget-interaction-matrix.js';

describe('Widget interaction playtest matrix', () => {
  it('covers every approved axis value and required reachable pair', () => {
    expect(INTERACTION_CASES.map(({ id }) => id)).toEqual([...INTERACTION_CASES.map(({ id }) => id)].sort());
    expect(interactionCoverageGaps(INTERACTION_CASES)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm.cmd run test:native -- tests/browser/support/widget-interaction-matrix.test.ts`

Expected: FAIL because the catalog module does not exist.

- [ ] **Step 3: Implement frozen axes and a deterministic coverage validator**

```ts
export const ORIGINS = ['docked-singleton', 'grouped-active', 'grouped-inactive', 'floating'] as const;
export const INTENTS = ['reorder', 'group', 'insert-before', 'insert-after', 'create-shelf', 'empty-region', 'float'] as const;
export const DESTINATIONS = ['same-shelf', 'other-shelf', 'occupied-widget', 'existing-group', 'empty-region', 'open-canvas', 'collapsed-dock', 'invalid-space'] as const;
export const COMPLETIONS = ['commit', 'escape', 'pointercancel', 'blur', 'unmount', 'undo', 'save-reload'] as const;

export interface InteractionCase {
  readonly id: string;
  readonly origin: typeof ORIGINS[number];
  readonly intent: typeof INTENTS[number];
  readonly destination: typeof DESTINATIONS[number];
  readonly completion: typeof COMPLETIONS[number];
}

type AxisName = Exclude<keyof InteractionCase, 'id'>;
interface RequiredPairSide { readonly axis: AxisName; readonly value: string }
interface RequiredPair { readonly left: RequiredPairSide; readonly right: RequiredPairSide }

const REQUIRED_REACHABLE_PAIRS: readonly RequiredPair[] = Object.freeze([
  { left: { axis: 'origin', value: 'grouped-inactive' }, right: { axis: 'destination', value: 'open-canvas' } },
  { left: { axis: 'origin', value: 'grouped-inactive' }, right: { axis: 'intent', value: 'float' } },
  { left: { axis: 'origin', value: 'grouped-active' }, right: { axis: 'intent', value: 'reorder' } },
  { left: { axis: 'origin', value: 'floating' }, right: { axis: 'destination', value: 'empty-region' } },
  { left: { axis: 'intent', value: 'create-shelf' }, right: { axis: 'destination', value: 'collapsed-dock' } },
  { left: { axis: 'intent', value: 'group' }, right: { axis: 'destination', value: 'occupied-widget' } },
  { left: { axis: 'intent', value: 'group' }, right: { axis: 'destination', value: 'existing-group' } },
  { left: { axis: 'intent', value: 'insert-before' }, right: { axis: 'completion', value: 'undo' } },
  { left: { axis: 'intent', value: 'insert-after' }, right: { axis: 'completion', value: 'unmount' } },
  { left: { axis: 'intent', value: 'empty-region' }, right: { axis: 'completion', value: 'pointercancel' } },
  { left: { axis: 'intent', value: 'float' }, right: { axis: 'completion', value: 'escape' } },
  { left: { axis: 'destination', value: 'existing-group' }, right: { axis: 'completion', value: 'blur' } },
  { left: { axis: 'destination', value: 'open-canvas' }, right: { axis: 'completion', value: 'commit' } },
  { left: { axis: 'destination', value: 'occupied-widget' }, right: { axis: 'completion', value: 'save-reload' } }
]);

export function interactionCoverageGaps(cases: readonly InteractionCase[]): readonly string[] {
  const gaps: string[] = [];
  for (const [name, values] of Object.entries({ origin: ORIGINS, intent: INTENTS, destination: DESTINATIONS, completion: COMPLETIONS })) {
    for (const value of values) if (!cases.some((entry) => entry[name as keyof InteractionCase] === value)) gaps.push(`${name}:${value}`);
  }
  for (const required of REQUIRED_REACHABLE_PAIRS) {
    if (!cases.some((entry) => entry[required.left.axis] === required.left.value && entry[required.right.axis] === required.right.value)) {
      gaps.push(`${required.left.axis}:${required.left.value}+${required.right.axis}:${required.right.value}`);
    }
  }
  return gaps.sort();
}
```

The literal required-pair list above excludes impossible semantic pairs such as `reorder + open-canvas`; any future pair is added deliberately with a canonical journey.

- [ ] **Step 4: Add the sorted canonical case catalog**

Include at least these journeys, adding cases until `interactionCoverageGaps()` returns no entries:

```ts
export const INTERACTION_CASES: readonly InteractionCase[] = Object.freeze([
  { id: 'collapsed-dock-reveal-commit', origin: 'docked-singleton', intent: 'create-shelf', destination: 'collapsed-dock', completion: 'commit' },
  { id: 'floating-invalid-cancel', origin: 'floating', intent: 'float', destination: 'invalid-space', completion: 'escape' },
  { id: 'floating-to-empty-pointercancel', origin: 'floating', intent: 'empty-region', destination: 'empty-region', completion: 'pointercancel' },
  { id: 'grouped-active-reorder-commit', origin: 'grouped-active', intent: 'reorder', destination: 'same-shelf', completion: 'commit' },
  { id: 'grouped-active-to-existing-group-blur', origin: 'grouped-active', intent: 'group', destination: 'existing-group', completion: 'blur' },
  { id: 'grouped-inactive-direct-float', origin: 'grouped-inactive', intent: 'float', destination: 'open-canvas', completion: 'commit' },
  { id: 'grouped-inactive-insert-after-unmount', origin: 'grouped-inactive', intent: 'insert-after', destination: 'other-shelf', completion: 'unmount' },
  { id: 'singleton-group-existing', origin: 'docked-singleton', intent: 'group', destination: 'occupied-widget', completion: 'save-reload' },
  { id: 'singleton-insert-before-undo', origin: 'docked-singleton', intent: 'insert-before', destination: 'other-shelf', completion: 'undo' }
]);
```

- [ ] **Step 5: Rerun the focused catalog test**

Run: `npm.cmd run test:native -- tests/browser/support/widget-interaction-matrix.test.ts`

Expected: PASS with zero missing values or reachable pairs.

- [ ] **Step 6: Commit the validated catalog**

```powershell
git add tests/browser/support/widget-interaction-matrix.ts tests/browser/support/widget-interaction-matrix.test.ts
git commit -m "test: define widget interaction coverage matrix"
```

### Task 4: Canonical stateful Playwright journeys

**Files:**
- Modify: `tests/browser/widget-interaction-playtest.spec.ts`
- Modify: `tests/browser/support/widget-interaction-driver.ts`
- Test: `tests/browser/widget-interaction-playtest.spec.ts`

**Interfaces:**
- Consumes: `INTERACTION_CASES`, semantic driver functions, Workbench UI controls, canonical placement attributes.
- Produces: passing journeys or evidence-backed expected failures for every catalog case; no skipped catalog entry.

- [ ] **Step 1: Add a catalog-to-test completeness assertion**

```ts
const implementedCaseIds = new Set<string>();
type PlaytestBody = (args: { page: Page }) => Promise<void>;
function interactionTest(id: string, body: PlaytestBody) {
  implementedCaseIds.add(id);
  test(id, body);
}

test.afterAll(() => {
  expect([...implementedCaseIds].sort()).toEqual(INTERACTION_CASES.map(({ id }) => id));
});
```

- [ ] **Step 2: Implement singleton, group, and floating journeys**

For each case, assert the starting topology, capture the revision and placement snapshot, execute one semantic path, and assert the visible preview before completion. After completion, assert the exact placement, group, order, revision delta, and transient-layer cleanup.

Use this literal structure for every case:

```ts
interactionTest('floating-invalid-cancel', async ({ page }) => {
  const article = page.getByRole('article', { name: 'Room Ambience' });
  await invokeWidgetAction(article, 'Float');
  const source = page.locator('[data-widget-type="story.room-ambience"][data-pomegranate-placement="floating"]');
  const before = await capturePlacementSnapshot(source);
  const revision = await page.locator('main').getAttribute('data-workbench-revision');
  await beginPointerDrag(page, widgetDragSurface(source));
  await movePointerPath(page, [{ x: 2, y: 2 }]);
  await cancelPointerDrag(page);
  expect(await capturePlacementSnapshot(source)).toEqual(before);
  await expect(page.locator('main')).toHaveAttribute('data-workbench-revision', revision ?? '');
});
```

- [ ] **Step 3: Implement interruption journeys**

Cover Escape, synthetic pointer cancellation on the captured handle, window blur, and active-Panel unmount. Each journey asserts exact origin placement, unchanged revision, zero transient semantic parts, no `pom-widget-drag-active` or `pom-tab-reorder-active` body class, and no temporary collapsed-dock reveal attributes.

- [ ] **Step 4: Implement resize, collapse, expand, undo, and persistence compositions**

Resize both dock and shelf separators using their accessible controls, assert the resulting `aria-valuenow`, perform the catalogued drag, then exercise undo or Save layout plus reload. Compare canonical placement snapshots and widths before and after reload; do not infer persistence from visible order alone.

- [ ] **Step 5: Add mouse, pen, touch, and keyboard paths**

Use Playwright mouse for canonical geometry, element `dispatchEvent` for pen parity, CDP `Input.dispatchTouchEvent` for held-touch and pre-hold cancellation, and the existing keyboard placement/reorder commands. Touch contexts must set `{ hasTouch: true, isMobile: true }` and assert `(pointer: coarse)`.

- [ ] **Step 6: Add focused visual checkpoints**

After remediation produces an intentional stable rendering, add `toHaveScreenshot()` baselines for lifted singleton, occupied-gap insertion, grouped-tab insertion, direct grouped-tab float, and collapsed-dock reveal. During the unchanged-production audit, attach screenshots as evidence instead of creating approved baselines. Use `animations: 'disabled'`, mask only deterministic ambient motion, and accompany each screenshot with semantic counts and rectangle assertions.

- [ ] **Step 7: Run the canonical suite against the unchanged implementation**

Run: `npx.cmd playwright test tests/browser/widget-interaction-playtest.spec.ts --trace on`

Expected: passing journeys remain green; any new failure is reproduced twice, classified, given a literal `AUDIT-P1-*` issue identifier, and only then annotated with `test.fail(true, '<issue id>: <observed defect>')`. A passing journey must never receive an expected-failure marker.

- [ ] **Step 8: Commit the complete audit suite**

```powershell
git add tests/browser/widget-interaction-playtest.spec.ts tests/browser/support/widget-interaction-driver.ts tests/browser/__screenshots__/widget-interaction-playtest.spec.ts-snapshots
git commit -m "test(browser): add widget manipulation playtest"
```

### Task 5: Evidence ledger and audit verification

**Files:**
- Create: `docs/widget-interaction-audit.md`
- Modify: `tests/browser/widget-interaction-playtest.spec.ts` only if recorded issue IDs or evidence paths are inaccurate.

**Interfaces:**
- Consumes: Playwright results, trace paths, screenshots, exact current commit, and the failure taxonomy in the spec.
- Produces: an immutable audit snapshot that determines the remediation plan.

- [ ] **Step 1: Write the audit ledger header and environment receipt**

```md
# Widget Interaction Audit

**Audited commit:** Paste the exact output captured by `git rev-parse HEAD` immediately before the unchanged-production audit run.
**Browser:** Paste the exact Chromium version printed by `npx.cmd playwright test --version` and the Playwright browser executable metadata from the run attachment.
**Viewport/input matrix:** wide mouse/keyboard; short landscape mouse; phone coarse touch; desktop-site mobile; pen parity
**Themes:** Deep Current, PomOS, Bunny, Ash & Amber

| Issue | Journey | Earliest broken stage | Reproduction | Evidence | Root-cause hypothesis | Status |
| --- | --- | --- | --- | --- | --- | --- |
```

- [ ] **Step 2: Record every expected failure and notable passing boundary**

Each failing row names one earliest stage from the approved taxonomy, gives literal reproduction steps, links a repository-relative trace/screenshot artifact or test line, states one falsifiable hypothesis, and says `reproduced`. Add passing-boundary rows where they distinguish a nearby working case from a failure.

- [ ] **Step 3: Record the remediation decision**

If two or more failures originate in competing lifecycle ownership or duplicated global cleanup, record that the unified transient interaction host is warranted. Otherwise, list the independent localized repair boundaries. Do not select the state-machine route merely because the design anticipates it.

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm.cmd run test:native -- tests/browser/support/widget-interaction-matrix.test.ts
npm.cmd run build
npx.cmd playwright test tests/browser/widget-interaction-playtest.spec.ts tests/browser/native-workbench.spec.ts
git diff --check
```

Expected: unit catalog passes; browser suite passes including correctly reported expected failures; existing native Workbench browser coverage remains green; diff check is clean.

- [ ] **Step 5: Run the full repository gate**

Run: `npm.cmd run check`

Expected: PASS. Report expected failures separately from passing tests; do not describe an expected failure as fixed.

- [ ] **Step 6: Commit the audit ledger**

```powershell
git add docs/widget-interaction-audit.md tests/browser/widget-interaction-playtest.spec.ts
git commit -m "docs: record widget interaction audit"
```

- [ ] **Step 7: Write the evidence-led remediation plan**

Use the writing-plans skill again. The next plan must cite the exact audit issue IDs, remove their expected-failure annotations as fixes land, and include only root causes demonstrated by this audit.
