import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VALID_CLASSIFICATIONS = new Set([
  'toolkit-generic',
  'reference-theme',
  'sonder-integration',
  'historical-evidence',
  'asset-or-license'
]);

export function normalizeRepoPath(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected a non-empty repository-relative path.');
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '');
  if (/^[A-Za-z]:\//.test(normalized) || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`Expected a repository-relative path, received: ${value}`);
  }
  const segments = normalized.split('/').filter((segment) => segment && segment !== '.');
  if (!segments.length) throw new Error(`Expected a repository-relative path, received: ${value}`);
  return segments.join('/') + (normalized.endsWith('/') ? '/' : '');
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function runGit(sourceRoot, args, { binary = false, allowFailure = false } = {}) {
  const result = spawnSync('git', ['-C', sourceRoot, ...args], {
    encoding: binary ? null : 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    const detail = binary ? result.stderr?.toString('utf8') : result.stderr;
    throw new Error(`Git ${args[0]} failed: ${String(detail || '').trim()}`);
  }
  return result;
}

export function listCommitFiles({ sourceRoot, sourceCommit, sourcePath }) {
  const normalized = normalizeRepoPath(sourcePath).replace(/\/$/, '');
  const result = runGit(sourceRoot, ['ls-tree', '-r', '--name-only', sourceCommit, '--', normalized]);
  return result.stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean).sort();
}

export function readCommitFile({ sourceRoot, sourceCommit, sourcePath }) {
  const normalized = normalizeRepoPath(sourcePath).replace(/\/$/, '');
  const result = runGit(sourceRoot, ['show', `${sourceCommit}:${normalized}`], { binary: true });
  return Buffer.from(result.stdout);
}

function assertClassification(classification) {
  if (!VALID_CLASSIFICATIONS.has(classification)) throw new Error(`Unknown extraction classification: ${classification}`);
}

export function resolveScope({ sourceRoot, sourceCommit, scope }) {
  if (!scope || scope.schemaVersion !== 1 || !Array.isArray(scope.mappings)) throw new Error('Extraction scope schemaVersion 1 with mappings is required.');
  const resolved = [];
  const destinations = new Set();

  for (const mapping of scope.mappings) {
    assertClassification(mapping.classification);
    const sourcePath = normalizeRepoPath(mapping.sourcePath);
    const destinationPath = normalizeRepoPath(mapping.destinationPath);
    const directoryMapping = sourcePath.endsWith('/');
    const sourceFiles = directoryMapping
      ? listCommitFiles({ sourceRoot, sourceCommit, sourcePath })
      : listCommitFiles({ sourceRoot, sourceCommit, sourcePath }).filter((candidate) => candidate === sourcePath);
    if (!sourceFiles.length) throw new Error(`Missing source at commit ${sourceCommit}: ${sourcePath}`);

    for (const sourceFile of sourceFiles) {
      const relative = directoryMapping ? sourceFile.slice(sourcePath.length) : '';
      const destinationFile = directoryMapping
        ? normalizeRepoPath(`${destinationPath}${relative}`)
        : destinationPath;
      if (destinations.has(destinationFile)) throw new Error(`Duplicate destination path: ${destinationFile}`);
      destinations.add(destinationFile);
      resolved.push({
        sourcePath: sourceFile,
        destinationPath: destinationFile,
        classification: mapping.classification,
        licenseEvidence: Array.isArray(mapping.licenseEvidence) ? [...mapping.licenseEvidence] : []
      });
    }
  }
  return resolved;
}

