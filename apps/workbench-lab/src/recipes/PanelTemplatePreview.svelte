<script lang="ts">
  import type { PanelTemplateDefinition } from '@pomegranate-ui/contracts';

  let { family, columns = 3 }: {
    family: PanelTemplateDefinition['family'];
    columns?: number;
  } = $props();
</script>

<span
  class="panel-template-preview"
  data-panel-template-preview={family}
  style={`--pom-panel-preview-columns:${columns}`}
  aria-hidden="true"
>
  {#if family === 'story-stage'}
    <i data-panel-preview-region="left"></i>
    <i data-panel-preview-region="stage"></i>
    <i data-panel-preview-region="composer"></i>
    <i data-panel-preview-region="right"></i>
  {:else if family === 'focus-support'}
    <i data-panel-preview-region="focus"></i>
    <i data-panel-preview-region="support"></i>
  {:else}
    {#each Array(columns) as _}
      <i data-panel-preview-region="column"></i>
    {/each}
  {/if}
</span>
