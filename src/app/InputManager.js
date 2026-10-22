const MOVEMENT = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);

export class InputManager {
  constructor(onAction) {
    this.keys = new Set();
    this.onAction = onAction;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => this.clear());
  }

  static isEditable(target = document.activeElement) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
  }

  onKeyDown(event) {
    if (InputManager.isEditable(event.target)) {
      if (event.code === 'Escape') {
        event.preventDefault();
        event.target.blur();
        this.onAction?.('escape-input', event);
      }
      return;
    }
    if (MOVEMENT.has(event.code) || ['Space', 'Slash', 'KeyR', 'KeyF', 'KeyQ', 'KeyE', 'KeyG', 'Escape'].includes(event.code)) {
      event.preventDefault();
    }
    if (MOVEMENT.has(event.code)) this.keys.add(event.code);
    if (!event.repeat) this.onAction?.(event.code, event);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  clear() {
    this.keys.clear();
  }

  movementVector() {
    const x = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    const y = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    if (!x && !y) return { x: 0, y: 0 };
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  }
}
