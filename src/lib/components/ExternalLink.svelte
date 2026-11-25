<script>
  /**
   * A link to a bank's site or document. Every such URL comes from the data files, which the
   * schema check limits to https, so it never goes through the app router.
   * @type {{ href: string, class?: string, children: import('svelte').Snippet }}
   */
  let { href, class: className = 'text-teal-700 underline', children } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external https URL from data -->
<a {href} class={className} rel="noopener" target="_blank">{@render children()}</a>
