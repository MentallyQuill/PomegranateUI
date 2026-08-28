# Pom Theme Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a versioned, framework-neutral Pom theme contract and prove the same live Workbench can render as Pom Neutral, Deep Current, and Bunny through immediate, atomic theme selection.

**Architecture:** Add the independent dependency branch `contracts -> theme`; keep all DOM, Svelte, storage, preset definitions, and CSS compilation in the Workbench Lab. The Lab resolves a complete preset before replacing one root binding, while retaining the existing Workbench store, component tree, state, and focus.

**Tech Stack:** TypeScript 5 native compiler, Zod 4, Svelte 5 runes, Vitest, Testing Library, Playwright, Vite 8, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-08-28-pom-theme-foundation-design.md`

## Global Constraints

- PomegranateUI remains a developer toolkit, not a branded application frontend.
- Runtime dependencies remain `contracts -> layout -> core -> svelte`; theme adds only `contracts -> theme`.
- `@pomegranate-ui/theme` must not import DOM, Svelte, React, browser storage, filesystem, network, or Sonder code.
- Presets and their presentation bindings remain Workbench Lab conformance fixtures; they are not mandatory package defaults.
- All three targets retain identical Panel IDs, Widget instance IDs, Catalog state, active Panel, layout revision, semantic markup, and component keys.
- Theme activation is immediate and atomic; no transition duration, intermediate state, animation queue, morphing API, or theme-ID CSS branch is allowed.
- A failed definition or missing required asset leaves the last valid theme active and returns a literal diagnostic code and path.
- Deep Current remains the default and must preserve the existing named browser baselines unless an intentional selector-content change is separately reviewed.
- Pom Neutral uses original Pom decisions and no Apple icons, controls, assets, or exact trade dress.
- Bunny remains readable, keyboard-operable, responsive, and at least 44 by 44 CSS pixels for coarse-pointer targets.
- Ambient effects, full editing, uploads, remote loading, marketplace behavior, hosting, npm publication, and Sonder cutover remain out of scope.
- No third-party runtime dependency or new binary asset may be added in this tranche.
- Preserved mockups, provenance assets, and their SHA-256 evidence remain byte-identical.

---

### Task 1: Versioned public theme contracts

**Files:**
- Create: `packages/contracts/src/theme.ts`
- Create: `packages/contracts/src/theme.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Consumes: Zod from the existing `@pomegranate-ui/contracts` dependency.
- Produces: `THEME_SCHEMA_VERSION`, `THEME_COLOR_ROLES`, `ThemeDefinitionSchema`, `ThemePatchSchema`, `ThemeAssetReferenceSchema`, `ThemeCanvasLayerSchema`, and inferred `ThemeDefinition`, `ThemePatch`, `ThemeColorRole`, `ThemeCanvasLayer`, `ThemeAssetReference` types.

- [ ] **Step 1: Add one failing schema test for a complete versioned definition**

Create a literal `VALID_THEME` fixture containing every semantic group and assert:

```ts
it('accepts a complete pomegranate.ui.theme.v1 definition', () => {
  const parsed = ThemeDefinitionSchema.parse(VALID_THEME);
  expect(parsed.schemaVersion).toBe('pomegranate.ui.theme.v1');
  expect(parsed.colors.text).toBe('#f6f2eb');
  expect(parsed.materials.widget.base).toBe('surfaceElevated');
  expect(parsed.canvas.map((layer) => layer.kind)).toEqual(['solid', 'radial-gradient', 'veil']);
});
```

- [ ] **Step 2: Run the focused test and verify the missing-module failure**

Run: `npm.cmd run test:native -- packages/contracts/src/theme.test.ts`

Expected: FAIL because `./theme.js` and `ThemeDefinitionSchema` do not exist.

- [ ] **Step 3: Implement strict semantic schemas and inferred public types**

Use strict Zod objects and these literal shapes:

```ts
export const THEME_SCHEMA_VERSION = 'pomegranate.ui.theme.v1' as const;
export const THEME_COLOR_ROLES = [
  'canvas', 'surface', 'surfaceElevated', 'surfaceInset', 'chrome',
  'text', 'textMuted', 'textFaint', 'textOnAccent', 'accent', 'selection',
  'focus', 'success', 'warning', 'danger', 'border', 'borderStrong', 'shadow'
] as const;

export const ThemeDefinitionSchema = z.strictObject({
  schemaVersion: z.literal(THEME_SCHEMA_VERSION),
  id: themeIdSchema,
  label: nonBlankString,
  description: nonBlankString.optional(),
  colors: semanticColorsSchema,
  typography: typographySchema,
  geometry: geometrySchema,
  spacing: spacingSchema,
  materials: materialRolesSchema,
  iconPackId: assetIdSchema,
  assets: z.array(ThemeAssetReferenceSchema).default([]),
  canvas: z.array(ThemeCanvasLayerSchema).min(1).max(12),
  accessibility: accessibilitySchema,
  capabilities: capabilitiesSchema
});

export type ThemeDefinition = z.infer<typeof ThemeDefinitionSchema>;
```

