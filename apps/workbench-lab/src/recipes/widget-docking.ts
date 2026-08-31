export interface DockPoint {
  readonly x: number;
  readonly y: number;
}

export interface DockRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface DockOwner {
  readonly panelId: string;
  readonly subPanelId?: string;
  readonly lane?: number;
  readonly regionId: string;
}

export type ShelfRailKind = 'before' | 'between' | 'after' | 'append';

export type DockTarget = DockOwner & {
  readonly id: string;
  readonly kind: 'widget' | 'group-header' | 'rail' | 'region';
  readonly rect: DockRect;
  readonly previewRect?: DockRect;
  readonly headerRect?: DockRect;
  readonly bodyRect?: DockRect;
  readonly shelfId?: string;
  readonly order?: number;
  readonly targetInstanceId?: string;
  readonly groupId?: string;
  readonly railKind?: ShelfRailKind;
  readonly insertOrder?: number;
  readonly empty?: boolean;
  readonly label?: string;
};

export type DockIntentKind = 'tab' | 'insert-before' | 'insert-after' | 'shelf' | 'region';

export interface DockIntent extends DockOwner {
  readonly key: string;
  readonly kind: DockIntentKind;
  readonly targetId: string;
  readonly targetRect: DockRect;
  readonly previewRect: DockRect;
  readonly shelfId?: string;
  readonly order?: number;
  readonly targetInstanceId?: string;
  readonly groupId?: string;
  readonly railKind?: ShelfRailKind;
  readonly insertOrder?: number;
  readonly label: string;
}

export interface ShelfGeometry {
  readonly id: string;
  readonly order: number;
  readonly rect: DockRect;
}

const minimumRailSize = 12;

function contains(rect: DockRect, point: DockPoint, inset = 0): boolean {
  return point.x >= rect.x - inset
    && point.x <= rect.x + rect.width + inset
    && point.y >= rect.y - inset
    && point.y <= rect.y + rect.height + inset;
}

function previewSlice(rect: DockRect, from: number, to: number): DockRect {
  return {
    x: rect.x,
    y: rect.y + rect.height * from,
    width: rect.width,
    height: Math.max(minimumRailSize, rect.height * (to - from))
  };
}

function targetLabel(target: DockTarget): string {
  return target.label ?? target.targetInstanceId ?? target.regionId;
}

function intentFromTarget(point: DockPoint, target: DockTarget): DockIntent | null {
  const base = {
    panelId: target.panelId,
    ...(target.subPanelId === undefined ? {} : { subPanelId: target.subPanelId }),
    ...(target.lane === undefined ? {} : { lane: target.lane }),
    regionId: target.regionId,
    targetId: target.id,
    ...(target.shelfId === undefined ? {} : { shelfId: target.shelfId }),
    ...(target.order === undefined ? {} : { order: target.order }),
    ...(target.targetInstanceId === undefined ? {} : { targetInstanceId: target.targetInstanceId }),
    ...(target.groupId === undefined ? {} : { groupId: target.groupId })
  };

  if (target.kind === 'group-header' && contains(target.rect, point)) {
    return {
      ...base,
      key: `${target.id}:tab`,
      kind: 'tab',
      targetRect: target.rect,
      previewRect: target.rect,
      label: `Group with ${targetLabel(target)}`
    };
  }

  if (target.kind === 'rail' && contains(target.rect, point)) {
    return {
      ...base,
      key: `${target.id}:${target.railKind ?? 'append'}`,
      kind: 'shelf',
      targetRect: target.rect,
      previewRect: target.previewRect ?? target.rect,
      ...(target.railKind === undefined ? {} : { railKind: target.railKind }),
      ...(target.insertOrder === undefined ? {} : { insertOrder: target.insertOrder }),
      label: target.label ?? 'Create shelf'
    };
  }

  if (target.kind === 'widget') {
    const header = target.headerRect;
    if (header && contains(header, point)) {
      return {
        ...base,
        key: `${target.id}:tab`,
        kind: 'tab',
        targetRect: header,
        previewRect: header,
        label: `Group with ${targetLabel(target)}`
      };
    }
    const body = target.bodyRect ?? target.rect;
    if (!contains(body, point)) return null;
    const ratio = body.height <= 0 ? .5 : (point.y - body.y) / body.height;
    if (ratio < .25) {
      const zone = previewSlice(body, 0, .25);
      return {
        ...base,
        key: `${target.id}:before`,
        kind: 'insert-before',
        targetRect: zone,
        previewRect: zone,
        label: `Insert before ${targetLabel(target)}`
      };
    }
    if (ratio > .75) {
      const zone = previewSlice(body, .75, 1);
      return {
        ...base,
        key: `${target.id}:after`,
        kind: 'insert-after',
        targetRect: zone,
        previewRect: zone,
        label: `Insert after ${targetLabel(target)}`
      };
    }
    const zone = previewSlice(body, .25, .75);
    return {
      ...base,
      key: `${target.id}:tab`,
      kind: 'tab',
      targetRect: zone,
      previewRect: zone,
      label: `Group with ${targetLabel(target)}`
    };
  }

  if (target.kind === 'region' && target.empty && contains(target.rect, point)) {
    return {
      ...base,
      key: `${target.id}:region`,
      kind: 'region',
      targetRect: target.rect,
      previewRect: target.rect,
      label: target.label ?? `Dock in ${target.regionId}`
    };
  }

  return null;
}

