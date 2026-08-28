import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  ConformanceError,
  type ConformanceScenario,
  type ManifestValidationOptions,
  type ValidatedConformanceManifest
} from './types.ts';

const atmosphericPath = 'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html';
const atmosphericSha256 = '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913';
const widgetOverhaulPath = 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html';
const widgetOverhaulSha256 = '043167ad75c07fa5ff8661fbe8a86943a9c0b38eeea9811739309cb866e8a2a5';

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
    measurementProfile: 'deep-current-shell',
    assertionProfile: 'deep-current-shell',
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
  createInteractionScenario('dc-int-resize-left', 'Resize the left toolbar', 'scene-left-toolbar-resized', ['fine-pointer', 'keyboard']),
  createInteractionScenario('dc-int-resize-right', 'Resize the right toolbar', 'scene-right-toolbar-resized', ['fine-pointer', 'keyboard']),
  createInteractionScenario('dc-int-shelf-insert', 'Insert a Widget shelf', 'scene-toolbar-new-shelf', ['fine-pointer', 'keyboard', 'coarse-pointer']),
  createInteractionScenario('dc-int-tab-merge', 'Merge Widgets as tabs', 'scene-group-tab-merge', ['fine-pointer', 'keyboard', 'coarse-pointer']),
  createInteractionScenario('dc-int-tab-reorder', 'Reorder grouped Widget tabs', 'scene-group-tab-reordered', ['fine-pointer', 'keyboard']),
  createInteractionScenario('dc-int-float', 'Float and move a Widget', 'scene-widget-floating', ['fine-pointer', 'keyboard', 'coarse-pointer']),
  createInteractionScenario('dc-int-invalid-restore', 'Restore an invalid Widget drop', 'scene-invalid-drop-restored', ['fine-pointer', 'coarse-pointer']),
  createInteractionScenario('dc-int-cancel-restore', 'Restore a cancelled Widget drag', 'scene-pointer-cancel-restored', ['fine-pointer', 'coarse-pointer']),
  createInteractionScenario('dc-int-focus-back', 'Focus and return one Widget', 'scene-widget-focused', ['fine-pointer', 'keyboard']),
  createInteractionScenario('dc-int-panel-persist', 'Restore independent Panel layouts', 'panel-layout-restored', ['keyboard']),
  createInteractionScenario('dc-int-catalog-place', 'Place a Catalog Widget with the keyboard', 'catalog-keyboard-placement', ['keyboard'], 'widget-standard'),
  createInteractionScenario('dc-int-coarse-targets', 'Expose coarse-pointer interaction targets', 'scene-coarse-pointer', ['coarse-pointer'])
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