export function findReferencedIconBasenames(importedFiles, pattern = /\b\d+-[A-Za-z0-9._-]+\.svg\b/g) {
  const names = new Set();
  for (const file of importedFiles) {
    if (!/\.(?:html|md|json|js|css)$/i.test(file.destinationPath)) continue;
    const text = file.bytes.toString('utf8');
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`))) names.add(match[0]);
  }
  return [...names].sort();
}

function iconManifestEntries(value) {
  for (const key of ['icons', 'entries', 'files', 'items']) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  if (Array.isArray(value)) return value;
  return [];
}

function sourceIdentity(sourceRoot, sourceCommit, sourceBranch) {
  const repository = runGit(sourceRoot, ['config', '--get', 'remote.origin.url'], { allowFailure: true }).stdout.trim();
  return {
    sourceRepository: repository || '(no remote configured)',
    sourceBranch,
    sourceCommit
  };
}

function inferredLicenseEvidence(item) {
  if (item.licenseEvidence.length) return item.licenseEvidence;
  if (item.destinationPath === 'provenance/SONDER_LICENSE.txt') return [item.destinationPath];
  if (/Geist/i.test(item.destinationPath)) return ['prototypes/sonder-baseline/widget-overhaul/LICENSE-Geist.txt'];
  if (/Newsreader/i.test(item.destinationPath)) return ['prototypes/sonder-baseline/widget-overhaul/LICENSE-Newsreader.txt'];
  return [];
}

export async function importBaseline({ sourceRoot, sourceCommit, destinationRoot, scope, write = true }) {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) throw new Error('A full 40-character source commit is required.');
  const resolved = resolveScope({ sourceRoot, sourceCommit, scope });
  const imported = resolved.map((item) => ({
    ...item,
    bytes: readCommitFile({ sourceRoot, sourceCommit, sourcePath: item.sourcePath })
  }));
  const destinationSet = new Set(imported.map((item) => item.destinationPath));

  for (const rule of scope.referencedAssetRules || []) {
    assertClassification(rule.classification);
    const manifestBytes = readCommitFile({ sourceRoot, sourceCommit, sourcePath: rule.sourceManifest });
    const manifest = JSON.parse(manifestBytes.toString('utf8'));
    const entries = iconManifestEntries(manifest);
    const byFilename = new Map(entries.map((entry) => [entry.filename, entry]));
    const pattern = new RegExp(rule.filenamePattern, 'g');
    for (const filename of findReferencedIconBasenames(imported, pattern)) {
      const record = byFilename.get(filename);
      if (!record) throw new Error(`Referenced icon ${filename} is absent from its source manifest.`);
      const sourcePath = normalizeRepoPath(`${rule.sourceDirectory}${filename}`);
      const destinationPath = normalizeRepoPath(`${rule.destinationDirectory}${filename}`);
      if (destinationSet.has(destinationPath)) continue;
      const bytes = readCommitFile({ sourceRoot, sourceCommit, sourcePath });
      const expectedHash = String(record.sha256 || record.sha256Hex || record.hash || '').toLowerCase();
      if (expectedHash && expectedHash !== sha256(bytes)) throw new Error(`Referenced icon ${filename} does not match its source manifest hash.`);
      destinationSet.add(destinationPath);
      imported.push({
        sourcePath,
        destinationPath,
        classification: rule.classification,
        licenseEvidence: [...rule.licenseEvidence],
        bytes
      });
    }
  }

  imported.sort((left, right) => left.destinationPath.localeCompare(right.destinationPath));
  const artifacts = imported.map((item) => {
    const digest = sha256(item.bytes);
    return {
      sourcePath: item.sourcePath,
      destinationPath: item.destinationPath,
      sourceCommit,
      sourceSha256: digest,
      destinationSha256: digest,
      classification: item.classification,
      licenseEvidence: inferredLicenseEvidence(item),
      status: 'preserved-verbatim'
    };
  });

  if (write) {
    for (const item of imported) {
      const absolute = path.resolve(destinationRoot, ...item.destinationPath.split('/'));
      const relative = path.relative(destinationRoot, absolute);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Destination escaped repository root: ${item.destinationPath}`);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, item.bytes);
    }
  }

  return {
    schemaVersion: 1,
    baseline: sourceIdentity(sourceRoot, sourceCommit, scope.sourceBranch),
    artifacts,
    contracts: []
  };
}

export async function verifyDestinationArtifacts(destinationRoot, manifest) {
  const failures = [];
  for (const artifact of manifest.artifacts) {
    try {
      const bytes = await readFile(path.resolve(destinationRoot, ...artifact.destinationPath.split('/')));
      if (sha256(bytes) !== artifact.destinationSha256) failures.push(`${artifact.destinationPath}: destination hash mismatch`);
    } catch (error) {
      failures.push(`${artifact.destinationPath}: ${error.code === 'ENOENT' ? 'missing destination' : error.message}`);
    }
  }
  return failures;
}
