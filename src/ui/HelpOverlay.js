export class HelpOverlay {
  constructor(root, onClose) {
    this.root = root;
    this.onClose = onClose;
  }

  open() {
    this.root.hidden = false;
    this.root.innerHTML = `<div class="modal-backdrop"><section class="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <button class="modal-close" data-close aria-label="关闭帮助">×</button>
      <span class="eyebrow">漫游手册</span><h2 id="help-title">如何点亮 HOME</h2>
      <div class="help-grid">
        <div><h3>移动与进入</h3><p><kbd>WASD</kbd> / 方向键移动；HOME 入口处按 <kbd>Space</kbd>，再按 <kbd>R</kbd> 学习或 <kbd>F</kbd> 练习。场景核心按 <kbd>Space</kbd> 返回。</p></div>
        <div><h3>学习与练习</h3><p>学习模式靠近即点亮；练习模式按 <kbd>F</kbd> 输入，<kbd>Enter</kbd> 提交。答错后可重试，或按 <kbd>R</kbd> 将整个场景切到学习。</p></div>
        <div><h3>恢复</h3><p>精力耗尽时到 Master Bedroom 床边按 <kbd>G</kbd>；饥饿时到 Kitchen / Diningroom 的餐点按 <kbd>G</kbd>。</p></div>
        <div><h3>积分规则</h3><p>当前分值反映最新一次有效练习结果，重复练习可能升降；完成度是当前积分完成度。</p></div>
      </div>
      <div class="state-legend">
        <span class="state-unseen">○ 未点亮 · 0</span><span class="state-lit">✦ 已点亮 · 2</span><span class="state-wrong">× 错误 · 2</span><span class="state-correct">✓ 直接正确 · 5</span><span class="state-retry">↻ 重试正确 · 3</span>
      </div>
      <p class="help-footer"><kbd>/</kbd>、<kbd>Esc</kbd> 或右上角关闭</p>
    </section></div>`;
    this.root.querySelector('[data-close]').addEventListener('click', () => this.close());
  }

  close() {
    this.root.hidden = true;
    this.root.replaceChildren();
    this.onClose?.();
  }

  get isOpen() { return !this.root.hidden; }
}
