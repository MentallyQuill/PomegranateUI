import {
  PanelTemplateDefinitionSchema,
  type PanelState,
  type PanelTemplateDefinition
} from '@pomegranate-ui/contracts';

export interface ResolvedPanelTemplate {
  readonly id: string;
  readonly label: string;
  readonly family: PanelTemplateDefinition['family'];
  readonly regions: PanelTemplateDefinition['regions'];
}

export type PanelTemplateResolution =
  | { readonly ok: true; readonly template: ResolvedPanelTemplate }
  | {
      readonly ok: false;
      readonly code: 'UNKNOWN_TEMPLATE' | 'INVALID_TEMPLATE_OPTIONS';
      readonly message: string;
    };

export interface PanelTemplateRegistry {
  list(): readonly PanelTemplateDefinition[];
  get(id: string): PanelTemplateDefinition | undefined;
  resolve(panel: PanelState): PanelTemplateResolution;
}

const ALL_SHAPES = ['narrow', 'medium', 'wide', 'stage', 'strip'] as const;

const storyStage = {
  id: 'story-stage.v1',
  label: 'Story stage',
  family: 'story-stage',
  regions: [
    { id: 'left', label: 'Left instruments', role: 'left-instruments', order: 0, acceptedShapes: ['narrow', 'medium'], minimumWidth: 220, minimumHeight: 120 },
    { id: 'stage', label: 'Stage', role: 'stage', order: 1, acceptedShapes: ['medium', 'wide', 'stage'], minimumWidth: 320, minimumHeight: 240 },
    { id: 'composer', label: 'Composer', role: 'composer', order: 2, acceptedShapes: ['strip', 'wide'], minimumWidth: 320, minimumHeight: 56 },
    { id: 'right', label: 'Right instruments', role: 'right-instruments', order: 3, acceptedShapes: ['narrow', 'medium'], minimumWidth: 220, minimumHeight: 120 }
  ],
  options: {}
} as const;

const focusSupport = {
  id: 'focus-support.v1',
  label: 'Focus and support',
  family: 'focus-support',
  regions: [
    { id: 'focus', label: 'Focus', role: 'focus', order: 0, acceptedShapes: ALL_SHAPES, minimumWidth: 320, minimumHeight: 240 },
    { id: 'support', label: 'Support', role: 'support', order: 1, acceptedShapes: ['narrow', 'medium', 'strip'], minimumWidth: 220, minimumHeight: 120 }
  ],
  options: {}
} as const;

const columns = {
  id: 'columns.v1',
  label: 'Columns',
  family: 'columns',
  regions: Array.from({ length: 6 }, (_, index) => ({
    id: `column-${index + 1}`,
    label: `Column ${index + 1}`,
    role: 'column' as const,
    order: index,
    acceptedShapes: ALL_SHAPES,
    minimumWidth: 160,
    minimumHeight: 120,
    enabledWhen: { option: 'columns' as const, minimum: Math.max(2, index + 1) }
  })),
  options: { columns: { minimum: 2, maximum: 6, default: 3 } }
} as const;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function parseDefinition(value: unknown): PanelTemplateDefinition {
  return deepFreeze(PanelTemplateDefinitionSchema.parse(value) as PanelTemplateDefinition);
}

export const BUILT_IN_PANEL_TEMPLATES: readonly PanelTemplateDefinition[] = deepFreeze([
  parseDefinition(storyStage),
  parseDefinition(focusSupport),
  parseDefinition(columns)
]);

export function createPanelTemplateRegistry(
  definitions: readonly PanelTemplateDefinition[] = BUILT_IN_PANEL_TEMPLATES
): PanelTemplateRegistry {
  const parsed = definitions.map(parseDefinition);
  const byId = new Map<string, PanelTemplateDefinition>();
  for (const definition of parsed) {
    if (byId.has(definition.id)) throw new Error(`Duplicate Panel template id '${definition.id}'.`);
    byId.set(definition.id, definition);
  }
  const snapshot = deepFreeze([...parsed]);

  return Object.freeze({
    list: () => snapshot,
    get: (id: string) => byId.get(id),
    resolve(panel: PanelState): PanelTemplateResolution {
      const definition = byId.get(panel.templateId);
      if (!definition) {
        return Object.freeze({
          ok: false as const,
          code: 'UNKNOWN_TEMPLATE' as const,
          message: `Panel template '${panel.templateId}' is not registered.`
        });
      }
      let regions = definition.regions;
      if (definition.family === 'columns') {
        const requested = panel.configuration?.columns ?? definition.options.columns?.default;
        const bounds = definition.options.columns;
        if (
          typeof requested !== 'number'
          || !Number.isInteger(requested)
          || !bounds
          || requested < bounds.minimum
          || requested > bounds.maximum
        ) {
          return Object.freeze({
            ok: false as const,
            code: 'INVALID_TEMPLATE_OPTIONS' as const,
            message: `Panel template '${panel.templateId}' requires an integer columns option from 2 through 6.`
          });
        }
        regions = definition.regions.filter((region) => (
          !region.enabledWhen || requested >= region.enabledWhen.minimum
        ));
      }
      return Object.freeze({
        ok: true as const,
        template: deepFreeze({
          id: definition.id,
          label: definition.label,
          family: definition.family,
          regions: [...regions]
        })
      });
    }
  });
}
