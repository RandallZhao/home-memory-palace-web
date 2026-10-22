import { STATE_META, getWordState } from '../logic/WordStateMachine.js';

export class VocabCard {
  constructor(root, { onSubmit, onSpeak }) {
    this.root = root;
    this.onSubmit = onSubmit;
    this.onSpeak = onSpeak;
    this.word = null;
    this.mode = null;
    this.feedback = null;
    this.renderEmpty();
  }

  renderEmpty(message = '靠近一件物品，开启记忆。') {
    this.word = null;
    this.mode = null;
    this.root.innerHTML = `<div class="card-empty"><span class="empty-orbit">✦</span><h2>记忆尚未靠岸</h2><p>${message}</p><small>沿着发光道路走近图片展示牌</small></div>`;
  }

  showStudy(word, wordStates, isPlaceholder = false) {
    this.word = word;
    this.mode = 'study';
    const state = getWordState(wordStates, word.id);
    const meta = STATE_META[state];
    this.root.innerHTML = `
      <article class="vocab-card study-card ${meta.className}">
        <div class="card-kicker">STUDY · 自动点亮</div>
        <div class="word-image-wrap"><img src="${word.image}" alt="${escapeHtml(word.word)} 的素材图片" />${isPlaceholder ? '<span class="asset-warning">图片待补充</span>' : ''}</div>
        <div class="word-state"><span>${meta.symbol}</span>${meta.label}</div>
        <h2>${escapeHtml(word.word)}</h2>
        <div class="pronunciation-grid">
          <button type="button" data-accent="us"><span>🇺🇸 US · Q</span><strong>${word.ipaUS || '音标待补充'}</strong><small>TTS 合成发音</small></button>
          <button type="button" data-accent="uk"><span>🇬🇧 UK · E</span><strong>${word.ipaUK || '音标待补充'}</strong><small>TTS 合成发音</small></button>
        </div>
        <p class="meaning">${escapeHtml(word.meaning || '释义待补充')}</p>
        <div class="source-path">${escapeHtml(word.sourcePath)}</div>
      </article>`;
    this.root.querySelectorAll('[data-accent]').forEach((button) => button.addEventListener('click', () => this.onSpeak(word.word, button.dataset.accent)));
  }

  showPractice(word, wordStates, round, isPlaceholder = false) {
    this.word = word;
    this.mode = 'practice';
    const state = getWordState(wordStates, word.id);
    const meta = STATE_META[state];
    const feedback = this.feedback?.wordId === word.id ? this.feedback : null;
    this.root.innerHTML = `
      <article class="vocab-card practice-card ${meta.className}">
        <div class="card-kicker">PRACTICE · 看图拼写</div>
        <div class="word-image-wrap"><img src="${word.image}" alt="待回忆词汇的目标图片" />${isPlaceholder ? '<span class="asset-warning">图片待补充</span>' : ''}</div>
        <div class="practice-status" aria-live="polite">${feedback ? escapeHtml(feedback.message) : '只凭图片回忆英文拼写'}</div>
        <form id="practice-form" autocomplete="off">
          <label for="practice-input">英文答案</label>
          <input id="practice-input" name="answer" type="text" spellcheck="false" autocapitalize="none" placeholder="按 F 或点击开始输入" aria-label="英文答案" />
          <button type="submit">提交 · Enter</button>
        </form>
        <div class="practice-actions"><kbd>F</kbd> ${round?.mistakeInRound ? '再试一次' : '开始输入'} ${round?.mistakeInRound ? '<span><kbd>R</kbd> 整个场景切到学习模式</span>' : ''}</div>
        <div class="privacy-note">练习中隐藏单词、音标、释义与发音</div>
      </article>`;
    const form = this.root.querySelector('#practice-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.onSubmit(form.elements.answer.value);
    });
  }

  focusInput() {
    const input = this.root.querySelector('#practice-input');
    if (input) {
      input.focus();
      input.select();
      return true;
    }
    return false;
  }

  setFeedback(wordId, message, kind) {
    this.feedback = { wordId, message, kind };
    const status = this.root.querySelector('.practice-status');
    if (status) {
      status.textContent = message;
      status.dataset.kind = kind;
    }
  }

  clearFeedback() {
    this.feedback = null;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}
