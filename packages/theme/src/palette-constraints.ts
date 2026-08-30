import { THEME_COLOR_ROLES, type ThemeColorRole } from '@pomegranate-ui/contracts';

import { hexToHsv } from './color.js';

const EXACT_HEX = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
const CONSTRAINT_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const COLOR_ROLES = new Set<string>(THEME_COLOR_ROLES);

export interface ThemePaletteHueExclusion {
  readonly fromDeg: number;
  readonly toDeg: number;
  readonly minimumSaturation: number;
}

export interface ThemePaletteRoleGroupConstraint {
  readonly id: string;
  readonly roles: readonly ThemeColorRole[];
  readonly maximumSaturation?: number;
  readonly hueExclusions?: readonly ThemePaletteHueExclusion[];
}

export type ThemePaletteDiagnosticCode =
  | 'THEME_PALETTE_CONSTRAINT_INVALID'
  | 'THEME_PALETTE_ROLE_UNKNOWN'
  | 'THEME_PALETTE_COLOR_UNRESOLVED'
  | 'THEME_PALETTE_SATURATION_EXCEEDED'
  | 'THEME_PALETTE_HUE_EXCLUDED';

export interface ThemePaletteDiagnostic {
  readonly code: ThemePaletteDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly groupId?: string;
  readonly role?: string;
  readonly hue?: number;
  readonly saturation?: number;
  readonly maximumSaturation?: number;
}

export type ThemePaletteValidation =
  | { readonly ok: true; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemePaletteDiagnostic[] };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function normalized(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function degrees(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 360;
}

function validateConstraints(constraints: unknown): ThemePaletteDiagnostic[] {
  const diagnostics: ThemePaletteDiagnostic[] = [];
  if (!Array.isArray(constraints)) {
    diagnostics.push({
      code: 'THEME_PALETTE_CONSTRAINT_INVALID',
      path: ['constraints'],
      message: 'Palette constraints must be an array.'
    });
    return diagnostics;
  }
  const ids = new Set<string>();
  for (const [groupIndex, groupValue] of constraints.entries()) {
    const path = ['constraints', groupIndex] as const;
    if (groupValue === null || typeof groupValue !== 'object' || Array.isArray(groupValue)) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path,
        message: 'Palette constraint role groups must be objects.'
      });
      continue;
    }
    const group = groupValue as Partial<ThemePaletteRoleGroupConstraint>;
    const idValid = typeof group.id === 'string' && CONSTRAINT_ID.test(group.id);
    if (!idValid) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path: [...path, 'id'],
        message: 'Palette constraint IDs must use lower-case kebab case.'
      });
    } else if (ids.has(group.id)) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path: [...path, 'id'],
        message: `Palette constraint ID '${group.id}' is duplicated.`,
        groupId: group.id
      });
    } else {
      ids.add(group.id);
    }

    if (!Array.isArray(group?.roles) || group.roles.length === 0) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path: [...path, 'roles'],
        message: 'Palette constraint role groups must contain at least one ThemeColorRole.',
        ...(idValid ? { groupId: group.id } : {})
      });
    } else {
      for (const [roleIndex, role] of group.roles.entries()) {
        if (typeof role !== 'string' || !COLOR_ROLES.has(role)) {
          diagnostics.push({
            code: 'THEME_PALETTE_ROLE_UNKNOWN',
            path: [...path, 'roles', roleIndex],
            message: `Palette constraint role '${String(role)}' is not a ThemeColorRole.`,
            ...(idValid ? { groupId: group.id } : {}),
            role: String(role)
          });
        }
      }
    }

    if (group.maximumSaturation !== undefined && !normalized(group.maximumSaturation)) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path: [...path, 'maximumSaturation'],
        message: 'Maximum saturation must be a finite number between zero and one.',
        ...(idValid ? { groupId: group.id } : {})
      });
    }

    if (group.hueExclusions !== undefined && !Array.isArray(group.hueExclusions)) {
      diagnostics.push({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path: [...path, 'hueExclusions'],
        message: 'Hue exclusions must be an array.',
        ...(idValid ? { groupId: group.id } : {})
      });
      continue;
    }
    for (const [exclusionIndex, exclusion] of (group.hueExclusions ?? []).entries()) {
      const exclusionPath = [...path, 'hueExclusions', exclusionIndex] as const;
      if (exclusion === null || typeof exclusion !== 'object' || Array.isArray(exclusion)) {
        diagnostics.push({
          code: 'THEME_PALETTE_CONSTRAINT_INVALID',
          path: exclusionPath,
          message: 'Hue exclusions must be objects.',
          ...(idValid ? { groupId: group.id } : {})
        });
        continue;
      }
      if (!degrees(exclusion.fromDeg)) {
        diagnostics.push({
          code: 'THEME_PALETTE_CONSTRAINT_INVALID',
          path: [...exclusionPath, 'fromDeg'],
          message: 'Hue exclusion start must be a finite number between zero and 360 degrees.',
          ...(idValid ? { groupId: group.id } : {})
        });
      }
      if (!degrees(exclusion.toDeg)) {
        diagnostics.push({
          code: 'THEME_PALETTE_CONSTRAINT_INVALID',
          path: [...exclusionPath, 'toDeg'],
          message: 'Hue exclusion end must be a finite number between zero and 360 degrees.',
          ...(idValid ? { groupId: group.id } : {})
        });
      }
      if (!normalized(exclusion.minimumSaturation)) {
        diagnostics.push({
          code: 'THEME_PALETTE_CONSTRAINT_INVALID',
          path: [...exclusionPath, 'minimumSaturation'],
          message: 'Hue exclusion minimum saturation must be a finite number between zero and one.',
          ...(idValid ? { groupId: group.id } : {})
        });
      }
    }
  }
  return diagnostics;
}

