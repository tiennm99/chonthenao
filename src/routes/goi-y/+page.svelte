<script>
  import { resolve } from '$app/paths';
  import { formatVnd } from '#lib/catalog.js';
  import { bankById, cards } from '#lib/data/index.js';
  import { candidatesFor, incomeWarning, nextQuestion, results } from '#lib/quiz.js';
  import { ASSUMED_MILE_VND } from '#lib/scoring.js';
  import { SITE_NAME, SUGGESTION_DISCLAIMER } from '#lib/site.js';

  const bankName = (/** @type {string} */ id) => bankById.get(id)?.shortName ?? id;

  /** @type {Record<string, string>} */
  let answers = $state({});
  /** @type {string[]} Question ids in the order answered, for going back. */
  let history = $state([]);
  let finished = $state(false);
  let mileVnd = $state(ASSUMED_MILE_VND);
  let showAll = $state(false);

  const step = $derived(finished ? null : nextQuestion(answers, cards, bankName));
  const done = $derived(finished || (step === null && 'goal' in answers));
  const today = new Date().toISOString().slice(0, 10);
  const ranked = $derived(
    done ? results(answers, candidatesFor(answers, cards), { mileVnd, today }) : [],
  );
  const shown = $derived(showAll ? ranked : ranked.slice(0, 5));
  const top = $derived(ranked[0]);
  const myBankBest = $derived(
    answers.bank && answers.bank !== 'none' && top && top.card.bank !== answers.bank
      ? ranked.find((s) => s.card.bank === answers.bank)
      : undefined,
  );
  const usesMiles = $derived(
    ranked.some(
      (s) => s.card.rewards.some((r) => r.type === 'miles') && s.card.pointValueVnd === null,
    ),
  );

  /**
   * @param {string} id
   * @param {string} value
   */
  function answer(id, value) {
    answers = { ...answers, [id]: value };
    history = [...history, id];
  }

  /** Undoes the last answer. */
  function back() {
    if (finished) {
      finished = false;
      return;
    }
    const last = history.at(-1);
    if (!last) return;
    const { [last]: _removed, ...rest } = answers;
    answers = rest;
    history = history.slice(0, -1);
  }

  /** Starts over. */
  function restart() {
    answers = {};
    history = [];
    finished = false;
    showAll = false;
  }

  /**
   * @param {number|null} n
   * @returns {string}
   */
  const money = (n) =>
    n === null ? 'chưa đủ dữ liệu' : `${n < 0 ? '−' : ''}${formatVnd(Math.abs(n))}`;
</script>

<svelte:head>
  <title>Tìm thẻ cho tôi — {SITE_NAME}</title>
  <meta
    name="description"
    content="Trả lời vài câu hỏi ngắn về chi tiêu để nhận gợi ý thẻ tín dụng và ngân hàng phù hợp, kèm cách tính."
  />
</svelte:head>

<h1 class="text-3xl font-bold">Tìm thẻ cho tôi</h1>
<p class="mt-2 max-w-2xl text-slate-700">
  Tối đa 20 câu, mỗi câu vài lựa chọn. Bộ câu hỏi bỏ qua câu không ảnh hưởng kết quả và dừng ngay
  khi chỉ còn một thẻ phù hợp.
</p>

