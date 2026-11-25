import { error } from '@sveltejs/kit';
import { bankById, banks, cardsOfBank } from '#lib/data/index.js';

/** @type {import('./$types').EntryGenerator} */
export const entries = () => banks.map((b) => ({ id: b.id }));

/** @type {import('./$types').PageLoad} */
export const load = ({ params }) => {
  const bank = bankById.get(params.id);
  if (!bank) error(404, 'Không có ngân hàng này trong dữ liệu.');
  return { bank, cards: cardsOfBank(bank.id) };
};