Colors accept only `#RRGGBB` or `#RRGGBBAA`. IDs accept lower-case kebab case. Numeric opacity is `0..1`; CSS-pixel sizes are finite bounded numbers. Canvas is a strict discriminated union for `solid`, `linear-gradient`, `radial-gradient`, `conic-gradient`, `four-corner`, `image`, `veil`, and `texture`. Image and texture layers use local asset IDs rather than URLs. `ThemePatchSchema` deep-partials semantic object groups but replaces `assets` and `canvas` arrays wholesale.

- [ ] **Step 4: Verify the valid fixture passes**

Run: `npm.cmd run test:native -- packages/contracts/src/theme.test.ts`

Expected: PASS for the complete definition.

- [ ] **Step 5: Add and verify one rejection test at a time**

Add separate tests, running the focused file after each addition, for:

```ts
it.each([
  ['wrong schema version', { schemaVersion: 'pomegranate.ui.theme.v2' }, ['schemaVersion']],
  ['remote image URL', { canvas: [{ kind: 'image', assetId: 'https://example.test/a.png' }] }, ['canvas', 0, 'assetId']],
  ['arbitrary selector', { selector: 'main[data-theme]' }, []],
  ['script-shaped field', { script: 'alert(1)' }, []],
  ['missing text role', { colors: { text: undefined } }, ['colors', 'text']]
])('rejects %s', (_name, mutation, expectedPath) => {
  const candidate = mutateFixture(VALID_THEME, mutation);
  const result = ThemeDefinitionSchema.safeParse(candidate);
  expect(result.success).toBe(false);
  if (!result.success && expectedPath.length > 0) {
    expect(result.error.issues.some((issue) => expectedPath.every((part, index) => issue.path[index] === part))).toBe(true);
  }
});
```

Expected red reasons: each newly introduced malformed case initially parses. Expected green result: every malformed case fails at the literal public path; valid local asset IDs still parse.

- [ ] **Step 6: Export the contract module and run contract plus type gates**

Add `export * from './theme.js';` to `packages/contracts/src/index.ts`.

Run:

```powershell
npm.cmd run test:native -- packages/contracts/src/theme.test.ts
npm.cmd run typecheck
```

Expected: all focused tests and type checks pass with no warnings.

- [ ] **Step 7: Commit the contract slice**

```powershell
git add packages/contracts/src/theme.ts packages/contracts/src/theme.test.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): add theme schema"
```

---

### Task 2: Framework-neutral resolution package

**Files:**
- Create: `packages/theme/package.json`
- Create: `packages/theme/tsconfig.json`
- Create: `packages/theme/src/index.ts`
- Create: `packages/theme/src/resolve.ts`
- Create: `packages/theme/src/conformance.ts`
- Create: `packages/theme/src/theme.test.ts`
- Modify: `packages/theme/README.md`
- Modify: `tsconfig.json`
- Modify: `package-lock.json`
- Modify: `tests/unit/repository-boundary.test.mjs`

**Interfaces:**
- Consumes: `ThemeDefinitionSchema`, `ThemePatchSchema`, and public theme types from `@pomegranate-ui/contracts`.
- Produces:

```ts
export type ThemeDiagnosticCode =
  | 'THEME_SCHEMA_INVALID'
  | 'THEME_UNKNOWN_PRESET'
  | 'THEME_ASSET_MISSING'
  | 'THEME_CONTRAST_UNSAFE';

export interface ThemeDiagnostic {
  readonly code: ThemeDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface ResolvedTheme extends Omit<ThemeDefinition, 'materials'> {
  readonly materials: Readonly<Record<ThemeMaterialRole, ResolvedMaterial>>;
}

export type ThemeResolution =
  | { readonly ok: true; readonly theme: ResolvedTheme; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export function resolveTheme(input: unknown): ThemeResolution;
export function mergeTheme(base: ThemeDefinition, patch: ThemePatch): ThemeDefinition;
export function collectThemeAssetIds(theme: ResolvedTheme): readonly string[];
export function contrastRatio(foreground: string, background: string): number;
```