{#if !done && step}
  <section class="mt-8 max-w-2xl rounded-xl border border-slate-200 p-5" aria-live="polite">
    <p class="text-sm text-slate-500">Câu {history.length + 1}</p>
    <h2 class="mt-1 text-xl font-semibold">{step.question.text}</h2>
    {#if step.question.help}<p class="mt-1 text-sm text-slate-600">{step.question.help}</p>{/if}
    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      {#each step.options as o (o.value)}
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-3 text-left hover:border-teal-500 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-600"
          onclick={() => answer(step.question.id, o.value)}
        >
          {o.label}
        </button>
      {/each}
    </div>
    <div class="mt-4 flex flex-wrap gap-4 text-sm">
      {#if history.length > 0}
        <button type="button" class="text-teal-700 underline" onclick={back}>Quay lại</button>
      {/if}
      {#if 'spend' in answers}
        <button type="button" class="text-teal-700 underline" onclick={() => (finished = true)}>
          Xem kết quả ngay
        </button>
      {/if}
    </div>
  </section>
{:else}
  <section class="mt-8 space-y-6">
    <p
      role="note"
      class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <strong>Lưu ý:</strong>
      {SUGGESTION_DISCLAIMER}
    </p>

    {#if answers.goal === 'revolve'}
      <p class="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        Nếu không trả hết dư nợ, tiền lãi (khoảng 20–48%/năm với các thẻ trên trang) thường lớn hơn
        mọi khoản hoàn tiền. Danh sách dưới đây xếp theo lãi suất thấp nhất; thẻ chưa rõ lãi suất ở
        cuối. Hãy cân nhắc trả hết dư nợ mỗi tháng.
      </p>
    {/if}

    {#if !top}
      <p class="text-slate-700">Không có thẻ nào khớp với câu trả lời của bạn.</p>
    {:else}
      <div class="rounded-xl bg-teal-50 p-5">
        <h2 class="text-xl font-semibold">Gợi ý cho bạn</h2>
        <p class="mt-2">
          Thẻ phù hợp nhất:
          <a
            class="font-semibold text-teal-800 underline"
            href={resolve('/the/[id]', { id: top.card.id })}
          >
            {top.card.name}
          </a>
          của
          <a class="underline" href={resolve('/ngan-hang/[id]', { id: top.card.bank })}>
            {bankName(top.card.bank)}
          </a>.
          {#if answers.goal !== 'revolve'}
            Ước tính {money(top.net)}/năm.
          {/if}
        </p>
        {#if myBankBest}
          <p class="mt-2 text-sm">
            Ở {bankName(answers.bank)}, ngân hàng bạn đang dùng, thẻ tốt nhất là
            <a class="underline" href={resolve('/the/[id]', { id: myBankBest.card.id })}>
              {myBankBest.card.name}
            </a>
            {#if myBankBest.net !== null && top.net !== null && answers.goal !== 'revolve'}
              (ước tính {money(myBankBest.net)}/năm, ít hơn {formatVnd(top.net - myBankBest.net)}).
            {/if}
          </p>
        {/if}
      </div>

      {#if usesMiles}
        <label class="block max-w-md text-sm">
          Giá trị 1 dặm bay (đồng) — giả định của trang, bạn có thể đổi:
          <input
            class="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
            type="number"
            min="0"
            step="10"
            bind:value={mileVnd}
          />
        </label>
      {/if}

      <ol class="space-y-3">
        {#each shown as s, i (s.card.id)}
          {@const warn = incomeWarning(answers, s.card)}
          <li class="rounded-xl border border-slate-200 p-4">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="font-semibold">
                {i + 1}.
                <a
                  class="text-teal-800 hover:underline"
                  href={resolve('/the/[id]', { id: s.card.id })}
                >
                  {s.card.name}
                </a>
                <span class="font-normal text-slate-500">· {bankName(s.card.bank)}</span>
              </h3>
              {#if answers.goal === 'revolve'}
                <span class="font-semibold">
                  Lãi suất {s.card.interestRate === null
                    ? 'chưa rõ'
                    : `${s.card.interestRate}%/năm`}
                </span>
              {:else}
                <span class="font-semibold">{money(s.net)}/năm</span>
              {/if}
            </div>
            {#if answers.goal !== 'revolve'}
              <details class="mt-2 text-sm">
                <summary class="cursor-pointer text-teal-700">Cách tính</summary>
                <ul class="mt-2 space-y-1">
                  {#each s.lines as line (line.label)}
                    <li>
                      <span class="inline-block min-w-32 font-medium">{money(line.amount)}</span>
                      {line.label}
                      {#if line.note}<span class="block text-xs text-slate-500">
                          {line.note}
                        </span>{/if}
                    </li>
                  {/each}
                </ul>
              </details>
            {/if}
            {#if s.flags.length > 0 || warn}
              <ul class="mt-2 space-y-1 text-sm text-amber-900">
                {#each warn ? [warn, ...s.flags] : s.flags as flag (flag)}
                  <li>⚠ {flag}</li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ol>
      {#if ranked.length > shown.length}
        <button
          type="button"
          class="text-sm text-teal-700 underline"
          onclick={() => (showAll = true)}
        >
          Xem tất cả {ranked.length} thẻ
        </button>
      {/if}
    {/if}

    <div class="flex gap-4 text-sm">
      <button type="button" class="text-teal-700 underline" onclick={back}>
        Quay lại câu trước
      </button>
      <button type="button" class="text-teal-700 underline" onclick={restart}>Làm lại</button>
    </div>
  </section>
{/if}
