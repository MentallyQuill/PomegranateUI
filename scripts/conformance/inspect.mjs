import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  ASH_AMBER_SCENARIOS,
  DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS,
  DEEP_CURRENT_INTERACTION_SCENARIOS,
  DEEP_CURRENT_MACRO_SCENARIOS,
  DEEP_CURRENT_WIDGET_SCENARIOS,
  ORIGINAL_THEME_TARGET_SCENARIOS,
  THEME_AUTHORING_SCENARIOS
} from '../../tests/conformance/manifest.ts';

const DEEP_CURRENT_SCENARIOS = Object.freeze([
  ...DEEP_CURRENT_MACRO_SCENARIOS,
  ...DEEP_CURRENT_INTERACTION_SCENARIOS,
  ...DEEP_CURRENT_WIDGET_SCENARIOS,
  ...DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS,
  ...ORIGINAL_THEME_TARGET_SCENARIOS,
  ...ASH_AMBER_SCENARIOS,
  ...THEME_AUTHORING_SCENARIOS
]);

export function parseInspectionArguments(argv, scenarios = DEEP_CURRENT_SCENARIOS) {
  if (argv.length === 0) throw new Error('--scenario <id> is required.');
  if (argv[0] !== '--scenario' || !argv[1]) throw new Error('--scenario <id> is required.');
  if (argv.length !== 2) throw new Error(`Unexpected inspection argument: ${argv[2] ?? argv.at(-1)}`);
  const scenario = scenarios.find(({ id }) => id === argv[1]);
  if (!scenario) throw new Error(`Unknown conformance scenario: ${argv[1]}`);
  return scenario;
}

export function runInspection(argv = process.argv.slice(2)) {
  const scenario = parseInspectionArguments(argv);
  console.log(`Inspecting ${scenario.id}; evidence will remain under test-results/conformance/.`);
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) throw new Error('npm_execpath is required; run inspection through npm run inspect:conformance.');
  const result = spawnSync(process.execPath, [
    npmExecPath,
    'run',
    'test:conformance:deep-current',
    '--',
    '--grep',
    scenario.id
  ], {
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;
if (invokedPath) {
  try {
    process.exitCode = runInspection();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
