import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const defaultSource = 'C:\\Users\\AdolbookofRandall\\Desktop\\AI新语\\赵元达 202411999005 第4次作业\\悬赏';
const sourceRoot = path.resolve(process.env.HOME_ATLAS_SOURCE || process.argv[2] || defaultSource);
const homeTxt = path.join(sourceRoot, 'Home.txt');
const sourceGame = path.join(sourceRoot, 'HomePalace');
const sourceItems = path.join(sourceGame, 'assets', 'items');
const sourceXmind = path.join(sourceRoot, 'homeXmindPics');

const hotspots = {
  Cloakroom: { x: 0.282, y: 0.791, radius: 0.07 },
  Diningroom: { x: 0.650, y: 0.646, radius: 0.075 },
  Garden: { x: 0.501, y: 0.221, radius: 0.09 },
  'Guest Bedroom': { x: 0.891, y: 0.803, radius: 0.07 },
  Kitchen: { x: 0.663, y: 0.816, radius: 0.065 },
  Livingroom: { x: 0.509, y: 0.634, radius: 0.09 },
  'Master Bedroom': { x: 0.112, y: 0.634, radius: 0.075 },
  Recreationroom: { x: 0.874, y: 0.300, radius: 0.075 },
  Storeroom: { x: 0.760, y: 0.831, radius: 0.055 },
  Studyroom: { x: 0.286, y: 0.563, radius: 0.065 },
  'Virtual Reality': { x: 0.874, y: 0.494, radius: 0.065 },
  Washroom: { x: 0.116, y: 0.846, radius: 0.07 },
};

const knownPlaceholders = new Set([
  'garden/wood.png',
  'storeroom/dust_mop.png',
  'washroom/dustpan.png',
]);

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function ensureSource() {
  const required = [homeTxt, path.join(sourceRoot, 'Home地图.jpg'), sourceXmind, sourceItems];
  const missing = required.filter((entry) => !fs.existsSync(entry));
  if (missing.length) throw new Error(`缺少原始素材：\n${missing.join('\n')}`);
}

function parseHierarchy(text) {
  const scenes = [];
  let scene = null;
  let area = null;
  let order = 0;
  for (const sourceLine of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (line.startsWith('## ')) {
      scene = { id: slug(line.slice(3)), name: line.slice(3).trim(), kind: 'scene', sourceOrder: scenes.length, areas: [] };
      scenes.push(scene);
      area = null;
    } else if (line.startsWith('### ') && scene) {
      const name = line.slice(4).trim();
      area = {
        id: `${scene.id}.${slug(name)}`,
        name,
        sourceOrder: scene.areas.length,
        sourcePath: `${scene.name} > ${name}`,
        image: `/assets/items/${scene.id}/${slug(name)}.png`,
        words: [],
      };
      scene.areas.push(area);
    } else if (line.startsWith('- ') && scene && area) {
      const word = line.slice(2).trim();
      area.words.push({
        id: `${scene.id}.${slug(area.name)}.${slug(word)}`,
        word,
        sourceOrder: order++,
        sourcePath: `${scene.name} > ${area.name} > ${word}`,
        image: `/assets/items/${scene.id}/${slug(word)}.png`,
        meaning: null,
        ipaUS: null,
        ipaUK: null,
        audioUS: null,
        audioUK: null,
      });
    }
  }
  return scenes;
}

function readDictionary() {
  const cachePath = path.join(sourceGame, 'save', 'dictionary_cache.json');
  if (!fs.existsSync(cachePath)) return {};
  return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
}

function copyDirectory(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
}

