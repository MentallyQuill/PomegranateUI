import assert from 'node:assert/strict';
import { createServer } from 'node:net';
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

test('browser server exposes and closes the production Lab listener', async () => {
  const running = await startBrowserServers({
    root,
    preservationPort: 0,
    labPort: 0,
    includeLab: true
  });
  assert.match(running.labUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
  const response = await fetch(running.labUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /PomegranateUI Workbench Lab/);
  await running.close();
  await running.close();
  await assert.rejects(fetch(running.labUrl));
});

test('browser server rejects an occupied port instead of drifting', async () => {
  const occupied = createServer();
  await new Promise((resolve, reject) => {
    occupied.once('error', reject);
    occupied.listen(0, '127.0.0.1', resolve);
  });
  const address = occupied.address();
  assert.ok(address && typeof address !== 'string');
  await assert.rejects(
    startBrowserServers({ root, preservationPort: address.port, includeLab: false }),
    (error) => error?.code === 'EADDRINUSE'
  );
  await new Promise((resolve, reject) => occupied.close((error) => error ? reject(error) : resolve()));
});
