import { error } from '@sveltejs/kit';
import {
  bankById,
  bankingByBank,
  banks,
  cardsOfBank,
  loansByBank,
  savingsByBank,
} from '#lib/data/index.js';

/** @type {import('./$types').EntryGenerator} */
export const entries = () => banks.map((b) => ({ id: b.id }));

/** @type {import('./$types').PageLoad} */
export const load = ({ params }) => {
  const bank = bankById.get(params.id);
  if (!bank) error(404, 'Không có ngân hàng này trong dữ liệu.');
  return {
    bank,
    cards: cardsOfBank(bank.id),
    banking: bankingByBank.get(bank.id) ?? null,
    savings: savingsByBank.get(bank.id) ?? null,
    loans: loansByBank.get(bank.id) ?? null,
  };
};
