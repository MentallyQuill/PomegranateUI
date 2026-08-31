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
  <i data-pom-ambient-layer></i>
</div>

<style>
  .pom-theme-canvas {
    position: fixed;
    inset: 0;
    /* The semantic recipe exposes elevation for ordinary surfaces. The canvas is
       structural and must remain below every painted Workbench layer. */
    z-index: -1 !important;
    overflow: hidden;
    pointer-events: none;
  }
  .pom-theme-canvas > [data-pom-ambient-layer] {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: calc(var(--pom-ambient-power, 0) * var(--pom-ambient-transparency-enabled, 1));
    background: radial-gradient(
      ellipse at var(--pom-ambient-x, 50%) var(--pom-ambient-y, 50%),
      color-mix(in srgb, var(--pom-ambient-color, transparent) 34%, transparent),
      transparent var(--pom-ambient-radius, 50%)
    );
    mix-blend-mode: screen;
  }
</style>
