<script>
  import { onMount } from 'svelte';
  import { DISCLAIMER } from '#lib/site.js';

  const KEY = 'chonthenao:disclaimer-seen';
  // Prerendered as visible so every page carries the notice even without JavaScript.
  let visible = $state(true);

  onMount(() => {
    try {
      visible = localStorage.getItem(KEY) !== '1';
    } catch {
      visible = true;
    }
  });

  /** Hides the banner and remembers that the visitor has read it. */
  function dismiss() {
    visible = false;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Private mode: the banner simply shows again next visit.
    }
  }
</script>

{#if visible}
  <div role="note" class="border-b border-amber-300 bg-amber-50 text-amber-950">
    <div class="mx-auto flex max-w-5xl items-start gap-3 px-4 py-3 text-sm">
      <p class="flex-1"><strong>Lưu ý:</strong> {DISCLAIMER}</p>
      <button
        type="button"
        onclick={dismiss}
        class="shrink-0 rounded-md border border-amber-400 px-3 py-1 font-medium hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-600"
      >
        Đã hiểu
      </button>
    </div>
  </div>
{/if}
