# Custom Theme Element Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the divergent oversized Custom Theme editor with five compact, independently placeable Widgets backed by one shared draft, including live semantic canvas-overlay authoring.

**Architecture:** Advance the persisted draft contract with bounded canvas treatment, project each preset's data-only semantic canvas authoring profile through the existing theme compiler, and expose one reactive authoring port to five focused Svelte renderers. Deterministic migrations split the old Settings monolith and replace the old Scene monolith with the identical Theme Materials Widget used by Settings.

**Tech Stack:** TypeScript 6, Zod, Svelte 5 runes, Vitest, Testing Library, Playwright 1.62, PomegranateUI contracts/layout/theme/core packages.

**Spec:** `docs/superpowers/specs/2026-09-02-custom-theme-element-widgets-design.md`

## Global Constraints

- Keep one mounted Workbench tree and immediate atomic theme switching.
- Do not branch components, selectors, or behavior on concrete theme IDs.
- Every Widget type renders the same component in every placement.
- Preserve unrelated saved layout state and dirty checkout files.
- Runtime package dependencies continue to flow `contracts -> layout -> core -> svelte`.
- Use `npm.cmd` on Windows and finish with `npm.cmd run check`.

---

### Task 1: Advance the theme draft contract and migrate stored v1 drafts

**Files:**
- Modify: `packages/contracts/src/theme-draft.ts`
- Modify: `packages/contracts/src/theme.test.ts`
- Modify: `apps/workbench-lab/src/themes/draft-storage.ts`
- Modify: `apps/workbench-lab/src/themes/draft-storage.test.ts`

**Interfaces:**
- Produces `ThemeCanvasDraftSchema` and `ThemeCanvasDraft`.
- Produces v2 `ThemeDraftSchema`, `PersistedThemeDraftSchema`, and version constants.
- Produces `migratePersistedThemeDraft(input, canvasDefaults): PersistedThemeDraft | null`.
- `ThemeCanvasDraft` is exactly `{ imageStrength; overlayStrength; gradientAngle; vignetteStrength }`, with integer percentage fields and a `0..359` integer angle.

- [ ] **Step 1: Write failing contract and storage migration tests**

Add literal expectations proving v2 accepts the bounded record, rejects `101`, `-1`, and angle `360`, and migrates this v1 fixture without changing its colors, materials, or ambient values:

```ts
const canvas = {
  imageStrength: 83,
  overlayStrength: 72,
  gradientAngle: 90,
  vignetteStrength: 28
};
expect(migratePersistedThemeDraft(v1Fixture, canvas)).toMatchObject({
  schemaVersion: 'pomegranate.ui.persisted-theme-draft.v2',
  draft: {
    schemaVersion: 'pomegranate.ui.theme-draft.v2',
    colors: v1Fixture.draft.colors,
    materials: v1Fixture.draft.materials,
    canvas
  },
  ambient: v1Fixture.ambient
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm.cmd run test:native -- packages/contracts/src/theme.test.ts apps/workbench-lab/src/themes/draft-storage.test.ts`

Expected: FAIL because the canvas schema, v2 constants, and migration function do not exist.

- [ ] **Step 3: Implement the minimal v2 schemas and pure migration**

Define:

```ts
export const ThemeCanvasDraftSchema = z.object({
  imageStrength: z.number().finite().int().min(0).max(100),
  overlayStrength: z.number().finite().int().min(0).max(100),
  gradientAngle: z.number().finite().int().min(0).max(359),
  vignetteStrength: z.number().finite().int().min(0).max(100)
}).strict();
```

Keep explicit v1 schemas private to storage migration. Decode v2 first; otherwise parse v1 and construct v2 with caller-supplied defaults. Keep the storage key stable so existing saved records are discoverable.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `npm.cmd run test:native -- packages/contracts/src/theme.test.ts apps/workbench-lab/src/themes/draft-storage.test.ts`

Expected: PASS with no warnings.

- [ ] **Step 5: Commit**

```powershell
git add packages/contracts/src/theme-draft.ts packages/contracts/src/theme.test.ts apps/workbench-lab/src/themes/draft-storage.ts apps/workbench-lab/src/themes/draft-storage.test.ts
git commit -m "feat(theme): add canvas draft migration"
```

### Task 2: Project semantic canvas authoring through the shared controller