- [ ] **Step 1: Write a failing resolution test**

```ts
it('resolves material color roles into immutable presentation-neutral values', () => {
  const result = resolveTheme(VALID_THEME);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.theme.materials.widget).toMatchObject({
    base: '#29252d',
    border: '#4b424b',
    fallback: '#29252d'
  });
  expect(Object.isFrozen(result.theme)).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify the package is missing**

Run: `npm.cmd run test:native -- packages/theme/src/theme.test.ts`

Expected: FAIL because the package source and resolver do not exist.

- [ ] **Step 3: Add the package manifest, project reference, and minimum resolver**

`packages/theme/package.json` must mirror the existing packable package shape, depend only on `@pomegranate-ui/contracts` version `0.1.0-private.0`, and export `dist/index.js` plus `dist/index.d.ts`. `packages/theme/tsconfig.json` references only `../contracts`. Add `./packages/theme` to root `tsconfig.json` after contracts.

Implement `resolveTheme` by `safeParse`, map Zod issues to `THEME_SCHEMA_INVALID` diagnostics, resolve every material role reference through `colors`, clone arrays, and deep-freeze the result without DOM or platform calls.

- [ ] **Step 4: Run the resolver test and verify green**

Run: `npm.cmd run test:native -- packages/theme/src/theme.test.ts`

Expected: PASS.

- [ ] **Step 5: Add deterministic merge, diagnostics, asset, and contrast tests one at a time**

Use hand-derived assertions:

```ts
it('deep-merges semantic objects and replaces ordered arrays', () => {
  const merged = mergeTheme(VALID_THEME, {
    label: 'Changed',
    colors: { accent: '#112233' },
    canvas: [{ kind: 'solid', color: '#010203' }]
  });
  expect(merged.colors.text).toBe('#f6f2eb');
  expect(merged.colors.accent).toBe('#112233');
  expect(merged.canvas).toEqual([{ kind: 'solid', color: '#010203' }]);
});

it('returns stable literal diagnostics for malformed public input', () => {
  const result = resolveTheme({ schemaVersion: 'wrong' });
  expect(result).toEqual({
    ok: false,
    diagnostics: expect.arrayContaining([
      expect.objectContaining({ code: 'THEME_SCHEMA_INVALID', path: ['schemaVersion'] })
    ])
  });
});

it('deduplicates local asset ids in first-use order', () => {
  expect(collectThemeAssetIds(RESOLVED_WITH_ASSETS)).toEqual(['icons.minimal', 'texture.paper', 'image.hero']);
});

it('calculates known WCAG ratios without browser APIs', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.478, 3);
});
```

Each test must first fail because its behavior is absent or wrong, then pass after the smallest implementation. `mergeTheme` validates the final merged object and throws a `ThemeMergeError` carrying diagnostics rather than returning an invalid definition.

- [ ] **Step 6: Promote the reserved package in repository boundary tests**

Change package-documentation, packable-package, and framework-neutral package lists to include `theme`. Replace the reserved README assertion with assertions that the README says it is framework-neutral, declarative, adopter-owned in application, and does not bundle a branded preset.

Run:

```powershell
npm.cmd install --package-lock-only
npm.cmd run test:unit
npm.cmd run test:native -- packages/theme/src/theme.test.ts
npm.cmd run typecheck
```

Expected: unit, native, and type gates pass; the lockfile contains the theme workspace with contracts as its only runtime dependency.

- [ ] **Step 7: Commit the resolver slice**

```powershell
git add packages/theme package-lock.json tsconfig.json tests/unit/repository-boundary.test.mjs
git commit -m "feat(theme): add neutral resolver"
```

---

### Task 3: Lab conformance presets, bindings, and atomic controller

**Files:**
- Create: `apps/workbench-lab/src/themes/deep-current.ts`
- Create: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Create: `apps/workbench-lab/src/themes/bunny.ts`
- Create: `apps/workbench-lab/src/themes/presets.ts`
- Create: `apps/workbench-lab/src/themes/bindings.ts`
- Create: `apps/workbench-lab/src/themes/controller.ts`
- Create: `apps/workbench-lab/src/themes/theme-storage.ts`
- Create: `apps/workbench-lab/src/themes/themes.test.ts`
- Modify: `apps/workbench-lab/package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `resolveTheme`, `collectThemeAssetIds`, `contrastRatio`, `ResolvedTheme`, and the public contract types.
- Produces:

