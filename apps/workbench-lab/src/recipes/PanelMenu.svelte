<script lang="ts">
  import type { PanelState } from '@pomegranate-ui/contracts';
  import { asPanelId, asWidgetInstanceId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let {
    panel,
    store,
    moveLeft,
    moveRight,
    onaddsubpanel,
    moveLeftDisabled = false,
    moveRightDisabled = false
  }: {
    panel: PanelState;
    store: WorkbenchStore;
    moveLeft: () => void;
    moveRight: () => void;
    onaddsubpanel?: (() => void) | undefined;
    moveLeftDisabled?: boolean;
    moveRightDisabled?: boolean;
  } = $props();

  let name = $state('');
  let trigger = $state<HTMLButtonElement>();
  let menu = $state<HTMLElement>();
  let open = $state(false);
  const menuId = $derived(`panel-menu-${panel.id}`);
  const mayCreateFirstSubPanel = $derived(!panel.subPanels?.length);
  $effect(() => { name = panel.name; });

  function duplicate() {
    const state = store.getState();
    const suffix = state.revision + 1;
    const widgetIds: Record<string, ReturnType<typeof asWidgetInstanceId>> = {};
    const shelfIds: Record<string, string> = {};
    const groupIds: Record<string, string> = {};
    for (const shelf of state.shelves.filter((candidate) => candidate.panelId === panel.id)) shelfIds[shelf.id] = `${shelf.id}-copy-${suffix}`;
    for (const [instanceId, placement] of Object.entries(state.placements)) {
      if (placement.panelId !== panel.id) continue;
      widgetIds[instanceId] = asWidgetInstanceId(`${instanceId}-copy-${suffix}`);
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      if (visible.kind === 'docked' && visible.group) groupIds[visible.group.id] = `${visible.group.id}-copy-${suffix}`;
    }
    store.dispatch({
      type: 'panel.duplicate', panelId: panel.id, name: `${panel.name} Copy`,
      ids: { panelId: asPanelId(`panel-copy-${suffix}`), shelfIds, widgetIds, groupIds }
    });
  }

  function destructive(type: 'panel.clear' | 'panel.delete') {
    if (window.confirm(`${type === 'panel.clear' ? 'Clear' : 'Delete'} ${panel.name}?`)) store.dispatch({ type, panelId: panel.id });
  }

  function positionMenu() {
    if (!trigger || !menu || !isMenuOpen()) return;
    const anchor = trigger.getBoundingClientRect();
    const width = Math.min(230, window.innerWidth - 16);
    menu.style.width = `${width}px`;
    const height = menu.getBoundingClientRect().height;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, anchor.right - width));
    const below = anchor.bottom + 4;
    const top = below + height <= window.innerHeight - 8
      ? below
      : Math.max(8, anchor.top - height - 4);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function isMenuOpen() {
    if (!menu) return false;
    try { return menu.matches(':popover-open') || menu.hasAttribute('data-fallback-open'); }
    catch { return menu.hasAttribute('data-fallback-open'); }
  }

  function toggleMenu() {
    if (!menu) return;
    if (typeof menu.showPopover !== 'function') {
      open = !open;
      menu.toggleAttribute('data-fallback-open', open);
      if (open) requestAnimationFrame(positionMenu);
    } else if (isMenuOpen()) menu.hidePopover();
    else {
      menu.showPopover();
      requestAnimationFrame(positionMenu);
    }
  }

  function closeMenu(restoreFocus = true) {
    if (menu && typeof menu.hidePopover !== 'function') {
      menu.removeAttribute('data-fallback-open');
      open = false;
    } else if (isMenuOpen()) menu?.hidePopover();
    if (restoreFocus) queueMicrotask(() => trigger?.focus());
  }

  function run(action: () => void) {
    action();
    closeMenu();
  }

  function handleToggle(event: ToggleEvent) {
    open = event.newState === 'open';
    if (open) requestAnimationFrame(positionMenu);
    else if (document.activeElement === document.body) queueMicrotask(() => trigger?.focus());
  }
</script>

<div class="panel-menu">
  <button
    bind:this={trigger}
    class="panel-menu-trigger"
    type="button"
    aria-label={`Manage ${panel.name}`}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls={menuId}
    onclick={toggleMenu}
  >•••</button>
  <div
    bind:this={menu}
    id={menuId}
    class="panel-menu-surface"
    popover="auto"
    role="menu"
    aria-label={`${panel.name} Panel actions`}
    ontoggle={handleToggle}
  >
    <button type="button" role="menuitem" aria-label={`Move ${panel.name} left`} disabled={moveLeftDisabled} onclick={() => run(moveLeft)}>Move left</button>
    <button type="button" role="menuitem" aria-label={`Move ${panel.name} right`} disabled={moveRightDisabled} onclick={() => run(moveRight)}>Move right</button>
    <label>Panel name<input bind:value={name} /></label>
    <button type="button" role="menuitem" onclick={() => run(() => store.dispatch({ type: 'panel.rename', panelId: panel.id, name: name.trim() || panel.name }))}>Rename</button>
    <button type="button" role="menuitem" onclick={() => run(duplicate)}>Duplicate</button>
    {#if mayCreateFirstSubPanel}
      <button type="button" role="menuitem" onclick={() => run(() => onaddsubpanel?.())}>Create first sub-panel</button>
    {/if}
    <button type="button" role="menuitem" onclick={() => run(() => store.dispatch({ type: 'panel.reset', panelId: panel.id }))}>Reset</button>
    <button type="button" role="menuitem" onclick={() => run(() => destructive('panel.clear'))}>Clear</button>
    <button type="button" role="menuitem" onclick={() => run(() => destructive('panel.delete'))}>Delete</button>
  </div>
</div>
