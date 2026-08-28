import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

import { createStaticServer } from './serve-static.mjs';

export const PRESERVED_HARNESSES = [
  {
    name: 'Atmospheric Workbench',
    url: '/prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html',
    sourcePath: 'docs/experiments/sonder-atmospheric-workbench/sonder-drag-regression.html',
    destinationPath: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html'
  },
  {
    name: 'Widget overhaul',
    url: '/prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html',
    sourcePath: 'docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html',
    destinationPath: 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html'
  }
];

export function normalizeRuntimeHarness({ name, sourcePath, destinationPath, heading, title, rows }) {
  if (!title.startsWith('PASS —')) throw new Error(`${name} did not pass: ${title}`);
  const match = heading.match(/^(\d+)\/(\d+) passed$/);
  if (!match || match[1] !== match[2]) throw new Error(`${name} has an invalid passing count: ${heading}`);
  const cases = rows.map((row) => {
    if (!row.startsWith('PASS — ')) throw new Error(`${name} contains a failed row: ${row}`);
    return row.slice('PASS — '.length).split('\n', 1)[0].trim();
  });
  if (cases.length !== Number(match[2])) throw new Error(`${name} row count ${cases.length} does not match ${heading}`);
  if (new Set(cases).size !== cases.length) throw new Error(`${name} contains a duplicate runtime case title`);
  return { name, sourcePath, destinationPath, reportedResult: heading, cases };
}

export async function capturePreservedHarnessCases({ root }) {
  const server = createStaticServer({ root, host: '127.0.0.1', port: 0 });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const harnesses = [];
    for (const definition of PRESERVED_HARNESSES) {
      const page = await browser.newPage();
      await page.goto(`${origin}${definition.url}`);
      await page.waitForFunction(() => /^(?:PASS|FAIL) —/.test(document.title), null, { timeout: 120_000 });
      harnesses.push(normalizeRuntimeHarness({
        ...definition,
        title: await page.title(),
        heading: (await page.locator('#results h1').innerText()).trim(),
        rows: await page.locator('#results > p').allInnerTexts()
      }));
      await page.close();
    }
    return { browserEngine: 'chromium', browserVersion: browser.version(), harnesses };
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outputPath = path.join(root, 'provenance', 'preserved-harness-cases.json');
  const [manifest, packageJson] = await Promise.all([
    readFile(path.join(root, 'provenance', 'extraction-manifest.json'), 'utf8').then(JSON.parse),
    readFile(path.join(root, 'package.json'), 'utf8').then(JSON.parse)
  ]);
  const captured = await capturePreservedHarnessCases({ root });
  const snapshot = {
    schemaVersion: 1,
    sourceCommit: manifest.baseline.sourceCommit,
    playwrightVersion: packageJson.devDependencies['@playwright/test'],
    ...captured
  };
  const encoded = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (process.argv.includes('--write')) await writeFile(outputPath, encoded);
  else if (process.argv.includes('--check')) {
    if (await readFile(outputPath, 'utf8') !== encoded) throw new Error('Preserved harness runtime snapshot is stale.');
  } else throw new Error('Use --write or --check.');
  console.log(JSON.stringify({ sourceCommit: snapshot.sourceCommit, browserVersion: snapshot.browserVersion, harnesses: snapshot.harnesses.map((item) => ({ name: item.name, result: item.reportedResult })) }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}