```ts
export const LAB_THEME_IDS = ['deep-current', 'pom-neutral', 'bunny'] as const;
export type LabThemeId = typeof LAB_THEME_IDS[number];

export interface LabThemePreset {
  readonly id: LabThemeId;
  readonly definition: ThemeDefinition;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly definition: unknown;
}

export interface LabThemeSnapshot {
  readonly activeId: LabThemeId;
  readonly resolved: ResolvedTheme;
  readonly cssText: string;
  readonly diagnostics: readonly ThemeDiagnostic[];
}

export interface ThemePreferenceAdapter {
  read(): string | null;
  write(id: LabThemeId): void;
}

export function compileThemeBindings(theme: ResolvedTheme): string;
export function createLabThemeController(options: {
  readonly presets?: readonly LabThemePresetInput[];
  readonly initialId?: string | null;
  readonly preference?: ThemePreferenceAdapter;
  readonly availableAssets?: ReadonlySet<string>;
}): {
  getSnapshot(): LabThemeSnapshot;
  activate(id: string): { ok: true; snapshot: LabThemeSnapshot } | { ok: false; diagnostics: readonly ThemeDiagnostic[] };
};
```

- [ ] **Step 1: Write a failing three-preset resolution test**

```ts
it.each(LAB_THEME_IDS)('resolves the complete %s Lab preset', (id) => {
  const preset = LAB_THEME_PRESETS.find((candidate) => candidate.id === id);
  expect(preset).toBeDefined();
  const result = resolveTheme(preset?.definition);
  expect(result.ok).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify the preset module is missing**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/themes/themes.test.ts`

Expected: FAIL because the Lab preset registry does not exist.

- [ ] **Step 3: Define three complete presets without binary assets**

Deep Current uses the exact existing values from `styles.css`, including its canvas gradient stack, Pomegranate font families, angular radii, ember accent, glass material, and existing `minimal-ui-icons` pack ID. Pom Neutral uses light neutral surfaces, blue accent, system UI fallbacks, moderate rounded geometry, balanced density, and restrained shadow. Bunny uses pastel cream, rose, lilac, mint, and yellow roles, rounded/pill geometry, roomy density, a four-corner canvas, system rounded fallbacks, and the existing local icon pack with theme-driven tint and geometry.

Do not add a fourth preset, font binary, image, texture, remote reference, or theme-specific component setting.

- [ ] **Step 4: Run the preset test and verify green**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/themes/themes.test.ts`

Expected: all three complete definitions parse and resolve.

- [ ] **Step 5: Add a failing semantic-binding test, then compile one root binding**

```ts
it('compiles semantic values and ordered canvas layers without a theme-id selector', () => {
  const result = resolveTheme(BUNNY_THEME);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const cssText = compileThemeBindings(result.theme);
  expect(cssText).toContain('--pom-color-text:#443b54');
  expect(cssText).toContain('--pom-radius-widget:18px');
  expect(cssText).toContain('--pom-canvas:');
  expect(cssText).not.toContain('bunny');
  expect(cssText).not.toContain('transition');
});
```

`compileThemeBindings` returns only sorted custom-property declarations. It deterministically translates canvas layers to comma-separated CSS images plus a final canvas color and escapes font-family strings; it never emits selectors, URLs, declarations supplied by a theme, or transition properties.

- [ ] **Step 6: Add one failing atomic-controller test at a time, then implement the minimum state machine**

```ts
it('switches a complete binding and persists only after validation succeeds', () => {
  const writes: string[] = [];
  const controller = createLabThemeController({ preference: { read: () => null, write: (id) => writes.push(id) } });
  const before = controller.getSnapshot();
  const result = controller.activate('bunny');
  expect(result.ok).toBe(true);
  expect(controller.getSnapshot().activeId).toBe('bunny');
  expect(controller.getSnapshot().cssText).not.toBe(before.cssText);
  expect(writes).toEqual(['bunny']);
});

it('retains the last valid snapshot for an invalid or asset-incomplete preset', () => {
  const controller = createLabThemeController({ presets: [
    ...LAB_THEME_PRESETS,
    { id: 'broken', definition: { schemaVersion: 'wrong' } }
  ] });
  const before = controller.getSnapshot();
  const result = controller.activate('broken');
  expect(result.ok).toBe(false);
  expect(controller.getSnapshot()).toBe(before);
  if (!result.ok) expect(result.diagnostics[0]).toMatchObject({ code: 'THEME_SCHEMA_INVALID' });
});

