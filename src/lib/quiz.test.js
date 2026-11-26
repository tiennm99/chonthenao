import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { banks, cards } from './data/index.js';
import {
  QUESTIONS,
  candidatesFor,
  incomeWarning,
  nextQuestion,
  profileFor,
  results,
} from './quiz.js';

const bankName = (/** @type {string} */ id) => banks.find((b) => b.id === id)?.shortName ?? id;

/**
 * Answers every question the quiz asks, picking from `pick` or the first option.
 * @param {Record<string, string>} pick
 * @returns {{ answers: Record<string, string>, asked: { id: string, count: number }[] }}
 */
function walk(pick) {
  /** @type {Record<string, string>} */
  const answers = {};
  const asked = [];
  for (
    let q = nextQuestion(answers, cards, bankName);
    q;
    q = nextQuestion(answers, cards, bankName)
  ) {
    asked.push({ id: q.question.id, count: q.options.length });
    answers[q.question.id] = pick[q.question.id] ?? q.options[0].value;
  }
  return { answers, asked };
}

describe('questionnaire', () => {
  it('has at most 20 questions', () => {
    expect(QUESTIONS.length).toBeLessThanOrEqual(20);
  });

  it('offers 2 to 4 answers for every question it asks', () => {
    for (const goal of ['cashback', 'lowFee', 'miles', 'revolve']) {
      for (const { count } of walk({ goal }).asked) {
        expect(count).toBeGreaterThanOrEqual(2);
        expect(count).toBeLessThanOrEqual(4);
      }
    }
  });

  it('ends right away when only one card fits', () => {
    const { asked, answers } = walk({ goal: 'miles', kind: 'credit' });
    expect(asked.map((a) => a.id)).toEqual(['goal', 'kind']);
    expect(candidatesFor(answers, cards)).toHaveLength(1);
  });

  it('asks only income for a reader who carries a balance', () => {
    expect(walk({ goal: 'revolve' }).asked.map((a) => a.id)).toEqual(['goal', 'income']);
  });

  it('asks the card kind right after the goal, and only when both kinds remain', () => {
    const ids = walk({ goal: 'cashback' }).asked.map((a) => a.id);
    expect(ids.slice(0, 2)).toEqual(['goal', 'kind']);
    const q = nextQuestion({ goal: 'cashback' }, cards, bankName);
    expect(q?.options.map((o) => o.value)).toEqual(['credit', 'debit', 'any']);
    const creditOnly = cards.filter((c) => c.kind === 'credit');
    expect(nextQuestion({ goal: 'cashback' }, creditOnly, bankName)?.question.id).toBe('income');
  });

  it('keeps only the chosen kind, and skips income for debit cards', () => {
    for (const kind of /** @type {const} */ (['credit', 'debit'])) {
      const found = candidatesFor({ goal: 'lowFee', kind }, cards);
      expect(found.length).toBeGreaterThan(0);
      expect(found.every((c) => c.kind === kind)).toBe(true);
    }
    const ids = walk({ goal: 'lowFee', kind: 'debit' }).asked.map((a) => a.id);
    expect(ids).not.toContain('income');
    const any = candidatesFor({ goal: 'lowFee', kind: 'any' }, cards);
    expect(new Set(any.map((c) => c.kind))).toEqual(new Set(['credit', 'debit']));
  });

  it('never suggests a debit card to a reader who carries a balance', () => {
    const found = candidatesFor({ goal: 'revolve' }, cards);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((c) => c.kind === 'credit')).toBe(true);
  });

  it('never drops or warns a debit card over income', () => {
    const a = { goal: 'lowFee', kind: 'any', income: 'lt7' };
    const debit = cards.filter((c) => c.kind === 'debit');
    expect(candidatesFor(a, debit)).toHaveLength(debit.length);
    expect(debit.every((c) => incomeWarning(a, c) === null)).toBe(true);
  });

  it('lets debit cards compete with credit cards on the lowest-fee goal', () => {
    const a = { goal: 'lowFee', kind: 'any', spend: 'lt5', foreign: 'none' };
    const ranked = results(a, candidatesFor(a, cards));
    expect(ranked.some((s) => s.card.kind === 'debit')).toBe(true);
    expect(ranked.some((s) => s.card.kind === 'credit')).toBe(true);
  });

  it('skips categories no remaining card rewards', () => {
    const ids = walk({ goal: 'cashback' }).asked.map((a) => a.id);
    expect(ids).not.toContain('cat-fuel');
  });

  it('never routes more than the total spend', () => {
    const p = profileFor({
      spend: '10to20',
      foreign: 'lots',
      'cat-online': 'lots',
      'cat-grocery': 'lots',
      'cat-dining': 'lots',
      'cat-travel': 'lots',
    });
    const sum = Object.values(p.spend).reduce((a, b) => a + b, 0) + p.foreign;
    expect(sum).toBeLessThanOrEqual(15_000_000 + 5);
    expect(p.spend.all).toBeGreaterThanOrEqual(0);
  });

  it('ranks from card data alone, so a referral link can never change the order', () => {
    // The ranking code takes cards and answers only; it must never read bank records.
    for (const file of ['./quiz.js', './scoring.js', './catalog.js', './ecosystem.js']) {
      const src = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(src).not.toMatch(/\.referral|import[^;]*data\/index/);
    }
  });
});
