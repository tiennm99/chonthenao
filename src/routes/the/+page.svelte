<script>
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import CardSummary from '#lib/components/CardSummary.svelte';
  import {
    CATEGORY_LABELS,
    KIND_LABELS,
    NETWORK_LABELS,
    REWARD_TYPE_LABELS,
    SORT_LABELS,
    filterCards,
    sortCards,
  } from '#lib/catalog.js';
  import { banks, cards } from '#lib/data/index.js';
  import { SITE_NAME } from '#lib/site.js';

  const bankOptions = banks
    .filter((b) => cards.some((c) => c.bank === b.id))
    .sort((a, b) => a.shortName.localeCompare(b.shortName, 'vi'));
  const networks = Object.keys(NETWORK_LABELS).filter((n) => cards.some((c) => c.network === n));

  const creditCount = cards.filter((c) => c.kind === 'credit').length;
  const debitCount = cards.filter((c) => c.kind === 'debit').length;

  /** @type {string} `credit`, `debit`, or '' for both. */
  let kind = $state('');
  let bank = $state('');
  let network = $state('');
  let rewardType = $state('');
  /** @type {string} Max annual fee in VND, '' for any. */
  let maxFee = $state('');
  /** @type {string} Monthly income in millions of VND, '' when not given. */
  let income = $state('');
  let waiverOnly = $state(false);
  let virtualOnly = $state(false);
  let sort = $state('rate');
  let category = $state('all');

  // ?loai=credit or ?loai=debit preselects the kind; read it in the browser, since the page is
  // prerendered without a query.
  onMount(() => {
    const fromUrl = new URLSearchParams(location.search).get('loai') ?? '';
    if (Object.hasOwn(KIND_LABELS, fromUrl)) kind = fromUrl;
  });

  const shown = $derived(
    sortCards(
      filterCards(cards, {
        kind,
        bank,
        network,
        rewardType,
        maxAnnualFee: maxFee === '' ? null : Number(maxFee),
        myIncome: income === '' ? null : Number(income) * 1_000_000,
        waiverOnly,
        virtualOnly,
      }),
      sort,
      category,
    ),
  );

  /** Clears every filter. */
  function reset() {
    kind = bank = network = rewardType = maxFee = income = '';
    waiverOnly = virtualOnly = false;
  }

  const field = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm';
</script>

<svelte:head>
  <title>Danh mục thẻ tín dụng và thẻ ghi nợ — {SITE_NAME}</title>
  <meta
    name="description"
    content="Lọc và so sánh thẻ tín dụng và thẻ ghi nợ của các ngân hàng tại Việt Nam theo phí thường niên, hoàn tiền, phí giao dịch nước ngoài và số ngày miễn lãi."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Danh mục thẻ</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  {creditCount} thẻ tín dụng và {debitCount} thẻ ghi nợ, lấy từ trang và biểu phí chính thức của ngân
  hàng. Ưu đãi "có điều kiện" có hạn mức hoặc yêu cầu chi tiêu tối thiểu: xem chi tiết từng thẻ trước
  khi so sánh.
</p>
<p class="mt-2 text-sm">
  Chưa biết nên chọn loại nào?
  <a class="text-teal-700 underline" href={resolve('/tin-dung-hay-ghi-no')}>
    Thẻ tín dụng hay thẻ ghi nợ?
  </a>
</p>

<form
  class="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
  onsubmit={(e) => e.preventDefault()}
>
  <label class="text-sm">
    Loại thẻ
    <select class={field} bind:value={kind}>
      <option value="">Tất cả</option>
      {#each Object.entries(KIND_LABELS) as [key, label] (key)}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Sắp xếp theo
    <select class={field} bind:value={sort}>
      {#each Object.entries(SORT_LABELS) as [key, label] (key)}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Danh mục chi tiêu
    <select class={field} bind:value={category}>
      {#each Object.entries(CATEGORY_LABELS) as [key, label] (key)}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Ngân hàng
    <select class={field} bind:value={bank}>
      <option value="">Tất cả</option>
      {#each bankOptions as b (b.id)}
        <option value={b.id}>{b.shortName}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Tổ chức thẻ
    <select class={field} bind:value={network}>
      <option value="">Tất cả</option>
      {#each networks as n (n)}
        <option value={n}>{NETWORK_LABELS[n]}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Loại ưu đãi
    <select class={field} bind:value={rewardType}>
      <option value="">Tất cả</option>
      {#each Object.entries(REWARD_TYPE_LABELS) as [key, label] (key)}
        <option value={key}>{label}</option>
      {/each}
    </select>
  </label>
  <label class="text-sm">
    Phí thường niên tối đa (đã gồm VAT)
    <select class={field} bind:value={maxFee}>
      <option value="">Không giới hạn</option>
      <option value="0">Miễn phí</option>
      <option value="500000">Đến 500.000 đ</option>
      <option value="1000000">Đến 1.000.000 đ</option>
    </select>
  </label>
  <label class="text-sm">
    Thu nhập mỗi tháng (triệu đồng)
    <input
      class={field}
      type="number"
      min="0"
      inputmode="numeric"
      aria-describedby="income-hint"
      bind:value={income}
    />
    <span id="income-hint" class="mt-1 block text-xs text-slate-500">
      Chỉ thẻ tín dụng có thu nhập tối thiểu; thẻ ghi nợ không yêu cầu nên luôn được giữ lại.
    </span>
  </label>
  <div class="flex flex-col justify-end gap-1 text-sm">
    <label>
      <input type="checkbox" bind:checked={waiverOnly} /> Có điều kiện miễn phí thường niên
    </label>
    <label><input type="checkbox" bind:checked={virtualOnly} /> Có thẻ ảo</label>
  </div>
</form>

<div class="mt-4 flex items-center justify-between text-sm text-slate-600">
  <p aria-live="polite">Đang hiện {shown.length} / {cards.length} thẻ</p>
  <button type="button" class="text-teal-700 underline" onclick={reset}>Xóa bộ lọc</button>
</div>

<div class="mt-4 space-y-3">
  {#each shown as card (card.id)}
    <CardSummary {card} category={sort === 'rate' ? category : ''} />
  {:else}
    <p class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600">
      Không có thẻ nào khớp bộ lọc.
    </p>
  {/each}
</div>
