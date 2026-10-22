export class YoudaoDictionary {
  constructor(fetcher = fetch) {
    this.fetcher = fetcher.bind(globalThis);
    this.cache = new Map();
  }

  lookup(word) {
    const key = String(word).trim().toLowerCase();
    if (!this.cache.has(key)) this.cache.set(key, this.fetchWord(key));
    return this.cache.get(key);
  }

  async fetchWord(word) {
    const response = await this.fetcher(`/api/youdao?q=${encodeURIComponent(word)}`);
    let payload;
    try { payload = await response.json(); } catch { payload = {}; }
    if (!response.ok) throw new Error(payload.error || `有道查询失败（HTTP ${response.status}）`);
    return payload;
  }
}
