import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// The site serves from /<package name> on GitHub Pages unless SITE_BASE says otherwise.
const { name } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const base = process.env.SITE_BASE ?? `/${name}`;

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      paths: { base, origin: process.env.SITE_ORIGIN ?? 'https://tiennm99.github.io' },
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
