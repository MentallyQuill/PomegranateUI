<script lang="ts">
  import {
    asSubPanelId,
    asWidgetInstanceId,
    type PanelId,
    type PanelState,
    type SubPanelId,
    type SubPanelLayoutId
  } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  export type SubPanelDialogMode = 'create' | 'rename' | 'layout' | 'move' | 'delete';
  export interface SubPanelDialogRequest {
    readonly mode: SubPanelDialogMode;
    readonly panelId: PanelId;
    readonly subPanelId?: SubPanelId;
    readonly invokingTab?: HTMLElement;
  }

  let {
    store,
    oncreated
  }: {
    store: WorkbenchStore;
    oncreated?: ((name: string) => void) | undefined;
  } = $props();
  let dialog: HTMLDialogElement;
  let mode = $state<SubPanelDialogMode>('create');
  let panel = $state<PanelState | null>(null);
  let subPanelId = $state<SubPanelId | undefined>();
  let name = $state('New sub-panel');
  let layoutId = $state<SubPanelLayoutId>('single');
  let targetSubPanelId = $state<SubPanelId | undefined>();
  let invokingTab: HTMLElement | undefined;

  const activeSubPanel = $derived(panel?.subPanels?.find((candidate) => candidate.id === subPanelId));
  const moveTargets = $derived(panel?.subPanels?.filter((candidate) => candidate.id !== subPanelId && !candidate.hidden) ?? []);
  const title = $derived(mode === 'create' ? 'Create sub-panel'
    : mode === 'rename' ? 'Rename sub-panel'
      : mode === 'layout' ? 'Choose sub-panel layout'
        : mode === 'move' ? 'Move all Widgets'
          : 'Delete sub-panel');

  export function open(request: SubPanelDialogRequest) {
    const nextPanel = store.getState().panels.find((candidate) => candidate.id === request.panelId) ?? null;
    const nextSubPanel = nextPanel?.subPanels?.find((candidate) => candidate.id === request.subPanelId);
    mode = request.mode;
    panel = nextPanel;
    subPanelId = request.subPanelId;
    name = request.mode === 'rename' && nextSubPanel ? nextSubPanel.name : 'New sub-panel';
    layoutId = nextSubPanel?.layoutId ?? 'single';
    targetSubPanelId = nextPanel?.subPanels?.find((candidate) => candidate.id !== request.subPanelId && !candidate.hidden)?.id;
    invokingTab = request.invokingTab;
    dialog.showModal?.();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!panel) return;
    if (mode === 'create') {
      const suffix = store.getState().revision + 1;
      const id = asSubPanelId(`${panel.id}-sub-panel-${suffix}`);
      const result = store.dispatch({
        type: 'sub-panel.create',
        panelId: panel.id,
        subPanel: {
          id,
          name: name.trim() || 'Untitled',
          layoutId,
          order: panel.subPanels?.length ?? 1,
          scrollTop: 0
        },
        ...(panel.subPanels
          ? {}
          : {
              overview: {
                id: asSubPanelId(`${panel.id}-overview`),
                name: 'Overview',
                layoutId: panel.templateId === 'columns.v1' ? 'three-equal' as const : 'single' as const,
                order: 0,
                scrollTop: 0
              }
            })
      });
      if (!result.ok) return;
      oncreated?.(name.trim() || 'Untitled');
    } else if (mode === 'rename' && subPanelId) {
      store.dispatch({ type: 'sub-panel.rename', panelId: panel.id, subPanelId, name: name.trim() || activeSubPanel?.name || 'Untitled' });
    } else if (mode === 'layout' && subPanelId) {
      store.dispatch({ type: 'sub-panel.change-layout', panelId: panel.id, subPanelId, layoutId });
    } else if (mode === 'move' && subPanelId && targetSubPanelId) {
      store.dispatch({
        type: 'sub-panel.move-widgets',
        panelId: panel.id,
        sourceSubPanelId: subPanelId,
        targetSubPanelId
      });
    } else if (mode === 'delete' && subPanelId) {
      store.dispatch({ type: 'sub-panel.delete', panelId: panel.id, subPanelId });
    }
    dialog.close?.();
  }

  function restoreFocus() {
    const activeSubPanelTab = document.querySelector<HTMLElement>(
      '[role="tablist"][aria-label$="sub-panels"] [role="tab"][aria-selected="true"]'
    );
    const owningPanelTab = panel
      ? document.querySelector<HTMLElement>(
          `[data-pomegranate-panel-tab="${CSS.escape(panel.id)}"] [role="tab"]`
        )
      : null;
    const target = invokingTab?.isConnected ? invokingTab : activeSubPanelTab ?? owningPanelTab;
    invokingTab = undefined;
    queueMicrotask(() => target?.focus());
  }

  export function duplicate(panelId: PanelId, sourceSubPanelId: SubPanelId) {
    const state = store.getState();
    const sourcePanel = state.panels.find((candidate) => candidate.id === panelId);
    const source = sourcePanel?.subPanels?.find((candidate) => candidate.id === sourceSubPanelId);
    if (!sourcePanel || !source) return;
    const suffix = state.revision + 1;
    const widgetIds: Record<string, ReturnType<typeof asWidgetInstanceId>> = {};
    const groupIds: Record<string, string> = {};
    for (const [instanceId, placement] of Object.entries(state.placements)) {
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      if (visible.panelId !== panelId || visible.subPanelId !== sourceSubPanelId) continue;
      widgetIds[instanceId] = asWidgetInstanceId(`${instanceId}-copy-${suffix}`);
      if (visible.kind === 'docked' && visible.group) {
        groupIds[visible.group.id] = `${visible.group.id}-copy-${suffix}`;
      }
    }
    store.dispatch({
      type: 'sub-panel.duplicate',
      panelId,
      subPanelId: sourceSubPanelId,
      subPanel: {
        id: asSubPanelId(`${sourceSubPanelId}-copy-${suffix}`),
        name: `${source.name} Copy`,
        layoutId: source.layoutId,
        order: sourcePanel.subPanels!.length,
        scrollTop: 0
      },
      ids: { widgetIds, groupIds }
    });
  }
