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
  }),
  ...[
    ['deep-recording-base-scene', 'rw2-t52.png', '7eac0f71b594ce5860d8a93eed8a3fce129074933a981f33a6300833e81f5856'],
    ['deep-recording-floating-connections', 'rw2-t59.png', 'dedb153ccc0119db01a5653b1c7d6463725c877a456c2271062f92fb7f71a8dd'],
    ['deep-recording-right-stack', 'rw2-t67.png', 'f365b4a925be6d0aae43c7d18c17d446edbb6e2e06956466811307f7106f5dcc'],
    ['deep-recording-widget-shelf', 'rw2-t76.png', 'c1cf2d281a2c900056c7b5bdb3507e7f4caeae77619129b75f068421bf3b0ac6'],
    ['deep-recording-restored-theme-tab', 'rw2-t84.png', '5f8313d53802fe9a783a684616bc685c752325e4bd039e94d6a75cc708b5f7d9'],
    ['deep-recording-canvas-ink', 'rw2-1-t2.png', '343267f966a3d1a7e0c8dace8adfc886792708e45ca2dd472a79539f6f23f11b'],
    ['deep-recording-control-chrome', 'rw2-1-t14.png', '131540f086240423291473b0cd5ec0106ac0054e5a9df3e3b524123580853aa7'],
    ['deep-recording-ambient-chrome', 'rw2-1-t26.png', 'c36e7ad1a28660c2dae68fafc84880887016cbeb1843d530ec347ad2b88b2653'],
    ['deep-recording-interface-text', 'rw2-1-t39.png', '1f2f08a310ff15c9f9b53b1ab9e66ed7e774270f9df66db59ce44ccd6872a735'],
    ['deep-recording-muted-chrome', 'rw2-1-t60.png', '61e80edc61d6cd78b853e86474486470abdf6c2d27c29eafb5445b6c227d9520']
  ].map(([id, fileName, sha256]) => Object.freeze({
    id: id ?? '',
    path: `design/theme-targets/deep-current/recordings/${fileName}`,
    sha256: sha256 ?? ''
  }))
]);

export const AUTHORITY_BY_ID: ReadonlyMap<string, AuthorityRecord> = new Map(
  AUTHORITY_RECORDS.map((record) => [record.id, record])
);
