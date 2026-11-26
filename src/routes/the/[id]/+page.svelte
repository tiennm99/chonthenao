<script>
  import { resolve } from '$app/paths';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import ReferralLink from '#lib/components/ReferralLink.svelte';
  import ReportLink from '#lib/components/ReportLink.svelte';
  import StaleBadge from '#lib/components/StaleBadge.svelte';
  import {
    CATEGORY_LABELS,
    KIND_LABELS,
    NETWORK_LABELS,
    REWARD_TYPE_LABELS,
    UNKNOWN,
    describeRate,
    effectiveRate,
    formatCap,
    formatCreditField,
    formatDate,
    formatPercent,
    formatVnd,
  } from '#lib/catalog.js';
  import { SITE_NAME } from '#lib/site.js';

  let { data } = $props();
  const card = $derived(data.card);
  const bank = $derived(data.bank);

  const vat = $derived(
    card.feesFinal === true
      ? 'Phí đã gồm VAT hoặc không chịu VAT'
      : card.feesFinal === false
        ? 'Phí chưa gồm VAT'
        : 'Nguồn không ghi rõ VAT',
  );

  const isDebit = $derived(card.kind === 'debit');
  /** The bank's listing page for this kind of card, else its home page. */
  const applyUrl = $derived((isDebit ? bank.debitCardsUrl : bank.cardsUrl) ?? bank.officialUrl);
</script>

<svelte:head>
  <title>{card.name} — {SITE_NAME}</title>
  <meta
    name="description"
    content="Phí, ưu đãi và điều kiện của thẻ {card.name} ({bank.shortName}), kèm link nguồn chính thức."
  />
</svelte:head>

<nav class="text-sm text-slate-500">
  <a class="hover:underline" href={resolve('/the')}>Danh mục thẻ</a> ›
  <a class="hover:underline" href={resolve('/ngan-hang/[id]', { id: bank.id })}>{bank.shortName}</a>
</nav>

<h1 class="mt-2 text-3xl font-bold">{card.name}</h1>
<p class="mt-1 text-slate-600">
  {KIND_LABELS[card.kind]} · {bank.shortName} · {NETWORK_LABELS[card.network]}{card.tier
    ? ` · ${card.tier}`
    : ''}
</p>
<p class="mt-2 text-sm text-slate-500">
  <StaleBadge lastVerified={card.lastVerified} />
  Kiểm tra lần cuối: {formatDate(card.lastVerified)}. Hãy xác nhận lại với {bank.shortName} trước khi
  đăng ký.
</p>

<p class="mt-3 flex flex-wrap gap-4 text-sm">
  <a class="text-teal-700 underline" href="{resolve('/so-sanh')}/?the={card.id}">
    So sánh với thẻ khác
  </a>
  <ReportLink subject={card.name} />
</p>

<section class="mt-8">
  <h2 class="text-xl font-semibold">{isDebit ? 'Phí' : 'Phí và lãi'}</h2>
  <dl class="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
    <div>
      <dt class="text-sm text-slate-500">Phí phát hành</dt>
      <dd>{formatVnd(card.issuanceFee)}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Phí thường niên (thẻ chính)</dt>
      <dd>{formatVnd(card.annualFee)} <span class="text-sm text-slate-500">· {vat}</span></dd>
    </div>
    <div class="sm:col-span-2">
      <dt class="text-sm text-slate-500">Miễn hoặc hoàn phí thường niên</dt>
      <dd>{card.feeWaiver ? card.feeWaiver.text : 'Không thấy điều kiện công bố'}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Phí giao dịch nước ngoài (tổng)</dt>
      <dd>{formatPercent(card.fxFee)}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Lãi suất</dt>
      <dd>{formatCreditField(card, 'interestRate')}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Miễn lãi tối đa</dt>
      <dd>{formatCreditField(card, 'interestFreeDays')}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Thu nhập tối thiểu</dt>
      <dd>{formatCreditField(card, 'minIncome')}</dd>
    </div>
    <div>
      <dt class="text-sm text-slate-500">Thẻ ảo</dt>
      <dd>{card.virtual === true ? 'Có' : card.virtual === false ? 'Không' : UNKNOWN}</dd>
    </div>
  </dl>
</section>