</script>

<dialog bind:this={dialog} class="sub-panel-dialog" data-pom-part="dialog.surface" aria-labelledby="sub-panel-dialog-title" onclose={restoreFocus}>
  <form onsubmit={submit}>
    <h2 id="sub-panel-dialog-title">{title}</h2>
    {#if mode === 'create' || mode === 'rename'}
      <label>Sub-panel name<input data-pom-part="field.surface" bind:value={name} maxlength="48" /></label>
    {/if}
    {#if mode === 'create' || mode === 'layout'}
      <label>Layout
        <select data-pom-part="field.surface" bind:value={layoutId}>
          <option value="single">Single column</option>
          <option value="two-equal">Two equal columns</option>
          <option value="three-equal">Three equal columns</option>
          <option value="wide-left">Wide left</option>
          <option value="wide-right">Wide right</option>
        </select>
      </label>
    {/if}
    {#if mode === 'move'}
      <p>Every Widget in {activeSubPanel?.name} will move to the selected sibling without changing its identity or configuration.</p>
      <label>Destination
        <select data-pom-part="field.surface" bind:value={targetSubPanelId}>
          {#each moveTargets as target (target.id)}<option value={target.id}>{target.name}</option>{/each}
        </select>
      </label>
    {/if}
    {#if mode === 'delete'}
      <p>Deleting {activeSubPanel?.name} removes its owned Widgets. If one sibling remains, it becomes the flat Panel workspace.</p>
    {/if}
    <div class="sub-panel-dialog-actions">
      <button type="button" data-pom-part="button.surface" onclick={() => dialog.close?.()}>Cancel</button>
      <button type="submit" data-pom-part="button.surface">{mode === 'delete' ? 'Delete sub-panel' : 'Apply'}</button>
    </div>
  </form>
</dialog>
