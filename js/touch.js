// On-screen controls for touch devices. Buttons feed the same key codes the
// keyboard uses (held + edge sets on Input), so the game logic is identical.
// Tapping the playfield acts as Enter (start / confirm / resume).

class TouchControls {
  constructor(input, audio, canvas) {
    this.enabled = ('ontouchstart' in window) ||
      (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    window.IS_TOUCH = this.enabled;
    if (!this.enabled) return;

    document.body.classList.add('touch');

    const bind = (id, code) => {
      const el = document.getElementById(id);
      const press = (e) => {
        e.preventDefault();
        audio.unlock();
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
        input.held.add(code);
        input.edge.add(code);
        el.classList.add('active');
      };
      const release = (e) => {
        e.preventDefault();
        input.held.delete(code);
        el.classList.remove('active');
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    bind('btnLeft', 'ArrowLeft');
    bind('btnRight', 'ArrowRight');
    bind('btnFire', 'Space');
    bind('btnPause', 'KeyP');
    bind('btnMute', 'KeyM');

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.unlock();
      input.edge.add('Enter');
    });
    document.getElementById('touch')
      .addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
