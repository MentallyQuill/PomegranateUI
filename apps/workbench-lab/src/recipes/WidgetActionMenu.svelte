<script lang="ts">
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import { createWidgetActions, selectPanelSurface, type WidgetFrameProjection, type WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetActionRequest } from './WidgetActionMenuController.js';

  let {
    store,
    onfocuswidget,
    titlefor = (frame: WidgetFrameProjection) => frame.title
  }: {
    store: WorkbenchStore;
    onfocuswidget?: (frame: WidgetFrameProjection, returnTarget: HTMLElement) => void;
    titlefor?: (frame: WidgetFrameProjection) => string;
  } = $props();

  let request = $state.raw<WidgetActionRequest>();
  let menu = $state<HTMLElement>();
  let snapshot = $state<WorkbenchState>();
  let view = $state<'actions' | 'move'>('actions');
  let restoreTargetAfterClose = false;
  const actions = $derived(request ? createWidgetActions(store, request.frame.instanceId) : undefined);
  const surface = $derived(snapshot ? selectPanelSurface(snapshot, store.registry, store.templates) : null);
  const currentEdge = $derived.by(() => {
    const placement = request?.frame.placement;
    if (!placement) return undefined;
    if (placement.kind === 'floating') return 'floating';
    if (placement.kind !== 'docked') return undefined;
    if (placement.regionId === 'stage' || placement.regionId === 'main') return 'main';
    if (placement.regionId === 'focus' || placement.regionId === 'left' || placement.regionId === 'column-1') return 'left';
    if (placement.regionId === 'support' || placement.regionId === 'right') return 'right';
    return undefined;
  });
  const groupTargets = $derived.by(() => {
    const current = request?.frame.placement;
    if (!surface || current?.kind !== 'docked') return [];
    const currentGroupId = current.group?.id;
    return [...surface.docks.left, ...surface.docks.main, ...surface.docks.right]
      .filter((frame) => frame.instanceId !== request?.frame.instanceId
        && frame.placement.kind === 'docked'
        && frame.placement.panelId === current.panelId
        && frame.placement.subPanelId === current.subPanelId
        && (!currentGroupId || frame.placement.group?.id !== currentGroupId))
      .map((frame) => ({ frame, title: titlefor(frame) }));
  });

  $effect(() => {
    snapshot = store.getState();
    return store.subscribe((next) => { snapshot = next; });
  });

  export function open(next: WidgetActionRequest) {
    if (!menu) return;
    if (isMenuOpen() && request?.frame.instanceId === next.frame.instanceId && request.anchor === next.anchor) {
      if (next.source === 'touch') closeMenu();
      else {
        request?.onopenchange?.(false);
        request = next;
        view = 'actions';
        restoreTargetAfterClose = true;
        next.onopenchange?.(true);
        requestAnimationFrame(opened);
      }
      return;
    }
    request?.onopenchange?.(false);
    request = next;
    view = 'actions';
    restoreTargetAfterClose = true;
    next.onopenchange?.(true);
    if (typeof menu.showPopover !== 'function') {
      menu.setAttribute('data-fallback-open', '');
      requestAnimationFrame(opened);
      return;
    }
    if (!isMenuOpen()) {
      try { menu.showPopover(); }
      catch { menu.setAttribute('data-fallback-open', ''); }
      if (!isMenuOpen()) menu.setAttribute('data-fallback-open', '');
    }
    requestAnimationFrame(opened);
  }

  function isMenuOpen() {
    if (!menu) return false;
    try { return menu.matches(':popover-open') || menu.hasAttribute('data-fallback-open'); }
    catch { return menu.hasAttribute('data-fallback-open'); }
  }

  function positionMenu() {
    if (!request || !menu || !isMenuOpen()) return;
    const anchor = request.anchor.getBoundingClientRect();
    const width = Math.min(230, window.innerWidth - 16);
    menu.style.width = `${width}px`;
    const height = menu.getBoundingClientRect().height;
    const requestedLeft = request.source === 'pointer' && request.point
      ? request.point.x
      : anchor.right - width;
    const requestedTop = request.source === 'pointer' && request.point
      ? request.point.y
      : anchor.bottom + 4;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, requestedLeft));
    const top = requestedTop + height <= window.innerHeight - 8
      ? requestedTop
      : Math.max(8, (request.source === 'pointer' && request.point ? request.point.y : anchor.top) - height - 4);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function restoreFocus() {
    const targetId = request?.frame.instanceId;
    const anchor = request?.anchor;
    const fallback = targetId
      ? document.querySelector<HTMLElement>(`[data-focus-widget-for="${CSS.escape(targetId)}"]`)
      : null;
    queueMicrotask(() => (anchor?.isConnected ? anchor : fallback)?.focus());
  }

  function closeMenu(restore = true) {
    restoreTargetAfterClose = restore;
    if (menu && typeof menu.hidePopover !== 'function') {
      menu.removeAttribute('data-fallback-open');
      request?.onopenchange?.(false);
      if (restore) restoreFocus();
      restoreTargetAfterClose = false;
    } else if (isMenuOpen()) menu?.hidePopover();
  }

  function run(action: () => void) {
    action();
    closeMenu();
  }

  function show(next: 'actions' | 'move') {
    view = next;
    requestAnimationFrame(opened);
  }

  function groupWith(target: WidgetFrameProjection) {
    const placement = target.placement;
    if (!request || placement.kind !== 'docked') return;
    run(() => store.dispatch({
      type: 'widget.group',
      instanceId: request!.frame.instanceId,
      targetInstanceId: target.instanceId,
      groupId: placement.group?.id ?? `group-${target.instanceId}`
    }));
  }

  function focus() {
    const target = request;
    if (!target || !onfocuswidget) return;
    closeMenu(false);
    onfocuswidget(target.frame, target.anchor);
  }

  function handleToggle(event: ToggleEvent) {
    if (event.newState !== 'open') {
      request?.onopenchange?.(false);
      if (restoreTargetAfterClose) restoreFocus();
      restoreTargetAfterClose = false;
    }
  }

  function handleWindowKey(event: KeyboardEvent) {
    if (!isMenuOpen()) return;
    const focusable = [...menu?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []];
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      if (!focusable.length) return;
      event.preventDefault();
      const current = focusable.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? focusable.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1 + focusable.length) % focusable.length
            : (current - 1 + focusable.length) % focusable.length;
      focusable[next]?.focus();
      return;
    }
    if (event.key === 'Tab') {
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeMenu(true);
  }

  function handleWindowPointerDown(event: PointerEvent) {
    if (!isMenuOpen() || !(event.target instanceof Node)) return;
    if (menu?.contains(event.target) || request?.anchor.contains(event.target)) return;
    restoreTargetAfterClose = false;
    if (typeof menu?.hidePopover !== 'function') closeMenu(false);
  }

  function opened() {
    positionMenu();
    menu?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus({ preventScroll: true });
  }
