import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { startBrowserServers } from '../browser/global-setup.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('browser server teardown closes every listener', async () => {
  const running = await startBrowserServers({
    root,
    preservationPort: 0,
    includeLab: false
  });

  const response = await fetch(running.preservationUrl);
  assert.equal(response.status, 200);
  await response.text();

  await running.close();
  await running.close();

  await assert.rejects(fetch(running.preservationUrl));
});