**Files:**
- Modify: `packages/theme/src/semantic-canvas.ts`
- Modify: `packages/theme/src/draft.ts`
- Modify: `packages/theme/src/draft.test.ts`
- Modify: `apps/workbench-lab/src/themes/presets.ts`
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/ash-amber.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/controller.ts`
- Modify: `apps/workbench-lab/src/themes/controller.test.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`

**Interfaces:**
- Produces `ThemeCanvasAuthoringProfile` with semantic `layers`, `groups`, and `defaults`.
- Changes `projectThemeDraft(base, draft, ambient, canvasProfile?)` to resolve semantic colors and apply treatment.
- Changes every `LabThemePreset` to carry `canvasAuthoring` data.
- Keeps `LabThemeController.editDraft(next)` and snapshot consumers source-compatible apart from the v2 persisted draft type.

- [ ] **Step 1: Write failing semantic projection tests**

Use hand-derived expectations showing that editing Canvas to `#101820` changes Deep and Ash overlay stop colors, while `imageStrength: 40`, `overlayStrength: 50`, `gradientAngle: 125`, and `vignetteStrength: 20` change only their declared layer groups. Add a no-image fixture proving `imageAvailable === false` without rejecting other canvas edits.

```ts
expect(result.target.canvas.layers).toEqual(expect.arrayContaining([
  expect.objectContaining({ kind: 'image', opacity: 0.4 }),
  expect.objectContaining({ kind: 'linear-gradient', angle: 125 })
]));
expect(result.canvasAvailability).toEqual({ image: true, overlay: true, vignette: true });
```

Name the mutation caught: retaining resolved preset literals or applying a treatment multiplier to the wrong layer group must fail the test.

- [ ] **Step 2: Run focused projection tests and confirm RED**

Run: `npm.cmd run test:native -- packages/theme/src/draft.test.ts apps/workbench-lab/src/themes/controller.test.ts apps/workbench-lab/src/themes/themes.test.ts`

Expected: FAIL because semantic canvas authoring profiles and canvas projection are missing.

- [ ] **Step 3: Implement data-only canvas profiles and projection**

Export:

```ts
export interface ThemeCanvasAuthoringProfile {
  readonly layers: readonly AuthorableSemanticCanvasLayer[];
  readonly defaults: ThemeCanvasDraft;
}

export type AuthorableSemanticCanvasLayer = SemanticCanvasLayer & {
  readonly authoringGroup?: 'image' | 'overlay' | 'vignette';
};
```

Resolve palette references after draft color projection. For group transforms, multiply opacity/alpha from the semantic recipe by the corresponding percentage; replace declared linear overlay angles with `gradientAngle`; preserve undeclared fixed layers. Return explicit availability derived from declared groups. Supply complete profiles from preset data rather than conditionals in `projectThemeDraft`.

- [ ] **Step 4: Thread v2 seed/load/edit/save through the controller**

Seed canvas values from the active preset profile. Load storage through `migratePersistedThemeDraft`. Preserve per-preset valid and dirty drafts. Surface canvas availability in `LabThemeAuthoringSnapshot` so the renderer can disable Image Strength without inspecting the active theme ID.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `npm.cmd run test:native -- packages/theme/src/draft.test.ts apps/workbench-lab/src/themes/controller.test.ts apps/workbench-lab/src/themes/themes.test.ts`

Expected: PASS, with Deep and Ash compiled canvas assertions containing the edited semantic colors.

- [ ] **Step 6: Commit**

```powershell
git add packages/theme/src apps/workbench-lab/src/themes
git commit -m "feat(theme): author semantic canvas layers"
```

### Task 3: Split catalog identities and migrate Workbench placements

**Files:**
- Modify: `apps/workbench-lab/src/mockup/catalog.ts`
- Modify: `apps/workbench-lab/src/mockup/implemented-surfaces.ts`
- Modify: `apps/workbench-lab/src/mockup/presentation.ts`
- Modify: `apps/workbench-lab/src/mockup/state.ts`
- Modify: `apps/workbench-lab/src/mockup/settings-sub-panels.ts`
- Modify: `apps/workbench-lab/src/mockup/settings-sub-panels.test.ts`
- Modify: `apps/workbench-lab/src/mockup/surface-fixtures.ts`
- Modify: `apps/workbench-lab/src/App.test.ts`

