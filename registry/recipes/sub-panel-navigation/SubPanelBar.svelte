<script module lang="ts">
  import type {
    PanelId as ContractPanelId,
    SubPanelId as ContractSubPanelId
  } from '@pomegranate-ui/contracts';

  export type SubPanelTabContextSource = 'pointer' | 'keyboard';

  export interface SubPanelTabActivationRequest {
    readonly panelId: ContractPanelId;
    readonly subPanelId: ContractSubPanelId;
    readonly anchor: HTMLElement;
    readonly currentScrollTop: number;
  }

  export interface SubPanelTabContextRequest {
    readonly panelId: ContractPanelId;
    readonly subPanelId: ContractSubPanelId;
    readonly anchor: HTMLElement;
    readonly source: SubPanelTabContextSource;
  }

  export interface SubPanelTabReorderRequest {
    readonly panelId: ContractPanelId;
    readonly subPanelId: ContractSubPanelId;
    readonly invokingTab: HTMLElement;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import type { PanelId, SubPanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectSubPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';
  import type { SubPanelDialogRequest } from './SubPanelDialog.svelte';

  let {
    store,
    onrequest,
    onactivate,
    oncontextrequest,
    onreorderrequest,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onrequest: (request: SubPanelDialogRequest) => void;
    onactivate?: ((request: SubPanelTabActivationRequest) => void) | undefined;
    oncontextrequest?: ((request: SubPanelTabContextRequest) => void) | undefined;
    onreorderrequest?: ((request: SubPanelTabReorderRequest) => void) | undefined;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  let tablist = $state<HTMLElement>();
  $effect(() => {
    const current = store;
    workbench = current.getState();
    return current.subscribe((next) => { workbench = next; });
  });
  const panel = $derived(workbench?.panels.find((candidate) => candidate.id === workbench?.activePanelId));
  const tabs = $derived(workbench ? selectSubPanelTabs(workbench) : []);
  const active = $derived(tabs.find((tab) => tab.selected));

  function scrollOwner(panelId: PanelId): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-pomegranate-panel="${CSS.escape(panelId)}"]`);
  }

  function tabElement(subPanelId: SubPanelId) {
    return tablist?.querySelector<HTMLButtonElement>(
      `[data-sub-panel-tab="${CSS.escape(subPanelId)}"]`
    );
  }

  function revealInRail(tab: HTMLElement) {
    if (!tablist) return;
    const railRect = tablist.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const tabLeft = tabRect.left - railRect.left + tablist.scrollLeft;
    const tabRight = tabRect.right - railRect.left + tablist.scrollLeft;
    const maximum = Math.max(0, tablist.scrollWidth - tablist.clientWidth);
    if (tabLeft < tablist.scrollLeft) tablist.scrollLeft = Math.max(0, Math.min(tabLeft, maximum));
    else if (tabRight > tablist.scrollLeft + tablist.clientWidth) {
      tablist.scrollLeft = Math.max(0, Math.min(tabRight - tablist.clientWidth, maximum));
    }
  }

  function revealItem(element: HTMLElement) {
    const item = element.closest<HTMLElement>('[data-sub-panel-tab-item]');
    revealInRail(item && item.getBoundingClientRect().width > 0 ? item : element);
  }

  function reveal(subPanelId: SubPanelId, focus = false) {
    void tick().then(() => {
      const tab = tabElement(subPanelId);
      if (!tab) return;
      if (focus) tab.focus();
      revealItem(tab);
    });
  }

  async function activate(subPanelId: SubPanelId, anchor: HTMLElement, focus = false) {
    if (!panel) return;
    const incoming = tabs.find((tab) => tab.subPanelId === subPanelId);
    const currentScrollTop = scrollOwner(panel.id)?.scrollTop ?? 0;
    if (onactivate) onactivate({ panelId: panel.id, subPanelId, anchor, currentScrollTop });
    else {
      const result = store.dispatch({
        type: 'sub-panel.activate',
        panelId: panel.id,
        subPanelId,
        currentScrollTop
      });
      if (!result.ok) return;
    }
    await tick();
    const owner = scrollOwner(panel.id);
    if (owner) owner.scrollTop = incoming?.scrollTop ?? 0;
    reveal(subPanelId, focus);
  }

  function context(event: MouseEvent | KeyboardEvent, subPanelId: SubPanelId, source: SubPanelTabContextSource) {
    if (!panel || !oncontextrequest) return;
    event.preventDefault();
    const tab = tabs.find((candidate) => candidate.subPanelId === subPanelId);
    if (!tab) return;
    oncontextrequest?.({
      panelId: panel.id,
      subPanelId: tab.subPanelId,
      anchor: event.currentTarget as HTMLElement,
      source
    });
  }

  function focusAndActivate(index: number) {
    if (!tabs.length) return;
    const wrapped = (index + tabs.length) % tabs.length;
    const tab = tabs[wrapped];
    const anchor = tab ? tabElement(tab.subPanelId) : undefined;
    if (tab && anchor) void activate(tab.subPanelId, anchor, true);
  }

  function handleKey(event: KeyboardEvent, subPanelId: SubPanelId, index: number) {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      context(event, subPanelId, 'keyboard');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void activate(subPanelId, event.currentTarget as HTMLElement);
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

  function requestReorder(event: MouseEvent) {
    if (!panel || !active || !onreorderrequest) return;
    onreorderrequest({
      panelId: panel.id,
      subPanelId: active.subPanelId,
      invokingTab: tabElement(active.subPanelId) ?? event.currentTarget as HTMLElement
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
              onclick={(event) => void activate(tab.subPanelId, event.currentTarget)}
              onfocus={(event) => revealItem(event.currentTarget)}
              onkeydown={(event) => handleKey(event, tab.subPanelId, index)}
              oncontextmenu={(event) => context(event, tab.subPanelId, 'pointer')}
              ondragstart={(event) => event.preventDefault()}
            >{tab.name}</button>
            {#if tab.selected && oncontextrequest}
              <button
                class="sub-panel-tab-actions-trigger"
                type="button"
                data-pom-part="button.surface"
                data-sub-panel-tab-actions-trigger
                aria-label={`Open ${tab.name} sub-panel actions`}
                aria-haspopup="dialog"
                onclick={(event) => context(event, tab.subPanelId, 'pointer')}
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
      onclick={(event) => onrequest({ mode: 'create', panelId: panel.id, invokingTab: event.currentTarget })}
    >+</button>
    {#if onreorderrequest}
      <button
        class="sub-panel-reorder"
        type="button"
        data-pom-part="button.surface"
        data-tab-order-trigger
        onclick={requestReorder}
      >Reorder sub-panels</button>
    {/if}
  </nav>
  <span id="sub-panel-tab-options-description" class="visually-hidden">Right-click or press Shift+F10 for tab options.</span>
{/if}

<style>
  .sub-panel-tab-actions-trigger { display: none; }
  @media (pointer: coarse) {
    [data-sub-panel-tab-item] { display: flex; align-items: stretch; }
    .sub-panel-tab-actions-trigger {
      box-sizing: border-box;
      display: grid;
      flex: 0 0 44px;
      place-items: center;
      width: 44px;
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      touch-action: manipulation;
    }
  }
</style>
