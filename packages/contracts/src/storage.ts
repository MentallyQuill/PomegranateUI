export interface LayoutStorage {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
  remove?(key: string): Promise<void>;
}

export interface ThemeDraftStorage {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
  remove?(key: string): Promise<void>;
}
