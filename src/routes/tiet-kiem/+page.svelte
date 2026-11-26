<script>
  import { resolve } from '$app/paths';
  import BankRecordSources from '#lib/components/BankRecordSources.svelte';
  import BankStaleBadge from '#lib/components/BankStaleBadge.svelte';
  import { formatPercent } from '#lib/catalog.js';
  import { banks, bankById, savings } from '#lib/data/index.js';
  import {
    CHANNEL_LABELS,
    bestRatesByTerm,
    formatAmount,
    isBestRate,
    listedTerms,
    savingsRate,
    sortSavingsByTerm,
  } from '#lib/ecosystem.js';
  import { SITE_NAME } from '#lib/site.js';
  import { RATE_STALE_AFTER_DAYS } from '#lib/staleness.js';

  /**
   * @param {string} id
   * @returns {string}
   */
  const nameOf = (id) => bankById.get(id)?.shortName ?? id;

  const terms = listedTerms(savings);
  const best = bestRatesByTerm(savings);
  const missing = banks
    .filter((b) => !savings.some((r) => r.bank === b.id))
    .map((b) => b.shortName)
    .sort((a, b) => a.localeCompare(b, 'vi'));

  let sortTerm = $state(terms.includes(12) ? 12 : (terms[0] ?? 12));
  const rows = $derived(sortSavingsByTerm(savings, sortTerm, (r) => nameOf(r.bank)));
  const byName = [...savings].sort((a, b) => nameOf(a.bank).localeCompare(nameOf(b.bank), 'vi'));
</script>

<svelte:head>
  <title>Lãi suất tiết kiệm — {SITE_NAME}</title>
  <meta
    name="description"
    content="So sánh lãi suất gửi tiết kiệm có kỳ hạn của các ngân hàng tại Việt Nam theo từng kỳ hạn, kèm nguồn chính thức."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Lãi suất tiết kiệm</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  Lãi suất gửi tiết kiệm VND có kỳ hạn cho khách hàng cá nhân, lĩnh lãi cuối kỳ, ở mức tiền gửi thấp
  nhất. Bấm vào một kỳ hạn để sắp xếp; mức cao nhất của mỗi kỳ hạn được tô đậm.
</p>
<p class="mt-3 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
  Lãi suất thay đổi thường xuyên, có khi hằng tuần. Hãy kiểm tra lại với ngân hàng trước khi gửi. Số
  liệu chưa kiểm tra lại quá {RATE_STALE_AFTER_DAYS} ngày được đánh dấu "có thể đã cũ".
</p>
<p class="mt-3 text-sm">
  <a class="text-teal-700 underline" href={resolve('/so-sanh-ngan-hang')}>So sánh ngân hàng</a>
  · <a class="text-teal-700 underline" href={resolve('/vay')}>Lãi suất vay</a>
</p>

{#if savings.length === 0}
  <p class="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">
    Chưa có dữ liệu lãi suất tiết kiệm.
  </p>
{:else}
  <div class="mt-6 overflow-x-auto">
    <table class="w-full min-w-[40rem] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="py-2 pr-3">Ngân hàng</th>
          <th class="py-2 pr-3">Kênh</th>
          {#each terms as t (t)}
            <th class="py-2 pr-3 text-right" aria-sort={sortTerm === t ? 'descending' : 'none'}>
              <button
                type="button"
                class="font-semibold hover:text-teal-700 {sortTerm === t
                  ? 'text-teal-800 underline'
                  : ''}"
                onclick={() => (sortTerm = t)}
              >
                {t} tháng
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.bank)}
          <tr class="border-b border-slate-100">
            <th class="py-2 pr-3 font-medium">
              <a class="text-teal-800 underline" href={resolve('/ngan-hang/[id]', { id: r.bank })}>
                {nameOf(r.bank)}
              </a>
              <BankStaleBadge lastVerified={r.lastVerified} days={RATE_STALE_AFTER_DAYS} />
            </th>
            <td class="py-2 pr-3">{CHANNEL_LABELS[r.channel]}</td>
            {#each terms as t (t)}
              {@const rate = savingsRate(r, t)}
              <td
                class="py-2 pr-3 text-right tabular-nums {isBestRate(best, t, rate)
                  ? 'font-bold text-teal-800'
                  : ''} {rate === null ? 'text-slate-500' : ''}"
              >
                {rate === null ? '—' : formatPercent(rate)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="mt-2 text-sm text-slate-600">
    Đơn vị: %/năm. "—": ngân hàng không công bố kỳ hạn này hoặc chưa rõ mức lãi.
  </p>
{/if}

{#if missing.length > 0}
  <p class="mt-4 text-sm text-slate-600">Chưa có dữ liệu: {missing.join(', ')}.</p>
{/if}

{#if byName.length > 0}
  <h2 class="mt-10 text-xl font-semibold">Điều kiện, ngày áp dụng và nguồn</h2>
  <div class="mt-3 space-y-3">
    {#each byName as r (r.bank)}
      <details class="rounded-xl border border-slate-200 p-4">
        <summary class="cursor-pointer font-semibold text-teal-800">
          {nameOf(r.bank)} · {CHANNEL_LABELS[r.channel]} · gửi tối thiểu {formatAmount(r.minAmount)}
        </summary>
        <BankRecordSources record={r} days={RATE_STALE_AFTER_DAYS} />
      </details>
    {/each}
  </div>
{/if}
