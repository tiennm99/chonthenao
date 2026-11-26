<script>
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import BankStaleBadge from '#lib/components/BankStaleBadge.svelte';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import { UNKNOWN, formatDate, formatPercent, formatVnd } from '#lib/catalog.js';
  import {
    bankById,
    banking,
    bankingByBank,
    banks,
    cardsOfBank,
    loans,
    loansByBank,
    savings,
    savingsByBank,
  } from '#lib/data/index.js';
  import { BANKING_FEE_FIELDS, LOAN_TYPES } from '#lib/data/schema.js';
  import {
    BANKING_FEE_LABELS,
    CHANNEL_LABELS,
    LOAN_TYPE_LABELS,
    YEARLY_INTERBANK_TRANSFERS,
    bankingFee,
    formatBankingFee,
    listedTerms,
    lowestLoanRate,
    savingsRate,
    yearlyBankingCost,
  } from '#lib/ecosystem.js';
  import { SITE_NAME } from '#lib/site.js';
  import { RATE_STALE_AFTER_DAYS, STALE_AFTER_DAYS } from '#lib/staleness.js';

  /** @typedef {import('#lib/data/schema.js').Bank} Bank */

  const MAX = 3;
  const NO_DATA = 'chưa có dữ liệu';
  const NO_TERM = 'không có kỳ hạn này';
  const NO_PRODUCT = 'không công bố sản phẩm';
  const options = [...banks].sort((a, b) => a.shortName.localeCompare(b.shortName, 'vi'));
  const terms = listedTerms(savings);
  // Loan types some bank publishes a product for, so an empty row never shows.
  const loanTypes = LOAN_TYPES.filter((t) =>
    loans.some((r) => r.products.some((p) => p.type === t)),
  );

  /** @type {string[]} Selected bank ids, one per column; '' is an empty slot. */
  let ids = $state(['', '', '']);
  let ready = $state(false);

  // The selection lives in ?b=a,b,c so a comparison can be shared; read it in the browser,
  // since the page is prerendered without a query.
  onMount(() => {
    const fromUrl = [...new Set((new URLSearchParams(location.search).get('b') ?? '').split(','))]
      .filter((id) => bankById.has(id))
      .slice(0, MAX);
    ids = [...fromUrl, '', '', ''].slice(0, MAX);
    ready = true;
  });

  $effect(() => {
    const chosen = ids.filter(Boolean);
    if (!ready) return;
    const query = chosen.length ? `?b=${chosen.join(',')}` : '';
    // The path comes from resolve(); only the query string changes.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    replaceState(`${resolve('/so-sanh-ngan-hang')}/${query}`, {});
  });

  const selected = $derived(ids.map((id) => bankById.get(id)).filter((b) => b !== undefined));

  /**
   * @param {Bank} b
   * @param {'credit'|'debit'} kind
   * @returns {import('#lib/data/schema.js').Card[]}
   */
  const cardsOf = (b, kind) => cardsOfBank(b.id).filter((c) => c.kind === kind);

  /**
   * @param {Bank} b
   * @param {string} field
   * @returns {string}
   */
  function feeCell(b, field) {
    const r = bankingByBank.get(b.id);
    if (!r) return NO_DATA;
    const value = bankingFee(r, field);
    // A minimum balance is an amount to keep, not a fee, so VAT never applies to it.
    const vat = field !== 'minBalance' && r.feesFinal === false && value ? ' (chưa gồm VAT)' : '';
    return formatBankingFee(field, value) + vat;
  }

  /**
   * @param {Bank} b
   * @returns {string}
   */
  function costCell(b) {
    const r = bankingByBank.get(b.id);
    if (!r) return NO_DATA;
    const cost = yearlyBankingCost(r);
    if (cost === null) return UNKNOWN;
    return formatVnd(cost) + (r.feesFinal === false && cost > 0 ? ' (đã cộng 10% VAT)' : '');
  }

  /**
   * @param {Bank} b
   * @param {number} term
   * @returns {string}
   */
  function savingsCell(b, term) {
    const r = savingsByBank.get(b.id);
    if (!r) return NO_DATA;
    if (!r.rates.some((x) => x.termMonths === term)) return NO_TERM;
    const rate = savingsRate(r, term);
    return rate === null ? UNKNOWN : `${formatPercent(rate)}/năm`;
  }

  /**
   * @param {Bank} b
   * @param {string} type
   * @returns {string}
   */
  function loanCell(b, type) {
    const r = loansByBank.get(b.id);
    if (!r) return NO_DATA;
    if (!r.products.some((p) => p.type === type)) return NO_PRODUCT;
    const rate = lowestLoanRate(r, type);
    return rate === null ? UNKNOWN : `từ ${formatPercent(rate)}/năm`;
  }
