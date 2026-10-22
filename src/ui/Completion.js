export class Completion {
  constructor(root, onContinue, onReset) {
    this.root = root;
    this.onContinue = onContinue;
    this.onReset = onReset;
  }

  open(score, sceneCount) {
    this.root.hidden = false;
    this.root.innerHTML = `<div class="modal-backdrop celebration"><div class="confetti" aria-hidden="true"></div><section class="modal completion-modal" role="dialog" aria-modal="true">
      <span class="completion-star">✦</span><span class="eyebrow">WORLD COMPLETE</span><h2>整座家已被点亮</h2>
      <p>你让 ${sceneCount} 个房间里的每一段词汇记忆都亮起了灯。</p><strong class="completion-score">${score.score} / ${score.max}</strong>
      <div class="completion-actions"><button type="button" data-continue>继续探索该世界</button><button type="button" class="danger-button" data-reset>新开世界</button></div>
    </section></div>`;
    this.root.querySelector('[data-continue]').addEventListener('click', this.onContinue);
    this.root.querySelector('[data-reset]').addEventListener('click', this.onReset);
  }

  close() { this.root.hidden = true; this.root.replaceChildren(); }
}
