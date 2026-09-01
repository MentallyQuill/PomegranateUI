<script lang="ts">
  import { tick } from 'svelte';
  import type { PanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';
  import PanelMenu from './PanelMenu.svelte';
  import TabOrderDialog, { type TabOrderItem } from './TabOrderDialog.svelte';
  import {
    createTabRailController,
    type TabRailContextRequest,
    type TabRailController
  } from './TabRailController.js';

  let {
    store,
    onaddsubpanel,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onaddsubpanel?: ((panelId: PanelId) => void) | undefined;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    workbench = current.getState();
    return current.subscribe((next) => { workbench = next; });
  });
  const tabs = $derived(workbench ? selectPanelTabs(workbench) : []);
  let tablist = $state<HTMLElement>();
  let menu = $state<{
    open: (panelId: PanelId, anchor: HTMLElement, source: TabRailContextRequest['source']) => void;
  }>();
  let orderDialog = $state<{
    open: (options: { label: string; items: readonly TabOrderItem[]; invokingTab: HTMLElement }) => void;
  }>();
  let controller = $state<TabRailController>();

  $effect(() => {
    const rail = tablist;
    if (!rail) return;
    const next = createTabRailController({
      rail,
      onContextRequest: ({ id, anchor, source }) => menu?.open(id as PanelId, anchor, source)
    });
    controller = next;
    return () => {
      if (controller === next) controller = undefined;
      next.destroy();
    };
  });

  function tabElement(panelId: PanelId) {
    return tablist?.querySelector<HTMLButtonElement>(
      `[data-pomegranate-panel-tab="${CSS.escape(panelId)}"] [role="tab"]`
    );
  }

  function reveal(panelId: PanelId, focus = false) {
    void tick().then(() => {
      const tab = tabElement(panelId);
      if (!tab) return;
      if (focus) tab.focus();
      controller?.reveal(tab);
    });
  }

  function activate(panelId: PanelId, focus = false) {
    store.dispatch({ type: 'panel.activate', panelId });
    reveal(panelId, focus);
  }

  function openPanelOrder(_panelId: PanelId, invokingTab: HTMLElement) {
    orderDialog?.open({
      label: 'Reorder Panels',
      items: tabs.map((tab) => ({ id: tab.panelId, name: tab.name, active: tab.selected })),
      invokingTab
    });
  }

  function focusAndActivate(index: number) {
    if (!tabs.length) return;
    const wrapped = (index + tabs.length) % tabs.length;
    const tab = tabs[wrapped];
    if (tab) activate(tab.panelId, true);
  }

  function handleKey(event: KeyboardEvent, panelId: PanelId, index: number) {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      controller?.keyboardContext(event, panelId);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusAndActivate(event.key === 'Home' ? 0 : tabs.length - 1);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    focusAndActivate(index + (event.key === 'ArrowLeft' ? -1 : 1));
  }
</script>

<div class="panel-tab-rail-shell" data-tab-rail-shell style="min-width: 0; width: 100%; height: 100%;">
  <div
    bind:this={tablist}
    class={className}
    data-tab-rail-scroll
    role="tablist"
    aria-label="Panels"
    tabindex="-1"
    style="width: 100%; height: 100%; overflow-x: auto; scrollbar-width: none;"
    onpointermove={(event) => controller?.pointerMove(event)}
    onpointerup={(event) => controller?.pointerUp(event)}
    onpointercancel={(event) => controller?.pointerCancel(event)}
  >
    {#each tabs as tab, index (tab.panelId)}
      <div data-pomegranate-panel-tab={tab.panelIdAttribute}>
        <button
          type="button"
          data-pom-part="button.surface"
          role="tab"
          id={tab.tabId}
          aria-controls={tab.surfaceId}
          aria-selected={tab.selected}
          aria-describedby="panel-tab-options-description"
          aria-keyshortcuts="Shift+F10"
          tabindex={tab.selected ? 0 : -1}
          onclick={() => { if (!controller?.consumeClick()) activate(tab.panelId); }}
          onfocus={(event) => controller?.reveal(event.currentTarget)}
          onkeydown={(event) => handleKey(event, tab.panelId, index)}
          oncontextmenu={(event) => controller?.contextMenu(event, tab.panelId)}
          onpointerdown={(event) => controller?.pointerDown(event, tab.panelId)}
          ondragstart={(event) => event.preventDefault()}
        >{tab.name}</button>
      </div>
    {/each}
  </div>
  <span data-tab-rail-edge="before" aria-hidden="true"></span>
  <span data-tab-rail-edge="after" aria-hidden="true"></span>
</div>
<span id="panel-tab-options-description" class="visually-hidden">Right-click, press and hold, or press Shift+F10 for tab options.</span>

<PanelMenu
  bind:this={menu}
  {store}
  onaddsubpanel={(panelId) => onaddsubpanel?.(panelId)}
  onreorderpanels={openPanelOrder}
/>

<TabOrderDialog
  bind:this={orderDialog}
  onmove={(id, toIndex) => store.dispatch({ type: 'panel.reorder', panelId: id as PanelId, toIndex })}
/>
