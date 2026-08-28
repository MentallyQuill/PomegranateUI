import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractHarnessCases, extractLedgerRows, normalizeEvidence } from './generate-contract-index.mjs';
import { sha256 } from './lib/extraction.mjs';

const VALID_STATUSES = new Set(['preserved-verbatim', 'native-test-added', 'dual-green', 'sonder-owned', 'retired-approved']);

async function fileBytes(root, relative) {
  try { return await readFile(path.join(root, ...relative.split('/'))); }
  catch (error) { return error.code === 'ENOENT' ? null : Promise.reject(error); }
}

function artifactWithinScope(artifact, scope) {
  return (scope.mappings || []).some((mapping) => mapping.sourcePath.endsWith('/')
    ? artifact.sourcePath.startsWith(mapping.sourcePath)
    : artifact.sourcePath === mapping.sourcePath)
    || (scope.referencedAssetRules || []).some((rule) => artifact.sourcePath.startsWith(rule.sourceDirectory));
}

export async function verifyNativeContractEvidence({ root, contracts, artifacts }) {
  const findings = [];
  const artifactsBySource = new Map((artifacts || []).map((artifact) => [artifact.sourcePath, artifact]));
  for (const contract of contracts || []) {
    if (contract.status !== 'native-test-added' && contract.status !== 'dual-green') continue;
    const preservedArtifact = artifactsBySource.get(contract.sourcePath);
    if (
      !preservedArtifact
      || preservedArtifact.status !== 'preserved-verbatim'
      || !contract.destinationEvidence?.includes(preservedArtifact.destinationPath)
    ) {
      findings.push(`${contract.contractId}: preserved evidence is missing from native promotion`);
    }
    const nativePaths = (contract.destinationEvidence || []).filter((evidence) => (
      evidence !== preservedArtifact?.destinationPath
      && !String(evidence).startsWith('POM-')
      && !String(evidence).startsWith('prototypes/')
    ));
    if (nativePaths.length === 0) {
      findings.push(`${contract.contractId}: native evidence outside prototypes is required`);
      continue;
    }
    for (const nativePath of nativePaths) {
      const bytes = await fileBytes(root, nativePath);
      if (!bytes) {
        findings.push(`${contract.contractId}: missing native evidence ${nativePath}`);
      } else if (!bytes.toString('utf8').includes(contract.contractId)) {
        findings.push(`${contract.contractId}: native evidence ${nativePath} does not cite its contract id`);
      }
    }
  }
  return findings.sort();
}

