import { PersistedThemeDraftSchema, type PersistedThemeDraft } from '@pomegranate-ui/contracts';

export interface ThemeAuthoringDiagnostic {
  readonly message: string;
  readonly path: readonly (string | number)[];
}

export interface ThemeAuthoringSnapshot {
  readonly editable: unknown;
  readonly lastValidEditable: PersistedThemeDraft;
  readonly applied: { readonly resolved: { readonly theme: { readonly label: string } } };
  readonly diagnostics: readonly ThemeAuthoringDiagnostic[];
  readonly canvasAvailability: { readonly image: boolean; readonly overlay: boolean; readonly vignette: boolean };
  readonly dirty: boolean;
}

export interface ThemeAuthoringResult {
  readonly ok: boolean;
  readonly authoring: ThemeAuthoringSnapshot;
  readonly diagnostics?: readonly ThemeAuthoringDiagnostic[];
}

export interface ThemeAuthoringPort {
  readonly authoring: ThemeAuthoringSnapshot;
  readonly editDraft: (next: unknown) => ThemeAuthoringResult;
  readonly resetDraft: () => ThemeAuthoringResult;
  readonly saveDraft: () => Promise<ThemeAuthoringResult>;
}

export interface EyeDropperPort {
  available(): boolean;
  sample(): Promise<string | null>;
}

export function editableThemeDraft(theme: ThemeAuthoringPort): PersistedThemeDraft {
  const editable = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
  return structuredClone(editable.success ? editable.data : theme.authoring.lastValidEditable);
}

export function diagnosticsFor(theme: ThemeAuthoringPort, prefixes: readonly string[]): readonly ThemeAuthoringDiagnostic[] {
  return theme.authoring.diagnostics.filter(({ path }) => path.some((part) => prefixes.includes(String(part))));
}
