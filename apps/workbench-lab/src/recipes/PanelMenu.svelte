<script lang="ts">
  import type { PanelId, PanelState } from '@pomegranate-ui/contracts';
  import { asPanelId, asWidgetInstanceId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  import type { TabRailContextRequest } from './TabRailController.js';

  let {
    store,
    onaddsubpanel,
    onreorderpanels
  }: {
    store: WorkbenchStore;
    onaddsubpanel?: ((panelId: PanelId) => void) | undefined;
    onreorderpanels?: ((panelId: PanelId, anchor: HTMLElement) => void) | undefined;
  } = $props();

  let name = $state('');
  let target = $state<PanelState>();
  let targetAnchor = $state<HTMLElement>();
  let source = $state<TabRailContextRequest['source']>('pointer');
  let menu = $state<HTMLElement>();
  let nameInput = $state<HTMLInputElement>();
  let restoreTargetAfterClose = false;
  const mayCreateFirstSubPanel = $derived(Boolean(target && !target.subPanels?.length));

  export function open(panelId: PanelId, anchor: HTMLElement, requestSource: TabRailContextRequest['source']) {
    const panel = store.getState().panels.find((candidate) => candidate.id === panelId);
    if (!panel || !menu) return;
    target = panel;
    targetAnchor = anchor;
    source = requestSource;
    name = panel.name;
    restoreTargetAfterClose = true;
    if (typeof menu.showPopover !== 'function') {
      menu.setAttribute('data-fallback-open', '');
      requestAnimationFrame(opened);
      return;
    }
    if (!isMenuOpen()) menu.showPopover();
    requestAnimationFrame(opened);
  }

  function duplicate(panel: PanelState) {
    const state = store.getState();
    const suffix = state.revision + 1;
    const widgetIds: Record<string, ReturnType<typeof asWidgetInstanceId>> = {};
    const shelfIds: Record<string, string> = {};
    const groupIds: Record<string, string> = {};
    for (const shelf of state.shelves.filter((candidate) => candidate.panelId === panel.id)) {
      shelfIds[shelf.id] = `${shelf.id}-copy-${suffix}`;
    }
    for (const [instanceId, placement] of Object.entries(state.placements)) {
      if (placement.panelId !== panel.id) continue;
      widgetIds[instanceId] = asWidgetInstanceId(`${instanceId}-copy-${suffix}`);
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      if (visible.kind === 'docked' && visible.group) {
        groupIds[visible.group.id] = `${visible.group.id}-copy-${suffix}`;
      }
    }
    store.dispatch({
      type: 'panel.duplicate', panelId: panel.id, name: `${panel.name} Copy`,
      ids: { panelId: asPanelId(`panel-copy-${suffix}`), shelfIds, widgetIds, groupIds }
    });
  }

  function destructive(type: 'panel.clear' | 'panel.delete', panel: PanelState) {
    if (window.confirm(`${type === 'panel.clear' ? 'Clear' : 'Delete'} ${panel.name}?`)) {
      store.dispatch({ type, panelId: panel.id });
    }
  }

  function positionMenu() {
    if (!targetAnchor || !menu || !isMenuOpen()) return;
    const anchor = targetAnchor.getBoundingClientRect();
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

  function restoreFocus() {
    const fallback = document.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="Panels"] [role="tab"][aria-selected="true"]'
    );
    queueMicrotask(() => (targetAnchor?.isConnected ? targetAnchor : fallback)?.focus());
  }

  function closeMenu(restore = true) {
    restoreTargetAfterClose = restore;
    if (menu && typeof menu.hidePopover !== 'function') {
      menu.removeAttribute('data-fallback-open');
      if (restore) restoreFocus();
      restoreTargetAfterClose = false;
    } else if (isMenuOpen()) menu?.hidePopover();
  }

  function run(action: (panel: PanelState) => void) {
    const panel = target;
    if (!panel) return;
    action(panel);
    closeMenu();
  }

  function reorder() {
    const panel = target;
    const anchor = targetAnchor;
    if (!panel || !anchor) return;
    if (!onreorderpanels) {
      closeMenu();
      return;
    }
    closeMenu(false);
    onreorderpanels(panel.id, anchor);
  }

  function handleToggle(event: ToggleEvent) {
    if (event.newState === 'open') requestAnimationFrame(opened);
    else {
      if (restoreTargetAfterClose) restoreFocus();
      restoreTargetAfterClose = false;
    }
  }

  function handleWindowKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !isMenuOpen()) return;
    event.preventDefault();
    closeMenu(true);
  }

  function handleWindowPointer(event: PointerEvent) {
    if (!isMenuOpen() || menu?.contains(event.target as Node)) return;
    restoreTargetAfterClose = false;
  }

  function opened() {
    positionMenu();
    nameInput?.focus();
    nameInput?.select();
  }
</script>

<svelte:window onkeydown={handleWindowKey} onpointerdown={handleWindowPointer} />

<div
  bind:this={menu}
  id="panel-menu"
  class="panel-menu-surface"
  data-pom-part="menu.surface"
  data-context-source={source}
  popover="auto"
  role="dialog"
  aria-label={target ? `${target.name} Panel actions` : 'Panel actions'}
  ontoggle={handleToggle}
>
  {#if target}
    <label>Panel name<input bind:this={nameInput} bind:value={name} /></label>
    <button type="button" onclick={() => run((panel) => store.dispatch({ type: 'panel.rename', panelId: panel.id, name: name.trim() || panel.name }))}>Rename</button>
    <button type="button" onclick={() => run(duplicate)}>Duplicate</button>
    {#if mayCreateFirstSubPanel}
      <button type="button" onclick={() => run((panel) => onaddsubpanel?.(panel.id))}>Create first sub-panel</button>
    {/if}
    <button type="button" onclick={() => run((panel) => store.dispatch({ type: 'panel.reset', panelId: panel.id }))}>Reset</button>
    <button type="button" onclick={() => run((panel) => destructive('panel.clear', panel))}>Clear</button>
    <button type="button" onclick={() => run((panel) => destructive('panel.delete', panel))}>Delete</button>
    <button type="button" onclick={reorder}>Reorder Panels…</button>
  {/if}
</div>
