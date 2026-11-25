// Validates every card and bank file under src/lib/data and exits non-zero on any problem.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateAll } from '../src/lib/data/schema.js';

const root = new URL('../src/lib/data/', import.meta.url).pathname;

/**
 * @param {string} dir
 * @returns {unknown[]}
 */
function load(dir) {
  const path = join(root, dir);
  return readdirSync(path)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const record = JSON.parse(readFileSync(join(path, f), 'utf8'));
      const expected = f.replace(/\.json$/, '');
      if (record?.id !== expected) {
        console.error(`${dir}/${f}: id must match the file name (${expected})`);
        process.exitCode = 1;
      }
      return record;
    });
}

const cards = load('cards');
const banks = load('banks');
const errors = validateAll({ cards, banks });
for (const e of errors) console.error(e);
if (errors.length > 0) process.exitCode = 1;
console.log(`${banks.length} banks, ${cards.length} cards, ${errors.length} problems`);
