<script>
  import { resolve } from '$app/paths';
  import { banks, cards } from '#lib/data/index.js';
  import { SITE_NAME } from '#lib/site.js';

  const creditCount = cards.filter((c) => c.kind === 'credit').length;
  const debitCount = cards.filter((c) => c.kind === 'debit').length;
  const cardBanks = new Set(cards.map((c) => c.bank)).size;

  const tile = 'rounded-xl border border-slate-200 p-5 hover:border-teal-400';
  const tileTitle = 'font-semibold text-teal-800';
  const tileText = 'mt-2 text-sm text-slate-600';
</script>

<svelte:head>
  <title>{SITE_NAME} — chọn thẻ và ngân hàng hợp với bạn</title>
  <meta
    name="description"
    content="So sánh thẻ tín dụng, thẻ ghi nợ và ngân hàng tại Việt Nam: phí, hoàn tiền, ưu đãi, lãi suất tiết kiệm và lãi suất vay, rồi nhận gợi ý thẻ và ngân hàng hợp với cách bạn chi tiêu."
  />
</svelte:head>

<section class="space-y-4">
  <h1 class="text-3xl font-bold sm:text-4xl">Chọn thẻ nào? Chọn thế nào?</h1>
  <p class="max-w-2xl text-lg text-slate-700">
    {SITE_NAME} giúp bạn so sánh thẻ tín dụng và thẻ ghi nợ của các ngân hàng tại Việt Nam theo phí, hoàn
    tiền và ưu đãi, xem ngân hàng nào có phí tài khoản, lãi suất tiết kiệm và lãi suất vay hợp với bạn,
    rồi gợi ý thẻ và ngân hàng theo cách bạn chi tiêu.
  </p>
</section>

<section class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <a class={tile} href={resolve('/goi-y')}>
    <h2 class={tileTitle}>Tìm thẻ cho tôi</h2>
    <p class={tileText}>
      Vài câu hỏi ngắn về chi tiêu, rồi nhận các thẻ và ngân hàng hợp với bạn, kèm cách tính.
    </p>
  </a>
  <a class={tile} href={resolve('/the')}>
    <h2 class={tileTitle}>Danh mục thẻ</h2>
    <p class={tileText}>
      Thẻ tín dụng và thẻ ghi nợ: lọc và sắp xếp theo phí thường niên, hoàn tiền, phí giao dịch nước
      ngoài, ngày miễn lãi.
    </p>
  </a>
  <a class={tile} href={resolve('/so-sanh')}>
    <h2 class={tileTitle}>So sánh thẻ</h2>
    <p class={tileText}>
      Đặt 2 đến 3 thẻ cạnh nhau, kể cả thẻ tín dụng cạnh thẻ ghi nợ, để xem khác biệt.
    </p>
  </a>
  <a class={tile} href={resolve('/tin-dung-hay-ghi-no')}>
    <h2 class={tileTitle}>Thẻ tín dụng hay thẻ ghi nợ?</h2>
    <p class={tileText}>Hai loại thẻ hoạt động thế nào, tốn những phí gì và hợp với ai.</p>
  </a>
  <a class={tile} href={resolve('/so-sanh-ngan-hang')}>
    <h2 class={tileTitle}>So sánh ngân hàng</h2>
    <p class={tileText}>
      Phí tài khoản, chuyển khoản, rút tiền ATM và tin nhắn của các ngân hàng, đặt cạnh nhau.
    </p>
  </a>
  <a class={tile} href={resolve('/tiet-kiem')}>
    <h2 class={tileTitle}>Lãi suất tiết kiệm</h2>
    <p class={tileText}>Lãi suất gửi tiết kiệm có kỳ hạn của các ngân hàng, theo từng kỳ hạn.</p>
  </a>
  <a class={tile} href={resolve('/vay')}>
    <h2 class={tileTitle}>Lãi suất vay</h2>
    <p class={tileText}>
      Lãi suất vay tiêu dùng tín chấp, vay mua nhà và vay mua ô tô các ngân hàng công bố.
    </p>
  </a>
</section>

<p class="mt-10 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
  Hiện có {creditCount} thẻ tín dụng và {debitCount} thẻ ghi nợ của {cardBanks} ngân hàng, trong số
  {banks.length} ngân hàng có dữ liệu. Mỗi con số đều kèm link nguồn của ngân hàng và ngày kiểm tra gần
  nhất.
</p>
