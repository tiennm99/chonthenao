<script>
  import { onMount } from 'svelte';
  import { STALE_AFTER_DAYS, isStale } from '#lib/staleness.js';

  /** @type {{ lastVerified: string }} */
  let { lastVerified } = $props();

  // Decided in the browser with the visitor's clock, so the badge never freezes at build time.
  let stale = $state(false);
  onMount(() => {
    stale = isStale(lastVerified);
  });
</script>

{#if stale}
  <span
    class="inline-block rounded bg-red-100 px-1.5 text-xs font-medium text-red-800"
    title="Chưa kiểm tra lại quá {STALE_AFTER_DAYS} ngày"
  >
    có thể đã cũ
  </span>
{/if}
