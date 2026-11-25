import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// `npm run build` writes a static site to build/ that serves from the domain root, as on
// Cloudflare Pages. The GitHub Pages workflow sets SITE_BASE and SITE_ORIGIN for its subpath.
const base = /** @type {'' | `/${string}`} */ (process.env.SITE_BASE ?? '');
const origin = process.env.SITE_ORIGIN ?? 'https://chonthenao.pages.dev';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      // Hosts serve 404.html for unknown paths; it renders the error page in the browser.
      adapter: adapter({ fallback: '404.html' }),
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
