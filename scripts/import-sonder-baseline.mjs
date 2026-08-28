import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { importBaseline, verifyDestinationArtifacts } from './lib/extraction.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArguments(values) {
  const parsed = { write: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--write') parsed.write = true;
    else if (value === '--source-root') parsed.sourceRoot = values[++index];
    else if (value === '--source-commit') parsed.sourceCommit = values[++index];
    else if (value === '--scope') parsed.scopePath = values[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!parsed.sourceRoot || !parsed.sourceCommit || !parsed.scopePath) {
    throw new Error('Usage: node scripts/import-sonder-baseline.mjs --source-root PATH --source-commit SHA --scope PATH [--write]');
  }
  return parsed;
}

const options = parseArguments(process.argv.slice(2));
const scopeAbsolute = path.resolve(repositoryRoot, options.scopePath);
const scope = JSON.parse(await readFile(scopeAbsolute, 'utf8'));
const manifest = await importBaseline({
  sourceRoot: path.resolve(options.sourceRoot),
  sourceCommit: options.sourceCommit,
  destinationRoot: repositoryRoot,
  scope,
  write: options.write
});
const manifestPath = path.join(repositoryRoot, 'provenance', 'extraction-manifest.json');

if (options.write) {
  try {
    const existing = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.contracts = existing.contracts || [];
    if (existing.testDispositions) manifest.testDispositions = existing.testDispositions;
    if (existing.unaccounted) manifest.unaccounted = existing.unaccounted;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
} else {
  const committed = JSON.parse(await readFile(manifestPath, 'utf8'));
  const failures = await verifyDestinationArtifacts(repositoryRoot, committed);
  if (JSON.stringify(committed.baseline) !== JSON.stringify(manifest.baseline)) failures.push('baseline identity differs from the requested source');
  if (JSON.stringify(committed.scopeInventory) !== JSON.stringify(manifest.scopeInventory)) failures.push('scope inventory is stale');
  if (JSON.stringify(committed.artifacts) !== JSON.stringify(manifest.artifacts)) failures.push('artifact manifest is stale');
  if (failures.length) throw new Error(`Extraction drift:\n- ${failures.join('\n- ')}`);
}

const byClassification = Object.groupBy(manifest.artifacts, (artifact) => artifact.classification);
const counts = Object.fromEntries(Object.entries(byClassification).map(([key, values]) => [key, values.length]));
const selectedIcons = manifest.artifacts.filter((artifact) => artifact.destinationPath.startsWith('prototypes/sonder-baseline/assets/minimal-ui-icons/')).length;
console.log(JSON.stringify({ sourceCommit: manifest.baseline.sourceCommit, artifacts: manifest.artifacts.length, selectedIcons, byClassification: counts }));
