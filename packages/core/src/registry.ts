import {
  WidgetManifestSchema,
  type JsonArray,
  type JsonObject,
  type JsonValue,
  type WidgetManifest,
  type WidgetType
} from '@pomegranate-ui/contracts';

export type RegistryErrorCode = 'DUPLICATE_WIDGET_TYPE' | 'INVALID_MANIFEST';

export interface RegistryError {
  readonly code: RegistryErrorCode;
  readonly message: string;
}

export type RegistryResult =
  | { readonly ok: true; readonly manifest: WidgetManifest }
  | { readonly ok: false; readonly error: RegistryError };

export interface WidgetRegistry {
  register(manifest: unknown): RegistryResult;
  unregister(type: WidgetType): boolean;
  get(type: WidgetType): WidgetManifest | undefined;
  has(type: WidgetType): boolean;
  list(): readonly WidgetManifest[];
}

function cloneAndFreezeJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return Object.freeze((value as JsonArray).map(cloneAndFreezeJson));
  }
  if (value === null || typeof value !== 'object') return value;
  const source = value as JsonObject;
  return Object.freeze(Object.fromEntries(
    Object.keys(source).sort().map((key) => [key, cloneAndFreezeJson(source[key]!)] as const)
  ));
}

function copyManifest(manifest: WidgetManifest): WidgetManifest {
  return Object.freeze({
    type: manifest.type,
    version: manifest.version,
    title: manifest.title,
    capabilities: Object.freeze([...manifest.capabilities]),
    defaultConfiguration: cloneAndFreezeJson(manifest.defaultConfiguration) as JsonObject,
    defaultPlacement: Object.freeze({ ...manifest.defaultPlacement }),
    ...(manifest.catalog
      ? {
          catalog: Object.freeze({
            ...manifest.catalog,
            keywords: Object.freeze([...manifest.catalog.keywords]),
            geometry: Object.freeze({ ...manifest.catalog.geometry }),
            supportedStates: Object.freeze([...manifest.catalog.supportedStates])
          })
        }
      : {})
  });
}

export function createWidgetRegistry(): WidgetRegistry {
  const manifests = new Map<WidgetType, WidgetManifest>();

  return Object.freeze({
    register(input: unknown): RegistryResult {
      const parsed = WidgetManifestSchema.safeParse(input);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: 'INVALID_MANIFEST',
            message: 'Widget manifest does not match the public manifest schema.'
          }
        };
      }
      const manifest = parsed.data as WidgetManifest;
      if (manifests.has(manifest.type)) {
        return {
          ok: false,
          error: {
            code: 'DUPLICATE_WIDGET_TYPE',
            message: `Widget type '${manifest.type}' is already registered.`
          }
        };
      }
      const admitted = copyManifest(manifest);
      manifests.set(admitted.type, admitted);
      return { ok: true, manifest: admitted };
    },

    unregister(type: WidgetType): boolean {
      return manifests.delete(type);
    },

    get(type: WidgetType): WidgetManifest | undefined {
      return manifests.get(type);
    },

    has(type: WidgetType): boolean {
      return manifests.has(type);
    },

    list(): readonly WidgetManifest[] {
      return Object.freeze([...manifests.values()].sort((left, right) => left.type.localeCompare(right.type)));
    }
  });
}
