<script>
  import { resolve } from '$app/paths';
  import {
    KIND_LABELS,
    NOT_APPLICABLE,
    formatPercent,
    formatVnd,
    kindStats,
  } from '#lib/catalog.js';
  import { cards } from '#lib/data/index.js';
  import { SITE_NAME, SUGGESTION_DISCLAIMER } from '#lib/site.js';

  /** @type {('credit'|'debit')[]} */
  const kinds = ['credit', 'debit'];
  // Computed at build time from the card files; the page is prerendered.
  const stats = { credit: kindStats(cards, 'credit'), debit: kindStats(cards, 'debit') };

  const NO_DATA = 'chưa có dữ liệu';

  /**
   * A low–high range, one value when both ends match.
   * @param {number|null} lo
   * @param {number|null} hi
   * @param {(n: number) => string} fmt
   * @returns {string}
   */
  function range(lo, hi, fmt) {
    if (lo === null || hi === null) return NO_DATA;
    return lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`;
  }

  /** @type {(n: number) => string} */
  const vnd = (n) => formatVnd(n);
  /** @type {(n: number) => string} */
  const pct = (n) => formatPercent(n);

  /**
   * @typedef {import('#lib/catalog.js').KindStats} KindStats
   * @type {{ label: string, value: (s: KindStats, kind: string) => string }[]}
   */
  const rows = [
    {
      label: 'Số thẻ trong dữ liệu',
      value: (s) => (s.count === 0 ? NO_DATA : `${s.count} thẻ của ${s.banks} ngân hàng`),
    },
    {
      label: 'Phí thường niên (thẻ chính, đã gồm VAT)',
      value: (s) => range(s.minAnnualFee, s.maxAnnualFee, vnd),
    },
    {
      label: 'Thẻ miễn phí thường niên',
      value: (s) =>
        s.knownAnnualFee === 0
          ? NO_DATA
          : `${s.freeAnnualFee} / ${s.knownAnnualFee} thẻ có phí đã biết`,
    },
    {
      label: 'Phí giao dịch nước ngoài (tổng)',
      value: (s) => range(s.minFxFee, s.maxFxFee, pct),
    },
    {
      label: 'Có hoàn tiền hoặc tích điểm công bố',
      value: (s) => (s.count === 0 ? NO_DATA : `${s.withRewards} / ${s.count} thẻ`),
    },
    {
      label: 'Hoàn tiền cao nhất ở một danh mục',
      value: (s) => (s.bestCashback === null ? NO_DATA : pct(s.bestCashback)),
    },
    {
      label: 'Có thẻ ảo',
      value: (s) =>
        s.count === 0
          ? NO_DATA
          : `${s.virtual} / ${s.count} thẻ` +
            (s.virtualUnknown > 0 ? ` (${s.virtualUnknown} thẻ chưa rõ)` : ''),
    },
    {
      label: 'Lãi suất',
      value: (s, kind) =>
        kind === 'debit'
          ? NOT_APPLICABLE
          : range(s.minInterestRate, s.maxInterestRate, (n) => `${pct(n)}/năm`),
    },
    {
      label: 'Miễn lãi tối đa',
      value: (s, kind) =>
        kind === 'debit'
          ? NOT_APPLICABLE
          : s.maxInterestFreeDays === null
            ? NO_DATA
            : `đến ${s.maxInterestFreeDays} ngày`,
    },
  ];

  const section = 'mt-10';
  const h2 = 'text-xl font-semibold';
  const list = 'mt-3 list-disc space-y-1 pl-5 text-slate-700';
  const link = 'text-teal-700 underline';
</script>

<svelte:head>
  <title>Thẻ tín dụng hay thẻ ghi nợ? — {SITE_NAME}</title>
  <meta
    name="description"
    content="Thẻ tín dụng và thẻ ghi nợ khác nhau thế nào, tốn những phí gì và hợp với ai, kèm bảng so sánh tính từ dữ liệu thẻ của các ngân hàng tại Việt Nam."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Thẻ tín dụng hay thẻ ghi nợ?</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  Cả hai đều quẹt được ở cửa hàng và thanh toán online. Khác biệt nằm ở tiền của ai: thẻ tín dụng
  tiêu tiền ngân hàng cho mượn rồi trả lại sau, thẻ ghi nợ tiêu thẳng tiền trong tài khoản của bạn.
</p>

<section class={section}>
  <h2 class={h2}>Mỗi loại hoạt động thế nào</h2>
  <div class="mt-3 grid gap-4 sm:grid-cols-2">
    <div class="rounded-xl border border-slate-200 p-5">
      <h3 class="font-semibold text-teal-800">{KIND_LABELS.credit}</h3>
      <ul class={list}>
        <li>Ngân hàng cấp một hạn mức tín dụng; bạn chi tiêu trong hạn mức đó.</li>
        <li>
          Cuối mỗi kỳ sao kê, bạn trả lại số đã tiêu. Trả đủ trước hạn thì không mất lãi; trả thiếu
          thì phần còn nợ bị tính lãi, trả chậm còn bị thêm phí.
        </li>
        <li>
          Để mở thẻ, ngân hàng xét thu nhập và lịch sử tín dụng của bạn, nên không phải ai cũng được
          duyệt.
        </li>
        <li>
          Rút tiền mặt bằng thẻ tín dụng thường bị tính phí và lãi; xem biểu phí của từng thẻ.
        </li>
      </ul>
    </div>
    <div class="rounded-xl border border-slate-200 p-5">
      <h3 class="font-semibold text-teal-800">{KIND_LABELS.debit}</h3>
      <ul class={list}>
        <li>Thẻ gắn với tài khoản thanh toán của bạn; mỗi lần quẹt là trừ thẳng tiền trong đó.</li>
        <li>Chỉ tiêu được số tiền đang có, nên không có nợ, không có lãi.</li>
        <li>Thường mở được ngay khi mở tài khoản, không cần chứng minh thu nhập.</li>
        <li>
          Thẻ nội địa (Napas) dùng trong nước; thẻ quốc tế (Visa, Mastercard…) dùng được cả khi mua
          hàng nước ngoài và online.
        </li>
      </ul>
    </div>
  </div>
</section>

<section class={section}>
  <h2 class={h2}>Mỗi loại tốn những phí gì</h2>
  <div class="mt-3 grid gap-4 sm:grid-cols-2">
    <div>
      <h3 class="font-semibold">{KIND_LABELS.credit}</h3>
      <ul class={list}>
        <li>Phí phát hành và phí thường niên; nhiều thẻ miễn phí khi chi tiêu đủ mức.</li>
        <li>Lãi trên dư nợ khi không trả đủ, và phí trả chậm.</li>
        <li>Phí giao dịch ngoại tệ khi mua hàng ở nước ngoài.</li>
        <li>Phí và lãi khi rút tiền mặt.</li>
      </ul>
    </div>
    <div>
      <h3 class="font-semibold">{KIND_LABELS.debit}</h3>
      <ul class={list}>
        <li>Phí phát hành và phí thường niên của thẻ.</li>
        <li>
          Phí của tài khoản đi kèm: phí quản lý tài khoản, số dư tối thiểu, phí tin nhắn, phí rút
          tiền ở ATM ngân hàng khác.
        </li>
        <li>Phí giao dịch ngoại tệ với thẻ quốc tế.</li>
      </ul>
      <p class="mt-2 text-sm">
        Phí tài khoản của từng ngân hàng:
        <a class={link} href={resolve('/so-sanh-ngan-hang')}>so sánh ngân hàng</a>.
      </p>
    </div>
  </div>
</section>

<section class={section}>
  <h2 class={h2}>Hai loại thẻ trong dữ liệu của trang</h2>
  <p class="mt-2 max-w-2xl text-sm text-slate-600">
    Mọi con số dưới đây được tính từ các thẻ đang có trên trang, không phải toàn bộ thị trường. Phí
    và mức hoàn tiền chưa rõ không được tính.
  </p>
  <div class="mt-3 overflow-x-auto">
    <table class="w-full min-w-[32rem] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th class="w-56 py-2 pr-4"></th>
          {#each kinds as k (k)}
            <th class="py-2 pr-4 font-semibold">{KIND_LABELS[k]}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.label)}
          <tr class="border-b border-slate-100 align-top">
            <th class="py-2 pr-4 font-medium text-slate-500">{row.label}</th>
            {#each kinds as k (k)}<td class="py-2 pr-4">{row.value(stats[k], k)}</td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="mt-3 flex flex-wrap gap-4 text-sm">
    <a class={link} href="{resolve('/the')}/?loai=credit">Xem các thẻ tín dụng</a>
    <a class={link} href="{resolve('/the')}/?loai=debit">Xem các thẻ ghi nợ</a>
    <a class={link} href={resolve('/so-sanh')}>So sánh thẻ cạnh nhau</a>
  </p>
</section>

<section class={section}>
  <h2 class={h2}>Loại nào hợp với bạn</h2>
  <div class="mt-3 grid gap-4 sm:grid-cols-2">
    <div>
      <h3 class="font-semibold">Thẻ tín dụng hợp khi bạn</h3>
      <ul class={list}>
        <li>Trả hết dư nợ mỗi kỳ sao kê, để không bao giờ mất lãi.</li>
        <li>Muốn hưởng hoàn tiền, điểm thưởng hay dặm bay trên chi tiêu hằng ngày.</li>
        <li>Cần một khoảng thời gian miễn lãi trước khi phải trả.</li>
        <li>Đủ điều kiện thu nhập mà ngân hàng yêu cầu.</li>
      </ul>
    </div>
    <div>
      <h3 class="font-semibold">Thẻ ghi nợ hợp khi bạn</h3>
      <ul class={list}>
        <li>Chỉ muốn tiêu số tiền mình đang có và tránh mọi khoản nợ.</li>
        <li>Chưa đủ điều kiện mở thẻ tín dụng, hoặc chưa muốn mở.</li>
        <li>Hay rút tiền mặt ở ATM hoặc chủ yếu chuyển khoản.</li>
        <li>Muốn một thẻ đi kèm tài khoản, phí thấp và dễ mở.</li>
      </ul>
    </div>
  </div>
  <p class="mt-4 text-sm text-slate-600">{SUGGESTION_DISCLAIMER}</p>
  <p class="mt-3 text-sm">
    Chưa chắc? Trả lời vài câu hỏi ở
    <a class={link} href={resolve('/goi-y')}>Tìm thẻ cho tôi</a>
    để nhận gợi ý theo cách bạn chi tiêu.
  </p>
</section>
