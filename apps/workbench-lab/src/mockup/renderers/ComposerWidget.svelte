<script lang="ts">
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: { hostContext: LabHostContext } = $props();
  let draft = $state('');

  function reserveDraftSpace(node: HTMLDivElement) {
    if (typeof ResizeObserver === 'undefined') return;
    const header = node.closest('.widget-frame')?.querySelector<HTMLElement>(':scope > header');
    let panel: HTMLElement | null = null;
    const update = () => {
      const owner = node.closest<HTMLElement>('.panel-template-surface');
      if (owner !== panel) panel?.style.removeProperty('--pom-composer-height');
      panel = owner;
      panel?.style.setProperty('--pom-composer-height', `${Math.ceil(node.getBoundingClientRect().height + (header?.getBoundingClientRect().height ?? 0))}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    if (header) observer.observe(header);
    update();
    return { destroy() { observer.disconnect(); panel?.style.removeProperty('--pom-composer-height'); } };
  }
</script>

<div class="widget-content composer" data-conformance-region="composer" use:reserveDraftSpace>
  <label class="visually-hidden" for="lab-composer">Next action in {hostContext.storyTitle}</label>
  <div class="composer-field">
    <span class="composer-placeholder" aria-hidden="true">Describe what you do, say, or notice…</span>
    <!-- A separate visual prompt keeps placeholder wrapping independent of draft sizing. -->
    <textarea id="lab-composer" data-pom-part="field.surface" bind:value={draft} placeholder=" " aria-placeholder="Describe what you do, say, or notice…"></textarea>
    <span class="composer-meta"><span>Draft preview · sending unavailable</span><span>Enter for a new line</span><span>Perspective: Aven</span></span>
  </div>
  <button type="button" data-pom-part="button.surface" disabled>Continue</button>
</div>
