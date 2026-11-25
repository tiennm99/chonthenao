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
  <div class="rounded-xl border border-slate-200 p-5">
    <h2 class="font-semibold">Danh mục thẻ</h2>
    <p class="mt-2 text-sm text-slate-600">
      Lọc theo phí thường niên, điều kiện miễn phí, tỷ lệ hoàn tiền, phí giao dịch nước ngoài.
    </p>
  </div>
  <div class="rounded-xl border border-slate-200 p-5">
    <h2 class="font-semibold">Bộ câu hỏi gợi ý</h2>
    <p class="mt-2 text-sm text-slate-600">
      Tối đa 20 câu về chi tiêu và ưu tiên của bạn, kết quả là các thẻ và ngân hàng phù hợp nhất.
    </p>
  </div>
  <div class="rounded-xl border border-slate-200 p-5">
    <h2 class="font-semibold">Nguồn rõ ràng</h2>
    <p class="mt-2 text-sm text-slate-600">
      Mỗi con số đều kèm link nguồn của ngân hàng và ngày kiểm tra gần nhất.
    </p>
  </div>
</section>

<section class="mt-10 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
  {#if cards.length === 0}
    <p>
      Trang đang được xây dựng: dữ liệu thẻ đang được tổng hợp từ biểu phí chính thức của các ngân
      hàng. Danh mục và bộ câu hỏi sẽ mở khi có dữ liệu.
    </p>
  {:else}
    <p>
      Hiện có {cards.length} thẻ của {new Set(cards.map((c) => c.bank)).size} ngân hàng.
      <a class="font-medium text-teal-700 underline" href={resolve('/goi-y')}>Tìm thẻ cho tôi</a>
      hoặc
      <a class="font-medium text-teal-700 underline" href={resolve('/the')}>xem danh mục thẻ</a>.
    </p>
  {/if}
</section>
