// Fails when any prerendered HTML page lacks the site disclaimer.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISCLAIMER } from '../src/lib/site.js';

// The output folder is the first argument: .svelte-kit/cloudflare for Cloudflare Pages
// (the default), build for GitHub Pages.
const out = fileURLToPath(
  new URL(`../${process.argv[2] ?? '.svelte-kit/cloudflare'}/`, import.meta.url),
);
// The first clause is enough to prove the notice is present.
const marker = DISCLAIMER.split(',')[0];

/**
 * @param {string} dir
 * @returns {string[]}
 */
const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? htmlFiles(join(dir, e.name))
      : e.name.endsWith('.html')
        ? [join(dir, e.name)]
        : [],
  );

const files = htmlFiles(out);
const missing = files.filter((f) => !readFileSync(f, 'utf8').includes(marker));
for (const f of missing) console.error(`missing disclaimer: ${f.slice(out.length)}`);
console.log(`${files.length} pages, ${missing.length} without the disclaimer`);
if (files.length === 0 || missing.length > 0) process.exitCode = 1;