function hueIsExcluded(hue: number, exclusion: ThemePaletteHueExclusion): boolean {
  return exclusion.fromDeg <= exclusion.toDeg
    ? hue >= exclusion.fromDeg && hue <= exclusion.toDeg
    : hue >= exclusion.fromDeg || hue <= exclusion.toDeg;
}

export function validateThemePalette(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  constraints: readonly ThemePaletteRoleGroupConstraint[]
): ThemePaletteValidation {
  const configurationDiagnostics = validateConstraints(constraints);
  if (configurationDiagnostics.length > 0) {
    return deepFreeze({ ok: false as const, diagnostics: configurationDiagnostics });
  }

  const diagnostics: ThemePaletteDiagnostic[] = [];
  for (const [groupIndex, group] of constraints.entries()) {
    for (const [roleIndex, role] of group.roles.entries()) {
      const source = colors !== null && typeof colors === 'object' ? colors[role] : undefined;
      const path = ['constraints', groupIndex, 'roles', roleIndex] as const;
      if (typeof source !== 'string' || !EXACT_HEX.test(source)) {
        diagnostics.push({
          code: 'THEME_PALETTE_COLOR_UNRESOLVED',
          path: ['colors', role],
          message: `Palette role '${role}' does not resolve to an exact #RRGGBB or #RRGGBBAA value.`,
          groupId: group.id,
          role
        });
        continue;
      }
      const color = hexToHsv(source.slice(0, 7));
      if (group.maximumSaturation !== undefined && color.saturation > group.maximumSaturation) {
        diagnostics.push({
          code: 'THEME_PALETTE_SATURATION_EXCEEDED',
          path,
          message: `Palette role '${role}' saturation ${color.saturation} exceeds ${group.maximumSaturation}.`,
          groupId: group.id,
          role,
          hue: color.hue,
          saturation: color.saturation,
          maximumSaturation: group.maximumSaturation
        });
      }
      for (const exclusion of group.hueExclusions ?? []) {
        if (color.saturation >= exclusion.minimumSaturation && hueIsExcluded(color.hue, exclusion)) {
          diagnostics.push({
            code: 'THEME_PALETTE_HUE_EXCLUDED',
            path,
            message: `Palette role '${role}' hue ${color.hue} is excluded by '${group.id}'.`,
            groupId: group.id,
            role,
            hue: color.hue,
            saturation: color.saturation
          });
        }
      }
    }
  }

  return diagnostics.length === 0
    ? deepFreeze({ ok: true as const, diagnostics: [] as const })
    : deepFreeze({ ok: false as const, diagnostics });
}
