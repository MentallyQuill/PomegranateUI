import { resolveAmbientProfile, type ResolvedAmbientProfile } from '@pomegranate-ui/theme';
import type { Locator, Page } from '@playwright/test';

import type { ThemeAuthoringMeasurement } from '../../measurements.ts';
import { ConformanceError, type ConformanceScenario } from '../../types.ts';

const draftKey = 'pomegranate-ui.workbench-lab.theme-draft.v1';
const layoutKey = 'pomegranate-ui.workbench-lab.layout.v1';

type PreparedAuthoring = {
  readonly settings: Locator;
  readonly beforeIds: readonly string[];
  readonly beforeRevision: string;
};

const colorRoles = [
  ['Canvas', 'canvas', '#2C2938', '--pom-color-canvas'],
  ['Glass', 'glass', '#382D31', '--pom-color-surface'],
  ['Chrome', 'chrome', '#716667', '--pom-color-chrome'],
  ['Ambient', 'ambient', '#84008E', '--pom-color-accent'],
  ['Text', 'text', '#FFFFFF', '--pom-color-text'],
  ['Source', 'source', '#D2B57A', '--pom-color-warning']
] as const;

const materials = [
  ['Glass Density', 'glassDensity', 20],
  ['Bar Opacity', 'barOpacity', 60],
  ['Selected Strength', 'selectedStrength', 6],
  ['Frost Level', 'frostLevel', 50]
] as const;

async function widgetIds(page: Page): Promise<string[]> {
  return page.locator('[data-pomegranate-widget]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-pomegranate-widget') ?? '')
  ));
}

async function binding(page: Page, property: string): Promise<string> {
  return page.locator('main').evaluate((root, name) => getComputedStyle(root).getPropertyValue(name).trim(), property);
}

async function waitForBinding(page: Page, property: string, expected: string): Promise<void> {
  await page.waitForFunction(([name, value]) => {
    const root = document.querySelector('main');
    return root !== null && getComputedStyle(root).getPropertyValue(name).trim() === value;
  }, [property, expected] as const);
}

async function prepareAuthoring(
  page: Page,
  labOrigin: string,
  reducedAmbient: boolean
): Promise<PreparedAuthoring> {
  if (reducedAmbient) {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'prefers-reduced-transparency', value: 'reduce' }
      ]
    });
  }
  await page.goto(labOrigin, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('group', { name: 'Visual target' })
    .getByRole('button', { name: 'Ash & Amber', exact: true })
    .click();
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('tab', { name: 'Settings' }).click();
  const settings = page.getByRole('article', { name: 'Theme Settings' });
  await settings.waitFor({ state: 'visible' });
  return {
    settings,
    beforeIds: Object.freeze(await widgetIds(page)),
    beforeRevision: await page.locator('main').getAttribute('data-workbench-revision') ?? ''
  };
}

async function controlsPresent(settings: Locator): Promise<boolean> {
  const counts = await Promise.all([
    ...colorRoles.map(([label]) => settings.getByRole('button', { name: label, exact: true }).count()),
    ...materials.map(([label]) => settings.getByRole('slider', { name: label }).count()),
    settings.getByRole('application', { name: 'Ambient position' }).count(),
    settings.getByRole('slider', { name: 'Radius' }).count(),
    settings.getByRole('slider', { name: 'Power' }).count(),
    settings.getByRole('button', { name: 'Save draft' }).count(),
    settings.getByRole('button', { name: 'Reset', exact: true }).count()
  ]);
  return counts.every((count) => count === 1);
}

async function finishMeasurement(
  page: Page,
  prepared: PreparedAuthoring,
  outcome: Readonly<Record<string, unknown>>,
  overrides: {
    readonly appliedEditableIndependent?: boolean;
    readonly workbenchIdentityStable?: boolean;
    readonly layoutIndependent?: boolean;
  } = {}
): Promise<ThemeAuthoringMeasurement> {
  const afterIds = await widgetIds(page);
  const root = page.locator('main');
  const editable = await prepared.settings.getByRole('textbox', { name: 'Hex color' }).inputValue();
  const applied = await binding(page, '--pom-color-canvas');
  return Object.freeze({
    functional: Object.freeze({
      controlsPresent: await controlsPresent(prepared.settings) as true,
      targetApplied: ((await root.getAttribute('data-pom-theme')) === 'ash-amber') as true,
      appliedEditableIndependent: (overrides.appliedEditableIndependent ?? Boolean(editable && applied)) as true,
      workbenchIdentityStable: (overrides.workbenchIdentityStable ?? (
        prepared.beforeIds.length === afterIds.length
          && prepared.beforeIds.every((id, index) => id === afterIds[index])
      )) as true,
      layoutIndependent: (overrides.layoutIndependent ?? (
        prepared.beforeRevision === (await root.getAttribute('data-workbench-revision') ?? '')
      )) as true
    }),
    outcome: Object.freeze(outcome),
    trace: Object.freeze(['opened the shared Theme Settings owner', 'measured editable controls separately from applied root bindings'])
  });
}

