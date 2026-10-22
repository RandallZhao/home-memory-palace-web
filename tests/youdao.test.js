import { describe, expect, it, vi } from 'vitest';
import { extractDefinitions, normalizeYoudao, voiceType } from '../server/youdao.js';
import { YoudaoDictionary } from '../src/services/YoudaoDictionary.js';

describe('Youdao normalization', () => {
  it('prefers individual.trs and keeps UK/US phonetics separate', () => {
    const result = normalizeYoudao({
      simple: { word: [{ 'return-phrase': 'water', ukphone: 'ˈwɔːtə(r)', usphone: 'ˈwɔːtər' }] },
      individual: { trs: [{ pos: 'n.', tran: '水' }] },
      ec: { word: [{ trs: [{ tr: [{ l: { i: ['备用释义'] } }] }] }] },
    }, 'water');
    expect(result).toMatchObject({ ipaUK: '/ˈwɔːtə(r)/', ipaUS: '/ˈwɔːtər/', definitions: ['n. 水'] });
  });

  it('uses real ec.word.trs only when individual.trs is absent', () => {
    expect(extractDefinitions({ ec: { word: [{ trs: [{ tr: [{ l: { i: ['n. 太阳镜'] } }] }] }] } })).toEqual(['n. 太阳镜']);
  });

  it('maps type 1 to UK and type 2 to US', () => {
    expect(voiceType('uk')).toBe(1);
    expect(voiceType('us')).toBe(2);
    expect(() => voiceType('other')).toThrow();
  });
});

describe('YoudaoDictionary browser client', () => {
  it('deduplicates online requests and reports upstream errors', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ word: 'water' }) });
    const client = new YoudaoDictionary(fetcher);
    await Promise.all([client.lookup('Water'), client.lookup('water')]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/youdao?q=water');

    const failing = new YoudaoDictionary(async () => ({ ok: false, status: 502, json: async () => ({ error: '有道暂不可用' }) }));
    await expect(failing.lookup('water')).rejects.toThrow('有道暂不可用');
  });
});