**Interfaces:**
- Adds Widget types `settings.theme-colors`, `settings.theme-materials`, `settings.theme-canvas`, and `settings.theme-ambient`.
- Keeps `settings.custom-theme` as the Custom Theme overview/actions Widget.
- Produces `upgradeThemeAuthoringWidgets(state): WorkbenchState`, deterministic and idempotent.

- [ ] **Step 1: Write failing clean-state and migration tests**

Assert a clean Settings layout has exactly one instance of each of the five authoring types in the approved lanes. Assert Scene has exactly one `settings.theme-materials` instance and no default `settings.custom-theme`. Seed a previous-state fixture with `scene-theme-settings` using `{ presentation: 'compact' }`; verify migration replaces only that shipped instance, inserts the four absent Settings element Widgets once, preserves a user-created Custom Theme placement, and is idempotent.

- [ ] **Step 2: Run focused layout tests and confirm RED**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/mockup/settings-sub-panels.test.ts apps/workbench-lab/src/App.test.ts`

Expected: FAIL because the element manifests and migration are missing.

- [ ] **Step 3: Add manifests, fixtures, titles, and clean defaults**

Use these exact public titles and purposes:

```ts
['settings.custom-theme', 'Custom Theme'],
['settings.theme-colors', 'Theme Colors'],
['settings.theme-materials', 'Theme Materials'],
['settings.theme-canvas', 'Theme Canvas'],
['settings.theme-ambient', 'Ambient Light']
```

Set compact geometry per focused responsibility. Place Theme Library/Custom Theme in lane 0, Colors/Materials in lane 1, Canvas/Ambient in lane 2, followed by Reading Layout, Sound and Motion, and Accessibility. Replace the clean Scene instance with Theme Materials at the old order and region.

- [ ] **Step 4: Implement deterministic persisted-layout upgrade**

Identify the old shipped Scene instance by stable ID, type, Panel, and compact configuration rather than converting arbitrary user placements. Retain the Settings overview instance, create missing element instances with stable IDs, and assign sub-panel/lane/order exactly once. Call this upgrader for clean construction and every loaded/hydrated layout before rendering.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/mockup/settings-sub-panels.test.ts apps/workbench-lab/src/App.test.ts`

Expected: PASS, including idempotence and unrelated-state preservation.

- [ ] **Step 6: Commit**

```powershell
git add apps/workbench-lab/src/mockup apps/workbench-lab/src/App.test.ts
git commit -m "feat(lab): split theme element widgets"
```

### Task 4: Replace the monolith with five compact Svelte renderers

**Files:**
- Create: `apps/workbench-lab/src/recipes/theme-authoring/types.ts`
- Create: `apps/workbench-lab/src/recipes/theme-authoring/CustomTheme.svelte`
- Create: `apps/workbench-lab/src/recipes/theme-authoring/ThemeColors.svelte`
- Create: `apps/workbench-lab/src/recipes/theme-authoring/ThemeMaterials.svelte`
- Create: `apps/workbench-lab/src/recipes/theme-authoring/ThemeCanvasSettings.svelte`
- Create: `apps/workbench-lab/src/recipes/theme-authoring/AmbientLight.svelte`
- Move/modify: `apps/workbench-lab/src/recipes/ColorPlane.svelte`
- Move/modify: `apps/workbench-lab/src/recipes/HueControl.svelte`
- Move/modify: `apps/workbench-lab/src/recipes/AmbientPosition.svelte`
- Delete: `apps/workbench-lab/src/recipes/ThemeSettings.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.test.ts`

**Interfaces:**
- Every element renderer accepts the same `theme: ThemeAuthoringPort`; Theme Colors also accepts `eyedropper`.
- No renderer accepts a compact/full presentation property.
- All editor commands submit one validated v2 draft through the shared port and observe the next authoring snapshot.

```ts
export interface ThemeAuthoringPort {
  readonly authoring: LabThemeAuthoringSnapshot;
  readonly editDraft: (next: unknown) => ThemeDraftEditResult;
  readonly resetDraft: () => ThemeDraftEditResult;
  readonly saveDraft: () => Promise<ThemeDraftSaveResult>;
}
```

- [ ] **Step 1: Write failing component tests for exact ownership and synchronization**

Render App and assert each Settings Widget contains only its approved controls. Assert Scene Theme Materials has the same named controls and `data-theme-authoring-element="materials"` marker as Settings, with no presentation marker. Edit Scene Glass Density and observe Settings update; edit Settings Bar Opacity and observe Scene update after Panel navigation. Assert Custom Theme alone contains Reset and Save.

