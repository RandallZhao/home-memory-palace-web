export class MiniMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layout = null;
    this.player = null;
    this.focusArea = null;
  }

  setScene(layout, player) {
    this.layout = layout;
    this.player = player;
    this.draw();
  }

  update() {
    if (!this.layout || !this.player) return;
    const prior = this.focusArea;
    const candidate = this.layout.areas.find((area) => Math.hypot(this.player.x - area.center.x, this.player.z - area.center.z) <= area.radius * (prior?.id === area.id ? 1.12 : 0.9));
    this.focusArea = candidate || null;
    this.draw();
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, rect.width * ratio);
    this.canvas.height = Math.max(1, rect.height * ratio);
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!this.layout) return;
    ctx.fillStyle = 'rgba(7,20,27,.86)';
    ctx.fillRect(0, 0, rect.width, rect.height);
    const focus = this.focusArea;
    const extent = focus ? focus.radius * 1.3 : this.layout.extent;
    const center = focus ? focus.center : { x: 0, z: 0 };
    const scale = Math.min(rect.width, rect.height) / (extent * 2.18);
    const map = (point) => ({ x: rect.width / 2 + (point.x - center.x) * scale, y: rect.height / 2 + (point.z - center.z) * scale });
    if (!focus) {
      ctx.strokeStyle = 'rgba(241,200,116,.36)';
      ctx.lineWidth = Math.max(2, 2.7 * scale);
      for (const road of this.layout.roads) {
        const a = map(road.from); const b = map(road.to);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    const visibleAreas = focus ? [focus] : this.layout.areas;
    for (const area of visibleAreas) {
      const p = map(area.center);
      ctx.fillStyle = 'rgba(115,203,183,.18)';
      ctx.strokeStyle = 'rgba(115,203,183,.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, area.radius * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (focus) {
        for (const word of area.words) {
          const w = map(word.position);
          ctx.fillStyle = '#f1c874'; ctx.beginPath(); ctx.arc(w.x, w.y, 2.2, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.fillStyle = '#dce8e4'; ctx.font = '600 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(area.name.replace(/ Area| Zone| Station| Corner| Nook| Center| Hub| Cove| Port| Island| Wall/g, ''), p.x, p.y + 3);
      }
    }
    const player = map(this.player);
    ctx.shadowColor = '#ffe4a7'; ctx.shadowBlur = 8; ctx.fillStyle = '#fff4c7';
    ctx.beginPath(); ctx.arc(player.x, player.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9fb4b4'; ctx.font = '600 9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(focus ? `局部 · ${focus.name}` : '场景总览', 8, 13);
  }
}
