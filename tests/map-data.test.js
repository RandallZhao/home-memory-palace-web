import { describe, expect, it } from 'vitest';
import world from '../data/world.json';
import report from '../data/asset-report.json';
import { generateSceneLayout, isWalkable } from '../src/render/MapGenerator.js';

describe('real source data and generated maps', () => {
  it('preserves every source node count and order', () => {
    expect(world.scenes).toHaveLength(12);
    expect(world.scenes.flatMap((scene) => scene.areas)).toHaveLength(85);
    expect(world.scenes.flatMap((scene) => scene.areas.flatMap((area) => area.words))).toHaveLength(524);
    expect(report.pictures.matchedFiles).toBe(609);
    expect(report.pictures.placeholders).toBe(3);
  });

  it('gives every scene a HOME hotspot and every word a unique id', () => {
    const words = world.scenes.flatMap((scene) => scene.areas.flatMap((area) => area.words));
    expect(world.scenes.every((scene) => scene.homeHotspot)).toBe(true);
    expect(new Set(words.map((word) => word.id)).size).toBe(words.length);
  });

  it('keeps every area connected to the core by a walkable road', () => {
    for (const scene of world.scenes) {
      const layout = generateSceneLayout(scene);
      expect(layout.areas).toHaveLength(scene.areas.length);
      for (const area of layout.areas) {
        for (let step = 0; step <= 30; step += 1) {
          const t = step / 30;
          expect(isWalkable(layout, { x: area.center.x * t, z: area.center.z * t })).toBe(true);
        }
        expect(area.words).toHaveLength(scene.areas.find((source) => source.id === area.id).words.length);
        expect(area.words.every((word) => isWalkable(layout, word.position))).toBe(true);
      }
    }
  });
});
