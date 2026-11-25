<script>
  import { page } from '$app/state';
  import ExternalLink from '#lib/components/ExternalLink.svelte';
  import { reportIssueUrl } from '#lib/site.js';

  /** @type {{ subject: string }} */
  let { subject } = $props();
</script>

<ExternalLink href={reportIssueUrl(subject, page.url.href)}>
  Báo thông tin sai hoặc đã cũ
</ExternalLink>