async function measureAshSeed(page: Page, prepared: PreparedAuthoring): Promise<ThemeAuthoringMeasurement> {
  const hex = prepared.settings.getByRole('textbox', { name: 'Hex color' });
  for (const [label, , value, property] of colorRoles) {
    await prepared.settings.getByRole('button', { name: label, exact: true }).click();
    await hex.fill(value);
    await waitForBinding(page, property, value.toLowerCase());
  }
  for (const [label, , value] of materials) {
    await prepared.settings.getByRole('slider', { name: label }).fill(String(value));
  }
  const position = prepared.settings.getByRole('application', { name: 'Ambient position' });
  await position.focus();
  await position.press('End');
  for (let index = 0; index < 43; index += 1) await position.press('ArrowLeft');
  for (let index = 0; index < 3; index += 1) await position.press('ArrowUp');
  await prepared.settings.getByRole('slider', { name: 'Radius' }).fill('60');
  await prepared.settings.getByRole('slider', { name: 'Power' }).fill('56');

  const editableColors: Record<string, string> = {};
  for (const [label, id] of colorRoles) {
    await prepared.settings.getByRole('button', { name: label, exact: true }).click();
    editableColors[id] = await hex.inputValue();
  }
  const editableMaterials = Object.fromEntries(await Promise.all(materials.map(async ([label, id]) => (
    [id, Number(await prepared.settings.getByRole('slider', { name: label }).inputValue())] as const
  ))));
  const positionText = await prepared.settings.locator('.ambient-position + output').textContent() ?? '';
  const positionMatch = /X (\d+)% · Y (\d+)%/.exec(positionText);
  const appliedColors = Object.fromEntries(await Promise.all(colorRoles.map(async ([, id, , property]) => (
    [id, await binding(page, property)] as const
  ))));
  const outcome = {
    editable: {
      colors: editableColors,
      materials: editableMaterials,
      ambient: {
        x: Number(positionMatch?.[1] ?? Number.NaN),
        y: Number(positionMatch?.[2] ?? Number.NaN),
        radius: Number(await prepared.settings.getByRole('slider', { name: 'Radius' }).inputValue()),
        power: Number(await prepared.settings.getByRole('slider', { name: 'Power' }).inputValue())
      }
    },
    applied: {
      colors: appliedColors,
      ambient: {
        x: await binding(page, '--pom-ambient-x'),
        y: await binding(page, '--pom-ambient-y'),
        radius: await binding(page, '--pom-ambient-radius'),
        power: await binding(page, '--pom-ambient-power'),
        source: await page.locator('main').getAttribute('data-pom-ambient-source')
      },
      diagnostics: await prepared.settings.locator('.theme-diagnostics').count()
    }
  };
  return finishMeasurement(page, prepared, outcome);
}

async function measureLastValid(page: Page, prepared: PreparedAuthoring): Promise<ThemeAuthoringMeasurement> {
  await prepared.settings.getByRole('button', { name: 'Text', exact: true }).click();
  const hex = prepared.settings.getByRole('textbox', { name: 'Hex color' });
  await hex.fill('url(javascript:unsafe)');
  const invalidDiagnostic = await prepared.settings.locator('.theme-diagnostics').textContent() ?? '';
  const invalidRaw = await hex.inputValue();
  const appliedAfterInvalid = await binding(page, '--pom-color-text');
  await hex.fill('#382D31');
  const unsafeDiagnostic = await prepared.settings.locator('.theme-diagnostics').textContent() ?? '';
  const unsafeRaw = await hex.inputValue();
  const appliedAfterUnsafe = await binding(page, '--pom-color-text');
  return finishMeasurement(page, prepared, {
    invalidRaw,
    invalidRejected: /#RRGGBB/i.test(invalidDiagnostic),
    unsafeRaw,
    unsafeRejected: /contrast/i.test(unsafeDiagnostic),
    appliedAfterInvalid,
    appliedAfterUnsafe
  }, { appliedEditableIndependent: unsafeRaw.toLowerCase() !== appliedAfterUnsafe.toLowerCase() });
}

function ambientProfile(id: string, x: number, y: number, power: number) {
  return {
    schemaVersion: 'pomegranate.ui.ambient.v1' as const,
    id,
    colorRole: 'accent' as const,
    position: { x, y },
    radius: 0.6,
    power,
    motion: { enabled: true, driftX: 0.05, driftY: 0.04, durationMs: 4000 }
  };
}

function summarizeAmbient(value: ResolvedAmbientProfile) {
  return Object.freeze({
    source: value.source,
    id: value.id,
    power: value.power,
    motion: value.motion.enabled,
    transparency: value.transparencyEnabled
  });
}

