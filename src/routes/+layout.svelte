<script>
  import '@fontsource/be-vietnam-pro/400.css';
  import '@fontsource/be-vietnam-pro/500.css';
  import '@fontsource/be-vietnam-pro/700.css';
  import '../app.css';
  import { resolve } from '$app/paths';
  import DisclaimerBanner from '#lib/components/DisclaimerBanner.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import { SITE_NAME } from '#lib/site.js';

  let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-white font-sans text-slate-900">
  <DisclaimerBanner />
  <header class="border-b border-slate-200">
    <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <a href={resolve('/')} class="text-lg font-bold text-teal-800">{SITE_NAME}</a>
      <div class="flex gap-4 text-sm font-medium">
        <a class="hover:text-teal-700" href={resolve('/goi-y')}>Tìm thẻ cho tôi</a>
        <a class="hover:text-teal-700" href={resolve('/the')}>Danh mục thẻ</a>
        <a class="hover:text-teal-700" href={resolve('/so-sanh')}>So sánh</a>
        <a class="hover:text-teal-700" href={resolve('/ngan-hang')}>Ngân hàng</a>
      </div>
    </nav>
  </header>
  <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
    {@render children()}
  </main>
  <SiteFooter />
</div>
