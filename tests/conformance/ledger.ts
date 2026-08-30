import { ConformanceError, type ConformanceScenario } from './types.ts';

export type DiscrepancyCategory =
  | 'structure'
  | 'geometry'
  | 'visual'
  | 'behavior'
  | 'content'
  | 'accessibility'
  | 'infrastructure';
export type DiscrepancySeverity = 'P0' | 'P1' | 'P2' | 'P3';
export type DiscrepancyStatus = 'open' | 'fixing' | 'verified' | 'deviation-requested' | 'closed';

export interface Discrepancy {
  readonly id: string;
  readonly category: DiscrepancyCategory;
  readonly severity: DiscrepancySeverity;
  readonly authority: string;
  readonly scenario: string;
  readonly evidence: string;
  readonly diagnosis: string;
  readonly status: DiscrepancyStatus;
  readonly regression: string;
  readonly deviation: string;
}

const LEDGER_HEADER = '| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |';
const LEDGER_SEPARATOR = '|---|---|---|---|---|---|---|---|---|---|';

function ledgerError(reason: string): never {
  throw new ConformanceError('MANIFEST_INVALID', `Discrepancy ledger is invalid: ${reason}.`, { reason });
}

export function parseDiscrepancyLedger(markdown: string): readonly Discrepancy[] {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.indexOf(LEDGER_HEADER);
  if (headerIndex < 0) ledgerError('required table header is missing');
  if (lines[headerIndex + 1] !== LEDGER_SEPARATOR) ledgerError('required table separator is missing');

  const rows: Discrepancy[] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.length !== 10) ledgerError('a row does not have exactly ten cells');
    const [id, category, severity, authority, scenario, evidence, diagnosis, status, regression, deviation] = cells;
    rows.push(Object.freeze({
      id: id ?? '',
      category: category as DiscrepancyCategory,
      severity: severity as DiscrepancySeverity,
      authority: authority ?? '',
      scenario: scenario ?? '',
      evidence: evidence ?? '',
      diagnosis: diagnosis ?? '',
      status: status as DiscrepancyStatus,
      regression: regression ?? '',
      deviation: deviation ?? ''
    }));
  }
  return Object.freeze(rows);
}

export interface LedgerValidation {
  readonly entries: readonly Discrepancy[];
  readonly deviationIds: ReadonlySet<string>;
}

export function validateDiscrepancyLedger(
  entries: readonly Discrepancy[],
  scenarios: readonly ConformanceScenario[]
): LedgerValidation {
  const ids = new Set<string>();
  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const allowedCategories = new Set(['structure', 'geometry', 'visual', 'behavior', 'content', 'accessibility', 'infrastructure']);
  const allowedSeverities = new Set(['P0', 'P1', 'P2', 'P3']);
  const allowedStatuses = new Set(['open', 'fixing', 'verified', 'deviation-requested', 'closed']);
  const deviationIds = new Set<string>();
  const entryError = (entry: Discrepancy, reason: string): never => {
    throw new ConformanceError(
      'MANIFEST_INVALID',
      `Discrepancy ${entry.id} is invalid: ${reason}.`,
      { discrepancyId: entry.id, reason }
    );
  };

  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Discrepancy identity is duplicated: ${entry.id}.`,
        { discrepancyId: entry.id }
      );
    }
    ids.add(entry.id);
    const scenario = scenarioById.get(entry.scenario);
    if (!scenario) {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Discrepancy ${entry.id} is invalid: unknown scenario ${entry.scenario}.`,
        { discrepancyId: entry.id, reason: `unknown scenario ${entry.scenario}` }
      );
    }
    const expectedPrefix = scenario.target === 'deep-current' ? 'DC-'
      : scenario.target === 'pom-neutral' ? 'PN-'
        : scenario.target === 'bunny' ? 'BN-'
          : 'AA-';
    if (!entry.id.startsWith(expectedPrefix)) entryError(entry, `identity must use ${expectedPrefix}`);
    if (!allowedCategories.has(entry.category)) entryError(entry, `unknown category ${entry.category}`);
    if (!allowedSeverities.has(entry.severity)) entryError(entry, `unknown severity ${entry.severity}`);
    if (!allowedStatuses.has(entry.status)) entryError(entry, `unknown status ${entry.status}`);
    if (entry.status === 'closed' && (!entry.regression || entry.regression === 'none')) {
      entryError(entry, 'closed row lacks regression evidence');
    }
    if (entry.status === 'deviation-requested') {
      if (!entry.deviation || entry.deviation === 'none') entryError(entry, 'deviation lacks approval text');
      if (!scenario.allowedDeviationIds.includes(entry.id)) entryError(entry, 'deviation is not cited by its scenario');
      deviationIds.add(entry.id);
    }
  }
  for (const scenario of scenarios) {
    for (const deviationId of scenario.allowedDeviationIds) {
      const entry = entries.find((candidate) => candidate.id === deviationId);
      if (!entry || entry.status !== 'deviation-requested') {
        throw new ConformanceError(
          'MANIFEST_INVALID',
          `Scenario ${scenario.id} cites missing or incomplete deviation ${deviationId}.`,
          { scenarioId: scenario.id, discrepancyId: deviationId }
        );
      }
    }
  }
  return Object.freeze({ entries: Object.freeze([...entries]), deviationIds });
}
