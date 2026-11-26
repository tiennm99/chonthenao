<script>
  import { resolve } from '$app/paths';
  import {
    CATEGORY_LABELS,
    KIND_LABELS,
    NETWORK_LABELS,
    describeRate,
    effectiveRate,
    formatCap,
    formatCreditField,
    formatPercent,
    formatVnd,
    headlineReward,
    isConditional,
    rewardFor,
  } from '#lib/catalog.js';
  import StaleBadge from '#lib/components/StaleBadge.svelte';
  import { bankById } from '#lib/data/index.js';

  /**
   * One card in a list. With `category`, it shows the reward for that spending category;
   * otherwise the card's best reward.
   * @type {{ card: import('#lib/data/schema.js').Card, category?: string }}
   */
  let { card, category = '' } = $props();

  const bank = $derived(bankById.get(card.bank));
  const reward = $derived(category ? rewardFor(card, category) : headlineReward(card));
  const equivalent = $derived(
    reward && reward.type !== 'cashback' ? effectiveRate(reward, card) : null,
  );
</script>

<article class="rounded-xl border border-slate-200 p-4 hover:border-teal-400">
  <div class="flex flex-wrap items-baseline justify-between gap-2">
    <h3 class="font-semibold">
      <a class="text-teal-800 hover:underline" href={resolve('/the/[id]', { id: card.id })}>
        {card.name}
      </a>
      <StaleBadge lastVerified={card.lastVerified} />
    </h3>
    <span class="text-sm text-slate-500">
      <span
        class="mr-1 inline-block rounded px-1.5 text-xs font-medium {card.kind === 'debit'
          ? 'bg-sky-100 text-sky-900'
          : 'bg-teal-100 text-teal-900'}"
      >
        {KIND_LABELS[card.kind]}
      </span>
      {bank?.shortName} · {NETWORK_LABELS[card.network]}
    </span>
  </div>

  <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
    <div>
      <dt class="text-slate-500">
        {category ? CATEGORY_LABELS[category] : 'Ưu đãi nổi bật'}
      </dt>
      <dd class="font-medium">
        {#if reward}
          {describeRate(reward)}
          {#if equivalent !== null}
            <span class="font-normal text-slate-500">
              (tương đương {formatPercent(equivalent)})
            </span>
          {/if}
          {#if category && reward.category !== category}
            <span class="font-normal text-slate-500">(mức cơ bản)</span>
          {/if}
          {#if reward.capMonth !== null}
            <span class="block font-normal text-slate-500">
              tối đa {formatCap(reward.capMonth, reward.type)}/tháng
            </span>
          {/if}
          {#if isConditional(card, reward)}
            <span class="mt-1 inline-block rounded bg-amber-100 px-1.5 text-xs text-amber-900">
              có điều kiện
            </span>
          {/if}
        {:else}
          {category ? 'không có' : 'không có ưu đãi công bố'}
        {/if}
      </dd>
    </div>
    <div>
      <dt class="text-slate-500">Phí thường niên</dt>
      <dd class="font-medium">
        {formatVnd(card.annualFee)}
        {#if card.feesFinal === false && card.annualFee}
          <span class="block font-normal text-slate-500">chưa gồm VAT</span>
        {/if}
      </dd>
    </div>
    <div>
      <dt class="text-slate-500">Phí nước ngoài</dt>
      <dd class="font-medium">{formatPercent(card.fxFee)}</dd>
    </div>
    <div>
      <dt class="text-slate-500">Miễn lãi tối đa</dt>
      <dd class="font-medium">{formatCreditField(card, 'interestFreeDays')}</dd>
    </div>
  </dl>
</article>