it('falls back to Deep Current for an unknown stored preference', () => {
  const controller = createLabThemeController({ initialId: 'removed-theme' });
  expect(controller.getSnapshot().activeId).toBe('deep-current');
});
```

The controller has no intermediate switching flag. It resolves definition, verifies `collectThemeAssetIds` against `availableAssets`, compiles CSS, freezes one new snapshot, then writes the preference. Any earlier failure returns diagnostics and does not replace the snapshot.

- [ ] **Step 7: Add and test the app-owned local preference adapter**

Use key `pomegranate-ui.workbench-lab.theme.v1`. `read()` returns the raw stored ID; `write()` stores only one of `LAB_THEME_IDS`. A storage exception is contained and leaves selection usable in memory.

Run:

```powershell
npm.cmd install --package-lock-only
npm.cmd run test:native -- apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run typecheck
```

Expected: focused tests and type checks pass.

- [ ] **Step 8: Commit the Lab theme engine**

```powershell
git add apps/workbench-lab/src/themes apps/workbench-lab/package.json package-lock.json
git commit -m "feat(lab): add three theme presets"
```

---

### Task 4: Apply themes to the unchanged Svelte Workbench

**Files:**
- Modify: `apps/workbench-lab/src/mockup/host-context.ts`
- Modify: `apps/workbench-lab/src/mockup/renderers/SettingsWidget.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `apps/workbench-lab/src/styles.css`

**Interfaces:**
- Consumes: `createLabThemeController`, `createLocalThemePreference`, `LAB_THEME_PRESETS`, and `LabThemeSnapshot`.
- Produces: a reactive `LabHostContext.theme` surface:

```ts
export interface LabThemeHostContext {
  activeId: LabThemeId;
  readonly presets: readonly { readonly id: LabThemeId; readonly label: string; readonly description: string }[];
  readonly activate: (id: string) => void;
  readonly inspect: () => Readonly<Record<string, unknown>>;
}
```

- [ ] **Step 1: Write a failing component test for the selector and unchanged state identity**

```ts
it('applies Bunny immediately without changing the live Workbench identity', async () => {
  const user = userEvent.setup();
  const { container } = render(App);
  const root = container.querySelector('main');
  await user.click(screen.getByRole('tab', { name: 'Settings' }));
  const before = {
    revision: root?.getAttribute('data-workbench-revision'),
    panel: container.querySelector('[data-pomegranate-panel]')?.getAttribute('data-pomegranate-panel'),
    widgets: [...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))
  };
  await user.click(screen.getByRole('button', { name: 'Bunny' }));
  expect(root).toHaveAttribute('data-pom-theme', 'bunny');
  expect(root).toHaveAttribute('data-workbench-revision', before.revision);
  expect(container.querySelector('[data-pomegranate-panel]')).toHaveAttribute('data-pomegranate-panel', before.panel);
  expect([...container.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))).toEqual(before.widgets);
  expect(window.localStorage.getItem('pomegranate-ui.workbench-lab.theme.v1')).toBe('bunny');
});
```

Capture the Settings panel identity after navigation and before clicking the theme button so the theme click, not navigation, is the state-preservation boundary.

- [ ] **Step 2: Run the App test and verify selector absence**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts`

Expected: FAIL because a `Bunny` theme control and root theme evidence do not exist.

- [ ] **Step 3: Wire one reactive host context and one root application boundary**

Create the controller once beside `createLabRuntime()`. Keep `runtime.store` unchanged. Make `hostContext` a Svelte deep state object so only `hostContext.theme.activeId` changes on activation. Apply:

```svelte
<main
  class:focus-mode={focusMode}
  class:left-collapsed={leftCollapsed}
  data-pom-theme={themeSnapshot.activeId}
  data-workbench-revision={workbench.revision}
  style={themeSnapshot.cssText}
>
```

`SettingsWidget` renders the three selector buttons only when `instance.type === 'settings.theme'`, with `aria-pressed={hostContext.theme.activeId === preset.id}` and plain-language descriptions. When `instance.type === 'settings.custom-theme'`, it renders the compact read-only semantic inspector. Other Settings fixtures retain their existing renderer behavior.

- [ ] **Step 4: Replace hardcoded presentation constants with semantic custom properties**

Refactor `styles.css` without theme-ID selectors. At minimum bind canvas, root text, typography roles, color roles, every shell/widget/control/input/catalog/dialog material, focus, border widths, radii, shadow, density gaps/padding, icon tint, and the three decorative atmosphere colors through `--pom-*` properties from `compileThemeBindings`.

Deep Current values must remain the current literals after resolution. Existing layout breakpoints, structural grids, container queries, and coarse-pointer rules remain structural CSS. The only remaining animation rule is the pre-existing mount animation under `prefers-reduced-motion: no-preference`; no theme switch adds or restarts it.

- [ ] **Step 5: Run component tests and review the Deep Current image diff**

Run:

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:browser -- tests/browser/native-workbench-visual.spec.ts
```

