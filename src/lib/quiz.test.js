import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { banks, cards } from './data/index.js';
import { QUESTIONS, candidatesFor, nextQuestion, profileFor } from './quiz.js';

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
    const { asked, answers } = walk({ goal: 'miles' });
    expect(asked.map((a) => a.id)).toEqual(['goal']);
    expect(candidatesFor(answers, cards)).toHaveLength(1);
  });

  it('asks only income for a reader who carries a balance', () => {
    expect(walk({ goal: 'revolve' }).asked.map((a) => a.id)).toEqual(['goal', 'income']);
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
    for (const file of ['./quiz.js', './scoring.js', './catalog.js']) {
      const src = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(src).not.toMatch(/\.referral|import[^;]*data\/index/);
    }
  });
});
