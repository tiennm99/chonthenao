<script>
  import { resolve } from '$app/paths';
  import CardSummary from '#lib/components/CardSummary.svelte';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import { formatDate } from '#lib/catalog.js';
  import { SITE_NAME } from '#lib/site.js';

  let { data } = $props();
  const bank = $derived(data.bank);
</script>

<svelte:head>
  <title>{bank.shortName} — {SITE_NAME}</title>
  <meta name="description" content="Thẻ tín dụng của {bank.name} và link nguồn chính thức." />
</svelte:head>

<nav class="text-sm text-slate-500">
  <a class="hover:underline" href={resolve('/ngan-hang')}>Ngân hàng</a>
</nav>

<h1 class="mt-2 text-3xl font-bold">{bank.shortName}</h1>
<p class="mt-1 text-slate-600">{bank.name}</p>

<ul class="mt-4 space-y-1 text-sm">
  <li><ExternalLink href={bank.officialUrl}>Trang chủ chính thức</ExternalLink></li>
  {#if bank.cardsUrl}
    <li><ExternalLink href={bank.cardsUrl}>Danh sách thẻ tín dụng của ngân hàng</ExternalLink></li>
  {/if}
  {#if bank.feeScheduleUrl}
    <li><ExternalLink href={bank.feeScheduleUrl}>Biểu phí</ExternalLink></li>
  {/if}
</ul>

<h2 class="mt-8 text-xl font-semibold">Thẻ trong dữ liệu ({data.cards.length})</h2>
{#if data.cards.length === 0}
  <p class="mt-3 text-slate-700">
    Chưa có thẻ nào của {bank.shortName} trong dữ liệu. Xem trực tiếp trên trang của ngân hàng.
  </p>
{:else}
  <div class="mt-3 space-y-3">
    {#each data.cards as card (card.id)}
      <CardSummary {card} />
    {/each}
  </div>
{/if}

<p class="mt-8 text-sm text-slate-500">
  Thông tin ngân hàng kiểm tra lần cuối: {formatDate(bank.lastVerified)}.
</p>
