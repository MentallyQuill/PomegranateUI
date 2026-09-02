import { PersistedThemeDraftSchema, type PersistedThemeDraft } from '@pomegranate-ui/contracts';

import type {
  LabThemeAuthoringSnapshot,
  ThemeDraftEditResult,
  ThemeDraftSaveResult
} from '../../themes/controller.js';

export interface ThemeAuthoringPort {
  readonly authoring: LabThemeAuthoringSnapshot;
  readonly editDraft: (next: unknown) => ThemeDraftEditResult;
  readonly resetDraft: () => ThemeDraftEditResult;
  readonly saveDraft: () => Promise<ThemeDraftSaveResult>;
}

export interface EyeDropperPort {
  available(): boolean;
  sample(): Promise<string | null>;
}

export function editableThemeDraft(theme: ThemeAuthoringPort): PersistedThemeDraft {
  const editable = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
  return structuredClone(editable.success ? editable.data : theme.authoring.lastValidEditable);
}

export function diagnosticsFor(
  theme: ThemeAuthoringPort,
  prefixes: readonly string[]
): readonly LabThemeAuthoringSnapshot['diagnostics'][number][] {
  return theme.authoring.diagnostics.filter(({ path }) => path.some((part) => prefixes.includes(String(part))));
}
