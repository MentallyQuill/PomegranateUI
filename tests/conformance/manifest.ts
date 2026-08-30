import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  ConformanceError,
  type ConformanceScenario,
  type ManifestValidationOptions,
  type ValidatedConformanceManifest
} from './types.ts';
import { DEEP_CURRENT_CATALOG_SCENARIOS, DEEP_CURRENT_WIDGET_SURFACES } from './widget-manifest.ts';

const atmosphericPath = 'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html';
const atmosphericSha256 = '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913';
const widgetOverhaulPath = 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html';
const widgetOverhaulSha256 = '043167ad75c07fa5ff8661fbe8a86943a9c0b38eeea9811739309cb866e8a2a5';
const pomosReferencePath = 'design/theme-targets/pomos-reference.html';
const pomosReferenceSha256 = 'a46dc956b0664643506b5023836cd02fb2e9f64ca538acff1aca7cc7c34a7af9';
const bunnyReferencePath = 'design/theme-targets/bunny-reference.html';
const bunnyReferenceSha256 = 'b718de3bbd9788ff7dd6efb19f11fd12fee12575fc6018f0e2537061625f7a59';
const ashAmberReferencePath = 'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png';
const ashAmberReferenceSha256 = '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997';

function createMacroScenario(id: string, title: string, viewport: string): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target: 'deep-current',
    authority: 'atmospheric-workbench',
    authorityPath: atmosphericPath,
    authoritySha256: atmosphericSha256,
    viewport,
    inputModes: Object.freeze(viewport === 'compact'
      ? ['coarse-pointer', 'keyboard'] as const
      : ['fine-pointer', 'keyboard'] as const),
    referenceState: 'scene-ready',
    implementationState: 'scene-ready',
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'deep-current-shell-behavior',
    assertionProfile: 'deep-current-shell-behavior',
    allowedDeviationIds: Object.freeze([])
  });
}

export const DEEP_CURRENT_MACRO_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createMacroScenario('dc-shell-wide', 'Deep Current wide shell', 'wide'),
  createMacroScenario('dc-shell-medium', 'Deep Current medium shell', 'medium'),
  createMacroScenario('dc-shell-compact', 'Deep Current compact shell', 'compact'),
  createMacroScenario('dc-shell-landscape-short', 'Deep Current short landscape shell', 'landscape-short'),
  createMacroScenario('dc-shell-zoom-200', 'Deep Current 200-percent zoom equivalent shell', 'zoom-200')
]);

function createInteractionScenario(
  id: string,
  title: string,
  state: string,
  inputModes: ConformanceScenario['inputModes'],
  viewport = 'standard'
): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target: 'deep-current',
    authority: 'widget-overhaul',
    authorityPath: widgetOverhaulPath,
    authoritySha256: widgetOverhaulSha256,
    viewport,
    inputModes: Object.freeze([...inputModes]),
    referenceState: state,
    implementationState: state,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'deep-current-interaction',
    assertionProfile: 'deep-current-interaction',
    allowedDeviationIds: Object.freeze([])
  });
}

export const DEEP_CURRENT_INTERACTION_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createInteractionScenario('dc-int-resize-left', 'Resize the left toolbar', 'scene-left-toolbar-resized', ['keyboard']),
  createInteractionScenario('dc-int-resize-right', 'Resize the right toolbar', 'scene-right-toolbar-resized', ['keyboard']),
  createInteractionScenario('dc-int-shelf-insert', 'Insert a Widget shelf', 'scene-toolbar-new-shelf', ['fine-pointer']),
  createInteractionScenario('dc-int-tab-merge', 'Merge Widgets as tabs', 'scene-group-tab-merge', ['fine-pointer']),
  createInteractionScenario('dc-int-tab-reorder', 'Reorder grouped Widget tabs', 'scene-group-tab-reordered', ['keyboard']),
  createInteractionScenario('dc-int-float', 'Float and move a Widget', 'scene-widget-floating', ['fine-pointer']),
  createInteractionScenario('dc-int-invalid-restore', 'Restore an invalid Widget drop', 'scene-invalid-drop-restored', ['fine-pointer']),
  createInteractionScenario('dc-int-cancel-restore', 'Restore a cancelled Widget drag', 'scene-pointer-cancel-restored', ['coarse-pointer']),
  createInteractionScenario('dc-int-focus-back', 'Focus and return one Widget', 'scene-widget-focused', ['fine-pointer']),
  createInteractionScenario('dc-int-panel-persist', 'Restore independent Panel layouts', 'panel-layout-restored', ['keyboard']),
  createInteractionScenario('dc-int-catalog-place', 'Place a Catalog Widget with the keyboard', 'catalog-keyboard-placement', ['keyboard'], 'widget-standard'),
  createInteractionScenario('dc-int-coarse-targets', 'Expose coarse-pointer interaction targets', 'scene-coarse-pointer', ['coarse-pointer'])
]);

