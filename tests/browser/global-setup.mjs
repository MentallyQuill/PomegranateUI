import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStaticServer } from '../../scripts/serve-static.mjs';

const host = '127.0.0.1';
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

export async function startBrowserServers({
  root,
  preservationPort = 4173,
  labPort = 4174,
  includeLab = false,
  labRoot = path.join(root, 'apps/workbench-lab/dist')
}) {
  const servers = [];

  try {
    const preservationServer = createStaticServer({ root, host, port: preservationPort });
    await listen(preservationServer, preservationPort);
    servers.push(preservationServer);

    let labServer;
    if (includeLab) {
      labServer = createStaticServer({ root: labRoot, host, port: labPort });
      await listen(labServer, labPort);
      servers.push(labServer);
    }

    const preservationOrigin = `http://${host}:${boundPort(preservationServer)}`;
    const labOrigin = labServer ? `http://${host}:${boundPort(labServer)}` : undefined;
    let closePromise;

    return Object.freeze({
      preservationUrl: `${preservationOrigin}/prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html`,
      preservationOrigin,
      labUrl: labOrigin,
      close() {
        closePromise ??= Promise.all(servers.toReversed().map(closeServer)).then(() => undefined);
        return closePromise;
      }
    });
  } catch (error) {
    await Promise.allSettled(servers.toReversed().map(closeServer));
    throw error;
  }
}

export default async function globalSetup() {
  const running = await startBrowserServers({ root: repositoryRoot });
  return () => running.close();
}
