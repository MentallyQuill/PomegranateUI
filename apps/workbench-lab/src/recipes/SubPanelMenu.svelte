<script lang="ts">
  import type { PanelId, PanelState, SubPanelId, SubPanelState } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  import type { SubPanelDialogRequest, SubPanelDialogMode } from './SubPanelDialog.svelte';
  import type { TabRailContextRequest } from './TabRailController.js';

  let {
    store,
    onrequest,
    onduplicate,
    onreordersubpanels
  }: {
    store: WorkbenchStore;
    onrequest: (request: SubPanelDialogRequest) => void;
    onduplicate: (panelId: PanelId, subPanelId: SubPanelId) => void;
    onreordersubpanels: (panelId: PanelId, subPanelId: SubPanelId, anchor: HTMLElement) => void;
  } = $props();

  let panel = $state<PanelState>();
  let target = $state<SubPanelState>();
  let targetAnchor = $state<HTMLElement>();
  let source = $state<TabRailContextRequest['source']>('pointer');
  let menu = $state<HTMLElement>();
  let restoreTargetAfterClose = false;

  export function open(
    panelId: PanelId,
    subPanelId: SubPanelId,
    anchor: HTMLElement,
    requestSource: TabRailContextRequest['source']
  ) {
    const nextPanel = store.getState().panels.find((candidate) => candidate.id === panelId);
    const nextTarget = nextPanel?.subPanels?.find((candidate) => candidate.id === subPanelId);
    if (!nextPanel || !nextTarget || !menu) return;
    panel = nextPanel;
    target = nextTarget;
    targetAnchor = anchor;
    source = requestSource;
    restoreTargetAfterClose = true;
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

  function restoreFocus() {
    const fallback = document.querySelector<HTMLElement>(
      '[role="tablist"][aria-label$="sub-panels"] [role="tab"][aria-selected="true"]'
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

  function request(mode: SubPanelDialogMode) {
    if (!panel || !target || !targetAnchor) return;
    const invokingTab = targetAnchor;
    closeMenu(false);
    onrequest({ mode, panelId: panel.id, subPanelId: target.id, invokingTab });
  }

  function duplicate() {
    if (!panel || !target) return;
    onduplicate(panel.id, target.id);
    closeMenu(true);
  }

  function reorder() {
    if (!panel || !target || !targetAnchor) return;
    const anchor = targetAnchor;
    closeMenu(false);
    onreordersubpanels(panel.id, target.id, anchor);
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
    menu?.querySelector<HTMLButtonElement>('button')?.focus();
  }
</script>

<svelte:window onkeydown={handleWindowKey} onpointerdown={handleWindowPointer} />

<div
  bind:this={menu}
  class="panel-menu-surface sub-panel-menu-surface"
  data-pom-part="menu.surface"
  data-context-source={source}
  popover="auto"
  role="dialog"
  aria-label={target ? `${target.name} sub-panel actions` : 'Sub-panel actions'}
  ontoggle={handleToggle}
>
  {#if target}
    <button type="button" onclick={() => request('rename')}>Rename</button>
    <button type="button" onclick={duplicate}>Duplicate</button>
    <button type="button" onclick={() => request('layout')}>Change layout</button>
    <button type="button" onclick={() => request('move')}>Move Widgets</button>
    <button type="button" onclick={() => request('delete')}>Delete</button>
    <button type="button" onclick={reorder}>Reorder sub-panels…</button>
  {/if}
</div>
