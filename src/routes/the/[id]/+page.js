import { error } from '@sveltejs/kit';
import { bankById, cardById, cards } from '#lib/data/index.js';

/** @type {import('./$types').EntryGenerator} */
export const entries = () => cards.map((c) => ({ id: c.id }));

/** @type {import('./$types').PageLoad} */
export const load = ({ params }) => {
  const card = cardById.get(params.id);
  const bank = card && bankById.get(card.bank);
  if (!card || !bank) error(404, 'Không có thẻ này trong dữ liệu.');
  return { card, bank };
};
