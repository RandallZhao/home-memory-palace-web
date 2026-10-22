export class ModeSelect {
  constructor(root, onChoose, onClose) {
    this.root = root;
    this.onChoose = onChoose;
    this.onClose = onClose;
    this.scene = null;
  }

  open(scene) {
    this.scene = scene;
    this.root.hidden = false;
    this.root.innerHTML = `<div class="modal-backdrop"><section class="modal mode-modal" role="dialog" aria-modal="true" aria-labelledby="mode-title">
      <span class="eyebrow">进入记忆房间</span><h2 id="mode-title">${scene.name}</h2><p>选择一种探索方式</p>
      <div class="mode-options">
        <button type="button" data-mode="study"><kbd>R</kbd><strong>学习模式</strong><span>查看图文、音标与 TTS 发音</span></button>
        <button type="button" data-mode="practice"><kbd>F</kbd><strong>练习模式</strong><span>只看图片，回忆英文拼写</span></button>
      </div>
      <button type="button" class="text-button" data-close>Esc · 暂不进入</button>
    </section></div>`;
    this.root.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => this.choose(button.dataset.mode)));
    this.root.querySelector('[data-close]').addEventListener('click', () => this.close());
  }

  choose(mode) {
    if (!this.scene) return;
    const scene = this.scene;
    this.close(false);
    this.onChoose(scene, mode);
  }

  close(notify = true) {
    this.root.hidden = true;
    this.root.replaceChildren();
    this.scene = null;
    if (notify) this.onClose?.();
  }

  get isOpen() { return !this.root.hidden; }
}
