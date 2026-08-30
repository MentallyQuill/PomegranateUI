import type { WorkbenchCommand, WorkbenchState } from '@pomegranate-ui/contracts';

export interface UndoRecord {
  readonly before: WorkbenchState;
  readonly commandType: WorkbenchCommand['type'];
}

export interface OneStepLayoutHistory {
  canUndo(): boolean;
  record(before: WorkbenchState, commandType: WorkbenchCommand['type']): void;
  consume(): UndoRecord | null;
  clear(): void;
}

export function createOneStepLayoutHistory(): OneStepLayoutHistory {
  let record: UndoRecord | null = null;
  return Object.freeze({
    canUndo: () => record !== null,
    record(before: WorkbenchState, commandType: WorkbenchCommand['type']) {
      record = Object.freeze({ before, commandType });
    },
    consume() {
      const consumed = record;
      record = null;
      return consumed;
    },
    clear() {
      record = null;
    }
  });
}
