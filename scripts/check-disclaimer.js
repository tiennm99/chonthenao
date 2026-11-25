// Fails when any prerendered HTML page lacks the site disclaimer.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DISCLAIMER } from '../src/lib/site.js';

const out = fileURLToPath(new URL('../build/', import.meta.url));
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

// 404.html is the client-rendered fallback shell; the layout adds the disclaimer when it renders.
const files = htmlFiles(out).filter((f) => f !== join(out, '404.html'));
const missing = files.filter((f) => !readFileSync(f, 'utf8').includes(marker));
for (const f of missing) console.error(`missing disclaimer: ${f.slice(out.length)}`);
console.log(`${files.length} pages, ${missing.length} without the disclaimer`);
if (files.length === 0 || missing.length > 0) process.exitCode = 1;
