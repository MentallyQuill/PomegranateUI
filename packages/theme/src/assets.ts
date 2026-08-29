import type { ThemeAssetReference, ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

export interface ThemeAssetRegistration {
  readonly kind: ThemeAssetReference['kind'];
  readonly source: string;
}

export type ThemeAssetRegistry = Readonly<Record<string, ThemeAssetRegistration>>;

export interface ThemeAssetDiagnostic {
  readonly code: 'THEME_ASSET_MISSING' | 'THEME_ASSET_KIND_MISMATCH' | 'THEME_ICON_PACK_MISSING';
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface ResolvedThemeAssets {
  readonly ok: boolean;
  readonly assets: ThemeAssetRegistry;
  readonly diagnostics: readonly ThemeAssetDiagnostic[];
}

export function resolveThemeAssets(
  theme: ThemeDefinitionV2,
  registry: ThemeAssetRegistry
): ResolvedThemeAssets {
  const diagnostics: ThemeAssetDiagnostic[] = [];
  const resolved: Record<string, ThemeAssetRegistration> = {};

  theme.assets.forEach((asset, index) => {
    const registration = registry[asset.id];
    if (!registration) {
      if (asset.required) {
        diagnostics.push({
          code: asset.id === theme.iconPackId ? 'THEME_ICON_PACK_MISSING' : 'THEME_ASSET_MISSING',
          path: asset.id === theme.iconPackId ? ['iconPackId'] : ['assets', index, 'id'],
          message: `Required ${asset.kind} '${asset.id}' is not registered by the host.`
        });
      }
      return;
    }
    if (registration.kind !== asset.kind) {
      diagnostics.push({
        code: 'THEME_ASSET_KIND_MISMATCH',
        path: ['assets', index, 'kind'],
        message: `Asset '${asset.id}' is registered as ${registration.kind}, not ${asset.kind}.`
      });
      return;
    }
    resolved[asset.id] = { ...registration };
  });

  const iconReference = theme.assets.find((asset) => asset.id === theme.iconPackId && asset.kind === 'icon-pack');
  if (!iconReference && !diagnostics.some(({ code }) => code === 'THEME_ICON_PACK_MISSING')) {
    diagnostics.push({
      code: 'THEME_ICON_PACK_MISSING',
      path: ['iconPackId'],
      message: `Icon pack '${theme.iconPackId}' is not declared as an icon-pack asset.`
    });
  }

  return {
    ok: diagnostics.length === 0,
    assets: diagnostics.length === 0 ? resolved : {},
    diagnostics
  };
}
