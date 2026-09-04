<script lang="ts">
  import { createWidgetActions, type WidgetFrameProjection, type WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetActionRequest } from './WidgetActionMenuController.js';

  let {
    store,
    onfocuswidget
  }: {
    store: WorkbenchStore;
    onfocuswidget?: (frame: WidgetFrameProjection, returnTarget: HTMLElement) => void;
  } = $props();

  let request = $state.raw<WidgetActionRequest>();
  let menu = $state<HTMLElement>();
  let restoreTargetAfterClose = false;
  const actions = $derived(request ? createWidgetActions(store, request.frame.instanceId) : undefined);
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

  export function open(next: WidgetActionRequest) {
    if (!menu) return;
    if (isMenuOpen() && request?.frame.instanceId === next.frame.instanceId && request.anchor === next.anchor) {
      closeMenu();
      return;
    }
    request?.onopenchange?.(false);
    request = next;
    restoreTargetAfterClose = true;
    next.onopenchange?.(true);
    if (typeof menu.showPopover !== 'function') {
      menu.setAttribute('data-fallback-open', '');
      requestAnimationFrame(opened);
      return;
    }
    if (!isMenuOpen()) menu.showPopover();
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
    if (event.key === 'Tab') {
      const focusable = [...menu?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []];
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

  function opened() {
    positionMenu();
    menu?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus({ preventScroll: true });
  }
</script>

<svelte:window onkeydown={handleWindowKey} />

<div
  bind:this={menu}
  class="panel-menu-surface widget-actions-menu"
  data-pom-part="menu.surface"
  data-context-source={request?.source}
  popover="auto"
  role="menu"
  aria-label={request ? `${request.title} Widget actions` : 'Widget actions'}
  ontoggle={handleToggle}
>
  {#if actions}
    {#if currentEdge !== 'left'}<button class="action-dock-left" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('left'))}>Dock left</button>{/if}
    {#if currentEdge !== 'main'}<button class="action-dock-main" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('main'))}>Dock main</button>{/if}
    {#if currentEdge !== 'right'}<button class="action-dock-right" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.dock('right'))}>Dock right</button>{/if}
    {#if currentEdge !== 'floating'}<button class="action-float" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.float())}>Float</button>{/if}
    <button class="action-group" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.groupWithPrevious())}>Group with previous Widget</button>
    {#if onfocuswidget}<button class="action-focus" role="menuitem" data-pom-part="button.surface" type="button" onclick={focus}>Focus Widget</button>{/if}
    <button class="action-remove" role="menuitem" data-pom-part="button.surface" type="button" onclick={() => run(() => actions.shelve())}>Move to Widget Shelf</button>
  {/if}
</div>
