import { drawCharacter2D } from './Character.js';

export class HomeCanvas {
  constructor(canvas, world, player, skin) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.player = player;
    this.skin = skin;
    this.image = new Image();
    this.image.src = '/assets/home/home-map.png';
    this.image.addEventListener('load', () => this.draw());
    this.bounds = { x: 0, y: 0, width: 1, height: 1 };
    this.activeScene = null;
    this.walking = false;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const imageRatio = 1207 / 824;
    const viewRatio = rect.width / Math.max(rect.height, 1);
    let width;
    let height;
    if (viewRatio > imageRatio) {
      height = rect.height;
      width = height * imageRatio;
    } else {
      width = rect.width;
      height = width / imageRatio;
    }
    this.bounds = { x: (rect.width - width) / 2, y: (rect.height - height) / 2, width, height };
    this.draw();
  }

  update(dt, movement, paused) {
    this.walking = !paused && Boolean(movement.x || movement.y);
    if (!paused) {
      const speed = 0.13;
      this.player.x = clamp(this.player.x + movement.x * speed * dt, 0.025, 0.975);
      this.player.z = clamp(this.player.z + movement.y * speed * dt, 0.035, 0.965);
    }
    this.activeScene = this.closestHotspot();
    this.draw();
    return this.activeScene;
  }

  closestHotspot() {
    let best = null;
    let bestDistance = Infinity;
    for (const scene of this.world.scenes) {
      const hotspot = scene.homeHotspot;
      if (!hotspot) continue;
      const dx = this.player.x - hotspot.x;
      const dy = this.player.z - hotspot.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= hotspot.radius && distance < bestDistance) {
        best = scene;
        bestDistance = distance;
      }
    }
    return best;
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, rect.width, rect.height);
    const gradient = ctx.createRadialGradient(rect.width / 2, rect.height / 2, 20, rect.width / 2, rect.height / 2, rect.width * 0.7);
    gradient.addColorStop(0, '#f4f0e7');
    gradient.addColorStop(1, '#dce7df');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (this.image.complete && this.image.naturalWidth) {
      ctx.save();
      ctx.shadowColor = 'rgba(32,48,54,.20)';
      ctx.shadowBlur = 28;
      ctx.drawImage(this.image, this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
      ctx.restore();
    }
    for (const scene of this.world.scenes) {
      const hotspot = scene.homeHotspot;
      const x = this.bounds.x + hotspot.x * this.bounds.width;
      const y = this.bounds.y + hotspot.y * this.bounds.height;
      const active = this.activeScene?.id === scene.id;
      ctx.save();
      ctx.shadowColor = active ? 'rgba(232,185,88,.72)' : 'transparent';
      ctx.shadowBlur = active ? 18 : 0;
      ctx.strokeStyle = active ? '#e8b958' : 'rgba(66,127,121,.32)';
      ctx.fillStyle = active ? 'rgba(232,185,88,.18)' : 'rgba(66,127,121,.045)';
      ctx.lineWidth = active ? 3 : 1.2;
      ctx.setLineDash(active ? [] : [4, 7]);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(17, hotspot.radius * this.bounds.width * 0.55), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    const x = this.bounds.x + this.player.x * this.bounds.width;
    const y = this.bounds.y + this.player.z * this.bounds.height;
    drawCharacter2D(ctx, x, y, Math.max(0.75, this.bounds.width / 1100), this.skin, this.walking);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