function main() {
  ensureSource();
  const scenes = parseHierarchy(fs.readFileSync(homeTxt, 'utf8'));
  const dictionary = readDictionary();
  const missing = { pictures: [], meanings: [], ipaUS: [], ipaUK: [], audioUS: [], audioUK: [] };
  let pictureCount = 0;
  let placeholderCount = 0;
  let meaningCount = 0;
  let ipaUSCount = 0;
  let ipaUKCount = 0;

  for (const scene of scenes) {
    scene.homeHotspot = hotspots[scene.name] || null;
    scene.image = `/assets/xmind/${encodeURIComponent(scene.name)}_Xmind.jpg`;
    scene.features = [];
    if (scene.name === 'Master Bedroom') scene.features.push({ id: 'bed', kind: 'sleep', label: '床 · 按 G 休息' });
    if (scene.name === 'Kitchen' || scene.name === 'Diningroom') scene.features.push({ id: 'meal', kind: 'meal', label: '餐桌 · 按 G 进食' });
    for (const area of scene.areas) {
      const areaRelative = `${scene.id}/${slug(area.name)}.png`;
      const areaFile = path.join(sourceItems, areaRelative);
      if (fs.existsSync(areaFile)) pictureCount += 1;
      else missing.pictures.push(area.sourcePath);
      if (knownPlaceholders.has(areaRelative)) placeholderCount += 1;
      for (const item of area.words) {
        const relative = `${scene.id}/${slug(item.word)}.png`;
        const file = path.join(sourceItems, relative);
        if (fs.existsSync(file)) pictureCount += 1;
        else missing.pictures.push(item.sourcePath);
        if (knownPlaceholders.has(relative)) placeholderCount += 1;
        const entry = dictionary[item.word];
        if (entry?.definition && !/暂无|需要联网/.test(entry.definition)) {
          item.meaning = entry.definition;
          meaningCount += 1;
        } else missing.meanings.push(item.sourcePath);
        if (entry?.us && entry.us !== '—') {
          item.ipaUS = entry.us;
          ipaUSCount += 1;
        } else missing.ipaUS.push(item.sourcePath);
        if (entry?.uk && entry.uk !== '—') {
          item.ipaUK = entry.uk;
          ipaUKCount += 1;
        } else missing.ipaUK.push(item.sourcePath);
        missing.audioUS.push(item.sourcePath);
        missing.audioUK.push(item.sourcePath);
      }
    }
  }

  const sceneCount = scenes.length;
  const areaCount = scenes.reduce((sum, scene) => sum + scene.areas.length, 0);
  const wordCount = scenes.reduce((sum, scene) => sum + scene.areas.reduce((count, area) => count + area.words.length, 0), 0);
  const expectedPictures = areaCount + wordCount;
  const pct = (value, total) => Number(((value / Math.max(total, 1)) * 100).toFixed(2));
  const world = {
    schemaVersion: 1,
    title: 'HOME ATLAS · 灯语之屋',
    source: { file: 'Home.txt', encoding: 'UTF-8', importedAt: new Date().toISOString() },
    scenes,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    encoding: 'UTF-8 (no BOM)',
    totals: { scenes: sceneCount, areas: areaCount, words: wordCount, hierarchyNodes: 1 + sceneCount + areaCount + wordCount },
    pictures: { expected: expectedPictures, matchedFiles: pictureCount, realCrops: pictureCount - placeholderCount, placeholders: placeholderCount, missing: missing.pictures.length, matchRate: pct(pictureCount, expectedPictures) },
    metadata: {
      meanings: { available: meaningCount, missing: missing.meanings.length, completeness: pct(meaningCount, wordCount) },
      ipaUS: { available: ipaUSCount, missing: missing.ipaUS.length, completeness: pct(ipaUSCount, wordCount) },
      ipaUK: { available: ipaUKCount, missing: missing.ipaUK.length, completeness: pct(ipaUKCount, wordCount) },
      audioUS: { localFiles: 0, missing: wordCount, ttsFallback: true },
      audioUK: { localFiles: 0, missing: wordCount, ttsFallback: true },
    },
    knownPlaceholderPaths: [...knownPlaceholders],
    missing,
    notes: [
      '609 张条目图片来自用户本地 HomePalace 素材库；其中 606 张由原始 XMind 图裁取。',
      '3 张由原素材提取脚本明确生成占位图，游戏中会标注“图片待补充”。',
      '本地没有逐词真人音频。学习模式使用明确标注的浏览器 TTS 降级；练习模式禁用所有发音。',
    ],
  };

  fs.mkdirSync(path.join(projectRoot, 'data'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'public', 'assets', 'home'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'public', 'assets', 'sounds'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'public', 'assets', 'fonts'), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'source_assets'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'data', 'world.json'), JSON.stringify(world, null, 2));
  fs.writeFileSync(path.join(projectRoot, 'data', 'home-hotspots.json'), JSON.stringify(hotspots, null, 2));
  fs.writeFileSync(path.join(projectRoot, 'data', 'asset-report.json'), JSON.stringify(report, null, 2));
  fs.copyFileSync(homeTxt, path.join(projectRoot, 'source_assets', 'Home.txt'));
  fs.copyFileSync(path.join(sourceRoot, 'Home地图.jpg'), path.join(projectRoot, 'source_assets', 'Home地图.jpg'));
  fs.copyFileSync(path.join(sourceRoot, 'Home地图.jpg'), path.join(projectRoot, 'public', 'assets', 'home', 'home-map-source.jpg'));
  fs.copyFileSync(path.join(sourceGame, 'assets', 'maps', 'home_map.png'), path.join(projectRoot, 'public', 'assets', 'home', 'home-map.png'));
  fs.copyFileSync(path.join(sourceGame, 'assets', 'characters', 'home_explorer.png'), path.join(projectRoot, 'public', 'assets', 'home', 'home-explorer.png'));
  fs.copyFileSync(path.join(sourceGame, 'assets', 'sounds', 'success.wav'), path.join(projectRoot, 'public', 'assets', 'sounds', 'success.wav'));
  fs.copyFileSync(path.join(sourceGame, 'assets', 'sounds', 'uhoh.wav'), path.join(projectRoot, 'public', 'assets', 'sounds', 'uhoh.wav'));
  fs.copyFileSync(path.join(sourceGame, 'assets', 'fonts', 'NotoSansSC-VF.ttf'), path.join(projectRoot, 'public', 'assets', 'fonts', 'NotoSansSC-VF.ttf'));
  copyDirectory(sourceItems, path.join(projectRoot, 'public', 'assets', 'items'));
  copyDirectory(sourceXmind, path.join(projectRoot, 'public', 'assets', 'xmind'));
  copyDirectory(sourceXmind, path.join(projectRoot, 'source_assets', 'homeXmindPics'));
  console.log(`Imported ${sceneCount} scenes, ${areaCount} areas, ${wordCount} words.`);
  console.log(`Pictures: ${pictureCount}/${expectedPictures}; real crops ${pictureCount - placeholderCount}; placeholders ${placeholderCount}.`);
  console.log(`Dictionary metadata: meanings ${meaningCount}, US IPA ${ipaUSCount}, UK IPA ${ipaUKCount}.`);
}

main();
