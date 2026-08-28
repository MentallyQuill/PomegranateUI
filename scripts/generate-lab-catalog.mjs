import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oraclePath = path.join(root, 'prototypes', 'sonder-baseline', 'widget-overhaul', 'sonder-widget-overhaul.html');
const outputPath = path.join(root, 'apps', 'workbench-lab', 'src', 'mockup', 'catalog.ts');

const DEFAULT_STATES = ['ready', 'loading', 'empty', 'unavailable', 'access-denied', 'stale', 'offline', 'failure'];
const EDITOR_STATES = [...DEFAULT_STATES, 'dirty', 'saving', 'conflict', 'success'];
const REVIEW_STATES = [...EDITOR_STATES, 'review', 'running', 'partial', 'refused'];
const GEOMETRY_DEFAULTS = {
  narrow: [200, 320, 480],
  medium: [240, 420, 640],
  wide: [320, 600, 760],
  stage: [320, 600, 760],
  strip: [176, 232, 368]
};

function quoted(source, key, fallback) {
  const match = source.match(new RegExp(`${key}:\\s*(['\"])(.*?)\\1`));
  return match?.[2] ?? fallback;
}

function numeric(source, key, fallback) {
  const match = source.match(new RegExp(`${key}:\\s*(\\d+)`));
  return match ? Number(match[1]) : fallback;
}

function keywords(source, title) {
  const match = source.match(/keywords:\s*\[([^\]]*)\]/);
  const values = match ? [...match[1].matchAll(/['\"](.*?)['\"]/g)].map((entry) => entry[1]) : [];
  return [...new Set([title, ...values])];
}

function parseBuiltIns(source) {
  const definitions = [];
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/builtIn\((['\"])(.*?)\1,\s*(['\"])(.*?)\3,\s*(['\"])(.*?)\5,\s*\{(.*)\}\),?/);
    if (!match) continue;
    const [, , type, , title, , category, options] = match;
    const role = quoted(options, 'role', 'module');
    const shape = quoted(options, 'shape', role.includes('workspace') ? 'wide' : 'medium');
    const defaults = GEOMETRY_DEFAULTS[shape];
    const supportedStates = options.includes('states: REVIEW_WIDGET_STATES')
      ? REVIEW_STATES
      : role.includes('editor') || role.includes('workspace')
        ? EDITOR_STATES
        : DEFAULT_STATES;
    definitions.push({
      type,
      title,
      category,
      purpose: quoted(options, 'purpose', `Work with ${title.toLowerCase()} in its ${category} context.`),
      keywords: keywords(options, title),
      iconKey: quoted(options, 'icon', `category.${category}`),
      shape,
      minColumns: numeric(options, 'minColumns', shape === 'wide' || shape === 'stage' ? 2 : 1),
      geometry: {
        minHeight: numeric(options, 'minHeight', defaults[0]),
        idealHeight: numeric(options, 'idealHeight', defaults[1]),
        maxHeight: numeric(options, 'maxHeight', defaults[2])
      },
      supportedStates
    });
  }
  return definitions;
}

function extension(type, title, shape, minColumns, purpose, keywords) {
  const defaults = GEOMETRY_DEFAULTS[shape];
  return {
    type,
    title,
    category: 'extensions',
    purpose,
    keywords: [title, ...keywords],
    iconKey: 'category.extensions',
    shape,
    minColumns,
    geometry: { minHeight: defaults[0], idealHeight: defaults[1], maxHeight: defaults[2] },
    supportedStates: REVIEW_STATES
  };
}

const source = await readFile(oraclePath, 'utf8');
const definitions = [
  ...parseBuiltIns(source),
  extension('ext:atlas:campaign-clock', 'Campaign Clock', 'narrow', 1, 'Track an owner-provided campaign clock in a compact host-governed shape.', ['clock', 'campaign', 'atlas']),
  extension('ext:trail:location-notes', 'Location Notes', 'wide', 2, 'Edit owner-provided location notes in the canonical Library workspace shape.', ['location', 'notes', 'trail']),
  extension('ext:mythic:settings', 'Mythic Settings', 'medium', 1, 'Configure an installed extension through the canonical Settings shape.', ['extension', 'settings', 'mythic'])
];
const totals = Object.fromEntries(['story', 'library', 'systems', 'settings', 'extensions'].map((category) => [
  category,
  definitions.filter((entry) => entry.category === category).length
]));
if (definitions.length !== 94 || JSON.stringify(totals) !== JSON.stringify({ story: 12, library: 19, systems: 21, settings: 39, extensions: 3 })) {
  throw new Error(`Catalog extraction count mismatch: ${definitions.length} ${JSON.stringify(totals)}`);
}

const output = `// Generated from the preserved Widget Overhaul catalog by scripts/generate-lab-catalog.mjs.\n`
  + `// The Lab owns this translated fixture; the preserved prototype remains the executable oracle.\n\n`
  + `import { WidgetManifestSchema, asWidgetType, type WidgetManifest } from '@pomegranate-ui/contracts';\n\n`
  + `export const CATALOG_TOTALS = Object.freeze(${JSON.stringify(totals, null, 2)} as const);\n\n`
  + `const DEFINITIONS = ${JSON.stringify(definitions, null, 2)} as const;\n\n`
  + `export function createCatalogManifests(): readonly WidgetManifest[] {\n`
  + `  return Object.freeze(DEFINITIONS.map((definition) => WidgetManifestSchema.parse({\n`
  + `    type: asWidgetType(definition.type),\n`
  + `    version: '1.0.0',\n`
  + `    title: definition.title,\n`
  + `    capabilities: definition.category === 'settings' ? ['settings.read'] : ['story.read'],\n`
  + `    defaultConfiguration: {},\n`
  + `    defaultPlacement: {\n`
  + `      kind: 'docked',\n`
  + `      edge: definition.category === 'story' ? 'main' : definition.category === 'systems' ? 'right' : 'left',\n`
  + `      shelfId: 'primary'\n`
  + `    },\n`
  + `    catalog: {\n`
  + `      category: definition.category,\n`
  + `      purpose: definition.purpose,\n`
  + `      keywords: [...definition.keywords],\n`
  + `      iconKey: definition.iconKey,\n`
  + `      shape: definition.shape,\n`
  + `      minColumns: definition.minColumns,\n`
  + `      geometry: { ...definition.geometry },\n`
  + `      supportedStates: [...definition.supportedStates]\n`
  + `    }\n`
  + `  }) as WidgetManifest));\n`
  + `}\n`;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, output);
console.log(`Generated ${path.relative(root, outputPath)} with ${definitions.length} definitions.`);
