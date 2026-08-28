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
  })
]);

export const AUTHORITY_BY_ID: ReadonlyMap<string, AuthorityRecord> = new Map(
  AUTHORITY_RECORDS.map((record) => [record.id, record])
);
