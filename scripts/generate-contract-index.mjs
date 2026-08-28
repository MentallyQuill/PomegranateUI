import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_FAMILIES = new Set([
  'INTEGRATION-SONDER', 'A11Y', 'DRAG', 'RESPONSIVE', 'PERSIST',
  'CATALOG', 'THEME', 'PANEL', 'LAYOUT', 'WIDGET'
]);

export function normalizeEvidence(value) {
  return String(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function decodeLiteral(value, quote) {
  return value.replace(/\\([\\'"`])/g, '$1').replace(/\\n/g, '\n');
}

export function extractHarnessCases(sourceText, sourcePath) {
  const cases = [];
  const seen = new Set();
  for (const match of sourceText.matchAll(/\brun\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,/gs)) {
    const evidence = decodeLiteral(match[2], match[1]).trim();
    const normalized = normalizeEvidence(evidence);
    if (seen.has(normalized)) throw new Error(`Duplicate normalized harness evidence in ${sourcePath}: ${evidence}`);
    seen.add(normalized);
    cases.push({ kind: 'harness', sourcePath, evidence, normalizedEvidence: normalized, discriminator: `harness:${sourcePath}` });
  }
  return cases;
}

export function extractLedgerRows(sourceText, sourcePath) {
  const rows = [];
  let section = 'document';
  for (const line of sourceText.split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) section = normalizeEvidence(heading[1]);
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (!/^\d+$/.test(cells[0] || '')) continue;
    const row = cells[0];
    const evidence = cells.slice(1).join(' — ');
    const surface = cells[2] || cells[1] || evidence;
    rows.push({
      kind: 'widget-ledger', sourcePath, evidence,
      normalizedEvidence: normalizeEvidence(evidence),
      discriminator: `widget-ledger:${section}:${row}:${normalizeEvidence(evidence)}`,
      ledgerRow: Number(row), ledgerSection: section, surface: surface.trim()
    });
  }
  return rows;
}

export function classifyContract(evidence, rules) {
  const text = normalizeEvidence(evidence.evidence);
  for (const rule of rules.families || []) {
    if (!APPROVED_FAMILIES.has(rule.family)) throw new Error(`Unapproved contract family: ${rule.family}`);
    if (new RegExp(rule.pattern, 'i').test(text)) return rule.family;
  }
  const fallback = rules.kindFallbacks?.[evidence.kind];
  if (fallback && APPROVED_FAMILIES.has(fallback)) return fallback;
  throw new Error(`Unmatched contract evidence: ${evidence.evidence}`);
}

export function stableContractId({ family, normalizedEvidence, discriminator = '' }) {
  if (!APPROVED_FAMILIES.has(family)) throw new Error(`Unapproved contract family: ${family}`);
  const digest = createHash('sha256')
    .update(`${family}\0${normalizeEvidence(normalizedEvidence)}\0${discriminator}`)
    .digest('hex').slice(0, 10).toUpperCase();
  return `POM-${family}-${digest}`;
}

function artifactFor(manifest, destinationPath) {
  const artifact = manifest.artifacts.find((item) => item.destinationPath === destinationPath);
  if (!artifact) throw new Error(`Contract source is absent from extraction manifest: ${destinationPath}`);
  return artifact;
}

export async function buildContractIndex({ manifest, importedRoot, rules, runtimeHarnessCases }) {
  const sources = [
    { kind: 'harness', path: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html', extract: extractHarnessCases },
    { kind: 'harness', path: 'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html', extract: extractHarnessCases },
    { kind: 'widget-ledger', path: 'design/widget-specifications/sonder-panels-and-widgets/12_WIDGET_UX_OVERHAUL_LEDGER.md', extract: extractLedgerRows }
  ];
  const contracts = [];
  const ids = new Set();
  for (const source of sources) {
    const artifact = artifactFor(manifest, source.path);
    const text = await readFile(path.join(importedRoot, ...source.path.split('/')), 'utf8');
    const runtime = source.kind === 'harness' && runtimeHarnessCases
      ? runtimeHarnessCases.harnesses.find((harness) => harness.sourcePath === artifact.sourcePath)
      : null;
    if (source.kind === 'harness' && runtimeHarnessCases && !runtime) throw new Error(`Runtime harness snapshot is missing ${artifact.sourcePath}`);
    const extracted = runtime
      ? runtime.cases.map((evidence) => ({
          kind: 'harness-runtime', sourcePath: source.path, evidence,
          normalizedEvidence: normalizeEvidence(evidence),
          discriminator: `harness-runtime:${artifact.sourcePath}`
        }))
      : source.extract(text, source.path);
    for (const evidence of extracted) {
      const family = classifyContract(evidence, rules);
      const contractId = stableContractId({ family, normalizedEvidence: evidence.normalizedEvidence, discriminator: evidence.discriminator });
      if (ids.has(contractId)) throw new Error(`Duplicate contract ID: ${contractId}`);
      ids.add(contractId);
      const integration = family === 'INTEGRATION-SONDER';
      contracts.push({
        contractId,
        sourcePath: artifact.sourcePath,
        sourceCommit: artifact.sourceCommit,
        sourceSha256: artifact.sourceSha256,
        sourceEvidence: evidence.evidence,
        evidenceKind: evidence.kind,
        ...(evidence.ledgerRow ? { ledgerRow: evidence.ledgerRow, surface: evidence.surface } : {}),
        classification: integration ? 'sonder-integration' : 'toolkit-generic',
        destinationOwner: integration ? 'Sonder consumer suite' : `@pomegranate-ui/${family.toLowerCase()}`,
        destinationEvidence: [source.path],
        status: integration ? 'sonder-owned' : 'preserved-verbatim'
      });
    }
  }
  contracts.sort((a, b) => a.contractId.localeCompare(b.contractId));
  return { schemaVersion: 1, baseline: manifest.baseline, contracts };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const write = process.argv.includes('--write');
  const manifestPath = path.join(root, 'provenance', 'extraction-manifest.json');
  const indexPath = path.join(root, 'provenance', 'contract-index.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const rules = JSON.parse(await readFile(path.join(root, 'provenance', 'contract-family-rules.json'), 'utf8'));
  const runtimeHarnessCases = JSON.parse(await readFile(path.join(root, 'provenance', 'preserved-harness-cases.json'), 'utf8'));
  if (runtimeHarnessCases.sourceCommit !== manifest.baseline.sourceCommit) throw new Error('Runtime harness snapshot source commit does not match the extraction baseline.');
  const index = await buildContractIndex({ manifest, importedRoot: root, rules, runtimeHarnessCases });
  const encoded = `${JSON.stringify(index, null, 2)}\n`;
  if (write) {
    manifest.contracts = index.contracts;
    await writeFile(indexPath, encoded);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  } else {
    const current = await readFile(indexPath, 'utf8');
    if (current !== encoded) throw new Error('Contract index is stale. Run with --write.');
  }
  const totals = Object.fromEntries([...new Set(index.contracts.map((item) => item.contractId.split('-').slice(1, -1).join('-')))].sort().map((family) => [family, index.contracts.filter((item) => item.contractId.startsWith(`POM-${family}-`)).length]));
  process.stdout.write(`${JSON.stringify({ contracts: index.contracts.length, byFamily: totals })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
