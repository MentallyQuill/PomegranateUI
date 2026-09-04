<script lang="ts">
  import { tick } from 'svelte';
  import type { PanelId, SubPanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectSubPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';
  import SubPanelMenu from './SubPanelMenu.svelte';
  import type { SubPanelDialogRequest } from './SubPanelDialog.svelte';
  import TabOrderDialog, { type TabOrderItem } from './TabOrderDialog.svelte';
  import {
    createTabRailController,
    type TabRailContextRequest,
    type TabRailController
  } from './TabRailController.js';

  let {
    store,
    onrequest,
    onduplicate,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onrequest: (request: SubPanelDialogRequest) => void;
    onduplicate: (panelId: PanelId, subPanelId: SubPanelId) => void;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    workbench = current.getState();
    return current.subscribe((next) => { workbench = next; });
  });
  const panel = $derived(workbench?.panels.find((candidate) => candidate.id === workbench?.activePanelId));
  const tabs = $derived(workbench ? selectSubPanelTabs(workbench) : []);
  const active = $derived(tabs.find((tab) => tab.selected));
  let tablist = $state<HTMLElement>();
  let menu = $state<{
    open: (
      panelId: PanelId,
      subPanelId: SubPanelId,
      anchor: HTMLElement,
      source: TabRailContextRequest['source']
    ) => void;
  }>();
  let orderDialog = $state<{
    open: (options: { label: string; items: readonly TabOrderItem[]; invokingTab: HTMLElement }) => void;
  }>();
  let controller = $state<TabRailController>();

  $effect(() => {
    const rail = tablist;
    if (!rail || !panel) return;
    const panelId = panel.id;
    const next = createTabRailController({
      rail,
      onContextRequest: ({ id, anchor, source }) => {
        menu?.open(panelId, id as SubPanelId, anchor, source);
      }
    });
    controller = next;
    return () => {
      if (controller === next) controller = undefined;
      next.destroy();
    };
  });

  function scrollOwner(panelId: PanelId): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-pomegranate-panel="${CSS.escape(panelId)}"]`);
  }

  function tabElement(subPanelId: SubPanelId) {
    return tablist?.querySelector<HTMLButtonElement>(
      `[data-sub-panel-tab="${CSS.escape(subPanelId)}"]`
    );
  }

  function revealItem(element: HTMLElement) {
    controller?.reveal(element.closest<HTMLElement>('[data-sub-panel-tab-item]') ?? element);
  }

  function reveal(subPanelId: SubPanelId, focus = false) {
    void tick().then(() => {
      const tab = tabElement(subPanelId);
      if (!tab) return;
      if (focus) tab.focus();
      revealItem(tab);
    });
  }

  async function activate(subPanelId: SubPanelId, focus = false) {
    if (!panel) return;
    const incoming = tabs.find((tab) => tab.subPanelId === subPanelId);
    const currentScrollTop = scrollOwner(panel.id)?.scrollTop ?? 0;
    const result = store.dispatch({
      type: 'sub-panel.activate',
      panelId: panel.id,
      subPanelId,
      currentScrollTop
    });
    if (!result.ok) return;
    await tick();
    const owner = scrollOwner(panel.id);
    if (owner) owner.scrollTop = incoming?.scrollTop ?? 0;
    reveal(subPanelId, focus);
  }

  function focusAndActivate(index: number) {
    if (!tabs.length) return;
    const wrapped = (index + tabs.length) % tabs.length;
    const tab = tabs[wrapped];
    if (tab) void activate(tab.subPanelId, true);
  }

  function handleKey(event: KeyboardEvent, subPanelId: SubPanelId, index: number) {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      controller?.keyboardContext(event, subPanelId);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void activate(subPanelId);
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

  function openSubPanelOrder(_panelId: PanelId, _subPanelId: SubPanelId, invokingTab: HTMLElement) {
    if (!panel) return;
    orderDialog?.open({
      label: `Reorder ${panel.name} sub-panels`,
      items: tabs.map((tab) => ({ id: tab.subPanelId, name: tab.name, active: tab.selected })),
      invokingTab
    });
  }

</script>

{#if panel && tabs.length > 0}
  <nav
    class={`sub-panel-bar ${className}`}
    data-pom-part="sub-panel.bar"
    data-pom-control-group="joined"
    data-sub-panel-layout={active?.layoutId}
    aria-label={`${panel.name} sub-panel navigation`}
  >
    <div class="sub-panel-tab-rail-shell" data-tab-rail-shell style="min-width: 0; flex: 0 1 auto; height: 100%;">
      <div
        bind:this={tablist}
        class="sub-panel-tabs"
        data-tab-rail-scroll
        role="tablist"
        aria-label={`${panel.name} sub-panels`}
        tabindex="-1"
        style="width: 100%; height: 100%; overflow-x: auto; scrollbar-width: none;"
        onpointermove={(event) => controller?.pointerMove(event)}
        onpointerup={(event) => controller?.pointerUp(event)}
        onpointercancel={(event) => controller?.pointerCancel(event)}
      >
        {#each tabs as tab, index (tab.subPanelId)}
          <span data-sub-panel-tab-item={tab.subPanelIdAttribute}>
            <button
              type="button"
              data-pom-part="button.surface"
              data-pom-control-segment={index === 0 ? 'start' : 'middle'}
              data-sub-panel-tab={tab.subPanelIdAttribute}
              role="tab"
              id={tab.tabId}
              aria-controls={tab.surfaceId}
              aria-selected={tab.selected}
              aria-describedby="sub-panel-tab-options-description"
              aria-keyshortcuts="Shift+F10"
              tabindex={tab.selected ? 0 : -1}
              onclick={(event) => { if (!controller?.consumeClick(event)) void activate(tab.subPanelId); }}
              onfocus={(event) => revealItem(event.currentTarget)}
              onkeydown={(event) => handleKey(event, tab.subPanelId, index)}
              oncontextmenu={(event) => controller?.contextMenu(event, tab.subPanelId)}
              onpointerdown={(event) => controller?.pointerDown(event, tab.subPanelId)}
              ondragstart={(event) => event.preventDefault()}
            >{tab.name}</button>
            {#if tab.selected}
              <button
                class="sub-panel-tab-actions-trigger"
                type="button"
                data-pom-part="button.surface"
                data-sub-panel-tab-actions-trigger
                aria-label={`Open ${tab.name} sub-panel actions`}
                aria-haspopup="dialog"
                onclick={(event) => menu?.open(panel.id, tab.subPanelId, event.currentTarget, 'pointer')}
                onfocus={(event) => revealItem(event.currentTarget)}
              ><span aria-hidden="true">…</span></button>
            {/if}
          </span>
        {/each}
      </div>
      <span data-tab-rail-edge="before" aria-hidden="true"></span>
      <span data-tab-rail-edge="after" aria-hidden="true"></span>
    </div>
    <button
      class="sub-panel-add"
      type="button"
      data-pom-part="button.surface"
      data-pom-control-segment="end"
      aria-label="Add sub-panel"
      onclick={() => onrequest({ mode: 'create', panelId: panel.id })}
    >+</button>
  </nav>
  <span id="sub-panel-tab-options-description" class="visually-hidden">Right-click or press Shift+F10 for tab options.</span>

  <SubPanelMenu
    bind:this={menu}
    {store}
    {onrequest}
    {onduplicate}
    onreordersubpanels={openSubPanelOrder}
  />

  <TabOrderDialog
    bind:this={orderDialog}
    onmove={(id, toIndex) => store.dispatch({
      type: 'sub-panel.reorder',
      panelId: panel.id,
      subPanelId: id as SubPanelId,
      toIndex
    })}
  />
{/if}
