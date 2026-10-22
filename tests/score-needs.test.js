import { describe, expect, it } from 'vitest';
import { scoreWords, scoreWorld } from '../src/logic/Score.js';
import { fatigue, hunger, nextWakeMinute, shouldNeedSleep } from '../src/logic/NeedsSystem.js';
import { WORD_STATES } from '../src/logic/WordStateMachine.js';
import world from '../data/world.json';

describe('score calculations', () => {
  const words = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

  it('builds one gold-green-orange stacked total', () => {
    const result = scoreWords(words, { a: WORD_STATES.LIT, b: WORD_STATES.CORRECT_FIRST, c: WORD_STATES.CORRECT_RETRY, d: WORD_STATES.WRONG });
    expect(result).toMatchObject({ gold: 8, green: 3, orange: 1, score: 12, max: 20, percent: 60 });
  });

  it('caps a rounded non-full score at 99 percent', () => {
    const many = Array.from({ length: 101 }, (_, index) => ({ id: `w${index}` }));
    const states = Object.fromEntries(many.map((word) => [word.id, WORD_STATES.CORRECT_FIRST]));
    states.w0 = WORD_STATES.CORRECT_RETRY;
    const result = scoreWords(many, states);
    expect(Math.round((result.score / result.max) * 100)).toBe(100);
    expect(result.percent).toBe(99);
    expect(result.complete).toBe(false);
  });

  it('weights the world by all 524 real words', () => {
    const result = scoreWorld(world.scenes, {});
    expect(result.max).toBe(2620);
    expect(result.score).toBe(0);
  });
});

describe('needs system', () => {
  it('reaches zero fatigue after fifteen game hours and stays zero when sleep is required', () => {
    expect(fatigue(480, 480, false)).toBe(100);
    expect(fatigue(1380, 480, false)).toBe(0);
    expect(shouldNeedSleep(1380, 480, false)).toBe(true);
    expect(fatigue(1920, 480, true)).toBe(0);
  });

  it('reaches zero hunger after exactly 24 game hours', () => {
    expect(hunger(480, 480)).toBe(100);
    expect(hunger(1920, 480)).toBe(0);
  });

  it('sleep always advances to the following day at 08:00', () => {
    expect(nextWakeMinute(22 * 60)).toBe(1440 + 480);
    expect(nextWakeMinute(1440 + 9 * 60)).toBe(2880 + 480);
  });
});
