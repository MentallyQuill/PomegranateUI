import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.woff', 'font/woff'], ['.woff2', 'font/woff2'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg']
]);

export function createStaticServer({ root, host = '127.0.0.1', port = 4173 }) {
  const absoluteRoot = path.resolve(root);
  return http.createServer(async (request, response) => {
    let decoded;
    try {
      decoded = decodeURIComponent(String(request.url || '/').split(/[?#]/, 1)[0]);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }
    const normalized = decoded.replaceAll('\\', '/');
    if (normalized.split('/').includes('..')) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const relative = normalized.replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(absoluteRoot, ...relative.split('/'));
    const relation = path.relative(absoluteRoot, target);
    if (relation.startsWith('..') || path.isAbsolute(relation)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const metadata = await stat(target);
      if (!metadata.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
      response.writeHead(200, {
        'content-type': TYPES.get(path.extname(target).toLowerCase()) || 'application/octet-stream',
        'content-length': metadata.size,
        'x-content-type-options': 'nosniff'
      });
      createReadStream(target).pipe(response);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
    }
  });
}

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(option('--root', '.'));
  const port = Number(option('--port', '4173'));
  const host = '127.0.0.1';
  const server = createStaticServer({ root, host, port });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.listen(port, host, () => process.stdout.write(`Serving ${root} at http://${host}:${port}\n`));
}
