<script lang="ts">
  import { BUILT_IN_PANEL_TEMPLATES } from '@pomegranate-ui/layout';
  import PanelTemplatePreview from './PanelTemplatePreview.svelte';

  let { oncreate }: { oncreate: (request: { name: string; templateId: string; columns?: number }) => void } = $props();
  let dialog: HTMLDialogElement;
  let name = $state('New Panel');
  let templateId = $state('columns.v1');
  let columns = $state(3);

  const TEMPLATE_COPY: Readonly<Record<string, { label: string; description: string }>> = {
    'story-stage.v1': {
      label: 'Story Stage',
      description: 'A central story area with side tools and a composer.'
    },
    'focus-support.v1': {
      label: 'Focus + Support',
      description: 'One large workspace with a supporting area.'
    },
    'columns.v1': {
      label: 'Columns',
      description: 'Equal-width working areas from two through six.'
    }
  };

  const templateChoices = BUILT_IN_PANEL_TEMPLATES.map((template) => ({
    id: template.id,
    family: template.family,
    label: TEMPLATE_COPY[template.id]?.label ?? template.label,
    description: TEMPLATE_COPY[template.id]?.description ?? `Start with the ${template.label} layout.`
  }));

  export function showModal() {
    dialog.showModal();
  }

  export function close() {
    dialog.close();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    oncreate({ name: name.trim() || 'Untitled Panel', templateId, ...(templateId === 'columns.v1' ? { columns } : {}) });
  }
</script>

<dialog class="panel-create-dialog" bind:this={dialog} data-pom-part="dialog.surface" aria-labelledby="panel-dialog-title">
  <form class="panel-create-form" onsubmit={submit}>
    <header class="panel-create-header">
      <h2 id="panel-dialog-title">Create a Panel</h2>
      <p>Choose a starting layout. You can add and arrange Widgets after creating the Panel.</p>
    </header>

    <section class="panel-create-body">
      <label class="panel-create-name">
        <span>Panel name</span>
        <input data-pom-part="field.surface" bind:value={name} />
      </label>

      <fieldset class="panel-template-fieldset">
        <legend>Panel layout</legend>
        <div class="panel-template-grid">
          {#each templateChoices as option (option.id)}
            <label
              class="panel-template-card"
              data-panel-template-card={option.family}
              data-pom-part="row.surface"
              data-pom-selected={templateId === option.id ? 'true' : undefined}
            >
              <input class="visually-hidden" type="radio" name="panel-template" value={option.id} bind:group={templateId} />
              <PanelTemplatePreview family={option.family} {columns} />
              <span class="panel-template-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          {/each}
        </div>
      </fieldset>

      {#if templateId === 'columns.v1'}
        <fieldset class="panel-column-fieldset">
          <legend>Columns</legend>
          <div class="panel-column-segments">
            {#each [2, 3, 4, 5, 6] as count}
              <label
                data-column-count-option={count}
                data-pom-part="button.surface"
                data-pom-selected={columns === count ? 'true' : undefined}
              >
                <input class="visually-hidden" type="radio" name="panel-column-count" value={count} bind:group={columns} />
                <span>{count}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}
    </section>

    <footer class="panel-create-footer">
      <button type="button" data-pom-part="button.surface" onclick={() => dialog.close()}>Cancel</button>
      <button class="panel-create-submit" type="submit" data-pom-part="button.surface">Create Panel</button>
    </footer>
  </form>
</dialog>
