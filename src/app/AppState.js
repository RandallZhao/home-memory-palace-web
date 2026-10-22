import { getWordState, scoreForState } from '../logic/WordStateMachine.js';

export class AppState {
  constructor(save, saveManager) {
    this.save = save;
    this.saveManager = saveManager;
    this.listeners = new Set();
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  notify(event) { for (const listener of this.listeners) listener(event, this.save); }

  commitWordState(id, nextState) {
    const previous = getWordState(this.save.wordStates, id);
    if (previous === nextState) return { previous, nextState, delta: 0, changed: false };
    this.save.wordStates[id] = nextState;
    const delta = scoreForState(nextState) - scoreForState(previous);
    this.saveManager.save(this.save);
    this.notify({ type: 'word-state', id, previous, nextState, delta });
    return { previous, nextState, delta, changed: true };
  }

  setLocation(location, saveNow = true) {
    this.save.location = { ...this.save.location, ...location };
    if (saveNow) this.saveManager.save(this.save);
    this.notify({ type: 'location', location: this.save.location });
  }
}
