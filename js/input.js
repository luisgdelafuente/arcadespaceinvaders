// Keyboard input. Tracks held keys plus one-shot "pressed" edges that are
// consumed once per logic tick. Game keys are prevented from scrolling the
// page while the canvas is active.

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter',
  'KeyA', 'KeyD', 'KeyP', 'KeyM', 'KeyR', 'KeyF', 'KeyO', 'KeyI', 'KeyB',
  'Escape', 'Minus', 'Equal', 'Backspace',
]);

class Input {
  constructor(hooks) {
    this.hooks = hooks || {};
    this.held = new Set();
    this.edge = new Set();
    this.lastKeyChar = null; // for high-score initials entry
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (GAME_KEYS.has(e.code) || /^Key[A-Z]$/.test(e.code) || /^Digit\d$/.test(e.code)) {
        e.preventDefault();
      }
      if (this.hooks.onAny) this.hooks.onAny();
      if (!e.repeat) {
        this.held.add(e.code);
        this.edge.add(e.code);
        if (/^Key[A-Z]$/.test(e.code)) this.lastKeyChar = e.code.slice(3);
        else if (/^Digit\d$/.test(e.code)) this.lastKeyChar = e.code.slice(5);
        if (this.hooks.onKeyDown) this.hooks.onKeyDown(e.code, e);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.held.delete(e.code);
    });
  }

  down(code) { return this.held.has(code); }
  pressed(code) { return this.edge.has(code); }

  // Consume one typed A-Z/0-9 character (high-score entry).
  takeChar() {
    const c = this.lastKeyChar;
    this.lastKeyChar = null;
    return c;
  }

  endTick() {
    this.edge.clear();
    this.lastKeyChar = null;
  }
}
