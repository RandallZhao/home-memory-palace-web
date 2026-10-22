import { shouldNeedSleep } from '../logic/NeedsSystem.js';

export class GameClock {
  constructor(save, onMinute) {
    this.save = save;
    this.onMinute = onMinute;
    this.lastTime = performance.now();
    this.remainder = 0;
    this.paused = false;
  }

  setPaused(paused) {
    this.paused = paused;
    this.lastTime = performance.now();
  }

  tick(now = performance.now()) {
    const elapsed = Math.min(1000, Math.max(0, now - this.lastTime));
    this.lastTime = now;
    if (this.paused || document.hidden || !document.hasFocus()) return false;
    this.remainder += elapsed;
    let changed = false;
    while (this.remainder >= 1000) {
      this.remainder -= 1000;
      this.save.worldMinute += 1;
      this.save.needsSleep = shouldNeedSleep(this.save.worldMinute, this.save.lastSleepMinute, this.save.needsSleep);
      this.onMinute?.(this.save.worldMinute);
      changed = true;
    }
    return changed;
  }
}