export const DEEP_CURRENT_WIDGET_SCENARIOS: readonly ConformanceScenario[] = Object.freeze(
  DEEP_CURRENT_WIDGET_SURFACES.map((surfaceCase) => Object.freeze({
    id: surfaceCase.scenarioId,
    title: surfaceCase.title,
    target: 'deep-current' as const,
    authority: 'widget-overhaul',
    authorityPath: widgetOverhaulPath,
    authoritySha256: widgetOverhaulSha256,
    viewport: 'standard',
    inputModes: Object.freeze(['fine-pointer', 'keyboard'] as const),
    referenceState: `${surfaceCase.type}:ready`,
    implementationState: `${surfaceCase.type}:ready`,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'deep-current-widget-surface',
    assertionProfile: 'deep-current-widget-surface',
    allowedDeviationIds: Object.freeze([])
  }))
);

export const DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS: readonly ConformanceScenario[] = Object.freeze(
  DEEP_CURRENT_CATALOG_SCENARIOS.map((catalogCase) => Object.freeze({
    id: catalogCase.scenarioId,
    title: catalogCase.title,
    target: 'deep-current' as const,
    authority: 'widget-overhaul',
    authorityPath: widgetOverhaulPath,
    authoritySha256: widgetOverhaulSha256,
    viewport: 'standard',
    inputModes: Object.freeze(['fine-pointer', 'coarse-pointer', 'keyboard'] as const),
    referenceState: catalogCase.scenarioId,
    implementationState: catalogCase.scenarioId,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'deep-current-catalog',
    assertionProfile: 'deep-current-catalog',
    allowedDeviationIds: Object.freeze([])
  }))
);

function createThemeTargetScenario(
  id: string,
  title: string,
  target: 'pom-neutral' | 'bunny',
  authority: string,
  authorityPath: string,
  authoritySha256: string,
  state: 'scene' | 'catalog',
  viewport: 'wide' | 'compact-small'
): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target,
    authority,
    authorityPath,
    authoritySha256,
    viewport,
    inputModes: Object.freeze(viewport === 'compact-small'
      ? ['coarse-pointer', 'keyboard'] as const
      : ['fine-pointer', 'keyboard'] as const),
    referenceState: state,
    implementationState: state,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'theme-target-behavior',
    assertionProfile: 'theme-target-behavior',
    allowedDeviationIds: Object.freeze([])
  });
}

export const POM_NEUTRAL_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createThemeTargetScenario('pn-scene-wide', 'PomOS wide Scene', 'pom-neutral', 'pomos-reference', pomosReferencePath, pomosReferenceSha256, 'scene', 'wide'),
  createThemeTargetScenario('pn-scene-compact', 'PomOS compact Scene', 'pom-neutral', 'pomos-reference', pomosReferencePath, pomosReferenceSha256, 'scene', 'compact-small'),
  createThemeTargetScenario('pn-catalog-wide', 'PomOS wide Catalog', 'pom-neutral', 'pomos-reference', pomosReferencePath, pomosReferenceSha256, 'catalog', 'wide')
]);

export const BUNNY_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createThemeTargetScenario('bn-scene-wide', 'Bunny wide Scene', 'bunny', 'bunny-original-reference', bunnyReferencePath, bunnyReferenceSha256, 'scene', 'wide'),
  createThemeTargetScenario('bn-scene-compact', 'Bunny compact Scene', 'bunny', 'bunny-original-reference', bunnyReferencePath, bunnyReferenceSha256, 'scene', 'compact-small'),
  createThemeTargetScenario('bn-catalog-wide', 'Bunny wide Catalog', 'bunny', 'bunny-original-reference', bunnyReferencePath, bunnyReferenceSha256, 'catalog', 'wide')
]);