Expected: component and type gates pass. Existing Deep Current screenshots have no diff except `compact-settings.png`, whose only intentional change is the approved compact three-theme selector/inspector content. Inspect the actual PNG diff before accepting a baseline change; do not change geometry merely to reduce the diff.

- [ ] **Step 6: Update only the intentional Deep Current Settings baseline if required**

Run: `npm.cmd run test:browser -- tests/browser/native-workbench-visual.spec.ts --update-snapshots`

Then inspect `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-settings.png` and rerun the visual test without update mode. No other pre-existing PNG may change.

- [ ] **Step 7: Commit the Svelte integration**

```powershell
git add apps/workbench-lab/src/App.svelte apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/mockup/host-context.ts apps/workbench-lab/src/mockup/renderers/SettingsWidget.svelte apps/workbench-lab/src/styles.css tests/browser/__screenshots__
git commit -m "feat(lab): apply atomic themes"
```

---

### Task 5: Cross-theme browser, accessibility, and visual conformance

**Files:**
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Create: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-pom-neutral.png`
- Create: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-pom-neutral.png`
- Create: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-bunny.png`
- Create: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-bunny.png`

**Interfaces:**
- Consumes: accessible theme buttons named `Deep Current`, `Pom Neutral`, and `Bunny`, root `data-pom-theme`, existing public Pom data attributes, and rendered semantic CSS.
- Produces: browser proof for atomic identity, focus, interaction, contrast, zoom-equivalent compact layout, coarse-pointer sizing, and four reviewed new snapshots.

- [ ] **Step 1: Write a failing browser identity and focus-continuity test**

```ts
test('theme selection preserves Workbench state, Catalog state, and focused control', async ({ page }) => {
  await openFresh(page, 1440, 900);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  await expect(page.getByRole('complementary', { name: 'Widget Catalog' })).toBeVisible();
  await page.getByRole('complementary', { name: 'Widget Catalog' }).getByRole('button', { name: 'Close Catalog' }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  const before = await page.evaluate(() => ({
    revision: document.querySelector('main')?.getAttribute('data-workbench-revision'),
    panel: document.querySelector('[data-pomegranate-panel]')?.getAttribute('data-pomegranate-panel'),
    widgets: [...document.querySelectorAll('[data-pomegranate-widget]')].map((node) => node.getAttribute('data-pomegranate-widget'))
  }));
  const bunny = page.getByRole('button', { name: 'Bunny' });
  await bunny.click();
  await expect(bunny).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('data-pom-theme', 'bunny');
  expect(await page.locator('main').getAttribute('data-workbench-revision')).toBe(before.revision);
  expect(await page.locator('[data-pomegranate-panel]').getAttribute('data-pomegranate-panel')).toBe(before.panel);
  expect(await page.locator('[data-pomegranate-widget]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-pomegranate-widget')))).toEqual(before.widgets);
  await page.getByRole('button', { name: 'Open Widget Catalog' }).click();
  await expect(page.getByRole('complementary', { name: 'Widget Catalog' })).toBeVisible();
});
```

Also assert the Settings panel and its Widget IDs are identical immediately before and after the theme click.

- [ ] **Step 2: Run the focused browser test and verify it fails before the evidence exists**

Run: `npm.cmd run test:browser -- tests/browser/native-workbench.spec.ts -g "theme selection"`

Expected: FAIL on missing root evidence or selector behavior before the integration is complete; after Task 4 it must pass, proving the new browser contract catches regression in root/state wiring.

- [ ] **Step 3: Add a rendered contrast helper and per-theme responsive loop**

In the page, parse computed `rgb/rgba`, composite translucent element backgrounds through ancestors to the root canvas, calculate sRGB relative luminance, and return text/background ratios for `.top-shelf`, `.widget-frame`, `.transcript`, `.settings-sample button`, and `.widget-catalog` when visible. For each theme at 1440x900 and 390x844 assert:

- document width does not exceed viewport width;
- all three tabs and the active Transcript or Settings Widgets remain visible;
- normal text ratio is at least `4.5` and large text ratio at least `3`;
- the focused theme button has a visible outline at least `2px`;
- the existing coarse-pointer rule still exposes `44px` targets; and
- selecting the theme does not introduce `transition-property` on `main`, shelf, Widget, or button surfaces.

Run: `npm.cmd run test:browser -- tests/browser/native-workbench-accessibility.spec.ts`

