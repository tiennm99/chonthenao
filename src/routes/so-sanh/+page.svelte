<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import StaleBadge from '#lib/components/StaleBadge.svelte';
  import {
    CATEGORY_LABELS,
    NETWORK_LABELS,
    UNKNOWN,
    describeRate,
    formatCap,
    formatDate,
    formatPercent,
    formatVnd,
    rewardFor,
  } from '#lib/catalog.js';
  import { bankById, cardById, cards } from '#lib/data/index.js';
  import { SITE_NAME } from '#lib/site.js';

  const MAX = 3;
  const options = [...cards].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  /** @type {string[]} Selected card ids, one per column; '' is an empty slot. */
  let ids = $state(['', '', '']);
  let ready = $state(false);

  // The selection lives in ?the=a,b,c so a comparison can be shared; read it in the browser,
  // since the page is prerendered without a query.
  onMount(() => {
    const fromUrl = (new URLSearchParams(location.search).get('the') ?? '')
      .split(',')
      .filter((id) => cardById.has(id))
      .slice(0, MAX);
    ids = [...fromUrl, '', '', ''].slice(0, MAX);
    ready = true;
  });

  $effect(() => {
    const chosen = ids.filter(Boolean);
    if (!ready) return;
    const query = chosen.length ? `?the=${chosen.join(',')}` : '';
    // The path comes from resolve(); only the query string changes.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    replaceState(`${resolve('/so-sanh')}/${query}`, {});
  });

  const selected = $derived(ids.map((id) => cardById.get(id)).filter((c) => c !== undefined));
  const categories = $derived(
    Object.keys(CATEGORY_LABELS).filter((k) =>
      selected.some((c) => c.rewards.some((r) => r.category === k)),
    ),
  );

  /** @type {{ label: string, value: (c: import('#lib/data/schema.js').Card) => string }[]} */
  const rows = [
    { label: 'Ngân hàng', value: (c) => bankById.get(c.bank)?.shortName ?? c.bank },
    { label: 'Tổ chức thẻ', value: (c) => NETWORK_LABELS[c.network] },
    {
      label: 'Phí thường niên',
      value: (c) =>
        formatVnd(c.annualFee) + (c.feesFinal === false && c.annualFee ? ' (chưa gồm VAT)' : ''),
    },
    { label: 'Miễn phí thường niên', value: (c) => c.feeWaiver?.text ?? 'Không thấy công bố' },
    { label: 'Phí nước ngoài (tổng)', value: (c) => formatPercent(c.fxFee) },
    {
      label: 'Lãi suất',
      value: (c) => (c.interestRate === null ? UNKNOWN : `${formatPercent(c.interestRate)}/năm`),
    },
    {
      label: 'Miễn lãi tối đa',
      value: (c) => (c.interestFreeDays === null ? UNKNOWN : `${c.interestFreeDays} ngày`),
    },
    {
      label: 'Thu nhập tối thiểu',
      value: (c) => (c.minIncome === null ? UNKNOWN : `${formatVnd(c.minIncome)}/tháng`),
    },
    {
      label: 'Chi tiêu tối thiểu để nhận ưu đãi',
      value: (c) => (c.minSpendMonth === null ? 'Không' : `${formatVnd(c.minSpendMonth)}/tháng`),
    },
    {
      label: 'Ưu đãi áp dụng đến',
      value: (c) => (c.rewardsUntil === null ? 'Không ghi' : formatDate(c.rewardsUntil)),
    },
    { label: 'Kiểm tra lần cuối', value: (c) => formatDate(c.lastVerified) },
  ];

  /**
   * @param {import('#lib/data/schema.js').Card} c
   * @param {string} category
   * @returns {string}
   */
  function rewardCell(c, category) {
    const r = rewardFor(c, category);
    if (!r) return 'không có';
    const cap = r.capMonth === null ? '' : `, tối đa ${formatCap(r.capMonth, r.type)}/tháng`;
    const base = r.category !== category ? ' (mức cơ bản)' : '';
    return `${describeRate(r)}${base}${cap}`;
  }
</script>

<svelte:head>
  <title>So sánh thẻ — {SITE_NAME}</title>
  <meta
    name="description"
    content="So sánh 2 đến 3 thẻ tín dụng cạnh nhau: phí, hoàn tiền, phí nước ngoài, lãi suất và điều kiện."
  />
</svelte:head>

<h1 class="text-3xl font-bold">So sánh thẻ</h1>
<p class="mt-2 max-w-2xl text-slate-700">Chọn 2 đến 3 thẻ để xem cạnh nhau.</p>

<div class="mt-6 grid gap-3 sm:grid-cols-3">
  {#each ids as _, i (i)}
    <label class="text-sm">
      Thẻ {i + 1}
      <select
        class="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        bind:value={ids[i]}
      >
        <option value="">— Chọn thẻ —</option>
        {#each options as c (c.id)}
          <option value={c.id} disabled={ids.includes(c.id) && ids[i] !== c.id}>{c.name}</option>
        {/each}
      </select>
    </label>
  {/each}
</div>

{#if selected.length < 2}
  <p class="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">
    Chọn ít nhất 2 thẻ để so sánh.
  </p>
{:else}
  <div class="mt-6 overflow-x-auto">
    <table class="w-full min-w-[36rem] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="w-48 py-2 pr-4"></th>
          {#each selected as c (c.id)}
            <th class="py-2 pr-4 align-top font-semibold">
              <a class="text-teal-800 underline" href={resolve('/the/[id]', { id: c.id })}>
                {c.name}
              </a>
              <StaleBadge lastVerified={c.lastVerified} />
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.label)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">{row.label}</th>
            {#each selected as c (c.id)}<td class="py-2 pr-4">{row.value(c)}</td>{/each}
          </tr>
        {/each}
        {#each categories as k (k)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">Ưu đãi: {CATEGORY_LABELS[k]}</th>
            {#each selected as c (c.id)}<td class="py-2 pr-4">{rewardCell(c, k)}</td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="mt-3 text-sm text-slate-600">
    Điều kiện chi tiết (hạn mức chung, danh mục được chọn, loại trừ) nằm ở trang của từng thẻ.
  </p>
{/if}
