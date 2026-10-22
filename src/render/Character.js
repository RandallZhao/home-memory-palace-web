import * as THREE from 'three';

export const SKINS = {
  amber: { name: '琥珀行囊', shirt: '#fff9e9', pack: '#e8b958', scarf: '#427f79' },
  mint: { name: '薄荷远行', shirt: '#fff9e9', pack: '#9ac7bf', scarf: '#427f79' },
  violet: { name: '星暮漫游', shirt: '#ebe4f7', pack: '#9a82c8', scarf: '#6f9dcc' },
};

export function drawCharacter2D(ctx, x, y, scale = 1, skinId = 'amber', walking = false) {
  const skin = SKINS[skinId] || SKINS.amber;
  ctx.save();
  ctx.translate(x, y + (walking ? Math.sin(performance.now() / 90) * 1.4 : 0));
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(38,56,75,.20)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.pack;
  roundRect(ctx, -12, -5, 24, 22, 7);
  ctx.fill();
  ctx.fillStyle = skin.shirt;
  roundRect(ctx, -10, -9, 20, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#427f79';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -7); ctx.lineTo(-4, 8);
  ctx.moveTo(7, -7); ctx.lineTo(4, 8);
  ctx.stroke();
  ctx.strokeStyle = '#31444a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, 11); ctx.lineTo(-7, 17);
  ctx.moveTo(5, 11); ctx.lineTo(7, 17);
  ctx.stroke();
  ctx.fillStyle = '#f1bd92';
  ctx.beginPath();
  ctx.arc(0, -19, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#25343c';
  ctx.beginPath();
  ctx.arc(0, -22, 13, Math.PI, Math.PI * 2);
  ctx.lineTo(12, -18);
  ctx.quadraticCurveTo(5, -28, -9, -25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = skin.scarf;
  roundRect(ctx, -9, -10, 18, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#233238';
  ctx.beginPath(); ctx.arc(-4, -18, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -18, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function createCharacterSprite(skinId = 'amber') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  drawCharacter2D(ctx, 64, 96, 2.8, skinId);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.5, 3.1, 1);
  sprite.center.set(0.5, 0.08);
  sprite.renderOrder = 30;
  sprite.userData.texture = texture;
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