Expected: PASS for all three targets at both viewports.

- [ ] **Step 4: Add exactly four new stable-state visual paths**

Extend the Windows-only visual test with a helper that opens Settings, selects a theme, returns to Scene, waits for fonts, and captures:

```ts
for (const theme of [
  { button: 'Pom Neutral', slug: 'pom-neutral' },
  { button: 'Bunny', slug: 'bunny' }
]) {
  await fresh(page, 1440, 900);
  await selectTheme(page, theme.button);
  await shot(page, `wide-${theme.slug}.png`);
  await fresh(page, 390, 844);
  await selectTheme(page, theme.button);
  await shot(page, `compact-${theme.slug}.png`);
}
```

No Catalog, error, floating, or focus-mode snapshot is duplicated for the new themes.

- [ ] **Step 5: Generate and visually inspect the four new baselines**

Run: `npm.cmd run test:browser -- tests/browser/native-workbench-visual.spec.ts --update-snapshots`

Inspect all four images at original resolution. Confirm Pom Neutral is light, restrained, and moderate-rounded; Deep Current stays dark, industrial, and angular; Bunny is pastel, pillowy, and legible; all use the same shell, Panels, Widget order, and semantic content.

- [ ] **Step 6: Rerun browser conformance without update mode**

Run:

```powershell
npm.cmd run test:browser -- tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench-visual.spec.ts
```

Expected: all behavior, accessibility, and visual checks pass from committed baselines.

- [ ] **Step 7: Commit cross-theme evidence**

```powershell
git add tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench-visual.spec.ts tests/browser/__screenshots__
git commit -m "test(lab): prove theme conformance"
```

---

### Task 6: Packed consumer, artifact size, and ownership documentation

**Files:**
- Modify: `scripts/verify-packed-consumers.mjs`
- Modify: `tests/unit/packed-consumer.test.mjs`
- Modify: `README.md`
- Modify: `apps/workbench-lab/README.md`
- Modify: `packages/theme/README.md`
- Create: `docs/theme-foundation-artifact-sizes.md`

**Interfaces:**
- Consumes: packed `@pomegranate-ui/theme`, `resolveTheme`, the static Lab artifact, and the approved adopter/theme boundary.
- Produces: isolated package proof, a deterministic size ledger, and clear developer-facing ownership guidance.

- [ ] **Step 1: Write a failing packed-verifier contract test**

Update the expected package list to include `theme`, require the generated consumer to import `resolveTheme`, and require local resolution of `@pomegranate-ui/theme`.

Run: `node --test tests/unit/packed-consumer.test.mjs`

Expected: FAIL because the verifier still packs five packages and the generated consumer does not exercise theme resolution.

- [ ] **Step 2: Extend the real packed consumer with theme resolution**

Add `theme` to `packageNames`, generated dependencies, and `assertLocalResolutions`. In the generated clean Svelte consumer, import `resolveTheme`, resolve a minimal complete literal fixture, throw when it fails, and render the resolved ID in an existing status element. This proves the tarball API and transitive contracts package resolve wholly inside the temporary consumer.

Run:

```powershell
npm.cmd run test:unit
npm.cmd run build
npm.cmd run test:pack
```

Expected: six packages and three clean consumers pass without a workspace path leak.

- [ ] **Step 3: Record compressed artifact size impact**

Build the Lab, then use a deterministic PowerShell command to enumerate `apps/workbench-lab/dist`, grouping JavaScript, CSS, fonts, images, and total raw bytes. Gzip each emitted file with the repository's Node runtime at level 9 and record compressed totals. Compare against the last committed `d0b418e` artifact by building that revision in a temporary worktree or by the pre-change measurements recorded in the implementation log.

Write both revisions and exact byte counts in `docs/theme-foundation-artifact-sizes.md`. State that the tranche added zero third-party runtime dependencies and zero binary assets. Do not add a budget-enforcement script until repeated tranche evidence justifies one.

- [ ] **Step 4: Update toolkit, package, and Lab documentation**

Document:

- `contracts -> theme` beside the existing runtime dependency line;
- the versioned declarative contract and framework-neutral resolver;
- the Lab-owned nature of Pom Neutral, Deep Current, and Bunny;
- immediate switching and invalid-theme retention;
- adopter ownership of markup, branding, asset resolution, and preference persistence;
- the absence of animated morphing, editor, remote loading, publishing, hosting, and Sonder cutover; and
- exact local Lab, preview, build, and full verification commands.

Do not describe the Lab as a turnkey Pom application or promise a public package/site in this tranche.

