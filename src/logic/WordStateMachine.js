export const WORD_STATES = Object.freeze({
  UNSEEN: 'UNSEEN',
  LIT: 'LIT',
  WRONG: 'WRONG',
  CORRECT_FIRST: 'CORRECT_FIRST',
  CORRECT_RETRY: 'CORRECT_RETRY',
});

export const STATE_SCORES = Object.freeze({
  [WORD_STATES.UNSEEN]: 0,
  [WORD_STATES.LIT]: 2,
  [WORD_STATES.WRONG]: 2,
  [WORD_STATES.CORRECT_FIRST]: 5,
  [WORD_STATES.CORRECT_RETRY]: 3,
});

export const STATE_META = Object.freeze({
  [WORD_STATES.UNSEEN]: { label: '未点亮', symbol: '○', className: 'state-unseen' },
  [WORD_STATES.LIT]: { label: '已点亮', symbol: '✦', className: 'state-lit' },
  [WORD_STATES.WRONG]: { label: '错误回忆', symbol: '×', className: 'state-wrong' },
  [WORD_STATES.CORRECT_FIRST]: { label: '直接正确', symbol: '✓', className: 'state-correct' },
  [WORD_STATES.CORRECT_RETRY]: { label: '错误后正确', symbol: '↻', className: 'state-retry' },
});

export function getWordState(wordStates, id) {
  return wordStates[id] || WORD_STATES.UNSEEN;
}

export function scoreForState(state) {
  return STATE_SCORES[state] ?? 0;
}

export function studyEncounter(currentState) {
  return currentState === WORD_STATES.UNSEEN ? WORD_STATES.LIT : currentState;
}

export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/\s+/g, ' ');
}

export function submitPractice({ answer, expected, mistakeInRound, currentState }) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return { accepted: false, reason: 'empty', state: currentState, mistakeInRound };
  const correct = normalized === normalizeAnswer(expected);
  const nextState = correct
    ? (mistakeInRound ? WORD_STATES.CORRECT_RETRY : WORD_STATES.CORRECT_FIRST)
    : WORD_STATES.WRONG;
  return {
    accepted: true,
    correct,
    state: nextState,
    mistakeInRound: mistakeInRound || !correct,
    delta: scoreForState(nextState) - scoreForState(currentState),
  };
}
