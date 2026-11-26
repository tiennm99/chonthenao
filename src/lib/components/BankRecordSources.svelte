<script>
  import BankStaleBadge from '#lib/components/BankStaleBadge.svelte';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import { formatDate } from '#lib/catalog.js';
  import { STALE_AFTER_DAYS } from '#lib/staleness.js';

  /**
   * Notes, sources and the last-verified date of one banking, savings or loans record.
   * @type {{ record: { notes: string[], sourceUrls: string[], lastVerified: string },
   *   days?: number }}
   */
  let { record, days = STALE_AFTER_DAYS } = $props();
</script>

<div class="mt-3 text-sm">
  {#if record.notes.length > 0}
    <ul class="list-disc space-y-1 pl-5 text-slate-700">
      {#each record.notes as note (note)}<li>{note}</li>{/each}
    </ul>
  {/if}
  <p class="mt-2 text-slate-500">
    Kiểm tra lần cuối: {formatDate(record.lastVerified)}
    <BankStaleBadge lastVerified={record.lastVerified} {days} />
  </p>
  <p class="mt-1 text-slate-500">Nguồn:</p>
  <ul class="space-y-1 break-all">
    {#each record.sourceUrls as url (url)}
      <li><ExternalLink href={url}>{url}</ExternalLink></li>
    {/each}
  </ul>
</div>