- [ ] **Step 5: Run documentation, package, build, extraction, and report gates**

Run:

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:extraction
npm.cmd run check:recipes
npm.cmd run report
npm.cmd run test:pack
```

Expected: all gates pass; preserved extraction and recipe hashes remain current and unchanged.

- [ ] **Step 6: Commit delivery documentation and packed proof**

```powershell
git add scripts/verify-packed-consumers.mjs tests/unit/packed-consumer.test.mjs README.md apps/workbench-lab/README.md packages/theme/README.md docs/theme-foundation-artifact-sizes.md
git commit -m "docs: explain Pom theme boundary"
```

---

### Task 7: Full verification, review, PR, and merge

**Files:**
- Review: all files changed from `origin/main...HEAD`
- Do not modify: `prototypes/sonder-baseline/**`, `design/foundations/sonder-ui-bible/**`, `design/widget-specifications/sonder-panels-and-widgets/**`, `provenance/assets/**`

**Interfaces:**
- Consumes: the complete implementation, repository gates, GitHub CI, and branch protection.
- Produces: a reviewed, merged pull request with no unrelated dirty-checkout content.

- [ ] **Step 1: Verify scope and preservation before the final gate**

Run:

```powershell
git status --short
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
npm.cmd run check:extraction
```

Expected: only planned theme/package/Lab/test/docs files are present; no preserved byte path changed; no `docs/assets/` files from the primary checkout appear.

- [ ] **Step 2: Run the full repository gate from a clean working tree**

Run: `npm.cmd run check`

Expected: unit, type, native, build, extraction, recipes, report, packed-consumer, browser behavior, accessibility, and visual gates all pass with zero failures.

- [ ] **Step 3: Perform a focused diff review and mutation check**

Review every changed file for target-theme ID branches, state/store recreation, mutable resolver output, arbitrary CSS/URL acceptance, accessibility regressions, package dependency leaks, hidden asset additions, and unintentional baseline refreshes. Mentally mutate invalid activation, array replacement, asset failure, active theme persistence, root binding, and state identity; verify a named test fails for each mutation.

- [ ] **Step 4: Commit any review fixes test-first, then rerun affected gates and `npm.cmd run check`**

Use a focused conventional commit such as `fix(theme): retain valid binding` only if review finds a real defect with a reproducing failing test. Expected: final working tree clean and full gate green.

- [ ] **Step 5: Push the feature branch and create the pull request**

```powershell
git push -u origin codex/pom-theme-foundation
gh pr create --base main --head codex/pom-theme-foundation --title "Add Pom theme foundation and three visual targets" --body-file .github/pull_request_template.md
```

If no repository PR template exists, write the PR body directly with summary, design constraints, exact test evidence, artifact size delta, screenshots, deferred scope, and no-publication/no-cutover boundaries. Do not include memory citations in the PR body.

- [ ] **Step 6: Monitor required checks and address failures with reproducing tests**

Run `gh pr checks --watch`. For any failure, inspect the exact job log, reproduce locally, add a failing regression test when code behavior is wrong, implement the minimum fix, rerun the affected lane plus the full gate, commit, and push.

- [ ] **Step 7: Merge without bypassing protection and verify remote identity**

Run:

```powershell
gh pr merge --squash --delete-branch
gh pr view --json number,state,mergedAt,mergeCommit,url
gh api repos/{owner}/{repo}/commits/main --jq '{sha:.sha,message:.commit.message,date:.commit.author.date}'
```

Expected: PR state `MERGED`; remote `main` identifies the returned merge commit. Do not use admin bypass, force push, package publication, Pages deployment, or Sonder changes.

---

## Plan self-review

- Spec coverage: contracts, deterministic resolution/merge, all three presets, Deep Current parity, atomic failure behavior, state identity, accessibility, four new snapshots, packed isolation, artifact size, documentation, full verification, PR, and merge each have an owning task.
- Deferred scope is explicit: no transition system, ambient engine, editor, remote assets, hosting, publication, or cutover.
- Type consistency: `LabThemeId`, `LabThemePreset`, `LabThemeSnapshot`, `ThemePreferenceAdapter`, `ThemeResolution`, and diagnostic codes have one definition and unchanged consumers throughout the plan.
- Dependency consistency: only the theme package depends on contracts; the Lab consumes theme; no runtime package is made theme-aware.
- Test integrity: each behavior test names a concrete regression, uses real contracts/components/browser output, and derives expected literals independently of the production helper under test.
- Preservation: the primary checkout's unrelated `docs/assets/` and documentation work never enter the isolated branch.
