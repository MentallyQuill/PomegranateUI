import type { AuthorityRecord } from './types.ts';

export const AUTHORITY_RECORDS: readonly AuthorityRecord[] = Object.freeze([
  Object.freeze({
    id: 'atmospheric-workbench',
    path: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html',
    sha256: '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913'
  }),
  Object.freeze({
    id: 'atmospheric-workbench-preview',
    path: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration-preview.html',
    sha256: '14c735c159724e03b66e84cf166b7937f99f0654d9ea9d7d36374d0a9a15e557'
  }),
  Object.freeze({
    id: 'atmospheric-workbench-regression',
    path: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html',
    sha256: '737bb396b5d522e5449c9ec66f4689d525f0b4109d4e40693be50cb6c447f0c0',
    expectedHarnessTotal: 95
  }),
  Object.freeze({
    id: 'widget-overhaul',
    path: 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html',
    sha256: '043167ad75c07fa5ff8661fbe8a86943a9c0b38eeea9811739309cb866e8a2a5'
  }),
  Object.freeze({
    id: 'widget-overhaul-regression',
    path: 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html',
    sha256: '79aa122abae1d51dff5d1cf292590efe03a53641b2ff44008e6a165beb3db8b3',
    expectedHarnessTotal: 212
  }),
  Object.freeze({
    id: 'pom-neutral-original-reference',
    path: 'design/theme-targets/pom-neutral-reference.html',
    sha256: '6a188907925f0af7157f66017a2015e07dbe599d14413d2a590e390f0d97bd50'
  }),
  Object.freeze({
    id: 'pomos-reference',
    path: 'design/theme-targets/pomos-reference.html',
    sha256: 'a46dc956b0664643506b5023836cd02fb2e9f64ca538acff1aca7cc7c34a7af9'
  }),
  Object.freeze({
    id: 'bunny-original-reference',
    path: 'design/theme-targets/bunny-reference.html',
    sha256: 'b718de3bbd9788ff7dd6efb19f11fd12fee12575fc6018f0e2537061625f7a59'
  }),
  Object.freeze({
    id: 'ash-amber-recording-frame',
    path: 'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png',
    sha256: '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997'
  })
]);

export const AUTHORITY_BY_ID: ReadonlyMap<string, AuthorityRecord> = new Map(
  AUTHORITY_RECORDS.map((record) => [record.id, record])
);