</script>

<svelte:head>
  <title>So sánh ngân hàng — {SITE_NAME}</title>
  <meta
    name="description"
    content="So sánh 2 đến 3 ngân hàng cạnh nhau: thẻ tín dụng, thẻ ghi nợ, phí tài khoản, chi phí ngân hàng ước tính mỗi năm, lãi suất tiết kiệm và lãi suất vay."
  />
</svelte:head>

<h1 class="text-3xl font-bold">So sánh ngân hàng</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  Chọn 2 đến 3 ngân hàng để xem cạnh nhau cả hệ sinh thái: thẻ, phí tài khoản, tiết kiệm và vay.
</p>
<p class="mt-3 text-sm">
  <a class="text-teal-700 underline" href={resolve('/tiet-kiem')}>Lãi suất tiết kiệm</a>
  · <a class="text-teal-700 underline" href={resolve('/vay')}>Lãi suất vay</a>
  · <a class="text-teal-700 underline" href={resolve('/ngan-hang')}>Danh sách ngân hàng</a>
</p>

<div class="mt-6 grid gap-3 sm:grid-cols-3">
  {#each ids as _, i (i)}
    <label class="text-sm">
      Ngân hàng {i + 1}
      <select
        class="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5"
        bind:value={ids[i]}
      >
        <option value="">— Chọn ngân hàng —</option>
        {#each options as b (b.id)}
          <option value={b.id} disabled={ids.includes(b.id) && ids[i] !== b.id}>
            {b.shortName}
          </option>
        {/each}
      </select>
    </label>
  {/each}
</div>

{#if selected.length < 2}
  <p class="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">
    Chọn ít nhất 2 ngân hàng để so sánh.
  </p>
{:else}
  <div class="mt-6 overflow-x-auto">
    <table class="w-full min-w-[36rem] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="w-56 py-2 pr-4"></th>
          {#each selected as b (b.id)}
            <th class="py-2 pr-4 align-top font-semibold">
              <a class="text-teal-800 underline" href={resolve('/ngan-hang/[id]', { id: b.id })}>
                {b.shortName}
              </a>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr class="bg-slate-50"><th class="py-2 pr-4" colspan={selected.length + 1}>Thẻ</th></tr>
        {#each [['credit', 'Thẻ tín dụng'], ['debit', 'Thẻ ghi nợ']] as [kind, label] (kind)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">{label}</th>
            {#each selected as b (b.id)}
              {@const list = cardsOf(b, /** @type {'credit'|'debit'} */ (kind))}
              <td class="py-2 pr-4">
                {#if list.length === 0}
                  {NO_DATA}
                {:else}
                  {list.length} thẻ
                  <ul class="mt-1 space-y-0.5">
                    {#each list as c (c.id)}
                      <li>
                        <a
                          class="text-teal-700 underline"
                          href={resolve('/the/[id]', { id: c.id })}
                        >
                          {c.name}
                        </a>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}

        <tr class="bg-slate-50">
          <th class="py-2 pr-4" colspan={selected.length + 1}>Tài khoản và phí dịch vụ</th>
        </tr>
        {#each BANKING_FEE_FIELDS as field (field)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">{BANKING_FEE_LABELS[field]}</th>
            {#each selected as b (b.id)}<td class="py-2 pr-4">{feeCell(b, field)}</td>{/each}
          </tr>
        {/each}
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">
            Chi phí ngân hàng ước tính mỗi năm
            <span class="block text-xs font-normal">
              Phí quản lý tài khoản, SMS và ngân hàng số trong 12 tháng, cộng {YEARLY_INTERBANK_TRANSFERS}
              lần chuyển khoản liên ngân hàng. Tính cả phí chỉ thu khi số dư dưới mức quy định.
            </span>
          </th>
          {#each selected as b (b.id)}<td class="py-2 pr-4 font-semibold">{costCell(b)}</td>{/each}
        </tr>
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">Phí: kiểm tra lần cuối</th>
          {#each selected as b (b.id)}
            {@const r = bankingByBank.get(b.id)}
            <td class="py-2 pr-4">
              {#if r}
                {formatDate(r.lastVerified)}
                <BankStaleBadge lastVerified={r.lastVerified} days={STALE_AFTER_DAYS} />
              {:else}{NO_DATA}{/if}
            </td>
          {/each}
        </tr>

        <tr class="bg-slate-50">
          <th class="py-2 pr-4" colspan={selected.length + 1}>Tiết kiệm</th>
        </tr>
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">Kênh gửi</th>
          {#each selected as b (b.id)}
            {@const r = savingsByBank.get(b.id)}
            <td class="py-2 pr-4">{r ? CHANNEL_LABELS[r.channel] : NO_DATA}</td>
          {/each}
        </tr>
        {#each terms as t (t)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">Kỳ hạn {t} tháng</th>
            {#each selected as b (b.id)}<td class="py-2 pr-4">{savingsCell(b, t)}</td>{/each}
          </tr>
        {/each}
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">Tiết kiệm: kiểm tra lần cuối</th>
          {#each selected as b (b.id)}
            {@const r = savingsByBank.get(b.id)}
            <td class="py-2 pr-4">
              {#if r}
                {formatDate(r.lastVerified)}
                <BankStaleBadge lastVerified={r.lastVerified} days={RATE_STALE_AFTER_DAYS} />
              {:else}{NO_DATA}{/if}
            </td>
          {/each}
        </tr>

        <tr class="bg-slate-50">
          <th class="py-2 pr-4" colspan={selected.length + 1}>Vay (lãi suất từ, mức ưu đãi)</th>
        </tr>
        {#each loanTypes as t (t)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">{LOAN_TYPE_LABELS[t]}</th>
            {#each selected as b (b.id)}<td class="py-2 pr-4">{loanCell(b, t)}</td>{/each}
          </tr>
        {/each}
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">Vay: kiểm tra lần cuối</th>
          {#each selected as b (b.id)}
            {@const r = loansByBank.get(b.id)}
            <td class="py-2 pr-4">
              {#if r}
                {formatDate(r.lastVerified)}
                <BankStaleBadge lastVerified={r.lastVerified} days={RATE_STALE_AFTER_DAYS} />
              {:else}{NO_DATA}{/if}
            </td>
          {/each}
        </tr>

        <tr class="bg-slate-50">
          <th class="py-2 pr-4" colspan={selected.length + 1}>Link chính thức</th>
        </tr>
        <tr class="border-b border-slate-100 align-top">
          <th class="py-2 pr-4 font-medium text-slate-500">Trang của ngân hàng</th>
          {#each selected as b (b.id)}
            <td class="py-2 pr-4">
              <ul class="space-y-0.5">
                <li><ExternalLink href={b.officialUrl}>Trang chủ</ExternalLink></li>
                {#if b.cardsUrl}
                  <li><ExternalLink href={b.cardsUrl}>Thẻ tín dụng</ExternalLink></li>
                {/if}
                {#if b.debitCardsUrl}
                  <li><ExternalLink href={b.debitCardsUrl}>Thẻ ghi nợ</ExternalLink></li>
                {/if}
                {#if b.feeScheduleUrl}
                  <li><ExternalLink href={b.feeScheduleUrl}>Biểu phí</ExternalLink></li>
                {/if}
              </ul>
            </td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
  <p class="mt-3 text-sm text-slate-600">
    Phí cho tài khoản thanh toán cá nhân tiêu chuẩn, chuyển khoản online ở mức tiền thấp nhất. "Lãi
    suất từ" là mức ưu đãi thấp nhất; sau thời gian ưu đãi lãi suất thả nổi và thường cao hơn. "Chưa
    rõ": ngân hàng có sản phẩm hoặc kỳ hạn đó nhưng nguồn không ghi mức lãi. Điều kiện chi tiết và
    nguồn của từng số liệu nằm ở trang của từng ngân hàng.
  </p>
{/if}

{#if banking.length === 0 && savings.length === 0 && loans.length === 0}
  <p class="mt-4 text-sm text-slate-600">
    Chưa có dữ liệu phí, tiết kiệm hay vay của ngân hàng nào.
  </p>
{/if}
