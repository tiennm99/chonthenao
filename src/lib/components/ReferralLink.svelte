<script>
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import { REFERRAL_NOTE } from '#lib/site.js';

  /**
   * A bank's referral link, always labelled and next to the note that the site may be rewarded.
   * It is shown on bank and card pages only, never in rankings.
   * @type {{ referral: import('#lib/data/schema.js').Referral }}
   */
  let { referral } = $props();
</script>

<div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
  <p>
    <span class="font-medium">Link giới thiệu:</span>
    <ExternalLink href={referral.url}>{referral.note}</ExternalLink>
  </p>
  <p class="mt-1 text-xs text-slate-500">{REFERRAL_NOTE}</p>
</div>
