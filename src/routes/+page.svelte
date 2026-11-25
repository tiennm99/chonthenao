<script>
  import { resolve } from '$app/paths';
  import { cards } from '#lib/data/index.js';
  import { SITE_NAME } from '#lib/site.js';
</script>

<svelte:head>
  <title>{SITE_NAME} — chọn thẻ tín dụng và ngân hàng hợp với bạn</title>
  <meta
    name="description"
    content="So sánh phí, hoàn tiền và ưu đãi của thẻ tín dụng tại Việt Nam, rồi trả lời vài câu hỏi để nhận gợi ý thẻ và ngân hàng hợp với cách bạn chi tiêu."
  />
</svelte:head>

<section class="space-y-4">
  <h1 class="text-3xl font-bold sm:text-4xl">Chọn thẻ nào? Chọn thế nào?</h1>
  <p class="max-w-2xl text-lg text-slate-700">
    {SITE_NAME} giúp bạn so sánh thẻ tín dụng của các ngân hàng tại Việt Nam theo phí, hoàn tiền và ưu
    đãi, rồi gợi ý thẻ và ngân hàng hợp với cách bạn chi tiêu.
  </p>
</section>

<section class="mt-10 grid gap-4 sm:grid-cols-3">
  <a class="rounded-xl border border-slate-200 p-5 hover:border-teal-400" href={resolve('/goi-y')}>
    <h2 class="font-semibold text-teal-800">Tìm thẻ cho tôi</h2>
    <p class="mt-2 text-sm text-slate-600">
      Vài câu hỏi ngắn về chi tiêu, rồi nhận các thẻ và ngân hàng hợp với bạn, kèm cách tính.
    </p>
  </a>
  <a class="rounded-xl border border-slate-200 p-5 hover:border-teal-400" href={resolve('/the')}>
    <h2 class="font-semibold text-teal-800">Danh mục thẻ</h2>
    <p class="mt-2 text-sm text-slate-600">
      Lọc và sắp xếp theo phí thường niên, tỷ lệ hoàn tiền, phí giao dịch nước ngoài, ngày miễn lãi.
    </p>
  </a>
  <a
    class="rounded-xl border border-slate-200 p-5 hover:border-teal-400"
    href={resolve('/so-sanh')}
  >
    <h2 class="font-semibold text-teal-800">So sánh thẻ</h2>
    <p class="mt-2 text-sm text-slate-600">Đặt 2 đến 3 thẻ cạnh nhau để xem khác biệt.</p>
  </a>
</section>

<p class="mt-10 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
  Hiện có {cards.length} thẻ của {new Set(cards.map((c) => c.bank)).size} ngân hàng. Mỗi con số đều kèm
  link nguồn của ngân hàng và ngày kiểm tra gần nhất.
</p>
