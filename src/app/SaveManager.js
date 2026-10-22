export const SAVE_KEY = 'homeAtlas.save.v1';
export const CORRUPT_KEY = 'homeAtlas.corrupt.v1';

export function createDefaultSave() {
  return {
    schemaVersion: 1,
    player: { name: '探索者', skin: 'amber' },
    location: { sceneId: 'home', x: 0.505, z: 0.65, mode: null, coordinateSpace: 'home-normalized' },
    worldMinute: 8 * 60,
    lastMealMinute: 8 * 60,
    lastSleepMinute: 8 * 60,
    needsSleep: false,
    wordStates: {},
    completionShown: false,
    onboardingSeen: false,
    savedAt: '',
  };
}

export class SaveManager {
  constructor(onNotice) {
    this.onNotice = onNotice;
  }

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    try {
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== 1 || !parsed.location || !parsed.wordStates) throw new Error('存档结构不兼容');
      return { ...createDefaultSave(), ...parsed };
    } catch (error) {
      try { localStorage.setItem(CORRUPT_KEY, raw); } catch { /* best effort */ }
      this.onNotice?.('检测到损坏存档，已备份并创建新世界。', 'error');
      return createDefaultSave();
    }
  }

  save(save) {
    try {
      save.savedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      return true;
    } catch (error) {
      this.onNotice?.('存档写入失败，请检查浏览器存储权限。', 'error');
      return false;
    }
  }

  reset() {
    localStorage.removeItem(SAVE_KEY);
  }
}
