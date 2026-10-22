import { WORD_STATES, getWordState, scoreForState } from './WordStateMachine.js';

export function scoreWords(words, wordStates) {
  let gold = 0;
  let green = 0;
  let orange = 0;
  for (const word of words) {
    const state = getWordState(wordStates, word.id);
    const value = scoreForState(state);
    if (value >= 2) gold += 2;
    if (state === WORD_STATES.CORRECT_FIRST) green += 3;
    if (state === WORD_STATES.CORRECT_RETRY) orange += 1;
  }
  const score = gold + green + orange;
  const max = words.length * 5;
  const percent = max === 0 ? 100 : score === max ? 100 : Math.min(99, Math.round((score / max) * 100));
  return { score, max, percent, gold, green, orange, complete: max > 0 && score === max };
}

export function sceneWords(scene) {
  return scene.areas.flatMap((area) => area.words);
}

export function scoreScene(scene, wordStates) {
  return scoreWords(sceneWords(scene), wordStates);
}

export function scoreWorld(scenes, wordStates) {
  const words = scenes.flatMap(sceneWords);
  return scoreWords(words, wordStates);
}