const targetPriority: Readonly<Record<DockTarget['kind'], number>> = Object.freeze({
  'group-header': 0,
  rail: 1,
  widget: 2,
  region: 3
});

export function resolveDockIntent(point: DockPoint, targets: readonly DockTarget[]): DockIntent | null {
  const ordered = [...targets].sort((left, right) => targetPriority[left.kind] - targetPriority[right.kind]);
  for (const target of ordered) {
    const intent = intentFromTarget(point, target);
    if (intent) return intent;
  }
  return null;
}

export function stabilizeDockIntent(
  point: DockPoint,
  previous: DockIntent | null,
  next: DockIntent | null,
  hysteresis = 10
): DockIntent | null {
  if (!previous || next?.key === previous.key) return next;
  return contains(previous.targetRect, point, hysteresis) ? previous : next;
}

function railRect(region: DockRect, centerY: number, height = minimumRailSize): DockRect {
  const boundedHeight = Math.max(minimumRailSize, height);
  return {
    x: region.x,
    y: Math.max(region.y, Math.min(region.y + region.height - boundedHeight, centerY - boundedHeight / 2)),
    width: region.width,
    height: boundedHeight
  };
}

function railPreviewRect(region: DockRect, centerY: number): DockRect {
  const height = Math.min(region.height, Math.max(72, Math.min(112, region.height * .18)));
  return {
    x: region.x,
    y: Math.max(region.y, Math.min(region.y + region.height - height, centerY - height / 2)),
    width: region.width,
    height
  };
}

export function dockRevealSide(
  point: DockPoint,
  surface: DockRect,
  edgeDistance = 34
): 'left' | 'right' | null {
  if (point.y < surface.y || point.y > surface.y + surface.height) return null;
  if (point.x >= surface.x && point.x <= surface.x + edgeDistance) return 'left';
  if (point.x <= surface.x + surface.width && point.x >= surface.x + surface.width - edgeDistance) return 'right';
  return null;
}

export function buildShelfRails(
  region: DockRect,
  shelves: readonly ShelfGeometry[],
  owner: DockOwner
): readonly DockTarget[] {
  const ordered = [...shelves].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  if (ordered.length === 0) return [];
  const targets: DockTarget[] = [];
  const first = ordered[0]!;
  targets.push({
    ...owner,
    id: `rail:${owner.regionId}:before:${first.id}`,
    kind: 'rail',
    rect: railRect(region, first.rect.y - 6),
    previewRect: railPreviewRect(region, first.rect.y),
    railKind: 'before',
    insertOrder: 0,
    label: 'New shelf before'
  });
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const next = ordered[index]!;
    targets.push({
      ...owner,
      id: `rail:${owner.regionId}:between:${previous.id}:${next.id}`,
      kind: 'rail',
      rect: railRect(region, (previous.rect.y + previous.rect.height + next.rect.y) / 2),
      previewRect: railPreviewRect(region, (previous.rect.y + previous.rect.height + next.rect.y) / 2),
      railKind: 'between',
      insertOrder: index,
      label: 'New shelf between'
    });
  }
  const last = ordered.at(-1)!;
  targets.push({
    ...owner,
    id: `rail:${owner.regionId}:after:${last.id}`,
    kind: 'rail',
    rect: railRect(region, Math.min(last.rect.y + last.rect.height + 6, region.y + region.height - 28)),
    previewRect: railPreviewRect(region, last.rect.y + last.rect.height),
    railKind: 'after',
    insertOrder: ordered.length,
    label: 'New shelf after'
  });
  targets.push({
    ...owner,
    id: `rail:${owner.regionId}:append`,
    kind: 'rail',
    rect: railRect(region, region.y + region.height - 8, 16),
    previewRect: railPreviewRect(region, region.y + region.height),
    railKind: 'append',
    insertOrder: ordered.length,
    label: 'Append shelf'
  });
  return targets;
}

export function clampHeldRect(
  pointer: DockPoint,
  grabOffset: DockPoint,
  size: Pick<DockRect, 'width' | 'height'>,
  viewport: DockRect,
  margin = 8
): DockRect {
  const maximumX = viewport.x + Math.max(margin, viewport.width - size.width - margin);
  const maximumY = viewport.y + Math.max(margin, viewport.height - size.height - margin);
  return {
    x: Math.max(viewport.x + margin, Math.min(maximumX, pointer.x - grabOffset.x)),
    y: Math.max(viewport.y + margin, Math.min(maximumY, pointer.y - grabOffset.y)),
    width: size.width,
    height: size.height
  };
}
