<script>
  import { resolve } from '$app/paths';
  import BankRecordSources from '#lib/components/BankRecordSources.svelte';
  import BankStaleBadge from '#lib/components/BankStaleBadge.svelte';
  import { UNKNOWN, formatPercent, formatVnd } from '#lib/catalog.js';
  import { banks, bankById, loans } from '#lib/data/index.js';
  import { LOAN_TYPES } from '#lib/data/schema.js';
  import { LOAN_TYPE_LABELS, formatMonths, loansOfType } from '#lib/ecosystem.js';
  import { SITE_NAME } from '#lib/site.js';
  import { RATE_STALE_AFTER_DAYS } from '#lib/staleness.js';

  /**
   * @param {string} id
   * @returns {string}
   */
  const nameOf = (id) => bankById.get(id)?.shortName ?? id;

  let type = $state(LOAN_TYPES[0]);
  const rows = $derived(loansOfType(loans, type, nameOf));
  const missing = $derived(
    banks
      .filter((b) => !rows.some((r) => r.bank === b.id))
      .map((b) => b.shortName)
      .sort((a, b) => a.localeCompare(b, 'vi')),
  );
  const byName = [...loans].sort((a, b) => nameOf(a.bank).localeCompare(nameOf(b.bank), 'vi'));
</script>

<svelte:head>
  <title>Lãi suất vay — {SITE_NAME}</title>
  <meta
    name="description"
    content="So sánh lãi suất vay tín chấp, vay mua nhà và vay mua ô tô của các ngân hàng tại Việt Nam, kèm thời gian cố định, kỳ hạn và nguồn chính thức."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Lãi suất vay</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  Mức "lãi suất từ" mà ngân hàng công bố cho từng sản phẩm vay cá nhân, sắp xếp từ thấp đến cao.
</p>
<p class="mt-3 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
  "Lãi suất từ" là mức thấp nhất, thường chỉ áp dụng trong thời gian ưu đãi đầu và cho hồ sơ đủ điều
  kiện. Sau thời gian cố định, lãi suất thả nổi theo lãi suất cơ sở của ngân hàng cộng biên độ, và
  thường cao hơn nhiều. Hãy hỏi ngân hàng mức lãi sau ưu đãi trước khi vay. Số liệu chưa kiểm tra
  lại quá {RATE_STALE_AFTER_DAYS} ngày được đánh dấu "có thể đã cũ".
</p>
<p class="mt-3 text-sm">
  <a class="text-teal-700 underline" href={resolve('/so-sanh-ngan-hang')}>So sánh ngân hàng</a>
  · <a class="text-teal-700 underline" href={resolve('/tiet-kiem')}>Lãi suất tiết kiệm</a>
</p>

<div class="mt-6 flex flex-wrap gap-2" role="group" aria-label="Loại khoản vay">
  {#each LOAN_TYPES as t (t)}
    <button
      type="button"
      aria-pressed={type === t}
      class="rounded-full border px-3 py-1 text-sm font-medium {type === t
        ? 'border-teal-700 bg-teal-700 text-white'
        : 'border-slate-300 hover:border-teal-400'}"
      onclick={() => (type = t)}
    >
      {LOAN_TYPE_LABELS[t]}
    </button>
  {/each}
</div>

{#if rows.length === 0}
  <p class="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">
    Chưa có dữ liệu {LOAN_TYPE_LABELS[type].toLowerCase()}.
  </p>
{:else}
  <div class="mt-4 overflow-x-auto">
    <table class="w-full min-w-[44rem] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="py-2 pr-3">Ngân hàng</th>
          <th class="py-2 pr-3">Sản phẩm</th>
          <th class="py-2 pr-3 text-right">Lãi suất từ</th>
          <th class="py-2 pr-3">Cố định</th>
          <th class="py-2 pr-3">Thời hạn tối đa</th>
          <th class="py-2 pr-3">Số tiền tối đa</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r (`${r.bank}-${r.index}`)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-3 font-medium">
              <a class="text-teal-800 underline" href={resolve('/ngan-hang/[id]', { id: r.bank })}>
                {nameOf(r.bank)}
              </a>
              <BankStaleBadge lastVerified={r.record.lastVerified} days={RATE_STALE_AFTER_DAYS} />
            </th>
            <td class="py-2 pr-3">
              {r.product.name}
              {#if r.product.note}
                <p class="mt-1 text-xs text-slate-600">{r.product.note}</p>
              {/if}
            </td>
            <td class="py-2 pr-3 text-right font-semibold tabular-nums">
              {r.product.rateFrom === null ? UNKNOWN : `${formatPercent(r.product.rateFrom)}/năm`}
            </td>
            <td class="py-2 pr-3">
              {r.product.fixedMonths === null
                ? UNKNOWN
                : `cố định ${r.product.fixedMonths} tháng đầu`}
            </td>
            <td class="py-2 pr-3">{formatMonths(r.product.maxTermMonths)}</td>
            <td class="py-2 pr-3">
              {r.product.maxAmount === null ? UNKNOWN : formatVnd(r.product.maxAmount)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

{#if missing.length > 0}
  <p class="mt-4 text-sm text-slate-600">
    Chưa có dữ liệu {LOAN_TYPE_LABELS[type].toLowerCase()}: {missing.join(', ')}.
  </p>
{/if}

{#if byName.length > 0}
  <h2 class="mt-10 text-xl font-semibold">Lưu ý và nguồn</h2>
  <div class="mt-3 space-y-3">
    {#each byName as r (r.bank)}
      <details class="rounded-xl border border-slate-200 p-4">
        <summary class="cursor-pointer font-semibold text-teal-800">{nameOf(r.bank)}</summary>
        <BankRecordSources record={r} days={RATE_STALE_AFTER_DAYS} />
      </details>
    {/each}
  </div>
{/if}
