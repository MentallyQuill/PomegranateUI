<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';
  import type { LabHostContext } from '../mockup/host-context.js';
  import type { SurfaceFixture, SurfaceState } from '../mockup/surface-fixtures.js';

  let {
    fixture,
    state: surfaceState,
    hostContext
  }: {
    fixture: SurfaceFixture;
    state: SurfaceState;
    hostContext: LabHostContext;
  } = $props();

  let draft = $state('Ask Mara what the bell means.');
  let selectedVariant = $state(2);
  const retainsContent = $derived(!['empty', 'unavailable', 'access-denied'].includes(surfaceState));
  const initials = (label: string) => label.split(/\s|→/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const sliderStyle = (value: number, minimum: number, maximum: number) => `--pom-slider-progress:${compileSliderProgress(value, minimum, maximum)}`;
  const syncSliderProgress = (input: HTMLInputElement) => {
    input.style.setProperty('--pom-slider-progress', compileSliderProgress(Number(input.value), Number(input.min), Number(input.max)));
  };
</script>

{#if retainsContent}
  <div class="surface-anatomy" data-surface-presentation={fixture.presentation}>
    {#if fixture.presentation === 'reader' || fixture.presentation === 'composer'}
      <p class="surface-scope">{fixture.scope}</p>
    {/if}
    <dl class="surface-contract-facts" aria-label="Visible surface contract">
      {#each fixture.rows as row (row[0])}
        <div><dt>{row[0]}</dt><dd>{row[1]}</dd></div>
      {/each}
    </dl>
    {#if fixture.presentation === 'reader'}
      <div class="widget-content transcript">
        <p class="widget-kicker">Chapter 04 · The Drowned Observatory</p>
        <h2>The Water Remembers</h2>
        <p>The reservoir held the last color of evening beneath its surface. Across the flooded concourse, a seam of pale light stood where no doorway had been.</p>
        <blockquote>Mara lowered her voice. “It only opens when someone has forgotten why they came.”</blockquote>
      </div>
    {:else if fixture.presentation === 'composer'}
      <div class="widget-content composer" data-conformance-region="composer">
        <label class="visually-hidden" for="implemented-composer">Next action in {hostContext.storyTitle}</label>
        <div class="composer-field">
          <textarea id="implemented-composer" data-pom-part="field.surface" bind:value={draft} placeholder="Describe what you do, say, or notice…"></textarea>
          <span>{draft.length} characters · draft retained locally · Perspective: Mara</span>
        </div>
        <button type="button" data-pom-part="button.surface">Send action</button>
      </div>
    {:else}
      <div class="implemented-surface">
        <p class="surface-scope">{fixture.scope}</p>
        {#if fixture.presentation === 'progress'}
          <ol class="surface-steps" aria-label="Current stages">
            {#each fixture.rows as row, index (row[0])}
              <li class:is-current={index === 1}><span>{index + 1}</span><div><strong>{row[0]}</strong><small>{row[1]}</small></div></li>
            {/each}
          </ol>
        {:else if fixture.presentation === 'telemetry'}
          <div class="surface-console" aria-label="Bounded evidence stream">
            <code>23:41:08 · owner revision accepted</code>
            <code>23:41:11 · model call completed</code>
            <code>23:41:13 · projection committed</code>
          </div>
          <dl class="surface-facts">
            {#each fixture.rows as row (row[0])}<div><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}
          </dl>
        {:else if fixture.presentation === 'versions'}
          <div class="surface-variants" role="list" aria-label="Saved variants">
            {#each [1, 2, 3] as variant}
              <button type="button" data-pom-part="button.surface" aria-pressed={selectedVariant === variant} onclick={() => selectedVariant = variant}>
                <strong>Variant {variant}</strong><small>{variant === 2 ? 'Current · committed' : 'Saved comparison'}</small>
              </button>
            {/each}
          </div>
        {:else if fixture.presentation === 'inspector'}
          <div class="surface-inspector">
            {#each ['Summary', 'Evidence', 'Extension evidence'] as section, index}
              <details open={index === 0}><summary>{section}</summary><p>{index === 0 ? 'Saved turn 42 · Variant 2 · complete' : 'Bounded stored evidence remains read-only.'}</p></details>
            {/each}
          </div>
        {:else if fixture.presentation === 'condition'}
          <div class="surface-condition">
            {#each fixture.rows as row, index (row[0])}
              <div data-pom-part="row.surface"><span class="surface-avatar">{initials(row[0])}</span><strong>{row[0]}</strong><small>{row[1]}</small><meter min="0" max="4" value={4 - index}>Condition {4 - index} of 4</meter></div>
            {/each}
          </div>
        {:else if fixture.presentation === 'ambience'}
          <div class="surface-mixer">
            {#each fixture.rows as row, index (row[0])}
              {@const level = index === 0 ? 42 : index === 1 ? 28 : 8}
              <label><span>{row[0]}</span><output>{row[1]}</output><input data-pom-part="slider.input" aria-label={`${row[0]} level`} type="range" min="0" max="100" value={level} style={sliderStyle(level, 0, 100)} oninput={(event) => syncSliderProgress(event.currentTarget)} /></label>
            {/each}
          </div>
        {:else if fixture.presentation === 'backdrop'}
          <figure class="surface-backdrop"><div aria-label="Reservoir windows backdrop preview"></div><figcaption>Reservoir windows <span>Visible turn 42</span></figcaption></figure>
        {:else if fixture.presentation === 'tasks' || fixture.presentation === 'maintenance'}
          <div class="surface-tasks">
            {#each fixture.rows as row, index (row[0])}
              <div data-pom-part="row.surface"><span aria-hidden="true" class:is-running={row[1].includes('Running')}></span><strong>{row[0]}</strong><small>{row[1]}</small>{#if index === 1}<progress max="100" value="64">64%</progress>{/if}</div>
            {/each}
          </div>
        {:else if fixture.presentation === 'archive'}
          <div class="surface-workspace">
            <nav aria-label="Library selection">
              {#each fixture.rows as row, index (row[0])}<button type="button" data-pom-part="button.surface" aria-current={index === 0 ? 'true' : undefined}>{row[0]}<small>{row[1]}</small></button>{/each}
            </nav>
            <section data-pom-part="group.surface"><span class="surface-avatar large">{initials(fixture.rows[0]?.[0] ?? 'Library')}</span><strong>{fixture.rows[0]?.[1]}</strong><p>Selected record · saved owner projection</p></section>
          </div>
        {:else if fixture.presentation === 'roster'}
          <div class="surface-roster">
            {#each fixture.rows as row (row[0])}<button type="button" data-pom-part="button.surface"><span class="surface-avatar">{initials(row[0])}</span><strong>{row[0]}</strong><small>{row[1]}</small><i aria-hidden="true"></i></button>{/each}
          </div>
        {:else if fixture.presentation === 'wizard'}
          <ol class="surface-wizard" aria-label="Reviewed workflow">
            {#each fixture.rows as row, index (row[0])}<li data-pom-part="row.surface"><span>{index + 1}</span><div><strong>{row[0]}</strong><small>{row[1]}</small></div><button type="button" data-pom-part="button.surface">Choose</button></li>{/each}
          </ol>
        {:else if fixture.presentation === 'document'}
          <div class="surface-document">
            {#each fixture.rows as row (row[0])}<label>{row[0]}<input data-pom-part="field.surface" value={row[1]} aria-label={row[0]} /></label>{/each}
            <label class="surface-document-body">Notes<textarea data-pom-part="field.surface">Rain-softened maps and a careful record of the third bell.</textarea></label>
          </div>
        {:else if fixture.presentation === 'tree'}
          <div class="surface-tree"><button type="button" data-pom-part="button.surface" aria-expanded="true">▾ Drowned Observatory</button><button type="button" data-pom-part="button.surface" aria-expanded="true">　▾ Thresholds</button><button class="is-selected" type="button" data-pom-part="button.surface">　　 The pale threshold</button><button type="button" data-pom-part="button.surface">　 Floodgate history</button></div>
        {:else if fixture.presentation === 'relationships'}
          <div class="surface-relationships">
            {#each fixture.rows as row (row[0])}<div data-pom-part="row.surface"><strong>{row[0]}</strong><span aria-hidden="true">→</span><small>{row[1]}</small></div>{/each}
          </div>
        {:else if fixture.presentation === 'generator'}
          <div class="surface-generator"><div class="surface-plan" data-pom-part="row.surface">Plan</div><div class="surface-plan is-current" data-pom-part="row.surface">Review</div><div class="surface-plan" data-pom-part="row.surface">Apply</div></div>
          <dl class="surface-facts">{#each fixture.rows as row (row[0])}<div data-pom-part="row.surface"><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}</dl>
        {:else if fixture.presentation === 'credentials'}
          <div class="surface-providers">
            {#each fixture.rows as row, index (row[0])}<div data-pom-part="row.surface"><span class="surface-avatar">{row[0].slice(0, 2).toUpperCase()}</span><strong>{row[0]}</strong><small>{row[1]}</small><button type="button" data-pom-part="button.surface">{index === 1 ? 'Configure' : 'Test'}</button></div>{/each}
          </div>
        {:else if fixture.presentation === 'assignments'}
          <div class="surface-assignments">
            {#each fixture.rows as row (row[0])}<label data-pom-part="row.surface"><span>{row[0]}<small>{row[1]}</small></span><select data-pom-part="field.surface" aria-label={`${row[0]} assignment`}><option>{row[1]}</option><option>Follow Default</option></select></label>{/each}
          </div>
        {:else if fixture.presentation === 'theme'}
          <div class="surface-themes">
            {#each hostContext.theme.presets as preset (preset.id)}<button type="button" data-pom-part="button.surface" aria-pressed={hostContext.theme.activeId === preset.id} onclick={() => hostContext.theme.activate(preset.id)}><i style={preset.swatchStyle}></i><strong>{preset.label}</strong><small>{preset.description}</small></button>{/each}
          </div>
        {:else if fixture.presentation === 'accessibility'}
          <div class="surface-accessibility">
            <label>Text scale <input data-pom-part="slider.input" type="range" min="80" max="160" value="100" style={sliderStyle(100, 80, 160)} oninput={(event) => syncSliderProgress(event.currentTarget)} /><output>100%</output></label>
            <label><input data-pom-part="field.surface" type="checkbox" /> High contrast</label><label><input data-pom-part="field.surface" type="checkbox" checked /> Follow reduced-motion setting</label>
            <p aria-label="Accessibility live sample">Live sample: Reservoir light across quiet water.</p>
          </div>
        {:else if fixture.presentation === 'prompt'}
          <div class="surface-prompt"><nav aria-label="Prompt sheets"><button data-pom-part="button.surface" aria-current="page">Narration</button><button data-pom-part="button.surface">Director</button><button data-pom-part="button.surface">Characters</button><button data-pom-part="button.surface">Memory</button></nav><label>Prompt sheet<textarea data-pom-part="field.surface" readonly>You are the narrator. Preserve established facts, subjective knowledge, and player agency.</textarea></label></div>
        {:else}
          <dl class="surface-facts">
            {#each fixture.rows as row (row[0])}<div data-pom-part="row.surface"><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}
          </dl>
        {/if}

        <p class="surface-boundary"><span aria-hidden="true">i</span>{fixture.boundary}</p>
        {#if fixture.actions.length}
          <footer class="surface-actions">{#each fixture.actions as action (action)}<button type="button" data-pom-part="button.surface" onclick={action === 'Open Custom Theme' ? hostContext.theme.openSettings : undefined}>{action}</button>{/each}</footer>
        {/if}
      </div>
    {/if}
    {#if fixture.presentation === 'reader' || fixture.presentation === 'composer'}
      <p class="surface-boundary"><span aria-hidden="true">i</span>{fixture.boundary}</p>
      {#if fixture.actions.length && fixture.presentation !== 'composer'}
        <footer class="surface-actions">{#each fixture.actions as action (action)}<button type="button" data-pom-part="button.surface">{action}</button>{/each}</footer>
      {/if}
    {/if}
  </div>
{/if}