</script>

<svelte:window onkeydown={handleWindowKey} onpointerdown={handleWindowPointerDown} />

<div
  bind:this={menu}
  class="panel-menu-surface widget-actions-menu"
  data-pom-part="menu.surface"
  data-context-source={request?.source}
  popover="auto"
  role="menu"
  aria-label={request ? `${request.title} Widget ${view}` : 'Widget actions'}
  ontoggle={handleToggle}
>
  {#if actions}
    {#if view === 'actions'}
      {#if onfocuswidget}<button class="action-focus" role="menuitem" data-pom-part="button.surface" type="button" onclick={focus}>Focus</button>{/if}
      <button class="action-move" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => show('move')}>Move…</button>
      <hr />
      <button class="action-remove" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.shelve())}>Remove</button>
    {:else}
      <button class="action-back" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => show('actions')}>Back to Widget actions</button>
      <hr />
      {#if currentEdge !== 'left'}<button class="action-dock-left" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('left'))}>Dock left</button>{/if}
      {#if currentEdge !== 'main'}<button class="action-dock-main" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('main'))}>Dock main</button>{/if}
      {#if currentEdge !== 'right'}<button class="action-dock-right" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('right'))}>Dock right</button>{/if}
      {#if currentEdge !== 'floating'}<button class="action-float" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.float())}>Float</button>{/if}
      {#each groupTargets as target (target.frame.instanceId)}
        <button class="action-group" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => groupWith(target.frame)}>Group with {target.title}</button>
      {/each}
    {/if}
  {/if}
</div>
