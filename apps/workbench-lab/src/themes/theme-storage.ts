import type { ThemePreferenceAdapter } from './controller.js';
import type { LabThemeId } from './presets.js';

export const LAB_THEME_KEY = 'pomegranate-ui.workbench-lab.theme.v1' as const;

export function createLocalThemePreference(storage: Pick<Storage, 'getItem' | 'setItem'>): ThemePreferenceAdapter {
  return Object.freeze({
    read: () => storage.getItem(LAB_THEME_KEY),
    write: (id: LabThemeId) => storage.setItem(LAB_THEME_KEY, id)
  });
}
