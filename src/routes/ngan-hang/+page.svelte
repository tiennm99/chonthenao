<script>
  import { resolve } from '$app/paths';
  import { banks, cards } from '#lib/data/index.js';
  import { SITE_NAME } from '#lib/site.js';

  const rows = banks
    .map((b) => ({ bank: b, count: cards.filter((c) => c.bank === b.id).length }))
    .sort((a, b) => b.count - a.count || a.bank.shortName.localeCompare(b.bank.shortName, 'vi'));
</script>

<svelte:head>
  <title>Ngân hàng — {SITE_NAME}</title>
  <meta
    name="description"
    content="Các ngân hàng tại Việt Nam và thẻ tín dụng của họ trong dữ liệu."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Ngân hàng</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  {banks.length} ngân hàng phổ biến tại Việt Nam. Một số ngân hàng chưa có thẻ trong dữ liệu.
</p>

<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {#each rows as { bank, count } (bank.id)}
    <li>
      <a
        class="block rounded-xl border border-slate-200 p-4 hover:border-teal-400"
        href={resolve('/ngan-hang/[id]', { id: bank.id })}
      >
        <span class="font-semibold text-teal-800">{bank.shortName}</span>
        <span class="block text-sm text-slate-500">
          {count > 0 ? `${count} thẻ` : 'Chưa có dữ liệu thẻ'}
        </span>
      </a>
    </li>
  {/each}
</ul>
