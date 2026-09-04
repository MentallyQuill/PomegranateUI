import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStaticServer } from '../../scripts/serve-static.mjs';

const host = '127.0.0.1';
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function resolveBrowserServerPort(value = process.env.POM_PLAYWRIGHT_PORT) {
  if (value === undefined || value === '') return 4174;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`POM_PLAYWRIGHT_PORT must be a valid TCP port; received ${JSON.stringify(value)}.`);
  }
  return port;
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

function boundPort(server) {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Static server did not bind a TCP port.');
  }
  return address.port;
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function startBrowserServer({
  root,
  port = 4174,
  labRoot = path.join(root, 'apps/workbench-lab/dist')
}) {
  let labServer;

  try {
    labServer = createStaticServer({ root: labRoot, host, port });
    await listen(labServer, port);
    const labOrigin = `http://${host}:${boundPort(labServer)}`;
    let closePromise;

    return Object.freeze({
      labOrigin,
      labUrl: labOrigin,
      close() {
        closePromise ??= closeServer(labServer);
        return closePromise;
      }
    });
  } catch (error) {
    if (labServer) await closeServer(labServer);
    throw error;
  }
}

export default async function globalSetup() {
  const running = await startBrowserServer({ root: repositoryRoot, port: resolveBrowserServerPort() });
  return () => running.close();
}
