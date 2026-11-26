<script>
  import { resolve } from '$app/paths';
  import BankRecordSources from '#lib/components/BankRecordSources.svelte';
  import CardSummary from '#lib/components/CardSummary.svelte';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import ReferralLink from '#lib/components/ReferralLink.svelte';
  import ReportLink from '#lib/components/ReportLink.svelte';
  import { UNKNOWN, formatDate, formatPercent, formatVnd } from '#lib/catalog.js';
  import { BANKING_FEE_FIELDS, LOAN_TYPES } from '#lib/data/schema.js';
  import {
    BANKING_FEE_LABELS,
    CHANNEL_LABELS,
    LOAN_TYPE_LABELS,
    YEARLY_INTERBANK_TRANSFERS,
    bankingFee,
    formatAmount,
    formatBankingFee,
    formatMonths,
    yearlyBankingCost,
  } from '#lib/ecosystem.js';
  import { SITE_NAME } from '#lib/site.js';
  import { RATE_STALE_AFTER_DAYS, STALE_AFTER_DAYS } from '#lib/staleness.js';

  let { data } = $props();
  const bank = $derived(data.bank);
  const creditCards = $derived(data.cards.filter((c) => c.kind === 'credit'));
  const debitCards = $derived(data.cards.filter((c) => c.kind === 'debit'));
  const yearlyCost = $derived(yearlyBankingCost(data.banking));
  const loanRows = $derived(
    data.loans
      ? LOAN_TYPES.flatMap((t) =>
          (data.loans?.products ?? []).map((p, i) => ({ p, i })).filter(({ p }) => p.type === t),
        )
      : [],
  );
</script>

