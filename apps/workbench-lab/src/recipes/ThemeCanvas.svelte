<script lang="ts">
  import type { CanvasPresentationLayer } from '@pomegranate-ui/theme';

  let { layers }: { layers: readonly CanvasPresentationLayer[] } = $props();

  function styleText(style: Readonly<Record<string, string>>): string {
    return Object.entries(style)
      .map(([property, value]) => `${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`)
      .join(';');
  }
</script>

<div class="pom-theme-canvas" data-pom-canvas-root data-pom-part="canvas.surface" aria-hidden="true">
  {#each layers as layer (layer.order)}
    <i data-pom-canvas-layer={layer.kind} data-pom-canvas-order={layer.order} style={styleText(layer.style)}></i>
  {/each}
</div>

<style>
  .pom-theme-canvas {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
  }
</style>
