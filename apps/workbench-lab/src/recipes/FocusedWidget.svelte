<script lang="ts" generics="THostContext">
  import { onMount } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';

  import WidgetFrame from './WidgetFrame.svelte';

  let {
    frame,
    title = frame.title,
    meta,
    store,
    rendererRegistry,
    hostContext,
    onreturn
  }: {
    frame: WidgetFrameProjection;
    title?: string;
    meta?: string | undefined;
    store: WorkbenchStore;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    onreturn: () => void;
  } = $props();

  let dialog: HTMLDialogElement;

  onMount(() => {
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('.action-exit-focus')?.focus();
  });
</script>

<dialog
  bind:this={dialog}
  class="focused-widget-dialog"
  data-pom-part="dialog.surface"
  aria-label={`${title} focus`}
  onclose={onreturn}
>
  <WidgetFrame
    {frame}
    {title}
    {meta}
    {store}
    {rendererRegistry}
    {hostContext}
    onexitfocus={() => dialog.close()}
    surfacePart={null}
    class="widget-frame focused-widget-frame"
  />
</dialog>