<svelte:head>
  <title>{bank.shortName} — {SITE_NAME}</title>
  <meta
    name="description"
    content="Thẻ tín dụng, thẻ ghi nợ, phí tài khoản, lãi suất tiết kiệm và vay của {bank.name}, kèm link nguồn chính thức."
  />
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
  {#if bank.debitCardsUrl}
    <li>
      <ExternalLink href={bank.debitCardsUrl}>Danh sách thẻ ghi nợ của ngân hàng</ExternalLink>
    </li>
  {/if}
  {#if bank.feeScheduleUrl}
    <li><ExternalLink href={bank.feeScheduleUrl}>Biểu phí</ExternalLink></li>
  {/if}
</ul>

{#if bank.referral}
  <div class="mt-4 max-w-xl"><ReferralLink referral={bank.referral} /></div>
{/if}

<p class="mt-4 text-sm">
  <!-- The path comes from resolve(); only the query string is added. -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <a
    class="text-teal-700 underline"
    href={`${resolve('/so-sanh-ngan-hang')}/?b=${encodeURIComponent(bank.id)}`}
  >
    So sánh {bank.shortName} với ngân hàng khác
  </a>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</p>

<section id="the-tin-dung">
  <h2 class="mt-8 text-xl font-semibold">Thẻ tín dụng ({creditCards.length})</h2>
  {#if creditCards.length === 0}
    <p class="mt-3 text-slate-700">
      Chưa có dữ liệu thẻ tín dụng của {bank.shortName}. Xem trực tiếp trên trang của ngân hàng.
    </p>
  {:else}
    <div class="mt-3 space-y-3">
      {#each creditCards as card (card.id)}
        <CardSummary {card} />
      {/each}
    </div>
  {/if}
</section>

<section id="the-ghi-no">
  <h2 class="mt-8 text-xl font-semibold">Thẻ ghi nợ ({debitCards.length})</h2>
  {#if debitCards.length === 0}
    <p class="mt-3 text-slate-700">
      Chưa có dữ liệu thẻ ghi nợ của {bank.shortName}. Xem trực tiếp trên trang của ngân hàng.
    </p>
  {:else}
    <div class="mt-3 space-y-3">
      {#each debitCards as card (card.id)}
        <CardSummary {card} />
      {/each}
    </div>
  {/if}
</section>

<section id="tai-khoan">
  <h2 class="mt-8 text-xl font-semibold">Tài khoản và phí dịch vụ</h2>
  {#if !data.banking}
    <p class="mt-3 text-slate-700">Chưa có dữ liệu phí tài khoản của {bank.shortName}.</p>
  {:else}
    {@const r = data.banking}
    <p class="mt-2 text-sm text-slate-600">
      Tài khoản thanh toán cá nhân tiêu chuẩn, chuyển khoản online ở mức tiền thấp nhất.
      {r.feesFinal === false
        ? 'Biểu phí ghi phí chưa gồm VAT.'
        : r.feesFinal === true
          ? 'Phí đã gồm VAT hoặc không chịu VAT.'
          : 'Nguồn không ghi rõ phí đã gồm VAT hay chưa.'}
    </p>
    <table class="mt-3 w-full max-w-2xl text-left text-sm">
      <tbody>
        {#each BANKING_FEE_FIELDS as field (field)}
          <tr class="border-b border-slate-100">
            <th class="py-2 pr-4 font-medium text-slate-500">{BANKING_FEE_LABELS[field]}</th>
            <td class="py-2">
              {formatBankingFee(field, bankingFee(r, field))}
            </td>
          </tr>
        {/each}
        <tr class="border-b border-slate-100">
          <th class="py-2 pr-4 font-medium text-slate-500">
            Chi phí ước tính mỗi năm
            <span class="block text-xs font-normal">
              Phí quản lý tài khoản, SMS và ngân hàng số trong 12 tháng, cộng {YEARLY_INTERBANK_TRANSFERS}
              lần chuyển khoản liên ngân hàng{r.feesFinal === false ? ', đã cộng 10% VAT' : ''}.
              Tính cả phí chỉ thu khi số dư dưới mức quy định.
            </span>
          </th>
          <td class="py-2 font-semibold">
            {yearlyCost === null ? UNKNOWN : formatVnd(yearlyCost)}
          </td>
        </tr>
      </tbody>
    </table>
    {#if r.perks.length > 0}
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {#each r.perks as perk (perk)}<li>{perk}</li>{/each}
      </ul>
    {/if}
    <BankRecordSources record={r} days={STALE_AFTER_DAYS} />
  {/if}
</section>

<section id="tiet-kiem">
  <h2 class="mt-8 text-xl font-semibold">Tiết kiệm</h2>
  {#if !data.savings}
    <p class="mt-3 text-slate-700">Chưa có dữ liệu lãi suất tiết kiệm của {bank.shortName}.</p>
  {:else}
    {@const s = data.savings}
    <p class="mt-2 text-sm text-slate-600">
      Gửi {CHANNEL_LABELS[s.channel].toLowerCase()}, VND, lĩnh lãi cuối kỳ, mức tiền gửi thấp nhất;
      gửi tối thiểu {formatAmount(s.minAmount)}. Lãi suất thay đổi thường xuyên, hãy kiểm tra lại
      với ngân hàng.
    </p>
    <table class="mt-3 w-full max-w-md text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="py-2 pr-4">Kỳ hạn</th>
          <th class="py-2 text-right">Lãi suất</th>
        </tr>
      </thead>
      <tbody>
        {#each s.rates as x (x.termMonths)}
          <tr class="border-b border-slate-100">
            <td class="py-2 pr-4">{x.termMonths} tháng</td>
            <td class="py-2 text-right tabular-nums">
              {x.rate === null ? UNKNOWN : `${formatPercent(x.rate)}/năm`}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="mt-2 text-sm">
      <a class="text-teal-700 underline" href={resolve('/tiet-kiem')}>So với ngân hàng khác</a>
    </p>
    <BankRecordSources record={s} days={RATE_STALE_AFTER_DAYS} />
  {/if}
</section>

<section id="vay">
  <h2 class="mt-8 text-xl font-semibold">Vay</h2>
  {#if !data.loans}
    <p class="mt-3 text-slate-700">Chưa có dữ liệu lãi suất vay của {bank.shortName}.</p>
  {:else}
    <p class="mt-2 text-sm text-slate-600">
      "Lãi suất từ" là mức ưu đãi thấp nhất; sau thời gian cố định, lãi suất thả nổi và thường cao
      hơn.
    </p>
    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200">
            <th class="py-2 pr-3">Loại</th>
            <th class="py-2 pr-3">Sản phẩm</th>
            <th class="py-2 pr-3 text-right">Lãi suất từ</th>
            <th class="py-2 pr-3">Cố định</th>
            <th class="py-2 pr-3">Thời hạn tối đa</th>
            <th class="py-2 pr-3">Số tiền tối đa</th>
          </tr>
        </thead>
        <tbody>
          {#each loanRows as { p, i } (i)}
            <tr class="border-b border-slate-100 align-top">
              <td class="py-2 pr-3">{LOAN_TYPE_LABELS[p.type]}</td>
              <td class="py-2 pr-3">
                {p.name}
                {#if p.note}<p class="mt-1 text-xs text-slate-600">{p.note}</p>{/if}
              </td>
              <td class="py-2 pr-3 text-right font-semibold tabular-nums">
                {p.rateFrom === null ? UNKNOWN : `${formatPercent(p.rateFrom)}/năm`}
              </td>
              <td class="py-2 pr-3">
                {p.fixedMonths === null ? UNKNOWN : `cố định ${p.fixedMonths} tháng đầu`}
              </td>
              <td class="py-2 pr-3">{formatMonths(p.maxTermMonths)}</td>
              <td class="py-2 pr-3">{p.maxAmount === null ? UNKNOWN : formatVnd(p.maxAmount)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="mt-2 text-sm">
      <a class="text-teal-700 underline" href={resolve('/vay')}>So với ngân hàng khác</a>
    </p>
    <BankRecordSources record={data.loans} days={RATE_STALE_AFTER_DAYS} />
  {/if}
</section>

<p class="mt-8 text-sm text-slate-500">
  Thông tin ngân hàng kiểm tra lần cuối: {formatDate(bank.lastVerified)}. <ReportLink
    subject={bank.shortName}
  />
</p>
