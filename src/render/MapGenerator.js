export function generateSceneLayout(scene) {
  const core = { x: 0, z: 0, radius: 4.8 };
  const maxAreaRadius = Math.max(...scene.areas.map((area) => areaRadius(area.words.length)), 5);
  const count = scene.areas.length;
  const ringRadius = Math.max(17, maxAreaRadius / Math.max(Math.sin(Math.PI / Math.max(count, 2)), 0.35) + 5.5);
  const areas = scene.areas.map((area, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const radius = areaRadius(area.words.length);
    const center = { x: Math.cos(angle) * ringRadius, z: Math.sin(angle) * ringRadius };
    const words = layoutWords(area.words, center, radius);
    return { ...area, center, radius, angle, words };
  });
  const roads = areas.map((area) => ({
    from: { x: core.x, z: core.z },
    to: area.center,
    width: 3.2,
  }));
  const featureNodes = [{ id: 'return-home', kind: 'home', label: 'HOME · Space 返回', x: 0, z: 0, radius: 2.2 }];
  for (const feature of scene.features || []) {
    if (feature.kind === 'sleep') {
      const bed = areas.flatMap((area) => area.words).find((word) => word.word.toLowerCase() === 'bed');
      featureNodes.push({ ...feature, x: bed?.position.x ?? 2.8, z: bed?.position.z ?? 0, radius: 2.5 });
    } else if (feature.kind === 'meal') {
      featureNodes.push({ ...feature, x: 3.3, z: 0, radius: 2.4 });
    }
  }
  return { core, areas, roads, featureNodes, extent: ringRadius + maxAreaRadius + 4 };
}

function areaRadius(wordCount) {
  return Math.max(5.4, 4.5 + Math.ceil(Math.max(wordCount - 5, 0) / 6) * 1.45);
}

function layoutWords(words, center, radius) {
  if (!words.length) return [];
  const result = [];
  let cursor = 0;
  let ring = 0;
  while (cursor < words.length) {
    const ringRadius = Math.min(radius - 1.15, 2.45 + ring * 1.8);
    const capacity = Math.max(5, Math.floor((Math.PI * 2 * ringRadius) / 2.05));
    const amount = Math.min(capacity, words.length - cursor);
    for (let i = 0; i < amount; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / amount + ring * 0.3;
      const word = words[cursor++];
      result.push({ ...word, position: { x: center.x + Math.cos(angle) * ringRadius, z: center.z + Math.sin(angle) * ringRadius }, triggerRadius: 1.35 });
    }
    ring += 1;
  }
  return result;
}

export function isWalkable(layout, point, padding = 0.32) {
  if (distance(point, layout.core) <= layout.core.radius - padding) return true;
  for (const area of layout.areas) {
    if (distance(point, area.center) <= area.radius - padding) return true;
  }
  for (const road of layout.roads) {
    if (distanceToSegment(point, road.from, road.to) <= road.width / 2 - padding * 0.25) return true;
  }
  return false;
}

export function nearestWord(layout, point, currentId = null) {
  let best = null;
  let bestDistance = Infinity;
  for (const word of layout.areas.flatMap((area) => area.words)) {
    const d = distance(point, word.position);
    const multiplier = word.id === currentId ? 1.18 : 1;
    if (d <= word.triggerRadius * multiplier && d < bestDistance) {
      best = word;
      bestDistance = d;
    }
  }
  return best;
}

export function nearestFeature(layout, point) {
  return layout.featureNodes.find((feature) => distance(point, feature) <= feature.radius) || null;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function distanceToSegment(point, from, to) {
  const vx = to.x - from.x;
  const vz = to.z - from.z;
  const wx = point.x - from.x;
  const wz = point.z - from.z;
  const lengthSquared = vx * vx + vz * vz;
  const t = lengthSquared ? Math.max(0, Math.min(1, (wx * vx + wz * vz) / lengthSquared)) : 0;
  return Math.hypot(point.x - (from.x + vx * t), point.z - (from.z + vz * t));
}
