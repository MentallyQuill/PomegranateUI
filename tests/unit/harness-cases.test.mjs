import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeRuntimeHarness } from '../../scripts/capture-preserved-harness-cases.mjs';

test('normalizes exact passing runtime rows into accountable cases', () => {
  assert.deepEqual(normalizeRuntimeHarness({
    name: 'Oracle',
    sourcePath: 'source/oracle.html',
    destinationPath: 'prototype/oracle.html',
    heading: '2/2 passed',
    title: 'PASS — Oracle',
    rows: ['PASS — First behavior', 'PASS — Second behavior']
  }), {
    name: 'Oracle',
    sourcePath: 'source/oracle.html',
    destinationPath: 'prototype/oracle.html',
    reportedResult: '2/2 passed',
    cases: ['First behavior', 'Second behavior']
  });
});

test('rejects failed, duplicate, or count-mismatched runtime evidence', () => {
  const base = { name: 'Oracle', sourcePath: 'source/oracle.html', destinationPath: 'prototype/oracle.html', heading: '1/1 passed', title: 'PASS — Oracle', rows: ['PASS — First behavior'] };
  assert.throws(() => normalizeRuntimeHarness({ ...base, title: 'FAIL — Oracle' }), /did not pass/i);
  assert.throws(() => normalizeRuntimeHarness({ ...base, heading: '2/2 passed' }), /count/i);
  assert.throws(() => normalizeRuntimeHarness({ ...base, heading: '2/2 passed', rows: ['PASS — Same', 'PASS — Same'] }), /duplicate/i);
  assert.throws(() => normalizeRuntimeHarness({ ...base, rows: ['FAIL — First behavior'] }), /failed row/i);
});
