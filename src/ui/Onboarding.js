import { SKINS, drawCharacter2D } from '../render/Character.js';

export class Onboarding {
  constructor(root, onComplete) {
    this.root = root;
    this.onComplete = onComplete;
    this.step = 0;
    this.skin = 'amber';
  }

  open() {
    this.root.hidden = false;
    this.renderStory();
  }

  renderStory() {
    const panels = [
      { eyebrow: 'WELCOME HOME', title: '欢迎来到 HOME ATLAS', body: '这座家里，藏着等待被点亮的词汇。沿着知识的道路走进各个房间，发现图像，唤醒记忆。', icon: '✦' },
      { eyebrow: 'MOVE', title: '让脚步带你靠近记忆', body: '用 WASD 移动。在 HOME 的房间入口按 Space，再选择 R 学习或 F 练习。靠近图片，卡片会自然出现。', icon: '⌁' },
      { eyebrow: 'REMEMBER', title: '记忆会随着答案改变', body: '学习点亮词汇；练习记录最新结果。精力与饥饿耗尽时，去床边或餐点按 G 恢复。随时按 / 查看帮助。', icon: '◌' },
    ];
    const panel = panels[this.step];
    this.root.innerHTML = `<div class="onboarding-screen"><div class="story-card"><span class="story-icon">${panel.icon}</span><span class="eyebrow">${panel.eyebrow}</span><h1>${panel.title}</h1><p>${panel.body}</p><div class="story-dots">${panels.map((_, i) => `<i class="${i === this.step ? 'active' : ''}"></i>`).join('')}</div><div class="story-actions"><button type="button" data-next>${this.step === panels.length - 1 ? '创建探险者' : '继续'}</button><button type="button" class="text-button" data-skip>跳过引导</button></div></div></div>`;
    this.root.querySelector('[data-next]').addEventListener('click', () => {
      if (this.step < panels.length - 1) { this.step += 1; this.renderStory(); }
      else this.renderCreator();
    });
    this.root.querySelector('[data-skip]').addEventListener('click', () => this.renderCreator());
  }

  renderCreator() {
    this.root.innerHTML = `<div class="onboarding-screen"><section class="creator-card"><span class="eyebrow">EXPLORER PROFILE</span><h1>谁来点亮这座家？</h1><label class="name-field">昵称<input id="player-name" maxlength="16" value="探索者" /></label><div class="skin-grid">${Object.entries(SKINS).map(([id, skin]) => `<button type="button" data-skin="${id}" class="${id === this.skin ? 'selected' : ''}"><canvas width="112" height="128"></canvas><strong>${skin.name}</strong></button>`).join('')}</div><button type="button" class="primary-wide" data-start>开启旅程</button></section></div>`;
    this.root.querySelectorAll('[data-skin]').forEach((button) => {
      const ctx = button.querySelector('canvas').getContext('2d');
      drawCharacter2D(ctx, 56, 78, 2.2, button.dataset.skin);
      button.addEventListener('click', () => {
        this.skin = button.dataset.skin;
        this.root.querySelectorAll('[data-skin]').forEach((item) => item.classList.toggle('selected', item === button));
      });
    });
    this.root.querySelector('[data-start]').addEventListener('click', () => {
      const name = this.root.querySelector('#player-name').value.trim().slice(0, 16) || '探索者';
      this.root.hidden = true;
      this.root.replaceChildren();
      this.onComplete({ name, skin: this.skin });
    });
  }
}
