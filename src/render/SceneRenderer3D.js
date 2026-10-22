import * as THREE from 'three';
import { createCharacterSprite } from './Character.js';
import { getWordState, STATE_META, WORD_STATES } from '../logic/WordStateMachine.js';

const AREA_COLORS = [0x315d5c, 0x6b5441, 0x38566d, 0x655070, 0x496446, 0x6a4f55, 0x3c626c, 0x6c6144];
const STATE_COLORS = {
  [WORD_STATES.UNSEEN]: 0x647276,
  [WORD_STATES.LIT]: 0xf1c874,
  [WORD_STATES.WRONG]: 0xed8c7d,
  [WORD_STATES.CORRECT_FIRST]: 0x73cbb7,
  [WORD_STATES.CORRECT_RETRY]: 0xe6ad66,
};

export class SceneRenderer3D {
  constructor(container, layout, skin, mode, wordStates) {
    this.container = container;
    this.layout = layout;
    this.mode = mode;
    this.wordStates = wordStates;
    this.wordVisuals = new Map();
    this.disposables = [];
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07151c);
    this.scene.fog = new THREE.FogExp2(0x07151c, 0.012);
    this.camera = new THREE.OrthographicCamera(-18, 18, 12, -12, 0.1, 200);
    this.cameraOffset = new THREE.Vector3(24, 30, 24);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(0, 0, 0);
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (error) {
      throw new Error('当前浏览器无法初始化 WebGL。请启用硬件加速，或使用最新版 Chrome / Edge。');
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'scene-canvas';
    this.container.replaceChildren(this.renderer.domElement);
    this.textureLoader = new THREE.TextureLoader();
    this.addEnvironment();
    this.addMap();
    this.character = createCharacterSprite(skin);
    this.character.position.set(0, 0.22, 3.45);
    this.scene.add(this.character);
    this.resize();
  }

  addEnvironment() {
    const ambient = new THREE.HemisphereLight(0xfff1d0, 0x0b2631, 2.2);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffdda0, 2.8);
    key.position.set(8, 22, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const starGeometry = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i < 260; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = this.layout.extent + 4 + Math.random() * 45;
      points.push(Math.cos(angle) * radius, 0.25 + Math.random() * 11, Math.sin(angle) * radius);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xe8dcae, size: 0.12, transparent: true, opacity: 0.48 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
    this.disposables.push(starGeometry, starMaterial);
  }

  addMap() {
    this.addDisc(this.layout.core, 0x27464d, 0.42);
    this.addLabel('HOME', { x: 0, z: 0.45 }, { size: 1.2, color: '#ffe4a7', y: 1.2 });
    for (const road of this.layout.roads) this.addRoad(road);
    this.layout.areas.forEach((area, index) => {
      this.addDisc(area.center, AREA_COLORS[index % AREA_COLORS.length], 0.34, area.radius);
      this.addLabel(area.name, area.center, { size: 0.86, color: '#fff4d6', y: 1.0 });
      this.addImageBillboard(area.image, { x: area.center.x, z: area.center.z + 0.15 }, { width: 1.75, height: 1.25, y: 1.55, opacity: 0.88 });
      for (const word of area.words) this.addWord(word);
    });
    for (const feature of this.layout.featureNodes) this.addFeature(feature);
  }