function createAshAmberScenario(
  id: string,
  title: string,
  state: 'scene' | 'catalog',
  viewport: 'recording-wide' | 'compact-small' | 'standard'
): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target: 'ash-amber',
    authority: 'ash-amber-recording-frame',
    authorityPath: ashAmberReferencePath,
    authoritySha256: ashAmberReferenceSha256,
    viewport,
    inputModes: Object.freeze(viewport === 'compact-small'
      ? ['coarse-pointer', 'keyboard'] as const
      : ['fine-pointer', 'keyboard'] as const),
    referenceState: state,
    implementationState: state,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'theme-target-behavior',
    assertionProfile: 'theme-target-behavior',
    allowedDeviationIds: Object.freeze([])
  });
}

export const ASH_AMBER_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createAshAmberScenario('aa-scene-wide', 'Ash & Amber recording-frame Scene', 'scene', 'recording-wide'),
  createAshAmberScenario('aa-scene-compact', 'Ash & Amber compact Scene', 'scene', 'compact-small'),
  createAshAmberScenario('aa-catalog-wide', 'Ash & Amber wide Catalog', 'catalog', 'standard')
]);

function createThemeAuthoringScenario(id: string, title: string, state: string): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target: 'ash-amber',
    authority: 'ash-amber-recording-frame',
    authorityPath: ashAmberReferencePath,
    authoritySha256: ashAmberReferenceSha256,
    viewport: 'standard',
    inputModes: Object.freeze(['fine-pointer', 'keyboard'] as const),
    referenceState: state,
    implementationState: state,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'theme-authoring',
    assertionProfile: 'theme-authoring',
    allowedDeviationIds: Object.freeze([])
  });
}

export const THEME_AUTHORING_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createThemeAuthoringScenario('theme-authoring-ash-seed', 'Theme authoring reproduces Ash & Amber', 'ash-seed'),
  createThemeAuthoringScenario('theme-authoring-last-valid', 'Theme authoring preserves the last valid target', 'last-valid'),
  createThemeAuthoringScenario('theme-authoring-ambient-precedence', 'Ambient precedence remains exact', 'ambient-precedence'),
  createThemeAuthoringScenario('theme-authoring-round-trip', 'Theme drafts round-trip independently of layout', 'round-trip')
]);

const deepFidelityRecordingFrames = Object.freeze([
  ['deep-base-scene', 'deep-recording-base-scene', 'rw2-t52.png', '7eac0f71b594ce5860d8a93eed8a3fce129074933a981f33a6300833e81f5856'],
  ['deep-floating-connections', 'deep-recording-floating-connections', 'rw2-t59.png', 'dedb153ccc0119db01a5653b1c7d6463725c877a456c2271062f92fb7f71a8dd'],
  ['deep-right-stack', 'deep-recording-right-stack', 'rw2-t67.png', 'f365b4a925be6d0aae43c7d18c17d446edbb6e2e06956466811307f7106f5dcc'],
  ['deep-widget-shelf', 'deep-recording-widget-shelf', 'rw2-t76.png', 'c1cf2d281a2c900056c7b5bdb3507e7f4caeae77619129b75f068421bf3b0ac6'],
  ['deep-restored-theme-tab', 'deep-recording-restored-theme-tab', 'rw2-t84.png', '5f8313d53802fe9a783a684616bc685c752325e4bd039e94d6a75cc708b5f7d9'],
  ['deep-canvas-ink', 'deep-recording-canvas-ink', 'rw2-1-t2.png', '343267f966a3d1a7e0c8dace8adfc886792708e45ca2dd472a79539f6f23f11b'],
  ['deep-control-chrome', 'deep-recording-control-chrome', 'rw2-1-t14.png', '131540f086240423291473b0cd5ec0106ac0054e5a9df3e3b524123580853aa7'],
  ['deep-ambient-chrome', 'deep-recording-ambient-chrome', 'rw2-1-t26.png', 'c36e7ad1a28660c2dae68fafc84880887016cbeb1843d530ec347ad2b88b2653'],
  ['deep-interface-text', 'deep-recording-interface-text', 'rw2-1-t39.png', '1f2f08a310ff15c9f9b53b1ab9e66ed7e774270f9df66db59ce44ccd6872a735'],
  ['deep-muted-chrome', 'deep-recording-muted-chrome', 'rw2-1-t60.png', '61e80edc61d6cd78b853e86474486470abdf6c2d27c29eafb5445b6c227d9520'],
  ['ash-amber-final', 'ash-amber-recording-frame', '../ash-amber/sonderui-rw2-1-t80.png', '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997']
] as const);

