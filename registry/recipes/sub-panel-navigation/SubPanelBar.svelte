<script lang="ts">
  import { tick } from 'svelte';
  import type { PanelId, SubPanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectSubPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';

  type DialogMode = 'create' | 'rename' | 'layout' | 'move' | 'delete';

  let {
    store,
    onrequest,
    onduplicate,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onrequest: (request: { mode: DialogMode; panelId: PanelId; subPanelId?: SubPanelId }) => void;
    onduplicate: (panelId: PanelId, subPanelId: SubPanelId) => void;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  let selectorOpen = $state(false);
  let actionsOpen = $state(false);
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

  async function activate(subPanelId: SubPanelId) {
    if (!panel) return;
    const incoming = tabs.find((tab) => tab.subPanelId === subPanelId);
    const currentScrollTop = scrollOwner(panel.id)?.scrollTop ?? 0;
    const result = store.dispatch({
      type: 'sub-panel.activate',
      panelId: panel.id,
      subPanelId,
      currentScrollTop
    });
    selectorOpen = false;
    actionsOpen = false;
    if (!result.ok) return;
    await tick();
    const owner = scrollOwner(panel.id);
    if (owner) owner.scrollTop = incoming?.scrollTop ?? 0;
  }

  function focusTab(index: number) {
    const clamped = Math.max(0, Math.min(tabs.length - 1, index));
    document.querySelector<HTMLButtonElement>(`[data-sub-panel-tab="${CSS.escape(tabs[clamped]!.subPanelId)}"]`)?.focus();
  }

  function handleKey(event: KeyboardEvent, subPanelId: SubPanelId, index: number) {
    if (event.shiftKey && event.key === 'F10') {
      event.preventDefault();
      actionsOpen = true;
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void activate(subPanelId);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusTab(event.key === 'Home' ? 0 : tabs.length - 1);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.altKey) {
      store.dispatch({
        type: 'sub-panel.reorder',
        panelId: panel!.id,
        subPanelId,
        toIndex: Math.max(0, Math.min(tabs.length - 1, index + direction))
      });
      void tick().then(() => focusTab(Math.max(0, Math.min(tabs.length - 1, index + direction))));
    } else focusTab(index + direction);
  }

  function request(mode: DialogMode) {
    if (!panel) return;
    onrequest({ mode, panelId: panel.id, ...(mode === 'create' || !active ? {} : { subPanelId: active.subPanelId }) });
    selectorOpen = false;
    actionsOpen = false;
  }

  function handleWindowKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || (!selectorOpen && !actionsOpen)) return;
    event.preventDefault();
    selectorOpen = false;
    actionsOpen = false;
  }
</script>

<svelte:window onkeydown={handleWindowKey} />

{#if panel && tabs.length > 0}
  <nav
    class={`sub-panel-bar ${className}`}
    data-pom-part="sub-panel.bar"
    data-sub-panel-layout={active?.layoutId}
    aria-label={`${panel.name} sub-panel navigation`}
  >
    <div class="sub-panel-tabs" role="tablist" aria-label={`${panel.name} sub-panels`}>
      {#each tabs as tab, index (tab.subPanelId)}
        <button
          type="button"
          data-pom-part="button.surface"
          data-sub-panel-tab={tab.subPanelIdAttribute}
          role="tab"
          id={tab.tabId}
          aria-controls={tab.surfaceId}
          aria-selected={tab.selected}
          tabindex={tab.selected ? 0 : -1}
          onclick={() => void activate(tab.subPanelId)}
          onkeydown={(event) => handleKey(event, tab.subPanelId, index)}
          oncontextmenu={(event) => { event.preventDefault(); if (tab.selected) actionsOpen = true; }}
        >{tab.name}</button>
      {/each}
      <button class="sub-panel-add" type="button" data-pom-part="button.surface" aria-label="Add sub-panel" onclick={() => request('create')}>+</button>
    </div>

    <button
      class="sub-panel-selector-trigger"
      type="button"
      data-pom-part="button.surface"
      aria-haspopup="listbox"
      aria-expanded={selectorOpen}
      data-sub-panel-selector-trigger
      onclick={() => { selectorOpen = !selectorOpen; actionsOpen = false; }}
    ><span>{active?.name}</span><span aria-hidden="true">⌄</span></button>
    <button
      class="sub-panel-actions-trigger"
      type="button"
      data-pom-part="button.surface"
      aria-label={`Manage ${active?.name ?? 'sub-panel'}`}
      aria-haspopup="menu"
      aria-expanded={actionsOpen}
      data-sub-panel-actions-trigger
      onclick={() => { actionsOpen = !actionsOpen; selectorOpen = false; }}
    >•••</button>

    {#if selectorOpen}
      <div class="sub-panel-selector" data-pom-part="menu.surface" role="listbox" aria-label={`${panel.name} sub-panels`}>
        {#each tabs as tab (tab.subPanelId)}
          <button
            type="button"
            role="option"
            aria-selected={tab.selected}
            onclick={() => void activate(tab.subPanelId)}
          >{tab.name}</button>
        {/each}
        <button type="button" onclick={() => request('create')}>Add sub-panel</button>
      </div>
    {/if}

    {#if actionsOpen && active}
      <div class="sub-panel-actions-menu" data-pom-part="menu.surface" role="menu" aria-label={`${active.name} actions`}>
        <button type="button" role="menuitem" onclick={() => request('rename')}>Rename</button>
        <button type="button" role="menuitem" onclick={() => { onduplicate(panel.id, active.subPanelId); actionsOpen = false; }}>Duplicate</button>
        <button type="button" role="menuitem" onclick={() => request('layout')}>Change layout</button>
        <button type="button" role="menuitem" onclick={() => request('move')}>Move Widgets</button>
        <button type="button" role="menuitem" onclick={() => request('delete')}>Delete</button>
      </div>
    {/if}
  </nav>
{/if}
