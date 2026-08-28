import type { LayoutStorage } from '@pomegranate-ui/contracts';

export const LAB_LAYOUT_KEY = 'pomegranate-ui.workbench-lab.layout.v1';

export function createLocalLayoutStorage(): LayoutStorage {
  return {
    async load(key) {
      return window.localStorage.getItem(key);
    },
    async save(key, value) {
      window.localStorage.setItem(key, value);
    },
    async remove(key) {
      window.localStorage.removeItem(key);
    }
  };
}
