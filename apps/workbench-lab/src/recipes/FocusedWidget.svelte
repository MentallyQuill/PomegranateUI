<script lang="ts" generics="THostContext">
  import { onMount } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';

  import WidgetFrame from './WidgetFrame.svelte';

  let {
    frame,
    store,
    rendererRegistry,
    hostContext,
    onreturn
  }: {
    frame: WidgetFrameProjection;
    store: WorkbenchStore;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    onreturn: () => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let backButton: HTMLButtonElement;

  onMount(() => {
    dialog.showModal();
    backButton.focus();
  });
</script>

<dialog
  bind:this={dialog}
  class="focused-widget-dialog"
  aria-labelledby={`focused-widget-title-${frame.instanceId}`}
  onclose={onreturn}
>
  <header>
    <div>
      <span>Focused Widget</span>
      <h2 id={`focused-widget-title-${frame.instanceId}`}>Focused {frame.title}</h2>
    </div>
    <button bind:this={backButton} type="button" onclick={() => dialog.close()}>Back to Workbench</button>
  </header>
  <div class="focused-widget-surface">
    <WidgetFrame {frame} {store} {rendererRegistry} {hostContext} class="widget-frame" />
  </div>
</dialog>
