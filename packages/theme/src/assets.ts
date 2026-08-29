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
  const declarations = new Map(theme.assets.map((asset, index) => [asset.id, { asset, index }]));
  const requiredPaths = new Map<string, { readonly kind: ThemeAssetReference['kind']; readonly path: readonly (string | number)[] }[]>();

  const requireAsset = (
    id: string,
    kind: ThemeAssetReference['kind'],
    path: readonly (string | number)[]
  ) => {
    const paths = requiredPaths.get(id) ?? [];
    paths.push({ kind, path });
    requiredPaths.set(id, paths);
  };

  requireAsset(theme.iconPackId, 'icon-pack', ['iconPackId']);
  for (const [materialId, material] of Object.entries(theme.materials)) {
    if (material.texture) {
      requireAsset(material.texture.assetId, 'texture', ['materials', materialId, 'texture', 'assetId']);
    }
  }
  theme.canvas.forEach((layer, index) => {
    if (layer.kind === 'image' || layer.kind === 'texture') {
      requireAsset(layer.assetId, layer.kind, ['canvas', index, 'assetId']);
    }
  });

  for (const [id, usages] of requiredPaths) {
    const declaration = declarations.get(id);
    for (const usage of usages) {
      if (!declaration) {
        diagnostics.push({
          code: id === theme.iconPackId ? 'THEME_ICON_PACK_MISSING' : 'THEME_ASSET_MISSING',
          path: usage.path,
          message: `${usage.kind} '${id}' is referenced but not declared by the theme.`
        });
      } else if (declaration.asset.kind !== usage.kind) {
        diagnostics.push({
          code: 'THEME_ASSET_KIND_MISMATCH',
          path: usage.path,
          message: `Asset '${id}' is declared as ${declaration.asset.kind}, not ${usage.kind}.`
        });
      }
    }
  }

  theme.assets.forEach((asset, index) => {
    if (!asset.fallbackId) return;
    const fallback = declarations.get(asset.fallbackId);
    if (!fallback) {
      diagnostics.push({
        code: 'THEME_ASSET_MISSING',
        path: ['assets', index, 'fallbackId'],
        message: `Fallback asset '${asset.fallbackId}' is not declared by the theme.`
      });
    } else if (fallback.asset.kind !== asset.kind) {
      diagnostics.push({
        code: 'THEME_ASSET_KIND_MISMATCH',
        path: ['assets', index, 'fallbackId'],
        message: `Fallback asset '${asset.fallbackId}' is ${fallback.asset.kind}, not ${asset.kind}.`
      });
    }
  });

  const registrationFor = (
    asset: ThemeAssetReference,
    visited: ReadonlySet<string> = new Set()
  ): ThemeAssetRegistration | undefined => {
    if (visited.has(asset.id)) return undefined;
    const registration = registry[asset.id];
    if (registration) return registration.kind === asset.kind ? registration : undefined;
    if (!asset.fallbackId) return undefined;
    const fallback = declarations.get(asset.fallbackId)?.asset;
    if (!fallback || fallback.kind !== asset.kind) return undefined;
    return registrationFor(fallback, new Set([...visited, asset.id]));
  };

  theme.assets.forEach((asset, index) => {
    const registration = registry[asset.id];
    if (registration && registration.kind !== asset.kind) {
      diagnostics.push({
        code: 'THEME_ASSET_KIND_MISMATCH',
        path: ['assets', index, 'kind'],
        message: `Asset '${asset.id}' is registered as ${registration.kind}, not ${asset.kind}.`
      });
      return;
    }

    const effective = registrationFor(asset);
    if (!effective) {
      const usages = requiredPaths.get(asset.id) ?? [];
      if (asset.required || usages.length > 0) {
        const iconPack = asset.id === theme.iconPackId;
        diagnostics.push({
          code: iconPack ? 'THEME_ICON_PACK_MISSING' : 'THEME_ASSET_MISSING',
          path: iconPack ? ['iconPackId'] : usages[0]?.path ?? ['assets', index, 'id'],
          message: `Required ${asset.kind} '${asset.id}' is not registered by the host.`
        });
      }
      return;
    }
    resolved[asset.id] = { ...effective };
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