<section class="mt-8">
  <h2 class="text-xl font-semibold">Ưu đãi</h2>
  {#if card.rewards.length === 0}
    <p class="mt-3 text-slate-700">
      Ngân hàng không công bố hoàn tiền hay điểm thưởng cho thẻ này.
    </p>
  {:else}
    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[32rem] text-left text-sm">
        <thead class="border-b border-slate-200 text-slate-500">
          <tr>
            <th class="py-2 pr-4 font-medium">Danh mục</th>
            <th class="py-2 pr-4 font-medium">Loại</th>
            <th class="py-2 pr-4 font-medium">Mức</th>
            <th class="py-2 font-medium">Tối đa mỗi tháng</th>
          </tr>
        </thead>
        <tbody>
          {#each card.rewards as r (r.category + r.type)}
            {@const eq = r.type === 'cashback' ? null : effectiveRate(r, card)}
            <tr class="border-b border-slate-100 align-top">
              <td class="py-2 pr-4">
                {CATEGORY_LABELS[r.category]}
                {#if r.note}<p class="mt-1 text-xs text-slate-500">{r.note}</p>{/if}
              </td>
              <td class="py-2 pr-4">{REWARD_TYPE_LABELS[r.type]}</td>
              <td class="py-2 pr-4">
                {describeRate(r)}
                {#if eq !== null}
                  <span class="text-slate-500">(tương đương {formatPercent(eq)})</span>
                {/if}
              </td>
              <td class="py-2">{r.capMonth === null ? '—' : formatCap(r.capMonth, r.type)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#each card.sharedCaps as cap (cap.categories.join())}
      <p class="mt-2 text-sm text-slate-700">
        Tối đa chung {formatCap(
          cap.capMonth,
          card.rewards.find((r) => cap.categories.includes(r.category))?.type ?? 'cashback',
        )}/tháng cho: {cap.categories.map((k) => CATEGORY_LABELS[k]).join(', ')}.{cap.note
          ? ` ${cap.note}`
          : ''}
      </p>
    {/each}
    {#if card.minSpendMonth !== null}
      <p class="mt-2 text-sm text-slate-700">
        Chỉ được hoàn hoặc tích điểm khi chi tiêu từ {formatVnd(card.minSpendMonth)} mỗi tháng (kỳ sao
        kê).
      </p>
    {/if}
    {#if card.maxCategories !== null}
      <p class="mt-2 text-sm text-slate-700">
        Mỗi lúc chỉ dùng được {card.maxCategories} danh mục ưu đãi.
      </p>
    {/if}
    {#if card.rewardsUntil !== null}
      <p class="mt-2 text-sm text-slate-700">
        Thể lệ ưu đãi công bố áp dụng đến {formatDate(card.rewardsUntil)}.
      </p>
    {/if}
    {#if card.pointValueVnd !== null}
      <p class="mt-2 text-sm text-slate-700">
        Ngân hàng quy đổi 1 điểm = {formatVnd(card.pointValueVnd)}.
      </p>
    {/if}
  {/if}
</section>

{#if card.notes.length > 0}
  <section class="mt-8">
    <h2 class="text-xl font-semibold">Điều kiện và lưu ý</h2>
    <ul class="mt-3 list-disc space-y-1 pl-5 text-slate-700">
      {#each card.notes as note (note)}<li>{note}</li>{/each}
    </ul>
  </section>
{/if}

{#if card.perks.length > 0}
  <section class="mt-8">
    <h2 class="text-xl font-semibold">Tiện ích khác</h2>
    <ul class="mt-3 list-disc space-y-1 pl-5 text-slate-700">
      {#each card.perks as perk (perk)}<li>{perk}</li>{/each}
    </ul>
  </section>
{/if}

<section class="mt-8">
  <h2 class="text-xl font-semibold">Đăng ký</h2>
  <p class="mt-3 text-sm">
    Đăng ký trực tiếp với ngân hàng:
    <ExternalLink href={applyUrl}>
      trang chính thức của {bank.shortName}
    </ExternalLink>
  </p>
  {#if bank.referral}
    <div class="mt-3"><ReferralLink referral={bank.referral} /></div>
  {/if}
</section>

<section class="mt-8">
  <h2 class="text-xl font-semibold">Nguồn</h2>
  <ul class="mt-3 space-y-1 text-sm break-all">
    {#each card.sourceUrls as url (url)}
      <li><ExternalLink href={url}>{url}</ExternalLink></li>
    {/each}
  </ul>
</section>
