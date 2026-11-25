import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import staticAdapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Cloudflare Pages with its default SvelteKit preset is the main target: `npm run build` writes
// .svelte-kit/cloudflare and the site serves from the domain root. The GitHub Pages workflow sets
// SITE_TARGET=github-pages for a plain static build, with its own SITE_BASE and SITE_ORIGIN.
const githubPages = process.env.SITE_TARGET === 'github-pages';
const base = /** @type {'' | `/${string}`} */ (process.env.SITE_BASE ?? '');
const origin = process.env.SITE_ORIGIN ?? 'https://chonthenao.pages.dev';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: githubPages ? staticAdapter() : cloudflareAdapter(),
      paths: { base, origin },
      // Hash mode puts a CSP meta tag with script hashes on every prerendered page.
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'script-src': ['self'],
          'style-src': ['self', 'unsafe-inline'],
          'img-src': ['self', 'data:'],
          'font-src': ['self'],
          'object-src': ['none'],
          'base-uri': ['self'],
          'form-action': ['self'],
        },
      },
    }),
  ],
  build: {
    // Keep fonts as files so `font-src 'self'` holds.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
  },
});
