import { describe, expect, it } from 'vitest';
import {
  WORD_STATES,
  normalizeAnswer,
  scoreForState,
  studyEncounter,
  submitPractice,
} from '../src/logic/WordStateMachine.js';

describe('word state machine', () => {
  it('maps the five canonical states to current scores', () => {
    expect(Object.values(WORD_STATES).map(scoreForState)).toEqual([0, 2, 2, 5, 3]);
  });

  it('lights only an unseen word and never downgrades practice results', () => {
    expect(studyEncounter(WORD_STATES.UNSEEN)).toBe(WORD_STATES.LIT);
    expect(studyEncounter(WORD_STATES.CORRECT_FIRST)).toBe(WORD_STATES.CORRECT_FIRST);
    expect(studyEncounter(WORD_STATES.CORRECT_RETRY)).toBe(WORD_STATES.CORRECT_RETRY);
  });

  it('normalizes case, spacing and dash variants without accepting synonyms', () => {
    expect(normalizeAnswer('  ICE   CREAM ')).toBe('ice cream');
    expect(normalizeAnswer('T–shirt')).toBe('t-shirt');
  });

  it('rejects an empty submission without changing state', () => {
    expect(submitPractice({ answer: '  ', expected: 'pan', mistakeInRound: false, currentState: WORD_STATES.UNSEEN })).toMatchObject({ accepted: false, state: WORD_STATES.UNSEEN });
  });

  it('sets first-try correctness to five points', () => {
    const result = submitPractice({ answer: 'PAN', expected: 'pan', mistakeInRound: false, currentState: WORD_STATES.UNSEEN });
    expect(result).toMatchObject({ accepted: true, correct: true, state: WORD_STATES.CORRECT_FIRST, delta: 5 });
  });

  it('sets a wrong answer to two points', () => {
    const result = submitPractice({ answer: 'pot', expected: 'pan', mistakeInRound: false, currentState: WORD_STATES.UNSEEN });
    expect(result).toMatchObject({ correct: false, state: WORD_STATES.WRONG, mistakeInRound: true, delta: 2 });
  });

  it('keeps repeated failures at WRONG without score inflation', () => {
    const result = submitPractice({ answer: 'pot', expected: 'pan', mistakeInRound: true, currentState: WORD_STATES.WRONG });
    expect(result).toMatchObject({ correct: false, state: WORD_STATES.WRONG, delta: 0 });
  });

  it('sets a same-round retry success to three points', () => {
    const result = submitPractice({ answer: 'pan', expected: 'pan', mistakeInRound: true, currentState: WORD_STATES.WRONG });
    expect(result).toMatchObject({ correct: true, state: WORD_STATES.CORRECT_RETRY, delta: 1 });
  });

  it('allows a later new round to restore first-try correctness', () => {
    const result = submitPractice({ answer: 'pan', expected: 'pan', mistakeInRound: false, currentState: WORD_STATES.CORRECT_RETRY });
    expect(result).toMatchObject({ state: WORD_STATES.CORRECT_FIRST, delta: 2 });
  });

  it('lets a later wrong answer lower a five-point result', () => {
    const result = submitPractice({ answer: 'pot', expected: 'pan', mistakeInRound: false, currentState: WORD_STATES.CORRECT_FIRST });
    expect(result).toMatchObject({ state: WORD_STATES.WRONG, delta: -3 });
  });
});
