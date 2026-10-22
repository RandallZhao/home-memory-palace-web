import { scoreScene, scoreWorld } from '../logic/Score.js';
import { fatigue, formatWorldTime, hunger } from '../logic/NeedsSystem.js';

export class HUD {
  constructor(root, world, onHelp) {
    this.root = root;
    this.world = world;
    this.onHelp = onHelp;
    this.root.innerHTML = `
      <header class="topbar">
        <div class="brand"><span class="brand-mark">HA</span><div><strong>HOME ATLAS</strong><small>灯语之屋</small></div></div>
        <div class="breadcrumb" id="breadcrumb">HOME</div>
        <div class="hud-time" id="hud-time"></div>
        <div class="needs" aria-label="状态">
          <div class="need"><span>☾</span><span class="need-label">精力</span><strong id="fatigue-value">100%</strong><i><b id="fatigue-bar"></b></i></div>
          <div class="need"><span>♨</span><span class="need-label">饥饿</span><strong id="hunger-value">100%</strong><i><b id="hunger-bar"></b></i></div>
        </div>
        <button class="icon-button" id="help-button" type="button" aria-label="打开帮助">?</button>
      </header>
      <footer class="bottombar">
        <div class="key-hints" id="key-hints"></div>
        <div class="progress-cluster">
          <div class="progress-heading"><span id="progress-title">整座 HOME</span><strong id="progress-total">0%</strong></div>
          <div class="stacked-progress" id="world-progress" aria-label="积分完成度"><i class="gold"></i><i class="green"></i><i class="orange"></i></div>
        </div>
        <button class="scene-progress-toggle" id="scene-progress-toggle" type="button">房间进度</button>
      </footer>
      <section class="scene-progress-panel" id="scene-progress-panel" hidden></section>
    `;
    root.querySelector('#help-button').addEventListener('click', onHelp);
    root.querySelector('#scene-progress-toggle').addEventListener('click', () => {
      const panel = root.querySelector('#scene-progress-panel');
      panel.hidden = !panel.hidden;
    });
  }

  render(save, currentScene = null, mode = null) {
    const f = fatigue(save.worldMinute, save.lastSleepMinute, save.needsSleep);
    const h = hunger(save.worldMinute, save.lastMealMinute);
    this.root.querySelector('#hud-time').textContent = formatWorldTime(save.worldMinute);
    this.root.querySelector('#fatigue-value').textContent = `${Math.round(f)}%`;
    this.root.querySelector('#hunger-value').textContent = `${Math.round(h)}%`;
    this.root.querySelector('#fatigue-bar').style.width = `${f}%`;
    this.root.querySelector('#hunger-bar').style.width = `${h}%`;
    this.root.querySelector('#fatigue-value').closest('.need').classList.toggle('is-low', f <= 0);
    this.root.querySelector('#hunger-value').closest('.need').classList.toggle('is-low', h <= 0);
    const breadcrumb = currentScene ? `HOME  ›  ${currentScene.name}` : 'HOME · 总览';
    this.root.querySelector('#breadcrumb').innerHTML = `${breadcrumb}${mode ? `<span class="mode-pill mode-${mode}">${mode === 'study' ? '学习模式' : '练习模式'}</span>` : ''}`;
    const stats = currentScene ? scoreScene(currentScene, save.wordStates) : scoreWorld(this.world.scenes, save.wordStates);
    this.root.querySelector('#progress-title').textContent = currentScene ? currentScene.name : '整座 HOME';
    this.root.querySelector('#progress-total').textContent = stats.max ? `${stats.percent}% · ${stats.score}/${stats.max}` : '暂无词汇';
    setSegments(this.root.querySelector('#world-progress'), stats);
    this.root.querySelector('#key-hints').innerHTML = currentScene
      ? '<kbd>WASD</kbd> 移动 <kbd>Space</kbd> 核心返回 <kbd>G</kbd> 恢复 <kbd>/</kbd> 帮助'
      : '<kbd>WASD</kbd> 移动 <kbd>Space</kbd> 入口选择 <kbd>R</kbd> 学习 <kbd>F</kbd> 练习 <kbd>/</kbd> 帮助';
    this.renderScenePanel(save.wordStates);
  }

  renderScenePanel(wordStates) {
    const panel = this.root.querySelector('#scene-progress-panel');
    panel.innerHTML = this.world.scenes.map((scene) => {
      const stats = scoreScene(scene, wordStates);
      const gold = pct(stats.gold, stats.max);
      const green = pct(stats.green, stats.max);
      const orange = pct(stats.orange, stats.max);
      return `<div class="scene-progress-row"><span>${scene.name}</span><div class="mini-progress"><i class="gold" style="width:${gold}%"></i><i class="green" style="width:${green}%"></i><i class="orange" style="width:${orange}%"></i></div><strong>${stats.percent}%</strong></div>`;
    }).join('');
  }
}

function pct(value, max) { return max ? (value / max) * 100 : 0; }

function setSegments(element, stats) {
  element.querySelector('.gold').style.width = `${pct(stats.gold, stats.max)}%`;
  element.querySelector('.green').style.width = `${pct(stats.green, stats.max)}%`;
  element.querySelector('.orange').style.width = `${pct(stats.orange, stats.max)}%`;
}
