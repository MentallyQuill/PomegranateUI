import type { CommandError, CommandErrorCode, JsonObject, WorkbenchState } from '@pomegranate-ui/contracts';

export type LayoutSuccess = { readonly ok: true; readonly state: WorkbenchState };
export type LayoutFailure = {
  readonly ok: false;
  readonly state: WorkbenchState;
  readonly error: CommandError;
};
export type LayoutResult = LayoutSuccess | LayoutFailure;

export function rejectLayout(
  state: WorkbenchState,
  code: CommandErrorCode,
  message: string,
  details?: JsonObject,
  recoverable = true
): LayoutFailure {
  const error: CommandError = details === undefined
    ? { code, message, recoverable }
    : { code, message, recoverable, details };
  return { ok: false, state, error };
}

export function acceptLayout(state: WorkbenchState): LayoutSuccess {
  return { ok: true, state };
}