  addDisc(center, color, height, radius = this.layout.core.radius) {
    const geometry = new THREE.CylinderGeometry(radius, radius + 0.18, height, 64);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(center.x, -height / 2, center.z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    const ringGeometry = new THREE.TorusGeometry(radius - 0.18, 0.075, 8, 64);
    ringGeometry.rotateX(Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf1c874, transparent: true, opacity: 0.48 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(center.x, 0.025, center.z);
    this.scene.add(ring);
    this.disposables.push(geometry, material, ringGeometry, ringMaterial);
  }

  addRoad(road) {
    const dx = road.to.x - road.from.x;
    const dz = road.to.z - road.from.z;
    const length = Math.hypot(dx, dz) + 1.8;
    const geometry = new THREE.BoxGeometry(length, 0.26, road.width);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b6e4a, roughness: 0.95 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((road.from.x + road.to.x) / 2, -0.13, (road.from.z + road.to.z) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    const stripeGeometry = new THREE.PlaneGeometry(length - 1, 0.08);
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xf3d99f, transparent: true, opacity: 0.26 });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.x = -Math.PI / 2;
    stripe.rotation.z = Math.atan2(dz, dx);
    stripe.position.set(mesh.position.x, 0.012, mesh.position.z);
    this.scene.add(stripe);
    this.disposables.push(geometry, material, stripeGeometry, stripeMaterial);
  }

  addWord(word) {
    const state = getWordState(this.wordStates, word.id);
    const ringGeometry = new THREE.RingGeometry(0.48, 0.65, 32);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: STATE_COLORS[state], side: THREE.DoubleSide, transparent: true, opacity: 0.94 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(word.position.x, 0.055, word.position.z);
    this.scene.add(ring);
    const poleGeometry = new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xc7a874, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(word.position.x, 0.45, word.position.z);
    this.scene.add(pole);
    const image = this.addImageBillboard(word.image, word.position, { width: 1.08, height: 0.8, y: 1.12 });
    const label = this.addLabel(word.word, { x: word.position.x, z: word.position.z }, { size: 0.3, color: '#f7f2e8', y: 1.68 });
    label.visible = this.mode === 'study';
    this.wordVisuals.set(word.id, { word, ring, ringMaterial, image, label });
    this.disposables.push(ringGeometry, ringMaterial, poleGeometry, poleMaterial);
  }

  addFeature(feature) {
    const icon = feature.kind === 'home' ? '⌂' : feature.kind === 'sleep' ? '☾' : '♨';
    const color = feature.kind === 'home' ? '#ffe4a7' : feature.kind === 'sleep' ? '#b8a2de' : '#edaa78';
    const label = this.addLabel(`${icon} ${feature.label}`, feature, { size: 0.56, color, y: 0.62 });
    label.userData.feature = feature;
  }

  addImageBillboard(url, position, options = {}) {
    const geometry = new THREE.PlaneGeometry(options.width || 1.8, options.height || 1.3);
    const material = new THREE.MeshBasicMaterial({ color: 0xf7f2e8, transparent: true, opacity: options.opacity ?? 1, side: THREE.DoubleSide });
    const frameGeometry = new THREE.PlaneGeometry((options.width || 1.8) + 0.18, (options.height || 1.3) + 0.18);
    const frameMaterial = new THREE.MeshBasicMaterial({ color: 0xe0c78f, side: THREE.DoubleSide });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    const mesh = new THREE.Mesh(geometry, material);
    const y = options.y || 1.65;
    frame.position.set(position.x, y, position.z);
    mesh.position.set(position.x, y, position.z - 0.015);
    frame.lookAt(this.camera.position.x, y, this.camera.position.z);
    mesh.lookAt(this.camera.position.x, y, this.camera.position.z);
    this.scene.add(frame, mesh);
    this.textureLoader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      material.map = texture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
      this.disposables.push(texture);
    }, undefined, () => {
      material.color.set(0xd9d4c8);
    });
    this.disposables.push(geometry, material, frameGeometry, frameMaterial);
    return mesh;
  }

  addLabel(text, position, { size = 0.65, color = '#fff', y = 1 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,22,29,.76)';
    ctx.beginPath(); ctx.roundRect(8, 8, 496, 96, 24); ctx.fill();
    ctx.strokeStyle = 'rgba(241,200,116,.45)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 34px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text.length > 28 ? `${text.slice(0, 27)}…` : text, 256, 57);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(position.x, y, position.z);
    sprite.scale.set(size * 4.2, size * 0.92, 1);
    this.scene.add(sprite);
    this.disposables.push(texture, material);
    return sprite;
  }

  setMode(mode) {
    this.mode = mode;
    for (const visual of this.wordVisuals.values()) visual.label.visible = mode === 'study';
  }

  updateWordState(id, state) {
    const visual = this.wordVisuals.get(id);
    if (!visual) return;
    visual.ringMaterial.color.setHex(STATE_COLORS[state]);
    visual.ring.scale.setScalar(1.18);
  }

  setActiveWord(id) {
    for (const [wordId, visual] of this.wordVisuals) {
      const active = wordId === id;
      visual.image.material.opacity = active ? 1 : 0.9;
      const target = active ? 1.14 : 1;
      visual.image.scale.lerp(new THREE.Vector3(target, target, target), 0.3);
      if (!active && visual.ring.scale.x > 1) visual.ring.scale.lerp(new THREE.Vector3(1, 1, 1), 0.22);
    }
  }

  setPlayer(position) {
    this.character.position.set(position.x, 0.18, position.z);
  }

  render(position, dt) {
    for (const visual of this.wordVisuals.values()) {
      const distance = Math.hypot(position.x - visual.word.position.x, position.z - visual.word.position.z);
      visual.label.visible = this.mode === 'study' && distance <= 3.1;
    }
    const target = new THREE.Vector3(position.x, 0, position.z);
    const desired = target.clone().add(this.cameraOffset);
    this.camera.position.lerp(desired, Math.min(1, dt * 4.2));
    const look = new THREE.Vector3().copy(this.camera.position).sub(this.cameraOffset);
    this.camera.lookAt(look);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const aspect = rect.width / Math.max(rect.height, 1);
    const vertical = 13.5;
    this.camera.left = -vertical * aspect;
    this.camera.right = vertical * aspect;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
  }

  screenToWorld(movement) {
    const root = Math.SQRT1_2;
    return {
      x: movement.x * root + movement.y * root,
      z: movement.x * -root + movement.y * root,
    };
  }

  dispose() {
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose?.();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose?.();
      }
    });
    for (const disposable of this.disposables) disposable.dispose?.();
    this.renderer.dispose();
    this.container.replaceChildren();
  }
}

export function wordStateDescriptor(wordStates, id) {
  const state = getWordState(wordStates, id);
  return { state, ...STATE_META[state] };
}
