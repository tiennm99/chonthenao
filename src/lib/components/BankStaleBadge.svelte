<script>
  import { onMount } from 'svelte';
  import { STALE_AFTER_DAYS, isStale } from '#lib/staleness.js';

  /**
   * The "có thể đã cũ" badge for a bank's banking, savings or loan record, with its own age limit:
   * rates go stale sooner than fees.
   * @type {{ lastVerified: string, days?: number }}
   */
  let { lastVerified, days = STALE_AFTER_DAYS } = $props();

  // Decided in the browser with the visitor's clock, so the badge never freezes at build time.
  let stale = $state(false);
  onMount(() => {
    stale = isStale(lastVerified, new Date(), days);
  });
</script>

{#if stale}
  <span
    class="inline-block rounded bg-red-100 px-1.5 text-xs font-medium text-red-800"
    title="Chưa kiểm tra lại quá {days} ngày"
  >
    có thể đã cũ
  </span>
{/if}
