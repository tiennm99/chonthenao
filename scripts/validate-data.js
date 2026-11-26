// Validates every data file under src/lib/data and exits non-zero on any problem.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAll } from '../src/lib/data/schema.js';

const root = fileURLToPath(new URL('../src/lib/data/', import.meta.url));

/**
 * @param {string} dir
 * @returns {unknown[]}
 */
function load(dir) {
  const path = join(root, dir);
  if (!existsSync(path)) return [];
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
const banking = load('banking');
const savings = load('savings');
const loans = load('loans');
const errors = validateAll({ cards, banks, banking, savings, loans });
for (const e of errors) console.error(e);
if (errors.length > 0) process.exitCode = 1;
const debit = cards.filter((c) => /** @type {{ kind?: string }} */ (c)?.kind === 'debit').length;
console.log(
  `${banks.length} banks, ${cards.length - debit} credit cards, ${debit} debit cards, ` +
    `${banking.length} banking, ${savings.length} savings, ${loans.length} loans records, ` +
    `${errors.length} problems`,
);
