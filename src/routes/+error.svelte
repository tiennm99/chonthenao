<script>
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
</script>

<h1 class="text-2xl font-bold">Không tìm thấy trang</h1>
<p class="mt-2 text-slate-600">{page.status}: {page.error?.message}</p>
<p class="mt-4"><a class="text-teal-700 underline" href={resolve('/')}>Về trang chủ</a></p>
