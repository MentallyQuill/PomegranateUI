export interface EyeDropperAdapter {
  available(): boolean;
  sample(): Promise<string | null>;
}

interface EyeDropperScope {
  readonly EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
}

const exactHex = /^#[0-9a-f]{6}$/i;

export function createEyeDropperAdapter(scope: EyeDropperScope = globalThis as EyeDropperScope): EyeDropperAdapter {
  const constructor = scope.EyeDropper;
  return Object.freeze({
    available: () => typeof constructor === 'function',
    async sample() {
      if (typeof constructor !== 'function') return null;
      try {
        const result = await new constructor().open();
        return exactHex.test(result.sRGBHex) ? result.sRGBHex.toLowerCase() : null;
      } catch {
        return null;
      }
    }
  });
}
