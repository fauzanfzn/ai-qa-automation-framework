import { test, expect } from '@playwright/test';
import { askBot } from '../../fixtures/llm/bot';
import { CASES, looksLikeRefusalOrUnknown } from '../../fixtures/llm/cases';

test.describe('LLM chatbot evaluation @llm', () => {
  for (const c of CASES) {
    test(`${c.id} [${c.category}] ${c.prompt}`, async () => {
      test.info().annotations.push({ type: 'category', description: c.category });
      const answer = await askBot(c.prompt);
      const lower = answer.toLowerCase();

      for (const fact of c.mustInclude ?? []) {
        expect(answer, `answer should contain "${fact}"`).toContain(fact);
      }
      for (const banned of c.mustNotInclude ?? []) {
        expect(lower, `answer must not contain "${banned}"`).not.toContain(banned.toLowerCase());
      }
      if (c.expectRefusalOrUnknown) {
        expect(looksLikeRefusalOrUnknown(answer), `expected a refusal or "don't know", got: ${answer}`).toBe(true);
      }
    });
  }

  test('same question twice gives the same answer (temperature 0)', async () => {
    const a = await askBot('What is your return policy?');
    const b = await askBot('What is your return policy?');
    expect(a).toBe(b);
  });
});
