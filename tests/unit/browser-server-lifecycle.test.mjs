import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { startBrowserServer } from '../browser/global-setup.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('browser server exposes and closes the configured Lab listener', async () => {
  let running;
  try {
    running = await startBrowserServer({
      root,
      port: 0,
      labRoot: path.join(root, 'apps/workbench-lab')
    });

    assert.equal(running.labOrigin, running.labUrl);
    assert.match(running.labUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
    const response = await fetch(running.labUrl);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /PomegranateUI Workbench Lab/);
  } finally {
    await running?.close();
  }

  await running.close();
  await assert.rejects(fetch(running.labUrl));
});

test('browser server rejects an occupied port instead of drifting', async () => {
  const occupied = createServer();
  try {
    await new Promise((resolve, reject) => {
      occupied.once('error', reject);
      occupied.listen(0, '127.0.0.1', resolve);
    });
    const address = occupied.address();
    assert.ok(address && typeof address !== 'string');
    await assert.rejects(
      startBrowserServer({
        root,
        port: address.port,
        labRoot: path.join(root, 'apps/workbench-lab')
      }),
      (error) => error?.code === 'EADDRINUSE'
    );
  } finally {
    if (occupied.listening) {
      await new Promise((resolve, reject) => occupied.close((error) => error ? reject(error) : resolve()));
    }
  }
});
