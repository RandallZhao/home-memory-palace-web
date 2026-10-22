export const YOUDAO_API = 'https://dict.youdao.com/jsonapi';
export const YOUDAO_VOICE = 'https://dict.youdao.com/dictvoice';

export function voiceType(accent) {
  if (accent === 'uk') return 1;
  if (accent === 'us') return 2;
  throw new Error('发音类型只能是 uk 或 us');
}

export function normalizeYoudao(data, queryWord) {
  const simple = data?.simple?.word?.[0];
  const ecWord = data?.ec?.word?.[0];
  const sourceWord = simple || ecWord;
  if (!sourceWord) throw new Error('有道词典没有返回 simple.word 或 ec.word');

  const returned = sourceWord['return-phrase'];
  const actualWord = String(
    typeof returned === 'object' ? returned?.l?.i || queryWord : returned || queryWord,
  ).trim();
  const definitions = extractDefinitions(data);
  if (!definitions.length) throw new Error('有道词典没有返回可用释义');

  return {
    word: actualWord,
    ipaUK: formatPhonetic(sourceWord.ukphone),
    ipaUS: formatPhonetic(sourceWord.usphone),
    definitions,
    source: '有道词典',
  };
}

export function extractDefinitions(data) {
  const definitions = [];
  for (const item of data?.individual?.trs || []) {
    const part = String(item?.pos || '').trim();
    const meaning = String(item?.tran || '').trim();
    if (meaning) definitions.push(`${part} ${meaning}`.trim());
  }
  if (!definitions.length) {
    const ecWord = data?.ec?.word?.[0];
    for (const item of ecWord?.trs || []) {
      const part = String(item?.pos || '').trim();
      for (const translation of item?.tr || []) {
        const raw = translation?.l?.i;
        const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
        for (const value of values) {
          const meaning = String(value).trim();
          if (meaning) definitions.push(`${part} ${meaning}`.trim());
        }
      }
    }
  }
  if (!definitions.length) {
    for (const item of data?.video_sents?.word_info?.sense || []) {
      const meaning = String(item).trim();
      if (meaning) definitions.push(meaning);
    }
  }
  return [...new Set(definitions)].slice(0, 8);
}

function formatPhonetic(value) {
  const phonetic = String(value || '').trim().replace(/^\/+|\/+$/g, '');
  return phonetic ? `/${phonetic}/` : null;
}