async function measureAmbientPrecedence(page: Page, prepared: PreparedAuthoring): Promise<ThemeAuthoringMeasurement> {
  const fallback = ambientProfile('fallback', 0.1, 0.2, 0.2);
  const target = ambientProfile('target', 0.3, 0.4, 0.4);
  const scene = ambientProfile('scene', 0.8, 0.9, 0.8);
  const permissive = { enabled: true, maximumPower: 1, allowMotion: true, allowTransparency: true };
  const standard = { reducedMotion: false, reducedTransparency: false };
  const cases = {
    fallback: summarizeAmbient(resolveAmbientProfile({ fallback, limits: permissive, accessibility: standard })),
    target: summarizeAmbient(resolveAmbientProfile({ fallback, target, limits: permissive, accessibility: standard })),
    scene: summarizeAmbient(resolveAmbientProfile({ fallback, target, sceneOverride: scene, limits: permissive, accessibility: standard })),
    device: summarizeAmbient(resolveAmbientProfile({
      fallback, target, sceneOverride: scene,
      limits: { enabled: true, maximumPower: 0.5, allowMotion: false, allowTransparency: false },
      accessibility: standard
    })),
    accessibility: summarizeAmbient(resolveAmbientProfile({
      fallback, target, sceneOverride: scene, limits: permissive,
      accessibility: { reducedMotion: true, reducedTransparency: true }
    }))
  };
  const opacity = Number(await page.locator('[data-pom-ambient-layer]').evaluate((node) => getComputedStyle(node).opacity));
  return finishMeasurement(page, prepared, {
    order: ['fallback', 'target', 'scene', 'device', 'accessibility'],
    cases,
    runtime: {
      source: await page.locator('main').getAttribute('data-pom-ambient-source'),
      motion: await binding(page, '--pom-ambient-motion-enabled'),
      transparency: await binding(page, '--pom-ambient-transparency-enabled'),
      opacity
    }
  });
}

async function measureRoundTrip(page: Page, labOrigin: string, prepared: PreparedAuthoring): Promise<ThemeAuthoringMeasurement> {
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, layoutKey);
  const hex = prepared.settings.getByRole('textbox', { name: 'Hex color' });
  await hex.fill('#312D3B');
  await waitForBinding(page, '--pom-color-canvas', '#312d3b');
  await prepared.settings.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, draftKey);
  await page.getByText('Developer tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Clear saved layout' }).click();
  await page.waitForFunction((key) => localStorage.getItem(key) === null, layoutKey);
  const savedRaw = await page.evaluate((key) => localStorage.getItem(key), draftKey);
  const saved = JSON.parse(savedRaw ?? 'null') as {
    schemaVersion: string;
    draft: { baseTargetId: string; colors: { canvas: string } };
  };
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await waitForBinding(page, '--pom-color-canvas', '#312d3b');
  await page.getByRole('tab', { name: 'Settings' }).click();
  const restoredSettings = page.getByRole('article', { name: 'Theme Settings' });
  await restoredSettings.waitFor({ state: 'visible' });
  const restoredIds = await widgetIds(page);
  const storageState = await page.evaluate(([draftStorageKey, layoutStorageKey]) => ({
    draftPresent: localStorage.getItem(draftStorageKey) !== null,
    layoutPresent: localStorage.getItem(layoutStorageKey) !== null
  }), [draftKey, layoutKey] as const);
  const restoredPrepared: PreparedAuthoring = {
    settings: restoredSettings,
    beforeIds: prepared.beforeIds,
    beforeRevision: await page.locator('main').getAttribute('data-workbench-revision') ?? ''
  };
  return finishMeasurement(page, restoredPrepared, {
    saved: {
      schemaVersion: saved.schemaVersion,
      baseTargetId: saved.draft.baseTargetId,
      canvas: saved.draft.colors.canvas
    },
    restored: {
      canvasBinding: await binding(page, '--pom-color-canvas'),
      canvasInput: await restoredSettings.getByRole('textbox', { name: 'Hex color' }).inputValue(),
      diagnostics: await restoredSettings.locator('.theme-diagnostics').count()
    },
    storage: storageState
  }, {
    workbenchIdentityStable: prepared.beforeIds.length === restoredIds.length
      && prepared.beforeIds.every((id, index) => id === restoredIds[index]),
    layoutIndependent: storageState.draftPresent && !storageState.layoutPresent
  });
}

export async function renderThemeAuthoringScenario(
  page: Page,
  labOrigin: string,
  scenario: ConformanceScenario
): Promise<ThemeAuthoringMeasurement> {
  try {
    const prepared = await prepareAuthoring(page, labOrigin, scenario.implementationState === 'ambient-precedence');
    switch (scenario.implementationState) {
      case 'ash-seed': return await measureAshSeed(page, prepared);
      case 'last-valid': return await measureLastValid(page, prepared);
      case 'ambient-precedence': return await measureAmbientPrecedence(page, prepared);
      case 'round-trip': return await measureRoundTrip(page, labOrigin, prepared);
      default: throw new Error(`Unknown Theme authoring state ${scenario.implementationState}.`);
    }
  } catch (cause) {
    throw new ConformanceError(
      'IMPLEMENTATION_SETUP_FAILED',
      `Workbench Lab Theme authoring failed for ${scenario.id}: ${cause instanceof Error ? cause.message : String(cause)}`,
      { scenarioId: scenario.id }
    );
  }
}