export async function verifyExtraction({ root, manifest, contractIndex, scope, testDispositions, runtimeHarnessCases }) {
  const findings = [];
  const artifactsByDestination = new Map(manifest.artifacts.map((item) => [item.destinationPath, item]));
  const artifactsBySource = new Map(manifest.artifacts.map((item) => [item.sourcePath, item]));
  const scopeInventory = manifest.scopeInventory || manifest.artifacts.map((item) => item.sourcePath);
  for (const sourcePath of scopeInventory) if (!artifactsBySource.has(sourcePath)) findings.push(`${sourcePath}: scope source is absent from artifact manifest`);
  for (const artifact of manifest.artifacts) {
    if (!scopeInventory.includes(artifact.sourcePath) || !artifactWithinScope(artifact, scope)) findings.push(`${artifact.sourcePath}: artifact is outside reviewed scope`);
    if (artifact.sourceSha256 !== artifact.destinationSha256) findings.push(`${artifact.destinationPath}: recorded source/destination hash mismatch`);
    const bytes = await fileBytes(root, artifact.destinationPath);
    if (!bytes) findings.push(`${artifact.destinationPath}: missing artifact`);
    else if (sha256(bytes) !== artifact.destinationSha256) findings.push(`${artifact.destinationPath}: destination hash mismatch`);
    if (!VALID_STATUSES.has(artifact.status)) findings.push(`${artifact.destinationPath}: invalid status ${artifact.status}`);
    if (artifact.status === 'retired-approved') findings.push(`${artifact.destinationPath}: retired-approved is forbidden during extraction`);
  }

  const knownContracts = new Set();
  for (const contract of contractIndex.contracts || []) {
    if (knownContracts.has(contract.contractId)) findings.push(`${contract.contractId}: duplicate contract ID`);
    knownContracts.add(contract.contractId);
    if (!VALID_STATUSES.has(contract.status)) findings.push(`${contract.contractId}: invalid status ${contract.status}`);
    if (contract.status === 'retired-approved') findings.push(`${contract.contractId}: retired-approved is forbidden during extraction`);
    if (!contract.destinationOwner?.trim()) findings.push(`${contract.contractId}: missing destination owner`);
    if (!contract.destinationEvidence?.length) findings.push(`${contract.contractId}: no destination evidence`);
  }
  for (const contract of contractIndex.contracts || []) {
    for (const evidence of contract.destinationEvidence || []) {
      if (String(evidence).startsWith('POM-') && !knownContracts.has(evidence)) findings.push(`${contract.contractId}: unknown contract citation ${evidence}`);
    }
  }
  findings.push(...await verifyNativeContractEvidence({
    root,
    contracts: contractIndex.contracts || [],
    artifacts: manifest.artifacts || []
  }));

  for (const artifact of manifest.artifacts) {
    const kinds = new Set((contractIndex.contracts || []).filter((contract) => contract.sourcePath === artifact.sourcePath).map((contract) => contract.evidenceKind));
    const bytes = await fileBytes(root, artifact.destinationPath);
    if (!bytes) continue;
    const text = bytes.toString('utf8');
    const runtimeHarness = runtimeHarnessCases?.harnesses?.find((harness) => harness.sourcePath === artifact.sourcePath);
    const harnessLike = kinds.has('harness') || kinds.has('harness-runtime') || (/\.html$/i.test(artifact.destinationPath) && /\brun\(\s*['"`]/.test(text));
    const ledgerLike = kinds.has('widget-ledger') || /WIDGET_UX_OVERHAUL_LEDGER\.md$/i.test(artifact.destinationPath) || (/\.md$/i.test(artifact.destinationPath) && /^\|\s*\d+\s*\|/m.test(text));
    if (!harnessLike && !ledgerLike) continue;
    const evidence = harnessLike
      ? runtimeHarness
        ? runtimeHarness.cases.map((sourceEvidence) => ({ kind: 'harness-runtime', evidence: sourceEvidence }))
        : extractHarnessCases(text, artifact.destinationPath)
      : extractLedgerRows(text, artifact.destinationPath);
    for (const item of evidence) {
      const match = (contractIndex.contracts || []).find((contract) => contract.sourcePath === artifact.sourcePath
        && contract.evidenceKind === item.kind
        && normalizeEvidence(contract.sourceEvidence) === normalizeEvidence(item.evidence));
      if (!match) findings.push(`${artifact.destinationPath}: ${item.kind.startsWith('harness') ? 'harness case lacks stable contract ID' : 'Widget-ledger row lacks stable contract ID'}: ${item.evidence}`);
      else if (item.kind === 'widget-ledger' && !match.destinationOwner?.trim()) findings.push(`${match.contractId}: Widget-ledger row lacks destination owner`);
    }
  }

  const sourceManifestPaths = new Set((scope.referencedAssetRules || []).map((rule) => rule.sourceManifest));
  const textualEvidence = [];
  for (const artifact of manifest.artifacts) {
    if (!/\.(?:html|md|json|js|css)$/i.test(artifact.destinationPath)) continue;
    if (sourceManifestPaths.has(artifact.sourcePath)) continue;
    const bytes = await fileBytes(root, artifact.destinationPath);
    if (bytes) textualEvidence.push(bytes.toString('utf8'));
  }
  const evidenceText = textualEvidence.join('\n');
  for (const rule of scope.referencedAssetRules || []) {
    const manifestArtifact = artifactsBySource.get(rule.sourceManifest);
    const manifestBytes = manifestArtifact ? await fileBytes(root, manifestArtifact.destinationPath) : null;
    const iconManifest = manifestBytes ? JSON.parse(manifestBytes.toString('utf8')) : null;
    const entries = iconManifest?.icons || iconManifest?.entries || [];
    const byFilename = new Map(entries.map((item) => [item.filename, item]));
    const copied = manifest.artifacts.filter((item) => item.destinationPath.startsWith(rule.destinationDirectory) && item.destinationPath.endsWith('.svg'));
    for (const icon of copied) {
      const filename = path.posix.basename(icon.destinationPath);
      if (!evidenceText.includes(filename)) findings.push(`${filename}: copied icon is not referenced by imported evidence`);
      const metadata = byFilename.get(filename);
      if (!metadata) findings.push(`${filename}: referenced asset lacks manifest provenance`);
      else if (metadata.licenseMetadata !== 'CC0') findings.push(`${filename}: icon license metadata is not CC0`);
      if (!icon.licenseEvidence?.length) findings.push(`${filename}: referenced asset lacks license evidence`);
      for (const licensePath of rule.licenseEvidence || []) if (!artifactsByDestination.has(licensePath)) findings.push(`${filename}: missing license evidence ${licensePath}`);
    }
  }

  for (const item of manifest.unaccounted || []) findings.push(`unaccounted: ${typeof item === 'string' ? item : JSON.stringify(item)}`);
  if (runtimeHarnessCases) {
    if (runtimeHarnessCases.sourceCommit !== manifest.baseline.sourceCommit) findings.push('runtime harness snapshot source commit does not match baseline');
    for (const harness of runtimeHarnessCases.harnesses || []) {
      const match = harness.reportedResult.match(/^(\d+)\/(\d+) passed$/);
      if (!match || match[1] !== match[2] || Number(match[2]) !== harness.cases.length) findings.push(`${harness.name}: runtime harness snapshot count is inconsistent`);
      if (new Set(harness.cases).size !== harness.cases.length) findings.push(`${harness.name}: runtime harness snapshot contains duplicate cases`);
    }
  }
  if (!testDispositions?.entries?.length) findings.push('Sonder test dispositions are missing');
  return [...new Set(findings)].sort();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const load = async (name) => JSON.parse(await readFile(path.join(root, 'provenance', name), 'utf8'));
  const [manifest, contractIndex, scope, testDispositions, runtimeHarnessCases] = await Promise.all([
    load('extraction-manifest.json'), load('contract-index.json'), load('source-scope.json'), load('sonder-test-dispositions.json'), load('preserved-harness-cases.json')
  ]);
  const findings = await verifyExtraction({ root, manifest, contractIndex, scope, testDispositions, runtimeHarnessCases });
  if (findings.length) {
    console.error(`Extraction verification failed (${findings.length}):\n- ${findings.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Extraction verified: ${manifest.artifacts.length} artifacts, ${contractIndex.contracts.length} contracts, unaccounted 0.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}