- [ ] **Step 2: Run focused component tests and confirm RED**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts`

Expected: FAIL because the monolith still owns every control and Scene renders the compact fork.

- [ ] **Step 3: Implement five focused renderers with shared reactive snapshots**

Use the authoring port directly. Keep only transient selected-role and raw-channel focus state inside Theme Colors; synchronize it whenever `theme.authoring.editable` changes. Build material, canvas, and ambient edits from the current controller snapshot at event time so sibling edits cannot be overwritten by a stale component clone.

Expose these stable markers:

```svelte
data-theme-authoring-element="overview|colors|materials|canvas|ambient"
```

Filter diagnostics by path prefix in each element; render aggregate diagnostics in Custom Theme.

- [ ] **Step 4: Apply the compact shared typography and geometry**

Replace `.theme-settings` and `.compact-theme` branches with `.theme-authoring-element` styles. Enforce 11/14 headings, 10/14 primary labels/values/fields/buttons, 9/12 secondary text, and 8/11 metadata. Set the color plane to `min-height: 96px`. Give range inputs a 44px interaction box while preserving semantic track/thumb geometry. Remove repeated scope prose and all compact/full selectors.

- [ ] **Step 5: Run focused component and type checks and confirm GREEN**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts`

Run: `npm.cmd run typecheck`

Expected: PASS with no Svelte accessibility warnings from the new renderers.

- [ ] **Step 6: Commit**

```powershell
git add apps/workbench-lab/src/recipes apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte apps/workbench-lab/src/styles.css apps/workbench-lab/src/App.test.ts
git commit -m "refactor(lab): split theme authoring UI"
```

### Task 5: Publish the reusable recipe and lock browser/visual behavior

**Files:**
- Modify/create: `registry/recipes/theme-settings/*`
- Modify: `registry/recipes/recipe-manifest.json`
- Modify: `tests/browser/theme-settings.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/unit/theme-recipes.test.mjs`
- Modify: `apps/workbench-lab/README.md`

**Interfaces:**
- The `theme-settings` copy-owned recipe contains the five element renderers and shared controls, with regenerated deterministic hashes.
- Browser locators target Widget types and semantic names, never theme-specific component forks.

- [ ] **Step 1: Rewrite browser tests and confirm RED against the old artifact**

Cover all four presets. Assert the default Scene inventory contains Theme Materials and not Custom Theme. Assert Settings contains all five elements. Edit Deep and Ash Canvas colors and compare the actual compiled overlay layer `backgroundImage` before/after; require the edited color and changed gradient angle. Assert Image Strength availability follows profile data. Assert bidirectional material synchronization, invalid color retention, Save/Reset, and migrated localStorage.

Add computed-style assertions for the approved font/line-height matrix, a 96-pixel color plane, actual range hit rectangles at least 44 pixels high, no horizontal overflow, and one scroll owner at the approved responsive viewports.

- [ ] **Step 2: Run focused browser tests and confirm RED**

Run: `npm.cmd run build`

Run: `npx.cmd playwright test tests/browser/theme-settings.spec.ts tests/browser/native-workbench-accessibility.spec.ts`

Expected: FAIL on the old Widget inventory, absent canvas controls, and oversized typography.

- [ ] **Step 3: Update the reusable recipe and deterministic ledger**

Mirror the five focused renderers and shared controls into `registry/recipes/theme-settings`. Increment the recipe revision and run the repository's recipe generator/update command rather than editing SHA-256 values by hand. Update the executable recipe test to assert all files and hashes.

- [ ] **Step 4: Capture and inspect focused visual evidence**

Run the focused visual cases for Deep Current, PomOS, Bunny, and Ash & Amber at wide Settings and default Scene. Inspect screenshots for compact hierarchy, containment, image overlay response, and no duplicated actions. Refresh only directly affected committed fixtures after localizing each expected difference.

- [ ] **Step 5: Run the complete verification gate**

Run: `npm.cmd run check`

Expected: all unit, type, native, build, artifact, recipe, pack, and browser gates pass with pristine output apart from the repository's known Vite Svelte-config notice.

- [ ] **Step 6: Commit**

```powershell
git add registry/recipes tests apps/workbench-lab/README.md
git commit -m "test(theme): lock element widget parity"
```