function createDeepFidelityScenario(
  id: string,
  title: string,
  authority: string,
  authorityPath: string,
  authoritySha256: string,
  state: string
): ConformanceScenario {
  return Object.freeze({
    id,
    title,
    target: 'deep-current',
    authority,
    authorityPath,
    authoritySha256,
    viewport: 'recording-wide',
    inputModes: Object.freeze(['fine-pointer', 'coarse-pointer', 'keyboard'] as const),
    referenceState: state,
    implementationState: state,
    capture: Object.freeze({ kind: 'viewport' as const }),
    measurementProfile: 'deep-fidelity',
    assertionProfile: 'deep-fidelity',
    allowedDeviationIds: Object.freeze([])
  });
}

export const DEEP_FIDELITY_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  createDeepFidelityScenario(
    'dc-fidelity-atmospheric',
    'Atmospheric Workbench exact composition',
    'atmospheric-workbench',
    atmosphericPath,
    atmosphericSha256,
    'scene-ready'
  ),
  createDeepFidelityScenario(
    'dc-fidelity-widget-overhaul',
    'Widget Overhaul exact shared behaviors',
    'widget-overhaul',
    widgetOverhaulPath,
    widgetOverhaulSha256,
    'scene-ready'
  ),
  ...deepFidelityRecordingFrames.map(([state, authority, fileName, sha256]) => createDeepFidelityScenario(
    `dc-fidelity-${state}`,
    `Recording evidence: ${state}`,
    authority,
    authority === 'ash-amber-recording-frame'
      ? 'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png'
      : `design/theme-targets/deep-current/recordings/${fileName}`,
    sha256,
    state
  ))
]);

export const ORIGINAL_THEME_TARGET_SCENARIOS: readonly ConformanceScenario[] = Object.freeze([
  ...POM_NEUTRAL_SCENARIOS,
  ...BUNNY_SCENARIOS
]);

export async function hashAuthorityFile(absolutePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(absolutePath)).digest('hex');
}

export async function validateConformanceManifest(
  scenarios: readonly ConformanceScenario[],
  options: ManifestValidationOptions
): Promise<ValidatedConformanceManifest> {
  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Scenario identity is duplicated: ${scenario.id}.`,
        { scenarioId: scenario.id }
      );
    }
    scenarioIds.add(scenario.id);
  }

  for (const scenario of scenarios) {
    const authority = options.authorities.get(scenario.authority);
    const invalid = (reason: string): never => {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Scenario ${scenario.id} is invalid: ${reason}.`,
        { scenarioId: scenario.id, reason }
      );
    };

    if (!authority) {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Scenario ${scenario.id} is invalid: unknown authority ${scenario.authority}.`,
        { scenarioId: scenario.id, reason: `unknown authority ${scenario.authority}` }
      );
    }
    if (!options.driverIds.has(scenario.authority) || !options.driverIds.has('workbench-lab')) {
      invalid('required driver is not registered');
    }
    if (scenario.authorityPath !== authority.path) invalid('authority path does not match its record');
    if (path.isAbsolute(scenario.authorityPath)) invalid('authority path must be repository-relative');
    const absolutePath = path.resolve(options.repositoryRoot, scenario.authorityPath);
    const relativePath = path.relative(options.repositoryRoot, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) invalid('authority path escapes the repository');
    if (!options.viewports.has(scenario.viewport)) invalid(`unknown viewport ${scenario.viewport}`);
    if (!options.measurementProfileIds.has(scenario.measurementProfile)) {
      invalid(`unknown measurement profile ${scenario.measurementProfile}`);
    }
    if (!options.assertionProfileIds.has(scenario.assertionProfile)) {
      invalid(`unknown assertion profile ${scenario.assertionProfile}`);
    }
    for (const deviationId of scenario.allowedDeviationIds) {
      if (!options.deviationIds.has(deviationId)) invalid(`unknown deviation ${deviationId}`);
    }
    for (const inputMode of scenario.inputModes) {
      if (!['fine-pointer', 'coarse-pointer', 'keyboard'].includes(inputMode)) {
        invalid(`unknown input mode ${inputMode}`);
      }
    }
    const actualSha256 = (await options.hashFile(absolutePath)).toLowerCase();
    const expectedSha256 = (scenario.authoritySha256 ?? authority?.sha256 ?? '').toLowerCase();

    if (actualSha256 !== expectedSha256) {
      throw new ConformanceError(
        'REFERENCE_HASH_DRIFT',
        `Authority hash drifted for scenario ${scenario.id}.`,
        { scenarioId: scenario.id, expectedSha256, actualSha256 }
      );
    }
  }

  return Object.freeze({ scenarios: Object.freeze([...scenarios]) });
}
