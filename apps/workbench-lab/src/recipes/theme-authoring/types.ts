import { PersistedThemeDraftSchema, type PersistedThemeDraft, type ThemeDraftColorRole, type ThemeTypographyRole } from '@pomegranate-ui/contracts';

import type {
  LabThemeAuthoringSnapshot,
  ThemeDraftEditResult,
  ThemeDraftSaveResult,
  ThemeTypographyRoleId,
  ThemeTypographyScaleId
} from '../../themes/controller.js';
import type { BundledFontChoice } from '../../themes/bundled-fonts.js';

export interface ThemeAuthoringPort {
  readonly authoring: LabThemeAuthoringSnapshot;
  readonly fontChoices: Readonly<Record<ThemeTypographyRoleId, readonly BundledFontChoice[]>>;
  readonly editDraft: (next: unknown) => ThemeDraftEditResult;
  readonly editColorHex: (role: ThemeDraftColorRole, value: string) => ThemeDraftEditResult;
  readonly editColorRgb: (role: ThemeDraftColorRole, channel: 0 | 1 | 2, value: string) => ThemeDraftEditResult;
  readonly editTypographyRole: (role: ThemeTypographyRoleId, patch: Partial<ThemeTypographyRole>) => ThemeDraftEditResult;
  readonly editTypographyScale: (step: ThemeTypographyScaleId, value: number) => ThemeDraftEditResult;
  readonly resetTypography: () => ThemeDraftEditResult;
  readonly resetDraft: () => ThemeDraftEditResult;
  readonly saveDraft: () => Promise<ThemeDraftSaveResult>;
}

export interface EyeDropperPort {
  available(): boolean;
  sample(): Promise<string | null>;
}

export function editableThemeDraft(theme: ThemeAuthoringPort): PersistedThemeDraft {
  const editable = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
  if (editable.success) return structuredClone(editable.data);
  const raw = structuredClone(theme.authoring.editable) as Record<string, unknown> | null;
  const draft = raw && typeof raw === 'object' ? raw.draft as Record<string, unknown> | null : null;
  if (
    draft && typeof draft === 'object'
    && draft.colors && typeof draft.colors === 'object'
    && draft.materials && typeof draft.materials === 'object'
    && draft.canvas && typeof draft.canvas === 'object'
    && raw?.ambient && typeof raw.ambient === 'object'
  ) return raw as unknown as PersistedThemeDraft;
  return structuredClone(theme.authoring.lastValidEditable);
}

export function diagnosticsFor(
  theme: ThemeAuthoringPort,
  prefixes: readonly string[]
): readonly LabThemeAuthoringSnapshot['diagnostics'][number][] {
  return theme.authoring.diagnostics.filter(({ path }) => path.some((part) => prefixes.includes(String(part))));
}
