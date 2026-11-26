<script>
  import { resolve } from '$app/paths';
  import { formatPercent, formatVnd } from '#lib/catalog.js';
  import { bankingByBank, banks, cards, savingsByBank } from '#lib/data/index.js';
  import { savingsRate } from '#lib/ecosystem.js';
  import { SITE_NAME } from '#lib/site.js';

  const rows = banks
    .map((b) => {
      const own = cards.filter((c) => c.bank === b.id);
      return {
        bank: b,
        count: own.length,
        credit: own.filter((c) => c.kind === 'credit').length,
        debit: own.filter((c) => c.kind === 'debit').length,
        savings: savingsByBank.get(b.id),
        banking: bankingByBank.get(b.id),
      };
    })
    .sort((a, b) => b.count - a.count || a.bank.shortName.localeCompare(b.bank.shortName, 'vi'));

  /**
   * @param {number} credit
   * @param {number} debit
   * @returns {string}
   */
  function cardLine(credit, debit) {
    if (credit + debit === 0) return 'Chưa có dữ liệu thẻ';
    return [credit && `${credit} thẻ tín dụng`, debit && `${debit} thẻ ghi nợ`]
      .filter(Boolean)
      .join(', ');
  }
</script>

<svelte:head>
  <title>Ngân hàng — {SITE_NAME}</title>
  <meta
    name="description"
    content="Các ngân hàng tại Việt Nam: thẻ tín dụng, thẻ ghi nợ, phí tài khoản, lãi suất tiết kiệm và vay trong dữ liệu."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Ngân hàng</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  {banks.length} ngân hàng phổ biến tại Việt Nam. Một số ngân hàng chưa có thẻ hay số liệu trong dữ liệu.
</p>
<p class="mt-3 text-sm">
  <a class="font-medium text-teal-700 underline" href={resolve('/so-sanh-ngan-hang')}>
    So sánh ngân hàng
  </a>
  · <a class="text-teal-700 underline" href={resolve('/tiet-kiem')}>Lãi suất tiết kiệm</a>
  · <a class="text-teal-700 underline" href={resolve('/vay')}>Lãi suất vay</a>
</p>

<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {#each rows as { bank, credit, debit, savings, banking } (bank.id)}
    {@const rate12 = savingsRate(savings, 12)}
    <li>
      <a
        class="block h-full rounded-xl border border-slate-200 p-4 hover:border-teal-400"
        href={resolve('/ngan-hang/[id]', { id: bank.id })}
      >
        <span class="font-semibold text-teal-800">{bank.shortName}</span>
        <span class="block text-sm text-slate-500">{cardLine(credit, debit)}</span>
        <span class="mt-1 block text-xs text-slate-600">
          Tiết kiệm 12 tháng: {savings
            ? rate12 === null
              ? 'chưa rõ'
              : `${formatPercent(rate12)}/năm`
            : 'chưa có dữ liệu'}
        </span>
        <span class="block text-xs text-slate-600">
          Chuyển khoản liên ngân hàng: {banking
            ? formatVnd(banking.transferInterbankFee)
            : 'chưa có dữ liệu'}
        </span>
      </a>
    </li>
  {/each}
</ul>
