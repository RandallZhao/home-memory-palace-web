import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(fs.readFileSync(path.join(root, 'data', 'world.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, 'data', 'asset-report.json'), 'utf8'));
const errors = [];
const ids = new Set();
let words = 0;
let areas = 0;

for (const scene of world.scenes) {
  if (!scene.homeHotspot) errors.push(`Missing hotspot: ${scene.name}`);
  for (const area of scene.areas) {
    areas += 1;
    for (const item of area.words) {
      words += 1;
      if (ids.has(item.id)) errors.push(`Duplicate id: ${item.id}`);
      ids.add(item.id);
      const assetPath = path.join(root, 'public', item.image.replace(/^\//, ''));
      if (!fs.existsSync(assetPath)) errors.push(`Missing image: ${item.sourcePath}`);
    }
  }
}

if (world.scenes.length !== report.totals.scenes || areas !== report.totals.areas || words !== report.totals.words) {
  errors.push('World counts do not match asset-report.json');
}
if (!fs.existsSync(path.join(root, 'public', 'assets', 'home', 'home-map.png'))) errors.push('Missing HOME map');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${world.scenes.length} scenes, ${areas} areas, ${words} words and ${ids.size} unique word ids.`);
