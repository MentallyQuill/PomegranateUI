<script lang="ts">let { templateId }: { templateId: string } = $props();</script>
<section class="unavailable-template" role="status" data-pomegranate-template-unavailable={templateId}>
  <h2>Panel template unavailable</h2>
  <p>The saved template <code>{templateId}</code> is not registered. Its layout data has been preserved.</p>
</section>
